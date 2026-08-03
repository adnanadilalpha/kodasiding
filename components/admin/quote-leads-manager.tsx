"use client";

import {
  IconChevronDown,
  IconSearch,
  IconX,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useOptimistic,
  useRef,
  useState,
  useTransition,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  countQuoteLeadsOlderThan,
  deleteQuoteLeads,
  deleteQuoteLeadsOlderThan,
  getQuoteLeadAttachmentUrls,
} from "@/lib/quote/leads-actions";
import {
  LEAD_PAGE_SIZES,
  leadCustomFields,
  leadEmailStatus,
  leadHasFile,
  quoteLeadFiltersToSearchParams,
  type LeadFileFilter,
  type LeadNotifyFilter,
  type LeadPageSize,
  type QuoteLeadFilters,
  type QuoteLeadRow,
} from "@/lib/quote/leads-admin";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";

type MenuId = "date" | "state" | "file" | "notify" | "rows";

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatShortDate(ymd: string) {
  if (!ymd) return "";
  try {
    return new Date(`${ymd}T12:00:00`).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return ymd;
  }
}

function NotifyBadge({ lead }: { lead: QuoteLeadRow }) {
  const { status, error } = leadEmailStatus(lead);
  if (status === "sent") {
    return (
      <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">
        Emailed
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span
        className="rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700"
        title={error ?? "Email failed"}
      >
        Failed
      </span>
    );
  }
  if (status === "skipped") {
    return (
      <span className="rounded-md bg-bg-secondary px-2 py-0.5 text-xs text-text-primary/55">
        Off
      </span>
    );
  }
  return (
    <span className="rounded-md bg-bg-secondary px-2 py-0.5 text-xs text-text-primary/45">
      —
    </span>
  );
}

function olderThanIso(days: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

const NOTIFY_OPTIONS: { value: LeadNotifyFilter; label: string }[] = [
  { value: "", label: "Any" },
  { value: "sent", label: "Emailed" },
  { value: "failed", label: "Failed" },
  { value: "skipped", label: "Off" },
  { value: "pending", label: "Pending" },
];

const FILE_OPTIONS: { value: LeadFileFilter; label: string }[] = [
  { value: "", label: "Any" },
  { value: "yes", label: "Has file" },
  { value: "no", label: "No file" },
];

function FilterControl({
  id,
  openMenu,
  setOpenMenu,
  label,
  active,
  summary,
  children,
  menuAlign = "left",
}: {
  id: MenuId;
  openMenu: MenuId | null;
  setOpenMenu: (id: MenuId | null) => void;
  label: string;
  active: boolean;
  summary: string;
  children: ReactNode;
  menuAlign?: "left" | "right";
}) {
  const open = openMenu === id;
  const triggerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<CSSProperties | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpenMenu(null);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenMenu(null);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, setOpenMenu]);

  useEffect(() => {
    if (!open) {
      setMenuStyle(null);
      return;
    }

    function place() {
      const btn = buttonRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const gap = 6;
      const minWidth = Math.max(rect.width, 176);
      const viewportPad = 8;
      const spaceBelow = window.innerHeight - rect.bottom - gap - viewportPad;
      const spaceAbove = rect.top - gap - viewportPad;
      const openUp = spaceBelow < 200 && spaceAbove > spaceBelow;

      const style: CSSProperties = {
        position: "fixed",
        zIndex: 80,
        minWidth,
        maxWidth: Math.min(320, window.innerWidth - viewportPad * 2),
        maxHeight: Math.max(160, openUp ? spaceAbove : spaceBelow),
        overflowY: "auto",
      };

      if (openUp) {
        style.bottom = window.innerHeight - rect.top + gap;
      } else {
        style.top = rect.bottom + gap;
      }

      if (menuAlign === "right") {
        style.right = Math.max(viewportPad, window.innerWidth - rect.right);
      } else {
        const left = Math.min(
          rect.left,
          window.innerWidth - minWidth - viewportPad,
        );
        style.left = Math.max(viewportPad, left);
      }

      setMenuStyle(style);
    }

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, menuAlign]);

  const menu =
    open && menuStyle && mounted ? (
      <div
        ref={menuRef}
        style={menuStyle}
        className="rounded-[9px] border border-brand-primary/10 bg-bg-primary p-2 shadow-lg"
      >
        {children}
      </div>
    ) : null;

  return (
    <div ref={triggerRef} className="relative min-w-0 flex-1">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        onClick={() => setOpenMenu(open ? null : id)}
        className={`flex h-9 w-full items-center justify-between gap-1 rounded-md border px-2.5 text-sm transition ${
          active
            ? "border-brand-primary bg-brand-primary text-text-inverse"
            : open
              ? "border-brand-primary/35 bg-bg-primary text-brand-primary"
              : "border-brand-primary/12 bg-bg-primary text-text-primary/75 hover:border-brand-primary/25"
        }`}
      >
        <span className="truncate">{active ? summary : label}</span>
        <IconChevronDown
          className={`size-3.5 shrink-0 opacity-55 transition ${open ? "rotate-180" : ""}`}
          stroke={1.75}
        />
      </button>
      {menu ? createPortal(menu, document.body) : null}
    </div>
  );
}

function MenuOption({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center rounded-md px-2.5 py-2 text-left text-sm transition ${
        selected
          ? "bg-brand-primary text-text-inverse"
          : "text-text-primary/80 hover:bg-bg-secondary"
      }`}
    >
      {children}
    </button>
  );
}

function LeadsFilterBar({
  filters,
  pending,
  onApply,
  onClear,
}: {
  filters: QuoteLeadFilters;
  pending: boolean;
  onApply: (next: Partial<QuoteLeadFilters>) => void;
  onClear: () => void;
}) {
  const searchId = useId();
  const [query, setQuery] = useState(filters.q);
  const [stateDraft, setStateDraft] = useState(filters.state);
  const [fromDraft, setFromDraft] = useState(filters.from);
  const [toDraft, setToDraft] = useState(filters.to);
  const [openMenu, setOpenMenu] = useState<MenuId | null>(null);

  useEffect(() => {
    setQuery(filters.q);
    setStateDraft(filters.state);
    setFromDraft(filters.from);
    setToDraft(filters.to);
  }, [filters.q, filters.state, filters.from, filters.to]);

  const hasActive = Boolean(
    filters.q ||
      filters.from ||
      filters.to ||
      filters.state ||
      filters.file ||
      filters.notify,
  );

  const dateActive = Boolean(filters.from || filters.to);
  const dateSummary =
    filters.from && filters.to
      ? `${formatShortDate(filters.from)} – ${formatShortDate(filters.to)}`
      : filters.from
        ? `From ${formatShortDate(filters.from)}`
        : filters.to
          ? `Until ${formatShortDate(filters.to)}`
          : "Date";

  const notifyLabel =
    NOTIFY_OPTIONS.find((o) => o.value === filters.notify)?.label ?? "Notify";
  const fileLabel =
    FILE_OPTIONS.find((o) => o.value === filters.file)?.label ?? "File";

  const menuPanelInput =
    "h-9 w-full rounded-md border border-brand-primary/12 bg-bg-primary px-2.5 text-sm text-text-primary outline-none focus:border-brand-primary/35";

  return (
    <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
      {/* Search always leads — left, fills remaining space */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <form
          className="relative min-w-0 flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            onApply({ q: query.trim(), page: 1 });
            setOpenMenu(null);
          }}
        >
          <label htmlFor={searchId} className="sr-only">
            Search leads
          </label>
          <IconSearch
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-primary/35"
            stroke={1.75}
          />
          <input
            id={searchId}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, phone, city…"
            autoComplete="off"
            disabled={pending}
            className="h-9 w-full rounded-md border border-brand-primary/12 bg-bg-primary py-0 pr-9 pl-9 text-sm text-text-primary outline-none transition placeholder:text-text-primary/35 focus:border-brand-primary/35"
          />
          {query ? (
            <button
              type="button"
              aria-label="Clear search"
              disabled={pending}
              onClick={() => {
                setQuery("");
                onApply({ q: "", page: 1 });
              }}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 text-text-primary/40 transition hover:text-text-primary"
            >
              <IconX className="size-3.5" stroke={1.75} />
            </button>
          ) : null}
        </form>

        {hasActive ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() => {
              setQuery("");
              setStateDraft("");
              setFromDraft("");
              setToDraft("");
              setOpenMenu(null);
              onClear();
            }}
          >
            Clear
          </Button>
        ) : null}
      </div>

      {/* Filters share the right half equally */}
      <div className="flex w-full min-w-0 gap-1.5 sm:w-1/2">
        <FilterControl
          id="date"
          openMenu={openMenu}
          setOpenMenu={setOpenMenu}
          label="Date"
          active={dateActive}
          summary={dateSummary}
        >
          <div className="flex flex-col gap-2 p-1">
            <label className="flex flex-col gap-1.5 text-sm text-text-secondary">
              From
              <input
                type="date"
                value={fromDraft}
                onChange={(e) => setFromDraft(e.target.value)}
                className={menuPanelInput}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm text-text-secondary">
              To
              <input
                type="date"
                value={toDraft}
                onChange={(e) => setToDraft(e.target.value)}
                className={menuPanelInput}
              />
            </label>
            <div className="flex gap-2 pt-0.5">
              <Button
                type="button"
                size="sm"
                className="flex-1"
                onClick={() => {
                  onApply({ from: fromDraft, to: toDraft, page: 1 });
                  setOpenMenu(null);
                }}
              >
                Apply
              </Button>
              {dateActive ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setFromDraft("");
                    setToDraft("");
                    onApply({ from: "", to: "", page: 1 });
                    setOpenMenu(null);
                  }}
                >
                  Clear
                </Button>
              ) : null}
            </div>
          </div>
        </FilterControl>

        <FilterControl
          id="state"
          openMenu={openMenu}
          setOpenMenu={setOpenMenu}
          label="State"
          active={Boolean(filters.state)}
          summary={filters.state}
        >
          <div className="flex flex-col gap-2 p-1">
            <input
              value={stateDraft}
              onChange={(e) => setStateDraft(e.target.value)}
              placeholder="e.g. WA"
              autoComplete="off"
              className={menuPanelInput}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onApply({ state: stateDraft.trim(), page: 1 });
                  setOpenMenu(null);
                }
              }}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                className="flex-1"
                onClick={() => {
                  onApply({ state: stateDraft.trim(), page: 1 });
                  setOpenMenu(null);
                }}
              >
                Apply
              </Button>
              {filters.state ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setStateDraft("");
                    onApply({ state: "", page: 1 });
                    setOpenMenu(null);
                  }}
                >
                  Clear
                </Button>
              ) : null}
            </div>
          </div>
        </FilterControl>

        <FilterControl
          id="file"
          openMenu={openMenu}
          setOpenMenu={setOpenMenu}
          label="File"
          active={Boolean(filters.file)}
          summary={fileLabel}
        >
          <div className="flex flex-col gap-0.5">
            {FILE_OPTIONS.map((opt) => (
              <MenuOption
                key={opt.value || "any"}
                selected={filters.file === opt.value}
                onClick={() => {
                  onApply({ file: opt.value, page: 1 });
                  setOpenMenu(null);
                }}
              >
                {opt.label}
              </MenuOption>
            ))}
          </div>
        </FilterControl>

        <FilterControl
          id="notify"
          openMenu={openMenu}
          setOpenMenu={setOpenMenu}
          label="Notify"
          active={Boolean(filters.notify)}
          summary={notifyLabel}
          menuAlign="right"
        >
          <div className="flex flex-col gap-0.5">
            {NOTIFY_OPTIONS.map((opt) => (
              <MenuOption
                key={opt.value || "any"}
                selected={filters.notify === opt.value}
                onClick={() => {
                  onApply({ notify: opt.value, page: 1 });
                  setOpenMenu(null);
                }}
              >
                {opt.label}
              </MenuOption>
            ))}
          </div>
        </FilterControl>

        <FilterControl
          id="rows"
          openMenu={openMenu}
          setOpenMenu={setOpenMenu}
          label={`${filters.pageSize}/page`}
          active={false}
          summary={`${filters.pageSize}/page`}
          menuAlign="right"
        >
          <div className="flex flex-col gap-0.5">
            {LEAD_PAGE_SIZES.map((n) => (
              <MenuOption
                key={n}
                selected={filters.pageSize === n}
                onClick={() => {
                  onApply({ pageSize: n as LeadPageSize, page: 1 });
                  setOpenMenu(null);
                }}
              >
                {n} / page
              </MenuOption>
            ))}
          </div>
        </FilterControl>
      </div>
    </div>
  );
}

export function QuoteLeadsManager({
  leads,
  total,
  filters,
}: {
  leads: QuoteLeadRow[];
  total: number;
  filters: QuoteLeadFilters;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detail, setDetail] = useState<QuoteLeadRow | null>(null);
  const [deleteIds, setDeleteIds] = useState<string[] | null>(null);
  const [purgeOpen, setPurgeOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [optimisticLeads, removeOptimistic] = useOptimistic(
    leads,
    (current, ids: string[]) => current.filter((l) => !ids.includes(l.id)),
  );

  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize));
  const safePage = Math.min(filters.page, totalPages);
  const pageStart = total === 0 ? 0 : (safePage - 1) * filters.pageSize + 1;
  const pageEnd = Math.min(safePage * filters.pageSize, total);
  const allOnPageSelected =
    optimisticLeads.length > 0 &&
    optimisticLeads.every((l) => selected.has(l.id));

  const deleteTargets = deleteIds
    ? leads.filter((l) => deleteIds.includes(l.id))
    : [];

  function pushFilters(next: QuoteLeadFilters) {
    const params = quoteLeadFiltersToSearchParams(next, { section: "leads" });
    startTransition(() => {
      router.push(`/admin/quotes?${params.toString()}`);
    });
  }

  useEffect(() => {
    if (filters.page > totalPages) {
      pushFilters({ ...filters, page: totalPages });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only clamp when page is out of range
  }, [filters.page, totalPages, total, filters.pageSize]);

  useEffect(() => {
    setSelected(new Set());
  }, [
    filters.page,
    filters.q,
    filters.from,
    filters.to,
    filters.state,
    filters.file,
    filters.notify,
    filters.pageSize,
  ]);

  function applyPartial(patch: Partial<QuoteLeadFilters>) {
    pushFilters({ ...filters, ...patch });
  }

  function clearFilters() {
    pushFilters({
      q: "",
      from: "",
      to: "",
      state: "",
      file: "",
      notify: "",
      page: 1,
      pageSize: filters.pageSize,
    });
  }

  function toggleAll() {
    if (allOnPageSelected) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(optimisticLeads.map((l) => l.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function requestDelete(ids: string[]) {
    if (ids.length === 0) return;
    setErrorMsg(null);
    setStatusMsg(null);
    setDetail(null);
    setDeleteIds(ids);
  }

  function confirmDelete() {
    if (!deleteIds?.length) return;
    const ids = deleteIds;
    setDeleteIds(null);
    setDetail(null);
    const remainingOnPage = leads.filter((l) => !ids.includes(l.id)).length;
    const nextTotal = Math.max(0, total - ids.length);
    const nextTotalPages = Math.max(1, Math.ceil(nextTotal / filters.pageSize));
    const nextPage =
      remainingOnPage === 0
        ? Math.min(filters.page, nextTotalPages)
        : filters.page;

    startTransition(() => {
      removeOptimistic(ids);
    });

    void (async () => {
      const result = await deleteQuoteLeads(ids);
      if (result.error) {
        setErrorMsg(result.error);
        router.refresh();
        return;
      }
      setSelected(new Set());
      setStatusMsg(
        `Deleted ${result.deleted} lead${result.deleted === 1 ? "" : "s"}.`,
      );
      if (nextPage !== filters.page) {
        pushFilters({ ...filters, page: nextPage });
      } else {
        router.refresh();
      }
    })();
  }

  const hasActiveFilters = Boolean(
    filters.q ||
      filters.from ||
      filters.to ||
      filters.state ||
      filters.file ||
      filters.notify,
  );

  return (
    <div className="flex flex-col gap-3">
      <LeadsFilterBar
        filters={filters}
        pending={pending}
        onApply={applyPartial}
        onClear={clearFilters}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm tabular-nums text-text-primary/45">
          {total === 0
            ? "0 leads"
            : `${pageStart}–${pageEnd} of ${total.toLocaleString()}`}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {selected.size > 0 ? (
            <Button
              type="button"
              size="sm"
              variant="danger"
              disabled={pending}
              onClick={() => requestDelete([...selected])}
            >
              Delete ({selected.size})
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setPurgeOpen(true)}
          >
            Delete old
          </Button>
        </div>
      </div>

      {errorMsg ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMsg}
        </p>
      ) : null}
      {statusMsg ? (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {statusMsg}
        </p>
      ) : null}

      {optimisticLeads.length === 0 ? (
        <div className="rounded-[9px] border border-brand-primary/8 bg-bg-primary/80 px-4 py-8 text-center text-sm text-text-primary/45">
          {hasActiveFilters
            ? "No matches. Try clearing filters."
            : "No leads yet."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[9px] border border-brand-primary/8 bg-bg-primary/80">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-bg-secondary text-[11px] tracking-wide text-brand-primary/55 uppercase">
              <tr>
                <th className="w-10 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={toggleAll}
                    aria-label="Select all on page"
                  />
                </th>
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">Contact</th>
                <th className="px-3 py-2">Location</th>
                <th className="px-3 py-2">File</th>
                <th className="px-3 py-2">Notify</th>
                <th className="px-3 py-2 text-right"> </th>
              </tr>
            </thead>
            <tbody>
              {optimisticLeads.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-t border-brand-primary/8 align-top"
                >
                  <td className="px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={selected.has(lead.id)}
                      onChange={() => toggleOne(lead.id)}
                      aria-label={`Select ${lead.full_name}`}
                    />
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-xs text-text-primary/50">
                    {formatWhen(lead.created_at)}
                  </td>
                  <td className="px-3 py-2.5">
                    <p className="font-medium text-brand-primary">
                      {lead.full_name}
                    </p>
                    <p className="truncate text-xs text-text-primary/55">
                      {lead.email}
                    </p>
                    {lead.phone ? (
                      <p className="text-xs text-text-primary/45">{lead.phone}</p>
                    ) : null}
                  </td>
                  <td className="px-3 py-2.5 text-text-primary/75">
                    {[lead.city, lead.state].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-text-primary/55">
                    {leadHasFile(lead) ? "Yes" : "—"}
                  </td>
                  <td className="px-3 py-2.5">
                    <NotifyBadge lead={lead} />
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setDetail(lead)}
                      className="text-sm text-brand-primary/70 transition hover:text-brand-primary"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => requestDelete([lead.id])}
                      className="ml-3 text-sm text-[#ff383c] transition hover:opacity-80"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={pending || filters.page <= 1}
            onClick={() => applyPartial({ page: filters.page - 1 })}
          >
            Previous
          </Button>
          <p className="text-sm tabular-nums text-text-primary/55">
            {safePage} / {totalPages}
          </p>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={pending || filters.page >= totalPages}
            onClick={() => applyPartial({ page: filters.page + 1 })}
          >
            Next
          </Button>
        </div>
      ) : null}

      <LeadDetailModal
        lead={detail}
        onClose={() => setDetail(null)}
        onDelete={(id) => requestDelete([id])}
        pending={pending}
      />

      <Modal
        open={Boolean(deleteIds?.length)}
        onClose={() => setDeleteIds(null)}
        title={deleteIds?.length === 1 ? "Delete lead?" : "Delete leads?"}
        description="This cannot be undone. Attachments are removed too."
      >
        <div className="flex flex-col gap-5">
          <p className="text-sm text-text-primary/70">
            {deleteIds?.length === 1 ? (
              <>
                Permanently delete{" "}
                <span className="font-medium text-brand-primary">
                  {deleteTargets[0]?.full_name ?? "this lead"}
                </span>
                {deleteTargets[0]?.email ? (
                  <> ({deleteTargets[0].email})</>
                ) : null}
                ?
              </>
            ) : (
              <>
                Permanently delete{" "}
                <span className="font-medium text-brand-primary">
                  {deleteIds?.length ?? 0} leads
                </span>
                ?
              </>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="danger"
              disabled={pending}
              onClick={confirmDelete}
            >
              {pending ? "Deleting…" : "Delete"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDeleteIds(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      <PurgeOldLeadsModal
        open={purgeOpen}
        onClose={() => setPurgeOpen(false)}
        onDone={(msg) => {
          setStatusMsg(msg);
          setPurgeOpen(false);
          router.refresh();
        }}
      />
    </div>
  );
}

function LeadDetailModal({
  lead,
  onClose,
  onDelete,
  pending,
}: {
  lead: QuoteLeadRow | null;
  onClose: () => void;
  onDelete: (id: string) => void;
  pending: boolean;
}) {
  const [file, setFile] = useState<{
    fileName: string;
    viewUrl: string | null;
    downloadUrl: string | null;
  } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);

  useEffect(() => {
    setFile(null);
    setFileError(null);
    if (!lead || !leadHasFile(lead)) return;

    let cancelled = false;
    setLoadingFile(true);
    getQuoteLeadAttachmentUrls(lead.attachment_path).then((result) => {
      if (cancelled) return;
      setLoadingFile(false);
      if ("error" in result && result.error) {
        setFileError(result.error);
        return;
      }
      if ("fileName" in result) {
        setFile({
          fileName: result.fileName ?? "file",
          viewUrl: result.viewUrl ?? null,
          downloadUrl: result.downloadUrl ?? null,
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [lead]);

  if (!lead) return null;

  const custom = leadCustomFields(lead);

  return (
    <Modal
      open={Boolean(lead)}
      onClose={onClose}
      title={lead.full_name}
      description={formatWhen(lead.created_at)}
      size="lg"
    >
      <div className="flex flex-col gap-4 text-sm">
        <dl className="grid gap-x-4 gap-y-2.5 sm:grid-cols-2">
          <div>
            <dt className="text-[11px] text-text-secondary">Email</dt>
            <dd>
              <a
                href={`mailto:${lead.email}`}
                className="text-brand-primary underline-offset-2 hover:underline"
              >
                {lead.email}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-[11px] text-text-secondary">Phone</dt>
            <dd>{lead.phone || "—"}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-text-secondary">City</dt>
            <dd>{lead.city || "—"}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-text-secondary">State</dt>
            <dd>{lead.state || "—"}</dd>
          </div>
          <div>
            <dt className="mb-1 text-[11px] text-text-secondary">Notify</dt>
            <dd>
              <NotifyBadge lead={lead} />
            </dd>
          </div>
        </dl>

        <div>
          <p className="text-[11px] text-text-secondary">Message</p>
          <p className="mt-1 whitespace-pre-wrap text-text-primary/80">
            {lead.message?.trim() || "—"}
          </p>
          {custom.length > 0 ? (
            <ul className="mt-2 space-y-0.5 text-xs text-text-primary/60">
              {custom.map((field) => (
                <li key={field.id}>
                  <span className="font-medium text-text-primary/75">
                    {field.label}:
                  </span>{" "}
                  {field.value}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div>
          <p className="text-[11px] text-text-secondary">Attachment</p>
          {loadingFile ? (
            <p className="mt-1 text-text-primary/45">Loading…</p>
          ) : fileError ? (
            <p className="mt-1 text-text-primary/45">{fileError}</p>
          ) : file ? (
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <span
                className="max-w-64 truncate text-text-primary/70"
                title={file.fileName}
              >
                {file.fileName}
              </span>
              {file.viewUrl ? (
                <a
                  href={file.viewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-brand-primary underline-offset-2 hover:underline"
                >
                  View
                </a>
              ) : null}
              {file.downloadUrl ? (
                <a
                  href={file.downloadUrl}
                  className="font-medium text-brand-primary underline-offset-2 hover:underline"
                >
                  Download
                </a>
              ) : null}
            </div>
          ) : (
            <p className="mt-1 text-text-primary/45">—</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={pending}
            onClick={() => onDelete(lead.id)}
          >
            Delete lead
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function PurgeOldLeadsModal({
  open,
  onClose,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone: (msg: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [days, setDays] = useState("90");
  const [count, setCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const countReqId = useRef(0);

  useEffect(() => {
    if (!open) {
      setConfirming(false);
      return;
    }
    setError(null);
    setCount(null);
    setConfirming(false);
    const reqId = ++countReqId.current;
    const iso = olderThanIso(Number(days) || 90);
    startTransition(async () => {
      const result = await countQuoteLeadsOlderThan(iso);
      if (reqId !== countReqId.current) return;
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      if ("count" in result) setCount(result.count ?? 0);
    });
  }, [open, days]);

  function runPurge() {
    const n = Number(days) || 90;
    if (!count || count <= 0) return;

    setError(null);
    startTransition(async () => {
      let deletedTotal = 0;
      let hasMore = true;
      while (hasMore) {
        const result = await deleteQuoteLeadsOlderThan(olderThanIso(n));
        if (result.error) {
          setError(result.error);
          return;
        }
        deletedTotal += result.deleted ?? 0;
        hasMore = Boolean(result.hasMore);
        if ((result.deleted ?? 0) === 0) break;
      }
      onDone(
        deletedTotal === 0
          ? "No old leads to delete."
          : `Purged ${deletedTotal.toLocaleString()} old lead${deletedTotal === 1 ? "" : "s"}.`,
      );
    });
  }

  const n = Number(days) || 90;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={confirming ? "Delete these leads?" : "Delete old leads"}
      description={
        confirming
          ? "This cannot be undone. Uploaded attachments are removed too."
          : "Remove leads older than a cutoff so the inbox stays manageable. Attachments are deleted with them."
      }
    >
      <div className="flex flex-col gap-5">
        {!confirming ? (
          <>
            <Field label="Older than">
              <Select
                value={days}
                onChange={(e) => setDays(e.target.value)}
                disabled={pending}
              >
                <option value="30">30 days</option>
                <option value="90">90 days</option>
                <option value="180">180 days</option>
                <option value="365">1 year</option>
                <option value="730">2 years</option>
              </Select>
            </Field>
            <p className="text-sm text-text-primary/60">
              {count === null
                ? "Counting…"
                : `${count.toLocaleString()} lead${count === 1 ? "" : "s"} match.`}
            </p>
            {error ? (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="danger"
                disabled={pending || !count}
                onClick={() => setConfirming(true)}
              >
                Continue
              </Button>
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-text-primary/70">
              Permanently delete{" "}
              <span className="font-medium text-brand-primary">
                {count?.toLocaleString() ?? 0} lead
                {(count ?? 0) === 1 ? "" : "s"}
              </span>{" "}
              older than {n} days?
            </p>
            {error ? (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="danger"
                disabled={pending}
                onClick={runPurge}
              >
                {pending ? "Deleting…" : "Delete permanently"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={pending}
                onClick={() => setConfirming(false)}
              >
                Back
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
