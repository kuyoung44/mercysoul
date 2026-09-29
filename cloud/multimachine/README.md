# MercySoul Cloud — Multi-Machine Fabric

Production target: a minimum 4-machine cluster with explicit roles and a separate backup target.

## Nodes

| Node | Role | Required |
|---|---|---|
| ms-control-01 | control plane, API gateway, automation | 4 vCPU / 8 GB |
| ms-compute-01 | application workloads | 8 vCPU / 16 GB |
| ms-data-01 | PostgreSQL, Redis, internal data services | 8 vCPU / 32 GB + SSD |
| ms-storage-01 | object storage + backups | 4 vCPU / 16 GB + large SSD/HDD |
| ms-backup-01 | offline/remote backup target | 4 vCPU / 8 GB + storage |

The first four machines form the active fabric. The backup node is not required for initial boot but is required before calling the system production-ready.

## Network

- Management: 10.44.10.0/24
- Services: 10.44.20.0/24
- Storage: 10.44.30.0/24
- Monitoring: 10.44.40.0/24
- No public database ports.
- Only the gateway is Internet-facing.
- Inter-node traffic is private and authenticated.

## Request path

Internet → Gateway → Control/Compute → Data/Storage → Audit

## Operating rule

0 — STOP → 1 — VERIFY → 0 — CONTROL

No deployment is promoted without health verification. No destructive operation is automated without an explicit approval record.

## Bootstrap

1. Install Ubuntu/Debian on each machine.
2. Assign the inventory addresses.
3. Install Docker on compute/control/storage nodes.
4. Harden SSH and firewall rules.
5. Deploy the gateway.
6. Deploy the application service.
7. Deploy PostgreSQL/Redis.
8. Deploy object storage and backups.
9. Run the verification suite.
10. Register the cluster in Command Center.

The repository contains the portable configuration; machine credentials remain outside Git.
