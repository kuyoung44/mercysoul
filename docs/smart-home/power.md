# Power Architecture

## Tier 2 planning target
- 5-6 kW hybrid inverter
- ~10 kWh LiFePO4 storage
- ~4 kW PV array
- Essential-load distribution board
- DC and AC protection
- Proper earthing and surge protection

## Essential loads
1. OPNsense/network
2. Wi-Fi
3. Proxmox/Home Assistant
4. Frigate/security
5. Refrigerator
6. Selected lighting
7. Studio/workstation circuits as load allows

## Operating modes

NORMAL
- Grid + solar + battery according to inverter configuration.

OUTAGE
- Essential-load panel remains energized.
- Nonessential loads are shed.

LOW BATTERY
- Disable discretionary loads.
- Preserve network/security and critical refrigeration.

SOLAR SURPLUS
- Charge battery first according to configured policy.
- Then permit approved discretionary loads.

## Safety
Final inverter, battery, PV string, breaker, cable, earthing, and protection sizing must be calculated from measured loads, equipment datasheets, cable length, fault levels, local electrical requirements, and installer verification. This blueprint is not a substitute for licensed electrical design.
