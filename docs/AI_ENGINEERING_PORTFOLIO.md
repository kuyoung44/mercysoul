# MercySoul Dominion — AI Engineering Portfolio

**Founder & Builder:** Anuoluwapo Adeoye  
**Location:** Oyan, Osun State, Nigeria  
**Primary repository:** https://github.com/kuyoung44/mercysoul  
**Project website:** https://mercysoul.vercel.app

## Overview

MercySoul Dominion is a founder-led software initiative. MercySoul OS is its JavaScript orchestration and governance codebase. The engineering focus is practical AI-enabled workflows with explicit authorization, bounded execution, verification, and auditability.

This portfolio describes code and repository configuration inspected in the public repository. It distinguishes implemented source from deployment, runtime, and impact claims that require separate evidence.

## Selected engineering work

### 1. Command orchestration and provider adapters

**Repository evidence:** `src/orchestrator/executor.js`, `src/orchestrator/router.js`, `src/orchestrator/adapters.js`.

The orchestration executor loads a command task, routes the command, resolves provider actions, calls an installed adapter, records progress, and returns structured results. It handles missing adapters and provider errors, and can halt after an error unless configured to continue.

**What this demonstrates:** JavaScript modules, command routing, adapter-based integration design, asynchronous execution, progress reporting, and error handling.

**Boundary:** The presence of an adapter interface does not prove that every provider is configured or that every external action is currently operational.

### 2. Authorization guard for orchestration

**Repository evidence:** `src/orchestrator/guard.js`.

The guard requires a configured `ADMIN_API_TOKEN`, validates a Bearer token, and distinguishes plan-only requests from write-authorized requests. Write authorization is conditional on an explicit `execute: true` request body when the caller opts into write handling.

**What this demonstrates:** server-side credential checks and separation between planning and consequential execution.

**Boundary:** This module is one layer of a larger security design. It should not be described as a complete security audit or proof that every application route enforces the same policy.

### 3. Continuous tool-builder approval and verification tests

**Repository evidence:** `src/sovereign/continuous-tool-builder.js` and `src/sovereign/continuous-tool-builder.test.js`.

The test suite covers project/workspace-bound authorization, pausing for approval before a build, bounded approval, test and independent-verification stages, refusal of generic approval for deployment or external mutation, verification failure, bounded retry limits, and resuming after approval.

The tests assert that the demonstrated tool-building flow reports `externalMutation: false`.

**What this demonstrates:** test-driven development, authorization boundaries, bounded workflows, failure handling, and explicit verification.

**Verification status:** These are test cases present in the repository. Their presence is not a claim that the test suite was executed during preparation of this portfolio. Run `npm test` or `npm run check` to reproduce the checks.

## Technology and development workflow

- JavaScript with ES modules
- Node.js 20 or later (repository package metadata)
- Express and other dependencies declared in `package.json`
- Node.js built-in test runner via `node --test src`
- GitHub Actions workflow at `.github/workflows/ci.yml`
- Vercel project homepage configured in repository metadata

## Reproduce the repository checks

```bash
git clone https://github.com/kuyoung44/mercysoul.git
cd mercysoul
npm install
npm test
npm run check
```

The repository's CI workflow is configured to install dependencies and run `npm run check` on pushes and pull requests targeting `main`. A configured workflow is not itself proof of a passing run; inspect the Actions history for the result of a specific commit.

## Deployment and live-system claims

The repository metadata lists https://mercysoul.vercel.app as the project homepage. This portfolio does not claim that every API, model integration, provider adapter, or governance feature is live in production. Verify a specific deployment and its commit before describing it as deployed.

## Founder contribution

I am the founder and builder of the MercySoul initiative. My work includes defining the product direction, shaping the system architecture and governance principles, developing JavaScript modules, and creating tests and deployment workflows. For any interview or review, I will identify the files and commits I personally authored and explain the exact scope of my contribution.

## Current limitations and next evidence to publish

- Run the repository checks against the current commit and link the CI run.
- Add a short, reproducible demo for a safe, non-destructive workflow.
- Document which model provider is configured in each environment without exposing secrets.
- Link deployment records to the exact source commit.
- Add screenshots and a short architecture diagram based on the current implementation.
- Record measurable user outcomes only when supported by reliable data.

## Contact and project links

- GitHub: https://github.com/kuyoung44
- Repository: https://github.com/kuyoung44/mercysoul
- Project website: https://mercysoul.vercel.app

---

**Portfolio principle:** Show the code, show the test, identify the commit, and state the limits. Do not confuse a planned capability with a verified result.
