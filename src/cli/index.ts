#!/usr/bin/env node

import { Command } from 'commander';
import { generate, createSampleConfig } from '../core';
import chalk from 'chalk';
import { version, name, description } from '../../package.json';
const program = new Command();

program
  .name(name)
  .description(description)
  .version(version)
  .usage('[command] [options]');

// Generate command (default)
program
  .command('generate', { isDefault: true })
  .description('Generate TypeScript types from C# files')
  .option('-c, --config <path>', 'Path to configuration file')
  .action(async (options) => {
    try {
      await generate(options.config);
      process.exit(0);
    } catch (error) {
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

program.parse();