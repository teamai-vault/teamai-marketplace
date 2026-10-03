#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, realpath, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const exec = promisify(execFile);
const marketplaceRoot = await realpath(path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."));
let profile;
let env;

async function run(args) {
  args = ["--no-auto-update", ...args];
  const command = process.platform === "win32" ? process.env.ComSpec ?? "cmd.exe" : "copilot";
  const commandArgs = process.platform === "win32" ? ["/d", "/s", "/c", "copilot", ...args] : args;
  try {
    const result = await exec(command, commandArgs, { cwd: marketplaceRoot, env, windowsHide: true });
    console.log(`$ copilot ${args.join(" ")}\nexit: 0\nstdout:`);
    process.stdout.write(result.stdout);
    process.stderr.write(result.stderr);
    return result;
  } catch (error) {
    throw new Error(`copilot ${args.join(" ")} failed (exit ${error.code ?? "unknown"}): ${error.message}\nstdout:\n${error.stdout ?? ""}\nstderr:\n${error.stderr ?? ""}`);
  }
}

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

function assertRecord(value, label) {
  assert.ok(value !== null && typeof value === "object" && !Array.isArray(value), `${label} must be an object.`);
}

function assertPluginList(plugins) {
  assert.ok(Array.isArray(plugins), "Native Plugin listing must be a flat array.");
  for (const item of plugins) {
    assertRecord(item, "Plugin row");
    assert.equal(typeof item.name, "string");
    assert.equal(typeof item.source, "string");
    assert.equal(typeof item.enabled, "boolean");
    for (const field of ["marketplace", "version", "installedFrom"]) {
      if (field in item) assert.equal(typeof item[field], "string", `Plugin ${field} must be a string.`);
    }
  }
}

async function assertInventory(plugins, sources, enabledNames) {
  assertPluginList(plugins);
  for (const [name, source] of sources) {
    const rows = plugins.filter((item) => item.name === name && item.marketplace === "teamai");
    assert.equal(rows.length, 1, `Expected one precise ${name}@teamai inventory row.`);
    const item = rows[0];
    assert.equal(item.source, "live");
    assert.equal(item.version, source.version);
    assert.equal(typeof item.installedFrom, "string");
    assert.ok(path.isAbsolute(item.installedFrom));
    assert.equal(await realpath(item.installedFrom), marketplaceRoot);
    assert.equal(item.enabled, enabledNames.includes(name), `${name} activation must match explicit installs.`);
  }
  assert.ok(!plugins.some((item) => item.name === "role-api"));
}

try {
  profile = await mkdtemp(path.join(os.tmpdir(), "teamai-copilot-smoke-"));
  const copilotHome = path.join(profile, ".copilot");
  const cacheHome = path.join(profile, ".cache");
  const appData = path.join(profile, "AppData", "Roaming");
  const localAppData = path.join(profile, "AppData", "Local");
  const tempHome = path.join(profile, "tmp");
  const ghConfig = path.join(profile, ".config", "gh");
  const xdgConfig = path.join(profile, ".config");
  await Promise.all([copilotHome, cacheHome, appData, localAppData, tempHome, ghConfig].map((directory) => mkdir(directory, { recursive: true })));
  env = {
    ...process.env,
    HOME: profile,
    USERPROFILE: profile,
    COPILOT_HOME: copilotHome,
    COPILOT_CACHE_HOME: cacheHome,
    APPDATA: appData,
    LOCALAPPDATA: localAppData,
    TEMP: tempHome,
    TMP: tempHome,
    GH_CONFIG_DIR: ghConfig,
    XDG_CONFIG_HOME: xdgConfig,
  };
  delete env.COPILOT_GITHUB_TOKEN;
  delete env.GH_TOKEN;
  delete env.GITHUB_TOKEN;

  console.log(JSON.stringify({ marketplaceRoot, profile, copilotHome, cacheHome, appData, localAppData, tempHome, ghConfig, xdgConfig }));
  const versionOutput = (await run(["--version"])).stdout;
  const versions = [...versionOutput.matchAll(/^GitHub Copilot CLI (\d+\.\d+\.\d+)\.?\s*$/gm)];
  assert.equal(versions.length, 1, `Expected one actual Copilot runtime version in: ${versionOutput}`);
  const version = versions[0][1];
  assert.equal(version, "1.0.91", `Expected frozen Copilot CLI 1.0.91, received: ${versionOutput}`);

  const sourceCatalog = await readJson(path.join(marketplaceRoot, ".github", "plugin", "marketplace.json"));
  assert.equal(sourceCatalog.name, "teamai");
  const sources = new Map();
  for (const name of ["common", "api", "teamai-project"]) {
    const entries = sourceCatalog.plugins.filter((item) => item.name === name);
    assert.equal(entries.length, 1, `Expected one source catalog entry for ${name}.`);
    const entry = entries[0];
    assert.equal(typeof entry.source, "string");
    assert.equal(typeof entry.version, "string");
    const root = await realpath(path.resolve(marketplaceRoot, entry.source));
    const manifest = await readJson(path.join(root, "plugin.json"));
    assert.equal(manifest.name, name);
    assert.equal(manifest.version, entry.version, `${name} catalog/manifest versions must match.`);
    sources.set(name, { root, version: manifest.version });
  }

  const initialMarketplaces = JSON.parse((await run(["plugin", "marketplace", "list", "--json"])).stdout);
  assert.ok(Array.isArray(initialMarketplaces));
  assert.ok(!initialMarketplaces.some((item) => item.name === "teamai"), "Fresh profile must not already register teamai.");

  await run(["plugin", "marketplace", "add", marketplaceRoot]);
  const marketplaces = JSON.parse((await run(["plugin", "marketplace", "list", "--json"])).stdout);
  assert.ok(Array.isArray(marketplaces));
  for (const item of marketplaces) {
    assertRecord(item, "Marketplace row");
    assert.equal(typeof item.name, "string");
    assert.equal(typeof item.source, "string");
    assert.equal(typeof item.isDefault, "boolean");
  }
  const registrations = marketplaces.filter((item) => item.name === "teamai");
  assert.equal(registrations.length, 1);
  assert.equal(registrations[0].source, `Local: ${marketplaceRoot}`);
  assert.equal(registrations[0].isDefault, false);

  const catalog = JSON.parse((await run(["plugin", "marketplace", "browse", "teamai", "--json"])).stdout);
  assert.ok(Array.isArray(catalog));
  for (const item of catalog) {
    assertRecord(item, "Browse row");
    assert.equal(typeof item.name, "string");
    assert.equal(typeof item.marketplace, "string");
  }
  for (const name of sources.keys()) {
    assert.equal(catalog.filter((item) => item.name === name && item.marketplace === "teamai").length, 1);
  }
  assert.ok(!catalog.some((item) => item.name === "role-api"));

  const discovered = JSON.parse((await run(["plugin", "list", "--json"])).stdout);
  await assertInventory(discovered, sources, []);
  await run(["plugin", "install", "common@teamai"]);
  const commonInstalled = JSON.parse((await run(["plugin", "list", "--json"])).stdout);
  await assertInventory(commonInstalled, sources, ["common"]);
  const commonSettings = await readJson(path.join(copilotHome, "settings.json"));
  assertRecord(commonSettings.enabledPlugins, "Native enabledPlugins after common install");
  assert.equal(commonSettings.enabledPlugins["common@teamai"], true);
  assert.notEqual(commonSettings.enabledPlugins["api@teamai"], true);
  assert.notEqual(commonSettings.enabledPlugins["teamai-project@teamai"], true);
  await run(["plugin", "install", "api@teamai"]);
  const installed = JSON.parse((await run(["plugin", "list", "--json"])).stdout);
  await assertInventory(installed, sources, ["common", "api"]);
  const settings = await readJson(path.join(copilotHome, "settings.json"));
  assertRecord(settings.enabledPlugins, "Native enabledPlugins");
  assert.equal(settings.enabledPlugins["common@teamai"], true);
  assert.equal(settings.enabledPlugins["api@teamai"], true);
  assert.notEqual(settings.enabledPlugins["teamai-project@teamai"], true);

  const skills = JSON.parse((await run(["skill", "list", "--json"])).stdout);
  assert.ok(Array.isArray(skills), "Native skill listing must be an array.");
  for (const item of skills) {
    assertRecord(item, "Skill row");
    assert.equal(typeof item.name, "string");
    assert.equal(typeof item.source, "string");
    assert.equal(typeof item.path, "string");
    assert.equal(typeof item.enabled, "boolean");
  }
  const expectedSkillPath = await realpath(path.join(sources.get("common").root, "skills", "code-review"));
  const fixtureSkills = skills.filter((item) => item.name === "code-review" && item.source === "plugin" && path.resolve(item.path) === expectedSkillPath);
  assert.equal(fixtureSkills.length, 1, "The exact common Plugin code-review Skill must be discovered.");
  assert.ok(path.isAbsolute(fixtureSkills[0].path));
  assert.equal(fixtureSkills[0].enabled, true);

  const mcp = JSON.parse((await run(["mcp", "list", "--json"])).stdout);
  assertRecord(mcp, "MCP listing");
  assertRecord(mcp.mcpServers, "MCP mcpServers map");
  for (const server of Object.values(mcp.mcpServers)) {
    assertRecord(server, "MCP server record");
    assert.equal(typeof server.source, "string");
    assert.equal(typeof server.enabled, "boolean");
  }
  console.log(`MCP listing protocol read: ${Object.keys(mcp.mcpServers).length} configuration records; tool execution not observed.`);

  console.log(`Copilot CLI ${version} local Marketplace contract passed on ${process.platform}.`);
} finally {
  if (profile) await rm(profile, { recursive: true, force: true });
}
