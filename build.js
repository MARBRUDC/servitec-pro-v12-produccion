const fs = require("fs");

console.log("Generando build SERVITEC PRO V13...");

if (!fs.existsSync("./index.html")) {
    throw new Error("No existe index.html");
}

console.log("Build completado correctamente.");
