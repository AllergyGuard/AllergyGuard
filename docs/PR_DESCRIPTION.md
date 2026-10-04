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

### Phone numbers must include a country code (migration `20261004000000_phone_country_code`, already applied; don't re-run it)

- A phone must start with `+` and a country code (not starting with 0), then digits, spaces, dots or hyphens, with 7–15 digits.
- Brackets are rejected: "+44 (0)20 …" would dial +44020…, which doesn't connect.
- Same rule in `validatePhone()` and the database check. The migration re-validated existing rows; one old contact without a country code was fixed by hand before it was applied.
- Empty phone fields in onboarding and `/profile` start with `+91 `, with a hint under the field.
- Every call link (emergency card and `/profile`) uses `telHref()`, which keeps only `+` and digits. The displayed number keeps its spaces.

### Testing

- Lint clean, 213 Vitest tests passing, production build succeeds. New tests cover:
  - Dexie sync: full replace, other-user cleanup, no session or no network keeps the card, persist request.
  - The save → mirror hook.
  - `tel:` links (only `+` and digits) and allergy order on the card.
  - The country-code phone rule and the `+91 ` prefill in onboarding and `/profile`.
  - The iOS hint rules.
  - The `/emergency` view with a Dexie test double.
- **Offline, `next start` + Chromium at 390px:**
  - The service worker precaches `/emergency` and `/~offline` only (no page or RSC caches).
  - With the network off, reloading `/emergency` shows the card from IndexedDB with working `tel:` links.
  - `/` and `/profile` fall back to `/~offline`, and its button opens the card.
- **Chrome installability check** (`Page.getInstallabilityErrors`): no errors.
- **Real iPhone** (installed to the Home Screen through a `cloudflared` tunnel): see "Done when" below.

### Phase 2 "Done when"

- [x] With the network offline, reloading `/emergency` still shows all data. Note: Chrome's *hard* reload (Shift+Reload / Ctrl+Shift+R) skips the service worker for that request by design, so test with a normal reload, or by closing and reopening the tab.
- [x] Emergency page is 1 tap from every screen
- [x] App installs to the home screen on **iPhone** (2026-10-04, via a `cloudflared` tunnel). Also passed on the iPhone: the offline card in Airplane mode, the call button opening the dialer with the right number, an edit syncing to the card with an updated "Last updated", and Log out clearing the card.
- [ ] App installs to the home screen on **Android: untested** (no Android phone available). Chrome's desktop installability check passes, but install and offline use haven't been tried on an Android device.

## Phase 3: Allergen matching engine

`checkAllergens(text, allergens, options?)` in `src/lib/allergen/check.ts` is the one matching function. Barcode (Phase 4) and OCR (Phase 5) will both call it. It is pure: no UI, no network.

### What's included

- **Result:** `{ verdict, explanation, matches, warnings, rawText }`.
  - Each match gives the user's allergen, the matched term and the exact original text, so the UI can highlight it.
  - `rawText` is returned unchanged.
- **Unsafe:** any ingredient matching a user allergen or one of its synonyms (`synonyms.ts`, e.g. milk: whey, casein, ghee, paneer).
  - Nothing downgrades it. A may-contain, low OCR confidence or incomplete data is reported next to it, but the verdict stays Unsafe.
- **Caution** when any of these applies:
  - **May contain:** "may contain", "traces of", "not suitable for", or "made/packed in a factory / on equipment / on a line…". Only the words after the phrase, up to the end of the sentence or line, count as may-contain. "Made with milk in a factory that handles nuts" still flags milk as an ingredient.
  - **Ambiguous term with no stated source:** lecithin / E322 / INS 322 / "Emulsifiers (322)" for soy, bare "flour" for wheat, hydrolysed vegetable protein for soy *and* wheat. A stated source settles it either way: "soy lecithin" or "flour (wheat)" is Unsafe, while "sunflower lecithin (E322)" or "rice flour" is not flagged.
  - **Free-from claim:** "dairy-free", "dairy & gluten free", "free from milk, egg and gluten", "no milk", "without nuts", "contains no peanuts", "non-dairy", "eggless". A claim is never proof, and a real ingredient elsewhere still gives Unsafe ("Lactose-free milk", "Non-dairy creamer (… sodium caseinate)").
  - **Doubtful input:** missing or empty text, `incomplete: true`, `ocrConfidence` below `minOcrConfidence` (0–100, default 70; NaN counts as low), or no allergens in the profile.
- **Safe** only when text was obtained and none of the above applies.
- **Custom allergens** are matched as literal text (plurals included, regex characters escaped) and through the synonym list. A custom "whey" or "dairy" catches milk and casein.
- **Indian label terms:** maida and atta are wheat (Unsafe); besan / gram flour is not wheat; ghee, paneer, khoya and dahi are milk.
- **False positives avoided** with whole-word matching and exclusion phrases:
  - "eggplant", "nutmeg", "coconut" and "buckwheat" don't match;
  - "cocoa butter", "coconut milk" and "cream of tartar" are not milk;
  - "peanut butter" is peanut, not milk.
- **Text clean-up** (`text.ts`):
  - Open Food Facts' `_milk_` underscores (which hide words from `\b`) become spaces;
  - accents and ligatures are removed;
  - words split across OCR lines with a hyphen are rejoined;
  - a map back to the original text is kept.
- **Picker:** adding a custom synonym such as "dairy" shows "Did you mean Milk?" with **Use Milk instead** (swaps it in place, keeping the severity) or **Keep dairy**.

### New dependencies

None.

### Testing

- `npm run test`: 374 tests. They include `check.test.ts`, which covers every case listed in "Done when" plus claims, ambiguous terms, exclusions, OCR confidence and custom allergens, along with `synonyms.test.ts` and `text.test.ts`.
- `npm run lint`, `npx tsc --noEmit` and `npm run build` pass.

### Phase 3 "Done when"

- [x] Vitest cases cover direct match (Unsafe), synonym match (Unsafe), may-contain (Caution), empty or missing text (Caution), clean text (Safe), and "Unsafe never downgraded" when both a match and a may-contain exist.
