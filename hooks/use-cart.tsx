"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from "react";
import type { ClientCartLine } from "@/types";

const KEY = "invictus.cart.v1";

type Action =
  | { type: "hydrate"; lines: ClientCartLine[] }
  | { type: "add"; line: ClientCartLine }
  | { type: "remove"; variantId: string }
  | { type: "qty"; variantId: string; quantity: number }
  | { type: "swap"; oldVariantId: string; line: ClientCartLine }
  | { type: "clear" };

function reducer(state: ClientCartLine[], a: Action): ClientCartLine[] {
  switch (a.type) {
    case "hydrate": return a.lines;
    case "add": {
      const ex = state.find((l) => l.variantId === a.line.variantId);
      if (!ex) return [...state, { ...a.line, quantity: Math.min(a.line.quantity, a.line.maxStock) }];
      return state.map((l) => l.variantId === ex.variantId
        ? { ...l, quantity: Math.min(l.quantity + a.line.quantity, l.maxStock) } : l);
    }
    case "remove": return state.filter((l) => l.variantId !== a.variantId);
    case "qty": return state.map((l) => l.variantId === a.variantId
      ? { ...l, quantity: Math.max(1, Math.min(a.quantity, l.maxStock)) } : l);
    case "swap": return [...state.filter((l) => l.variantId !== a.oldVariantId && l.variantId !== a.line.variantId), a.line];
    case "clear": return [];
  }
}

interface CartCtx {
  lines: ClientCartLine[];
  count: number;
  subtotalCents: number;
  hydrated: boolean;
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (line: ClientCartLine, opts?: { openDrawer?: boolean }) => void;
  remove: (variantId: string) => void;
  setQuantity: (variantId: string, q: number) => void;
  swapVariant: (oldVariantId: string, line: ClientCartLine) => void;
  clear: () => void;
}

const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, dispatch] = useReducer(reducer, []);
  const [hydrated, setHydrated] = useState(false);
  const [open, setOpen] = useState(false);

  // Guest cart: localStorage. Signed-in sync is handled by <CartSync/>.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) dispatch({ type: "hydrate", lines: JSON.parse(raw) as ClientCartLine[] });
    } catch { /* storage unavailable or corrupt — start empty */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch { /* ignore */ }
  }, [lines, hydrated]);

  const add = useCallback((line: ClientCartLine, opts?: { openDrawer?: boolean }) => {
    dispatch({ type: "add", line });
    if (opts?.openDrawer !== false) setOpen(true);
  }, []);

  const value = useMemo<CartCtx>(() => ({
    lines, hydrated, open, setOpen, add,
    count: lines.reduce((n, l) => n + l.quantity, 0),
    subtotalCents: lines.reduce((n, l) => n + l.priceCents * l.quantity, 0),
    remove: (variantId) => dispatch({ type: "remove", variantId }),
    setQuantity: (variantId, quantity) => dispatch({ type: "qty", variantId, quantity }),
    swapVariant: (oldVariantId, line) => dispatch({ type: "swap", oldVariantId, line }),
    clear: () => dispatch({ type: "clear" }),
  }), [lines, hydrated, open, add]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart(): CartCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used inside <CartProvider>");
  return c;
}
