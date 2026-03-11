import { NamingConvention } from "./naming-convention";
import { NamingConventionConfig } from "./naming-convention-config";
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
    /** Whether the property is marked as obsolete/deprecated */
    isDeprecated: boolean;
    /** Optional message from [Obsolete("...")] */
    deprecationMessage?: string;
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
export type { NamingConventionConfig };
export type { NamingConvention };
//# sourceMappingURL=index.d.ts.map