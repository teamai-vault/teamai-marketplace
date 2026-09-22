# Contributing

Marketplace source changes follow the normal Git branch and pull-request process. The CLI can prepare a Learning or Skill contribution in an isolated worktree and open a GitHub pull request; it does not publish Marketplace releases.

Before opening a pull request:

1. Confirm the capability belongs in a shared plugin rather than one business repository.
2. Use a bare plugin name; declare `common`, `role`, or `project` as `extensions["com.company.teamai"].kind` in `plugin.json` instead of encoding type in a `role-` prefix.
3. Keep names unique across central plugins.
4. Mark sample-only content clearly.
5. Run `npm run validate` and `npm test`.
6. Run `npm run test:copilot` when Marketplace or Plugin packaging changes.
7. Apply the version policy in `teamai-cli-customization/docs/VERSIONING.md`.
8. For a local Learning use `team-ai learning share <file> [--project <id>|--shared]`; for a local Skill use `team-ai skill contribute <path> --owner <owner> --target standalone|plugin [--plugin <plugin>]`. Inspect the resulting PR before merge.

If the Team AI extension namespace must change, update both the Team AI CLI `TEAM_AI_EXTENSION_NAMESPACE` constant and the `extensions` namespace in every Marketplace `plugin.json` file.

There is no generic `team-ai contribute` command and no automated publish command.
