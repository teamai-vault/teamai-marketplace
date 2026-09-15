# Plugin Guide

Use Agent Plugins 1.0 for new plugins.

## Ownership

- `common`: broadly useful shared capabilities.
- `role-*`: capabilities that belong to one engineering role.
- `product-*`: optional cross-repository product capabilities.
- `product-teamai`: change-readiness capability shared by the Team AI CLI and Marketplace repositories.
- Project-only behavior: keep it in the business repository under `.github/*`.

## Rules

1. Keep central skill and agent names unique. A collision is a packaging error, not an override feature.
2. Put portable skills under `skills/<name>/SKILL.md`.
3. Put Copilot-specific agents, rules, commands, and hooks under `com.github.copilot/`.
4. Do not add placeholder directories just to match an architecture diagram. `.gitkeep` is acceptable when a plugin intentionally documents a supported native extension location.
5. Bump both `plugin.json` and the matching `.github/plugin/marketplace.json` entry when publishing a new plugin version.
6. Run `npm test` before proposing a marketplace change.
7. Follow the cross-repository version policy in `teamai-cli-customization/docs/VERSIONING.md`.

## Native MCP and Hooks

- Declare shared MCP servers only in root `mcp.json`; declare Copilot Hooks only in `com.github.copilot/hooks/hooks.json`.
- Keep plugin-relative executables and scripts inside the Plugin root. Use direct `exec` plus `args`, or provide a cross-platform `command`/paired `bash` and `powershell` commands.
- Do not commit credential headers or hide download-and-execute behavior in a Hook.
- `npm run validate` inspects declarations only. It never starts an MCP server or runs a Hook.
- The current catalog intentionally contains no real MCP or Hook implementation.
