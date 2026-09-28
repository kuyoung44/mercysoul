# GitHub Control Plane

MercySoul uses GitHub as the source-controlled automation control plane.

## Selected capabilities

- Source control: Git and Pull Requests
- CI: GitHub Actions
- Deployment gates: GitHub Environments
- Render: deploy hook or Render GitHub integration
- Vercel: Vercel CLI from Actions
- Supabase: Supabase CLI/API from Actions when credentials are configured
- Security: repository security workflows and npm audit
- Knowledge: OBSIDIAN/ vault in Git
- Audit: workflow logs plus MercySoul Engine audit events

## Production secrets

Configure these in the GitHub production environment, never in source:

- RENDER_DEPLOY_HOOK_URL
- VERCEL_TOKEN
- MERCYSOUL_ADMIN_API_TOKEN

Keep provider identifiers as variables where needed.

## Execution discipline

0 — STOP -> 1 — VERIFY -> 0 — CONTROL

Live execution is opt-in through manual workflow dispatch and a protected production environment.

## Principle

GitHub is the durable source, automation runner, review surface, deployment history, and workflow evidence layer. External platforms remain execution targets rather than separate control centers.

GitHub Actions supports environments, deployment approvals, concurrency, and protected secrets, allowing production actions to remain gated and auditable.
