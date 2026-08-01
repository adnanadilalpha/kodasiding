"use client";

import { useState } from "react";
import { IconCopy, IconEye, IconEyeOff } from "@tabler/icons-react";
import { TextInput } from "@/components/ui/field";

export function PasswordInput({
  name = "password",
  value,
  onChange,
  required = true,
  minLength = 8,
  placeholder = "Enter password",
  autoComplete = "new-password",
}: {
  name?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  minLength?: number;
  placeholder?: string;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <TextInput
          name={name}
          type={visible ? "text" : "password"}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pr-24"
        />
        <div className="absolute inset-y-0 right-2 flex items-center gap-1">
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="rounded-md p-1.5 text-brand-primary/55 transition hover:bg-bg-secondary hover:text-brand-primary"
            aria-label={visible ? "Hide password" : "Show password"}
            title={visible ? "Hide" : "Show"}
          >
            {visible ? (
              <IconEyeOff size={18} stroke={1.5} />
            ) : (
              <IconEye size={18} stroke={1.5} />
            )}
          </button>
          <button
            type="button"
            onClick={() => void copy()}
            disabled={!value}
            className="rounded-md p-1.5 text-brand-primary/55 transition hover:bg-bg-secondary hover:text-brand-primary disabled:opacity-30"
            aria-label="Copy password"
            title="Copy"
          >
            <IconCopy size={18} stroke={1.5} />
          </button>
        </div>
      </div>
      {copied ? (
        <p className="text-xs text-brand-primary/70">Copied</p>
      ) : null}
    </div>
  );
}
