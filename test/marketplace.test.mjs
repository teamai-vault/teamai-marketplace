import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { validateMarketplace } from "../scripts/validate.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("marketplace and Agent Plugins 1.0 manifests are structurally valid", async () => {
  assert.deepEqual(await validateMarketplace(root), []);
});
