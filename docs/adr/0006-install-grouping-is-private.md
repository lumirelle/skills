# Install grouping names the private half, not the global one

[ADR-0005](0005-install-grouping-is-one-global-plugin.md) settled the mechanism — one
manifest plugin, everything else deliberately unlisted — and listed 12 skills in it under
the name `global`. Both halves of that choice were wrong.

**The name first.** `global` is a scope claim, and it is the CLI's own claim, not ours:
`-g` already means "into `~/.agents/skills`", so a group called `global` reads as a
recommendation about scope when its real content was a recommendation about sharing.
The two do correlate, but they are not the same axis, and the `-g` group is exactly where
the confusion bites: the picker will offer a `global` selection and install it project-
locally. The group is now `private`, which states the actual test — installed once on my
machine, shared with nobody, never part of a repo's tooling.

**The membership second.** Seven of the twelve write into the repository they run in:
`skill-creator` and `writing-for-agents` author committed skills and `AGENTS.md`,
`research` leaves a findings document behind, `retro` and `to-questionnaire` leave records
and questions a team acts on, `handoff` writes state the next session picks up, and
`wizard` walks a human through provisioning that the project then depends on. For those,
a machine-wide install is actively wrong: the artifact is shared but the behaviour is
not, so two people working in the same repo get different guidance and nothing in the
repo says which one applied. They belong in the project's own install — committed by
whoever sets it up, inherited by everyone who checks out — which is exactly the `Other`
bucket the manifest leaves unlisted. `find-skills` stays because it manages the machine's
skill set rather than any repo's; `canvas-design`, `theme-factory`, `doc-coauthoring` and
`internal-comms` stay because they produce artifacts for the person rather than tooling
for the repo.

So the manifest lists 5 of 39 skills, and the inclusion test is now "would a teammate
need this to behave the same way I do?" — a question with a determinate answer, unlike
ADR-0005's "no way to predict when you will need it", which fits every skill ever
written.

## Considered options

- **Keep `global` and only re-curate the list.** Free, but the label keeps carrying the
  scope reading while the fix is about sharing, and the 5 remaining skills are the ones
  where the two readings diverge most.
- **Call it `personal` or `machine`.** `personal` overlaps with `~/.agents/skills` being
  the personal scope in the same confusing way; `machine` describes the storage, not the
  rule. `private` names the rule.
- **Drop the plugin entirely and carry the recommendation in the README.** This is the
  honest alternative now: any plugin grouping sets `searchable: false`, so keeping a
  5-item group inside 39 costs the picker's search box. It survives because the 5 are
  the ones a new machine wants installed before any project exists, which is precisely
  when nobody is reading the README.
- **List both halves** (`private` and `project`). Rejected in ADR-0005 and still rejected:
  it needs a 39-line catalog that drifts against `meta.ts`, and "Project" collides with
  `-g`'s counterpart in one command's output.

## Consequences

The `Other` bucket grows to 34 skills, which makes the heading less a description and
more a default — `private` is now the only thing the picker says, so it has to say
something true. Drift still fails in the safe direction: a skill missing from the
manifest, or a listed path that no longer resolves, silently lands in `Other`, so
`mise run start check` keeps asserting only the listed-to-existing direction. Sharing a
skill with a team is now a per-repo step with no upstream recommendation attached;
`--skill='*'` without `-g` still installs everything, and the manifest no longer suggests
it. Side effect unchanged: `/plugin marketplace add lumirelle/skills` surfaces a plugin
named `private`.
