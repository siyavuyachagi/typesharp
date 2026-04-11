/// <reference types="node" />

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { generateTypeScriptFiles } from '../../src/generator'
import type { ParseResult, TypeSharpConfig } from '../../src/types'

let outputDir: string
let tmpDir: string

function makeParseResult(fileName: string, className: string): ParseResult {
    const filePath = path.join(tmpDir, fileName)
    return {
        filePath,
        relativePath: fileName, // just 'User.cs' — no subdirs
        classes: [{
            name: className,
            properties: [{
                name: 'Id',
                type: 'number',
                isNullable: false,
                isArray: false,
                isGeneric: false,
                isDeprecated: false
            }],
            isEnum: false,
            isRecord: false,
        }]
    }
}

function makeConfig(outputPath: string): TypeSharpConfig {
    return {
        source: tmpDir,
        outputPath,
        singleOutputFile: false,
        namingConvention: 'camel',
        targetAnnotation: 'TypeSharp',
    }
}

beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ts-gen-src-'))
    outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ts-gen-out-'))
})

afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
    fs.rmSync(outputDir, { recursive: true, force: true })
})

describe('generateTypeScriptFiles — incremental (changedFiles)', () => {
    it('generates a file when it is in the changedFiles set', () => {
        const result = makeParseResult('User.cs', 'User')
        const changedFiles = new Set([result.filePath])

        generateTypeScriptFiles(makeConfig(outputDir), [result], changedFiles)

        const files = fs.readdirSync(outputDir)
        expect(files.length).toBeGreaterThan(0)
    })

    it('skips a file when it is NOT in the changedFiles set', () => {
        const result = makeParseResult('User.cs', 'User')
        const changedFiles = new Set<string>()

        generateTypeScriptFiles(makeConfig(outputDir), [result], changedFiles)

        const files = fs.readdirSync(outputDir)
        expect(files).toHaveLength(0)
    })

    it('generates only the changed file when multiple exist', () => {
        const resultA = makeParseResult('User.cs', 'User')
        const resultB = makeParseResult('Product.cs', 'Product')
        const changedFiles = new Set([resultA.filePath])

        generateTypeScriptFiles(makeConfig(outputDir), [resultA, resultB], changedFiles)

        const files = fs.readdirSync(outputDir)
        expect(files).toHaveLength(1)
        expect(files[0]).toMatch(/user/i)
    })

    it('generates all files when changedFiles is undefined (full generation)', () => {
        const resultA = makeParseResult('User.cs', 'User')
        const resultB = makeParseResult('Product.cs', 'Product')

        generateTypeScriptFiles(makeConfig(outputDir), [resultA, resultB])

        const files = fs.readdirSync(outputDir)
        expect(files).toHaveLength(2)
    })

    it('does not overwrite a file whose content has not changed', () => {
        const result = makeParseResult('User.cs', 'User')
        const config = makeConfig(outputDir)

        generateTypeScriptFiles(config, [result])

        const files = fs.readdirSync(outputDir)
        expect(files.length).toBeGreaterThan(0)
        const outFile = path.join(outputDir, files[0]!)
        const mtime1 = fs.statSync(outFile).mtimeMs

        const before = Date.now()
        while (Date.now() - before < 20) { /* wait */ }

        generateTypeScriptFiles(config, [result])
        const mtime2 = fs.statSync(outFile).mtimeMs

        expect(mtime2).toBe(mtime1)
    })
})