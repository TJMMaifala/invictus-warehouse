export type CategorySlug = "sneakers" | "iphones" | "clothing" | "invictus-collection";
export type Condition = "new" | "pre_owned";

export type OrderStatus =
  | "PENDING"
  | "PAYMENT_CONFIRMED"
  | "PROCESSING"
  | "READY_FOR_COLLECTION"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "CANCELLED" | "REFUNDED";
export type DeliveryMethodId = "collection" | "manual" | "local";

export interface ProductImage {
  url: string;
  alt: string;
  /** 'reference' images must be labelled as illustrative — never as Invictus photography */
  source: "own" | "reference";
}

export interface Variant {
  id: string;
  size?: string;
  colour?: string;
  storage?: string;
  /** units available; 0 = sold out */
  stock: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: CategorySlug;
  brand: string;
  model: string;
  colour?: string;
  condition: Condition;
  /** cents (ZAR) */
  priceCents: number;
  salePriceCents?: number | null;
  featured: boolean;
  published: boolean;
  images: ProductImage[];
  variants: Variant[];
  attributes: {
    storage?: string;
    batteryHealth?: string;
    warranty?: string;
    grade?: string;
    fit?: string;
  };
  createdAt: string;
  updatedAt: string;
  rating?: { average: number; count: number };
}

export interface CartLine {
  productId: string;
  variantId: string;
  quantity: number;
}

export interface SiteSettings {
  businessName: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  instagram: string;
  tiktok: string;
  currency: "ZAR";
  shippingFeeCents: number;
  freeShippingThresholdCents: number;
  localDeliveryFeeCents: number;
  paymentProvider: "paystack" | "payfast";
  businessHours: string;
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Pending",
  PAYMENT_CONFIRMED: "Payment confirmed",
  PROCESSING: "Processing",
  READY_FOR_COLLECTION: "Ready for collection",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

/** What the browser keeps for each cart line. Prices here are DISPLAY ONLY —
 *  the server re-prices every line from the database at checkout. */
export interface ClientCartLine extends CartLine {
  name: string;
  slug: string;
  priceCents: number;
  variantLabel: string;
  imageUrl?: string;
  maxStock: number;
}
