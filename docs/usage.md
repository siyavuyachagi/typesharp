# TypeSharp Usage Guide

Complete guide to using TypeSharp for generating TypeScript types from C# models.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [CLI Usage](#cli-usage)
- [C# Attribute Setup](#c-attribute-setup)
- [Type Mappings](#type-mappings)
- [Naming Conventions](#naming-conventions)
- [Advanced Usage](#advanced-usage)
- [Integration Examples](#integration-examples)
- [Troubleshooting](#troubleshooting)

## Installation

### Install as Dev Dependency

```bash
npm install typesharp --save-dev
```

### Install Globally (Optional)

```bash
npm install -g typesharp
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

### Step 2: Decorate Your Models

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

This creates `typesharp.config.ts` in your project root.

### Step 4: Configure Paths

Edit `typesharp.config.ts`:

```typescript
import { TypeSharpConfig } from 'typesharp';

const config: TypeSharpConfig = {
  targetPath: './Backend',      // Your C# project path
  outputPath: './src/types',     // Where to generate TS files
  targetAnnotation: 'TypeSharp',
  singleOutputFile: false,
  fileNamingConvention: 'kebab',
  namingConvention: 'camel'
};

export default config;
```

### Step 5: Generate Types

```bash
npx typesharp
```

## Configuration

### Configuration Options

#### Required Options

**`targetPath`** (string)
- Path to your C# project directory
- Can be relative or absolute
- TypeSharp will scan all `.cs` files recursively

```typescript
targetPath: './Backend'
targetPath: '../MyAPI'
targetPath: '/absolute/path/to/project'
```

**`outputPath`** (string)
- Where TypeScript files will be generated
- Directory will be created if it doesn't exist

```typescript
outputPath: './src/types'
outputPath: './types'
outputPath: './frontend/src/models'
```

#### Optional Options

**`targetAnnotation`** (string, default: `'TypeSharp'`)
- The C# attribute name to look for
- Don't include brackets `[]`

```typescript
targetAnnotation: 'TypeSharp'
targetAnnotation: 'GenerateTS'
targetAnnotation: 'ExportToTypeScript'
```

**`singleOutputFile`** (boolean, default: `false`)
- `false`: Generate one file per class
- `true`: Generate all types in one file

```typescript
// Multiple files
singleOutputFile: false
// Output: user.ts, product.ts, order.ts

// Single file
singleOutputFile: true
// Output: types.ts (contains all types)
```

**`fileNamingConvention`** (string, default: `'kebab'`)
- How to name the output files
- Options: `'kebab'`, `'snake'`, `'camel'`, `'pascal'`

```typescript
// Class: UserProfile

fileNamingConvention: 'kebab'  // user-profile.ts
fileNamingConvention: 'snake'  // user_profile.ts
fileNamingConvention: 'camel'  // userProfile.ts
fileNamingConvention: 'pascal' // UserProfile.ts
```

**`namingConvention`** (string, default: `'camel'`)
- How to transform property names
- Options: `'camel'`, `'pascal'`, `'snake'`, `'kebab'`

```typescript
// C# Property: UserName

namingConvention: 'camel'  // userName
namingConvention: 'pascal' // UserName
namingConvention: 'snake'  // user_name
namingConvention: 'kebab'  // user-name
```

### Configuration File Formats

TypeSharp supports three configuration formats:

#### TypeScript (Recommended)

**`typesharp.config.ts`**
```typescript
import { TypeSharpConfig } from 'typesharp';

const config: TypeSharpConfig = {
  targetPath: './Backend',
  outputPath: './src/types',
  targetAnnotation: 'TypeSharp',
  singleOutputFile: false,
  fileNamingConvention: 'kebab',
  namingConvention: 'camel'
};

export default config;
```

#### JavaScript

**`typesharp.config.js`**
```javascript
module.exports = {
  targetPath: './Backend',
  outputPath: './src/types',
  targetAnnotation: 'TypeSharp',
  singleOutputFile: false,
  fileNamingConvention: 'kebab',
  namingConvention: 'camel'
};
```

#### JSON

**`typesharp.config.json`**
```json
{
  "targetPath": "./Backend",
  "outputPath": "./src/types",
  "targetAnnotation": "TypeSharp",
  "singleOutputFile": false,
  "fileNamingConvention": "kebab",
  "namingConvention": "camel"
}
```

### Custom Config Path

Use a custom configuration file:

```bash
npx typesharp --config ./configs/my-config.ts
npx typesharp generate -c ./custom.config.js
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
npx typesharp generate --config ./my-config.ts
npx typesharp -c ./my-config.ts
```

#### Init

Create a sample configuration file.

```bash
# Create TypeScript config (default)
npx typesharp init

# Create JavaScript config
npx typesharp init --format js
npx typesharp init -f js

# Create JSON config
npx typesharp init --format json
npx typesharp init -f json
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

```typescript
const config: TypeSharpConfig = {
  targetPath: './Backend',
  outputPath: './src/types',
  targetAnnotation: 'ExportTypeScript'
};
```

## Type Mappings

### Primitive Types

| C# Type | TypeScript Type |
|---------|-----------------|
| `string` | `string` |
| `int` | `number` |
| `long` | `number` |
| `float` | `number` |
| `double` | `number` |
| `decimal` | `number` |
| `bool` | `boolean` |
| `object` | `any` |

### Date/Time Types

| C# Type | TypeScript Type |
|---------|-----------------|
| `DateTime` | `string` |
| `DateOnly` | `string` |
| `TimeOnly` | `string` |
| `DateTimeOffset` | `string` |

### Special Types

| C# Type | TypeScript Type |
|---------|-----------------|
| `Guid` | `string` |
| `byte[]` | `string` |

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
  Active = 'Active',
  Inactive = 'Inactive',
  Pending = 'Pending'
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
  'user-name': string;
  'user-id': number;
  'created-at': string;
}
```

### File Naming Conventions

Configure how C# class names are transformed to file names.

**C# Class:** `UserProfile`

```typescript
fileNamingConvention: 'kebab'  // user-profile.ts (recommended)
fileNamingConvention: 'snake'  // user_profile.ts
fileNamingConvention: 'camel'  // userProfile.ts
fileNamingConvention: 'pascal' // UserProfile.ts
```

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
```typescript
const config: TypeSharpConfig = {
  targetPath: './Backend',
  outputPath: './src/types',
  singleOutputFile: true
};
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
  Active = 'Active',
  Inactive = 'Inactive'
}
```

### Multiple Output Files

Generate separate files for each class (default).

**Config:**
```typescript
const config: TypeSharpConfig = {
  targetPath: './Backend',
  outputPath: './src/types',
  singleOutputFile: false,
  fileNamingConvention: 'kebab'
};
```

**Output:**
```
src/types/
├── user.ts
├── product.ts
└── status.ts
```

### Programmatic Usage

Use TypeSharp in your Node.js scripts.

```typescript
import { generate, loadConfig } from 'typesharp';

async function generateTypes() {
  try {
    // Using default config file
    await generate();
    
    // Or with custom config path
    await generate('./custom-config.ts');
    
    console.log('Types generated successfully!');
  } catch (error) {
    console.error('Error generating types:', error);
  }
}

generateTypes();
```

### Advanced Programmatic Usage

```typescript
import { 
  parseCSharpFiles, 
  generateTypeScriptFiles,
  TypeSharpConfig 
} from 'typesharp';

async function customGeneration() {
  const config: TypeSharpConfig = {
    targetPath: './Backend',
    outputPath: './src/types',
    targetAnnotation: 'TypeSharp'
  };
  
  // Parse C# files
  const parseResults = await parseCSharpFiles(
    config.targetPath,
    config.targetAnnotation
  );
  
  // Get all classes
  const classes = parseResults.flatMap(r => r.classes);
  
  // Custom filtering or transformation
  const filteredClasses = classes.filter(c => !c.name.startsWith('Internal'));
  
  // Generate TypeScript
  generateTypeScriptFiles(filteredClasses, config);
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
│   └── typesharp.config.ts
```

**typesharp.config.ts:**
```typescript
import { TypeSharpConfig } from 'typesharp';

const config: TypeSharpConfig = {
  targetPath: '../Backend',
  outputPath: './src/types',
  targetAnnotation: 'TypeSharp',
  singleOutputFile: false,
  fileNamingConvention: 'kebab',
  namingConvention: 'camel'
};

export default config;
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

**Usage in Vue:**
```vue
<script setup lang="ts">
import type { User } from '~/types/user';

const user = ref<User>({
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  createdAt: new Date().toISOString()
});
</script>
```

### React + Vite + ASP.NET Core

**package.json:**
```json
{
  "scripts": {
    "generate-types": "typesharp",
    "dev": "typesharp && vite",
    "build": "typesharp && tsc && vite build"
  }
}
```

**Usage in React:**
```tsx
import { User } from './types/user';

function UserProfile({ user }: { user: User }) {
  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
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
import { watch } from 'fs';
import { generate } from 'typesharp';

const targetPath = './Backend';

console.log('👀 Watching for C# file changes...');

watch(targetPath, { recursive: true }, async (eventType, filename) => {
  if (filename?.endsWith('.cs')) {
    console.log(`📝 Detected change in ${filename}`);
    try {
      await generate();
      console.log('✅ Types regenerated');
    } catch (error) {
      console.error('❌ Error:', error);
    }
  }
});
```

**package.json:**
```json
{
  "scripts": {
    "watch-types": "ts-node scripts/watch-types.ts"
  }
}
```

## Troubleshooting

### Common Issues

#### 1. No types generated

**Problem:** TypeSharp runs but no files are created.

**Solution:**
- Verify `[TypeSharp]` attribute is on your C# classes
- Check that `targetPath` points to the correct directory
- Ensure C# files are not in `bin/` or `obj/` folders
- Verify attribute name matches `targetAnnotation` in config

```bash
# Enable verbose output (coming soon)
npx typesharp --verbose
```

#### 2. Wrong attribute name

**Problem:** Using a different attribute name.

**Solution:**
Update your config:

```typescript
const config: TypeSharpConfig = {
  targetPath: './Backend',
  outputPath: './src/types',
  targetAnnotation: 'YourCustomAttribute' // Match your C# attribute
};
```

#### 3. Paths not found

**Problem:** "Target path does not exist" error.

**Solution:**
- Use relative paths from where you run the command
- Or use absolute paths
- Ensure the directory exists

```typescript
// From frontend/ directory
targetPath: '../Backend'           // ✅ Good
targetPath: './Backend'            // ❌ Wrong if Backend is outside frontend/
targetPath: '/absolute/path/to/Backend' // ✅ Also works
```

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

#### 6. Enum values not strings

**Problem:** Want numeric enums instead of string enums.

**Solution:**
Currently TypeSharp only generates string enums for better type safety. This is intentional to match common TypeScript best practices.

If you need numeric enums, consider using plain TypeScript enums manually or open an issue for feature request.

### Debug Tips

#### Check Config

Verify your configuration is correct:

```typescript
import { loadConfig } from 'typesharp';

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
2. Review the [README.md](README.md)
3. Search [GitHub Issues](https://github.com/yourusername/typesharp/issues)
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

```typescript
singleOutputFile: true  // Easier imports
```

For large projects:

```typescript
singleOutputFile: false  // Better organization
```

### 4. Consistent Naming

Stick to one naming convention throughout your project:

```typescript
const config: TypeSharpConfig = {
  fileNamingConvention: 'kebab',  // user-profile.ts
  namingConvention: 'camel'        // userName
};
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
import { User } from './types/user';

const user: User = {
  id: 1,
  name: 'Test',
  email: 'test@example.com',
  createdAt: new Date().toISOString()
};

// TypeScript will error if structure doesn't match
```

---

**Need more help?** Check the [README.md](README.md) or open an issue on GitHub!