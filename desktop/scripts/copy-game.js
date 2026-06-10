// Copia os arquivos do jogo para desktop/game/ antes do build do instalador.
// As credenciais do secrets.json são injetadas aqui — não ficam no código fonte.
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', '..');   // raiz do ASTD
const dst = path.join(__dirname, '..', 'game'); // desktop/game/
const ignore = new Set(['.git', '.github', 'desktop', 'node_modules', 'docs', 'supabase']);

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    if (ignore.has(entry.name)) continue;
    const srcPath = path.join(from, entry.name);
    const dstPath = path.join(to, entry.name);
    entry.isDirectory() ? copyDir(srcPath, dstPath) : fs.copyFileSync(srcPath, dstPath);
  }
}

if (fs.existsSync(dst)) fs.rmSync(dst, { recursive: true });
copyDir(src, dst);
console.log('[build] Arquivos do jogo copiados.');

const secretsPath = path.join(__dirname, '..', 'secrets.json');
if (fs.existsSync(secretsPath)) {
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = JSON.parse(fs.readFileSync(secretsPath, 'utf8'));
  fs.writeFileSync(
    path.join(dst, 'data', 'online_config.js'),
    `const SUPABASE_URL = "${SUPABASE_URL}";\nconst SUPABASE_ANON_KEY = "${SUPABASE_ANON_KEY}";\n`
  );
  console.log('[build] Credenciais injetadas no bundle.');
} else {
  console.warn('[build] AVISO: secrets.json não encontrado — online desabilitado no build.');
}
