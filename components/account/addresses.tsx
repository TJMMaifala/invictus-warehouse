"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Addr { id: string; label: string | null; address_line: string; suburb: string | null; city: string; province: string; postal_code: string; is_default: boolean }
const PROVINCES = ["Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo", "Mpumalanga", "Northern Cape", "North West", "Western Cape"];

export function Addresses({ userId, initial }: { userId: string; initial: Addr[] }) {
  const router = useRouter();
  const [f, setF] = useState({ label: "", line: "", suburb: "", city: "", province: "", postal: "" });
  const [err, setErr] = useState("");
  async function add(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    if (!f.line || !f.city || !f.province || !/^\d{4}$/.test(f.postal)) return setErr("Please complete the address with a 4-digit postal code.");
    const { error } = await createClient().from("addresses").insert({ user_id: userId, label: f.label || null, address_line: f.line, suburb: f.suburb || null, city: f.city, province: f.province, postal_code: f.postal, is_default: initial.length === 0 });
    if (error) return setErr("We couldn’t save that address. Please try again.");
    setF({ label: "", line: "", suburb: "", city: "", province: "", postal: "" }); router.refresh();
  }
  async function remove(id: string) { await createClient().from("addresses").delete().eq("id", id); router.refresh(); }
  async function makeDefault(id: string) {
    const db = createClient();
    await db.from("addresses").update({ is_default: false }).eq("user_id", userId);
    await db.from("addresses").update({ is_default: true }).eq("id", id); router.refresh();
  }
  return (
    <div className="space-y-8">
      {initial.length === 0 ? <p className="text-mist">No saved addresses yet.</p> : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {initial.map((a) => (
            <li key={a.id} className="rounded-xl bg-paper p-4 text-sm">
              <p className="font-semibold">{a.label || "Address"} {a.is_default && <span className="chip ml-2">Default</span>}</p>
              <p className="mt-1 text-mist">{[a.address_line, a.suburb, a.city, a.province, a.postal_code].filter(Boolean).join(", ")}</p>
              <div className="mt-3 flex gap-4">{!a.is_default && <button className="underline" onClick={() => makeDefault(a.id)}>Make default</button>}<button className="underline" onClick={() => remove(a.id)}>Remove</button></div>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={add} className="max-w-lg space-y-3" noValidate>
        <h3 className="font-display text-lg font-extrabold uppercase">Add an address</h3>
        <input aria-label="Label" className="input" placeholder="Label (Home, Work…)" value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} />
        <input aria-label="Street address" className="input" placeholder="Street address" value={f.line} onChange={(e) => setF({ ...f, line: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <input aria-label="Suburb" className="input" placeholder="Suburb" value={f.suburb} onChange={(e) => setF({ ...f, suburb: e.target.value })} />
          <input aria-label="City" className="input" placeholder="City" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} />
          <select aria-label="Province" className="input" value={f.province} onChange={(e) => setF({ ...f, province: e.target.value })}><option value="">Province</option>{PROVINCES.map((p) => <option key={p}>{p}</option>)}</select>
          <input aria-label="Postal code" inputMode="numeric" maxLength={4} className="input" placeholder="Postal code" value={f.postal} onChange={(e) => setF({ ...f, postal: e.target.value.replace(/\D/g, "") })} />
        </div>
        {err && <p role="alert" className="text-sm text-bad">{err}</p>}
        <button className="btn-primary">Save address</button>
      </form>
    </div>
  );
}
