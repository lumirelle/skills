# justbump

Bump every version a project pins — toolchain tools *and* package dependencies — in one
pass across all its managers, then report per manager and hand back for you to verify.

You run `justbump`. It asks one tool per ecosystem what's outdated, bumps everything it
agrees needs bumping, makes the lockfiles and installed tree agree with the results,
reports what changed grouped by manager, and then gets out of the way while you check.

## Why it exists

Keeping a project's pins fresh is mechanical work: the same commands, in the same order,
against however many managers the repo happens to use. Doing it by hand is slow and easy
to do half-way, so it gets postponed — which is the job an agent should simply take over.
justbump hands the agent the per-manager commands and the order to run them, so the
whole pass costs one invocation instead of an afternoon of typing.

The other obvious answer is Renovate or Dependabot, and that trade is deliberate: they
run on *their* schedule. The bot decides when to open PRs, and you get a standing queue of
dependency updates you didn't ask for — every one of them needing review before it can be
merged or dismissed. justbump inverts that. Nothing runs until you say so, and one run
bumps everything at once instead of dripping PRs at you.

**You decide when. The agent does the work.**

## Install

```bash
pnpx skills add lumirelle/skills --skill=justbump
```

## Concepts

| Term | Meaning |
|---|---|
| **manager** | Something that owns pinned versions in your project. A *toolchain* manager pins tools (`mise` → `node`, `hk`, `pkl`); a *package* manager pins dependencies (`nub`, `go`, `cargo`). A project usually has both. |
| **mode** | The **ceiling** on how far a version may move — `default` ⊂ `patch` ⊂ `minor` ⊂ `major`. A ceiling, not a target: justbump never bumps further than you asked. |
| **degrade** | The manager can't express the mode you asked for, so it runs its nearest coarser lane and the report says so. |
| **stale reference** | A hard-coded copy of a version outside the manager's own files. The manager can't see it, so justbump sweeps for it. |

## Modes

| Mode | Ceiling |
|---|---|
| `default` | Stay inside the range already declared in the manifest — what `npm install` / `pnpm update` / `mise upgrade` do. |
| `patch` | Latest patch within the same minor. |
| `minor` | Latest minor within the same major. |
| `major` | Any newer stable. Breaking changes possible. |

Bare `justbump` means `default`. Only some managers can express the fine modes, and
`degrade` is what happens when you ask for one they can't — you get the coarse lane, and
the report tells you.

## Supported managers

Detection is by file, never by what's installed on your machine:

| Ecosystem | Managers | Modes it can express |
|---|---|---|
| Toolchain | `mise` | `default`, `major` |
| Node | `nub`, `pnpm`, `npm`, `yarn`, `bun` | All four, **if your project already declares `taze`**. Otherwise its own lane — typically two modes, but one for `npm` (no wider lane exists) and all four for classic Yarn |
| Go | `go` | `patch`, `default`/`minor` — a Go major is a new module path, so there is nothing to bump in place |
| Rust | `cargo` | `default`, and `major` where `cargo-edit` is installed |
| Python | `uv`, `poetry`, `pip-tools` | `default` plus one wider lane |
| Ruby | `bundler` | All four — `--patch` / `--minor` / `--major` are real flags |
| Deno | `deno` | `default`, `major` |
| .NET | `dotnet` | Per package only — there is no bulk bump |
| JVM | `maven` | `default` plus one wider lane |
| JVM | `gradle` | None. `dependencyUpdates` is *not* built in — it needs the ben-manes plugin |
| PHP | `composer` | Unverified — see below |
| Elixir | `mix` | Unverified — see below |

Signals it looks for include `mise.toml` / `mise.lock` / `.tool-versions`, `package.json`
with a `packageManager` field and its lockfile, `go.mod`, `Cargo.toml`, `uv.lock` /
`pyproject.toml`, `requirements*.txt`, `Gemfile`, `deno.json`, `mix.exs`, `*.csproj`, `pom.xml`,
`build.gradle*`, `composer.json`.

## How a run goes

1. **Config.** If `.justbump/managers.json` doesn't exist, justbump detects your managers,
   writes it, and shows you what it found before doing anything.
2. **Plan.** It checks each manager and shows a table of what it will run. You can
   proceed, narrow the scope, or cancel.
3. **Bump.** Each manager's own update command runs, then its refresh. Failures are fixed
   inline and disclosed in the report — you aren't asked about a missing flag.
4. **Report.** One table per manager, `From` → `To`, plus anything it had to fix and every
   stale reference it updated or deliberately left alone.
5. **Verify.** It tells you how to check the result and waits. **Running your main flow
   is your job, not the agent's.**
6. **Commits.** It prints the commands and asks first. One commit per manager, and any
   fix gets its own commit — so `git revert` on one manager's bump undoes exactly that.

If your verification fails, justbump reads the release notes of the suspect dependency
first, then fixes it — in its own commit, bounded to three attempts, after which it asks
whether to roll back, exclude that dependency, or take your description of the problem.

## The config file

`.justbump/managers.json` records your managers and the exact commands each job runs. It
is generated once, confirmed by you, and **committed** — it's project configuration, not
machine state. Every command in it is what will actually run; there is nothing the agent
expands at runtime.

If you install a new ecosystem later, justbump notices on the next run and offers to
regenerate.

## What it will never do

- **Never touch machine-global state.** Commands are scoped to the project (`mise --local`),
  so a project bump never upgrades your globally installed tools.
- **Never fetch its own tooling.** It runs `taze` only if your project already declares it,
  and it never adds it to `package.json` — a bump that edits your manifest to install its
  own tool would contaminate the diff.
- **Never silently skip a manager.** It degrades and reports, or fails and reports.
- **Never widen past the mode you asked for.**
- **Never run your main flow.** That verification is yours; the agent only *reproduces* a
  failure you report.
- **Never commit without asking.**
- **Never assume a shell.** Every recorded command is one step that runs unchanged in
  bash, `cmd` and PowerShell — no `rm -rf`, no `&&`, no per-OS variant for a mixed-OS
  team to hand-edit.

## Known limitations

- **PHP and Elixir are unverified.** `composer` and `mix` come from documentation rather
  than a tool run, because PHP and Elixir couldn't be installed in the environment where
  the skill was written. Their commands are probed with `--help` before first use.
- **Gradle and .NET** can't do a full bump — Gradle needs a third-party plugin, and
  `dotnet add package` works one package at a time.
- **Yarn berry has no non-interactive outdated listing**, so Yarn projects need `taze`
  declared for justbump to check anything.

## Adding a manager it doesn't know

When justbump detects something outside its matrix, it records it, reports it as
`skipped (out of support matrix)`, and offers to adopt it: give it the check, bump and
refresh commands, and it becomes a normal entry in your config. Everything else still
runs — an unrecognised manager never blocks the pass.

The detection matrix and the config schema live in
[`references/managers.md`](references/managers.md) and
[`references/schema.md`](references/schema.md).
