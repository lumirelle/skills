# taze is the Node-lane engine, resolved at run time

justbump drives `taze` for Node package managers instead of each manager's native
update command, because taze is the only tool that expresses all four bump modes
(`default` / `patch` / `minor` / `major`) — `nub update` and `pnpm update` are
two-lane, so `justbump patch` would be unanswerable on the most common kind of
project. taze is invoked through the project's own runner (`nub dlx taze`,
`pnpm dlx taze`, `npx --yes taze`), preferring a taze already in `devDependencies`,
and it is **never** added to `package.json`: a bump run that edits the manifest to
install its own tooling would contaminate both the diff and the report. When taze
cannot run, the native `bump` map takes over and the resulting mode degradation is
reported rather than hidden.

## Considered options

- **Native manager only.** Simpler and needs no extra tooling, but makes
  `patch`/`minor` unexpressible for Node — the case users will hit first.
- **Add taze as a devDependency when missing.** Removes the ephemeral fetch cost,
  but mutates the manifest as a side effect of a mechanical run.
- **Hand-roll the range rewriting.** Re-implements semver range resolution and
  lockfile consistency, which is exactly the part that is easy to get wrong.

## Consequences

Node projects get a different engine from every other language, so the record's
optional `engine` field exists and the fallback path must be reported. taze also
wants to manage `.node-version` and GitHub Actions, so it is always passed
`--no-node-version --no-github-actions` to keep one manager owning each version.

Sharpest consequence: taze is not safe to use for inspection. Its project config
(`.tazerc.json` / a `taze` key in `package.json`) can set `"write": true`, which
makes even `taze --json` rewrite the manifest — found by running it against a clean
tree, not by reading the docs, which still imply `-w` is required. So `check` is
always the native manager's job and taze is only ever invoked where a write is
wanted.
