// tests/typesharp.config.ts
import type { TypeSharpConfig } from '../../src';

const config: TypeSharpConfig = {
  source: ["./tests/intergration"],
  outputPath: "./tests/.generated",
  targetAnnotation: "TypeSharp",
  singleOutputFile: false,
  namingConvention: 'snake',
  fileSuffix: ""
};

export default config;
