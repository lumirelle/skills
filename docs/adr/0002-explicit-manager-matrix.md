# An explicit manager matrix, not agent improvisation

justbump ships a fixed language → manager → command matrix in
`skills/dev/justbump/references/managers.md` rather than letting the agent derive
update commands per project from `--help`. An improvised command is a decision made
once and forgotten, so two runs on the same repo can disagree; a matrix is a
reviewable artifact that can be corrected. Commands carry a verified/unverified
marker, unverified rows are probed with `--help` before their first mutating use,
and a detected language with no row is **recorded as unsupported** rather than
dropped or improvised: it appears in the plan and the report as `skipped (out of
support matrix)` while every other manager still runs. The skill **stops and asks**
only for the commands themselves — offering the user the chance to supply them, at
which point the record becomes a normal unverified entry.

## Considered options

- **Derive commands per run from `--help`.** Adapts to any project without a
  matrix to maintain, but produces unreviewable, non-reproducible behaviour and
  makes the pre-run confirmation table worthless — the user cannot confirm a plan
  whose commands were invented seconds earlier.
- **A discovery or plugin mechanism.** Would let the matrix grow without editing
  the skill, but is premature for a list this small and hides the commands from
  review.

## Consequences

The matrix is the part of the skill that grows, which is why it lives in a reference of
its own rather than in `SKILL.md`. Unverified rows are a standing liability: they must be
verified against a real tool, removed, or — where the toolchain cannot be installed to
check, as PHP and Elixir could not be — kept with an explicit marker and the probe-first
rule. The unsupported-manager path is
load-bearing — it is what keeps "we don't support this yet" from silently becoming
either a wrong command or a veto on the whole pass. Coverage can also grow per
project, through commands the user supplies at the generation gate, so an exotic
manager never has to wait on this file.
