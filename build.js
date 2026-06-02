const fs = require('fs');
const path = require('path');
const dist = path.join(__dirname, 'dist');
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });
const env = {
  SUPABASE_URL: process.env.VITE_SUPABASE_URL || '',
  SUPABASE_KEY: process.env.VITE_SUPABASE_KEY || ''
};
let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
html = html.replace('/*__SERVITEC_ENV__*/', `window.SERVITEC_ENV=${JSON.stringify(env)};`);
fs.writeFileSync(path.join(dist, 'index.html'), html);
['main.js','styles.css','supabase-schema.sql','README.md'].forEach(f=>{
  if(fs.existsSync(path.join(__dirname,f))) fs.copyFileSync(path.join(__dirname,f), path.join(dist,f));
});
console.log('SERVITEC PRO V13.17.1 rollback nube build OK');
