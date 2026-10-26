# Allergy Guard: visual reference from the Figma prototype

Source: screen recording of the Figma Make prototype (14 screens), captured 2026-10-26.
Screenshots are in `screens/`. Colours below were sampled from the recording, so treat them
as close approximations, not exact Figma values.

**Use this as a style reference only.** Our features, flows, data and copy stay as they are.
The prototype's placeholder content ("Chocolate Cookies", "70%", "+91 XXXXX XXXXX") is not real.

## Look and feel

Friendly, soft and rounded. Light lavender page, white cards with soft shadows, pastel colour
per section, bold rounded headings, small uppercase coloured section labels, emoji as icons,
full-width pill-shaped buttons, bottom tab bar.

## Colour

| Role | Approx. value | Seen on |
|---|---|---|
| Primary purple | `#8050F4` | Login, Start scanning, Open camera buttons, headings, active tab |
| Header lavender | `#E9E4FD` | Top band on home, login, profile, scan |
| Page background | `#FAF9FE` | Behind cards |
| Card | `#FFFFFF` | All cards, inputs |
| Safe green | `#00B400` icon, `#C9F8E0` band | Safe result, Safe pill, Save profile button (deeper green) |
| Caution amber | `#FEC200` icon, `#FDEEBE` band, `#F4920C` button | Caution result |
| Unsafe red | `#E30000` icon, `#FDDFE1` band | Unsafe result, allergen pill |
| Emergency red/pink | `#FDDFE1` band, coral-red Call button | Emergency info |
| Diary pink | `#E93D8E` | Diary heading and Add reaction button |
| Tile pastels | lavender, pink, rose, mint, sky, peach | Home grid tiles (Profile, Emergency, Diary, Restaurants, Travel, Medication) |

Each section owns a colour (allergies = rose, medication = pink, contact = orange,
travel = sky, restaurants = mint, diary = pink) and uses it for its uppercase label,
card left-border accent and pill.

## Type

- Rounded geometric sans, very likely **Nunito** (or similar). Load via `next/font/google`, no npm dependency.
- Screen titles: ~24px, extra-bold, coloured (purple, or the section colour) + one emoji ("Hi, there! 👋", "Let's keep you safe! 🛡️").
- Verdict titles: ~32px, extra-bold, uppercase (SAFE / CAUTION / UNSAFE).
- Section labels: ~11px, bold, uppercase, letter-spaced, coloured.
- Body: ~14-15px, dark navy text (`~#1F1B3A`); muted text is grey-purple.
- Buttons: bold uppercase, letter-spaced.

## Shape and spacing

- Cards: ~16-20px radius, white, soft shadow, ~16px padding, ~12px gap between cards.
- Accent cards: 4px coloured left border (last scanned, verdict product card, diary entries, emergency sections).
- Inputs: ~12px radius, white, light border, trailing icon (person, eye, phone), placeholder in light purple-grey.
- Buttons: full width, ~52px tall, ~14px radius. Primary filled; secondary outlined in the same colour; tertiary is a light grey outline (Back).
- Pills/chips: fully rounded, pastel fill, coloured text, emoji first ("🥜 Peanut", "✓ SAFE", "⚠ Possible concern"). "+ Add Allergy" is a dashed-outline pill.
- Header band: full-width pastel block at the top of each screen, title + subtitle, ~24px bottom padding, rounded bottom on some screens.
- Bottom tab bar: Home, Scan, Diary, Profile; outline icons with labels; active tab purple with a pale purple rounded highlight behind the icon.

## Screen patterns (screens/)

| File | Pattern worth borrowing |
|---|---|
| 01-splash | Centred app icon (white rounded square, purple shield), wordmark, tagline "Your safety, at every bite." |
| 02-login | Lavender header with icon + wordmark; "Welcome back! 👋"; labelled inputs; primary + outlined buttons with an OR divider |
| 03/04-create-profile | One scrolling form split into coloured section cards: details, allergies (chip cloud), medication, emergency contact; green Save button |
| 05-home | Greeting header, hero "Scan product" card with primary CTA, 3x2 pastel tile grid, "Last scanned" accent card |
| 06-scan | Dark scanner viewport with corner brackets and hint text; two mode tiles (Barcode / Label photo); primary Open camera |
| 07-checking-product | Product card, circular progress, 3-step checklist (done step in green) |
| 08/09/10-result-* | Full-width coloured verdict band with big icon + word, product card with pill, explanation box, ingredient text with matched term highlighted, actions |
| 11-profile | Avatar header, the same section cards as create-profile, outlined Edit profile button |
| 12-emergency | Pink header with siren emoji, section cards (allergies, medication, contact), huge red Call contact button, "available offline" note |
| 13-reaction-diary | Entries as accent cards with date pill, severity dots, symptom pill; pink Add reaction button |
| 14-restaurants / 15-travel | Search field, list cards with rating and pills, outlined View on map button |

## Things we must NOT take from the prototype

- **Colour-only meaning.** Our verdicts must always show the word (SAFE/CAUTION/UNSAFE) and an icon; severity dots in the diary also need a text label for screen readers.
- **Low-contrast text.** Several prototype texts fail WCAG AA (light purple subtitles on lavender, orange "Please check carefully" on yellow, pastel tile labels, placeholder text). Darken them to reach 4.5:1 for body text.
- **Emergency in a tile only.** Our Emergency button stays a plain `<a href="/emergency">` visible on every screen, not just a home tile.
- **Fake confidence.** No "70%" progress unless it reflects real progress, and no "Safe alternative" suggestions (we have no data for them).
- **A splash screen with a fake loading bar.** Use the branding on login/onboarding instead; never delay the Emergency card behind a splash.
- **Dead links.** Home tiles for unbuilt phases (Diary 6, Medication 7, Restaurants/Travel 9) should be hidden or clearly marked "Coming soon" until built.
