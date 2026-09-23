# MercyLegacy
CREATE · PLANT · CONNECT

MercyLegacy turns remembrance into a living network: a Legacy Identity, a physical tree, a QR/NFC connection and a geographic Forest Map.

## Routes
- / landing
- /auth/login secure email sign-in
- /create create a legacy
- /legacy/[code] public legacy profile when visibility is public
- /qr/[code] legacy QR identity
- /plant register a tree for an owned legacy
- /tree/[code] public tree identity after verification
- /qr/tree/[code] tree QR
- /forest interactive OpenStreetMap/Leaflet forest map
- /admin protected operations dashboard

## Required Vercel environment variables
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
- SUPABASE_SERVICE_ROLE_KEY
- NEXT_PUBLIC_SITE_URL
- ADMIN_EMAILS — comma-separated admin emails

Never expose SUPABASE_SERVICE_ROLE_KEY to browser code.

Supabase Auth email/OTP must allow the deployed site URL as a redirect URL, for example https://mercy-legacy.vercel.app/auth/callback.

## Security
All MercyLegacy tables have RLS enabled. Public access is limited to explicitly public legacy profiles, public memories and verified/living trees connected to public profiles. Server-side service-role access is used only for controlled server routes/pages; it must remain secret.