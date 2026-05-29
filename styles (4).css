const http = require('http');
const fs = require('fs');
const path = require('path');
const port = process.env.PORT || 3000;
http.createServer((req,res)=>{
  const file = req.url.includes('.js')?'main.js':req.url.includes('.css')?'styles.css':'index.html';
  const p = path.join(__dirname,file);
  fs.readFile(p,(err,data)=>{
    if(err){res.writeHead(404);res.end('Not found');return}
    res.writeHead(200, {'Content-Type': file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html'});
    res.end(data);
  })
}).listen(port,()=>console.log('SERVITEC local http://localhost:'+port));
