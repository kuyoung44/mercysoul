# MERCYSOUL KYC-BEFORE-PAYMENT RULE

Status: ACTIVE

All MercySoul online payments must pass verified KYC before a payment is accepted, authorized, or processed.

If KYC is missing, expired, invalid, unsigned, or cannot be verified, the transaction must be blocked or held for review.

Security requirements:
- KYC must be verified by a trusted KYC/payment provider or authorized MercySoul verification service.
- A client-supplied kycVerified=true flag is not sufficient evidence.
- Payment authorization uses a server-verifiable signed KYC assertion.
- Assertions expire and are bound to the customer subject/reference.
- Do not store raw identity documents in ordinary payment/event records.
- Store only the minimum KYC reference/status needed for payment authorization and audit.
- Payment processing must fail closed when KYC verification infrastructure is unavailable.

Current boundary: the repository has no complete payment-provider authorization flow. The reusable server-side KYC gate is therefore added first and must be wired into every future payment processor before payment is enabled.

Flow: STOP -> KYC VERIFY -> SIGNED ASSERTION -> PAYMENT AUTHORIZE -> PROCESS -> AUDIT
