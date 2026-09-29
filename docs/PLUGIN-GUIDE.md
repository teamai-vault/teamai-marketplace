# Plugin Guide

Use Agent Plugins 1.0 for new plugins.

## Ownership

- `common`: broadly useful shared capabilities.
- Role plugins such as `api`, `ios`, and `design`: capabilities that belong to one engineering role.
- Project plugins: optional executable capability for a Logical Project declared in `manifest/projects.yaml`.
- Project-only behavior stays in the business repository under `.github/*`.

## Team AI metadata

Team AI-managed plugins use bare names and declare their category in `plugin.json`:

```json
"extensions": {
  "com.company.teamai": {
    "kind": "common"
  }
}
```

The `kind` must be `common`, `role`, or `project`. Do not infer type from a `role-` name prefix.

If the Team AI extension namespace must change, update both the Team AI CLI `TEAM_AI_EXTENSION_NAMESPACE` constant and the `extensions` namespace in every Marketplace `plugin.json` file.

## Rules

1. Keep central skill and agent names unique. A collision is a packaging error, not an override feature.
2. Put portable skills under `skills/<name>/SKILL.md`.
3. Put Copilot-specific agents, rules, commands, and hooks under `com.github.copilot/`.
4. Do not add placeholder directories just to match an architecture diagram. `.gitkeep` is acceptable when a plugin intentionally documents a supported native extension location.
5. When shipped Plugin content changes, bump that Plugin's version in both `plugin.json` and its `.github/plugin/marketplace.json` entry. Leave unchanged Plugins at their current versions.
6. Run `npm run validate -- --base <release-base>` and `npm test` before proposing a marketplace change; use a fixed commit or ref as the validation base.
7. Follow the cross-repository version policy in `teamai-cli-copilot/docs/VERSIONING.md`.

## Logical Project content

- Define Logical Projects in `manifest/projects.yaml`.
- Put project instructions in `contexts/<id>/instructions/` and docs in `contexts/<id>/docs/`. Published Learnings belong only on the same repository's `teamai-learnings` branch, under `learnings/shared/` or `learnings/<actual-logical-project-id>/`; do not add a root `learnings/` directory to the resource branch. Keep reference instruction frontmatter `applyTo: "**"`.
- A Project Plugin is optional executable capability. It must be declared as `kind: project` and referenced by the Logical Project manifest; it does not turn a Physical Project into a Plugin.
- The CLI mirrors only its two owned projection roots into the physical repository and rejects unowned collisions. Do not add a second resource/projection mechanism here.

## Native MCP and Hooks

- Declare shared MCP servers only in root `mcp.json`; declare Copilot Hooks only in `com.github.copilot/hooks/hooks.json`.
- Keep plugin-relative executables and scripts inside the Plugin root. Use direct `exec` plus `args`, or provide a cross-platform `command`/paired `bash` and `powershell` commands.
- Do not commit credential headers or hide download-and-execute behavior in a Hook.
- `npm run validate` inspects declarations only. It never starts an MCP server or runs a Hook.
- The current catalog intentionally contains no real MCP or Hook implementation.
