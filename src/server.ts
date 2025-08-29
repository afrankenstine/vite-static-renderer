import { createServer, Server } from 'http';
import { readFile, stat, readdir } from 'fs/promises';
import { join, extname, resolve } from 'path';
import { lookup } from 'mime-types';
import type { ServerInstance } from './types.js';

export class StaticServer {
    private server?: Server;

    constructor(private rootDir: string, private publicDir?: string) {}

    private async handleRequest(req: any, res: any) {
        try {
            const url = new URL(req.url!, 'http://localhost');
            let filePath = join(this.rootDir, url.pathname);

            // Handle SPA routing - if file doesn't exist, try index.html
            try {
                const stats = await stat(filePath);

                if (stats.isDirectory()) {
                    filePath = join(filePath, 'index.html');
                }
            } catch {
                // If file doesn't exist, serve index.html for SPA routing
                if (!url.pathname.includes('.')) {
                    filePath = join(this.rootDir, 'index.html');
                } else {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('Not Found');
                    return;
                }
            }

            // Read and serve the file
            const content = await readFile(filePath);
            const ext = extname(filePath);
            const mimeType = lookup(ext) || 'application/octet-stream';

            res.writeHead(200, {
                'Content-Type': mimeType,
                'Content-Length': content.length,
                'Cache-Control': 'no-cache'
            });
            res.end(content);

        } catch (error) {
            console.error('Server error:', error);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal Server Error');
        }
    }

    async start(port = 0, host = 'localhost'): Promise<ServerInstance> {
        return new Promise((resolve, reject) => {
            this.server = createServer((req, res) => {
                this.handleRequest(req, res);
            });

            this.server.listen(port, host, () => {
                const address = this.server!.address();
                if (!address || typeof address === 'string') {
                    reject(new Error('Failed to get server address'));
                    return;
                }

                const serverUrl = `http://${host}:${address.port}`;
                console.log(`🚀 Static server started on ${serverUrl}`);

                resolve({
                    url: serverUrl,
                    port: address.port,
                    close: async () => {
                        return new Promise<void>((resolve) => {
                            if (this.server) {
                                this.server.close(() => resolve());
                            } else {
                                resolve();
                            }
                        });
                    }
                });
            });

            this.server.on('error', reject);
        });
    }
}
