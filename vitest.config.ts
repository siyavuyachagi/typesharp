// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['tests/**/*.test.ts'],
        passWithNoTests: true,
        pool: 'forks',
        forks: {
            execArgv: ['--import', 'tsx'],
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any
})