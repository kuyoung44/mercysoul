import test from "node:test";
import assert from "node:assert/strict";
import {
  NATURAL_CONVERSATION_MODE,
  classifyConversationAct,
  naturalConversationReply,
  naturalConversationStatus,
} from "./natural-conversation-mode.js";

test("classifies common social turns without routing them as tasks", () => {
  assert.equal(classifyConversationAct("Good evening"), "greeting");
  assert.equal(classifyConversationAct("Thank you!"), "thanks");
  assert.equal(classifyConversationAct("Got it"), "acknowledgment");
  assert.equal(classifyConversationAct("How are you?"), "casual");
  assert.equal(classifyConversationAct("Build a website"), "request");
  assert.equal(classifyConversationAct("Good evening, I have a task"), "request");
  assert.equal(naturalConversationReply("Thanks, I have a task"), null);
});

test("responds naturally to greetings without paraphrasing or a task-analysis preamble", () => {
  assert.equal(
    naturalConversationReply("Good evening"),
    "Good evening! Aṣẹ. What shall we work on tonight?",
  );
  assert.equal(
    naturalConversationReply("Hello"),
    "Hello! Aṣẹ. What can I help you with?",
  );
  assert.equal(naturalConversationReply("Good evening")?.includes("I understand you’re asking about"), false);
});

test("keeps thanks and acknowledgments proportionate", () => {
  assert.equal(naturalConversationReply("Thanks"), "You’re welcome. I’m glad I could help.");
  assert.equal(naturalConversationReply("Got it"), "Got it.");
  assert.equal(naturalConversationReply("Perfect!"), "Glad that works. What’s next?");
});

test("does not intercept actionable requests", () => {
  assert.equal(naturalConversationReply("Please review my deployment plan"), null);
});

test("publishes Natural Conversation Mode v1.0 without bypassing governance", () => {
  const status = naturalConversationStatus();
  assert.equal(NATURAL_CONVERSATION_MODE.version, "1.0");
  assert.equal(status.enabled, true);
  assert.equal(status.governanceBypass, false);
  assert.equal(status.rules.length, 8);
});
