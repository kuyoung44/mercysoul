import OpenAI from 'openai';
import { config } from '../../config.js';
import { osStatus } from '../os-core.js';

const tools = [
  {
    type: 'function',
    name: 'get_mercy_soul_status',
    description: 'Read the current MercySoul OS status snapshot. Never invent status values.',
    async: true,
    strict: true,
    parameters: {
      type: 'object',
      properties: {},
      required: [],
      additionalProperties: false,
    },
  },
];

async function getMercySoulStatus() {
  return {
    source: 'MercySoul OS live server snapshot',
    status: osStatus(),
    observedAt: new Date().toISOString(),
  };
}

function getClient() {
  if (!config.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured.');
  }
  return new OpenAI({ apiKey: config.OPENAI_API_KEY });
}

const instructions = [
  'You are MercySoul Vision Brain, the premium creative technology intelligence layer of MercySoul OS.',
  'Use the MercySoul status tool when system status is requested or relevant.',
  'Independent parts of a user request should be answered without unnecessarily waiting for unrelated tool work.',
  'Never invent live system status, tool results, deployment state, or external data.',
  'Preserve MercySoul tone: warm, confident, clear, useful, and non-coercive.',
].join(' ');

/**
 * Starts the first Responses API turn.
 * Async tools are launched by the application immediately after the model returns
 * a function_call, matching the user's async function-calling pattern.
 */
export async function startVisionBrainTurn(input) {
  const client = getClient();
  const response = await client.responses.create({
    model: config.VISION_BRAIN_OPENAI_MODEL,
    tools,
    instructions,
    input,
  });

  const call = response.output.find((item) => item.type === 'function_call');
  return {
    response,
    call: call && call.name === 'get_mercy_soul_status' ? call : null,
    latestResponseId: response.id,
  };
}

/**
 * Executes an async tool call outside the model continuation.
 */
export async function executeVisionBrainTool(call) {
  if (!call || call.name !== 'get_mercy_soul_status') {
    throw new Error('Unsupported Vision Brain tool call.');
  }

  const args = JSON.parse(call.arguments || '{}');
  if (Object.keys(args).length !== 0) {
    throw new Error('get_mercy_soul_status accepts no arguments.');
  }

  return getMercySoulStatus();
}

/**
 * Continues the same Responses API conversation after the application-side
 * async work has completed.
 */
export async function continueVisionBrainTurn({ previousResponseId, call, result }) {
  const client = getClient();

  const response = await client.responses.create({
    model: config.VISION_BRAIN_OPENAI_MODEL,
    tools,
    instructions,
    previous_response_id: previousResponseId,
    input: [
      {
        type: 'function_call_output',
        call_id: call.call_id,
        output: JSON.stringify(result),
      },
    ],
  });

  return {
    response,
    latestResponseId: response.id,
  };
}

export function visionBrainAsyncStatus() {
  return {
    configured: Boolean(config.OPENAI_API_KEY),
    model: config.VISION_BRAIN_OPENAI_MODEL,
    tool: 'get_mercy_soul_status',
    mode: 'application-managed async function continuation',
  };
}
