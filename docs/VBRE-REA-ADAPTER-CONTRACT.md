# VBRE provider adapter contract

The REA adapter is deliberately injected rather than self-installing. The host supplies an already-configured MCP tool caller, an exact target allowlist, and the chosen tool name.

## Current boundary

- No shell command or child process is spawned.
- No REA install/update occurs.
- The adapter requires a mission marked authorized, exact target identity match, target allowlist membership, an explicit per-call approval flag, and a bounded mission scope.
- Provider output is treated as untrusted and capped at 200,000 serialized characters.
- The adapter does not claim that the injected MCP tool is read-only. The host must configure least-privilege, analysis-only tools.
- This is an adapter contract, not a live REA connection. No MCP endpoint is created by this module.

## Integration checklist

1. Run the host and REA in a compatible isolated environment; upstream REA currently requires Node 22.19+, 24.11+, or 26+.
2. Keep the existing MercySoul Node range separate until a runtime compatibility decision is made; do not silently widen the production engine's version range.
3. Register only explicitly approved read-only REA tools.
4. Map provider output to the evidence report schema and independently verify each claim.
5. Keep target files local unless a separate authorized policy permits transfer.
6. Test failure, timeout, oversized output, and provider-unavailable paths before enabling a real target.
