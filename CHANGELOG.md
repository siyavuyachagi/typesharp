# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/).

## Important note

TypeSharp is NOT an OpenAPI-based tool. It parses C# projects directly, targeting classes and enums decorated with a `[TypeSharp]` (or other configured) attribute. It preserves generics, inheritance, file grouping, and supports multiple collection types and naming conventions — see the README for details.

---

## [0.1.1] - 2026-02-19

### Summary

Major parser improvements, expanded type support, multi-project support, and automatic import generation between output files.

### Added

- **Computed property support** — expression-bodied properties (`=> expression;`) are now parsed and included in generated types
- **Block getter support** — `{ get { return ...; } }` style getters are now parsed
- **Init-only property support** — `{ get; init; }` properties are now recognized
- **Dictionary type mapping** — `Dictionary<K, V>`, `IDictionary<K, V>`, and `IReadOnlyDictionary<K, V>` are mapped to `Record<K, V>` in TypeScript
- **Multi-project support** — `projectFiles` now accepts an array of `.csproj` paths, allowing multiple C# projects to be parsed in a single run
- **Automatic import generation** — when using `singleOutputFile: false`, TypeSharp now generates `import type { ... }` statements between output files for cross-file type references
- **Generic inheritance** — classes inheriting from generic base classes (e.g., `PagedApiResponse<T> : ApiResponse<T>`) now correctly emit `extends ApiResponse<T>` in TypeScript
- **Output directory cleanup** — the output directory is now automatically cleaned before each generation run to prevent stale files
- **File suffix support** — a `fileSuffix` option has been added to append a formatted suffix to generated file names (e.g., `user-dto.ts`)
- **Advanced naming convention config** — `namingConvention` now accepts a `NamingConventionConfig` object with separate `dir` and `file` conventions
- **ASP.NET file type mappings** — added support for `IFormFile`, `IFormFileCollection`, `FormFile`, `FileStream`, `MemoryStream`, and `Stream` C# types

### Changed

- `namingConvention` config option now accepts either a simple `NamingConvention` string or a `NamingConventionConfig` object (`{ dir, file }`)
- `projectFiles` config option now accepts `string | string[]` instead of just `string`
- Parser now processes all three property declaration styles in a single pass per class body

### Fixed

- Duplicate property generation when class bodies contained mixed property styles
- Type bleeding across properties when using overly permissive regex patterns
- Nested generic types (e.g., `Dictionary<string, List<Foo>>`) now resolve correctly without type corruption

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

## Contributors

- @siyavuyachagi — initial author and maintainer.

---

For more details and context, see the README: https://github.com/siyavuyachagi/typesharp#readme
