/**
 * Load previous generation hashes
 */
export declare function loadPreviousHashes(): Map<string, string>;
/**
 * Save current hashes for next generation
 */
export declare function savePreviousHashes(hashes: Map<string, string>): void;
export declare function computeFileHash(filePath: string): string;
export declare function getChangedFiles(allCSharpFiles: string[], previousHashes: Map<string, string>): {
    changed: string[];
    deleted: string[];
};
//# sourceMappingURL=change-tracker.d.ts.map