/**
 * Generate a const object + union type from a [Union]-decorated enum
 */
export function generateUnionEnum(cls) {
    const values = cls.enumValues || [];
    const entries = values.map(v => `  ${v}: '${v}'`).join(',\n');
    return [
        `export const ${cls.name} = {\n${entries}\n} as const;`,
        ``,
        `export type ${cls.name} = typeof ${cls.name}[keyof typeof ${cls.name}];`
    ].join('\n');
}
//# sourceMappingURL=generate-union-enum.js.map