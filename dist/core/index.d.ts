import { TypeSharpConfig } from '../types/typesharp-config';
export declare function generate(configPath?: string): Promise<void>;
/**
 * Load configuration from file or use provided config
 */
export declare function loadConfig(configPath?: string): TypeSharpConfig;
/**
 * Create a sample configuration file
 */
export declare function createSampleConfig(format?: 'ts' | 'js' | 'json'): void;
//# sourceMappingURL=index.d.ts.map