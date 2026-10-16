---
name: justbump-schema
description: The .justbump/managers.json format - fields, the mode-keyed bump map, and the rules that keep the file truthful.
---

# `.justbump/managers.json`

The one file justbump creates. Generated once, confirmed by the user, committed — and
the only place a run's commands come from. Which commands belong in it is
[managers.md](managers.md)'s job.

```jsonc
{
  "version": 5,
  // Shown to the user in step 5. Free text; the agent never runs it.
  "verify": "run `mise run check` and confirm the CLI still starts",
  "managers": [
    {
      "name": "mise",
      "kind": "toolchain",
      "detect": ["mise.toml", "mise.lock"],
      "note": "project-scoped: --local keeps this off the machine-global config",
      "commands": {
        "check": "mise outdated --local --json",
        "bump": {
          "default": "mise upgrade --local",
          "major": "mise upgrade --local --bump"
        }
      }
    },
    {
      "name": "nub",
      "kind": "package",
      "detect": ["nub.lock", "packageManager=nub"],
      "note": "taze declared in devDependencies, so the Node lane is available",
      "commands": {
        "check": "nub outdated --json",
        "bump": {
          "default": "nub exec taze -x nub -w --no-interactive --no-node-version --no-github-actions",
          "patch": "nub exec taze patch -x nub -w --no-interactive --no-node-version --no-github-actions",
          "minor": "nub exec taze minor -x nub -w --no-interactive --no-node-version --no-github-actions",
          "major": "nub exec taze major -x nub -w --no-interactive --no-node-version --no-github-actions"
        },
        "refresh": [
          "node --input-type=commonjs -e \"const fs=require('fs');for(const p of ['node_modules','nub.lock'])fs.rmSync(p,{recursive:true,force:true})\"",
          "nub install",
          "nub dedupe"
        ]
      }
    }
  ]
}
```

The `mise` record has two keys and the `nub` record has four — that difference *is*
the degradation. Nothing else in the file encodes it.

| Field | Meaning |
|---|---|
| `version` | Schema version. Currently `5`. **A mismatch with what the skill expects means regenerate, not migrate** — an older file's recorded commands mean something different from what this schema describes. `3` → `4` because `3`'s `nub` lane omitted `-x nub`, and those commands rewrite a `nub` pin to the unrelated npm package of that name. `4` → `5` because `4`'s Node-lane `refresh` deleted only `node_modules`, so the lockfile left behind re-pinned the old resolution and the reinstall could not re-resolve. |
| `verify` | Reminder text shown to the user after the run. **The agent never runs it** — the user runs the main flow. Step 6 may reproduce a failure, but that is diagnosis of a break, not this verification. |
| `managers` | Ordered array; a `name` appears at most once. Order is the order the report and the commits use. |
| `kind` | `toolchain` or `package`. |
| `detect` | Signals; **any** match means the manager is present. `key=value` matches a literal in the file named by the key (`packageManager=nub` reads `package.json`). |
| `commands` | **Omit entirely to mark a manager detected but not supported.** It shows as `skipped (out of support matrix)` and is never attempted. |
| `note` | Optional free text. Explains an unsupported record, a project-scoping flag that looks redundant but is not, or anything else the user should see in the plan. |
| `commands.check` | Read-only. Used to build the report and to detect an already-current tree. |
| `commands.bump` | **The commands that actually run.** Mode-keyed: `default` is required, and **a missing key is the degradation** — the manager has no such lane. There is no override field and nothing to expand at run time. |
| `commands.refresh` | **Include only when `bump` leaves the resolved state stale.** An ordered array of steps — one command per element, run in order, stopping at the first failure. Steps rather than one chained line because shells disagree: `&&` is a syntax error in Windows PowerShell 5.1 and `;` is not a separator in `cmd`, so a chained one-liner cannot be committed and shared. Makes the installed tree agree with the manifest, so that the user's verification exercises the bumped versions rather than the old ones. **A Node-lane `refresh` deletes the lockfile along with `node_modules`**: taze rewrites only the manifest, and an install that keeps the lock reinstalls every resolution whose specifier the bump did not change. Omit it where `bump` already settles the tree. |

**Every command must be scoped to the project.** Where a tool defaults to
machine-wide behaviour, pass its scoping flag — `mise --local` is the example that
matters most in practice. A bump of this project must not reach outside it.

**Every command must run unchanged in bash, `cmd` and PowerShell.** One command per
step, no chaining, no shell-specific spelling — `rm -rf`, `Remove-Item` and `&&` each
work on only part of the machines that read this file. Where a step needs to do
something the shell would normally do, use the lane's own runtime:
`node --input-type=commonjs -e "const fs=require('fs');for(const p of ['node_modules','<lockfile>'])fs.rmSync(p,{recursive:true,force:true})"`
and its `bun -e` equivalent. The path list is why the delete is one step rather than
two: a single spelling removes the tree and the lockfile together, so a failed delete
leaves neither behind. See
[managers.md](managers.md#the-node-lane-always-needs-refresh).

Owned paths are deliberately **not** in the file. They are derived at run time from
`git status --porcelain` before and after the run, which is what makes rollback
exact even when a command creates a lockfile that did not exist before.

