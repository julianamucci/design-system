#!/usr/bin/env node
// scripts/audit.mjs — Deterministic audit for the design-system pipeline.
//
// Uso:
//   node scripts/audit.mjs <slug> [--json]           // audit de um componente
//   node scripts/audit.mjs --all [--json]            // audit de todos
//   node scripts/audit.mjs <slug> --category <cat>   // só 1 categoria
//   node scripts/audit.mjs --contract-status [--json] // adoção do contrato de teste
//
// Saída default: texto legível (pipeline-friendly). --json retorna objeto estruturado
// compatível com FIXES-NEEDED.md.
//
// Categorias (equivalem aos 4 auditores, mas rodam em ms em vez de minutos):
//   - security      HTML dinâmico sem sanitize, href sem validação, XSS triviais
//   - performance   wildcard imports, hardcoded dimensions, style inline, top-level Date
//   - quality       play functions faltantes, seções faltantes, a11y.disable, tabelas irregulares
//   - analytics     eventos não tipados em AnalyticsEvents, track() em UI primitive
//                   + infra (slug-independente, chave "_infra" no output): observer de
//                   cliques montado incondicionalmente, demos auto-instrumentadas,
//                   páginas page-level sem tracking, texto traduzido em payload
//   - cross-stack   (depois de quality/security/performance/analytics) divergências restantes
//
// Princípio: tudo que é grep+regex determinístico vive aqui; tudo que exige julgamento
// fica nos agents. Isso corta ~80% dos tokens do pipeline `audit` e `new`.

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, relative, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');
const STACKS = ['react', 'vue', 'svelte', 'vanilla', 'angular'];

const stackDir = (stack) => `nortear-design-system-${stack}`;

// ─── Helpers ────────────────────────────────────────────────────────────────

function readFile(path) {
  try { return readFileSync(path, 'utf8'); } catch { return null; }
}

function grepFile(path, pattern, flags = 'g') {
  const content = readFile(path);
  if (!content) return [];
  const re = new RegExp(pattern, flags);
  const results = [];
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (re.test(lines[i])) {
      re.lastIndex = 0;
      results.push({ file: relative(ROOT, path), line: i + 1, text: lines[i].trim() });
    }
  }
  return results;
}

function walkDir(dir, ext) {
  if (!existsSync(dir)) return [];
  const out = [];
  const walk = (d) => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const full = join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile()) {
        if (!ext || ext.some(e => entry.name.endsWith(e))) out.push(full);
      }
    }
  };
  walk(dir);
  return out;
}

function globStack(stack, subpath, ext) {
  return walkDir(join(ROOT, stackDir(stack), 'src', subpath), ext);
}

/**
 * Custom properties realmente definidas — temas compartilhados, CSS `.nds-*` e
 * os styles de cada stack. Documentar um token que não existe manda o consumidor
 * sobrescrever uma variável inerte, e nada no runtime avisa.
 */
let _definedTokens = null;
function definedTokens() {
  if (_definedTokens) return _definedTokens;
  const files = [
    // docs/shared inteiro: tokens/, themes/, styles/nds/ e primitives/ — um
    // subconjunto aqui produz falso positivo em token que existe (foi o caso
    // de --spacing-4, definido em tokens/ e ausente em themes/).
    ...walkDir(join(ROOT, 'docs', 'shared'), ['.css']),
    ...STACKS.flatMap((s) => walkDir(join(ROOT, stackDir(s), 'src', 'styles'), ['.css'])),
  ];
  _definedTokens = new Set();
  for (const f of files) {
    for (const m of (readFile(f) || '').matchAll(/(--[a-z0-9-]+)\s*:/gi)) {
      _definedTokens.add(m[1].toLowerCase());
    }
  }
  return _definedTokens;
}

// Arquivos relevantes para um slug (UI primitive + docs page + stories).
function filesForSlug(slug, stack) {
  const Slug = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  const ext = {
    react: ['.tsx', '.ts'],
    vue: ['.vue', '.ts'],
    svelte: ['.svelte', '.ts'],
    vanilla: ['.ts'],
    angular: ['.ts'],
  }[stack];

  // `startsWith` puro casava slug com vizinho de nome mais longo: `alert` pegava
  // AlertDialogDocs, `toggle` pegava toggle-group.ts, `input` pegava
  // input-otp.ts. O componente era auditado contra o conteúdo do outro — e o
  // achado aparecia no slug errado. Depois do slug só pode vir `.` ou um sufixo
  // de sub-story conhecido.
  const s = slug.toLowerCase();
  const SUFFIX_RX = new RegExp(`^${s}(\\.|-(${STORY_VARIANT_SUFFIXES.join('|')})\\.)`);

  const uiFiles = globStack(stack, 'components/ui', ext).filter(f => {
    const n = basename(f).toLowerCase();
    // Normaliza a barra antes de comparar: no Windows o caminho vem com `\`, e
    // o teste por `/slug/` nunca casava. Efeito colateral silencioso e grande —
    // Svelte e Vue organizam por pasta, então TODO arquivo do componente que não
    // fosse `<slug>.<ext>` (wrappers, sub-componentes) ficava fora do audit
    // nessas duas stacks, para todas as regras que usam esta função.
    const caminho = f.toLowerCase().replace(/\\/g, '/');
    return SUFFIX_RX.test(n) || caminho.includes(`/${s}/`);
  });
  // Case-insensitive: o slug `input-otp` deriva `InputOtpDocs`, mas o arquivo
  // real é `InputOTPDocs` — sigla em caixa alta. Com match sensível a caixa, a
  // docs page inteira ficava invisível para TODAS as regras, e o componente
  // marcava zero por não ser lido, não por estar correto.
  const docsRx = new RegExp(`^${Slug}Docs\\.`, 'i');
  const docsFiles = globStack(stack, 'components/docs', ext).filter(f => docsRx.test(basename(f)));

  return { ui: uiFiles, docs: docsFiles, all: [...uiFiles, ...docsFiles] };
}

// ─── Categorias de audit ────────────────────────────────────────────────────

function auditSecurity(slug) {
  const violations = [];
  for (const stack of STACKS) {
    const { all } = filesForSlug(slug, stack);
    for (const file of all) {
      const content = readFile(file);
      if (!content) continue;

      // HTML dinâmico sem sanitize
      const patterns = [
        { name: 'dangerouslySetInnerHTML', re: /dangerouslySetInnerHTML\s*=\s*\{\{\s*__html:\s*([^}]+)\}\}/g, stacks: ['react'] },
        { name: 'v-html', re: /v-html\s*=\s*"([^"]+)"/g, stacks: ['vue'] },
        { name: '{@html}', re: /\{@html\s+([^}]+)\}/g, stacks: ['svelte'] },
        { name: '.innerHTML=', re: /\.innerHTML\s*=\s*([^;]+);/g, stacks: ['vanilla'] },
        // Angular: o binding [innerHTML] passa pelo DomSanitizer do framework,
        // ao contrário dos quatro acima. Exigimos DOMPurify assim mesmo — a
        // guideline 09 vale para as cinco stacks, e o SAST só reconhece o
        // sanitizador de taint quando a chamada está no próprio call site.
        // Sem isto, uma docs page Angular passaria no audit com a chamada
        // escondida atrás de um computed `safe*` e o SAST reportaria XSS.
        { name: '[innerHTML]', re: /\[innerHTML\]\s*=\s*"([^"]+)"/g, stacks: ['angular'] },
      ];
      for (const { name, re, stacks } of patterns) {
        if (!stacks.includes(stack)) continue;
        let m;
        while ((m = re.exec(content)) !== null) {
          const expr = m[1].trim();
          // Ignora SVG estático hardcoded e strings vazias/literais sem interpolação
          const isStaticSvg = /^['"`]<svg/.test(expr) || /^(CHEVRON|ICON|SVG)_/.test(expr);
          // String literal vazia ou só com texto (sem ${}, sem concat com vars) é inofensivo
          const isEmptyLiteral = /^['"`]\s*['"`]$/.test(expr) || /^['"`][^'"`$]*['"`]$/.test(expr);
          if (!/sanitize/i.test(expr) && !isStaticSvg && !isEmptyLiteral) {
            const line = content.slice(0, m.index).split('\n').length;
            violations.push({
              category: 'security',
              severity: 'high',
              slug, stack, file: relative(ROOT, file), line,
              rule: 'html_dynamic_unsanitized',
              message: `${name} sem sanitizeHtml(): ${expr.slice(0, 60)}`,
            });
          }
        }
      }

      // href dinâmico sem validação
      if (/href\s*=\s*\{[^}]*\b(url|src|input)\b[^}]*\}/.test(content) && !/isSafeUrl|sanitizeHref/i.test(content)) {
        violations.push({
          category: 'security', severity: 'medium', slug, stack,
          file: relative(ROOT, file), rule: 'href_unvalidated',
          message: 'href dinâmico sem isSafeUrl/sanitizeHref',
        });
      }
    }
  }
  return violations;
}

function auditPerformance(slug) {
  const violations = [];
  for (const stack of STACKS) {
    const { all, ui, docs } = filesForSlug(slug, stack);
    for (const file of all) {
      const content = readFile(file);
      if (!content) continue;

      // Wildcard imports
      const wildcardRe = /import\s+\*\s+as\s+\w+\s+from\s+['"]lucide-[^'"]+['"]/g;
      if (wildcardRe.test(content)) {
        violations.push({
          category: 'performance', severity: 'high', slug, stack,
          file: relative(ROOT, file), rule: 'wildcard_lucide_import',
          message: 'import * as from lucide-* (quebra tree-shaking)',
        });
      }

      // Dimensões hardcoded em cva (h-5..h-12, size-5..10)
      const cvaBlocks = content.match(/cva\([^)]*\{[^}]*\}[^)]*\)/gs) || [];
      for (const block of cvaBlocks) {
        if (/\bh-(5|6|7|8|9|10|11|12)\b|\bsize-(5|6|7|8|9|10)\b/.test(block)) {
          violations.push({
            category: 'performance', severity: 'medium', slug, stack,
            file: relative(ROOT, file), rule: 'hardcoded_dimension_in_cva',
            message: 'dimensões h-*/size-* hardcoded em cva (deveria usar token --height-*)',
          });
          break;
        }
      }

      // onMounted + onUnmounted aninhado em Vue (memory leak pattern)
      if (stack === 'vue') {
        if (/onMounted\s*\([^)]*\bonUnmounted\s*\(/s.test(content)) {
          violations.push({
            category: 'performance', severity: 'high', slug, stack,
            file: relative(ROOT, file), rule: 'onunmounted_nested',
            message: 'onUnmounted aninhado em onMounted (memory leak)',
          });
        }
      }

      // Top-level new Date() / CalendarDate() em stories
      if (/\.stories\.(ts|tsx)$/.test(file)) {
        // Se aparece fora de setup/render, é top-level
        const lines = content.split('\n');
        let insideSetupOrRender = 0;
        for (let i = 0; i < lines.length; i++) {
          const ln = lines[i];
          if (/\b(setup|render)\s*[\(\:]/.test(ln)) insideSetupOrRender++;
          if (insideSetupOrRender === 0 && /^\s*(const|let|var)\s+\w+\s*=\s*new\s+(Date|CalendarDate)\(/.test(ln)) {
            violations.push({
              category: 'performance', severity: 'low', slug, stack,
              file: relative(ROOT, file), line: i + 1, rule: 'top_level_date',
              message: `new Date()/CalendarDate() top-level: ${ln.trim().slice(0, 80)}`,
            });
          }
          // Balancear chaves para sair do escopo
          if (insideSetupOrRender > 0) {
            insideSetupOrRender += (ln.match(/\{/g) || []).length;
            insideSetupOrRender -= (ln.match(/\}/g) || []).length;
            if (insideSetupOrRender < 0) insideSetupOrRender = 0;
          }
        }
      }
    }
  }
  return violations;
}

function auditAnalytics(slug) {
  const violations = [];

  // 1. UI primitives não podem importar de @/lib/analytics
  for (const stack of STACKS) {
    const { ui } = filesForSlug(slug, stack);
    for (const file of ui) {
      if (/\.stories\.[tj]sx?$/.test(file)) continue;
      const content = readFile(file);
      if (!content) continue;
      if (/from\s+['"]@\/lib\/analytics['"]/.test(content) || /from\s+['"]\.\.\/\.\.\/lib\/analytics['"]/.test(content)) {
        violations.push({
          category: 'analytics', severity: 'high', slug, stack,
          file: relative(ROOT, file), rule: 'analytics_in_ui_primitive',
          message: 'UI primitive importa @/lib/analytics — tracking deve viver na camada de produto',
        });
      }
    }
  }

  // 2. Eventos documentados na seção analytics precisam estar tipados em
  //    AnalyticsEvents. Suporta os DOIS formatos da tabela:
  //    - flat:     "dismissKey": "alert_dismiss" (+ irmãs *Trigger/*Payload)
  //    - aninhado: "slider_change": { trigger, payload }
  //    (o regex antigo só via o flat — foi assim que 10 eventos aninhados
  //    ficaram fora do catálogo tipado sem nenhum check acusar)
  const trPath = join(ROOT, 'docs', 'shared', 'content', slug, 'translations.json');
  const trContent = readFile(trPath);
  if (trContent) {
    const eventsInTr = new Set();
    const EVENT_RX = /^[a-z]+_[a-z_]+$/;
    try {
      const json = JSON.parse(trContent);
      for (const locale of Object.keys(json)) {
        const analytics = json[locale]?.analytics;
        const table = analytics?.table ?? analytics;
        if (!table || typeof table !== 'object') continue;
        for (const [key, val] of Object.entries(table)) {
          if (typeof val === 'string' && EVENT_RX.test(val)) eventsInTr.add(val);
          else if (val && typeof val === 'object' && EVENT_RX.test(key)) eventsInTr.add(key);
        }
      }
    } catch { /* JSON inválido não é responsabilidade deste check */ }

    for (const stack of STACKS) {
      const analyticsPath = join(ROOT, stackDir(stack), 'src', 'lib', 'analytics.ts');
      const analytics = readFile(analyticsPath);
      if (!analytics) continue;
      for (const event of eventsInTr) {
        // Pula eventos de docs que são universais
        if (['docs_page_view', 'docs_section_viewed', 'language_switched', 'page_view'].includes(event)) continue;
        const typedRe = new RegExp(`^\\s*${event}\\s*:\\s*\\{`, 'm');
        if (!typedRe.test(analytics)) {
          violations.push({
            category: 'analytics', severity: 'medium', slug, stack,
            file: relative(ROOT, analyticsPath), rule: 'event_not_typed',
            message: `${event} mencionado em translations mas não está em AnalyticsEvents`,
          });
        }
      }
    }
  }

  return violations;
}

// ─── Analytics: texto traduzido em payload ──────────────────────────────────
// Payloads de analytics devem levar valores ESTÁVEIS (chave/slug do item,
// `side`, `variant`), nunca texto localizado: o mesmo evento viraria 3 valores
// distintos no GA4, um por locale, inutilizando a agregação.
// `page_title` é exceção — campo padrão do GA4, human-readable por definição,
// e o payload já carrega `locale`.

const I18N_CALL_RX = /\$?\b(t|tContent|tNav|tStore|tUi|tComp)\s*\(/;
const PAYLOAD_EXEMPT_KEYS = ['page_title'];

/** Extrai o payload (2º argumento) de cada `track(...)`, com balanceamento. */
function extractTrackPayloads(content) {
  const out = [];
  const re = /\btrack\s*\(/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    let i = m.index + m[0].length;
    let depth = 1;
    while (i < content.length && depth > 0) {
      const c = content[i];
      if (c === '(') depth++;
      else if (c === ')') depth--;
      i++;
    }
    const args = content.slice(m.index + m[0].length, i - 1);
    const comma = args.indexOf(',');
    if (comma < 0) continue;
    out.push({
      payload: args.slice(comma + 1),
      line: content.slice(0, m.index).split('\n').length,
      event: args.slice(0, comma).trim().replace(/['"]/g, '').slice(0, 40),
    });
  }
  return out;
}

function auditAnalyticsPayloads() {
  const violations = [];
  for (const stack of STACKS) {
    for (const file of globStack(stack, 'components/docs', null)) {
      const norm = file.replace(/\\/g, '/');
      if (/\.(stories|test|spec)\./.test(norm) || norm.endsWith('.mdx')) continue;
      const content = readFile(file);
      if (!content) continue;

      for (const { payload, line, event } of extractTrackPayloads(content)) {
        let p = payload;
        for (const key of PAYLOAD_EXEMPT_KEYS) {
          p = p.replace(new RegExp(`${key}\\s*:[^,}]*(,|)`, 'g'), '');
        }
        if (I18N_CALL_RX.test(p)) {
          violations.push({
            category: 'analytics', severity: 'medium', slug: '_infra', stack,
            file: relative(ROOT, file), line, rule: 'i18n_text_in_payload',
            message: `track('${event}') envia texto traduzido no payload — use valor estável (chave do item, side, variant)`,
          });
        }
      }
    }
  }
  return violations;
}

// ─── Analytics: infra (slug-independente) ───────────────────────────────────
// Regras POSITIVAS de instrumentação: verificam que o mecanismo de tracking
// está montado, não apenas que não há tracking errado. Sem elas, uma página com
// zero instrumentação passa limpa (grep não encontra o evento que nunca foi
// escrito) — foi assim que ⅔ das docs pages ficaram sem tracking de clique até
// o fix sistêmico (slug derivado da URL + observer sempre montado + demos
// auto-instrumentadas). Estas regras impedem a regressão daquele fix.

const PAGE_EXT = { react: 'tsx', vue: 'vue', svelte: 'svelte', vanilla: 'ts', angular: 'ts' };

function auditAnalyticsInfra() {
  const violations = [];

  for (const stack of STACKS) {
    const ext = PAGE_EXT[stack];
    const sectionsDir = join(ROOT, stackDir(stack), 'src', 'components', 'docs', 'shared', 'sections');

    // 1. DocsPageLayout monta o observer, e monta SEMPRE (slug é derivado do
    //    ?id= do iframe quando componentSlug não é passado).
    const layoutPath = join(sectionsDir, `DocsPageLayout.${ext}`);
    const layout = readFile(layoutPath);
    if (layout) {
      if (!/mountDocsTracking/.test(layout)) {
        violations.push({
          category: 'analytics', severity: 'high', slug: '_infra', stack,
          file: relative(ROOT, layoutPath), rule: 'tracking_mount_missing',
          message: 'DocsPageLayout não chama mountDocsTracking — nenhuma docs page desta stack terá tracking de clique',
        });
      } else if (/if\s*\(\s*!?\s*((props\.)?componentSlug|slug)\b/.test(layout)) {
        violations.push({
          category: 'analytics', severity: 'high', slug: '_infra', stack,
          file: relative(ROOT, layoutPath), rule: 'tracking_mount_conditional',
          message: 'mountDocsTracking condicionado ao componentSlug — o observer deve montar sempre (slug é derivado da URL do iframe)',
        });
      }
    }

    // 2. DocsDemonstration auto-instrumentada (data-track-container). No
    //    vanilla o atributo é setado via dataset.trackContainer.
    const demoPath = join(sectionsDir, `DocsDemonstration.${ext}`);
    const demo = readFile(demoPath);
    if (demo && !/data-track-container|dataset\.trackContainer/.test(demo)) {
      violations.push({
        category: 'analytics', severity: 'high', slug: '_infra', stack,
        file: relative(ROOT, demoPath), rule: 'demo_container_missing',
        message: 'DocsDemonstration sem data-track-container — demos de componente não são auto-instrumentadas',
      });
    }

    // 3. Toda página page-level (chama useSeoEffect/applySeo) precisa do
    //    observer de cliques: via DocsPageLayout ou mountDocsTracking direto.
    //    Pega foundation pages/renderers e páginas standalone (ThemeColors,
    //    Icons) que ficam fora do layout de componente.
    for (const file of globStack(stack, 'components/docs', null)) {
      const norm = file.replace(/\\/g, '/');
      if (/\.(stories|test|spec)\./.test(norm) || norm.endsWith('.mdx')) continue;
      if (norm.includes('/shared/sections/')) continue;
      const content = readFile(file);
      if (!content) continue;
      if (!/useSeoEffect|applySeo/.test(content)) continue;
      if (/DocsPageLayout|mountDocsTracking/.test(content)) continue;
      violations.push({
        category: 'analytics', severity: 'medium', slug: '_infra', stack,
        file: relative(ROOT, file), rule: 'page_untracked',
        message: 'página chama useSeoEffect/applySeo mas não monta o observer de cliques (usar DocsPageLayout ou mountDocsTracking direto)',
      });
    }
  }

  return violations;
}

// ─── Qualidade: substância das play functions e das stories ─────────────────
// A skill /quality verificava PRESENÇA de play function (contando `export const`
// contra `play:`). Um play que asserta algo sempre-verdadeiro passava nesse
// check — foi assim que 267 asserções no-op e 76 plays sem nenhum expect
// sobreviveram no repo. Estas regras olham o CONTEÚDO.

/** Asserções que não podem falhar — testam nada. */
const NOOP_ASSERTION_RX =
  /\.length\s*\)\s*\.toBeGreaterThanOrEqual\(\s*0\s*\)|(?:canvasElement|firstElementChild|container)\s*\)\s*\.(?:toBeTruthy|toBeDefined)\(\)/;

/** Prefixos de classe legítimos fora do vocabulário `nds-`. */
const ALLOWED_CLASS_RX = /^(nds-|sb-|storybook|dark$|light$)/;

/** Sufixos de arquivo de story que denotam VARIAÇÃO do mesmo componente. */
const STORY_VARIANT_SUFFIXES = [
  'variantes', 'estados', 'composicoes', 'modos', 'tamanhos',
  'layouts', 'configuracoes', 'tipos',
];

/** Divide o arquivo por `export const <Nome>` e devolve [nome, corpo]. */
function splitStories(content) {
  const out = [];
  const parts = content.split(/^export const (\w+)/m);
  for (let i = 1; i < parts.length; i += 2) out.push([parts[i], parts[i + 1] ?? '']);
  return out;
}

/**
 * Corpo do primeiro bloco `<nome>: {` do conteúdo, casando chaves. Usado para
 * isolar `argTypes` e `args` do meta sem depender de indentação.
 */
function blockBody(content, name) {
  // Casa chaves sobre o texto SEM comentários (stripComments preserva offsets,
  // então os índices continuam válidos no original): uma chave dentro de um
  // comentário desbalanceava a contagem e o bloco terminava no lugar errado.
  const limpo = stripComments(content);
  const start = limpo.search(new RegExp(`(^|[\\s,{])${name}\\s*:\\s*\\{`, 'm'));
  if (start < 0) return null;
  const open = limpo.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < limpo.length; i++) {
    const c = limpo[i];
    if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return content.slice(open + 1, i);
  }
  return null;
}

/**
 * Troca comentários por espaço, preservando os offsets.
 *
 * Sem isto, um comentário dentro de `argTypes` vira código para o walker: a
 * linha `// Estavam em args sem argType: ficavam fora da aba` registrava uma
 * chave fantasma chamada "argType", e a regra `argtype_without_arg` acusava um
 * control sem valor inicial que não existe. Crase em comentário era pior ainda
 * — abria uma string que só fechava linhas adiante, comendo o resto do objeto.
 */
function stripComments(src) {
  let out = '', inStr = null, i = 0;
  while (i < src.length) {
    const c = src[i];
    if (inStr) {
      out += c;
      if (c === '\\') { out += src[i + 1] ?? ''; i += 2; continue; }
      if (c === inStr) inStr = null;
      i++;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { inStr = c; out += c; i++; continue; }
    if (c === '/' && src[i + 1] === '/') {
      while (i < src.length && src[i] !== '\n') { out += ' '; i++; }
      continue;
    }
    if (c === '/' && src[i + 1] === '*') {
      const fim = src.indexOf('*/', i + 2);
      const ate = fim === -1 ? src.length : fim + 2;
      for (; i < ate; i++) out += src[i] === '\n' ? '\n' : ' ';
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

/**
 * Pares [chave, valor] de primeiro nível de um corpo de objeto literal.
 * Precisa varrer em profundidade: uma busca textual por `<chave>:` acharia a
 * ocorrência aninhada (`table: { defaultValue: … }`) antes da de primeiro nível.
 */
function topLevelEntries(bodyBruto) {
  if (!bodyBruto) return [];
  const body = stripComments(bodyBruto);
  const entries = [];
  let depth = 0, inStr = null, pendingKey = null, valueStart = 0;
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (inStr) { if (c === inStr && body[i - 1] !== '\\') inStr = null; continue; }
    if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
    if ('{(['.includes(c)) depth++;
    else if ('})]'.includes(c)) depth--;
    else if (c === ':' && depth === 0) {
      const before = body.slice(0, i).match(/([A-Za-z_$][\w$]*|"[^"]+"|'[^']+')\s*$/);
      if (before) {
        if (pendingKey) entries.push([pendingKey, body.slice(valueStart, i - before[0].length)]);
        pendingKey = before[1].replace(/['"]/g, '');
        valueStart = i + 1;
      }
    }
  }
  if (pendingKey) entries.push([pendingKey, body.slice(valueStart)]);
  return entries;
}

const topLevelKeys = (body) => topLevelEntries(body).map(([k]) => k);

/**
 * Aba "API Reference" e painel Controls saem do mesmo `argTypes` do meta.
 * Estas regras pegam as três formas de quebrá-los que apareceram na revisão do
 * Accordion — todas silenciosas: a página renderiza, o teste passa, e só quem
 * abre a aba percebe.
 */
function auditStoryApiReference(slug) {
  const violations = [];
  const CONTROLLESS_RX = /control\s*:\s*(false|\{\s*type\s*:\s*(false|null)\s*\})/;

  for (const stack of STACKS) {
    const metaRx = new RegExp(`^${slug.toLowerCase()}\\.stories\\.(ts|tsx)$`);
    const files = globStack(stack, 'components/ui', ['.ts', '.tsx']).filter((f) =>
      metaRx.test(basename(f).toLowerCase()),
    );

    for (const file of files) {
      const content = readFile(file);
      if (!content) continue;
      const rel = relative(ROOT, file);
      const meta = content.slice(0, content.search(/^export const /m) >>> 0 || content.length);

      const argTypesBody = blockBody(meta, 'argTypes');
      const argsBody = blockBody(meta, 'args');
      if (!argTypesBody && !argsBody) continue;

      const argTypeEntries = topLevelEntries(argTypesBody);
      const argTypes = argTypeEntries.map(([k]) => k);
      const args = topLevelKeys(argsBody);

      // 1. Em args mas não em argTypes → prop fora da tabela da API Reference.
      for (const key of args) {
        if (argTypes.includes(key)) continue;
        violations.push({
          category: 'quality', severity: 'low', slug, stack, file: rel,
          rule: 'arg_without_argtype',
          message: `"${key}" está em args sem entrada em argTypes — não aparece na aba API Reference`,
        });
      }

      // 2. argType com control mas sem valor inicial → control vazio no painel.
      for (const [key, entry] of argTypeEntries) {
        if (args.includes(key)) continue;
        if (CONTROLLESS_RX.test(entry)) continue; // control: false é documentação
        violations.push({
          category: 'quality', severity: 'low', slug, stack, file: rel,
          rule: 'argtype_without_arg',
          message: `argType "${key}" tem control mas nenhum valor inicial em args — o control aparece vazio`,
        });
      }

      // 3. Snippet estático: `docs.source.code` congela a caixa de código e ainda
      //    faz o skipSourceRender do renderer pular o gerador dinâmico.
      if (/source\s*:\s*\{[^}]*\bcode\s*:/.test(content)) {
        violations.push({
          category: 'quality', severity: 'medium', slug, stack, file: rel,
          rule: 'static_source_code',
          message: 'docs.source.code é string fixa — o snippet não acompanha os controls; usar docs.source.transform',
        });
      }
    }
  }

  return violations;
}

function auditStoryQuality(slug) {
  const violations = [];
  /** story → { stack → nº de expects } — base da comparação cross-stack. */
  const coverage = {};

  /**
   * `play: nomeDaFuncao` não tem expect no corpo da story — ele mora na função
   * referenciada, normalmente compartilhada por várias stories do arquivo.
   * Sem resolver, a regra acusava "play sem asserção" em story que verifica de
   * verdade: 9 falsos positivos só no button (Icon/IconSmall/IconLarge × 3
   * stacks), todos apontando para `iconAriaLabelPlay`, que assere getByRole +
   * toBeInTheDocument. Falso positivo aqui é pior que falta de cobertura —
   * leva alguém a "consertar" story que já estava certa.
   *
   * Devolve o corpo da story somado ao da função, para o expect ser contado uma
   * vez só, onde quer que esteja.
   */
  const corpoEfetivoDoPlay = (storyBody, fileContent) => {
    // Play inline começa com `async (` — o identificador só casa em referência.
    const ref = /\bplay:\s*([A-Za-z_$][\w$]*)\s*[,}\n]/.exec(storyBody);
    if (!ref) return storyBody;
    const decl = new RegExp(`\\b(?:const|let|var|function)\\s+${ref[1]}\\b`).exec(fileContent);
    if (!decl) return storyBody;               // definida fora do arquivo: não dá para resolver

    // A primeira `{` depois do `const` é a DESESTRUTURAÇÃO dos parâmetros
    // (`async ({ canvasElement, step }) =>`), não o corpo. Pegar aquela devolvia
    // `{ canvasElement, step }` — sem expect nenhum, e o falso positivo
    // sobrevivia à correção. O corpo começa depois do `=>`.
    const janela = fileContent.slice(decl.index, decl.index + 400);
    const seta = janela.indexOf('=>');
    let abre;
    if (seta !== -1) {
      abre = fileContent.indexOf('{', decl.index + seta + 2);
    } else {
      // `function nome(params) { … }`: pula a lista de parâmetros balanceando.
      let par = fileContent.indexOf('(', decl.index), d = 0, i = par;
      if (par === -1) return storyBody;
      for (; i < fileContent.length; i++) {
        if (fileContent[i] === '(') d++;
        else if (fileContent[i] === ')' && --d === 0) break;
      }
      abre = fileContent.indexOf('{', i);
    }
    if (abre === -1) return storyBody;
    let profundidade = 0;
    for (let i = abre; i < fileContent.length; i++) {
      const c = fileContent[i];
      if (c === '{') profundidade++;
      else if (c === '}' && --profundidade === 0) {
        return `${storyBody}\n${fileContent.slice(abre, i + 1)}`;
      }
    }
    return storyBody;
  };

  for (const stack of STACKS) {
    // Casa o slug EXATO seguido só de um sufixo de VARIAÇÃO conhecido. Um
    // `startsWith` (ou `-[a-z]+` genérico) atribuiria alert-dialog-estados ao
    // slug `alert`, reportando o mesmo arquivo sob dois componentes.
    const storyRx = new RegExp(
      `^${slug.toLowerCase()}(-(${STORY_VARIANT_SUFFIXES.join('|')}))?\\.stories\\.(ts|tsx)$`,
    );
    const storyFiles = globStack(stack, 'components/ui', ['.ts', '.tsx']).filter((f) =>
      storyRx.test(basename(f).toLowerCase()),
    );

    // Svelte não escreve markup no .stories.ts — ele delega para componentes
    // `<Slug><Caso>Story.svelte` no mesmo diretório. Sem varrer esses arquivos,
    // toda classe morta da stack Svelte fica invisível (foi assim que os
    // text-blue-500 do Accordion sobreviveram à regra). Só entram no check de
    // CLASSE: play/expect continuam morando no .stories.ts.
    const markupOnlyFiles = stack !== 'svelte' ? [] :
      globStack(stack, 'components/ui', ['.svelte']).filter((f) => {
        const n = basename(f).toLowerCase();
        return n.endsWith('story.svelte') && n.startsWith(slug.toLowerCase().replace(/-/g, ''));
      });

    for (const file of [...storyFiles, ...markupOnlyFiles]) {
      const content = readFile(file);
      if (!content) continue;
      const rel = relative(ROOT, file);

      for (const [name, body] of splitStories(content)) {
        if (!/\bplay:/.test(body)) continue;
        const corpoPlay = corpoEfetivoDoPlay(body, content);
        const expects = (corpoPlay.match(/\bexpect\(/g) || []).length;
        (coverage[name] ??= {})[stack] = expects;

        if (expects === 0) {
          violations.push({
            category: 'quality', severity: 'medium', slug, stack,
            file: rel, rule: 'play_without_assertion',
            message: `story ${name}: play function sem nenhum expect() — não verifica nada`,
          });
        } else if (NOOP_ASSERTION_RX.test(corpoPlay) && expects <= 2) {
          violations.push({
            category: 'quality', severity: 'medium', slug, stack,
            file: rel, rule: 'noop_assertion',
            message: `story ${name}: asserção que nunca falha (length>=0 / toBeTruthy no container) — substituir por verificação real`,
          });
        }
      }

      // Classes fora do vocabulário nds-* — resíduo da migração do Tailwind,
      // inertes em runtime. Ignora interpolação (`${...}`), que não é literal.
      const seen = new Set();
      for (const m of content.matchAll(/class(?:Name)?[:=]\s*["'`]([^"'`]+)["'`]/g)) {
        if (m[1].includes('${')) continue;
        for (const cls of m[1].split(/\s+/)) {
          if (!cls || ALLOWED_CLASS_RX.test(cls) || seen.has(cls)) continue;
          seen.add(cls);
          violations.push({
            category: 'quality', severity: 'low', slug, stack,
            file: rel, rule: 'legacy_class_in_story',
            message: `classe "${cls}" não existe no CSS nds-* — resíduo da migração, sem efeito em runtime`,
          });
        }
      }
    }
  }

  violations.push(...auditTextSurfaces(slug));
  violations.push(...auditNonexistentLibProps(slug));
  violations.push(...auditDeadClassInComponent(slug));
  violations.push(...auditUnknownClass(slug));
  violations.push(...auditExportSemStory(slug));

  // Contrato resolvido = todo item de testes.* está coberto ou dispensado com
  // motivo, nas 4 stacks. É o que autoriza aposentar a comparação por contagem.
  const idsContrato = contractIds(slug);
  const contratoResolvido = idsContrato.length > 0 && STACKS.every((stack) => {
    const { ui } = filesForSlug(slug, stack);
    const resolvidos = new Set();
    for (const file of ui.filter((f) => /\.stories\.(ts|tsx)$/.test(f))) {
      const content = readFile(file);
      if (!content) continue;
      const d = declaredCoverage(content);
      d.covers.forEach((c) => resolvidos.add(c));
      d.waived.forEach((_m, id) => resolvidos.add(id));
    }
    return idsContrato.every((id) => resolvidos.has(id));
  });

  // Mesma story com cobertura desproporcional entre stacks: uma testa de
  // verdade, outra tem placeholder. Foi o sintoma visível das no-op.
  for (const [name, byStack] of Object.entries(coverage)) {
    const counts = Object.values(byStack);
    if (counts.length < 2) continue;
    const min = Math.min(...counts);
    const max = Math.max(...counts);
    // Dois gatilhos. O piso (min<=1) pega placeholder puro. A RAZÃO pega o caso
    // que passou despercebido: um Playground com 12 asserções contra 21 em
    // outra stack — ambos acima do piso, e ainda assim cobertura desigual.
    //
    // A razão é SUPRIMIDA quando o componente já tem o contrato de teste
    // resolvido nas 4 stacks: ali a garantia é o `covers`, e a contagem por
    // story passa a medir DISTRIBUIÇÃO, não cobertura — o mesmo item pode ser
    // legitimamente coberto numa story diferente em cada stack (o Escape mora
    // no Playground em 3 e no Controlled no vanilla). O piso continua valendo:
    // story sem asserção nenhuma é placeholder, contrato ou não.
    const placeholder = min <= 1 && max >= 3;
    const desproporcional = !contratoResolvido && max >= 5 && min < max * 0.6;
    if (placeholder || desproporcional) {
      const detail = Object.entries(byStack).map(([s, n]) => `${s}:${n}`).join(' ');
      const motivo = placeholder
        ? 'a de menor contagem provavelmente é placeholder'
        : `a menor cobre ${Math.round((min / max) * 100)}% da maior`;
      violations.push({
        category: 'quality', severity: 'medium', slug, stack: 'cross-stack',
        file: `stories/${slug}`, rule: 'coverage_divergence',
        message: `story ${name} tem cobertura desproporcional entre stacks (${detail}) — ${motivo}`,
      });
    }
  }

  return violations;
}

/**
 * Frases que marcam a menção como REGISTRO da remoção, não instrução de uso:
 * "não recriar Tailwind aqui", "resíduo do shadcn", "props em nomenclatura
 * Radix que nenhuma lib atual expõe". Sem esta lista o check acusaria justamente
 * a documentação que existe para impedir o vocabulário de voltar.
 */
const NEGATED_MENTION_RX =
  /\bnunca\b|\bnão\s+(crie|recriar|recrie|usa|existe|use|confie)\b|\bnenhum[ao]?\b|proib|removid|saí?ram|saiu|deprecat|resíduo|herdad|inerte|em vez de|no lugar de/i;

/**
 * Libs e helpers que saíram do projeto e não devem mais ser ensinados.
 *
 * "Radix" tem DOIS donos hoje, e a regra precisa saber distinguir:
 *
 * - `@radix-ui` e "Radix" solto → a lib que saiu das quatro stacks de
 *   navegador. Ensinar isso faz componente novo nascer com API que ninguém
 *   expõe.
 * - **Radix NG** (`@radix-ng/primitives`) → a lib ATUAL do quinto stack, o
 *   Angular. É dependência declarada no `package.json` dele, e a dev-skill
 *   precisa ensiná-la.
 *
 * Sem o lookahead, a skill do Angular era acusada em toda auditoria de
 * componente — e regra que acusa o certo é regra que alguém desliga.
 */
const DEAD_LIB_RX = [
  { rx: /@radix-ui\b|\bradix\b(?![-\s]ng\b)/i, label: 'Radix' },
  { rx: /\bshadcn\b/i, label: 'shadcn' },
  { rx: /\bbasecoat\b/i, label: 'Basecoat' },
  { rx: /\btailwind\b/i, label: 'Tailwind' },
  { rx: /sanitize-html|\bsanitizeHtml\b/, label: 'wrapper sanitizeHtml (usar DOMPurify.sanitize no call site)' },
];

/**
 * Vocabulário morto na INFRA que gera código: skills, guidelines, refs de skill
 * e o CSS/tokens compartilhado.
 *
 * O `dead_lib_reference` por slug varre só `translations.json` e docs pages, e
 * por isso o vocabulário sumia do código e sobrevivia nas instruções que o
 * recriam: as 4 dev-skills ensinavam `import { sanitizeHtml } from
 * '@/lib/sanitize-html'`, um wrapper que não existe em nenhuma stack e que a
 * guideline 09 proíbe. Todo componente novo nasceria com ele.
 */
/**
 * `var(--token)` sem fallback apontando para custom property que não existe.
 *
 * A regra `unknown_token_reference` cobre só o que está DOCUMENTADO na tabela de
 * tokens do translations.json. O consumo no CSS ficava de fora, e é onde o erro
 * realmente aparece: `padding-inline: var(--spacing-3)` compila, não avisa nada e
 * simplesmente não aplica padding — a declaração inteira é descartada. Foi como o
 * footer e o gutter do CodeBlock nasceram sem respiro (`--spacing-3` não existe:
 * são 12px, e a escala é grid de 8).
 *
 * `var(--x, fallback)` não conta: o fallback é a intenção declarada.
 */
/**
 * Custom properties que NÃO nascem em CSS: as libs primitivas as escrevem inline
 * no elemento (posicionamento de popover, altura de viewport) e os nossos
 * componentes fazem o mesmo via style.setProperty. Sem isto o check acusaria o
 * contrato público das libs como token inexistente.
 */
// `--radix-` fica FORA de propósito, e a razão mudou de sentido: esta varredura
// lê o CSS COMPARTILHADO, consumido pelas quatro stacks de navegador — nelas o
// Radix saiu, e um `var(--radix-*)` sobrevivente ali é keyframe morto.
//
// O Angular usa Radix NG, que escreve variáveis próprias em runtime. Se o port
// dele passar a consumi-las, elas entram numa lista ESCOPADA àquela stack, não
// aqui: liberar o prefixo no compartilhado devolveria o silêncio ao keyframe
// morto das outras quatro.
const RUNTIME_TOKEN_PREFIXES = ['--reka-', '--bits-'];

/** Contrato de CSS vars do base-ui, que não usa prefixo. */
const BASE_UI_TOKENS = new Set([
  '--positioner-width', '--positioner-height',
  '--popup-width', '--popup-height',
  '--available-width', '--available-height',
  '--transform-origin', '--anchor-width', '--anchor-height',
]);

/** Tokens que o nosso próprio código define em runtime (style.setProperty). */
let _runtimeTokens = null;
function runtimeTokens() {
  if (_runtimeTokens) return _runtimeTokens;
  _runtimeTokens = new Set();
  const files = STACKS.flatMap((st) =>
    walkDir(join(ROOT, stackDir(st), 'src'), ['.ts', '.tsx', '.vue', '.svelte']),
  );
  for (const f of files) {
    const c = readFile(f) || '';
    for (const m of c.matchAll(/setProperty\(\s*['"`](--[a-z0-9-]+)/gi)) {
      _runtimeTokens.add(m[1].toLowerCase());
    }
    // style={{ '--x': ... }} / style="--x: ..."
    for (const m of c.matchAll(/['"`]?(--[a-z0-9-]+)['"`]?\s*:\s*[^;}]/gi)) {
      _runtimeTokens.add(m[1].toLowerCase());
    }
  }
  return _runtimeTokens;
}

/**
 * Classes `.nds-*` que algum CSS do projeto realmente define.
 *
 * `ALLOWED_CLASS_RX` valida só o PREFIXO: qualquer `nds-` passa, exista a regra
 * ou não. Classe inexistente é no-op silencioso — o TypeScript não vê, o teste
 * não vê, o axe não vê, e o elemento simplesmente não é pintado. Foi assim que
 * `nds-skeleton-line` e `nds-skeleton-avatar` entraram em snippet de
 * documentação: nomes plausíveis, nenhuma regra por trás.
 *
 * Lê o CSS compartilhado (fonte do vocabulário) e o de cada stack, porque uma
 * stack pode definir regra própria antes de promovê-la ao compartilhado.
 */
let _ndsClasses = null;
function ndsClasses() {
  if (_ndsClasses) return _ndsClasses;
  _ndsClasses = new Set();
  const files = [
    ...walkDir(join(ROOT, 'docs', 'shared', 'styles'), ['.css']),
    ...STACKS.flatMap((s) => walkDir(join(ROOT, stackDir(s), 'src', 'styles'), ['.css'])),
  ];
  for (const f of files) {
    const c = readFile(f) || '';
    for (const m of c.matchAll(/\.(nds-[a-z0-9-]+)/g)) _ndsClasses.add(m[1]);
  }
  return _ndsClasses;
}

/**
 * Extrai classes `nds-*` de um trecho de código.
 *
 * Só o que está dentro de `class="…"` / `className="…"` / `class: '…'`. NOME DE
 * TAG NÃO É CLASSE: `<nds-dialog>` é seletor de componente do Angular e apareceria
 * como falso positivo numa varredura solta por `nds-[a-z-]+`.
 *
 * Interpolação (`${…}`, `{{ … }}`) é ignorada: o valor não é literal e a classe
 * final não está no arquivo.
 */
function ndsClassesUsadas(content) {
  const out = new Set();
  for (const m of content.matchAll(/\bclass(?:Name)?\s*[:=]\s*["'`]([^"'`]+)["'`]/g)) {
    if (m[1].includes('${') || m[1].includes('{{')) continue;
    for (const cls of m[1].split(/\s+/)) {
      if (cls.startsWith('nds-')) out.add(cls);
    }
  }
  return out;
}

/** Todos os valores string de um JSON, já desescapados, em lista plana. */
function stringsDoJson(content) {
  let json;
  try { json = JSON.parse(content); } catch { return []; }
  const out = [];
  const walk = (v) => {
    if (typeof v === 'string') { out.push(v); return; }
    if (v && typeof v === 'object') for (const x of Object.values(v)) walk(x);
  };
  walk(json);
  return out;
}

/**
 * Classe `nds-*` usada mas não definida em CSS nenhum.
 *
 * Varre o conteúdo COMPARTILHADO (os snippets `*Code` do translations.json, que
 * o consumidor copia) e os arquivos de cada stack. O snippet é o caso mais caro:
 * ninguém executa um bloco de código de documentação, então o erro só aparece
 * quando alguém copia e não entende por que nada acontece.
 */
function auditUnknownClass(slug) {
  const violations = [];
  const conhecidas = ndsClasses();

  const alvos = [
    { file: join(ROOT, 'docs', 'shared', 'content', slug, 'translations.json'), stack: 'shared' },
    ...STACKS.flatMap((s) => {
      const { all } = filesForSlug(slug, s);
      return all.map((file) => ({ file, stack: s }));
    }),
  ];

  for (const { file, stack } of alvos) {
    const content = readFile(file);
    if (!content) continue;
    const rel = relative(ROOT, file);
    // JSON guarda o snippet com aspas escapadas (`class=\"nds-x\"`), então o
    // regex de atributo não casa no texto cru. Parseia e varre os valores já
    // desescapados — sem isto o alvo mais caro (o snippet que o consumidor
    // copia) ficaria justamente de fora.
    const trechos = rel.endsWith('.json') ? stringsDoJson(content) : [content];
    const usadas = new Set();
    for (const trecho of trechos) {
      for (const cls of ndsClassesUsadas(trecho)) usadas.add(cls);
    }
    for (const cls of usadas) {
      if (conhecidas.has(cls)) continue;
      violations.push({
        category: 'quality', severity: 'medium', slug, stack,
        file: rel, rule: 'unknown_class_reference',
        message: `classe "${cls}" não é definida por nenhum CSS do projeto — não pinta nada em runtime`,
      });
    }
  }

  return violations;
}

function auditCssTokenUsage() {
  const violations = [];
  const known = definedTokens();
  const runtime = runtimeTokens();
  const files = [
    ...walkDir(join(ROOT, 'docs', 'shared'), ['.css']),
    ...STACKS.flatMap((s) => walkDir(join(ROOT, stackDir(s), 'src', 'styles'), ['.css'])),
  ];

  for (const file of files) {
    const content = readFile(file);
    if (!content) continue;
    const rel = relative(ROOT, file);
    // Remove comentários antes de varrer: a menção dentro de /* */ costuma ser o
    // aviso de que o token NÃO existe ("--spacing-3 (12px) NÃO existe — não usar").
    const lines = content.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).split('\n');
    const seen = new Set();

    // Token inexistente COM fallback: em geral intencional — exceto quando o
    // nome é um quase-acerto de um token que existe (--font-weight-semibold vs
    // --font-weight-semi-bold). Aí é typo: o fallback mascara e a propriedade
    // fica desconectada do tema para sempre, sem sintoma nenhum.
    const knownNorm = new Map();
    for (const t of known) knownNorm.set(t.replace(/-/g, ''), t);

    lines.forEach((line, i) => {
      for (const m of line.matchAll(/var\(\s*(--[a-z0-9-]+)\s*,/gi)) {
        const token = m[1].toLowerCase();
        if (known.has(token) || seen.has(token)) continue;
        const canonico = knownNorm.get(token.replace(/-/g, ''));
        if (!canonico) continue;
        seen.add(token);
        violations.push({
          category: 'quality', severity: 'medium', slug: '_infra', stack: 'shared',
          file: rel, line: i + 1, rule: 'token_typo_masked_by_fallback',
          message: `var(${token}, …) — o token não existe; o definido é ${canonico}. O fallback mascara o typo e a propriedade nunca segue o tema`,
        });
      }
    });

    lines.forEach((line, i) => {
      // Sem vírgula dentro do var(): com fallback, a ausência é intencional.
      for (const m of line.matchAll(/var\(\s*(--[a-z0-9-]+)\s*\)/gi)) {
        const token = m[1].toLowerCase();
        if (known.has(token) || seen.has(token)) continue;
        if (runtime.has(token) || BASE_UI_TOKENS.has(token)) continue;
        if (RUNTIME_TOKEN_PREFIXES.some((pre) => token.startsWith(pre))) continue;
        seen.add(token);
        violations.push({
          category: 'quality', severity: 'medium', slug: '_infra', stack: 'shared',
          file: rel, line: i + 1, rule: 'undefined_token_in_css',
          message: `var(${token}) sem fallback, e ${token} não é definido em nenhum CSS — a declaração é descartada em silêncio`,
        });
      }
    });
  }

  return violations;
}

/**
 * Token declarado em `tokens.css` que ninguém referencia.
 *
 * É o espelho de `undefined_token_in_css`, e pega o defeito oposto: a variável
 * existe, aparece no export do Figma, é lida como promessa por quem porta o
 * sistema para outra plataforma — e não move pixel nenhum. Foi assim que
 * `--spacing-btn-x*` sobreviveu valendo 10px nas três densidades, e que a
 * escada de altura fixa continuou publicada depois que a regra do projeto
 * passou a proibir altura fixa em componente com texto.
 *
 * Órfão não é sempre resíduo: pode ser adoção pendente (o CSS crava o valor em
 * vez de ler o token). A saída é sempre uma das duas — adotar ou remover. Para
 * degrau de régua que existe para a escala ficar completa, declare o motivo:
 *
 *   --spacing-px: 1px;  \/* audit-ignore: orphan-token — degrau da régua *\/
 */
function auditOrphanTokens() {
  const violations = [];
  const arquivo = join(ROOT, 'docs', 'shared', 'tokens', 'tokens.css');
  const fonte = readFile(arquivo);
  if (!fonte) return violations;

  // Corpus de consumo: todo CSS e todo código de stack que possa ler o token.
  const consumidores = [
    ...walkDir(join(ROOT, 'docs', 'shared'), ['.css', '.ts', '.tsx']),
    ...STACKS.flatMap((s) => walkDir(join(ROOT, stackDir(s), 'src'), ['.css', '.ts', '.tsx', '.vue', '.svelte'])),
  ];
  let corpus = '';
  for (const f of consumidores) {
    if (f === arquivo) continue;
    corpus += readFile(f) || '';
  }
  // O próprio tokens.css conta como consumidor: um token pode alimentar outro
  // (--text-h4 lê --text-p), e aí ele não é órfão.
  const derivacoes = fonte;

  const linhas = fonte.split('\n');
  linhas.forEach((linha, i) => {
    const m = /^\s*(--[a-z0-9-]+)\s*:/i.exec(linha);
    if (!m) return;
    if (/audit-ignore:\s*orphan-token\b/.test(linha)) return;
    const token = m[1].toLowerCase();
    const usado =
      corpus.includes(`var(${token})`) ||
      corpus.includes(`var(${token},`) ||
      corpus.includes(`var( ${token}`) ||
      derivacoes.split(`var(${token}`).length > 1;
    if (usado) return;
    violations.push({
      category: 'quality', severity: 'medium', slug: '_infra', stack: 'shared',
      file: relative(ROOT, arquivo), line: i + 1, rule: 'orphan_token',
      message: `${token} é declarado e nunca referenciado por var() — adote-o onde o CSS crava o valor, ou remova. Degrau de régua declara o motivo com audit-ignore: orphan-token`,
    });
  });

  return violations;
}

/**
 * `font-size` literal cujo valor É um degrau da escada de controle.
 *
 * A regra é deliberadamente estreita. Ela não persegue todo literal — valor
 * fora da escada (13px, 12.8px) é decisão de design, não regressão. O que ela
 * pega é o caso em que alguém escreve `0.875rem` tendo `--text-control` ali do
 * lado: compila, renderiza igual, e silenciosamente tira aquele componente da
 * base de tipografia que o usuário escolhe na toolbar. Foi assim que 168
 * declarações ficaram fora da escada sem ninguém notar.
 *
 * Exceção legítima declara o motivo na própria linha:
 *   font-size: 0.875rem;  \/* audit-ignore: type-ramp — motivo *\/
 */
function auditTypeRamp() {
  const violations = [];
  // px @ base 16 → token
  const DEGRAUS = {
    '0.625rem': '--text-control-xs',
    '10px': '--text-control-xs',
    '0.75rem': '--text-control-sm',
    '12px': '--text-control-sm',
    '0.875rem': '--text-control',
    '14px': '--text-control',
    '1rem': '--text-control-lg',
    '16px': '--text-control-lg',
    '1.125rem': '--text-control-xl',
    '18px': '--text-control-xl',
  };

  const arquivos = [
    ...walkDir(join(ROOT, 'docs', 'shared', 'styles'), ['.css']),
    ...STACKS.flatMap((s) => walkDir(join(ROOT, stackDir(s), 'src', 'styles'), ['.css'])),
  ];

  for (const file of arquivos) {
    // typography.css É a escada de prosa: os literais dela são a definição.
    if (basename(file) === 'typography.css') continue;
    const content = readFile(file);
    if (!content) continue;
    const rel = relative(ROOT, file);
    content.split('\n').forEach((linha, i) => {
      if (/audit-ignore:\s*type-ramp\b/.test(linha)) return;
      const m = /font-size:\s*([0-9.]+(?:rem|px))\s*;/.exec(linha);
      if (!m) return;
      const token = DEGRAUS[m[1]];
      if (!token) return;
      violations.push({
        category: 'quality', severity: 'medium', slug: '_infra', stack: 'shared',
        file: rel, line: i + 1, rule: 'type_ramp_literal',
        message: `font-size: ${m[1]} é exatamente ${token} — use o token, senão o componente para de acompanhar a base de tipografia escolhida`,
      });
    });
  }

  return violations;
}

// ─── Play idempotente ───────────────────────────────────────────────────────
//
// O painel Interactions REEXECUTA a play no mesmo DOM — não remonta. O vitest
// remonta a cada teste, então a suíte fica verde enquanto o painel falha: a
// suíte não consegue ver este defeito, e por isso ele precisa de regra.
//
// Assinatura: clique seguido de asserção de ESTADO no mesmo alvo. Na segunda
// rodada o clique parte do estado que a primeira deixou, alterna a partir dele e
// inverte o resultado. A saída é o par idempotente (`abrir`/`fechar`): clicar só
// quando o estado atual não é o desejado.
//
// Clique com `pointerEventsCheck` fica de fora: é o clique no elemento
// desabilitado, que não muda de estado em rodada nenhuma.
const ESTADO_ATTR_RX = /aria-expanded|aria-checked|aria-pressed|aria-selected|aria-current|data-state/;

function auditPlayIdempotente(slug) {
  const violations = [];

  for (const stack of STACKS) {
    const storyRx = new RegExp(
      `^${slug.toLowerCase()}(-(${STORY_VARIANT_SUFFIXES.join('|')}))?\\.stories\\.(ts|tsx)$`,
    );
    const files = globStack(stack, 'components/ui', ['.ts', '.tsx']).filter((f) =>
      storyRx.test(basename(f).toLowerCase()),
    );

    for (const file of files) {
      const content = readFile(file);
      if (!content) continue;
      const linhas = content.split('\n');

      linhas.forEach((linha, i) => {
        const m = linha.match(/await userEvent\.click\(([^;]+?)\)\s*;/);
        if (!m) return;
        if (/!==/.test(linha)) return;              // corpo do próprio helper
        if (/pointerEventsCheck/.test(linha)) return; // clique em desabilitado
        const alvo = m[1].split(',')[0].trim();
        if (!alvo || alvo.startsWith('{')) return;

        const janela = linhas.slice(i + 1, i + 6).join('\n');
        const alvoRx = alvo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const asserta = new RegExp(
          `expect\\(${alvoRx}\\)[\\s\\S]{0,80}?toHaveAttribute\\(['"](${ESTADO_ATTR_RX.source})`,
        );
        if (!asserta.test(janela)) return;

        violations.push({
          category: 'quality', severity: 'medium', slug, stack,
          file: relative(ROOT, file), line: i + 1, rule: 'play_nao_idempotente',
          message: `clique cego em ${alvo} seguido de asserção de estado — no replay do painel Interactions o clique parte do estado da rodada anterior e inverte o resultado. Use o par abrir/fechar, que só clica quando o estado atual não é o desejado`,
        });
      });
    }
  }

  return violations;
}

// ─── SEO/a11y: idioma do documento (slug-independente) ──────────────────────
//
// Regra POSITIVA de instrumentação, no mesmo espírito das de analytics: grep não
// encontra o que nunca foi escrito. `useSeoEffect` resolve o alvo das metatags
// como `isIframe ? window.parent.document : document` — correto para title, OG e
// JSON-LD, que pertencem à página hospedeira, e errado para `lang`, que pertence
// ao documento que o leitor de tela lê. Dentro do Storybook esse documento é o
// `iframe.html`, servido como <html lang="en">, e nada o atualiza: a prosa em
// português sai com pronúncia inglesa. WCAG 3.1.1, nível A.
//
// A regra passa quando existe pelo menos UMA escrita de `documentElement.lang`
// fora do alvo do iframe — normalmente `document.documentElement.lang`, ao lado
// da do pai.
//
// Isto é reconhecimento de padrão, e padrão se burla: `[targetDoc]` numa lista
// passaria. A prova de comportamento é a asserção na suíte de fumaça, que roda
// DENTRO do iframe e compara o valor real. Por isso a segunda metade da regra
// cobra que essa asserção exista — apagar o teste vira violação.
function auditDocumentLang() {
  const violations = [];

  for (const stack of STACKS) {
    const file = join(ROOT, stackDir(stack), 'src', 'lib', 'use-seo.ts');
    const content = readFile(file);
    if (!content) continue;
    const rel = relative(ROOT, file);
    const linhas = content.split('\n');

    const escritas = linhas
      .map((l, i) => ({ l, i }))
      .filter(({ l }) => /\.documentElement\.lang\s*=/.test(l));

    if (escritas.length === 0) {
      violations.push({
        category: 'quality', severity: 'high', slug: '_infra', stack,
        file: rel, line: 1, rule: 'document_lang_ausente',
        message: 'useSeoEffect não escreve documentElement.lang — sem idioma, o leitor de tela pronuncia o conteúdo pelas regras do idioma do documento hospedeiro (WCAG 3.1.1, nível A)',
      });
      continue;
    }

    // O identificador que recebe o documento do iframe: `const targetDoc = isIframe ? window.parent.document : document`
    const alvo = content.match(/const\s+(\w+)\s*=\s*[^;\n]*window\.parent\.document[^;\n]*/);
    if (!alvo) continue; // sem resolução condicional, a escrita é no próprio documento

    const soNoPai = escritas.every(({ l }) =>
      new RegExp(`\\b${alvo[1]}\\.documentElement\\.lang\\s*=`).test(l),
    );
    if (soNoPai) {
      violations.push({
        category: 'quality', severity: 'high', slug: '_infra', stack,
        file: rel, line: escritas[0].i + 1, rule: 'document_lang_so_no_pai',
        message: `documentElement.lang só é escrito em ${alvo[1]} (o manager do Storybook). O leitor de tela lê o iframe, que continua no idioma do template — escreva nos dois documentos (WCAG 3.1.1, nível A)`,
      });
    }
  }

  // A prova de comportamento: a fumaça monta toda docs page dentro do iframe,
  // então é lá que o valor real do idioma pode ser conferido.
  for (const stack of STACKS) {
    const dir = join(ROOT, stackDir(stack), 'src', 'components', 'docs');
    const smoke = walkDir(dir, ['.ts', '.tsx']).find((f) => /docs-smoke\.stories\./.test(f.replace(/\\/g, '/')));
    if (!smoke) continue;
    const content = readFile(smoke);
    if (content && !/documentElement\.lang/.test(content)) {
      violations.push({
        category: 'quality', severity: 'high', slug: '_infra', stack,
        file: relative(ROOT, smoke), line: 1, rule: 'document_lang_sem_prova',
        message: 'a suíte de fumaça não confere documentElement.lang — sem essa asserção, o idioma do iframe volta a quebrar sem teste vermelho (WCAG 3.1.1, nível A)',
      });
    }
  }

  return violations;
}

function auditDeadLibInfra() {
  const violations = [];
  const targets = [
    ...walkDir(join(ROOT, '.claude', 'commands'), ['.md']),
    ...walkDir(join(ROOT, 'docs', 'shared', 'guidelines'), ['.md']),
    ...walkDir(join(ROOT, 'docs', 'shared', 'skill-refs'), ['.md']),
    ...walkDir(join(ROOT, 'docs', 'shared', 'tokens'), ['.css']),
    ...walkDir(join(ROOT, 'docs', 'shared', 'themes'), ['.css']),
    ...walkDir(join(ROOT, 'docs', 'shared', 'styles'), ['.css']),
  ];

  for (const file of targets) {
    const content = readFile(file);
    if (!content) continue;
    const rel = relative(ROOT, file);
    // `tw-compat.css` é a ponte declarada de compatibilidade: nomear o
    // vocabulário antigo é a razão de ela existir.
    if (/tw-compat\.css$/.test(rel)) continue;
    // Escape hatch explícito, para a dívida ficar visível NO arquivo em vez de
    // numa exceção escondida aqui. Exige motivo na mesma linha.
    if (/audit-ignore:\s*dead-lib\b/.test(content)) continue;
    const lines = content.split('\n');

    for (const { rx, label } of DEAD_LIB_RX) {
      // Janela de 3 linhas: a menção e a ressalva costumam estar em linhas
      // diferentes, porque o texto quebra ("...nomenclatura Radix/shadcn\n(`asChild`,
      // `forceMount`) que nenhuma lib atual expõe"). Testar só a linha do match
      // acusava exatamente a frase escrita para proibir o vocabulário.
      const hit = lines.findIndex((l, i) =>
        rx.test(l) && !NEGATED_MENTION_RX.test(lines.slice(Math.max(0, i - 1), i + 2).join(' ')),
      );
      if (hit === -1) continue;
      violations.push({
        category: 'quality', severity: 'medium', slug: '_infra', stack: 'shared',
        file: rel, line: hit + 1, rule: 'dead_lib_in_infra',
        message: `menciona "${label}" — a infra que gera código não deve ensinar o que saiu do projeto`,
      });
    }
  }

  return violations;
}

/**
 * Taxonomia das seções Variantes / Estados / Composições.
 * Regra em docs/shared/guidelines/14-taxonomia-secoes.md.
 *
 * O script confere FORMA e CONSISTÊNCIA; o que entra em cada seção exige
 * julgamento e fica com o agente. Medido antes destas regras existirem: 22% das
 * composições do repo eram duplicata da própria seção Variantes.
 */
/**
 * Ids do contrato de teste declarados no conteúdo compartilhado:
 * `testes.functional.item1`, `testes.accessibility.item3`, `testes.visual.item2`.
 * É a lista do que TEM de ser verificado — igual para as 4 stacks, porque
 * descreve comportamento observável de fora, não implementação.
 */
function contractIds(slug) {
  const path = join(ROOT, 'docs', 'shared', 'content', slug, 'translations.json');
  const raw = readFile(path);
  if (!raw) return [];
  let json;
  try { json = JSON.parse(raw); } catch { return []; }
  const testes = json['pt-BR']?.testes;
  if (!testes) return [];

  const ids = [];
  for (const grupo of ['functional', 'accessibility', 'visual']) {
    for (const key of Object.keys(testes[grupo] ?? {})) {
      if (/^item\d+$/.test(key)) ids.push(`${grupo}.${key}`);
    }
  }
  return ids;
}

/** `covers: ['a.item1', 'b.item2']` e `coversNotApplicable: { 'a.item3': '…' }`. */
function declaredCoverage(content) {
  const covers = new Set();
  const waived = new Map();

  for (const m of content.matchAll(/covers\s*:\s*\[([\s\S]*?)\]/g)) {
    for (const q of m[1].matchAll(/['"]([a-z]+\.item\d+)['"]/g)) covers.add(q[1]);
  }
  for (const m of content.matchAll(/coversNotApplicable\s*:\s*\{([\s\S]*?)\}/g)) {
    for (const q of m[1].matchAll(/['"]([a-z]+\.item\d+)['"]\s*:\s*['"]([^'"]*)['"]/g)) {
      waived.set(q[1], q[2]);
    }
  }
  return { covers, waived };
}

/**
 * Cobertura por CONTRATO, não por contagem de asserção.
 *
 * Contagem é proxy ruim: o Playground do alert-dialog tinha 12 asserções numa
 * stack e 21 em outra, ambas acima de qualquer piso razoável, e a diferença só
 * apareceu quando a dona olhou a aba Interactions. Aqui cada story declara
 * QUAIS itens do contrato ela verifica, e a comparação passa a ser entre o que
 * o conteúdo compartilhado exige e o que cada stack reivindica.
 *
 * ADOÇÃO É OPT-IN POR COMPONENTE: enquanto nenhuma story do slug declarar
 * `covers`, a regra fica calada. Assim a regra entra sem inundar os 48
 * componentes de violação — cada um passa a ser cobrado quando adota.
 * Use `--contract-status` para ver quem ainda não adotou.
 */
function auditContractCoverage(slug) {
  const ids = contractIds(slug);
  if (ids.length === 0) return [];

  const porStack = {};
  for (const stack of STACKS) {
    const { ui } = filesForSlug(slug, stack);
    const stories = ui.filter((f) => /.stories.(ts|tsx)$/.test(f));
    const covers = new Set();
    const waived = new Map();
    for (const file of stories) {
      const content = readFile(file);
      if (!content) continue;
      const d = declaredCoverage(content);
      d.covers.forEach((c) => covers.add(c));
      d.waived.forEach((motivo, id) => waived.set(id, motivo));
    }
    porStack[stack] = { covers, waived };
  }

  const adotaram = STACKS.filter((s) => porStack[s].covers.size > 0);
  if (adotaram.length === 0) return [];

  const violations = [];
  const validos = new Set(ids);

  for (const stack of STACKS) {
    const { covers, waived } = porStack[stack];

    // Id que não existe no contrato: a declaração não cobre nada e ninguém
    // percebe. Sem este check, um typo vira cobertura fantasma.
    for (const id of [...covers, ...waived.keys()]) {
      if (!validos.has(id)) {
        violations.push({
          category: 'quality', severity: 'medium', slug, stack,
          file: `stories/${slug}`, rule: 'contract_unknown_id',
          message: `declara cobertura de "${id}", que não existe em testes.* do conteúdo compartilhado`,
        });
      }
    }

    if (covers.size === 0) {
      violations.push({
        category: 'quality', severity: 'medium', slug, stack,
        file: `stories/${slug}`, rule: 'contract_divergent',
        message: `outras stacks declaram cobertura de contrato e esta não declara nenhuma (${adotaram.join(', ')} adotaram)`,
      });
      continue;
    }

    for (const id of ids) {
      if (covers.has(id) || waived.has(id)) continue;
      const outras = STACKS.filter((s) => porStack[s].covers.has(id));
      violations.push(outras.length > 0
        ? {
          category: 'quality', severity: 'medium', slug, stack,
          file: `stories/${slug}`, rule: 'contract_divergent',
          message: `${id} é coberto em ${outras.join(', ')} e não aqui — cubra ou declare coversNotApplicable com o motivo`,
        }
        : {
          category: 'quality', severity: 'medium', slug, stack,
          file: `stories/${slug}`, rule: 'contract_uncovered',
          message: `${id} está documentado em testes.* e nenhuma story o verifica`,
        });
    }
  }

  return violations;
}

/** Visão de adoção do contrato — fora do audit para não poluir o exit code. */
function contractStatus() {
  const dir = join(ROOT, 'docs', 'shared', 'content');
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .map((slug) => {
      const ids = contractIds(slug);
      const porStack = STACKS.map((stack) => {
        const { ui } = filesForSlug(slug, stack);
    const stories = ui.filter((f) => /.stories.(ts|tsx)$/.test(f));
        const covers = new Set();
        const waived = new Set();
        for (const file of stories) {
          const content = readFile(file);
          if (!content) continue;
          const d = declaredCoverage(content);
          d.covers.forEach((c) => covers.add(c));
          d.waived.forEach((_m, id) => waived.add(id));
        }
        return { stack, resolvidos: new Set([...covers, ...waived]).size };
      });
      return { slug, total: ids.length, porStack };
    })
    .filter((r) => r.total > 0);
}

/**
 * Classe morta fora das stories.
 *
 * `legacy_class_in_story` varre stories e wrappers `*Story.svelte` — e funciona:
 * os componentes que passaram pelo `/quality` estão zerados. O que escapava eram
 * os arquivos de componente que não têm `Story` no nome, sobretudo as fixtures
 * do Svelte (`TableVarianteBasica.svelte` e irmãs) e os primitivos.
 *
 * Não é cosmético: `sr-only` está entre as classes mortas encontradas assim, o
 * que deixa VISÍVEL uma caption que deveria ser só para leitor de tela.
 *
 * Aqui só entra `class="literal"`. Valor com `(`, `{` ou interpolação é
 * expressão (`cn(...)`, `toggleVariants({...})`) e o parse por regex devolveria
 * pedaços de código como se fossem classes.
 */
/**
 * Peça exportada que nenhuma story renderiza.
 *
 * É a assinatura de "especificado e não entregue": o componente existe, o CSS
 * existe, e nada no produto o exercita. Foi assim que o AlertDialogMedia passou
 * — presente em três stacks, ausente no Vanilla, zero stories, zero
 * documentação. O sinal aparecia como 0% de cobertura, mas cobertura só é
 * calculada rodando a suíte; isto custa milissegundos.
 *
 * Só olha export de VALOR (componente/factory). Tipo não renderiza nada.
 */
function auditExportSemStory(slug) {
  const violations = [];
  const RAIZ_RX = new RegExp(`^${slug.replace(/-([a-z])/g, (_, c) => c.toUpperCase())}$`, 'i');

  for (const stack of STACKS) {
    const { ui } = filesForSlug(slug, stack);
    const arquivosDeStory = ui.filter(f => /\.stories\./.test(basename(f)));
    if (!arquivosDeStory.length) continue;
    const textoDasStories = arquivosDeStory.map(f => readFile(f) || '').join('\n');

    const exportados = new Map();
    const origensDeAlias = new Set();
    for (const file of ui) {
      const nome = basename(file);
      if (/\.stories\./.test(nome) || /story\.svelte$/i.test(nome)) continue;
      const content = readFile(file);
      if (!content) continue;

      // `export { A, B }` — o index.ts de vue/svelte e o rodapé do react
      for (const m of content.matchAll(/export\s*\{([^}]+)\}/g)) {
        for (const bruto of m[1].split(',')) {
          const texto = bruto.trim();
          const pedacos = texto.split(/\s+as\s+/);
          // `Media as AlertDialogMedia`: os dois nomes são a MESMA peça. O
          // Svelte exporta os dois, e cobrar o curto acusa alias como código
          // morto — foi o maior falso positivo da primeira medição.
          if (pedacos.length > 1) origensDeAlias.add(pedacos[0].trim());
          const parte = pedacos.pop().trim();
          if (/^type\b/.test(texto) || !/^[A-Za-z_]\w*$/.test(parte)) continue;
          if (!exportados.has(parte)) exportados.set(parte, file);
        }
      }
      // `export function X` / `export const X` — factories do vanilla
      for (const m of content.matchAll(/export\s+(?:async\s+)?(?:function|const)\s+([A-Za-z_]\w*)/g)) {
        if (!exportados.has(m[1])) exportados.set(m[1], file);
      }
    }

    // Não renderizam nada: cva/estilo e helpers de hook/contexto são API para
    // quem consome, e a ausência deles numa story não é lacuna de entrega.
    const NAO_RENDERIZAVEL = /(Variants|Style)$|^(use|set|get)[A-Z]/;

    // Consumidores possíveis: qualquer arquivo da stack que não seja o que
    // define nem um barril de re-export. Sem isto a regra acusa alias do Svelte
    // (`Root as Accordion`), cva compartilhada (`buttonVariants`) e
    // sub-componente que só o próprio componente renderiza — 442 falsos
    // positivos na primeira versão.
    const consumidores = globStack(stack, 'components', ['.ts', '.tsx', '.vue', '.svelte'])
      .filter(f => !/^index\.ts$/i.test(basename(f)));

    for (const [simbolo, file] of exportados) {
      if (RAIZ_RX.test(simbolo)) continue;                       // a raiz sempre aparece
      if (origensDeAlias.has(simbolo)) continue;                 // é o nome curto de um alias
      if (NAO_RENDERIZAVEL.test(simbolo)) continue;
      const rx = new RegExp(`\\b${simbolo}\\b`);
      if (rx.test(textoDasStories)) continue;

      // No React o componente inteiro mora num arquivo só: `AlertDialogContent`
      // renderiza `<AlertDialogPortal>` ali mesmo. Ignorar o arquivo de
      // definição inteiro marcava esses como mortos. O que não conta é a
      // declaração e a lista de export — o resto é uso.
      const proprio = (readFile(file) || '')
        .replace(/export\s*\{[^}]*\}/g, '')
        .replace(new RegExp(`(?:function|const)\\s+${simbolo}\\b`, 'g'), '');
      if (rx.test(proprio)) continue;

      const usadoPorOutro = consumidores.some(f => {
        if (f === file) return false;
        const c = readFile(f);
        return c && rx.test(c);
      });
      if (usadoPorOutro) continue;

      violations.push({
        category: 'quality', severity: 'medium', slug, stack,
        file: relative(ROOT, file), rule: 'export_sem_story',
        message: `${simbolo} é exportado e nada o renderiza — nem story, nem outro componente, nem docs page`,
      });
    }
  }
  return violations;
}

function auditDeadClassInComponent(slug) {
  const violations = [];
  for (const stack of STACKS) {
    const { ui } = filesForSlug(slug, stack);
    for (const file of ui) {
      const nome = basename(file).toLowerCase();
      if (/\.stories\./.test(nome) || nome.endsWith('story.svelte')) continue;

      const content = readFile(file);
      if (!content) continue;
      const rel = relative(ROOT, file);

      const vistas = new Set();
      for (const m of content.matchAll(/class(?:Name)?=["']([^"']+)["']/g)) {
        const valor = m[1];
        if (/[${(}]/.test(valor)) continue;
        for (const cls of valor.split(/\s+/)) {
          if (!cls || ALLOWED_CLASS_RX.test(cls) || vistas.has(cls)) continue;
          vistas.add(cls);
          violations.push({
            category: 'quality', severity: 'low', slug, stack,
            file: rel, rule: 'dead_class_in_component',
            message: `classe "${cls}" não existe no CSS nds-* — inerte em runtime`,
          });
        }
      }
    }
  }
  return violations;
}

/**
 * Prefixos de chave cujo container escreve textNode. Derivado contando
 * `dangerouslySetInnerHTML` em cada seção compartilhada — DocsTestes,
 * DocsTokens, DocsStates, DocsRelated, DocsDoDont, DocsAnalytics e as tabelas
 * do DocsProps e do DocsWhenToUse não renderizam HTML.
 */
const TEXT_SURFACE_PREFIXES = [
  'testes.', 'props.table.', 'tokens.table.', 'accessibility.keyboard.',
  'usage.scenarios.', 'usage.uxWriting.', 'states.', 'analytics.table.',
  'doDont.', 'related.',
];

/**
 * Markup literal em superfície de texto.
 *
 * O `translations.json` é compartilhado entre containers que renderizam HTML e
 * containers que escrevem textNode, então guarda `<button>` escapado como
 * `&lt;button&gt;`. No segundo grupo isso chega cru à tela — "Elemento
 * &lt;button&gt; nativo presente" — e nada mais pega: nem teste, nem axe. Só
 * olhando a página, que foi como apareceu duas vezes.
 *
 * O par correto é `toPlainText()` (tira tags E decodifica entidades) para texto
 * e `stripHtml()` para destino que renderiza HTML — decodificar antes de HTML
 * transforma o texto em markup vivo.
 */
function auditTextSurfaces(slug) {
  const violations = [];
  const tPath = join(ROOT, 'docs', 'shared', 'content', slug, 'translations.json');
  if (!existsSync(tPath)) return violations;

  let json;
  try { json = JSON.parse(readFile(tPath) || '{}'); } catch { return violations; }

  // chave -> tem markup em algum idioma
  const comMarkup = new Set();
  for (const locale of Object.keys(json)) {
    (function varre(node, caminho) {
      if (typeof node === 'string') {
        if (/<[a-z][^>]*>|&lt;|&gt;/.test(node)) comMarkup.add(caminho.replace(/^\./, ''));
        return;
      }
      if (node && typeof node === 'object') {
        for (const [k, v] of Object.entries(node)) varre(v, `${caminho}.${k}`);
      }
    })(json[locale], '');
  }
  if (!comMarkup.size) return violations;

  const escapar = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  for (const stack of STACKS) {
    const { docs } = filesForSlug(slug, stack);
    for (const file of docs) {
      const content = readFile(file);
      if (!content) continue;
      const rel = relative(ROOT, file);

      for (const chave of comMarkup) {
        if (!TEXT_SURFACE_PREFIXES.some((p) => chave.startsWith(p))) continue;
        // a mesma chave pode aparecer literal ou com índice interpolado; sem o
        // Set a chave sem `itemN` casaria as duas formas e reportaria dobrado
        const alvos = new Set([chave, chave.replace(/item\d+/, 'item${i}')]);
        for (const alvo of alvos) {
          const re = new RegExp(
            `(toPlainText\\()?\\s*(?:tContent|\\$?tStore|\\bt)\\(['\`"]${escapar(alvo)}['\`"]\\)`,
            'g',
          );
          for (const m of content.matchAll(re)) {
            if (m[1]) continue;                       // já envolvido
            violations.push({
              category: 'quality', severity: 'medium', slug, stack,
              file: rel, rule: 'markup_in_text_surface',
              message: `"${chave}" tem markup e cai em container que escreve textNode — envolva em toPlainText(), senão a tag aparece literal na tela`,
            });
          }
        }
      }
    }
  }
  return violations;
}

/**
 * Prop que a lib não tem.
 *
 * Não gera erro de tipo nem aviso: o componente monta e a prop é descartada.
 * `defaultOpen` e `defaultValue` não existem no bits-ui nem no vaul-svelte — a
 * API é o estado bindável (`open`, `value`) — e deixaram overlays e menus
 * fechados em mais de 40 testes, cada um parecendo um bug diferente.
 *
 * Só acusa quando a prop vai para um COMPONENTE (maiúscula inicial). Usá-la
 * como prop do próprio wrapper, para inicializar o bindable, é o padrão certo.
 */
const PROPS_INEXISTENTES = {
  svelte: ['defaultOpen', 'defaultValue'],
};

function auditNonexistentLibProps(slug) {
  const violations = [];
  for (const stack of STACKS) {
    const proibidas = PROPS_INEXISTENTES[stack];
    if (!proibidas) continue;

    const { ui } = filesForSlug(slug, stack);
    for (const file of ui) {
      const content = readFile(file);
      if (!content) continue;
      const rel = relative(ROOT, file);

      for (const prop of proibidas) {
        // `<Componente … {defaultOpen}` ou `defaultOpen={…}` — só em tag de
        // componente, que no Svelte começa com maiúscula.
        // Sem `\b` antes de `{`: entre espaço e chave não há fronteira de
        // palavra, e a regra silenciava justamente na forma abreviada
        // `<Drawer {defaultOpen}>`, que é a mais usada.
        const re = new RegExp(`<[A-Z][\\w.]*[^>]*?(?:\\{\\s*${prop}\\s*\\}|\\b${prop}=)`, 'gs');
        if (!re.test(content)) continue;
        violations.push({
          category: 'quality', severity: 'high', slug, stack,
          file: rel, rule: 'nonexistent_lib_prop',
          message: `"${prop}" não existe na lib desta stack — é aceita e ignorada em silêncio. Use o estado bindável (open/value) inicializado com ela`,
        });
      }
    }
  }
  return violations;
}

function auditTaxonomy(slug) {
  const violations = [];
  const file = join(ROOT, 'docs', 'shared', 'content', slug, 'translations.json');
  if (!existsSync(file)) return violations;

  const json = JSON.parse(readFile(file) || '{}');
  const pt = json['pt-BR'];
  if (!pt) return violations;

  const rel = relative(ROOT, file);
  const push = (rule, severity, message) =>
    violations.push({ category: 'quality', severity, slug, stack: 'shared', file: rel, rule, message });

  const HEADERS = new Set(['title', 'cols', 'note', 'items', 'styles', 'sizes',
    'compositions', 'compositionsTitle', 'visualTitle', 'description',
    'stylesTitle', 'sizesTitle']);
  // `variants.items` guarda STRING; `compositions` e `states` guardam OBJETO.
  // Para inventariar chaves, aceite as duas formas — filtrar por objeto aqui
  // descartava os items inteiros e a comparação de duplicidade nunca rodava.
  const keysOf = (obj) => Object.keys(obj ?? {}).filter((k) => !HEADERS.has(k));
  const entries = (obj) => Object.entries(obj ?? {})
    .filter(([k, v]) => !HEADERS.has(k) && v && typeof v === 'object');

  const variants = pt.variants ?? {};
  const compositions = variants.compositions ?? {};
  const states = pt.states ?? {};

  // 1. Variantes soltas como irmãs de `variants` em vez de sob `items`.
  //    O inventário do /product só enxerga items/styles — nessa forma, ele
  //    reporta zero variantes e ninguém percebe.
  // Vale mesmo quando `items` existe: vários componentes têm as DUAS formas ao
  // mesmo tempo, e a versão anterior desta regra (`soltas && !items`) deixava
  // esse caso passar — foi assim que o context-menu manteve 4 chaves soltas
  // invisíveis para o inventário do /product.
  const soltas = keysOf(variants);
  if (soltas.length) {
    push('variants_form', 'medium',
      `variantes fora de variants.items (${soltas.join(', ')}) — ver guideline 14 §Forma dos dados`);
  }

  // 2. Estado sem a forma {label, trigger, behavior}. Sem `trigger`, a docs page
  //    acaba hardcodando a coluna e o texto some em en/es (caso do accordion).
  for (const [k, v] of entries(states)) {
    const faltando = ['label', 'trigger', 'behavior'].filter((f) => typeof v[f] !== 'string');
    if (faltando.length) {
      push('state_shape', 'medium',
        `states.${k} sem ${faltando.join('/')} — a coluna vira texto fixo fora do i18n`);
    }
  }

  // 3. Mesma chave em duas seções do mesmo componente.
  // "default" colide sempre — a variante visual padrão e o estado inicial são
  // coisas diferentes, e ambas legítimas. Sem essa exceção a regra acusava 6
  // componentes por um par que não é duplicata.
  const GENERICAS = new Set(['default']);
  const norm = (k) => k.toLowerCase().replace(/^(with|without|as)/, '').replace(/[^a-z0-9]/g, '');
  const mapa = new Map();
  for (const k of keysOf(variants.items ?? {})) { if (!GENERICAS.has(k)) mapa.set(norm(k), `variants.items.${k}`); }
  for (const k of keysOf(variants.styles ?? {})) { if (!GENERICAS.has(k)) mapa.set(norm(k), `variants.styles.${k}`); }
  for (const k of keysOf(states)) {
    const n = norm(k);
    if (mapa.has(n)) push('duplicate_across_sections', 'medium',
      `states.${k} repete ${mapa.get(n)} — ver guideline 14 §Regra de não-duplicação`);
    else mapa.set(n, `states.${k}`);
  }
  for (const k of keysOf(compositions)) {
    const n = norm(k);
    if (mapa.has(n)) push('duplicate_across_sections', 'medium',
      `variants.compositions.${k} repete ${mapa.get(n)} — ver guideline 14 §Regra de não-duplicação`);
  }

  // 4. Composição que não nomeia nada externo na description. É o sintoma de
  //    classificação errada — ou de descrição que não diz com o que compõe.
  const EXTERNO = /<code>|<img|<a |<fieldset|<span|<label|<button|ícone|icone|lucide|imagem|fieldset|legend/i;
  const OUTROS = new Set(readdirSync(join(ROOT, 'docs', 'shared', 'content'))
    .filter((d) => d !== slug)
    .map((d) => d.split('-').map((x) => x[0].toUpperCase() + x.slice(1)).join('')));
  for (const [k, v] of entries(compositions)) {
    const desc = typeof v.description === 'string' ? v.description : '';
    const citaComponente = [...OUTROS].some((c) => desc.includes(c));
    if (!EXTERNO.test(desc) && !citaComponente) {
      push('composition_without_partner', 'low',
        `variants.compositions.${k} não nomeia com o que compõe — classificação errada ou descrição incompleta (guideline 14)`);
    }
  }

  return violations;
}

/**
 * Chave de i18n que não resolve.
 *
 * `t()` devolve a PRÓPRIA CHAVE quando não encontra, então a página renderiza
 * "analytics.table.event" como se fosse texto — nos 3 idiomas, sem erro de
 * build, sem erro de tipo, sem quebrar teste. E o idioma `|| 'Evento'` que
 * costuma acompanhar é dead code: chave é string truthy, o fallback nunca roda.
 *
 * Só checa chaves LITERAIS. Template (`testes.item${i}.action`) fica de fora.
 */
function auditI18nKeys(slug) {
  const violations = [];

  const flatten = (obj, prefix = '', out = new Set()) => {
    for (const [k, v] of Object.entries(obj ?? {})) {
      const key = prefix ? `${prefix}.${k}` : k;
      out.add(key);
      if (v && typeof v === 'object') flatten(v, key, out);
    }
    return out;
  };

  const contentFile = join(ROOT, 'docs', 'shared', 'content', slug, 'translations.json');
  if (!existsSync(contentFile)) return violations;
  const contentKeys = flatten(JSON.parse(readFile(contentFile) || '{}')['pt-BR']);

  for (const stack of STACKS) {
    const uiFile = join(ROOT, `nortear-design-system-${stack}`, 'src', 'i18n', 'ui.json');
    const uiKeys = existsSync(uiFile)
      ? flatten(JSON.parse(readFile(uiFile) || '{}')['pt-BR'])
      : new Set();

    const { docs } = filesForSlug(slug, stack);
    for (const file of docs) {
      const content = readFile(file);
      if (!content) continue;

      // Chaves declaradas no override de `useTranslation`/`createTranslation`
      // existem em tempo de execução sem existir no translations.json — é o
      // mecanismo previsto para prop que só uma stack expõe (`href` no Svelte,
      // `ariaBusy` na factory do Vanilla), que não cabe no conteúdo
      // compartilhado por não ser contrato das quatro. Sem reconhecê-las, a
      // regra acusa justamente o uso correto do override.
      const overrideKeys = new Set(
        [...content.matchAll(/['"]([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)+)['"]\s*:/g)].map((m) => m[1]),
      );

      // tNav/tUi leem ui.json; t/tContent/tStore leem o conteúdo do componente.
      //
      // O lookbehind não é preciosismo: sem ele, `split('.')` casava — o fim de
      // `split(` é literalmente `t(` — e a regra acusava a chave `"."`
      // inexistente em toda página de docs que separa uma chave por ponto.
      // Achado que não existe custa mais caro que achado nenhum: ensina a
      // ignorar o portão. `$t(` do Vue continua passando, porque o caractere
      // antes do `$` é separador.
      const alvos = [
        [/\bt(?:Nav|Ui)\(\s*['"]([a-zA-Z0-9_.]+)['"]/g, uiKeys, 'ui.json'],
        [
          /(?<![A-Za-z0-9_])\$?t(?:Content|Store)?\(\s*['"]([a-zA-Z0-9_.]+)['"]/g,
          contentKeys,
          'translations.json',
        ],
      ];

      for (const [rx, conhecidas, fonte] of alvos) {
        const faltando = new Set();
        for (const m of content.matchAll(rx)) {
          const key = m[1];
          if (!key.includes('.') || conhecidas.has(key)) continue;
          // tNav e t coexistem no mesmo arquivo; só acusa se não estiver em nenhum.
          if (uiKeys.has(key) || contentKeys.has(key) || overrideKeys.has(key)) continue;
          faltando.add(key);
        }
        for (const key of faltando) {
          violations.push({
            category: 'quality', severity: 'medium', slug, stack,
            file: relative(ROOT, file), rule: 'unresolved_i18n_key',
            message: `"${key}" não existe em ${fonte} — a página renderiza a própria chave como texto`,
          });
        }
      }
    }
  }

  return violations;
}

/**
 * Var interna de componente não documentada.
 *
 * O padrão de duas camadas (guideline 04 §Tokens de Componente) declara vars
 * de indireção no seletor raiz (`--alert-bg: hsl(var(--card))`). Elas SÃO a
 * superfície de customização — o override é escopado à classe do componente.
 * Se a docs page não as menciona, a superfície é invisível: medido antes desta
 * regra, 5 de 9 componentes com vars locais não documentavam nenhuma.
 */
/**
 * Propriedades cujo valor é DECISÃO DE DESIGN — as que existem como token.
 *
 * O resto (`position`, `display`, `overflow`, `transform`, `contain`,
 * `object-fit`, `user-select`, `visibility`, `z-index`…) é mecânica de layout
 * ou de comportamento: inline ali não burla token nenhum, e proibir geraria
 * ruído em `display: none` de factory e `transform` de posicionamento.
 */
const INLINE_DESIGN_PROPS = new Set([
  'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
  'block-size', 'inline-size', 'max-block-size', 'max-inline-size',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'padding-block', 'padding-inline', 'padding-block-start', 'padding-block-end',
  'padding-inline-start', 'padding-inline-end',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'margin-block', 'margin-inline', 'gap', 'row-gap', 'column-gap',
  'font-size', 'line-height', 'font-weight', 'letter-spacing',
  'color', 'background', 'background-color', 'border-color', 'fill', 'stroke',
  'border', 'border-width', 'border-radius', 'box-shadow', 'opacity',
]);

// `auto`, `100%`, `0` e afins são preenchimento mecânico, não medida escolhida.
const INLINE_MECHANICAL_VALUE =
  /^(0|0px|0rem|auto|none|inherit|initial|unset|revert|100%|fit-content|max-content|min-content|currentcolor|transparent)$/i;
// Só interessa quantidade concreta: 2rem, 16px, 50%, #fff, hsl(...).
const INLINE_QUANTITY = /(^|[\s(])-?\d*\.?\d+(px|rem|em|ch|vh|vw|%)|^#[0-9a-f]{3,8}$|^(rgb|hsl)a?\(/i;
// Valor vindo de prop/estado/token não é literal cravado.
const INLINE_DYNAMIC = /\$\{|\{[^}]*\}|`|v-bind|\bprops\.|\bargs\.|var\(/;

const kebab = (s) => s.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());

/**
 * `stripComments` já cuida de `//` e `/* *​/` sem comer string. Falta o
 * comentário de marcação, que é onde .vue e .svelte guardam o exemplo de uso —
 * o docblock do chart traz `<ChartContainer style="height: 16rem" />`, e sem
 * este passo a regra acusaria a própria documentação. Auditor que aponta
 * comentário perde a confiança de quem lê o relatório.
 * Substitui preservando quebras de linha, para o número da linha continuar certo.
 */
function stripMarkupComments(src) {
  return src.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '));
}

/** Declarações inline de um arquivo, nas sintaxes que as cinco stacks usam. */
function inlineStyleDecls(content) {
  const out = [];
  stripMarkupComments(stripComments(content)).split('\n').forEach((linha, i) => {
    const push = (prop, valor) => {
      const nome = kebab(String(prop).trim().replace(/['"]/g, ''));
      const v = String(valor).trim().replace(/['"]/g, '');
      if (!INLINE_DESIGN_PROPS.has(nome)) return;
      if (INLINE_MECHANICAL_VALUE.test(v)) return;
      if (INLINE_DYNAMIC.test(v)) return;
      if (!INLINE_QUANTITY.test(v)) return;
      out.push({ line: i + 1, decl: `${nome}: ${v}` });
    };
    const pares = (txt) => {
      for (const m of txt.matchAll(/([a-zA-Z-]+)\s*:\s*(["'])([^"']*)\2/g)) push(m[1], m[3]);
    };

    // style={{ height: '2rem' }} — jsx
    if (/style=\{\{/.test(linha)) pares(linha);
    // :style="{ minHeight: '200px' }" — vue com objeto ligado
    for (const m of linha.matchAll(/:style=(["'])\s*\{([\s\S]*?)\}\s*\1/g)) pares(m[2]);
    // style="a: 1rem; b: 2rem" — vue, svelte, angular, html
    for (const m of linha.matchAll(/(?<!:)style=(["'])([^"']*)\1/g)) {
      if (m[2].trim().startsWith('{')) continue;         // objeto, já tratado acima
      for (const d of m[2].split(';')) {
        const [p, ...r] = d.split(':');
        if (p && r.length) push(p, r.join(':'));
      }
    }
    // el.style.height = '2rem' — factories vanilla
    for (const m of linha.matchAll(/\.style\.([a-zA-Z]+)\s*=\s*(["'])([^"']*)\2/g)) push(m[1], m[3]);
  });
  return out;
}

/**
 * Valor de design cravado em `style` inline dentro de `components/ui`.
 *
 * Inline vence qualquer folha, então a declaração fica fora do tema, fora da
 * densidade e fora da escala tipográfica — e `height` cravado é o defeito de
 * WCAG 1.4.4 que a convenção de altura já proíbe. Medido ao criar a regra:
 * 18 em primitivo e 148 em andaime de story, estes últimos todos no Svelte,
 * o que por si só é divergência cross-stack.
 *
 * FORA DE ESCOPO, de propósito: docs pages. Elas misturam estilo renderizado
 * com snippet de código exibido ao leitor (o `padding-bottom: 56.25%` do
 * AspectRatio é o truque antigo sendo demonstrado), e separar os dois por
 * regex não é confiável. O grep manual do passo 1 da skill `quality` continua
 * cobrindo esse lado.
 */
function auditInlineStyle(slug) {
  const violations = [];
  for (const stack of STACKS) {
    const { ui } = filesForSlug(slug, stack);
    for (const file of ui) {
      if (/\.stories\./.test(file)) continue;
      const content = readFile(file);
      if (!content) continue;
      const decls = inlineStyleDecls(content);
      if (!decls.length) continue;
      // Andaime de demo tem peso menor que o primitivo, mas é o que as pessoas
      // copiam — por isso entra, em vez de ser ignorado.
      const andaime = /Story\.[a-z]+$/i.test(basename(file));
      const amostra = [...new Set(decls.map((d) => d.decl))].slice(0, 3).join(' · ');
      violations.push({
        category: 'quality', severity: andaime ? 'medium' : 'high', slug, stack,
        file: relative(ROOT, file), rule: 'inline_style_design_value',
        message: `${decls.length} valor(es) de design em style inline (linha ${decls[0].line}: ${amostra}) — inline vence a folha e sai do tema, da densidade e da escala; use classe .nds-* ou token`,
      });
    }
  }
  return violations;
}

/* ─── Guardas de regra escrita ───────────────────────────────────────────────
 *
 * Regras que viviam só no CLAUDE.md e na cabeça de quem revisava. Todas passam
 * hoje: são guarda de regressão, não backlog. O valor de uma guarda verde é que
 * ela fica vermelha no dia em que alguém reintroduzir o defeito — e cada uma
 * destas já custou caro uma vez.
 */

// Emoji e marca de certo/errado. NÃO inclui setas: `Configurações → Assinatura`
// é prosa legítima, e a primeira versão desta regra acusou 78 delas.
const GLIFO_PROIBIDO =
  /[\u{1F300}-\u{1FAFF}\u{1F000}-\u{1F2FF}☀-➿✅❌✓✔✗✘⚠️]/u;

/** Primitivos cuja RAIZ carrega texto — só neles altura fixa corta o conteúdo. */
const PRIMITIVOS_COM_TEXTO = new Set([
  'button', 'input', 'textarea', 'label', 'badge', 'toggle', 'toggle-group',
  'native-select', 'combobox', 'select', 'pagination', 'breadcrumb',
]);

function auditGuardrails(slug) {
  const violations = [];
  const push = (o) => violations.push({ slug, ...o });

  // 1. Emoji no conteúdo compartilhado. O ícone é renderizado pela docs page
  //    (pill .nds-* + lucide); no texto ele aparece duplicado.
  const contentFile = join(ROOT, 'docs', 'shared', 'content', slug, 'translations.json');
  const raw = readFile(contentFile);
  if (raw) {
    let json = null;
    try { json = JSON.parse(raw); } catch { /* outra regra cobra JSON inválido */ }
    const walk = (node, path) => {
      if (typeof node === 'string') {
        if (GLIFO_PROIBIDO.test(node)) {
          push({
            category: 'quality', severity: 'medium', stack: 'shared',
            file: relative(ROOT, contentFile), rule: 'emoji_in_translation',
            message: `${path} traz emoji ou glifo de status — o ícone vem do código da docs page, e no texto ele duplica`,
          });
        }
        return;
      }
      if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) walk(v, path ? `${path}.${k}` : k);
    };
    if (json) walk(json, '');

    // 2. `useSeoEffect` já acrescenta "· Design System"; no JSON isso duplica.
    for (const [loc, bloco] of Object.entries(json ?? {})) {
      const t = bloco && bloco.seo && bloco.seo.title;
      if (typeof t === 'string' && /·\s*Design System/i.test(t)) {
        push({
          category: 'quality', severity: 'medium', stack: 'shared',
          file: relative(ROOT, contentFile), rule: 'seo_title_suffix',
          message: `seo.title [${loc}] já contém "· Design System" — useSeoEffect acrescenta o sufixo, o título sai duplicado`,
        });
      }
    }
  }

  // 3. Altura fixa na raiz de primitivo com texto (WCAG 1.4.4). Descendente
  //    (ícone, indicador, thumb) e variante icon-only continuam livres: não há
  //    texto ali para crescer.
  if (PRIMITIVOS_COM_TEXTO.has(slug)) {
    const cssFile = join(ROOT, 'docs', 'shared', 'styles', 'nds', `${slug}.css`);
    const css = (readFile(cssFile) || '').replace(/\/\*[\s\S]*?\*\//g, '');
    const rx = new RegExp(`(^|\\n)([^{}\\n]*\\.nds-${slug}(-(?!icon)[a-z0-9-]+)?)\\s*\\{([^}]*)\\}`, 'g');
    for (const m of css.matchAll(rx)) {
      const sel = m[2].trim();
      if (/>|\s[a-z]|::|\[data-|-thumb|-indicator|-icon|-svg|-track|-dot|-separator|-ellipsis/.test(sel)) continue;
      const h = m[4].match(/^\s*(height|block-size)\s*:\s*([^;]+);/m);
      if (!h) continue;
      // `--reka-select-trigger-height` e `--bits-*` são medidas que a lib
      // headless calcula em runtime para alinhar o painel ao gatilho. Não há
      // escolha de design ali, e proibir seria pedir que o painel desalinhasse.
      if (/--(reka|bits|radix)-/.test(h[2])) continue;
      if (!/100%|auto|inherit|fit-content/.test(h[2])) {
        push({
          category: 'quality', severity: 'high', stack: 'shared',
          file: relative(ROOT, cssFile), rule: 'fixed_height_on_text_primitive',
          message: `${sel} fixa ${h[1]}: ${h[2].trim()} — a altura de primitivo com texto é resultado de padding-block + line-height, senão o texto é cortado quando a pessoa aumenta a fonte (WCAG 1.4.4)`,
        });
      }
    }
  }

  for (const stack of STACKS) {
    const { all, docs } = filesForSlug(slug, stack);

    // 4. `gtag()` direto. GA4 vive no manager; o iframe não o enxerga, e a
    //    chamada direta registra tudo em /iframe.html.
    for (const file of all) {
      const content = stripComments(readFile(file) || '');
      if (/(^|[^.\w])gtag\s*\(/.test(content)) {
        push({
          category: 'analytics', severity: 'high', stack,
          file: relative(ROOT, file), rule: 'gtag_direct_call',
          message: 'chama gtag() direto — usar track() de src/lib/analytics, que resolve window.top.gtag',
        });
      }
    }

    // 5. Locale do Vue vindo de store. Já derrubou docs page em runtime.
    if (stack === 'vue') {
      for (const file of docs) {
        const content = stripComments(readFile(file) || '');
        if (/useLocaleStore|from\s+['"]pinia['"]/.test(content)) {
          push({
            category: 'quality', severity: 'high', stack,
            file: relative(ROOT, file), rule: 'vue_locale_from_store',
            message: 'docs page Vue lê locale de store/Pinia — a fonte é useTranslation(); a store já causou crash em runtime',
          });
        }
      }
    }
  }

  return violations;
}

/**
 * Infra do Storybook: slug-independente, roda 1x por processo.
 *
 * O GA4 no iframe já aconteceu em produção — 863 de 863 pageviews caíram em
 * `/iframe.html`, porque `location.pathname` do iframe é invariante. E o
 * repositório é público, então ID de medição commitado é vazamento.
 */
function auditStorybookInfra() {
  const violations = [];
  for (const stack of STACKS) {
    const sb = join(ROOT, stackDir(stack), '.storybook');
    if (!existsSync(sb)) continue;

    const previewHead = join(sb, 'preview-head.html');
    if (existsSync(previewHead) && /googletagmanager|gtag\/js/i.test(readFile(previewHead) || '')) {
      violations.push({
        category: 'analytics', severity: 'high', slug: '_infra', stack,
        file: relative(ROOT, previewHead), rule: 'ga4_in_preview_head',
        message: 'GA4 carregado no preview-head — o iframe tem pathname invariante e 100% dos page_view colidem em /iframe.html; o lugar é manager-head.html',
      });
    }

    for (const nome of ['manager-head.html', 'preview-head.html']) {
      const f = join(sb, nome);
      if (!existsSync(f)) continue;
      const m = (readFile(f) || '').match(/\bG-[A-Z0-9]{8,}\b/);
      if (m) {
        violations.push({
          category: 'security', severity: 'high', slug: '_infra', stack,
          file: relative(ROOT, f), rule: 'measurement_id_committed',
          message: `ID de medição ${m[0]} escrito no arquivo — o repositório é público; injetar por variável de ambiente no build`,
        });
      }
    }

    // O listener de canal só é exigido onde o renderer pula o re-render do
    // decorator ao voltar a toolbar para Default. O renderer html (vanilla)
    // re-roda sozinho, e o Angular ainda está sendo construído.
    if (!['react', 'vue', 'svelte'].includes(stack)) continue;
    const preview = ['preview.ts', 'preview.tsx'].map((n) => join(sb, n)).find(existsSync);
    if (preview && !/GLOBALS_UPDATED/.test(readFile(preview) || '')) {
      violations.push({
        category: 'quality', severity: 'high', slug: '_infra', stack,
        file: relative(ROOT, preview), rule: 'theme_channel_missing',
        message: 'preview sem listener de GLOBALS_UPDATED no nível do módulo — só decorator + useEffect não reverte o tema para Default, porque o renderer pula o re-render nesse caso',
      });
    }
  }
  return violations;
}

/**
 * Guideline de componente não carrega código de implementação.
 *
 * Código em guideline envelhece mais rápido que no componente: commit no
 * componente não atualiza a guideline, e o leitor segue a versão velha. A
 * guideline decide QUANDO e POR QUE usar; o COMO vive no componente, no
 * `translations.json` e na docs page.
 *
 * Vale só para as de componente (04 a 10 de cada stack). As transversais em
 * `docs/shared/guidelines` podem ilustrar uma regra com snippet — é onde estão
 * os 276 blocos atuais, todos legítimos.
 */
function auditGuidelineCode() {
  const violations = [];
  const RX_FENCE = /^```(ts|tsx|jsx|vue|svelte|typescript)\s*$/gm;
  for (const stack of STACKS) {
    const dir = join(ROOT, stackDir(stack), 'guidelines');
    if (!existsSync(dir)) continue;
    for (const nome of readdirSync(dir)) {
      if (!/^(0[4-9]|10)-.*\.md$/.test(nome)) continue;
      const conteudo = readFile(join(dir, nome)) || '';
      const n = (conteudo.match(RX_FENCE) || []).length;
      if (n > 0) {
        violations.push({
          category: 'quality', severity: 'medium', slug: '_infra', stack,
          file: relative(ROOT, join(dir, nome)), rule: 'code_in_component_guideline',
          message: `${n} bloco(s) de código de implementação — guideline de componente traz propósito, estrutura textual, tabelas e regras; o código vive no componente e no translations.json, que não envelhecem juntos`,
        });
      }
    }
  }
  return violations;
}

/* ─── Vocabulário da sidebar ─────────────────────────────────────────────────
 *
 * O menu do Storybook virou vocabulário único em inglês, e a estrutura dele
 * (seções, subseções, fundamentos) é traduzida por `sidebar-labels.ts`. Duas
 * coisas regridem sozinhas quando alguém cria página nova, e as duas já
 * regrediram: o Angular reintroduziu `Colapsado` no dia seguinte à
 * normalização.
 */

/** Agrupa sequência de maiúsculas: `DIAMETER` é um token, `IDELayout` vira dois. */
function palavrasDoNome(nome) {
  return nome.match(/[A-Z]+(?![a-z])|[A-Z][a-z0-9]*|[a-z0-9]+/g) ?? [];
}

// Morfologia rara em inglês e corriqueira em português. Calibrado contra os 611
// nomes do repo: pega `Colapsado` e não pega `Animated`, `Indeterminate` nem
// `Loaded`.
const SUFIXO_PT = /(ado|ada|ados|adas|cao|coes|mento|dade|vel|veis|eiro|encia|ancia|oso|osa|ismo|agem)$/i;
// Só conectivos sem homógrafo em inglês. `No`, `Em` e `Um` ficaram de fora: `No`
// é palavra inglesa (NoResults, NoLimit) e sairia falso positivo em 9 nomes.
const CONECTIVO_PT = /^(De|Da|Do|Dos|Das|Com|Sem|Por|Nao|Como|Uma)$/;

function pareceProtugues(nome) {
  const palavras = palavrasDoNome(nome);
  if (palavras.some((p) => SUFIXO_PT.test(p) || CONECTIVO_PT.test(p))) return true;
  // `E` isolado entre duas palavras é o "e" português (DefaultEActive). Na
  // ponta ou em sigla não conta.
  return palavras.length > 2 && palavras.slice(1, -1).includes('E');
}

/** Dicionário e lista de dispensa, lidos do próprio primitivo. */
let _sidebarConhecidos = null;
function sidebarConhecidos() {
  if (_sidebarConhecidos) return _sidebarConhecidos;
  const src = readFile(join(ROOT, 'docs', 'shared', 'primitives', 'sidebar-labels.ts')) || '';
  const nomes = new Set();
  // Chaves do dicionário: `Foo: {` ou `'Foo Bar': {`
  for (const m of src.matchAll(/^\s*'?([A-Za-z_][A-Za-z0-9 ,'-]*?)'?:\s*\{/gm)) nomes.add(m[1].trim());
  // Entradas de SEM_TRADUCAO: `Foo: 'motivo'`
  for (const m of src.matchAll(/^\s*'?([A-Za-z_][A-Za-z0-9 ,'-]*?)'?:\s*'/gm)) nomes.add(m[1].trim());
  _sidebarConhecidos = nomes;
  return nomes;
}

function auditSidebarVocab(slug) {
  const violations = [];
  const conhecidos = sidebarConhecidos();

  for (const stack of STACKS) {
    const { ui } = filesForSlug(slug, stack);
    for (const file of ui) {
      if (!/\.stories\./.test(file)) continue;
      const content = stripComments(readFile(file) || '');

      // 1. Nome de story fora do vocabulário inglês.
      for (const m of content.matchAll(/^export const ([A-Za-z0-9_]+)/gm)) {
        // Só nome de story, que é PascalCase. `IMG_QUEBRADA` e `DIAMETER` são
        // constantes de fixture — verificado no índice do build: o indexador do
        // Storybook checa a forma do export e não as publica como story.
        // Sigla também sai (FAQ), porque não há o que traduzir nela.
        if (!/^[A-Z][a-z0-9]/.test(m[1])) continue;
        if (!pareceProtugues(m[1])) continue;
        violations.push({
          category: 'quality', severity: 'medium', slug, stack,
          file: relative(ROOT, file), rule: 'story_name_not_english',
          message: `story \`${m[1]}\` tem cara de português — o menu do Storybook usa vocabulário único em inglês, e nome fora do padrão volta a criar dois nomes para o mesmo conceito`,
        });
      }

      // 2. Rótulo explícito com acento é português por definição.
      for (const m of content.matchAll(/^\s*name: *(['"])(.*?)\1/gm)) {
        if (!/[áàâãéêíóôõúüç]/i.test(m[2])) continue;
        violations.push({
          category: 'quality', severity: 'medium', slug, stack,
          file: relative(ROOT, file), rule: 'story_name_not_english',
          message: `rótulo \`name: "${m[2]}"\` está em português — é ele que a sidebar mostra, não o nome exportado`,
        });
      }

      // 3. Segmento de estrutura sem tradução nem dispensa declarada.
      for (const m of content.matchAll(/title: *(['"])([^'"]+)\1/g)) {
        const partes = m[2].split('/');
        for (const seg of [partes.length > 1 ? partes[0] : null, partes[2] ?? null]) {
          if (!seg || conhecidos.has(seg)) continue;
          violations.push({
            category: 'quality', severity: 'medium', slug, stack,
            file: relative(ROOT, file), rule: 'sidebar_label_untranslated',
            message: `"${seg}" é estrutura da sidebar e não está em sidebar-labels.ts — traduza, ou declare em SEM_TRADUCAO com o motivo`,
          });
        }
      }
    }
  }
  return violations;
}

/** Título das foundations: MDX, slug-independente. */
function auditFoundationLabels() {
  const violations = [];
  const conhecidos = sidebarConhecidos();
  for (const stack of STACKS) {
    const dir = join(ROOT, stackDir(stack), 'src', 'components', 'docs');
    if (!existsSync(dir)) continue;
    for (const nome of readdirSync(dir)) {
      if (!nome.endsWith('.mdx')) continue;
      const t = (readFile(join(dir, nome)) || '').match(/title="([^"]+)"/);
      if (!t) continue;
      for (const seg of t[1].split('/')) {
        if (conhecidos.has(seg)) continue;
        violations.push({
          category: 'quality', severity: 'medium', slug: '_infra', stack,
          file: relative(ROOT, join(dir, nome)), rule: 'sidebar_label_untranslated',
          message: `"${seg}" é título de fundamento e não está em sidebar-labels.ts — traduza, ou declare em SEM_TRADUCAO com o motivo`,
        });
      }
    }
  }
  return violations;
}

function auditComponentVars(slug) {
  const violations = [];
  const cssFile = join(ROOT, 'docs', 'shared', 'styles', 'nds', `${slug}.css`);
  const contentFile = join(ROOT, 'docs', 'shared', 'content', slug, 'translations.json');
  // Sem docs page própria (layout.css, pill.css) o lugar é a foundation page —
  // fora do escopo por-slug desta regra.
  if (!existsSync(cssFile) || !existsSync(contentFile)) return violations;

  const css = readFile(cssFile) || '';
  const content = readFile(contentFile) || '';
  // Vars de layout interno (spacing/cluster/stack/grid) não são superfície de
  // customização documentável por componente.
  const vars = [...new Set([...css.matchAll(/^\s+(--[a-z][a-z0-9-]*):/gm)].map((m) => m[1]))]
    .filter((v) => !/^--(spacing|cluster|stack|grid)-/.test(v));

  for (const v of vars) {
    if (content.includes(v)) continue;
    violations.push({
      category: 'quality', severity: 'low', slug, stack: 'shared',
      file: relative(ROOT, cssFile), rule: 'undocumented_component_var',
      message: `${v} é declarada no CSS do componente mas não aparece no translations.json — superfície de customização invisível (guideline 04)`,
    });
  }
  return violations;
}

function auditQuality(slug) {
  const violations = [];
  // A seção é obrigatória se, e só se, existir a chave correspondente no
  // conteúdo: componente sem eixo de variação não tem Variantes, estrutural não
  // tem Estados. Checado nos dois sentidos logo abaixo.
  const REQUIRED_SECTIONS = [
    'demonstracao', 'anatomia', 'quando-usar', 'do-dont', 'importacao',
    'propriedades', 'tokens', 'acessibilidade',
    'relacionados', 'notas', 'analytics', 'testes',
  ];
  const SECTION_HEADERS = new Set(['title', 'cols', 'note', 'items', 'styles',
    'sizes', 'compositions', 'compositionsTitle', 'visualTitle', 'description',
    'stylesTitle', 'sizesTitle']);
  const hasKeys = (node) =>
    !!node && Object.keys(node).some((k) => !SECTION_HEADERS.has(k));

  const CONDITIONAL_SECTIONS = [
    // Variantes valem tanto sob `items` quanto como chaves irmãs de `variants`
    // (forma alternativa que 5 componentes usam). A forma errada é problema de
    // `variants_form`; aqui só interessa se HÁ conteúdo — senão a mesma causa
    // sai reportada por duas regras, uma delas com diagnóstico errado.
    { id: 'variantes', label: 'variants.items', has: (pt) => hasKeys(pt.variants?.items) || hasKeys(pt.variants) },
    { id: 'composicoes', label: 'variants.compositions', has: (pt) => hasKeys(pt.variants?.compositions) },
    { id: 'estados', label: 'states', has: (pt) => hasKeys(pt.states) },
  ];

  for (const stack of STACKS) {
    const { docs } = filesForSlug(slug, stack);
    for (const file of docs) {
      const content = readFile(file);
      if (!content) continue;

      // 1. Seções obrigatórias
      const hasSection = (id) =>
        new RegExp(`\\b(id=|id:\\s*)['"\\\`]${id}['"\\\`]`).test(content);

      for (const id of REQUIRED_SECTIONS) {
        if (!hasSection(id)) {
          violations.push({
            category: 'quality', severity: 'medium', slug, stack,
            file: relative(ROOT, file), rule: 'missing_section',
            message: `Seção obrigatória ausente: id="${id}"`,
          });
        }
      }

      // 1b. Seções condicionais — o conteúdo manda, nos dois sentidos.
      const contentFile = join(ROOT, 'docs', 'shared', 'content', slug, 'translations.json');
      const ptBr = existsSync(contentFile)
        ? (JSON.parse(readFile(contentFile) || '{}')['pt-BR'] ?? null)
        : null;
      if (ptBr) {
        for (const { id, label, has } of CONDITIONAL_SECTIONS) {
          const temConteudo = has(ptBr);
          const temSecao = hasSection(id);
          if (temConteudo && !temSecao) {
            violations.push({
              category: 'quality', severity: 'medium', slug, stack,
              file: relative(ROOT, file), rule: 'content_without_section',
              message: `${label} tem conteúdo mas a página não renderiza id="${id}"`,
            });
          } else if (!temConteudo && temSecao) {
            violations.push({
              category: 'quality', severity: 'medium', slug, stack,
              file: relative(ROOT, file), rule: 'section_without_content',
              message: `id="${id}" existe na página mas ${label} está vazio — seção placeholder`,
            });
          }
        }
      }
    }

    // 2. a11y.disable em stories
    const storyFiles = globStack(stack, 'components/ui', ['.ts', '.tsx']).filter(f => {
      const n = basename(f).toLowerCase();
      return n.startsWith(slug.toLowerCase()) && n.includes('.stories.');
    });
    for (const file of storyFiles) {
      const content = readFile(file);
      if (!content) continue;
      if (/a11y:\s*\{\s*disable:\s*true/.test(content)) {
        violations.push({
          category: 'quality', severity: 'high', slug, stack,
          file: relative(ROOT, file), rule: 'a11y_disabled',
          message: 'a11y.disable: true em story (sem justificativa)',
        });
      }
    }

    // 3. Stories sem play function cobrindo F2 (click) e F6 (keyboard)
    // Check mais leve: conta quantas stories têm `play:` no arquivo
    // O auditor agent valida critérios específicos; aqui só reporta "zero play".
    for (const file of storyFiles) {
      if (basename(file).match(/-(modos|variantes|composicoes|layouts|estados|tamanhos)\.stories\./)) {
        const content = readFile(file);
        if (!content) continue;
        if (!/\bplay:\s*async/.test(content)) {
          violations.push({
            category: 'quality', severity: 'low', slug, stack,
            file: relative(ROOT, file), rule: 'substory_no_play',
            message: 'sub-story sem nenhuma play function (cobertura de testes zero)',
          });
        }
      }
    }
  }

  // 4. translations.json — textos descritivos com props literais (vide guideline 11)
  const translationFile = join(ROOT, 'docs', 'shared', 'content', slug, 'translations.json');
  if (existsSync(translationFile)) {
    const json = JSON.parse(readFile(translationFile) || '{}');
    const CODE_KEY_RX = /(Code|^code[A-Z]|^structure[A-Z]|^extensibility|^customization|^interface[A-Z]|href)/;
    const TYPE_PATH_RX = /\.table\.[^.]+\.type$/;
    const PROP_NAME_PATH_RX = /\.(items|table)\.[^.]+\.name$/;
    const LITERAL_RX = [
      { rx: /type=\\?"(single|multiple)\\?"/, label: 'type="single|multiple"' },
      { rx: /\bcollapsible\b/, label: 'collapsible' },
      { rx: /\b(asChild|as-child)\b/, label: 'asChild/as-child' },
      { rx: /\b(modelValue|@update:)/, label: 'modelValue/@update:' },
      { rx: /bind:(value|checked|open|pressed)/, label: 'bind:value/checked' },
      { rx: /\bon(Value|Checked|Open|Pressed|ValueCommit)/, label: 'onValueChange/onCheckedChange' },
      { rx: /defaultValue=\\?"[^"]+\\?"/, label: 'defaultValue="..." (não array)' },
    ];

    function visit(node, keyPath) {
      if (node == null) return;
      if (typeof node === 'string') {
        const last = keyPath[keyPath.length - 1] || '';
        const full = keyPath.join('.');
        // `some` e não só a última chave: com as variantes por stack, o snippet
        // mora em `structureCode.react` — a folha vira o nome da stack e a marca
        // de código fica no ancestral. Testar só a folha acusava JSX como texto.
        if (keyPath.some((k) => CODE_KEY_RX.test(k)) || TYPE_PATH_RX.test(full) || PROP_NAME_PATH_RX.test(full)) return;
        for (const { rx, label } of LITERAL_RX) {
          if (rx.test(node)) {
            violations.push({
              category: 'quality', severity: 'low', slug,
              stack: 'shared', file: relative(ROOT, translationFile),
              rule: 'translation_literal_prop',
              message: `[${keyPath[0]}] ${full} usa literal "${label}" em texto — preferir conceito (vide guideline 11)`,
            });
            break; // 1 violação por chave/locale
          }
        }
        return;
      }
      if (typeof node === 'object') {
        for (const [k, v] of Object.entries(node)) visit(v, [...keyPath, k]);
      }
    }

    visit(json, []);

    // 5. Tokens documentados que não existem no CSS. A tabela de tokens é a
    // parte da doc que o consumidor copia para customizar — token inventado
    // vira sobrescrita silenciosamente inerte.
    const known = definedTokens();
    const seenToken = new Set();
    for (const m of (readFile(translationFile) || '').matchAll(/"(--[a-z0-9-]+)"/gi)) {
      const token = m[1].toLowerCase();
      if (known.has(token) || seenToken.has(token)) continue;
      seenToken.add(token);
      violations.push({
        category: 'quality', severity: 'medium', slug,
        stack: 'shared', file: relative(ROOT, translationFile),
        rule: 'unknown_token_reference',
        message: `token "${token}" documentado mas não definido em nenhum CSS do projeto — customização seria inerte`,
      });
    }
  }

  // 6. Vocabulário de lib que saiu do projeto. Radix, shadcn e Tailwind foram
  // substituídos pelo CSS `.nds-*`; menção sobrevivente ensina o consumidor a
  // usar uma API que o design system não expõe mais. Vale para texto e snippet.
  // A lista vive no módulo (DEAD_LIB_RX) e é compartilhada com o check de infra.
  const deadLibTargets = [
    join(ROOT, 'docs', 'shared', 'content', slug, 'translations.json'),
    ...STACKS.flatMap((s) => filesForSlug(slug, s).docs),
  ];
  for (const file of deadLibTargets) {
    const content = readFile(file);
    if (!content) continue;
    const rel = relative(ROOT, file);
    const isJson = rel.endsWith('.json');
    for (const { rx, label } of DEAD_LIB_RX) {
      // Em código, comentário que nomeia a lib costuma ser justamente o registro
      // de que ela saiu ("API do Radix, que o projeto não usa mais"). O que
      // importa é o que o consumidor lê renderizado — comentário não renderiza.
      const hit = content.split('\n').findIndex(
        (l) => rx.test(l) && (isJson || !/^\s*(\/\/|\/\*|\*|<!--)/.test(l)),
      );
      if (hit === -1) continue;
      violations.push({
        category: 'quality', severity: 'medium', slug,
        stack: rel.startsWith('docs') ? 'shared' : rel.split(/[\\/]/)[0].replace('nortear-design-system-', ''),
        file: rel, line: hit + 1, rule: 'dead_lib_reference',
        message: `menciona "${label}" — lib removida do projeto na migração para .nds-*`,
      });
    }
  }

  violations.push(...auditStoryQuality(slug));
  violations.push(...auditStoryApiReference(slug));
  violations.push(...auditContractCoverage(slug));
  violations.push(...auditPlayIdempotente(slug));

  return violations;
}

// ─── CLI ────────────────────────────────────────────────────────────────────

function runAudit(slug, category) {
  const runners = {
    security: auditSecurity,
    performance: auditPerformance,
    analytics: auditAnalytics,
    quality: auditQuality,
  };

  if (category && runners[category]) {
    return runners[category](slug);
  }

  return [
    ...auditSecurity(slug),
    ...auditPerformance(slug),
    ...auditAnalytics(slug),
    ...auditQuality(slug),
    ...auditTaxonomy(slug),
    ...auditI18nKeys(slug),
    ...auditComponentVars(slug),
    ...auditInlineStyle(slug),
    ...auditGuardrails(slug),
    ...auditSidebarVocab(slug),
  ];
}

function formatText(violations, slug) {
  if (violations.length === 0) return `✓ ${slug} — nenhuma violação determinística encontrada.`;

  const bySeverity = { high: [], medium: [], low: [] };
  for (const v of violations) bySeverity[v.severity].push(v);

  let out = `# Audit determinístico — ${slug}\n\n`;
  out += `Total: ${violations.length} (high: ${bySeverity.high.length}, medium: ${bySeverity.medium.length}, low: ${bySeverity.low.length})\n\n`;

  for (const sev of ['high', 'medium', 'low']) {
    if (bySeverity[sev].length === 0) continue;
    out += `## ${sev.toUpperCase()}\n\n`;
    for (const v of bySeverity[sev]) {
      const loc = v.line ? `${v.file}:${v.line}` : v.file;
      out += `- [${v.category}] ${v.stack}/${v.rule}: ${v.message}\n  → ${loc}\n`;
    }
    out += '\n';
  }
  return out;
}

// Parse args
const args = process.argv.slice(2);
const json = args.includes('--json');
const all = args.includes('--all');
const categoryIdx = args.indexOf('--category');
const category = categoryIdx >= 0 ? args[categoryIdx + 1] : null;

// Adoção do contrato de teste. Fora do audit de propósito: componente que
// ainda não adotou não é violação, e entrar no exit code quebraria o gate
// "audit limpo" dos 48 componentes de uma vez.
if (args.includes('--contract-status')) {
  const linhas = contractStatus();
  if (json) {
    console.log(JSON.stringify(linhas.map((r) => ({
      slug: r.slug, total: r.total,
      stacks: Object.fromEntries(r.porStack.map((p) => [p.stack, p.resolvidos])),
    })), null, 2));
  } else {
    const adotados = linhas.filter((r) => r.porStack.some((p) => p.resolvidos > 0));
    console.log(`# Contrato de teste — adoção\n`);
    console.log(`${adotados.length} de ${linhas.length} componentes declaram cobertura.\n`);
    for (const r of linhas) {
      const detalhe = r.porStack.map((p) => `${p.stack}:${p.resolvidos}/${r.total}`).join('  ');
      const marca = r.porStack.every((p) => p.resolvidos === r.total) ? '✓'
        : r.porStack.some((p) => p.resolvidos > 0) ? '~' : ' ';
      console.log(`${marca} ${r.slug.padEnd(18)} ${detalhe}`);
    }
  }
  process.exit(0);
}
const slug = args.find(a => !a.startsWith('--') && a !== category);

if (!slug && !all) {
  console.error('Uso: node scripts/audit.mjs <slug> [--json] [--category <cat>]');
  console.error('     node scripts/audit.mjs --all [--json]');
  process.exit(1);
}

const slugs = all
  ? (() => {
      const content = join(ROOT, 'docs', 'shared', 'content');
      return readdirSync(content).filter(s => existsSync(join(content, s, 'translations.json')));
    })()
  : [slug];

const allViolations = {};
for (const s of slugs) {
  allViolations[s] = runAudit(s, category);
}

// Infra é slug-independente: roda 1x por processo, sob "_infra".
if (!category || category === 'analytics') {
  const infra = [...auditAnalyticsInfra(), ...auditAnalyticsPayloads()];
  if (infra.length > 0) allViolations['_infra'] = [...(allViolations['_infra'] ?? []), ...infra];
}
if (!category || category === 'quality') {
  const infra = [...auditDeadLibInfra(), ...auditCssTokenUsage(), ...auditOrphanTokens(), ...auditTypeRamp(), ...auditDocumentLang(), ...auditStorybookInfra(), ...auditGuidelineCode(), ...auditFoundationLabels()];
  if (infra.length > 0) allViolations['_infra'] = [...(allViolations['_infra'] ?? []), ...infra];
}

if (json) {
  process.stdout.write(JSON.stringify(allViolations, null, 2) + '\n');
} else {
  for (const s of Object.keys(allViolations)) {
    process.stdout.write(formatText(allViolations[s], s) + '\n');
  }
}

// Exit code 0 se limpo, 1 se high, 2 se medium/low
const all_v = Object.values(allViolations).flat();
if (all_v.some(v => v.severity === 'high')) process.exit(1);
if (all_v.length > 0) process.exit(2);
process.exit(0);
