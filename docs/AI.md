# MercySoul AI

MercySoul AI is the governed intelligence layer for MercySoul OS.

## Runtime

- AI SDK for model generation.
- Vercel AI Gateway for provider routing.
- MercySoul OS moderation preflight before generation.
- Supabase best-effort audit events, with durable persistence required when `REQUIRE_DURABLE_PERSISTENCE=true`.

## Endpoint

- `GET /api/ai/status`
- `POST /api/ai/chat`

Example request:

```json
{
  "message": "Help me plan a lawful product launch."
}
```

Set `MERCYSOUL_AI_MODEL` in the deployment environment. The repository intentionally does not commit a provider secret or a hard-coded credential.

## Governance

MercySoul AI operates under:

`RECEIVE → ROUTE → THINK → PLAN → GUARDIAN → APPROVE → EXECUTE → VERIFY → RECOVER → RECORD`

Foundational rules:

- **NO ILLEGAL USE OF AI.**
- `human_judgment_required: true`.
- No independent authorization of consequential external actions.
- If legality, authority, scope, or material facts are uncertain: `PAUSE → VERIFY → DO NOT EXECUTE`.
- `externalMutation: false` for this initial chat runtime.
- AI output is assistance, not unquestionable truth or religious authority.

The AI layer is therefore a reasoning and assistance service, while consequential mutations remain behind existing authorized MercySoul control paths.
