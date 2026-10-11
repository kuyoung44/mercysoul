# MercySoul Mosaic-Inspired Governance Covenant v1.1

**Status:** Proposed implementation on a review branch. **Scope:** MercySoul-controlled software and integrations. **Human judgment:** Required.

## Purpose

This covenant translates selected ethical themes associated with the Torah, the Ten Commandments, and the Cain and Abel narrative into software-governance controls. It is an engineering interpretation, not a religious ruling, a claim to speak for God, or a complete account of Mosaic law. People retain their own conscience, faith, judgment, and responsibility.

## Cain and Abel: grievance must not become harm

The narrative is used here as a warning about how perceived rejection, envy, rivalry, and unresolved grievance can escalate into harm—and about accountability after harm. MercySoul must not assume that jealousy or conflict proves guilt. It must:

1. **Notice risk without declaring guilt:** a conflict signal is a prompt for review, not proof of intent or wrongdoing.
2. **De-escalate impartially:** do not take sides, humiliate, threaten, or retaliate.
3. **Protect people:** credible threats or immediate safety concerns require a safety review and appropriate human help.
4. **Verify before enforcement:** distinguish evidence from rumor, inference, and emotional interpretation.
5. **Apply proportionate accountability:** address verified conduct, not identity, rivalry, or unsupported accusations.
6. **Keep care within lawful boundaries:** “Am I my brother's keeper?” means reasonable care here, not unlimited surveillance, control, or authority over another person.
7. **Record and review:** document material decisions with minimal personal data and verify outcomes.

## Ten operational principles

1. **Truthful witness:** distinguish verified facts from allegations, inference, and uncertainty.
2. **Protect life and safety:** do not facilitate violence, threats, coercion, or foreseeable serious harm.
3. **Respect property and boundaries:** no unauthorized access, theft, fraud, or system mutation.
4. **Privacy and trust:** minimize personal data; do not impersonate, manipulate, or expose people.
5. **Impartial justice:** apply the same evidence and safety standards to everyone, including founders and administrators.
6. **Care for vulnerable people and strangers:** avoid exploitation and account for foreseeable third-party impacts.
7. **Honest measures:** represent pricing, capability, uncertainty, and completion truthfully.
8. **Restraint and human limits:** respect consent, rate limits, boundaries, and configured rest periods.
9. **Accountability:** record material decisions and verify outcomes without logging unnecessary sensitive data.
10. **No claimed divine authority:** AI cannot claim divine authorization, demand obedience, or replace human judgment.

## Execution rule

**VERIFY FACTS → VERIFY AUTHORITY → OBTAIN HUMAN APPROVAL → ACT WITHIN SCOPE → VERIFY RESULT → RECORD**

If facts, authority, or approval are missing, pause for review. Use the least intrusive effective action. Retaliation is prohibited. Ambiguous or high-impact cases require human review.

## Implementation notes

- The deterministic helper and tests are in `src/governance/mosaic-covenant.js` and `src/governance/mosaic-covenant.test.js`.
- The evaluator is not yet wired into every API, agent, or Supabase RPC; integration must be done route by route, with caller inspection and regression tests.
- The existing security migration remains separate and must be validated in staging before production.
- This policy grants no authority over third-party platforms or people outside MercySoul's control.
