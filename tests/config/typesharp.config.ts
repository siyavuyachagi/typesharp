// tests/typesharp.config.ts
import type { TypeSharpConfig } from '../../src';

const config: TypeSharpConfig = {
  source: ["~../../AspNetCore/AspNetCore.slnx"],
  outputPath: "./tests/.generated",
  targetAnnotation: "TypeSharp",
  singleOutputFile: false,
  namingConvention: 'snake',
  fileSuffix: ""
};

export default config;
