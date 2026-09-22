# Team AI Marketplace

This repository publishes the department Marketplace catalog, its Agent Plugins 1.0 sources, and native Copilot user-instruction sources. The sibling `../teamai-cli-customization` repository owns CLI discovery, mirroring, and installation behavior; coordinate changes that alter those shared contracts.

## Boundaries

- `.github/plugin/marketplace.json` is the canonical catalog. Each entry points to a source below `plugins/`; that Plugin owns its root `plugin.json` and capability files.
- Plugin categories live only at `extensions["com.company.teamai"].kind` with `common`, `role`, or `project`. Keep role Plugin names bare, such as `api`, rather than encoding the category in the name.
- Keep Plugin-relative executables and resources inside their Plugin source. `scripts/validate.mjs` enforces real-path containment and rejects linked escape paths.

## Change map

- When changing Plugin ownership, layout, MCP, Hooks, or skills, read `docs/PLUGIN-GUIDE.md`; start at the Plugin's `plugin.json`, then update the catalog entry when publication metadata changes.
- When adding a user instruction, edit only `instructions/` and add or update the discovery assertions in `test/marketplace.test.mjs` when the contract changes.
- When changing the user-instruction source, discovery, or mirroring contract, read `docs/development/instructions-contract.md` first and coordinate the sibling CLI change.
- When changing validation, trace `.github/plugin/marketplace.json` -> Plugin source -> `plugin.json` -> optional native declarations -> `skills/*/SKILL.md` in `scripts/validate.mjs`, and cover the accepted and rejected boundary in `test/marketplace.test.mjs`.
- When publishing versions, read `../teamai-cli-customization/docs/VERSIONING.md`. Keep `package.json` aligned with `marketplace.metadata.version`, and each changed Plugin's `plugin.json` version aligned with its catalog entry.
- When changing `com.company.teamai`, update every Plugin manifest and the sibling CLI's `TEAM_AI_EXTENSION_NAMESPACE` in the same coordinated change.

## Verification

- Fast structural check: `npm run validate`.
- Repository tests: `npm test` (Node's built-in test runner; no local dependency install is required).
- For Marketplace catalog, Plugin packaging, or Copilot adapter changes: `npm run test:copilot`. It requires global GitHub Copilot CLI `1.0.83` and exercises real add, browse, and install operations in an isolated temporary profile.
- CI runs validate/tests on Windows and macOS with Node 20, and the Copilot contract smoke with Node 22 plus Copilot CLI `1.0.83`. Record any unexecuted platform rather than inferring parity.
