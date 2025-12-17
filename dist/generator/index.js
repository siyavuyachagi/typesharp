"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTypeScriptFiles = generateTypeScriptFiles;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const chalk_1 = __importDefault(require("chalk"));
/**
 * Generate TypeScript files from parsed C# classes
 */
function generateTypeScriptFiles(config, parseResults) {
    const outputPath = config.outputPath;
    if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true });
    }
    if (config.singleOutputFile) {
        const allClasses = parseResults.flatMap(r => r.classes);
        generateSingleFile(allClasses, outputPath, config);
    }
    else {
        // Generate one TypeScript file per C# file (preserves grouping)
        generateMultipleFiles(outputPath, config, parseResults);
    }
}
/**
 * Generate a single file with all types
 */
function generateSingleFile(classes, outputPath, config) {
    const content = classes
        .map(cls => generateTypeScriptClass(cls, config))
        .join('\n\n');
    const header = generateFileHeader();
    const fullContent = `${header}\n\n${content}\n`;
    const fileName = 'types.ts';
    const filePath = path.join(outputPath, fileName);
    fs.writeFileSync(filePath, fullContent, 'utf-8');
    console.log(chalk_1.default.whiteBright(` - Generated:`), chalk_1.default.blue(filePath));
}
/**
 * Generate multiple files - one TypeScript file per C# source file
 * This preserves the original grouping of classes
 */
function generateMultipleFiles(outputPath, config, parseResults) {
    // Build a map of class names to their file paths for import resolution
    const classToFileMap = buildClassToFileMap(parseResults, config, outputPath);
    for (const result of parseResults) {
        // Generate content for all classes in this C# file
        const content = result.classes
            .map(cls => generateTypeScriptClass(cls, config))
            .join('\n\n');
        // Preserve folder structure
        const relativeDir = path.dirname(result.relativePath);
        const targetDir = path.join(outputPath, relativeDir);
        // Create directory if needed
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }
        // Get the original C# filename without extension
        const originalFileName = path.basename(result.relativePath, '.cs');
        // Apply file suffix if configured
        let baseName = originalFileName;
        if (config.fileSuffix) {
            const convention = config.fileNamingConvention || 'kebab';
            const suffix = convertFileName(config.fileSuffix, convention);
            baseName = `${baseName}-${suffix}`;
        }
        // Apply naming convention to the filename
        const fileName = convertFileName(baseName, config.fileNamingConvention || 'kebab');
        const filePath = path.join(targetDir, `${fileName}.ts`);
        // Generate imports for this file
        const currentClassNames = result.classes.map(c => c.name);
        const imports = generateImports(result.classes, classToFileMap, filePath, currentClassNames);
        const header = generateFileHeader();
        const fullContent = imports
            ? `${header}\n\n${imports}\n\n${content}\n`
            : `${header}\n\n${content}\n`;
        fs.writeFileSync(filePath, fullContent, 'utf-8');
        console.log(chalk_1.default.whiteBright(` - Generated:`), chalk_1.default.blue(filePath));
    }
}
/**
 * Build a map of class names to their output file paths
 */
function buildClassToFileMap(parseResults, config, outputPath) {
    const map = new Map();
    for (const result of parseResults) {
        const relativeDir = path.dirname(result.relativePath);
        const targetDir = path.join(outputPath, relativeDir);
        const originalFileName = path.basename(result.relativePath, '.cs');
        let baseName = originalFileName;
        if (config.fileSuffix) {
            const convention = config.fileNamingConvention || 'kebab';
            const suffix = convertFileName(config.fileSuffix, convention);
            baseName = `${baseName}-${suffix}`;
        }
        const fileName = convertFileName(baseName, config.fileNamingConvention || 'kebab');
        const filePath = path.join(targetDir, `${fileName}.ts`);
        // Map all classes in this file to this file path
        for (const cls of result.classes) {
            map.set(cls.name, filePath);
        }
    }
    return map;
}
/**
 * Generate import statements for referenced types
 */
function generateImports(classes, classToFileMap, currentFilePath, currentClassNames) {
    const imports = new Map(); // filePath -> Set of class names
    for (const cls of classes) {
        // Skip enums as they don't have properties
        if (cls.isEnum)
            continue;
        // Check inheritance
        if (cls.inheritsFrom && !currentClassNames.includes(cls.inheritsFrom)) {
            const referencedFilePath = classToFileMap.get(cls.inheritsFrom);
            if (referencedFilePath && referencedFilePath !== currentFilePath) {
                if (!imports.has(referencedFilePath)) {
                    imports.set(referencedFilePath, new Set());
                }
                imports.get(referencedFilePath).add(cls.inheritsFrom);
            }
        }
        // Check property types
        for (const prop of cls.properties) {
            // Extract base type (remove array brackets and nullable)
            let referencedType = prop.type;
            // Skip primitive types
            if (isPrimitiveType(referencedType))
                continue;
            // Skip if it's in the same file
            if (currentClassNames.includes(referencedType))
                continue;
            const referencedFilePath = classToFileMap.get(referencedType);
            if (referencedFilePath && referencedFilePath !== currentFilePath) {
                if (!imports.has(referencedFilePath)) {
                    imports.set(referencedFilePath, new Set());
                }
                imports.get(referencedFilePath).add(referencedType);
            }
        }
    }
    // Generate import statements
    const importStatements = [];
    for (const [filePath, classNames] of imports.entries()) {
        const relativePath = getRelativeImportPath(currentFilePath, filePath);
        const sortedNames = Array.from(classNames).sort();
        importStatements.push(`import type { ${sortedNames.join(', ')} } from '${relativePath}';`);
    }
    return importStatements.length > 0 ? importStatements.join('\n') : '';
}
/**
 * Get relative import path from one file to another
 */
function getRelativeImportPath(fromFile, toFile) {
    const fromDir = path.dirname(fromFile);
    let relativePath = path.relative(fromDir, toFile);
    // Remove .ts extension
    relativePath = relativePath.replace(/\.ts$/, '');
    // Ensure it starts with ./ or ../
    if (!relativePath.startsWith('.')) {
        relativePath = './' + relativePath;
    }
    // Convert Windows backslashes to forward slashes
    relativePath = relativePath.replace(/\\/g, '/');
    return relativePath;
}
/**
 * Check if a type is a primitive TypeScript type
 */
function isPrimitiveType(type) {
    const primitives = ['string', 'number', 'boolean', 'any', 'void', 'null', 'undefined'];
    return primitives.includes(type);
}
/**
 * Generate TypeScript interface or enum from C# class
 */
function generateTypeScriptClass(cls, config) {
    if (cls.isEnum) {
        return generateEnum(cls);
    }
    return generateInterface(cls, config);
}
/**
 * Generate TypeScript enum
 */
function generateEnum(cls) {
    const values = cls.enumValues || [];
    const enumValues = values
        .map(v => `  ${v} = '${v}'`)
        .join(',\n');
    return `export enum ${cls.name} {\n${enumValues}\n}`;
}
/**
 * Generate TypeScript interface
 */
function generateInterface(cls, config) {
    const properties = cls.properties
        .map(prop => generateProperty(prop, config.namingConvention || 'camel'))
        .join('\n');
    // Build generic parameters for the interface
    const genericParams = cls.genericParameters && cls.genericParameters.length > 0
        ? `<${cls.genericParameters.join(', ')}>`
        : '';
    // Build extends clause with generics
    let extendsClause = '';
    if (cls.inheritsFrom) {
        const baseGenerics = cls.baseClassGenerics && cls.baseClassGenerics.length > 0
            ? `<${cls.baseClassGenerics.join(', ')}>`
            : '';
        extendsClause = ` extends ${cls.inheritsFrom}${baseGenerics}`;
    }
    return `export interface ${cls.name}${genericParams}${extendsClause} {\n${properties}\n}`;
}
// /**
//  * Generate a single property
//  */
// function generateProperty(prop: CSharpProperty, convention: NamingConvention): string {
//   const propertyName = convertPropertyName(prop.name, convention);
//   let type = prop.type;
//   // Handle arrays
//   if (prop.isArray) {
//     type = `${type}[]`;
//   }
//   // Handle nullable
//   if (prop.isNullable) {
//     type = `${type} | null`;
//   }
//   return `  ${propertyName}: ${type};`;
// }
/**
 * Generate a single property
 */
function generateProperty(prop, convention) {
    const propertyName = convertPropertyName(prop.name, convention);
    let type = prop.type;
    // Handle arrays: append [] only when prop.isArray is true and the type does not already look like a Record or an array
    const alreadyArrayLike = /\[\]$/.test(type);
    const isRecordType = /^Record<.*>$/.test(type);
    if (prop.isArray && !isRecordType && !alreadyArrayLike) {
        type = `${type}[]`;
    }
    // Handle nullable
    if (prop.isNullable) {
        type = `${type} | null`;
    }
    return `  ${propertyName}: ${type};`;
}
/**
 * Convert property name to specified convention
 */
function convertPropertyName(name, convention) {
    switch (convention) {
        case 'camel':
            return toCamelCase(name);
        case 'pascal':
            return toPascalCase(name);
        case 'snake':
            return toSnakeCase(name);
        case 'kebab':
            return toKebabCase(name);
        default:
            return name;
    }
}
/**
 * Convert file name to specified convention
 */
function convertFileName(name, convention) {
    switch (convention) {
        case 'kebab':
            return toKebabCase(name);
        case 'snake':
            return toSnakeCase(name);
        case 'camel':
            return toCamelCase(name);
        case 'pascal':
            return toPascalCase(name);
        default:
            return name;
    }
}
/**
 * Convert string to camelCase
 */
function toCamelCase(str) {
    const pascal = toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}
/**
 * Convert string to PascalCase
 */
function toPascalCase(str) {
    return str
        .replace(/[_-](.)/g, (_, char) => char.toUpperCase())
        .replace(/^(.)/, (_, char) => char.toUpperCase());
}
/**
 * Convert string to snake_case
 */
function toSnakeCase(str) {
    return str
        .replace(/([A-Z])/g, '_$1')
        .toLowerCase()
        .replace(/^_/, '');
}
/**
 * Convert string to kebab-case
 */
function toKebabCase(str) {
    return str
        .replace(/([A-Z])/g, '-$1')
        .toLowerCase()
        .replace(/^-/, '');
}
/**
 * Generate file header comment
 */
function generateFileHeader() {
    const timestamp = new Date().toISOString();
    return `/**
 * Auto-generated by TypeSharp
 * Generated at: ${timestamp}
 * Do not edit this file manually
 */`;
}
//# sourceMappingURL=index.js.map