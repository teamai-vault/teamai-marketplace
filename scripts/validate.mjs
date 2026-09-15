import { readFile, readdir, realpath, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const AGENT_PLUGIN_SCHEMA = "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json";
const MCP_SCHEMA = "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json";
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

if (import.meta.url === new URL(`file://${process.argv[1].replaceAll("\\", "/")}`).href) {
  const errors = await validateMarketplace();
  if (errors.length > 0) {
    for (const error of errors) console.error(`ERROR: ${error}`);
    process.exitCode = 1;
  } else {
    console.log("Marketplace validation passed.");
  }
}
