import { readFile, readdir, realpath, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const AGENT_PLUGIN_SCHEMA = "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json";
const NAME_PATTERN = /^(?!.*(?:--|\.\.))[a-z0-9](?:[a-z0-9.-]{0,62}[a-z0-9])?$/;

function isOutside(root, target) {
  const relative = path.relative(root, target);
  return relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative);
}

export async function validateMarketplace(root = process.cwd()) {
  const errors = [];
  const marketplaceRoot = await realpath(path.resolve(root));
  const marketplacePath = path.join(marketplaceRoot, ".github", "plugin", "marketplace.json");
  const marketplace = JSON.parse(await readFile(marketplacePath, "utf8"));

  if (!NAME_PATTERN.test(marketplace.name ?? "")) {
    errors.push(`Invalid marketplace name: ${marketplace.name ?? "<missing>"}`);
  }
  if (!Array.isArray(marketplace.plugins) || marketplace.plugins.length === 0) {
    errors.push(".github/plugin/marketplace.json must contain at least one plugin");
    return errors;
  }

  const pluginNames = new Set();
  const skillOwners = new Map();

  for (const entry of marketplace.plugins) {
    if (!NAME_PATTERN.test(entry.name ?? "")) {
      errors.push(`Invalid plugin name in marketplace: ${entry.name ?? "<missing>"}`);
      continue;
    }
    if (pluginNames.has(entry.name)) {
      errors.push(`Duplicate marketplace plugin: ${entry.name}`);
    }
    pluginNames.add(entry.name);

    const pluginRoot = path.resolve(marketplaceRoot, entry.source ?? "");
    if (isOutside(marketplaceRoot, pluginRoot)) {
      errors.push(`${entry.name}: plugin source must stay inside the marketplace repository: ${entry.source}`);
      continue;
    }
    try {
      if (!(await stat(pluginRoot)).isDirectory()) {
        errors.push(`Plugin source is not a directory: ${entry.source}`);
        continue;
      }
    } catch {
      errors.push(`Plugin source does not exist: ${entry.source}`);
      continue;
    }
    const resolvedPluginRoot = await realpath(pluginRoot);
    if (isOutside(marketplaceRoot, resolvedPluginRoot)) {
      errors.push(`${entry.name}: plugin source must stay inside the marketplace repository: ${entry.source}`);
      continue;
    }

    const manifest = JSON.parse(await readFile(path.join(resolvedPluginRoot, "plugin.json"), "utf8"));
    if (manifest.$schema !== AGENT_PLUGIN_SCHEMA) {
      errors.push(`${entry.name}: plugin.json must use Agent Plugins 1.0 schema`);
    }
    if (manifest.name !== entry.name) {
      errors.push(`${entry.name}: marketplace name does not match plugin.json name ${manifest.name}`);
    }
    if (manifest.version !== entry.version) {
      errors.push(`${entry.name}: marketplace version ${entry.version} does not match plugin.json ${manifest.version}`);
    }
    if (!NAME_PATTERN.test(manifest.name ?? "")) {
      errors.push(`${entry.name}: invalid Agent Plugins 1.0 name`);
    }

    const skillsRoot = path.join(resolvedPluginRoot, "skills");
    let skillDirs = [];
    try {
      skillDirs = (await readdir(skillsRoot, { withFileTypes: true })).filter((item) => item.isDirectory());
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }

    for (const skillDir of skillDirs) {
      const skillPath = path.join(skillsRoot, skillDir.name, "SKILL.md");
      let contents;
      try {
        contents = await readFile(skillPath, "utf8");
      } catch {
        errors.push(`${entry.name}: skill ${skillDir.name} is missing SKILL.md`);
        continue;
      }
      const frontmatter = contents.match(/^---\s*[\r\n]+([\s\S]*?)^---/m)?.[1] ?? "";
      const nameMatch = frontmatter.match(/^name:\s*([^\r\n]+)/m);
      const skillName = nameMatch?.[1]?.trim();
      if (skillName !== skillDir.name) {
        errors.push(`${entry.name}: skill directory ${skillDir.name} does not match frontmatter name ${skillName ?? "<missing>"}`);
      }
      if (!frontmatter.match(/^description:\s*\S.*$/m)) {
        errors.push(`${entry.name}: skill ${skillDir.name} is missing a frontmatter description`);
      }
      const previousOwner = skillOwners.get(skillDir.name);
      if (previousOwner) {
        errors.push(`Duplicate central skill name ${skillDir.name} in ${previousOwner} and ${entry.name}`);
      } else {
        skillOwners.set(skillDir.name, entry.name);
      }
    }
  }

  return errors;
}

if (import.meta.url === new URL(`file://${process.argv[1].replaceAll("\\", "/")}`).href) {
  const errors = await validateMarketplace();
  if (errors.length > 0) {
    for (const error of errors) console.error(`ERROR: ${error}`);
    process.exitCode = 1;
  } else {
    console.log("Marketplace validation passed.");
  }
}
