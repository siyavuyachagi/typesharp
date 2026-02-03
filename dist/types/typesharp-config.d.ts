/**
 * TypeSharp configuration
 * @see https://github.com/siyavuyachagi/typesharp
 */
export interface TypeSharpConfig {
    /**
     * Full path(s) to the C# .csproj file(s).
     * Can be a single path or an array of paths.
     * Example (Windows):
     * ```
     *   `C:\\Users\\User\\Desktop\\MyApp\\Api\\Api.csproj`
     *   // or
     *   [
     *     `C:\\Users\\User\\Desktop\\MyApp\\Api\\Api.csproj`,
     *     `C:\\Users\\User\\Desktop\\MyApp\\Domain\\Domain.csproj`
     *   ]
     * ```
     */
    projectFiles: string | string[];
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
     * - false → Each file is written separately, using the naming convention.
     *           The original folder structure is preserved in the output.
     */
    singleOutputFile?: boolean;
    /**
     * Naming convention for property names in generated types
     * @example
     *   "namingConvention": "camel",
     * // or
     *   "namingConvention": {
     *      dir: 'kebab',
     *      file: 'camel',
     *    }
     */
    namingConvention?: NamingConvention | NamingConventionConfig;
    /**
     * Suffix appended to generated TypeScript type names.
     * The suffix is formatted based on the selected naming convention.
     * ```
     * Examples (suffix = "dto"):
     *   camel : User -> userDto
     *   pascal: User -> UserDto
     *   snake : User -> user_dto
     *   kebab : User -> user-dto
     * ```
     */
    fileSuffix?: string;
}
/**
 * Naming convention options for path, file and property names
 */
export type NamingConvention = 'kebab' | 'snake' | 'camel' | 'pascal';
/**
 * More specific naming convension configuration
 */
export type NamingConventionConfig = {
    file: NamingConvention;
    dir: NamingConvention;
};
//# sourceMappingURL=typesharp-config.d.ts.map