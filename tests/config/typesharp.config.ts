// tests/typesharp.config.ts
import type { TypeSharpConfig } from '../../src';

const config: TypeSharpConfig = {
  projectFiles: [
    "tests/test-project/AspNetCore/AspNetCore/AspNetCore.csproj",
    "tests/test-project/AspNetCore/Domain/Domain.csproj"
  ],
  outputPath: "./tests/.generated",
  targetAnnotation: "TypeSharp",
  singleOutputFile: false,
  namingConvention: 'snake',
  fileSuffix: ""
};

export default config;
