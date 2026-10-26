# AllergyGuard Build Plan

Rules for every phase:
- Start each phase in a fresh Claude Code session (or run `/clear`).
- Create a feature branch first, e.g. `feature/phase-1-profile`.
- Use plan mode (Shift+Tab) so Claude shows its plan before writing code.
- A phase is finished only when every "Done when" item passes. Then commit, push, open a PR.

---

## Phase 0: Setup and first deploy
**Scope:** Next.js + TypeScript + Tailwind scaffold, Supabase clients, Vitest, folder structure from CLAUDE.md, a placeholder home page, `.env.example`.
**Done when:**
- [ ] `npm run build`, `npm run lint`, `npm run test` all pass
- [ ] Deployed on Vercel with Supabase env vars set
- [ ] `.env*` is in `.gitignore`

## Phase 1: Auth and allergy profile
**Scope:** Supabase email auth (sign up, log in, log out). Tables: `profiles` (id, owner_id, name), `profile_allergens` (predefined list: milk, egg, peanut, tree nuts, soy, wheat/gluten, fish, shellfish, sesame, mustard, plus custom free text), `emergency_contacts`, `medications` (name, dose, expiry_date). RLS on all. Onboarding flow that creates the first profile, with the disclaimer.
**Done when:**
- [ ] A new user can sign up and create a profile with allergens
- [ ] A second test user cannot read the first user's data (RLS check)
**Prompt:**
> Read CLAUDE.md and the Phase 1 section of docs/PLAN.md. Build Phase 1 only. Start with the SQL migration and RLS policies, show them to me, then build the auth and onboarding UI.

## Phase 2: Offline emergency card
**Scope:** Serwist service worker that precaches `/emergency`. Dexie database mirroring the profile, allergens, medications, and emergency contact. Every save in Phase 1 forms also writes to Dexie. `/emergency` page reading only from Dexie, with a `tel:` call button. Persistent emergency button in the nav. Web app manifest so the app is installable.
**Done when:**
- [ ] With DevTools Offline, after a hard reload, `/emergency` still shows all data
- [ ] Emergency page is 1 tap from every screen
- [ ] App installs to the home screen on Android and iPhone
**Prompt:**
> Read CLAUDE.md and the Phase 2 section of docs/PLAN.md. Build Phase 2 only. Explain your caching strategy for /emergency before implementing. Finish by telling me exactly how to test it offline.

## Phase 3: Allergen matching engine
**Scope:** `checkAllergens(ingredientText, userAllergens, options)` in `src/lib/allergen/`, returning verdict, matched ingredients, explanation, and warnings. A synonyms map (e.g. milk: whey, casein, lactose, ghee, butter, paneer). Handles "may contain" / "traces of" phrases and low-confidence input. No UI yet.
**Done when:**
- [ ] Vitest cases cover: direct match (Unsafe), synonym match (Unsafe), may-contain (Caution), empty or missing text (Caution), clean text (Safe), and "Unsafe never downgraded" when both a match and a may-contain exist
**Prompt:**
> Read CLAUDE.md and the Phase 3 section of docs/PLAN.md. Build Phase 3 only. Write the Vitest cases first, then the implementation. Pure functions only, no UI.

## Frontend redesign (between Phase 3 and Phase 4)
**Scope:** Restyle every existing screen after the Figma prototype in `design/figma-reference/` (style reference only: features, flows, data and copy stay the same). Design tokens with light and dark values in `globals.css`, Nunito via `next/font/google` (self-hosted and precached for offline `/emergency`), shared UI components (app bar, header band, section card, pill, buttons, field with trailing icon, bottom tabs), then `/`, `/login`, `/signup`, `/onboarding`, `/profile`, `/emergency`, `/~offline` and the PWA icons.
**Rules that override the prototype:** the Emergency button stays a plain `<a href="/emergency">` on every screen; `/emergency` stays static with no server data; all body text meets WCAG AA 4.5:1; verdicts always show the word and an icon; unbuilt features are hidden or marked "Coming soon", never dead links; tap targets at least 44px.
**Done when:**
- [ ] Every screen checked at 390px against its reference screenshot, in light and dark, with deliberate differences listed
- [ ] `/emergency` renders in Nunito with DevTools set to Offline
- [ ] All existing tests pass

## Phase 4: Barcode scanning
**Scope:** Scan page using @zxing/browser with the rear camera. Look up the barcode on Open Food Facts, pass ingredients to `checkAllergens()`, show the verdict screen (verdict, explanation, raw text, product name). Save scans to a `scans` table with an ingredients snapshot. Manual barcode entry as a fallback.
**Done when:**
- [ ] Scanning a real product on a phone (via the Vercel URL) shows a verdict
- [ ] A product not found on Open Food Facts shows Caution with a clear message, never Safe
**Prompt:**
> Read CLAUDE.md and the Phase 4 section of docs/PLAN.md. Build Phase 4 only. Reuse checkAllergens() from Phase 3 without changing its rules.

## Phase 5: Ingredient label photo (OCR)
**Scope:** Capture or upload a label photo, run Tesseract.js, show the extracted text (editable so the user can fix OCR mistakes), then run the same `checkAllergens()` and verdict screen. Low OCR confidence produces Caution.
**Done when:**
- [ ] The same ingredients give the same verdict via barcode and via photo
- [ ] Raw extracted text is always shown
**Prompt:**
> Read CLAUDE.md and the Phase 5 section of docs/PLAN.md. Build Phase 5 only. Reuse the Phase 4 verdict screen component.

## Phase 6: Reaction diary
**Scope:** `reactions` table (date/time, food or product, linked scan optional, symptoms, severity, notes). List and add/edit screens.
**Done when:**
- [ ] A user can log, view, edit, and delete reactions; RLS enforced

## Phase 7: Medication expiry reminders
**Scope:** Web Push subscription (service worker) plus email fallback via Resend. Supabase pg_cron job that daily finds medications expiring in 30, 7, and 1 days and notifies the owner.
**Done when:**
- [ ] A medication set to expire in 7 days triggers a notification in testing
- [ ] Settings page lets the user turn notifications on or off

## Phase 8: Ingredient change alerts
**Scope:** Weekly cron job re-fetches products the user has previously scanned as Safe, compares against the stored ingredients snapshot, re-runs `checkAllergens()`, and notifies if the ingredients or verdict changed.
**Done when:**
- [ ] Editing a stored snapshot in the DB to differ from Open Food Facts triggers an alert in testing

## Phase 9 (stretch): Restaurants and travel mode
**Scope:** Decide the data source first (e.g. Google Places). Travel mode could include allergy cards translated into local languages. Plan this phase as a team before building.

## Phase 10 (stretch): Family and caregiver profiles
**Scope:** The data model already supports multiple profiles per owner. Add a profile switcher, and make `/emergency` offline data cover every profile the user manages.
