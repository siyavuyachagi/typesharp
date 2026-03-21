import { CSharpClass, CSharpProperty } from "../types";
import { parseProperties } from "./parse-properties";

/**
 * Parse classes from a C# file content
 */
export function parseClassesFromFile(content: string, targetAnnotation: string): CSharpClass[] {
    const classes: CSharpClass[] = [];

    const cleanContent = removeComments(content);

    const annotationRegex = new RegExp(
        `\\[${targetAnnotation}(?:Attribute)?(?:\\(\\s*"([^"]*)"\\s*\\))?\\]`,
        'g'
    );

    const matches = [...cleanContent.matchAll(annotationRegex)];

    for (const match of matches) {
        const startIndex = match.index!;
        const afterAnnotation = cleanContent.substring(startIndex);

        // Check if it's an enum
        const enumMatch = afterAnnotation.match(
            /(?:\[[\w]+(?:\([^)]*\))?\]\s*)*public\s+enum\s+(\w+)/
        );

        if (enumMatch) {
            const typeNameOverride = match[1] ?? undefined;
            const enumClass = parseEnum(afterAnnotation, typeNameOverride ?? enumMatch[1]!);
            if (enumClass) classes.push(enumClass);
            continue;
        }

        const classMatch = afterAnnotation.match(
            /(?:\[[\w]+(?:\([^)]*\))?\]\s*)*public\s+class\s+(\w+)(?:<([^>]+)>)?(?:\s*:\s*(\w+)(?:<([^>]+)>)?)?/
        );

        if (classMatch) {
            const className = classMatch[1]!;
            const genericParams = classMatch[2];
            const inheritsFrom = classMatch[3];
            const baseGenerics = classMatch[4];

            // Filter out C# interfaces (I + uppercase letter)
            const resolvedInheritsFrom = inheritsFrom && /^I[A-Z]/.test(inheritsFrom)
                ? undefined
                : inheritsFrom;

            const classBody = extractClassBody(afterAnnotation);

            if (classBody) {
                const { cleanedBody, injectedProperties } = stripNestedAnnotatedClasses(classBody, targetAnnotation);

                const properties = [
                    ...parseProperties(cleanedBody),
                    ...injectedProperties
                ];

                const genericParameters = genericParams
                    ? genericParams.split(',').map(p => p.trim())
                    : undefined;

                const baseClassGenerics = baseGenerics
                    ? baseGenerics.split(',').map(p => p.trim())
                    : undefined;

                const typeNameOverride = match[1] ?? undefined;
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
function parseEnum(content: string, enumName: string): CSharpClass | null {
    const enumBodyMatch = content.match(/enum\s+\w+\s*\{([^}]+)\}/);
    if (!enumBodyMatch) return null;

    const enumBody = enumBodyMatch[1]!;
    const enumValues = enumBody
        .split(',')
        .map(v => v.trim())
        .filter(v => v.length > 0)
        .map(v => v.split('=')[0]!.trim());

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
function extractClassBody(content: string): string | null {
    let braceCount = 0;
    let startIndex = -1;

    for (let i = 0; i < content.length; i++) {
        if (content[i] === '{') {
            if (braceCount === 0) startIndex = i;
            braceCount++;
        } else if (content[i] === '}') {
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
function removeComments(content: string): string {
    let result = content.replace(/\/\*[\s\S]*?\*\//g, '');
    result = result.replace(/\/\/.*/g, '');
    return result;
}

/**
 * Strip nested annotated classes from a class body and inject reference properties.
 * Uses brace-counting instead of regex replacement for reliable block extraction.
 */
function stripNestedAnnotatedClasses(
    classBody: string,
    targetAnnotation: string
): { cleanedBody: string; injectedProperties: CSharpProperty[] } {
    const injectedProperties: CSharpProperty[] = [];
    const regionsToRemove: Array<{ start: number; end: number }> = [];

    const annotationRegex = new RegExp(
        `\\[${targetAnnotation}(?:Attribute)?(?:\\(\\s*"([^"]*)"\\s*\\))?\\]\\s*public\\s+class\\s+(\\w+)`,
        'g'
    );

    const matches = [...classBody.matchAll(annotationRegex)];

    for (const match of matches) {
        const typeNameOverride = match[1] ?? undefined;
        const nestedClassName = match[2]!;
        const resolvedName = typeNameOverride ?? nestedClassName;

        const fromIndex = match.index!;
        const afterMatch = classBody.substring(fromIndex);

        // Find the opening brace of the nested class
        const braceStart = afterMatch.indexOf('{');
        if (braceStart === -1) continue;

        // Walk braces to find the exact closing brace
        let depth = 0;
        let end = -1;
        for (let i = braceStart; i < afterMatch.length; i++) {
            if (afterMatch[i] === '{') depth++;
            else if (afterMatch[i] === '}') {
                depth--;
                if (depth === 0) {
                    end = i;
                    break;
                }
            }
        }

        if (end === -1) continue;

        regionsToRemove.push({
            start: fromIndex,
            end: fromIndex + braceStart + end + 1
        });

        const propName = nestedClassName.charAt(0).toLowerCase() + nestedClassName.slice(1);
        injectedProperties.push({
            name: propName,
            type: resolvedName,
            isNullable: false,
            isArray: false,
            isGeneric: false,
            isDeprecated: false,
        });
    }

    // Remove regions in reverse order to preserve character positions
    let cleanedBody = classBody;
    for (const region of regionsToRemove.reverse()) {
        cleanedBody = cleanedBody.substring(0, region.start) + cleanedBody.substring(region.end);
    }

    return { cleanedBody, injectedProperties };
}