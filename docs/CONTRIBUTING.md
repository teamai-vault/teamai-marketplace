# Contributing

The v0.1 repository intentionally has no automated contribution/publish workflow. Changes follow the normal Git branch and pull-request process.

Before opening a pull request:

1. Confirm the capability belongs in a shared plugin rather than one business repository.
2. Use a bare plugin name; declare `common`, `role`, or `product` as `extensions["com.company.teamai"].kind` in `plugin.json` instead of encoding type in a `role-` prefix.
3. Keep names unique across central plugins.
4. Mark sample-only content clearly.
5. Run `npm run validate` and `npm test`.
6. Run `npm run test:copilot` when Marketplace or Plugin packaging changes.
7. Apply the version policy in `teamai-cli-customization/docs/VERSIONING.md`.

If the Team AI extension namespace must change, update both the Team AI CLI `TEAM_AI_EXTENSION_NAMESPACE` constant and the `extensions` namespace in every Marketplace `plugin.json` file.

Automated `team-ai contribute` / `publish` commands are deferred beyond the MVP.
