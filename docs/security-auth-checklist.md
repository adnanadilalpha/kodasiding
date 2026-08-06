# Supabase Auth checklist (manual)

Verify in the Supabase dashboard for this project:

1. **Disable public signup** — Authentication → Providers → Email → turn off “Enable sign ups” (admins are created by owners via the CMS).
2. **Leaked password protection** — Authentication → Attack Protection → enable HaveIBeenPwned checks.
3. **Password length** — minimum at least 8 characters (app already enforces ≥ 8 on create/update).
4. **Email confirmation** — keep enabled for any residual self-serve paths; CMS-created users are confirmed via the Admin API.

## App env (Vercel / `.env.local`)

5. **`SMTP_SECRET_KEY`** — set a long random secret (≥ 32 characters) so SMTP passwords are encrypted at rest. Required in production when saving Email setup. Rotate the mailbox app password after first deploy if it was previously stored in plaintext.

Re-check after any Auth settings change.
