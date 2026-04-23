# End-to-End Workflow Examples

## Set Up a Blog

```bash
# Authenticate
directus-cli auth login --url https://your-directus.com --email admin@example.com --password secret
directus-cli profile add blog https://your-directus.com --default

# Create collections
directus-cli collections create posts --note "Blog posts"
directus-cli collections create categories --note "Post categories"

# Add fields to posts
directus-cli fields create posts title --type string --required
directus-cli fields create posts slug --type string --required
directus-cli fields create posts content --type text
directus-cli fields create posts status --type string
directus-cli fields create posts published_date --type date
directus-cli fields create posts featured_image --type uuid

# Add fields to categories
directus-cli fields create categories name --type string --required
directus-cli fields create categories slug --type string --required

# Create a relation (posts -> categories)
directus-cli fields create posts category --type uuid
directus-cli relations create posts category --related-collection categories

# Create sample data
directus-cli items create categories '{"name":"Tech","slug":"tech"}'
directus-cli items create posts '{
  "title": "Hello World",
  "slug": "hello-world",
  "content": "My first blog post",
  "status": "published",
  "published_date": "2024-01-01"
}'

# Query published posts
directus-cli items list posts --filter status=published --sort -published_date --fields id,title,slug,published_date
```

## Multi-Environment Schema Migration

```bash
# Set up profiles
directus-cli profile add dev http://localhost:8055 --token $DEV_TOKEN
directus-cli profile add staging https://staging.example.com --token $STAGING_TOKEN
directus-cli profile add prod https://api.example.com --token $PROD_TOKEN

# Export schema from dev
directus-cli schema snapshot --output ./schema.yaml --profile dev

# Review changes against staging
directus-cli schema diff ./schema.yaml --profile staging

# Apply to staging (with confirmation)
directus-cli schema apply ./schema.yaml --profile staging --yes

# Apply to production
directus-cli schema apply ./schema.yaml --profile prod --yes
```

## Bulk Data Export and Import

```bash
# Export all published articles to JSON
directus-cli bulk export articles --format json --output ./articles.json --filter '{"status":{"_eq":"published"}}'

# Export users to CSV
directus-cli bulk export directus_users --format csv --output ./users.csv

# Import data from CSV into a different instance
directus-cli bulk import articles ./articles.json --profile staging

# Import from CSV
directus-cli bulk import contacts ./contacts.csv --profile prod
```

## User and Access Control Setup

```bash
# Create a role
directus-cli roles create "Content Editor" --description "Can edit content"

# Create a policy (Directus 11+)
directus-cli policies create "Blog Editor Access" --description "Edit blog posts"

# Create a user with the role
directus-cli users create editor@example.com \
  --password "temp-password" \
  --role <role-id> \
  --first-name "Jane" \
  --last-name "Editor"

# List users by role
directus-cli users list --filter role=<role-id> --fields id,email,first_name
```

## File Management

```bash
# Create a folder
directus-cli folders create "Blog Images"

# Upload files to the folder
directus-cli files upload ./hero.png --folder <folder-id> --title "Hero Image"
directus-cli files upload ./thumb.jpg --folder <folder-id> --title "Thumbnail"

# List files in folder
directus-cli files list --folder <folder-id>

# Download a file
directus-cli files download <file-id> --output ./downloaded-image.png
```

## Automation: Trigger a Flow

```bash
# List available flows
directus-cli flows list --fields id,name,status

# Trigger a manual flow with data
directus-cli flows trigger <flow-id> --data '{"message":"deploy triggered"}'
```

## CI/CD Script Example

```bash
#!/usr/bin/env bash
set -euo pipefail

# Uses environment variables: DIRECTUS_URL, DIRECTUS_TOKEN

# Verify connectivity
directus-cli server ping

# Apply schema migration
directus-cli schema apply ./schema.yaml --yes

# Import seed data
directus-cli bulk import articles ./seed-data.json

# Verify
directus-cli items list articles --limit 5 -f table
echo "Deployment complete."
```
