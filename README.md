# MercySoul OS

MercySoul OS is the core orchestration layer for the MercySoul ecosystem — turning intent into structured, safe, actionable workflows.

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

## Dominion moderation

`riskScore = modelConfidence × categoryWeight`

- **Risk < 2.0:** allow
- **Risk 2.0–4.5:** human review
- **Risk > 4.5:** remove only for high-confidence hard-safety categories; otherwise human review

Radiate Peace and Sovereign Peace are contextual seals, never safety bypasses. Connected integrations moderate submitted content only; MercySoul does not claim direct control of Facebook or the public internet.

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

**MercySoul OS 9.0.0 — Sovereign Jurisdiction Protocol**
