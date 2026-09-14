---
name: teamai-change-readiness
description: Validate a Team AI change that touches the CLI repository, Marketplace repository, or both before a pull request or release.
---

# Team AI Change Readiness

Use this process for changes to `teamai-cli-customization`, `teamai-marketplace`, or a coordinated change across both.

## 1. Establish scope

Find the available Team AI repository roots and inspect their Git status and diff. In the CLI repository, read `docs/HANDOFF.md` and `docs/IMPLEMENTATION-PLAN.md` completely.

Completion criterion: every changed file belongs to the stated change, and unrelated work is identified without being modified.

## 2. Check identity and boundaries

Search changed content for retired Marketplace identities. Confirm shared capabilities use native Agent Plugin locations and project-only behavior remains under the business repository's `.github/*` files.

Completion criterion: production content uses `teamai-vault`, Marketplace ID `teamai`, and native Copilot boundaries; test-only organizations use `test-org`.

## 3. Run repository gates

For CLI changes, run:

```text
npm run typecheck
npm test
npm run build
```

For Marketplace changes, run:

```text
npm run validate
npm test
```

If the Copilot adapter, Marketplace manifest, or Plugin packaging changed, also run from the Marketplace repository:

```text
npm run test:copilot
```

Completion criterion: every applicable command exits successfully. Preserve and report real RED results.

## 4. Check coordinated release state

Compare Plugin versions with the Marketplace catalog entries. When both repositories changed, verify their branch names and identity references agree. Review each diff against the Handoff priorities and the implementation boundaries.

Completion criterion: version pairs match, cross-repository references agree, and any deliberate design deviation is recorded with evidence.

## 5. Report readiness

Report changed repositories, checks executed, real Copilot validation, design deviations, known limitations, and the next Handoff priority. Distinguish local validation from CI results that have not run yet.

Completion criterion: every claimed green result names an executed check; unexecuted or blocked checks are explicit.
