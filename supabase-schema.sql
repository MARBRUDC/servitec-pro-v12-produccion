const http=require('http'),fs=require('fs'),path=require('path');
const root=__dirname;const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css'};
http.createServer((req,res)=>{let p=req.url==='/'?'index.html':req.url.slice(1);let fp=path.join(root,p);if(!fs.existsSync(fp)) fp=path.join(root,'index.html');res.setHeader('Content-Type',mime[path.extname(fp)]||'text/plain');res.end(fs.readFileSync(fp));}).listen(5173,()=>console.log('Local: http://localhost:5173'));
