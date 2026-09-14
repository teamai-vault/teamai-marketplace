import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import { fileURLToPath } from "node:url";
import path from "node:path";
import test from "node:test";
import { validateMarketplace } from "../scripts/validate.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("marketplace and Agent Plugins 1.0 manifests are structurally valid", async () => {
  assert.deepEqual(await validateMarketplace(root), []);
});

test("catalog publishes the Team AI product plugin", async () => {
  const marketplace = JSON.parse(await readFile(path.join(root, ".github", "plugin", "marketplace.json"), "utf8"));
  assert.ok(marketplace.plugins.some((plugin) => plugin.name === "product-teamai"));
});

test("validator rejects plugin sources outside the marketplace repository", async (context) => {
  const parent = await mkdtemp(path.join(os.tmpdir(), "team-ai-marketplace-boundary-"));
  context.after(() => rm(parent, { recursive: true, force: true }));
  const marketplace = path.join(parent, "marketplace");
  const outside = path.join(parent, "outside-plugin");
  await mkdir(path.join(marketplace, ".github", "plugin"), { recursive: true });
  await mkdir(outside, { recursive: true });
  await writeFile(path.join(marketplace, ".github", "plugin", "marketplace.json"), JSON.stringify({
    name: "test-marketplace",
    plugins: [{ name: "outside-plugin", version: "0.1.0", source: "../outside-plugin" }],
  }), "utf8");
  await writeFile(path.join(outside, "plugin.json"), JSON.stringify({
    $schema: "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
    name: "outside-plugin",
    version: "0.1.0",
  }), "utf8");

  assert.deepEqual(await validateMarketplace(marketplace), [
    "outside-plugin: plugin source must stay inside the marketplace repository: ../outside-plugin",
  ]);
});
