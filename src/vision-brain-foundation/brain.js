import OpenAI from "openai";

const SYSTEM = `You are MercySoul Vision Brain, the reasoning core of MercySoul Dominion.
Be useful, clear, grounded, and honest about uncertainty. Do not claim to execute actions,
access accounts, remember information across sessions, or operate external systems unless a
verified integration explicitly provides that capability. You may analyze, explain, plan,
draft, and recommend. Never treat a user request as authorization for external mutation.
Follow RECEIVE -> ROUTE -> THINK -> PLAN -> GUARDIAN -> APPROVE -> EXECUTE -> VERIFY -> RECOVER -> RECORD.
This endpoint is conversational and plan-only: it has no tools and cannot execute external actions.`;

const clean = (value, max) => typeof value === "string" ? value.trim().slice(0, max) : "";

export function createOpenAIProvider({ apiKey = process.env.OPENAI_API_KEY, model = process.env.MERCYSOUL_BRAIN_MODEL || "gpt-4.1-mini" } = {}) {
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");
  const client = new OpenAI({ apiKey });
  return {
    model,
    async generate({ messages, maxOutputTokens = 700 }) {
      const response = await client.chat.completions.create({
        model,
        messages,
        max_completion_tokens: maxOutputTokens,
      });
      return response.choices?.[0]?.message?.content?.trim() || "";
    },
  };
}

export function createVisionBrain({ provider, maxInputChars = 8000, maxOutputTokens = 700 } = {}) {
  if (!provider || typeof provider.generate !== "function") throw new TypeError("A compatible model provider is required");
  return {
    async respond(input = {}) {
      const message = clean(input.message, maxInputChars);
      if (!message) return { ok: false, code: "MESSAGE_REQUIRED", error: "A message is required." };
      const context = Array.isArray(input.context)
        ? input.context.slice(-8).filter(item => ["user", "assistant"].includes(item?.role))
            .map(item => ({ role: item.role, content: clean(item.content, 2000) }))
            .filter(item => item.content)
        : [];
      const messages = [
        { role: "system", content: SYSTEM },
        ...context,
        { role: "user", content: message },
      ];
      const answer = await provider.generate({ messages, maxOutputTokens });
      if (!answer) return { ok: false, code: "EMPTY_MODEL_RESPONSE", error: "The model returned an empty response." };
      return {
        ok: true,
        answer: clean(answer, 12000),
        model: provider.model || "custom-provider",
        mode: "conversation_and_planning",
        executionAllowed: false,
        memory: "request_context_only",
      };
    },
  };
}

export function visionBrainStatus({ providerConfigured = Boolean(process.env.OPENAI_API_KEY), accessTokenConfigured = Boolean(process.env.MERCYSOUL_BRAIN_API_TOKEN) } = {}) {
  return {
    name: "MercySoul Vision Brain",
    version: "0.3.0",
    providerConfigured,
    accessTokenConfigured,
    model: process.env.MERCYSOUL_BRAIN_MODEL || "gpt-4.1-mini",
    conversationMemory: "request_context_only",
    toolsConnected: false,
    executionAdapterInstalled: false,
    executionAllowed: false,
    status: providerConfigured && accessTokenConfigured ? "ready_when_server_restarted" : "configuration_required",
  };
}
