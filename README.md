# Team AI Marketplace

[中文](README.zh-CN.md) | English

Reference/template GitHub Copilot Plugin Marketplace for reusable Team AI capabilities.

This repository is the **reference implementation and template** for a department-owned Marketplace. It uses GitHub Copilot's native Marketplace and Agent Plugins 1.0 conventions; it does not define a Team AI-specific plugin format.

The `team-ai` CLI is not bound to this repository or to the Marketplace ID `teamai`. Different departments can clone/derive this repository, choose their own Marketplace `name`, maintain their own capabilities, and use the same company-wide CLI.

## Use as a department template

1. Clone/derive this repository into the department-owned Git repository.
2. Change `.github/plugin/marketplace.json` `name` to the department's final Marketplace ID.
3. Replace the example Common/Role content with reviewed department capabilities.
4. Validate and publish the repository.
5. Initialize the generic CLI with that repository source:

```powershell
team-ai init `
  --marketplace https://github.com/example-org/department-ai-marketplace.git `
  --role api
```

The CLI discovers the Marketplace name from the native Copilot registration; users do not enter the manifest name separately.

## Repository architecture

```text
teamai-marketplace/
├── .github/
│   └── plugin/
│       └── marketplace.json
├── plugins/
│   ├── common/
│   │   ├── plugin.json
│   │   ├── skills/
│   │   │   └── .gitkeep
│   │   └── com.github.copilot/
│   │       ├── agents/
│   │       │   └── .gitkeep
│   │       ├── rules/
│   │       │   └── .gitkeep
│   │       └── hooks/
│   │           └── .gitkeep
│   ├── api/
│   ├── ios/
│   ├── aos/
│   ├── qa/
│   ├── design/
│   └── product-teamai/
│       ├── plugin.json
│       └── skills/teamai-change-readiness/SKILL.md
├── docs/
├── scripts/
└── test/
```

The `common` plugin intentionally contains empty native capability directories with `.gitkeep`. They document the expected Agent Plugin shape without inventing placeholder capabilities.

## Capability ownership

| Type | Example | Meaning |
| --- | --- | --- |
| Common | `common` | Useful across roles |
| Role | `api`, `design` | Useful to one professional role |
| Product | `product-teamai` | Shared capability across several repositories in one product |
| Project | Not stored here | Must stay in the business repository under `.github/*` |

Central plugin resource names should remain unique. Name collisions are packaging/configuration errors, not an invitation to create an override engine.

## Marketplace manifest location

The canonical manifest is:

```text
.github/plugin/marketplace.json
```

This follows the GitHub Copilot Marketplace creation-guide layout.

Compatibility was also tested locally with GitHub Copilot CLI `1.0.83`: the CLI accepted both a root-level `marketplace.json` and `.github/plugin/marketplace.json`. Because both work, this repository deliberately uses the guide-recommended `.github/plugin/marketplace.json` layout.

## Agent Plugins 1.0

Each plugin has its own root `plugin.json` using the Agent Plugins 1.0 schema.

Team AI-managed plugins declare their type in the standard `extensions` object:

```json
{
  "extensions": {
    "com.company.teamai": {
      "kind": "common"
    }
  }
}
```

The metadata `kind` is one of `common`, `role`, or `product`. Role plugin names are bare identities such as `api`, `ios`, and `design`; the kind comes from metadata rather than a `role-` name prefix.

If the Team AI extension namespace must change, update both the Team AI CLI `TEAM_AI_EXTENSION_NAMESPACE` constant and the `extensions` namespace in every Marketplace `plugin.json` file.

Portable content belongs under standard locations such as:

```text
skills/
```

Copilot-specific content belongs under:

```text
com.github.copilot/
  agents/
  rules/
  hooks/
  commands/
```

Optional shared MCP and Hook capabilities use the native Agent Plugin locations:

```text
mcp.json
com.github.copilot/hooks/hooks.json
```

The Marketplace validator checks these declarations without starting servers or running Hooks. No current production plugin publishes an MCP server or Hook; add an implementation only when a reviewed use case and security owner exist. Team AI does not provide an MCP/Hook converter or injector.

## Current plugins

- `common` — common capabilities. Includes small example review content.
- `api` — API/backend capabilities. Includes small Java/backend examples.
- `ios` — iOS role package shell.
- `aos` — Android role package shell.
- `qa` — QA role package shell.
- `design` — product/experience design role shell with explicit `.gitkeep` placeholders.
- `product-teamai` — cross-repository change-readiness guidance for the CLI and Marketplace repositories.

Example content is intentionally marked as example material. It is not represented as production company policy.

## Validate

```text
npm run validate
npm test
npm run test:copilot
```

The validator checks the marketplace catalog, Agent Plugins 1.0 manifests, plugin source paths, Skill directory/frontmatter alignment, duplicate central Skill names, and optional native MCP/Hook declarations. Capability checks cover source containment and visibility, cross-platform Hook commands, remote execution patterns, HTTPS, and committed credential headers.

## Test this reference Marketplace locally with Copilot CLI

From any directory:

```text
copilot plugins marketplace add <path-to-teamai-marketplace>
copilot plugins marketplace browse teamai
copilot plugins install common@teamai
copilot plugins install api@teamai
```

For the design role:

```text
copilot plugins install design@teamai
```

Clean up a test marketplace and every plugin installed from it:

```text
copilot plugins marketplace remove teamai --force
```

`--force` removes the marketplace and plugins sourced from it. Do not use it when you intend to keep any `teamai` plugin installed.

## Adding a capability

1. Decide whether the capability is Common, Role, Product, or Project-only; record Common/Role/Product as the `kind` in the Team AI extension metadata.
2. For shared capabilities, place it in the appropriate Agent Plugin using native Agent Plugin paths.
3. Use a bare plugin name and keep central names unique; do not encode the type in a `role-` prefix.
4. Do not create empty abstractions merely to mirror an architecture diagram; `.gitkeep` placeholders are acceptable only when they communicate an intentionally supported native location.
5. Update both `plugin.json` and `.github/plugin/marketplace.json` versions when publishing a new plugin version.
6. Run validation/tests before review.

See [`docs/PLUGIN-GUIDE.md`](docs/PLUGIN-GUIDE.md) and [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md).
The cross-repository version policy lives in [`teamai-cli-customization/docs/VERSIONING.md`](https://github.com/teamai-vault/teamai-cli-customization/blob/main/docs/VERSIONING.md).

## Non-goals

This repository does not:

- define custom Plugin/Skill/Hook/MCP formats;
- copy resources into IDE-specific locations;
- implement a generic merge/override engine;
- implement TeamWiki, Recall, Learning, telemetry, or dashboards;
- replace the native Copilot Marketplace or Plugin Manager.
