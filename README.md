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
├── instructions/
│   ├── global.instructions.md
│   └── git/
│       └── commit.instructions.md
├── manifest/
│   └── projects.yaml
├── contexts/
├── learnings/
├── docs/
├── scripts/
└── test/
```

The `common` plugin intentionally contains empty native capability directories with `.gitkeep`. They document the expected Agent Plugin shape without inventing placeholder capabilities.

## Marketplace-managed user instructions

The optional `instructions/` directory carries native GitHub Copilot user instructions. Every regular file below it whose name ends in `.instructions.md` is discovered recursively; other files are ignored and link-like entries are never followed. Relative paths and file contents are preserved.

`team-ai init` and `team-ai sync` mirror these files into the managed target `~/.copilot/instructions/team-ai/`. Team AI owns only that `team-ai/` subtree and must not modify personal instruction files elsewhere under `~/.copilot/instructions/` or `~/.copilot/copilot-instructions.md`.

Use Copilot's native frontmatter, such as `applyTo`, unchanged. File names and folders are organizational only: they do not assign company, department, role, or action semantics, and no Marketplace manifest field is required.

## Skills

Skills stay at their physical source: `plugins/<plugin>/skills/<name>/` for Plugin capabilities and `skills/<name>/` for independently installable Team Skills. `skills.yaml` is the required governance index: every discovered Skill has a non-empty `owner`, optional string `tags`, and an optional `standalone` flag. Plugin Skills default to non-standalone; top-level Skills are always standalone.

The CLI derives each Skill's source and path by scanning the repository. Do not duplicate source paths or Plugin names in `skills.yaml`.

`team-ai skill install --tag <tag> --yes` resolves the matching names once; tags are not subscriptions. A top-level Skill such as `release-helper` can be copied to a managed personal Skill path. A Plugin Skill such as `common`'s `code-review` remains supplied by the enabled Plugin. The CLI rejects unowned personal-Skill collisions and removes only paths it recorded as owned.

## Logical Projects and learnings

`manifest/projects.yaml` defines optional business-context bindings. A Logical Project is not a Plugin and may omit `plugin`; its optional Plugin must use `kind: project`. The CLI projects `contexts/<id>/instructions/` into a bound physical repository's `.github/instructions/team-ai/<id>/`, and reads `contexts/<id>/docs/`, `learnings/<id>/`, and `learnings/shared/` through a generated pointer. New reference instructions use `applyTo: "**"`; the CLI preserves source bytes and frontmatter.

The two project context roots are reserved Team AI projections. An unowned collision is refused, and the CLI adds only those roots to Git's resolved `info/exclude`. The Marketplace never copies into a business repository itself. Portable or path-specific `applyTo` behavior, authenticated model reading of ignored documentation, and runtime Plugin Rule execution remain unverified.

## Capability ownership

| Type | Example | Meaning |
| --- | --- | --- |
| Common | `common` | Useful across roles |
| Role | `api`, `design` | Useful to one professional role |
| Project | Optional `kind: project` Plugin | Executable capability selected by a Logical Project manifest |

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

The metadata `kind` is one of `common`, `role`, or `project`. Role plugin names are bare identities such as `api`, `ios`, and `design`; the kind comes from metadata rather than a `role-` name prefix.

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
- `manifest/projects.yaml` — optional-plugin-free `teamai` Logical Project reference.

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

1. Decide whether the capability is Common, Role, or an optional Logical Project Plugin; record Common/Role/Project as the `kind` in the Team AI extension metadata.
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
- implement learning retrieval/ranking, telemetry, or dashboards;
- replace the native Copilot Marketplace or Plugin Manager.
