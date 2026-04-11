// tests/typesharp.config.ts
import type { TypeSharpConfig } from '../../src';

const config: TypeSharpConfig = {
  source: ["./tests/fixtures/csharp/TypeSharpTest.csproj"],
  outputPath: "./tests/.generated",
  targetAnnotation: "TypeSharp",
  singleOutputFile: false,
  namingConvention: 'snake',
  fileSuffix: ""
};

export default config;
