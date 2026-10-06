"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const KEY = "invictus.wishlist.v1";
interface Ctx { ids: string[]; has: (id: string) => boolean; toggle: (id: string) => void }
const WishCtx = createContext<Ctx | null>(null);

/** Guest wishlist lives in localStorage; when signed in it is mirrored to the DB via /api/wishlist. */
export function WishlistProvider({ children, signedIn }: { children: ReactNode; signedIn: boolean }) {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    let local: string[] = [];
    try { local = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { /* ignore */ }
    setIds(local);
    if (!signedIn) return;
    // merge guest list into account list, then adopt the server's list
    fetch("/api/wishlist", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ merge: local }) })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { ids: string[] } | null) => { if (d) { setIds(d.ids); localStorage.setItem(KEY, JSON.stringify(d.ids)); } })
      .catch(() => { /* offline: keep local */ });
  }, [signedIn]);

  const toggle = useCallback((id: string) => {
    setIds((cur) => {
      const adding = !cur.includes(id);
      const next = adding ? [...cur, id] : cur.filter((x) => x !== id);
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
      if (signedIn) {
        fetch("/api/wishlist", { method: adding ? "POST" : "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ productId: id }) }).catch(() => {});
      }
      return next;
    });
  }, [signedIn]);

  const value = useMemo(() => ({ ids, toggle, has: (id: string) => ids.includes(id) }), [ids, toggle]);
  return <WishCtx.Provider value={value}>{children}</WishCtx.Provider>;
}

export function useWishlist(): Ctx {
  const c = useContext(WishCtx);
  if (!c) throw new Error("useWishlist must be used inside <WishlistProvider>");
  return c;
}
