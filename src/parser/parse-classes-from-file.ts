import { CSharpClass, CSharpProperty } from "../types";
import { parseProperties } from "./parse-properties";


export /**
 * Parse classes from a C# file content
 */
    function parseClassesFromFile(content: string, targetAnnotation: string): CSharpClass[] {
    const classes: CSharpClass[] = [];

    // Remove comments
    const cleanContent = removeComments(content);

    // Find all classes/enums with the target annotation
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

        // Parse as class with full generic support
        // Matches: public class ClassName<T, U> : BaseClass<T>
        // Now supports multiple stacked attributes before the class declaration
        const classMatch = afterAnnotation.match(
            /(?:\[[\w]+(?:\([^)]*\))?\]\s*)*public\s+class\s+(\w+)(?:<([^>]+)>)?(?:\s*:\s*(\w+)(?:<([^>]+)>)?)?/
        );

        if (classMatch) {
            const className = classMatch[1]!;
            const genericParams = classMatch[2]; // e.g., "T" or "T, U"
            const inheritsFrom = classMatch[3];
            const baseGenerics = classMatch[4]; // e.g., "T" or "T, U"

            const classBody = extractClassBody(afterAnnotation);

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
        .map(v => v.split('=')[0]!.trim()); // Remove value assignments

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
    // Remove multi-line comments
    let result = content.replace(/\/\*[\s\S]*?\*\//g, '');

    // Remove single-line comments
    result = result.replace(/\/\/.*/g, '');

    return result;
}





function stripNestedAnnotatedClasses(
    classBody: string,
    targetAnnotation: string
): { cleanedBody: string; injectedProperties: CSharpProperty[] } {
    const injectedProperties: CSharpProperty[] = [];

    const annotationRegex = new RegExp(
        `\\[${targetAnnotation}(?:Attribute)?(?:\\(\\s*"([^"]*)"\\s*\\))?\\]\\s*public\\s+class\\s+(\\w+)`,
        'g'
    );

    let cleanedBody = classBody;
    const matches = [...classBody.matchAll(annotationRegex)];

    // Process in reverse so index positions stay valid after replacements
    for (const match of matches.reverse()) {
        const typeNameOverride = match[1] ?? undefined;
        const nestedClassName = match[2]!;
        const resolvedName = typeNameOverride ?? nestedClassName;

        const fromIndex = match.index!;
        const afterMatch = classBody.substring(fromIndex);
        const nestedBody = extractClassBody(afterMatch);

        if (!nestedBody) continue;

        // Find the full block including annotation, class declaration and body
        const fullBlockLength = afterMatch.indexOf(nestedBody) + nestedBody.length + 1;
        const fullBlock = afterMatch.substring(0, fullBlockLength + 1);

        cleanedBody = cleanedBody.replace(fullBlock, '');

        // Inject a reference property named after the nested class (camelCase)
        const propName = nestedClassName.charAt(0).toLowerCase() + nestedClassName.slice(1);
        injectedProperties.unshift({
            name: propName,
            type: resolvedName,
            isNullable: false,
            isArray: false,
            isGeneric: false,
            isDeprecated: false,
        });
    }

    return { cleanedBody, injectedProperties };
}