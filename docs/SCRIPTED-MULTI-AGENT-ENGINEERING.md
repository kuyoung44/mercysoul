# MercySoul Reference Pattern: Scripted Multi-Agent Engineering

**Status:** Saved design reference — not yet adopted as a runtime configuration.

**Governance:** OG BE 44MS16 · Fi Ìlànà gbé mi ró.

## Core idea

Move expensive model reasoning to the smallest number of high-value checkpoints. Have the planning model write a deterministic workflow; use lower-cost or local workers for broad read-only scans and scoped edits; independently verify findings and changes; return only concise, evidence-backed results to the planner/reviewer.

The model names and command-line flags in the social post (including “Opus 5.5”, “Haiku 5.5”, “Sonnet 5.5”, “ultracode”, and JEV) are claims from the post, not verified dependencies or requirements for MercySoul. Select models and routing tools only after confirming their current availability, capabilities, licensing, and cost.

## Proposed execution tree

1. **Plan (reasoning model):** Convert the request into a versioned workflow script with acceptance criteria, file scope, dependencies, stop conditions, and risk classification.
2. **Scan (read-only workers):** Inspect files in parallel; return file paths, line references, evidence, and confidence. Do not edit.
3. **Triage (deterministic router):** Route simple, bounded choices such as path selection, tool selection, and retry/stop decisions through ordinary code when deterministic rules are sufficient. Use a model only when ambiguity requires reasoning.
4. **Edit (isolated workers):** Each change runs in its own worktree, branch, container, or equivalent isolated copy. Workers must not overwrite each other's changes silently.
5. **Verify (independent worker):** Independently check every finding before it is reported and verify each patch against the original evidence, acceptance criteria, tests, and security constraints.
6. **Converge:** Combine only non-conflicting, verified patches. Resolve conflicts explicitly.
7. **Review (reasoning model / human):** Present a concise report containing accepted findings, rejected findings, diffs, test results, unresolved risks, and cost summary.
8. **Approve and ship:** No deployment or consequential external mutation until explicit authorized approval. Verify production health after deployment.

## Fix-loop rule

Stop after two consecutive rounds with no measurable progress. Record what was attempted, what failed, remaining uncertainty, and the smallest next decision. Do not loop indefinitely or disguise a stalled run as success.

## Required safeguards

- **Diff first:** Present planned files and diffs before implementation whenever a change affects project policy, protected configuration, credentials, deployments, or external services. Wait for explicit approval for those consequential changes.
- **Read-only means read-only:** Scan workers must not write, execute mutating commands, or access secrets they do not need.
- **Least privilege:** Workers receive only the repository, files, tools, and credentials required for their task.
- **No hidden spending:** Prefer local/free eligible resources; paid resources require explicit approval and a known cost or limit.
- **No authority by assumption:** No valid authorization means no external mutation.
- **Evidence over claims:** A finding requires a source location or reproducible evidence. A successful status requires test output or provider-confirmed health checks.
- **Isolation and provenance:** Record worker identity/model, task, base revision, changed files, test evidence, and outcome.
- **Human judgment:** Keep human review for consequential, ambiguous, security-sensitive, financial, or production actions.
- **Recovery:** Preserve the base revision and isolate failed changes so they can be reverted without destroying unrelated work.

## Suggested workflow manifest

```yaml
version: 1
policy: OG-BE-44MS16
stages:
  - plan:
      mode: reasoning
      output: workflow.yaml
  - scan:
      mode: read_only
      parallel: true
      output: findings.json
  - triage:
      mode: deterministic_first
  - edit:
      mode: isolated_workspace
      parallel: true
  - verify:
      mode: independent
      required_for_each_finding: true
      required_for_each_patch: true
  - review:
      require_diff: true
      require_test_evidence: true
  - execute:
      require_explicit_approval: true
  - postflight:
      require_health_check: true
fix_loop:
  no_progress_round_limit: 2
cost_policy:
  local_first: true
  free_first: true
  paid_requires_explicit_approval: true
```

This is a proposed portable architecture, not a claim that any specific agent provider, model, JEV router, or workflow runtime is already connected. Provider-specific adapters, real workspace isolation, model routing, persistence, and end-to-end tests must be implemented and verified separately.
