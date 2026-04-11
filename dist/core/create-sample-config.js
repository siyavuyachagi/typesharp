import * as fs from 'fs';
import chalk from "chalk";
/**
 * Create a sample configuration file
 */
export const createSampleConfig = (format) => {
    const sampleConfig = {
        source: [
            'C:/Users/User/Desktop/MyApp/MyApp.sln',
        ],
        outputPath: './app/types',
        targetAnnotation: 'TypeSharp',
        singleOutputFile: false,
        namingConvention: 'camel',
        fileSuffix: ''
    };
    let fileName;
    let content;
    if (format === 'json') {
        fileName = 'typesharp.config.json';
        content = JSON.stringify(sampleConfig, null, 2);
    }
    else if (format === 'js') {
        fileName = 'typesharp.config.js';
        content = `module.exports = ${formatAsJsObject(sampleConfig)};\n`;
    }
    else {
        fileName = 'typesharp.config.ts';
        let namespace = '@siyavuyachagi/typesharp';
        content = [
            `import type { TypeSharpConfig } from '${namespace}';`,
            ``,
            `const config: TypeSharpConfig = ${formatAsJsObject(sampleConfig)};`,
            ``,
            `export default config;`,
            ``
        ].join('\n');
    }
    const allConfigFiles = ['typesharp.config.ts', 'typesharp.config.js', 'typesharp.config.json'];
    const existingConfig = allConfigFiles.find(f => fs.existsSync(f));
    if (existingConfig) {
        console.log(chalk.yellow.bold('❗ Warning:'), chalk.white(`${existingConfig} already exists. Skipping creation.`));
        return;
    }
    fs.writeFileSync(fileName, content, 'utf-8');
    console.log(chalk.green.bold('✅ Created'), chalk.white(`./${fileName}`));
};
/**
 * Format a plain object as a JS/TS object literal (no quoted keys)
 */
const formatAsJsObject = (obj, indent = 0) => {
    const pad = ' '.repeat(indent + 2);
    const closePad = ' '.repeat(indent);
    const lines = Object.entries(obj).map(([key, value]) => {
        let formatted;
        if (Array.isArray(value)) {
            const items = value.map(v => `${pad}  ${JSON.stringify(v)}`).join(',\n');
            formatted = `[\n${items}\n${pad}]`;
        }
        else if (typeof value === 'object' && value !== null) {
            formatted = formatAsJsObject(value, indent + 2);
        }
        else {
            formatted = JSON.stringify(value);
        }
        return `${pad}${key}: ${formatted}`;
    });
    return `{\n${lines.join(',\n')}\n${closePad}}`;
};
//# sourceMappingURL=create-sample-config.js.map