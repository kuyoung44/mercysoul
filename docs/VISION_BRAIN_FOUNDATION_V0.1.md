# MercySoul Vision Brain — Foundation v0.1

Status: isolated implementation on `feature/vision-brain-foundation-v0`  
Parent project: MercySoul Dominion / MercySoul OS  
Runtime: Node.js ES modules (Node 20+)  
Production integration: none

## Purpose

Establish the first independently testable Brain layer: receive a request, route intent, produce a bounded plan, apply a Guardian decision, and report the approval boundary.

This is a deterministic foundation, not a claim of general intelligence or a configured LLM.

## Architecture

```text
Request
  |
  v
RECEIVE  -> validate and bound input
  |
  v
ROUTE    -> classify intent
  |
  v
THINK    -> deterministic reasoning rules (v0.1)
  |
  v
PLAN     -> produce a bounded, inspectable plan
  |
  v
GUARDIAN -> block missing scope / require approval for mutations
  |
  v
APPROVE  -> pending human decision where required
  |
  v
EXECUTE  -> DISABLED
  |
  v
VERIFY / RECOVER / RECORD -> report non-execution state and digest
```

## Module contract

- Entry point: `src/vision-brain/index.js`
- `runVisionBrain(request, options)`: returns request ID, intent, plan, Guardian decision, lifecycle statuses, and a digest.
- `visionBrainStatus()`: reports configuration and safety posture.
- No provider, network, filesystem, database, deployment, or external API calls.
- No production routes are added and no existing modules are replaced.
- `executionAllowed` is always false in this release.
- `externalMutation` in the response is always false because this module does not perform mutations; the Guardian separately reports whether the requested intent is consequential.

## Governance

The module follows the MercySoul Golden Path lifecycle:

`RECEIVE → ROUTE → THINK → PLAN → GUARDIAN → APPROVE → EXECUTE → VERIFY → RECOVER → RECORD`

No approval = no consequential execution. Approval is not implemented as a trusted identity workflow in v0.1. It is represented as a pending state only. Production integration requires a separately authenticated, single-use, scope-bound approval mechanism and independent permission checks.

## Local verification

From the repository root:

```bash
node --test src/vision-brain/index.test.js
```

Full regression check:

```bash
npm test
npm run check
```

## Not included

- LLM/provider configuration or prompt orchestration
- Retrieval/RAG or memory
- Durable audit storage
- Human approval UI or identity proof
- Execution adapters
- Express routes, Supabase changes, Vercel deployment, or production configuration

## Next stage

Review this isolated foundation, run the focused and full test suites, then design the model/provider adapter and evidence-grounded context layer as separate modules. Do not integrate or deploy until the founder explicitly approves that stage.
