import * as fs from 'fs';
import * as path from 'path';
import { CSharpClass, CSharpProperty, NamingConvention } from '../types';
import type { ParseResult, TypeSharpConfig } from '../types';
import chalk from 'chalk';

/**
 * Generate TypeScript files from parsed C# classes
 */
export function generateTypeScriptFiles(
  config: TypeSharpConfig,
  parseResults: ParseResult[],
): void {
  const outputPath = config.outputPath;
  // Convention output type
  const fileConvention = typeof config.namingConvention === 'string' ? config.namingConvention : config.namingConvention?.file ?? 'camel';

  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  if (config.singleOutputFile) {
    const allClasses = parseResults.flatMap(r => r.classes);
    generateSingleFile(allClasses, outputPath, fileConvention);
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
  namingConvension: NamingConvention
): void {
  const content = classes
    .sort((a, b) => (a.isEnum ? -1 : 1) - (b.isEnum ? -1 : 1) || a.name.localeCompare(b.name)) // Sort by type or name - Asc order
    .map(cls => generateTypeScriptClass(cls, namingConvension))
    .join('\n\n');

  const header = generateFileHeader();
  const fullContent = `${header}\n\n${content}\n`;

  const fileName = 'types.ts';
  const filePath = path.join(outputPath, fileName);

  fs.writeFileSync(filePath, fullContent, 'utf-8');
  console.log(chalk.whiteBright(` - Generated:`), chalk.blue(filePath));
}







/**
 * Generate multiple files - one TypeScript file per C# source file.
 * This preserves the original grouping of classes
 */
function generateMultipleFiles(
  outputPath: string,
  config: TypeSharpConfig,
  parseResults: ParseResult[]
): void {
  // Convention output type
  const dirConvention = typeof config.namingConvention === 'string' ? config.namingConvention : config.namingConvention?.dir ?? 'snake';
  const fileConvention = typeof config.namingConvention === 'string' ? config.namingConvention : config.namingConvention?.file ?? 'camel';

  // Build a map of class names to their file paths for import resolution
  const classToFileMap = buildClassToFileMap(parseResults, config, outputPath, fileConvention);


  // Sort results by path - Asc order
  const parseResultsSorted = parseResults.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  for (const result of parseResultsSorted) {
    // Generate content for all classes in this C# file
    const content = result.classes
      .map(cls => generateTypeScriptClass(cls, fileConvention))
      .join('\n\n');

    // Preserve folder structure
    const relativeDir = path.dirname(result.relativePath);
    const appDir = path.join(outputPath, relativeDir);

    // Convert dir with configued conventions
    const targetDir = convertDirName(appDir, dirConvention);

    // Create directory if needed
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Get the original C# filename without extension
    const originalFileName = path.basename(result.relativePath, '.cs');

    // Apply file suffix if configured
    let baseName = originalFileName;
    if (config.fileSuffix) {
      // Capitalize the 1st character for better convention
      const suffix = config.fileSuffix.charAt(0).toUpperCase() + config.fileSuffix.slice(1);
      baseName = `${baseName}${suffix}`;
    }

    // Apply naming convention to the filename
    const fileName = convertFileName(baseName, fileConvention);
    const filePath = path.join(targetDir, `${fileName}.ts`);

    // Generate imports for this file
    const currentClassNames = result.classes.map(c => c.name);
    const imports = generateImports(result.classes, classToFileMap, filePath, currentClassNames, dirConvention);
    const header = generateFileHeader();
    const fullContent = imports
      ? `${imports}\n\n${header}\n\n${content}\n`
      : `${header}\n\n${content}\n`;

    fs.writeFileSync(filePath, fullContent, 'utf-8');
    console.log(chalk.blue(` ↳`), chalk.blue(filePath));
  }
}












/**
 * Build a map of class names to their output file paths
 */
function buildClassToFileMap(
  parseResults: ParseResult[],
  config: TypeSharpConfig,
  outputPath: string,
  namingConvension: NamingConvention
): Map<string, string> {
  const map = new Map<string, string>();
  for (const result of parseResults) {
    const relativeDir = path.dirname(result.relativePath);
    const targetDir = path.join(outputPath, relativeDir);

    const originalFileName = path.basename(result.relativePath, '.cs');

    let baseName = originalFileName;
    if (config.fileSuffix) {
      const suffix = convertFileName(config.fileSuffix, namingConvension);
      baseName = `${baseName}-${suffix}`;
    }

    const fileName = convertFileName(baseName, namingConvension);
    const filePath = path.join(targetDir, `${fileName}.ts`);

    // Map all classes in this file to this file path
    for (const cls of result.classes) {
      map.set(cls.name, filePath);
    }
  }

  return map;
}




/**
 * Generate import statements for referenced types
 */
function generateImports(
  classes: CSharpClass[],
  classToFileMap: Map<string, string>,
  currentFilePath: string,
  currentClassNames: string[],
  namingConvension: NamingConvention
): string {
  const imports = new Map<string, Set<string>>(); // filePath -> Set of class names

  for (const cls of classes) {
    // Skip enums as they don't have properties
    if (cls.isEnum) continue;

    // Check inheritance
    if (cls.inheritsFrom && !currentClassNames.includes(cls.inheritsFrom)) {
      const referencedFilePath = classToFileMap.get(cls.inheritsFrom);
      if (referencedFilePath && referencedFilePath !== currentFilePath) {
        if (!imports.has(referencedFilePath)) {
          imports.set(referencedFilePath, new Set());
        }
        imports.get(referencedFilePath)!.add(cls.inheritsFrom);
      }
    }

    // Check property types
    for (const prop of cls.properties) {
      // Extract base type (remove array brackets and nullable)
      let referencedType = prop.type;

      // Skip primitive types
      if (isPrimitiveType(referencedType)) continue;

      // Skip if it's in the same file
      if (currentClassNames.includes(referencedType)) continue;

      const referencedFilePath = classToFileMap.get(referencedType);
      if (referencedFilePath && referencedFilePath !== currentFilePath) {
        if (!imports.has(referencedFilePath)) {
          imports.set(referencedFilePath, new Set());
        }
        imports.get(referencedFilePath)!.add(referencedType);
      }
    }
  }

  // Generate import statements
  const importStatements: string[] = [];
  for (const [filePath, classNames] of imports.entries()) {
    const relativePath = getRelativeImportPath(currentFilePath, filePath, namingConvension);
    const sortedNames = Array.from(classNames).sort();
    importStatements.push(`import type { ${sortedNames.join(', ')} } from '${relativePath}';`);
  }

  return importStatements.length > 0 ? importStatements.join('\n') : '';
}





/**
 * Get relative import path from one file to another
 */
function getRelativeImportPath(fromFile: string, toFile: string, namingConvension: NamingConvention): string {
  const fromDir = path.dirname(fromFile);
  let relativePath = path.relative(fromDir, toFile);
  // Remove .ts extension
  relativePath = relativePath.replace(/\.ts$/, '');

  // Ensure it starts with ./ or ../
  if (!relativePath.startsWith('.')) {
    relativePath = './' + relativePath;
  }

  // Convert dir naming
  relativePath = convertDirName(relativePath, namingConvension);

  // Convert Windows backslashes to forward slashes
  relativePath = relativePath.replace(/\\/g, '/');

  return relativePath;
}





/**
 * Check if a type is a primitive TypeScript type
 */
function isPrimitiveType(type: string): boolean {
  const primitives = ['string', 'number', 'boolean', 'any', 'void', 'null', 'undefined'];
  return primitives.includes(type);
}





/**
 * Generate TypeScript interface or enum from C# class
 */
function generateTypeScriptClass(cls: CSharpClass, namingConvension: NamingConvention): string {
  if (cls.isEnum) {
    return generateEnum(cls);
  }

  return generateInterface(cls);
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
function generateInterface(cls: CSharpClass): string {

  const properties = cls.properties
    .map(prop => generateProperty(prop))
    .join('\n');

  // Build generic parameters for the interface
  const genericParams = cls.genericParameters && cls.genericParameters.length > 0
    ? `<${cls.genericParameters.join(', ')}>`
    : '';

  // Build extends clause with generics
  let extendsClause = '';
  if (cls.inheritsFrom) {
    const baseGenerics = cls.baseClassGenerics && cls.baseClassGenerics.length > 0
      ? `<${cls.baseClassGenerics.join(', ')}>`
      : '';
    extendsClause = ` extends ${cls.inheritsFrom}${baseGenerics}`;
  }

  return `export interface ${cls.name}${genericParams}${extendsClause} {\n${properties}\n}`;
}





/**
 * Generate a single property
 */
function generateProperty(prop: CSharpProperty): string {
  const propertyName = convertPropertyName(prop.name);
  let type = prop.type;

  // Handle arrays: append [] only when prop.isArray is true and the type does not already look like a Record or an array
  const alreadyArrayLike = /\[\]$/.test(type);
  const isRecordType = /^Record<.*>$/.test(type);

  if (prop.isArray && !isRecordType && !alreadyArrayLike) {
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
function convertPropertyName(name: string): string {
  return toCamelCase(name);
  // switch (convention) {
  //   case 'camel':
  //     return toCamelCase(name);
  //   case 'pascal':
  //     return toPascalCase(name);
  //   case 'snake':
  //     return toSnakeCase(name);
  //   default:
  //     return name;
  // }
}






/**
 * Convert file name to specified convention
 */
function convertFileName(name: string, convention: NamingConvention): string {
  switch (convention) {
    case 'camel':
      return toCamelCase(name);
    case 'kebab':
      return toKebabCase(name);
    case 'pascal':
      return toPascalCase(name);
    case 'snake':
      return toSnakeCase(name);
    default:
      return name;
  }
}




const convertDirName = (dir: string, convension: NamingConvention) => {
  try {
    const splitter = path.sep;
    const segments = dir.split(splitter);
    const formatted = segments.map((segment) => {
      return convertFileName(segment, convension)
    });
    const joined = formatted.join(splitter);
    return joined;
  } catch (error) {
    console.error('Error converting dir name', error);
    throw error;
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
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .toLowerCase();
}





/**
 * Convert string to kebab-case
 */
function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase();
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
