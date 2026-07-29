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

  const uiFiles = globStack(stack, 'components/ui', ext).filter(f => {
    const n = basename(f).toLowerCase();
    return n.startsWith(slug.toLowerCase()) || f.toLowerCase().includes(`/${slug.toLowerCase()}/`);
  });
  const docsFiles = globStack(stack, 'components/docs', ext).filter(f => {
    return basename(f).startsWith(Slug);
  });

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

    for (const file of storyFiles) {
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

function auditQuality(slug) {
  const violations = [];
  const REQUIRED_SECTIONS = [
    'demonstracao', 'anatomia', 'quando-usar', 'do-dont', 'importacao',
    'variantes', 'estados', 'propriedades', 'tokens', 'acessibilidade',
    'relacionados', 'notas', 'analytics', 'testes',
  ];

  for (const stack of STACKS) {
    const { docs } = filesForSlug(slug, stack);
    for (const file of docs) {
      const content = readFile(file);
      if (!content) continue;

      // 1. Seções obrigatórias
      for (const id of REQUIRED_SECTIONS) {
        const re = new RegExp(`\\b(id=|id:\\s*)['"\\\`]${id}['"\\\`]`);
        if (!re.test(content)) {
          violations.push({
            category: 'quality', severity: 'medium', slug, stack,
            file: relative(ROOT, file), rule: 'missing_section',
            message: `Seção obrigatória ausente: id="${id}"`,
          });
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
  const DEAD_LIB_RX = [
    { rx: /@radix-ui|\bradix\b/i, label: 'Radix' },
    { rx: /\bshadcn\b/i, label: 'shadcn' },
    { rx: /\bbasecoat\b/i, label: 'Basecoat' },
    { rx: /\btailwind\b/i, label: 'Tailwind' },
  ];
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

// Infra de analytics é slug-independente: roda 1x por processo, sob "_infra".
if (!category || category === 'analytics') {
  const infra = [...auditAnalyticsInfra(), ...auditAnalyticsPayloads()];
  if (infra.length > 0) allViolations['_infra'] = infra;
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
