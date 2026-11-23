import type { WhyFact } from "@/lib/cms/types";

export const DEFAULT_WHY_FACTS: WhyFact[] = [
  {
    value: "Class 4",
    label: "Hail Impact",
    body: "Engineered to withstand large hail without the soft-surface damage of fiber cement or vinyl.",
  },
  {
    value: "AAMA 625",
    label: "Factory Finish",
    body: "Vacuum-coated and baked for color and gloss retention that holds up on the wall — not the jobsite.",
  },
  {
    value: "141.7",
    label: "PSF Wind Load",
    body: "Independently tested under ASTM D5206 so boards stay put in high-wind regions.",
  },
  {
    value: "True",
    label: "Wood Profiles",
    body: "Historically accurate shapes and shadow lines — the look of real wood without the maintenance.",
  },
];

export function normalizeWhyFacts(facts: WhyFact[] | null | undefined): WhyFact[] {
  if (!Array.isArray(facts) || facts.length === 0) return DEFAULT_WHY_FACTS;
  const cleaned = facts
    .map((fact) => ({
      value: String(fact?.value ?? "").trim(),
      label: String(fact?.label ?? "").trim(),
      body: String(fact?.body ?? "").trim(),
    }))
    .filter((fact) => fact.value || fact.label || fact.body);
  return cleaned.length > 0 ? cleaned : DEFAULT_WHY_FACTS;
}
