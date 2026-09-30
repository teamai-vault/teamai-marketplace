# Team AI Project Component Example

This optional `kind: project` package is a public example of the five component types in the Team AI Project delivery contract. It is bound to the Logical Project `teamai` in `manifest/projects.yaml`. It is not a production service and must be selected through Team AI for a bound Workspace; do not install or enable it as a user-level Copilot Plugin.

## Example workflow

With this Marketplace selected as the Team AI resource source and a CLI build that implements Spec #14 F05 / CLI #19, bind and synchronize the Logical Project in the target repository:

```sh
teamai projects set teamai
teamai sync
```

The existing `contexts/teamai/instructions/context.instructions.md` remains a separate Logical Project context instruction. The Rule below is an additional component from this package.

## Component markers

| Component | Package source | Marker or observation |
| --- | --- | --- |
| Agent | `com.github.copilot/agents/teamai-project-probe.agent.md` | `TEAMAI_PROJECT_AGENT_PROBE_V4_A71C` |
| Instruction/Rule | `com.github.copilot/rules/teamai-project-probe.instructions.md` | `TEAMAI_PROJECT_RULE_PROBE_V4_3D2F` |
| Skill | `skills/teamai-project-scope-probe/SKILL.md` | `TEAMAI_PROJECT_PLUGIN_SCOPE_V4_9C8E` |
| Hook | `com.github.copilot/hooks/hooks.json` and `com.github.copilot/hooks/teamai-project-hook-probe.mjs` | `TEAMAI_PROJECT_HOOK_PROBE_V4_B85E` is returned as `SessionStart` additional context |
| MCP | `mcp.json` and `mcp-server.mjs` | Call `teamai_project_mcp_probe` for `TEAMAI_PROJECT_MCP_PROBE_V4_C42A` |

The Hook declaration references `${PLUGIN_ROOT}/com.github.copilot/hooks/teamai-project-hook-probe.mjs`; the package host resolves `${PLUGIN_ROOT}` to this Plugin's root. During Project delivery, the CLI must copy that script to an owned Workspace path such as `.github/hooks/teamai-project-hook-probe.mjs` and rebase the Hook command to that Workspace path. The MCP declaration references `mcp-server.mjs`, which must likewise be copied to an owned Workspace path and rebased. These are the expected source-to-Workspace resource relationships; actual CLI projection remains to be verified by CLI #19.

The Hook detects the input shape: VS Code Local's `hook_event_name: "SessionStart"` receives the event-specific `hookSpecificOutput` response, while the camelCase Agent Host `sessionStart` input receives top-level `additionalContext`.

## Prerequisites and limits

- Team AI CLI support for F05 Project component delivery, a binding to `teamai`, and a selected Marketplace source.
- Node.js 20 or later available as `node` on `PATH` for the Hook and MCP probes. No package installation is needed.
- A compatible Copilot consumer and Workspace trust for local Hooks/MCP. Agent Plugins 1.0 makes Skills and MCP portable; Agent, Rule, and Hook are Copilot-specific.
- This package only declares static sources. Marketplace validation does not start the Hook or MCP server or prove that any consumer loads them. Validate each component in the actual selected harness; untested runtime behavior remains unknown.

The Hook only returns its marker as session context. The MCP server only answers its protocol handshake and exposes one read-only marker tool. Neither makes network requests, reads credentials, writes files, or edits user configuration.
