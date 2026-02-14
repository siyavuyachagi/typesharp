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
 * Parse C# files in the target project(s)
 */
async function parseCSharpFiles(config) {
    const targetAnnotation = config.targetAnnotation ?? 'TypeSharp';
    // Convert single project to array for unified handling
    const projectFiles = Array.isArray(config.projectFiles)
        ? config.projectFiles
        : [config.projectFiles];
    const allResults = [];
    // Process each project
    for (const projectFile of projectFiles) {
        const projectDir = path.dirname(projectFile);
        const csFiles = await (0, glob_1.glob)('**/*.cs', {
            cwd: projectDir,
            absolute: true,
            ignore: ['**/bin/**', '**/obj/**', '**/node_modules/**']
        });
        for (const filePath of csFiles) {
            const content = fs.readFileSync(filePath, 'utf-8');
            const classes = parseClassesFromFile(content, targetAnnotation);
            if (classes.length > 0) {
                // Store relative path for preserving folder structure later
                const relativePath = path.relative(projectDir, filePath);
                allResults.push({ classes, filePath, relativePath });
            }
        }
    }
    return allResults;
}
/**
 * Parse classes from a C# file content
 */
function parseClassesFromFile(content, targetAnnotation) {
    const classes = [];
    // Remove comments
    const cleanContent = removeComments(content);
    // Find all classes/enums with the target annotation
    // const annotationRegex = new RegExp(`\\[${targetAnnotation}\\]`, 'g');
    const annotationRegex = new RegExp(`\\[${targetAnnotation}(Attribute)?\\]`, 'g');
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
 * Find the index of the matching '>' for the first '<' at startIdx.
 * Returns -1 if not found.
 */
function findMatchingAngleBracket(s, startIdx) {
    let depth = 0;
    for (let i = startIdx; i < s.length; i++) {
        if (s[i] === '<')
            depth++;
        else if (s[i] === '>') {
            depth--;
            if (depth === 0)
                return i;
        }
    }
    return -1;
}
/**
 * Split a comma-separated generic-argument string into top-level args,
 * i.e. respects nested <...> and does NOT split commas inside nested generics.
 * Example: "string, List<Dictionary<string, Foo>>, int" -> ["string", "List<Dictionary<string, Foo>>", "int"]
 */
function splitTopLevelGenericArgs(s) {
    const parts = [];
    let depth = 0;
    let buf = '';
    for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        if (ch === '<') {
            depth++;
            buf += ch;
        }
        else if (ch === '>') {
            depth--;
            buf += ch;
        }
        else if (ch === ',' && depth === 0) {
            parts.push(buf.trim());
            buf = '';
        }
        else {
            buf += ch;
        }
    }
    if (buf.trim().length > 0)
        parts.push(buf.trim());
    return parts;
}
function parsePropertyType(name, csType) {
    let raw = csType.trim();
    let isNullable = false;
    // Extract nullable marker (T?)
    if (raw.endsWith('?')) {
        isNullable = true;
        raw = raw.slice(0, -1).trim();
    }
    // Recursive resolver: returns { tsType, isArray }
    function resolveType(typeText) {
        const t = typeText.trim();
        // 1) Array syntax: T[]
        if (t.endsWith('[]')) {
            const inner = t.slice(0, -2).trim();
            const resolved = resolveType(inner);
            // If inner is already an array, keep it as array-of-array semantics;
            // mark as array so generator will append [] (or use resolved.tsType which may include [] already)
            return { tsType: resolved.tsType, isArray: true };
        }
        // 2) Dictionary-like types (handle Dictionary, IDictionary, IReadOnlyDictionary)
        if (/^(?:[\w\.]+\.)?(?:Dictionary|IDictionary|IReadOnlyDictionary)\s*</.test(t)) {
            // locate first '<' and its matching '>'
            const firstAngle = t.indexOf('<');
            const lastAngle = findMatchingAngleBracket(t, firstAngle);
            if (firstAngle !== -1 && lastAngle !== -1) {
                const inner = t.slice(firstAngle + 1, lastAngle).trim();
                const args = splitTopLevelGenericArgs(inner);
                if (args.length === 2) {
                    const keyCs = args[0];
                    const valueCs = args[1];
                    // Guard against undefined/null/empty parts before resolving
                    if (typeof keyCs !== 'string' || typeof valueCs !== 'string' || keyCs.trim() === '' || valueCs.trim() === '') {
                        // Fallback: avoid throwing — emit a generic record
                        return { tsType: 'Record<string, any>', isArray: false };
                    }
                    const resolvedKey = resolveType(keyCs);
                    const resolvedValue = resolveType(valueCs);
                    // Normalize key to a safe TS key type: Record<K extends keyof any, V>
                    // If key is not primitive 'string' or 'number' or 'symbol', coerce to 'string'
                    const keyTsRaw = resolvedKey.tsType;
                    const safeKey = keyTsRaw === 'string' || keyTsRaw === 'number' || keyTsRaw === 'symbol'
                        ? keyTsRaw
                        : 'string';
                    // Build value type (respect nested arrays)
                    const valueType = resolvedValue.isArray ? `${resolvedValue.tsType}[]` : resolvedValue.tsType;
                    return { tsType: `Record<${safeKey}, ${valueType}>`, isArray: false };
                }
                // else: fallthrough to other checks (malformed or >2 args) — do not falsely match
            }
        }
        // 3) Collections: List<T>, IEnumerable<T>, ICollection<T>, IList<T>
        const collectionMatch = t.match(/^(?:List|IEnumerable|ICollection|IList)\s*<\s*(.+)\s*>$/);
        if (collectionMatch) {
            const inner = collectionMatch[1].trim();
            const resolvedInner = resolveType(inner);
            // Collections become inner[] in TS; mark isArray true and tsType = resolvedInner.tsType
            // The generator will append [].
            return { tsType: resolvedInner.tsType, isArray: true };
        }
        // 4) Fallback: map primitive / known types, else return as-is (class name)
        return { tsType: mapCSharpTypeToTypeScript(t), isArray: false };
    }
    const resolved = resolveType(raw);
    return {
        name,
        type: resolved.tsType,
        isNullable,
        isArray: resolved.isArray,
        isGeneric: false,
        genericType: undefined
    };
}
/**
 * Map C# primitive types to TypeScript types
 */
function mapCSharpTypeToTypeScript(csType) {
    const typeMap = {
        'bool': 'boolean',
        'byte': 'number',
        'byte[]': 'Blob',
        'decimal': 'number',
        'double': 'number',
        'DateOnly': 'string',
        'DateTime': 'string',
        'float': 'number',
        'FileStream': 'Blob',
        'FormFile': 'File',
        'Guid': 'string',
        'int': 'number',
        'IFormFile': 'File',
        'IFormFileCollection': 'File[]',
        'long': 'number',
        'MemoryStream': 'Blob',
        'object': 'any',
        'string': 'string',
        'Stream': 'Blob',
        'TimeOnly': 'string',
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