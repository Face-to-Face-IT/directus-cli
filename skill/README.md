# directus-cli agent skill

Agent skill for `directus-cli`, loadable by OpenCode / Claude Code / any agent runtime that understands the [Anthropic skill format](https://docs.anthropic.com/).

- `SKILL.md` — entry point with frontmatter, decision tree, and gotchas
- `references/` — detailed reference docs loaded on demand

## Install locally

```bash
# Copy into your user skills directory
cp -r skill/* ~/.agents/skills/directus-cli/
```

This is the canonical source. Update files here, open a PR, then re-run the copy command after merge.
