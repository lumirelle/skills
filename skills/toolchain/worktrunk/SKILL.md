---
name: worktrunk
description: >-
  Use when a repo has `wt` (worktrunk) installed and the work involves Git
  worktrees: creating an isolated checkout for a branch, running work in
  parallel, or merging/cleaning up a worktree. Trigger on the intent even when
  the user never says "worktrunk" (e.g. "work on this in a separate worktree",
  "spin up a parallel branch", "clean up the merged worktrees"). Skip when `wt`
  is not on PATH — plain `git worktree` is then the right tool.
---

# worktrunk

`wt` manages Git worktrees so each branch gets its own directory. **Worktrees are
addressed by branch name, never by path** — `wt switch feature` puts you in the
`feature` worktree, creating it if needed. Four commands cover the lifecycle:

| Goal | Use |
|---|---|
| Get into a branch's worktree (create if needed) | `wt switch <branch>` |
| Create a new branch + worktree | `wt switch --create <branch>` (`--base <ref>` to branch off) |
| See every worktree and its status | `wt list` (`--format=json` to parse) |
| Land a branch on the target and clean up | `wt merge` |
| Delete a worktree, and its branch if integrated | `wt remove` |
| One step of a manual pipeline | `wt step <commit\|squash\|rebase\|push\|diff\|…>` |

## Prefer `--help` over the docs

Run `wt <command> --help` against the **installed** version — `wt list --help` is 563
lines and `wt switch --help` is the whole switch manual. Only when that fails,
`https://worktrunk.dev/<topic>.md` returns clean Markdown per page (`/llms.txt` lists
them).

## On Windows, `wt` is probably Windows Terminal

`wt.exe` already exists there as Windows Terminal's alias, so `wt --help` prints *its*
help and the install looks broken. Winget therefore installs worktrunk as `git-wt`:

- **Check first:** if `wt --version` doesn't mention worktrunk, use `git-wt` for every
  command in this skill (`git wt …` resolves the same binary through Git's dispatch).
- **Then re-run shell integration** with the binary you settled on:
  `git-wt config shell install`.
- **To get `wt` back**, disable the alias in Settings → Apps → Advanced app settings →
  App execution aliases → "Terminal" / "Terminal Preview".

## `wt switch` never changes your directory

This is the one thing that breaks agents. `wt switch` reports the worktree path
and asks a **shell function** to `cd`; a tool-call subprocess cannot change its
own parent's directory, so `pwd` stays put and `wt` prints
`▲ Cannot change directory`. Do not try to fix shell integration from an agent
session — work around it:

1. **Ask `wt` for the path, don't build it.** `wt switch --no-cd --format=json <branch>`
   prints `{"action":…,"branch":…,"path":"…"}`; `wt list --format=json` gives every
   worktree's `worktree.path`. Paths come from a `worktree-path` template, so
   hand-assembling them is wrong.
2. **Then address the worktree explicitly** — `wt -C <path> <cmd>`, or `cd <path>`
   inside the same shell invocation as the command it applies to.

Everything else (hooks, `-x`, merge, remove) still runs in the right worktree;
only your shell stays behind.

## Bare-repo layout

In a bare clone (`.git` is the repo, no home checkout) worktrees are siblings —
`<project>/main`, `<project>/feature` — because `repo_path` is the bare directory itself.

- **The project root is not a worktree.** `git status` there fails with
  `must be run in a work tree` and edits write into nothing — always work from a
  worktree path. `wt list` at the root printing `○ No worktrees` means "nothing
  switched yet", not "not cloned", and `^` marks the **default branch's** worktree.
- Keep one `worktree-path` in user config (the usual recipe is
  `"{{ repo_path }}/../{{ branch | sanitize }}"`) and let `wt` report paths.

## Reading `wt list`

```
  Branch      Status   HEAD±    main↕    main…±  Remote⇅  Path  Commit  Age  Message
@ feature-api   + ↕⇡   +54 -5   ↑4 ↓1    +234 -24  ⇡3     …     6814f02  30m  Add API tests
^ main             ^⇅
```

- **Gutter**: `@` current · `^` primary/default worktree · `+` other worktree ·
  `/` branch without a worktree (`--branches`) · `|` remote only (`--remotes`).
- **Branch state**: `_` same commit as default branch, clean · `⊂` content already
  integrated into the target (handles squash/rebase, not just ancestry). Both are
  safe to delete and render dimmed.

Every other column and the status icons are `wt list --help`'s job.

`wt list` renders progressively — status and divergence fill in from background
git calls, so an empty column early on is not "no changes".

## Hooks and approvals are a security boundary

Project hooks and project aliases live in `.config/wt.toml` (committed, shared)
and run **arbitrary commands** on `switch` / `merge` / `remove`. First run in a
repo stops at an approval prompt unless `--yes` is passed.

- **Never pass `-y` / `--yes` to get past an approval prompt.** That turns a
  freshly cloned repo's hooks into silently-approved code execution. Surface the
  commands and let the user decide.
- `--no-hooks` exists on `switch` / `merge` / `remove` for read-only or
  non-interactive contexts, but skipping hooks changes what the worktree
  contains (no dependency install, no env file) — only when that's what you want.

## Rules of engagement

- **`wt merge` is the user's merge button, not cleanup.** It squashes, rebases,
  fast-forwards the target, then **deletes the worktree and branch** — locally, and
  it **never fetches**. Run it when asked to land/merge, not to tidy up. A rebase
  conflict is left in the worktree to resolve or abort; swept changes are backed up
  to `refs/wt-backup/<branch>`.
- **Don't reach for force flags.** `--force` (`-f`) discards uncommitted changes,
  `--force-delete` (`-D`) deletes unmerged commits. Report the refusal instead.
- **`wt remove` deletes the branch when it's integrated** (`_`/`⊂`) — that's the
  default, not an extra. Removal runs in the background unless you pass
  `--foreground`, so the directory can outlive the command.
- **Locked worktrees are off-limits.** `git worktree lock` (`⊞`) protects a
  worktree from every removal path, `--force` included. Respect it.
- **Don't hardcode `main`.** `wt config state default-branch` prints the detected
  value (also `set` / `clear` for overrides); `{{ default_branch }}` is the same
  value in templates.
- **A branch per worktree.** To change which branch a worktree is on, `git switch`
  inside it — `wt switch` navigates between worktrees, it doesn't move branches.

## Parallel work

`-x` runs a program after switching, starting in the target worktree even with
`--no-cd`, and everything after `--` goes to that program:

```bash
wt switch --create fix-auth -x claude -- 'The session expires after 5 minutes; find the timeout config.'
```

Omit the branch and the interactive picker opens first, so from an agent pass a
branch and let the user pick if they care which worktree.

Use this when asked to hand work to a parallel/background agent; wrap it in
`tmux new-session -d` or `zellij run` if it must survive the session. `wt list`
shows 🤖 (working) / 💬 (waiting) markers for host CLIs that have worktrunk's
activity plugin (`wt config plugins <pi|claude|codex|opencode|omp> install`); for
anything else, `wt config state marker set "🤖"` / `marker clear` are the same
contract.

## Gotchas

- **Merge is never a fetch, and squash is the default.** Fetch first if landing on a
  stale `main` matters. `--no-squash` keeps individual commits, `--no-commit` skips
  commit+squash, `--no-ff` creates a merge commit, `--no-remove` keeps the worktree.
- **`wt step` for manual control.** `wt step diff` shows everything since
  branching, `wt step squash`/`rebase`/`push`/`commit` are the merge internals,
  `wt step prune` removes all merged worktrees and branches, `wt step for-each`
  runs a command in every worktree.
- **Diagnosing**: `wt config show` for config locations and shell-integration state;
  `-v` / `-vv` (`WORKTRUNK_VERBOSE=2`) for hook output, which background runs also
  leave in `.git/wt/logs/<branch>/` (`wt config state logs` lists it), with
  `trace.log` + `diagnostic.md` under `.git/wt/logs/`.
- **Worktrees share one `.git`**, so stash, refs, and remotes are shared, while
  the index, HEAD, and files are per-worktree. Ignored build output is *not*
  copied — `wt step copy-ignored` copies it, reflinking on APFS/btrfs/XFS.
- **Requires Git 2.43+.** On Windows hooks run through Git Bash even from
  PowerShell, so Git for Windows is mandatory.

<!--
Distilled from the official worktrunk docs (wt v0.80.0):
- https://worktrunk.dev/llms.txt
- https://worktrunk.dev/switch.md
- https://worktrunk.dev/list.md
- https://worktrunk.dev/merge.md
- https://worktrunk.dev/remove.md
- https://worktrunk.dev/shell-integration.md
- https://worktrunk.dev/claude-code.md
- https://worktrunk.dev/tips-patterns.md
- https://worktrunk.dev/faq.md
-->
