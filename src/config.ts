import { readFile, access } from 'fs/promises';
import { resolve, join } from 'path';
import { parse } from 'yaml';
import type { RenderConfig } from './types.js';

const DEFAULT_CONFIG: Required<RenderConfig> = {
    inputDir: 'dist',
    outputDir: 'static',
    publicDir: 'public',
    routes: ['/'],
    dynamicRoutes: [],
    port: 9099,
    host: 'localhost',
    serverTimeout: 30000,
    browser: {
        headless: true,
        devtools: false,
        timeout: 30000,
        viewport: { width: 1280, height: 720 },
        userAgent: undefined
    },
    waitFor: {
        networkIdle: true,
        selector: undefined,
        timeout: 5000,
        load: true
    },
    fileNaming: 'nested',
    customNaming: (route: string) => {
        // Default fallback: nested naming scheme
        if (route === '/') return 'index.html';
        return `${route.replace(/^\//, '')}/index.html`;
    },
    minifyHtml: false,
    injectMeta: {},
    buildCommand: 'npm run build',
    buildDir: 'dist',
    skipBuild: false,
    parallel: 4,
    retries: 2,
    cache: false,
    cacheDir: '.cache/vite-static',
    beforeRender: async (route: string) => {
        // Default no-op function
    },
    afterRender: async (route: string, html: string) => {
        // Default pass-through function
        return html;
    },
    onError: async (route: string, error: Error) => {
        // Default no-op function
    }
};

export class ConfigManager {
    private config: Required<RenderConfig>;

    constructor(userConfig: RenderConfig = {}) {
        this.config = this.mergeConfig(userConfig);
    }

    static async fromFile(configPath?: string): Promise<ConfigManager> {
        const cwd = process.cwd();
        const possiblePaths = [
            configPath,
            'vite-static.config.js',
            'vite-static.config.ts',
            'vite-static.config.json',
            'vite-static.config.yaml',
            'vite-static.config.yml'
        ].filter(Boolean).map(path => resolve(cwd, path!));

        for (const path of possiblePaths) {
            try {
                await access(path);
                const content = await readFile(path, 'utf-8');

                let config: RenderConfig;

                if (path.endsWith('.json')) {
                    config = JSON.parse(content);
                } else if (path.endsWith('.yaml') || path.endsWith('.yml')) {
                    config = parse(content);
                } else {
                    // Dynamic import for JS/TS files
                    const module = await import(path);
                    config = typeof module.default === 'function'
                        ? await module.default()
                        : module.default;
                }

                return new ConfigManager(config);
            } catch {
                continue;
            }
        }

        return new ConfigManager();
    }

    private mergeConfig(userConfig: RenderConfig): Required<RenderConfig> {
        return {
            ...DEFAULT_CONFIG,
            ...userConfig,
            browser: { ...DEFAULT_CONFIG.browser, ...userConfig.browser },
            waitFor: { ...DEFAULT_CONFIG.waitFor, ...userConfig.waitFor }
        };
    }

    get(): Required<RenderConfig> {
        return { ...this.config };
    }

    update(updates: Partial<RenderConfig>): void {
        this.config = this.mergeConfig({ ...this.config, ...updates });
    }
}
