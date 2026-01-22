import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { URL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// API Gateway URL - uses environment variable or correct default IP
// Environment variable should be passed as: API_GATEWAY_URL=http://184.72.179.150:8080
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:8080';

const server = http.createServer((req, res) => {
    // Handle API proxy requests
    if (req.url.startsWith('/api/')) {
        const endpoint = req.url.substring(4); // Remove '/api' prefix
        const targetUrl = new URL(endpoint, API_GATEWAY_URL);
        
        console.log(`🔄 Proxying ${req.method} ${req.url} -> ${targetUrl.toString()}`);
        // Select appropriate client based on protocol
        const client = targetUrl.protocol === 'https:' ? https : http;
        const proxyReq = client.request(targetUrl, {
            method: req.method,
            headers: req.headers
        }, (proxyRes) => {
            // Copy response headers
            Object.keys(proxyRes.headers).forEach(key => {
                res.setHeader(key, proxyRes.headers[key]);
            });
            res.writeHead(proxyRes.statusCode);
            proxyRes.pipe(res);
        });
        
        proxyReq.on('error', (err) => {
            console.error(`❌ Proxy error: ${err.message}`);
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'API Gateway unavailable', details: err.message }));
        });
        
        req.pipe(proxyReq);
        return;
    }

    // Serve static files
    const urlPath = req.url.split('?')[0];
    let filePath = path.join(__dirname, 'public', urlPath === '/' ? 'index.html' : urlPath);

    // Si no tiene extensión, asumir .html
    if (!path.extname(filePath)) {
        filePath += '.html';
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = {
        '.html': 'text/html; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.ttf': 'font/ttf'
    }[ext] || 'text/plain';

    fs.readFile(filePath, (err, data) => {
        if (err) {
            // Try from public folder
            const altPath = path.join(__dirname, 'public', path.basename(req.url));
            fs.readFile(altPath, (altErr, altData) => {
                if (altErr) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'File not found' }));
                } else {
                    res.writeHead(200, { 'Content-Type': contentType });
                    let content = altData.toString();
                    // Inject API_GATEWAY_URL for HTML files
                    if (ext === '.html' && content.includes('</head>')) {
                        content = content.replace(
                            '</head>',
                            `<script>window.__API_GATEWAY_URL__ = '${API_GATEWAY_URL}';</script></head>`
                        );
                    }
                    res.end(content);
                }
            });
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            let content = data.toString();
            // Inject API_GATEWAY_URL for HTML files
            if (ext === '.html' && content.includes('</head>')) {
                content = content.replace(
                    '</head>',
                    `<script>window.__API_GATEWAY_URL__ = '${API_GATEWAY_URL}';</script></head>`
                );
            }
            res.end(content);
        }
    });
});

const PORT = process.env.FRONTEND_PORT || process.env.PORT || 5500;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Frontend server running at http://0.0.0.0:${PORT}/`);
    console.log(`🔗 API Gateway proxied from: ${API_GATEWAY_URL}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\nTerminating gracefully...');
    process.exit(0);
});

// Handle errors
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
