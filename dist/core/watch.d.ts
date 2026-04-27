/**
 * Start TypeSharp in watch mode.
 * Runs an initial generation (respecting the incremental flag),
 * then watches the entire project for any file change and re-runs
 * incremental generation on each detected save.
 *
 * Note: fs.watch recursive mode requires Node >= 20 on Windows/macOS.
 * Linux support requires Node >= 22.
 */
export declare function startWatch(configPath: string | undefined, incremental: boolean): Promise<void>;
//# sourceMappingURL=watch.d.ts.map