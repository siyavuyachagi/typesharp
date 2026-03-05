import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import { createSampleConfig } from '../../src/core';
import { TypeSharpConfig } from '../../src/types/typesharp-config.ts';
import config from '../config/typesharp.config.ts';
import { mergeWithDefaults } from '../../src/core/index.ts'


describe("Generate default config", () => {
    it('should allow opptional fields on all config formats (.ts | .js | .json)', () => {
        const tsConfig: TypeSharpConfig = {
            projectFiles: config.projectFiles,
            outputPath: "./tests/.generated",
        };

        const jsConfig = {
            projectFiles: config.projectFiles,
            outputPath: "./tests/.generated",
        }

        const jsonConfig = {
            "projectFiles": config.projectFiles,
            "outputPath": "./app/types",
        }

        const configFiles = [tsConfig, jsConfig, jsonConfig]
        configFiles.forEach(config => {
            const outputConfig = mergeWithDefaults(config)

            expect(outputConfig.targetAnnotation).toBeDefined()
            expect(outputConfig.singleOutputFile).toBeDefined()
            expect(outputConfig.namingConvention).toBeDefined()
        })
    })
})



describe('createSampleConfig()', () => {
    const configFiles = [
        'typesharp.config.ts',
        'typesharp.config.js',
        'typesharp.config.json',
    ];

    function cleanupConfigs() {
        for (const file of configFiles) {
            if (fs.existsSync(file)) fs.unlinkSync(file);
        }
    }
    beforeEach(cleanupConfigs);
    afterEach(cleanupConfigs);

    it('should create a .ts config file', () => {
        createSampleConfig('ts');
        expect(fs.existsSync('typesharp.config.ts')).toBe(true);
    });

    it('should create a .js config file', () => {
        createSampleConfig('js');
        expect(fs.existsSync('typesharp.config.js')).toBe(true);
    });

    it('should create a .json config file', () => {
        createSampleConfig('json');
        expect(fs.existsSync('typesharp.config.json')).toBe(true);
    });

    it('should not create a .js config if a .ts config already exists', () => {
        createSampleConfig('ts');
        createSampleConfig('js');
        expect(fs.existsSync('typesharp.config.js')).toBe(false);
    });

    it('should not create a .json config if a .ts config already exists', () => {
        createSampleConfig('ts');
        createSampleConfig('json');
        expect(fs.existsSync('typesharp.config.json')).toBe(false);
    });

    it('should not create a .ts config if a .js config already exists', () => {
        createSampleConfig('js');
        createSampleConfig('ts');
        expect(fs.existsSync('typesharp.config.ts')).toBe(false);
    });

    it('should not overwrite an existing config of the same format', () => {
        createSampleConfig('json');
        const originalContent = fs.readFileSync('typesharp.config.json', 'utf-8');
        fs.writeFileSync('typesharp.config.json', '{ "modified": true }');
        createSampleConfig('json');
        const afterContent = fs.readFileSync('typesharp.config.json', 'utf-8');
        expect(afterContent).toBe('{ "modified": true }');
    });
});