# MercySoul Command Center

The Command Center turns a natural-language command into a routed, auditable execution plan.

## API

- GET /api/command-center/status
- POST /api/command-center/plan { "command": "Build the landing page" }
- POST /api/command-center/run { "command": "Check what broke" }
- POST /api/command-center/execute { "task": {...}, "approved": true }

## Agent routing

GitHub handles repository/code work, Vercel handles deployment work, Supabase handles durable data work, Guardian handles verification, Browser handles live UI verification, and the existing MercySoul Agent handles reasoning.

Sensitive operations and live/production operations are paused for explicit approval.

## Runtime adapters

The orchestrator is deliberately separated from provider credentials. The next adapter layer can use GitHub/Vercel/Supabase credentials to perform live mutations while keeping the routing and approval gate stable.
