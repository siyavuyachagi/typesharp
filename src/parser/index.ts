import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { CSharpClass, CSharpProperty, ParseResult } from '../types';
import { TypeSharpConfig } from '../types/typesharp-config';
import { resolveProjectFilesFromSource } from './resolve-project-files-from-source';
import { parseProperties } from './parse-properties';





/**
 * Parse C# files in the target project(s)
 */
export async function parseCSharpFiles(config: TypeSharpConfig): Promise<ParseResult[]> {
  const targetAnnotation = config.targetAnnotation ?? 'TypeSharp';

  // Convert single project to array for unified handling
  const projectFiles = resolveProjectFilesFromSource(config.source!);

  const allResults: ParseResult[] = [];

  // Process each project
  for (const projectFile of projectFiles) {
    const projectDir = path.dirname(projectFile);

    const csFiles = await glob('**/*.cs', {
      cwd: projectDir,
      absolute: true,
      ignore: ['**/bin/**', '**/obj/**', '**/node_modules/**']
    });

    for (const filePath of csFiles) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const classes = parseClassesFromFile(content, targetAnnotation);

      if (classes.length > 0) {
        // Store relative path for preserving folder structure later
        const relativePath = path.relative(projectDir, filePath);
        allResults.push({ classes, filePath, relativePath });
      }
    }
  }

  return allResults;
}







/**
 * Parse classes from a C# file content
 */
function parseClassesFromFile(content: string, targetAnnotation: string): CSharpClass[] {
  const classes: CSharpClass[] = [];

  // Remove comments
  const cleanContent = removeComments(content);

  // Find all classes/enums with the target annotation
  const annotationRegex = new RegExp(
    `\\[${targetAnnotation}(?:Attribute)?(?:\\(\\s*"([^"]*)"\\s*\\))?\\]`,
    'g'
  );

  const matches = [...cleanContent.matchAll(annotationRegex)];

  for (const match of matches) {
    const startIndex = match.index!;
    const afterAnnotation = cleanContent.substring(startIndex);

    // Check if it's an enum
    const enumMatch = afterAnnotation.match(
      /(?:\[[\w]+(?:\([^)]*\))?\]\s*)*public\s+enum\s+(\w+)/
    );

    if (enumMatch) {
      const typeNameOverride = match[1] ?? undefined;
      const enumClass = parseEnum(afterAnnotation, typeNameOverride ?? enumMatch[1]!);
      if (enumClass) classes.push(enumClass);
      continue;
    }

    // Parse as class with full generic support
    // Matches: public class ClassName<T, U> : BaseClass<T>
    // Now supports multiple stacked attributes before the class declaration
    const classMatch = afterAnnotation.match(
      /(?:\[[\w]+(?:\([^)]*\))?\]\s*)*public\s+class\s+(\w+)(?:<([^>]+)>)?(?:\s*:\s*(\w+)(?:<([^>]+)>)?)?/
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

        const typeNameOverride = match[1] ?? undefined;
        classes.push({
          name: typeNameOverride ?? className,
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
 * Remove single-line and multi-line comments
 */
function removeComments(content: string): string {
  // Remove multi-line comments
  let result = content.replace(/\/\*[\s\S]*?\*\//g, '');

  // Remove single-line comments
  result = result.replace(/\/\/.*/g, '');

  return result;
}