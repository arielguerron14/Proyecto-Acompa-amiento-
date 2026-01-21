#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// API Gateway URL
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:8080';
const PORT = process.env.FRONTEND_PORT || process.env.PORT || 5500;
const HOST = '0.0.0.0';

// Create HTTP server
const server = http.createServer((req, res) => {
    try {
        // Handle API proxy requests
        if (req.url.startsWith('/api/')) {
            const endpoint = req.url.substring(4); // Remove '/api' prefix
            const targetUrl = new URL(endpoint, API_GATEWAY_URL);
            
            console.log(`🔄 Proxying ${req.method} ${req.url} -> ${targetUrl.toString()}`);
            
            const proxyReq = http.request(targetUrl, {
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
        let urlPath = req.url.split('?')[0];
        if (urlPath === '/') {
            urlPath = '/index.html';
        }
        
        let filePath = path.join(__dirname, 'public', urlPath);
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            // Try to find in root
            filePath = path.join(__dirname, urlPath);
        }
        
        // If no extension and file doesn't exist, try adding .html
        if (!path.extname(filePath) && !fs.existsSync(filePath)) {
            filePath += '.html';
        }
        
        // Security: prevent directory traversal
        const realPath = fs.realpathSync(__dirname);
        const targetPath = fs.realpathSync(filePath);
        if (!targetPath.startsWith(realPath)) {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Forbidden' }));
            return;
        }
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'File not found', path: urlPath }));
            return;
        }
        
        // Determine content type
        const ext = path.extname(filePath).toLowerCase();
        const contentTypes = {
            '.html': 'text/html; charset=utf-8',
            '.css': 'text/css; charset=utf-8',
            '.js': 'text/javascript; charset=utf-8',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon',
            '.woff': 'font/woff',
            '.woff2': 'font/woff2',
            '.ttf': 'font/ttf'
        };
        const contentType = contentTypes[ext] || 'text/plain';
        
        // Read and serve file
        fs.readFile(filePath, (err, content) => {
            if (err) {
                console.error(`Error reading file: ${err.message}`);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal Server Error' }));
                return;
            }
            
            // Inject API_GATEWAY_URL for HTML files
            if (ext === '.html' && content.toString().includes('</head>')) {
                content = Buffer.from(
                    content.toString().replace(
                        '</head>',
                        `<script>window.__API_GATEWAY_URL__ = '${API_GATEWAY_URL}';</script></head>`
                    )
                );
            }
            
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        });
    } catch (err) {
        console.error(`Server error: ${err.message}`);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
});

// Start server
server.listen(PORT, HOST, () => {
    console.log(`🌐 Frontend server running at http://${HOST}:${PORT}/`);
    console.log(`🔗 API Gateway proxied from: ${API_GATEWAY_URL}`);
    console.log(`📂 Serving from: ${path.join(__dirname, 'public')}`);
});

// Handle errors
server.on('error', (err) => {
    console.error(`Server error: ${err.message}`);
    process.exit(1);
});

// Graceful shutdown
let isShuttingDown = false;

process.on('SIGINT', () => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log('\n✋ Shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
    // Force exit after 10 seconds
    setTimeout(() => {
        console.error('❌ Forced exit after 10 seconds');
        process.exit(1);
    }, 10000);
});

process.on('SIGTERM', () => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log('\n✋ Terminating...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
    // Force exit after 10 seconds
    setTimeout(() => {
        console.error('❌ Forced exit after 10 seconds');
        process.exit(1);
    }, 10000);
});
