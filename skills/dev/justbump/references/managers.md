---
name: justbump-managers
description: The language → manager detection matrix, per-manager commands, the Node lane, and the stale reference sweep.
---

# Managers

The detection matrix, the commands each manager runs, and the sweep for versions
hard-coded outside the manager's own files. The config format itself is
[schema.md](schema.md).

## Detection

**Signals come from the repo, never from the machine.** A `pnpm` binary on `PATH` is
not evidence that this project uses pnpm — only `pnpm-lock.yaml` or a
`packageManager` field is. Never detect from `command -v`, from a version-manager
listing, or from what happens to be installed. `mise ls` and even
`mise ls --current` mix the project's tools with the user's global
`~/.config/mise/config.toml`, so they are not project signals either.

**Lockfiles and `packageManager` decide. Priority order only breaks ties.** A repo
with both `pnpm-lock.yaml` and `nub.lock` is a repo someone is mid-migration into —
prefer the `packageManager` field, and if that is absent too, prefer the one whose
lockfile git is tracking.

| Signal in the repo | Kind | Managers, in priority order |
|---|---|---|
| `mise.toml`, `mise.lock`, `.tool-versions` | toolchain | `mise` |
| `package.json` | package | `nub` → `pnpm` → `npm` → `yarn` → `bun` |
| `go.mod` | package | `go` |
| `Cargo.toml` | package | `cargo` |
| `pyproject.toml`, `uv.lock` | package | `uv` → `poetry` → `pip-tools` |
| `Gemfile` | package | `bundler` |
| `composer.json` | package | `composer` |
| `deno.json`, `deno.jsonc` | package | `deno` |
| `mix.exs` | package | `mix` |
| `*.csproj`, `*.sln` | package | `dotnet` |
| `pom.xml`, `build.gradle*` | package | `maven` / `gradle` |

A toolchain manager and a package manager coexist and both run — `mise` owns `node`
the runtime, `nub` owns the packages `node` executes.

### Managers the matrix does not cover

A detected signal with no row above is **recorded as unsupported — not improvised,
not dropped**. Write a normal record carrying `detect` and no `commands`: it appears
in the plan and the report as `skipped (out of support matrix)` while every other
manager still runs. **One unsupported manager never blocks the pass** — a `Brewfile`
should not veto `nub`.

Do **not** improvise a command for it. At the generation gate, offer the user the
chance to supply the commands; if they do, the record becomes a normal (unverified)
entry. That is the intended way coverage grows per project, without editing this
file.

The same applies to a tool pin with no manager for it: `.nvmrc`, `.python-version`,
`rust-toolchain.toml`, `.ruby-version` are detection hints only. If one is present and
no toolchain manager is configured, record it as unsupported rather than reaching for
`nvm` / `pyenv` / `rbenv` — those are shell functions, and they do not run reliably
from a non-interactive agent shell.

### A detected manager whose binary is missing

Detection is file-based, so a fresh clone can carry a signal — `Cargo.toml`, a
`uv.lock` — whose tool is not installed locally. That is not a detection error and not
a reason to skip it: run it through the detected toolchain manager first
(`mise x cargo -- …`, `mise x uv -- …`). If the toolchain manager cannot supply it
either, it is an ordinary step-3 failure to fix and report.

Note that a tool being *installed* is never the reverse signal. `uv` and `pnpm` may
both be installed and neither may be a manager of this project.

### Unverified commands

Only two rows still carry an unverified claim: `composer` and `mix`, because `php` and
`elixir` cannot be installed in the authoring environment.

**Probe an unverified command with `<command> --help` before its first mutating use.**
If `--help` disagrees, believe `--help` and report the correction; if it cannot answer,
stop and ask.

## The Node lane: taze

Only `taze` expresses all four modes, so **every Node package manager's recorded
`bump` map is built from taze**, with that manager's own runner substituted:

| Mode | Command |
|---|---|
| `default` | `<runner> -w --no-interactive --no-node-version --no-github-actions` |
| `patch` | `<runner> patch -w --no-interactive --no-node-version --no-github-actions` |
| `minor` | `<runner> minor -w --no-interactive --no-node-version --no-github-actions` |
| `major` | `<runner> major -w --no-interactive --no-node-version --no-github-actions` |

| Manager | `<runner>` — the declared binary | native lane |
|---|---|---|
| `nub` | `nub exec taze` | `nub update` / `nub update --latest` — `patch` and `minor` degrade |
| `pnpm` | `pnpm exec taze` | `pnpm update` / `pnpm update --latest` — `patch` and `minor` degrade |
| `npm` | `npx taze` | `npm update` — **no wider lane**, verified: `npm update` has no `--latest` |
| `yarn` | `yarn exec taze` | classic is **four-mode** (verified): `yarn upgrade` / `--latest --tilde` / `--latest --caret` / `--latest`; berry has only `yarn up` (default) |
| `bun` | `bunx taze` | `bun update` / `bun update --latest` (both verified, 1.4.2) |

**taze is the engine only when the project already declares it** — in `dependencies`
or `devDependencies` of `package.json`. That is the precondition for the Node lane,
checked at generation time. A project that does not declare taze gets the native lane,
and with it the mode degradation that has nothing to do with taze being broken.

**Never fetch taze.** The runners above all resolve `node_modules/.bin`; the fetching
forms (`dlx`, `x`, `npx --yes` against a missing local binary) ignore the project's
pin, so a run would execute a different taze version than the one the project chose,
and it would need the network to do it. A missing binary means `node_modules` is not
installed — run `refresh` first, and fall back to the native lane if that does not
fix it.

**Write the commands out in full in `managers.json`** — one line per mode, no
placeholder, no `engine` field for the agent to expand at run time. The file exists so
that what will run is readable and reviewable, and an indirection defeats that. `-w`
writes `package.json` **and nothing else** — taze is not a package manager, and ships
`--install` / `--update` as separate flags precisely because `-w` does not install.

### The Node lane always needs `refresh`

Because taze stops at the manifest, the lockfile and `node_modules` are left on the
old versions. Upgrade against an empty tree rather than whatever the last install
hoisted:

```
rm -rf node_modules && <pm> install && <pm> dedupe
```

| Manager | `detect` | check | `refresh` |
|---|---|---|---|
| `nub` | `nub.lock`, `packageManager=nub` | `nub outdated --json` | `rm -rf node_modules && nub install && nub dedupe` |
| `pnpm` | `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `packageManager=pnpm` | `pnpm outdated` | `rm -rf node_modules && pnpm install && pnpm dedupe` |
| `npm` | `package-lock.json`, `packageManager=npm` | `npm outdated --json` | `rm -rf node_modules && npm install && npm dedupe` |
| `bun` | `bun.lock`, `bun.lockb`, `packageManager=bun` | `bun outdated` | `rm -rf node_modules && bun install && bun dedupe` |
| `yarn` | `yarn.lock` | **berry has none** — verified: `yarn outdated` → *Couldn't find a script named 'outdated'*, and the only upgrade commands are `yarn up` and the interactive `yarn upgrade-interactive`. Classic: `yarn outdated --json` (verified) | berry: `rm -rf node_modules && yarn install && yarn dedupe`; classic: `rm -rf node_modules && yarn install` (classic has no `dedupe`) |

`dedupe` availability is decided at generation time — probe it rather than assuming,
and record the fallback as a bare `<pm> install` when the manager has no `dedupe`.

**`rm -rf node_modules` is POSIX.** On Windows the equivalent is
`Remove-Item -Recurse -Force node_modules`. The config is committed and shared, so a
mixed-OS team must edit their copy — the recorded command is the one that runs.

### Managers that do not need `refresh`

Omit `refresh` where `bump` already settles the tree, since a second command for the
same result is just time:

- **`mise`** — `mise upgrade` installs the new tools and updates `mise.lock`.
- **`cargo`** — `cargo update` writes `Cargo.lock`.
- **native Node lanes** (`nub update`, `pnpm update`, `npm update`) — they resolve and
  install in one shot.
- **`go`** — `go get -u` writes `go.mod` and `go.sum` and downloads. `go mod tidy` is
  hygiene (pruning unused modules), not consistency, so it is not a `refresh`.

The exception worth keeping a `refresh` for: **`uv`**, where `uv lock` writes the
lockfile but not the venv, and both `uv tree --outdated` and any user verification read
the venv.

Non-Node managers never use taze. A manager whose `bump` map has fewer keys simply
has fewer modes — the missing key *is* the degradation, so it is data rather than a
run-time judgment call.

### taze's traps

- **Never use taze as a check or a preview.** taze reads a project config
  (`.tazerc.json`, or a `taze` key in `package.json`), and `"write": true` there
  makes *every* invocation mutating — including `--json`, which reads like a
  preview. Verified: the repo this skill was written in has `"write": true` in
  `.tazerc.json`, and `taze --json` without `-w` rewrote `package.json`. Inspect with
  the manager's own `check` command instead (those are verified read-only), and call
  taze only at the point in step 3 where a write is intended. `--no-write` does
  override the config if you ever genuinely need a read-only taze run.
- Pass `--no-interactive`. A project config may set `"interactive": true`, which
  would otherwise hang an agent shell waiting for input. The plan was confirmed in
  step 2, so nothing here should prompt.
- **Never fetch taze, and never add it to `package.json`.** Use the project's declared
  binary; a bump run must not install tooling — not ephemerally, and not by editing
  the manifest.
- Always pass `--no-node-version --no-github-actions`. Both are already the default,
  but pass them explicitly so taze stays inside `package.json` and never fights
  `mise` over the `node` pin.
- If taze is not declared, or the declared binary will not run, use the native lane
  from the table above and report both the fallback and the mode degradation it
  causes.

### `check` commands are read-only

Every `commands.check` is inspection only and must never mutate. Verified by
running them against a clean tree: `mise outdated --json` and `nub outdated --json`
both exit without touching a tracked file. Do not substitute taze for a `check`
command — see the taze traps above.

**Read the output, not the exit code.** Check commands disagree about what "outdated
found" means to a shell: verified in the repo this skill was written in,
`nub outdated --json` exits **1** when updates exist while `mise outdated --json`
exits **0**. Classic `yarn outdated` also exits **1** with updates pending. A non-zero
`check` is not a step-3 failure to fix — parse the output, and treat an empty result as
nothing to bump.

**One exception to "always use the manager's own check".** Where a Node manager has no
native check — yarn berry, verified above — the check is
`<runner> taze --json --no-write`, a read-only taze run. `--no-write` overrides a
project's `"write": true`, which is the only reason taze can be trusted here at all;
never drop the flag. If taze is not declared either, there is no check: record it,
report it, and stop rather than guessing.

## Stale references

A manager owns its own files; it does not own every copy of a version. `hk` is pinned
in `mise.toml` / `mise.lock` **and** as a schema URL in `hk.pkl`:

```
amends "package://github.com/jdx/hk/releases/download/v2.4.0/hk@2.4.0#/Config.pkl"
```

Bump `hk` and the first copy moves while the second keeps validating against 2.4.0 —
and `hk validate` still passes, because the old release is still downloadable. The
main flow cannot see this drift, so the sweep in step 3 has to.

### Where hard-coded versions live

| Place | Example |
|---|---|
| A tool's own schema or import URL | `package://…/v2.4.0/hk@2.4.0#/Config.pkl` in `hk.pkl` |
| CI tool setup | `node-version: 20` in a workflow, `uses: jdx/mise-action@…` |
| Container images | `FROM node:20.11.0` in a Dockerfile |
| Pre-commit hooks | `rev: v1.2.3` in `.pre-commit-config.yaml` |
| Docs, comments, READMEs | "requires Go 1.21 or newer" |
| Task runners and Makefiles | a pinned `TOOL_VERSION :=` variable |

This is most common for `kind: toolchain` tools, whose configs point at versioned
releases, but the sweep is driven by whatever `check` said changed — a `package.json`
dependency can be hard-coded in a doc too.

### The search

For each changed item, search its old version, decorated:

```bash
grep -rn -e '2\.4\.0' -e 'v2\.4\.0' -e 'hk@2\.4\.0' \
  --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=vendor \
  --exclude-dir=sources --exclude-dir=dist --exclude-dir=coverage .
```

**The exclusions are load-bearing.** `nub.lock` legitimately contains
`eslint-config-flat-gitignore@2.4.0` and `jsonc-eslint-parser: ^2.4.0` — unrelated
packages that share a version string with an `hk` release. Every lockfile is excluded
for that reason, and the manager has already rewritten its own.

**Confirmed vs candidate.** A hit is confirmed when the tool's name appears on the same
line or in the enclosing URL/path (`hk@2.4.0`, `github.com/jdx/hk/releases/…`), **as a
whole token**, **and** the file is one the toolchain consumes — a `*.pkl` / `*.toml` /
`*.yaml` / `*.json` config, a CI workflow, a Dockerfile, a Makefile. Everything else is
a candidate: report it, never edit it.

**A substring is not a match.** Require a delimiter that is not `[A-Za-z0-9_-]` — `@`,
`/`, `.`, space, quote, or end of line — on both sides. Otherwise a tool whose name is a
prefix of another's gets confirmed on the other's line: `go` matches `golangci-lint`,
`hk` matches `hkx`, `uv` matches `uvicorn`, `nub` matches `nubx`. That last one is not
hypothetical — `nubx` is nub's own alias. Found by running the rule against a fixture
holding `toolab = "1.0.0"` alongside `toola = "1.0.0"`, where the substring test
confirmed both lines and would have rewritten a different tool's pin.

Prose is a candidate **even when it names the tool**. Found by running this search in
the repo the skill was written in: it flagged the skill's own `SKILL.md` and this file,
where `hk@2.4.0` appears inside an illustrative `amends` URL. A Markdown hit is at
least as likely to be a historical record, a migration note, or an example as a live
pin. The cost of a missed reference is a stale pin someone finds later; the cost of a
wrong edit is a corrupted manifest — or a corrupted illustration.

## Manager command sets

Every manager below was verified by running the tool. The Node family's commands live
in [The Node lane](#the-node-lane-taze); everything else is here.

### mise — verified 2026.10.0

`detect`: `mise.toml`, `.mise.toml`, `mise.local.toml`, `.config/mise.toml`, `.tool-versions`, `mise.lock`

`note`: `project-scoped: --local keeps this off the machine-global config`

| Job | Command |
|---|---|
| check | `mise outdated --local --json` |
| bump `default` | `mise upgrade --local` |
| bump `major` | `mise upgrade --local --bump` |

**No `refresh`.** `mise upgrade` installs the upgraded tools and updates `mise.lock`,
so a following `mise install` would be a second command for the same result.

**`--local` is not optional.** Without it, `mise outdated` and `mise upgrade` span the
user's global config as well. Verified in the repo this skill was written in: bare
`mise outdated --json` reported four tools sourced from
`~/.config/mise/config.toml` (`python`, `fnox`, `gdu`, `agent-browser`) alongside the
one project tool, and `mise upgrade` would have upgraded all five. `--local` reduced
the report to the project tool alone. A project-scoped bump must never reach the
user's machine-wide tools.

`patch` and `minor` are **not expressible** — mise has no such lane, so they degrade
to `default`. `mise outdated` reports only versions matching the current config, so
`node = "20"` never reports `22`; `--bump` reports the newest overall. `mise upgrade`
keeps the config's range, `--bump` rewrites it.

### go — verified 1.27.1

`detect`: `go.mod`

| Job | Command |
|---|---|
| check | `go list -m -u all` |
| bump `patch` | `go get -u=patch ./...` |
| bump `default`, `minor` | `go get -u ./...` |

`-u` selects newer minor-or-patch releases; `-u=patch` changes the default to patch
releases. `go.mod` records minimum versions rather than ranges, so `default` and
`minor` are the same lane here. `go get` writes `go.mod` and `go.sum` and downloads,
so there is no `refresh` — `go mod tidy` prunes unused modules, which is hygiene
rather than consistency. **`major` is not expressible in place** — in Go a
major version is a new module path, so there is nothing to bump. Degrade to `go get
-u ./...` and report that a major is a migration, not a bump.

### uv — verified 0.12.23

`detect`: `uv.lock`, `pyproject.toml` with `[tool.uv]`

| Job | Command |
|---|---|
| check | `uv tree --outdated` |
| bump `default` | `uv lock` |
| bump `minor`, `major` | `uv lock --upgrade` |
| refresh | `uv sync` |

`--upgrade` ignores versions pinned in the existing lockfile while still honouring
the requirements in `pyproject.toml`, so it goes exactly as far as the manifest
allows. Widening past that means editing a requirement — that is a decision, not a
bump, so degrade and report.

### Non-Node managers

Probed against installed tools on 2026-10-06. Where a cell says **unverified**, that
specific claim could not be confirmed and must be probed with `--help` before its first
mutating use.

| Manager | `detect` | check | bump `default` | wider bump | refresh |
|---|---|---|---|---|---|
| `cargo` | `Cargo.toml` | `cargo update --dry-run` | `cargo update` | `cargo update --breaking` (unstable flag) or `cargo upgrade --incompatible` (needs `cargo-edit`) | — |
| `poetry` | `poetry.lock`, `[tool.poetry]` | `poetry show --outdated` | `poetry update` | edit the constraint, then `poetry update` | — |
| `pip-tools` | `requirements.txt` + `requirements.in` | `pip-compile --dry-run --upgrade` | `pip-compile` | `pip-compile --upgrade` | `pip-sync` |
| `bundler` | `Gemfile.lock` | `bundle outdated` | `bundle update --all` | `bundle update --all --patch` / `--minor` / `--major` | — |
| `deno` | `deno.json`, `deno.jsonc` | `deno outdated` | `deno outdated --update` | `deno outdated --update --latest` | — |
| `dotnet` | `*.csproj`, `*.sln` | `dotnet list package --outdated` | `dotnet add package <id>` — **per package only**, there is no bulk bump | — | — |
| `maven` | `pom.xml` | `mvn versions:display-dependency-updates` | `mvn versions:use-latest-releases` | — | — |
| `gradle` | `build.gradle*` | `dependencyUpdates` is **not a built-in task** (verified: `gradle help --task dependencyUpdates` → not found); it needs the ben-manes plugin | — | — | — |
| `composer` | `composer.lock` | `composer outdated` *(unverified)* | `composer update` *(unverified)* | edit the constraint *(unverified)* | — |
| `mix` | `mix.exs` | `mix hex.outdated` *(unverified)* | `mix deps.update --all` *(unverified)* | edit the constraint in `mix.exs` *(unverified)* | — |

Verified by running: cargo 1.98.0, poetry 2.5.1, pip-tools 7.6.1, bundler (with
ruby), deno, dotnet 10.0.401, maven 3.10.0, gradle 9.8.0. Maven was checked against a
throwaway `pom.xml` and reported `com.google.guava:guava 31.0-jre -> 33.7.2-jre`, so
both the goal and its output are real.

**Bundler is a four-mode manager** — `--patch`, `--minor` and `--major` are real
`bundle update` flags, which makes Ruby one of the few ecosystems where the fine modes
work without taze.

**Not verifiable in the authoring environment.** `php` and `elixir` cannot be
installed by mise, so `composer` and `mix` remain documentation-derived and carry
*(unverified)*. `dotnet`'s check and `maven`'s goals need a project fixture; the ones
shown were confirmed against a real one.

`cargo update` respects the semver requirement already in `Cargo.toml`, so it has no
patch/minor distinction — for a `0.x` crate the requirement is the minor.

The `refresh` column follows the same rule as the verified rows: include it only where
the bump writes the manifest or lockfile **without** installing. `pip-tools` is the
only manager here where that happens — `pip-compile` writes `requirements.txt` and
`pip-sync` installs it. Everything else settles in its `bump` command.

Where a row shows `—`, there is no single command for that job: stop and ask the user
rather than assembling one.

<!---
Commands checked against the installed tool's `--help` on 2026-10-06:
- taze 21.3.0, mise 2026.10.0, nub 0.9.6, pnpm 12.9.1, go 1.27.1, uv 0.12.23
- npm (node 26.10.0), yarn 4.18.1, yarn 1.22.22, bun 1.4.2, cargo 1.98.0, poetry 2.5.1,
  pip-tools 7.6.1, bundler (ruby), deno, dotnet 10.0.401, maven 3.10.0, gradle 9.8.0

Yarn was checked in both directions against throwaway fixtures, because the two lines
share a command name and only one of them has it:

- berry 4.18.1: `yarn outdated` → *Couldn't find a script named 'outdated'*. No
  non-interactive outdated listing exists; `yarn upgrade-interactive` is interactive.
- classic 1.22.22: `yarn outdated --json` works, exits 1 with updates pending, and
  `yarn upgrade` carries `-L/--latest`, `-T/--tilde`, `-C/--caret`, `--non-interactive`
  — so classic alone is four-mode.

Could not be probed: `php` and `elixir` are not installable by mise, so `composer`
and `mix` stay documentation-derived; `asdf` is not installable either, and its
`outdated` is the `asdf-outdated` plugin rather than a built-in, so an asdf-only
project takes the unsupported-manager path instead of carrying a row.

Four traps were found by running these tools against a clean tree in the repo this
skill was written in, not by reading their docs:
1. taze's project config can set `"write": true`, making even `taze --json` rewrite
   the manifest. The docs still imply `-w` is required to write.
2. `mise outdated` / `mise upgrade` default to global + local config. The docs'
   example shows `mise outdated --local`, but nothing warns that the bare form
   reaches the user's machine-wide tools.
3. `nub outdated` exits 1 when updates exist while `mise outdated` exits 0, so a
   check command's exit code cannot be used to mean "failure".
4. `dlx`/`x` fetch a package's binary while `exec` resolves `node_modules/.bin`.
   They sit adjacent in `--help` output, and the fetching form silently ignores the
   project's pin.

Source references:
- https://github.com/antfu/taze
- https://mise.jdx.dev/cli/upgrade.html
- https://mise.jdx.dev/cli/outdated.html
- https://go.dev/doc/modules/managing-dependencies
- https://doc.rust-lang.org/cargo/commands/cargo-update.html
- https://docs.astral.sh/uv/reference/cli/
-->
