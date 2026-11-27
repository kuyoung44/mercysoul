# MercySoul DeepVision Scanner — Prototype

## Purpose
A mobile-first, camera-assisted surface inspection page for the existing MercySoul Dominion site. Optimized for the Samsung Galaxy S21 browser camera, with explicit user-initiated permission and local-only image handling.

## Implemented in this branch
- Rear-camera-first camera access with start, stop and camera switching.
- Manual still capture and local image import (12 MB limit).
- In-memory capture gallery for multiple views.
- Basic image sampling for average brightness, grayscale contrast and local edge signal.
- Explicit statement of limits: no X-ray, through-wall vision, underground detection, invisible-object detection, treasure verification, material authentication, or actual 3D reconstruction.
- No network upload, server endpoint, database write, AI call, analytics, or deployment.

## Device and browser requirements
- HTTPS origin (or localhost) and a browser supporting the camera media API.
- User camera permission.
- Rear camera is requested with environment-facing preference; actual lens selection is browser/device-controlled.
- Good lighting, steady positioning and close focus. The phone may not focus at extreme macro distances.

## Scientific boundaries
A standard RGB camera measures reflected visible light. It cannot directly observe internal structure or objects hidden behind opaque material. Multi-angle photographs can support photogrammetry only when sufficient overlap, stable lighting, calibration and suitable processing are available. This prototype does not calculate depth or generate a 3D mesh.

## Next engineering stage
1. Add an opt-in, user-approved AI vision analysis route with strict file size/type validation and explicit privacy disclosure.
2. Add a guided multi-view capture sequence and image alignment.
3. Evaluate a browser-compatible photogrammetry pipeline or a dedicated reconstruction service.
4. Add secure, time-limited storage only if the founder explicitly approves.
5. Add model confidence, evidence citations and a clear separation between observed facts and hypotheses.

## Governance
This feature is an isolated branch prototype. No production database, secrets, deployment, publishing, merge or external messages are changed. Review and founder approval are required before merge or deployment.
