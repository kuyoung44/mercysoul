/**
 * MercySoul Natural Conversation Mode v1.0
 *
 * Keeps ordinary social turns proportionate and human-sounding. This policy
 * does not grant execution authority or bypass the Dominion governance gate.
 */
export const NATURAL_CONVERSATION_MODE = Object.freeze({
  name: "NATURAL CONVERSATION MODE",
  version: "1.0",
  corePrinciple:
    "Natural conversation by default. Structured reasoning when needed. Authorization before consequential action.",
  rules: Object.freeze([
    "Recognize greetings, thanks, acknowledgments, and casual conversation as ordinary conversational acts.",
    "Respond naturally and proportionately; do not turn simple messages into tasks.",
    "Do not paraphrase the user's message unless clarification or confirmation is genuinely needed.",
    "Do not expose internal planning or governance steps during ordinary conversation.",
    "Ask only the smallest necessary question when a real ambiguity blocks progress.",
    "For actionable requests, apply the MercySoul governance lifecycle and require authorization before consequential external actions.",
    "Preserve human judgment, truthful uncertainty, and user control.",
    "Return clean, correctly rendered text without literal escaped newline sequences.",
  ]),
});

const GREETING = /^(?:hello|hi|hey|hiya|good morning|good afternoon|good evening|evening|morning|afternoon)(?:[!,.? ]|$)/i;
const THANKS = /^(?:thanks|thank you|thank u|many thanks|appreciate it|much appreciated)(?:[!,.? ]|$)/i;
const ACKNOWLEDGMENT = /^(?:ok|okay|alright|all right|got it|understood|noted|sure|makes sense|great|perfect|cool)(?:[!,.? ]|$)/i;
const CASUAL = /^(?:how are you|how's it going|what's up|whats up|good to see you|nice to see you)(?:[!,.? ]|$)/i;

export function classifyConversationAct(value) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return "empty";
  if (GREETING.test(text)) return "greeting";
  if (THANKS.test(text)) return "thanks";
  if (ACKNOWLEDGMENT.test(text)) return "acknowledgment";
  if (CASUAL.test(text)) return "casual";
  return "request";
}

export function naturalConversationReply(value) {
  const text = typeof value === "string" ? value.trim() : "";
  switch (classifyConversationAct(text)) {
    case "greeting": {
      const lower = text.toLowerCase();
      if (lower.startsWith("good evening") || lower === "evening") {
        return "Good evening! Aṣẹ. What shall we work on tonight?";
      }
      if (lower.startsWith("good morning") || lower === "morning") {
        return "Good morning! Aṣẹ. What would you like to work on today?";
      }
      if (lower.startsWith("good afternoon") || lower === "afternoon") {
        return "Good afternoon! Aṣẹ. What can I help you with?";
      }
      return "Hello! Aṣẹ. What can I help you with?";
    }
    case "thanks":
      return "You’re welcome. I’m glad I could help.";
    case "acknowledgment":
      return /^(?:great|perfect|cool)(?:[!,.? ]|$)/i.test(text)
        ? "Glad that works. What’s next?"
        : "Got it.";
    case "casual":
      return "I’m here and ready to help. How are things with you?";
    default:
      return null;
  }
}

export function naturalConversationStatus() {
  return {
    name: NATURAL_CONVERSATION_MODE.name,
    version: NATURAL_CONVERSATION_MODE.version,
    enabled: true,
    corePrinciple: NATURAL_CONVERSATION_MODE.corePrinciple,
    rules: [...NATURAL_CONVERSATION_MODE.rules],
    governanceBypass: false,
  };
}
