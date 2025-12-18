/**
 * Split a comma-separated generic-argument string into top-level args,
 * i.e. respects nested <...> and does NOT split commas inside nested generics.
 * Example: "string, List<Dictionary<string, Foo>>, int" -> ["string", "List<Dictionary<string, Foo>>", "int"]
 */
declare function splitTopLevelGenericArgs(s: string): string[];
/**
 * Find the index of the matching '>' for the first '<' at startIdx.
 * Returns -1 if not found.
 */
declare function findMatchingAngleBracket(s: string, startIdx: number): number;
//# sourceMappingURL=helper.d.ts.map