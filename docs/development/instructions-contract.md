# Managed User Instructions Contract

## Source

The Marketplace publishes user instructions from the fixed root `instructions/`. Discovery recursively includes only regular, single-link-count files named `*.instructions.md`; no Marketplace manifest field selects or supplements this source.

Relative paths and file bytes pass through unchanged. Native Copilot frontmatter, including `applyTo`, remains part of each file rather than Marketplace metadata. Directory and file names organize the source tree but add no company, role, product, priority, or action semantics.

## Absence and containment

A missing `instructions/` root means the Marketplace publishes no managed user instructions. An existing root that is not a directory, is link-like, or cannot be read is an error rather than an empty source.

Discovery does not follow link-like entries. Nested content must remain contained by the source tree; symlinks, junctions or other link-like entries, non-files, and files with multiple hard links are excluded. These rules keep published bytes attributable to this repository and make source review meaningful.

## CLI ownership

The sibling `../teamai-cli-customization` repository consumes this source contract. Its CLI mirrors the desired files to `~/.copilot/instructions/team-ai/`, preserving relative paths and content while creating, updating, and removing entries inside that managed subtree.

Team AI owns only `~/.copilot/instructions/team-ai/`. The CLI leaves personal files elsewhere under `~/.copilot/instructions/` and `~/.copilot/copilot-instructions.md` untouched.

## Evolution

`user-instructions/` is intentionally not a fallback source. Supporting both roots would require precedence and duplicate-path rules and could preserve stale instructions after a rename; the contract instead uses one canonical root and an explicit cutover.

A contract change must be coordinated across this Marketplace's discovery validation and tests and the sibling CLI's discovery, reconciliation, and integration tests. Preserve the single-source and managed-subtree ownership boundaries unless a replacement contract explicitly defines their migration.
