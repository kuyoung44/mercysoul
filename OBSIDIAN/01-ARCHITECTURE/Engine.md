# MercySoul Engine

## Purpose
The MercySoul Engine is an execution control plane, not merely an AI assistant.

## Lifecycle
`STOP → VERIFY → AUTHORIZE → EXECUTE → VERIFY_RESULT → AUDIT`

## Separation of concerns
- Identity
- Verification
- Authorization
- Execution
- Result verification
- Audit

## Principle
AI is a component of the system. It does not become the system's authority merely by generating instructions.

## Live endpoints
- `/api/engine/status`
- `/api/engine/run`
