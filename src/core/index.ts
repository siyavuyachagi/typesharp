import * as fs from 'fs';
import * as path from 'path';
import { parseCSharpFiles } from '../parser';
import { generateTypeScriptFiles } from '../generator';
import chalk from 'chalk';
import { TypeSharpConfig } from '../types/typesharp-config';
import { pathToFileURL } from 'url';

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Partial<TypeSharpConfig> = {
  targetAnnotation: 'TypeSharp',
  singleOutputFile: false,
  // fileNamingConvention: 'kebab',
  namingConvention: 'camel'
};

/**
 * Load configuration from a file
 */
async function loadConfigFromFile(filePath: string): Promise<TypeSharpConfig> {
  const ext = path.extname(filePath);

  if (ext === '.json') {
    const content = fs.readFileSync(filePath, 'utf-8');
    const config = JSON.parse(content);
    return mergeWithDefaults(config);
  }

  // if (ext === '.js' || ext === '.ts') {
  //   const fileUrl = pathToFileURL(path.resolve(filePath)).href;
  //   const module = await import(fileUrl);
  //   const exportedConfig = module.default || module;
  //   return mergeWithDefaults(exportedConfig);
  // }

  if (ext === '.js') {
    const fileUrl = pathToFileURL(path.resolve(filePath)).href;
    const module = await import(fileUrl);
    const exportedConfig = module.default || module;
    return mergeWithDefaults(exportedConfig);
  }

  if (ext === '.ts') {
    // Use tsx to load TypeScript config files at runtime
    const tsxPath = require.resolve('tsx/cjs');
    require(tsxPath);
    const module = require(path.resolve(filePath));
    const exportedConfig = module.default || module;
    return mergeWithDefaults(exportedConfig);
  }

  throw new Error(`Unsupported config file format: ${ext}`);
}

/**
 * Merge user config with defaults
 */
function mergeWithDefaults(config: Partial<TypeSharpConfig>): TypeSharpConfig {
  if (!config.projectFiles) {
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
 * Format a plain object as a JS/TS object literal (no quoted keys)
 */
function formatAsJsObject(obj: Record<string, any>, indent = 0): string {
  const pad = ' '.repeat(indent + 2);
  const closePad = ' '.repeat(indent);

  const lines = Object.entries(obj).map(([key, value]) => {
    let formatted: string;

    if (Array.isArray(value)) {
      const items = value.map(v => `${pad}  ${JSON.stringify(v)}`).join(',\n');
      formatted = `[\n${items}\n${pad}]`;
    } else if (typeof value === 'object' && value !== null) {
      formatted = formatAsJsObject(value, indent + 2);
    } else {
      formatted = JSON.stringify(value);
    }

    return `${pad}${key}: ${formatted}`;
  });

  return `{\n${lines.join(',\n')}\n${closePad}}`;
}


export async function generate(configPath?: string): Promise<void> {
  try {
    console.log(chalk.cyan.bold('\n🚀 TypeSharp - Starting generation...'));

    // Load configuration
    const config = await loadConfig(configPath);
    console.log(chalk.green.bold('\n✓ Configuration loaded'));

    // Display project files
    const projectFiles = Array.isArray(config.projectFiles)
      ? config.projectFiles
      : [config.projectFiles];

    if (projectFiles.length === 1) {
      console.log(chalk.cyan(`->  Target:`), chalk.white(projectFiles[0]));
    } else {
      console.log(chalk.cyan(`->  Targets (${projectFiles.length} projects):`));
      projectFiles.forEach((file, index) => {
        console.log(chalk.cyan(`    ${index + 1}.`), chalk.white(file));
      });
    }

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


    // Clean output directory
    cleanOutputDirectory(config.outputPath);


    // Parse C# files from all projects
    console.log(chalk.cyan('\n⧖ Parsing C# files...'));
    const parseResults = await parseCSharpFiles(config);

    if (parseResults.length === 0) {
      console.warn(chalk.yellow.bold('❗ Warning:'), chalk.white(`No C# files found with [TypeSharp] attribute\n`));
      return;
    }

    // Collect all classes
    const allClasses = parseResults.flatMap(result => result.classes);
    console.log(chalk.green.bold(`✓ Found ${allClasses.length} class(es) with [${config.targetAnnotation}] attribute`));

    // Generate TypeScript files
    console.log(chalk.blue.cyan('\n⧖ Generating TypeScript files...'));
    generateTypeScriptFiles(config, parseResults);

    console.log(chalk.green.bold('✅ Generation completed successfully!\n'));
  } catch (error) {
    if (error instanceof Error) {
      console.error(chalk.red.bold(`\n❌ Error:`), chalk.white(error.message));
    } else {
      console.error(chalk.red.bold(`\n❌ An unknown error occurred`));
    }
    throw error;
  }
}








/**
 * Deletes all contents of a directory but keeps the directory itself.
 * @param dir Path to the directory to clean
 */
export function cleanOutputDirectory(dir: string) {
  if (!fs.existsSync(dir)) return

  const entries = fs.readdirSync(dir)

  console.log('\nRemoving:');
  for (const entry of entries) {
    const fullPath = path.join(dir, entry)
    console.log(chalk.red('-', chalk.strikethrough(`${fullPath}`)))
    const stat = fs.lstatSync(fullPath)

    if (stat.isDirectory()) {
      fs.rmSync(fullPath, { recursive: true, force: true })
    } else {
      fs.unlinkSync(fullPath)
    }
  }
}









/**
 * Load configuration from file or use provided config
 */
export async function loadConfig(configPath?: string): Promise<TypeSharpConfig> {
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

  throw new Error(
    'No configuration file found. Please create typesharp.config.ts, typesharp.config.js, or typesharp.config.json'
  );
}


/**
 * Validate configuration
 */
function validateConfig(config: TypeSharpConfig): void {
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
      console.warn(chalk.yellow.bold('❗ Warning:'), chalk.white(`remove invalid characters (space, [ or ]) from your`), chalk.bold('targetAnnotation'), `\n`);
    }
  }
}


/**
 * Create a sample configuration file
 */
export function createSampleConfig(format: 'ts' | 'js' | 'json'): void {
  const sampleConfig: TypeSharpConfig = {
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

  let fileName: string;
  let content: string;

  if (format === 'json') {
    fileName = 'typesharp.config.json';
    content = JSON.stringify(sampleConfig, null, 2);
  } else if (format === 'js') {
    fileName = 'typesharp.config.js';
    content = `module.exports = ${formatAsJsObject(sampleConfig)};\n`;
  } else {
    fileName = 'typesharp.config.ts';
    content = [
      `import type { TypeSharpConfig } from 'typesharp';`,
      ``,
      `const config: TypeSharpConfig = ${formatAsJsObject(sampleConfig)};`,
      ``,
      `export default config;`,
      ``
    ].join('\n');
  }

  if (fs.existsSync(fileName)) {
    console.log(chalk.yellow.bold('❗ Warning:'), chalk.white(`${fileName} already exists. Skipping creation.`));
    return;
  }

  fs.writeFileSync(fileName, content, 'utf-8');
  console.log(chalk.green.bold('✅ Created'), chalk.white(`./${fileName}`));
}