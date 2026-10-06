---
name: justbump
description: >-
  Bump every version this project pins — toolchain tools and package
  dependencies — in one mechanical pass, then report by manager and hand back
  for confirmation. Use when the user says "justbump", "bump the deps",
  "update/upgrade the dependencies", "get everything to latest", or names a
  mode ("bump minor", "patch bump"). Modes: default, patch, minor, major.
  Not for installing dependencies for the first time or setting up a project —
  that's the `mise` skill.
---

# justbump

One pass over every version this repo pins: bump, refresh lockfiles, report what
changed, hand back to the user for verification.

**The diff is the record.** justbump writes no run artifacts and keeps no
history — the git diff and the per-manager commits are the durable record.
`.justbump/managers.json` is the only file it creates, and it is committed.

## Vocabulary

| Term | Meaning |
|---|---|
| **manager** | Something that owns pinned versions in this project. `kind: toolchain` (mise: `node`, `hk`, `pkl`) or `kind: package` (nub, pnpm, go, cargo: manifest dependencies). |
| **mode** | The *ceiling* on the version change allowed, not a target to reach. `default` ⊂ `patch` ⊂ `minor` ⊂ `major`. |
| **degrade** | The manager cannot express the requested mode, so it runs its nearest coarser lane and the report says so. Never silently skip a manager. |
| **stale reference** | A hard-coded copy of an item's version living outside the manager's own files — a schema URL in another tool's config, a CI pin, a doc. The manager cannot see it, so the bump has to sweep for it. |

## Modes

| Mode | Ceiling |
|---|---|
| `default` | Stay inside the range already declared in the manifest — what `npm install` / `pnpm update` / `mise upgrade` do. |
| `patch` | Latest patch within the same minor. |
| `minor` | Latest minor within the same major. |
| `major` | Any newer stable. Breaking changes possible. |

Bare `justbump` means `default`. Only widen when asked.

Only some managers can express the fine modes. That is expected — it is what
`degrade` is for. [references/managers.md](references/managers.md) records, per
manager, exactly which modes its `bump` map covers.

## Step 1 — the config file

`.justbump/managers.json` records which managers this project uses and the exact
command for each job.

**Detection is file-based. Never infer a manager from what is installed on the
machine.** A `pnpm` binary on `PATH` is not evidence that this project uses pnpm;
`mise.lock` and the `packageManager` field are. The signals are in
[references/managers.md](references/managers.md).

If the file does not exist, generate it:

1. **Detect** from the matrix.
2. **Write the file.** A manager the matrix covers gets `commands`; one it does not
   gets a record with `detect` and **no `commands`**. A Node package manager gets the
   four-mode Node lane only if `package.json` already declares taze — otherwise it
   gets its native lane and two modes. Schema in [schema.md](references/schema.md).
3. **Show the user what you detected and wait.** List the supported and unsupported
   managers separately. This is the one gate where a wrong detection is cheap to fix
   and a wrong command is not.
4. **Offer to adopt the unsupported ones.** If the user supplies the commands for a
   manager, record them as a normal (unverified) entry — the config file is the
   per-project extension point, so nothing waits for the skill itself to grow a row.
   Skipped is acceptable; silently dropped never is.

If the file already exists, **rescan its `detect` signals before the plan gate**.
Signals are cheap to re-check. Tell the user when a recorded manager's signal has
gone, or when the repo carries a signal no record covers, and offer to regenerate —
that is what keeps path 2 from depending on the user happening to notice.

A `version` that is not the current schema version also means regenerate. The `bump`
map's meaning changed between versions, so an old file describes commands that are
not the ones this skill would run.

Never invent a command for a manager the matrix does not cover.

## Step 2 — precondition and plan

**Refuse to start with uncommitted changes to tracked files.** Git is the rollback
mechanism, and a modified tracked file makes "restore what the run touched"
indistinguishable from "keep what the user already had". **Untracked files are
fine** — `.justbump/managers.json` is itself untracked on first run, so a clean-tree
rule that counted untracked files would forbid justbump's own first run.

Untracked files are allowed. But you cannot know in advance which paths a bump will
write, so do not pretend to — **snapshot the untracked paths and a hash of each before
the run, and compare afterwards.** Any untracked file that existed before and changed
during the run is one rollback cannot restore; report it plainly instead of discovering
it mid-rollback.

If the user asks to proceed with tracked changes anyway, keep an exact record of the
paths the run touches and say plainly that rollback is limited to them.

Then show the plan and wait:

| Manager | Kind | Mode | Command |
|---|---|---|---|

Records with no `commands` appear in this table as `skipped (out of support matrix)`
— never omitted, never attempted.

Offer three outcomes: **proceed**, **narrow scope** (drop a manager, or lower the
mode for one of them), **cancel**. This table is where a `patch` request that will
degrade to `default` becomes visible *before* the run instead of in the report.

## Step 3 — bump

Run each manager's recorded `bump` command for the requested mode. **What runs is
what the file says** — there is no override layer and nothing to expand at run time.

**Skip a manager whose `check` reported nothing to change.** No bump to make means no
`refresh` either — and the Node lane's `refresh` is `rm -rf node_modules && …`, which
would churn the tree and possibly touch the lockfile for zero version movement. Report
that manager as `unchanged` and move on. A mode the manager cannot express is *not* a
reason to skip it; that is `degrade`, and it still runs.
Then run `refresh` where the record has one. Its job is that **the verification in
step 5 exercises the bumped versions**: a `bump` that only edits the manifest leaves
the lockfile and `node_modules` on the old versions, and a check run against those
proves nothing. Records omit `refresh` where `bump` already settles the tree.

### After each manager — sweep for stale references

Sweep per manager, right after its bump, so a found reference lands in that manager's
commit instead of floating loose.

A manager does not own every copy of a version. `hk` is pinned in `mise.toml` **and**
in `hk.pkl`, as a versioned schema URL that another tool reads:

```
amends "package://github.com/jdx/hk/releases/download/v2.4.0/hk@2.4.0#/Config.pkl"
```

The bump updates the first copy and never sees the second. So for every item `check`
reported as changing, search the repo for its **old** version:

- Exclude `.git`, `node_modules`, `vendor/`, `sources/`, and build output — and
  **every lockfile**. The manager already rewrote its own; a hit in one is a different
  package, or a `refresh` that did not happen.
- Search the decorated forms too: `2.4.0`, `v2.4.0`, `hk@2.4.0`.
- A hit is **confirmed** only when the tool's name appears on the same line or in the
  enclosing URL/path **as a whole token**, and the file is one the toolchain consumes —
  a config, CI, container, or build file. Everything else is a **candidate**: report
  it, never edit it. A substring is not a match: `go` must not confirm
  `golangci-lint`, `hk` must not confirm `hkx`, `uv` must not confirm `uvicorn`, `nub`
  must not confirm `nubx` (nub's own alias). Prose is a candidate even when it names the
  tool: a version in Markdown is as likely to be a historical record, or an
  illustration, as a live pin.

**The main flow will not catch this**, which is why it is a rule rather than something
the user will notice: a stale schema URL still resolves, so `hk validate` passes while
the config quietly validates against the previous release. See
[references/managers.md](references/managers.md#stale-references) for where
hard-coded versions typically live.

If a recorded command cannot run — most often a Node project whose `node_modules` is
not installed, so the declared taze binary is missing — run the manager's `refresh`
first (it installs `node_modules`), then retry the `bump`. If it still cannot run, use
that manager's native lane from [references/managers.md](references/managers.md), and
report both the fallback and the mode degradation it causes.

**If a `bump` or `refresh` command fails, fix it and carry on. Do not ask.** A non-zero
exit here
is a broken assumption — a bad flag, a missing tool, a stale lockfile — not a
decision for the user. Remember every fix so the report can disclose it.

**Only `bump` and `refresh` failures count here.** A `check` command exiting non-zero
is not a failure — some managers signal "updates available" that way. Read its output, not
its exit code.

**Three attempts per manager.** If you cannot land it in three, stop and offer the
user: roll back, exclude that manager, or describe the situation.

Before running any command the reference marks *unverified*, probe it with `--help`
first. `--help` is version-exact and offline; a web search can return a different
release.

## Step 4 — report

Group by manager: one heading per manager, one table under each. Summary first:

| Manager | Kind | Mode | Result |
|---|---|---|---|

`Result` is one of `bumped`, `degraded` (say what it actually ran), `fixed` (say
what you had to fix), `failed`, `unchanged`, or `skipped` (say why).

Then, per manager, one row per changed item:

| Item | From | To |
|---|---|---|

Cap a table at roughly 30 rows. For anything larger, summarise per manifest file
and state how many rows were omitted — the full detail is in the diff.

If step 3 needed a fix, say so here — and list every stale reference you updated, or
deliberately left alone. Never let a fix, or an untouched stale pin, hide in the diff.

## Step 5 — hand back

Tell the user how to check the result, using the config's `verify` text, then wait.
**You do not run the main flow; the user does.** Take their answer:

1. **All correct** → step 7.
2. **A manager is missing** → re-generate `.justbump/managers.json`, confirm it with
   the user, and re-run for the missing manager.
3. **The main flow is broken** → step 6.
4. **Anything else** → ask the user to describe it.

## Step 6 — the main flow is broken

Read the release notes of the suspect dependency **first**. A breaking change is the
most likely cause, and the notes name it directly.

Reproduce it — build, test, the project's check task. The user reported a break you
failed to prevent, so reproducing it is diagnosis, not verification. Confirm the fix
with the user before writing it.

Same three-attempt budget. On exceeding it, offer: roll back, exclude that
dependency, or let the user describe what they see. Then return to step 5 and ask
the user to verify again.

## Step 7 — commits

Print the exact commands. **Ask before running them.**

One commit per manager, matching the report's grouping, plus one exclusive commit
per fix:

```
chore(deps): bump mise tools
chore(deps): bump node deps
fix(deps): drop the stale --frozen-lockfile from the nub refresh
```

Per-manager commits make `git revert <sha>` a precise undo when one manager's bump
turns out to be what broke the flow. Fix commits follow the repo's own commit
convention.

## Rollback

Restore the manager-owned paths the run touched and delete the files it created — the
clean-tracked-tree precondition in step 2 is what makes this exact. Ask before doing it.

**Leave `.justbump/managers.json` alone.** A command correction found during the run is
a fix to keep, not state to undo — reverting it only reproduces the same failure next
run. Its diff stays visible, and it belongs in the fix commit from step 7.

Any pre-existing untracked file the run changed cannot be restored; say so explicitly
rather than presenting the rollback as complete.

## Hard rules

- **Never touch machine-global state.** Every command is scoped to the project.
  Where a tool defaults to machine-wide behaviour, pass its scoping flag
  (`mise --local`). "Bump this project" must never upgrade the user's globally
  installed tools.
- **Never detect a manager from the machine.** Only from a signal in the repo.
- **Never use taze to look before you leap.** Its project config can turn every
  invocation into a write, so inspect with the manager's native `check` and call
  taze only where a write is intended. See
  [references/managers.md](references/managers.md).
- **Never install justbump's own tooling into the project.** A Node package manager
  uses taze only when `package.json` already declares it, and runs the **declared**
  binary (`nub exec taze`) rather than fetching one — the fetching forms ignore the
  project's pin and need the network. Either way taze is never added to
  `package.json`; that is visible in the config the user reviews, and a bump run that
  edits the manifest to add its own tool would contaminate the diff and the report.
- **Never silently skip a manager.** Degrade and report, or fail and report.
- **Never widen scope.** The mode is a ceiling the user asked for.
- **One manager owns each version.** The recorded taze commands keep `node`-version
  and GitHub Actions handling off, so taze stays inside `package.json` and never
  fights `mise` for `node`.
- **Do not commit without being asked.** Print the commands first.
