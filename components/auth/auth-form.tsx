"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { safeNext } from "@/lib/safe-next";

type Mode = "login" | "register" | "forgot" | "reset";
const COPY: Record<Mode, { title: string; cta: string }> = {
  login: { title: "Sign in", cta: "Sign in" }, register: { title: "Create account", cta: "Create account" },
  forgot: { title: "Reset password", cta: "Send reset link" }, reset: { title: "Choose a new password", cta: "Update password" },
};

function friendly(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) return "That email and password don’t match. Please try again.";
  if (m.includes("already registered")) return "An account with this email already exists. Try signing in.";
  if (m.includes("password")) return "Please choose a stronger password (at least 8 characters).";
  if (m.includes("rate")) return "Too many attempts. Please wait a moment and try again.";
  return "Something went wrong. Please try again.";
}

export function AuthForm({ mode, next, enabled, linkError }: { mode: Mode; next?: string; enabled: boolean; linkError?: boolean }) {
  const router = useRouter();
  const [f, setF] = useState({ email: "", password: "", firstName: "", lastName: "" });
  const [msg, setMsg] = useState<{ kind: "error" | "info"; text: string } | null>(linkError ? { kind: "error", text: "That link has expired or was already used. Please request a new one." } : null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if ((mode === "register" || mode === "reset") && f.password.length < 8) return setMsg({ kind: "error", text: "Password must be at least 8 characters." });
    setBusy(true);
    const supabase = createClient();
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email: f.email, password: f.password });
        if (error) return setMsg({ kind: "error", text: friendly(error.message) });
        router.push(safeNext(next)); router.refresh();
      } else if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({ email: f.email, password: f.password,
          options: { data: { first_name: f.firstName, last_name: f.lastName }, emailRedirectTo: `${location.origin}/auth/callback?next=/account` } });
        if (error) return setMsg({ kind: "error", text: friendly(error.message) });
        if (data.session) { router.push(safeNext(next)); router.refresh(); }
        else setMsg({ kind: "info", text: "Check your email to confirm your account, then sign in." });
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(f.email, { redirectTo: `${location.origin}/auth/callback?next=/account/reset` });
        if (error) return setMsg({ kind: "error", text: friendly(error.message) });
        setMsg({ kind: "info", text: "If that email has an account, a reset link is on its way." });
      } else {
        const { error } = await supabase.auth.updateUser({ password: f.password });
        if (error) return setMsg({ kind: "error", text: friendly(error.message) });
        router.push("/account"); router.refresh();
      }
    } catch { setMsg({ kind: "error", text: "Network error. Please check your connection and try again." }); }
    finally { setBusy(false); }
  }

  const q = next ? `?next=${encodeURIComponent(next)}` : "";
  return (
    <div className="container-x grid min-h-[70vh] place-items-center py-16">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4" noValidate>
        <h1 className="display-lg !text-4xl">{COPY[mode].title}</h1>
        {!enabled && <p role="status" className="rounded-lg bg-paper p-4 text-sm">Accounts are unavailable in demo mode. Configure Supabase to enable sign-in.</p>}
        {mode === "register" && (
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label" htmlFor="fn">First name</label><input id="fn" required autoComplete="given-name" className="input" value={f.firstName} onChange={(e) => setF({ ...f, firstName: e.target.value })} /></div>
            <div><label className="label" htmlFor="ln">Last name</label><input id="ln" required autoComplete="family-name" className="input" value={f.lastName} onChange={(e) => setF({ ...f, lastName: e.target.value })} /></div>
          </div>
        )}
        {mode !== "reset" && <div><label className="label" htmlFor="email">Email</label><input id="email" type="email" required autoComplete="email" className="input" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>}
        {mode !== "forgot" && <div><label className="label" htmlFor="pw">{mode === "reset" ? "New password" : "Password"}</label><input id="pw" type="password" required minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} className="input" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>}
        {msg && <p role={msg.kind === "error" ? "alert" : "status"} className={`text-sm ${msg.kind === "error" ? "text-bad" : "text-ok"}`}>{msg.text}</p>}
        <button className="btn-primary w-full" disabled={busy || !enabled}>{busy ? "Please wait…" : COPY[mode].cta}</button>
        <div className="space-y-1 text-center text-sm text-mist">
          {mode === "login" && <><p><Link className="underline" href="/forgot-password">Forgot password?</Link></p><p>New here? <Link className="underline" href={`/register${q}`}>Create an account</Link></p></>}
          {mode === "register" && <p>Already registered? <Link className="underline" href={`/login${q}`}>Sign in</Link></p>}
          {mode === "forgot" && <p><Link className="underline" href="/login">Back to sign in</Link></p>}
        </div>
      </form>
    </div>
  );
}
