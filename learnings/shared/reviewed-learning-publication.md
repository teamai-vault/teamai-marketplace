---
id: 3575b729-63c1-4406-a27a-66f5470762c0
title: reviewed learning publication
owner: Wsr-7
logicalProject: shared
sourceRepo: source
createdAt: 2026-10-04T06:51:55.348Z
tags:
  - reviewed-publication
  - cross-home-sync
---

# Reviewed Learning publication across isolated homes

A Learning becomes published only when its contribution PR is approved and merged into the `teamai-learnings` branch. A contribution branch, an open PR, and a local outbox item are not published sources.

For a cross-home-publication check, initialize a second isolated home with the same Marketplace source, run `teamai sync`, then query with `teamai recall`. Compare the returned Learning ID, source revision, relative path, content hash, and source lines with the merged branch before using the result as evidence.
