# AllergyGuard build progress

Branch: `feature/full-build`, one commit per story/phase, pushed once at the end (no PR until then).
PR text lives in `docs/PR_DESCRIPTION.md`; add each phase's section to it when the phase is finished.
Scope: rest of Phase 1, then Phases 2–8 from `docs/PLAN.md`. Phases 9–10 skipped for now.

To resume in a fresh session: run `/clear`, then say "continue from docs/PROGRESS.md".

## Checklist

### Phase 1: Auth and allergy profile
- [x] US-01 Sign up with email and password (merged in PR #5)
- [x] US-02 Log in and log out
- [x] US-07 Allergen selection: reusable `AllergenPicker` (severity + custom allergens)
- [x] US-03 Onboarding wizard: disclaimer, profile name, allergens, primary emergency contact, medications, resumable
- [x] US-09 Edit profile, incl. `set_primary_contact(contact_id)` Postgres function (single transaction)

### Later phases
- [ ] Phase 2: Offline emergency card (Serwist, Dexie, `/emergency`, nav button, manifest)
- [ ] Phase 3: Allergen matching engine (`checkAllergens()`)
- [ ] Phase 4: Barcode scanning (@zxing/browser, Open Food Facts, `scans` table)
- [ ] Phase 5: Ingredient label photo (Tesseract.js OCR)
- [ ] Phase 6: Reaction diary
- [ ] Phase 7: Medication expiry reminders (Web Push + Resend, pg_cron)
- [ ] Phase 8: Ingredient change alerts (weekly cron)

## Now
**Phase 1 verification (must pass before Phase 2).** Code for Phase 1 is complete; the two "Done when"
checks on the remote project are not done yet:
- [ ] Two-user RLS check on the remote project. Blocked on 2026-10-03: the Supabase project was
  **paused** (`npx supabase projects list` shows `INACTIVE`, API endpoints don't answer). Once it's restored,
  re-run the script-based test (two real users sign in through Supabase Auth; user B tries to list, read by id,
  insert into, update, delete, and call `set_primary_contact` / `delete_contact` on user A's rows; anon checks;
  A's data verified unchanged; both users deleted afterwards).
- [ ] Real signup with email confirmation: needs a real inbox, so it's a manual step (see below). After it's
  done, verify with SQL that the user is confirmed and has a finished profile with allergens.
- Then tick both boxes in `docs/PR_DESCRIPTION.md` and here.

## Next
Phase 2: Offline emergency card. Show the plan (including the caching strategy for `/emergency`
and the new dependencies Serwist + Dexie) and wait for approval before building.

## Done notes
- **US-02:** `/login` (email + password, `next` redirect via `safeNextPath`), `signOut` Server Action,
  `SiteHeader` in the root layout (Log in / Log out), shared form styles in `src/components/form-styles.ts`.
- **US-07:** `src/lib/allergen/codes.ts` (codes, labels, severities; a test checks them against the DB enums),
  `src/lib/profile/allergen-selection.ts` (toggle/add/remove/severity, row mapping, `diffAllergens` for saves),
  and the controlled `src/components/allergen-picker.tsx` (no DB access). Component tests use
  @testing-library/react + user-event + jsdom (`// @vitest-environment jsdom` per file).
  Synonyms such as "dairy" or "whey" are stored as custom text (decision: option a).
- **US-03:** migration `20260925000000_onboarding_progress.sql` (applied with `db push`): `disclaimer_accepted_at`,
  `onboarding_step` (check 0–6), `onboarding_completed_at` (set exactly when step = 6). Wizard at `/onboarding`
  (`wizard.tsx` + `steps/`), resume logic `resumeStep()`, validation mirrors DB constraints, all writes in
  `src/lib/profile/save.ts` (browser client, so Phase 2 can add Dexie there). Home redirects unfinished users to
  onboarding and shows an "Add an emergency contact" banner while there is no primary contact.
  **E2E tested** against the real project at 390px: login, disclaimer, name, reload resumes at step 3,
  "at least one allergen" block, Milk (severe) + custom "whey", phone validation, contact save and update via Back
  (still one row), medication with expiry, finish, `/onboarding` → home, banner with no contact, real logout.
  Test user created via SQL (no emails sent) and deleted afterwards; project left with 0 profiles.
- **US-09:** migration `20260925010000_contact_functions.sql` (applied): `set_primary_contact(contact_id)` and
  `delete_contact(contact_id) returns uuid` (promotes the oldest remaining contact when the primary is deleted),
  both `security invoker`, `search_path = ''`, profile row locked `for update`, execute revoked from
  public/anon and granted to authenticated. Tested locally (switch, no-op, delete non-primary, delete primary
  with others, delete last, other user's contact, missing id, anon) and remotely (anon RPC → 401
  "permission denied"). `/profile` page: name, allergies, contacts (add/edit/delete/make primary via `rpc()`),
  medications; each section saves on its own. Medication list and contact fields extracted to
  `src/components/profile/` and shared with onboarding. Header has a Profile link; home banner links to
  `/profile#contacts`. **E2E tested** on the real project (add, make primary, delete primary → "Ravi Test is now
  your primary contact.", delete last, rename, add allergen, add medication, banner link), test user deleted.
- With the real `.env.local`, `/`, `/login`, `/signup` return 200 and Supabase auth health returns 200 (checked after US-07).

## Required in Phase 3 (decided during US-07)
- [ ] `checkAllergens()` must map **custom** allergens through the synonym list, so a custom "dairy" or
  "whey" is matched as milk (Unsafe), not only as literal text.
- [ ] Vitest case for this: custom allergen "whey" (and "dairy") + ingredients containing milk
  (or casein/whey) → Unsafe, with the matched ingredient shown.
- [ ] Once the synonym list exists, add a "Did you mean Milk?" suggestion to `AllergenPicker` when a custom
  entry is a known synonym of a predefined allergen.

## Required in Phase 2 (decided during US-03)
- [ ] Mirror every successful write in `src/lib/profile/save.ts` (profile, allergens, contact, medications) into
  Dexie, per CLAUDE.md. US-03 saves go to Supabase only because Dexie doesn't exist yet.

## Follow-ups (not blocking)
- Login: "Resend confirmation email" button for `email_not_confirmed`.

## Manual steps for me
- [ ] **Restore the paused Supabase project** (blocks the Phase 1 remote checks): Supabase Dashboard →
  project `allergyguard` → **Restore project**. It takes a few minutes. Free-plan projects pause after about a
  week without activity, so expect this again after long breaks.
- [ ] **Real signup test** (after the restore):
  1. Check the US-01 dashboard settings are still in place: Authentication → URL Configuration
     (Site URL; Redirect URLs include `http://localhost:3000/**`), Emails → Confirm signup template uses
     `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email&next=/onboarding`, minimum password length 8,
     and **Confirm email turned on**.
  2. `npm run dev`, open `http://localhost:3000/signup`, and sign up with an email address you can read.
  3. Open the confirmation email and tap the link: you should land on `/onboarding`, step 1.
  4. Finish onboarding with at least one allergen.
  5. Tell me the email you used so I can verify the rows with SQL (then delete the account or keep it).
- [x] ~~Fill in `.env.local`~~: done; values set and the file is git-ignored.
- [x] ~~US-01 migration~~: already applied and registered as version `20260924000000`. Do **not** `db push` it again.
- [x] ~~Link the Supabase CLI~~: linked to `vwnwevrwoitvnsspudqe`; `20260925000000` applied with `db push`.
- [x] ~~Test real login/logout~~: covered by the US-03 end-to-end run.
