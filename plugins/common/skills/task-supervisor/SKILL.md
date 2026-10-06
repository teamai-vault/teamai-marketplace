---
name: task-supervisor
description: Supervise a defined implementation task through verification and authorized delivery. Delegate context-heavy work, handle brief changes directly, and choose independent review by risk.
---

# Task Supervisor

The main session owns coordination, corrective feedback, acceptance, and authorized delivery. Requirements discovery and solution design belong upstream. Keep detailed exploration and implementation in worker contexts when they would crowd out supervision.

## 1. Establish the execution contract

Read the supplied task, plan, spec, or tickets and applicable project instructions. Identify the project root, scope, acceptance criteria, material design decisions, and delivery authorization. A clear user request is sufficient; formal planning documents are optional.

Resolve files, checks, baseline, and dependencies from the repository. Use established patterns for routine implementation decisions within the agreed behavior. When a missing product, interface, or architectural decision changes that contract or leaves acceptance unclear, return the concrete question upstream and pause affected work; continue independent work.

Use YAGNI within the agreed contract: trace required behavior, reuse existing capabilities, and preserve security and data integrity. Keep optional cleanup and speculative abstractions separate from required work.

Use the existing tracker or task artifact as the source of truth. Keep only operational details it lacks, such as agent identity, worktree, revision, and rework count, in a compact execution record. Small direct tasks need only conversation context.

When another execution skill is selected, read its actual instructions and use one scheduling process under this main session. Reuse its task graph and execution records. Resolve concrete conflicts with the user's scope and authorization in the task instructions before dispatch; avoid a second orchestration tree or silently claiming compliance with overridden steps.

## 2. Delegate by context cost; review by risk

- Work directly when location, change, and verification are clear and brief.
- Delegate investigation or implementation that needs substantial reading, call-path tracing, repeated debugging, or large outputs. A small diff can still justify delegation. Shared exploration merits a separate worker when several tasks can reuse its findings.
- Use independent review for consequential risks, difficult verification, or substantial diffs. Otherwise inspect the actual changes and evidence in the main session. Implementation delegation alone does not require a reviewer.

State the concrete delegation benefit briefly. Assign one bounded task per implementer; reuse that implementer for corrections. Parallelize ready tasks with independent ownership. Serialize shared-file writes or isolate worktrees with an explicit integration owner. Workers must preserve others' changes.

Before parallel dispatch, check where tickets share a concept or resource, even across different files or worktrees: names/keys, constants, terminology, shared types/config, or API/DB schemas. Pin only overlapping decisions in an existing shared artifact: canonical name/key, relevant shape, and owning file/module and implementer. Reuse established contracts; send unresolved product or architectural choices upstream under section 1. Hold only work that depends on an unpinned decision; unrelated work stays parallel.

Prefer economical models capable of the implementation and stronger reasoning for difficult reviews. Choose only model/effort settings exposed by the platform; use its defaults when selection is unavailable. No fixed model names or mandatory tier hierarchy. Explicit user model and budget constraints remain binding.

## 3. Hand off and track evidence

Each assignment includes:

- Source references and relevant revision, scope, acceptance criteria, and dependencies.
- Workspace, baseline, owned files/modules, shared interfaces, and concurrent-worker boundaries.
- For overlapping work, the same shared-contract pointer and revision for all affected implementers. Workers reuse it rather than independently naming or redefining the concept; newly discovered overlap or a needed contract change goes back to the supervisor before dependent edits continue. After a change is resolved, the supervisor updates that shared artifact and notifies every affected worker. Each worker resumes against the new revision and checks its existing changes for consistency; unaffected work continues.
- Verification expectations, relevant skill paths when needed, and commit/integration permissions.
- A concise return contract: outcome, changed-file summary, checks and results, remaining risks, decisions needed, and evidence references.

Prefer pointers to accessible specs, tickets, research notes, and commits over copied documents. Include enough context to act without inheriting the whole conversation. Keep full logs with the worker or in a shared task artifact; retrieve required fields and exact failure excerpts before expanding to raw output. Preserve shared artifacts until their consumers finish.

In a shared working directory, centralize commits to avoid mixing workers' edits. In isolated worktrees, workers may make scoped local commits when authorized by the task instructions; the main session controls acceptance, integration, and external delivery. A worker commit is a handoff, not acceptance. Verify the starting baseline and preserve existing work when correcting it.

Treat a worker's completion claim as ready for verification. Unlock dependent work after the prerequisite's required checks and reviews, including asynchronous checks, pass on the revision or snapshot available in the dependent worker's baseline. Overall delivery need not be complete; wait for an external delivery only when that dependency actually requires it, such as a deployed service. Schedule ready tasks as capacity permits; use completion notifications for waiting.

## 4. Verify and correct

Reuse existing checks first. Add tests for a concrete failure or acceptance criterion, using expected results independent of the implementation. Name a plausible wrong implementation the test would reject; reproduce a reported bug before fixing it where feasible.

Tautological tests are harmful: recomputing expectations with the tested logic or mocking away the claimed behavior creates false confidence. Replace such tests within the task's scope. Boundary mocks are not inherently tautological. Small edits need no automatic test scaffolding; existing checks or focused manual verification may suffice. Run project-required checks and verification proportionate to actual risk.

During corrections, reproduce the failure and check affected callers and their fixture/runtime setup before broad validation. Run any required full suite only after those focused checks pass on the integrated candidate. Schedule costly runs around shared state and measured contention.

When independent code review is warranted, load the available `code-review` skill. Provide the task/spec, applicable standards, exact baseline and target, and verification evidence. Define scope and any nested delegation before dispatch; include staged, unstaged, and new files for uncommitted work. Reviewers inspect without editing and separate correctness/required-standard findings from optional suggestions, with file/line evidence and unrun checks.

When broad review is warranted under section 2, run it once for the defined scope (a task or the integrated candidate). If it finds blockers, default to one correction pass followed by targeted regression checks and required final verification; otherwise proceed directly to verification and acceptance. Record the reviewed baseline/target and blocking findings in the existing task record. A changed diff alone does not reopen broad review. Close the review when blockers are resolved and required evidence passes; section 5 still governs delivery completion.

After corrections, verify the known findings and affected behavior. Additional review is limited to evidence of a high-risk regression, material scope expansion, or failed verification; state that trigger and the exact delta before dispatch. Honor explicitly required independent verification. Another broad review requires an explicit user request; otherwise escalate when the risk cannot be bounded. Optional suggestions do not reopen a closed review.

Bind each check and review to its revision or working-tree snapshot, and runtime evidence to the actual executable and environment. Report PASS with its command/scenario and scope. Recheck only affected evidence after changes. Before an expensive rerun, identify the changed input, failure, or coverage gap that requires it; retain valid product checks after evidence-only handoff corrections.

Send blocking findings to the implementation owner with evidence and the expected correction. Prefer original owners for local defects; assign cross-task integration defects to one explicit owner. Optional style or refactoring suggestions do not automatically block delivery or expand scope.

One correction pass runs from assigning a batch of blocking findings through collecting the fixes and assessing their verification results. Parallel owners, multiple commits, and internal edit/test iterations in that batch count as one pass; assigning further corrections after that assessment starts the next pass. Apply the same counting to main-session fixes.

Allow at most two correction passes per task or integration review scope under the same acceptance contract: the default pass and, only if targeted verification leaves a blocker, one further pass. A new finding, reviewer, or agent does not reset the budget. After the second pass, unresolved blockers stop affected work and its dependents; report remaining evidence and the decision needed before any further cycle. A genuine upstream scope change requires an updated task definition and explicit new execution boundary, not relabeling an unresolved defect. Delegate direct work if investigation grows, carrying its correction count forward.

## 5. Accept the integrated result and deliver

The main session owns acceptance of the integrated result. Assess cross-task interactions, critical findings, and acceptance coverage against the final revision or snapshot. The integration owner (main session or merger) compares overlapping changes against the pinned shared contracts and checks inconsistent naming/shapes, duplicate concepts, and parallel reinvention even when Git merges cleanly. Resolve drift with its owner and recheck affected consumers before acceptance. This requires no dedicated merger agent or global serialization.

Delegate substantial full-diff review under section 2, applying section 4's lifecycle to the integrated scope. Task reviews do not replace cross-task validation, but already completed integrated review is not repeated merely because its fixes were merged.

Determine the delivery endpoint from the user's request and existing authorization: local changes, commits, branch push, or PR. Skill invocation grants no additional permission. Before an external action, verify the actual branch, remote, divergence, and project policy. Preserve unrelated changes and avoid force-push. Honor prior authorization without asking again; if permission is missing, prepare the complete reviewable result first.

Keep the tracker and handoff aligned with the actual delivery endpoint. Distinguish local readiness, retrievable branch delivery, and merge/release; identify preserved existing work separately from accepted task changes. When delivery authorization expands, append confirmed status and retain the earlier snapshot.

Mark the overall task complete only after required checks and reviews, including asynchronous checks, have succeeded on the accepted revision or snapshot and the requested delivery endpoint is reached. Dependency readiness is governed separately by section 3.

Clean up task-owned worktrees and temporary artifacts only after preserving needed results, confirming no active consumers or uncommitted work remain, and following host cleanup rules.

Report delivered behavior, final verification evidence, unresolved limitations, and actual commit/push/PR status. Failed or unrun required checks and failed delivery remain explicitly incomplete.
