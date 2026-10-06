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

## The engine: taze

Only `taze` expresses all four modes, and only Node package managers can use it.
When a Node manager's record declares `"engine": "taze"`, the engine replaces the
native `bump` map and all four modes become available.

Invoke it through the project's own runner:

| Manager | Engine invocation |
|---|---|
| `nub` | `nub dlx taze` |
| `pnpm` | `pnpm dlx taze` |
| `npm` | `npx --yes taze` |
| `yarn` | `yarn dlx taze` |
| `bun` | `bunx taze` |

Argv is `<runner> taze [mode] -w --no-interactive --no-node-version
--no-github-actions`. A bare mode means `default`, otherwise `patch`, `minor`, or
`major`. `-w` writes `package.json`; the lockfile is then refreshed by the
manager's `refresh` command.

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
- Prefer a taze already in `devDependencies` — the runners above resolve a local
  binary before fetching. Fall back to the ephemeral form otherwise.
- **Never add taze to `package.json`.** A bump run must not mutate the manifest to
  install its own tooling.
- Always pass `--no-node-version --no-github-actions`. Both are already the default,
  but pass them explicitly so taze stays inside `package.json` and never fights
  `mise` over the `node` pin.
- If taze cannot run at all, fall back to the manager's native `bump` map and report
  the resulting degradation. Non-Node managers never use taze.

### `check` commands are read-only

Every `commands.check` is inspection only and must never mutate. Verified by
running them against a clean tree: `mise outdated --json` and `nub outdated --json`
both exit without touching a tracked file. Do not substitute the engine for a
`check` command — see the taze rule above.

## Verified managers

Commands below were checked against the installed tool's `--help`, at the versions
noted.

### mise — verified 2026.10.0

`detect`: `mise.toml`, `.mise.toml`, `mise.local.toml`, `.config/mise.toml`, `.tool-versions`, `mise.lock`

| Job | Command |
|---|---|
| check | `mise outdated --local --json` |
| bump `default` | `mise upgrade --local` |
| bump `major` | `mise upgrade --local --bump` |
| refresh | `mise install` |

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

| Job | Command |
|---|---|
| check | `nub outdated --json` |
| bump `default` | `nub update` |
| bump `major` | `nub update --latest` |
| refresh | `nub install` |

### pnpm — verified 12.9.1

`detect`: `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `packageManager=pnpm`

| Job | Command |
|---|---|
| check | `pnpm outdated` |
| bump `default` | `pnpm update` |
| bump `major` | `pnpm update --latest` |
| refresh | `pnpm install` |

`pnpm update` moves to the newest version *within the declared range*; `--latest`
ignores the range and rewrites the manifest. `patch` and `minor` are not expressible.

### go — verified 1.27.1

`detect`: `go.mod`

| Job | Command |
|---|---|
| check | `go list -m -u all` |
| bump `patch` | `go get -u=patch ./...` |
| bump `default`, `minor` | `go get -u ./...` |
| refresh | `go mod tidy` |

`-u` selects newer minor-or-patch releases; `-u=patch` changes the default to patch
releases. `go.mod` records minimum versions rather than ranges, so `default` and
`minor` are the same lane here. **`major` is not expressible in place** — in Go a
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
| `npm` | `package-lock.json`, `packageManager=npm` | `npm outdated --json` | `npm update` | via the taze engine | `npm install` |
| `yarn` | `yarn.lock` | `yarn outdated` | `yarn up` (berry) / `yarn upgrade` (classic) | via the taze engine | `yarn install` |
| `bun` | `bun.lock`, `bun.lockb`, `packageManager=bun` | `bun outdated` | `bun update` | `bun update --latest` | `bun install` |
| `cargo` | `Cargo.toml` | `cargo update --dry-run` | `cargo update` | `cargo upgrade --incompatible` (needs `cargo-edit`) | `cargo fetch` |
| `poetry` | `poetry.lock`, `[tool.poetry]` | `poetry show --outdated` | `poetry update` | edit the constraint, then `poetry update` | `poetry install` |
| `pip-tools` | `requirements.txt` + `requirements.in` | `pip-compile --dry-run --upgrade` | `pip-compile` | `pip-compile --upgrade` | `pip-sync` |
| `bundler` | `Gemfile.lock` | `bundle outdated` | `bundle update` | `bundle update --major` (`--minor`, `--patch` also exist) | `bundle install` |
| `composer` | `composer.lock` | `composer outdated` | `composer update` | edit the constraint, then `composer update` | `composer install` |
| `deno` | `deno.json`, `deno.jsonc` | `deno outdated` | `deno outdated --update` | — | — |
| `mix` | `mix.exs` | `mix hex.outdated` | `mix deps.update --all` | edit the constraint in `mix.exs` | `mix deps.get` |
| `dotnet` | `*.csproj`, `*.sln` | `dotnet list package --outdated` | `dotnet add package <id>` | — | `dotnet restore` |
| `maven` | `pom.xml` | `mvn versions:display-dependency-updates` | `mvn versions:use-latest-releases` | — | `mvn dependency:resolve` |
| `gradle` | `build.gradle*` | `./gradlew dependencyUpdates` (ben-manes plugin) | — | — | `./gradlew dependencies` |
| `asdf` | `.tool-versions` without `mise` | `asdf outdated` (needs the `asdf-outdated` plugin) | — | — | `asdf install` |

Where a row shows `—`, there is no single command for that job: stop and ask the
user rather than assembling one.

`cargo update` respects the semver requirement already in `Cargo.toml`, so it has no
patch/minor distinction — for a `0.x` crate the requirement is the minor. `mix` and
`composer` dependencies are usually declared with a range, so their `default` lane
already covers minor releases.

## `.justbump/managers.json`

```jsonc
{
  "version": 1,
  // Shown to the user in step 5. Free text; the agent never runs it.
  "verify": "run `mise run check` and confirm the CLI still starts",
  "managers": [
    {
      "name": "mise",
      "kind": "toolchain",
      "detect": ["mise.toml", "mise.lock"],
      "commands": {
        "check": "mise outdated --json",
        "bump": { "default": "mise upgrade", "major": "mise upgrade --bump" },
        "refresh": "mise install"
      }
    },
    {
      "name": "nub",
      "kind": "package",
      "detect": ["nub.lock", "packageManager=nub"],
      "engine": "taze",
      "commands": {
        "check": "nub outdated --json",
        "bump": { "default": "nub update", "major": "nub update --latest" },
        "refresh": "nub install"
      }
    }
  ]
}
```

| Field | Meaning |
|---|---|
| `version` | Schema version. Currently `1`. |
| `verify` | Reminder text shown to the user after the run. **Never executed by the agent** — the user runs the main flow. |
| `managers` | Ordered array; a `name` appears at most once. Order is the order the report and the commits use. |
| `kind` | `toolchain` or `package`. |
| `detect` | Signals; **any** match means the manager is present. `key=value` matches a literal in the file named by the key (`packageManager=nub` reads `package.json`). |
| `engine` | Optional. `taze` is the only value. When present the engine replaces `bump` and all four modes are available; the native `bump` map becomes the fallback for when the engine cannot run. |
| `commands` | **Omit entirely to mark a manager detected but not supported.** It shows as `skipped (out of support matrix)` and is never attempted. |
| `note` | Optional free text. Explains an unsupported record, or anything else the user should see in the plan. |
| `commands.check` | Read-only. Used to build the report and to detect an already-current tree. |
| `commands.bump` | Mode-keyed. **A missing key is the degradation** — `default` is required, the rest only appear for modes that manager can express. |
| `commands.refresh` | Makes the resolved state agree with the manifest. Optional when `bump` already does it. |

**Every command must be scoped to the project.** Where a tool defaults to
machine-wide behaviour, pass its scoping flag — `mise --local` is the example that
matters most in practice. A bump of this project must not reach outside it.

Owned paths are deliberately **not** in the file. They are derived at run time from
`git status --porcelain` before and after the run, which is what makes rollback
exact even when a command creates a lockfile that did not exist before.

<!---
Commands checked against the installed tool's `--help` on 2026-10-06:
- taze 21.3.0, mise 2026.10.0, nub 0.9.6, pnpm 12.9.1, go 1.27.1, uv 0.12.23

Two traps were found by running these tools against a clean tree in the repo this
skill was written in, not by reading their docs:

1. taze's project config can set `"write": true`, making even `taze --json` rewrite
   the manifest. The docs still imply `-w` is required to write.
2. `mise outdated` / `mise upgrade` default to global + local config. The docs'
   example shows `mise outdated --local`, but nothing warns that the bare form
   reaches the user's machine-wide tools.

Source references:
- https://github.com/antfu/taze
- https://mise.jdx.dev/cli/upgrade.html
- https://mise.jdx.dev/cli/outdated.html
- https://go.dev/doc/modules/managing-dependencies
- https://doc.rust-lang.org/cargo/commands/cargo-update.html
- https://docs.astral.sh/uv/reference/cli/
-->
