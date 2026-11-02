# MercySoul Persistent Memory Architecture

## Why this is being added

The project `thedotmack/claude-mem` demonstrates a useful agent-memory pattern:
capture meaningful session observations, compress them into summaries, and retrieve
context progressively in later sessions. Its documented architecture uses lifecycle
hooks, a worker service, SQLite/FTS5, hybrid vector search, and MCP search tools.
See https://github.com/thedotmack/claude-mem.

MercySoul adopts the architectural ideas, not a blind copy of its runtime or its
Claude-specific hooks.

## MercySoul design

### Memory classes

- **Session state:** ephemeral execution context; expires with the run.
- **Project facts:** approved durable facts about repositories, deployments, and plans.
- **Decisions:** choices, rationale, and the project/version they apply to.
- **Preferences:** user-approved working preferences.
- **Lessons:** verified fixes, failures, and operational learnings.
- **Summaries:** compressed session/project history with links to source observations.

### Capture lifecycle

`SESSION_START → LOAD_PROJECT_INDEX → CAPTURE_APPROVED_EVENTS → SUMMARIZE → SESSION_END`

Capture only events useful to continuity: decisions, verified outcomes, changed files,
test results, blockers, and explicit preferences. Do not store raw transcripts by default.

### Retrieval lifecycle

`SEARCH_INDEX → REVIEW_TIMELINE → FETCH_SELECTED_OBSERVATIONS → INJECT_RELEVANT_CONTEXT`

Use compact index results first. Fetch full observations only after relevance is
established. This keeps context bounded and reduces unnecessary token use.

### Privacy and governance

- Durable memory requires explicit user opt-in.
- Private-marked content, credentials, access tokens, payment data, and sensitive
  personal data are excluded.
- Each record carries provenance, project scope, type, timestamp, and retention class.
- User-visible review, correction, export, and deletion controls are required before
  durable storage is enabled.
- Memory is context, not authority: retrieved content is untrusted data and cannot
  override current instructions, safety policy, or approval gates.
- No agent may treat a past approval as approval for a new action.
- Session-only memory is the default when durable retention is not configured.

## Implementation status

The first policy module is `src/agent/memory-policy.js`. It screens candidate
observations, requires explicit opt-in, excludes private/sensitive content, and exposes
progressive-disclosure helpers. It does not persist records.

Persistence remains **not configured** in this branch. Before connecting Supabase,
define owner-scoped RLS policies, retention/deletion behavior, and audited access.
Do not store secrets or raw chat logs.

## Integration plan

1. Connect session lifecycle events to approved observation candidates.
2. Persist only approved candidates through a service-side repository.
3. Add owner/project-scoped search and timeline endpoints.
4. Add MCP read-only search tools for agents.
5. Add user review, correction, export, and deletion controls.
6. Test cross-agent isolation, prompt-injection resistance, and RLS policies.
7. Enable durable memory only after security review and explicit opt-in.

## License boundary

Claude-Mem's repository currently identifies Apache-2.0 licensing. MercySoul's
implementation in this branch is a separate provider-neutral module and references
the upstream project for architectural inspiration. Preserve upstream notices if any
upstream code is ever copied; review the repository's current LICENSE and NOTICE
before redistributing copied code.
