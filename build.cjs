const fs = require('fs');
const path = require('path');

const VERSION = '13.29.3';
const dist = path.join(__dirname, 'dist');
const srcDir = path.join(__dirname, 'src');
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

function copy(file){
  const src = path.join(srcDir, file);
  const out = path.join(dist, file);
  if (fs.existsSync(src)) fs.copyFileSync(src, out);
}
for (const file of ['main.js', 'styles.css', 'supabase-schema.sql', 'README.md']) copy(file);

let html = fs.readFileSync(path.join(srcDir, 'index.html'), 'utf8');
const env = {
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '',
  VITE_SUPABASE_KEY: process.env.VITE_SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || ''
};
const envScript = `<script>window.SERVITEC_ENV=${JSON.stringify(env)};</script>`;
html = html.replace('</head>', `${envScript}\n</head>`).replace(/main\.js\?v=[^"']+/g, `main.js?v=${VERSION}`).replace(/styles\.css\?v=[^"']+/g, `styles.css?v=${VERSION}`);
fs.writeFileSync(path.join(dist, 'index.html'), html);

// También actualizar raíz para despliegues manuales y revisión rápida en GitHub.
for (const file of ['main.js', 'styles.css', 'supabase-schema.sql', 'README.md']) {
  const src = path.join(srcDir, file); if (fs.existsSync(src)) fs.copyFileSync(src, path.join(__dirname, file));
}
fs.writeFileSync(path.join(__dirname, 'index.html'), html);
console.log('Build OK: dist generado para SERVITEC PRO V13.29.3 con variables Supabase inyectadas');
