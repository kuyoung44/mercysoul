# Network Design

## VLANs

| VLAN | ID | Subnet | Purpose |
|---|---:|---|---|
| Management | 10 | 10.44.10.0/24 | OPNsense, switch, AP, hypervisor |
| Trusted | 20 | 10.44.20.0/24 | Phones, PCs, laptops |
| IoT | 30 | 10.44.30.0/24 | Smart-home devices |
| Cameras | 40 | 10.44.40.0/24 | IP cameras |
| Servers | 50 | 10.44.50.0/24 | Home Assistant, TrueNAS, services |
| Guest | 60 | 10.44.60.0/24 | Guest devices |

## Firewall policy

Default: deny inter-VLAN traffic.

Allow:
- Trusted -> Home Assistant: required UI/API ports only
- Home Assistant -> IoT: device-specific protocols only
- Frigate -> Cameras: RTSP/ONVIF as required
- Frigate -> Servers: storage/management as required
- Servers -> Management: only explicit administration flows
- Guest -> Internet: yes
- Guest -> RFC1918/private networks: no
- Cameras -> Internet: deny by default
- IoT -> Trusted: deny
- Cameras -> Trusted: deny

DNS and NTP should be provided locally where practical.

## Addressing

Reserve .1 for the gateway on each VLAN.
Use DHCP reservations for infrastructure.
Keep static addressing documented rather than assigning arbitrary addresses.

## Physical topology

ISP ONT/modem -> OPNsense -> managed PoE switch -> APs/cameras/servers.

All permanent runs terminate at the patch panel. Label both ends.
