# MercySoul Deployment Verification Checklist

**Reference:** MERCY-DIR-2026-0827-001  
**Scope:** MercySoul-controlled application publication and distribution  
**Rule:** A platform is marked `PASS` only after an actual deployment or availability check succeeds. Unverified external accounts are never represented as live.

## Web platforms

| Platform | Required verification | Status |
|---|---|---|
| Render (primary) | Confirm deployed commit and public health/API checks | UNVERIFIED |
| Vercel | Confirm production deployment URL responds successfully | UNVERIFIED |
| Netlify | Confirm production deployment URL responds successfully | UNVERIFIED |
| Cloudflare Pages | Confirm production deployment URL responds successfully | UNVERIFIED |
| GitHub Pages | Confirm Pages is enabled and published URL responds successfully | UNVERIFIED |

## Permanent storage

| Platform | Required verification | Status |
|---|---|---|
| IPFS | Confirm CID returned by the pinning service and retrieve content | UNVERIFIED |
| Arweave | Confirm transaction ID and retrieve content from a gateway | UNVERIFIED |

## Social distribution

| Platform | Required verification | Status |
|---|---|---|
| Facebook | Confirm publication from the authorized account/page | UNVERIFIED |
| Twitter/X | Confirm publication from the authorized account | UNVERIFIED |
| Instagram | Confirm publication from the authorized account | UNVERIFIED |
| LinkedIn | Confirm publication from the authorized account/page | UNVERIFIED |
| WhatsApp | Confirm message/broadcast was actually sent | UNVERIFIED |
| Telegram | Confirm message was actually posted to the authorized channel/group | UNVERIFIED |

## Search/discovery

| Item | Required verification | Status |
|---|---|---|
| Google Search Console | Confirm property ownership and sitemap submission | UNVERIFIED |
| Bing Webmaster Tools | Confirm property ownership and sitemap submission | UNVERIFIED |
| Sitemap.xml | Confirm URL returns valid XML | UNVERIFIED |
| Meta tags | Confirm deployed HTML contains expected metadata | UNVERIFIED |

## Physical/shareable assets

| Item | Required verification | Status |
|---|---|---|
| A4 flyer | Confirm final asset exists and is print-ready | UNVERIFIED |
| QR codes | Decode every QR code and verify its destination | UNVERIFIED |
| Broadcast messages | Confirm approved copy and delivery channel | UNVERIFIED |
| Social posts | Confirm each published URL/post ID | UNVERIFIED |
| Pinned tweets/posts | Confirm pin state on the authorized account | UNVERIFIED |

## Verification rules

1. Never mark an external platform `PASS` solely because credentials or a CLI are configured.
2. Never claim "live everywhere" unless every required platform has independently passed its verification.
3. Missing credentials, unavailable services, or inaccessible accounts are `UNVERIFIED`, not `PASS`.
4. Public announcements must accurately list the platforms that passed and the platforms still unverified.
5. Contact information must be supplied by the legitimate MercySoul operator; do not invent a hotline, email address, or physical office.
6. This checklist describes application distribution only and does not create governmental, police, military, or other external legal authority.
