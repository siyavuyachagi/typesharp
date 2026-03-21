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
const resolve_project_files_from_source_1 = require("./resolve-project-files-from-source");
const parse_properties_1 = require("./parse-properties");
/**
 * Parse C# files in the target project(s)
 */
async function parseCSharpFiles(config) {
    const targetAnnotation = config.targetAnnotation ?? 'TypeSharp';
    // Convert single project to array for unified handling
    const projectFiles = (0, resolve_project_files_from_source_1.resolveProjectFilesFromSource)(config.source);
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
    const annotationRegex = new RegExp(`\\[${targetAnnotation}(?:Attribute)?(?:\\(\\s*"([^"]*)"\\s*\\))?\\]`, 'g');
    const matches = [...cleanContent.matchAll(annotationRegex)];
    for (const match of matches) {
        const startIndex = match.index;
        const afterAnnotation = cleanContent.substring(startIndex);
        // Check if it's an enum
        const enumMatch = afterAnnotation.match(/(?:\[[\w]+(?:\([^)]*\))?\]\s*)*public\s+enum\s+(\w+)/);
        if (enumMatch) {
            const typeNameOverride = match[1] ?? undefined;
            const enumClass = parseEnum(afterAnnotation, typeNameOverride ?? enumMatch[1]);
            if (enumClass)
                classes.push(enumClass);
            continue;
        }
        // Parse as class with full generic support
        // Matches: public class ClassName<T, U> : BaseClass<T>
        // Now supports multiple stacked attributes before the class declaration
        const classMatch = afterAnnotation.match(/(?:\[[\w]+(?:\([^)]*\))?\]\s*)*public\s+class\s+(\w+)(?:<([^>]+)>)?(?:\s*:\s*(\w+)(?:<([^>]+)>)?)?/);
        if (classMatch) {
            const className = classMatch[1];
            const genericParams = classMatch[2]; // e.g., "T" or "T, U"
            const inheritsFrom = classMatch[3];
            const baseGenerics = classMatch[4]; // e.g., "T" or "T, U"
            const classBody = extractClassBody(afterAnnotation);
            if (classBody) {
                const properties = (0, parse_properties_1.parseProperties)(classBody);
                // Parse generic parameters
                const genericParameters = genericParams
                    ? genericParams.split(',').map(p => p.trim())
                    : undefined;
                const baseClassGenerics = baseGenerics
                    ? baseGenerics.split(',').map(p => p.trim())
                    : undefined;
                const typeNameOverride = match[1] ?? undefined;
                const resolvedInheritsFrom = inheritsFrom && /^I[A-Z]/.test(inheritsFrom)
                    ? undefined
                    : inheritsFrom;
                classes.push({
                    name: typeNameOverride ?? className,
                    properties,
                    inheritsFrom: resolvedInheritsFrom,
                    isEnum: false,
                    genericParameters,
                    baseClassGenerics: resolvedInheritsFrom ? baseClassGenerics : undefined
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