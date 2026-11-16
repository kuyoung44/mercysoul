# MercySoul Humanoid Interface — v0.1

## Product decision
- Appearance: human-form digital character.
- Communication: both text and voice.
- Product role: public-facing digital human interface for MercySoul Vision Brain / MercySoul AI.

## Implemented
- Responsive mobile and desktop layout.
- Human-form illustrated avatar with face, hair, eyes, expression states, and subtle MercySoul styling.
- Text conversation using the verified existing `POST /api/ai/chat` endpoint.
- Service status using the verified existing `GET /api/ai/status` endpoint.
- Browser speech recognition where supported; voice input transcribes into the composer and requires the user to press Send.
- Browser speech synthesis for assistant replies, with a stop-voice control.
- Loading, listening, speaking, and error states.
- Accessible labels, live message region, and reduced-motion support.
- No credentials in browser code.

## Runtime and governance
- Static page: `public/humanoid.html`.
- Serve at `/humanoid.html` using the existing Express static hosting configuration.
- The page uses existing MercySoul AI API routes. It does not add new server routes.
- The AI backend applies its existing preflight and human-judgment policy.
- The interface does not expose tools or execution adapters. No consequential action can be performed from this page.
- Browser speech recognition and synthesis depend on browser/device support and may require microphone permission and HTTPS.

## Honest limitations
- The current face is a CSS illustration, not a photorealistic human or 3D model.
- It is a digital interface, not a physical robot; no sensors, locomotion, or real-world actuation.
- Conversation currently uses ordinary HTTP request/response, not streaming real-time audio.
- Speech synthesis uses the browser's available voice and is not a cloned or custom MercySoul voice.
- No persistent user memory, multi-agent delegation, live lip-sync, or durable avatar identity is added in this release.
- Actual live operation depends on the existing server being deployed and `MERCYSOUL_AI_MODEL` being configured.

## Next engineering stages
1. Test the page on the actual Vercel preview / Express host, including mobile microphone permission and API response behavior.
2. Select a licensed or generated human avatar asset and a 3D renderer (e.g. Three.js/WebGL) after deciding face, voice, and performance targets.
3. Add a low-latency audio transport and streaming speech pipeline with visible listening/consent controls.
4. Add secure session identity, privacy/retention controls, and rate limiting before public rollout.
5. Add agent delegation behind a typed, allowlisted tool gateway. Consequential actions require explicit, scope-bound human approval and independent authorization checks.

## Verification note
The interface files are committed on `feature/mercysoul-humanoid-interface-v0` and fetched back from GitHub. Browser/runtime tests and deployment verification have not yet been run.
