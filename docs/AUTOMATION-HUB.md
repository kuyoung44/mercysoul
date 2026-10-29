# MercySoul Vision Brain Automation Hub

## Prototype delivered
- Mobile-first dashboard at `/command-center.html`.
- Facebook/Instagram draft composer, browser-local review queue, local approval labels, and JSON export.
- Clear labels for Metricool, Canva, Gmail, and analytics integration readiness.
- No external publish, email-send, ad-spend, or scheduling action is implemented.
- Drafts and approvals are browser-local, not durable or shared across devices.

## Security and governance requirements
- Never expose provider tokens in HTML or client JavaScript.
- Add authenticated sessions and server-side authorization before account access.
- Store secrets only in server environment variables or managed secret storage.
- Use durable database records for drafts, approval events, actor, timestamp, content hash, destination, and idempotency key.
- Approval must be bound to exact copy, media, destination, and schedule; any change invalidates approval.
- Add audit logs and read-only provider health checks before write endpoints.
- Do not treat ChatGPT connector access as website OAuth/API credentials.

## Next steps for real integrations
1. Configure secure website login.
2. Configure Metricool API access or supported OAuth for Facebook/Instagram, server-side only.
3. Configure Canva OAuth for design lookup/import.
4. Configure Gmail OAuth with least-privilege scopes; draft-only until separately approved.
5. Add durable storage and access policies for integrations, drafts, approvals, and audit events.
6. Implement read-only status endpoints and verify actual identities/permissions.
7. Use Metricool's create-for-review workflow where supported; no publish endpoint without separate explicit approval.
8. Test unauthorized access, CSRF, replay/idempotency, stale approval, changed content, and missing credentials.
9. Deploy only after review and explicit approval.

## Verification evidence
- Existing repo and routing inspected before changes.
- This page makes no provider API calls; local draft content is HTML-escaped before display.
- No secrets, publish calls, email sends, purchases, or account changes are included.
- Deployment is not part of this branch change.
