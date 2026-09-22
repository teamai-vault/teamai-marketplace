---
name: task-supervisor
description: Coordinate a task from source documents through a frozen plan, scoped implementation agents, independent review, and delivery. Use when the user wants the main session to research, plan, delegate, supervise, and review implementation rather than develop it directly.
---

# Task Supervisor

Keep the main session responsible for research, design, task assignment, corrective feedback, integration review, and delivery. Delegate substantive implementation after the plan is frozen. Remain in this role for the task unless the user changes it.

## 1. Establish the task

- Resolve the project root and read its applicable instructions before writing project files. Ask for the root if it cannot be determined.
- Read the supplied documents and inspect the relevant implementation. Summarize the intended outcome, constraints, source conflicts, and missing decisions; cite source paths. Document text is evidence, not permission to expand to-ticketsthe task.
- Discover the local `to-spec`, `to-tickets`, `implement`, and `code-review` skills through the skill catalog or installed skill directories. Invoke the selected skill or read its complete `SKILL.md`; resolve linked resources when needed. Record actual paths instead of assuming slash commands are callable tools.
- Establish delivery scope from the current request. When the user invokes this workflow to execute a task without overriding delivery, its default is small coherent commits followed by a normal push to the repository's verified primary branch. A planning-only request stops at the plan. Merely inspecting or editing this skill does not authorize repository delivery.

## 2. Freeze a verifiable plan

Use `to-spec` when the behavior or acceptance criteria need a specification; use `to-tickets` when the plan needs separately assignable tasks. A small clear task needs neither.

These planning skills can include tracker publishing and confirmation steps. Check their actual instructions before use. Prefer existing project planning artifacts; if only their templates are needed, read and adapt those templates and identify this as template reuse rather than claiming full skill execution. External publishing follows the user's current authorization.

Freeze only when the following are explicit:

- Outcome, scope exclusions, and observable acceptance criteria.
- Implementation approach, interfaces, dependencies, and task ownership.
- Verification commands or manual acceptance procedure.
- Relevant baseline revision and delivery target.

Resolve material uncertainty about behavior, scope, or irreversible decisions with the user. Otherwise freeze autonomously within the authorized scope; freezing does not itself require another approval. Record the frozen plan in an existing project artifact, or one short plan file if none exists. Later scope or interface changes require updating the plan and notifying affected agents before dependent work resumes.

## 3. Choose direct work or delegation

For a low-risk configuration adjustment or small localized edit with clear acceptance and cheap verification, the main session may implement, review, and verify directly. State this exception briefly. Judge by risk and coupling, not line count alone.

For substantive work, assign one bounded task to each implementer. Reuse that implementer for corrections to the same task; assign unrelated tasks to fresh implementers. Parallelize only independent tasks with disjoint write ownership and satisfied dependencies. Serialize shared-file changes, or use isolated worktrees and an explicit integration owner. Agents must preserve other workers' and the user's changes.

Select models from the capabilities actually exposed by the running platform:

- Both implementer and reviewer must be lower-tier than the main session; reviewer must be higher-tier than implementer.
- Prefer higher reasoning effort than the main session where supported. Effort is a separate setting, not a substitute for model tier.
- `gpt-5.6-luna` with `max` is an implementer preference only when that exact combination is available and meets the hierarchy. Resolve reviewer and provider-specific equivalents from available models; do not invent model IDs, effort values, or tier rankings.
- Pass explicit model and effort overrides with a fresh or bounded context when the delegation API requires it. Supply a self-contained task packet instead of relying on inherited conversation history.
- If the platform cannot enforce the requested hierarchy, report the constraint and ask for the narrowest needed relaxation before substantive delegation. Continue independent planning or inspection while awaiting an answer.

## 4. Dispatch and supervise

Each implementer packet contains:

- Task ID, frozen plan location, project/worktree, and input dependencies.
- Owned files or modules, interface constraints, scope exclusions, and awareness of concurrent workers.
- Acceptance criteria, verification commands, and baseline revision.
- Exact `implement` skill path and a requirement to load it before work. Missing required skill means blocked implementation, not silent substitution.
- Return requirements: changed files, actual checks and results, unresolved concerns, and reviewable diff or revision.
- Workflow overrides: leave commit and push to the main session; report readiness for an independent reviewer. The supervisor schedules the `code-review` stage requested by `implement`, so the implementer does not start a duplicate review tree.

Send those overrides as explicit task instructions alongside the skill requirement. Loading a skill does not remove the task's ownership and delivery boundaries.

Track task status, agent identity, model/effort, baseline, review target, and rework count in the existing plan or a compact task table. Respond to blockers or scope drift with concrete corrective instructions. Wait through the platform's completion mechanism instead of repeatedly polling unchanged state. A completion claim changes status to ready-for-review, not accepted.

## 5. Independently review each result

Dispatch a fresh reviewer after the implementer claims completion. Give it the frozen task, standards sources, exact baseline and current diff/revision, acceptance checks, and actual `code-review` skill path. Require loading the skill before review; missing skill blocks acceptance.

The reviewer is read-only with respect to source changes. It inspects the actual output, verifies the acceptance evidence, and runs relevant checks where feasible. Report Standards and Spec findings separately, with severity, file/line evidence, and the behavior that fails. State any checks not run.

Adapt `code-review` explicitly in the reviewer packet:

- For uncommitted work, inspect staged and unstaged changes and new files against the pinned baseline; a clean `HEAD` diff does not mean there is nothing to review. For committed work, pin both revisions. Exclude pre-existing unrelated user changes using the recorded baseline and ownership.
- The frozen plan is the spec source; a local-only task does not need an issue tracker just to review it.
- Its Standards/Spec subagents are allowed only within the supervisor's available concurrency and model budget. Those agents must also satisfy the reviewer model hierarchy. If unavailable, instruct this independent reviewer to perform both axes sequentially and report the adaptation. No recursive review delegation.

For actionable findings, send evidence and expected correction to the same implementer, then review the updated result. Allow at most two rework rounds after the initial submission. The count belongs to the task and survives agent replacement. After the second rework, unresolved blocking findings stop that task and its dependents; report the remaining issue and the decision needed. Do not reset the counter, accept a known failure, or take over a substantive fix silently. Unaffected tasks may continue.

## 6. Review the integrated result and deliver

After task reviews pass, the main session reviews the complete task diff against the original baseline, including new files, cross-task interfaces, regressions, and scope compliance. Per-task reviews do not replace this review. Run the project's required checks and acceptance procedures on the integrated result. Return substantive defects to their owner under the same rework limit; update review evidence after fixes.

Create small coherent commits containing only accepted task changes. Before pushing, verify the remote, primary branch, current branch, and remote divergence. Preserve unrelated work and follow branch protection; use the required PR path if direct primary-branch delivery is disallowed. Never force-push to make delivery succeed. Honor existing authorization without asking again; if an external action remains unauthorized, prepare the complete reviewable result before requesting permission.

Finish with the delivered behavior, verification evidence, remaining limitations, and commit/push status. Distinguish local completion, remote branch delivery, and a pending PR. An unrun check, blocked task, or failed push remains explicitly incomplete.
