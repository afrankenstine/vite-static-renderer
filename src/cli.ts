import { program } from 'commander';
import chalk from 'chalk';
import { spawn } from 'child_process';
import { StaticGenerator } from './generator.js';
import { ConfigManager } from './config.js';
import {access, readFile, writeFile} from "fs/promises";
import {resolve} from "path";

async function runBuild(command: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const [cmd, ...args] = command.split(' ');
        const build = spawn(cmd, args, {
            stdio: 'inherit',
            shell: true
        });

        build.on('exit', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Build failed with exit code ${code}`));
            }
        });
    });
}

program
    .name('vite-static')
    .description('Generate static sites with Vite and modern browsers')
    .version('1.0.0');

program
    .command('generate')
    .alias('gen')
    .description('Generate static pages')
    .option('-c, --config <path>', 'Configuration file path')
    .option('--inputDir <dir>', 'Input directory (built app) - overrides config')
    .option('--outputDir <dir>', 'Output directory for static files - overrides config')
    .option('--verbose', 'Verbose logging')
    .action(async (options) => {
        try {
            console.log(chalk.blue('🚀 Starting static generation...'));

            // Load configuration first
            const configManager = await ConfigManager.fromFile(options.config);

            // Apply only essential CLI overrides (directory paths only)
            const overrides: any = {};
            if (options.inputDir) overrides.inputDir = options.inputDir;
            if (options.outputDir) overrides.outputDir = options.outputDir;

            if (Object.keys(overrides).length > 0) {
                configManager.update(overrides);
            }

            const config = configManager.get();

            // Run build if configured (no CLI override needed)
            if (!config.skipBuild) {
                console.log(chalk.yellow(`🏗️  Running: ${config.buildCommand}`));
                await runBuild(config.buildCommand);
            }

            // Generate static files
            const generator = new StaticGenerator(config);
            const stats = await generator.generate();

            console.log(chalk.green('\n✅ Generation complete!'));
            console.log(`   📄 Pages: ${chalk.bold(stats.success)}/${stats.total}`);
            console.log(`   ⏱️  Time: ${chalk.bold(stats.duration)}ms`);
            console.log(`   📁 Output: ${chalk.bold(config.outputDir)}`);

            if (stats.failed > 0) {
                console.log(chalk.red(`   ❌ Failed: ${stats.failed}`));
                process.exit(1);
            }
        } catch (error) {
            console.error(chalk.red('❌ Generation failed:'), error);
            process.exit(1);
        }
    });

program
    .command('init')
    .description('Initialize vite-static.config.js configuration file')
    .option('-f, --force', 'Overwrite existing configuration file')
    .action(async (options) => {
        try {
            const configPath = resolve(process.cwd(), 'vite-static.config.js');
            const templatePath = resolve(new URL(import.meta.url).pathname, '../../templates/vite-static.config.js');

            // Check if config already exists
            try {
                await access(configPath);
                if (!options.force) {
                    console.log(chalk.yellow('⚠️  Configuration file already exists!'));
                    console.log(chalk.gray('   Use --force to overwrite'));
                    process.exit(1);
                }
            } catch {
                // File doesn't exist, continue
            }

            // Copy template to project directory
            const templateContent = await readFile(templatePath, 'utf-8');
            await writeFile(configPath, templateContent, 'utf-8');

            console.log(chalk.green('✅ Configuration file created!'));
            console.log(`   📄 File: ${chalk.bold('vite-static.config.js')}`);
            console.log(chalk.gray('   Edit the file to customize your static generation settings.'));

        } catch (error) {
            console.error(chalk.red('❌ Failed to create configuration file:'), error);
            process.exit(1);
        }
    });

program.parse();
