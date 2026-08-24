# MercySoul OS

MercySoul OS is the core orchestration layer for the MercySoul ecosystem — turning a user's intent into a structured, safe, actionable workflow and connecting that workflow to specialized modules.

## Core architecture

- **Vision Brain** — interprets and structures a user's idea, vision, or creative request into clear intent, requirements, and next actions.
- **Creation Engine** — turns structured intent into a creation workflow and coordinates the artwork/creation pipeline.
- **Alignment** — keeps requests aligned with MercySoul's purpose, constraints, and safety rules.
- **Verification & Security** — validates requests and protects the runtime with authentication, headers, rate limiting, and diagnostics.
- **Artwork / Image Pipeline** — manages creation-provider orchestration and artwork persistence.
- **Moderation Gateway** — provides moderation checks before supported content is processed or published.
- **MercySoul Dominion Auto Metric** — applies a weighted risk score (`confidence × category weight`) with instant allow/review/remove routing for submitted app/web content.
- **Commerce / CRM boundary** — MercySoul OS can own customer/contact and workflow state, while product sales and subscriptions can be handled by a dedicated commerce layer such as Hercules Commerce.

## Dominion moderation

The moderation policy uses category weights from 0–10:

- **Risk < 2.0:** allow
- **Risk 2.0–4.5:** human review
- **Risk > 4.5:** automatic removal for high-confidence hard-safety categories; otherwise human review

The current repository includes a deterministic local classifier boundary so the API is usable immediately. An ONNX/DistilBERT model can be connected later without changing the moderation contract.

Political and leadership discourse can receive the **Sovereign Peace** contextual seal, but it is not exempt from safety review and the moderation policy remains viewpoint-neutral.

### API

- `GET /health` — deployment health check
- `GET /api/status` — MercySoul OS and Dominion status
- `GET /api/moderation/policy` — active Dominion policy
- `POST /api/moderate` — moderate app/post content
- `POST /api/moderate/web` — moderate content submitted by a web integration

Example request:

```json
{
  "content": "Let peace guide this community.",
  "source": "my-app"
}
```

The gateway evaluates content submitted by connected applications/integrations. It does not claim direct control over Facebook or the public internet without an authorized integration.

## Runtime

Requires Node.js 20+.

```bash
npm install
npm start
```

Health check:

```bash
npm run health
```

The health URL can be overridden with `MERCYSOUL_HEALTH_URL`.

## Environment

Production deployments should provide the required Supabase configuration and enable durable persistence where required:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `REQUIRE_DURABLE_PERSISTENCE=true`

Never commit service-role keys or other secrets to the repository.

## Validation

Run the project's checks with:

```bash
npm run check
npm test
```

## Current package

MercySoul OS is currently version **2.5.0**.
