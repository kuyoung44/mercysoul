# MercySoul SI — Private Factory CTA

## Decision
Use a hosted-workspace request flow rather than a public Vercel repository-clone button. The public MercySoul OS repository remains an interface repository; private engine logic and provider credentials must be kept server-side.

## Current implementation
- The MercySoul OS homepage links to /si-factory.html.
- The request page opens a prefilled WhatsApp setup request for the customer to review and send.
- No customer API keys, BVN, NIN, passwords, or other sensitive credentials are collected by the page.
- The page explicitly states that clicking the CTA requests setup; it does not claim automatic deployment or workspace provisioning.

## Security and production requirements
1. Keep the engine in a private repository or protected server-side service.
2. Store provider keys only in protected Vercel environment variables; never ship them to browser code.
3. Add authenticated workspace provisioning with least-privilege authorization, tenant isolation, rate limits, audit events, and human approval for consequential actions.
4. Verify the backend, auth, persistence, tests, and production deployment before advertising instant provisioning.
5. Do not add a public Vercel clone link to a public repository as a source-protection measure.

## Status
Front-end request path only. Automated provisioning, private production engine, and live deployment have not been verified by this change.
