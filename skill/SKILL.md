---
name: directus-cli
description: Use for managing Directus CMS instances from the command line with `directus-cli`. Triggers include Directus collection/field/item CRUD, user/role/policy management, schema snapshots and migrations, file uploads/downloads, bulk import/export, flow automation, dashboard/panel management, and Directus API operations.
---

# Directus CLI

Use `directus-cli` to manage Directus CMS instances from the terminal. Wraps the Directus SDK with rate limiting, retry logic, and multi-profile support.

## Workflow

1. Install `directus-cli` (npm global, local, or npx). Read `references/install.md`.
2. Authenticate (email/password login, static token, or profile).
3. Discover commands via `directus-cli <topic> --help`.
4. Use `--format json` for automation; pipe to `jq` for extraction.
5. Use `--yes` to skip confirmations in scripts.
6. Use profiles to manage multiple Directus instances.

## Decision Tree

### Connect to Directus

```
How to authenticate?
  Quick one-off:
    - Static token: directus-cli <cmd> --url <url> --token <token>
    - Env vars: DIRECTUS_URL + DIRECTUS_TOKEN
  Interactive login:
    - Email/password: directus-cli auth login --email <email> --password <password> --url <url>
  Non-interactive / CI / agent login:
    - Pipe password via stdin (no shell history / process list exposure):
      echo "$PASSWORD" | directus-cli auth login --email <email> --password-stdin --url <url>
  Persistent (recommended):
    - Save profile: directus-cli profile add <name> <url> --token <token> --default
    - Then use: directus-cli <cmd> --profile <name>

Token hygiene:
  - Access tokens refresh automatically on 401 when the profile has a refresh token (transparent to callers).
  - Tokens within 60 s of expiry refresh proactively before the request is made.
  - `auth refresh` reports a structured failure reason (missingProfile / missingRefreshToken / networkError / rejected / unknown) with per-reason actionable messages.
  - `auth status` emits structured output: auth kind, expiry, account info (id/email/role), classified errors (auth/network/unknown).
```

Read `references/auth.md` for exact commands.

### Choose the Right Command

```
What resource to manage?
  Data:
    - Collections/fields/relations: collections, fields, relations
    - Items (CRUD): items list/get/create/update/delete <collection>
    - Bulk data: bulk export/import <collection>
  Users & Access:
    - Users: users list/get/create/update/delete
    - Roles: roles list/get/create/update/delete
    - Policies (Directus 11+): policies list/get/create/update/delete
    - Permissions: permissions list
  Schema & Config:
    - Schema migrations: schema snapshot/diff/apply
    - Settings: settings get/update
    - Presets: presets list/get/create/update/delete
  Files:
    - Upload/download: files upload/download/list
    - Folders: folders list/get/create/update/delete
  Extensions:
    - List installed: extensions list
    - Enable/disable: extensions toggle <name> --enable/--disable
    - Search marketplace: extensions search [query]
    - Show metadata: extensions info <name|uuid|name@version>
    - Install: extensions install <name>[@version]
    - Uninstall: extensions uninstall <name>
    - Reinstall current pinned version: extensions reinstall <name>
    - Upgrade (non-atomic): extensions upgrade <name>[@version]
  Automation:
    - Flows: flows list/get/create/update/delete/trigger
    - Operations: operations list/get/create/update/delete
  Analytics:
    - Dashboards: dashboards list/get/create/update/delete
    - Panels: panels list/get/create/update/delete
  Monitoring:
    - Activity: activity list
    - Revisions: revisions list
    - Server: server ping, server info
```

Read `references/command-reference.md` for the full command table.

## Secrets Handling (Do This By Default)

- Never put tokens directly in command lines that may be logged.
- Prefer env vars (`DIRECTUS_TOKEN`) or profiles over inline `--token`.
- Never print tokens into logs, diffs, or chat transcripts.

## Command Discovery

```bash
directus-cli --help                    # Top-level topics
directus-cli <topic> --help            # Commands in a topic
directus-cli <topic> <command> --help  # Flags for a command
```

## Global Flags

| Flag                | Short | Description                                      |
| ------------------- | ----- | ------------------------------------------------ |
| `--format <format>` | `-f`  | Output: `json` (default), `table`, `yaml`        |
| `--profile <name>`  | `-p`  | Use a saved profile                              |
| `--url <url>`       |       | Directus instance URL (overrides profile)        |
| `--token <token>`   | `-t`  | Static access token (overrides profile)          |
| `--quiet`           | `-q`  | Suppress metadata/wrappers, output raw data only |
| `--verbose`         | `-v`  | Request/response debug logging                   |

> **Note:** `--yes` (`-y`) is available on destructive commands (delete, schema apply) to skip confirmation prompts. It is not a global flag.

## Key Patterns

```bash
# Filter items (simple equality, not-equal, or JSON syntax)
directus-cli items list posts --filter status=published
directus-cli items list posts --filter '{"date_created":{"_gt":"2024-01-01"}}'

# Sort, paginate, select fields
directus-cli items list posts --sort -date_created --limit 10 --offset 20 --fields id,title

# Pipe JSON output to jq (default JSON wraps data in {"data": [...]})
directus-cli users list --format json | jq '.data[].email'

# Use --quiet to get raw data without the wrapper
directus-cli users list --quiet | jq '.[].email'

# Bulk export/import
directus-cli bulk export articles --format json --output articles.json
directus-cli bulk import articles ./data.csv
```

Read `references/filters-and-output.md` for full filter syntax and output options.

## Common Gotchas

- **JSON output is wrapped:** Default `--format json` returns `{"data": [...], "meta": {...}}`. Use `jq '.data'` to extract the array, or use `--quiet` to get the raw array directly.
- **Policies vs Roles:** Directus 11+ uses policies for access control. Roles are for grouping users.
- **Schema apply is destructive:** Applying snapshots can delete data. Always backup first.
- **Relations require both collections:** Create collections before creating relations between them.
- **Default output is JSON**, not table. Use `--format table` for human-readable output.
- **Connection resolution order:** CLI flags > environment variables > saved profile.
- **Config location:** `~/.config/directus-cli/config.json` (XDG compliant).
- **`fields list` without `--collection`:** Returns all fields across all collections. Add `--collection <name>` to scope to one collection.
- **semantic-release edge case:** If a version already exists on npm but the GitHub Release is missing, the release workflow will fail with E403. Fix manually: `gh release create vX.Y.Z --title "vX.Y.Z" --notes "..."`
- **Extension name lives in `schema.name`:** `extensions list` flattens this for you (as of 0.3.2), but if you parse the raw API response, the human name is under `schema.name`, not top-level `name`. The top-level `name` field is commonly missing; fall back through `schema.name -> name -> id`.
- **Registry commands require a real name:** `extensions reinstall`/`upgrade`/`info` hit `/extensions/registry/extension/<name>` and reject row UUIDs. Pass the human name (e.g. `directus-extension-computed-values`), not the installed-row PK.

## Release Workflow (for maintainers)

The repo uses semantic-release with the following behavior:
- **Version determination:** Analyzes commits since last git tag using conventional commits
- **Publish target:** npm registry + GitHub Releases
- **No `@semantic-release/git` plugin:** Does NOT commit CHANGELOG.md or package.json version back to main (blocked by branch protection)

### Common release issues

| Issue | Cause | Fix |
|-------|-------|-----|
| E403 "cannot publish over previously published versions" | Version exists on npm from partial run, but no git tag exists | Manually create git tag + GitHub Release: `git tag vX.Y.Z && git push origin vX.Y.Z && gh release create vX.Y.Z ...` |
| "Changes must be made through a pull request" | `@semantic-release/git` trying to push commits to protected main | Plugin removed in PR #4, no longer applicable |
| Wrong version (e.g., 1.0.0 instead of 0.1.0) | Historical `BREAKING CHANGE:` footer in commits | Create `v0.0.0` tag on initial commit to anchor versioning |

## References

- `references/install.md` -- Installation methods
- `references/auth.md` -- Authentication, profiles, environment variables
- `references/command-reference.md` -- Full command table with args and flags
- `references/filters-and-output.md` -- Filter syntax, output formats, sorting, pagination
- `references/examples.md` -- End-to-end workflow examples

## Session Wrap-Up: Submit Improvements

At the end of every session working with directus-cli, **propose a PR** if any of the following were discovered:

1. **Documentation errors** -- typos, wrong flags, broken examples, outdated syntax
2. **Missing capabilities** -- commands that don't exist but should (check if SDK supports it)
3. **CLI bugs** -- crashes, wrong output format, auth issues, flag parsing problems
4. **UX friction** -- confusing error messages, missing `--yes` on destructive commands, inconsistent flag names
5. **SDK/CLI gaps** -- Directus SDK supports a feature but CLI doesn't expose it

### How to submit

```bash
# 1. Check if issue already exists
gh issue list --search "<keyword>"

# 2. Create a branch with conventional commit prefix
#    fix: for bugs/docs    feat: for new commands    ci: for workflow

# 3. Make minimal changes (one concern per PR)

# 4. Run full check: pnpm install && pnpm build && pnpm lint && pnpm test

# 5. Push and create PR with clear description of the problem + fix
```

### PR scope rules (from repo conventions)

- **Separate PRs by scope:** `fix:` PRs for bugs, `feat:` PRs for features. Don't combine.
- **No global formatting:** Run `eslint --fix` only on changed files. Never `pnpm format:fix` (touches 100+ files).
- **CI must pass:** build → lint → test (no prettier check in CI).
- **ESLint wins over Prettier:** The oclif stylistic config conflicts with prettier. Follow eslint.

### Quick gotcha reference (add to skill if discovered)

If you hit a new gotcha, append to the **Common Gotchas** section above with the format:

```
- **Short description:** Detailed explanation with workaround or fix.
```

This keeps the skill file auto-evolving with real usage patterns.
