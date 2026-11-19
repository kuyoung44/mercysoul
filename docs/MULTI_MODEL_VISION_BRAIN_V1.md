# MercySoul Multi-Model Vision Brain — v1

## Purpose

Add a model-independent selection layer to MercySoul Vision Brain while keeping MercySoul's governance, agent orchestration, memory, audit, and product identity under MercySoul control.

This first slice is deliberately non-invasive: it selects an AI SDK / Vercel AI Gateway model identifier but does not call providers, execute tools, mutate data, or deploy anything.

## Current integration facts

- `src/ai/mercy-soul-ai.js` currently calls AI SDK `generateText()` using `MERCYSOUL_AI_MODEL`.
- `config.js` already requires `GEMINI_MODEL` and `GEMINI_API_KEY`.
- `src/dominion-governance-engine.js` defines the RECEIVE → ROUTE → THINK → PLAN → GUARDIAN → APPROVE → EXECUTE → VERIFY → RECOVER → RECORD lifecycle and keeps authorization separate from execution.
- Existing Vision Brain async function calling is implemented separately in `src/vision-brain/async-agent.js`.

## Model profiles

Configure model identifiers through the existing AI SDK / Vercel AI Gateway naming convention:

| Environment variable | Purpose |
|---|---|
| `MERCYSOUL_MODEL_PRIMARY` | Default model |
| `MERCYSOUL_MODEL_FAST` | Low-latency tasks |
| `MERCYSOUL_MODEL_REASONING` | Complex reasoning |
| `MERCYSOUL_MODEL_CODING` | Software engineering |
| `MERCYSOUL_MODEL_CREATIVE` | Creative generation |
| `MERCYSOUL_MODEL_RESEARCH` | Research and synthesis |
| `MERCYSOUL_MODEL_FALLBACK` | Candidate fallback, never auto-invoked in v1 |

If a profile is not set, it resolves to the primary model. The current `MERCYSOUL_AI_MODEL` and `GEMINI_MODEL` values remain compatibility fallbacks for the primary model.

## Safety invariants

1. Model selection is not model execution.
2. No model may authorize its own tool call or external mutation.
3. Provider failure does not silently switch models in v1; fallback is surfaced for a later explicit retry policy.
4. Consequential actions continue through Guardian and scoped human approval.
5. No database schema, RLS, grants, secrets, production configuration, or deployment changes are included.
6. Provider credentials are never returned by status endpoints.

## Next integration stages

1. Wire `selectMercySoulModel()` into `runMercySoulAI()` while preserving the existing preflight and governance gates.
2. Add provider-specific capability metadata and model allowlists.
3. Add explicit, budget-aware retry/fallback policy with audit events.
4. Add evaluation fixtures for coding, research, creative, latency, cost, and safety.
5. Expose read-only model-router status in the existing status endpoint.

## Validation

Run `node --test src/ai/model-router.test.js` and `npm test`.

This branch is not deployed. Merge and production activation require a separate review and founder approval.
