const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {

    let filePath = path.join(__dirname, "index.html");

    fs.readFile(filePath, (err, content) => {

        if (err) {
            res.writeHead(500);
            res.end("Error interno");
            return;
        }

        res.writeHead(200, {
            "Content-Type": "text/html"
        });

        res.end(content);

    });

}).listen(PORT);

console.log(`Servidor iniciado en puerto ${PORT}`);
