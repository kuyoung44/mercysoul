# Proxmox Layout

## Initial host
Target: 8+ CPU threads, 64 GB RAM preferred, mirrored NVMe for host/VM storage.

## VM/service plan

| Guest | Role | Suggested starting resources |
|---|---|---|
| HA | Home Assistant | 2 vCPU / 4 GB |
| FRIGATE | NVR/analytics | 4 vCPU / 8 GB + accelerator |
| MON | monitoring | 2 vCPU / 2-4 GB |
| UTIL | MQTT/DNS/utility services | 2 vCPU / 2 GB |
| DEV | development/AI workloads | sized as needed |

Keep TrueNAS on dedicated storage hardware where possible. Do not make the only copy of NAS data depend on the Proxmox host.

## Backup
- Proxmox configuration backup
- VM snapshots only as short-term rollback
- Application-aware backups for important data
- TrueNAS snapshots
- Secondary/offline backup
- Periodic restoration test
