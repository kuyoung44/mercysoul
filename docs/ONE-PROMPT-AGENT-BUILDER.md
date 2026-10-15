# MercySoul Vision Brain: One-Prompt AI Agent Builder

## Goal
A user gives MercySoul Vision Brain one natural-language prompt. The engine converts it into a structured agent specification, requests scoped human approval, delegates artifact generation to a configured adapter, runs tests, and independently verifies the result.

## Flow
`ONE PROMPT → SPECIFY → REVIEW/APPROVE → GENERATE → TEST → INDEPENDENT VERIFY → RECORD`

## Adapter contract
- `analyzePrompt({ prompt, project, workspace, scope })` returns `{ ok: true, spec }`.
- `generateAgent({ spec, project, workspace, scope })` returns `{ ok: true, artifact }`.
- `testAgent({ spec, artifact })` returns `{ ok: true, evidence }`.
- `verifyAgent({ spec, artifact, testEvidence, policy })` returns `{ ok: true, evidence }`.

Adapters are injected and untrusted. The module does not ship a model provider, execute generated code, install dependencies, mutate repositories, or deploy. A host must provide a sandboxed generator and test runner and persist audit records durably before production use.

## Governance
- Authorization is bound to an exact project and workspace.
- Human approval is required before agent generation.
- A failed test or independent verification pauses the mission.
- Building an artifact does not authorize integration, external actions, or deployment.
- Generated agents must preserve human judgment and require separate authorization for consequential external actions.
- The result reports `externalMutation: false`; this means this orchestrator performs no external mutation itself, not that arbitrary adapters are automatically safe.

## Test
Run `node --test src/sovereign/prompt-to-agent.test.js` on Node 20+.
