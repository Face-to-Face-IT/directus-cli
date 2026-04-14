# Directus CLI — Implementation Plan

## Overview

A standalone CLI client for the Directus REST API, built with oclif v4, TypeScript (strict), and `@directus/sdk`. Works against any Directus instance over HTTP — no dependency on the Face-to-Face Directus fork.

**Package**: `@face-to-face-it/directus-cli`
**Binary**: `directus-cli`
**Location**: `repos/directus-cli`

---

## 1. Repository Setup

**Stack**: oclif v4, TypeScript (ES2022/NodeNext, strict mode), pnpm, ESM, vitest

```
directus-cli/
├── bin/
│   ├── run.js              # ESM entrypoint
│   └── dev.js              # Dev entrypoint (tsx)
├── src/
│   ├── commands/           # oclif filesystem-routed commands
│   │   ├── profile/        # Profile management
│   │   ├── auth/           # Authentication
│   │   ├── items/          # Items CRUD
│   │   ├── schema/         # Schema snapshot/diff/apply
│   │   └── server/         # Server health/info
│   ├── lib/                # Shared utilities
│   │   ├── config.ts       # Profile/config persistence (~/.config/directus-cli/)
│   │   ├── client.ts       # SDK client wrapper (Bottleneck rate-limit, retry, error handling)
│   │   ├── auth.ts         # Auth helpers (login, token refresh, resolution)
│   │   ├── output.ts       # Output formatting (JSON, table, YAML)
│   │   └── filter.ts       # Filter expression parser (shorthand + raw JSON)
│   ├── flags/              # Shared oclif flag definitions
│   │   └── global.ts       # --profile, --url, --token, --format, --verbose
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts
│   └── base-command.ts     # Abstract base command (auth resolution, output helpers)
├── test/
│   └── commands/           # Mirrors src/commands structure
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── .gitignore
├── .prettierrc
└── PLAN.md                 # This file
```

### Key Dependencies

| Package | Purpose |
|---------|---------|
| `@directus/sdk` ^21 | HTTP client — typed REST commands for all resources |
| `@oclif/core` ^4 | CLI framework — filesystem routing, flags, help |
| `@oclif/plugin-help` | Built-in `--help` |
| `@oclif/plugin-autocomplete` | Shell completions (bash/zsh/fish) |
| `@oclif/test` ^4 | Test harness |
| `bottleneck` | Rate limiting for SDK requests |
| `cli-table3` | Table output formatting |
| `yaml` | YAML output formatting |
| `vitest` | Test framework |

### TypeScript Config

Strict mode with `noUncheckedIndexedAccess`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "isolatedModules": true
  }
}
```

---

## 2. Architecture

### Core Design

The CLI is a **remote HTTP client**. Two layers:

```
┌─────────────────────────────────────────┐
│  oclif Command Layer                     │
│  (commands/, flags/, output formatting)  │
├─────────────────────────────────────────┤
│  Client Layer                            │
│  (@directus/sdk, auth, profile mgmt)     │
└──────────────┬──────────────────────────┘
               │ HTTP
               ▼
         Directus Instance
```

### SDK as HTTP Layer

The `@directus/sdk` has typed REST commands for every resource. CLI commands are thin wrappers:

1. Parse oclif flags/args into SDK parameters
2. Call `client.request(sdkCommand(...))`
3. Format response (JSON/table/YAML)

Example flow for `directus-cli items list posts --fields id,title --limit 10`:

```
oclif parses → { collection: 'posts', fields: ['id','title'], limit: 10 }
      ↓
SDK call → client.request(readItems('posts', { fields: ['id','title'], limit: 10 }))
      ↓
Format → table output or JSON.stringify(result)
```

### OpenAPI Spec Role

`@directus/specs` is used for validation and documentation — NOT for HTTP calls. The SDK handles all HTTP. The runtime spec endpoint (`GET /server/specs/oas`) can be used in the future for shell completions on collection names.

### SDK Client Wrapper (`src/lib/client.ts`)

Reuses patterns from `directus-template-cli`:
- Singleton client class wrapping `@directus/sdk` (`createDirectus`, `rest()`, `authentication()`)
- Rate limiting via `Bottleneck` (10 concurrent, 50 req/s reservoir)
- Retry logic with exponential backoff (3 retries for 429/503/ECONNREFUSED, no retry on 400/401)
- Custom error class `DirectusCliError` that parses JSON error bodies from the Directus API

---

## 3. Profile & Config Management

### Config File

Stored at `~/.config/directus-cli/config.json` (XDG convention via oclif's `this.config.configDir`):

```json
{
  "defaultProfile": "dev",
  "profiles": {
    "dev": {
      "url": "https://dev.example.com",
      "token": "static-token-here"
    },
    "prod": {
      "url": "https://prod.example.com",
      "accessToken": "...",
      "refreshToken": "...",
      "expiresAt": 1700000000000
    }
  }
}
```

### Auth Modes

| Mode | How | Storage | Use Case |
|------|-----|---------|----------|
| **Static token** | `--token` flag or `DIRECTUS_TOKEN` env | Profile config or env | CI/CD, scripts |
| **Login** | `directus-cli auth login` with email/password | Tokens stored in profile config | Interactive dev use |

### Resolution Priority

Flags/env override profile config:
1. `--url` flag or `DIRECTUS_URL` env
2. `--token` flag or `DIRECTUS_TOKEN` env
3. Profile config (from `--profile` or default profile)

---

## 4. Global Flags

Every command inherits these:

| Flag | Short | Env | Description |
|------|-------|-----|-------------|
| `--profile` | `-p` | `DIRECTUS_PROFILE` | Named profile from config |
| `--url` | | `DIRECTUS_URL` | Instance URL (overrides profile) |
| `--token` | `-t` | `DIRECTUS_TOKEN` | Static token (overrides profile) |
| `--format` | `-f` | | Output format: `json` (default), `table`, `yaml` |
| `--verbose` | `-v` | | Verbose output (request/response logging) |

---

## 5. Command Structure (v0.1 Scope)

### `profile` — Manage connection profiles

| Command | Description | SDK/API |
|---------|-------------|---------|
| `profile add <name>` | Add a new named profile | Local config only |
| `profile list` | List configured profiles | Local config only |
| `profile remove <name>` | Remove a profile | Local config only |
| `profile use <name>` | Set default profile | Local config only |

### `auth` — Authentication

| Command | Description | SDK Command |
|---------|-------------|-------------|
| `auth login` | Login with email/password, store tokens | `login()` → `POST /auth/login` |
| `auth logout` | Invalidate current session | `logout()` → `POST /auth/logout` |
| `auth refresh` | Refresh access token | `refresh()` → `POST /auth/refresh` |
| `auth status` | Show current auth status (who am I) | `readMe()` → `GET /users/me` |

### `items` — CRUD on collection items

| Command | Description | SDK Command |
|---------|-------------|-------------|
| `items list <collection>` | List items | `readItems()` → `GET /items/{collection}` |
| `items get <collection> <id>` | Get single item | `readItem()` → `GET /items/{collection}/{id}` |
| `items create <collection>` | Create item(s) | `createItem()`/`createItems()` → `POST /items/{collection}` |
| `items update <collection> <id>` | Update item(s) | `updateItem()` → `PATCH /items/{collection}/{id}` |
| `items delete <collection> <id>` | Delete item(s) | `deleteItem()` → `DELETE /items/{collection}/{id}` |

#### Items Flags

| Flag | Commands | Description |
|------|----------|-------------|
| `--fields` | list, get, create, update | Comma-separated field list |
| `--filter` | list | JSON filter or shorthand (`status=published`) |
| `--sort` | list | Sort fields (`-date_created,title`) |
| `--limit` | list | Max items (default: 100) |
| `--offset` | list | Pagination offset |
| `--search` | list | Full-text search |
| `--page` | list | Page number |
| `--meta` | list | Include metadata (`total_count`, `filter_count`) |
| `--data` | create, update | JSON string of item data |
| `--file` | create, update | Path to JSON file with item data |

#### Filter Shorthand Syntax

The `--filter` flag supports both raw JSON and a shorthand:

```bash
# Raw JSON
--filter '{"status":{"_eq":"published"}}'

# Shorthand: field=value (implies _eq)
--filter status=published

# Shorthand: field!=value (implies _neq)
--filter status!=draft

# Multiple filters (AND)
--filter status=published --filter category=news
```

### `schema` — Schema management

| Command | Description | SDK Command |
|---------|-------------|-------------|
| `schema snapshot` | Export schema snapshot | `schemaSnapshot()` → `GET /schema/snapshot` |
| `schema diff <path>` | Compare snapshot against instance | `schemaDiff()` → `POST /schema/diff` |
| `schema apply <path>` | Apply a schema diff/snapshot | `schemaDiff()` + `schemaApply()` |

#### Schema Apply Workflow

1. Read snapshot from file (JSON or YAML)
2. Call `schemaDiff(snapshot, force)` to compute diff
3. If `--dry-run`, display diff and exit
4. Prompt for confirmation (unless `--yes`)
5. Call `schemaApply(diff)`

#### Schema Flags

| Flag | Commands | Description |
|------|----------|-------------|
| `--output`, `-o` | snapshot | Write to file path (default: stdout) |
| `--dry-run` | apply | Show diff without applying |
| `--force` | diff, apply | Bypass version/vendor checks |
| `--yes`, `-y` | apply | Skip confirmation prompt |

### `server` — Server health and info

| Command | Description | SDK/API |
|---------|-------------|---------|
| `server ping` | Health check | `serverPing()` → `GET /server/ping` |
| `server info` | Server info | `serverInfo()` → `GET /server/info` |

---

## 6. Output Formatting

All data-returning commands support `--format json|table|yaml`.

### JSON (default)
```json
{
  "data": [...],
  "meta": { "total_count": 42, "filter_count": 10 }
}
```

### Table
```
 ID  Title              Status     Created
 1   First Post         published  2026-04-01
 2   Draft Article      draft      2026-04-10
 ...
Total: 42 items (showing 10)
```

Uses `cli-table3`. Columns auto-derived from `--fields` or the response shape.

### YAML
```yaml
data:
  - id: 1
    title: First Post
    status: published
```

### Implementation

Shared `formatOutput(data, flags)` in `src/lib/output.ts`. The `BaseCommand` class provides `this.outputFormatted(data, meta)` that delegates to it.

---

## 7. Base Command Class

`src/base-command.ts` extends `@oclif/core`'s `Command`:

- Declares global flags (`--profile`, `--url`, `--token`, `--format`, `--verbose`)
- `resolveConnection()` — resolves URL + token from flags/env/profile
- `getClient()` — returns configured SDK client (with auth, rate limiting)
- `outputFormatted(data, meta?)` — formats and prints response using `--format`
- Error handling: catches `DirectusCliError`, formats API errors cleanly

---

## 8. Testing Strategy

### Framework: vitest

### Unit Tests
- Mock `client.request()` — don't hit real instances
- Test each command's flag parsing, SDK call construction, output formatting
- Test filter shorthand parser independently
- Test config read/write operations
- Structure: `test/commands/items/list.test.ts` mirrors source

### Integration Tests (future)
- Use `directus-sandbox` Docker Compose to spin up a real instance
- Run items CRUD, schema snapshot/apply against it
- Optional CI `services` container

### Test Example

```typescript
import { runCommand } from '@oclif/test';
import { vi } from 'vitest';

describe('items list', () => {
  it('lists items in a collection', async () => {
    // Mock SDK client
    vi.spyOn(client, 'request').mockResolvedValue([
      { id: 1, title: 'Post 1' },
      { id: 2, title: 'Post 2' },
    ]);

    const { stdout } = await runCommand([
      'items', 'list', 'posts', '--format', 'json',
      '--url', 'http://localhost:8055', '--token', 'test-token',
    ]);

    const result = JSON.parse(stdout);
    expect(result.data).toHaveLength(2);
  });
});
```

---

## 9. CI/CD & Distribution

### GitHub Actions

Reuse shared workflows from `Face-to-Face-IT/.github`:
- **CI**: `node-ci.yml` — lint, typecheck, test on PR
- **Release**: release-please with conventional commits
- **Publish**: npm publish to GitHub Packages on release

### Release Strategy

- Conventional commits with commitlint
- release-please auto-generates changelogs and version bumps
- Published to `npm.pkg.github.com` as `@face-to-face-it/directus-cli`

### Distribution

- **Phase 1**: `npm install -g @face-to-face-it/directus-cli` (requires Node.js)
- **Phase 2** (future): Standalone binaries via `pkg` or `bun build --compile`

---

## 10. Future Roadmap (post v0.1)

| Phase | Commands | Notes |
|-------|----------|-------|
| **v0.2** | `users`, `roles`, `permissions`, `policies` | Admin management |
| **v0.3** | `files`, `folders`, `assets` | File management with upload/download |
| **v0.4** | `flows`, `operations` | Automation management |
| **v0.5** | `collections`, `fields`, `relations` | Schema introspection (read-only) |
| **v1.0** | All 23 API groups from the OpenAPI spec | Full API parity |
| **Future** | Plugin system for tenant-specific extensions | oclif native plugin architecture |
| **Future** | Runtime spec discovery + collection shell completions | Fetch `/server/specs/oas`, cache locally |
| **Future** | `--watch` mode for items via WebSocket subscriptions | Real-time |
| **Future** | OpenAPI codegen for command scaffolding | Auto-generate command stubs from spec |

---

## 11. Reference: SDK Command Patterns

Every SDK command is a thunk: `sdkCommand(params)` returns a `RestCommand<Output, Schema>` which is a zero-arg callable returning `{ path, method, params?, body? }`.

```typescript
// Usage pattern in CLI commands:
const client = createDirectus<Schema>(url).with(rest()).with(authentication('json'));
const result = await client.request(readItems('posts', { fields: ['id', 'title'], limit: 10 }));
```

### Items SDK Commands

| SDK Function | HTTP | Notes |
|-------------|------|-------|
| `readItems(collection, query?)` | `GET /items/{collection}` | Query: fields, filter, sort, limit, offset, search, page |
| `readItem(collection, key, query?)` | `GET /items/{collection}/{key}` | Single item by PK |
| `createItem(collection, item, query?)` | `POST /items/{collection}` | Returns created item |
| `createItems(collection, items[], query?)` | `POST /items/{collection}` | Bulk create |
| `updateItem(collection, key, item, query?)` | `PATCH /items/{collection}/{key}` | Partial update |
| `updateItems(collection, keysOrQuery, item, query?)` | `PATCH /items/{collection}` | Bulk update by keys or filter |
| `deleteItem(collection, key)` | `DELETE /items/{collection}/{key}` | Returns void |
| `deleteItems(collection, keysOrQuery)` | `DELETE /items/{collection}` | Bulk delete |

### Schema SDK Commands

| SDK Function | HTTP | Notes |
|-------------|------|-------|
| `schemaSnapshot()` | `GET /schema/snapshot` | Returns full schema (collections, fields, relations) |
| `schemaDiff(snapshot, force?)` | `POST /schema/diff` | Returns `{ hash, diff }` |
| `schemaApply(diff)` | `POST /schema/apply` | Applies diff, returns void |

### Auth SDK Commands

| SDK Function | HTTP | Notes |
|-------------|------|-------|
| `login(payload, options?)` | `POST /auth/login` | Returns `{ access_token, refresh_token, expires }` |
| `refresh(options?)` | `POST /auth/refresh` | Returns new tokens |
| `logout(options?)` | `POST /auth/logout` | Invalidates session |
| `readMe(query?)` | `GET /users/me` | Returns current user |
