import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { resolveProjectFilesFromSource } from './resolve-project-files-from-source';
import { parseClassesFromFile } from './parse-classes-from-file';
/**
 * Parse C# files in the target project(s)
 */
export async function parseCSharpFiles(config) {
    const targetAnnotation = config.targetAnnotation ?? 'TypeSharp';
    // Convert single project to array for unified handling
    const projectFiles = resolveProjectFilesFromSource(config.source);
    const allResults = [];
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
//# sourceMappingURL=index.js.map