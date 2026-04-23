# Installation

## Global Installation (Recommended)

```bash
npm install -g @face-to-face-it/directus-cli
# or
pnpm add -g @face-to-face-it/directus-cli
```

## Local Project Installation

```bash
npm install --save-dev @face-to-face-it/directus-cli
# or
pnpm add -D @face-to-face-it/directus-cli
```

## Using npx (No Installation)

```bash
npx @face-to-face-it/directus-cli <command>
```

## Verify Installation

```bash
directus-cli --version
directus-cli --help
```

## Requirements

- Node.js >= 20

## Building from Source

```bash
git clone https://github.com/Face-to-Face-IT/directus-cli.git
cd directus-cli
pnpm install
pnpm build
./bin/dev.js --help
```
