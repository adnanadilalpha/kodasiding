"use client";

import { useMemo, useState } from "react";
import {
  CORE_ALLOWED_COUNTRIES,
  OPTIONAL_COUNTRY_OPTIONS,
  type GeoAccessSettings,
} from "@/lib/cms/geo-access";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup } from "@/components/ui/field";

export function GeoAccessEditor({
  initial,
  action,
}: {
  initial: GeoAccessSettings;
  action: (formData: FormData) => Promise<void>;
}) {
  const [enabled, setEnabled] = useState(initial.enabled);
  const optionalSelected = useMemo(() => {
    const set = new Set(initial.allowed_countries);
    return OPTIONAL_COUNTRY_OPTIONS.filter((c) => set.has(c.code)).map(
      (c) => c.code,
    );
  }, [initial.allowed_countries]);
  const [extras, setExtras] = useState<string[]>(optionalSelected);

  function toggleExtra(code: string) {
    setExtras((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  }

  return (
    <form action={action} className="flex w-full flex-col gap-5">
      <input type="hidden" name="geo_enabled" value={enabled ? "1" : "0"} />
      <input
        type="hidden"
        name="geo_allowed_countries"
        value={JSON.stringify([...CORE_ALLOWED_COUNTRIES, ...extras])}
      />

      <FieldGroup title="Visitor access" className="min-w-0 w-full">
        <label className="flex cursor-pointer items-start gap-3 rounded-[14px] border border-black/8 bg-white px-4 py-3.5 shadow-[0_1px_3px_rgba(30,46,40,0.04)]">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="mt-1 size-4 accent-brand-primary"
          />
          <span>
            <span className="block text-sm font-medium text-text-primary">
              Restrict public site by country
            </span>
            <span className="mt-1 block text-sm text-text-secondary">
              When on, visitors outside the allowed list are redirected to an
              unavailable page. Admin and APIs are never blocked.{" "}
              <code className="text-brand-primary">localhost</code> always
              stays open for development.
            </span>
          </span>
        </label>

        <Field label="Always allowed">
          <div className="flex flex-wrap gap-2">
            {CORE_ALLOWED_COUNTRIES.map((code) => (
              <span
                key={code}
                className="rounded-full bg-brand-primary/10 px-3 py-1.5 text-xs font-medium text-brand-primary"
              >
                {code === "US" ? "United States" : "Canada"} ({code})
              </span>
            ))}
          </div>
          <p className="mt-2 text-sm text-text-primary/45">
            US and Canada stay allowed whenever restriction is enabled.
          </p>
        </Field>

        <Field label="Also allow">
          <div className="flex flex-col gap-2">
            {OPTIONAL_COUNTRY_OPTIONS.map((country) => {
              const checked = extras.includes(country.code);
              return (
                <label
                  key={country.code}
                  className={`flex cursor-pointer items-start gap-3 rounded-[14px] border px-4 py-3 text-sm transition ${
                    checked
                      ? "border-accent-warm bg-accent-warm/20 text-text-primary"
                      : "border-black/8 bg-white text-text-primary/70 hover:border-black/15"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleExtra(country.code)}
                    className="mt-0.5 size-3.5 accent-brand-primary"
                  />
                  <span className="min-w-0">
                    <span className="block font-medium">
                      {country.name}{" "}
                      <span className="font-normal text-text-primary/40">
                        ({country.code})
                      </span>
                    </span>
                    {country.hint ? (
                      <span className="mt-0.5 block text-xs text-text-primary/45">
                        {country.hint}
                      </span>
                    ) : null}
                  </span>
                </label>
              );
            })}
          </div>
        </Field>
      </FieldGroup>

      <div className="pt-1">
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
}
