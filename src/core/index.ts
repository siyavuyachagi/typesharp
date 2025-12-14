import * as fs from 'fs';
import * as path from 'path';
import { TypeSharpConfig } from '../types';
import { parseCSharpFiles } from '../parser';
import { generateTypeScriptFiles } from '../generator';
import chalk from 'chalk';

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Partial<TypeSharpConfig> = {
  targetAnnotation: 'TypeSharp',
  singleOutputFile: false,
  fileNamingConvention: 'kebab',
  namingConvention: 'camel'
};

/**
 * Load configuration from a file
 */
function loadConfigFromFile(filePath: string): TypeSharpConfig {
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
function mergeWithDefaults(config: Partial<TypeSharpConfig>): TypeSharpConfig {
  if (!config.projectFile) {
    throw new Error('targetPath is required in configuration');
  }

  if (!config.outputPath) {
    throw new Error('outputPath is required in configuration');
  }

  return {
    ...DEFAULT_CONFIG,
    ...config
  } as TypeSharpConfig;
}



/**
 * Main function to run TypeSharp generation
 */
export async function generate(configPath?: string): Promise<void> {
  try {
    console.log(chalk.cyan.bold('\n🚀 TypeSharp - Starting generation...'));

    // Load configuration
    const config = loadConfig(configPath);
    console.log(chalk.green.bold('\n✓ Configuration loaded'));
    console.log(chalk.cyan(`->  Target:`), chalk.white(config.projectFile));
    console.log(chalk.cyan(`->  Output:`), chalk.white(config.outputPath));
    console.log(chalk.cyan(`->  Annotation:`), chalk.white(`[${config.targetAnnotation}]`));
    console.log(chalk.cyan(`->  Single file:`), chalk.white(config.singleOutputFile));
    if (config.fileSuffix) {
      console.log(chalk.cyan(`->  File suffix:`), chalk.white(config.fileSuffix));
    }



    // Validate configuration
    console.log(chalk.cyan('\n⧖ Configuration validation...'));
    validateConfig(config);
    console.log(chalk.green.bold('✓ Configuration validated'));




    // Parse C# files
    console.log(chalk.cyan('\n⧖ Parsing C# files...'));
    const parseResults = await parseCSharpFiles(config);



    if (parseResults.length === 0) {
      console.warn(chalk.yellow.bold('❗ Warning:'), chalk.white(`No C# files found with [TypeSharp] attribute\n`));
      return;
    }



    // Collect all classes
    const allClasses = parseResults.flatMap(result => result.classes);
    console.log(chalk.green.bold(`✓ Found ${allClasses.length} class(es) with [${config.targetAnnotation}] attribute`));
    // Display found classes
    // for (const cls of allClasses) {
    //   const type = cls.isEnum ? 'enum' : 'class';
    //   const inheritance = cls.inheritsFrom ? ` : ${cls.inheritsFrom}` : '';
    //   console.log(chalk.gray.italic(`  - ${cls.name} (${type})${inheritance}`));
    // }



    // Generate TypeScript files
    console.log(chalk.blue.cyan('\n⧖ Generating TypeScript files...'));
    generateTypeScriptFiles(config, parseResults);



    console.log(chalk.green.bold('✅ Generation completed successfully!\n'));
  } catch (error) {
    if (error instanceof Error) {
      console.error(chalk.red.bold(`\n❌ Error:`), chalk.white(error.message));
    } else {
      console.error(`\n❌ An unknown error occurred`);
      console.error(chalk.red.bold(`\n❌ An unknown error occurred`));
    }
    throw error;
  }
}

/**
 * Load configuration from file or use provided config
 */
export function loadConfig(configPath?: string): TypeSharpConfig {
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

  throw new Error(
    'No configuration file found. Please create typesharp.config.ts, typesharp.config.js, or typesharp.config.json'
  );
}


/**
 * Validate configuration
 */
function validateConfig(config: TypeSharpConfig): void {
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

  /**
   * Optional fields sanitization
   */
  if (config.targetAnnotation) {
    const original = config.targetAnnotation;
    // Remove spaces, [ and ]
    config.targetAnnotation = config.targetAnnotation.replace(/[ \[\]]/g, '');

    if (config.targetAnnotation !== original) {
      console.warn(chalk.yellow.bold('❗ Warning:'), chalk.white(`remove invalid characters (space, [ or ]) from your`), chalk.bold('targetAnnotation'),`\n`);
    }
  }
}


/**
 * Create a sample configuration file
 */
export function createSampleConfig(format: 'ts' | 'js' | 'json' = 'ts'): void {
  const sampleConfig: TypeSharpConfig = {
    projectFile: 'C:/Users/User/Desktop/MyApp/Api/Api.csproj',
    outputPath: './app/types',
    targetAnnotation: 'TypeSharp',
    singleOutputFile: false,
    fileNamingConvention: 'kebab',
    namingConvention: 'camel',
  };

  let fileName: string;
  let content: string;

  if (format === 'json') {
    fileName = 'typesharp.config.json';
    content = JSON.stringify(sampleConfig, null, 2);
  } else if (format === 'js') {
    fileName = 'typesharp.config.js';
    content = `module.exports = ${JSON.stringify(sampleConfig, null, 2)};\n`;
  } else {
    fileName = 'typesharp.config.ts';
    content = `import { TypeSharpConfig } from 'typesharp';

const config: TypeSharpConfig = ${JSON.stringify(sampleConfig, null, 2)};

export default config;
`;
  }

  if (fs.existsSync(fileName)) {
    console.log(chalk.yellow.bold('❗ Warning:'), chalk.white(`${fileName} already exists. Skipping creation.`));
    return;
  }

  fs.writeFileSync(fileName, content, 'utf-8');
  console.log(chalk.green.bold('✅ Created'), chalk.white(`./${fileName}`));
}