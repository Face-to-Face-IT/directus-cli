# Authentication

## Connection Resolution Order

CLI flags > environment variables > saved profile (default profile if none specified).

## Methods

### 1. Email/Password Login

```bash
directus-cli auth login --email <email> --password <password>
# Or with explicit URL (overrides profile)
directus-cli auth login --email <email> --password <password> --url <url>
```

Stores access and refresh tokens in the active profile. Tokens auto-refresh on expiry
(see **Token Lifecycle** below).

#### Non-interactive login (`--password-stdin`)

For CI, agent workflows, and any context where the password must not appear in shell
history, process listings, or command transcripts, pipe it on stdin:

```bash
echo "$DIRECTUS_PASSWORD" | directus-cli auth login --email admin@example.com --password-stdin
cat ~/.secrets/directus-admin | directus-cli auth login --email admin@example.com --password-stdin --profile prod
```

- Mutually exclusive with `--password`.
- Errors with a clear message (instead of hanging on EOF) when stdin is a TTY.

### 2. Static Token

```bash
# Via flag
directus-cli <command> --url <url> --token <token>

# Via environment variables
export DIRECTUS_URL=https://your-directus.com
export DIRECTUS_TOKEN=your-static-token
```

### 3. Profiles (Recommended for Multi-Instance)

```bash
# Add a profile with static token
directus-cli profile add production https://api.example.com --token $PROD_TOKEN --default

# Add a profile and login with credentials
directus-cli profile add dev http://localhost:8055
directus-cli auth login --email admin@example.com --password secret --profile dev

# List profiles
directus-cli profile list

# Switch default profile
directus-cli profile use production

# Use a specific profile per command
directus-cli users list --profile dev

# Remove a profile
directus-cli profile remove old-instance
```

## Environment Variables

| Variable            | Description                   |
| ------------------- | ----------------------------- |
| `DIRECTUS_URL`      | Default Directus instance URL |
| `DIRECTUS_TOKEN`    | Default static access token   |
| `DIRECTUS_EMAIL`    | Default login email           |
| `DIRECTUS_PASSWORD` | Default login password        |
| `DIRECTUS_PROFILE`  | Default profile name          |

## Session Management

```bash
# Check current auth status (structured output)
directus-cli auth status
directus-cli auth status --profile prod

# Manually refresh tokens
directus-cli auth refresh
directus-cli auth refresh --profile prod

# Logout (invalidate session)
directus-cli auth logout
```

## Token Lifecycle

- **Transparent refresh on 401**: every SDK-backed command automatically refreshes
  the access token and retries the request once when a 401 is returned, provided the
  profile has a stored refresh token and the token is not a static PAT. No manual
  `auth refresh` required under normal operation.
- **Proactive refresh window**: tokens within 60 seconds of expiry are refreshed
  before the request is sent, protecting long-running commands from mid-flight
  expiries.
- **`auth refresh` failure reasons** (surfaced with per-reason actionable messages):
  - `missingProfile` — the named profile does not exist.
  - `missingRefreshToken` — no refresh token stored; log in again.
  - `networkError` — the server was unreachable.
  - `rejected` — the server rejected the refresh token (expired / revoked /
    password changed / logged out elsewhere).
  - `unknown` — any other error; details included in the message.
- **`auth status` output** includes: auth kind (`static` vs `oauth`), expiry,
  account info (id / email / role), and classified errors (`auth` / `network` /
  `unknown`) so scripts can distinguish "server unreachable" from "token rejected".

## Config File Location

Profiles are stored in `~/.config/directus-cli/config.json` (XDG_CONFIG_HOME compliant).
On POSIX systems the file is written with `0600` mode and the parent directory with
`0700` mode. No-op on Windows.
