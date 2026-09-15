# Agents Map Reference

Read this when evidence is ambiguous, when generating/updating agent instructions, or when the main workflow asks for an audit.

## Evidence ledger

Useful classes:

- **mechanically verified** — code, config, CI, repo-owned scripts, or tool output directly supports the claim;
- **documented** — repository documentation or existing instructions explicitly state it;
- **observed convention** — repeated in representative code with no material counterexample;
- **local exception** — true only in a limited area;
- **historical support** — git history supports the interpretation; secondary evidence only;
- **conflict** — credible sources disagree;
- **unknown** — evidence is insufficient.

A documented claim is not automatically current. If README and executable configuration disagree, record a conflict and investigate rather than silently choosing prose.

For small populations, state the sample size. For larger ones, sample across relevant modules/ages/authors where practical.

## What earns AGENTS.md context

The candidate gate lives in `SKILL.md` step 6. What it cannot settle in the abstract is how the answers look in practice.

The environment is itself a source of truth: a fact an agent can read straight off a manifest or `--help` earns permanent context only when its *consequence* is non-obvious.

Prefer:

```text
Integration tests require Docker and are outside the fast loop; run `<focused>` before `<full>`.
```

over:

```text
This project uses Maven and Java 21.
```

when the latter is immediately visible from build files.

## Progressive disclosure

Use a pointer when only some branches need the material:

```text
When <branch>, read <target>.
```

Examples:

```text
When changing domain behavior, read `CONTEXT.md` and the relevant ADRs first.
When changing database migrations, follow `docs/agents/database.md`.
```

Keep domain glossaries, ADR contents, runbooks, architecture essays, and long procedures out of root instructions unless every task truly needs them.

## Mechanical enforcement

If compiler/linter/formatter/test/CI/hook reliably enforces a rule, prefer documenting:

- how to run the gate;
- any non-obvious prerequisites;
- how to interpret/fix failures.

Do not duplicate every linter rule in natural language.

## Suggested root shape

This is a heuristic, not a schema:

```md
# Repository

<Only non-obvious orientation needed to work safely.>

## Working agreements
- <high-value repository-specific constraint>

## Verification
- Fast: `<command>`
- Full: `<command>`
- <important prerequisite or restriction>

## Architecture boundaries
- <important invariant>
- <pointer to deeper source>

## Where to look
- When <branch>, read `<target>`.
- When <branch>, start at `<path>`.
```

## Nested AGENTS.md

Use nested files when a subproject has genuinely different:

- build/test commands;
- architecture constraints;
- generated-code rules;
- operational hazards;
- technology/workflow.

Do not create nested files merely to split prose.

Cross-agent implementations differ in merge/precedence details, so prefer additive scoped guidance. Avoid designs that are correct only if a nested file negates a root instruction.

## Canonical source and adapters

Prefer one shared source:

```text
AGENTS.md            ← canonical
CLAUDE.md            ← optional adapter
.cursor/rules/*      ← Cursor-specific only
.github/...          ← Copilot-specific only
```

When a Claude adapter is requested:

```md
@AGENTS.md

## Claude Code

<Claude-specific instructions only>
```

Do not copy the same rules into both files.

## Artifact boundaries

`agents-map` discovers and routes; it does not invent missing knowledge.

- `CONTEXT.md` — domain glossary / ubiquitous language; use a domain-modeling workflow.
- ADR — rationale for a real consequential decision; do not infer rationale from code and write it as fact.
- `docs/agents/*` — deeper task-specific operating guides when intentionally authored.
- skills — reusable multi-step procedures.
- specs/plans — separate planning workflows.

## Legacy repository checks

Actively test for:

- stale README vs CI/config;
- multiple architectural eras;
- active migration from old to new patterns;
- dead dependencies;
- generated/vendored code;
- expensive or environment-bound test suites;
- hidden organization knowledge not present in repo.

Recency in git history supports a conclusion but does not make it policy.

## Anti-pattern catalog

- **README echo** — rewriting existing docs into agent instructions.
- **Framework fanfic** — filling gaps with framework conventions.
- **One-sample convention** — promoting a local example to a rule.
- **Architecture by directory name** — treating labels as proof of behavior.
- **Dependency = usage** — assuming manifest presence means active architecture.
- **Command invention** — guessing build/test/migration/deploy syntax.
- **Context dump** — persisting the whole repository model in `AGENTS.md`.
- **Vendor duplication** — maintaining equivalent rules in several agent files.
- **Stale cache** — copying easy-to-query environment facts into permanent context.
- **History worship** — treating recent commits as policy without corroboration.
- **Premature ADR** — inventing rationale for existing decisions.
- **Fake verification** — reporting unexecuted checks as passed.

## Size signal

There is no universal line limit. If the root file grows to roughly one or two screens / ~100–150 lines, treat that as a review signal rather than a failure condition: run pruning, pointer, scope, and mechanical-enforcement tests again.
