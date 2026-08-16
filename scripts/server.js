const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { initDb, saveMemory, searchMemories, listMemories, deleteMemory, getProjects, getStats } = require('./db');

const HOST = process.env.HOST || '127.0.0.1';
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
  });
}

function sendJson(res, data, statusCode = 200) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function isAllowedOrigin(origin) {
  if (!origin) return true; // Mismo origen o peticiones locales directas
  try {
    const parsed = new URL(origin);
    return parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
  } catch (e) {
    return false;
  }
}

const server = http.createServer(async (req, res) => {
  const hostHeader = req.headers.host || '';
  const hostName = hostHeader.split(':')[0];
  
  // Protección contra DNS Rebinding y Host Header Injection
  if (hostName && hostName !== 'localhost' && hostName !== '127.0.0.1' && HOST === '127.0.0.1') {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Acceso denegado: Host no autorizado.');
    return;
  }

  const urlObj = new URL(req.url, `http://${hostHeader || '127.0.0.1'}`);
  const pathname = urlObj.pathname;
  const method = req.method;

  // Restricción estricta de CORS
  const origin = req.headers.origin;
  if (isAllowedOrigin(origin)) {
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  } else if (origin) {
    res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'Origen CORS no autorizado' }));
    return;
  }

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    await initDb();

    // API Routes
    if (pathname === '/api/stats' && method === 'GET') {
      const stats = await getStats();
      return sendJson(res, stats);
    }

    if (pathname === '/api/projects' && method === 'GET') {
      const projects = await getProjects();
      return sendJson(res, projects);
    }

    if (pathname === '/api/memories' && method === 'GET') {
      const project = urlObj.searchParams.get('project') || '';
      const query = urlObj.searchParams.get('query') || '';
      
      let memories;
      if (query) {
        memories = await searchMemories(project, query);
      } else {
        memories = await listMemories(project);
      }
      return sendJson(res, memories);
    }

    if (pathname === '/api/memories' && method === 'POST') {
      const body = await parseBody(req);
      if (!body.title || !body.summary_signature) {
        return sendJson(res, { error: 'Faltan campos obligatorios (title, summary_signature)' }, 400);
      }
      const project = body.project_name || 'default_project';
      const category = body.category || 'general';
      const tags = body.tags || '';
      const result = await saveMemory(project, body.title, body.summary_signature, category, tags);
      return sendJson(res, result, 201);
    }

    if (pathname.startsWith('/api/memories/') && method === 'DELETE') {
      const id = pathname.split('/')[3];
      const result = await deleteMemory(id);
      return sendJson(res, result);
    }

    // Serve Static Files
    let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
    if (!fs.existsSync(filePath)) {
      filePath = path.join(PUBLIC_DIR, 'index.html');
    }

    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'text/plain';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end('Error interno del servidor');
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      }
    });

  } catch (error) {
    sendJson(res, { error: error.message }, 500);
  }
});

function startServer(openBrowser = true) {
  server.listen(PORT, HOST, () => {
    const url = `http://${HOST}:${PORT}`;
    console.log(`\n🧠 [agents-memory] Dashboard iniciado con éxito en: ${url}`);
    console.log(`Presiona Ctrl+C para detener el servidor.\n`);
    
    if (openBrowser) {
      const startCmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
      exec(`${startCmd} ${url}`);
    }
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer };

