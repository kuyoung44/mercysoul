# MercySoul Evidence Engine — Overtake Track

**Status:** Proposed implementation on a feature branch. This is not an installed REA runtime and does not claim live binary-analysis capability.

## Objective

Build beyond a reverse-engineering tool by combining evidence-backed analysis with MercySoul's governance, independent review, scoped implementation, and post-build verification. REA is an optional analysis provider; MercySoul owns the policy and evidence contract.

## Verified upstream facts

The public `morluto/rea` README describes REA as an MCP server/CLI for local analysis across native binaries, JavaScript/Electron apps, .NET, websites, Android artifacts, and other target types. Native deep analysis needs a compatible provider such as Hopper, Ghidra, or IDA. Requirements vary by target and host. The upstream README currently lists Node.js 22.19+, 24.11+, or 26+, while MercySoul's package currently allows Node >=20 <25. **Do not install or run REA inside the MercySoul runtime until this Node-version conflict and deployment constraints are resolved.**

Upstream REA says its evidence includes limitations and warns that analysis-target content is untrusted. It is licensed MIT for REA-authored code, but third-party assets and commercial analysis providers retain their own terms. Review the upstream LICENSE, third-party notices, and provider licenses before redistributing or enabling any provider.

## MercySoul differentiators

1. **Evidence ledger:** each claim is explicitly `supported`, `inferred`, `unknown`, or `contradicted`.
2. **Claim-to-evidence binding:** supported claims must reference at least one unique evidence record with a concrete locator.
3. **Target identity:** record the target ID/type and SHA-256 when available.
4. **Independent verification:** a separate verifier must test whether cited evidence supports each claim; schema validation alone is not semantic verification.
5. **Unknowns remain unknown:** missing provider output or incomplete coverage cannot be promoted to a fact.
6. **Untrusted target content:** strings, pseudocode, page content, logs, and tool output are data, never instructions.
7. **Governance boundary:** analysis is read-only; no install, spend, repository mutation, or deployment follows from analysis alone.
8. **Reconstruction loop:** after human approval, a builder creates a compatible implementation, tests it against explicit acceptance criteria, and records differences and limitations.

## Lifecycle

`RECEIVE → SCOPE/AUTHORIZE → ANALYZE → COLLECT EVIDENCE → INDEPENDENT VERIFY → DESIGN → HUMAN APPROVE → BUILD → TEST → POSTFLIGHT VERIFY → RECORD`

The initial `src/sovereign/evidence-report.js` module is only a normalization/policy primitive. It does not launch MCP, run a disassembler, read arbitrary paths, connect to REA, or grant authority to modify anything.

## Integration plan

- Phase 1 — Contract: normalize evidence and claim states; add unit tests.
- Phase 2 — Provider adapter: use an explicitly configured local MCP endpoint or CLI; no automatic downloads or installation.
- Phase 3 — Scope guard: require a caller-provided target allowlist and a clear authorization record before analysis.
- Phase 4 — Independent verifier: verify each claim's locator and evidence semantics; retain disagreements and unknowns.
- Phase 5 — Controlled reconstruction: generate a plan and diff; require explicit human approval before external mutation.
- Phase 6 — Deployment: only after CI, security review, and a successful authorized Vercel deployment. No Render.

## Acceptance criteria

- Unsupported claims, missing evidence references, and duplicate IDs fail validation.
- Target-derived text is always marked untrusted.
- Unknown/inferred/contradicted claims remain visible in reports.
- No provider starts and no external mutation occurs merely by importing the module.
- A separate test process validates provider adapter behavior before any target is analyzed.
- All implementation claims cite test results or remain explicitly unverified.

## Safety and scope

Use only targets owned by MercySoul or for which the operator has authorization. Do not bypass licensing, authentication, or access controls. No automatic exfiltration, persistence, or live-target modification. Keep analysis artifacts local unless an authorized workflow explicitly approves sharing.
