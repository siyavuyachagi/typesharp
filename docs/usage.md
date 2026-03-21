# TypeSharp Usage Guide

Complete guide to using TypeSharp for generating TypeScript types from C# models.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [CLI Usage](#cli-usage)
- [C# Attribute Setup](#c-attribute-setup)
- [Type Mappings](#type-mappings)
- [Generic Types Support](#generic-types-support)
- [Naming Conventions](#naming-conventions)
- [Advanced Usage](#advanced-usage)
- [Integration Examples](#integration-examples)
- [Troubleshooting](#troubleshooting)

## Installation

### Install as Dev Dependency
```bash
npm install @siyavuyachagi/typesharp --save-dev
```

### Install Globally (Optional)
```bash
npm install -g @siyavuyachagi/typesharp
```

## Quick Start

### Step 1: Decorate Your Models / Data Transfer Objects
```bash
# In your C# project
dotnet add package TypeSharp.Attributes
```
```csharp
using TypeSharp.Attributes;

[TypeSharp]
public class User
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string? Email { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

### Step 2: Initialize Configuration
```bash
npx typesharp init
```

This creates `typesharp.config.ts` in your project root.

### Step 3: Configure Paths

Edit `typesharp.config.ts`:
```typescript
import type { TypeSharpConfig } from '@siyavuyachagi/typesharp';

const config: TypeSharpConfig = {
  source: ["C:/Users/User/Desktop/MyApp/MyApp.sln"],
  outputPath: "./src/types",
  targetAnnotation: "TypeSharp",
  singleOutputFile: false,
  namingConvention: "camel"
};

export default config;
```

### Step 4: Generate Types
```bash
npx typesharp
```

## Configuration

### Configuration Options

| Option             | Type                                      | Default       | Description                                                   |
| ------------------ | ----------------------------------------- | ------------- | ------------------------------------------------------------- |
| `source`           | `string \| string[]`                      | _required_    | Path(s) to `.csproj`, `.sln`, or `.slnx` file(s)             |
| `outputPath`       | `string`                                  | _required_    | Where to generate TypeScript files                            |
| `targetAnnotation` | `string`                                  | `'TypeSharp'` | C# attribute name to look for                                 |
| `singleOutputFile` | `boolean`                                 | `false`       | Generate one file or multiple files                           |
| `namingConvention` | `string \| { dir: string, file: string }` | `'camel'`     | Property/file/dir naming: `kebab`, `camel`, `pascal`, `snake` |
| `fileSuffix`       | `string`                                  | _optional_    | Suffix appended to generated file names: `user-dto.ts`        |
| `projectFiles`     | `string \| string[]`                      | _deprecated_  | ⚠️ Deprecated — use `source` instead                          |

#### `source`

Accepts a single path or array. Supports `.csproj`, `.sln`, and `.slnx` files. When a solution file is provided, TypeSharp automatically discovers all referenced `.csproj` files.
```json
{ "source": "C:/MyApp/MyApp.sln" }
```
```json
{ "source": ["C:/MyApp/Api/Api.csproj", "C:/MyApp/Domain/Domain.csproj"] }
```

#### `singleOutputFile`

- `false` (default): One TypeScript file per C# source file, preserving folder structure and class grouping
- `true`: All types in a single `types.ts` file

#### `namingConvention`

Accepts a simple string or a config object for separate control over directories and files:
```json
{ "namingConvention": "kebab" }
```
```json
{
  "namingConvention": {
    "dir": "kebab",
    "file": "camel"
  }
}
```

Available values: `"camel"` | `"kebab"` | `"pascal"` | `"snake"`

#### `fileSuffix`

Appends a formatted suffix to generated file names:
```json
{ "fileSuffix": "dto" }
```

`User.cs` → `user-dto.ts` (with `namingConvention: "kebab"`)

### Configuration File Formats

#### JSON — `typesharp.config.json`
```json
{
  "source": ["C:/Users/User/Desktop/MyApp/MyApp.sln"],
  "outputPath": "./src/types",
  "targetAnnotation": "TypeSharp",
  "singleOutputFile": false,
  "namingConvention": "camel"
}
```

#### TypeScript — `typesharp.config.ts` (Recommended)
```typescript
import type { TypeSharpConfig } from '@siyavuyachagi/typesharp';

const config: TypeSharpConfig = {
  source: ["C:/Users/User/Desktop/MyApp/MyApp.sln"],
  outputPath: "./src/types",
  targetAnnotation: "TypeSharp",
  singleOutputFile: false,
  namingConvention: "camel",
};

export default config;
```

#### JavaScript — `typesharp.config.js`
```javascript
module.exports = {
  source: ["C:/Users/User/Desktop/MyApp/MyApp.sln"],
  outputPath: "./src/types",
  targetAnnotation: "TypeSharp",
  singleOutputFile: false,
  namingConvention: "camel",
};
```

### Custom Config Path
```bash
npx typesharp generate --config ./configs/my-config.json
```

## CLI Usage

### Commands

#### Generate (Default)
```bash
npx typesharp
npx typesharp generate
npx typesharp generate --config ./my-config.json
```

#### Init
```bash
# TypeScript config (default)
npx typesharp init

# JSON config
npx typesharp init --format json

# JavaScript config
npx typesharp init --format js
```

#### Help & Version
```bash
npx typesharp --help
npx typesharp --version
```

## C# Attribute Setup

### On Classes
```csharp
[TypeSharp]
public class Product
{
    public int Id { get; set; }
    public string Name { get; set; }
    public decimal Price { get; set; }
}
```

### On Enums
```csharp
[TypeSharp]
public enum OrderStatus
{
    Pending,
    Processing,
    Shipped,
    Delivered,
    Cancelled
}
```

### Custom Type Name Override

Use `[TypeSharp("name")]` to override the generated TypeScript type name:
```csharp
[TypeSharp("auth_response")]
public class AuthResponse
{
    public string AccessToken { get; set; }
    public string RefreshToken { get; set; }
}
```
```typescript
export interface auth_response {
  accessToken: string;
  refreshToken: string;
}
```

### Property Attribute Overrides

TypeSharp supports per-property attribute overrides for fine-grained control:

**`[TypeIgnore]`** — excludes the property from the generated output:
```csharp
[TypeSharp]
public class UserDto
{
    public string Name { get; set; }
    [TypeIgnore]
    public string PasswordHash { get; set; }
}
```

**`[TypeName("name")]`** — overrides the generated property name:
```csharp
[TypeSharp]
public class UserDto
{
    [TypeName("created_at")]
    public DateTime CreatedAt { get; set; }
}
```

**`[TypeAs("type")]`** — overrides the inferred TypeScript type:
```csharp
[TypeSharp]
public class UserDto
{
    [TypeAs("Date")]
    public DateTime UpdatedAt { get; set; }
}
```

## Type Mappings

### Primitives & Common Types

| C# Type                                             | TypeScript Type |
| --------------------------------------------------- | --------------- |
| `bool`                                              | `boolean`       |
| `byte`, `decimal`, `double`, `float`, `int`, `long` | `number`        |
| `DateTime`, `DateOnly`, `TimeOnly`                  | `string`        |
| `Guid`, `string`                                    | `string`        |
| `object`                                            | `any`           |

### Collections

| C# Type                                                              | TypeScript Type |
| -------------------------------------------------------------------- | --------------- |
| `List<T>`, `ICollection<T>`, `IEnumerable<T>`, `IList<T>`, `T[]`    | `T[]`           |
| `Dictionary<K, V>`, `IDictionary<K, V>`, `IReadOnlyDictionary<K, V>`| `Record<K, V>`  |

### ASP.NET / File Types

| C# Type                                | TypeScript Type |
| -------------------------------------- | --------------- |
| `IFormFile`, `FormFile`                | `File`          |
| `IFormFileCollection`                  | `File[]`        |
| `FileStream`, `MemoryStream`, `Stream` | `Blob`          |

### Nullable Types
```csharp
[TypeSharp]
public class User {
  public string? Name { get; set; }
  public int? Age { get; set; }
  public DateOnly? DateOfBirth { get; set; }
}
```
```typescript
export interface User {
  name: string | null;
  age: number | null;
  dateOfBirth: string | null;
}
```

### Dictionary Types
```csharp
[TypeSharp]
public class PermissionMap
{
    public Dictionary<string, bool> Flags { get; set; }
    public IReadOnlyDictionary<string, List<string>> RolePermissions { get; set; }
}
```
```typescript
export interface PermissionMap {
  flags: Record<string, boolean>;
  rolePermissions: Record<string, string[]>;
}
```

### Enums
```csharp
[TypeSharp]
public enum Status
{
    Active,
    Inactive,
    Pending
}
```
```typescript
export enum Status {
  Active = "Active",
  Inactive = "Inactive",
  Pending = "Pending",
}
```

### Obsolete / Deprecated Properties

Properties marked with `[Obsolete]` or `[Obsolete("message")]` are emitted with a `/** @deprecated */` JSDoc comment:
```csharp
[TypeSharp]
public class UserDto
{
    public string Email { get; set; }

    [Obsolete("Use Email instead.")]
    public string? Username { get; set; }

    [Obsolete]
    public string? LegacyId { get; set; }
}
```
```typescript
export interface UserDto {
  email: string;
  /** @deprecated Use Email instead. */
  username: string | null;
  /** @deprecated */
  legacyId: string | null;
}
```

> Supported on `{ get; set; }`, expression-bodied (`=>`), and block getter properties.

## Generic Types Support

### Single Generic Parameter
```csharp
[TypeSharp]
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public T? Data { get; set; }
    public List<string> Errors { get; set; }
}
```
```typescript
export interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  data: T | null;
  errors: string[];
}
```

### Multiple Generic Parameters
```csharp
[TypeSharp]
public class Result<TData, TError>
{
    public bool IsSuccess { get; set; }
    public TData? Data { get; set; }
    public TError? Error { get; set; }
}
```
```typescript
export interface Result<TData, TError> {
  isSuccess: boolean;
  data: TData | null;
  error: TError | null;
}
```

### Generic Inheritance
```csharp
[TypeSharp]
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public T? Data { get; set; }
}

[TypeSharp]
public class PagedApiResponse<T> : ApiResponse<T>
{
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
    public int TotalRecords { get; set; }
}
```
```typescript
export interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  data: T | null;
}

export interface PagedApiResponse<T> extends ApiResponse<T> {
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
}
```

## Naming Conventions

### Simple Convention
```json
{ "namingConvention": "kebab" }
```

### Advanced Convention
```json
{
  "namingConvention": {
    "dir": "kebab",
    "file": "camel"
  }
}
```

### Available Options

| Convention | Directory example | File example      |
| ---------- | ----------------- | ----------------- |
| `camel`    | `myFeature/`      | `userProfile.ts`  |
| `kebab`    | `my-feature/`     | `user-profile.ts` |
| `pascal`   | `MyFeature/`      | `UserProfile.ts`  |
| `snake`    | `my_feature/`     | `user_profile.ts` |

> Property names always use camelCase regardless of the `namingConvention` setting.

## Advanced Usage

### Inheritance

TypeSharp preserves class inheritance using `extends`:
```csharp
[TypeSharp]
public class Entity
{
    public int Id { get; set; }
}

[TypeSharp]
public class AuditableEntity : Entity
{
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

[TypeSharp]
public class User : AuditableEntity
{
    public string Name { get; set; }
    public string Email { get; set; }
}
```
```typescript
export interface Entity {
  id: number;
}

export interface AuditableEntity extends Entity {
  createdAt: string;
  updatedAt: string;
}

export interface User extends AuditableEntity {
  name: string;
  email: string;
}
```

### C# Interface Inheritance

TypeSharp automatically filters out C# interfaces from the inheritance chain. Any base type matching the standard C# interface naming convention (`I` followed by an uppercase letter) is ignored — only concrete base classes are preserved.
```csharp
[TypeSharp]
public class PaymentResult : BaseResult, IActionResult, IDisposable
{
    public bool Paid { get; set; }
}
```
```typescript
export interface PaymentResult extends BaseResult {
  paid: boolean;
}
```

> `IActionResult`, `IDisposable`, `IEquatable<T>` and any other `I`-prefixed types will never appear as `extends` clauses. You can freely implement C# interfaces on your DTOs without affecting the generated output.

### Computed Properties

TypeSharp includes expression-bodied and block getter properties:
```csharp
[TypeSharp]
public class UserDto
{
    public string FirstName { get; set; }
    public string LastName { get; set; }

    // Expression-bodied
    public string FullName => $"{FirstName} {LastName}";

    // Block getter
    public string Initials { get { return $"{FirstName[0]}{LastName[0]}"; } }
}
```
```typescript
export interface UserDto {
  firstName: string;
  lastName: string;
  fullName: string;
  initials: string;
}
```

### Multi-Project
```json
{
  "source": [
    "C:/MyApp/Api/Api.csproj",
    "C:/MyApp/Domain/Domain.csproj",
    "C:/MyApp/Contracts/Contracts.csproj"
  ],
  "outputPath": "./src/types"
}
```

Or using a solution file:
```json
{
  "source": "C:/MyApp/MyApp.sln",
  "outputPath": "./src/types"
}
```

### Single Output File
```json
{
  "source": "./Backend/Backend.csproj",
  "outputPath": "./src/types",
  "singleOutputFile": true
}
```

All types are written to `src/types/types.ts`.

### Multiple Output Files (File Grouping)
```
Backend/                           src/types/
├── DTOs/                         └── DTOs/
│   ├── UserDtos.cs               │   ├── user-dtos.ts
│   └── ProductDtos.cs            │   └── product-dtos.ts
```

Classes declared in the same C# file stay together in the generated TypeScript file.

### Programmatic Usage
```typescript
import { generate } from '@siyavuyachagi/typesharp';

await generate();                          // uses default config
await generate('./custom-config.json');    // custom config path
```

### Advanced Programmatic Usage
```typescript
import { parseCSharpFiles, generateTypeScriptFiles } from '@siyavuyachagi/typesharp';
import type { TypeSharpConfig } from '@siyavuyachagi/typesharp';

const config: TypeSharpConfig = {
  source: ["C:/Users/User/Desktop/MyApp/Api/Api.csproj"],
  outputPath: "./src/types",
  targetAnnotation: "TypeSharp",
};

const parseResults = await parseCSharpFiles(config);
generateTypeScriptFiles(config, parseResults);
```

## Integration Examples

### Vue 3 + Nuxt 3 + ASP.NET Core

**`typesharp.config.ts`:**
```typescript
import type { TypeSharpConfig } from '@siyavuyachagi/typesharp';

const config: TypeSharpConfig = {
  source: "../MyApp/MyApp.sln",
  outputPath: "./src/types",
  targetAnnotation: "TypeSharp",
  singleOutputFile: false,
  namingConvention: "camel"
};

export default config;
```

**`package.json`:**
```json
{
  "scripts": {
    "predev": "typesharp",
    "prebuild": "typesharp",
    "dev": "nuxt dev",
    "build": "nuxt build"
  }
}
```

**Usage in Vue:**
```vue
<script setup lang="ts">
import type { User } from '~/types/user';
import type { ApiResponse } from '~/types/apiResponse';

const fetchUser = async (id: number) => {
  const response = await $fetch<ApiResponse<User>>(`/api/users/${id}`);
  if (response.success) {
    user.value = response.data;
  }
};
</script>
```

### CI/CD Integration
```yaml
name: Build

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3

      - name: Install dependencies
        run: npm ci

      - name: Generate TypeScript types
        run: npx typesharp

      - name: Build frontend
        run: npm run build
```

## Troubleshooting

### No types generated

- Verify `[TypeSharp]` attribute is on your C# classes
- Check that `source` points to the correct `.csproj`, `.sln`, or `.slnx` file
- Ensure C# files are not in `bin/` or `obj/` folders
- Verify the attribute name matches `targetAnnotation` in your config

### Paths not found

- Use absolute paths on Windows: `C:/Users/User/Desktop/MyApp/MyApp.sln`
- Use absolute paths on Mac/Linux: `/home/user/projects/MyApp/MyApp.sln`

### Types not updating

The output directory is cleaned automatically on each run. If types still appear stale, re-run manually:
```bash
npx typesharp
```

### Import errors in generated files

Ensure all types referenced by a decorated class are also decorated with `[TypeSharp]`. When using `singleOutputFile: false`, TypeSharp generates imports between files automatically — if a type is missing its attribute, the import won't be generated.

### C# interfaces appearing in extends

This should no longer happen as of `v0.1.2`. TypeSharp automatically strips any base type matching the C# interface naming convention (`I` + uppercase letter). If you are seeing this, ensure you are on the latest version:
```bash
npm install @siyavuyachagi/typesharp@latest --save-dev
```

### Getting Help

1. Check this documentation
2. Review the [README.md](../README.md)
3. Search [GitHub Issues](https://github.com/siyavuyachagi/typesharp/issues)
4. Open a new issue with your TypeSharp version, Node.js version, sample C# code, config file, and error messages

## Best Practices

### Run TypeSharp Before Dev/Build
```json
{
  "scripts": {
    "predev": "typesharp",
    "prebuild": "typesharp",
    "dev": "nuxt dev",
    "build": "nuxt build"
  }
}
```

### Commit Generated Types

Committing generated types means they are always available without a build step, and changes are reviewable in PRs. If you prefer not to commit them, add the output path to `.gitignore`.

### Only Decorate DTOs
```csharp
[TypeSharp]
public class UserDto { }         // ✅ shared with frontend

public class UserEntity { }      // ❌ EF Core entity — keep internal
public class InternalConfig { }  // ❌ internal — keep internal
```

### Use Generic Types for API Responses
```csharp
[TypeSharp]
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public T? Data { get; set; }
}

[TypeSharp]
public class PagedApiResponse<T> : ApiResponse<T>
{
    public int PageNumber { get; set; }
    public int TotalPages { get; set; }
}
```
```typescript
const userResponse = await $fetch<ApiResponse<User>>('/api/users/1');
const productsResponse = await $fetch<PagedApiResponse<Product[]>>('/api/products');
```

---

**Need more help?** Check the [README.md](../README.md) or open an issue on [GitHub](https://github.com/siyavuyachagi/typesharp/issues)!