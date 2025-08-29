import { mkdir, writeFile, cp, rm } from 'fs/promises';
import { dirname, join, resolve } from 'path';
import { glob } from 'glob';
import { StaticServer } from './server.js';
import { BrowserRenderer } from './renderer.js';
import type { RenderConfig, RenderStats } from './types.js';
import { ConfigManager } from './config.js';

export class StaticGenerator {
    private config: Required<RenderConfig>;
    private configManager: ConfigManager;

    constructor(config: RenderConfig = {}) {
        this.configManager = new ConfigManager(config);
        this.config = this.configManager.get();
    }

    async generate(): Promise<RenderStats> {
        const startTime = Date.now();

        // Resolve all routes
        const routes = await this.resolveRoutes();

        // Clean output directory
        await this.cleanOutput();

        // Start static server
        const server = new StaticServer(
            resolve(this.config.inputDir),
            this.config.publicDir ? resolve(this.config.publicDir) : undefined
        );

        const serverInstance = await server.start(this.config.port, this.config.host);

        try {
            // Initialize browser renderer
            const renderer = new BrowserRenderer(this.config);
            await renderer.initialize();

            try {
                // Render routes in parallel batches
                const results = await this.renderRoutes(renderer, serverInstance.url, routes);

                // Copy static assets
                await this.copyAssets();

                const duration = Date.now() - startTime;
                const success = results.filter(r => r.success).length;

                return {
                    total: results.length,
                    success,
                    failed: results.length - success,
                    duration,
                    results
                };
            } finally {
                await renderer.close();
            }
        } finally {
            await serverInstance.close();
        }
    }

    private async resolveRoutes(): Promise<string[]> {
        const routes = new Set<string>();

        // Static routes
        if (Array.isArray(this.config.routes)) {
            this.config.routes.forEach(route => routes.add(route));
        } else if (typeof this.config.routes === 'function') {
            const dynamicRoutes = await this.config.routes();
            dynamicRoutes.forEach(route => routes.add(route));
        }

        // Dynamic route patterns
        for (const { pattern, generator } of this.config.dynamicRoutes) {
            const generatedRoutes = await generator();
            generatedRoutes.forEach(route => routes.add(route));
        }

        return Array.from(routes);
    }

    private async renderRoutes(
        renderer: BrowserRenderer,
        serverUrl: string,
        routes: string[]
    ): Promise<any[]> {
        const results: any[] = [];
        const parallelBatches = Math.ceil(routes.length / this.config.parallel);

        for (let i = 0; i < parallelBatches; i++) {
            const batch = routes.slice(
                i * this.config.parallel,
                (i + 1) * this.config.parallel
            );

            const batchResults = await Promise.all(
                batch.map(async (route) => {
                    let result;
                    let attempts = 0;

                    do {
                        result = await renderer.render(serverUrl, route);
                        attempts++;
                    } while (!result.success && attempts < this.config.retries);

                    if (result.success) {
                        await this.writeHtml(result.html, result.outputPath);
                    }

                    return result;
                })
            );

            results.push(...batchResults);
        }

        return results;
    }

    private async writeHtml(html: string, outputPath: string): Promise<void> {
        const fullPath = join(this.config.outputDir, outputPath);
        const dir = dirname(fullPath);

        await mkdir(dir, { recursive: true });
        await writeFile(fullPath, html, 'utf-8');
    }

    private async copyAssets(): Promise<void> {
        try {
            // Copy all non-HTML assets from input directory
            const assetPattern = join(this.config.inputDir, '**/*');
            const assets = await glob(assetPattern, {
                ignore: ['**/*.html'],
                nodir: true
            });

            for (const asset of assets) {
                const relativePath = asset.replace(this.config.inputDir + '/', '');
                const outputPath = join(this.config.outputDir, relativePath);
                const outputDir = dirname(outputPath);

                await mkdir(outputDir, { recursive: true });
                await cp(asset, outputPath);
            }

            // Copy public directory if it exists
            if (this.config.publicDir) {
                await cp(
                    this.config.publicDir,
                    join(this.config.outputDir, 'assets'),
                    { recursive: true, force: false }
                ).catch(() => {
                    // Public directory doesn't exist, ignore
                });
            }
        } catch (error) {
            console.warn('Warning: Failed to copy some assets:', error);
        }
    }

    private async cleanOutput(): Promise<void> {
        try {
            await rm(this.config.outputDir, { recursive: true, force: true });
        } catch {
            // Directory doesn't exist, ignore
        }
    }
}
