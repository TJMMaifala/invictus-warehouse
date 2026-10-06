-- ============================================================================
-- INVICTUS WAREHOUSE — Supabase / PostgreSQL schema
-- Run in the Supabase SQL editor (or `supabase db push`), then run seed.sql.
-- "users" is Supabase's built-in auth.users; "profiles" extends it.
-- ============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- ---------- Enums -----------------------------------------------------------
create type product_condition as enum ('new', 'pre_owned');
create type order_status as enum (
  'PENDING','PAYMENT_CONFIRMED','PROCESSING','READY_FOR_COLLECTION',
  'OUT_FOR_DELIVERY','DELIVERED','CANCELLED'
);
create type payment_status as enum ('PENDING','PAID','FAILED','CANCELLED','REFUNDED');
create type delivery_method as enum ('collection','manual','local');
create type discount_type as enum ('percent','fixed');

-- ---------- Helpers ---------------------------------------------------------
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;

-- ---------- Profiles & admins ----------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated before update on profiles
  for each row execute function set_updated_at();

create table admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admin_users where user_id = auth.uid());
$$;

-- Auto-create profile on signup
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, first_name, last_name)
  values (new.id,
          new.raw_user_meta_data->>'first_name',
          new.raw_user_meta_data->>'last_name');
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- ---------- Catalogue -------------------------------------------------------
create table categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  image_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Admin-configurable option sets (sizes, colours, storage…)
create table option_sets (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete cascade,
  name text not null,                -- 'size' | 'colour' | 'storage'
  values text[] not null default '{}',
  unique (category_id, name)
);

create table products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  category_id uuid not null references categories(id),
  brand text,
  model text,
  colour text,
  condition product_condition not null default 'new',
  -- Stored in cents (ZAR). R950 = 95000.
  price_cents int not null check (price_cents >= 0),
  sale_price_cents int check (sale_price_cents is null or sale_price_cents < price_cents),
  featured boolean not null default false,
  published boolean not null default false,
  archived boolean not null default false,
  -- Category-specific attributes: { storage, battery_health, warranty, fit, grade }
  attributes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_category_idx on products(category_id);
create index products_published_idx on products(published, archived);
create index products_featured_idx on products(featured) where featured;
create index products_name_trgm on products using gin (name gin_trgm_ops);
create index products_brand_idx on products(brand);
create trigger products_updated before update on products
  for each row execute function set_updated_at();

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url text not null,
  alt text,
  -- 'own' = Invictus photography, 'reference' = placeholder/third-party; never imply otherwise
  source text not null default 'own' check (source in ('own','reference')),
  sort_order int not null default 0
);
create index product_images_product_idx on product_images(product_id, sort_order);

create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  sku text unique,
  size text,
  colour text,
  storage text,
  price_override_cents int,
  created_at timestamptz not null default now(),
  unique (product_id, size, colour, storage)
);
create index variants_product_idx on product_variants(product_id);

create table inventory (
  variant_id uuid primary key references product_variants(id) on delete cascade,
  quantity int not null default 0 check (quantity >= 0),
  low_stock_threshold int not null default 2,
  updated_at timestamptz not null default now()
);
create trigger inventory_updated before update on inventory
  for each row execute function set_updated_at();

-- ---------- Customers -------------------------------------------------------
create table addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text,
  address_line text not null,
  suburb text,
  city text not null,
  province text not null,
  postal_code text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index addresses_user_idx on addresses(user_id);

create table wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade
);
create table wishlist_items (
  wishlist_id uuid not null references wishlists(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (wishlist_id, product_id)
);

-- Persisted carts for signed-in customers (guests use localStorage)
create table carts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  items jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------- Coupons ---------------------------------------------------------
create table coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  type discount_type not null,
  value int not null check (value > 0),          -- percent, or cents if fixed
  min_subtotal_cents int not null default 0,
  max_uses int,
  used_count int not null default 0,
  expires_at timestamptz,
  active boolean not null default true
);

-- ---------- Orders ----------------------------------------------------------
create sequence order_number_seq start 10001;

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null
    default ('INV-' || nextval('order_number_seq')),
  user_id uuid references auth.users(id) on delete set null,   -- null = guest
  -- Guests look up orders with order_number + email (see /track)
  email text not null,
  first_name text not null,
  last_name text not null,
  phone text not null,
  status order_status not null default 'PENDING',
  payment_status payment_status not null default 'PENDING',
  delivery_method delivery_method not null,
  address_line text, suburb text, city text, province text, postal_code text,
  subtotal_cents int not null,
  delivery_cents int not null default 0,
  discount_cents int not null default 0,
  total_cents int not null,
  coupon_code text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_user_idx on orders(user_id);
create index orders_email_idx on orders(lower(email));
create index orders_status_idx on orders(status);
create trigger orders_updated before update on orders
  for each row execute function set_updated_at();

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  variant_id uuid references product_variants(id) on delete set null,
  name text not null,                 -- snapshot at purchase time
  variant_label text,
  unit_price_cents int not null,
  quantity int not null check (quantity > 0)
);
create index order_items_order_idx on order_items(order_id);

create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  provider text not null,             -- 'paystack' | 'payfast'
  reference text unique not null,
  amount_cents int not null,
  status payment_status not null default 'PENDING',
  raw jsonb,                          -- provider verification payload (no card data ever)
  created_at timestamptz not null default now(),
  verified_at timestamptz
);
create index payments_order_idx on payments(order_id);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  body text,
  verified_purchase boolean not null default false,
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  unique (product_id, user_id)
);
create index reviews_product_idx on reviews(product_id) where approved;

create table settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table newsletter_subscribers (
  email text primary key,
  created_at timestamptz not null default now()
);

create table contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null, email text not null, message text not null,
  created_at timestamptz not null default now()
);

-- ---------- Checkout: atomic stock reservation ------------------------------
-- Decrements stock only if enough exists. Called server-side after payment is
-- VERIFIED. Returns false (and changes nothing) if any line is short.
create or replace function decrement_stock(p_order_id uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare r record;
begin
  for r in select variant_id, quantity from order_items
           where order_id = p_order_id and variant_id is not null loop
    update inventory set quantity = quantity - r.quantity
     where variant_id = r.variant_id and quantity >= r.quantity;
    if not found then
      raise exception 'INSUFFICIENT_STOCK %', r.variant_id;
    end if;
  end loop;
  return true;
end; $$;
revoke all on function decrement_stock(uuid) from public, anon, authenticated;

-- ---------- Row Level Security ---------------------------------------------
alter table profiles enable row level security;
alter table admin_users enable row level security;
alter table categories enable row level security;
alter table option_sets enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table product_variants enable row level security;
alter table inventory enable row level security;
alter table addresses enable row level security;
alter table wishlists enable row level security;
alter table wishlist_items enable row level security;
alter table carts enable row level security;
alter table coupons enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table payments enable row level security;
alter table reviews enable row level security;
alter table settings enable row level security;
alter table newsletter_subscribers enable row level security;
alter table contact_messages enable row level security;

-- Public catalogue reads
create policy "public read categories" on categories for select using (true);
create policy "public read option_sets" on option_sets for select using (true);
create policy "public read published products" on products for select
  using ((published and not archived) or is_admin());
create policy "public read images" on product_images for select using (true);
create policy "public read variants" on product_variants for select using (true);
create policy "public read inventory" on inventory for select using (true);
create policy "public read settings" on settings for select using (true);
create policy "public read approved reviews" on reviews for select
  using (approved or user_id = auth.uid() or is_admin());

-- Admin full control of catalogue/settings/moderation
create policy "admin all categories" on categories for all using (is_admin()) with check (is_admin());
create policy "admin all option_sets" on option_sets for all using (is_admin()) with check (is_admin());
create policy "admin all products" on products for all using (is_admin()) with check (is_admin());
create policy "admin all images" on product_images for all using (is_admin()) with check (is_admin());
create policy "admin all variants" on product_variants for all using (is_admin()) with check (is_admin());
create policy "admin all inventory" on inventory for all using (is_admin()) with check (is_admin());
create policy "admin all settings" on settings for all using (is_admin()) with check (is_admin());
create policy "admin all coupons" on coupons for all using (is_admin()) with check (is_admin());
create policy "admin all reviews" on reviews for all using (is_admin()) with check (is_admin());
create policy "admin read admins" on admin_users for select using (is_admin() or user_id = auth.uid());
create policy "admin read newsletter" on newsletter_subscribers for select using (is_admin());
create policy "admin read messages" on contact_messages for select using (is_admin());

-- Customers: own data only
create policy "own profile read" on profiles for select using (id = auth.uid() or is_admin());
create policy "own profile update" on profiles for update using (id = auth.uid());
create policy "own addresses" on addresses for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own wishlist" on wishlists for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own wishlist items" on wishlist_items for all
  using (exists (select 1 from wishlists w where w.id = wishlist_id and w.user_id = auth.uid()))
  with check (exists (select 1 from wishlists w where w.id = wishlist_id and w.user_id = auth.uid()));
create policy "own cart" on carts for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own orders read" on orders for select using (user_id = auth.uid() or is_admin());
create policy "admin update orders" on orders for update using (is_admin()) with check (is_admin());
create policy "own order items read" on order_items for select
  using (exists (select 1 from orders o where o.id = order_id and (o.user_id = auth.uid() or is_admin())));
create policy "admin read payments" on payments for select using (is_admin());
create policy "customers write own review" on reviews for insert
  with check (user_id = auth.uid() and approved = false);

-- Anyone may subscribe / send a contact message (inserts only; validated server-side too)
create policy "anyone subscribe" on newsletter_subscribers for insert with check (true);
create policy "anyone contact" on contact_messages for insert with check (true);

-- NOTE: Order creation, payments, stock decrement and coupon redemption are
-- performed ONLY by server code using the service-role key (bypasses RLS).
-- Guests never read orders directly; /track verifies order_number + email on the server.

-- ---------- Storage ---------------------------------------------------------
-- Create a PUBLIC bucket named "product-images" in Supabase Storage.
-- Uploads happen from the admin UI; policy below restricts writes to admins.
insert into storage.buckets (id, name, public) values ('product-images','product-images', true)
  on conflict (id) do nothing;
create policy "public read product images" on storage.objects for select
  using (bucket_id = 'product-images');
create policy "admin write product images" on storage.objects for all
  using (bucket_id = 'product-images' and is_admin())
  with check (bucket_id = 'product-images' and is_admin());
