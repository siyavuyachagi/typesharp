"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeWithDefaults = void 0;
exports.generate = generate;
exports.cleanOutputDirectory = cleanOutputDirectory;
exports.loadConfig = loadConfig;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const parser_1 = require("../parser");
const generator_1 = require("../generator");
const chalk_1 = __importDefault(require("chalk"));
const url_1 = require("url");
const resolve_project_files_from_source_1 = require("../parser/resolve-project-files-from-source");
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
        return (0, exports.mergeWithDefaults)(config);
    }
    if (ext === '.js') {
        const fileUrl = (0, url_1.pathToFileURL)(path.resolve(filePath)).href;
        const module = await Promise.resolve(`${fileUrl}`).then(s => __importStar(require(s)));
        const exportedConfig = module.default || module;
        return (0, exports.mergeWithDefaults)(exportedConfig);
    }
    if (ext === '.ts') {
        // Use tsx to load TypeScript config files at runtime
        const tsxPath = require.resolve('tsx/cjs');
        require(tsxPath);
        const module = require(path.resolve(filePath));
        const exportedConfig = module.default || module;
        return (0, exports.mergeWithDefaults)(exportedConfig);
    }
    throw new Error(`Unsupported config file format: ${ext}`);
}
/**
 * Merge user config with defaults
 */
const mergeWithDefaults = (config) => {
    // Deprecation warning
    if (config.projectFiles && !config.source) {
        console.warn(chalk_1.default.yellow.bold('⚠ Deprecation:'), chalk_1.default.white('`projectFiles` is deprecated. Please rename it to `source` in your config.'));
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
exports.mergeWithDefaults = mergeWithDefaults;
async function generate(configPath, incremental = true) {
    try {
        console.log(chalk_1.default.cyan.bold('\n🚀 TypeSharp - Starting generation...'));
        const config = await loadConfig(configPath);
        console.log(chalk_1.default.green.bold('\n✓ Configuration loaded'));
        // [... existing code ...]
        // Parse C# files
        console.log(chalk_1.default.cyan('\n⧖ Parsing C# files...'));
        const parseResults = await (0, parser_1.parseCSharpFiles)(config);
        if (parseResults.length === 0) {
            console.warn(chalk_1.default.yellow.bold('❗ Warning:'), chalk_1.default.white(`No C# files found with [${config.targetAnnotation}] attribute\n`));
            return;
        }
        // NEW: Incremental cleanup
        if (incremental) {
            await cleanOnlyChangedOutputFiles(config, parseResults);
        }
        else {
            cleanOutputDirectory(config.outputPath); // Full clean (old behavior)
        }
        const allClasses = parseResults.flatMap(result => result.classes);
        console.log(chalk_1.default.green.bold(`✓ Found ${allClasses.length} class(es) with [${config.targetAnnotation}] attribute`));
        console.log(chalk_1.default.blue.cyan('\n⧖ Generating TypeScript files...'));
        (0, generator_1.generateTypeScriptFiles)(config, parseResults);
        console.log(chalk_1.default.green.bold('✅ Generation completed successfully!\n'));
    }
    catch (error) {
        // [... error handling ...]
    }
}
// export async function generate(configPath?: string): Promise<void> {
//   try {
//     console.log(chalk.cyan.bold('\n🚀 TypeSharp - Starting generation...'));
//     // Load configuration
//     const config = await loadConfig(configPath);
//     console.log(chalk.green.bold('\n✓ Configuration loaded'));
//     // Display project files
//     const projectFiles = Array.isArray(config.projectFiles)
//       ? config.projectFiles
//       : [config.projectFiles];
//     if (projectFiles.length === 1) {
//       console.log(chalk.cyan(`->  Target:`), chalk.white(projectFiles[0]));
//     } else {
//       console.log(chalk.cyan(`->  Targets (${projectFiles.length} projects):`));
//       projectFiles.forEach((file, index) => {
//         console.log(chalk.cyan(`    ${index + 1}.`), chalk.white(file));
//       });
//     }
//     console.log(chalk.cyan(`->  Output:`), chalk.white(config.outputPath));
//     console.log(chalk.cyan(`->  Annotation:`), chalk.white(`[${config.targetAnnotation}]`));
//     console.log(chalk.cyan(`->  Single file:`), chalk.white(config.singleOutputFile));
//     if (config.fileSuffix) {
//       console.log(chalk.cyan(`->  File suffix:`), chalk.white(config.fileSuffix));
//     }
//     // Validate configuration
//     console.log(chalk.cyan('\n⧖ Configuration validation...'));
//     validateConfig(config);
//     console.log(chalk.green.bold('✓ Configuration validated'));
//     // Clean output directory
//     cleanOutputDirectory(config.outputPath);
//     // Parse C# files from all projects
//     console.log(chalk.cyan('\n⧖ Parsing C# files...'));
//     const parseResults = await parseCSharpFiles(config);
//     if (parseResults.length === 0) {
//       console.warn(chalk.yellow.bold('❗ Warning:'), chalk.white(`No C# files found with [${config.targetAnnotation}] attribute\n`));
//       return;
//     }
//     // Collect all classes
//     const allClasses = parseResults.flatMap(result => result.classes);
//     console.log(chalk.green.bold(`✓ Found ${allClasses.length} class(es) with [${config.targetAnnotation}] attribute`));
//     // Generate TypeScript files
//     console.log(chalk.blue.cyan('\n⧖ Generating TypeScript files...'));
//     generateTypeScriptFiles(config, parseResults);
//     console.log(chalk.green.bold('✅ Generation completed successfully!\n'));
//   } catch (error) {
//     if (error instanceof Error) {
//       console.error(chalk.red.bold(`\n❌ Error:`), chalk.white(error.message));
//     } else {
//       console.error(chalk.red.bold(`\n❌ An unknown error occurred`));
//     }
//     throw error;
//   }
// }
/**
 * Clean only output files corresponding to changed C# files
 */
async function cleanOnlyChangedOutputFiles(config, parseResults) {
    const { loadPreviousHashes, savePreviousHashes, getChangedFiles, computeFileHash } = await Promise.resolve().then(() => __importStar(require('../helpers/change-tracker')));
    const csharpFiles = parseResults.map(r => r.filePath);
    const previousHashes = loadPreviousHashes();
    const { changed, deleted } = getChangedFiles(csharpFiles, previousHashes);
    console.log('\n🔍 Change Detection:');
    if (changed.length > 0) {
        console.log(chalk_1.default.yellow(`  Changed files: ${changed.length}`));
        changed.forEach(f => console.log(chalk_1.default.yellow(`    ↳ ${f}`)));
    }
    if (deleted.length > 0) {
        console.log(chalk_1.default.red(`  Deleted files: ${deleted.length}`));
        deleted.forEach(f => console.log(chalk_1.default.red(`    ↳ ${f}`)));
    }
    // Remove TS files for deleted C# files
    for (const deletedFile of deleted) {
        removeCorrespondingTsFile(config, deletedFile);
    }
    // Save current hashes for next run
    const currentHashes = new Map();
    for (const file of csharpFiles) {
        currentHashes.set(file, computeFileHash(file));
    }
    savePreviousHashes(currentHashes);
}
/**
 * Deletes all contents of a directory but keeps the directory itself.
 * @param dir Path to the directory to clean
 */
function cleanOutputDirectory(dir) {
    if (!fs.existsSync(dir))
        return;
    const entries = fs.readdirSync(dir);
    console.log('\nRemoving:');
    for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        console.log(chalk_1.default.red('-', chalk_1.default.strikethrough(`${fullPath}`)));
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
    const tsFileName = (0, generator_1.convertFileName)(baseName, fileConvention) + '.ts';
    const tsFilePath = path.join(outputPath, path.dirname(relativePath), tsFileName);
    if (fs.existsSync(tsFilePath)) {
        fs.unlinkSync(tsFilePath);
        console.log(chalk_1.default.red(`  Removed: ${tsFilePath}`));
    }
}
/**
 * Load configuration from file or use provided config
 */
async function loadConfig(configPath) {
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
    const projectFiles = (0, resolve_project_files_from_source_1.resolveProjectFilesFromSource)(config.source);
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
            console.warn(chalk_1.default.yellow.bold('❗ Warning:'), chalk_1.default.white(`remove invalid characters (space, [ or ]) from your`), chalk_1.default.bold('targetAnnotation'), `\n`);
        }
    }
}
//# sourceMappingURL=index.js.map