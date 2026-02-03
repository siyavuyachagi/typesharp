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
exports.generate = generate;
exports.cleanOutputDirectory = cleanOutputDirectory;
exports.loadConfig = loadConfig;
exports.createSampleConfig = createSampleConfig;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const parser_1 = require("../parser");
const generator_1 = require("../generator");
const chalk_1 = __importDefault(require("chalk"));
/**
 * Default configuration values
 */
const DEFAULT_CONFIG = {
    targetAnnotation: 'TypeSharp',
    singleOutputFile: false,
    // fileNamingConvention: 'kebab',
    namingConvention: 'camel'
};
/**
 * Load configuration from a file
 */
function loadConfigFromFile(filePath) {
    const ext = path.extname(filePath);
    if (ext === '.json') {
        const content = fs.readFileSync(filePath, 'utf-8');
        const config = JSON.parse(content);
        return mergeWithDefaults(config);
    }
    if (ext === '.js' || ext === '.ts') {
        // For TypeScript/JavaScript files, we need to require them
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const config = require(path.resolve(filePath));
        const exportedConfig = config.default || config;
        return mergeWithDefaults(exportedConfig);
    }
    throw new Error(`Unsupported config file format: ${ext}`);
}
/**
 * Merge user config with defaults
 */
function mergeWithDefaults(config) {
    if (!config.projectFiles) {
        throw new Error('targetPath is required in configuration');
    }
    if (!config.outputPath) {
        throw new Error('outputPath is required in configuration');
    }
    return {
        ...DEFAULT_CONFIG,
        ...config
    };
}
async function generate(configPath) {
    try {
        console.log(chalk_1.default.cyan.bold('\n🚀 TypeSharp - Starting generation...'));
        // Load configuration
        const config = loadConfig(configPath);
        console.log(chalk_1.default.green.bold('\n✓ Configuration loaded'));
        // Display project files
        const projectFiles = Array.isArray(config.projectFiles)
            ? config.projectFiles
            : [config.projectFiles];
        if (projectFiles.length === 1) {
            console.log(chalk_1.default.cyan(`->  Target:`), chalk_1.default.white(projectFiles[0]));
        }
        else {
            console.log(chalk_1.default.cyan(`->  Targets (${projectFiles.length} projects):`));
            projectFiles.forEach((file, index) => {
                console.log(chalk_1.default.cyan(`    ${index + 1}.`), chalk_1.default.white(file));
            });
        }
        console.log(chalk_1.default.cyan(`->  Output:`), chalk_1.default.white(config.outputPath));
        console.log(chalk_1.default.cyan(`->  Annotation:`), chalk_1.default.white(`[${config.targetAnnotation}]`));
        console.log(chalk_1.default.cyan(`->  Single file:`), chalk_1.default.white(config.singleOutputFile));
        if (config.fileSuffix) {
            console.log(chalk_1.default.cyan(`->  File suffix:`), chalk_1.default.white(config.fileSuffix));
        }
        // Validate configuration
        console.log(chalk_1.default.cyan('\n⧖ Configuration validation...'));
        validateConfig(config);
        console.log(chalk_1.default.green.bold('✓ Configuration validated'));
        // Clean output directory
        cleanOutputDirectory(config.outputPath);
        // Parse C# files from all projects
        console.log(chalk_1.default.cyan('\n⧖ Parsing C# files...'));
        const parseResults = await (0, parser_1.parseCSharpFiles)(config);
        if (parseResults.length === 0) {
            console.warn(chalk_1.default.yellow.bold('❗ Warning:'), chalk_1.default.white(`No C# files found with [TypeSharp] attribute\n`));
            return;
        }
        // Collect all classes
        const allClasses = parseResults.flatMap(result => result.classes);
        console.log(chalk_1.default.green.bold(`✓ Found ${allClasses.length} class(es) with [${config.targetAnnotation}] attribute`));
        // Generate TypeScript files
        console.log(chalk_1.default.blue.cyan('\n⧖ Generating TypeScript files...'));
        (0, generator_1.generateTypeScriptFiles)(config, parseResults);
        console.log(chalk_1.default.green.bold('✅ Generation completed successfully!\n'));
    }
    catch (error) {
        if (error instanceof Error) {
            console.error(chalk_1.default.red.bold(`\n❌ Error:`), chalk_1.default.white(error.message));
        }
        else {
            console.error(chalk_1.default.red.bold(`\n❌ An unknown error occurred`));
        }
        throw error;
    }
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
 * Load configuration from file or use provided config
 */
function loadConfig(configPath) {
    if (configPath && fs.existsSync(configPath)) {
        return loadConfigFromFile(configPath);
    }
    // Look for default config files
    const defaultPaths = [
        'typesharp.config.ts',
        'typesharp.config.js',
        'typesharp.config.json'
    ];
    for (const defaultPath of defaultPaths) {
        if (fs.existsSync(defaultPath)) {
            return loadConfigFromFile(defaultPath);
        }
    }
    throw new Error('No configuration file found. Please create typesharp.config.ts, typesharp.config.js, or typesharp.config.json');
}
/**
 * Validate configuration
 */
function validateConfig(config) {
    // Convert single project to array for unified handling
    const projectFiles = Array.isArray(config.projectFiles)
        ? config.projectFiles
        : [config.projectFiles];
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
/**
 * Create a sample configuration file
 */
function createSampleConfig(format) {
    const sampleConfig = {
        // Show array format as example
        projectFiles: [
            'C:/Users/User/Desktop/MyApp/Api/Api.csproj',
            'C:/Users/User/Desktop/MyApp/Domain/Domain.csproj'
        ],
        outputPath: './app/types',
        targetAnnotation: 'TypeSharp',
        singleOutputFile: false,
        namingConvention: 'camel',
        fileSuffix: ''
    };
    let fileName;
    let content;
    if (format === 'json') {
        fileName = 'typesharp.config.json';
        content = JSON.stringify(sampleConfig, null, 2);
    }
    else if (format === 'js') {
        fileName = 'typesharp.config.js';
        content = `module.exports = ${JSON.stringify(sampleConfig, null, 2)};\n`;
    }
    else {
        fileName = 'typesharp.config.ts';
        content = `import type { TypeSharpConfig } from 'typesharp';

const config: TypeSharpConfig = ${JSON.stringify(sampleConfig, null, 2)};

export default config;
`;
    }
    if (fs.existsSync(fileName)) {
        console.log(chalk_1.default.yellow.bold('❗ Warning:'), chalk_1.default.white(`${fileName} already exists. Skipping creation.`));
        return;
    }
    fs.writeFileSync(fileName, content, 'utf-8');
    console.log(chalk_1.default.green.bold('✅ Created'), chalk_1.default.white(`./${fileName}`));
}
//# sourceMappingURL=index.js.map