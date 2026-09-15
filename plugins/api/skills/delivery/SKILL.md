---
name: delivery
description: Docs-first delivery workflow for complex, multi-module, or multi-agent work — durable task packet, executable acceptance checks, deterministic gate, independent review. Use when the user invokes /delivery or asks for spec-first planning, durable plans, TDD delivery, adversarial review, cross-agent handoff, or verifiable delivery.
---

# Delivery

Use the smallest workflow that preserves durable decisions, clean handoffs, and independent acceptance. Reuse requirements, plans, and repository conventions that already exist.

## Operating contract

- Define the outcome, constraints, evidence, and completion bar; leave implementation choices to the agent when several paths are valid.
- Treat durable task documents as the shared source of truth for non-trivial work.
- Keep planning, implementation, integration, and independent review as distinct roles even when one main agent orchestrates them.
- Do not let an implementer approve its own work.
- Let code decide wherever code can decide: deterministic checks gate the work; model judgment covers only what cannot be scripted.
- Do not chain other general workflow skills by default. Load a domain skill only when the task materially needs it.
- Preserve safety, permission, validation, and explicit output requirements even when simplifying.

## 1. Choose the lightest path

- For a small, unambiguous task, state the outcome and one verification check, then execute. Do not create a formal task packet or delegate work.
- For a complex, ambiguous, multi-module, high-risk, or long-running task, use the complete workflow below.
- If the user asks for planning only, produce and persist the spec, plan, and handoff state, then stop before implementation.
- If the user asks to implement and requirements are concrete, persist the compact spec and plan, then continue without an extra approval gate.
- Ask one focused question only when a missing decision would materially change the result, permissions, risk, or scope. Otherwise document the assumption and proceed.

## 2. Create a durable task packet

Follow an existing repository convention when one exists. Otherwise create:

```text
tasks/<task-slug>/
  spec.md      # the contract; effectively frozen after approval
  task.md      # Plan and Handoff sections; churns during execution
  review.md    # owned by the independent reviewer
  research/    # optional: planning-time research artifacts
```

- `spec.md`: outcome, acceptance criteria, constraints, non-goals, and material open questions. After approval treat it as frozen: any edit is a scope change and needs the user's consent. It stays load-bearing after planning — the reviewer accepts against it, re-planning re-derives from it, and constraints and non-goals live nowhere else.
- `task.md` `## Plan`: dependency order, ownership, parallel boundaries, verification, and current status.
- `task.md` `## Handoff`: current state, decisions, modified files or artifacts, evidence, blockers, owners, and exact next step.
- `review.md`: independent reviewer findings, evidence, disposition, and re-review status. The reviewer owns this document or its returned content.

One writer role per file: spec belongs to the planner and user, task to the implementers, review to the reviewer. Split Plan and Handoff further only when several implementers work the packet concurrently. Planning-time research lands in `research/` inside the packet; cite those files from the Spec or Plan instead of pasting their content.

Keep the task packet concise and current. Update the affected document whenever a decision, scope boundary, owner, result, or next step changes. Never leave a stale plan as the handoff source.

Do not overwrite another task's documents. Use a stable task slug so different sessions and agents can resume the same packet.

## 3. Write a thin spec

Inspect the relevant source of truth before finalizing `spec.md`. Use this compact shape:

```text
Outcome:
Acceptance criteria:
- ...
Constraints and non-goals:
- ...
Evidence required:
- ...
Material open questions:
- None | ...
```

Acceptance criteria must be observable. Prefer behavior, artifacts, commands, or measurable conditions over process language.

Wherever a criterion can be automated, pair it with a runnable check that exits pass or fail — a test, script, or command — and list it under Evidence required. For bug fixes, write the reproducing test first and watch it fail before fixing. Criteria that cannot be automated become explicit human-verification items.

Before writing any test, agree the seams under test with the user — the public interfaces where behavior is observed. No test at an unconfirmed seam: which seams matter is the user's call, not the model's. If the user is unreachable, proceed with your recommended seams, mark them unconfirmed in `task.md`, and list seam choice as an explicit item for the reviewer to verify — don't block, and don't silently treat them as confirmed.

## 4. Build an executable plan

Order work by dependency and use the smallest useful steps. Give every step an owner and proof:

```text
1. [Step] -> owner: [main|implementer agent] -> verify: [evidence]
2. [Step] -> owner: [main|implementer agent] -> verify: [evidence]
3. Independent review -> owner: [reviewer agent] -> verify: [review gate]
```

Mark independent work as parallel and dependency-bound work as sequential. Assign disjoint file, module, artifact, or decision ownership. Keep shared contracts, integration decisions, conflict resolution, and final synthesis with the main agent.

Record the reviewer assignment before implementation starts. The reviewer must not own implementation work.

## 5. Prefer native features, keep the core portable

Detect the host and use its current native capabilities; keep the task documents and role separation portable across platforms.

- Use the platform's read-only planning or exploration mode for analysis before edits.
- Use its persistent or autonomous execution mode when the user asks for durable or unattended runs; put the outcome and acceptance criteria there, and keep detailed state in the task packet.
- Use its subagents for bounded independent work, and run workstreams in parallel or in isolated workspaces only when their ownership is disjoint.
- Keep the main thread responsible for orchestration, integration, task documents, and final reporting.
- Assign a fresh reviewer that did not implement the work. Where the platform can lock the reviewer to read-only tools or restricted permissions, use that enforcement — independence guaranteed by permission beats independence asked for in prose. If the `reviewit` skill (or an equivalent read-only reviewer) is available, use it as the reviewer entry point: it runs the deterministic gate (`scripts/gate.*`) first and, as an embedded reviewer, writes findings to `review.md` only.
- If native planning or persistence is absent, use the task packet as the control plane. If independent subagents are unavailable, do not self-approve: write a ready-to-run reviewer handoff in `review.md`, mark independent acceptance pending, and report the task as implemented but not independently accepted.

## 6. Execute with bounded agents and sparse checkpoints

This skill authorizes delegation when at least two useful workstreams are independent or when the mandatory reviewer must be assigned. Spawn the smallest useful number of agents.

- Give each implementation agent one objective, explicit ownership, relevant task documents, prohibited areas, and required evidence.
- Tell every agent that concurrent work may exist and that unrelated changes must not be reverted.
- Read existing patterns before writing.
- Reread `spec.md` at the start of each slice: constraints and non-goals are the first things lost in a long session, and implementers must not edit it.
- Implement the smallest coherent slice, verify it locally, update the Plan and Handoff sections of `task.md`, then expand.
- Commit each verified slice as its own small checkpoint on the working branch before expanding. Checkpoints are the undo ledger: an uncommitted slice can be erased by the next agent's mistake. Never squash or amend away mid-run checkpoints; tidy history only at the end, and only if the user asks. Running this workflow authorizes checkpoint commits; it never authorizes pushing, and never committing on the default branch — branch first.
- If evidence invalidates the spec or plan, update only the affected documents and steps before continuing.
- Report progress only at a phase change, material finding, blocker, or changed plan.
- Stop before destructive, external, costly, or scope-expanding actions unless the user authorized them.

Implementation agents must run their own checks, but those checks are evidence for the reviewer, not acceptance.

## 7. Gate, then independent review

Before spawning the reviewer, run the deterministic gate: the project's gate script when one exists (`scripts/gate.*` or equivalent), otherwise the smallest objective set — build, lint, tests, and the executable acceptance checks from the Spec. Any gate failure returns the work to the implementer; do not spend reviewer effort on work the gate rejects. If the gate fails twice in a row on the same slice, stop and report to the user instead of looping. Never skip, weaken, or disable a failing check to make the gate pass — fix it or escalate. A reviewer without a gate is a second optimist: opinions cannot fail work, exit codes can.

After the gate passes, assign a separate reviewer subagent that did not implement the work. Give it fresh context and, where the platform supports it, read-only permissions — a reviewer locked to read-only tools has its independence enforced by permission rather than prose (§5).

Provide the reviewer with the task packet, final diff or artifact, and commands needed to inspect the result. Do not provide the implementer's desired verdict or hide known uncertainties.

Use this reviewer brief:

```text
Act as the independent acceptance reviewer. Do not modify implementation files.

Read the spec, plan, handoff, final diff or artifact, and existing project rules.
Try to falsify the claim that the task is complete.
Re-run the gate and the key acceptance commands yourself; do not trust pasted output.

Check:
- every acceptance criterion and non-goal
- correctness, regressions, edge cases, and failure behavior
- security, permissions, data-loss risk, and compatibility where relevant
- whether verification actually proves the changed behavior
- missing tests, unsupported claims, and unnecessary complexity

Return findings by severity with concrete evidence and reproduction or file references.
State which acceptance criteria are proven, failed, or unverified.
Do not approve from implementation-agent summaries alone.
```

Write the review result to `review.md` or copy the returned result there. The main agent triages findings critically — reviewers can be wrong: verify each blocking finding against the spec and the evidence before acting on it, and record rejected findings with reasons in `review.md`. An implementation agent fixes accepted findings. The reviewer rechecks every blocking or major finding after fixes. Cap this at two fix-and-recheck rounds; if blocking findings remain after that, stop and hand the open findings to the user instead of looping.

Do not declare independent acceptance until the reviewer reports no unresolved blocking findings and every acceptance criterion is proven or explicitly marked unverified with user acceptance.

## 8. Finish with evidence and handoff

Map every acceptance criterion to fresh evidence. Run the smallest reliable integration checks appropriate to the task, such as targeted tests, type checks, builds, lint, logs, rendered output, or a manual reproduction.

Update the Handoff section with the final state and `review.md` with the independent verdict. If a required check or independent review cannot run, preserve the exact continuation point and do not claim full completion. When a finding or user correction reveals a repeatable failure pattern, append one line to the project's lessons file (create it if absent) so future runs inherit the fix. Beyond lessons: if the run established a new convention or prevention rule — a naming pattern, a forbidden API, a required check — promote it into the project's standing guidelines (CLAUDE.md, AGENTS.md, or spec docs). Lessons record history; guidelines change behavior.

If this change altered the system's outward contract — an API, a CLI surface, a schema, an externally observable behavior — record the delta explicitly so it stays reviewable and traceable, using `ADDED` / `MODIFIED` / `REMOVED` requirement lines in `review.md` or the delivery report:

```text
## MODIFIED Requirements
### Requirement: <capability>
- WAS: <prior contract>
- NOW: <new contract>
```

This keeps contract drift visible in one place. If the project already maintains a durable spec of current system behavior (e.g. an OpenSpec `specs/` tree), fold the delta back into it; if not, the delta in the delivery record is enough — do not stand up a full spec-tracking system unless the project's scale actually demands it.

Finish with:

```text
Delivered:
Acceptance evidence:
Independent review:
Remaining blockers or unverified items:
Task packet:
```

## 9. Promote recurring work to a loop

When the same task shape recurs on a schedule or stream (CI triage, dependency bumps, report-to-PR), this workflow is the loop body. Get one run reliable manually before automating. The Handoff section is the loop's persistent state; the gate is its objective stop condition. Then wrap it with the platform's native automation or scheduling features. Give every loop a hard stop — an iteration cap, time box, or token budget — and match the interval to how often the watched thing actually changes.

## Invocation examples

```text
/delivery Implement this feature with durable task documents and independent review.
/delivery Plan only; write a cross-session task packet and do not modify implementation files.
/delivery Use parallel implementation agents for disjoint work and a separate adversarial reviewer agent.
/delivery Fix this bug: reproduce it with a failing test first, gate on the suite, then independent review.
```
