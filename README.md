# vite-static-renderer

A high-performance static site generator with CLI and Vite integration. Transform your SPA into lightning-fast, SEO-ready static pages with modern browser rendering, intelligent asset handling, and automatic `sitemap.xml` and `robots.txt` generation.

## ✨ Features

- **🚀 High Performance**: Built with Playwright and Fastify for maximum speed
- **⚡ Vite Integration**: Seamless plugin integration with your Vite workflow
- **🔧 CLI Tool**: Standalone command-line interface for any project
- **🌐 Universal**: Works with React, Vue, Angular, Svelte, and any SPA framework
- **📱 Modern Rendering**: Uses real browsers for accurate rendering
- **🎯 Smart Configuration**: Multiple config formats with intelligent defaults
- **⚙️ Parallel Processing**: Configurable concurrent rendering for speed
- **🔄 Dynamic Routes**: Generate routes from APIs, files, or databases
- **🤖 SEO-Ready**: Automatic `sitemap.xml` and `robots.txt` generation
- **📦 Asset Optimization**: Intelligent asset copying and optimization
- **🎨 Flexible Output**: Multiple naming strategies and structure options

## 📦 Installation

### As a development dependency:
```bash
npm install --save-dev vite-static-renderer
# or
yarn add -D vite-static-renderer
# or
pnpm add -D vite-static-renderer
```

### Global installation (for CLI usage):
```bash
npm install -g vite-static-renderer
```

## 🚀 Quick Start

### 1. CLI Usage

Create a configuration file:

```javascript
// vite-static.config.js
export default {
  routes: ['/', '/about', '/contact'],
  inputDir: 'dist',
  outputDir: 'static'
};
```

Generate static pages:

```bash
# Generate with existing build
npx vite-static generate

# Build and generate in one command
npx vite-static generate --build

# With custom config
npx vite-static generate -c my-config.js
```

### 2. Vite Plugin Usage

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import viteStatic from 'vite-static-renderer/vite';

export default defineConfig({
  plugins: [
    viteStatic({
      routes: ['/', '/about', '/contact'],
      enabled: true // Set to false to disable in development
    })
  ]
});
```

Now your static pages will be generated automatically after each build!

## ⚙️ Configuration

### Basic Configuration

```javascript
// vite-static.config.js
export default {
  // Input/Output
  inputDir: 'dist',           // Built app directory
  outputDir: 'static',        // Static files output
  publicDir: 'public',        // Public assets directory

  // Routes to render
  routes: ['/', '/about', '/contact'],

  // Browser settings
  browser: {
    headless: true,
    timeout: 30000,
    viewport: { width: 1280, height: 720 }
  },

  // Performance
  parallel: 4,                // Concurrent renders
  retries: 2,                 // Retry failed renders

  // Output structure
  fileNaming: 'nested'        // 'nested' | 'flat' | 'custom'
};
```

### Advanced Configuration

```javascript
// vite-static.config.js
export default {
  // Dynamic route generation
  routes: async () => {
    const posts = await fetch('/api/posts').then(r => r.json());
    return ['/', ...posts.map(p => `/blog/${p.slug}`)];
  },

  // Multiple dynamic route patterns
  dynamicRoutes: [
    {
      pattern: '/blog/*',
      generator: async () => {
        const posts = await getBlogPosts();
        return posts.map(post => `/blog/${post.slug}`);
      }
    },
    {
      pattern: '/products/*',
      generator: async () => {
        const products = await getProducts();
        return products.map(product => `/products/${product.id}`);
      }
    }
  ],

  // Wait conditions
  waitFor: {
    networkIdle: true,
    selector: '#app',           // Wait for specific element
    timeout: 5000
  },

  // HTML processing
  minifyHtml: true,
  injectMeta: {
    'generator': 'vite-static-renderer',
    'viewport': 'width=device-width, initial-scale=1'
  },

  // Custom file naming
  customNaming: (route) => {
    if (route === '/') return 'home.html';
    return `${route.replace(/^\//, '').replace(/\//g, '-')}.html`;
  },

  // Lifecycle hooks
  beforeRender: async (route) => {
    console.log(`Rendering ${route}...`);
  },

  afterRender: async (route, html) => {
    // Modify HTML before writing
    return html.replace('{{ROUTE}}', route);
  },

  onError: async (route, error) => {
    console.error(`Failed to render ${route}:`, error.message);
  }
};
```

##  SEO Features

Automate the creation of `sitemap.xml` and `robots.txt` for improved search engine visibility.

### Sitemap Generation

Enable sitemap generation by providing a `sitemap` configuration object. The `hostname` property is required to generate absolute URLs.

```javascript
// vite-static.config.js
export default {
  // ... other configs
  sitemap: {
    hostname: 'https://www.my-awesome-site.com',
    exclude: ['/404', '/admin/*'] // Optional: Exclude specific routes using glob patterns
  }
};
```

This will generate a `sitemap.xml` file in your `outputDir` with all successfully rendered routes.

### Robots.txt Generation

Create a `robots.txt` file by defining a `robots` configuration object with a policy array.

```javascript
// vite-static.config.js
export default {
  // ... other configs
  robots: {
    policy: [
      {
        userAgent: '*',
        disallow: '/admin',
        allow: '/public/'
      },
      {
        userAgent: 'Googlebot',
        disallow: '/private/'
      }
    ]
  }
};
```

**Note:** If `sitemap` is also configured, a `Sitemap:` directive will be automatically added to your `robots.txt` file, which is an SEO best practice.

## 🌐 Dynamic Routes

### From API/CMS

```javascript
// vite-static.config.js
export default async function() {
  // Fetch from headless CMS
  const posts = await fetch('https://api.contentful.com/spaces/YOUR_SPACE/entries', {
    headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
  }).then(r => r.json());

  const blogRoutes = posts.items.map(post => `/blog/${post.fields.slug}`);

  return {
    routes: ['/', '/blog', ...blogRoutes],
    inputDir: 'dist',
    outputDir: 'static'
  };
}
```

### From Local Files

```javascript
// vite-static.config.js
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

export default async function() {
  // Read markdown files
  const postsDir = join(process.cwd(), 'content/posts');
  const files = await readdir(postsDir);
  
  const blogRoutes = files
    .filter(file => file.endsWith('.md'))
    .map(file => `/blog/${file.replace('.md', '')}`);

  return {
    routes: ['/', '/blog', ...blogRoutes],
    inputDir: 'dist',
    outputDir: 'static'
  };
}
```

### From JSON Data

```javascript
// vite-static.config.js
import { readFile } from 'fs/promises';

export default async function() {
  const data = JSON.parse(await readFile('data/products.json', 'utf-8'));
  const productRoutes = data.products.map(p => `/products/${p.slug}`);

  return {
    routes: ['/', '/products', ...productRoutes],
    inputDir: 'dist',
    outputDir: 'static'
  };
}
```

## 🔧 CLI Reference

### Commands

```bash
# Generate static pages
vite-static generate [options]
vite-static gen [options]        # Alias

# Initialize configuration
vite-static init [options]
```

### Options

```bash
# Configuration
-c, --config <path>           # Custom config file path
-i, --input <dir>             # Input directory (default: dist)
-o, --output <dir>            # Output directory (default: static)

# Build integration
--build                       # Run build command before generating
--no-cache                    # Disable caching

# Performance
-p, --parallel <num>          # Parallel renders (default: 4)

# Debugging
--verbose                     # Verbose logging
```

### Examples

```bash
# Basic usage
npx vite-static generate

# With build step
npx vite-static generate --build

# Custom configuration
npx vite-static generate -c custom.config.js

# Override directories
npx vite-static generate -i build -o public

# High performance
npx vite-static generate --parallel 8

# Initialize new project
npx vite-static init --template blog
```

## 📁 Output Structures

### Nested Structure (default)
```
static/
├── index.html              # /
├── about/
│   └── index.html         # /about
├── blog/
│   └── index.html         # /blog
│   ├── post-1/
│   │   └── index.html     # /blog/post-1
│   └── post-2/
│       └── index.html     # /blog/post-2
└── assets/
    ├── style.css
    └── app.js
```

### Flat Structure
```javascript
// Config
export default {
  fileNaming: 'flat'
};
```

```
static/
├── index.html              # /
├── about.html             # /about
├── blog.html              # /blog
├── blog-post-1.html       # /blog/post-1
├── blog-post-2.html       # /blog/post-2
└── assets/
    ├── style.css
    └── app.js
```

### Custom Naming
```javascript
// Config
export default {
  fileNaming: 'custom',
  customNaming: (route) => {
    if (route === '/') return 'home.html';
    if (route.startsWith('/blog/')) {
      return `articles/${route.replace('/blog/', '')}.html`;
    }
    return `${route.replace(/^\//, '')}.html`;
  }
};
```

## 🎯 Framework Examples

### React

```javascript
// vite-static.config.js
export default {
  routes: ['/', '/about', '/products'],
  waitFor: {
    selector: '#root',        // Wait for React root
    networkIdle: true
  }
};
```

### Vue

```javascript
// vite-static.config.js
export default {
  routes: ['/', '/about', '/products'],
  waitFor: {
    selector: '#app',         // Wait for Vue app
    networkIdle: true
  }
};
```

### Next.js

```javascript
// vite-static.config.js
export default {
  inputDir: 'out',            // Next.js static export
  routes: ['/', '/about'],
  buildCommand: 'npm run build && npm run export'
};
```

### Nuxt

```javascript
// vite-static.config.js
export default {
  inputDir: 'dist',
  routes: ['/', '/about'],
  buildCommand: 'npm run generate'
};
```

## 📊 Performance Tips

### Optimize Rendering Speed

```javascript
export default {
  // Increase parallel processing
  parallel: 8,

  // Optimize wait conditions
  waitFor: {
    networkIdle: false,       // Disable if not needed
    load: true,               // Wait for page load only
    timeout: 3000             // Reduce timeout
  },

  // Enable caching
  cache: true,
  cacheDir: '.cache/static',

  // Skip unnecessary assets
  browser: {
    headless: true,           // Always use headless in production
    timeout: 15000            // Reduce browser timeout
  }
};
```

### Memory Management

```javascript
export default {
  // Process routes in smaller batches
  parallel: 4,               // Don't overload memory

  // Enable retries for stability
  retries: 3,

  // Clean up between renders
  beforeRender: async (route) => {
    if (global.gc) global.gc();
  }
};
```

## 🔍 Troubleshooting

### Common Issues

**Build directory not found**
```bash
# Make sure your app is built first
npm run build
npx vite-static generate

# Or use --build flag
npx vite-static generate --build
```

**Rendering timeouts**
```javascript
export default {
  waitFor: {
    timeout: 60000,           // Increase timeout
    networkIdle: false        // Disable network wait
  },
  browser: {
    timeout: 60000            // Increase browser timeout
  }
};
```

**Memory issues**
```javascript
export default {
  parallel: 2,                // Reduce concurrent renders
  browser: {
    headless: true            // Always use headless
  }
};
```

**Route not rendering correctly**
```javascript
export default {
  waitFor: {
    selector: '.content',     // Wait for specific content
    timeout: 10000
  },
  beforeRender: async (route) => {
    console.log(`Rendering: ${route}`);
  }
};
```

## 🤝 Integration Examples

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Build and Deploy
on:
  push:
    branches: [ main ]

jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm install
      - run: npx vite-static generate --build
      
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./static
```

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build
RUN npx vite-static generate

FROM nginx:alpine
COPY --from=0 /app/static /usr/share/nginx/html
```

### Netlify

```toml
# netlify.toml
[build]
  command = "npm run build && npx vite-static generate"
  publish = "static"

[[plugins]]
  package = "@netlify/plugin-lighthouse"
```

## 📚 API Reference

### Configuration Types

```typescript
interface RenderConfig {
  // I/O Configuration
  inputDir?: string;
  outputDir?: string;
  publicDir?: string;
  
  // Routes
  routes?: string[] | (() => Promise<string[]>);
  dynamicRoutes?: DynamicRoute[];
  
  // Browser Options
  browser?: BrowserConfig;
  waitFor?: WaitConfig;
  
  // Output Options
  fileNaming?: 'nested' | 'flat' | 'custom';
  customNaming?: (route: string) => string;
  minifyHtml?: boolean;
  
  // Performance
  parallel?: number;
  retries?: number;
  cache?: boolean;
  
  // Hooks
  beforeRender?: (route: string) => Promise<void>;
  afterRender?: (route: string, html: string) => Promise<string>;
  onError?: (route: string, error: Error) => Promise<void>;
}
```

## 🎉 Migration Guide

### From other static generators

#### From `prerender-spa-plugin`
```javascript
// Old webpack config
new PrerenderSPAPlugin({
  staticDir: path.join(__dirname, 'dist'),
  routes: ['/', '/about'],
  outputDir: path.join(__dirname, 'prerendered')
});

// New Vite config
export default {
  routes: ['/', '/about'],
  inputDir: 'dist',
  outputDir: 'prerendered'
};
```


## 🆘 Support

- 🐛 [Issue Tracker](https://github.com/afrankenstine/vite-static-renderer/issues)
- 💡 [Feature Requests](https://github.com/afrankenstine/vite-static-renderer/discussions)

***

**Made with ❤️ for the modern web**
