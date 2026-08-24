# MercySoul OS 2.8.0 Upgrade

## Dominion Intelligence & Safety Hardening

- Version synchronized to 2.8.0.
- Dominion policy advanced to 1.1.0.
- Moderation records now expose request ID, policy version, model ID, review state, and hard-safety state.
- Classifier confidence is bounded to 0–1 before scoring.
- Deterministic fallback remains explicitly active; ONNX/DistilBERT remains an adapter boundary.
- Request IDs are propagated through moderation APIs for traceability.
- Political and leadership content remains subject to identical safety rules.
- Peace seals remain contextual metadata and never override enforcement.
- Web moderation remains limited to content submitted through authorized integrations.
- Added regression coverage for metadata, invalid classifier confidence, empty content, and score boundaries.
