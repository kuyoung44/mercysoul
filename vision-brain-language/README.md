# MercySoul Vision Brain Language — 4/4MS16

**Status:** experimental language specification, v0.1-draft  
**Codename:** MSVB  
**Identity:** LEGACY-44 · MercySoul Dominion  
**Principle:** Verify before execution. Human judgment remains required.

## Purpose

MSVB is a proposed human-readable control and orchestration language for MercySoul projects. It expresses intent, policy, data flow, verification, approvals, and permitted effects in one consistent format.

It does **not** magically replace JavaScript, TypeScript, Python, Rust, SQL, HTML, or other languages. The practical path is to make MSVB a common source/control layer and build tested adapters or transpilers for individual targets. Existing applications remain unchanged until each migration is reviewed and approved.

## First principles

1. **Receive → Route → Think → Plan → Guardian → Approve → Execute → Verify → Recover → Record.**
2. No approval, no consequential execution.
3. `human_judgment_required: true` for consequential external actions.
4. Least privilege; no credentials in source files or examples.
5. Generated translations must preserve behavior, document unsupported features, and pass tests before adoption.
6. `externalMutation: false` by default. Any external mutation requires an explicit capability, authorization, and audit record.
7. Never claim a program has been migrated, tested, or deployed until evidence confirms it.

## Quick example

See [the example](examples/hello.msvb) and [the draft specification](SPEC.md).

## Planned components

- **Parser:** syntax and schema validation.
- **Intermediate representation (IR):** language-neutral, typed program model.
- **Policy/Guardian pass:** effect analysis, approval requirements, secret checks, and human-judgment constraints.
- **Adapters:** JavaScript/TypeScript first, then Python and SQL where safe.
- **Conformance tests:** compare source behavior and target behavior.
- **Migration reports:** list translated, unsupported, and human-review-required constructs.

## Current limits

This folder is a design foundation, not yet a production compiler or universal translator. No existing source language has been globally changed. The draft requires review, implementation, tests, and approval before production adoption.

Aṣẹ.
