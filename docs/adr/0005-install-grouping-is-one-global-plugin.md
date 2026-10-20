# Install-time grouping is one `global` plugin

> Superseded by [ADR-0006](0006-install-grouping-is-private.md): the plugin is now named
> `private` and holds 5 skills, not 12. The mechanism this ADR settled — one manifest
> plugin, everything else deliberately unlisted — still stands.

`skills add lumirelle/skills` prints a flat list of 39 skills. The only lever over that
display is `.claude-plugin/marketplace.json`: `plugins[].name` becomes a section heading
in `--list` and a group in the interactive picker (kebab-cased, title-cased for display),
and the skill's path is what the heading is attached to. Directory layout cannot express
it — the installer's label for a skill is its frontmatter `name`, never its path — so the
`skills/` categories (`agent/`, `doc/`, `design/`, `dev/`, `starup/`, `external-tool/`)
are invisible at install time.

So the manifest declares **one** plugin, `global`, listing the 12 skills that are worth
paying for in every session. Everything else is left unlisted on purpose: the CLI files
unlisted skills under its hardcoded `General` heading in `--list` and under `Other` in the
picker, which is exactly the "install it when a project needs it" bucket we want. The
inclusion test is *no dependency on the repo you happen to be in, and no way to predict
when you will need it*: skill meta-work (`find-skills`, `skill-creator`,
`writing-for-agents`), session-level operations (`handoff`, `retro`, `to-questionnaire`),
document and visual output (`doc-coauthoring`, `internal-comms`, `research`,
`theme-factory`, `canvas-design`), and host-level `wizard`. `wait-what` stays out because
it re-pitches in the `GLOSSARY.md` vocabulary of the repo it runs in; `frontend-design` and
`mcp-builder` stay out because both act on code that exists.

Grouping is advisory. `-g` still decides whether a skill lands in `~/.agents/skills` or in
a project, and the picker will happily install a `global` selection project-locally. What
the label buys is the recommendation, not the enforcement — the 12 listed descriptions cost
~700 tokens of always-on context against ~1.9k for the whole collection.

## Considered options

- **Declare both `global` and `project`.** Gets the label "Project" instead of the CLI's
  "Other", at the price of listing all 39 paths and generating/validating that list
  against `meta.ts`, since a hand-written 39-line catalog drifts. The word "Project" is
  also already taken by `-g`'s counterpart, so a user toggling the "Project" group and
  installing with `-g` would be reading two contradictory labels in one command.
- **No manifest, document the split in the README only.** Keeps the picker's search box
  and adds no mechanism, but the install display — the only place the grouping was asked
  for — shows nothing.
- **Restructure `skills/<scope>/<category>/<skill>`.** Makes scope visible in the repo
  tree, but the installer still shows no headings, every `meta.ts` mapping and README
  link moves, and the extra level uses up the CLI's 3-level container walk.
- **`metadata.internal: true` on the project-only skills.** That hides them from discovery
  unless explicitly requested, which is a different tool: it removes them from the
  installable set rather than recommending where they belong.

## Consequences

The picker loses its search box for this repo: any plugin grouping sets
`searchable: false`, so 39 items become a two-heading tree, one of them holding 27. The
`Other`/`General` wording cannot be changed, so the ADR, not the UI, is what records that
the bucket means "per project". Drift fails in the safe direction only — a skill missing
from the manifest silently lands in `Other`, and a listed path that no longer resolves
silently demotes its skill the same way — so `mise run start check` asserts the listed
paths still resolve and nothing can assert the reverse. Side effect: the repo is now a
Claude Code plugin marketplace, and `/plugin marketplace add lumirelle/skills` surfaces a
plugin named `global`. Written against `skills` CLI 1.7.4.
