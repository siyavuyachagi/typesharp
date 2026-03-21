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
exports.parseCSharpFiles = parseCSharpFiles;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const glob_1 = require("glob");
const resolve_project_files_from_source_1 = require("./resolve-project-files-from-source");
const parse_classes_from_file_1 = require("./parse-classes-from-file");
/**
 * Parse C# files in the target project(s)
 */
async function parseCSharpFiles(config) {
    const targetAnnotation = config.targetAnnotation ?? 'TypeSharp';
    // Convert single project to array for unified handling
    const projectFiles = (0, resolve_project_files_from_source_1.resolveProjectFilesFromSource)(config.source);
    const allResults = [];
    // Process each project
    for (const projectFile of projectFiles) {
        const projectDir = path.dirname(projectFile);
        const csFiles = await (0, glob_1.glob)('**/*.cs', {
            cwd: projectDir,
            absolute: true,
            ignore: ['**/bin/**', '**/obj/**', '**/node_modules/**']
        });
        for (const filePath of csFiles) {
            const content = fs.readFileSync(filePath, 'utf-8');
            const classes = (0, parse_classes_from_file_1.parseClassesFromFile)(content, targetAnnotation);
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