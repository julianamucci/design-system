#!/usr/bin/env node
// scripts/audit.mjs — Deterministic audit for the design-system pipeline.
//
// Uso:
//   node scripts/audit.mjs <slug> [--json]           // audit de um componente
//   node scripts/audit.mjs --all [--json]            // audit de todos
//   node scripts/audit.mjs <slug> --category <cat>   // só 1 categoria
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
const STACKS = ['react', 'vue', 'svelte', 'vanilla'];

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
    return SUFFIX_RX.test(n) || f.toLowerCase().includes(`/${s}/`);
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

const PAGE_EXT = { react: 'tsx', vue: 'vue', svelte: 'svelte', vanilla: 'ts' };

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
  const start = content.search(new RegExp(`(^|[\\s,{])${name}\\s*:\\s*\\{`, 'm'));
  if (start < 0) return null;
  const open = content.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < content.length; i++) {
    const c = content[i];
    if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return content.slice(open + 1, i);
  }
  return null;
}

/**
 * Pares [chave, valor] de primeiro nível de um corpo de objeto literal.
 * Precisa varrer em profundidade: uma busca textual por `<chave>:` acharia a
 * ocorrência aninhada (`table: { defaultValue: … }`) antes da de primeiro nível.
 */
function topLevelEntries(body) {
  if (!body) return [];
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
        const expects = (body.match(/\bexpect\(/g) || []).length;
        (coverage[name] ??= {})[stack] = expects;

        if (expects === 0) {
          violations.push({
            category: 'quality', severity: 'medium', slug, stack,
            file: rel, rule: 'play_without_assertion',
            message: `story ${name}: play function sem nenhum expect() — não verifica nada`,
          });
        } else if (NOOP_ASSERTION_RX.test(body) && expects <= 2) {
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

  // Mesma story com cobertura desproporcional entre stacks: uma testa de
  // verdade, outra tem placeholder. Foi o sintoma visível das no-op.
  for (const [name, byStack] of Object.entries(coverage)) {
    const counts = Object.values(byStack);
    if (counts.length < 2) continue;
    const min = Math.min(...counts);
    const max = Math.max(...counts);
    if (min <= 1 && max >= 3) {
      const detail = Object.entries(byStack).map(([s, n]) => `${s}:${n}`).join(' ');
      violations.push({
        category: 'quality', severity: 'medium', slug, stack: 'cross-stack',
        file: `stories/${slug}`, rule: 'coverage_divergence',
        message: `story ${name} tem cobertura desproporcional entre stacks (${detail}) — a de menor contagem provavelmente é placeholder`,
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

/** Libs e helpers que saíram do projeto e não devem mais ser ensinados. */
const DEAD_LIB_RX = [
  { rx: /@radix-ui|\bradix\b/i, label: 'Radix' },
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
// --radix- de propósito FORA: o Radix saiu do projeto, então ninguém escreve
// essas variáveis e um var(--radix-*) sobrevivente é keyframe morto.
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

      // tNav/tUi leem ui.json; t/tContent/tStore leem o conteúdo do componente.
      const alvos = [
        [/\bt(?:Nav|Ui)\(\s*['"]([a-zA-Z0-9_.]+)['"]/g, uiKeys, 'ui.json'],
        [/\$?t(?:Content|Store)?\(\s*['"]([a-zA-Z0-9_.]+)['"]/g, contentKeys, 'translations.json'],
      ];

      for (const [rx, conhecidas, fonte] of alvos) {
        const faltando = new Set();
        for (const m of content.matchAll(rx)) {
          const key = m[1];
          if (!key.includes('.') || conhecidas.has(key)) continue;
          // tNav e t coexistem no mesmo arquivo; só acusa se não estiver em nenhum.
          if (uiKeys.has(key) || contentKeys.has(key)) continue;
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
        if (CODE_KEY_RX.test(last) || TYPE_PATH_RX.test(full) || PROP_NAME_PATH_RX.test(full)) return;
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
  const infra = [...auditDeadLibInfra(), ...auditCssTokenUsage()];
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
