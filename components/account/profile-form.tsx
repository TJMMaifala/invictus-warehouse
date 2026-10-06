"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ProfileForm({ userId, email, initial }: { userId: string; email: string; initial: { firstName: string; lastName: string; phone: string } }) {
  const [f, setF] = useState(initial);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  async function save(e: React.FormEvent) {
    e.preventDefault(); setState("saving");
    const { error } = await createClient().from("profiles").update({ first_name: f.firstName.trim(), last_name: f.lastName.trim(), phone: f.phone.trim() }).eq("id", userId);
    setState(error ? "error" : "saved");
  }
  return (
    <form onSubmit={save} className="max-w-md space-y-4">
      <div><label className="label">Email</label><input className="input" value={email} disabled /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label" htmlFor="pf">First name</label><input id="pf" className="input" value={f.firstName} onChange={(e) => setF({ ...f, firstName: e.target.value })} /></div>
        <div><label className="label" htmlFor="pl">Last name</label><input id="pl" className="input" value={f.lastName} onChange={(e) => setF({ ...f, lastName: e.target.value })} /></div>
      </div>
      <div><label className="label" htmlFor="pp">Phone</label><input id="pp" type="tel" className="input" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
      <button className="btn-primary" disabled={state === "saving"}>{state === "saving" ? "Saving…" : "Save changes"}</button>
      {state === "saved" && <p role="status" className="text-sm text-ok">Saved.</p>}
      {state === "error" && <p role="alert" className="text-sm text-bad">We couldn’t save your changes. Please try again.</p>}
    </form>
  );
}
