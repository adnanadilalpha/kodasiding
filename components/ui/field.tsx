"use client";

import {
  forwardRef,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  type ReactNode,
} from "react";

export function Label({
  children,
  htmlFor,
}: {
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-0 block text-sm leading-none text-text-secondary"
    >
      {children}
    </label>
  );
}

export const TextInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function TextInput({ className = "", ...props }, ref) {
  return (
    <input
      ref={ref}
      className={`w-full rounded-md border border-brand-primary/12 bg-bg-primary px-3 py-2.5 text-base leading-snug text-text-primary outline-none transition placeholder:text-text-primary/35 focus:border-brand-primary/35 ${className}`}
      {...props}
    />
  );
});

export function TextArea({
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full rounded-md border border-brand-primary/12 bg-bg-primary px-3 py-2.5 text-base leading-snug text-text-primary outline-none transition placeholder:text-text-primary/35 focus:border-brand-primary/35 ${className}`}
      {...props}
    />
  );
}

export function Select({
  className = "",
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full rounded-md border border-brand-primary/12 bg-bg-primary px-3 py-2.5 text-base text-text-primary outline-none transition focus:border-brand-primary/35 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

/** Groups related fields into a labeled container — matches Figma FieldGroup. */
export function FieldGroup({
  title,
  children,
  className = "",
  columns = 1,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
  columns?: 1 | 2 | 3;
}) {
  const cols =
    columns === 3
      ? "sm:grid-cols-3"
      : columns === 2
        ? "sm:grid-cols-2"
        : "";

  const fill =
    /\b(flex-1|h-full|self-stretch)\b/.test(className);

  return (
    <div
      className={`flex flex-col gap-3 rounded-lg border border-brand-primary/8 bg-bg-primary/80 p-4 ${
        fill ? "h-full" : ""
      } ${className}`}
    >
      {title ? (
        <p className="shrink-0 text-sm leading-none font-medium text-text-secondary">
          {title}
        </p>
      ) : null}
      <div
        className={`gap-3.5 ${
          cols ? `grid ${cols}` : "flex flex-col"
        } ${fill ? "min-h-0 flex-1" : ""}`}
      >
        {children}
      </div>
    </div>
  );
}
