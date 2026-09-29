# Contributing

Marketplace source changes follow the normal Git branch and pull-request process. The CLI can prepare a Learning or Skill contribution in an isolated worktree and open a GitHub pull request; it does not publish Marketplace releases.

Before opening a pull request:

1. Confirm the capability belongs in a shared plugin rather than one business repository.
2. Use a bare plugin name; declare `common`, `role`, or `project` as `extensions["com.company.teamai"].kind` in `plugin.json` instead of encoding type in a `role-` prefix.
3. Keep names unique across central plugins.
4. Mark sample-only content clearly.
5. Run `npm run validate` and `npm test`. Marketplace releases must go through a pull request; CI compares Plugin content with the pull request's fixed base SHA as the version release gate. Branch protection and administrator enforcement are outside this issue.
6. Run `npm run test:copilot` when Marketplace or Plugin packaging changes.
7. Apply the version policy in `teamai-cli-copilot/docs/VERSIONING.md`.
8. For a local Learning use `teamai learning share <file> [--project <id>|--shared]`; for a local Skill use `teamai skill contribute <path> --owner <owner> --target standalone|plugin [--plugin <plugin>]`. Inspect the resulting PR before merge.

## Learning contributions

The resource branch publishes the catalog, Plugins, instructions, manifest, and contexts; it is not a published Learning source. Learning PRs target the same repository's `teamai-learnings` branch and use `learnings/shared/` or `learnings/<actual-logical-project-id>/` there.

Write Learning titles, natural-language tags, bodies, and contribution text English-first. The moved reference examples are:

| Title | Tags | Body |
| --- | --- | --- |
| Validation learning | marketplace validation, release evidence | Record concrete validation evidence with each change. |
| Contract learning | marketplace contracts, CLI projection | Keep the Marketplace source and CLI projection behavior aligned. |

Preserve code identifiers, error codes, original diagnostic text, links, formal names, and actual Logical Project IDs exactly. English-first is a contribution guideline: the CLI preserves submitted bytes and does not translate, detect language, or reject non-English content.

If the Team AI extension namespace must change, update both the Team AI CLI `TEAM_AI_EXTENSION_NAMESPACE` constant and the `extensions` namespace in every Marketplace `plugin.json` file.

There is no generic `teamai contribute` command and no automated publish command.
