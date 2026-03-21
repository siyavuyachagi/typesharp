## Project structure

## Project structure

```
typesharp/
├── AspNetCore/                         ✅ ASP.NET Core test project
│   ├── AspNetCore.Domain/              ✅ Domain models
│   └── AspNetCore.Api/                 ✅ API project
├── bin/
│   └── typesharp.js                    ✅ CLI executable
├── dist/                               ✅ Compiled output (committed)
│   ├── cli/
│   ├── core/
│   ├── generator/
│   ├── helpers/
│   ├── parser/
│   └── types/
├── docs/                               ✅ Documentation
│   ├── developer-guide.md
│   ├── feature-implementation-plan.md
│   ├── pre-release-guide.md
│   ├── project-structure.md
│   ├── usage.md
│   └── why-typesharp.md
├── src/
│   ├── cli/
│   │   └── index.ts                    ✅ CLI entry point (commander)
│   ├── core/
│   │   ├── create-sample-config.ts     ✅ Sample config generation (init command)
│   │   └── index.ts                    ✅ Config loading, merging, generate()
│   ├── generator/
│   │   └── index.ts                    ✅ TypeScript file generation
│   ├── helpers/
│   │   └── helper.ts                   ✅ Shared utilities
│   ├── parser/
│   │   ├── index.ts                    ✅ C# file parsing
│   │   ├── parse-properties.ts         ✅ Property parsing logic
│   │   └── resolve-project-files-from-source.ts  ✅ .sln/.slnx/.csproj resolution
│   └── types/
│       ├── index.ts                    ✅ Shared TypeScript types
│       ├── naming-convention.ts        ✅ NamingConvention enum
│       ├── naming-convention-config.ts ✅ NamingConventionConfig type
│       └── typesharp-config.ts         ✅ TypeSharpConfig interface
├── tests/
│   ├── config/                         ✅ Test config files (.ts, .js, .json)
│   ├── core/                           ✅ Unit tests: mergeWithDefaults, createSampleConfig
│   ├── generator/                      ✅ Unit tests: generateTypeScriptFiles
│   ├── integration/                    ✅ Real project integration tests
│   └── parser/                         ✅ Unit tests: parser, resolve-project-files
├── .gitignore                          ✅ Git ignore
├── CHANGELOG.md                        ✅ Version history
├── LICENSE                             ✅ MIT License
├── package.json                        ✅ Package config
├── README.md                           ✅ Documentation
├── tsconfig.json                       ✅ TypeScript config
├── typesharp.config.ts                 ✅ TypeSharp self-config
└── vitest.config.ts                    ✅ Test config
```
