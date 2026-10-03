# MercySoul Developer Platform

MercySoul Developer Platform is the secure AI-powered development layer for the MercySoul ecosystem.

Mission: build, scale, and deliver software through verified AI-assisted workflows without giving the model authority over the system.

Core lifecycle:
RECEIVE → ROUTE → THINK → PLAN → GUARDIAN → APPROVE → EXECUTE → VERIFY → RECOVER → RECORD

Consequential-operation gate:
PAUSE → VERIFY → PROTECT → ACT → VERIFY → RECORD

Platform layers:
1. Developer Interface — GitHub repository workflows, GitHub CLI / Copilot CLI, pull requests, issues, checks, and review artifacts.
2. AI Reasoning Layer — planning, code generation, repository analysis, test/debug assistance, and agentic workflows.
3. MercySoul Guardian — scope, authorization, permission-drift, and consequential-mutation checks.
4. Execution Adapters — GitHub, Supabase, Vercel, and other explicitly registered adapters.
5. Verification and Audit — tests, builds, deployment status, post-action verification, and durable audit records.

Security invariants:
- AI is a reasoning component, not the authority.
- Identity does not imply authorization.
- No arbitrary shell or network command execution from untrusted input.
- No secrets in prompts, source files, device automation, or logs.
- External mutation is false by default.
- Registered-server-adapter-only execution.
- No permission expansion during routine operation.
- No retaliation or escalation.
- When facts are uncertain, preserve safety and evidence and pause judgment.
- Never claim success without independently verifiable evidence.

Delivery loop:
PLAN → REVIEW → APPROVE → IMPLEMENT → TEST → VERIFY → AUDIT

Failed verification:
RECOVER → STOP

Deployment boundary:
The platform is designed for the existing MercySoul Vercel/Supabase stack. It does not grant control over third-party systems beyond credentials and permissions explicitly configured by the operator.