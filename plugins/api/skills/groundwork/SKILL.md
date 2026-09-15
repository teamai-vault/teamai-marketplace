---
name: groundwork
description: Core coding judgment rules — durable anti-default guardrails for writing, reviewing, or refactoring code. Surface assumptions, make minimal surgical changes, verify deterministically, fail loud. Use on any coding task; routes to specialized skills (grilling, delivery, diagnosing-bugs, reviewit) when the task outgrows the inline rules.
---

# Groundwork

The basic rules everyone follows before starting: judgment that stays true across model generations, self-contained — no plugin or hook required.

## 0. Route first

- Requirements fuzzy, decisions unresolved → `/grilling`; to leave a glossary/ADR trail, pair it with `/domain-modeling` (the user can also type `/grill-with-docs`, which bundles both).
- Complex, multi-module, high-risk, or multi-agent delivery → `/delivery`.
- Hard bug, flaky failure, perf regression → `/diagnosing-bugs`. Everyday bugs: section 4 below suffices.
- Accepting another agent's claimed-done work → `/reviewit`.
- In-progress merge/rebase conflict → `/resolving-merge-conflicts`.

Otherwise the rules below are enough — do not load workflow machinery for a small task.

## 1. Think before coding

- State assumptions explicitly. If multiple interpretations exist, present them — never pick silently.
- Blocked on a decision only the user can make: ask exactly one question, with a recommended default.
- If a simpler approach exists than what was asked, say so. Push back when warranted.

## 2. Minimalism — the ladder

Climb, stop at the first rung that holds:

1. Does this need to exist at all? Speculative need = skip it, say so. (YAGNI)
2. Already in this codebase? Reuse beats rewrite — look before you write.
3. Stdlib does it? Use it.
4. Native platform feature covers it? Prefer it over custom code.
5. Already-installed dependency solves it? Never add a new one for what a few lines can do; when you do add one, state why — the choice must be visible, not smuggled into the manifest.
6. Can it be one line? One line.
7. Only then: the minimum code that works.

The ladder shortens the solution, never the reading — understand the problem end to end first; the smallest change in the wrong place is a second bug. No unrequested abstractions, no scaffolding "for later", no config for a value that never changes. Deliberate shortcuts with a known ceiling get a comment naming the ceiling and the upgrade path.

## 3. Surgical changes

- Touch only what the request requires. Don't "improve" adjacent code, comments, or formatting.
- Remove imports/variables/functions that YOUR change orphaned; leave pre-existing dead code (mention it).
- Conformance > taste: match the codebase's conventions even if you disagree; surface harmful ones, don't fork silently.
- Two patterns conflict: pick one (more recent / more tested), say why. Never blend conflicting patterns.
- Read before you write: exports, immediate callers, shared utilities. "Looks orthogonal" is dangerous.

## 4. Bug fix = root cause

- A report names a symptom. Before editing, grep every caller of what you're about to touch; fix once where all callers route through, not just the path the ticket names.
- Reproduce before changing anything; change one variable at a time. Don't paper over an unexpected null — find out why it's null.
- When a bug resists two rounds of this, stop patching and run `/diagnosing-bugs`.

## 5. Verification

- Define done before coding: a verifiable criterion, ideally a command that exits pass/fail. Code answers what code can answer; model judgment covers only what can't be scripted.
- Bug fix: write the failing test first, watch it fail, fix, watch it pass — the only proof you fixed cause, not symptom.
- Never a tautological test (assertion recomputes the expected value the way the code does — passes by construction). Expected values come from an independent source: a known-good literal, a worked example, the spec.
- Build tests in vertical slices: one failing test → one implementation → repeat. Never all tests up front.
- A test encodes why the behavior matters. If no change in business logic could make it fail, it verifies nothing — delete or sharpen it.
- Non-trivial logic leaves one runnable check behind — the smallest thing that fails if the logic breaks. Trivial one-liners need none.
- Never suppress a type error (`any`, ignores) to make checks pass; never weaken, skip, or disable a failing check — fix it or escalate.
- Commit each verified step as a small checkpoint on the working branch — the undo ledger that makes an agent mistake (a deleted file, a runaway refactor) cheap to reverse. Don't batch a whole session into one commit. Loading this skill authorizes checkpoint commits; it never authorizes pushing, and never committing on the default branch — branch first.

## 6. Fail loud

- Honest failure over fabricated success. Reward failure that is honest and based on reasonable inference, but penalize fabricated success: never claim mission success, fabricate results, or report unexecuted steps without verifiable evidence.
- If you can't be sure something worked, say so explicitly. Report failures with the evidence, not hedging.
- Anything unexpected (test failure, regression, weird output): stop adding features, preserve the evidence, re-diagnose.

## 7. Guardrails

- No secrets in code, logs, or output. Validate untrusted input at boundaries. Least privilege.
- At the start of work in a repo, read its STATE.md (loop state — check root, `.local/`, `docs/`) and its lessons file, if they exist and are not already injected into context. Files are memory, and memory doesn't exist unless you read it. A user correction or repeated mistake becomes one line in the lessons file (create it if absent).

## 8. Named failure modes

Catch yourself in one of these and the right move is to stop, not push through:

- **Kitchen Sink** — restructuring half the codebase while you're at it.
- **Wrong Abstraction** — abstracting before the second copy-paste.
- **Optimistic Path** — happy path handled, the 500 ignored.
- **Runaway Refactor** — a fix cascading across files.
