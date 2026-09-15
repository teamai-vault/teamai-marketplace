# Contributing

The v0.1 repository intentionally has no automated contribution/publish workflow. Changes follow the normal Git branch and pull-request process.

Before opening a pull request:

1. Confirm the capability belongs in a shared plugin rather than one business repository.
2. Keep names unique across central plugins.
3. Mark sample-only content clearly.
4. Run `npm test`.
5. Run `npm run test:copilot` when Marketplace or Plugin packaging changes.
6. Apply the version policy in `teamai-cli-customization/docs/VERSIONING.md`.

Automated `team-ai contribute` / `publish` commands are deferred beyond the MVP.
