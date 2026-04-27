/// <reference types="node" />

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import type { EventEmitter } from 'events'

// ─── Mocks ──────────────────────────────────────────────────────────────────

// Mock generate and loadConfig so we never hit real C# parsing
vi.mock('../../src/core/index.js', () => ({
    generate: vi.fn().mockResolvedValue(undefined),
    loadConfig: vi.fn().mockResolvedValue({
        source: './src',
        outputPath: '/tmp/ts-watch-out',
    }),
}))

// ─── Helpers ────────────────────────────────────────────────────────────────

type WatchCallback = (event: string, filename: string | null) => void

/**
 * Creates a controllable fake fs.watch.
 * Returns a `trigger(filename)` function so tests can simulate file saves.
 */
function mockFsWatch(): { trigger: (filename: string) => void; restore: () => void } {
    let capturedCallback: WatchCallback | null = null

    const fakeWatcher = {
        close: vi.fn(),
    }

    const spy = vi.spyOn(fs, 'watch').mockImplementation(
        (_path: fs.PathLike, _options: unknown, callback?: WatchCallback) => {
            if (typeof callback === 'function') capturedCallback = callback
            return fakeWatcher as unknown as fs.FSWatcher & EventEmitter
        }
    )

    return {
        trigger: (filename: string) => {
            capturedCallback?.('change', filename)
        },
        restore: () => spy.mockRestore(),
    }
}

function wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('startWatch', () => {
    let tmpDir: string

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ts-watch-test-'))
        vi.clearAllMocks()
    })

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true })
    })

    it('runs an initial generation on start', async () => {
        const { generate } = await import('../../src/core/index.js')
        const { startWatch } = await import('../../src/core/watch.js')
        const { trigger, restore } = mockFsWatch()

        const watchPromise = startWatch(undefined, true)

        // Let the initial generate call run
        await wait(50)

        expect(generate).toHaveBeenCalledTimes(1)
        expect(generate).toHaveBeenCalledWith(undefined, true)

        trigger('src/components/App.vue') // keep watcher alive then clean up
        restore()

        // Prevent test from hanging — the promise never resolves so we race it
        await Promise.race([watchPromise, wait(100)])
    })

    it('passes incremental=true to initial generate', async () => {
        const { generate } = await import('../../src/core/index.js')
        const { startWatch } = await import('../../src/core/watch.js')
        const { restore } = mockFsWatch()

        await Promise.race([startWatch(undefined, true), wait(100)])

        expect(generate).toHaveBeenCalledWith(undefined, true)
        restore()
    })

    it('passes incremental=false to initial generate when --no-incremental', async () => {
        const { generate } = await import('../../src/core/index.js')
        const { startWatch } = await import('../../src/core/watch.js')
        const { restore } = mockFsWatch()

        await Promise.race([startWatch(undefined, false), wait(100)])

        expect(generate).toHaveBeenCalledWith(undefined, false)
        restore()
    })

    it('triggers incremental generation after a file change', async () => {
        const { generate } = await import('../../src/core/index.js')
        const { startWatch } = await import('../../src/core/watch.js')
        const { trigger, restore } = mockFsWatch()

        await Promise.race([startWatch(undefined, true), wait(50)])

        trigger('src/pages/index.vue')

        // Wait for debounce (300ms) + buffer
        await wait(400)

        // Called once for initial + once for the file change
        expect(generate).toHaveBeenCalledTimes(2)
        // The watcher always passes incremental=true after the initial run
        expect(generate).toHaveBeenLastCalledWith(undefined, true)

        restore()
    })

    it('debounces rapid file saves into a single generation', async () => {
        const { generate } = await import('../../src/core/index.js')
        const { startWatch } = await import('../../src/core/watch.js')
        const { trigger, restore } = mockFsWatch()

        await Promise.race([startWatch(undefined, true), wait(50)])

        // Simulate a formatter saving 5 files rapidly
        trigger('src/pages/index.vue')
        trigger('src/pages/about.vue')
        trigger('src/components/Header.vue')
        trigger('src/components/Footer.vue')
        trigger('src/app.ts')

        await wait(400)

        // 1 initial + 1 debounced batch = 2 total
        expect(generate).toHaveBeenCalledTimes(2)

        restore()
    })

    it('ignores changes inside node_modules', async () => {
        const { generate } = await import('../../src/core/index.js')
        const { startWatch } = await import('../../src/core/watch.js')
        const { trigger, restore } = mockFsWatch()

        await Promise.race([startWatch(undefined, true), wait(50)])

        const callsBefore = (generate as ReturnType<typeof vi.fn>).mock.calls.length

        trigger('node_modules/some-package/index.js')
        await wait(400)

        expect(generate).toHaveBeenCalledTimes(callsBefore) // no new call

        restore()
    })

    it('ignores changes inside .nuxt', async () => {
        const { generate } = await import('../../src/core/index.js')
        const { startWatch } = await import('../../src/core/watch.js')
        const { trigger, restore } = mockFsWatch()

        await Promise.race([startWatch(undefined, true), wait(50)])

        const callsBefore = (generate as ReturnType<typeof vi.fn>).mock.calls.length

        trigger('.nuxt/types/schema.d.ts')
        await wait(400)

        expect(generate).toHaveBeenCalledTimes(callsBefore)

        restore()
    })

    it('ignores changes inside .next', async () => {
        const { generate } = await import('../../src/core/index.js')
        const { startWatch } = await import('../../src/core/watch.js')
        const { trigger, restore } = mockFsWatch()

        await Promise.race([startWatch(undefined, true), wait(50)])

        const callsBefore = (generate as ReturnType<typeof vi.fn>).mock.calls.length

        trigger('.next/cache/webpack/client-production/0.pack')
        await wait(400)

        expect(generate).toHaveBeenCalledTimes(callsBefore)

        restore()
    })

    it('ignores changes inside .git', async () => {
        const { generate } = await import('../../src/core/index.js')
        const { startWatch } = await import('../../src/core/watch.js')
        const { trigger, restore } = mockFsWatch()

        await Promise.race([startWatch(undefined, true), wait(50)])

        const callsBefore = (generate as ReturnType<typeof vi.fn>).mock.calls.length

        trigger('.git/index')
        await wait(400)

        expect(generate).toHaveBeenCalledTimes(callsBefore)

        restore()
    })

    it('ignores null filename events', async () => {
        const { generate } = await import('../../src/core/index.js')
        const { startWatch } = await import('../../src/core/watch.js')

        let capturedCallback: WatchCallback | null = null
        const fakeWatcher = { close: vi.fn() }
        vi.spyOn(fs, 'watch').mockImplementation(
            (_p: fs.PathLike, _o: unknown, cb?: WatchCallback) => {
                if (cb) capturedCallback = cb
                return fakeWatcher as unknown as fs.FSWatcher & EventEmitter
            }
        )

        await Promise.race([startWatch(undefined, true), wait(50)])

        const callsBefore = (generate as ReturnType<typeof vi.fn>).mock.calls.length

        capturedCallback?.('change', null)
        await wait(400)

        expect(generate).toHaveBeenCalledTimes(callsBefore)

        vi.spyOn(fs, 'watch').mockRestore()
    })

    it('registers a SIGINT handler for clean exit', async () => {
        const { startWatch } = await import('../../src/core/watch.js')
        const { restore } = mockFsWatch()

        const onSpy = vi.spyOn(process, 'on')

        await Promise.race([startWatch(undefined, true), wait(50)])

        expect(onSpy).toHaveBeenCalledWith('SIGINT', expect.any(Function))

        onSpy.mockRestore()
        restore()
    })
})