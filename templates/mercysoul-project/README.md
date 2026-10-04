# MercySoul Project Template v1.0

Use this template for every new MercySoul repository.

## Before a repository is admitted
Run:

    node scripts/verify-golden-path.mjs

The repository must satisfy every required check or document an approved exception.

## Required files
- README.md
- GOLDEN_PATH.md
- .env.example
- docs/ARCHITECTURE.md
- docs/SECURITY.md
- docs/OPERATIONS.md
- docs/ADMISSION.md
- scripts/verify-golden-path.mjs
- .github/workflows/golden-path.yml

## Required identity
The project must declare:
- name
- owner
- purpose
- scope
- Golden Path version
- deployment target
- persistence target
- production URL when available

## Required control
Every consequential mutation follows:
APPROVE → EXECUTE → VERIFY → RECORD

## Required deployment posture
GitHub is the source of truth.
Vercel is the default deployment target.
Supabase is the default persistence target where durable state is needed.
