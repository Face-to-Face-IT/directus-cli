# Directus CLI

CLI client for the Directus API — manage items, schema, auth, and more from the command line.

[![Version](https://img.shields.io/npm/v/@face-to-face-it/directus-cli)](https://www.npmjs.com/package/@face-to-face-it/directus-cli)
[![License](https://img.shields.io/npm/l/@face-to-face-it/directus-cli)](LICENSE)

## Features

- **Full CRUD operations** — Users, roles, collections, items, files, folders, flows, and more
- **Schema management** — Snapshot, diff, and apply schema changes
- **Bulk operations** — Export and import data in JSON, CSV, XML, YAML formats
- **Multi-profile support** — Manage multiple Directus instances with ease
- **Automation ready** — Perfect for CI/CD pipelines and scripts
- **Type-safe** — Built with TypeScript and the official Directus SDK

## Installation

### Global Installation (Recommended)

```bash
npm install -g @face-to-face-it/directus-cli
# or
pnpm add -g @face-to-face-it/directus-cli
```

### Local Project Installation

```bash
npm install --save-dev @face-to-face-it/directus-cli
# or
pnpm add -D @face-to-face-it/directus-cli
```

### Using npx (No Installation)

```bash
npx @face-to-face-it/directus-cli <command>
```

## Quick Start

### 1. Authenticate

```bash
# Login with email/password
directus-cli auth login https://your-directus.com --email admin@example.com --password secret

# Or use a static token
directus-cli auth login https://your-directus.com --token your-static-token
```

### 2. Save a Profile (Optional but Recommended)

```bash
# Save the current connection as a profile
directus-cli profile add production https://your-directus.com --default

# Now you can use --profile instead of typing the URL
directus-cli users list --profile production
```

### 3. Start Using Commands

```bash
# List all users
directus-cli users list

# Create a collection
directus-cli collections create articles --note "Blog posts"

# Add a field to the collection
directus-cli fields create articles title --type string --required

# Create an item
directus-cli items create articles '{"title": "Hello World"}'

# Upload a file
directus-cli files upload ./image.png --folder my-folder

# Export data
directus-cli bulk export articles --format json --output articles.json
```

## Commands Reference

### Authentication & Profiles

| Command                    | Description                               |
| -------------------------- | ----------------------------------------- |
| `auth login <url>`         | Authenticate with email/password or token |
| `auth logout`              | Logout and invalidate session             |
| `auth refresh`             | Refresh access token                      |
| `auth status`              | Check authentication status               |
| `profile add <name> <url>` | Add a connection profile                  |
| `profile list`             | List saved profiles                       |
| `profile use <name>`       | Set default profile                       |
| `profile remove <name>`    | Remove a profile                          |

### Users & Permissions

| Command                  | Description                         |
| ------------------------ | ----------------------------------- |
| `users list`             | List all users                      |
| `users get <id>`         | Get user by ID                      |
| `users create <email>`   | Create a new user                   |
| `users update <id>`      | Update a user                       |
| `users delete <id>`      | Delete a user                       |
| `roles list`             | List all roles                      |
| `roles create <name>`    | Create a role                       |
| `roles update <id>`      | Update a role                       |
| `roles delete <id>`      | Delete a role                       |
| `policies list`          | List access policies (Directus 11+) |
| `policies create <name>` | Create a policy                     |
| `policies update <id>`   | Update a policy                     |
| `policies delete <id>`   | Delete a policy                     |
| `permissions list`       | List permissions                    |

### Collections & Fields

| Command                              | Description                                   |
| ------------------------------------ | --------------------------------------------- |
| `collections list`                   | List all collections                          |
| `collections get <name>`             | Get collection details                        |
| `collections create <name>`          | Create a collection                           |
| `collections update <name>`          | Update a collection                           |
| `collections delete <name>`          | Delete a collection                           |
| `fields list`                        | List fields (optionally filter by collection) |
| `fields get <collection> <field>`    | Get field details                             |
| `fields create <collection> <field>` | Create a field                                |
| `fields update <collection> <field>` | Update a field                                |
| `fields delete <collection> <field>` | Delete a field                                |

### Items

| Command                                 | Description                           |
| --------------------------------------- | ------------------------------------- |
| `items list <collection>`               | List items with filtering and sorting |
| `items get <collection> <id>`           | Get a single item                     |
| `items create <collection> <data>`      | Create an item                        |
| `items update <collection> <id> <data>` | Update an item                        |
| `items delete <collection> <id>`        | Delete an item                        |

### Files & Folders

| Command                 | Description               |
| ----------------------- | ------------------------- |
| `files list`            | List files in the library |
| `files download <id>`   | Download a file           |
| `files upload <path>`   | Upload a file             |
| `folders list`          | List folders              |
| `folders get <id>`      | Get folder details        |
| `folders create <name>` | Create a folder           |
| `folders update <id>`   | Update a folder           |
| `folders delete <id>`   | Delete a folder           |

### Flows & Operations (Automation)

| Command                           | Description           |
| --------------------------------- | --------------------- |
| `flows list`                      | List flows            |
| `flows get <id>`                  | Get flow details      |
| `flows create <name>`             | Create a flow         |
| `flows update <id>`               | Update a flow         |
| `flows delete <id>`               | Delete a flow         |
| `flows trigger <id>`              | Trigger a manual flow |
| `operations list`                 | List operations       |
| `operations get <id>`             | Get operation details |
| `operations create <flow> <type>` | Create an operation   |
| `operations update <id>`          | Update an operation   |
| `operations delete <id>`          | Delete an operation   |

### Schema Management

| Command                | Description                          |
| ---------------------- | ------------------------------------ |
| `schema snapshot`      | Export schema to file                |
| `schema diff <file>`   | Compare schema with current instance |
| `schema apply <file>`  | Apply schema from file               |
| `collections snapshot` | Alias for schema snapshot            |

### Dashboards & Panels (Analytics)

| Command                                   | Description           |
| ----------------------------------------- | --------------------- |
| `dashboards list`                         | List dashboards       |
| `dashboards get <id>`                     | Get dashboard details |
| `dashboards create <name>`                | Create a dashboard    |
| `dashboards update <id>`                  | Update a dashboard    |
| `dashboards delete <id>`                  | Delete a dashboard    |
| `panels list`                             | List panels           |
| `panels get <id>`                         | Get panel details     |
| `panels create <dashboard> <name> <type>` | Create a panel        |
| `panels update <id>`                      | Update a panel        |
| `panels delete <id>`                      | Delete a panel        |

### Relations

| Command                                 | Description          |
| --------------------------------------- | -------------------- |
| `relations list`                        | List all relations   |
| `relations get <collection> <field>`    | Get relation details |
| `relations create <collection> <field>` | Create a relation    |
| `relations update <collection> <field>` | Update a relation    |
| `relations delete <collection> <field>` | Delete a relation    |

### Settings & Presets

| Command                       | Description            |
| ----------------------------- | ---------------------- |
| `settings get`                | Get instance settings  |
| `settings update`             | Update settings        |
| `presets list`                | List presets/bookmarks |
| `presets get <id>`            | Get preset             |
| `presets create <collection>` | Create a preset        |
| `presets update <id>`         | Update a preset        |
| `presets delete <id>`         | Delete a preset        |

### Bulk Operations

| Command                           | Description                 |
| --------------------------------- | --------------------------- |
| `bulk export <collection>`        | Export data to file library |
| `bulk import <collection> <file>` | Import data from file       |

### Server & Activity

| Command          | Description               |
| ---------------- | ------------------------- |
| `server ping`    | Check server connectivity |
| `server info`    | Get server information    |
| `activity list`  | List activity log         |
| `revisions list` | List revisions            |

## Global Flags

These flags work with any command:

| Flag                | Description                                               |
| ------------------- | --------------------------------------------------------- |
| `--profile <name>`  | Use a saved profile                                       |
| `--url <url>`       | Directus instance URL                                     |
| `--token <token>`   | Static access token                                       |
| `--format <format>` | Output format: `table`, `json`, `yaml` (default: `table`) |
| `--verbose`         | Enable verbose output                                     |
| `-h, --help`        | Show help                                                 |

## Usage Examples

### Filtering and Sorting

```bash
# Filter users by role
directus-cli users list --filter role=admin

# Filter with multiple conditions (AND)
directus-cli items list articles --filter status=published --filter featured=true

# Filter with JSON syntax
directus-cli items list articles --filter '{"date_created":{"_gt":"2024-01-01"}}'

# Sort results
directus-cli users list --sort -date_created  # Descending

# Limit and offset (pagination)
directus-cli items list articles --limit 10 --offset 20

# Select specific fields
directus-cli users list --fields id,email,first_name,last_name
```

### Working with JSON Data

```bash
# Create item with inline JSON
directus-cli items create articles '{"title":"Hello","body":"World"}'

# Update specific fields
directus-cli items update articles 123 '{"title":"Updated"}'

# Use --file to read data from file
directus-cli items create articles --file ./article.json
```

### Schema Workflows

```bash
# Export current schema
directus-cli schema snapshot --output ./schema.yaml

# Review changes
directus-cli schema diff ./schema.yaml

# Apply schema (be careful!)
directus-cli schema apply ./schema.yaml --yes
```

### Batch Operations

```bash
# Export all published articles to JSON
directus-cli bulk export articles --format json --filter '{"status":{"_eq":"published"}}'

# Import data from CSV
directus-cli bulk import articles ./data.csv
```

## Configuration

### Profiles

Profiles store connection settings for different Directus instances:

```bash
# Add a production profile
directus-cli profile add production https://api.example.com \
  --token $PROD_TOKEN \
  --default

# Add a development profile
directus-cli profile add dev http://localhost:8055 \
  --token $DEV_TOKEN

# Switch profiles
directus-cli users list --profile dev
```

### Environment Variables

The CLI respects these environment variables:

| Variable            | Description                  |
| ------------------- | ---------------------------- |
| `DIRECTUS_URL`      | Default URL if not specified |
| `DIRECTUS_TOKEN`    | Default static token         |
| `DIRECTUS_EMAIL`    | Default login email          |
| `DIRECTUS_PASSWORD` | Default login password       |

## Troubleshooting

### Connection Issues

```bash
# Test connectivity
directus-cli server ping --url https://your-directus.com

# Check server info
directus-cli server info --url https://your-directus.com
```

### Authentication Problems

```bash
# Check current status
directus-cli auth status

# Refresh token if expired
directus-cli auth refresh

# Re-login if needed
directus-cli auth logout
directus-cli auth login https://your-directus.com --email user@example.com
```

### Verbose Output

Add `--verbose` to any command for detailed debugging:

```bash
directus-cli users list --profile production --verbose
```

## Development

### Building from Source

```bash
# Clone the repository
git clone https://github.com/Face-to-Face-IT/directus-cli.git
cd directus-cli

# Install dependencies
pnpm install

# Build
pnpm build

# Run locally
./bin/dev.js users list --url http://localhost:8055
```

### Running Tests

```bash
pnpm test
```

## Requirements

- **Node.js**: >= 20.0.0
- **Directus**: >= 10.0.0 (most features), >= 11.0.0 (for policies)

## License

MIT © Face-to-Face IT

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## Support

- [GitHub Issues](https://github.com/Face-to-Face-IT/directus-cli/issues)
- [Directus Documentation](https://docs.directus.io/)
