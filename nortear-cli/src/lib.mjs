// Helpers compartilhados entre os comandos.
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// ── Console ─────────────────────────────────────────────────────────────────
export const c = {
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  dim:  (s) => `\x1b[2m${s}\x1b[0m`,
  ok:   (s) => `\x1b[32m${s}\x1b[0m`,
  warn: (s) => `\x1b[33m${s}\x1b[0m`,
  err:  (s) => `\x1b[31m${s}\x1b[0m`,
  info: (s) => `\x1b[36m${s}\x1b[0m`,
};

export function log(level, msg) {
  const tag = level === 'ok'   ? c.ok('  ✓')
            : level === 'warn' ? c.warn('  !')
            : level === 'err'  ? c.err('  ×')
            : level === 'add'  ? c.info('  +')
            : level === 'skip' ? c.dim('  ·')
            :                    '   ';
  console.log(`${tag} ${msg}`);
}

// ── Registry ────────────────────────────────────────────────────────────────
// Aceita URL HTTPS ou caminho de filesystem (absoluto/relativo) ou file:// URL.
export async function fetchRegistry(registry, name) {
  const isUrl = /^https?:\/\//.test(registry) || registry.startsWith('file://');
  if (isUrl) {
    const url = registry.endsWith('/') ? `${registry}${name}.json` : `${registry}/${name}.json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Falha ao buscar ${url}: ${res.status} ${res.statusText}`);
    return res.json();
  }
  // Filesystem
  const file = path.resolve(registry, `${name}.json`);
  try {
    const raw = await readFile(file, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    if (e.code === 'ENOENT') throw new Error(`Item '${name}' não encontrado em ${registry}.`);
    throw e;
  }
}

// ── nortear.json (config do projeto consumidor) ──────────────────────────────
export const DEFAULT_PATHS = {
  components: 'src/components/ui',
  styles:     'src/styles/components',
  lib:        'src/lib',
  tokens:     'src/styles/tokens',
  themes:     'src/styles/themes',
  vendor:     'src/styles/vendor',
};

export const DEFAULT_ENTRY_CSS = 'src/styles/globals.css';

export async function readConfig(root) {
  const file = path.resolve(root, 'nortear.json');
  try {
    return { ...JSON.parse(await readFile(file, 'utf8')), _file: file };
  } catch (e) {
    if (e.code === 'ENOENT') {
      throw new Error(`nortear.json não encontrado em ${root}. Rode 'nortear init' primeiro.`);
    }
    throw e;
  }
}

export async function writeConfig(root, cfg) {
  const file = path.resolve(root, 'nortear.json');
  const out = {
    $schema: 'https://nortear.dev/schema.json',
    registry: cfg.registry,
    paths:    cfg.paths,
    entryCss: cfg.entryCss,
  };
  await writeFile(file, JSON.stringify(out, null, 2) + '\n', 'utf8');
}

// ── Resolução de target a partir do `type` do arquivo no manifesto ──────────
// O `type` vem singular (component, style, theme); a chave de paths é plural
// para tipos com mais de um arquivo. Map abaixo cobre a tradução.
const TYPE_TO_PATH_KEY = {
  component: 'components',
  style:     'styles',
  lib:       'lib',
  tokens:    'tokens',
  theme:     'themes',
  vendor:    'vendor',
};

export function targetFor(file, paths) {
  const key = TYPE_TO_PATH_KEY[file.type];
  if (!key) throw new Error(`Tipo de arquivo desconhecido no manifesto: ${file.type}`);
  const dir = paths[key];
  if (!dir) throw new Error(`paths.${key} não definido em nortear.json`);
  return path.join(dir, file.name);
}

// Computa um path para @import "..." relativo ao entry CSS, a partir de um
// target já resolvido (project-relative). Resultado sempre começa com './'.
export function makeRelImport(targetPath, entryCssPath) {
  let rel = path.relative(path.dirname(entryCssPath), targetPath);
  rel = rel.split(path.sep).join('/');
  if (!rel.startsWith('.')) rel = `./${rel}`;
  return rel;
}

// ── Rewrite de imports @/ → caminhos relativos ──────────────────────────────
// Os manifestos saem do gerador com aliases `@/lib/X`, `@/components/ui/X`.
// Aqui, no install, reescrevemos para um caminho relativo entre o `target`
// deste arquivo e o destino real do alias no projeto do usuário.
const ALIAS_MAP = {
  '@/lib/':            'lib',
  '@/components/ui/':  'components',
  '@/styles/':         'styles',
};

export function rewriteImports(content, currentTarget, paths) {
  let out = content;
  for (const [alias, key] of Object.entries(ALIAS_MAP)) {
    const re = new RegExp(`['"\`]${escapeRe(alias)}([^'"\`]+)['"\`]`, 'g');
    out = out.replace(re, (_, rest) => {
      const targetAbs   = path.resolve(currentTarget);
      const aliasTarget = path.resolve(path.join(paths[key], rest));
      let rel = path.relative(path.dirname(targetAbs), aliasTarget);
      rel = rel.split(path.sep).join('/');
      if (!rel.startsWith('.')) rel = `./${rel}`;
      return `'${rel}'`;
    });
  }
  return out;
}
function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// ── FS ──────────────────────────────────────────────────────────────────────
export async function exists(p) {
  try { await access(p, constants.F_OK); return true; } catch { return false; }
}

export async function writeFileEnsuringDir(p, content, { overwrite = false } = {}) {
  await mkdir(path.dirname(p), { recursive: true });
  if (!overwrite && await exists(p)) return { skipped: true };
  await writeFile(p, content, 'utf8');
  return { skipped: false };
}

export async function appendIfMissing(filePath, line) {
  await mkdir(path.dirname(filePath), { recursive: true });
  let content = '';
  if (await exists(filePath)) content = await readFile(filePath, 'utf8');
  if (content.includes(line)) return { added: false };
  if (content.length && !content.endsWith('\n')) content += '\n';
  await writeFile(filePath, `${content}${line}\n`, 'utf8');
  return { added: true };
}

// ── Resolução recursiva de registryDependencies ──────────────────────────────
export async function resolveAll(registry, names) {
  const resolved = new Map();
  const queue = [...names];
  while (queue.length) {
    const n = queue.shift();
    if (resolved.has(n)) continue;
    const item = await fetchRegistry(registry, n);
    resolved.set(n, item);
    for (const dep of (item.registryDependencies || [])) {
      if (!resolved.has(dep)) queue.push(dep);
    }
  }
  // Ordem: deps antes do dependente (topológica simples por insertion).
  return [...resolved.values()];
}
