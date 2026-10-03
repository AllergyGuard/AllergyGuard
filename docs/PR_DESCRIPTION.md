## AllergyGuard: Phases 1 to 8

Builds the rest of PLAN.md on `feature/full-build`, on top of US-01 (#5). Each phase has its own section below, added as the phase is finished.

---

## Phase 1: Login, onboarding and profile editing (US-02, US-07, US-03, US-09)

A user can log in and out, set up a profile in a resumable onboarding wizard, and edit it later from `/profile`.

### What's included

- **US-02 Log in / log out:** `/login` page and a `signOut` Server Action. Login errors never reveal whether an email is registered.
- **US-07 AllergenPicker:** reusable picker for the 10 listed allergens plus custom ones, each with an optional severity. A test keeps the codes in sync with the database enum.
- **US-03 Onboarding wizard:** disclaimer, name, allergens (at least one), emergency contact (can be skipped with "Add later"), then medications. It resumes at the first unfinished step. Home shows a reminder until a contact is added.
- **US-09 Edit profile:** `/profile` with separately saved sections for name, allergies, contacts (add, edit, delete, make primary) and medications. The contact and medication editors are shared with onboarding.

### Database (2 new migrations, already applied to the shared project; don't re-run them)

- `20260925000000_onboarding_progress`: `disclaimer_accepted_at`, `onboarding_step` (0–6) and `onboarding_completed_at` on `profiles`.
- `20260925010000_contact_functions`:
  - `set_primary_contact(contact_id)` switches the primary contact in one transaction.
  - `delete_contact(contact_id)` deletes a contact. If it was the primary, it promotes the oldest remaining contact and returns its id, otherwise null.
  - Both run as `security invoker` with an empty `search_path`, so RLS applies.
  - Both can be executed only by `authenticated`.
  - Both lock the profile row, so simultaneous changes run in order.

After pulling, `npx supabase migration list` should show both migrations as applied on the remote.

### New dev dependencies

`@testing-library/react`, `@testing-library/user-event` and `jsdom`, for component tests.

### Testing

- Lint clean, 174 Vitest tests passing (unit and component), production build succeeds.
- **Run by hand in a local Postgres (not in `npm run test`):** switching the primary, repeating a switch, deleting a non-primary, deleting the primary with others left, deleting the last contact, another user's contact, a missing id, and `anon` access.
- **Remote:** `anon` can't execute either function, and calling the RPC with only the public key returns 401.
- **End to end against the Supabase project at phone width:**
  - Login, the full onboarding flow, and resuming after a page reload.
  - Contact add, edit and make primary; deleting the primary (with promotion) and the last contact.
  - Profile edits, banner navigation and logout.
  - No console errors, and test users were removed afterwards.
- **Remote two-user RLS test (2026-10-03):** two real users signed in through Supabase Auth and used the REST API, like the app does. User B got 0 rows when listing or reading user A's profile, allergens, contacts and medications by id. B's inserts into A's profile, and a profile with `owner_id` set to A, were rejected by RLS. B's updates and deletes affected 0 rows, and both contact functions returned "contact not found". Signed-out requests saw nothing and couldn't call `delete_contact`. A's data was unchanged afterwards. 38 of 38 checks passed. A real user's profile was in the database during the test and was never visible to B or to signed-out requests. Test users were deleted afterwards.
- **Real signup (2026-10-03):** a new account signed up at `/signup`, confirmed through the emailed link, and finished onboarding. Verified with SQL: email confirmed, one profile at onboarding step 6 with the disclaimer recorded, one allergen (custom), one primary contact, one medication.

### Phase 1 "Done when"

- [x] New user can sign up (with real email confirmation) and create a profile with allergens
- [x] A second user cannot read the first user's data (verified on the remote project)

---

## Phase 2: Offline emergency card

`/emergency` shows the user's allergies, medications and emergency contacts with no network at all, including after the page is reloaded offline. The app can be installed to the home screen.

### What's included

- **`/emergency`** is a static page. Its data comes only from IndexedDB (Dexie), never from the network.
  - Allergies are listed severe first, and expired medications are flagged.
  - A large `tel:` button calls the primary contact; the other contacts are listed below it.
  - "Last updated" shows when the card was last synced, and a link leads back to home.
- **Emergency button** in the header of every page, signed in or not. It's a plain `<a>` (a full page load), so the service worker can answer it offline.
- **Dexie mirror** (`src/lib/offline/`): one snapshot per profile, replaced whole on every sync.
  - Every successful save in `save.ts` re-reads the profile from Supabase and writes the snapshot. The write happens in the shared `attempt()` wrapper, so no save path can skip it.
  - Signed-in pages also sync once per page load, which covers accounts created before Phase 2.
  - A failed sync never turns a save into an error.
  - Cards belonging to another user are dropped on the next sync.
- **Clearing:** only an explicit **Log out** clears the card. An expired session, a failed token refresh or being offline leaves it in place.
- **Service worker** (Serwist, `@serwist/turbopack`):
  - Precaches `/emergency`, `/~offline` and the build's static files.
  - Every other page is network-only, falling back to `/~offline` (one tap to the card).
  - Signed-in HTML and RSC payloads are never cached, so there is no cached user content to clear on sign-out.
  - Off in `npm run dev`.
- **Storage protection:** `navigator.storage.persist()` is requested after the first card is written.
  - On iPhone/iPad a dismissible "Add to Home Screen" hint is shown. Safari can delete storage for sites unused for about a week, and Home Screen apps are exempt.
- **Installable:** `manifest.ts` (standalone, with an "Emergency card" shortcut), 192/512 icons and a 180px Apple icon generated with `next/og`, and `appleWebApp` metadata.

### Structure change

- All pages with the header moved into `src/app/(main)/`. URLs are unchanged.
- The root layout no longer reads auth cookies, so `/emergency` can be built as a static page.

### New dependencies

- `serwist`, `@serwist/turbopack`, `dexie`; dev: `esbuild`, `fake-indexeddb`.
- `npm audit`: `@serwist/turbopack` pins `browserslist` 4.28.6, which has two advisories. It runs only at build time (bundling `sw.js`) on our own config. The other 5 high findings were already there, in the `eslint-config-next` chain.

### Phone numbers

- Stored as entered (country code optional, per the Phase 1 rule).
- `tel:` links remove spaces and brackets but don't change the number.
- A number saved without a country code dials as a local number, which may fail abroad.

### Testing

- Lint clean, 203 Vitest tests passing, production build succeeds. New tests cover:
  - Dexie sync: full replace, other-user cleanup, no session or no network keeps the card, persist request.
  - The save → mirror hook.
  - `tel:` formatting and allergy order on the card.
  - The iOS hint rules.
  - The `/emergency` view with a Dexie test double.
- **Offline, `next start` + Chromium at 390px:**
  - The service worker precaches `/emergency` and `/~offline` only (no page or RSC caches).
  - With the network off, reloading `/emergency` shows the card from IndexedDB with working `tel:` links.
  - `/` and `/profile` fall back to `/~offline`, and its button opens the card.
- **Chrome installability check** (`Page.getInstallabilityErrors`): no errors.

### Phase 2 "Done when"

- [x] With the network offline, reloading `/emergency` still shows all data. Note: Chrome's *hard* reload (Shift+Reload / Ctrl+Shift+R) skips the service worker for that request by design, so test with a normal reload, or by closing and reopening the tab.
- [x] Emergency page is 1 tap from every screen
- [ ] App installs to the home screen on Android and iPhone (needs a real-phone check)
