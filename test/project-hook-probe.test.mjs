import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { realpath, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pluginRoot = path.join(repositoryRoot, "plugins", "teamai-project");
const hookScript = path.join(pluginRoot, "com.github.copilot", "hooks", "teamai-project-hook-probe.mjs");
const marker = "TEAMAI_PROJECT_HOOK_PROBE_V4_B85E";

test("project Hook resolves from PLUGIN_ROOT and emits each SessionStart output shape", async () => {
  const hooksPath = path.join(pluginRoot, "com.github.copilot", "hooks", "hooks.json");
  const config = JSON.parse(await readFile(hooksPath, "utf8"));
  const hook = config.hooks.sessionStart[0];
  assert.ok(hook.command.includes("${PLUGIN_ROOT}/com.github.copilot/hooks/teamai-project-hook-probe.mjs"));
  const resolvedCommand = hook.command.replaceAll("${PLUGIN_ROOT}", () => pluginRoot);
  const commandMatch = resolvedCommand.match(/^node "(.+)"$/);

  assert.ok(commandMatch, "hook command should use node with the documented plugin-root token");
  assert.equal(await realpath(commandMatch[1]), await realpath(hookScript));

  const invoke = (payload) => JSON.parse(execFileSync("node", [commandMatch[1]], {
    cwd: repositoryRoot,
    input: JSON.stringify(payload),
    encoding: "utf8",
  }));

  assert.deepEqual(invoke({
    sessionId: "probe",
    timestamp: 0,
    cwd: repositoryRoot,
    source: "startup",
  }), { additionalContext: marker });

  assert.deepEqual(invoke({
    hook_event_name: "SessionStart",
    session_id: "probe",
    timestamp: "2026-09-30T00:00:00Z",
    cwd: repositoryRoot,
    source: "startup",
  }), {
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext: marker,
    },
  });
});
