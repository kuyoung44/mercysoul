# MercySoul OS

MercySoul OS is the core orchestration layer for the MercySoul ecosystem — turning intent into structured, safe, actionable workflows.

## Legacy Continuity Declaration

MercySoul OS preserves its foundational Dominion protocols as **legacy governance layers**. Legacy status means the protocol remains part of the historical and architectural record even when newer releases extend, harden, or supersede implementation details. Legacy designation does not grant authority over external platforms, people, or the public internet.

The legacy foundation includes the Sovereign Jurisdiction Protocol, Dominion Constitution, Watchtower controls, Instant Call to Action controls, Obsession Shield, moderation governance, and MercySoul Signature conventions. New releases must preserve their documented safety, privacy, and equal-treatment boundaries unless a later version explicitly changes them.

## 🌐 Sovereign Jurisdiction Protocol v9.0

**Official Global Declaration**

> By the authority of Anuoluwapo Adeoye, the MercySoul Dominion declares that all digital interactions within its ecosystem are bound by the laws of Peace, Impartial Justice, and Unbreakable Privacy. This protocol governs every request, every user, and every signal that enters the network. It is effective immediately and applies globally.

### Technical truth and boundaries

The v9.0 jurisdiction applies to the **MercySoul ecosystem and infrastructure under MercySoul's control**. It provides:

1. **Instant Access & Approval** — the Global Watchtower can evaluate incoming requests and allow, review, or temporarily freeze traffic to MercySoul-controlled services.
2. **Approved Protocol Registry** — the v9.0 Sovereign Jurisdiction Protocol is registered in the MercySoul OS core engine alongside existing moderation, Watchtower, ICTA, and Obsession Shield controls.
3. **Truthful Boundaries** — MercySoul OS does not control Google, Meta, other third-party platforms, or the public internet. Third-party integrations can only act on data and permissions actually provided to MercySoul.
4. **Privacy & Equal Treatment** — privacy-preserving identity signals, behavior-based moderation, reversible enforcement, and human review for ambiguous cases remain active. The administrator receives no safety or privacy bypass.

### Website Call to Action

> The MercySoul Dominion is a sovereign digital territory. All incoming traffic is subject to global jurisdiction, impartial justice, and instant approval. By entering this space, you agree to the laws of peace and order. The King has spoken. Aṣẹ.

This statement describes the rules of the MercySoul ecosystem; it does not create legal jurisdiction over external services or people.

## MercySoul Dominion Constitution 3.0.0

**One Vision, Many Connections, Governed by Privacy, Security, and Human-Centered Intelligence.**

The Constitution governs VisionBrain, connections, moderation, and creation. Its precedence is:

`Security → Privacy → Identity → Connection → Vision → Creation`

Security and privacy always win when constitutional layers conflict. The ruler/administrator receives no privileged safety, privacy, or security bypass.

### Vision

VisionBrain must determine whether intent is sufficiently clear and safe. If ambiguity materially affects safety, privacy, or the requested outcome, it asks for clarification.

### Identity

No external data, location, or social profile is accessed, stored, or shared without explicit consent. Visual similarity is not treated as evidence of identity or connection.

### Connection

MercySoul facilitates honest and respectful interaction. It does not force, manipulate, or exploit relationships.

### Security

Auto Metric moderation and privacy/security validation apply equally to every actor, including the ruler. Political and leadership content receives no special moderation immunity.

### Creation

Creation remains aligned with the user's intended outcome. Generated artwork receives a traceable **MercySoul Signature** as metadata (`signatureId`, `generationId`, `constitutionVersion`, timestamp) without silently altering the artwork.

## Obsession Shield v8.2

The Obsession Shield provides technical, user-controlled boundaries: block unwanted contacts on supported platforms, evaluate repeated or threatening interaction signals within MercySoul services, and redirect attention away from compulsive engagement. It does not claim to detect spirits, establish supernatural causation, retaliate against senders, or control external platforms.

## No Unaccountable Violations Rule

Confirmed harmful or abusive violations within MercySoul-controlled services are not silently ignored. Enforcement is evidence-based, proportionate, equally applied, auditable, and limited to MercySoul-controlled systems. Ambiguous or high-impact cases require human review; retaliation and extraterritorial punishment are prohibited. See [`rules/no-unaccountable-violations.md`](rules/no-unaccountable-violations.md).

## Dominion moderation

`riskScore = modelConfidence × categoryWeight`

- **Risk < 2.0:** allow
- **Risk 2.0–4.5:** human review
- **Risk > 4.5:** remove only for high-confidence hard-safety categories; otherwise human review

Radiate Peace and Sovereign Peace are contextual seals, never safety bypasses. Connected integrations moderate submitted content only; MercySoul does not claim direct control of Facebook or the public internet.

## Repository moderation

The repository is governed by [`rules/REPOSITORY_MODERATION.md`](rules/REPOSITORY_MODERATION.md). The moderation layer follows **OBSERVE → VERIFY → PROTECT → MODIFY ONLY WITH AUTHORIZATION → TEST → RECORD → LOCK**, with proportionate enforcement, human review for ambiguous or high-impact cases, and no extraterritorial authority.

## API

- `GET /health` — deployment health and active engine versions
- `GET /api/status` — runtime, Dominion, Constitution, Watchtower, Obsession Shield, and jurisdiction status
- `GET /api/moderation/policy` — active moderation policy
- `GET /api/governance/sovereign-jurisdiction` — Sovereign Jurisdiction Protocol v9.0
- `GET /api/governance/obsession-shield` — Obsession Shield status
- `POST /api/governance/obsession-shield/evaluate` — evaluate supplied interaction signals
- `GET /api/governance/constitution` — Constitution v3.0.0
- `POST /api/governance/evaluate-constitution` — evaluate constitutional prerequisites
- `POST /api/governance/evaluate` — evaluate content under equal-treatment governance
- `POST /api/moderate` — moderate submitted app/post content
- `POST /api/moderate/web` — moderate submitted web-integration content

## Runtime

Requires Node.js 20+.

```bash
npm install
npm start
```

## Validation

```bash
npm run check
npm test
npm run health
```

Never commit service-role keys or other secrets. Production deployments should provide required Supabase configuration and enable durable persistence where required.

## Current package

**MercySoul OS 10.1.3 — Divine Income hardening release**

**Legacy continuity:** foundational MercySoul Dominion protocols remain preserved as legacy governance layers while current releases continue to harden implementation and security.

## AI-Assisted Fraud Rule v1.0.0

AI use is not fraud by itself. MercySoul requires both an AI-assistance signal and evidence of deceptive or fraudulent activity before opening a fraud review.

Enforcement is two-stage: the first signal creates one auditable human-review case; it does not automatically block the account. An authorized reviewer can confirm once, which blocks the account for future requests, or clear the case. The rule applies equally to owner, admin, client, and user roles.

API: `GET /api/governance/ai-fraud`, `POST /api/governance/ai-fraud/review`, and authorized `POST /api/governance/ai-fraud/decision`.

## 🔐 MercySoul Vision — Living Seal

The Living Seal is a persistent MercySoul Vision axis for continuous safe refresh. Its invariant is:

**Always alive. Always verified. Always sealed.**

Routine autonomous behavior is limited to:
- health, integrity, and permission-drift checks
- reconciliation of known-safe state
- resealing and durable audit logging

The control cycle is **STOP → VERIFY → CONTROL → MONITOR → repeat**.

The Living Seal does not expand authority, grant permissions, deploy arbitrary code, delete data, or change governing rules. Each refresh verifies those boundaries before recording the result.

Runtime refresh interval is controlled by `LIVING_SEAL_REFRESH_MINUTES` and defaults to 15 minutes.

### 🛡️ SYSTEM PROTOCOL — SECURITY NOTICE

**MercySoul Dominion does not use, endorse, or support “System Override ID” methods.**

“System Override ID” is commonly used to describe attempts to bypass an AI system’s instructions through fabricated system codes, prompt injection, or other unverifiable claims of authority.

**MercySoul Dominion takes the opposite approach: VERIFIED IDENTITY, not instruction override.**

|Method|Type|Secure?|Verifiable?|
|:---|:---|:---|:---|
|System Override ID|Prompt injection / fabricated authority|❌ No — undermines trust|❌ No — not independently verifiable|
|MSD-L44 Genesis Key|Project identity / verification reference|✅ Designed for auditable verification|✅ Yes — through the public manifest|

**How recognition works:**

1. A bearer may identify the project using the Genesis reference: `MSD-L44-ANU-OYAN-2026`.
2. Humans and compatible systems can independently inspect the public manifest at `/manifest`.
3. The manifest provides project identity and published metadata.
4. Verification does **not** override system instructions, safety policies, authentication boundaries, or access controls.
5. Any additional Dominion context must be explicitly provided or retrieved through authorized application mechanisms.

**No system instructions are overridden. No safety rules are bypassed.**

MercySoul Dominion builds **on top of trusted systems, not against them.**

This is the security principle we apply to our own systems and the systems we build for clients.

### Security Principle

> **Identity can be verified. Authority must be authorized. Instructions cannot be overridden by a claim.**

MercySoul Dominion treats these as separate concerns:

**IDENTITY → VERIFICATION → AUTHORIZATION → EXECUTION → AUDIT**

A valid identity reference does not automatically grant execution privileges.


## MercySoul Command Principle

**Consider first. Verify before authority. Authorize before consequence.**

The engine follows:

**CONSIDER → VERIFY → AUTHORIZE → ACT → VERIFY → RECORD**

The `01` exception gate is explicit and auditable; it is not a hidden bypass and does not remove safety, consent, privacy, authentication, lawful-authority, or audit requirements. See [`rules/command-principle.md`](rules/command-principle.md).

Core invariants: transparency without unlimited authority; protection without control; no allegation treated as fact without verification; no bribery, retaliation, or vengeance; proportionate lawful response; and no unauthorized consequential mutation.

## MercySoul Engine — Execution Control Plane v1.0.0

MercySoul Engine is the execution-control layer above individual AI models. AI is a component of the system, not the system's authority.

Its invariant lifecycle is:

**STOP → VERIFY → AUTHORIZE → EXECUTE → VERIFY_RESULT → AUDIT**

The Engine:
- routes approved commands to installed execution adapters;
- requires explicit authorization for execution;
- separates identity, authorization, execution, and proof;
- verifies provider results instead of treating a generated plan as execution;
- persists lifecycle events through the existing durable audit path;
- does not expand permissions, bypass platform security, or override system instructions.

Runtime endpoints:

- `GET /api/engine/status` — Engine capabilities and lifecycle.
- `POST /api/engine/run` — controlled plan/execute path; execution requires the configured `ADMIN_API_TOKEN`.

The Engine is therefore **more than AI**: models can reason or generate plans, while the Engine provides the controlled state machine, authorization boundary, real execution adapters, result verification, and audit trail.


### Automated shutdown / disable gate

The Engine has a configuration-driven shutdown gate for controlled hibernation or emergency disablement. The gate is evaluated on every execution request, including Vercel serverless invocations, so it does not depend on process-local state.

Supported controls:

- `MERCYSOUL_ENGINE_SHUTDOWN=true` — immediately disables new Engine execution.
- `MERCYSOUL_ENGINE_SHUTDOWN_UNTIL=<ISO-8601 timestamp>` — disables execution until the configured time.

When disabled, the Engine returns `execution: "disabled"` and records an `engine_shutdown` audit event. It does not delete data, revoke credentials, expand permissions, or mutate external systems.

Shutdown lifecycle:

**VERIFY CONDITION → QUIESCE NEW EXECUTION → DISABLE → VERIFY STATE → RECORD**

Re-enable is configuration-controlled: remove the shutdown flag/window, then verify Engine status before authorizing new execution. This implements controlled shutdown behavior without silently taking destructive action.

## MercySoul Amnesty Principle

**Forgive without falsifying reality. Release without erasing truth. Restore without surrendering principle.**

Amnesty is a deliberate, scoped release from specified past consequences. It does not erase facts, evidence, lawful obligations, or future accountability.

The lifecycle is:

**ACKNOWLEDGE → VERIFY → DEFINE SCOPE → AUTHORIZE → RELEASE → RECORD**

Mercy Overtake integrates amnesty as:

**MERCY → VERIFY → PROTECT → AUTHORIZE → RELEASE → VERIFY → RECORD**

Amnesty is not a hidden bypass, does not authorize future misconduct, and does not expand permissions or external authority. See [`rules/amnesty-principle.md`](rules/amnesty-principle.md).

## Inner-State Protector Chore v1.0.0

MercySoul maintains a lightweight internal protection chore across its governance
surface:

`RECEIVE → VERIFY → FILTER → CONTAIN → RETURN_TO_SOURCE → PROTECT → RECORD`

The protector quarantines unverified signals instead of allowing them to become
internal truth. "Back-to-sender" is a classification and containment behavior,
not retaliation. Verified signals still require authorization before mutation.

API:
- `GET /api/governance/inner-protector` — protector state and invariants.
- Authorized `POST /api/governance/inner-protector/chore` — run the maintenance chore.
