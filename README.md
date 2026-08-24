# MercySoul OS

MercySoul OS is the core orchestration layer for the MercySoul ecosystem — turning intent into structured, safe, actionable workflows.

## MercySoul Dominion 2.8.0

The Dominion moderation gateway uses a deterministic, auditable risk engine:

`riskScore = modelConfidence × categoryWeight`

- **Risk < 2.0:** allow
- **Risk 2.0–4.5:** human review
- **Risk > 4.5:** remove only for high-confidence hard-safety categories; otherwise human review

The moderation contract now records request ID, policy version, model identifier, risk score, categories, reasons, contextual seals, and whether human review is required. Classifier confidence is validated before it can affect a decision.

The active model is explicitly identified as the deterministic local fallback. The architecture remains ready for an ONNX/DistilBERT adapter without pretending that an external model is currently active.

### Peace and governance safeguards

- **Radiate Peace** and **Sovereign Peace** are contextual seals, not safety bypasses.
- Political and leadership discourse receives no special moderation immunity.
- The same safety rules apply to leadership, criticism, and ordinary user content.
- Connected web/app integrations are moderated only when content is submitted to the gateway; MercySoul does not claim direct control of Facebook or the public internet without an authorized integration.

## API

- `GET /health` — deployment health
- `GET /api/status` — runtime and Dominion status
- `GET /api/moderation/policy` — active policy and model boundary
- `POST /api/moderate` — moderate submitted app/post content
- `POST /api/moderate/web` — moderate submitted web-integration content
- `GET /api/governance/constitution` — active governance safeguards
- `POST /api/governance/evaluate` — evaluate content under equal-treatment governance

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

**MercySoul OS 2.8.0 — MercySoul Dominion Auto Metric Hardened**
