import * as fs from 'fs';
import * as path from 'path';
import { TypeSharpConfig } from '../types';
import { parseCSharpFiles } from '../parser';
import { generateTypeScriptFiles } from '../generator';

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
  if (!config.targetPath) {
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
 * Validate configuration
 */
function validateConfig(config: TypeSharpConfig): void {
  if (!fs.existsSync(config.targetPath)) {
    throw new Error(`Target path does not exist: ${config.targetPath}`);
  }
  
  const stats = fs.statSync(config.targetPath);
  if (!stats.isDirectory()) {
    throw new Error(`Target path is not a directory: ${config.targetPath}`);
  }
}

/**
 * Main function to run TypeSharp generation
 */
export async function generate(configPath?: string): Promise<void> {
  try {
    console.log('🚀 TypeSharp - Starting generation...\n');
    
    // Load configuration
    const config = loadConfig(configPath);
    console.log('✓ Configuration loaded');
    console.log(`  Target: ${config.targetPath}`);
    console.log(`  Output: ${config.outputPath}`);
    console.log(`  Annotation: [${config.targetAnnotation}]`);
    console.log(`  Single file: ${config.singleOutputFile}\n`);
    
    // Validate configuration
    validateConfig(config);
    console.log('✓ Configuration validated\n');
    
    // Parse C# files
    console.log('📖 Parsing C# files...');
    const parseResults = await parseCSharpFiles(
      config.targetPath,
      config.targetAnnotation
    );
    
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
    generateTypeScriptFiles(allClasses, config);
    
    console.log('\n✅ Generation completed successfully!');
  } catch (error) {
    if (error instanceof Error) {
      console.error(`\n❌ Error: ${error.message}`);
    } else {
      console.error(`\n❌ An unknown error occurred`);
    }
    throw error;
  }
}

/**
 * Create a sample configuration file
 */
export function createSampleConfig(format: 'ts' | 'js' | 'json' = 'ts'): void {
  const sampleConfig: TypeSharpConfig = {
    targetPath: './Backend',
    outputPath: './src/types',
    targetAnnotation: 'TypeSharp',
    singleOutputFile: false,
    fileNamingConvention: 'kebab',
    namingConvention: 'camel'
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
    console.log(`⚠ ${fileName} already exists. Skipping creation.`);
    return;
  }
  
  fs.writeFileSync(fileName, content, 'utf-8');
  console.log(`✓ Created ${fileName}`);
}