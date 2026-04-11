import { NamingConvention } from '../types/index.js';
import type { ParseResult, TypeSharpConfig } from '../types/index.js';
/**
 * Generate TypeScript files from parsed C# classes
 */
export declare function generateTypeScriptFiles(config: TypeSharpConfig, parseResults: ParseResult[], changedFiles?: Set<string>): void;
/**
 * Convert file name to specified convention
 */
export declare function convertFileName(name: string, convention: NamingConvention): string;
//# sourceMappingURL=index.d.ts.map