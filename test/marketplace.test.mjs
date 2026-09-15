import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
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

test("validator rejects in-repository links to outside plugins", async (context) => {
  const parent = await mkdtemp(path.join(os.tmpdir(), "team-ai-marketplace-link-boundary-"));
  context.after(() => rm(parent, { recursive: true, force: true }));
  const marketplace = path.join(parent, "marketplace");
  const outside = path.join(parent, "outside-plugin");
  await mkdir(path.join(marketplace, ".github", "plugin"), { recursive: true });
  await mkdir(path.join(marketplace, "plugins"), { recursive: true });
  await mkdir(outside, { recursive: true });
  await symlink(outside, path.join(marketplace, "plugins", "linked-plugin"), process.platform === "win32" ? "junction" : "dir");
  await writeFile(path.join(marketplace, ".github", "plugin", "marketplace.json"), JSON.stringify({
    name: "test-marketplace",
    plugins: [{ name: "linked-plugin", version: "0.1.0", source: "./plugins/linked-plugin" }],
  }), "utf8");
  await writeFile(path.join(outside, "plugin.json"), JSON.stringify({
    $schema: "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
    name: "linked-plugin",
    version: "0.1.0",
  }), "utf8");

  assert.deepEqual(await validateMarketplace(marketplace), [
    "linked-plugin: plugin source must stay inside the marketplace repository: ./plugins/linked-plugin",
  ]);
});

test("validator rejects skills without a description", async (context) => {
  const marketplace = await mkdtemp(path.join(os.tmpdir(), "team-ai-marketplace-skill-"));
  context.after(() => rm(marketplace, { recursive: true, force: true }));
  const plugin = path.join(marketplace, "plugins", "test-plugin");
  await mkdir(path.join(marketplace, ".github", "plugin"), { recursive: true });
  await mkdir(path.join(plugin, "skills", "test-skill"), { recursive: true });
  await writeFile(path.join(marketplace, ".github", "plugin", "marketplace.json"), JSON.stringify({
    name: "test-marketplace",
    plugins: [{ name: "test-plugin", version: "0.1.0", source: "./plugins/test-plugin" }],
  }), "utf8");
  await writeFile(path.join(plugin, "plugin.json"), JSON.stringify({
    $schema: "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
    name: "test-plugin",
    version: "0.1.0",
  }), "utf8");
  await writeFile(path.join(plugin, "skills", "test-skill", "SKILL.md"), "---\nname: test-skill\n---\n", "utf8");

  assert.deepEqual(await validateMarketplace(marketplace), [
    "test-plugin: skill test-skill is missing a frontmatter description",
  ]);
});

test("validator rejects plugin content links outside the plugin source", async (context) => {
  const parent = await mkdtemp(path.join(os.tmpdir(), "team-ai-marketplace-content-boundary-"));
  context.after(() => rm(parent, { recursive: true, force: true }));
  const marketplace = path.join(parent, "marketplace");
  const outside = path.join(parent, "outside");
  const plugins = ["linked-manifest", "linked-skills", "linked-skill-file"];
  await mkdir(path.join(marketplace, ".github", "plugin"), { recursive: true });
  await mkdir(outside, { recursive: true });
  await writeFile(path.join(marketplace, ".github", "plugin", "marketplace.json"), JSON.stringify({
    name: "test-marketplace",
    plugins: plugins.map((name) => ({ name, version: "0.1.0", source: `./plugins/${name}` })),
  }), "utf8");

  const manifest = (name) => JSON.stringify({
    $schema: "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
    name,
    version: "0.1.0",
  });

  const manifestPlugin = path.join(marketplace, "plugins", "linked-manifest");
  await mkdir(manifestPlugin, { recursive: true });
  await writeFile(path.join(outside, "plugin.json"), manifest("linked-manifest"), "utf8");
  await symlink(path.join(outside, "plugin.json"), path.join(manifestPlugin, "plugin.json"), "file");

  const skillsPlugin = path.join(marketplace, "plugins", "linked-skills");
  await mkdir(skillsPlugin, { recursive: true });
  await writeFile(path.join(skillsPlugin, "plugin.json"), manifest("linked-skills"), "utf8");
  await mkdir(path.join(outside, "skills"), { recursive: true });
  await symlink(path.join(outside, "skills"), path.join(skillsPlugin, "skills"), process.platform === "win32" ? "junction" : "dir");

  const skillFilePlugin = path.join(marketplace, "plugins", "linked-skill-file");
  await mkdir(path.join(skillFilePlugin, "skills", "test-skill"), { recursive: true });
  await writeFile(path.join(skillFilePlugin, "plugin.json"), manifest("linked-skill-file"), "utf8");
  await writeFile(path.join(outside, "SKILL.md"), "---\nname: test-skill\ndescription: test\n---\n", "utf8");
  await symlink(path.join(outside, "SKILL.md"), path.join(skillFilePlugin, "skills", "test-skill", "SKILL.md"), "file");

  assert.deepEqual(await validateMarketplace(marketplace), [
    "linked-manifest: plugin.json must stay inside the plugin source",
    "linked-skills: skills directory must stay inside the plugin source",
    "linked-skill-file: skill test-skill/SKILL.md must stay inside the plugin source",
  ]);
});
