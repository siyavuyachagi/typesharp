# TypeSharp – Feature Implementation Plan

> **Repo:** [github.com/siyavuyachagi/typesharp](https://github.com/siyavuyachagi/typesharp)  
> **Goal:** Automatically generate TypeScript interfaces from C# models — keeping ASP.NET Core + Vue/Nuxt/React projects in sync.

---

## Current Capabilities

- ✅ Nullable types
- ✅ Enums
- ✅ Inheritance
- ✅ Arrays
- ✅ Custom naming conventions

---

## Planned Features (Priority Order)

---

### 1. `TypeSharp.AspNetCore` NuGet Package

**Why first:** Attributes define generation rules — all other features build on top of this. Rather than requiring users to define custom attributes in their own codebase, all attributes are shipped as a versioned NuGet package.

#### Installation

```bash
dotnet add package TypeSharp.AspNetCore
```

#### Package Structure

```
TypeSharp.AspNetCore
 └── Attributes/
      ├── TypeIgnoreAttribute.cs
      ├── TypeNameAttribute.cs
      └── TypeAsAttribute.cs
```

#### Usage

```csharp
using TypeSharp.AspNetCore;

public class UserDto
{
    [TypeIgnore]
    public string PasswordHash { get; set; }

    [TypeName("created_at")]
    public DateTime CreatedAt { get; set; }

    [TypeAs("Date")]
    public DateTime UpdatedAt { get; set; }

    public string? Bio { get; set; } // nullable → optional automatically
}
```

#### Generated Output

```ts
export interface UserDto {
  created_at: string;
  updatedAt: Date;
  bio?: string;
}
```

#### Attributes

| Attribute | Purpose |
|---|---|
| `[TypeIgnore]` | Exclude property from output |
| `[TypeName("...")]` | Rename property in generated TypeScript |
| `[TypeAs("...")]` | Override inferred TypeScript type |

> Nullable (`?`) on a C# property automatically produces an optional (`?`) TypeScript property — no attribute needed.

#### Why a Separate Package

- No boilerplate in the user's project — just install and decorate
- Attributes are versioned independently of the CLI
- Enables future model-level attributes (e.g. `[TypeExport]`, `[TypePrefix("I")]`) without breaking changes
- IntelliSense and XML docs work out of the box

#### Processing Pipeline

```
Roslyn Model → Attribute Scanner → Transformation Rules → TypeScript Generator
```

---

### 2. Watch Mode

**Why second:** Improves developer workflow once attributes are stable.

#### Usage

```bash
typesharp watch
typesharp watch --project ./backend
typesharp watch --output ./frontend/types
```

#### Behavior

1. Scan project for eligible models
2. Generate initial TypeScript output
3. Monitor `*.cs` and `*.csproj` for changes
4. Identify affected models only
5. Regenerate and write updated `.ts` files
6. (Optional) Trigger frontend HMR reload

#### Architecture

```
WatchService
 ├── FileSystemWatcher     ← monitors *.cs / *.csproj
 ├── ChangeQueue           ← debounce 200–500ms, batches events
 └── GeneratorService      ← reruns only affected models
```

#### Key Rules

- Debounce rapid file events (200–500ms window)
- Batch concurrent changes into a single generation pass
- Never trigger full project regeneration for a single file change

---

### 3. Performance Optimization

**Why third:** Needed once watch mode and attributes are in use at scale.

#### Target scale: 500–2000+ models

#### Strategies

**Incremental Generation**  
Track which C# files changed → resolve affected models → regenerate only those outputs.

**Hash-Based Caching**  
Cache `{ modelHash → generatedOutput }`. Skip generation entirely if hash is unchanged.

**Parallel Processing**
```csharp
Parallel.ForEach(models, model => Generate(model));
```

**Skip Unchanged File Writes**
```csharp
if (existingContent == generatedContent) return; // avoids unnecessary FS writes
```
Prevents frontend build tools (Vite, webpack) from triggering rebuilds on untouched files.

---

### 4. VS Code Extension

**Why last:** Polishes the developer experience once core features are solid.

#### Commands

| Command | Action |
|---|---|
| `TypeSharp: Generate Types` | Runs `typesharp generate` |
| `TypeSharp: Start Watch Mode` | Starts `typesharp watch` |
| `TypeSharp: Stop Watch Mode` | Stops the watcher process |
| `TypeSharp: Preview TypeScript` | Right-click a C# model → preview output without writing |

#### Diagnostics

Surface warnings inline for unsupported types:

```
⚠ Unsupported type: Tuple<int, string> in UserModel.cs
```

#### Architecture

```
VSCode Extension → child_process.spawn(CLI) → Display in editor panel
```

#### File Structure

```
typesharp-vscode/
 ├── extension.ts
 ├── commands/
 │    ├── generate.ts
 │    ├── watch.ts
 │    └── preview.ts
 └── package.json
```

---

## Success Criteria

| Feature | Done When |
|---|---|
| `TypeSharp.AspNetCore` NuGet | Package installs cleanly; `[TypeIgnore]`, `[TypeName]`, `[TypeAs]` all produce correct output |
| Watch Mode | Single file save triggers only affected type regeneration within 500ms |
| Performance | 1000+ model project generates in under 5 seconds |
| VS Code Extension | Generate, watch, and preview all work from command palette |

---

## Future Enhancements

- Nuxt module (auto-imports generated types)
- Vite plugin (HMR integration)
- TypeScript client generation (fetch/axios)
- AST-based transformations