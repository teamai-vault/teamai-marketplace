# Windows and macOS source portability

Repository text and Plugin shell/Node scripts use UTF-8 without BOM and LF.
`.gitattributes` fixes checkout bytes independently of `core.autocrlf`; `.cmd`
and `.bat` use CRLF. `.editorconfig` guides editing. Use a fresh checkout
instead of renormalizing an entire existing worktree. Source normalization
does not authorize changes to published Learnings, receipts or payloads.

The catalog remains `.github/plugin/marketplace.json`. Shipped Plugin content
changes still require the Plugin/catalog version check. An EOL checkout rule
does not change an existing LF Git blob or manufacture a `source_sha`. The
CLI mirrors user-instruction bytes from the selected source unchanged.

Published Learning authority is a separate branch. Its raw Git blob hashes,
contribution payloads and original line numbers are provenance. A semantic
comparison can normalize text in a copy; do not normalize that authority or
claim different raw hashes are identical. The `learnings/**` preservation
exception does not authorize adding files to the authority branch.

Run `npm run validate`, `npm test`, and `npm run validate -- --base <revision>`
sequentially. The public validator entry resolves native paths, including
Unicode, spaces, `#` and `%`; an invalid catalog must produce exit 1 rather
than silently skip validation. Run `test:copilot` with the repository's pinned
official runtime in an isolated profile. Exercise actual fresh checkouts with
both `core.autocrlf=true` and `false` and compare source bytes.

Node-invoked Hook/MCP probes do not need a POSIX executable bit. A Bash
template is invoked with `bash`, as its instructions specify; a successful
Git for Windows Bash run does not prove macOS execution. Catalog/Skill/MCP
configuration discovery remains distinct from actual tool/model consumption.
Record the OS, CPU, runtime, commands and unexecuted consumer combinations.

## Current platform acceptance

On 2026-10-04, macOS testing for this patch is explicitly skipped because no
macOS test environment is available. Keep this recorded as skipped, rather
than passed. Earlier macOS CI results apply to their earlier revisions.
The CLI rejects unsupported Windows long paths with actionable errors; use
short writable roots for profiles and temporary directories. Actual model
and VS Code extension consumption remain unverified.

References: [Git attributes](https://git-scm.com/docs/gitattributes),
[Node file URLs](https://nodejs.org/api/url.html#urlfileurltopathurl-options).
