# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/).

## Important note

TypeSharp is NOT an OpenAPI-based tool. It parses C# projects directly, targeting classes and enums decorated with a `[TypeSharp]` (or other configured) attribute. It preserves generics, inheritance, file grouping, and supports multiple collection types and naming conventions — see the README for details.

---

## v0.1.6 - 2026-04-11

### Summary

Comprehensive test suite completion with full CLI testing and incremental generation validation.

### Added

- **CLI module tests** — 14 new test cases validating `init` and `generate` commands
  - Config file creation in `.ts`, `.js`, and `.json` formats
  - Missing config file error handling
  - Empty source array handling
  - Config overwrite prevention
- **Incremental generation validation** — 5 passing tests confirming:
  - File change detection working correctly
  - Selective file writing (skips unchanged files)
  - Full generation mode (cleans all output first)
  - Content-based write optimization (only writes if content changed)
  - Multi-file incremental workflows

### Changed

- Test suite now totals **103 passing tests** across 6 test files
- Simplified CLI tests to focus on core functionality validation
- Improved test reliability by using JSON configs instead of inline TypeScript in tests

### Fixed

- CLI test file syntax issues (missing closing braces)
- CLI config test issues (scope and variable definition problems)
- Generator incremental workflow fully validated and working

### Test Coverage Breakdown

- **CLI interface**: 14 tests
- **Core functionality**: 8 tests
- **Generator & incremental writes**: 5 tests
- **File tracking**: 9 tests
- **Integration tests**: 25 tests
- **Parser**: 39 tests

---

## [0.1.5] - 2026-04-07

### Summary

- Minor parser improvements
- Minor parser improvements and CLI update

### Added

- **C# interface filtering in inheritance** — classes inheriting from C# interfaces (e.g. `IActionResult`, `IDisposable`) no longer emit an `extends` clause in the generated TypeScript output. Only concrete base classes are preserved. Interface detection follows the standard C# naming convention (`I` followed by an uppercase letter).
- **C# record support** — all record forms are now parsed and emitted as TypeScript interfaces:

- Positional records: public record Point(int X, int Y)
  record class and record struct explicit keyword variants
  Body-only records (no primary constructor) — parsed identically to classes
  Generic records: public record PagedResult<T>(IEnumerable<T> Items, int TotalCount)
  Record inheritance: base record is preserved as an extends clause; C# interfaces (I-prefixed) are filtered out the same as for classes

- Per-parameter attribute overrides on record primary constructors — [property: TypeIgnore], [property: TypeName("x")], [property: TypeAs("y")], and [property: Obsolete("msg")] are all supported. The property: attribute target is required by C# for primary constructor parameters; TypeSharp accepts both [property: Attr] and [Attr] forms (the latter is valid for [Obsolete] which targets all by default)
  isRecord field on CSharpClass — distinguishes parsed records from classes in programmatic usage
  parseRecordParameters exported from parser — available for programmatic and advanced usage

### Changed

- --no-incremental flag — forces full clean generation

### Fixed

- Primary constructor parameter extraction now uses paren-depth balancing instead of a [^)]\* regex group, preventing early truncation when attribute arguments contain parentheses (e.g. [property: TypeAs("Date")])
- Correct parsing of constructor parameters with nested parentheses in attributes

---

## [0.1.2] - 2026-03-21

### Summary

Major parser improvements, expanded type support, multi-project support, and automatic import generation between output files.

### Added

- **ASP.NET Core test project** — Self-contained test project
- **`.slnx` solution support** — `source` now accepts `.slnx` XML solution files, automatically extracting all referenced `.csproj` paths
- **`.sln` solution support** — `source` now accepts Visual Studio `.sln` files, automatically extracting all referenced `.csproj` paths
- **`[Obsolete]` support** — properties decorated with `[Obsolete]` or `[Obsolete("message")]` are emitted with `/** @deprecated [message] */` JSDoc in the generated TypeScript output. Supported on all three property styles: `{ get; set; }`, expression-bodied (`=>`), and block getter (`{ get { return ...; } }`)
- **`[TypeSharp("name")]` class/enum name override** — `[TypeSharp]` now optionally accepts a string argument that overrides the generated TypeScript type name, taking precedence over any `namingConvention` setting. Works on both classes and enums. `[TypeSharp]` without an argument continues to work as before.

### Changed

- **`projectFiles` deprecated** — Renamed to `source`. `projectFiles` still works but logs a deprecation warning. Will be removed in a future version.
- **`source` config option** — Replaces `projectFiles`. Accepts `.csproj`, `.sln`, or `.slnx` paths as a single string or array

### Fixed

- **Multi-annotation support** — Works with classes that have other annotations along with with 'TypeSharp' or your custom

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
