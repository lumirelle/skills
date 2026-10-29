# Install grouping lists a global and a glocal plugin

[ADR-0005](0005-install-grouping-is-one-global-plugin.md) settled the mechanism: a
`plugins[]` entry in `.claude-plugin/marketplace.json` becomes a heading in `--list` and a
group in the interactive picker, and every unlisted skill falls to `Other` (`General` under
`--list`). This records what the manifest lists now.

The manifest declares two plugins.

## Global — meant to be installed globally

| Skill |
|-------|
| `agent-browser` |
| `canvas-design` |
| `doc-coauthoring` |
| `find-skills` |
| `frontend-design` |
| `grill-me` |
| `internal-comms` |
| `teach` |
| `theme-factory` |
| `unslop` |

## Glocal — meant to be installed globally and locally

| Skill |
|-------|
| `grilling` |
| `handoff` |
| `mcp-builder` |
| `mise` |
| `pr` |
| `skill-creator` |
| `to-questionnaire` |
| `wait-what` |
| `wizard` |
| `worktrunk` |
| `writing-for-agents` |

Everything else is unlisted and lands in `Other`, which is the "install it when a project
needs it" bucket.

## Considered options

- **One plugin** (ADR-0005). Cannot express the difference between a skill a new machine
  wants before any project exists and one that is only useful once a repo pins it, so the
  second kind was either mislabelled or lost.
- **Three or more plugins, one per area.** Buys a finer picker tree and costs a
  hand-maintained path catalog that drifts against `meta.ts` for every skill added.
- **No manifest at all.** Keeps the picker's search box and loses the only place the
  grouping is visible: `skills add` prints the list, nobody reads the README first.

## Consequences

Two plugins mean the picker loses its search box, for a collection small enough that the
headings are the faster scan. Drift fails in the safe direction only — a skill missing
from the manifest, or a listed path that no longer resolves, silently lands in `Other` —
so `mise run start check` asserts that every listed path still has a `SKILL.md` and
nothing can assert the reverse. Side effect: `/plugin marketplace add lumirelle/skills`
surfaces both plugins.
