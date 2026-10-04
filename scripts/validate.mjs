import { execFileSync } from "node:child_process";
import { realpathSync } from "node:fs";
import { lstat, readFile, readdir, realpath, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const AGENT_PLUGIN_SCHEMA = "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json";
const MCP_SCHEMA = "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json";
const TEAM_AI_EXTENSION_NAMESPACE = "com.company.teamai";
const TEAM_AI_PLUGIN_KINDS = new Set(["common", "role", "project"]);
const NAME_PATTERN = /^(?!.*(?:--|\.\.))[a-z0-9](?:[a-z0-9.-]{0,62}[a-z0-9])?$/;
const HOOK_EVENTS = new Set([
  "agentStop", "errorOccurred", "notification", "permissionRequest", "postToolUse", "postToolUseFailure",
  "preCompact", "preToolUse", "sessionEnd", "sessionStart", "subagentStart", "subagentStop",
  "userPromptSubmitted", "userPromptTransformed",
  "ErrorOccurred", "PostToolUse", "PostToolUseFailure", "PreCompact", "PreToolUse", "SessionEnd",
  "SessionStart", "Stop", "SubagentStop", "UserPromptSubmit",
]);
const REMOTE_EXECUTION = /\b(?:curl|wget|invoke-webrequest|invoke-restmethod|iwr|irm|iex|invoke-expression)\b|\bnpx\s+(?:-y|--yes)\b/i;
const SENSITIVE_HEADER = /^(?:authorization|proxy-authorization|cookie|set-cookie|x-api-key)$/i;

function isOutside(root, target) {
  const relative = path.relative(root, target);
  return relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative);
}

export async function discoverMarketplaceUserInstructions(root = process.cwd()) {
  const sourceRoot = path.join(path.resolve(root), "instructions");
  const discovered = [];

  async function visit(directory, isSourceRoot = false) {
    let directoryInfo;
    try {
      directoryInfo = await lstat(directory);
    } catch (error) {
      if (error?.code === "ENOENT") return;
      throw error;
    }
    if (!directoryInfo.isDirectory() || directoryInfo.isSymbolicLink()) {
      if (isSourceRoot) {
        const reason = directoryInfo.isSymbolicLink() ? "must not be a link-like entry" : "must be a directory";
        throw new Error(`Marketplace user instructions source ${reason}: ${directory}`);
      }
      return;
    }

    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const entryPath = path.join(directory, entry.name);
      let entryInfo;
      try {
        entryInfo = await lstat(entryPath);
      } catch (error) {
        if (error?.code === "ENOENT") continue;
        throw error;
      }
      if (entryInfo.isSymbolicLink()) continue;
      if (entryInfo.isDirectory()) {
        await visit(entryPath);
        continue;
      }
      if (!entryInfo.isFile() || entryInfo.nlink !== 1 || !entry.name.endsWith(".instructions.md")) continue;

      const relativePath = path.relative(sourceRoot, entryPath).replaceAll(path.sep, "/");
      if (relativePath && !isOutside(sourceRoot, entryPath)) discovered.push(relativePath);
    }
  }

  await visit(sourceRoot, true);
  return discovered.sort();
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isPluginRelative(value) {
  return typeof value === "string" && (value === "." || value === "./" || value.startsWith("./") || value.startsWith(".\\"));
}

function isExecutable(value) {
  return typeof value === "string" && value.length > 0 && (isPluginRelative(value) || !/[\s/\\]/.test(value));
}

function isSafePluginPath(value, allowPluginData = false) {
  if (typeof value !== "string" || value.length === 0 || path.isAbsolute(value)) return false;
  const prefixes = allowPluginData ? ["${PLUGIN_ROOT}", "${PLUGIN_DATA}"] : ["${PLUGIN_ROOT}"];
  const prefix = prefixes.find((item) => value === item || value.startsWith(`${item}/`) || value.startsWith(`${item}\\`));
  const relative = prefix ? value.slice(prefix.length).replace(/^[/\\]/, "") : value;
  if (!prefix && !isPluginRelative(value)) return false;
  return !isOutside(".", path.resolve(".", relative || "."));
}

function validateStringMap(value, label, errors) {
  if (value === undefined) return;
  if (!isObject(value) || Object.values(value).some((item) => typeof item !== "string")) {
    errors.push(`${label} must be an object with string values`);
  }
}

function validateStringArray(value, label, errors) {
  if (value !== undefined && (!Array.isArray(value) || value.some((item) => typeof item !== "string"))) {
    errors.push(`${label} must be an array of strings`);
  }
}

function validateUrl(value, label, errors, requireHttps = false) {
  let url;
  try {
    url = new URL(value);
  } catch {
    errors.push(`${label} must be an absolute HTTP or HTTPS URL`);
    return;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    errors.push(`${label} must be an absolute HTTP or HTTPS URL`);
  }
  const loopback = url.hostname === "localhost" || url.hostname === "::1" || url.hostname.startsWith("127.");
  if (url.protocol === "http:" && (requireHttps || !loopback)) {
    errors.push(`${label} must use HTTPS unless it targets loopback`);
  }
  if (url.username || url.password) errors.push(`${label} must not contain credentials`);
  if (url.hash) errors.push(`${label} must not contain a fragment`);
}

function isNewerVersion(current, previous) {
  const parse = (version) => {
    if (typeof version !== "string") return undefined;
    const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(version);
    return match?.slice(1).map(BigInt);
  };
  const currentParts = parse(current);
  const previousParts = parse(previous);
  if (!currentParts || !previousParts) return false;
  for (let index = 0; index < currentParts.length; index += 1) {
    if (currentParts[index] !== previousParts[index]) return currentParts[index] > previousParts[index];
  }
  return false;
}

async function validatePluginFile(pluginRoot, value, label, errors) {
  if (!isPluginRelative(value) || value === "." || value === "./") return;
  try {
    const resolved = await realpath(path.resolve(pluginRoot, value));
    if (isOutside(pluginRoot, resolved) || !(await stat(resolved)).isFile()) throw new Error("outside");
  } catch {
    errors.push(`${label} is not visible inside the plugin source: ${value}`);
  }
}

async function readOptionalPluginJson(pluginRoot, relativePath, pluginName, errors) {
  const candidate = path.join(pluginRoot, relativePath);
  let resolved;
  try {
    resolved = await realpath(candidate);
  } catch (error) {
    if (error?.code === "ENOENT") return undefined;
    throw error;
  }
  if (isOutside(pluginRoot, resolved)) {
    errors.push(`${pluginName}: ${relativePath.replaceAll("\\", "/")} must stay inside the plugin source`);
    return undefined;
  }
  try {
    return JSON.parse(await readFile(resolved, "utf8"));
  } catch {
    errors.push(`${pluginName}: ${relativePath.replaceAll("\\", "/")} must contain valid JSON`);
    return undefined;
  }
}

async function validateMcpConfig(config, pluginRoot, pluginName, errors) {
  if (!isObject(config)) {
    errors.push(`${pluginName}: mcp.json must contain an object`);
    return;
  }
  if (config.$schema !== MCP_SCHEMA) errors.push(`${pluginName}: mcp.json must use Agent Plugins 1.0 MCP schema`);
  if (!isObject(config.mcpServers)) {
    errors.push(`${pluginName}: mcp.json must contain an mcpServers object`);
    return;
  }
  for (const [name, server] of Object.entries(config.mcpServers)) {
    const label = `${pluginName}: MCP server ${name}`;
    if (!isObject(server)) {
      errors.push(`${label} must contain an object`);
      continue;
    }
    if (server.type === "stdio") {
      if (!isExecutable(server.command)) errors.push(`${label} command must be a bare executable or plugin-relative path`);
      validateStringArray(server.args, `${label} args`, errors);
      validateStringMap(server.env, `${label} env`, errors);
      if (server.cwd !== undefined && !isSafePluginPath(server.cwd, true)) {
        errors.push(`${label} cwd must stay inside the plugin source or PLUGIN_DATA`);
      }
      await validatePluginFile(pluginRoot, server.command, `${label} command`, errors);
      if (Array.isArray(server.args)) {
        for (const argument of server.args) await validatePluginFile(pluginRoot, argument, `${label} source`, errors);
      }
    } else if (server.type === "streamable-http" || server.type === "sse") {
      validateUrl(server.url, `${label} URL`, errors);
      validateStringMap(server.headers, `${label} headers`, errors);
      if (isObject(server.headers) && Object.keys(server.headers).some((header) => SENSITIVE_HEADER.test(header))) {
        errors.push(`${label} must not embed credentials in headers`);
      }
    } else {
      errors.push(`${label} has unsupported type ${server.type ?? "<missing>"}`);
    }
  }
}

async function validateHookConfig(config, pluginRoot, pluginName, errors) {
  if (!isObject(config)) {
    errors.push(`${pluginName}: hooks.json must contain an object`);
    return;
  }
  if (config.version !== 1) errors.push(`${pluginName}: hooks.json version must be 1`);
  if (!isObject(config.hooks)) {
    errors.push(`${pluginName}: hooks.json must contain a hooks object`);
    return;
  }
  for (const [event, entries] of Object.entries(config.hooks)) {
    if (!HOOK_EVENTS.has(event)) errors.push(`${pluginName}: unknown Hook event ${event}`);
    if (!Array.isArray(entries)) {
      errors.push(`${pluginName}: Hook event ${event} must be an array`);
      continue;
    }
    for (const [index, entry] of entries.entries()) {
      const label = `${pluginName}: Hook ${event}[${index}]`;
      if (!isObject(entry)) {
        errors.push(`${label} must contain an object`);
        continue;
      }
      if ((entry.type ?? "command") === "http") {
        validateUrl(entry.url, `${label} URL`, errors, event === "preToolUse" || event === "permissionRequest");
        validateStringMap(entry.headers, `${label} headers`, errors);
        validateStringArray(entry.allowedEnvVars, `${label} allowedEnvVars`, errors);
        continue;
      }
      if ((entry.type ?? "command") === "prompt") {
        if (event !== "sessionStart") errors.push(`${label} prompt hooks are only valid for sessionStart`);
        if (typeof entry.prompt !== "string" || entry.prompt.length === 0) errors.push(`${label} prompt must be a non-empty string`);
        continue;
      }
      if ((entry.type ?? "command") !== "command") {
        errors.push(`${label} has unsupported type ${entry.type}`);
        continue;
      }
      const shellCommands = [entry.bash, entry.powershell, entry.command].filter((value) => value !== undefined);
      if (entry.exec !== undefined && shellCommands.length > 0) errors.push(`${label} must not combine exec with shell commands`);
      if (entry.exec !== undefined && !isExecutable(entry.exec)) {
        errors.push(`${label} exec must be a bare executable or plugin-relative path`);
      }
      if (entry.exec === undefined && entry.command === undefined && !(entry.bash !== undefined && entry.powershell !== undefined)) {
        errors.push(`${label} must provide both bash and powershell for cross-platform shell execution`);
      }
      if (shellCommands.some((command) => typeof command === "string" && REMOTE_EXECUTION.test(command))) {
        errors.push(`${label} contains remote download or execute behavior`);
      }
      validateStringArray(entry.args, `${label} args`, errors);
      validateStringMap(entry.env, `${label} env`, errors);
      if (entry.cwd !== undefined && !isSafePluginPath(entry.cwd)) errors.push(`${label} cwd must stay inside the plugin source`);
      await validatePluginFile(pluginRoot, entry.exec, `${label} exec`, errors);
      if (Array.isArray(entry.args)) {
        for (const argument of entry.args) await validatePluginFile(pluginRoot, argument, `${label} source`, errors);
      }
    }
  }
}

function resolveGitSourcePath(root, baseRef, sourcePath) {
  let remaining = sourcePath ? sourcePath.split("/").filter(Boolean) : [];
  let resolved = [];
  const visitedLinks = new Set();

  while (remaining.length > 0) {
    const parentPath = resolved.join("/");
    const treeish = parentPath ? `${baseRef}:${parentPath}` : baseRef;
    const entries = execFileSync("git", ["ls-tree", "-z", treeish], {
      cwd: root,
      encoding: "utf8",
    }).split("\0").filter(Boolean).map((entry) => {
      const separator = entry.indexOf("\t");
      return { mode: entry.slice(0, 6), name: entry.slice(separator + 1) };
    });
    const requestedName = remaining[0];
    const matchingEntries = entries.filter(({ name }) => process.platform === "win32"
      ? name.toLowerCase() === requestedName.toLowerCase()
      : name === requestedName);
    if (matchingEntries.length !== 1) return undefined;
    const [entry] = matchingEntries;
    const candidate = [...resolved, entry.name].join("/");

    if (entry.mode === "120000") {
      const target = execFileSync("git", ["show", `${baseRef}:${candidate}`], {
        cwd: root,
        encoding: "utf8",
      });
      if (path.posix.isAbsolute(target) || path.win32.isAbsolute(target)) return undefined;
      const relativeTarget = target.replaceAll("\\", "/");
      const targetPath = path.posix.normalize(path.posix.join(path.posix.dirname(candidate), relativeTarget));
      if (targetPath === ".." || targetPath.startsWith("../") || path.posix.isAbsolute(targetPath)) return undefined;
      const linkIdentity = `${candidate}\0${targetPath}`;
      if (visitedLinks.has(linkIdentity)) return undefined;
      visitedLinks.add(linkIdentity);
      const targetParts = targetPath === "." ? [] : targetPath.split("/").filter(Boolean);
      remaining = [...targetParts, ...remaining.slice(1)];
      resolved = [];
    } else {
      resolved.push(entry.name);
      remaining.shift();
    }
  }

  return resolved.join("/");
}

async function validatePluginVersionsAgainstBase(root, plugins, baseRef, errors) {
  let changedFiles;
  let basePlugins;
  try {
    changedFiles = execFileSync("git", ["-c", "core.quotepath=false", "diff", "--name-only", "--no-renames", "-z", baseRef, "--"], {
      cwd: root,
      encoding: "utf8",
    }).split("\0").filter(Boolean);
    const baseMarketplace = JSON.parse(execFileSync("git", ["show", `${baseRef}:.github/plugin/marketplace.json`], {
      cwd: root,
      encoding: "utf8",
    }));
    basePlugins = new Map(baseMarketplace.plugins.map((plugin) => [plugin.name, plugin]));
  } catch (error) {
    errors.push(`Unable to compare Plugin changes against base ${baseRef}: ${error.stderr?.toString().trim() || error.message}`);
    return;
  }

  for (const plugin of plugins) {
    const previous = basePlugins.get(plugin.name);
    if (!previous) continue;
    const currentRoot = path.resolve(root, plugin.source ?? "");
    const previousRoot = path.resolve(root, previous.source ?? "");
    if (isOutside(root, currentRoot) || isOutside(root, previousRoot)) continue;
    const currentPath = path.relative(root, currentRoot).split(path.sep).join("/");
    const previousPath = path.relative(root, previousRoot).split(path.sep).join("/");
    const sourceChanged = plugin.source !== previous.source;
    let currentRealPath;
    try {
      currentRealPath = await realpath(currentRoot);
    } catch {
      currentRealPath = currentRoot;
    }
    const currentRealPathRelative = isOutside(root, currentRealPath)
      ? undefined
      : path.relative(root, currentRealPath).split(path.sep).join("/");
    const sourcePaths = [currentPath, currentRealPathRelative, previousPath].filter((directory) => directory !== undefined);
    const changed = sourceChanged || changedFiles.some((file) => sourcePaths.some((directory) => (
      directory === "" || file === directory || file.startsWith(`${directory}/`)
    )));
    if (!changed) continue;

    let previousManifest;
    try {
      const baseSourcePath = resolveGitSourcePath(root, baseRef, previousPath);
      if (baseSourcePath === undefined) throw new Error("base Plugin source resolves outside the repository or has a symlink cycle");
      const manifestPath = baseSourcePath ? `${baseSourcePath}/plugin.json` : "plugin.json";
      previousManifest = JSON.parse(execFileSync("git", ["show", `${baseRef}:${manifestPath}`], {
        cwd: root,
        encoding: "utf8",
      }));
    } catch (error) {
      errors.push(`${plugin.name}: could not read plugin.json at base ${baseRef}: ${error.stderr?.toString().trim() || error.message}`);
      continue;
    }
    if (!isNewerVersion(plugin.version, previousManifest.version)) {
      errors.push(`${plugin.name}: Plugin content changed from base ${baseRef} without a higher SemVer version`);
    }
  }
}

export async function validateMarketplace(root = process.cwd(), { baseRef } = {}) {
  const errors = [];
  const marketplaceRoot = await realpath(path.resolve(root));
  const marketplacePath = path.join(marketplaceRoot, ".github", "plugin", "marketplace.json");
  const marketplace = JSON.parse(await readFile(marketplacePath, "utf8"));
  const packageJson = JSON.parse(await readFile(path.join(marketplaceRoot, "package.json"), "utf8"));

  try {
    await lstat(path.join(marketplaceRoot, "learnings"));
    errors.push("Resource branch must not contain a root learnings/ directory; published Learnings come from teamai-learnings");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  if (marketplace.metadata?.version !== packageJson.version) {
    errors.push(`Marketplace metadata version ${marketplace.metadata?.version ?? "<missing>"} does not match package.json ${packageJson.version ?? "<missing>"}`);
  }
  try {
    await discoverMarketplaceUserInstructions(marketplaceRoot);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : `Marketplace user instructions source could not be read: ${path.join(marketplaceRoot, "instructions")}`);
  }

  if (!NAME_PATTERN.test(marketplace.name ?? "")) {
    errors.push(`Invalid marketplace name: ${marketplace.name ?? "<missing>"}`);
  }
  if (!Array.isArray(marketplace.plugins) || marketplace.plugins.length === 0) {
    errors.push(".github/plugin/marketplace.json must contain at least one plugin");
    return errors;
  }

  if (baseRef) await validatePluginVersionsAgainstBase(marketplaceRoot, marketplace.plugins, baseRef, errors);

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

    const manifestPath = await realpath(path.join(resolvedPluginRoot, "plugin.json"));
    if (isOutside(resolvedPluginRoot, manifestPath)) {
      errors.push(`${entry.name}: plugin.json must stay inside the plugin source`);
      continue;
    }
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
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
    const extensions = isObject(manifest.extensions) ? manifest.extensions : undefined;
    const teamAiMetadata = extensions?.[TEAM_AI_EXTENSION_NAMESPACE];
    if (!isObject(teamAiMetadata)) {
      errors.push(`${entry.name}: plugin.json must define extensions.${TEAM_AI_EXTENSION_NAMESPACE} metadata`);
    } else if (!TEAM_AI_PLUGIN_KINDS.has(teamAiMetadata.kind)) {
      errors.push(`${entry.name}: extensions.${TEAM_AI_EXTENSION_NAMESPACE}.kind must be one of common, role, project`);
    }
    if (extensions && Object.keys(extensions).some((namespace) => namespace !== TEAM_AI_EXTENSION_NAMESPACE)) {
      errors.push(`${entry.name}: plugin.json extensions must use only ${TEAM_AI_EXTENSION_NAMESPACE} namespace`);
    }

    const mcpConfig = await readOptionalPluginJson(resolvedPluginRoot, "mcp.json", entry.name, errors);
    if (mcpConfig !== undefined) await validateMcpConfig(mcpConfig, resolvedPluginRoot, entry.name, errors);
    const hookConfig = await readOptionalPluginJson(
      resolvedPluginRoot,
      path.join("com.github.copilot", "hooks", "hooks.json"),
      entry.name,
      errors,
    );
    if (hookConfig !== undefined) await validateHookConfig(hookConfig, resolvedPluginRoot, entry.name, errors);

    let skillsRoot;
    let skillDirs = [];
    try {
      skillsRoot = await realpath(path.join(resolvedPluginRoot, "skills"));
      if (isOutside(resolvedPluginRoot, skillsRoot)) {
        errors.push(`${entry.name}: skills directory must stay inside the plugin source`);
        continue;
      }
      skillDirs = (await readdir(skillsRoot, { withFileTypes: true }))
        .filter((item) => item.isDirectory() || item.isSymbolicLink());
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }

    for (const skillDir of skillDirs) {
      const resolvedSkillRoot = await realpath(path.join(skillsRoot, skillDir.name));
      if (isOutside(resolvedPluginRoot, resolvedSkillRoot)) {
        errors.push(`${entry.name}: skill directory ${skillDir.name} must stay inside the plugin source`);
        continue;
      }
      if (!(await stat(resolvedSkillRoot)).isDirectory()) continue;
      const skillPath = path.join(resolvedSkillRoot, "SKILL.md");
      let contents;
      try {
        const resolvedSkillPath = await realpath(skillPath);
        if (isOutside(resolvedPluginRoot, resolvedSkillPath)) {
          errors.push(`${entry.name}: skill ${skillDir.name}/SKILL.md must stay inside the plugin source`);
          continue;
        }
        contents = await readFile(resolvedSkillPath, "utf8");
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

if (process.argv[1] && realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1])) {
  const args = process.argv.slice(2);
  const validArgs = args.length === 0 || (args.length === 2 && args[0] === "--base" && args[1] && !args[1].startsWith("--"));
  if (!validArgs) {
    console.error("Usage: node scripts/validate.mjs [--base <commit-or-ref>]");
    process.exitCode = 2;
  } else {
    const baseRef = args.length === 2 ? args[1] : undefined;
    const errors = await validateMarketplace(process.cwd(), { baseRef });
    if (errors.length > 0) {
      for (const error of errors) console.error(`ERROR: ${error}`);
      process.exitCode = 1;
    } else {
      console.log("Marketplace validation passed.");
    }
  }
}
