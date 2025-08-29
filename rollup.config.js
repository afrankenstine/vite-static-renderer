// rollup.config.js
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';

export default [
    // Main library build
    {
        input: 'src/index.ts',
        output: {
            file: 'dist/index.js',
            format: 'es',
            sourcemap: true,
        },
        plugins: [
            nodeResolve({
                preferBuiltins: true,
                browser: false
            }),
            commonjs({
                // Convert CommonJS modules to ES modules
                transformMixedEsModules: true
            }),
            typescript()
        ],
        external: ['playwright', 'fastify', 'chalk', 'glob', 'mime-types', 'yaml', 'fs', 'path', 'url']
    },
    // CLI build
    {
        input: 'src/cli.ts',
        output: {
            file: 'dist/cli.js',
            format: 'es',
            banner: '#!/usr/bin/env node',
            sourcemap: true,
        },
        plugins: [
            nodeResolve({
                preferBuiltins: true,
                browser: false
            }),
            commonjs({
                transformMixedEsModules: true
            }),
            typescript()
        ],
        external: ['commander', 'chalk', 'fs', 'path', 'child_process', 'playwright', 'fastify', 'glob', 'mime-types']
    },
    // Vite plugin build
    {
        input: 'src/vite.ts',
        output: {
            file: 'dist/vite.js',
            format: 'es',
            sourcemap: true,
        },
        plugins: [
            nodeResolve({
                preferBuiltins: true,
                browser: false
            }),
            commonjs({
                transformMixedEsModules: true
            }),
            typescript()
        ],
        external: ['vite', 'playwright', 'fastify', 'chalk', 'glob', 'mime-types', 'yaml', 'fs', 'path', 'url']
    }
];
