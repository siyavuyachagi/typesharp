# Contributing to TypeSharp

Thank you for your interest in contributing to TypeSharp! This document walks you through everything you need to get started — from setting up your environment to getting your pull request merged.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Project Overview](#project-overview)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Release Process](#release-process)
- [Style Guide](#style-guide)
- [Getting Help](#getting-help)

---

## Code of Conduct

This project follows a Code of Conduct that all participants are expected to uphold. Please read [CODE-OF-CONDUCT.md](./CODE-OF-CONDUCT.md) before contributing.

In short: be respectful, be constructive, and welcome contributors of all backgrounds and experience levels.

---

## Project Overview

TypeSharp is a **direct C# → TypeScript type generator**. It parses `.cs` files from one or more `.csproj` projects, finds classes and enums decorated with the `[TypeSharp]` attribute, and emits corresponding TypeScript interfaces and enums.

> ⚠️ TypeSharp is **NOT** an OpenAPI-based tool. It does not require controllers, Swagger, or HTTP endpoints.

Key modules:

| Module | Responsibility |
|--------|----------------|
| `src/cli` | CLI entry point (`typesharp`, `typesharp generate`, `typesharp init`) |
| `src/core` | Config loading, validation, output directory cleanup, orchestration |
| `src/parser` | C# file discovery and *[Abstract Syntax Tree]* AST-style class/property parsing |
| `src/generator` | TypeScript file generation, naming conventions, import resolution |
| `src/types` | Shared TypeScript interfaces (`TypeSharpConfig`, `CSharpClass`, etc.) |

---

## Getting Started

### Prerequisites

- **Node.js** `>= 20`
- **npm** `>= 9`
- **TypeScript** `>= 4.5` (installed as a dev dependency)

### Fork & Clone

```bash
# 1. Fork the repo on GitHub, then clone your fork
git clone https://github.com/<your-username>/typesharp.git
cd typesharp

# 2. Add the upstream remote
git remote add upstream https://github.com/siyavuyachagi/typesharp.git
```

### Install Dependencies

```bash
npm install
```

### Build

```bash
npm run build
```

This compiles `src/` → `dist/` using `tsc`.

### Watch Mode (Development)

```bash
npm run dev
```

Recompiles on every file change.

---

## Development Workflow

```
fork → branch → change → build → test → commit → push → pull request
```

Always create a new branch for your work. Never commit directly to `main`.

```bash
# Pull latest changes from upstream
git fetch upstream
git checkout main
git merge upstream/main

# Create a feature or fix branch
git checkout -b feat/your-feature-name
# or
git checkout -b fix/your-bug-description
```

### Branch Naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feat/<short-description>` | `feat/record-type-support` |
| Bug fix | `fix/<short-description>` | `fix/nullable-array-parsing` |
| Docs | `docs/<short-description>` | `docs/update-readme` |
| Refactor | `refactor/<short-description>` | `refactor/parser-cleanup` |
| Tests | `test/<short-description>` | `test/enum-edge-cases` |

---

## Project Structure

Refer to [`project-structure.md`](./docs/project-structure.md)

---

## Making Changes

### Parser Changes (`src/parser/index.ts`)

The parser uses **regex-based matching** against cleaned C# source text (comments are stripped before parsing). When modifying the parser:

- `parseClassesFromFile` — main entry point per C# file
- `parseProperties` — handles three property styles: `{ get; set; }`, expression-bodied `=>`, and block getter `{ get { return ...; } }`
- `parsePropertyType` — recursive type resolver; handles arrays, generics, dictionaries, collections, and primitives
- `mapCSharpTypeToTypeScript` — C# primitive → TS primitive lookup table

When adding a new C# type mapping, update `mapCSharpTypeToTypeScript` and document it in the type mapping tables in [`README.md`](./README.md) and [`docs/usage.md`](./docs/usage.md).

### Generator Changes (`src/generator/index.ts`)

The generator writes `.ts` files from parsed `CSharpClass` objects. Key functions:

- `generateTypeScriptFiles` — entry point; routes to single-file or multi-file output
- `generateMultipleFiles` — preserves C# folder structure, applies naming conventions
- `generateImports` — resolves cross-file `import type { ... }` statements
- `convertFileName` / `convertDirName` — apply naming conventions (`camel`, `kebab`, `pascal`, `snake`)

When adding a new naming convention, update the `NamingConvention` type in `src/types/typesharp-config.ts`, add a case in `convertFileName`, and document it in [`README.md`](./README.md) and [`docs/usage.md`](./docs/usage.md).

### Config Changes (`src/types/typesharp-config.ts`)

All new config options must:

1. Be added to the `TypeSharpConfig` interface with a JSDoc comment
2. Have a default set in `DEFAULT_CONFIG` inside `src/core/index.ts` (if applicable)
3. Be validated inside `validateConfig` (if they require validation)
4. Be documented in the Configuration table in [`README.md`](./README.md) and [`docs/usage.md`](./docs/usage.md)
5. Be included in the sample config generated by `createSampleConfig`

---

## Testing

Test files live in the `tests/` directory.

> The test suite is currently minimal and actively being built out. New contributions that include tests are especially welcome.

### Running Tests

```bash
npm test
```

### What to Test

When contributing a bug fix or new feature, please include at minimum:

- A test case that **reproduces the bug** (for fixes)
- A test case that **covers the happy path** (for features)
- Edge cases where applicable (e.g., nullable generics, nested collections, empty enums)

Focus areas for test coverage:

- `parsePropertyType` — complex generic and nullable combinations
- `generateImports` — cross-file import resolution
- `convertFileName` / `convertDirName` — naming convention correctness
- Config validation — invalid paths, missing required fields

---

## Submitting a Pull Request

### Before Opening a PR

```bash
# 1. Make sure the build passes
npm run build

# 2. Run the test suite
npm test

# 3. Verify your branch is up to date
git fetch upstream
git rebase upstream/main
```

### PR Checklist

- [✓] Branch is based on the latest `main`
- [✓] `npm run build` passes with no errors
- [✓] `npm test` passes
- [✓] New behaviour is covered by tests (where applicable)
- [✓] Relevant documentation is updated ([`README.md`](./README.md), [`docs/usage.md`](./docs/usage.md), [`CHANGELOG.md`](./CHANGELOG.md))
- [✓] PR title follows the format: `type: short description` (e.g., `feat: add record type support`)
- [✓] PR description explains **what** changed and **why**

### PR Title Format

Use conventional commit prefixes:

```
feat: add watch mode support
fix: resolve nullable array type corruption
docs: document fileSuffix option
refactor: extract type resolver into helper
test: add enum parsing edge cases
chore: bump glob to v13
```

### What Happens After You Open a PR

1. A maintainer will review your PR, leave feedback, or approve it
2. CI will run the build and tests automatically
3. Once approved and all checks pass, a maintainer will merge it
4. Your change will appear in the next release and CHANGELOG entry

---

## Style Guide

TypeSharp is written in **TypeScript strict mode**. Please follow these conventions:

- Use `const` by default; `let` only when reassignment is needed
- Prefer explicit return types on exported functions
- Use `async/await` over raw Promises
- Add JSDoc comments to all exported functions
- Keep functions small and single-purpose
- Avoid mutation where possible — prefer returning new values
- Use `path.join` / `path.relative` for all file path operations (cross-platform compatibility)
- Do not use `console.log` in library code — use `console.log` / `console.warn` / `console.error` only in `src/cli` and `src/core` (where user-facing output is appropriate)

---

## Getting Help

- Browse open [GitHub Issues](https://github.com/siyavuyachagi/typesharp/issues) — your question may already be answered
- Open a new issue to ask a question, report a bug, or propose a feature
- Read [README.md](./README.md) for a full feature overview and quick start
- Read [docs/usage.md](./docs/usage.md) for detailed configuration, type mappings, and integration examples
- Read [docs/why-typesharp.md](./docs/why-typesharp.md) to understand the project's design philosophy and how it compares to alternatives

---

Built with ❤️ in South Africa 🇿🇦 — thank you for contribution to TypeSharp!