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

### Step 1: Create the TypeSharp Attribute in C#

In your C# project, create a custom attribute:

```csharp
// Attributes/TypeSharpAttribute.cs
using System;

namespace YourProject.Attributes
{
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Enum)]
    public class TypeSharpAttribute : Attribute
    {
    }
}
```

### Step 2: Decorate Your Models / Data Transfer Objects

```csharp
using YourProject.Attributes;

[TypeSharp]
public class User
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string? Email { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

### Step 3: Initialize Configuration

```bash
npx typesharp init
```

This creates `typesharp.config.json` in your project root.

### Step 4: Configure Paths

Edit `typesharp.config.json`:

```json
{
  "projectFiles": ["C:/Users/User/Desktop/MyApp/Api/Api.csproj"],
  "outputPath": "./src/types",
  "targetAnnotation": "TypeSharp",
  "singleOutputFile": false,
  "namingConvention": "camel"
}
```

### Step 5: Generate Types

```bash
npx typesharp
```

## Configuration

### Configuration Options

#### Required Options

**`projectFiles`** (`string | string[]`)

- Full path(s) to your C# `.csproj` file(s)
- Accepts a single path or an array for multi-project setups

```json
{
  "projectFiles": ["C:/Users/User/Desktop/MyApp/Api/Api.csproj"]
}
```

Or multiple projects:

```json
{
  "projectFiles": [
    "C:/Users/User/Desktop/MyApp/Api/Api.csproj",
    "C:/Users/User/Desktop/MyApp/Domain/Domain.csproj"
  ]
}
```

**`outputPath`** (string)

- Where TypeScript files will be generated
- Directory will be created if it doesn't exist

```json
{
  "outputPath": "./src/types"
}
```

#### Optional Options

**`targetAnnotation`** (string, default: `'TypeSharp'`)

- The C# attribute name to look for
- Don't include brackets `[]` or spaces

```json
{
  "targetAnnotation": "TypeSharp"
}
```

**`singleOutputFile`** (boolean, default: `false`)

- `false`: Generate one file per C# source file (preserves grouping)
- `true`: Generate all types in one file

```json
{
  "singleOutputFile": false
}
```

**`namingConvention`** (`string | { dir, file }`, default: `'camel'`)

- Controls naming for output directories and files
- Accepts a simple string or a config object for separate control

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

**`fileSuffix`** (string, optional)

- Suffix to append to generated file names, formatted according to `namingConvention`

```json
{
  "fileSuffix": "dto"
}
```

Example: C# file `User.cs` with suffix `"dto"` and convention `"kebab"` → `user-dto.ts`

### Configuration File Formats

TypeSharp supports three configuration formats:

#### JSON

**`typesharp.config.json`**

```json
{
  "projectFiles": ["C:/Users/User/Desktop/MyApp/Api/Api.csproj"],
  "outputPath": "./src/types",
  "targetAnnotation": "TypeSharp",
  "singleOutputFile": false,
  "namingConvention": "camel"
}
```

#### TypeScript

**`typesharp.config.ts`** (Recommended)

```typescript
import { TypeSharpConfig } from "typesharp";

const config: TypeSharpConfig = {
  projectFiles: ["C:/Users/User/Desktop/MyApp/Api/Api.csproj"],
  outputPath: "./src/types",
  targetAnnotation: "TypeSharp",
  singleOutputFile: false,
  namingConvention: "camel",
};

export default config;
```

#### JavaScript

**`typesharp.config.js`**

```javascript
module.exports = {
  projectFiles: ["C:/Users/User/Desktop/MyApp/Api/Api.csproj"],
  outputPath: "./src/types",
  targetAnnotation: "TypeSharp",
  singleOutputFile: false,
  namingConvention: "camel",
};
```

### Custom Config Path

Use a custom configuration file:

```bash
npx typesharp --config ./configs/my-config.json
npx typesharp generate -c ./custom.config.ts
```

## CLI Usage

### Commands

#### Generate (Default Command)

Generate TypeScript types from C# files.

```bash
# Using default config
npx typesharp

# Explicit generate command
npx typesharp generate

# With custom config
npx typesharp generate --config ./my-config.json
npx typesharp -c ./my-config.json
```

#### Init

Create a sample configuration file.

```bash
# Create TypeScript config (default)
npx typesharp init

# Create JSON config
npx typesharp init --format json
npx typesharp init -f json

# Create JavaScript config
npx typesharp init --format js
npx typesharp init -f js
```

#### Help

Display help information.

```bash
npx typesharp --help
npx typesharp generate --help
npx typesharp init --help
```

#### Version

Display version information.

```bash
npx typesharp --version
npx typesharp -V
```

## C# Attribute Setup

### Basic Attribute

Create the attribute in your C# project:

```csharp
// Attributes/TypeSharpAttribute.cs
using System;

namespace YourProject.Attributes
{
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Enum)]
    public class TypeSharpAttribute : Attribute
    {
    }
}
```

### Using the Attribute

#### On Classes

```csharp
using YourProject.Attributes;

[TypeSharp]
public class Product
{
    public int Id { get; set; }
    public string Name { get; set; }
    public decimal Price { get; set; }
}
```

#### On Enums

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

#### With Inheritance

```csharp
[TypeSharp]
public class BaseEntity
{
    public int Id { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

[TypeSharp]
public class User : BaseEntity
{
    public string Name { get; set; }
    public string Email { get; set; }
}
```

### Custom Attribute Names

You can use a different attribute name:

```csharp
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Enum)]
public class ExportTypeScriptAttribute : Attribute { }

[ExportTypeScript]
public class MyModel { }
```

Then update your config:

```json
{
  "targetAnnotation": "ExportTypeScript"
}
```

## Type Mappings

### Primitive Types

| C# Type   | TypeScript Type |
| --------- | --------------- |
| `string`  | `string`        |
| `int`     | `number`        |
| `long`    | `number`        |
| `float`   | `number`        |
| `double`  | `number`        |
| `decimal` | `number`        |
| `bool`    | `boolean`       |
| `object`  | `any`           |

### Date/Time Types

| C# Type    | TypeScript Type |
| ---------- | --------------- |
| `DateTime` | `string`        |
| `DateOnly` | `string`        |
| `TimeOnly` | `string`        |

### Collections

| C# Type                                                           | TypeScript Type |
| ----------------------------------------------------------------- | --------------- |
| `T[]`, `List<T>`, `IList<T>`, `ICollection<T>`, `IEnumerable<T>`  | `T[]`           |
| `Dictionary<K,V>`, `IDictionary<K,V>`, `IReadOnlyDictionary<K,V>` | `Record<K, V>`  |

### Special & File Types

| C# Type               | TypeScript Type |
| --------------------- | --------------- |
| `Guid`                | `string`        |
| `byte[]`              | `Blob`          |
| `IFormFile`           | `File`          |
| `FormFile`            | `File`          |
| `IFormFileCollection` | `File[]`        |
| `FileStream`          | `Blob`          |
| `MemoryStream`        | `Blob`          |
| `Stream`              | `Blob`          |

### Nullable Types

```csharp
public class User {
  public string? Name { get; set; }        // string | null
  public int? Age { get; set; }            // number | null
  public DateTime? BirthDate { get; set; } // string | null
}
```

```typescript
export interface User {
  name: string | null;
  age: number | null;
  birthDate: string | null;
}
```

### Collections/Arrays

```csharp
public class MyModel {
  public int[] Numbers { get; set; }
  public List<string> Tags { get; set; }
  public IEnumerable<Product> Products { get; set; }
  public ICollection<User> Users { get; set; }
  public IList<Order> Orders { get; set; }
}
```

```typescript
export interface MyModel {
  numbers: number[];
  tags: string[];
  products: Product[];
  users: User[];
  orders: Order[];
}
```

### Dictionary Types

```csharp
public class MyModel {
  public Dictionary<string, bool> Flags { get; set; }
  public IReadOnlyDictionary<string, List<string>> RolePermissions { get; set; }
}
```

```typescript
export interface MyModel {
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

### Complex Types

```csharp
[TypeSharp]
public class Address
{
    public string Street { get; set; }
    public string City { get; set; }
}

[TypeSharp]
public class User
{
    public int Id { get; set; }
    public Address Address { get; set; }
    public List<Address> PreviousAddresses { get; set; }
}
```

```typescript
export interface Address {
  street: string;
  city: string;
}

export interface User {
  id: number;
  address: Address;
  previousAddresses: Address[];
}
```

## Generic Types Support

TypeSharp fully supports C# generic types and preserves them in TypeScript output.

### Single Generic Parameter

```csharp
[TypeSharp]
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public int Status { get; set; }
    public string Message { get; set; }
    public T? Data { get; set; }
}
```

```typescript
export interface ApiResponse<T> {
  success: boolean;
  status: number;
  message: string;
  data: T | null;
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
    public string Message { get; set; }
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
  message: string;
  data: T | null;
}

export interface PagedApiResponse<T> extends ApiResponse<T> {
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
}
```

### Using Generated Generic Types

```typescript
import type { ApiResponse, PagedApiResponse } from "~/types/api-response";
import type { User } from "~/types/user";

const userResponse = ref<ApiResponse<User>>();
const usersResponse = ref<PagedApiResponse<User[]>>();

const fetchUser = async (id: number) => {
  const response = await $fetch<ApiResponse<User>>(`/api/users/${id}`);
  userResponse.value = response;
};

const fetchUsers = async (page: number) => {
  const response = await $fetch<PagedApiResponse<User[]>>(
    `/api/users?page=${page}`,
  );
  usersResponse.value = response;
};
```

## Naming Conventions

### Simple Convention

A single string applies to both directories and files:

```json
{ "namingConvention": "kebab" }
```

### Advanced Convention

Separate control over directories and files:

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

### Property Names

Property names always use camelCase regardless of the `namingConvention` setting:

```csharp
public class User {
  public string UserName { get; set; }
  public int UserId { get; set; }
}
```

```typescript
export interface User {
  userName: string;
  userId: number;
}
```

### File Suffix

Add a suffix to generated file names:

```json
{
  "fileSuffix": "dto",
  "namingConvention": "kebab"
}
```

`User.cs` → `user-dto.ts`

## Advanced Usage

### Inheritance Chains

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

### Single Output File

```json
{
  "projectFiles": ["C:/Users/User/Desktop/MyApp/Api/Api.csproj"],
  "outputPath": "./src/types",
  "singleOutputFile": true
}
```

All types are written to `src/types/types.ts`.

### Multiple Output Files (File Grouping)

```json
{
  "projectFiles": ["C:/path/to/Api.csproj"],
  "outputPath": "./src/types",
  "singleOutputFile": false,
  "namingConvention": "kebab"
}
```

```
Backend/                           src/types/
├── DTOs/                         └── DTOs/
│   ├── UserDtos.cs               │   ├── user-dtos.ts
│   └── ProductDtos.cs            │   └── product-dtos.ts
```

Classes declared in the same C# file stay together in the generated TypeScript file.

### Programmatic Usage

```typescript
import { generate } from "typesharp";

await generate(); // uses default config
await generate("./custom-config.json"); // custom config path
```

### Advanced Programmatic Usage

```typescript
import { parseCSharpFiles, generateTypeScriptFiles } from "typesharp";
import type { TypeSharpConfig } from "typesharp";

const config: TypeSharpConfig = {
  projectFiles: ["C:/Users/User/Desktop/MyApp/Api/Api.csproj"],
  outputPath: "./src/types",
  targetAnnotation: "TypeSharp",
};

const parseResults = await parseCSharpFiles(config);
generateTypeScriptFiles(config, parseResults);
```

## Integration Examples

### Vue 3 + Nuxt 3 + ASP.NET Core

**typesharp.config.json:**

```json
{
  "projectFiles": ["../MyApp/Api/Api.csproj"],
  "outputPath": "./src/types",
  "targetAnnotation": "TypeSharp",
  "singleOutputFile": false,
  "namingConvention": "camel"
}
```

**package.json:**

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
import type { User } from "~/types/user";
import type { ApiResponse } from "~/types/api-response";

const fetchUser = async (id: number) => {
  const response = await $fetch<ApiResponse<User>>(`/api/users/${id}`);
  if (response.success) {
    user.value = response.data;
  }
};
</script>
```

### CI/CD Integration

**GitHub Actions:**

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

### Watch Mode (Custom Script)

```typescript
// scripts/watch-types.ts
import { watch } from "fs";
import { generate } from "typesharp";

watch("../Backend", { recursive: true }, async (_, filename) => {
  if (filename?.endsWith(".cs")) {
    await generate();
  }
});
```

## Troubleshooting

### Common Issues

#### No types generated

- Verify `[TypeSharp]` attribute is on your C# classes
- Check that `projectFiles` points to the correct `.csproj` file
- Ensure C# files are not in `bin/` or `obj/` folders
- Verify the attribute name matches `targetAnnotation` in your config

#### Paths not found

- Use absolute paths on Windows: `C:/Users/User/Desktop/MyApp/Api/Api.csproj`
- Use absolute paths on Mac/Linux: `/home/user/projects/MyApp/Api/Api.csproj`

#### Types not updating

The output directory is cleaned automatically on each run. If types still appear stale, re-run manually:

```bash
npx typesharp
```

#### Import errors in generated files

Ensure all types referenced by a decorated class are also decorated with `[TypeSharp]`. When using `singleOutputFile: false`, TypeSharp generates imports between files automatically — if a type is missing its attribute, the import won't be generated.

#### Generic types not working

- Ensure you are on TypeSharp v0.2.0 or later
- Verify the base class also has the `[TypeSharp]` attribute when using generic inheritance

### Debug Tips

```typescript
import { loadConfig } from "typesharp";

const config = loadConfig();
console.log(config);
```

### Getting Help

1. Check this documentation
2. Review the [README.md](../README.md)
3. Search [GitHub Issues](https://github.com/siyavuyachagi/typesharp/issues)
4. Open a new issue with your TypeSharp version, Node.js version, sample C# code, config file, and error messages

## Best Practices

### 1. Run TypeSharp Before Dev/Build

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

### 2. Commit Generated Types (Recommended)

Committing generated types means they are always available without a build step, and changes are reviewable in PRs. If you prefer not to commit them, add the output path to `.gitignore`.

### 3. Use Single Output File for Small Projects

For small projects with few models, `singleOutputFile: true` simplifies imports. For larger projects, keep it `false` to preserve file grouping.

### 4. Consistent Naming

```json
{
  "namingConvention": "kebab"
}
```

Or with separate dir and file control:

```json
{
  "namingConvention": {
    "dir": "kebab",
    "file": "camel"
  }
}
```

### 5. Only Decorate DTOs

Only add `[TypeSharp]` to models you want shared with the frontend:

```csharp
[TypeSharp]
public class UserDto { }         // ✅ shared

public class UserEntity { }      // ❌ EF Core entity, keep internal
public class InternalConfig { }  // ❌ internal, keep internal
```

### 6. Use Generic Types for API Responses

```csharp
[TypeSharp]
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string Message { get; set; }
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
const userResponse = await $fetch<ApiResponse<User>>("/api/users/1");
const productsResponse =
  await $fetch<PagedApiResponse<Product[]>>("/api/products");
```

---

**Need more help?** Check the [README.md](../README.md) or open an issue on [GitHub](https://github.com/siyavuyachagi/typesharp/issues)!
