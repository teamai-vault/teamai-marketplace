#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const exec = promisify(execFile);
const marketplaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let profile;
let env;

async function run(args) {
  const command = process.platform === "win32" ? process.env.ComSpec ?? "cmd.exe" : "copilot";
  const commandArgs = process.platform === "win32" ? ["/d", "/s", "/c", "copilot", ...args] : args;
  try {
    return await exec(command, commandArgs, { cwd: marketplaceRoot, env, windowsHide: true });
  } catch (error) {
    throw new Error(`copilot ${args.join(" ")} failed: ${error.stderr?.trim() || error.stdout?.trim() || error.message}`);
  }
}

try {
  profile = await mkdtemp(path.join(os.tmpdir(), "team-ai-copilot-smoke-"));
  const copilotHome = path.join(profile, ".copilot");
  const cacheHome = path.join(profile, ".cache");
  const appData = path.join(profile, "AppData", "Roaming");
  const localAppData = path.join(profile, "AppData", "Local");
  await Promise.all([copilotHome, cacheHome, appData, localAppData].map((directory) => mkdir(directory, { recursive: true })));
  env = {
    ...process.env,
    HOME: profile,
    USERPROFILE: profile,
    COPILOT_HOME: copilotHome,
    COPILOT_CACHE_HOME: cacheHome,
    APPDATA: appData,
    LOCALAPPDATA: localAppData,
  };
  delete env.COPILOT_GITHUB_TOKEN;
  delete env.GH_TOKEN;
  delete env.GITHUB_TOKEN;

  const version = (await run(["--version"])).stdout.trim().split(/\r?\n/, 1)[0];
  assert.match(version, /\b1\.0\.83\b/, `Expected Copilot CLI 1.0.83, received: ${version}`);

  const initialMarketplaces = JSON.parse((await run(["plugins", "marketplace", "list", "--json"])).stdout);
  assert.ok(Array.isArray(initialMarketplaces));

  await run(["plugins", "marketplace", "add", marketplaceRoot]);
  const marketplaces = JSON.parse((await run(["plugins", "marketplace", "list", "--json"])).stdout);
  assert.ok(marketplaces.some((item) => item.name === "teamai"));

  const catalog = JSON.parse((await run(["plugins", "marketplace", "browse", "teamai", "--json"])).stdout);
  assert.ok(Array.isArray(catalog));
  assert.ok(catalog.some((item) => item.name === "common"));
  assert.ok(catalog.some((item) => item.name === "api"));
  assert.ok(!catalog.some((item) => item.name === "role-api"));
  assert.ok(catalog.some((item) => item.name === "product-teamai"));

  await run(["plugins", "install", "api@teamai"]);
  const installed = JSON.parse((await run(["plugins", "list", "--kind", "plugin", "--json"])).stdout);
  assert.ok(Array.isArray(installed.plugins));
  assert.ok(installed.plugins.some((item) => item.name === "api" && item.enabled === true));

  const mcp = JSON.parse((await run(["plugins", "list", "--kind", "mcp", "--json"])).stdout);
  assert.ok(Array.isArray(mcp.plugins));
  assert.ok(Array.isArray(mcp.errors));

  console.log(`Copilot CLI ${version} local Marketplace contract passed on ${process.platform}.`);
} finally {
  if (profile) await rm(profile, { recursive: true, force: true });
}
