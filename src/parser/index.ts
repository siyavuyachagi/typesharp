import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { CSharpClass, CSharpProperty, ParseResult, TypeSharpConfig } from '../types';





/**
 * Parse C# files in the target project
 */
export async function parseCSharpFiles(config: TypeSharpConfig): Promise<ParseResult[]> {
  const projectDir = path.dirname(config.projectFile); // get folder containing the .csproj
  const targetAnnotation = config.targetAnnotation ?? 'TypeSharp';

  const csFiles = await glob('**/*.cs', {
    cwd: projectDir,
    absolute: true,
    ignore: ['**/bin/**', '**/obj/**', '**/node_modules/**']
  });

  const results: ParseResult[] = [];

  for (const filePath of csFiles) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const classes = parseClassesFromFile(content, targetAnnotation);

    if (classes.length > 0) {
      // store relative path for preserving folder structure later
      const relativePath = path.relative(projectDir, filePath);
      results.push({ classes, filePath, relativePath });
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
    
    // Parse as class with full generic support
    // Matches: public class ClassName<T, U> : BaseClass<T>
    const classMatch = afterAnnotation.match(
      /\[[\w]+\]\s*public\s+class\s+(\w+)(?:<([^>]+)>)?(?:\s*:\s*(\w+)(?:<([^>]+)>)?)?/
    );
    
    if (classMatch) {
      const className = classMatch[1]!;
      const genericParams = classMatch[2]; // e.g., "T" or "T, U"
      const inheritsFrom = classMatch[3];
      const baseGenerics = classMatch[4]; // e.g., "T" or "T, U"
      
      const classBody = extractClassBody(afterAnnotation);
      
      if (classBody) {
        const properties = parseProperties(classBody);
        
        // Parse generic parameters
        const genericParameters = genericParams
          ? genericParams.split(',').map(p => p.trim())
          : undefined;
        
        const baseClassGenerics = baseGenerics
          ? baseGenerics.split(',').map(p => p.trim())
          : undefined;
        
        classes.push({
          name: className,
          properties,
          inheritsFrom,
          isEnum: false,
          genericParameters,
          baseClassGenerics
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
  
  // Match property declarations with get/set
  const propertyRegex = /public\s+([\w<>[\]?]+)\s+(\w+)\s*\{\s*get;\s*set;\s*\}/g;
  let match;
  
  while ((match = propertyRegex.exec(classBody)) !== null) {
    const type = match[1]!;
    const name = match[2]!;
    
    properties.push(parsePropertyType(name, type));
  }
  
  // Also match computed/expression-bodied properties (with =>)
  // These are read-only, so we'll skip them for now since they don't have set;
  // If you want to include them, uncomment below:
  /*
  const computedPropertyRegex = /public\s+([\w<>[\]?]+)\s+(\w+)\s*=>/g;
  while ((match = computedPropertyRegex.exec(classBody)) !== null) {
    const type = match[1]!;
    const name = match[2]!;
    
    properties.push(parsePropertyType(name, type));
  }
  */
  
  return properties;
}










// /**
//  * Parse C# type to extract type information
//  */
// function parsePropertyType(name: string, csType: string): CSharpProperty {
//   let type = csType.trim();
//   let isNullable = false;
//   let isArray = false;
//   let isGeneric = false;
//   let genericType: string | undefined;
  
//   // Check for nullable
//   if (type.endsWith('?')) {
//     isNullable = true;
//     type = type.slice(0, -1);
//   }
  
//   // Check for array
//   if (type.endsWith('[]')) {
//     isArray = true;
//     type = type.slice(0, -2);
//   }
  
//   // Check for List<T>
//   const listMatch = type.match(/^List<(.+)>$/);
//   if (listMatch) {
//     isArray = true;
//     isGeneric = true;
//     genericType = listMatch[1];
//     type = genericType!;
//   }
  
//   // Check for IEnumerable<T>, ICollection<T>
//   const collectionMatch = type.match(/^(?:IEnumerable|ICollection|IList)<(.+)>$/);
//   if (collectionMatch) {
//     isArray = true;
//     isGeneric = true;
//     genericType = collectionMatch[1];
//     type = genericType!;
//   }
  
//   // Check for Dictionary<TKey, TValue>
//   const dictMatch = type.match(/^Dictionary<(.+),\s*(.+)>$/);
//   if (dictMatch) {
//     const keyType = mapCSharpTypeToTypeScript(dictMatch[1]!.trim());
//     const valueType = mapCSharpTypeToTypeScript(dictMatch[2]!.trim());
    
//     // Handle nested types like Dictionary<string, List<string>>
//     let finalValueType = valueType;
    
//     // Check if value type is a List
//     const valueListMatch = dictMatch[2]!.trim().match(/^List<(.+)>$/);
//     if (valueListMatch) {
//       const innerType = mapCSharpTypeToTypeScript(valueListMatch[1]!.trim());
//       finalValueType = `${innerType}[]`;
//     }
    
//     type = `Record<${keyType}, ${finalValueType}>`;
//     isGeneric = false; // It's already converted to TypeScript Record
//   }

//   // Convert C# types to TypeScript types
//   type = mapCSharpTypeToTypeScript(type);
  
//   return {
//     name,
//     type,
//     isNullable,
//     isArray,
//     isGeneric,
//     genericType
//   };
// }
/**
 * Parse C# type to extract type information
 *
 * This uses a small recursive resolver to support nested generics such as:
 * - List<T>
 * - T[]
 * - Dictionary<TKey, TValue> (and IDictionary/IReadOnlyDictionary)
 * The resolver returns a TypeScript type string and whether the original C# type
 * should be considered an array (so the generator can append `[]` appropriately).
 */
function parsePropertyType(name: string, csType: string): CSharpProperty {
  let raw = csType.trim();
  let isNullable = false;

  // Extract nullable marker (T?)
  if (raw.endsWith('?')) {
    isNullable = true;
    raw = raw.slice(0, -1).trim();
  }

  // Recursive resolver: returns { tsType, isArray }
  function resolveType(typeText: string): { tsType: string; isArray: boolean } {
    const t = typeText.trim();

    // 1) Array syntax: T[]
    if (t.endsWith('[]')) {
      const inner = t.slice(0, -2).trim();
      const resolved = resolveType(inner);
      // If inner is already an array, keep it as array-of-array semantics;
      // mark as array so generator will append [] (or use resolved.tsType which may include [] already)
      return { tsType: resolved.tsType, isArray: true };
    }

    // 2) Dictionary-like types (handle Dictionary, IDictionary, IReadOnlyDictionary)
    const dictMatch = t.match(
      /^(?:Dictionary|IDictionary|IReadOnlyDictionary)\s*<\s*([^,>]+)\s*,\s*([^>]+)\s*>$/
    );
    if (dictMatch) {
      const keyCs = dictMatch[1]!.trim();
      const valueCs = dictMatch[2]!.trim();

      const resolvedKey = resolveType(keyCs);
      const resolvedValue = resolveType(valueCs);

      // Key must be a valid TS key type; we just use the mapped ts type.
      // If value is array, ensure it's represented correctly (e.g., string[])
      const valueType = resolvedValue.isArray ? `${resolvedValue.tsType}[]` : resolvedValue.tsType;

      return { tsType: `Record<${resolvedKey.tsType}, ${valueType}>`, isArray: false };
    }

    // 3) Collections: List<T>, IEnumerable<T>, ICollection<T>, IList<T>
    const collectionMatch = t.match(/^(?:List|IEnumerable|ICollection|IList)\s*<\s*(.+)\s*>$/);
    if (collectionMatch) {
      const inner = collectionMatch[1]!.trim();
      const resolvedInner = resolveType(inner);
      // Collections become inner[] in TS; mark isArray true and tsType = resolvedInner.tsType
      // The generator will append [].
      return { tsType: resolvedInner.tsType, isArray: true };
    }

    // 4) Fallback: map primitive / known types, else return as-is (class name)
    return { tsType: mapCSharpTypeToTypeScript(t), isArray: false };
  }

  const resolved = resolveType(raw);

  return {
    name,
    type: resolved.tsType,
    isNullable,
    isArray: resolved.isArray,
    isGeneric: false,
    genericType: undefined
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