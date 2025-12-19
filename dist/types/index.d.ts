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
    genericParameters?: string[];
    baseClassGenerics?: string[];
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
export type { TypeSharpConfig };
export type { NamingConvention };
//# sourceMappingURL=index.d.ts.map