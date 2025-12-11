## Project structure

```
typesharp/
├── src/
│   ├── index.ts           ✅ Main exports
│   ├── cli/index.ts       ✅ CLI interface
│   ├── core/index.ts      ✅ Core logic
│   ├── parser/index.ts    ✅ C# parser
│   ├── generator/index.ts ✅ TS generator
│   └── types/index.ts     ✅ Type definitions
├── bin/
│   └── typesharp.js       ✅ CLI executable
├── package.json           ✅ Package config
├── tsconfig.json          ✅ TypeScript config
├── .gitignore             ✅ Git ignore
├── README.md              ✅ Documentation
└── LICENSE                ✅ MIT License
```