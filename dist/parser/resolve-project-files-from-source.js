"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveProjectFilesFromSource = resolveProjectFilesFromSource;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
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
function resolveProjectFilesFromSource(source) {
    const sources = Array.isArray(source) ? source : [source];
    const csprojFiles = [];
    for (const s of sources) {
        if (s.endsWith('.sln')) {
            const content = fs.readFileSync(s, 'utf-8');
            const slnDir = path.dirname(s);
            const matches = [...content.matchAll(/"([^"]+\.csproj)"/g)];
            for (const match of matches) {
                const relPath = match[1].replace(/\\/g, path.sep);
                csprojFiles.push(path.resolve(slnDir, relPath));
            }
        }
        else if (s.endsWith('.slnx')) {
            const content = fs.readFileSync(s, 'utf-8');
            const slnDir = path.dirname(s);
            const matches = [...content.matchAll(/<Project\s+Path="([^"]+\.csproj)"\s*\/>/g)];
            for (const match of matches) {
                const relPath = match[1].replace(/\\/g, path.sep);
                csprojFiles.push(path.resolve(slnDir, relPath));
            }
        }
        else if (s.endsWith('.csproj')) {
            csprojFiles.push(s);
        }
        else {
            throw new Error(`Unsupported source file type: "${path.basename(s)}". Expected .csproj, .sln, or .slnx`);
        }
    }
    console.log('csproj files', csprojFiles);
    return csprojFiles;
}
//# sourceMappingURL=resolve-project-files-from-source.js.map