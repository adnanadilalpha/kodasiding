"use client";

import { type ButtonHTMLAttributes } from "react";

/** Hierarchy: primary (main CTA) → accent (2nd) → ghost/outline (3rd) → danger */
const variants = {
  primary:
    "bg-brand-primary-active text-text-inverse hover:bg-brand-primary",
  accent: "bg-accent-warm text-text-primary hover:opacity-90",
  ghost:
    "bg-transparent text-brand-primary border border-brand-primary/12 hover:bg-bg-primary",
  danger: "bg-transparent text-[#ff383c] hover:bg-red-50",
} as const;

const sizes = {
  md: "rounded-md px-6 py-2.5 text-sm",
  sm: "rounded-md px-4 py-2 text-sm",
} as const;

type Variant = keyof typeof variants;
type Size = keyof typeof sizes;

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: Props) {
  return (
    <button
      className={`inline-flex items-center justify-center leading-none transition disabled:cursor-not-allowed disabled:opacity-50 ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
