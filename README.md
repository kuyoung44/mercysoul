# MercySoul OS

MercySoul OS is the core orchestration layer for the MercySoul ecosystem — turning intent into structured, safe, actionable workflows.

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
- `GET /api/status` — runtime, Dominion, and Constitution status
- `GET /api/moderation/policy` — active moderation policy
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

**MercySoul OS 3.0.0 — MercySoul Dominion Constitution**
