const http = require('http');
const fs = require('fs');
const path = require('path');
const port = process.env.PORT || 3000;
const dist = path.join(__dirname, 'dist');
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.sql':'text/plain; charset=utf-8','.md':'text/markdown; charset=utf-8'};
http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  let file = url === '/' ? 'index.html' : url.replace(/^\//,'');
  let full = path.join(dist, file);
  if (!full.startsWith(dist) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) full = path.join(dist, 'index.html');
  res.writeHead(200, {'Content-Type': types[path.extname(full)] || 'application/octet-stream'});
  res.end(fs.readFileSync(full));
}).listen(port, () => console.log(`SERVITEC PRO local: http://localhost:${port}`));
