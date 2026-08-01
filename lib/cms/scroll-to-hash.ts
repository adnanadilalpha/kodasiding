/** Smooth-scroll to an in-page hash target (works when already on `/`). */
export function scrollToHash(href: string) {
  if (!href.startsWith("/#") && !href.startsWith("#")) return false;
  const id = href.replace(/^\/?#/, "");
  if (!id || typeof document === "undefined") return false;
  const el = document.getElementById(id);
  if (!el) return false;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  window.history.replaceState(null, "", `/#${id}`);
  return true;
}
