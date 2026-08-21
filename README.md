# MercySoul OS

MercySoul OS is the core orchestration layer for the MercySoul ecosystem — turning a user's intent into a structured, safe, actionable workflow and connecting that workflow to specialized modules.

## Core architecture

- **Vision Brain** — interprets and structures a user's idea, vision, or creative request into clear intent, requirements, and next actions.
- **Creation Engine** — turns structured intent into a creation workflow and coordinates the artwork/creation pipeline.
- **Alignment** — keeps requests aligned with MercySoul's purpose, constraints, and safety rules.
- **Verification & Security** — validates requests and protects the runtime with authentication, headers, rate limiting, and diagnostics.
- **Artwork / Image Pipeline** — manages creation-provider orchestration and artwork persistence.
- **Moderation Gateway** — provides moderation checks before supported content is processed or published.
- **Commerce / CRM boundary** — MercySoul OS can own customer/contact and workflow state, while product sales and subscriptions can be handled by a dedicated commerce layer such as Hercules Commerce.

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

## Optional Datadog tracing

If `dd-trace` is configured in the environment, start with:

```bash
npm run start:traced
```

For Railway, the normal production command remains `node server.js`; a `NODE_OPTIONS=--require=dd-trace/init` environment setting is supported because `dd-trace` is included as a runtime dependency.

## Validation

Run the project's syntax and validation checks with:

```bash
npm run check
npm run health
```

## Current package

MercySoul OS is currently version **2.4.0**.
