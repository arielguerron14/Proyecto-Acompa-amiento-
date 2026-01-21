#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Ignore signals for now
process.on('SIGINT', () => {});
process.on('SIGTERM', () => {});

const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:8080';
const PORT = 5500;
const HOST = 'localhost';

const server = http.createServer((req, res) => {
    try {
        if (req.url.startsWith('/api/')) {
            const endpoint = req.url.substring(4);
            const targetUrl = new URL(endpoint, API_GATEWAY_URL);
            
            console.log(`[${new Date().toISOString()}] 🔄 ${req.method} ${req.url}`);
            
            const proxyReq = http.request(targetUrl, {
                method: req.method,
                headers: req.headers
            }, (proxyRes) => {
                Object.keys(proxyRes.headers).forEach(key => {
                    res.setHeader(key, proxyRes.headers[key]);
                });
                res.writeHead(proxyRes.statusCode);
                proxyRes.pipe(res);
            });
            
            proxyReq.on('error', (err) => {
                console.error(`[${new Date().toISOString()}] ❌ Proxy error: ${err.message}`);
                res.writeHead(503, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'API unavailable' }));
            });
            
            req.pipe(proxyReq);
            return;
        }

        let urlPath = req.url.split('?')[0];
        let filePath;
        
        if (urlPath === '/' || urlPath === '') {
            filePath = path.join(__dirname, 'public', 'index.html');
        } else {
            filePath = path.join(__dirname, 'public', urlPath);
            if (!fs.existsSync(filePath) && !path.extname(filePath)) {
                filePath += '.html';
            }
        }
        
        if (!fs.existsSync(filePath)) {
            console.log(`[${new Date().toISOString()}] 404 ${urlPath}`);
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            return;
        }
        
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes = {
            '.html': 'text/html; charset=utf-8',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.gif': 'image/gif'
        };
        
        fs.readFile(filePath, (err, content) => {
            if (err) {
                res.writeHead(500);
                res.end('500 Error');
                return;
            }
            
            if (ext === '.html' && content.toString().includes('</head>')) {
                content = Buffer.from(
                    content.toString().replace(
                        '</head>',
                        `<script>window.__API_GATEWAY_URL__ = '${API_GATEWAY_URL}';</script></head>`
                    )
                );
            }
            
            res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
            res.end(content);
            console.log(`[${new Date().toISOString()}] 200 ${urlPath}`);
        });
        
    } catch (e) {
        console.error(`Error: ${e.message}`);
        res.writeHead(500);
        res.end('500 Error');
    }
});

server.listen(PORT, HOST, () => {
    console.log(`\n✅ Frontend server running!`);
    console.log(`   URL: http://${HOST}:${PORT}`);
    console.log(`   API Gateway: ${API_GATEWAY_URL}\n`);
});
