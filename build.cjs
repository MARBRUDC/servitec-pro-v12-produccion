const fs = require('fs');
const path = require('path');

const dist = path.join(__dirname, 'dist');
const srcDir = path.join(__dirname, 'src');
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

for (const file of ['index.html', 'main.js', 'styles.css', 'supabase-schema.sql', 'README.md']) {
  const src = path.join(srcDir, file);
  const out = path.join(dist, file);
  if (fs.existsSync(src)) fs.copyFileSync(src, out);
}

console.log('Build OK: dist generado para SERVITEC PRO V13.29.1');
