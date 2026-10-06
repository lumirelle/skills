---
name: justbump-managers
description: The language → manager detection matrix, per-manager bump commands, and the .justbump/managers.json schema.
---

# Managers

The detection matrix, the commands each manager runs, and the schema for
`.justbump/managers.json`.

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
| `mise.toml`, `mise.lock`, `.tool-versions` | toolchain | `mise` → `asdf` |
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

Rows marked *unverified* below are candidates read from documentation, not from the
installed tool. **Probe them with `<command> --help` before their first mutating
use.** If `--help` disagrees, believe `--help` and report the correction; if it
cannot answer, stop and ask.

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
| `npm` | `npx taze` | `npm update` — no wider lane |
| `yarn` | `yarn exec taze` | `yarn up` (berry) / `yarn upgrade` (classic) |
| `bun` | `bunx taze` | `bun update` / `bun update --latest` |

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

| Manager | `dedupe`? | `refresh` |
|---|---|---|
| `nub` | `nub dedupe` | `rm -rf node_modules && nub install && nub dedupe` |
| `pnpm` | `pnpm dedupe` | `rm -rf node_modules && pnpm install && pnpm dedupe` |
| `npm` | `npm dedupe` | `rm -rf node_modules && npm install && npm dedupe` |
| `bun` | `bun dedupe` | `rm -rf node_modules && bun install && bun dedupe` |
| `yarn` | berry yes, classic **no** *(unverified)* | drop the `&& yarn dedupe` when absent |

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
exits **0**. A non-zero `check` is not a step-3 failure to fix — parse the JSON, and
treat an empty result as nothing to bump.

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
line or in the enclosing URL/path (`hk@2.4.0`, `github.com/jdx/hk/releases/…`) **and**
the file is one the toolchain consumes — a `*.pkl` / `*.toml` / `*.yaml` / `*.json`
config, a CI workflow, a Dockerfile, a Makefile. Everything else is a candidate: report
it, never edit it.

Prose is a candidate **even when it names the tool**. Found by running this search in
the repo the skill was written in: it flagged the skill's own `SKILL.md` and this file,
where `hk@2.4.0` appears inside an illustrative `amends` URL. A Markdown hit is at
least as likely to be a historical record, a migration note, or an example as a live
pin. The cost of a missed reference is a stale pin someone finds later; the cost of a
wrong edit is a corrupted manifest — or a corrupted illustration.

## Verified managers

Commands below were checked against the installed tool's `--help`, at the versions
noted.

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

### nub — verified 0.9.6

`detect`: `nub.lock`, `packageManager=nub` in `package.json`

A Node package manager, so its `bump` map is the Node lane's four taze commands with
`<runner>` = `nub exec taze`. Check and refresh are nub's own:

| Job | Command |
|---|---|
| check | `nub outdated --json` |
| refresh | `rm -rf node_modules && nub install && nub dedupe` |

Native lane, when taze is not declared or its binary will not run:
`nub update` / `nub update --latest` — which settle the tree themselves, so that lane
needs no `refresh`.

### pnpm — verified 12.9.1

`detect`: `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `packageManager=pnpm`

A Node package manager, so its `bump` map is the Node lane's four taze commands with
`<runner>` = `pnpm exec taze`.

| Job | Command |
|---|---|
| check | `pnpm outdated` |
| refresh | `rm -rf node_modules && pnpm install && pnpm dedupe` |

Native lane, when taze is not declared or its binary will not run: `pnpm update` moves
to the newest version *within the declared range*, and `pnpm update --latest` ignores
the range and rewrites the manifest. `patch` and `minor` degrade.

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

## Unverified managers

Probe with `--help` before first mutating use.

| Manager | `detect` | check | bump `default` | wider bump | refresh |
|---|---|---|---|---|---|
| `npm` | `package-lock.json`, `packageManager=npm` | `npm outdated --json` | Node lane | Node lane | `npm install` |
| `yarn` | `yarn.lock` | `yarn outdated` | Node lane | Node lane | `yarn install` |
| `bun` | `bun.lock`, `bun.lockb`, `packageManager=bun` | `bun outdated` | Node lane | Node lane | Node lane |
| `cargo` | `Cargo.toml` | `cargo update --dry-run` | `cargo update` | `cargo upgrade --incompatible` (needs `cargo-edit`) | — |
| `poetry` | `poetry.lock`, `[tool.poetry]` | `poetry show --outdated` | `poetry update` | edit the constraint, then `poetry update` | — |
| `pip-tools` | `requirements.txt` + `requirements.in` | `pip-compile --dry-run --upgrade` | `pip-compile` | `pip-compile --upgrade` | `pip-sync` |
| `bundler` | `Gemfile.lock` | `bundle outdated` | `bundle update` | `bundle update --major` (`--minor`, `--patch` also exist) | — |
| `composer` | `composer.lock` | `composer outdated` | `composer update` | edit the constraint, then `composer update` | — |
| `deno` | `deno.json`, `deno.jsonc` | `deno outdated` | `deno outdated --update` | — | — |
| `mix` | `mix.exs` | `mix hex.outdated` | `mix deps.update --all` | edit the constraint in `mix.exs` | — |
| `dotnet` | `*.csproj`, `*.sln` | `dotnet list package --outdated` | `dotnet add package <id>` | — | — |
| `maven` | `pom.xml` | `mvn versions:display-dependency-updates` | `mvn versions:use-latest-releases` | — | — |
| `gradle` | `build.gradle*` | `./gradlew dependencyUpdates` (ben-manes plugin) | — | — | — |
| `asdf` | `.tool-versions` without `mise` | `asdf outdated` (needs the `asdf-outdated` plugin) | — | — | — |

The `refresh` column follows the same rule as the verified rows: include it only where
the bump writes the manifest or lockfile **without** installing. `pip-tools` is the one
unverified manager where that happens — `pip-compile` writes `requirements.txt` and
`pip-sync` installs it. Everything else settles in its `bump` command.

Where a row shows `—`, there is no single command for that job: stop and ask the
user rather than assembling one.

Rows marked `Node lane` get the four taze commands from
[The Node lane](#the-node-lane-taze); the native lane in that section's table is
their fallback.

`cargo update` respects the semver requirement already in `Cargo.toml`, so it has no
patch/minor distinction — for a `0.x` crate the requirement is the minor. `mix` and
`composer` dependencies are usually declared with a range, so their `default` lane
already covers minor releases.

## `.justbump/managers.json`

```jsonc
{
  "version": 2,
  // Shown to the user in step 5. Free text; the agent never runs it.
  "verify": "run `mise run check` and confirm the CLI still starts",
  "managers": [
    {
      "name": "mise",
      "kind": "toolchain",
      "detect": ["mise.toml", "mise.lock"],
      "note": "project-scoped: --local keeps this off the machine-global config",
      "commands": {
        "check": "mise outdated --local --json",
        "bump": {
          "default": "mise upgrade --local",
          "major": "mise upgrade --local --bump"
        }
      }
    },
    {
      "name": "nub",
      "kind": "package",
      "detect": ["nub.lock", "packageManager=nub"],
      "note": "taze declared in devDependencies, so the Node lane is available",
      "commands": {
        "check": "nub outdated --json",
        "bump": {
          "default": "nub exec taze -w --no-interactive --no-node-version --no-github-actions",
          "patch": "nub exec taze patch -w --no-interactive --no-node-version --no-github-actions",
          "minor": "nub exec taze minor -w --no-interactive --no-node-version --no-github-actions",
          "major": "nub exec taze major -w --no-interactive --no-node-version --no-github-actions"
        },
        "refresh": "rm -rf node_modules && nub install && nub dedupe"
      }
    }
  ]
}
```

The `mise` record has two keys and the `nub` record has four — that difference *is*
the degradation. Nothing else in the file encodes it.

| Field | Meaning |
|---|---|
| `version` | Schema version. Currently `2`. **A mismatch with what the skill expects means regenerate**, not migrate — the `bump` map's meaning changed at `1` → `2`, when it stopped being a fallback under a separate `engine` field and became the commands that actually run. |
| `verify` | Reminder text shown to the user after the run. **Never executed by the agent** — the user runs the main flow. |
| `managers` | Ordered array; a `name` appears at most once. Order is the order the report and the commits use. |
| `kind` | `toolchain` or `package`. |
| `detect` | Signals; **any** match means the manager is present. `key=value` matches a literal in the file named by the key (`packageManager=nub` reads `package.json`). |
| `commands` | **Omit entirely to mark a manager detected but not supported.** It shows as `skipped (out of support matrix)` and is never attempted. |
| `note` | Optional free text. Explains an unsupported record, a project-scoping flag that looks redundant but is not, or anything else the user should see in the plan. |
| `commands.check` | Read-only. Used to build the report and to detect an already-current tree. |
| `commands.bump` | **The commands that actually run.** Mode-keyed: `default` is required, and **a missing key is the degradation** — the manager has no such lane. There is no override field and nothing to expand at run time. |
| `commands.refresh` | **Include only when `bump` leaves the resolved state stale.** Makes the installed tree agree with the manifest, so that the user's verification exercises the bumped versions rather than the old ones. Omit it where `bump` already settles the tree. |

**Every command must be scoped to the project.** Where a tool defaults to
machine-wide behaviour, pass its scoping flag — `mise --local` is the example that
matters most in practice. A bump of this project must not reach outside it.

Owned paths are deliberately **not** in the file. They are derived at run time from
`git status --porcelain` before and after the run, which is what makes rollback
exact even when a command creates a lockfile that did not exist before.

<!---
Commands checked against the installed tool's `--help` on 2026-10-06:
- taze 21.3.0, mise 2026.10.0, nub 0.9.6, pnpm 12.9.1, go 1.27.1, uv 0.12.23

Three traps were found by running these tools against a clean tree in the repo this
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
