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

### Phase 1 "Done when"

- [ ] New user can sign up (with real email confirmation) and create a profile with allergens
- [ ] A second user cannot read the first user's data (verified on the remote project)
