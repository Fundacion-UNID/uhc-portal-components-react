---
name: frontend-evidence-retention
description: Preserve shared portal component concepts, screenshots and QA evidence in a consistent Git-ignored snapshots hierarchy inside this repository.
---

# Frontend evidence retention

Store every generated concept, visual reference, browser screenshot and QA
capture under `snapshots/<YYYY-MM-DD>/<flow>/` in this repository. Keep
`snapshots/` and `test-results/` Git-ignored, retain them after QA, and never
force-add them to Git. Never leave artifacts in `/tmp`, `/private/tmp`,
`~/.codex`, the repository root, docs or fixtures. If a tool emits elsewhere,
move the artifact immediately and use only its repository path afterward.
