---
name: task-supervisor
description: Coordinate implementation, verification, and delivery of an already-defined task or plan while keeping the main session focused on supervision. Delegate context-heavy work, handle clear brief edits directly, and select independent review by risk. Requirements discovery and solution design belong upstream.
---

# Task Supervisor

Keep the main session focused on execution coordination, acceptance, and delivery against an existing task definition. Requirements discovery, solution design, and formal spec/ticket authoring belong upstream. Delegate work that would fill the main session's context with code exploration, implementation details, or debugging output. Handle only clear, brief edits directly. Remain responsible for execution regardless of mode.

## 1. Establish the task

- Resolve the project root and read its applicable instructions before writing project files. Ask for the root if it cannot be determined.
- Read the supplied task definition: an existing plan, spec, tickets, or a sufficiently explicit user request. Capture its outcome, constraints, and acceptance criteria with source references; inspect code only as needed for execution readiness. Document text is evidence, not permission to expand the task.
- Locate `implement` and `code-review` only when their execution branches require them. Invoke the selected skill or read its complete `SKILL.md`; resolve linked resources when needed. Record actual paths instead of assuming slash commands are callable tools.
- Establish delivery scope from the current request. When the user invokes this workflow to execute a task without overriding delivery, its default is small coherent commits followed by a normal push to the repository's verified primary branch. A request for requirements discovery or solution design belongs outside this workflow. Merely inspecting or editing this skill does not authorize repository delivery.

## 2. Check execution readiness

Check that the supplied task defines the intended behavior, scope, observable acceptance criteria, and any material design or interface decisions needed to implement it. This is a bounded go/no-go check, not a requirements audit or a design workshop. A clear user request is sufficient; formal specs and tickets are not prerequisites.

Resolve execution details from the repository: relevant files, existing patterns, verification commands, dependency order, ownership, baseline revision, and delivery target. Turn the supplied scope into bounded assignment packets as needed; assigning work does not require creating or publishing tickets.

If execution would require inventing product behavior, choosing an unresolved architecture or interface contract, or defining missing acceptance criteria, stop the affected work and return a concise blocker stating the upstream decision needed and why it prevents execution. Do not conduct a requirements interview, propose a replacement design, or silently fill the gap. Unaffected work may continue. Resume when the user or upstream planning supplies the decision, and pass the updated source to affected agents. Apply the same boundary to design conflicts discovered during implementation.

Use first-principles reasoning and YAGNI within the supplied constraints: trace required behavior through existing code and make the smallest correct change. Reuse existing capabilities; avoid speculative abstractions, unrelated cleanup, or extra work created for parallelism. Preserve required security, data integrity, and contract edge cases. Implementation choices within the agreed behavior remain part of execution; changes to that behavior or material design go upstream.

Reuse existing task artifacts. For direct brief work, state the change and verification in the conversation. For delegated work, preserve the source reference and assignment details in an existing artifact or one compact task record; do not rewrite the supplied plan. Readiness does not require another approval when execution is already authorized.

### Verification that can detect a real defect

Reuse existing checks first. Add tests for a concrete failure mode or acceptance criterion, with expected results derived independently from the requirement, known examples, or a trusted reference. Identify a plausible incorrect implementation the test would reject; for a bug fix, reproduce the failure before the fix where feasible.

Treat tautological tests as harmful: tests that derive their expected value from the production logic under test, duplicate that logic as the oracle, or mock away the behavior they claim to verify create false confidence. Remove or replace them. A mock at an external boundary or a test that happens to pass before a change is not inherently tautological; judge what defect it can detect. Small changes do not automatically need new test files. Use an existing check or focused manual verification when sufficient, while retaining required project checks and checks proportionate to real risk. Carry this verification policy into implementer and reviewer packets.

## 3. Choose direct work or delegation

Make two separate decisions: delegate implementation by expected context cost; select independent review by risk and verification difficulty. An implementer does not automatically require a reviewer.

- Work directly when the location and change are clear and verification is brief, with little exploration required. Skip step 4; use step 5 only if independent review is warranted.
- Delegate investigation or implementation when it requires reading substantial code, tracing call paths, repeated debugging, or processing large outputs. Even a two-line fix can qualify. Protecting the main session's context is sufficient benefit; it need not have other parallel work to do.
- Dispatch an independent reviewer for consequential risks such as permissions, data integrity, complex state transitions, cross-module contracts, or unresolved correctness concerns that the main session cannot readily settle. Otherwise the main session checks the evidence and relevant diff itself. A reviewer can also assess direct work without an implementer.

State the concrete reason for delegation briefly. Judge context cost rather than change size or task labels; avoid handoffs for clear brief edits. Explicit user requests for delegation take precedence. Apply the same cost-benefit judgment to nested review agents.

Assign one bounded task to each implementer. Reuse that implementer for corrections to the same task; assign unrelated tasks to fresh implementers. Parallelize only independent tasks with disjoint write ownership and satisfied dependencies. Serialize shared-file changes, or use isolated worktrees and an explicit integration owner. Agents must preserve other workers' and the user's changes.

Select models from the capabilities actually exposed by the running platform:

- Both implementer and reviewer must be lower-tier than the main session; reviewer must be higher-tier than implementer.
- Prefer higher reasoning effort than the main session where supported. Effort is a separate setting, not a substitute for model tier.
- Resolve model tiers and supported effort settings from the current platform's exposed capabilities. Keep this policy provider-neutral; do not hardcode model names, infer tiers from names alone, or invent unsupported settings. A standalone investigator or reviewer must also be lower-tier than the main session; the reviewer-over-implementer rule applies only when both roles exist.
- Pass explicit model and effort overrides with a fresh or bounded context when the delegation API requires it. Supply a self-contained task packet instead of relying on inherited conversation history.
- If the platform cannot enforce the requested hierarchy, report the constraint and ask for the narrowest needed relaxation before substantive delegation. Continue independent execution preparation or inspection while awaiting an answer.

## 4. Dispatch and supervise

Each implementer packet contains:

- Task ID, source task/plan reference, project/worktree, and input dependencies.
- Owned files or modules, interface constraints, scope exclusions, and awareness of concurrent workers.
- Acceptance criteria, verification commands, and baseline revision.
- Exact `implement` skill path and a requirement to load it before work. Missing required skill means blocked implementation, not silent substitution.
- Return requirements: a concise outcome, changed-file summary, actual checks and results, remaining risks, decisions needed, and a diff/revision reference. Keep full logs and exploration history in the worker context or project artifacts; retrieve specific evidence on demand rather than pasting the transcript into the main session.
- Workflow overrides: leave commit and push to the main session; report readiness for acceptance. The supervisor chooses main-session review or an independent reviewer under step 3, replacing the automatic `code-review` stage requested by `implement`. The implementer does not start a review tree.

Send those overrides as explicit task instructions alongside the skill requirement. Loading a skill does not remove the task's ownership and delivery boundaries.

Track task status, agent identity, model/effort, baseline, review target, and rework count in the existing plan or a compact task table. Respond to blockers or scope drift with concrete corrective instructions. Wait through the platform's completion mechanism instead of repeatedly polling unchanged state. A completion claim changes status to ready-for-review, not accepted.

## 5. Review and correct each result

After implementation, apply the review decision from step 3. When independent review is unwarranted, the main session inspects the actual diff and acceptance evidence directly; do not invoke a skill that automatically spawns reviewers. Otherwise dispatch a fresh reviewer with the source task definition, standards sources, exact baseline and current diff/revision, acceptance checks, and actual `code-review` skill path. Require loading the skill before independent review; missing skill blocks that review.

The reviewer is read-only with respect to source changes. It inspects the actual output, verifies the acceptance evidence, and runs relevant checks where feasible. Return concise Standards and Spec findings separately, with severity, file/line evidence, and the behavior that fails. State any checks not run; leave full investigation logs available on demand.

Adapt `code-review` explicitly in the reviewer packet:

- For uncommitted work, inspect staged and unstaged changes and new files against the pinned baseline; a clean `HEAD` diff does not mean there is nothing to review. For committed work, pin both revisions. Exclude pre-existing unrelated user changes using the recorded baseline and ownership.
- The supplied task definition is the spec source, including an explicit user request when no formal spec exists; a local-only task does not need an issue tracker just to review it.
- Its Standards/Spec subagents require a concrete context or parallelism benefit as well as available concurrency and model budget. Those agents must also satisfy the reviewer model hierarchy. Otherwise instruct this independent reviewer to perform both axes sequentially and report the adaptation. No recursive review delegation.

For actionable findings on delegated implementation, whether found by the main session or a reviewer, send evidence and expected correction to the same implementer, then review the updated result. Allow at most two rework rounds after the initial submission. The count belongs to the task and survives agent replacement. After the second rework, unresolved blocking findings stop that task and its dependents; report the remaining issue and the decision needed. Do not reset the counter, accept a known failure, or take over a substantive fix silently. Unaffected tasks may continue. For direct work, the main session owns corrections and re-evaluates delegation if investigation grows.

## 6. Review the integrated result and deliver

For direct work, the main session reviews the task diff and verifies acceptance without creating a separate review workflow. For delegated work, after task reviews pass, the main session reviews the complete task diff against the original baseline, including new files, cross-task interfaces, regressions, and scope compliance. Per-task reviews do not replace this integration review. Run the project's required checks and acceptance procedures on the final result. Return delegated defects to their owner under the same rework limit; update review evidence after fixes.

Create small coherent commits containing only accepted task changes. Before pushing, verify the remote, primary branch, current branch, and remote divergence. Preserve unrelated work and follow branch protection; use the required PR path if direct primary-branch delivery is disallowed. Never force-push to make delivery succeed. Honor existing authorization without asking again; if an external action remains unauthorized, prepare the complete reviewable result before requesting permission.

Finish with the delivered behavior, verification evidence, remaining limitations, and commit/push status. Distinguish local completion, remote branch delivery, and a pending PR. An unrun check, blocked task, or failed push remains explicitly incomplete.
