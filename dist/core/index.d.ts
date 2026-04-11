import { TypeSharpConfig } from '../types/typesharp-config.js';
/**
 * Merge user config with defaults
 */
export declare const mergeWithDefaults: (config: Partial<TypeSharpConfig>) => TypeSharpConfig;
export declare function generate(configPath?: string, incremental?: boolean): Promise<void>;
/**
 * Deletes all contents of a directory but keeps the directory itself.
 * @param dir Path to the directory to clean
 */
export declare function cleanOutputDirectory(dir: string): void;
/**
 * Load configuration from file or use provided config
 */
export declare function loadConfig(configPath?: string): Promise<TypeSharpConfig>;
//# sourceMappingURL=index.d.ts.map