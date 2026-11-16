# MercySoul Humanoid Interface — 3D + Realtime Voice v0.2

## Product decision
- Appearance: human-form digital character.
- Communication: text and full-duplex voice.
- Product role: human-facing interface for MercySoul Dominion and Vision Brain.
- Development branch: `feature/mercysoul-humanoid-interface-v0`.

## Implemented in this isolated branch

### 3D avatar
- `public/humanoid-3d.js` renders a procedural 3D human-form character with Three.js/WebGL.
- Includes a head, face details, hair, neck, shoulders, torso, arms, gold identity elements, lighting, idle motion, blink, and speaking/listening/thinking states.
- Responsive canvas sizing and a simple accessible fallback when WebGL or the external Three.js module is unavailable.
- Uses a pinned Three.js CDN module; a production build should vendor/pin the dependency locally after bundle and performance checks.
- This is a stylized procedural 3D character, not a photorealistic scan, imported rigged human model, or physical robot. Mouth movement currently follows the speaking state, not phoneme-level lip sync.

### Text-to-Brain connection
- Text messages now call `POST /api/vision/async`.
- The existing Vision Brain Responses API flow is used instead of the older generic `/api/ai/chat` endpoint.
- The UI reads `outputText` and falls back to structured output text when necessary.

### Realtime voice-to-Brain connection
- `src/vision-brain/realtime-session.js` creates a Realtime WebRTC answer using the server-side `OPENAI_API_KEY`.
- `POST /api/vision/realtime/session` accepts a bounded SDP offer, builds the Realtime session server-side, and returns the SDP answer. The standard API key is never sent to the browser.
- Realtime session model: `gpt-realtime-2.1`; voice: `marin`.
- The Realtime session exposes one function only: `vision_brain_turn`.
- The voice model is instructed to call that function for each user turn. The browser forwards the utterance to `POST /api/vision/async`, then returns the Brain response to the Realtime session for spoken delivery.
- The Realtime endpoint has an in-memory limit of five session starts per IP per ten-minute window.
- The microphone is requested only after the user presses Start voice. End voice closes the peer connection and releases local microphone tracks.
- No external-action tool is available in the Realtime session.

## Governance boundary
- Voice and text are interfaces, not execution authority.
- The voice model has no tools for deployments, payments, messages, database writes, device control, or other external mutations.
- The only exposed function routes a request to the existing Vision Brain status/reasoning workflow.
- Existing Vision Brain async tool allowlist remains limited to read-only MercySoul status retrieval.
- No production database schema, RLS, grants, secrets, or deployment settings were changed.
- No merge or deployment was performed.
- Existing deterministic Vision Brain foundation `src/vision-brain/index.js` remains separate from the model-backed async route; this iteration connects the humanoid to the existing model-backed Vision Brain route, not to a new orchestration of the deterministic foundation.

## Required runtime configuration
- Node.js 20+.
- `OPENAI_API_KEY` configured server-side for Realtime voice and the existing Vision Brain async agent.
- `VISION_BRAIN_OPENAI_MODEL` configured or its repository default accepted.
- HTTPS and a browser/device that supports WebRTC, microphone capture, and audio playback.
- Network access to the pinned Three.js CDN module for the 3D renderer.

## Verification status
- Added automated tests for Realtime session rate limiting and status disclosure.
- Source files were committed to the isolated feature branch and must be fetched back for verification.
- Browser/WebRTC end-to-end tests, mobile microphone tests, provider billing checks, and full `npm test` / `npm run check` have not yet been run in a live runtime.
- Public operation is not confirmed until the branch is previewed with the required environment configuration.

## Next verification steps
1. Run `npm test` and `npm run check` in a Node 20+ checkout.
2. Test the avatar on a low-memory mobile device and verify CDN availability and reduced-motion behavior.
3. Test microphone permission, WebRTC connection, interruption, reconnect, audio output, and tool-call failure paths.
4. Add authenticated user/session identity, persistent rate limiting, privacy disclosures, and spend limits before public release.
5. Evaluate a licensed rigged human model and phoneme-level lip sync as a separate quality milestone.

## Deployment policy
This branch is a development artifact only. Do not merge or deploy without the founder's explicit approval.
