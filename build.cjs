const fs = require('fs');
const path = require('path');
const root = __dirname;
const src = path.join(root, 'src');
const dist = path.join(root, 'dist');
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });
const env = {
  SUPABASE_URL: process.env.VITE_SUPABASE_URL || '',
  SUPABASE_KEY: process.env.VITE_SUPABASE_KEY || ''
};
let html = fs.readFileSync(path.join(src, 'index.html'), 'utf8');
html = html.replace('/*__SERVITEC_ENV__*/', `window.SERVITEC_ENV=${JSON.stringify(env)};`);
fs.writeFileSync(path.join(dist, 'index.html'), html);
['main.js','styles.css','supabase-schema.sql','README.md'].forEach(file => {
  const from = path.join(src, file);
  if (fs.existsSync(from)) fs.copyFileSync(from, path.join(dist, file));
});
console.log('SERVITEC PRO V13.27.0 static build OK');
