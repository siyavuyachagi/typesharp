import { NamingConvention } from "./typesharp-config";
import { TypeSharpConfig } from "./typesharp-config";

/**
 * Parsed C# property
 */
export interface CSharpProperty {
  name: string;
  type: string;
  isNullable: boolean;
  isArray: boolean;
  isGeneric: boolean;
  genericType?: string;
}

/**
 * Parsed C# class/interface
 */
export interface CSharpClass {
  name: string;
  properties: CSharpProperty[];
  inheritsFrom?: string;
  isEnum: boolean;
  enumValues?: string[];
  genericParameters?: string[]; // NEW: e.g., ['T'] or ['T', 'U']
  baseClassGenerics?: string[]; // NEW: e.g., ['T'] for ApiResponse<T>
}

/**
 * Result of parsing C# files
 */
export interface ParseResult {
  classes: CSharpClass[];
  filePath: string;
  relativePath: string;
}

/**
 * Generation options
 */
export interface GenerationOptions {
  config: TypeSharpConfig;
  classes: CSharpClass[];
}

// ==== Export types ======
export type { TypeSharpConfig }
export type { NamingConvention }