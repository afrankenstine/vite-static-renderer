import { chromium, type Browser, type Page } from 'playwright';
import type { RenderConfig, RenderResult } from './types.js';

export class BrowserRenderer {
    private browser?: Browser;
    private config: Required<RenderConfig>;

    constructor(config: Required<RenderConfig>) {
        this.config = config;
    }

    async initialize(): Promise<void> {
        this.browser = await chromium.launch({
            headless: this.config.browser.headless,
            devtools: this.config.browser.devtools,
            timeout: this.config.browser.timeout
        });
    }

    async render(serverUrl: string, route: string): Promise<RenderResult> {
        if (!this.browser) {
            throw new Error('Browser not initialized');
        }

        const page = await this.browser.newPage({
            viewport: this.config.browser.viewport,
            userAgent: this.config.browser.userAgent
        });

        try {
            await this.config.beforeRender?.(route);

            const url = new URL(route, serverUrl).href;

            // Navigate with configurable wait conditions
            const waitOptions: any = { timeout: this.config.waitFor.timeout };

            if (this.config.waitFor.load) {
                waitOptions.waitUntil = 'load';
            }

            if (this.config.waitFor.networkIdle) {
                waitOptions.waitUntil = 'networkidle';
            }

            await page.goto(url, waitOptions);

            // Wait for specific selector if configured
            if (this.config.waitFor.selector) {
                await page.waitForSelector(this.config.waitFor.selector, {
                    timeout: this.config.waitFor.timeout
                });
            }

            // Get the rendered HTML
            let html = await page.content();

            // Apply post-processing
            html = await this.postProcess(html, route);

            await this.config.afterRender?.(route, html);

            return {
                route,
                html,
                outputPath: this.getOutputPath(route),
                success: true
            };
        } catch (error) {
            await this.config.onError?.(route, error as Error);

            return {
                route,
                html: '',
                outputPath: this.getOutputPath(route),
                success: false,
                error: error as Error
            };
        } finally {
            await page.close();
        }
    }

    private async postProcess(html: string, route: string): Promise<string> {
        // Inject meta tags
        if (Object.keys(this.config.injectMeta).length > 0) {
            const metaTags = Object.entries(this.config.injectMeta)
                .map(([name, content]) => `<meta name="${name}" content="${content}">`)
                .join('\n  ');

            html = html.replace('<head>', `<head>\n  ${metaTags}`);
        }

        // Minify HTML if configured
        if (this.config.minifyHtml) {
            html = html
                .replace(/\s+/g, ' ')
                .replace(/>\s+</g, '><')
                .trim();
        }

        return html;
    }

    private getOutputPath(route: string): string {
        if (this.config.customNaming) {
            return this.config.customNaming(route);
        }

        if (this.config.fileNaming === 'flat') {
            const name = route === '/' ? 'index' : route.replace(/^\//, '').replace(/\//g, '-');
            return `${name}.html`;
        }

        // Nested structure (default)
        if (route === '/') {
            return 'index.html';
        }

        return `${route.replace(/^\//, '')}/index.html`;
    }

    async close(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            this.browser = undefined;
        }
    }
}
