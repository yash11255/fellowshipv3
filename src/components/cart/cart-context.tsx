"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

// Client-side cart (localStorage). Replaced by a server cart + checkout in Phase 4.

export type CartLine = {
  handle: string;
  title: string;
  image?: string;
  months: number;
  price: number;
  compareAt: number;
  qty: number;
};

type CartState = {
  lines: CartLine[];
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (line: Omit<CartLine, "qty">, qty?: number) => void;
  update: (handle: string, months: number, qty: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  savings: number;
  settings: StoreSettings;
};

const Ctx = createContext<CartState | null>(null);
const KEY = "rc-cart-v1";
import { DEFAULT_SETTINGS, type StoreSettings } from "@/lib/pricing";

export function CartProvider({ children, settings = DEFAULT_SETTINGS }: { children: ReactNode; settings?: StoreSettings }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from storage once on mount
      if (raw) setLines(JSON.parse(raw));
    } catch {}
  }, []);

  const persist = useCallback((next: CartLine[]) => {
    setLines(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  }, []);

  const add = useCallback<CartState["add"]>((line, qty = 1) => {
    setLines((prev) => {
      const i = prev.findIndex((l) => l.handle === line.handle && l.months === line.months);
      const next = i >= 0 ? prev.map((l, k) => (k === i ? { ...l, qty: l.qty + qty } : l)) : [...prev, { ...line, qty }];
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    setOpen(true);
  }, []);

  const update = useCallback<CartState["update"]>((handle, months, qty) => {
    persist(lines.flatMap((l) => (l.handle === handle && l.months === months ? (qty > 0 ? [{ ...l, qty }] : []) : [l])));
  }, [lines, persist]);

  const clear = useCallback(() => persist([]), [persist]);

  const value = useMemo<CartState>(() => {
    const count = lines.reduce((s, l) => s + l.qty, 0);
    const subtotal = lines.reduce((s, l) => s + l.qty * l.price, 0);
    const savings = lines.reduce((s, l) => s + l.qty * Math.max(0, l.compareAt - l.price), 0);
    return { lines, open, setOpen, add, update, clear, count, subtotal, savings, settings };
  }, [lines, open, add, update, clear, settings]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used inside CartProvider");
  return c;
}
