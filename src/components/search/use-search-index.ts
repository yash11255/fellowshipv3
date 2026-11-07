"use client";
import { useEffect, useState } from "react";
import type { SearchItem } from "@/lib/search";

let cache: Promise<SearchItem[]> | null = null;
export function useSearchIndex(enabled = true) {
  const [items, setItems] = useState<SearchItem[] | null>(null);
  useEffect(() => {
    if (!enabled) return;
    cache ??= fetch("/api/search").then((r) => r.json());
    cache.then(setItems).catch(() => { cache = null; });
  }, [enabled]);
  return items;
}
