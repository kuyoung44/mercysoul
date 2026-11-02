# MercySoul specialist memory connection

The six registered agents use one owner-scoped Supabase memory service:
`vision`, `builder`, `business`, `research`, `marketing`, and `guardian`.

## Server configuration

The runtime requires:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (server-side only; never use a `NEXT_PUBLIC_` variable)

For validating a user session, the service prefers `SUPABASE_ANON_KEY` or
`SUPABASE_PUBLISHABLE_KEY`; if neither is present it uses the server-only
service key as the Auth API's project key. In every case, the caller's
Supabase user access token is independently verified at `/auth/v1/user`.
The service-role key is never returned to clients.

## Endpoints

All memory endpoints except status require
`Authorization: Bearer <Supabase user access token>`.

- `GET /api/agent/memory/status` — reports readiness and policy only.
- `POST /api/agent/memory/remember` — requires `agentId`, `type`,
  `content`, and `userOptIn: true`. Consent is recorded as approved only
  for this explicit per-observation opt-in. Shared memories are available to
  all six registered agents; private memories are restricted to the creator
  agent plus the explicitly allowed agent list.
- `POST /api/agent/memory/recall` — requires `agentId`; returns only
  approved, unexpired memories owned by the authenticated user and permitted
  for that agent. Project-specific recall also includes intentionally global
  memories with a null project ID.

Example remember body:

```json
{
  "agentId": "vision",
  "type": "project_fact",
  "content": "The approved project decision goes here.",
  "projectId": "mercysoul-dominion",
  "userOptIn": true,
  "visibility": "shared",
  "retention": "durable",
  "tags": ["project", "decision"]
}
```

## Security model

- The owner ID is taken from the verified Supabase Auth user, never the body.
- Service-role credentials remain on the server; requests are authenticated
  before any privileged PostgREST call.
- Every read is filtered by owner, approved consent, agent allowlist,
  expiration, and project scope. A second in-process policy check fails closed.
- Writes require explicit `userOptIn: true`; private-marked and sensitive
  content are rejected by the existing memory policy.
- This API does not trigger publishing, messaging, payments, deployment, or
  any other external mutation.
- The database's RLS policies remain enabled as defense in depth. The server
  uses the service role only after deriving the owner from a verified user JWT.

## Rollout state

The code is on `feat/vision-brain-agent-os`. It is not merged or deployed.
The existing database table has been created and verified, but this code has
not yet been exercised against a live authenticated user session. Do not
enable agent memory capture in production until CI tests and authenticated
cross-owner tests have passed.
