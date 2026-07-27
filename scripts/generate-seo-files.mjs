// Gera sitemap.xml + robots.txt + llms.txt no output do Storybook, a partir
// do story index.
//
// Uso (rodado automaticamente pelo build-storybook de cada stack):
//   node ../scripts/generate-seo-files.mjs --base https://react.norteardesign.com.br --out storybook-static
//
// - sitemap.xml: uma URL por página de docs (?path=/docs/<id>) + a raiz.
//   Stories de canvas ficam de fora — o conteúdo indexável são as docs pages.
// - robots.txt: Allow geral (inclui crawlers de IA) + linha Sitemap.
// - llms.txt: índice em markdown para LLMs (padrão llmstxt.org) — título e
//   descrição de cada docs page, com descrições vindas de docs/shared/content.
//
// TEMPLATE: forks devem trocar o --base no package.json de cada stack pro
// próprio domínio (ver BRAND-CUSTOMIZATION.md, etapa de Deploy).

import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

// ── llms.txt — índice markdown para LLMs (https://llmstxt.org) ──────────────
// Descrições best-effort: mapeia o último segmento do título da story para o
// seo.description (pt-BR) do translations.json correspondente em docs/shared.
const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const contentDir = path.join(scriptsDir, '..', 'docs', 'shared', 'content');

const slugify = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function buildDescriptionMaps() {
  const byTitle = new Map();
  const byDir = new Map();
  async function scan(dir) {
    let dirents;
    try {
      dirents = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const d of dirents) {
      const p = path.join(dir, d.name);
      if (d.isDirectory()) {
        await scan(p);
      } else if (d.name === 'translations.json') {
        try {
          const t = JSON.parse(await readFile(p, 'utf8'))['pt-BR'];
          const desc = t?.seo?.description ?? t?.description;
          if (!desc) continue;
          if (t.title) byTitle.set(String(t.title).toLowerCase(), desc);
          byDir.set(path.basename(dir), desc);
        } catch {
          /* JSON inválido não bloqueia o build */
        }
      }
    }
  }
  await scan(contentDir);
  return { byTitle, byDir };
}

const { byTitle: descByTitle, byDir: descByDir } = await buildDescriptionMaps();
const docsEntries = entries.filter((e) => e.type === 'docs');
const host = new URL(base).hostname;

function findDescription(label) {
  const direct = descByTitle.get(label.toLowerCase());
  if (direct) return direct;
  // PascalCase → kebab (ContextMenu → context-menu) antes do slugify
  const slug = slugify(label.replace(/([a-z0-9])([A-Z])/g, '$1-$2'));
  if (descByDir.has(slug)) return descByDir.get(slug);
  // último recurso: diretório único cujo nome começa com o slug do rótulo
  const prefixed = [...descByDir.keys()].filter((k) => k.startsWith(slug));
  return prefixed.length === 1 ? descByDir.get(prefixed[0]) : undefined;
}

function llmsLine(entry) {
  const label = entry.title.split('/').pop();
  const desc = findDescription(label);
  const url = `${base}/?path=/docs/${entry.id}`;
  return desc ? `- [${label}](${url}): ${desc.replace(/<[^>]+>/g, '')}` : `- [${label}](${url})`;
}

const groups = new Map();
for (const e of docsEntries) {
  const section = e.title.includes('/') ? e.title.slice(0, e.title.lastIndexOf('/')) : 'Outros';
  if (!groups.has(section)) groups.set(section, []);
  groups.get(section).push(e);
}

const llms = [
  `# Nortear Design System (${host})`,
  '',
  '> Design system multi-stack: a mesma linguagem visual implementada em quatro tecnologias de front-end, compartilhando conteúdo, temas e tokens a partir de uma fonte única. Documentação em pt-BR (padrão), en e es via ?lang=.',
  '',
  ...[...groups.entries()].flatMap(([section, list]) => [
    `## ${section}`,
    '',
    ...list.map(llmsLine),
    '',
  ]),
].join('\n');

await writeFile(path.join(outDir, 'sitemap.xml'), sitemap, 'utf8');
await writeFile(path.join(outDir, 'robots.txt'), robots, 'utf8');
await writeFile(path.join(outDir, 'llms.txt'), llms, 'utf8');

console.log(`generate-seo-files: sitemap.xml (${urls.length} URLs) + robots.txt + llms.txt (${docsEntries.length} páginas) escritos em ${outDir}/ para ${base}`);
