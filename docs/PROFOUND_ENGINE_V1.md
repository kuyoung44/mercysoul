# MercySoul Profound Engine v1.0

**Purpose:** a reflective reasoning layer for MercySoul OS, not another chatbot and not an autonomous authority.

## What it does
- Frames a goal and separates supplied facts from assumptions.
- Tracks constraints, risks, alternatives, uncertainty, and questions needing clarification.
- Produces a proportionate next-step recommendation.
- Flags potentially consequential actions for explicit authorization and human review.
- Returns a structured JSON-compatible result suitable for a UI, API route, or future agent workflow.

## Current implementation
The engine is exposed by the existing Vercel API dispatcher at `POST /api/profound/reason`; `GET /api/profound/status` reports the engine version and its non-mutating mode. The reason endpoint accepts a JSON object containing `goal` (or `prompt`/`question`), optional `facts`, `assumptions`, `constraints`, `risks`, and `options`. It returns a structured reasoning brief and does not persist request content or execute external actions.

The initial engine is deterministic and dependency-free. It is implemented in `src/profound-engine.js` and covered by `src/profound-engine.test.js`. It does not call an AI provider, read private data, mutate external systems, or claim that an action has been executed.

## Example
```js
import { runProfoundEngine } from './src/profound-engine.js';

const brief = runProfoundEngine({
  goal: 'Choose a safe deployment plan',
  facts: ['The current production site must remain available.'],
  assumptions: ['The new build is compatible.'],
  constraints: ['Use GitHub and Vercel.'],
  options: [
    { title: 'Preview deployment', benefits: ['Isolated validation'] },
    { title: 'Direct production deployment', risks: ['Could affect live users'] }
  ]
});
```

## Governance
The engine follows the MercySoul principle: **respond in proportion to verified facts, never beyond them.** Human judgment remains required. No authority is inferred from a prompt, role, model output, or unverified claim. External mutation is disabled in this core module. Integrations must separately verify identity, permission, scope, approval, and results.

## Lifecycle
`RECEIVE → CLARIFY → SEPARATE_FACTS_AND_ASSUMPTIONS → ASSESS_OPTIONS → RECOMMEND → HUMAN_REVIEW → RECORD`

## Validation
Run `npm test` in the repository. The tests verify empty input handling, fact/assumption separation, and safeguards for high-impact requests.
