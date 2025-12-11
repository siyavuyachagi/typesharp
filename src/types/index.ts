/**
 * Naming convention options for file and property names
 */
export type NamingConvention = 'kebab' | 'snake' | 'camel' | 'pascal';

/**
 * TypeSharp configuration
 */
export interface TypeSharpConfig {
  /**
   * Path to the C# project folder containing .cs files
   */
  targetPath: string;

  /**
   * Path where TypeScript files will be generated
   */
  outputPath: string;

  /**
   * The C# attribute name to look for (default: "TypeSharp")
   */
  targetAnnotation?: string;

  /**
   * Whether to output all types to a single file or separate files
   */
  singleOutputFile?: boolean;

  /**
   * Naming convention for generated file names
   */
  fileNamingConvention?: NamingConvention;

  /**
   * Naming convention for property names in generated types
   */
  namingConvention?: NamingConvention;
}

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
}

/**
 * Result of parsing C# files
 */
export interface ParseResult {
  classes: CSharpClass[];
  filePath: string;
}

/**
 * Generation options
 */
export interface GenerationOptions {
  config: TypeSharpConfig;
  classes: CSharpClass[];
}