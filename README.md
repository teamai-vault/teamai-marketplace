# TeamAI Learnings

Published V4 Learnings come only from the `teamai-learnings` branch of this `teamai-marketplace` repository. The resource `main` branch holds the catalog, Plugins, instructions, project manifest, and contexts; it is not a Learning source. A contribution branch or open PR is not published. A Learning is published only after its reviewed content is merged to `teamai-learnings`.

## Layout

- `learnings/shared/<uuid>.md`: knowledge that applies across projects.
- `learnings/<logical-project-id>/<uuid>.md`: knowledge for that actual Marketplace Logical Project.

Each Learning is a Markdown file with this frontmatter:

```yaml
---
id: <UUID matching the filename>
title: <English-first title>
owner: <Git user name>
logicalProject: <shared or actual Project ID>
sourceRepo: <non-secret-repo-label>
createdAt: <ISO-8601 UTC timestamp>
tags:
  - <English-first natural-language tag>
---
```

Keep titles, natural-language tags, and body text English-first. Preserve code identifiers, error codes, diagnostic text, formal names, links, and actual Logical Project IDs exactly. Use a sanitized repository label for `sourceRepo`; do not include credentials or personal filesystem paths.

See the [V4 CLI and Marketplace spec](https://github.com/teamai-vault/teamai-cli-copilot/issues/14) and the [Marketplace branch contract](https://github.com/teamai-vault/teamai-marketplace/issues/8).
