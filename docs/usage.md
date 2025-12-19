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

### Step 2: Decorate Your Models / Data Transfere Objects

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
  "projectFile": ["C:/Users/User/Desktop/MyApp/Api/Api.csproj"],
  "outputPath": "./src/types",
  "targetAnnotation": "TypeSharp",
  "singleOutputFile": false,
  "fileNamingConvention": "kebab",
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

**`projectFiles`** (string[])

- Full path to your C# .csproj file
- Must be an absolute or relative path to a `.csproj` file

```json
{
  "projectFiles": ["C:/Users/User/Desktop/MyApp/Api/Api.csproj"]
}
```

Or relative:

```json
{
  "projectFiles": ["../MyApp/Api/Api.csproj"]
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
- Don't include brackets `[]` or '`spaces`'

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

**`fileNamingConvention`** (string, default: `'kebab'`)

- How to name the output files
- Options: `'kebab'`, `'snake'`, `'camel'`, `'pascal'`

```json
{
  "fileNamingConvention": "kebab"
}
```

**`namingConvention`** (string, default: `'camel'`)

- How to transform property names
- Options: `'camel'`, `'pascal'`, `'snake'`, `'kebab'`

```json
{
  "namingConvention": "camel"
}
```

**`fileSuffix`** (string, optional)

- Suffix to append to generated file names
- The suffix will be formatted according to `fileNamingConvention`

```json
{
  "fileSuffix": "dto"
}
```

Example: If C# file is `User.cs` with suffix `"dto"` and convention `"kebab"`:

- Output: `user-dto.ts`

### Configuration File Formats

TypeSharp supports three configuration formats:

#### JSON (Recommended)

**`typesharp.config.json`**

```json
{
  "projectFiles": ["C:/Users/User/Desktop/MyApp/Api/Api.csproj"],
  "outputPath": "./src/types",
  "targetAnnotation": "TypeSharp",
  "singleOutputFile": false,
  "fileNamingConvention": "kebab",
  "namingConvention": "camel"
}
```

#### TypeScript

**`typesharp.config.ts`**

```typescript
import { TypeSharpConfig } from "typesharp";

const config: TypeSharpConfig = {
  projectFiles: ["C:/Users/User/Desktop/MyApp/Api/Api.csproj"],
  outputPath: "./src/types",
  targetAnnotation: "TypeSharp",
  singleOutputFile: false,
  fileNamingConvention: "kebab",
  namingConvention: "camel",
};

export default config;
```

#### JavaScript

**`typesharp.config.js`**

```javascript
module.exports = {
  projectFile: ["C:/Users/User/Desktop/MyApp/Api/Api.csproj"],
  outputPath: "./src/types",
  targetAnnotation: "TypeSharp",
  singleOutputFile: false,
  fileNamingConvention: "kebab",
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
# Create JSON config (default)
npx typesharp init

# Create TypeScript config
npx typesharp init --format ts
npx typesharp init -f ts

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
// Create custom attribute
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Enum)]
public class ExportTypeScriptAttribute : Attribute { }

// Use it
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

| C# Type          | TypeScript Type |
| ---------------- | --------------- |
| `DateTime`       | `string`        |
| `DateOnly`       | `string`        |
| `TimeOnly`       | `string`        |
| `DateTimeOffset` | `string`        |

### Special Types

| C# Type  | TypeScript Type |
| -------- | --------------- |
| `Guid`   | `string`        |
| `byte[]` | `string`        |

### Nullable Types

**C# Nullable Reference Types:**

```csharp
public string? Name { get; set; }        // string | null
public int? Age { get; set; }            // number | null
public DateTime? BirthDate { get; set; } // string | null
```

**TypeScript Output:**

```typescript
interface User {
  name: string | null;
  age: number | null;
  birthDate: string | null;
}
```

### Collections/Arrays

**C# Collections:**

```csharp
public int[] Numbers { get; set; }
public List<string> Tags { get; set; }
public IEnumerable<Product> Products { get; set; }
public ICollection<User> Users { get; set; }
public IList<Order> Orders { get; set; }
```

**TypeScript Output:**

```typescript
interface MyModel {
  numbers: number[];
  tags: string[];
  products: Product[];
  users: User[];
  orders: Order[];
}
```

### Enums

**C# Enum:**

```csharp
[TypeSharp]
public enum Status
{
    Active,
    Inactive,
    Pending
}
```

**TypeScript Output:**

```typescript
export enum Status {
  Active = "Active",
  Inactive = "Inactive",
  Pending = "Pending",
}
```

### Complex Types

**C# with Custom Types:**

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

**TypeScript Output:**

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

**C# Code:**

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

**TypeScript Output:**

```typescript
export interface ApiResponse<T> {
  success: boolean;
  status: number;
  message: string;
  data: T | null;
}
```

### Multiple Generic Parameters

**C# Code:**

```csharp
[TypeSharp]
public class Dictionary<TKey, TValue>
{
    public TKey Key { get; set; }
    public TValue Value { get; set; }
}
```

**TypeScript Output:**

```typescript
export interface Dictionary<TKey, TValue> {
  key: TKey;
  value: TValue;
}
```

### Generic Inheritance

**C# Code:**

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

**TypeScript Output:**

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

**In Vue 3 with Composition API:**

```typescript
import type { ApiResponse, PagedApiResponse } from "~/types/api-response";
import type { User } from "~/types/user";

// Single item response
const userResponse = ref<ApiResponse<User>>();

// Paginated response
const usersResponse = ref<PagedApiResponse<User[]>>();

// Fetching data
const fetchUser = async (id: number) => {
  const response = await $fetch<ApiResponse<User>>(`/api/users/${id}`);
  userResponse.value = response;
};

const fetchUsers = async (page: number) => {
  const response = await $fetch<PagedApiResponse<User[]>>(
    `/api/users?page=${page}`
  );
  usersResponse.value = response;
};
```

### Complex Generic Scenarios

**C# Code:**

```csharp
[TypeSharp]
public class Result<TData, TError>
{
    public bool IsSuccess { get; set; }
    public TData? Data { get; set; }
    public TError? Error { get; set; }
}

[TypeSharp]
public class ValidationError
{
    public string Field { get; set; }
    public string Message { get; set; }
}

[TypeSharp]
public class UserResult : Result<User, ValidationError>
{
    public DateTime ProcessedAt { get; set; }
}
```

**TypeScript Output:**

```typescript
export interface Result<TData, TError> {
  isSuccess: boolean;
  data: TData | null;
  error: TError | null;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface UserResult extends Result<User, ValidationError> {
  processedAt: string;
}
```

## Naming Conventions

### Property Naming Conventions

Configure how C# property names are transformed to TypeScript.

#### Camel Case (Default)

```csharp
public string UserName { get; set; }
public int UserId { get; set; }
public DateTime CreatedAt { get; set; }
```

```typescript
// namingConvention: 'camel'
interface User {
  userName: string;
  userId: number;
  createdAt: string;
}
```

#### Pascal Case

```typescript
// namingConvention: 'pascal'
interface User {
  UserName: string;
  UserId: number;
  CreatedAt: string;
}
```

#### Snake Case

```typescript
// namingConvention: 'snake'
interface User {
  user_name: string;
  user_id: number;
  created_at: string;
}
```

#### Kebab Case

```typescript
// namingConvention: 'kebab'
interface User {
  "user-name": string;
  "user-id": number;
  "created-at": string;
}
```

### File Naming Conventions

Configure how C# class names are transformed to file names.

**C# Class:** `UserProfile`

```json
{
  "fileNamingConvention": "kebab"
}
// Output: user-profile.ts

{
  "fileNamingConvention": "snake"
}
// Output: user_profile.ts

{
  "fileNamingConvention": "camel"
}
// Output: userProfile.ts

{
  "fileNamingConvention": "pascal"
}
// Output: UserProfile.ts
```

### File Suffix

Add a suffix to generated file names:

```json
{
  "fileSuffix": "dto",
  "fileNamingConvention": "kebab"
}
```

**C# File:** `User.cs`
**Output:** `user-dto.ts`

## Advanced Usage

### Inheritance Chains

TypeSharp preserves inheritance relationships.

**C#:**

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

**TypeScript Output:**

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

Generate all types in one file for easier imports.

**Config:**

```json
{
  "projectFiles": ["C:/Users/User/Desktop/MyApp/Api/Api.csproj"],
  "outputPath": "./src/types",
  "singleOutputFile": true
}
```

**Output: `src/types/types.ts`**

```typescript
/**
 * Auto-generated by TypeSharp
 * Generated at: 2024-12-12T10:30:00.000Z
 * Do not edit this file manually
 */

export interface User {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
}

export enum Status {
  Active = "Active",
  Inactive = "Inactive",
}
```

### Multiple Output Files (File Grouping)

Generate separate files preserving C# file grouping (default).

**Config:**

```json
{
  "projectFile": "C:/path/to/Api.csproj",
  "outputPath": "./src/types",
  "singleOutputFile": false,
  "fileNamingConvention": "kebab"
}
```

**C# Structure:**

```
Backend/
├── DTOs/
│   ├── UserDtos.cs
│   │   ├── UserCreateDto
│   │   ├── UserUpdateDto
│   │   └── UserResponseDto
│   └── ProductDtos.cs
│       ├── ProductDto
│       └── ProductCreateDto
```

**TypeScript Output:**

```
src/types/
├── DTOs/
│   ├── user-dtos.ts      ← All 3 User DTOs together
│   └── product-dtos.ts   ← All 2 Product DTOs together
```

This means if you organize related DTOs in one C# file, they'll stay together in the generated TypeScript file!

### Programmatic Usage

Use TypeSharp in your Node.js scripts.

```typescript
import { generate, loadConfig } from "typesharp";

async function generateTypes() {
  try {
    // Using default config file
    await generate();

    // Or with custom config path
    await generate("./custom-config.json");

    console.log("Types generated successfully!");
  } catch (error) {
    console.error("Error generating types:", error);
  }
}

generateTypes();
```

### Advanced Programmatic Usage

```typescript
import {
  parseCSharpFiles,
  generateTypeScriptFiles,
  TypeSharpConfig,
} from "typesharp";

async function customGeneration() {
  const config: TypeSharpConfig = {
    projectFiles: ["C:/Users/User/Desktop/MyApp/Api/Api.csproj"],
    outputPath: "./src/types",
    targetAnnotation: "TypeSharp",
  };

  // Parse C# files
  const parseResults = await parseCSharpFiles(config);

  // Get all classes
  const classes = parseResults.flatMap((r) => r.classes);

  // Custom filtering or transformation
  const filteredClasses = classes.filter((c) => !c.name.startsWith("Internal"));

  // Generate TypeScript
  generateTypeScriptFiles(config, parseResults);
}

customGeneration();
```

## Integration Examples

### Vue 3 + Nuxt 3 + ASP.NET Core

**Project Structure:**

```
my-project/
├── Backend/              # ASP.NET Core
│   └── Models/
│       └── User.cs
├── frontend/             # Nuxt 3
│   ├── src/
│   │   └── types/       # Generated types
│   ├── package.json
│   └── typesharp.config.json
```

**typesharp.config.json:**

```json
{
  "projectFile": ["../MyApp/Api/Api.csproj"],
  "outputPath": "./src/types",
  "targetAnnotation": "TypeSharp",
  "singleOutputFile": false,
  "fileNamingConvention": "kebab",
  "namingConvention": "camel"
}
```

**package.json:**

```json
{
  "scripts": {
    "generate-types": "typesharp",
    "dev": "npm run generate-types && nuxt dev",
    "build": "npm run generate-types && nuxt build",
    "predev": "typesharp",
    "prebuild": "typesharp"
  }
}
```

**Usage in Vue with Composition API:**

```vue
<script setup lang="ts">
import type { User } from "~/types/user";
import type { ApiResponse } from "~/types/api-response";

const user = ref<User>({
  id: 1,
  name: "John Doe",
  email: "john@example.com",
  createdAt: new Date().toISOString(),
});

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

**GitLab CI:**

```yaml
build:
  stage: build
  script:
    - npm ci
    - npx typesharp
    - npm run build
```

### Watch Mode (Custom Script)

Create a watch script for development:

```typescript
// scripts/watch-types.ts
import { watch } from "fs";
import { generate } from "typesharp";

const projectDir = "../Backend";

console.log("👀 Watching for C# file changes...");

watch(projectDir, { recursive: true }, async (eventType, filename) => {
  if (filename?.endsWith(".cs")) {
    console.log(`📝 Detected change in ${filename}`);
    try {
      await generate();
      console.log("✅ Types regenerated");
    } catch (error) {
      console.error("❌ Error:", error);
    }
  }
});
```

**package.json:**

```json
{
  "scripts": {
    "watch-typesharp": "ts-node scripts/watch-types.ts"
  }
}
```

## Troubleshooting

### Common Issues

#### 1. No types generated

**Problem:** TypeSharp runs but no files are created.

**Solution:**

- Verify `[TypeSharp]` attribute is on your C# classes
- Check that `projectFile` points to the correct `.csproj` file
- Ensure C# files are not in `bin/` or `obj/` folders
- Verify attribute name matches `targetAnnotation` in config

#### 2. Wrong attribute name

**Problem:** Using a different attribute name.

**Solution:**
Update your config:

```json
{
  "targetAnnotation": "YourCustomAttribute"
}
```

#### 3. Paths not found

**Problem:** "Project file does not exist" error.

**Solution:**

- Use absolute paths for `projectFile`
- On Windows: `C:/Users/User/Desktop/MyApp/Api/Api.csproj`
- On Mac/Linux: `/home/user/projects/MyApp/Api/Api.csproj`
- Or use relative paths from where you run the command

#### 4. Types not updating

**Problem:** Changes in C# not reflected in TypeScript.

**Solution:**

- Re-run `npx typesharp`
- Check if you modified the right C# files
- Ensure files have `[TypeSharp]` attribute
- Clear output directory and regenerate

```bash
rm -rf ./src/types/*
npx typesharp
```

#### 5. Import errors in TypeScript

**Problem:** Generated types have import errors.

**Solution:**

- Ensure all referenced types also have `[TypeSharp]` attribute
- Use single output file for easier imports
- Check TypeScript path aliases in `tsconfig.json`

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "~/types/*": ["./src/types/*"]
    }
  }
}
```

#### 6. Generic types not working

**Problem:** Generic types like `ApiResponse<T>` not generating correctly.

**Solution:**

- Ensure you're using TypeSharp v1.0.0 or later
- Check that the C# class has the `[TypeSharp]` attribute
- Verify the base class also has the attribute if using generic inheritance

### Debug Tips

#### Check Config

Verify your configuration is correct:

```typescript
import { loadConfig } from "typesharp";

const config = loadConfig();
console.log(config);
```

#### Verify C# Attribute

Ensure attribute is properly defined and used:

```csharp
// Check namespace is imported
using YourProject.Attributes;

// Check attribute is on class
[TypeSharp]  // ✅
public class User { }

// Not this
public class User { } // ❌ Missing attribute
```

#### Check Output Directory

Verify output directory permissions:

```bash
# On Unix/Mac
ls -la ./src/types/

# Check if directory is writable
touch ./src/types/test.txt && rm ./src/types/test.txt
```

### Getting Help

If you encounter issues:

1. Check this documentation
2. Review the [README.md](../README.md)
3. Search [GitHub Issues](https://github.com/siyavuyachagi/typesharp/issues)
4. Open a new issue with:
   - TypeSharp version
   - Node.js version
   - Sample C# code
   - Configuration file
   - Error messages

## Best Practices

### 1. Use TypeSharp in Build Process

Automatically generate types before development/build:

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

### 2. Commit Generated Types

**Option A: Commit types (Recommended)**

- Types are always available
- No build step needed for new developers
- Easier to review changes

```gitignore
# Don't ignore types
# src/types/
```

**Option B: Don't commit types**

- Smaller repository
- Requires generation on every machine
- Add to `.gitignore`:

```gitignore
src/types/
```

### 3. Use Single Output File for Small Projects

For small projects with few models:

```json
{
  "singleOutputFile": true
}
```

For large projects:

```json
{
  "singleOutputFile": false
}
```

### 4. Consistent Naming

Stick to one naming convention throughout your project:

```json
{
  "fileNamingConvention": "kebab",
  "namingConvention": "camel"
}
```

### 5. Only Decorate DTOs

Only add `[TypeSharp]` to models you want to share with frontend:

```csharp
// DTOs - Add attribute ✅
[TypeSharp]
public class UserDto { }

[TypeSharp]
public class ProductResponse { }

// Internal models - Don't add attribute ❌
public class UserEntity { }        // EF Core entity
public class InternalConfig { }    // Internal config
```

### 6. Keep Attribute Simple

The attribute only needs to mark classes for export:

```csharp
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Enum)]
public class TypeSharpAttribute : Attribute { }
```

No need for complex attribute properties.

### 7. Test Generated Types

After generation, verify types work:

```typescript
import { User } from "./types/user";
import { ApiResponse } from "./types/api-response";

const response: ApiResponse<User> = {
  success: true,
  status: 200,
  message: "User retrieved",
  data: {
    id: 1,
    name: "Test",
    email: "test@example.com",
    createdAt: new Date().toISOString(),
  },
  timestamp: new Date().toISOString(),
};

// TypeScript will error if structure doesn't match
```

### 8. Use Generic Types for API Responses

Leverage generic types for consistent API responses:

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

Then use in frontend:

```typescript
import type { ApiResponse, PagedApiResponse } from "~/types/api-response";
import type { User, Product } from "~/types/models";

// Type-safe API calls
const userResponse = await $fetch<ApiResponse<User>>("/api/users/1");
const productsResponse = await $fetch<PagedApiResponse<Product[]>>(
  "/api/products"
);
```

---

**Need more help?** Check the [README.md](../README.md) or open an issue on [GitHub](https://github.com/siyavuyachagi/typesharp)!
