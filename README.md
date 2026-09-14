# Team AI Marketplace

[中文](README.zh-CN.md) | English

Internal GitHub Copilot Plugin Marketplace for reusable Team AI capabilities.

This repository is the **Git-native canonical source** for shared Common, Role, and future Product capabilities. It uses GitHub Copilot's native Marketplace and Agent Plugins 1.0 conventions; it does not define a Team AI-specific plugin format.

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
│   │   └── com.github.copilot/
│   │       └── agents/
│   ├── role-api/
│   ├── role-ios/
│   ├── role-aos/
│   ├── role-qa/
│   └── role-design/
│       ├── plugin.json
│       ├── skills/.gitkeep
│       └── com.github.copilot/
│           ├── agents/.gitkeep
│           ├── rules/.gitkeep
│           └── hooks/.gitkeep
├── docs/
├── scripts/
└── test/
```

The Role Design plugin intentionally contains empty native capability directories with `.gitkeep`. They document the expected Agent Plugin shape without inventing placeholder capabilities.

## Capability ownership

| Type | Example | Meaning |
| --- | --- | --- |
| Common | `common` | Useful across roles |
| Role | `role-api`, `role-design` | Useful to one professional role |
| Product | `product-payments` | Future shared capability across several repositories in one product |
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

MCP configuration should use the native Agent Plugin MCP mechanism when a real shared MCP use case is introduced. Team AI should not invent an MCP converter/injector.

## Current plugins

- `common` — common capabilities. Includes small example review content.
- `role-api` — API/backend capabilities. Includes small Java/backend examples.
- `role-ios` — iOS role package shell.
- `role-aos` — Android role package shell.
- `role-qa` — QA role package shell.
- `role-design` — product/experience design role shell with explicit `.gitkeep` placeholders.

Example content is intentionally marked as example material. It is not represented as production company policy.

## Validate

```text
npm run validate
npm test
```

The validator checks the marketplace catalog, Agent Plugins 1.0 manifests, plugin source paths, Skill directory/frontmatter alignment, and duplicate central Skill names.

## Test locally with Copilot CLI

From any directory:

```text
copilot plugins marketplace add <path-to-teamai-marketplace>
copilot plugins marketplace browse company-ai
copilot plugins install common@company-ai
copilot plugins install role-api@company-ai
```

For the design role:

```text
copilot plugins install role-design@company-ai
```

Clean up a test marketplace and every plugin installed from it:

```text
copilot plugins marketplace remove company-ai --force
```

`--force` removes the marketplace and plugins sourced from it. Do not use it when you intend to keep any `company-ai` plugin installed.

## Adding a capability

1. Decide whether the capability is Common, Role, Product, or Project-only.
2. For shared capabilities, place it in the appropriate Agent Plugin using native Agent Plugin paths.
3. Keep central names unique.
4. Do not create empty abstractions merely to mirror an architecture diagram; `.gitkeep` placeholders are acceptable only when they communicate an intentionally supported native location.
5. Update both `plugin.json` and `.github/plugin/marketplace.json` versions when publishing a new plugin version.
6. Run validation/tests before review.

See [`docs/PLUGIN-GUIDE.md`](docs/PLUGIN-GUIDE.md) and [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md).

## Non-goals

This repository does not:

- define custom Plugin/Skill/Hook/MCP formats;
- copy resources into IDE-specific locations;
- implement a generic merge/override engine;
- implement TeamWiki, Recall, Learning, telemetry, or dashboards;
- replace the native Copilot Marketplace or Plugin Manager.
