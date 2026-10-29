# Lumirelle's Skills

> [!Note]
> This project is forked from and inspired by [antfu/skills](https://github.com/antfu/skills) by [Anthony Fu](https://github.com/antfu). See [thanks](#thanks) for more details.

A curated collection of [Agent Skills](https://agentskills.io/home) reflecting [Lumirelle](https://github.com/lumirelle)'s preferences, experience, and best practices, along with usage documentation for the tools.

## Installation

```bash
pnpx skills add lumirelle/skills --skill='*'
```

or to install all of them globally:

```bash
pnpx skills add lumirelle/skills --skill='*' -g
```

Learn more about the CLI usage at [skills](https://github.com/vercel-labs/skills).

## Skills

This collection aims to be a one-stop collection for agentic coding workflows. It includes hand-maintained skills, skills generated from project documentation, and vendored skills synced from upstream repositories that maintain their own.

### Hand-maintained Skills

Manually maintained by Lumirelle with his preferred tools, setup conventions, and best practices.

| Skill | Description |
|-------|-------------|
| [justbump](skills/maintaining/justbump) | Bump every pinned version in one mechanical pass — toolchain tools and dependencies — then report per manager and hand back for confirmation |
| [mise](skills/toolchain/mise) | Onboard into a mise project: detect it, install its tools, find and run its tasks, and prefer `--help` over docs for anything else |
| [worktrunk](skills/toolchain/worktrunk) | Drive `wt` for Git worktrees: switch/list/merge/remove, why `wt switch` never changes an agent's directory, bare-repo layout, and which commands are the user's call |

### Skills Generated from Official Documentation

Generated from official documentation and fine-tuned by Lumirelle.

| Skill | Description | Source |
|-------|-------------|--------|
| / | / |

### Vendored Skills

Synced from external repositories that maintain their own skills. See [`meta.ts`](meta.ts) for which upstream skills map to which directory.

#### [vercel-labs/skills](https://github.com/vercel-labs/skills)

| Skill | Description |
|-------|-------------|
| [find-skills](skills/starting/find-skills) | Discover and install skills from the open skills ecosystem |

#### [anthropics/skills](https://github.com/anthropics/skills)

| Skill | Description |
|-------|-------------|
| [theme-factory](skills/shaping/theme-factory) | Apply one of 10 preset themes (or generate a new one) to slides, docs, and HTML artifacts |
| [canvas-design](skills/shaping/canvas-design) | Create posters and static visual art as .png/.pdf from a design philosophy |
| [frontend-design](skills/shaping/frontend-design) | Aesthetic direction, typography, and avoiding templated-looking UI |
| [mcp-builder](skills/building/mcp-builder) | Build high-quality MCP servers that expose external APIs as tools (Python FastMCP or Node/TS SDK) |
| [skill-creator](skills/buidling/skill-creator) | Create, edit, and improve skills; run evals and optimize descriptions for triggering |
| [doc-coauthoring](skills/reporting/doc-coauthoring) | Structured context gathering → refinement → reader testing workflow for docs and proposals |
| [internal-comms](skills/reporting/internal-comms) | Formats for status reports, leadership updates, newsletters, and incident reports |

#### [mattpocock/skills](https://github.com/mattpocock/skills)

| Skill | Description |
|-------|-------------|
| [ask-matt](skills/starting/ask-matt) | Router: asks which skill or flow fits the current situation |
| [setup-matt-pocock-skills](skills/starting/setup-matt-pocock-skills) | One-time repo setup: issue tracker, triage labels, domain doc layout |
| [wayfinder](skills/shaping/wayfinder) | Plan work too large for one session as decision tickets on the issue tracker |
| [prototype](skills/shaping/prototype) | Throwaway prototypes that answer a design question |
| [research](skills/shaping/research) | Investigate a question against primary sources, captured as a Markdown file |
| [grilling](skills/reference/grilling) / [grill-me](skills/shaping/grill-me) / [grill-with-docs](skills/shaping/grill-with-docs) | Relentless interview to stress-test a plan, optionally emitting ADRs and a glossary |
| [to-questionnaire](skills/doc/to-questionnaire) | Turn a decision you can't answer into a questionnaire for someone else |
| [teach](skills/shaping/teach) | Teach a new skill or concept within the workspace |
| [wait-what](skills/shaping/wait-what) | Re-pitch the last message in Simplified Technical English |
| [to-spec](skills/buidling/to-spec) / [to-tickets](skills/buidling/to-tickets) | Turn the conversation into a spec, then into tracer-bullet tickets with blocking edges |
| [implement](skills/buidling/implement) | Implement work described by a spec or tickets |
| [implement-spec](skills/buidling/implement-spec) | Implement a whole spec in one run: tickets as a task graph, parallel subagents, one integration branch |
| [code-review](skills/buidling/code-review) | Two-axis review of a diff (standards and spec) via parallel sub-agents |
| [wizard](skills/building/wizard) | Generate an interactive bash wizard for steps only a human can do |
| [writing-for-agents](skills/building/writing-for-agents) | Principles for writing skills and `AGENTS.md` / `CLAUDE.md` |
| [retro](skills/maintaining/retro) | Retrospective on a session: suggest changes to the agent's environment, not the code |
| [improve-codebase-architecture](skills/maintaining/improve-codebase-architecture) | Scan for deepening opportunities, report as HTML, then grill the chosen one |
| [diagnosing-bugs](skills/maintaining/diagnosing-bugs) | Diagnosis loop for hard bugs and performance regressions |
| [triage](skills/maintaining/triage) | Move issues/PRs through triage roles and write agent-ready briefs |
| [migrate-to-shoehorn](skills/maintaining/migrate-to-shoehorn) | Migrate test files from `as` assertions to `@total-typescript/shoehorn` |
| [handoff](skills/maintaining/handoff) | Compact the current conversation into a handoff document for the next agent |
| [domain-modeling](skills/reference/domain-modeling) | Sharpen the domain model: terminology, `GLOSSARY.md`, ADRs |
| [codebase-design](skills/reference/codebase-design) | Deep-module vocabulary: interfaces, seams, testability |
| [tdd](skills/reference/tdd) | Red → green loop, what makes a test worth keeping, anti-patterns |
| [pr](skills/reference/pr) | Shape a PR body: smallest visual, before/after evidence, merge-danger call |

#### [cursor/plugins](https://github.com/cursor/plugins)

| Skill | Description |
|-------|-------------|
| [unslop](skills/shaping/unslop) | Edit AI tells out of prose with a numbered pattern list: vocabulary, punctuation, hedging, jargon |

#### [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills)

| Skill | Description |
|-------|-------------|
| [web-design-guidelines](skills/shaping/web-design-guidelines) | Review UI code against the Web Interface Guidelines |

## FAQ

### The Project Source Layout?

`skills/` is this repo's own source layout (`starting/`, `shaping/`, `building/`, `maintaining/`, `reference/`, `toolchain/`), which is not what the installer shows: the skills which are meant to be installed globally are declared in [`.claude-plugin/marketplace.json`](.claude-plugin/marketplace.json) and listed as **Global**, every other skill falls to **Other** (`General` under `--list`) and are expected to be installed per project.

### What Makes This Collection Different?

Sources are tracked as git submodules under `vendor/` (for repositories that maintain their own skills) and `sources/` (for repositories we generate skills from). Pinning a submodule gives reliable, reproducible context and lets the skills stay up-to-date with upstream changes, since the exact commit each skill was synced from is recorded.

The project is also designed to be flexible - you can use it as a template to generate your own skills collection.

### Skills vs llms.txt vs AGENTS.md

To me, the value of skills lies in being **shareable** and **on-demand**.

Being shareable makes prompts easier to manage and reuse across projects. Being on-demand means skills can be pulled in as needed, scaling far beyond what any agent's context window could fit at once.

You might hear people say "AGENTS.md outperforms skills". I think that's true — AGENTS.md loads everything upfront, so agents always respect it, whereas skills can have false negatives where agents don't pull them in when you'd expect. That said, I see this more as a gap in tooling and integration that will improve over time. Skills are really just a standardized format for agents to consume—plain markdown files at the end of the day. Think of them as a knowledge base for agents. If you want certain skills to always apply, you can reference them directly in your AGENTS.md.

## Generate Your Own Skills

Fork this project to create your own customized skill collection.

1. Fork or clone this repository
2. Install [mise](https://mise.jdx.dev/), then run `mise install` to provision Node, nub, hk, and the project's dependencies
3. Update `meta.ts` with your own projects and skill sources
4. Run `mise run start cleanup -y` to remove the existing submodules and skills
5. Run `mise run start init -y` to clone the submodules
6. Run `mise run start sync` to sync vendored skills
7. Ask your agent to `Generate skills for \<project\>` (recommended one at a time to manage token usage)

`mise run start <command>` runs the CLI in [`scripts/cli.ts`](scripts/cli.ts).

See [AGENTS.md](AGENTS.md) for detailed generation guidelines.

## Thanks

This project is forked from and inspired by [antfu/skills](https://github.com/antfu/skills) by [Anthony Fu](https://github.com/antfu). The skills layout, the `meta.ts` config shape, and the original `scripts/cli.ts` come from there. On top of that, this fork layers Lumirelle's own opinionated customizations — mise + nub + hk tooling, its own skill set, and a few CLI fixes.

Thanks also to the upstream projects whose skills are vendored in this collection; see [`meta.ts`](meta.ts) for the full list.

## Sponsors

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/lumirelle/static/sponsors.svg">
    <img src='https://cdn.jsdelivr.net/gh/lumirelle/static/sponsors.svg' alt='Sponsors' />
  </a>
</p>

## License

Skills and the scripts in this repository are [MIT](LICENSE.md) licensed.

Vendored skills from external repositories retain their original licenses - see each skill directory for details. Skills released under a license that forbids redistribution are not included.
