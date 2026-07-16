// Gera sitemap.xml + robots.txt no output do Storybook, a partir do story index.
//
// Uso (rodado automaticamente pelo build-storybook de cada stack):
//   node ../scripts/generate-seo-files.mjs --base https://react.norteardesign.com.br --out storybook-static
//
// - sitemap.xml: uma URL por página de docs (?path=/docs/<id>) + a raiz.
//   Stories de canvas ficam de fora — o conteúdo indexável são as docs pages.
// - robots.txt: Allow geral + linha Sitemap apontando pro sitemap gerado.
//
// TEMPLATE: forks devem trocar o --base no package.json de cada stack pro
// próprio domínio (ver BRAND-CUSTOMIZATION.md, etapa de Deploy).

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const base = arg('base', '').replace(/\/$/, '');
const outDir = arg('out', 'storybook-static');

if (!base) {
  console.error('generate-seo-files: --base <url> é obrigatório (ex: --base https://react.example.com)');
  process.exit(1);
}

const indexPath = path.join(outDir, 'index.json');
let index;
try {
  index = JSON.parse(await readFile(indexPath, 'utf8'));
} catch (e) {
  console.error(`generate-seo-files: não achei ${indexPath} — rode depois do 'storybook build'. (${e.message})`);
  process.exit(1);
}

const entries = Object.values(index.entries ?? {});
const docsIds = entries.filter((e) => e.type === 'docs').map((e) => e.id);

const today = new Date().toISOString().slice(0, 10);
const urls = [
  `${base}/`,
  ...docsIds.map((id) => `${base}/?path=/docs/${id}`),
];

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls.map((loc) => `  <url><loc>${loc.replace(/&/g, '&amp;')}</loc><lastmod>${today}</lastmod></url>`),
  '</urlset>',
  '',
].join('\n');

const robots = [
  'User-agent: *',
  'Allow: /',
  '',
  `Sitemap: ${base}/sitemap.xml`,
  '',
].join('\n');

await writeFile(path.join(outDir, 'sitemap.xml'), sitemap, 'utf8');
await writeFile(path.join(outDir, 'robots.txt'), robots, 'utf8');

console.log(`generate-seo-files: sitemap.xml (${urls.length} URLs) + robots.txt escritos em ${outDir}/ para ${base}`);
