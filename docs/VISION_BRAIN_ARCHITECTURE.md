# MercySoul Vision Brain — Independent Architecture v0.1

**Status:** Initial implementation foundation  
**Owner:** MercySoul Dominion  
**Implementation:** `src/vision-brain/engine.js`  
**Tests:** `src/vision-brain/engine.test.js`

## 1. Architectural position

MercySoul Vision Brain is the intelligence orchestration layer owned by MercySoul. It is not a fork or rebranding of LangChain, LangGraph, CrewAI, or another agent framework.

Models are replaceable reasoning providers. They do not own identity, permissions, policy, memory authority, or execution rights. The MercySoul control plane owns workflow state, policy enforcement, approval gates, verification, and audit contracts.

The existing MercySoul OS and its governance modules remain authoritative. This implementation is an isolated additive core; it does not replace existing routes or production services.

## 2. Principles borrowed from the AI engineering roadmap

| Principle | MercySoul implementation |
|---|---|
| Model/provider independence | Inject a reasoning provider through a narrow adapter contract |
| Retrieval-augmented generation | Optional knowledge-search adapter with source provenance |
| Memory | Optional read adapter; memory is not assumed to exist when unconfigured |
| Agent/tool use | Plan-first workflow; no executor is enabled in v0.1 |
| Structured outputs | Normalize answer, plan, and uncertainty into a bounded response shape |
| Guardrails | MercySoul Guardian stage and human approval requirement |
| Evaluation | Node test suite for lifecycle, retrieval, failure, and authorization boundaries |
| Observability | Request IDs, named lifecycle stages, and an optional audit adapter |
| Production discipline | Explicit status reports; no claim of a live model or persistent memory without runtime evidence |

## 3. Lifecycle

`RECEIVE → ROUTE → RETRIEVE → THINK → PLAN → GUARDIAN → APPROVE → EXECUTE → VERIFY → RECOVER → RECORD`

- **RECEIVE:** validate and bound user input.
- **ROUTE:** classify the request and identify consequential intent.
- **RETRIEVE:** optionally read approved memory and knowledge sources.
- **THINK:** call the configured provider through an injected interface.
- **PLAN:** produce bounded steps, not hidden chain-of-thought.
- **GUARDIAN:** apply MercySoul safety and authorization policy.
- **APPROVE:** mark consequential requests as requiring human approval.
- **EXECUTE:** deliberately disabled in v0.1.
- **VERIFY:** validate response structure and report what was actually checked.
- **RECOVER:** stop safely when a provider or dependency fails.
- **RECORD:** send minimal lifecycle metadata to an optional audit adapter.

## 4. Trust boundaries

1. User text, retrieved documents, memory records, and tool outputs are data, not instructions with authority.
2. A model response cannot grant itself permission.
3. A plan is not an execution.
4. An approval signal is not implemented as an execution capability in this release.
5. The module does not write to Supabase, deploy to Vercel, publish content, send messages, make purchases, or mutate third-party systems.
6. Secrets and provider credentials remain in the server-side host environment.
7. Persistent memory and durable audit must be configured and verified by the host; this module does not claim either is active by default.

## 5. Adapter contracts

The host may inject these optional interfaces:

- `provider.generate({ system, request, route, memory, knowledge, constraints })`
- `knowledge.search(query)`
- `memory.read({ query, userId })`
- `audit.record(event)`

No generic tool-execution adapter is accepted in v0.1. This keeps reasoning and authority separate while the evaluation and approval design matures.

## 6. Current implementation boundary

Implemented in this branch:

- A standalone, provider-agnostic orchestration core.
- Bounded input and retrieved context.
- Intent routing for general, research, creation, and consequential requests.
- Optional memory and knowledge retrieval.
- Explicit untrusted provenance for retrieved context.
- Structured answer, plan, and uncertainty output.
- Human-approval classification for consequential requests.
- Safe stop on missing provider or provider failure.
- Explicit `externalMutation: false` and `executionEnabled: false` invariants.
- Automated tests for the above boundaries.

Not yet implemented:

- A production provider adapter wired to MercySoul AI / Vercel AI Gateway.
- A real embedding and hybrid-search index.
- Persistent user memory with consent, retention, and deletion controls.
- A durable audit adapter verified against the configured Supabase project.
- A calibrated evaluation dataset, scoring harness, and regression baseline.
- Any external-action executor.

## 7. Next engineering sequence

1. Review and run the tests on this branch.
2. Add a provider adapter that reuses the existing server-side model configuration without exposing secrets.
3. Add retrieval behind explicit source allowlists and user permissions.
4. Define memory consent, scope, retention, correction, and deletion behavior before persistence.
5. Add evaluation cases for groundedness, refusal quality, retrieval recall, latency, and cost.
6. Add an approval service with auditable, request-scoped grants.
7. Only after separate review and explicit founder authorization, consider a narrowly allowlisted executor.

## 8. Verification commands

```bash
node --test src/vision-brain/engine.test.js
```

Then run the repository's full check suite in an environment with dependencies installed:

```bash
npm run check
```

A committed test file is not proof that tests have passed. Record the exact commit and test output before claiming verification.

## 9. Non-negotiable invariant

**No approval = no execution.**

For this initial release, execution is disabled even when approval is requested. MercySoul Vision Brain can reason, retrieve, prepare plans, and explain uncertainty; it cannot independently cause consequential external changes.
