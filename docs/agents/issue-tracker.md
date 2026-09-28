# Issue tracker: GitHub

Issues and specs for this repo live in GitHub Issues at `teamai-vault/teamai-marketplace`. Run `gh` from this repo, or pass `--repo teamai-vault/teamai-marketplace`.

## Conventions

- Create, read, list, comment on, label, and close issues with the corresponding `gh issue` commands.
- Read issue comments and labels before triage or implementation.
- When a skill says to publish to the issue tracker, create a GitHub issue.
- When a skill says to fetch a ticket, read its GitHub issue and comments.

## Pull requests as a triage surface

**PRs as a request surface: no.** Change this to `yes` only if external PRs should enter the issue triage queue.

## Wayfinding

A map is a GitHub issue labelled `wayfinder:map`; its tickets are child issues. Use GitHub sub-issues and native issue dependencies when available. If unavailable, link children in the map body and record `Blocked by: #<number>` in each blocked ticket. Claim an unblocked ticket by assigning it before work; resolve it with a comment and close it.
