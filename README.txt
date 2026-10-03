IVANA V5.2 — CLICKABLE PROTOTYPE

Purpose
This build is a short-term clickable prototype so the study workspace can be used while Supabase authentication is being verified. Core study interactions remain browser-local.

V5.2 authentication hardening
- Supabase Auth uses the project URL and publishable key only.
- Create Account uses supabase.auth.signUp().
- Study name is stored as Supabase user metadata (display_name).
- Confirm Email can remain ON. When enabled, Supabase creates the user but returns no active session until the email is confirmed.
- Confirmation redirects to the Ivana Home page.
- Network/auth exceptions are caught and shown instead of falling through to a generic browser error.
- Profile sync is optional and never blocks authentication while the profiles table is being established.
- Enter clickable prototype is available from the login page so the study workspace can be inspected without an account.

IMPORTANT SUPABASE CHECK
Authentication → URL Configuration must allow the exact deployed Ivana site URL and the confirmation redirect used by the app.

No secrets
Do not put a Supabase service-role key or database password in the browser files. The publishable key is intended for browser use.
