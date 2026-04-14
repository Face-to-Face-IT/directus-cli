<!-- Improved compatibility of back to top link: See: https://github.com/othneildrew/Best-README-Template/pull/73 -->

<a id="readme-top"></a>

<!--
*** Thanks for checking out this README. If you have a suggestion
*** that would make this better, please fork the repo and create a pull request
*** or simply open an issue with the tag "enhancement".
*** Don't forget to give the project a star!
*** Thanks again! :D
-->

<!-- PROJECT SHIELDS -->
<!--
*** I'm using markdown "reference style" links for readability.
*** Reference links are enclosed in brackets [ ] instead of parentheses ( ).
*** See the bottom of this document for the declaration of the reference variables
*** for contributors-url, forks-url, etc. This is an optional, concise syntax you may use.
*** https://www.markdownguide.org/basic-syntax/#reference-style-links
-->

[![NPM Version][npm-version-shield]][npm-url]
[![License][license-shield]][license-url]
[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/Face-to-Face-IT/directus-cli">
    <img src="images/logo.png" alt="Logo" width="200">
  </a>

  <h3 align="center">Directus CLI</h3>

  <p align="center">
    A powerful CLI client for managing Directus instances from the command line
    <br />
    <a href="https://www.npmjs.com/package/@face-to-face-it/directus-cli"><strong>View on NPM »</strong></a>
    <br />
    <br />
    <a href="#usage">View Examples</a>
    &middot;
    <a href="https://github.com/Face-to-Face-IT/directus-cli/issues/new?labels=bug">Report Bug</a>
    &middot;
    <a href="https://github.com/Face-to-Face-IT/directus-cli/issues/new?labels=enhancement">Request Feature</a>
  </p>
</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#features">Features</a></li>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#commands">Commands</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->

## About The Project

The Directus CLI provides a comprehensive command-line interface for managing Directus CMS instances. Built on top of the official Directus SDK, it offers full CRUD operations for all Directus resources, making it perfect for automation, CI/CD pipelines, and day-to-day management tasks.

### Features

- **Complete API Coverage** — 94 commands covering users, roles, collections, items, files, flows, and more
- **Schema Management** — Snapshot, diff, and apply schema changes with ease
- **Bulk Operations** — Export and import data in JSON, CSV, XML, or YAML formats
- **Multi-Profile Support** — Manage multiple Directus instances with saved connection profiles
- **Type-Safe** — Built with TypeScript and the official Directus SDK for maximum reliability
- **Automation Ready** — Perfect for CI/CD pipelines and shell scripting

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Built With

- [![TypeScript][TypeScript]][TypeScript-url]
- [![oclif][oclif]][oclif-url]
- [![Directus][Directus]][Directus-url]
- [![Node.js][Node.js]][Node-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- GETTING STARTED -->

## Getting Started

Get up and running with the Directus CLI in minutes.

### Prerequisites

- Node.js 20 or higher
  ```sh
  node --version
  ```
- A Directus instance (local or remote)

### Installation

#### Global Installation (Recommended)

```sh
npm install -g @face-to-face-it/directus-cli
# or
pnpm add -g @face-to-face-it/directus-cli
```

#### Local Project Installation

```sh
npm install --save-dev @face-to-face-it/directus-cli
# or
pnpm add -D @face-to-face-it/directus-cli
```

#### Using npx (No Installation)

```sh
npx @face-to-face-it/directus-cli <command>
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- USAGE EXAMPLES -->

## Usage

### Quick Start

```sh
# Authenticate with your Directus instance
directus-cli auth login https://your-directus.com --email admin@example.com --password secret

# Or use a static token
directus-cli auth login https://your-directus.com --token your-token

# Save as a profile for easy reuse
directus-cli profile add production https://your-directus.com --default
```

### Common Operations

```sh
# List all users
directus-cli users list

# Create a collection
directus-cli collections create articles --note "Blog posts"

# Add a field
directus-cli fields create articles title --type string --required

# Create an item
directus-cli items create articles '{"title": "Hello World"}'

# Upload a file
directus-cli files upload ./image.png --folder uploads

# Export data
directus-cli bulk export articles --format json --output articles.json

# Apply schema changes
directus-cli schema snapshot --output ./schema.yaml
```

### Filtering and Sorting

```sh
# Filter with conditions
directus-cli users list --filter role=admin

# Multiple filters (AND logic)
directus-cli items list articles --filter status=published --filter featured=true

# JSON filter syntax
directus-cli items list articles --filter '{"date_created":{"_gt":"2024-01-01"}}'

# Sort and paginate
directus-cli users list --sort -date_created --limit 10 --offset 20
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- COMMANDS -->

## Commands

| Category                 | Commands                                                                                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Auth & Profiles**      | `auth login`, `auth logout`, `auth refresh`, `auth status`, `profile add`, `profile list`                                                              |
| **Users & Permissions**  | `users list`, `users create`, `users update`, `users delete`, `roles list`, `roles create`, `policies list`                                            |
| **Collections & Fields** | `collections list`, `collections create`, `collections update`, `collections delete`, `fields list`, `fields create`, `fields update`, `fields delete` |
| **Items**                | `items list`, `items get`, `items create`, `items update`, `items delete`                                                                              |
| **Files & Folders**      | `files list`, `files download`, `files upload`, `folders list`, `folders create`, `folders update`, `folders delete`                                   |
| **Flows & Operations**   | `flows list`, `flows create`, `flows trigger`, `operations list`, `operations create`, `operations update`                                             |
| **Schema**               | `schema snapshot`, `schema diff`, `schema apply`                                                                                                       |
| **Bulk Operations**      | `bulk export`, `bulk import`                                                                                                                           |

_For a complete list, run `directus-cli --help` or see the [Documentation](https://github.com/Face-to-Face-IT/directus-cli#commands)_

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ROADMAP -->

## Roadmap

- [x] Complete CRUD operations for all Directus resources
- [x] Schema management (snapshot, diff, apply)
- [x] Multi-profile support
- [x] Bulk import/export
- [ ] Interactive mode for complex operations
- [ ] Webhook management commands
- [ ] Content versioning support
- [ ] GraphQL query support

See the [open issues](https://github.com/Face-to-Face-IT/directus-cli/issues) for a full list of proposed features and known issues.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTRIBUTING -->

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

This project uses [Conventional Commits](https://www.conventionalcommits.org/) and [Semantic Release](https://semantic-release.gitbook.io/) for automated versioning. Please ensure your commits follow the convention:

```sh
<type>(<scope>): <description>

types: feat, fix, docs, style, refactor, perf, test, build, ci, chore
```

### How to Contribute

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Top contributors:

<a href="https://github.com/Face-to-Face-IT/directus-cli/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=Face-to-Face-IT/directus-cli" alt="contrib.rocks image" />
</a>

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- LICENSE -->

## License

Distributed under the MIT License. See `LICENSE` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTACT -->

## Contact

Face-to-Face IT - [GitHub Organization](https://github.com/Face-to-Face-IT)

Project Link: [https://github.com/Face-to-Face-IT/directus-cli](https://github.com/Face-to-Face-IT/directus-cli)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ACKNOWLEDGMENTS -->

## Acknowledgments

- [Directus](https://directus.io/) - The open-source data platform
- [Directus SDK](https://docs.directus.io/reference/sdk.html) - Official JavaScript SDK
- [oclif](https://oclif.io/) - Open CLI Framework
- [Best-README-Template](https://github.com/othneildrew/Best-README-Template) - README template

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[npm-version-shield]: https://img.shields.io/npm/v/@face-to-face-it/directus-cli?style=for-the-badge
[npm-url]: https://www.npmjs.com/package/@face-to-face-it/directus-cli
[license-shield]: https://img.shields.io/github/license/Face-to-Face-IT/directus-cli?style=for-the-badge
[license-url]: https://github.com/Face-to-Face-IT/directus-cli/blob/main/LICENSE
[contributors-shield]: https://img.shields.io/github/contributors/Face-to-Face-IT/directus-cli.svg?style=for-the-badge
[contributors-url]: https://github.com/Face-to-Face-IT/directus-cli/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/Face-to-Face-IT/directus-cli.svg?style=for-the-badge
[forks-url]: https://github.com/Face-to-Face-IT/directus-cli/network/members
[stars-shield]: https://img.shields.io/github/stars/Face-to-Face-IT/directus-cli.svg?style=for-the-badge
[stars-url]: https://github.com/Face-to-Face-IT/directus-cli/stargazers
[issues-shield]: https://img.shields.io/github/issues/Face-to-Face-IT/directus-cli.svg?style=for-the-badge
[issues-url]: https://github.com/Face-to-Face-IT/directus-cli/issues
[TypeScript]: https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white
[TypeScript-url]: https://www.typescriptlang.org/
[oclif]: https://img.shields.io/badge/oclif-000000?style=for-the-badge&logo=oclif&logoColor=white
[oclif-url]: https://oclif.io/
[Directus]: https://img.shields.io/badge/Directus-263238?style=for-the-badge&logo=directus&logoColor=white
[Directus-url]: https://directus.io/
[Node.js]: https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white
[Node-url]: https://nodejs.org/
