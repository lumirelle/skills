# The Node lane's refresh deletes the lockfile too

justbump's Node-lane `refresh` deletes `node_modules` **and the manager's lockfile** in
one step before reinstalling. [ADR-0003](0003-shell-portable-refresh-steps.md) settled
that step's spelling — the lane's own runtime, one command, no chaining — and had it
delete `node_modules` only. That left the step unable to do what the lane says it is
for: taze rewrites only the manifest, `<pm> install` honours a lock entry whose
specifier did not change, and a lockfile outlives a deleted tree. So the refresh
reinstalled the old resolution and step 5 verified a tree that was, for most
dependencies, the pre-bump one. The step now names both paths:

```
node --input-type=commonjs -e "const fs=require('fs');for(const p of ['node_modules','<lockfile>'])fs.rmSync(p,{recursive:true,force:true})"
```

(`bun -e "…"` for `bun`, which removes `bun.lock` **and** `bun.lockb`: `bun install`
migrates a `.lockb` into `bun.lock`, so a leftover `.lockb` would seed the old
resolution.) Schema `version` is 5; a v4 file records a refresh that leaves the
lockfile in place, and is regenerated rather than migrated.

## Considered options

- **Delete only `node_modules`** (the v4 behaviour ADR-0003 chose). Right for the
  specifiers the bump rewrote — `install` re-resolves one that no longer matches its
  lock entry — and wrong for every specifier it did not: the transitive tree, and any
  direct dependency whose range prefix the mode left alone, keep their locked versions.
  The refresh then certifies the old resolution, which is the failure it exists to
  prevent.
- **`<pm> update` as the whole refresh.** Re-resolves against the registry rather than
  the manifest taze just wrote, and its scope at a workspace root is not `install`'s —
  already rejected in ADR-0003.
- **Leave the lock and let `dedupe` reconcile it.** `dedupe` collapses duplicate
  versions; it is not a re-resolution, and it runs after the install that already used
  the lock.
- **A separate step for the lockfile.** More reviewable in a file whose point is
  reviewability, but a failed lockfile delete then leaves `node_modules` gone and the
  lock present, so the install that follows reinstalls from it — the same bug, now
  behind a step that did report a failure. One command keeps the delete atomic from the
  operator's side.
- **Conditioning the delete on whether the bump changed anything.** The per-mode
  command set already encodes the modes, and "nothing to change" is handled a level up:
  step 3 skips `refresh` entirely when `check` reports nothing. A second condition would
  double the recorded commands to express a rule the run already has.

## Consequences

`refresh` is a real re-resolution, bounded by the ranges the bump wrote — the set a
fresh clone installs, not a wider mode. The delete is one line naming both paths, so
the two things it must remove are visible in the reviewed config, and the `bun` lane's
second lockfile spelling is recorded rather than remembered. `install` writes the
lockfile back, so it stays a tracked, committable artifact and the stale-reference
sweep's lockfile exclusion is unchanged. The cost is that transitive dependencies can
move within the manifest ranges during a bump run, which shows up in the lockfile diff;
that is the resolution the manifest has always described.
