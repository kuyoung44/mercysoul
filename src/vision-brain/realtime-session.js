const WINDOW_MS = 10 * 60 * 1000;
const MAX_SESSIONS_PER_WINDOW = 5;
const attempts = new Map();

export function allowRealtimeSession(ip = "unknown", now = Date.now()) {
  const key = String(ip || "unknown").slice(0, 120);
  const recent = (attempts.get(key) || []).filter((stamp) => now - stamp < WINDOW_MS);
  if (recent.length >= MAX_SESSIONS_PER_WINDOW) {
    attempts.set(key, recent);
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((WINDOW_MS - (now - recent[0])) / 1000)) };
  }
  recent.push(now);
  attempts.set(key, recent);
  if (attempts.size > 2000) {
    for (const [candidate, stamps] of attempts) {
      if (!stamps.some((stamp) => now - stamp < WINDOW_MS)) attempts.delete(candidate);
    }
  }
  return { allowed: true };
}

export async function createVisionRealtimeAnswer(sdp) {
  const apiKey = String(process.env.OPENAI_API_KEY || "").trim();
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured for the real-time voice engine.");
  if (typeof sdp !== "string" || !sdp.trim() || sdp.length > 64_000) {
    throw new Error("A valid WebRTC SDP offer is required.");
  }

  const session = {
    type: "realtime",
    model: "gpt-realtime-2.1",
    instructions: [
      "You are the voice interface for MercySoul Dominion.",
      "You must use the vision_brain_turn function for every user turn before giving a substantive answer.",
      "Do not answer from your own knowledge. Do not bypass the function.",
      "After the function returns, speak its response faithfully and naturally.",
      "Never claim to have executed an external action. No tools for external actions are available.",
      "Be warm, concise, truthful, and preserve human judgment.",
    ].join(" "),
    audio: {
      input: { turn_detection: { type: "server_vad" } },
      output: { voice: "marin" },
    },
    tools: [{
      type: "function",
      name: "vision_brain_turn",
      description: "Send the user's complete spoken request to MercySoul Vision Brain and return its response. This must be called for every user turn.",
      parameters: {
        type: "object",
        properties: { message: { type: "string", description: "The user's spoken request, transcribed faithfully." } },
        required: ["message"],
        additionalProperties: false,
      },
    }],
    tool_choice: "required",
  };

  const form = new FormData();
  form.set("sdp", sdp);
  form.set("session", JSON.stringify(session));

  const response = await fetch("https://api.openai.com/v1/realtime/calls", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  const answer = await response.text();
  if (!response.ok) {
    const detail = answer.slice(0, 500);
    throw new Error(`Realtime provider rejected the session (${response.status}): ${detail}`);
  }
  return answer;
}

export function visionRealtimeStatus() {
  return Object.freeze({
    enabled: Boolean(String(process.env.OPENAI_API_KEY || "").trim()),
    transport: "WebRTC",
    model: "gpt-realtime-2.1",
    brainBridge: "vision_brain_turn -> POST /api/vision/async",
    externalTools: false,
    serverKeyExposedToBrowser: false,
  });
}
