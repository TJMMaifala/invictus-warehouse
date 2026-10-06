"use client";
import { useState } from "react";

export function ContactForm() {
  const [f, setF] = useState({ name: "", email: "", message: "" });
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setState("loading");
    try {
      const r = await fetch("/api/contact", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(f) });
      setState(r.ok ? "done" : "error");
    } catch { setState("error"); }
  }
  if (state === "done") return <p className="rounded-lg bg-paper p-5 font-semibold">Thanks, your message has been sent. We’ll reply as soon as we can.</p>;
  return (
    <form onSubmit={submit} className="space-y-4">
      <div><label htmlFor="c-name" className="label">Name</label><input id="c-name" required className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
      <div><label htmlFor="c-email" className="label">Email</label><input id="c-email" type="email" required className="input" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
      <div><label htmlFor="c-msg" className="label">Message</label><textarea id="c-msg" required minLength={5} rows={5} className="input" value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} /></div>
      <button className="btn-primary" disabled={state === "loading"}>{state === "loading" ? "Sending…" : "Send message"}</button>
      {state === "error" && <p role="alert" className="text-sm text-bad">We couldn’t send that right now. Please try again, or message us on WhatsApp.</p>}
    </form>
  );
}
