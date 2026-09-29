# MercySoul Cloud Core

MercySoul Cloud is the portable infrastructure layer for MercySoul applications.

## 0 — Stop → 1 — Verify → 0 — Control

This repository definition keeps the cloud portable and provider-independent. Vercel may deliver frontends, while compute, data, storage, and deployment contracts remain under MercySoul control.

## Core services

- Gateway: HTTPS reverse proxy / ingress
- Compute: Docker containers
- Data: PostgreSQL-compatible database
- Cache/queues: Redis-compatible service
- Storage: S3-compatible object storage
- Observability: health, logs, audit events
- Control plane: MercySoul Command Center
- Security: secrets, authentication, signed service-to-service requests

## Initial topology

```
Internet
   |
DNS / TLS
   |
MercySoul Gateway
   |
+--+-------------------+
|                      |
App containers      Internal APIs
|                      |
+----------+-----------+
           |
     PostgreSQL / Redis
           |
      Object Storage
           |
       Backups
```

## Deployment contract

Every service MUST provide:

- `/health` or an equivalent health check
- structured logs
- explicit environment configuration
- persistent data separated from ephemeral compute
- reproducible container/build definition
- audit events for privileged operations

## Control-plane contract

The Command Center may eventually execute:

`Route → Plan → Approve → Execute → Verify → Record`

No destructive or externally consequential action should execute without an authorization decision and a verification record.

## Phase 1

The first production milestone is deliberately small:

1. Deploy the gateway.
2. Deploy one application container.
3. Attach persistent PostgreSQL.
4. Attach object storage.
5. Add health checks and audit logging.
6. Prove an external request → application → database write → verification → audit record.

Do not attempt to reproduce AWS-scale infrastructure before this path is proven.
