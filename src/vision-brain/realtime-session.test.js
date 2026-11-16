import test from "node:test";
import assert from "node:assert/strict";
import { allowRealtimeSession, visionRealtimeStatus } from "./realtime-session.js";

test("Realtime session endpoint applies a bounded per-IP session limit", () => {
  const ip = "vision-brain-realtime-test";
  for (let index = 0; index < 5; index += 1) {
    assert.equal(allowRealtimeSession(ip, 1_000 + index).allowed, true);
  }
  const blocked = allowRealtimeSession(ip, 1_010);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterSeconds > 0);
});

test("Realtime session limit resets after its time window", () => {
  const ip = "vision-brain-realtime-reset-test";
  for (let index = 0; index < 5; index += 1) allowRealtimeSession(ip, 2_000 + index);
  assert.equal(allowRealtimeSession(ip, 602_001).allowed, true);
});

test("Realtime status never exposes a server API key", () => {
  const status = visionRealtimeStatus();
  assert.equal(status.serverKeyExposedToBrowser, false);
  assert.equal(status.brainBridge, "vision_brain_turn -> POST /api/vision/async");
  assert.equal(status.externalTools, false);
});
