import http from 'http';
import { WebSocketServer } from 'ws';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const server = http.createServer((req, res) => {
    // 处理 HTTP 请求，提供 HTML 文件
    if (req.url === '/' || req.url === '/test.html') {
        try {
            const htmlPath = join(__dirname, 'test.html');
            const html = readFileSync(htmlPath, 'utf8');
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(html);
        } catch (error) {
            res.writeHead(404);
            res.end('File not found');
        }
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});
const wss = new WebSocketServer({ server });

wss.on('connection', (socket) => {
    console.log('Client connected');
    socket.on('message', (message) => {
        console.log('Message from client', message);
        socket.send(`已收到${message}`);
        socket.send(`已收到${message}`);
        socket.send(`已收到${message}`);
        socket.send(`已收到${message}`);
        socket.send(`已收到${message}`);
        socket.send(`已收到${message}`);
    });
    
    socket.on('close', () => {
        console.log('Client disconnected');
    });
});

server.listen(8080, () => {
    console.log('Server is running on port 8080');
});
