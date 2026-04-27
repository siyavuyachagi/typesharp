import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { generateTypeScriptFiles } from '../../src/generator'
import type { ParseResult, TypeSharpConfig } from '../../src/types'

let outputDir: string

function makeConfig(outputPath: string): TypeSharpConfig {
    return {
        source: outputPath,
        outputPath,
        singleOutputFile: false,
        namingConvention: 'camel',
    }
}

function makeUnionEnumResult(name: string, values: string[], outputDir: string): ParseResult {
    const filePath = path.join(outputDir, `${name}.cs`)
    fs.writeFileSync(filePath, `// dummy`)
    return {
        filePath,
        relativePath: `${name}.cs`,
        classes: [{
            name,
            properties: [],
            isEnum: true,
            isRecord: false,
            isUnion: true,
            enumValues: values,
        }]
    }
}

function makeRegularEnumResult(name: string, values: string[], outputDir: string): ParseResult {
    const filePath = path.join(outputDir, `${name}.cs`)
    fs.writeFileSync(filePath, `// dummy`)
    return {
        filePath,
        relativePath: `${name}.cs`,
        classes: [{
            name,
            properties: [],
            isEnum: true,
            isRecord: false,
            enumValues: values,
        }]
    }
}

beforeEach(() => {
    outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ts-union-gen-'))
})

afterEach(() => {
    fs.rmSync(outputDir, { recursive: true, force: true })
})

describe('generateTypeScriptFiles — [Union] enum', () => {
    it('generates a const object instead of a TS enum', () => {
        const result = makeUnionEnumResult('Status', ['Active', 'Inactive'], outputDir)
        generateTypeScriptFiles(makeConfig(outputDir), [result])

        const files = fs.readdirSync(outputDir).filter(f => f.endsWith('.ts'))
        expect(files.length).toBe(1)

        const content = fs.readFileSync(path.join(outputDir, files[0]!), 'utf-8')
        expect(content).toContain('export const Status =')
        expect(content).toContain('} as const;')
    })

    it('generates a union type derived from the const', () => {
        const result = makeUnionEnumResult('Status', ['Active', 'Inactive'], outputDir)
        generateTypeScriptFiles(makeConfig(outputDir), [result])

        const files = fs.readdirSync(outputDir).filter(f => f.endsWith('.ts'))
        const content = fs.readFileSync(path.join(outputDir, files[0]!), 'utf-8')
        expect(content).toContain('export type Status = typeof Status[keyof typeof Status];')
    })

    it('includes all enum values as const entries', () => {
        const result = makeUnionEnumResult('OrderStatus', ['Pending', 'Shipped', 'Cancelled'], outputDir)
        generateTypeScriptFiles(makeConfig(outputDir), [result])

        const files = fs.readdirSync(outputDir).filter(f => f.endsWith('.ts'))
        const content = fs.readFileSync(path.join(outputDir, files[0]!), 'utf-8')
        expect(content).toContain("Pending: 'Pending'")
        expect(content).toContain("Shipped: 'Shipped'")
        expect(content).toContain("Cancelled: 'Cancelled'")
    })

    it('does NOT generate the enum keyword for a union enum', () => {
        const result = makeUnionEnumResult('Status', ['Active', 'Inactive'], outputDir)
        generateTypeScriptFiles(makeConfig(outputDir), [result])

        const files = fs.readdirSync(outputDir).filter(f => f.endsWith('.ts'))
        const content = fs.readFileSync(path.join(outputDir, files[0]!), 'utf-8')
        expect(content).not.toContain('export enum Status')
    })

    it('regular enum without [Union] still generates export enum', () => {
        const result = makeRegularEnumResult('UserRoleCode', ['Admin', 'User', 'Guest'], outputDir)
        generateTypeScriptFiles(makeConfig(outputDir), [result])

        const files = fs.readdirSync(outputDir).filter(f => f.endsWith('.ts'))
        const content = fs.readFileSync(path.join(outputDir, files[0]!), 'utf-8')
        expect(content).toContain('export enum UserRoleCode')
        expect(content).not.toContain('as const')
    })

    it('respects [TypeSharp("name")] override in const and type names', () => {
        const filePath = path.join(outputDir, 'Status.cs')
        fs.writeFileSync(filePath, `// dummy`)
        const result: ParseResult = {
            filePath,
            relativePath: 'Status.cs',
            classes: [{
                name: 'status_type',  // overridden name
                properties: [],
                isEnum: true,
                isRecord: false,
                isUnion: true,
                enumValues: ['Active', 'Inactive'],
            }]
        }

        generateTypeScriptFiles(makeConfig(outputDir), [result])

        const files = fs.readdirSync(outputDir).filter(f => f.endsWith('.ts'))
        const content = fs.readFileSync(path.join(outputDir, files[0]!), 'utf-8')
        expect(content).toContain('export const status_type =')
        expect(content).toContain('export type status_type = typeof status_type[keyof typeof status_type];')
    })

    it('generates the TypeSharp header in union enum files', () => {
        const result = makeUnionEnumResult('Status', ['Active', 'Inactive'], outputDir)
        generateTypeScriptFiles(makeConfig(outputDir), [result])

        const files = fs.readdirSync(outputDir).filter(f => f.endsWith('.ts'))
        const content = fs.readFileSync(path.join(outputDir, files[0]!), 'utf-8')
        expect(content).toContain('Auto-generated by TypeSharp')
    })
})