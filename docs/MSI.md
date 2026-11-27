# MercySoul Intelligence (MSi)

## Product principle
**Intelligence should be as common as common sense.**

MSi is the MercySoul intelligence experience for making useful reasoning understandable, practical, principled, and accessible.

## First release
The first web experience lives at `/msi/` and includes:
- Mobile-first black-and-gold interface aligned with MercySoul Dominion.
- Four pillars: Common, Practical, Principled, Creative.
- Prompt starters for problem-solving, comparing options, project planning, and plain-language learning.
- Conversation UI connected to the existing `POST /api/personal/chat` endpoint.
- A service-status check against `GET /api/personal/status`.
- Client-side text rendering (no HTML injection from assistant replies).
- A session identifier held in sessionStorage; conversation history itself is handled by the existing server service.

## Governance and limitations
- This interface does not itself create general intelligence or guarantee correct answers.
- The existing server model configuration determines whether substantive AI responses are available.
- The UI never claims external actions were executed; consequential actions remain outside this chat and require the existing authorization path.
- Do not put API keys or other secrets in browser code.
- Avoid collecting unnecessary personal information. Do not enter passwords or payment credentials.
- The existing personal chatbot stores only a bounded recent conversation history in process memory; this is not durable cross-deployment memory.

## Verify before release
1. Run `npm run check` and `npm test`.
2. Confirm `GET /api/personal/status` responds.
3. Confirm `POST /api/personal/chat` returns a reply when the model is configured and a safe fallback when it is not.
4. Open `/msi/` on mobile and desktop; verify prompt buttons, loading state, error state, and keyboard submission.
5. Verify no secrets are included in the static HTML.
6. Deploy to preview first; production promotion requires separate confirmation.
