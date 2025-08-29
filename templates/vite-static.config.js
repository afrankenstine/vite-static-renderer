export default {
    // Input/Output
    inputDir: 'dist',
    outputDir: 'static',

    // Routes to render
    routes: ['/'],

    // Dynamic routes from API or files
    dynamicRoutes: [
        {
            pattern: '/blog/*',
            generator: async () => {
                // Fetch from your API, files, etc.
                const posts = await fetch('/api/posts').then(r => r.json());
                return posts.map(post => `/blog/${post.slug}`);
            }
        }
    ],

    // Browser configuration
    browser: {
        headless: true,
        timeout: 30000,
        viewport: { width: 1280, height: 720 }
    },

    // Wait conditions
    waitFor: {
        networkIdle: true,
        selector: '#app', // Wait for specific element
        timeout: 5000
    },

    // Output naming
    fileNaming: 'nested', // 'nested' | 'flat' | 'custom'

    // Performance
    parallel: 4,
    retries: 2,

    // Build integration
    buildCommand: 'npm run build',
    skipBuild: false,

    // Hooks
    beforeRender: async (route) => {
        console.log(`Rendering ${route}...`);
    },

    afterRender: async (route, html) => {
        return html; // Modify HTML if needed
    }
};
