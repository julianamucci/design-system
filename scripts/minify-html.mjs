// Minifica os shells HTML do output do Storybook (index.html, iframe.html):
// remove comentários HTML e linhas em branco. Os assets JS/CSS já saem
// minificados do Vite — este passo cobre o que o Storybook injeta verbatim
// (manager-head.html / preview-head.html), incluindo comentários de
// documentação do template que não devem ir pra produção.
//
// Uso (encadeado no build-storybook de cada stack):
//   node ../scripts/minify-html.mjs --out storybook-static
//
// Conservador de propósito: só mexe FORA de <script>/<style> (pra não
// corromper strings JS que contenham '<!--') e não colapsa espaços em
// linha (atributos com espaços significativos ficam intactos).

import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const outDir = arg('out', 'storybook-static');

function stripHtml(html) {
  // Divide preservando blocos <script>/<style> (índices ímpares do split).
  const parts = html.split(/(<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>)/gi);
  return parts
    .map((seg, i) => {
      if (i % 2 === 1) return seg; // bloco script/style — intocado
      return seg
        .replace(/<!--[\s\S]*?-->/g, '')   // comentários HTML
        .replace(/^[ \t]+/gm, '')          // indentação de início de linha
        .replace(/\n{2,}/g, '\n');         // linhas em branco consecutivas
    })
    .join('');
}

let files;
try {
  files = (await readdir(outDir)).filter((f) => f.endsWith('.html'));
} catch (e) {
  console.error(`minify-html: não achei ${outDir} — rode depois do 'storybook build'. (${e.message})`);
  process.exit(1);
}

let savedTotal = 0;
for (const f of files) {
  const p = path.join(outDir, f);
  const before = await readFile(p, 'utf8');
  const after = stripHtml(before);
  savedTotal += before.length - after.length;
  await writeFile(p, after, 'utf8');
}

console.log(`minify-html: ${files.length} arquivos processados em ${outDir}/ (${(savedTotal / 1024).toFixed(1)} KB removidos)`);
