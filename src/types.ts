export interface RenderConfig {
    // Input/Output
    inputDir?: string;
    outputDir?: string;
    publicDir?: string;

    // Routes
    routes?: string[] | (() => Promise<string[]> | string[]);
    dynamicRoutes?: {
        pattern: string;
        generator: () => Promise<string[]> | string[];
    }[];

    // Server Configuration
    port?: number;
    host?: string;
    serverTimeout?: number;

    // Browser Configuration
    browser?: {
        headless?: boolean;
        devtools?: boolean;
        timeout?: number;
        viewport?: { width: number; height: number };
        userAgent?: string;
    };

    // Rendering Options
    waitFor?: {
        networkIdle?: boolean;
        selector?: string;
        timeout?: number;
        load?: boolean;
    };

    // Output Options
    fileNaming?: 'nested' | 'flat' | 'custom';
    customNaming?: (route: string) => string;
    minifyHtml?: boolean;
    injectMeta?: Record<string, string>;

    // Build Integration
    buildCommand?: string;
    buildDir?: string;
    skipBuild?: boolean;

    // Advanced
    parallel?: number;
    retries?: number;
    cache?: boolean;
    cacheDir?: string;

    // Hooks
    beforeRender?: (route: string) => Promise<void> | void;
    afterRender?: (route: string, html: string) => Promise<string> | string;
    onError?: (route: string, error: Error) => Promise<void> | void;
}

export interface ServerInstance {
    url: string;
    port: number;
    close: () => Promise<void>;
}

export interface RenderResult {
    route: string;
    html: string;
    outputPath: string;
    success: boolean;
    error?: Error;
}

export interface RenderStats {
    total: number;
    success: number;
    failed: number;
    duration: number;
    results: RenderResult[];
}
