import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import { processInput } from '../os-core.js';

const MercySoulState = Annotation.Root({
  input: Annotation({ default: () => ({}) }),
  requestId: Annotation({ default: () => null }),
  decision: Annotation({ default: () => null }),
  riskScore: Annotation({ default: () => null }),
  result: Annotation({ default: () => null }),
  stages: Annotation({ reducer: (a, b) => [...a, ...b], default: () => [] }),
  error: Annotation({ default: () => null }),
});

async function intake(state) {
  return {
    stages: [{ stage: 'intake', ok: true }],
    requestId: state.requestId || crypto.randomUUID(),
  };
}

async function evaluate(state) {
  try {
    const result = processInput({
      ...state.input,
      requestId: state.requestId,
      type: state.input?.type || 'agent',
    });
    return {
      result,
      decision: result?.decision ?? null,
      riskScore: result?.riskScore ?? null,
      stages: [{ stage: 'evaluate', ok: true }],
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Evaluation failed',
      stages: [{ stage: 'evaluate', ok: false }],
    };
  }
}

async function finalize(state) {
  return {
    stages: [{ stage: 'finalize', ok: !state.error }],
  };
}

const workflow = new StateGraph(MercySoulState)
  .addNode('intake', intake)
  .addNode('evaluate', evaluate)
  .addNode('finalize', finalize)
  .addEdge(START, 'intake')
  .addEdge('intake', 'evaluate')
  .addEdge('evaluate', 'finalize')
  .addEdge('finalize', END);

export const mercysoulGraph = workflow.compile();

export async function runMercySoulAgent(input = {}, options = {}) {
  const result = await mercysoulGraph.invoke({
    input,
    requestId: options.requestId || null,
  });

  return {
    ok: !result.error,
    requestId: result.requestId,
    decision: result.decision,
    riskScore: result.riskScore,
    result: result.result,
    stages: result.stages,
    error: result.error,
    orchestration: {
      provider: 'langgraph',
      stateful: true,
      version: '1.4.13',
    },
  };
}

export const mercysoulGraphStatus = () => ({
  enabled: true,
  provider: 'LangGraph',
  version: '1.4.13',
  workflow: ['intake', 'evaluate', 'finalize'],
  purpose: 'Controlled AI orchestration around the existing MercySoul OS engine',
});
