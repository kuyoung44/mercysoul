# Commissioning Checklist

## Network
- [ ] Cable certification/continuity tested
- [ ] Every run labelled at both ends
- [ ] VLANs created
- [ ] Inter-VLAN deny policy tested
- [ ] Guest isolation tested
- [ ] Camera internet egress blocked unless explicitly required
- [ ] VPN remote administration tested

## Compute
- [ ] Proxmox installed
- [ ] Backups configured
- [ ] Home Assistant reachable
- [ ] Frigate records locally
- [ ] TrueNAS snapshots configured
- [ ] Restore test completed

## Power
- [ ] Inverter commissioned by qualified installer
- [ ] Battery BMS communication verified
- [ ] PV protection verified
- [ ] Earthing/surge protection verified
- [ ] Essential-load circuits labelled
- [ ] Grid-failure test completed
- [ ] Low-battery behavior tested

## Resilience
- [ ] Internet failure: local automations continue
- [ ] WAN failure: LAN remains functional
- [ ] AP failure: wired management remains available
- [ ] Camera failure produces alert
- [ ] Storage failure/backup restoration procedure documented
- [ ] Battery reserve behavior verified
