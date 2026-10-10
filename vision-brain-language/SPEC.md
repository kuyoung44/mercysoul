# MSVB Language Specification — Draft 0.1

This is an experimental proposal for **MercySoul Vision Brain Language (MSVB), 4/4MS16**. It is not an established language standard yet.

## 1. File and version

- Extension: `.msvb`
- Text encoding: UTF-8
- A file begins with `MSVB 0.1;`
- Identifiers use ASCII letters, digits, and underscores; they cannot begin with a digit.
- Strings use double quotes. Comments begin with `#` and continue to the end of the line.
- Unknown directives must fail closed; a parser must not silently ignore them.

## 2. Draft grammar (simplified)

```ebnf
program       = header, { declaration } ;
header        = "MSVB", version, ";" ;
declaration   = identity | policy | flow | task ;
identity      = "IDENTITY", string, ";" ;
policy        = "POLICY", identifier, "=", literal, ";" ;
flow          = "FLOW", identifier, "=", string, ";" ;
task          = "TASK", identifier, "(", [parameters], ")", block ;
parameters    = identifier, { ",", identifier } ;
block         = "{", { statement }, "}" ;
statement     = say | let | return ;
say           = "SAY", expression, ";" ;
let           = "LET", identifier, "=", expression, ";" ;
return        = "RETURN", [expression], ";" ;
expression    = literal | identifier | expression, "+", expression ;
literal       = string | number | "true" | "false" | "null" ;
```

The grammar is intentionally small. This draft does not define loops, arbitrary network access, filesystem access, imports, reflection, or unrestricted code execution.

## 3. Reserved declarations

- `IDENTITY "LEGACY-44";` identifies the governance profile.
- `POLICY human_judgment_required = true;` requires human decision-making for consequential actions.
- `POLICY externalMutation = false;` prohibits external mutations unless a separately reviewed capability and approval authorize them.
- `POLICY verify_before_execute = true;` requires verification before execution.
- `FLOW main = "RECEIVE -> ROUTE -> THINK -> PLAN -> GUARDIAN -> APPROVE -> EXECUTE -> VERIFY -> RECOVER -> RECORD";` declares the lifecycle for orchestration.

A runtime must not treat a source-file policy as proof of real authorization. Authorization must be checked against trusted runtime controls and audit records.

## 4. Example

```msvb
MSVB 0.1;
IDENTITY "LEGACY-44";
POLICY human_judgment_required = true;
POLICY externalMutation = false;
POLICY verify_before_execute = true;
FLOW main = "RECEIVE -> ROUTE -> THINK -> PLAN -> GUARDIAN -> APPROVE -> EXECUTE -> VERIFY -> RECOVER -> RECORD";

TASK greet(name) {
  SAY "Aṣẹ, " + name;
  RETURN "ready";
}
```

## 5. Effect model

Every future operation must be classified as one of:

- `PURE`: deterministic computation without external side effects.
- `READ`: read-only access through an explicitly configured adapter.
- `MUTATE`: changes external state and requires capability checks, authorization, and audit.
- `CONSEQUENTIAL`: high-impact action requiring explicit human judgment and approval.

The v0.1 grammar supports only basic declarations and local statements; it does not itself authorize READ, MUTATE, or CONSEQUENTIAL operations.

## 6. Translation and compatibility rules

1. Parse source into an intermediate representation before generating target code.
2. Preserve observable behavior; do not silently invent defaults or drop unsupported constructs.
3. Report each construct as translated, unsupported, or requiring human review.
4. Do not execute generated output during translation.
5. Preserve secrets as environment references; never embed credential values.
6. Require source/target tests and review before replacing a production implementation.
7. Translation is not semantic equivalence until tests and review support that claim.

## 7. Errors

A conforming parser must reject invalid syntax, unknown policies, duplicate declarations, unsupported operations, malformed strings, and unsafe effect requests. Error messages should identify file and line without leaking secret values.

## 8. Compatibility status

No complete compiler, runtime, or universal language converter is defined by this draft. Version 0.1 establishes the proposed vocabulary, safety principles, and migration contract only.
