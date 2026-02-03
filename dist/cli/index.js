#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const core_1 = require("../core");
const chalk_1 = __importDefault(require("chalk"));
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
    .option('-f, --format <format>', 'Configuration file format (ts, js, json)', 'ts') // default to 'ts'
    .action((options) => {
    try {
        const format = options.format;
        if (!['ts', 'js', 'json'].includes(format)) {
            console.error(chalk_1.default.red.bold('❌ Invalid format.') + ' Use: ' + chalk_1.default.yellow('json, ts, ') + 'or' + chalk_1.default.yellow(' js'));
            process.exit(1);
        }
        (0, core_1.createSampleConfig)(format);
        process.exit(0);
    }
    catch (error) {
        if (error instanceof Error) {
            console.error(chalk_1.default.red.bold(`❌ Error:`), chalk_1.default.white(error.message));
        }
        process.exit(1);
    }
});
program.parse();
//# sourceMappingURL=index.js.map