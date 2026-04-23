# Command Reference

## Authentication & Profiles

| Command                    | Args                                                              | Description                   |
| -------------------------- | ----------------------------------------------------------------- | ----------------------------- |
| `auth login`               | `--email`, `--password` \| `--password-stdin`, `--url`, `--profile` | Authenticate with Directus    |
| `auth logout`              |                                                                   | Logout and invalidate session |
| `auth refresh`             | `--profile`                                                       | Refresh access token (reports a structured reason on failure: `missingProfile`, `missingRefreshToken`, `networkError`, `rejected`, `unknown`) |
| `auth status`              | `--profile`                                                       | Structured status: auth kind (`static`/`oauth`), expiry, account info, classified errors (`auth`/`network`/`unknown`) |
| `profile add <name> <url>` | `--token`, `--default`                                            | Add a connection profile      |
| `profile list`             |                                                                   | List saved profiles           |
| `profile use <name>`       |                                                                   | Set default profile           |
| `profile remove <name>`    |                                                                   | Remove a profile              |

**Non-interactive login**: prefer `--password-stdin` in CI / agent contexts to keep passwords out of shell history and process lists:

```bash
echo "$DIRECTUS_PASSWORD" | directus-cli auth login --email admin@example.com --password-stdin
```

`--password-stdin` is mutually exclusive with `--password` and errors out if stdin is a TTY (so it never hangs waiting for EOF).

**Transparent refresh**: every SDK-backed command automatically refreshes the access token on a 401 and retries once when the profile has a stored refresh token. Tokens within 60 s of expiry are refreshed proactively before the request is made.

## Collections & Fields

| Command                              | Args                   | Description                                    |
| ------------------------------------ | ---------------------- | ---------------------------------------------- |
| `collections list`                   | `--names-only`         | List all collections (full objects by default) |
| `collections get <name>`             |                        | Get collection details                         |
| `collections create <name>`          | `--note`               | Create a collection                            |
| `collections update <name>`          | `--note`               | Update a collection                            |
| `collections delete <name>`          | `--yes`                | Delete a collection                            |
| `fields list`                        | `--collection`         | List fields (all or by collection)             |
| `fields get <collection> <field>`    |                        | Get field details                              |
| `fields create <collection> <field>` | `--type`, `--required` | Create a field                                 |
| `fields update <collection> <field>` | `--type`, `--required` | Update a field                                 |
| `fields delete <collection> <field>` | `--yes`                | Delete a field                                 |

### Field Types

Common `--type` values: `string`, `text`, `integer`, `decimal`, `float`, `boolean`, `date`, `datetime`, `timestamp`, `json`, `uuid`, `csv`, `hash`, `bigInteger`.

## Items

| Command                                 | Args                                                                | Description                              |
| --------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------- |
| `items list <collection>`               | `--filter`, `--sort`, `--limit`, `--offset`, `--fields`, `--search` | List items                               |
| `items get <collection> <id>`           | `--fields`                                                          | Get a single item                        |
| `items create <collection> <data>`      | `--file`                                                            | Create an item (inline JSON or `--file`) |
| `items update <collection> <id> <data>` | `--file`                                                            | Update an item                           |
| `items delete <collection> <id>`        | `--yes`                                                             | Delete an item                           |

## Relations

| Command                                 | Args                             | Description          |
| --------------------------------------- | -------------------------------- | -------------------- |
| `relations list`                        | `--collection`                   | List relations       |
| `relations get <collection> <field>`    |                                  | Get relation details |
| `relations create <collection> <field>` | `--related-collection`, `--type` | Create a relation    |
| `relations update <collection> <field>` |                                  | Update a relation    |
| `relations delete <collection> <field>` | `--yes`                          | Delete a relation    |

## Extensions

Installed-extension management:

| Command                    | Args                                | Description                    |
| -------------------------- | ----------------------------------- | ------------------------------ |
| `extensions list`          | `--type`, `--enabled`               | List installed extensions      |
| `extensions toggle <name>` | `--enable`, `--disable`, `--bundle` | Enable or disable an extension |

Marketplace registry management (admin-only; hits `/extensions/registry/*`):

| Command                        | Args                                                  | Description                                                |
| ------------------------------ | ----------------------------------------------------- | ---------------------------------------------------------- |
| `extensions search [query]`    | `--limit`, `--offset`, `--type`, `--sandbox`          | Search the marketplace registry                            |
| `extensions info <ext>`        |                                                       | Show metadata + version list (name, UUID, or `name@ver`)   |
| `extensions install <ext>`     | `<ext>` may be `name`, `uuid`, or `name@version`      | Install latest safe non-prerelease version (or pinned)     |
| `extensions uninstall <ext>`   | `--yes`                                               | Uninstall a registry-sourced extension                     |
| `extensions reinstall <ext>`   |                                                       | Re-download the currently pinned version                   |
| `extensions upgrade <ext>`     | `--yes`, optional `@version` suffix                   | Uninstall + reinstall (**non-atomic**; surfaces retry hint on partial failure) |

Notes:

- `install` / `upgrade` validate the requested version against the registry before the slow install step and reject `unsafe: true` versions up front.
- `uninstall` only targets extensions with `source === 'registry'` (server-enforced).
- `upgrade` is explicitly non-atomic: the extension is briefly unavailable between uninstall and install steps.
- All registry endpoints require an admin token; non-admin tokens surface as a standard `DirectusCliError`.

## Users & Access Control

| Command                  | Args                                                  | Description                  |
| ------------------------ | ----------------------------------------------------- | ---------------------------- |
| `users list`             | `--filter`, `--sort`, `--limit`, `--fields`           | List users                   |
| `users get <id>`         |                                                       | Get user details             |
| `users create <email>`   | `--password`, `--role`, `--first-name`, `--last-name` | Create a user                |
| `users update <id>`      | `--role`, `--email`, `--first-name`, `--last-name`    | Update a user                |
| `users delete <id>`      | `--yes`                                               | Delete a user                |
| `roles list`             |                                                       | List roles                   |
| `roles get <id>`         |                                                       | Get role details             |
| `roles create <name>`    | `--description`, `--admin-access`                     | Create a role                |
| `roles update <id>`      | `--name`, `--description`                             | Update a role                |
| `roles delete <id>`      | `--yes`                                               | Delete a role                |
| `policies list`          |                                                       | List policies (Directus 11+) |
| `policies get <id>`      |                                                       | Get policy details           |
| `policies create <name>` | `--description`, `--admin-access`                     | Create a policy              |
| `policies update <id>`   | `--name`, `--description`                             | Update a policy              |
| `policies delete <id>`   | `--yes`                                               | Delete a policy              |
| `permissions list`       | `--filter`                                            | List permissions             |

## Files & Folders

| Command                 | Args                                        | Description        |
| ----------------------- | ------------------------------------------- | ------------------ |
| `files list`            | `--folder`, `--filter`, `--sort`, `--limit` | List files         |
| `files upload <path>`   | `--folder`, `--title`, `--description`      | Upload a file      |
| `files download <id>`   | `--output`                                  | Download a file    |
| `folders list`          |                                             | List folders       |
| `folders get <id>`      |                                             | Get folder details |
| `folders create <name>` | `--parent`                                  | Create a folder    |
| `folders update <id>`   | `--name`, `--parent`                        | Update a folder    |
| `folders delete <id>`   | `--yes`                                     | Delete a folder    |

## Flows & Operations (Automation)

| Command                           | Args                                                  | Description           |
| --------------------------------- | ----------------------------------------------------- | --------------------- |
| `flows list`                      |                                                       | List flows            |
| `flows get <id>`                  |                                                       | Get flow details      |
| `flows create <name>`             | `--status`, `--trigger`, `--description`              | Create a flow         |
| `flows update <id>`               | `--name`, `--status`                                  | Update a flow         |
| `flows delete <id>`               | `--yes`                                               | Delete a flow         |
| `flows trigger <id>`              | `--data`                                              | Trigger a manual flow |
| `operations list`                 | `--flow`                                              | List operations       |
| `operations get <id>`             |                                                       | Get operation details |
| `operations create <flow> <type>` | `--name`, `--options`, `--position-x`, `--position-y` | Create an operation   |
| `operations update <id>`          | `--name`, `--options`                                 | Update an operation   |
| `operations delete <id>`          | `--yes`                                               | Delete an operation   |

## Schema Management

| Command               | Args                   | Description                                   |
| --------------------- | ---------------------- | --------------------------------------------- |
| `schema snapshot`     | `--output`, `--format` | Export schema to file (JSON or YAML)          |
| `schema diff <file>`  |                        | Compare schema snapshot with current instance |
| `schema apply <file>` | `--yes`                | Apply schema from snapshot file               |

## Dashboards & Panels (Analytics)

| Command                                   | Args                                                               | Description           |
| ----------------------------------------- | ------------------------------------------------------------------ | --------------------- |
| `dashboards list`                         |                                                                    | List dashboards       |
| `dashboards get <id>`                     |                                                                    | Get dashboard details |
| `dashboards create <name>`                | `--note`, `--icon`, `--color`                                      | Create a dashboard    |
| `dashboards update <id>`                  | `--name`, `--note`                                                 | Update a dashboard    |
| `dashboards delete <id>`                  | `--yes`                                                            | Delete a dashboard    |
| `panels list`                             | `--dashboard`                                                      | List panels           |
| `panels get <id>`                         |                                                                    | Get panel details     |
| `panels create <dashboard> <name> <type>` | `--options`, `--position-x`, `--position-y`, `--width`, `--height` | Create a panel        |
| `panels update <id>`                      | `--name`, `--options`                                              | Update a panel        |
| `panels delete <id>`                      | `--yes`                                                            | Delete a panel        |

## Settings & Presets

| Command                       | Args                                         | Description                  |
| ----------------------------- | -------------------------------------------- | ---------------------------- |
| `settings get`                |                                              | Get global instance settings |
| `settings update`             | `--data`                                     | Update instance settings     |
| `presets list`                |                                              | List presets/bookmarks       |
| `presets get <id>`            |                                              | Get a preset                 |
| `presets create <collection>` | `--name`, `--layout`, `--filter`, `--fields` | Create a preset              |
| `presets update <id>`         | `--name`, `--layout`                         | Update a preset              |
| `presets delete <id>`         | `--yes`                                      | Delete a preset              |

## Comments

| Command                | Args                                  | Description      |
| ---------------------- | ------------------------------------- | ---------------- |
| `comments list`        | `--filter`, `--sort`, `--limit`       | List comments    |
| `comments get <id>`    |                                       | Get a comment    |
| `comments create`      | `--collection`, `--item`, `--comment` | Create a comment |
| `comments update <id>` | `--comment`                           | Update a comment |
| `comments delete <id>` | `--yes`                               | Delete a comment |

## Bulk Operations

| Command                           | Args                                                                | Description                                  |
| --------------------------------- | ------------------------------------------------------------------- | -------------------------------------------- |
| `bulk export <collection>`        | `--format`, `--output`, `--filter`, `--fields`, `--sort`, `--limit` | Export data to file                          |
| `bulk import <collection> <file>` |                                                                     | Import data from file (JSON, CSV, XML, YAML) |

## Server & Activity

| Command          | Args                            | Description               |
| ---------------- | ------------------------------- | ------------------------- |
| `server ping`    |                                 | Check server connectivity |
| `server info`    |                                 | Get server information    |
| `activity list`  | `--filter`, `--sort`, `--limit` | List activity log entries |
| `revisions list` | `--filter`, `--sort`, `--limit` | List revisions            |
