# A refresh is shell-portable steps

justbump records `commands.refresh` as an **ordered array of steps** — one command per
element — and every step is written in a spelling that runs unchanged in bash, `cmd`
and Windows PowerShell. The Node lane is why: it needs three steps (delete
`node_modules`, `<pm> install`, `<pm> dedupe`), and the obvious one-liner,
`rm -rf node_modules && pnpm install && pnpm dedupe`, is POSIX-only — `rm -rf` fails
in `cmd` and PowerShell, and `&&` is a syntax error in Windows PowerShell 5.1. The
deletion step uses the lane's own runtime, which is already on `PATH` because the lane
needs it:

```
node --input-type=commonjs -e "require('fs').rmSync('node_modules',{recursive:true,force:true})"
```

(`bun -e "…"` for `bun`; verified with `bun` 1.4.2, which takes `require` even in a
`type: module` package.) Steps rather than chaining for the second reason too: a step
that fails is the command to fix, and the steps after it would otherwise run against a
half-refreshed tree. Schema `version` is 3; a v2 file records a string `refresh` and is
regenerated rather than migrated.

## Considered options

- **Keep the chained POSIX line and tell Windows users to edit their copy** (the v2
  behaviour). One command instead of three in an already verbose file, but it makes the
  committed config wrong on half the machines that read it: a shared artifact every OS
  must locally repair is no longer the artifact the user reviewed.
- **A per-OS variant (`refresh` plus `refreshWindows`).** Both commands stay literal,
  but selection moves into a rule that is not visible in the line being reviewed, and
  mixed-OS teams carry a branch nobody exercises.
- **`name`-selected shell flags (`shell: "powershell"`).** Same objection, plus the
  config becomes a script runner with a shell matrix to maintain.
- **A POSIX emulator resolved at run time** (Git Bash, WSL). Works when the agent's
  harness ships one and fails when it does not, putting a machine dependency back into
  a file whose job is to describe the project.
- **`git clean -xdf node_modules`.** One portable command, and git is guaranteed
  present because the run commits. Rejected as a deletion expressed through version
  control: it needs `-x` to reach ignored files and `-f` to run unattended, where
  `fs.rmSync` names the exact path.
- **`<pm> update` as the whole refresh.** Portable and shorter, but it re-resolves
  against the registry rather than the manifest taze just wrote, and its scope in a
  workspace root is not `install`'s — the report could drift from what the bump
  recorded.
- **Dropping the deletion.** `install` re-resolves a changed specifier, so most runs
  would land the same tree — but not all (an unchanged range leaves the lockfile pin in
  place), and the empty tree is what makes the bumped versions the ones a check
  exercises.

## Consequences

`refresh` is an array even when it has one element (`["uv lock"]`), so the schema has
one shape instead of a string-or-array union the agent branches on. The verbosity v2
already accepted stays, now readable a step at a time. The README no longer carries
"Windows: edit your committed config", and no per-OS knowledge enters the skill: a
future step that deletes, copies or moves something uses the lane's runtime, not the
shell. That generalises to the rule in
[`references/schema.md`](../../skills/dev/justbump/references/schema.md): a recorded
command must run unchanged in bash, `cmd` and PowerShell.
