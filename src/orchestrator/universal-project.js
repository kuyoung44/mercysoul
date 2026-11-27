import { randomUUID } from 'node:crypto';

export const PROJECT_COMPLEXITY = Object.freeze({
  L0: 'simple',
  L1: 'bounded',
  L2: 'multi-step',
  L3: 'cross-domain',
  L4: 'critical',
});

export const ACTION_RISK = Object.freeze({
  READ_ONLY: 'read-only',
  SENSITIVE_READ: 'sensitive-read',
  REVERSIBLE_WRITE: 'reversible-write',
  CONSEQUENTIAL_WRITE: 'consequential-write',
  FINANCIAL: 'financial',
  PRODUCTION_CRITICAL: 'production-critical',
  PROHIBITED: 'prohibited',
});

const VALID_RISKS = new Set(Object.values(ACTION_RISK));
const VALID_TASK_STATES = new Set(['pending', 'ready', 'in-progress', 'blocked', 'completed', 'failed', 'cancelled']);
const VALID_CAPABILITY_STATES = new Set(['registered', 'connected', 'available', 'executable', 'verified', 'approved']);

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function uniqueStrings(values = []) {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map(cleanString).filter(Boolean))];
}

function assertArray(value, label) {
  if (!Array.isArray(value)) throw new TypeError(`${label} must be an array`);
}

export function assessProjectComplexity({ tasks = [], domains = [], critical = false } = {}) {
  if (critical === true) return 'L4';
  const taskCount = Array.isArray(tasks) ? tasks.length : 0;
  const domainCount = uniqueStrings(domains).length;
  if (taskCount >= 20 || domainCount >= 4) return 'L3';
  if (taskCount >= 7 || domainCount >= 3) return 'L2';
  if (taskCount >= 3 || domainCount >= 2) return 'L1';
  return 'L0';
}

export function validateProjectDefinition(definition = {}) {
  const errors = [];
  const goal = cleanString(definition.goal);
  if (!goal) errors.push('A non-empty project goal is required.');
  if (goal.length > 4000) errors.push('Project goal must be 4,000 characters or fewer.');

  if (definition.domains !== undefined && !Array.isArray(definition.domains)) {
    errors.push('domains must be an array.');
  }
  if (definition.tasks !== undefined && !Array.isArray(definition.tasks)) {
    errors.push('tasks must be an array.');
  }
  if (definition.acceptanceCriteria !== undefined && !Array.isArray(definition.acceptanceCriteria)) {
    errors.push('acceptanceCriteria must be an array.');
  }
  if (definition.requestedCapabilities !== undefined && !Array.isArray(definition.requestedCapabilities)) {
    errors.push('requestedCapabilities must be an array.');
  }

  const tasks = Array.isArray(definition.tasks) ? definition.tasks : [];
  const ids = new Set();
  for (const [index, task] of tasks.entries()) {
    const id = cleanString(task?.id);
    if (!id) errors.push(`Task at index ${index} requires an id.`);
    else if (ids.has(id)) errors.push(`Duplicate task id: ${id}.`);
    else ids.add(id);
    if (!cleanString(task?.title)) errors.push(`Task ${id || index} requires a title.`);
    if (task?.dependsOn !== undefined && !Array.isArray(task.dependsOn)) {
      errors.push(`Task ${id || index} dependsOn must be an array.`);
    }
  }

  for (const task of tasks) {
    for (const dependency of uniqueStrings(task?.dependsOn)) {
      if (!ids.has(dependency)) errors.push(`Task ${task.id} depends on unknown task ${dependency}.`);
    }
  }

  if (definition.risk !== undefined && !VALID_RISKS.has(definition.risk)) {
    errors.push(`Unknown project risk: ${definition.risk}.`);
  }
  return { valid: errors.length === 0, errors };
}

export function orderProjectTasks(tasks = []) {
  assertArray(tasks, 'tasks');
  const byId = new Map();
  for (const task of tasks) {
    const id = cleanString(task?.id);
    if (!id || byId.has(id)) throw new TypeError('Tasks must have unique, non-empty ids.');
    byId.set(id, task);
  }

  const incoming = new Map();
  const outgoing = new Map();
  for (const id of byId.keys()) outgoing.set(id, new Set());
  for (const [id, task] of byId) {
    const dependencies = uniqueStrings(task.dependsOn);
    for (const dependency of dependencies) {
      if (!byId.has(dependency)) throw new TypeError(`Task ${id} depends on unknown task ${dependency}.`);
    }
    incoming.set(id, new Set(dependencies));
    for (const dependency of dependencies) outgoing.get(dependency).add(id);
  }

  const ready = [...byId.keys()].filter(id => incoming.get(id).size === 0);
  const ordered = [];
  while (ready.length) {
    const id = ready.shift();
    ordered.push(id);
    for (const child of outgoing.get(id)) {
      incoming.get(child).delete(id);
      if (incoming.get(child).size === 0) ready.push(child);
    }
  }
  if (ordered.length !== byId.size) throw new TypeError('Task dependencies contain a cycle.');
  return ordered;
}

export function createProjectRecord(definition = {}, options = {}) {
  const validation = validateProjectDefinition(definition);
  if (!validation.valid) {
    const error = new TypeError('Invalid project definition.');
    error.details = validation.errors;
    throw error;
  }

  const tasks = (definition.tasks || []).map(task => ({
    id: cleanString(task.id),
    title: cleanString(task.title),
    description: cleanString(task.description),
    dependsOn: uniqueStrings(task.dependsOn),
    acceptanceCriteria: uniqueStrings(task.acceptanceCriteria),
    requiredCapabilities: uniqueStrings(task.requiredCapabilities),
    status: VALID_TASK_STATES.has(task.status) ? task.status : 'pending',
  }));
  const taskOrder = orderProjectTasks(tasks);
  const domains = uniqueStrings(definition.domains);
  const complexity = definition.complexity && Object.hasOwn(PROJECT_COMPLEXITY, definition.complexity)
    ? definition.complexity
    : assessProjectComplexity({ tasks, domains, critical: definition.critical === true });

  return {
    id: cleanString(definition.id) || options.id || randomUUID(),
    schemaVersion: '1.0.0',
    goal: cleanString(definition.goal),
    domains,
    complexity,
    status: 'planned',
    constraints: uniqueStrings(definition.constraints),
    acceptanceCriteria: uniqueStrings(definition.acceptanceCriteria),
    requestedCapabilities: uniqueStrings(definition.requestedCapabilities),
    risk: definition.risk || ACTION_RISK.READ_ONLY,
    tasks,
    taskOrder,
    approvals: [],
    deliverables: [],
    verification: { status: 'not-started', evidence: [] },
    createdAt: options.now || new Date().toISOString(),
    updatedAt: options.now || new Date().toISOString(),
  };
}

export function createProjectPlan(project) {
  if (!project || typeof project !== 'object' || !project.id || !Array.isArray(project.tasks)) {
    throw new TypeError('A valid project record is required.');
  }
  const order = orderProjectTasks(project.tasks);
  const taskById = new Map(project.tasks.map(task => [task.id, task]));
  const tasks = order.map((id, index) => {
    const task = taskById.get(id);
    const dependenciesComplete = task.dependsOn.every(dependency => taskById.get(dependency)?.status === 'completed');
    return {
      ...task,
      sequence: index + 1,
      status: task.status === 'completed' ? 'completed' : dependenciesComplete ? 'ready' : 'pending',
    };
  });
  return {
    projectId: project.id,
    goal: project.goal,
    complexity: project.complexity,
    status: 'planned',
    tasks,
    requiredCapabilities: uniqueStrings([
      ...(project.requestedCapabilities || []),
      ...tasks.flatMap(task => task.requiredCapabilities || []),
    ]),
    executionEnabled: false,
    requiresHumanApproval: true,
  };
}

export function assessCapabilityReadiness(capability = {}) {
  const state = VALID_CAPABILITY_STATES.has(capability.state) ? capability.state : 'registered';
  const connected = state === 'connected' || state === 'available' || state === 'executable' || state === 'verified' || state === 'approved';
  const executable = state === 'executable' || state === 'verified' || state === 'approved';
  const verified = state === 'verified' || state === 'approved';
  const approved = state === 'approved';
  return {
    id: cleanString(capability.id),
    state,
    registered: true,
    connected,
    available: state === 'available' || executable,
    executable,
    verified,
    approved,
    canExecute: false,
    reason: approved
      ? 'Capability is marked approved; a separate project-scoped action approval is still required.'
      : 'Capability readiness does not grant project or action authorization.',
  };
}

export function classifyActionRisk(action = {}) {
  const risk = action.risk;
  if (!VALID_RISKS.has(risk)) return ACTION_RISK.CONSEQUENTIAL_WRITE;
  return risk;
}

export function authorizeProjectAction({ projectId, action, resource, approval, now = new Date().toISOString() } = {}) {
  const risk = classifyActionRisk({ risk: action?.risk });
  if (risk === ACTION_RISK.PROHIBITED) return { allowed: false, reason: 'This action is prohibited by policy.', risk };
  if ([ACTION_RISK.READ_ONLY, ACTION_RISK.SENSITIVE_READ].includes(risk)) {
    return { allowed: true, mode: 'read-only', risk, approvalRequired: false };
  }

  if (!approval || approval.status !== 'approved') {
    return { allowed: false, reason: 'Explicit approval is required for this action.', risk, approvalRequired: true };
  }
  if (approval.projectId !== projectId || approval.action !== action?.type || approval.resource !== resource) {
    return { allowed: false, reason: 'Approval scope does not exactly match this project, action, and resource.', risk, approvalRequired: true };
  }
  if (approval.revoked === true) return { allowed: false, reason: 'Approval has been revoked.', risk, approvalRequired: true };
  if (!approval.expiresAt || !Number.isFinite(Date.parse(approval.expiresAt)) || Date.parse(approval.expiresAt) <= Date.parse(now)) {
    return { allowed: false, reason: 'Approval is expired or has no valid expiry.', risk, approvalRequired: true };
  }
  if (!approval.approvedAt || !Number.isFinite(Date.parse(approval.approvedAt))) {
    return { allowed: false, reason: 'Approval record is missing a valid approval timestamp.', risk, approvalRequired: true };
  }
  return { allowed: true, mode: 'scoped-approved-action', risk, approvalRequired: true };
}
