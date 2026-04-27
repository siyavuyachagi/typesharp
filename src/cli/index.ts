#!/usr/bin/env node

import { Command } from 'commander';
import { generate } from '../core/index.js';
import chalk from 'chalk';
import pkg from '../../package.json' with { type: 'json' };
import { createSampleConfig } from '../core/create-sample-config.js';
import { startWatch } from '../core/watch.js';

const { version, name, description } = pkg;
const program = new Command();

program
  .name(name)
  .description(description)
  .version(version)
  .usage('[command] [options]');

// Init command
program
  .command('init')
  .description('Create a sample configuration file')
  .option('-f, --format <format>', 'Configuration file format (ts, js, json)', 'ts') // default to 'ts'
  .action((options) => {
    try {
      const format = options.format as 'ts' | 'js' | 'json';

      if (!['ts', 'js', 'json'].includes(format)) {
        console.error(chalk.red.bold('❌ Invalid format.') + ' Use: ' + chalk.yellow('json, ts, ') + 'or' + chalk.yellow(' js'));
        process.exit(1);
      }

      createSampleConfig(format);

      process.exit(0);
    } catch (error) {
      if (error instanceof Error) {
        console.error(chalk.red.bold(`❌ Error:`), chalk.white(error.message));
      }
      process.exit(1);
    }
  });

// Generate command (default)
program
  .command('generate', { isDefault: true })
  .description('Generate TypeScript types from C# files')
  .option('-c, --config <path>', 'Path to configuration file')
  .option('--no-incremental', 'Disable incremental generation (full clean)')
  .option('-w, --watch', 'Watch for file changes and re-run generation')
  .action(async (options) => {
    try {
      const incremental = options.incremental !== false;

      if (options.watch) {
        await startWatch(options.config, incremental);
      } else {
        await generate(options.config, incremental);
      }

      process.exit(0);
    } catch (error) {
      process.exit(1);
    }
  });


program.parse();