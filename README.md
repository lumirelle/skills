# Lumirelle's Skills

A curated collection of [Agent Skills](https://agentskills.io/home) reflecting [Lumirelle](https://github.com/lumirelle)'s preferences, experience, and best practices, along with usage documentation for the tools.

> [!IMPORTANT]
> This is a proof-of-concept project for generating agent skills from source documentation and keeping them in sync.
> I haven't fully tested how well the skills perform in practice, so feedback and contributions are greatly welcome.

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

> Opinionated

Manually maintained by Lumirelle with his preferred tools, setup conventions, and best practices.

| Skill | Description |
|-------|-------------|
| [mise](skills/external-tool/mise) | Onboard into a mise project: detect it, install its tools, find and run its tasks, and prefer `--help` over docs for anything else |

### Skills Generated from Official Documentation

> Unopinionated but with tilted focus (e.g. TypeScript, ESM, Composition API, and other modern stacks)

Generated from official documentation and fine-tuned by Lumirelle.

| Skill | Description | Source |
|-------|-------------|--------|
| / | / |

### Vendored Skills

Synced from external repositories that maintain their own skills. See [`meta.ts`](meta.ts) for which upstream skills map to which directory.

#### [anthropics/skills](https://github.com/anthropics/skills)

| Skill | Description |
|-------|-------------|
| [mcp-builder](skills/agent/mcp-builder) | Build high-quality MCP servers that expose external APIs as tools (Python FastMCP or Node/TS SDK) |
| [skill-creator](skills/agent/skill-creator) | Create, edit, and improve skills; run evals and optimize descriptions for triggering |
| [doc-coauthoring](skills/doc/doc-coauthoring) | Structured context gathering → refinement → reader testing workflow for docs and proposals |
| [internal-comms](skills/doc/internal-comms) | Formats for status reports, leadership updates, newsletters, and incident reports |
| [theme-factory](skills/design/theme-factory) | Apply one of 10 preset themes (or generate a new one) to slides, docs, and HTML artifacts |
| [canvas-design](skills/design/canvas-design) | Create posters and static visual art as .png/.pdf from a design philosophy |
| [frontend-design](skills/design/frontend-design) | Aesthetic direction, typography, and avoiding templated-looking UI |

#### [mattpocock/skills](https://github.com/mattpocock/skills)

| Skill | Description |
|-------|-------------|
| [ask-matt](skills/starup/ask-matt) | Router: asks which skill or flow fits the current situation |
| [setup-matt-pocock-skills](skills/starup/setup-matt-pocock-skills) | One-time repo setup: issue tracker, triage labels, domain doc layout |
| [writing-for-agents](skills/agent/writing-for-agents) | Principles for writing skills and `AGENTS.md` / `CLAUDE.md` |
| [handoff](skills/agent/handoff) | Compact the current conversation into a handoff document for the next agent |
| [research](skills/doc/research) | Investigate a question against primary sources, captured as a Markdown file |
| [domain-modeling](skills/doc/domain-modeling) | Sharpen the domain model: terminology, `GLOSSARY.md`, ADRs |
| [grilling](skills/doc/grilling) / [grill-me](skills/doc/grill-me) / [grill-with-docs](skills/doc/grill-with-docs) | Relentless interview to stress-test a plan, optionally emitting ADRs and a glossary |
| [wayfinder](skills/doc/wayfinder) | Plan work too large for one session as decision tickets on the issue tracker |
| [to-spec](skills/doc/to-spec) / [to-tickets](skills/doc/to-tickets) | Turn the conversation into a spec, then into tracer-bullet tickets with blocking edges |
| [to-questionnaire](skills/doc/to-questionnaire) | Turn a decision you can't answer into a questionnaire for someone else |
| [triage](skills/doc/triage) | Move issues/PRs through triage roles and write agent-ready briefs |
| [wait-what](skills/doc/wait-what) | Re-pitch the last message in Simplified Technical English |
| [teach](skills/doc/teach) | Teach a new skill or concept within the workspace |
| [codebase-design](skills/design/codebase-design) | Deep-module vocabulary: interfaces, seams, testability |
| [improve-codebase-architecture](skills/design/improve-codebase-architecture) | Scan for deepening opportunities, report as HTML, then grill the chosen one |
| [prototype](skills/design/prototype) | Throwaway prototypes that answer a design question |
| [tdd](skills/dev/tdd) | Red → green loop, what makes a test worth keeping, anti-patterns |
| [implement](skills/dev/implement) | Implement work described by a spec or tickets |
| [implement-spec](skills/dev/implement-spec) | Implement a whole spec in one run: tickets as a task graph, parallel subagents, one integration branch |
| [code-review](skills/dev/code-review) | Two-axis review of a diff (standards and spec) via parallel sub-agents |
| [pr](skills/doc/pr) | Shape a PR body: smallest visual, before/after evidence, merge-danger call |
| [diagnosing-bugs](skills/dev/diagnosing-bugs) | Diagnosis loop for hard bugs and performance regressions |
| [retro](skills/doc/retro) | Retrospective on a session: suggest changes to the agent's environment, not the code |
| [wizard](skills/dev/wizard) | Generate an interactive bash wizard for steps only a human can do |
| [migrate-to-shoehorn](skills/dev/migrate-to-shoehorn) | Migrate test files from `as` assertions to `@total-typescript/shoehorn` |

#### [vercel-labs/skills](https://github.com/vercel-labs/skills)

| Skill | Description |
|-------|-------------|
| [find-skills](skills/agent/find-skills) | Discover and install skills from the open skills ecosystem |

#### [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills)

| Skill | Description |
|-------|-------------|
| [web-design-guidelines](skills/design/web-design-guidelines) | Review UI code against the Web Interface Guidelines |

## FAQ

### What Makes This Collection Different?

Skills are grouped by scope under `skills/` (`agent/`, `doc/`, `design/`, `dev/`, `starup/`, `external-tool/`), so you can install only what you need.

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

## Sponsors

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/lumirelle/static/sponsors.svg">
    <img src='https://cdn.jsdelivr.net/gh/lumirelle/static/sponsors.svg' alt='Sponsors' />
  </a>
</p>

## License

Skills and the scripts in this repository are [MIT](LICENSE.md) licensed.

Vendored skills from external repositories retain their original licenses - see each skill directory for details. Skills released under a license that forbids redistribution are not included.
