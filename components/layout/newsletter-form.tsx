"use client";
import { useState } from "react";

export function NewsletterForm({ dark = false }: { dark?: boolean }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    try {
      const r = await fetch("/api/newsletter", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }) });
      setState(r.ok ? "done" : "error");
    } catch { setState("error"); }
  }
  if (state === "done") return <p className="font-semibold">You’re on the list. Welcome to Invictus.</p>;
  return (
    <form onSubmit={submit} className="w-full max-w-md" noValidate>
      <div className={`flex overflow-hidden rounded-md border-2 ${dark ? "border-paper" : "border-ink"}`}>
        <label htmlFor="nl-email" className="sr-only">Email address</label>
        <input id="nl-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email"
          className="min-w-0 flex-1 bg-transparent px-4 py-3 text-[15px] outline-none placeholder:text-mist" />
        <button disabled={state === "loading"} className={`px-5 text-[12px] font-bold uppercase tracking-[0.14em] ${dark ? "bg-paper text-ink" : "bg-ink text-paper"} disabled:opacity-50`}>
          {state === "loading" ? "…" : "Subscribe"}
        </button>
      </div>
      {state === "error" && <p role="alert" className="mt-2 text-sm text-bad">That didn’t go through. Please check your email address and try again.</p>}
    </form>
  );
}
