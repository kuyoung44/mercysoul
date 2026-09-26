# MercySoul Smart Home

Local-first, resilient residential infrastructure blueprint.

## Core stack
- OPNsense: edge firewall/router
- Managed PoE switch: wired backbone and camera power
- Cat6A: structured cabling
- Proxmox: local virtualization
- Home Assistant: automation
- Frigate: local NVR/video analytics
- TrueNAS: primary storage and backups
- LiFePO4 + hybrid inverter + PV: resilient essential-load power

## Design target
Tier 2 foundation, expandable to Tier 3.

## Build order
1. Survey and circuit/load inventory
2. Cat6A and rack infrastructure
3. OPNsense + switch + AP
4. Proxmox + TrueNAS
5. Home Assistant + Frigate
6. Cameras/sensors
7. Solar/battery/essential-load panel
8. Failure testing and documentation

Never expose cameras, Home Assistant, Proxmox, TrueNAS, or management interfaces directly to the public internet. Use a VPN for remote administration.
