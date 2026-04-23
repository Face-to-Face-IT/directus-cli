# Filters, Output, and Pagination

## Output Formats

Add `--format <format>` (`-f`) to any command:

| Format  | Description           |
| ------- | --------------------- |
| `json`  | JSON output (default) |
| `table` | Human-readable table  |
| `yaml`  | YAML output           |

```bash
# JSON (default) — output is wrapped: {"data": [...], "meta": {...}}
directus-cli users list

# Table for human reading
directus-cli users list -f table

# YAML
directus-cli users list -f yaml

# Pipe JSON to jq (extract from .data wrapper)
directus-cli users list | jq '.data[].email'

# Use --quiet for raw data without the wrapper (ideal for piping)
directus-cli users list --quiet | jq '.[].email'
```

## Filter Syntax

### Simple Equality

```bash
directus-cli items list posts --filter status=published
```

### Not Equal

```bash
directus-cli items list posts --filter 'status!=draft'
```

### Multiple Filters (AND Logic)

```bash
directus-cli items list posts --filter status=published --filter featured=true
```

### JSON Filter (Complex Queries)

Use Directus filter operators in JSON:

```bash
# Greater than
directus-cli items list posts --filter '{"date_created":{"_gt":"2024-01-01"}}'

# Contains
directus-cli items list posts --filter '{"title":{"_contains":"hello"}}'

# In list
directus-cli items list posts --filter '{"status":{"_in":["published","review"]}}'

# Null check
directus-cli items list posts --filter '{"published_date":{"_nnull":true}}'

# Nested / relational
directus-cli items list posts --filter '{"author":{"email":{"_eq":"admin@example.com"}}}'
```

### Common Directus Filter Operators

| Operator       | Description           |
| -------------- | --------------------- |
| `_eq`          | Equal                 |
| `_neq`         | Not equal             |
| `_gt`          | Greater than          |
| `_gte`         | Greater than or equal |
| `_lt`          | Less than             |
| `_lte`         | Less than or equal    |
| `_in`          | In array              |
| `_nin`         | Not in array          |
| `_contains`    | Contains substring    |
| `_ncontains`   | Does not contain      |
| `_starts_with` | Starts with           |
| `_ends_with`   | Ends with             |
| `_null`        | Is null               |
| `_nnull`       | Is not null           |
| `_between`     | Between two values    |
| `_empty`       | Is empty              |
| `_nempty`      | Is not empty          |

## Sorting

```bash
# Ascending (default)
directus-cli items list posts --sort date_created

# Descending (prefix with -)
directus-cli items list posts --sort -date_created

# Multiple sort fields
directus-cli items list posts --sort status --sort -date_created
```

## Pagination

```bash
# Limit results
directus-cli items list posts --limit 10

# Offset (skip first N)
directus-cli items list posts --limit 10 --offset 20
```

## Field Selection

```bash
# Select specific fields
directus-cli users list --fields id,email,first_name,last_name

# Relational fields
directus-cli items list posts --fields id,title,author.email
```

## Search

```bash
# Full-text search
directus-cli items list posts --search "hello world"
```
