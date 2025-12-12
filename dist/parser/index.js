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
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCSharpFiles = parseCSharpFiles;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const glob_1 = require("glob");
/**
 * Parse C# files in the target project
 */
async function parseCSharpFiles(config) {
    const projectDir = path.dirname(config.projectFile); // get folder containing the .csproj
    const targetAnnotation = config.targetAnnotation ?? 'TypeSharp';
    const csFiles = await (0, glob_1.glob)('**/*.cs', {
        cwd: projectDir,
        absolute: true,
        ignore: ['**/bin/**', '**/obj/**', '**/node_modules/**']
    });
    const results = [];
    for (const filePath of csFiles) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const classes = parseClassesFromFile(content, targetAnnotation);
        if (classes.length > 0) {
            // store relative path for preserving folder structure later
            const relativePath = path.relative(projectDir, filePath);
            results.push({ classes, filePath, relativePath });
        }
    }
    return results;
}
/**
 * Parse classes from a C# file content
 */
function parseClassesFromFile(content, targetAnnotation) {
    const classes = [];
    // Remove comments
    const cleanContent = removeComments(content);
    // Find all classes/enums with the target annotation
    const annotationRegex = new RegExp(`\\[${targetAnnotation}\\]`, 'g');
    const matches = [...cleanContent.matchAll(annotationRegex)];
    for (const match of matches) {
        const startIndex = match.index;
        const afterAnnotation = cleanContent.substring(startIndex);
        // Check if it's an enum
        const enumMatch = afterAnnotation.match(/\[[\w]+\]\s*public\s+enum\s+(\w+)/);
        if (enumMatch) {
            const enumClass = parseEnum(afterAnnotation, enumMatch[1]);
            if (enumClass)
                classes.push(enumClass);
            continue;
        }
        // Parse as class with full generic support
        // Matches: public class ClassName<T, U> : BaseClass<T>
        const classMatch = afterAnnotation.match(/\[[\w]+\]\s*public\s+class\s+(\w+)(?:<([^>]+)>)?(?:\s*:\s*(\w+)(?:<([^>]+)>)?)?/);
        if (classMatch) {
            const className = classMatch[1];
            const genericParams = classMatch[2]; // e.g., "T" or "T, U"
            const inheritsFrom = classMatch[3];
            const baseGenerics = classMatch[4]; // e.g., "T" or "T, U"
            const classBody = extractClassBody(afterAnnotation);
            if (classBody) {
                const properties = parseProperties(classBody);
                // Parse generic parameters
                const genericParameters = genericParams
                    ? genericParams.split(',').map(p => p.trim())
                    : undefined;
                const baseClassGenerics = baseGenerics
                    ? baseGenerics.split(',').map(p => p.trim())
                    : undefined;
                classes.push({
                    name: className,
                    properties,
                    inheritsFrom,
                    isEnum: false,
                    genericParameters,
                    baseClassGenerics
                });
            }
        }
    }
    return classes;
}
/**
 * Parse enum from C# content
 */
function parseEnum(content, enumName) {
    const enumBodyMatch = content.match(/enum\s+\w+\s*\{([^}]+)\}/);
    if (!enumBodyMatch)
        return null;
    const enumBody = enumBodyMatch[1];
    const enumValues = enumBody
        .split(',')
        .map(v => v.trim())
        .filter(v => v.length > 0)
        .map(v => v.split('=')[0].trim()); // Remove value assignments
    return {
        name: enumName,
        properties: [],
        isEnum: true,
        enumValues
    };
}
/**
 * Extract class body between curly braces
 */
function extractClassBody(content) {
    let braceCount = 0;
    let startIndex = -1;
    for (let i = 0; i < content.length; i++) {
        if (content[i] === '{') {
            if (braceCount === 0)
                startIndex = i;
            braceCount++;
        }
        else if (content[i] === '}') {
            braceCount--;
            if (braceCount === 0 && startIndex !== -1) {
                return content.substring(startIndex + 1, i);
            }
        }
    }
    return null;
}
/**
 * Parse properties from class body
 */
function parseProperties(classBody) {
    const properties = [];
    // Match property declarations with get/set
    const propertyRegex = /public\s+([\w<>[\]?]+)\s+(\w+)\s*\{\s*get;\s*set;\s*\}/g;
    let match;
    while ((match = propertyRegex.exec(classBody)) !== null) {
        const type = match[1];
        const name = match[2];
        properties.push(parsePropertyType(name, type));
    }
    // Also match computed/expression-bodied properties (with =>)
    // These are read-only, so we'll skip them for now since they don't have set;
    // If you want to include them, uncomment below:
    /*
    const computedPropertyRegex = /public\s+([\w<>[\]?]+)\s+(\w+)\s*=>/g;
    while ((match = computedPropertyRegex.exec(classBody)) !== null) {
      const type = match[1]!;
      const name = match[2]!;
      
      properties.push(parsePropertyType(name, type));
    }
    */
    return properties;
}
/**
 * Parse C# type to extract type information
 */
function parsePropertyType(name, csType) {
    let type = csType.trim();
    let isNullable = false;
    let isArray = false;
    let isGeneric = false;
    let genericType;
    // Check for nullable
    if (type.endsWith('?')) {
        isNullable = true;
        type = type.slice(0, -1);
    }
    // Check for array
    if (type.endsWith('[]')) {
        isArray = true;
        type = type.slice(0, -2);
    }
    // Check for List<T>
    const listMatch = type.match(/^List<(.+)>$/);
    if (listMatch) {
        isArray = true;
        isGeneric = true;
        genericType = listMatch[1];
        type = genericType;
    }
    // Check for IEnumerable<T>, ICollection<T>
    const collectionMatch = type.match(/^(?:IEnumerable|ICollection|IList)<(.+)>$/);
    if (collectionMatch) {
        isArray = true;
        isGeneric = true;
        genericType = collectionMatch[1];
        type = genericType;
    }
    // Convert C# types to TypeScript types
    type = mapCSharpTypeToTypeScript(type);
    return {
        name,
        type,
        isNullable,
        isArray,
        isGeneric,
        genericType
    };
}
/**
 * Map C# primitive types to TypeScript types
 */
function mapCSharpTypeToTypeScript(csType) {
    const typeMap = {
        'string': 'string',
        'int': 'number',
        'long': 'number',
        'double': 'number',
        'float': 'number',
        'decimal': 'number',
        'bool': 'boolean',
        'DateTime': 'string',
        'DateOnly': 'string',
        'TimeOnly': 'string',
        'Guid': 'string',
        'object': 'any'
    };
    return typeMap[csType] || csType;
}
/**
 * Remove single-line and multi-line comments
 */
function removeComments(content) {
    // Remove multi-line comments
    let result = content.replace(/\/\*[\s\S]*?\*\//g, '');
    // Remove single-line comments
    result = result.replace(/\/\/.*/g, '');
    return result;
}
//# sourceMappingURL=index.js.map