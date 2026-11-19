# MercySoul Vision Brain Integration v2

## Delivered

- The merged model router classifies user work into fast, general, reasoning, coding, creative, or research profiles.
- The live `runMercySoulAI()` path selects a configured model after the existing `processInput()` Guardian preflight.
- Model identifiers are read only from server environment configuration. User messages cannot choose arbitrary providers or model IDs.
- Existing `MERCYSOUL_AI_MODEL` and `GEMINI_MODEL` remain compatibility fallbacks for the primary model.
- Successful and failed model requests record the selected task and model in the existing best-effort audit event.
- AI status reports router configuration without exposing credentials.

## Environment configuration

- `MERCYSOUL_MODEL_PRIMARY`: default model identifier.
- `MERCYSOUL_MODEL_FAST`: short/low-latency profile.
- `MERCYSOUL_MODEL_REASONING`: analysis and planning profile.
- `MERCYSOUL_MODEL_CODING`: engineering profile.
- `MERCYSOUL_MODEL_CREATIVE`: creative profile.
- `MERCYSOUL_MODEL_RESEARCH`: research profile.
- `MERCYSOUL_MODEL_FALLBACK`: optional fallback candidate, reported but not automatically invoked.

Unset task profiles resolve to the primary model. Keep identifiers compatible with the project's existing AI SDK model integration and Vercel AI Gateway configuration.

## Safety boundaries

1. Existing Guardian preflight runs before model selection or provider generation.
2. User input cannot select an arbitrary model identifier.
3. Model output cannot approve or execute consequential external actions.
4. Fallback is not automatically invoked; a provider error returns a review decision and reports whether a fallback is configured.
5. No production secrets, environment variables, SQL, schema, RLS, grants, migrations, or deployment configuration are changed.
6. The existing human approval lifecycle remains authoritative.

## Validation

Run `node --test src/ai/model-router.test.js`, then `npm test` and `npm run check` in the deployment environment. A successful PR merge does not establish production deployment or provider connectivity.
