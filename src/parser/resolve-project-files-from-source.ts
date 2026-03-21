import * as fs from 'fs';
import * as path from 'path';

/**
 * Resolves a list of `.csproj` file paths from one or more source entries.
 *
 * Supported source types:
 * - `.csproj` — used directly
 * - `.sln`    — parsed using regex to extract referenced `.csproj` paths
 * - `.slnx`   — parsed as XML to extract `<Project Path="..." />` entries
 *
 * @param source - A single path or array of paths to `.csproj`, `.sln`, or `.slnx` files
 * @returns A flat array of resolved absolute `.csproj` file paths
 * @throws If a source file type is not `.csproj`, `.sln`, or `.slnx`
 *
 * @example
 * // Single solution file
 * resolveProjectFilesFromSource('C:/MyApp/MyApp.sln');
 *
 * @example
 * // XML solution file
 * resolveProjectFilesFromSource('C:/MyApp/MyApp.slnx');
 *
 * @example
 * // Mixed sources
 * resolveProjectFilesFromSource([
 *   'C:/MyApp/MyApp.slnx',
 *   'C:/Other/Other.csproj'
 * ]);
 */
export function resolveProjectFilesFromSource(source: string | string[]): string[] {
    const sources = Array.isArray(source) ? source : [source];
    const csprojFiles: string[] = [];

    for (const s of sources) {
        if (s.endsWith('.sln')) {
            const content = fs.readFileSync(s, 'utf-8');
            const slnDir = path.dirname(s);
            const matches = [...content.matchAll(/"([^"]+\.csproj)"/g)];
            for (const match of matches) {
                const relPath = match[1]!.replace(/\\/g, path.sep);
                csprojFiles.push(path.resolve(slnDir, relPath));
            }
        } else if (s.endsWith('.slnx')) {
            const content = fs.readFileSync(s, 'utf-8');
            const slnDir = path.dirname(s);
            const matches = [...content.matchAll(/<Project\s+Path="([^"]+\.csproj)"\s*\/>/g)];
            for (const match of matches) {
                const relPath = match[1]!.replace(/\\/g, path.sep);
                csprojFiles.push(path.resolve(slnDir, relPath));
            }
        } else if (s.endsWith('.csproj')) {
            csprojFiles.push(s);
        } else {
            throw new Error(`Unsupported source file type: "${path.basename(s)}". Expected .csproj, .sln, or .slnx`);
        }
    }

    console.log('csproj files', csprojFiles)
    return csprojFiles;
}