"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseProperties = parseProperties;
/**
 * Parse properties from class body
 */
function parseProperties(classBody) {
    const properties = [];
    let match;
    // Match property declarations with get/set
    const propertyRegex = /public\s+([\w<>[\]?]+)\s+(\w+)\s*\{\s*get;\s*set;\s*\}/g;
    while ((match = propertyRegex.exec(classBody)) !== null) {
        const type = match[1];
        const name = match[2];
        const tsAttrs = extractTypeSharpAttributeInfo(classBody, match.index);
        if (tsAttrs.ignore)
            continue;
        const resolvedName = tsAttrs.overrideName ?? name;
        const resolvedType = tsAttrs.overrideType ?? type;
        const obs = extractObsoleteInfo(classBody, match.index);
        properties.push({ ...parsePropertyType(resolvedName, resolvedType), ...obs });
    }
    // Also match computed/expression-bodied properties (with =>)
    const computedPropertyRegex = /public\s+([\w<>[\]?]+)\s+(\w+)\s*=>/g;
    while ((match = computedPropertyRegex.exec(classBody)) !== null) {
        const type = match[1];
        const name = match[2];
        const tsAttrs = extractTypeSharpAttributeInfo(classBody, match.index);
        if (tsAttrs.ignore)
            continue;
        const resolvedName = tsAttrs.overrideName ?? name;
        const resolvedType = tsAttrs.overrideType ?? type;
        const obs = extractObsoleteInfo(classBody, match.index);
        properties.push({ ...parsePropertyType(resolvedName, resolvedType), ...obs });
    }
    // { get { return ...; } }
    const getBlockRegex = /public\s+([\w<>[\]?]+)\s+(\w+)\s*\{\s*get\s*\{[^}]*\}\s*\}/g;
    while ((match = getBlockRegex.exec(classBody)) !== null) {
        const type = match[1];
        const name = match[2];
        const tsAttrs = extractTypeSharpAttributeInfo(classBody, match.index);
        if (tsAttrs.ignore)
            continue;
        const resolvedName = tsAttrs.overrideName ?? name;
        const resolvedType = tsAttrs.overrideType ?? type;
        const obs = extractObsoleteInfo(classBody, match.index);
        properties.push({ ...parsePropertyType(resolvedName, resolvedType), ...obs });
    }
    return properties;
}
function extractObsoleteInfo(classBody, matchIndex) {
    const before = classBody.substring(0, matchIndex);
    const lines = before.split('\n');
    // Walk backwards, only through attribute lines and whitespace
    // Stop as soon as we hit a line that isn't an attribute or blank
    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        if (line === '')
            continue;
        // If it's an attribute line, check for Obsolete
        if (line.startsWith('[')) {
            const obsoleteMatch = line.match(/\[Obsolete(?:Attribute)?\s*(?:\(\s*"([^"]*)"\s*(?:,\s*(?:true|false))?\s*\))?\]/i);
            if (obsoleteMatch) {
                return {
                    isDeprecated: true,
                    deprecationMessage: obsoleteMatch[1] ?? undefined
                };
            }
            // It's a different attribute — keep walking back (stacked attributes)
            continue;
        }
        // Hit a non-attribute, non-blank line — stop looking
        break;
    }
    return { isDeprecated: false };
}
function extractTypeSharpAttributeInfo(classBody, matchIndex) {
    const before = classBody.substring(0, matchIndex);
    const lines = before.split('\n');
    let ignore = false;
    let overrideName;
    let overrideType;
    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        if (line === '')
            continue;
        if (!line.startsWith('['))
            break;
        if (/\[TypeIgnore\]/.test(line))
            ignore = true;
        const nameMatch = line.match(/\[TypeName\s*\(\s*"([^"]+)"\s*\)\]/);
        if (nameMatch)
            overrideName = nameMatch[1];
        const asMatch = line.match(/\[TypeAs\s*\(\s*"([^"]+)"\s*\)\]/);
        if (asMatch)
            overrideType = asMatch[1];
    }
    return { ignore, overrideName, overrideType };
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
        genericType: undefined,
        isDeprecated: false,
        deprecationMessage: undefined,
    };
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
//# sourceMappingURL=parse-properties.js.map