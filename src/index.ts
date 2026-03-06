// Main exports for programmatic usage
export { generate, loadConfig } from './core';
export { parseCSharpFiles } from './parser';
export { generateTypeScriptFiles } from './generator';

// Type exports
export type {
  TypeSharpConfig,
  NamingConvention,
  CSharpClass,
  CSharpProperty,
  ParseResult,
  GenerationOptions
} from './types';