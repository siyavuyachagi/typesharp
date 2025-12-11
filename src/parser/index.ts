import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { CSharpClass, CSharpProperty, ParseResult } from '../types';

/**
 * Parse C# files in the target directory
 */
export async function parseCSharpFiles(
  targetPath: string,
  targetAnnotation: string = 'TypeSharp'
): Promise<ParseResult[]> {
  const csFiles = await glob('**/*.cs', {
    cwd: targetPath,
    absolute: true,
    ignore: ['**/bin/**', '**/obj/**', '**/node_modules/**']
  });

  const results: ParseResult[] = [];

  for (const filePath of csFiles) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const classes = parseClassesFromFile(content, targetAnnotation);
    
    if (classes.length > 0) {
      results.push({ classes, filePath });
    }
  }

  return results;
}

/**
 * Parse classes from a C# file content
 */
function parseClassesFromFile(content: string, targetAnnotation: string): CSharpClass[] {
  const classes: CSharpClass[] = [];
  
  // Remove comments
  const cleanContent = removeComments(content);
  
  // Find all classes/enums with the target annotation
  const annotationRegex = new RegExp(`\\[${targetAnnotation}\\]`, 'g');
  const matches = [...cleanContent.matchAll(annotationRegex)];
  
  for (const match of matches) {
    const startIndex = match.index!;
    const afterAnnotation = cleanContent.substring(startIndex);
    
    // Check if it's an enum
    const enumMatch = afterAnnotation.match(/\[[\w]+\]\s*public\s+enum\s+(\w+)/);
    if (enumMatch) {
      const enumClass = parseEnum(afterAnnotation, enumMatch[1]!);
      if (enumClass) classes.push(enumClass);
      continue;
    }
    
    // Otherwise parse as class
    const classMatch = afterAnnotation.match(/\[[\w]+\]\s*public\s+class\s+(\w+)(?:\s*:\s*(\w+))?/);
    if (classMatch) {
      const className = classMatch[1]!;
      const inheritsFrom = classMatch[2];
      const classBody = extractClassBody(afterAnnotation);
      
      if (classBody) {
        const properties = parseProperties(classBody);
        classes.push({
          name: className,
          properties,
          inheritsFrom,
          isEnum: false
        });
      }
    }
  }
  
  return classes;
}

/**
 * Parse enum from C# content
 */
function parseEnum(content: string, enumName: string): CSharpClass | null {
  const enumBodyMatch = content.match(/enum\s+\w+\s*\{([^}]+)\}/);
  if (!enumBodyMatch) return null;
  
  const enumBody = enumBodyMatch[1]!;
  const enumValues = enumBody
    .split(',')
    .map(v => v.trim())
    .filter(v => v.length > 0)
    .map(v => v.split('=')[0]!.trim()); // Remove value assignments
  
  return {
    name: enumName,
    properties: [],
    isEnum: true,
    enumValues
  };
}

/**
 * Extract class body between curly braces
 */
function extractClassBody(content: string): string | null {
  let braceCount = 0;
  let startIndex = -1;
  
  for (let i = 0; i < content.length; i++) {
    if (content[i] === '{') {
      if (braceCount === 0) startIndex = i;
      braceCount++;
    } else if (content[i] === '}') {
      braceCount--;
      if (braceCount === 0 && startIndex !== -1) {
        return content.substring(startIndex + 1, i);
      }
    }
  }
  
  return null;
}

/**
 * Parse properties from class body
 */
function parseProperties(classBody: string): CSharpProperty[] {
  const properties: CSharpProperty[] = [];
  
  // Match property declarations
  const propertyRegex = /public\s+([\w<>[\]?]+)\s+(\w+)\s*\{\s*get;\s*set;\s*\}/g;
  let match;
  
  while ((match = propertyRegex.exec(classBody)) !== null) {
    const type = match[1]!;
    const name = match[2]!;
    
    properties.push(parsePropertyType(name, type));
  }
  
  return properties;
}

/**
 * Parse C# type to extract type information
 */
function parsePropertyType(name: string, csType: string): CSharpProperty {
  let type = csType.trim();
  let isNullable = false;
  let isArray = false;
  let isGeneric = false;
  let genericType: string | undefined;
  
  // Check for nullable
  if (type.endsWith('?')) {
    isNullable = true;
    type = type.slice(0, -1);
  }
  
  // Check for array
  if (type.endsWith('[]')) {
    isArray = true;
    type = type.slice(0, -2);
  }
  
  // Check for List<T>
  const listMatch = type.match(/^List<(.+)>$/);
  if (listMatch) {
    isArray = true;
    isGeneric = true;
    genericType = listMatch[1];
    type = genericType!;
  }
  
  // Check for IEnumerable<T>, ICollection<T>
  const collectionMatch = type.match(/^(?:IEnumerable|ICollection|IList)<(.+)>$/);
  if (collectionMatch) {
    isArray = true;
    isGeneric = true;
    genericType = collectionMatch[1];
    type = genericType!;
  }
  
  // Convert C# types to TypeScript types
  type = mapCSharpTypeToTypeScript(type);
  
  return {
    name,
    type,
    isNullable,
    isArray,
    isGeneric,
    genericType
  };
}

/**
 * Map C# primitive types to TypeScript types
 */
function mapCSharpTypeToTypeScript(csType: string): string {
  const typeMap: Record<string, string> = {
    'string': 'string',
    'int': 'number',
    'long': 'number',
    'double': 'number',
    'float': 'number',
    'decimal': 'number',
    'bool': 'boolean',
    'DateTime': 'string',
    'DateOnly': 'string',
    'TimeOnly': 'string',
    'Guid': 'string',
    'object': 'any'
  };
  
  return typeMap[csType] || csType;
}

/**
 * Remove single-line and multi-line comments
 */
function removeComments(content: string): string {
  // Remove multi-line comments
  let result = content.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // Remove single-line comments
  result = result.replace(/\/\/.*/g, '');
  
  return result;
}