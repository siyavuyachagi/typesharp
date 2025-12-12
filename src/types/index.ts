/**
 * Naming convention options for file and property names
 */
export type NamingConvention = 'kebab' | 'snake' | 'camel' | 'pascal';

/**
 * TypeSharp configuration
 */
export interface TypeSharpConfig {

  /**
   * Full path to the C# .csproj file.
   * Example (Windows):
   * ```
   *   `C:\\Users\\User\\Desktop\\MyApp\\Api\\Api.csproj`
   * ```
   */
  projectFile: string;
  
  /**
   * Path where TypeScript files will be generated
   */
  outputPath: string;

  /**
   * The C# attribute name to look for (default: "TypeSharp")
   */
  targetAnnotation?: string;

  /**
   * Controls whether generated types are written to one file or multiple files.
   *
   * - true  → All generated types go into a single file: "index.ts"
   * - false → Each type is written to its own file, using the naming convention.
   *           The original folder structure is preserved in the output.
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

  /**
   * Suffix appended to generated TypeScript type names.
   * The suffix is formatted based on the selected naming convention.
   * ```
   * Examples (suffix = "Dto"):
   *   camel : User -> userDto
   *   pascal: User -> UserDto
   *   snake : User -> user_dto
   *   kebab : User -> user-dto
   * ```
   */
  fileSuffix?: string;
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
  relativePath: string;
}

/**
 * Generation options
 */
export interface GenerationOptions {
  config: TypeSharpConfig;
  classes: CSharpClass[];
}