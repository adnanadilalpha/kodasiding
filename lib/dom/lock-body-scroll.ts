/** Nested-safe body scroll lock with scrollbar-width compensation. */
let lockDepth = 0;
let prevOverflow = "";
let prevPaddingRight = "";
let prevCompensation = "";

export function lockBodyScroll() {
  if (typeof document === "undefined") {
    return () => {};
  }

  if (lockDepth === 0) {
    const scrollbarWidth = Math.max(
      0,
      window.innerWidth - document.documentElement.clientWidth,
    );
    prevOverflow = document.body.style.overflow;
    prevPaddingRight = document.body.style.paddingRight;
    prevCompensation = document.documentElement.style.getPropertyValue(
      "--scroll-lock-compensation",
    );

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      const pad = `${scrollbarWidth}px`;
      document.body.style.paddingRight = pad;
      document.documentElement.style.setProperty(
        "--scroll-lock-compensation",
        pad,
      );
    }
  }

  lockDepth += 1;
  let released = false;

  return () => {
    if (released) return;
    released = true;
    lockDepth = Math.max(0, lockDepth - 1);
    if (lockDepth > 0) return;

    document.body.style.overflow = prevOverflow;
    document.body.style.paddingRight = prevPaddingRight;
    if (prevCompensation) {
      document.documentElement.style.setProperty(
        "--scroll-lock-compensation",
        prevCompensation,
      );
    } else {
      document.documentElement.style.removeProperty(
        "--scroll-lock-compensation",
      );
    }
  };
}
