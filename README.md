# MercySoul OS

MercySoul OS is the core orchestration layer for the MercySoul ecosystem — turning intent into structured, safe, actionable workflows.

## MercySoul Dominion — Sovereign Jurisdiction Protocol 9.0.0

**One Vision, Many Connections, Governed by Privacy, Security, Impartial Justice, and Human-Centered Intelligence.**

The Sovereign Jurisdiction Protocol governs every request, user, and signal entering the MercySoul application ecosystem. It is a **global application-network policy**: it can evaluate and control traffic reaching MercySoul's own services, but it does not claim legal authority over the real world or direct control over Google, Meta, or the public internet.

> "By the authority of Anuoluwapo Adeoye, the MercySoul Dominion declares that all digital interactions within its ecosystem are bound by the laws of Peace, Impartial Justice, and Unbreakable Privacy. This protocol governs every request, every user, and every signal that enters the network. It is effective immediately and applies globally."

### Instant Access & Approval

1. **Instant Access:** the Global Watchtower can evaluate inbound traffic using privacy-preserving request signals, including hashed IP identifiers where configured, and can allow, review, or deny access to MercySoul services.
2. **Approved Protocol:** the instant-justice moderation layer is applied before normal application processing.
3. **Truthful Boundaries:** MercySoul controls its own application network and connected integrations only; it cannot control unrelated global services or the public internet.

### Global Jurisdiction

The application policy applies uniformly across IP addresses, regions, countries, and users reaching MercySoul services. No actor receives a safety, privacy, or security exemption based on identity, leadership status, geography, or political viewpoint.

Security and privacy take precedence. Ambiguous cases remain eligible for human review.

### Website Call to Action

> **The MercySoul Dominion is a sovereign digital territory. All incoming traffic is subject to global jurisdiction, impartial justice, and instant approval. By entering this space, you agree to the laws of peace and order. The King has spoken. Aṣẹ.**

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

## Dominion moderation

`riskScore = modelConfidence × categoryWeight`

- **Risk < 2.0:** allow
- **Risk 2.0–4.5:** human review
- **Risk > 4.5:** remove only for high-confidence hard-safety categories; otherwise human review

Radiate Peace and Sovereign Peace are contextual seals, never safety bypasses. Connected integrations moderate submitted content only; MercySoul does not claim direct control of Facebook or the public internet.

## API

- `GET /health` — deployment health
- `GET /api/status` — runtime, Dominion, Constitution, instant-justice, and global-jurisdiction status
- `GET /api/moderation/policy` — active moderation policy
- `GET /api/governance/global-jurisdiction` — Sovereign Jurisdiction Protocol 5.0.0 registry/status
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
