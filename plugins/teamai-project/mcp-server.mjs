import { createInterface } from "node:readline";

const protocolVersionDefault = "2025-11-25";
const supportedProtocolVersions = new Set(["2024-11-05", "2025-03-26", "2025-06-18", protocolVersionDefault]);
const toolName = "teamai_project_mcp_probe";
const marker = "TEAMAI_PROJECT_MCP_PROBE_V4_C42A";
const tools = [{
  name: toolName,
  description: "Return the Team AI Project MCP probe marker.",
  inputSchema: {
    type: "object",
    properties: {},
    additionalProperties: false,
  },
}];

function send(message) {
  process.stdout.write(JSON.stringify(message) + String.fromCharCode(10));
}

function success(id, result) {
  send({ jsonrpc: "2.0", id, result });
}

function failure(id, code, message) {
  send({ jsonrpc: "2.0", id, error: { code, message } });
}

function handle(message) {
  if (!message || message.jsonrpc !== "2.0" || typeof message.method !== "string") {
    if (message && Object.hasOwn(message, "id")) failure(message.id, -32600, "Invalid Request");
    return;
  }

  if (!Object.hasOwn(message, "id")) return;

  switch (message.method) {
    case "initialize": {
      const requestedVersion = message.params?.protocolVersion;
      success(message.id, {
        protocolVersion: supportedProtocolVersions.has(requestedVersion) ? requestedVersion : protocolVersionDefault,
        capabilities: { tools: {} },
        serverInfo: { name: "teamai-project-probe", version: "0.2.0" },
      });
      return;
    }
    case "ping":
      success(message.id, {});
      return;
    case "tools/list":
      success(message.id, { tools });
      return;
    case "tools/call":
      if (message.params?.name !== toolName) {
        failure(message.id, -32602, "Unknown tool");
        return;
      }
      success(message.id, {
        content: [{ type: "text", text: marker }],
        isError: false,
      });
      return;
    default:
      failure(message.id, -32601, "Method not found");
  }
}

const input = createInterface({ input: process.stdin, crlfDelay: Infinity });
input.on("line", (line) => {
  try {
    handle(JSON.parse(line));
  } catch {
    send({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } });
  }
});
