/**
 * MercySoul Profound Engine v1.0
 * A reflective reasoning layer: clarify intent, separate facts from assumptions,
 * surface uncertainty, compare options, and recommend proportionate next steps.
 * This module does not call external services or execute consequential actions.
 */

export const PROFOUND_ENGINE_VERSION = '1.0.0';

const asText = value => String(value ?? '').trim();

function sentenceList(value) {
  if (Array.isArray(value)) return value.map(asText).filter(Boolean);
  return asText(value)
    .split(/\n|(?<=[.!?])\s+/u)
    .map(item => item.trim())
    .filter(Boolean);
}

function hasHighImpactSignals(text) {
  return /\b(delete|deploy|publish|transfer|pay|purchase|send|ban|terminate|medical|legal|password|secret|credential|nin|identity|private|production)\b/i.test(text);
}

/**
 * Build a bounded, evidence-aware reasoning brief.
 * facts and assumptions must be supplied by the caller; the engine does not
 * promote an allegation or inference into a verified fact.
 */
export function runProfoundEngine(input = {}) {
  const goal = asText(input.goal ?? input.prompt ?? input.question);
  if (!goal) {
    return {
      ok: false,
      engine: 'MercySoul Profound Engine',
      version: PROFOUND_ENGINE_VERSION,
      error: 'A goal, prompt, or question is required.',
      requiresClarification: true,
    };
  }

  const facts = sentenceList(input.facts);
  const assumptions = sentenceList(input.assumptions);
  const constraints = sentenceList(input.constraints);
  const risks = sentenceList(input.risks);
  const options = Array.isArray(input.options)
    ? input.options.map(option => typeof option === 'string'
      ? { title: option.trim(), benefits: [], risks: [] }
      : {
          title: asText(option?.title),
          benefits: sentenceList(option?.benefits),
          risks: sentenceList(option?.risks),
        }).filter(option => option.title)
    : [];

  const uncertainty = [];
  if (facts.length === 0) uncertainty.push('No verified facts were supplied.');
  if (assumptions.length > 0) uncertainty.push('Assumptions are present and should not be treated as facts.');
  if (options.length === 0) uncertainty.push('No explicit alternatives were supplied for comparison.');
  if (hasHighImpactSignals(goal)) uncertainty.push('The request may involve a consequential or sensitive action; verify scope and authorization before acting.');

  const clarificationQuestions = [];
  if (facts.length === 0) clarificationQuestions.push('What evidence or confirmed information should guide this decision?');
  if (hasHighImpactSignals(goal)) clarificationQuestions.push('What exact scope is authorized, by whom, and what must remain unchanged?');
  if (constraints.length === 0) clarificationQuestions.push('What constraints, boundaries, or success criteria must be respected?');

  const recommendation = hasHighImpactSignals(goal)
    ? 'Prepare a reversible plan, verify facts and permissions, and require explicit human approval before any consequential external action.'
    : facts.length === 0
      ? 'Gather evidence and clarify the desired outcome before committing to a conclusion.'
      : 'Use the supplied facts and constraints to choose the smallest useful next step, then review the result.';

  return {
    ok: true,
    engine: 'MercySoul Profound Engine',
    version: PROFOUND_ENGINE_VERSION,
    mode: 'reflective-reasoning',
    goal,
    assessment: {
      verifiedFacts: facts,
      assumptions,
      constraints,
      risks,
      options,
      uncertainty,
      clarificationQuestions,
    },
    recommendation,
    guardrails: {
      factsOverAllegations: true,
      humanJudgmentRequired: true,
      externalMutation: false,
      authorizationRequiredForConsequentialActions: true,
      supernaturalClaimsTreatedAsUnverified: true,
    },
    lifecycle: ['RECEIVE', 'CLARIFY', 'SEPARATE_FACTS_AND_ASSUMPTIONS', 'ASSESS_OPTIONS', 'RECOMMEND', 'HUMAN_REVIEW', 'RECORD'],
  };
}

export default runProfoundEngine;
