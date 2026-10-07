# API Contract

## GET /api/ai/status

Returns runtime availability and governance state.

## POST /api/ai/chat

Request:

```json
{"message":"..."}
```

or:

```json
{"messages":[{"role":"user","content":"..."}]}
```

Successful response contains `ok: true`, `requestId`, `decision: "allow"`, model, response text, usage, and governance metadata.

A missing model configuration or a moderation review produces a non-executing response. The initial AI runtime does not perform external mutations.
