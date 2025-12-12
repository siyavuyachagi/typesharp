#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const core_1 = require("../core");
const program = new commander_1.Command();
program
    .name('typesharp')
    .description('Generate TypeScript types from C# models with TypeSharp attribute')
    .version('1.0.0')
    .usage('[command] [options]');
// Generate command (default)
program
    .command('generate', { isDefault: true })
    .description('Generate TypeScript types from C# files')
    .option('-c, --config <path>', 'Path to configuration file')
    .action(async (options) => {
    try {
        await (0, core_1.generate)(options.config);
        process.exit(0);
    }
    catch (error) {
        process.exit(1);
    }
});
// Init command
program
    .command('init')
    .description('Create a sample configuration file')
    .option('-f, --format <format>', 'Configuration file format (ts, js, json)', 'json') // default to 'json'
    .action((options) => {
    try {
        const format = options.format;
        if (!['ts', 'js', 'json'].includes(format)) {
            console.error('❌ Invalid format. Use: ts, js, or json');
            process.exit(1);
        }
        (0, core_1.createSampleConfig)(format);
        process.exit(0);
    }
    catch (error) {
        if (error instanceof Error) {
            console.error(`❌ Error: ${error.message}`);
        }
        process.exit(1);
    }
});
program.parse();
//# sourceMappingURL=index.js.map