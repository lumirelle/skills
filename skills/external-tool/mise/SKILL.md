---
name: mise
description: >-
  Use when working in a project that uses mise (mise-en-place): the repo has
  mise.toml / .mise.toml / mise.local.toml / .config/mise.toml / .tool-versions,
  or its README/CI references `mise run` or `mise install`. Consult it before
  installing tools or running build, test, or dev commands. Trigger on the
  intent even when the user never says "mise" (e.g. "install dependencies",
  "run the tests", "set up the project"). Skip projects that do not use mise.
---

# mise

Working in a mise-managed project. mise declares the project's tools, environment
variables, and tasks in config files; the point is to let mise supply them instead
of installing or wiring tools by hand. This is mostly about **first contact**: what
to run before touching anything else.

## Prefer `--help` over the docs

For anything this skill doesn't cover — a flag, a subcommand, a version-specific
behavior — run `mise <command> --help` (or `mise --help` for the command list)
against the **installed** version. `--help` is version-exact, offline, and always
current; searching the web can return a different release and costs a round-trip.
Only fall back to the online docs when `--help` genuinely doesn't answer.

This is not just a mise rule — it generalizes to every CLI: reach for `--help`
before a skill, a web search, or the docs. mise's author makes the point plainly —
an agent should learn a tool from `--help`, the same way a human does.

## Is this a mise project?

Any of these means yes:

- `mise.toml`, `.mise.toml`, `mise.local.toml`
- `.config/mise.toml` or `.config/mise.local.toml`
- `.tool-versions` (legacy) or `mise.lock` (resolved versions)
- README / `AGENTS.md` / CI referencing `mise install`, `mise run`, or a mise task

## First contact — do this, in order

1. **Read the config.** Open `mise.toml` and note three sections:
   `[tools]` (runtimes and CLIs), `[env]` (variables loaded for every command),
   `[tasks]` (named scripts). Run `mise config ls` to see every active file.
2. **Install the declared tools:** `mise install`.
   Do **not** install tools with `brew` / `npm -g` / `pip` — they are already declared
   here, and a second copy breaks version selection.
3. **Find the project's entrypoint:** `mise tasks ls` (aliases: `mise tasks`).
   Look for `setup` / `bootstrap` / `dev` / `test` / `build`. A `setup` task is the
   intended first-run command — run it.
4. **Run work through mise.** Prefer `mise run <task>` over hand-assembling commands
   from the README, `package.json`, or CI: the task already carries the right tools,
   environment, and ordering.
5. **Confirm before going further:** `mise ls --current` (selected tools) and
   `mise doctor` (setup problems).

## Running a command

| Goal | Use |
|---|---|
| Run a project task / workflow | `mise run <task>` — installs missing tools, loads project env |
| Run one command with the project's tools + env | `mise exec -- <command>` (alias `mise x`) |
| Re-run a task on file changes | `mise watch <task>` |
| Inspect | `mise tasks ls`, `mise config ls`, `mise ls --current`, `mise doctor` |
| Add or change a tool version | `mise use <tool>@<version>` — **mutates config; only when asked** |

`mise exec` and `mise run` work without shell activation, so prefer them in scripts,
CI, and non-interactive agent shells.

## Skills shipped by mise-managed tools

Some tools mise installs ship their own agent skills. List them with
`mise skills ls` (e.g. `hk-configure` / `hk-debug` from hk), and link them where an
agent looks with `mise skills sync` (into `.claude/skills`, or `--global`). Check
this before assuming a tool here has no skill — the skill is version-matched to the
tool version active in this project.

## Rules of engagement

- **Let mise manage tools.** Install with `mise install`, add with `mise use`. Never
  reach for a second package manager for a tool mise already declares.
- **Don't bypass tasks.** If `[tasks]` defines `setup` / `test` / `build`, use it
  instead of guessing the underlying command.
- **Environment variables come from `[env]`.** Don't recreate them in `.env` or hardcode
  them; the config is the source of truth.
- **Keep versions pinned.** Commit `mise.toml` and `mise.lock`; change version requests
  with `mise use`, don't hand-edit the lockfile.
- **Don't run state-changing commands reflexively.** `mise use` and `mise trust` change
  config the user owns — only when the task calls for it.

## Gotchas

- **Trust.** In normal mode, `mise install` / `exec` / `run` / `watch` auto-trust the
  active config, and plain `[tools]` version strings need no trust. Only **paranoid mode**
  requires explicit `mise trust`. If you hit an untrusted-config error, run `mise trust`.
  A config can execute code (tasks, hooks, some `[env]` directives), so review an unknown
  config before trusting it — don't `mise trust` blindly.
- **Task caching.** A task with `sources` / `outputs` may be skipped when its inputs are
  unchanged. If it must run regardless, check `mise run --help` for the force option
  rather than assuming the task body executed.
- **Config environments.** `MISE_ENV` can load extra files (`mise.development.toml`, …).
  Run `mise config ls` before assuming the base file is everything.
- **Activation is optional.** Bare `node` / `python` etc. on `PATH` only reflect mise when
  the shell is activated or shims are installed. When unsure, go through `mise exec --`.

## Going deeper

- `mise <command> --help` — first stop, always.
- `mise --help` — the full command list.
- `https://mise.jdx.dev/llms.txt` — LLM-oriented index, only when `--help` isn't enough.
- `mise mcp` — mise's MCP server, if the agent supports MCP instead of a skill.

<!--
Distilled from the official mise docs (mise 2026.10.0):
- https://mise.jdx.dev/getting-started.html
- https://mise.jdx.dev/cli/trust.html
- https://mise.jdx.dev/cli/skills.html
- https://mise.jdx.dev/llms.txt
-->
