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
  "version": 2,
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
          "default": "nub exec taze -w --no-interactive --no-node-version --no-github-actions",
          "patch": "nub exec taze patch -w --no-interactive --no-node-version --no-github-actions",
          "minor": "nub exec taze minor -w --no-interactive --no-node-version --no-github-actions",
          "major": "nub exec taze major -w --no-interactive --no-node-version --no-github-actions"
        },
        "refresh": "rm -rf node_modules && nub install && nub dedupe"
      }
    }
  ]
}
```

The `mise` record has two keys and the `nub` record has four — that difference *is*
the degradation. Nothing else in the file encodes it.

| Field | Meaning |
|---|---|
| `version` | Schema version. Currently `2`. **A mismatch with what the skill expects means regenerate**, not migrate — the `bump` map's meaning changed at `1` → `2`, when it stopped being a fallback under a separate `engine` field and became the commands that actually run. |
| `verify` | Reminder text shown to the user after the run. **The agent never runs it** — the user runs the main flow. Step 6 may reproduce a failure, but that is diagnosis of a break, not this verification. |
| `managers` | Ordered array; a `name` appears at most once. Order is the order the report and the commits use. |
| `kind` | `toolchain` or `package`. |
| `detect` | Signals; **any** match means the manager is present. `key=value` matches a literal in the file named by the key (`packageManager=nub` reads `package.json`). |
| `commands` | **Omit entirely to mark a manager detected but not supported.** It shows as `skipped (out of support matrix)` and is never attempted. |
| `note` | Optional free text. Explains an unsupported record, a project-scoping flag that looks redundant but is not, or anything else the user should see in the plan. |
| `commands.check` | Read-only. Used to build the report and to detect an already-current tree. |
| `commands.bump` | **The commands that actually run.** Mode-keyed: `default` is required, and **a missing key is the degradation** — the manager has no such lane. There is no override field and nothing to expand at run time. |
| `commands.refresh` | **Include only when `bump` leaves the resolved state stale.** Makes the installed tree agree with the manifest, so that the user's verification exercises the bumped versions rather than the old ones. Omit it where `bump` already settles the tree. |

**Every command must be scoped to the project.** Where a tool defaults to
machine-wide behaviour, pass its scoping flag — `mise --local` is the example that
matters most in practice. A bump of this project must not reach outside it.

Owned paths are deliberately **not** in the file. They are derived at run time from
`git status --porcelain` before and after the run, which is what makes rollback
exact even when a command creates a lockfile that did not exist before.

