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
    } as any
})