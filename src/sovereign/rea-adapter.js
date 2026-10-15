/**
 * MercySoul Vision Brain — REA adapter boundary.
 *
 * This adapter does not start a process, install REA, connect to a network,
 * or discover tools. A trusted host must inject an already-configured local
 * MCP tool caller and an explicit target allowlist.
 */
const ALLOWED_OPERATION = "analyze";
const MAX_OUTPUT_CHARS = 200_000;

export function createReaAdapter({ invokeTool, permittedTargets = [], toolName = "analyze_javascript_application" } = {}) {
  if (typeof invokeTool !== "function") throw new TypeError("An explicitly configured MCP invokeTool function is required");
  if (!Array.isArray(permittedTargets) || permittedTargets.some(x => typeof x !== "string" || !x.trim())) {
    throw new TypeError("permittedTargets must be an array of exact target identifiers");
  }
  if (typeof toolName !== "string" || !/^[a-z][a-z0-9_]{1,100}$/.test(toolName)) {
    throw new TypeError("A valid, explicitly configured REA tool name is required");
  }
  const allowlist = new Set(permittedTargets.map(x => x.trim()));

  return Object.freeze({
    provider: "rea-mcp",
    operation: ALLOWED_OPERATION,
    async analyze({ mission, targetId, targetRef, scope, approved = false } = {}) {
      if (approved !== true) throw new Error("Explicit human approval is required to invoke an analysis provider");
      if (!mission || mission.schemaVersion !== "mercysoul.vision-reverse-mission.v1") {
        throw new TypeError("A valid MercySoul reverse mission is required");
      }
      if (!mission.authorization?.authorized || mission.authorization.targetId === undefined && !mission.authorization.targetBound) {
        throw new Error("Mission authorization is missing or invalid");
      }
      if (targetId !== mission.target.id || !allowlist.has(targetId)) {
        throw new Error("Target must match both the authorized mission and the configured exact-target allowlist");
      }
      if (typeof targetRef !== "string" || !targetRef.trim()) throw new TypeError("A target reference is required");
      if (typeof scope !== "string" || !scope.trim()) throw new TypeError("A bounded analysis scope is required");
      if (!mission.scope.some(s => scope.trim() === s || scope.trim().startsWith(s + ":"))) {
        throw new Error("Requested analysis scope is outside the mission scope");
      }

      // No shell or process execution here. The injected function must be an
      // explicitly configured MCP tool caller with read-only permissions.
      const result = await invokeTool(toolName, {
        target: targetRef.trim(),
        scope: scope.trim(),
        operation: ALLOWED_OPERATION
      });
      const serialized = typeof result === "string" ? result : JSON.stringify(result);
      if (serialized.length > MAX_OUTPUT_CHARS) throw new Error("REA result exceeds the configured output limit");
      return {
        schemaVersion: "mercysoul.rea-observation.v1",
        missionId: mission.missionId,
        targetId,
        provider: "rea-mcp",
        toolName,
        scope: scope.trim(),
        result,
        resultIsUntrusted: true,
        policy: { analysisOnly: true, externalMutation: false, humanJudgmentRequired: true },
        limitations: [
          "Provider output is untrusted and requires independent verification.",
          "This adapter does not itself establish that the injected MCP tool is read-only."
        ],
        createdAt: new Date().toISOString()
      };
    }
  });
}
