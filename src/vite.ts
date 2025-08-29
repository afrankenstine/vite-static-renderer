import type { Plugin } from 'vite';
import { StaticGenerator } from './generator.js';
import { ConfigManager } from './config.js';
import type { RenderConfig } from './types.js';

export interface ViteStaticOptions extends RenderConfig {
    enabled?: boolean;
}

export function viteStatic(options: ViteStaticOptions = {}): Plugin {
    let config: ConfigManager;

    return {
        name: 'vite-static-renderer',

        configResolved(resolvedConfig) {
            // Update paths based on Vite configuration
            const viteConfig: RenderConfig = {
                inputDir: resolvedConfig.build.outDir,
                publicDir: resolvedConfig.publicDir,
                ...options
            };

            config = new ConfigManager(viteConfig);
        },

        async writeBundle() {
            if (options.enabled === false) {
                return;
            }

            try {
                const generator = new StaticGenerator(config.get());
                const stats = await generator.generate();

                console.log(`\n✅ Static generation complete:`);
                console.log(`   📄 ${stats.success}/${stats.total} pages rendered`);
                console.log(`   ⏱️  ${stats.duration}ms`);

                if (stats.failed > 0) {
                    console.log(`   ❌ ${stats.failed} pages failed`);
                }
            } catch (error) {
                console.error('❌ Static generation failed:', error);
                throw error;
            }
        }
    };
}

export default viteStatic;
