// Main exports for programmatic usage
export { generate, loadConfig } from './core/index.js';
export { parseCSharpFiles } from './parser/index.js';
export { generateTypeScriptFiles } from './generator/index.js';

// Type exports
export type {
  TypeSharpConfig,
  NamingConvention,
  CSharpClass,
  CSharpProperty,
  ParseResult,
  GenerationOptions
} from './types/index.js';