-- Emergency contact phones must include a country code, so tel: links on the
-- offline emergency card dial correctly from anywhere (Phase 2 decision).
--
-- New rule: "+", a country code that doesn't start with 0, then digits,
-- spaces, dots or hyphens; 7-15 digits in total (E.164 max is 15).
-- Parentheses are no longer allowed: "+44 (0)20 ..." would dial +44020...,
-- which doesn't connect.
--
-- The new constraint is VALIDATED against existing rows: if any stored phone
-- doesn't match, this migration fails and changes nothing. (A NOT VALID
-- constraint isn't enough: Postgres re-checks a row on any UPDATE, so e.g.
-- set_primary_contact would start failing on an old-format contact.)

alter table public.emergency_contacts
  drop constraint emergency_contacts_phone_format;

alter table public.emergency_contacts
  add constraint emergency_contacts_phone_format check (
    phone ~ '^\+[1-9][0-9 .-]*[0-9]$'
    and char_length(regexp_replace(phone, '[^0-9]', '', 'g')) between 7 and 15
  );
