import * as fs from 'fs';
import * as path from 'path';
import { parseCSharpFiles } from '../parser/index.js';
import { convertFileName, generateTypeScriptFiles } from '../generator/index.js';
import chalk from 'chalk';
import { pathToFileURL } from 'url';
import { resolveProjectFilesFromSource } from '../parser/resolve-project-files-from-source.js';
/**
 * Default configuration values
 */
const DEFAULT_CONFIG = {
    targetAnnotation: 'TypeSharp',
    singleOutputFile: false,
    namingConvention: 'camel'
};
/**
 * Load configuration from a file
 */
async function loadConfigFromFile(filePath) {
    const ext = path.extname(filePath);
    if (ext === '.json') {
        const content = fs.readFileSync(filePath, 'utf-8');
        const config = JSON.parse(content);
        return mergeWithDefaults(config);
    }
    if (ext === '.js') {
        const fileUrl = pathToFileURL(path.resolve(filePath)).href;
        const module = await import(fileUrl);
        const exportedConfig = module.default || module;
        return mergeWithDefaults(exportedConfig);
    }
    if (ext === '.ts') {
        // In ESM mode, .ts config files need special handling
        // Try to import directly (works if tsx is registered as a loader)
        try {
            const fileUrl = pathToFileURL(path.resolve(filePath)).href;
            const module = await import(fileUrl);
            const exportedConfig = module.default || module;
            return mergeWithDefaults(exportedConfig);
        }
        catch (error) {
            throw new Error(`Failed to load TypeScript config file: ${filePath}\n` +
                `In ESM mode, you have two options:\n` +
                `1. Use a .json config file instead\n` +
                `2. Use a .js config file (compile your TypeScript first)\n` +
                `3. Run TypeSharp with: node --loader tsx/cjs ./bin/typesharp.js\n` +
                `Original error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    throw new Error(`Unsupported config file format: ${ext}`);
}
/**
 * Merge user config with defaults
 */
export const mergeWithDefaults = (config) => {
    // Deprecation warning
    if (config.projectFiles && !config.source) {
        console.warn(chalk.yellow.bold('⚠ Deprecation:'), chalk.white('`projectFiles` is deprecated. Please rename it to `source` in your config.'));
        config.source = config.source || config.projectFiles;
    }
    if (!config.source && !config.projectFiles) {
        throw new Error('`source` is required in configuration');
    }
    if (!config.outputPath) {
        throw new Error('outputPath is required in configuration');
    }
    return {
        ...DEFAULT_CONFIG,
        ...config,
    };
};
export async function generate(configPath, incremental = true) {
    try {
        console.log(chalk.cyan.bold('\n🚀 TypeSharp - Starting generation...'));
        const config = await loadConfig(configPath);
        console.log(chalk.green.bold('\n✓ Configuration loaded'));
        console.log(chalk.cyan(`->  Output:`), chalk.white(config.outputPath));
        console.log(chalk.cyan(`->  Annotation:`), chalk.white(`[${config.targetAnnotation}]`));
        console.log(chalk.cyan(`->  Single file:`), chalk.white(config.singleOutputFile));
        console.log(chalk.cyan('\n⧖ Parsing C# files...'));
        const parseResults = await parseCSharpFiles(config);
        if (parseResults.length === 0) {
            console.warn(chalk.yellow.bold('❗ Warning:'), chalk.white(`No C# files found with [${config.targetAnnotation}] attribute\n`));
            return;
        }
        if (incremental) {
            const changedFiles = await cleanOnlyChangedOutputFiles(config, parseResults);
            generateTypeScriptFiles(config, parseResults, changedFiles);
        }
        else {
            cleanOutputDirectory(config.outputPath);
            generateTypeScriptFiles(config, parseResults);
        }
        const allClasses = parseResults.flatMap(result => result.classes);
        console.log(chalk.green.bold(`✓ Found ${allClasses.length} class(es) with [${config.targetAnnotation}] attribute`));
        console.log(chalk.blue.cyan('\n⧖ Generating TypeScript files...'));
        generateTypeScriptFiles(config, parseResults);
        console.log(chalk.green.bold('✅ Generation completed successfully!\n'));
    }
    catch (error) {
        if (error instanceof Error) {
            console.error(chalk.red.bold(`\n❌ Error:`), chalk.white(error.message));
        }
        else {
            console.error(chalk.red.bold(`\n❌ An unknown error occurred`));
        }
        throw error;
    }
}
/**
 * Clean only output files corresponding to changed C# files
 */
async function cleanOnlyChangedOutputFiles(config, parseResults) {
    const { loadPreviousHashes, savePreviousHashes, getChangedFiles, computeFileHash } = await import('../helpers/change-tracker.js');
    const csharpFiles = parseResults.map(r => r.filePath);
    const previousHashes = loadPreviousHashes();
    const { changed, deleted } = getChangedFiles(csharpFiles, previousHashes);
    console.log('\n🔍 Change Detection:');
    if (changed.length > 0) {
        console.log(chalk.yellow(`  Changed files: ${changed.length}`));
        changed.forEach((f) => console.log(chalk.yellow(`    ↳ ${f}`)));
    }
    if (deleted.length > 0) {
        console.log(chalk.red(`  Deleted files: ${deleted.length}`));
        deleted.forEach((f) => console.log(chalk.red(`    ↳ ${f}`)));
    }
    for (const deletedFile of deleted) {
        removeCorrespondingTsFile(config, deletedFile);
    }
    const currentHashes = new Map();
    for (const file of csharpFiles) {
        currentHashes.set(file, computeFileHash(file));
    }
    savePreviousHashes(currentHashes);
    return new Set(changed);
}
/**
 * Deletes all contents of a directory but keeps the directory itself.
 * @param dir Path to the directory to clean
 */
export function cleanOutputDirectory(dir) {
    if (!fs.existsSync(dir))
        return;
    const entries = fs.readdirSync(dir);
    console.log('\nRemoving:');
    for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        console.log(chalk.red('-', chalk.strikethrough(`${fullPath}`)));
        const stat = fs.lstatSync(fullPath);
        if (stat.isDirectory()) {
            fs.rmSync(fullPath, { recursive: true, force: true });
        }
        else {
            fs.unlinkSync(fullPath);
        }
    }
}
/**
 * Remove TypeScript output file(s) for a deleted C# source file
 */
function removeCorrespondingTsFile(config, csharpFilePath) {
    const outputPath = config.outputPath;
    const relativePath = path.relative(config.source, csharpFilePath);
    const fileName = path.basename(relativePath, '.cs');
    const fileConvention = typeof config.namingConvention === 'string'
        ? config.namingConvention
        : config.namingConvention?.file ?? 'camel';
    let baseName = fileName;
    if (config.fileSuffix) {
        baseName = `${baseName}${config.fileSuffix}`;
    }
    const tsFileName = convertFileName(baseName, fileConvention) + '.ts';
    const tsFilePath = path.join(outputPath, path.dirname(relativePath), tsFileName);
    if (fs.existsSync(tsFilePath)) {
        fs.unlinkSync(tsFilePath);
        console.log(chalk.red(`  Removed: ${tsFilePath}`));
    }
}
/**
 * Load configuration from file or use provided config
 */
export async function loadConfig(configPath) {
    if (configPath && fs.existsSync(configPath)) {
        return await loadConfigFromFile(configPath);
    }
    // Look for default config files
    const defaultPaths = [
        'typesharp.config.ts',
        'typesharp.config.js',
        'typesharp.config.json'
    ];
    for (const defaultPath of defaultPaths) {
        if (fs.existsSync(defaultPath)) {
            return await loadConfigFromFile(defaultPath);
        }
    }
    throw new Error('No configuration file found. Please create typesharp.config.ts, typesharp.config.js, or typesharp.config.json');
}
/**
 * Validate configuration
 */
function validateConfig(config) {
    // Convert single project to array for unified handling
    const projectFiles = resolveProjectFilesFromSource(config.source);
    // Validate each project file
    for (const projectFile of projectFiles) {
        if (!fs.existsSync(projectFile)) {
            throw new Error(`Project file does not exist: ${projectFile}`);
        }
        const stats = fs.statSync(projectFile);
        if (!stats.isFile()) {
            throw new Error(`Target path is not a file: ${projectFile}`);
        }
        if (!projectFile.endsWith('.csproj')) {
            throw new Error(`Target file is not a .csproj: ${projectFile}`);
        }
    }
    /**
     * Optional fields sanitization
     */
    if (config.targetAnnotation) {
        const original = config.targetAnnotation;
        // Remove spaces, [ and ]
        config.targetAnnotation = config.targetAnnotation.replace(/[ \[\]]/g, '');
        if (config.targetAnnotation !== original) {
            console.warn(chalk.yellow.bold('❗ Warning:'), chalk.white(`remove invalid characters (space, [ or ]) from your`), chalk.bold('targetAnnotation'), `\n`);
        }
    }
}
//# sourceMappingURL=index.js.map