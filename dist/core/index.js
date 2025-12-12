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
Object.defineProperty(exports, "__esModule", { value: true });
exports.generate = generate;
exports.loadConfig = loadConfig;
exports.createSampleConfig = createSampleConfig;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const parser_1 = require("../parser");
const generator_1 = require("../generator");
/**
 * Default configuration values
 */
const DEFAULT_CONFIG = {
    targetAnnotation: 'TypeSharp',
    singleOutputFile: false,
    fileNamingConvention: 'kebab',
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
    if (!config.projectFile) {
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
/**
 * Main function to run TypeSharp generation
 */
async function generate(configPath) {
    try {
        console.log('🚀 TypeSharp - Starting generation...\n');
        // Load configuration
        const config = loadConfig(configPath);
        console.log('✓ Configuration loaded');
        console.log(`->  Target: ${config.projectFile}`);
        console.log(`->  Output: ${config.outputPath}`);
        console.log(`->  Annotation: [${config.targetAnnotation}]`);
        console.log(`->  Single file: ${config.singleOutputFile}\n`);
        if (config.fileSuffix)
            console.log(`-> File suffix: ${config.fileSuffix}\n`);
        // Validate configuration
        validateConfig(config);
        console.log('✓ Configuration validated\n');
        // Parse C# files
        console.log('📖 Parsing C# files...');
        const parseResults = await (0, parser_1.parseCSharpFiles)(config);
        if (parseResults.length === 0) {
            console.log('⚠ No C# files found with [TypeSharp] attribute');
            return;
        }
        // Collect all classes
        const allClasses = parseResults.flatMap(result => result.classes);
        console.log(`✓ Found ${allClasses.length} class(es) with [${config.targetAnnotation}] attribute\n`);
        // Display found classes
        for (const cls of allClasses) {
            const type = cls.isEnum ? 'enum' : 'class';
            const inheritance = cls.inheritsFrom ? ` : ${cls.inheritsFrom}` : '';
            console.log(`  - ${cls.name} (${type})${inheritance}`);
        }
        console.log('');
        // Generate TypeScript files
        console.log('✍️  Generating TypeScript files...');
        (0, generator_1.generateTypeScriptFiles)(config, parseResults);
        console.log('\n✅ Generation completed successfully!');
    }
    catch (error) {
        if (error instanceof Error) {
            console.error(`\n❌ Error: ${error.message}`);
        }
        else {
            console.error(`\n❌ An unknown error occurred`);
        }
        throw error;
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
    if (!fs.existsSync(config.projectFile)) {
        throw new Error(`Project file does not exist: ${config.projectFile}`);
    }
    const stats = fs.statSync(config.projectFile);
    if (!stats.isFile()) {
        throw new Error(`Target path is not a file: ${config.projectFile}`);
    }
    if (!config.projectFile.endsWith('.csproj')) {
        throw new Error(`Target file is not a .csproj: ${config.projectFile}`);
    }
}
/**
 * Create a sample configuration file
 */
function createSampleConfig(format = 'ts') {
    const sampleConfig = {
        projectFile: 'C:/Users/User/Desktop/MyApp/Api/Api.csproj',
        outputPath: './app/src/types',
        targetAnnotation: 'TypeSharp',
        singleOutputFile: false,
        fileNamingConvention: 'kebab',
        namingConvention: 'camel',
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
        content = `import { TypeSharpConfig } from 'typesharp';

const config: TypeSharpConfig = ${JSON.stringify(sampleConfig, null, 2)};

export default config;
`;
    }
    if (fs.existsSync(fileName)) {
        console.log(`⚠ ${fileName} already exists. Skipping creation.`);
        return;
    }
    fs.writeFileSync(fileName, content, 'utf-8');
    console.log(`✓ Created ${fileName}`);
}
//# sourceMappingURL=index.js.map