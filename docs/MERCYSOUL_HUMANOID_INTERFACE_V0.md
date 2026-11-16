# MercySoul Humanoid Interface — v0

## What this is
A responsive, browser-based digital human interface for MercySoul Dominion. It provides a stylized human-like avatar, a conversation console, service-status display, optional browser speech input, and speech synthesis for assistant replies.

## Current integration
- Static page: `public/humanoid.html`
- Open locally at `/humanoid.html` when the existing Express static server is running.
- Uses existing `GET /api/ai/status` for service status.
- Uses existing `POST /api/ai/chat` for text conversations.
- The existing AI service has a governance prompt and does not expose tool execution in this UI.
- The browser uses native SpeechRecognition when available and SpeechSynthesis where available. Browser and device support varies.

## Explicit limitations
- The avatar is a CSS prototype, not a photorealistic 3D human.
- It is not a physical robot and has no body, sensors, locomotion, or real-world control.
- It does not yet have persistent identity, long-term memory, lip-synced animation, streaming speech, or agent delegation.
- AI availability depends on the existing server model configuration.
- No production route, database, secrets, deployment, or existing source files were changed.

## Next stages
1. Run local UI and endpoint checks on this feature branch.
2. Add a real-time conversation transport (WebSocket or WebRTC) only after selecting the hosting/runtime constraints.
3. Add a 3D avatar renderer and expressive animation, with accessible reduced-motion behavior.
4. Connect approved agent capabilities through a typed, allowlisted tool gateway. Each consequential action must require explicit scoped human approval.
5. Add optional voice streaming and synchronized lip movement.
6. Evaluate privacy, retention, rate limits, abuse prevention, latency, and operating cost before public launch.
