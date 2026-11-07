"use client";

import { Button } from "@/components/ui/button";
import { useCart, type CartLine } from "./cart-context";
import type { ComponentProps } from "react";

export function AddToCart({ line, label = "Add to cart", ...btn }: {
  line: Omit<CartLine, "qty">; label?: string;
} & Omit<ComponentProps<typeof Button>, "children" | "onClick">) {
  const { add } = useCart();
  return <Button {...btn} onClick={() => add(line)}>{label}</Button>;
}
