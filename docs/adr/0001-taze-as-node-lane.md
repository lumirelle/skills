# taze is the Node lane

justbump drives `taze` for Node package managers instead of each manager's native
update command, because taze is the only way to express all four bump modes
(`default` / `patch` / `minor` / `major`) for the Node managers in the matrix:
`nub update` and `pnpm update` are two-lane, so `justbump patch` would be unanswerable
on the most common kind of project. The exception is classic Yarn, whose
`yarn upgrade --latest` with `--tilde` / `--caret` reaches all four natively; and other
ecosystems are not affected — bundler has `--patch` / `--minor` / `--major` of its own.
The Node lane is available **only when the project already declares taze** in
`dependencies` or `devDependencies`, and it runs that declared binary through the
manager's exec runner (`nub exec taze`, `pnpm exec taze`, `npx taze`). The runner is
resolved at **generation** time and the resulting commands are written out in full in
`.justbump/managers.json`, one per mode — so what will run is what the reviewed file
says. A project that does not declare taze gets the native lane, and its mode
degradation is reported rather than hidden.

## Considered options

- **Native manager only.** Simpler and needs no extra tooling, but makes
  `patch`/`minor` unexpressible for Node — the case users will hit first.
- **Add taze as a devDependency when missing.** Removes the precondition entirely,
  but mutates the manifest as a side effect of a mechanical run.
- **Fetch taze when the project does not declare it** (`dlx`, `x`, `npx --yes`).
  Removes the precondition without mutating anything, but the fetch ignores the
  project's pin: the run would use a different taze version than the project chose,
  need the network, and succeed or fail depending on registry state — the opposite of
  a mechanical, reproducible bump.
- **Hand-roll the range rewriting.** Re-implements semver range resolution and
  lockfile consistency, which is exactly the part that is easy to get wrong.
- **Record `engine: taze` and expand it at run time** (the v1 schema). Keeps the
  config small, but the file then holds a native `bump` map that does *not* run,
  while the command that does run is assembled from three places — the file, a
  runner table, and taze's flag list. It made the config read untruthfully, and it
  left the "don't add taze to `package.json`" guarantee in the agent's memory
  instead of in the artifact the user reviews.

## Consequences

Node projects get a different lane from every other language. The recorded commands
are verbose — four long, near-identical lines per Node manager — and that verbosity is
the trade: every safety flag is visible, and `nub exec taze` (rather than a fetch, or
"install taze") is a reviewed fact rather than a rule to recall. Schema `version` was
2 when this decision was recorded; a v1 file is regenerated rather than migrated,
because v1's `bump` map means something different.
[ADR-0003](0003-shell-portable-refresh-steps.md) later moved `refresh` to
shell-portable steps and `version` to 3.

Sharpest consequence: taze is not safe to use for inspection. Its project config
(`.tazerc.json` / a `taze` key in `package.json`) can set `"write": true`, which
makes even `taze --json` rewrite the manifest — found by running it against a clean
tree, not by reading the docs, which still imply `-w` is required. So `check` is
always the native manager's job, with one verified exception: yarn berry has **no**
non-interactive outdated listing at all (`yarn outdated` → *Couldn't find a script
named 'outdated'*; `yarn upgrade-interactive` is interactive), so there the check is
`<runner> taze --json --no-write`. The flag is what makes that safe, and dropping it
would silently re-introduce the write.
