# MercySoul Vision Brain — Public Demo Specification

## Objective

Create a mobile-first public demo that shows a visitor how MercySoul Vision Brain turns a user request into a thoughtful, structured response. Keep the initial demo safe, transparent, and non-destructive.

## Demo flow

1. **Input:** visitor enters a goal, creative prompt, or business question.
2. **Analyze:** system identifies the intent and relevant context.
3. **Plan:** system presents a structured approach or draft.
4. **Guard:** system checks the request for clarity, safety, and whether it asks for consequential action.
5. **Review:** visitor sees the proposed response or plan before any external action.
6. **Deliver:** demo returns the generated output.
7. **Record:** where appropriate, record a minimal event without collecting unnecessary personal information.

## First-release scope

- Responsive layout optimized for phones.
- MercySoul black-and-gold visual language.
- Clear request field and submit action.
- Transparent status: demo, model connected, or fallback mode.
- Structured output with sections such as analysis summary, suggested plan, and result.
- Safe sample prompts.
- Error handling, loading state, and empty state.
- Accessibility basics: keyboard navigation, readable contrast, semantic labels.

## Explicit non-goals for the first release

- No autonomous deployment or production mutation.
- No database writes, account actions, purchases, messages, or external execution.
- No secrets or API keys in browser code.
- No claim of persistent memory unless persistence is actually configured and disclosed.
- No claim of a model connection unless it is verified at runtime.

## AI integration

Use a server-side API route or function to call the configured model provider. Provider credentials must be server-side environment variables. The client must never receive secret keys.

If no provider is configured, the demo must say so and use a clearly labeled deterministic sample response only if a sample mode is implemented. Do not present sample text as a live AI result.

## Governance

**No approval = No execution.** This initial demo is response-only. If a future version introduces consequential actions, require explicit authorization, server-side checks, verification, and audit logging. Human approval must not be bypassed.

## Verification checklist

- [ ] Runs on a mobile viewport.
- [ ] Input is validated and bounded.
- [ ] Loading and error states work.
- [ ] Model configuration is server-only.
- [ ] Demo mode and live mode are distinguishable.
- [ ] Sample output is labeled.
- [ ] No external mutation is performed.
- [ ] No sensitive user prompt is stored by default.
- [ ] Tests cover validation, fallback, and error cases.
- [ ] Live deployment is checked against the exact source commit before it is described as verified.

## Success criteria

A visitor can open the demo, enter a request, understand the output, and distinguish real model output from a sample/fallback. The demo is useful and reproducible without claiming broader autonomy.
