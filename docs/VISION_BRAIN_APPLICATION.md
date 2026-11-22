# MercySoul Vision Brain application — Origin 44

## What this release adds
A standalone, mobile-first web application at `/vision-brain.html` with:
- A MercySoul Vision Brain chat workspace using the existing `POST /api/vision/async` endpoint.
- A connection indicator based on `GET /api/vision/async/status`.
- Seven domain navigation areas: Origin, Cosmos, Life, Consciousness, Civilization, Intelligence and Legacy.
- Research prompt starters and an illustrative orbital explorer.
- Clear boundaries around AI availability, evidence and human approval.

## Integration
The client calls existing same-origin API routes. It does not embed provider credentials, add dependencies, alter the database, or create a new model provider. AI replies require the existing server-side `OPENAI_API_KEY` and configured `VISION_BRAIN_OPENAI_MODEL`.

## Safety and accuracy
- The interface never claims an action has executed.
- Publishing, spending, deployment, production changes and database mutations remain outside this UI and approval-gated.
- The orbital view is an illustrative animation, not a validated astronomical simulation.
- AI output may be incorrect; important research claims require source verification.
- Conversation history is session-local in the browser and is not persisted by this page.

## Preview and verification
Open `/vision-brain.html` on the preview deployment. Check the layout on a phone, the status indicator, domain navigation, prompt insertion, chat API behavior, keyboard submission and clear-chat control. If the API is not configured, the UI should explain that limitation without exposing credentials.
