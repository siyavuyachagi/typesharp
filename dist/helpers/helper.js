"use strict";
// --- add helper(s) near the top of the file (or anywhere above parsePropertyType) ---
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
//# sourceMappingURL=helper.js.map