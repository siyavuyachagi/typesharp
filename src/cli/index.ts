#!/usr/bin/env node

import { Command } from 'commander';
import { generate, createSampleConfig } from '../core';

const program = new Command();

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
  .option('-f, --format <format>', 'Configuration file format (ts, js, json)', 'json') // default to 'json'
  .action((options) => {
    try {
      const format = options.format as 'ts' | 'js' | 'json';
      
      if (!['ts', 'js', 'json'].includes(format)) {
        console.error('❌ Invalid format. Use: ts, js, or json');
        process.exit(1);
      }
      
      createSampleConfig(format);
      process.exit(0);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`❌ Error: ${error.message}`);
      }
      process.exit(1);
    }
  });

program.parse();