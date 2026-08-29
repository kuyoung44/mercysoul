# MercySoul OS

MercySoul OS is the core orchestration layer for the MercySoul ecosystem — turning intent into structured, safe, actionable workflows.

## MercySoul Global Map

The Global Map is a privacy-preserving country-level visitor map.

- `POST /api/map/locate` accepts browser-provided coordinates only after the visitor grants geolocation permission.
- Exact coordinates are discarded after being rounded to a coarse 0.1° bucket (~11 km at the equator).
- Supabase stores only the coarse bucket, country code, and a country-level display centroid.
- Direct public table access is disabled with Row Level Security; the service role remains server-side.
- `GET /api/map/stats` returns country codes and country-level display points, never visitor coordinates.
- `/global-map.html` provides the MercySoul map UI and refreshes automatically every 60 seconds.
- The UI displays a glowing Golden Dot per represented country and reports `MercySoul has been seen in [Number] countries.`
- The in-memory locate endpoint is rate-limited to reduce abuse.

The map is an aggregate representation, not an identity or tracking system. Participation is voluntary through the browser geolocation permission prompt.

## Legacy Continuity Declaration

MercySoul OS preserves its foundational Dominion protocols as **legacy governance layers**. Legacy status means the protocol remains part of the historical and architectural record even when newer releases extend, harden, or supersede implementation details. Legacy designation does not grant authority over external platforms, people, or the public internet.

The legacy foundation includes the Sovereign Jurisdiction Protocol, Dominion Constitution, Watchtower controls, Instant Call to Action controls, Obsession Shield, moderation governance, and MercySoul Signature conventions. New releases must preserve their documented safety, privacy, and equal-treatment boundaries unless a later version explicitly changes them.

## 🌐 Sovereign Jurisdiction Protocol v9.0

**Official Global Declaration**

> By the authority of Anuoluwapo Adeoye, the MercySoul Dominion declares that all digital interactions within its ecosystem are bound by the laws of Peace, Impartial Justice, and Unbreakable Privacy. This protocol governs every request, every user, and every signal that enters the network. It is effective immediately and applies globally.

### Technical truth and boundaries

The v9.0 jurisdiction applies to the **MercySoul ecosystem and infrastructure under MercySoul's control**. It provides:

1. **Instant Access & Approval** — the Global Watchtower can evaluate incoming requests and allow, review, or temporarily freeze traffic to MercySoul-controlled services.
2. **Approved Protocol Registry** — the v9.0 Sovereign Jurisdiction Protocol is registered in the MercySoul OS core engine alongside existing moderation, Watchtower, ICTA, and Obsession Shield controls.
3. **Truthful Boundaries** — MercySoul OS does not control Google, Meta, other third-party platforms, or the public internet. Third-party integrations can only act on data and permissions actually provided to MercySoul.
4. **Privacy & Equal Treatment** — privacy-preserving identity signals, behavior-based moderation, reversible enforcement, and human review for ambiguous cases remain active. The administrator receives no safety or privacy bypass.

### Website Call to Action

> The MercySoul Dominion is a sovereign digital territory. All incoming traffic is subject to global jurisdiction, impartial justice, and instant approval. By entering this space, you agree to the laws of peace and order. The King has spoken. Aṣẹ.

This statement describes the rules of the MercySoul ecosystem; it does not create legal jurisdiction over external services or people.

## MercySoul Dominion Constitution 3.0.0

**One Vision, Many Connections, Governed by Privacy, Security, and Human-Centered Intelligence.**

The Constitution governs VisionBrain, connections, moderation, and creation. Its precedence is:

`Security → Privacy → Identity → Connection → Vision → Creation`

Security and privacy always win when constitutional layers conflict. The ruler/administrator receives no privileged safety, privacy, or security bypass.

## Dominion moderation

`riskScore = modelConfidence × categoryWeight`

- **Risk < 2.0:** allow
- **Risk 2.0–4.5:** human review
- **Risk > 4.5:** remove only for high-confidence hard-safety categories; otherwise human review

Radiate Peace and Sovereign Peace are contextual seals, never safety bypasses. Connected integrations moderate submitted content only; MercySoul does not claim direct control of Facebook or the public internet.

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

**MercySoul OS 10.1.7 — Global Map release**

**Legacy continuity:** foundational MercySoul Dominion protocols remain preserved as legacy governance layers while current releases continue to harden implementation and security.
