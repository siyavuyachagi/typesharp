import * as fs from 'fs';
import * as path from 'path';
import { CSharpClass, CSharpProperty, NamingConvention } from '../types';
import type { ParseResult, TypeSharpConfig } from '../types';

/**
 * Generate TypeScript files from parsed C# classes
 */
export function generateTypeScriptFiles(
  config: TypeSharpConfig,
  parseResults: ParseResult[],
): void {
  const outputPath = config.outputPath;

  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  if (config.singleOutputFile) {
    const allClasses = parseResults.flatMap(r => r.classes);
    generateSingleFile(allClasses, outputPath, config);
  } else {
    // Generate one TypeScript file per C# file (preserves grouping)
    generateMultipleFiles(outputPath, config, parseResults);
  }
}

/**
 * Generate a single file with all types
 */
function generateSingleFile(
  classes: CSharpClass[],
  outputPath: string,
  config: TypeSharpConfig
): void {
  const content = classes
    .map(cls => generateTypeScriptClass(cls, config))
    .join('\n\n');

  const header = generateFileHeader();
  const fullContent = `${header}\n\n${content}\n`;

  const fileName = 'types.ts';
  const filePath = path.join(outputPath, fileName);

  fs.writeFileSync(filePath, fullContent, 'utf-8');
  console.log(`✓ Generated: ${filePath}`);
}

/**
 * Generate multiple files - one TypeScript file per C# source file
 * This preserves the original grouping of classes
 */
function generateMultipleFiles(
  outputPath: string,
  config: TypeSharpConfig,
  parseResults: ParseResult[]
): void {
  for (const result of parseResults) {
    // Generate content for all classes in this C# file
    const content = result.classes
      .map(cls => generateTypeScriptClass(cls, config))
      .join('\n\n');

    const header = generateFileHeader();
    const fullContent = `${header}\n\n${content}\n`;

    // Preserve folder structure
    const relativeDir = path.dirname(result.relativePath);
    const targetDir = path.join(outputPath, relativeDir);
    
    // Create directory if needed
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Get the original C# filename without extension
    const originalFileName = path.basename(result.relativePath, '.cs');
    
    // Apply file suffix if configured
    let baseName = originalFileName;
    if (config.fileSuffix) {
      const convention = config.fileNamingConvention || 'kebab';
      const suffix = convertFileName(config.fileSuffix, convention);
      baseName = `${baseName}-${suffix}`;
    }

    // Apply naming convention to the filename
    const fileName = convertFileName(baseName, config.fileNamingConvention || 'kebab');
    const filePath = path.join(targetDir, `${fileName}.ts`);

    fs.writeFileSync(filePath, fullContent, 'utf-8');
    console.log(`✓ Generated: ${filePath}`);
  }
}

/**
 * Generate TypeScript interface or enum from C# class
 */
function generateTypeScriptClass(cls: CSharpClass, config: TypeSharpConfig): string {
  if (cls.isEnum) {
    return generateEnum(cls);
  }

  return generateInterface(cls, config);
}

/**
 * Generate TypeScript enum
 */
function generateEnum(cls: CSharpClass): string {
  const values = cls.enumValues || [];
  const enumValues = values
    .map(v => `  ${v} = '${v}'`)
    .join(',\n');

  return `export enum ${cls.name} {\n${enumValues}\n}`;
}

/**
 * Generate TypeScript interface
 */
function generateInterface(cls: CSharpClass, config: TypeSharpConfig): string {
  const properties = cls.properties
    .map(prop => generateProperty(prop, config.namingConvention || 'camel'))
    .join('\n');

  const extendsClause = cls.inheritsFrom ? ` extends ${cls.inheritsFrom}` : '';

  return `export interface ${cls.name}${extendsClause} {\n${properties}\n}`;
}

/**
 * Generate a single property
 */
function generateProperty(prop: CSharpProperty, convention: NamingConvention): string {
  const propertyName = convertPropertyName(prop.name, convention);
  let type = prop.type;

  // Handle arrays
  if (prop.isArray) {
    type = `${type}[]`;
  }

  // Handle nullable
  if (prop.isNullable) {
    type = `${type} | null`;
  }

  return `  ${propertyName}: ${type};`;
}

/**
 * Convert property name to specified convention
 */
function convertPropertyName(name: string, convention: NamingConvention): string {
  switch (convention) {
    case 'camel':
      return toCamelCase(name);
    case 'pascal':
      return toPascalCase(name);
    case 'snake':
      return toSnakeCase(name);
    case 'kebab':
      return toKebabCase(name);
    default:
      return name;
  }
}

/**
 * Convert file name to specified convention
 */
function convertFileName(name: string, convention: NamingConvention): string {
  switch (convention) {
    case 'kebab':
      return toKebabCase(name);
    case 'snake':
      return toSnakeCase(name);
    case 'camel':
      return toCamelCase(name);
    case 'pascal':
      return toPascalCase(name);
    default:
      return name;
  }
}

/**
 * Convert string to camelCase
 */
function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/**
 * Convert string to PascalCase
 */
function toPascalCase(str: string): string {
  return str
    .replace(/[_-](.)/g, (_, char) => char.toUpperCase())
    .replace(/^(.)/, (_, char) => char.toUpperCase());
}

/**
 * Convert string to snake_case
 */
function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '');
}

/**
 * Convert string to kebab-case
 */
function toKebabCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '');
}

/**
 * Generate file header comment
 */
function generateFileHeader(): string {
  const timestamp = new Date().toISOString();
  return `/**
 * Auto-generated by TypeSharp
 * Generated at: ${timestamp}
 * Do not edit this file manually
 */`;
}