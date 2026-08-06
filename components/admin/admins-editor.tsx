"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type KeyboardEvent } from "react";
import {
  createAdminAccount,
  deleteAdminAccount,
  updateAdminPassword,
  updateAdminRole,
} from "@/lib/cms/actions";
import { SectionHeaderAction } from "@/components/admin/section-header-action";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, TextInput } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { PasswordInput } from "@/components/ui/password-input";
import { SelectMenu } from "@/components/ui/select-menu";

export type AdminRow = {
  user_id: string;
  email: string;
  role: string;
};

type AdminRole = "owner" | "editor";

const ROLE_OPTIONS = [
  { value: "editor", label: "Editor" },
  { value: "owner", label: "Owner" },
] as const;

/** Prevent Enter in inputs from submitting / triggering create by mistake. */
function blockEnterSubmit(e: KeyboardEvent) {
  if (e.key === "Enter") e.preventDefault();
}

function RoleBadge({ role }: { role: string }) {
  const owner = role === "owner";
  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${
        owner
          ? "bg-brand-primary/10 text-brand-primary"
          : "bg-bg-secondary text-text-primary/65"
      }`}
    >
      {owner ? "Owner" : "Editor"}
    </span>
  );
}

function AdminRoleControl({
  row,
  isSelf,
  pending,
  onRoleChange,
}: {
  row: AdminRow;
  isSelf: boolean;
  pending: boolean;
  onRoleChange: (row: AdminRow, role: AdminRole) => void;
}) {
  if (isSelf) return <RoleBadge role={row.role} />;
  return (
    <SelectMenu
      value={row.role}
      options={ROLE_OPTIONS}
      disabled={pending}
      size="sm"
      aria-label={`Role for ${row.email}`}
      onChange={(value) => onRoleChange(row, value as AdminRole)}
    />
  );
}

function AdminRowActions({
  row,
  isSelf,
  pending,
  onPassword,
  onRemove,
}: {
  row: AdminRow;
  isSelf: boolean;
  pending: boolean;
  onPassword: (row: AdminRow) => void;
  onRemove: (row: AdminRow) => void;
}) {
  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={pending}
        onClick={() => onPassword(row)}
      >
        Password
      </Button>
      {!isSelf ? (
        <Button
          type="button"
          size="sm"
          variant="danger"
          disabled={pending}
          onClick={() => onRemove(row)}
        >
          Remove
        </Button>
      ) : null}
    </>
  );
}

export function AdminsEditor({
  admins,
  currentUserId,
}: {
  admins: AdminRow[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [passwordUser, setPasswordUser] = useState<AdminRow | null>(null);
  const [removeUser, setRemoveUser] = useState<AdminRow | null>(null);
  const [addEmail, setAddEmail] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addRole, setAddRole] = useState<AdminRole>("editor");
  const [editPassword, setEditPassword] = useState("");

  function refresh() {
    router.refresh();
  }

  function resetAdd() {
    setAddEmail("");
    setAddPassword("");
    setAddRole("editor");
  }

  function onAddClick() {
    setError(null);
    const fd = new FormData();
    fd.set("email", addEmail);
    fd.set("password", addPassword);
    fd.set("role", addRole);
    startTransition(async () => {
      try {
        await createAdminAccount(fd);
        setAddOpen(false);
        resetAdd();
        refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add admin");
      }
    });
  }

  function onChangePasswordClick() {
    if (!passwordUser) return;
    setError(null);
    const fd = new FormData();
    fd.set("user_id", passwordUser.user_id);
    fd.set("password", editPassword);
    startTransition(async () => {
      try {
        await updateAdminPassword(fd);
        setPasswordUser(null);
        setEditPassword("");
        refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update password",
        );
      }
    });
  }

  function onRoleChange(row: AdminRow, role: AdminRole) {
    if (row.role === role) return;
    setError(null);
    const fd = new FormData();
    fd.set("user_id", row.user_id);
    fd.set("email", row.email);
    fd.set("role", role);
    startTransition(async () => {
      try {
        await updateAdminRole(fd);
        refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update role");
      }
    });
  }

  function onConfirmRemove() {
    if (!removeUser) return;
    setError(null);
    const fd = new FormData();
    fd.set("user_id", removeUser.user_id);
    fd.set("email", removeUser.email);
    startTransition(async () => {
      try {
        await deleteAdminAccount(fd);
        setRemoveUser(null);
        refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to remove admin");
      }
    });
  }

  return (
    <>
      <SectionHeaderAction>
        <Button
          size="sm"
          type="button"
          onClick={() => {
            setError(null);
            resetAdd();
            setAddOpen(true);
          }}
        >
          Add admin
        </Button>
      </SectionHeaderAction>

      <div className="flex w-full flex-col gap-5">
        {error ? (
          <p
            role="alert"
            className="rounded-md border border-[#ff383c]/25 bg-[#ff383c]/5 px-4 py-3 text-sm text-[#ff383c]"
          >
            {error}
          </p>
        ) : null}

        <FieldGroup title="Accounts" className="min-w-0 w-full">
          {admins.length === 0 ? (
            <div className="rounded-md border border-dashed border-brand-primary/15 bg-bg-primary/60 px-4 py-10 text-center">
              <p className="text-sm font-medium text-text-primary">
                No admins yet
              </p>
              <p className="mt-1 text-sm text-text-primary/45">
                Add someone so they can sign in to the CMS.
              </p>
              <Button
                size="sm"
                type="button"
                className="mt-4"
                onClick={() => {
                  setError(null);
                  resetAdd();
                  setAddOpen(true);
                }}
              >
                Add admin
              </Button>
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <ul className="flex w-full flex-col gap-2.5 md:hidden">
                {admins.map((row) => {
                  const isSelf = row.user_id === currentUserId;
                  return (
                    <li
                      key={row.user_id}
                      className="flex min-w-0 flex-col gap-3 rounded-[9px] border border-brand-primary/8 bg-bg-primary/80 px-3.5 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-brand-primary">
                          {row.email}
                        </p>
                        {isSelf ? (
                          <span className="mt-0.5 block text-xs text-text-primary/40">
                            Signed in as you
                          </span>
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <p className="mb-1.5 text-xs text-text-primary/45">
                          Role
                        </p>
                        <AdminRoleControl
                          row={row}
                          isSelf={isSelf}
                          pending={pending}
                          onRoleChange={onRoleChange}
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <AdminRowActions
                          row={row}
                          isSelf={isSelf}
                          pending={pending}
                          onPassword={(r) => {
                            setError(null);
                            setEditPassword("");
                            setPasswordUser(r);
                          }}
                          onRemove={(r) => {
                            setError(null);
                            setRemoveUser(r);
                          }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>

              {/* Desktop table */}
              <div className="hidden overflow-x-auto rounded-xl border border-brand-primary/8 bg-bg-primary/80 md:block">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-bg-secondary text-[11px] tracking-wide text-brand-primary/55 uppercase">
                    <tr>
                      <th className="px-3 py-2 font-medium">Email</th>
                      <th className="px-3 py-2 font-medium">Role</th>
                      <th className="px-3 py-2 text-right font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((row) => {
                      const isSelf = row.user_id === currentUserId;
                      return (
                        <tr
                          key={row.user_id}
                          className="border-t border-brand-primary/8 align-middle"
                        >
                          <td className="px-3 py-2.5">
                            <div className="flex min-w-0 flex-col gap-0.5">
                              <p className="truncate text-text-primary">
                                {row.email}
                              </p>
                              {isSelf ? (
                                <span className="text-xs text-text-primary/40">
                                  Signed in as you
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className={isSelf ? undefined : "max-w-36"}>
                              <AdminRoleControl
                                row={row}
                                isSelf={isSelf}
                                pending={pending}
                                onRoleChange={onRoleChange}
                              />
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex flex-wrap items-center justify-end gap-1.5">
                              <AdminRowActions
                                row={row}
                                isSelf={isSelf}
                                pending={pending}
                                onPassword={(r) => {
                                  setError(null);
                                  setEditPassword("");
                                  setPasswordUser(r);
                                }}
                                onRemove={(r) => {
                                  setError(null);
                                  setRemoveUser(r);
                                }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </FieldGroup>

        <FieldGroup title="Roles" className="min-w-0 w-full">
          <ul className="flex flex-col gap-2 text-sm text-text-primary/70">
            <li>
              <span className="font-medium text-text-primary">Owner</span>
              {" — "}
              full CMS access, including Email setup and Admins.
            </li>
            <li>
              <span className="font-medium text-text-primary">Editor</span>
              {" — "}
              can edit site content, but cannot manage admin accounts.
            </li>
          </ul>
        </FieldGroup>
      </div>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add admin"
        description="They’ll sign in at /admin/login with this email and password."
      >
        <div className="flex flex-col gap-5" onKeyDown={blockEnterSubmit}>
          <Field label="Email">
            <TextInput
              type="email"
              autoComplete="off"
              placeholder="admin@company.com"
              value={addEmail}
              onChange={(e) => setAddEmail(e.target.value)}
            />
          </Field>
          <Field label="Password">
            <PasswordInput
              name="add_password"
              value={addPassword}
              onChange={setAddPassword}
              required={false}
              placeholder="At least 8 characters"
            />
          </Field>
          <Field label="Role">
            <SelectMenu
              value={addRole}
              options={ROLE_OPTIONS}
              aria-label="Role"
              onChange={(value) => setAddRole(value as AdminRole)}
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={
                pending || !addEmail.trim() || addPassword.length < 8
              }
              onClick={onAddClick}
            >
              {pending ? "Adding…" : "Add admin"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setAddOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(passwordUser)}
        onClose={() => setPasswordUser(null)}
        title="Change password"
        description={passwordUser?.email}
      >
        <div className="flex flex-col gap-5" onKeyDown={blockEnterSubmit}>
          <Field label="New password">
            <PasswordInput
              name="edit_password"
              value={editPassword}
              onChange={setEditPassword}
              required={false}
              placeholder="At least 8 characters"
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={pending || editPassword.length < 8}
              onClick={onChangePasswordClick}
            >
              {pending ? "Saving…" : "Update password"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setPasswordUser(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(removeUser)}
        onClose={() => setRemoveUser(null)}
        title="Remove admin?"
        description="Removes sign-in access only. Website content is not deleted."
      >
        <div className="flex flex-col gap-5">
          <p className="text-sm text-text-primary/70">
            Remove access for{" "}
            <span className="font-medium text-brand-primary">
              {removeUser?.email}
            </span>
            ? Their auth account and admin role are removed. Pages, media, and
            other CMS content stay.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="danger"
              disabled={pending}
              onClick={onConfirmRemove}
            >
              {pending ? "Removing…" : "Remove access"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setRemoveUser(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
