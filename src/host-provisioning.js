import crypto from 'node:crypto';

const NAME = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const REPOSITORY = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const BRANCH = /^[A-Za-z0-9._/-]{1,200}$/;

export function validateHostProvisionRequest(input = {}) {
  const errors = [];
  const project = String(input.project || '').trim().toLowerCase();
  const repository = String(input.repository || '').trim();
  const branch = String(input.branch || '').trim();
  const provider = String(input.provider || 'vercel').trim().toLowerCase();
  const mode = String(input.mode || 'plan').trim().toLowerCase();

  if (!NAME.test(project)) errors.push('project must be a valid lowercase project slug');
  if (!REPOSITORY.test(repository) || repository.split('/').some((part) => part === '.' || part === '..')) {
    errors.push('repository must use owner/repository format');
  }
  if (!BRANCH.test(branch) || branch.startsWith('/') || branch.endsWith('/') || branch.includes('..') || branch.includes('//')) {
    errors.push('branch must be a valid branch identifier');
  }
  if (provider !== 'vercel') errors.push('only the Vercel provider is enabled in v1');
  if (mode !== 'plan') errors.push('only read-only plan mode is enabled in v1');

  return {
    valid: errors.length === 0,
    errors,
    request: { command: 'host.provision', mode, provider, project, repository, branch }
  };
}

export function createHostProvisionPlan(input = {}, observations = {}) {
  const validation = validateHostProvisionRequest(input);
  if (!validation.valid) {
    return { ok: false, errors: validation.errors, externalMutation: false };
  }

  const plan = {
    schemaVersion: 'mercysoul.host-provision-plan.v1',
    command: 'host.provision',
    mode: 'plan',
    provider: 'vercel',
    target: {
      project: validation.request.project,
      repository: validation.request.repository,
      branch: validation.request.branch
    },
    observed: {
      githubRepositoryAccessible: observations.githubRepositoryAccessible === true,
      githubBranchExists: observations.githubBranchExists === true,
      vercelReadAccessVerified: observations.vercelReadAccessVerified === true,
      existingProject: observations.existingProject === true,
      checksComplete: observations.checksComplete === true
    },
    intendedChanges: observations.existingProject === true
      ? ['inspect existing project settings', 'compare repository and branch configuration']
      : ['create one Vercel project', 'connect the explicitly selected GitHub repository and branch'],
    excludedChanges: ['domain purchase or assignment', 'DNS changes', 'billing changes', 'production environment variables', 'permission changes', 'project deletion'],
    gates: {
      humanApprovalRequired: true,
      approvalMustBindToDigest: true,
      executionEnabled: false,
      failClosed: true
    },
    externalMutation: false
  };

  const canonical = JSON.stringify(plan);
  const planDigest = crypto.createHash('sha256').update(canonical).digest('hex');
  return { ok: true, plan, planDigest };
}

export function approvalMatchesPlan(approval, planDigest) {
  if (!approval || typeof approval !== 'object' || !planDigest) return false;
  return approval.planDigest === planDigest
    && approval.approvedByHuman === true
    && typeof approval.approvalId === 'string'
    && approval.approvalId.trim().length > 0;
}
