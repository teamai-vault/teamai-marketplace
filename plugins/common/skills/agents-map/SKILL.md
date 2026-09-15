---
name: agents-map
description: Survey a repository for evidence, then map it — first as a report, then as agent instructions. Use when the user wants to understand an unfamiliar or legacy repository, or wants to write or refresh AGENTS.md or CLAUDE.md instead of running a vendor `/init`.
---

# Agents Map

Survey an unfamiliar repository for evidence, then map it: first a report you can read, and — when asked — a thin set of agent instructions.

**A map is not the ground. Survey first; draw only what you saw.**

## Principles

- **Evidence before instruction.** Repo-specific claims must trace to code, config, docs, CI, tool output, history, or representative observation.
- **Unknown beats plausible.** Mark gaps, conflicts, and partial traces; never fill them with framework defaults.
- **Sample before convention.** One file proves existence, not a repository rule.
- **Trace behavior.** Follow real execution/data paths instead of inferring architecture from names.
- **Validate commands.** Never invent build, test, lint, migration, or deployment commands; never claim an unexecuted check passed.
- **Distill, do not dump.** `AGENTS.md` is a compact map, not the survey report.
- **One source of truth.** Do not clone the same repo rules into multiple vendor files.
- **Respect side effects.** A survey alone is not permission to install large dependency sets, start costly stacks, migrate data, call paid APIs, deploy, or touch production.

Read `references/PROBES.md` once the repository ecosystems are known. Read `references/REFERENCE.md` when classifying ambiguous evidence, writing/updating `AGENTS.md`, choosing nested instructions, or auditing the result.

## Modes

**Map mode** — the user asks to understand or explain a repository. Report the repository map in the conversation; write a file only if asked, and leave instruction files alone.

**Instruction mode** — the user asks to initialize agent instructions, create/update `AGENTS.md`, or replace a vendor `/init`. Run the same survey first, then write/update the canonical instruction source.

When the invocation is ambiguous, run Map mode and offer instruction mode at the end. Steps 1-5 are identical either way, so the choice can wait until the evidence exists.

## 1. Establish authority

Find existing guidance before drawing conclusions:

- root/parent/nested `AGENTS.md`;
- `CLAUDE.md`, `.claude/CLAUDE.md`, `.claude/rules/`;
- Copilot and Cursor repository instructions;
- `CONTRIBUTING*`, development, security, release, and runbook docs.

Determine the repository root and workspace/module boundaries. Identify generated, vendored, cached, dependency, and build-output areas so they do not dominate exploration.

**Done:** authoritative local guidance and repository scope are known or explicitly absent/uncertain.

## 2. Survey the repository

Use a shallow tree, targeted search, and selective reads. Do not recursively dump the repository.

Establish from independent signals:

- purpose and consumers;
- languages, runtime versions, build/package systems, workspace boundaries;
- application/library/CLI/worker entry points;
- runtime and deployment configuration;
- persistence and external-service boundaries;
- test/lint/typecheck/build/static-analysis/CI surfaces;
- recent history when useful.

Treat manifests as evidence of presence, not proof of active architectural use.

Maintain an **evidence ledger** for material claims — working state for this session, not a file in the repository. At minimum distinguish verified/documented facts, observed conventions, local exceptions, conflicts, and unknowns. Use `references/REFERENCE.md` for the full classification rules.

**Done:** major boundaries, entry points, verification surfaces, and material unknowns have concrete evidence.

## 3. Trace architecture and conventions

Build a compact map of runtime processes, package/service boundaries, interfaces, logic placement, persistence/external boundaries, generated code, and important dependency directions.

Trace at least one representative flow:

```text
trigger
→ entry point
→ validation/auth/parsing
→ orchestration/domain logic
→ persistence/external boundary
→ response/event/side effect
```

Adapt the stages for HTTP, events/jobs, CLI tools, or libraries. Mark unverifiable segments `partial`.

Before declaring a convention:

1. sample multiple representative files in the relevant scope;
2. look for counterexamples;
3. distinguish repo-wide, module-scoped, and local patterns;
4. in legacy repos, actively look for multiple architectural eras or migrations.

**Done:** at least one important flow is evidence-backed or explicitly partial, and material conventions are scoped rather than guessed.

## 4. Build the verification model

Discover real commands in this order when available:

1. CI;
2. repo-owned wrappers/scripts/task runners;
3. build manifests;
4. maintained developer docs;
5. README examples.

Framework defaults are search hints, never facts.

Classify applicable checks:

- **Fast/focused** — cheapest meaningful check for a small change;
- **Full gate** — complete repository/module validation;
- **Prerequisites** — services, credentials, containers, VPN, tools, network;
- **CI-only/restricted**;
- **Side-effectful**.

Validate low-risk commands when the existing environment supports them. Prefer `--help`, task listings, dry-runs, and focused checks. If execution is unavailable, label the command **discovered, not runtime-validated**.

**Done:** a future agent can tell how to validate a small change, what the full gate is, and what prerequisites/restrictions apply.

## 5. Build a first-change map

For the repository's relevant work types, answer:

```text
I want to change X
→ where do I start?
→ what adjacent area is normally involved?
→ how do I verify it?
```

Cover only applicable branches: feature/API/schema/job/config/test/deploy/generated artifact, etc. Keep this navigational, not an implementation plan.

Resolve only **material unknowns**: gaps that would change a command, architecture boundary, dangerous operation, repo-wide convention, or instruction scope. Ask targeted questions when interaction is available; otherwise keep the gap explicit.

**Done:** a new agent can identify a safe starting point for common changes and can see unresolved hazards.

## 6. Distill instruction candidates

Run only in Instruction mode.

Do not write instructions directly from observations. For each candidate ask:

1. What agent behavior would this change?
2. What evidence supports it?
3. What scope applies?
4. Is it non-obvious or expensive to rediscover?
5. Is it stable enough to persist?
6. Does most work in this scope need it?
7. Would a context pointer be better?
8. Would code/CI/lint/test/hook enforce it better?

Delete candidates that do not earn permanent context.

Prefer branch-triggered pointers:

```text
When <trigger>, read <target>.
```

Do not inline branch-specific domain knowledge, ADRs, runbooks, or long procedures.

**Done:** every surviving candidate has evidence, scope, behavioral value, and the correct context tier.

## 7. Write/update canonical instructions

If `writing-for-agents` is available, use it now.

Otherwise apply the distillation and placement rules in `references/REFERENCE.md`.

Prefer a portable root `AGENTS.md` when the repository has no stronger canonical convention.

Updating an existing instruction file is a re-verification pass, not a rewrite: check each existing instruction against current evidence, keep the ones that still hold, correct the ones the evidence contradicts, and report every removal with the evidence that retired it. An instruction you cannot verify either way stays, flagged as unverified.

Use nested `AGENTS.md` only for genuinely different scoped commands/constraints. Avoid relying on nested files to contradict root rules because harness precedence differs.

Do not create vendor adapters unless requested or already conventional. If a Claude adapter is needed, prefer importing `AGENTS.md` rather than duplicating it.

Do not create `CONTEXT.md`, ADRs, specs, or new deep documentation merely because the survey found missing knowledge; those require their own authoring/decision workflow.

**Done:** the canonical instruction source is thin, scoped, evidence-backed, non-duplicative, and pointer-friendly.

## 8. Audit

Read the new/changed instructions as a fresh agent would, and check each line against the anti-pattern catalog in `references/REFERENCE.md`. A line that survives is repository-specific, evidence-backed, and changes what an agent does.

If the root instructions start reading like documentation rather than a map, run another pruning and disclosure pass.

**Done:** every line of the instruction file traces to ledger evidence and to a behavior it changes.

## Output

### Map mode

Return:

```md
# Repository Map: <name>

## Purpose and boundaries
## Architecture and representative flow
## Key entry points
## Evidence-backed conventions
## Verification
## First-change map
## Conflicts and unknowns
```

### Instruction mode

Also create/update the canonical instruction file and report:

- what changed;
- evidence behind non-obvious rules;
- what was intentionally omitted or placed behind pointers;
- unresolved conflicts/unknowns.

