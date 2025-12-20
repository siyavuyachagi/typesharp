# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/).

## Important note

TypeSharp is NOT an OpenAPI-based tool. It parses C# projects directly, targeting classes and enums decorated with a `[TypeSharp]` (or other configured) attribute. It preserves generics, inheritance, file grouping, and supports multiple collection types and naming conventions — see the README for details.

## [Unreleased]

### Added

- ASP.NET file types handling (`FormFile`, `IFormFile`, `IFormFileCollection`)

### Changed

- —

### Fixed

- —

### Removed

- —

---

## [0.1.0] - 2025-12-19

### Summary

Initial public release of TypeSharp — a direct C# → TypeScript generator that is NOT OpenAPI-based.

### Key characteristics (callouts)

- Direct C# parsing (not derived from OpenAPI/Swagger).
- Attribute targeting: only classes/enums decorated with the configured attribute are converted.
- Generic types preserved (e.g., `Response<T>` → `Response<T>`).
- File grouping preserved — classes declared together in C# files can be emitted together.
- Naming conversion options (camelCase, PascalCase, snake_case, kebab-case).
- Collection handling (arrays, List<T>, IEnumerable<T>, generic collections).
- Enum conversion to TypeScript enums.
- Does not generate API clients; it focuses on types.

### Added

- Initial public release of `typesharp`.
- Core library functionality (public API, core utilities).
- TypeScript type definitions and runtime validation helpers.
- Command-line interface (CLI) scaffolding for common developer workflows.
- Getting started guide and examples in README.
- Basic automated tests and CI configuration (unit test runner and linting).

<!-- ### Changed
- Not applicable for initial release.

### Fixed
- Not applicable for initial release.

### Removed
- Not applicable for initial release. -->

## Contributors

- @siyavuyachagi — initial author and maintainer.

---

For more details and context, see the README: https://github.com/siyavuyachagi/typesharp#readme
