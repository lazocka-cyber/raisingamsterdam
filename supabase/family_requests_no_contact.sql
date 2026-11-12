-- RaisingAmsterdam — a parent's free request must not contain contact details.
-- Same rule as src/lib/contactGuard.js (6+ digits in a row, "@", links, wa.me,
-- "whatsapp"). Run in the Supabase SQL Editor. Safe to run more than once.
-- NOT VALID = checks every NEW or edited row, old rows are left alone.

ALTER TABLE public.family_requests DROP CONSTRAINT IF EXISTS family_requests_note_no_contact;
ALTER TABLE public.family_requests
  ADD CONSTRAINT family_requests_note_no_contact
  CHECK (
    note IS NULL OR (
      note !~ '[0-9]([ .()-]?[0-9]){5,}'
      AND note !~* '@|https?:|www\.|wa\.me|whatsapp'
    )
  ) NOT VALID;

ALTER TABLE public.family_requests DROP CONSTRAINT IF EXISTS family_requests_area_no_contact;
ALTER TABLE public.family_requests
  ADD CONSTRAINT family_requests_area_no_contact
  CHECK (
    area !~ '[0-9]([ .()-]?[0-9]){5,}'
    AND area !~* '@|https?:|www\.|wa\.me|whatsapp'
  ) NOT VALID;

-- Quick test (should return t, f, f, f, f):
-- SELECT '2 years, bedtime 19:30' !~ '[0-9]([ .()-]?[0-9]){5,}' AS ok_age,
--        '+31 6-1234-5678'        !~ '[0-9]([ .()-]?[0-9]){5,}' AS phone,
--        '06 12 34 56 78'         !~ '[0-9]([ .()-]?[0-9]){5,}' AS phone2,
--        'mail me a@b.nl'         !~* '@|https?:|www\.|wa\.me|whatsapp' AS mail,
--        'wa.me/31612345678'      !~* '@|https?:|www\.|wa\.me|whatsapp' AS wame;
