import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import {
    computeFileHash,
    getChangedFiles,
    loadPreviousHashes,
    savePreviousHashes
} from '../../src/helpers/change-tracker'

let tmpDir: string

beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ts-change-tracker-'))
})

afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
})

describe('computeFileHash', () => {
    it('returns the same hash for the same content', () => {
        const file = path.join(tmpDir, 'a.cs')
        fs.writeFileSync(file, 'public class Foo {}')
        const h1 = computeFileHash(file)
        const h2 = computeFileHash(file)
        expect(h1).toBe(h2)
    })

    it('returns different hashes for different content', () => {
        const a = path.join(tmpDir, 'a.cs')
        const b = path.join(tmpDir, 'b.cs')
        fs.writeFileSync(a, 'public class Foo {}')
        fs.writeFileSync(b, 'public class Bar {}')
        expect(computeFileHash(a)).not.toBe(computeFileHash(b))
    })
})

describe('savePreviousHashes / loadPreviousHashes', () => {
    it('round-trips a hash map to disk and back', () => {
        const originalCwd = process.cwd()
        process.chdir(tmpDir)
        try {
            const hashes = new Map([
                ['/some/file.cs', 'abc123'],
                ['/other/file.cs', 'def456'],
            ])
            savePreviousHashes(hashes)
            const loaded = loadPreviousHashes()
            expect(loaded.get('/some/file.cs')).toBe('abc123')
            expect(loaded.get('/other/file.cs')).toBe('def456')
        } finally {
            process.chdir(originalCwd)
        }
    })

    it('returns an empty map when no hashes file exists', () => {
        const originalCwd = process.cwd()
        process.chdir(tmpDir)
        try {
            const loaded = loadPreviousHashes()
            expect(loaded.size).toBe(0)
        } finally {
            process.chdir(originalCwd)
        }
    })
})

describe('getChangedFiles', () => {
    it('marks a new file as changed (not in previous hashes)', () => {
        const file = path.join(tmpDir, 'new.cs')
        fs.writeFileSync(file, 'public class New {}')
        const { changed, deleted } = getChangedFiles([file], new Map())
        expect(changed).toContain(file)
        expect(deleted).toHaveLength(0)
    })

    it('marks a file as unchanged when hash matches', () => {
        const file = path.join(tmpDir, 'same.cs')
        fs.writeFileSync(file, 'public class Same {}')
        const hash = computeFileHash(file)
        const previous = new Map([[file, hash]])
        const { changed } = getChangedFiles([file], previous)
        expect(changed).not.toContain(file)
    })

    it('marks a file as changed when content differs', () => {
        const file = path.join(tmpDir, 'modified.cs')
        fs.writeFileSync(file, 'public class Before {}')
        const oldHash = computeFileHash(file)
        fs.writeFileSync(file, 'public class After {}')
        const previous = new Map([[file, oldHash]])
        const { changed } = getChangedFiles([file], previous)
        expect(changed).toContain(file)
    })

    it('marks a file as deleted when it no longer exists in the current list', () => {
        const file = path.join(tmpDir, 'gone.cs')
        const previous = new Map([[file, 'oldhash']])
        const { deleted } = getChangedFiles([], previous)
        expect(deleted).toContain(file)
    })

    it('handles mix of new, changed, unchanged, and deleted', () => {
        const unchanged = path.join(tmpDir, 'unchanged.cs')
        const changed = path.join(tmpDir, 'changed.cs')
        const newFile = path.join(tmpDir, 'new.cs')
        const deleted = path.join(tmpDir, 'deleted.cs')

        fs.writeFileSync(unchanged, 'class Unchanged {}')
        fs.writeFileSync(changed, 'class OldContent {}')
        fs.writeFileSync(newFile, 'class New {}')

        const unchangedHash = computeFileHash(unchanged)
        const oldHash = computeFileHash(changed)

        fs.writeFileSync(changed, 'class NewContent {}')

        const previous = new Map([
            [unchanged, unchangedHash],
            [changed, oldHash],
            [deleted, 'someoldhash'],
        ])

        const result = getChangedFiles([unchanged, changed, newFile], previous)

        expect(result.changed).not.toContain(unchanged)
        expect(result.changed).toContain(changed)
        expect(result.changed).toContain(newFile)
        expect(result.deleted).toContain(deleted)
    })
})