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

import { readFileSync, existsSync, readdirSync, writeFileSync } from 'node:fs';
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
/**
 * Tokens visíveis DE DENTRO de uma stack: o compartilhado mais o `src/styles`
 * dela. `definedTokens()` é a UNIÃO das cinco, e por isso não serve para julgar
 * documentação: `--shadow-md` existe no `globals.css` de react e svelte, e o
 * que o documenta na tabela de tokens é o vanilla, onde ele não existe. Union
 * responde "alguém define?"; aqui a pergunta é "quem lê esta página consegue
 * usar?".
 */
const _tokensPorStack = new Map();
function definedTokensForStack(stack) {
  if (_tokensPorStack.has(stack)) return _tokensPorStack.get(stack);
  const set = new Set();
  const files = [
    ...walkDir(join(ROOT, 'docs', 'shared'), ['.css']),
    ...walkDir(join(ROOT, stackDir(stack), 'src', 'styles'), ['.css']),
  ];
  for (const f of files) {
    for (const m of (readFile(f) || '').matchAll(/(--[a-z0-9-]+)\s*:/gi)) set.add(m[1].toLowerCase());
  }
  _tokensPorStack.set(stack, set);
  return set;
}

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

/**
 * Todos os slugs de componente — os diretórios de `docs/shared/content` que têm
 * `translations.json`. Memoizado: a varredura de infra pergunta uma vez por
 * stack e a lista não muda dentro do processo.
 */
let _slugsDoConteudo;
function slugsDoConteudo() {
  if (!_slugsDoConteudo) {
    const dir = join(ROOT, 'docs', 'shared', 'content');
    _slugsDoConteudo = readdirSync(dir).filter((s) => existsSync(join(dir, s, 'translations.json')));
  }
  return _slugsDoConteudo;
}

// Formas de escrever HTML dinâmico em cada stack, com o grupo 1 capturando a
// expressão. Vive fora das funções porque DUAS a consomem: a varredura por slug
// e a varredura de infra, que cobre o que slug nenhum reivindica.
const HTML_DINAMICO = [
  { name: 'dangerouslySetInnerHTML', re: /dangerouslySetInnerHTML\s*=\s*\{\{\s*__html:\s*([^}]+)\}\}/g, stacks: ['react'] },
  { name: 'v-html', re: /v-html\s*=\s*"([^"]+)"/g, stacks: ['vue'] },
  { name: '{@html}', re: /\{@html\s+([^}]+)\}/g, stacks: ['svelte'] },
  // `emJs` marca o único padrão cujo trecho casado é código JavaScript solto
  // num arquivo .ts — onde um snippet de documentação guardado em template
  // literal pode ser confundido com atribuição real. Nos outros quatro o
  // casamento acontece em MARKUP, e no Angular o markup mora inteiro dentro de
  // `template: ` + crases: aplicar ali a guarda de template literal cega a
  // stack toda. Não é hipótese — foi medido por mutação, e a regra deixou de
  // acusar um `[innerHTML]` com o sanitize removido à mão.
  { name: '.innerHTML=', re: /\.innerHTML\s*=\s*([^;]+);/g, stacks: ['vanilla'], emJs: true },
  // Angular: o binding [innerHTML] passa pelo DomSanitizer do framework,
  // ao contrário dos quatro acima. Exigimos DOMPurify assim mesmo — a
  // guideline 09 vale para as cinco stacks, e o SAST só reconhece o
  // sanitizador de taint quando a chamada está no próprio call site.
  // Sem isto, uma docs page Angular passaria no audit com a chamada
  // escondida atrás de um computed `safe*` e o SAST reportaria XSS.
  { name: '[innerHTML]', re: /\[innerHTML\]\s*=\s*"([^"]+)"/g, stacks: ['angular'] },
];

/**
 * Uma expressão em `[innerHTML]` & cia. que NÃO precisa de sanitize.
 *
 * As duas isenções eram ancoradas no início da expressão, e por isso mais
 * estreitas que o conceito que codificam. O custo de uma isenção estreita é o
 * mesmo de um achado inventado: ensina a ignorar o portão.
 *
 *  1. SVG montado de constantes do próprio módulo. `${SVG_OPEN}${ICONES[n]}`
 *     não casava só porque abre com `${` em vez da constante nua. Nada externo
 *     entra no caminho, e sanitizar rodaria DOMPurify uma vez por ícone num
 *     catálogo de ~1600.
 *  2. Literal sem interpolação. A forma antiga rejeitava qualquer aspa DENTRO
 *     do literal — `` `<code>import { x } from 'lucide'</code>` `` caía por
 *     causa das aspas do próprio HTML, enquanto o literal idêntico sem aspas
 *     passava quatro linhas abaixo. O que torna um literal inerte é não ter
 *     `${` nem concatenação; aspa interna não tem nada a ver.
 */
function htmlInofensivo(expr) {
  const svgDeConstantes =
    /^['"`]<svg/.test(expr) || /(^|\$\{\s*)(CHEVRON|ICON|SVG)_[A-Z0-9_]*/.test(expr);

  const abre = expr[0];
  const ehLiteral = (abre === "'" || abre === '"' || abre === '`') && expr.at(-1) === abre;
  const literalInerte = ehLiteral && !expr.includes('${') && !/[^\\]\+/.test(expr.slice(1, -1));

  return svgDeConstantes || literalInerte;
}

/**
 * O trecho casado está DENTRO de um template literal, e portanto é texto e não
 * código?
 *
 * Apareceu num snippet de documentação: a `ChartDocs` do Vanilla guarda um
 * exemplo em `` const codeSmallInline = `… el.innerHTML = … ` ``, e o regex
 * casava o texto do exemplo como se fosse atribuição real. Corrigir o snippet
 * mudaria o que a página ensina — o achado é que estava errado.
 *
 * A paridade de crases antes do índice resolve: uma atribuição de verdade tem
 * número PAR de crases atrás dela (fora de qualquer literal); uma escrita
 * dentro de um template tem ímpar. É heurística de lint, não parser — crase
 * escapada é descontada, mas crase dentro de comentário pode enganar. O erro
 * possível é para o lado seguro do ruído: deixa de acusar, nunca inventa.
 */
/**
 * A expressão inteira, quando o regex a cortou no meio.
 *
 * O padrão do Vanilla é `.innerHTML\s*=\s*([^;]+);` — ele para no primeiro
 * ponto e vírgula, e ponto e vírgula DENTRO da string é comum:
 * `` `<code>import { X } from 'lucide';</code>` `` volta truncado, sem a crase
 * de fecho. Aí nenhum teste de "literal inerte" pode valer: o que sobrou nem
 * parece um literal.
 *
 * Quando a captura abre com crase e não fecha, o texto é reconstruído até a
 * crase de fecho de verdade. Sem isso a regra cobra sanitize de uma constante
 * sem interpolação nenhuma — e cobrar o que não tem risco é o caminho mais
 * curto para o portão virar ruído.
 */
function expressaoCompleta(content, m) {
  const bruto = m[1].trim();
  if (bruto[0] !== '`' || bruto.at(-1) === '`') return bruto;

  const inicio = m.index + m[0].indexOf(m[1]) + m[1].indexOf('`');
  for (let i = inicio + 1; i < content.length; i++) {
    if (content[i] !== '`') continue;
    let barras = 0;
    for (let k = i - 1; k >= 0 && content[k] === '\\'; k--) barras++;
    if (barras % 2 === 0) return content.slice(inicio, i + 1);
  }
  return bruto;
}

function dentroDeTemplateLiteral(content, index) {
  let crases = 0;
  for (let i = 0; i < index; i++) {
    if (content[i] !== '`') continue;
    let barras = 0;
    for (let k = i - 1; k >= 0 && content[k] === '\\'; k--) barras++;
    if (barras % 2 === 0) crases++;
  }
  return crases % 2 === 1;
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
      for (const { name, re, stacks, emJs } of HTML_DINAMICO) {
        if (!stacks.includes(stack)) continue;
        let m;
        re.lastIndex = 0;
        while ((m = re.exec(content)) !== null) {
          const expr = expressaoCompleta(content, m);
          if (emJs && dentroDeTemplateLiteral(content, m.index)) continue;
          if (!/sanitize/i.test(expr) && !htmlInofensivo(expr)) {
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

/**
 * A mesma regra de HTML dinâmico, agora nos arquivos que slug NENHUM reivindica.
 *
 * `filesForSlug` casa `components/ui/<slug>*` e `components/docs/<Slug>Docs.*`.
 * Tudo que não tem nome de componente ficava fora da varredura de segurança nas
 * CINCO stacks: o renderer de Foundations, as páginas de fundamento
 * (AboutDocs, AccessibilityDocs, TypographyDocs…), as 15 seções genéricas de
 * `components/docs/shared/sections/` e qualquer peça de produto.
 *
 * É justamente onde mais se escreve HTML vindo do conteúdo compartilhado — o
 * renderer de Foundations sozinho tem 14 bindings. O portão dizia "zero" e o
 * zero era verdadeiro só do que ele olhava.
 *
 * Os achados saem sob `_infra` para não inventar dono: o arquivo não pertence a
 * componente nenhum, e pendurá-lo num slug arbitrário mandaria quem for
 * consertar para o lugar errado.
 */
function auditSecurityInfra() {
  const violations = [];
  // Pergunta feita do ARQUIVO, não do slug: montar o conjunto de cobertos
  // chamando `filesForSlug` para os 47 slugs × 5 stacks fazia 470 varreduras de
  // diretório e levava o audit de segundos a minutos — um portão que ninguém
  // roda deixa de ser portão. Aqui cada arquivo é testado uma vez contra a
  // mesma regra de nome que `filesForSlug` usa.
  const slugs = slugsDoConteudo();
  const nomesDeDocs = new Set(
    slugs.map((s) => {
      const S = s.charAt(0).toUpperCase() + s.slice(1).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      return `${S}docs`.toLowerCase();
    }),
  );
  const rxUi = slugs.map(
    (s) => new RegExp(`^${s}(\\.|-(${STORY_VARIANT_SUFFIXES.join('|')})\\.)`),
  );

  const reivindicado = (norm) => {
    const nome = basename(norm).toLowerCase();
    if (norm.includes('/components/docs/')) {
      const semExt = nome.replace(/\.[^.]+$/, '');
      return nomesDeDocs.has(semExt);
    }
    if (norm.includes('/components/ui/')) {
      return rxUi.some((rx) => rx.test(nome)) || slugs.some((s) => norm.includes(`/${s}/`));
    }
    return false;
  };

  for (const stack of STACKS) {
    for (const pasta of ['components/docs', 'components/ui', 'components/product']) {
      for (const file of globStack(stack, pasta, null)) {
        const norm = file.replace(/\\/g, '/').toLowerCase();
        if (reivindicado(norm)) continue;
        // Story e teste não vão para produção; `.mdx` é invólucro sem binding.
        if (/\.(stories|test|spec)\./.test(norm) || norm.endsWith('.mdx')) continue;

        const content = readFile(file);
        if (!content) continue;

        for (const { name, re, stacks, emJs } of HTML_DINAMICO) {
          if (!stacks.includes(stack)) continue;
          let m;
          re.lastIndex = 0;
          while ((m = re.exec(content)) !== null) {
            const expr = expressaoCompleta(content, m);
            if (emJs && dentroDeTemplateLiteral(content, m.index)) continue;
            if (/sanitize/i.test(expr) || htmlInofensivo(expr)) continue;
            violations.push({
              category: 'security', severity: 'high', slug: '_infra', stack,
              file: relative(ROOT, file),
              line: content.slice(0, m.index).split('\n').length,
              rule: 'html_dynamic_unsanitized',
              message: `${name} sem DOMPurify.sanitize(): ${expr.slice(0, 60)}`,
            });
          }
        }
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
  'variants', 'states', 'compositions', 'modes', 'sizes',
  'layouts', 'settings', 'types',
];

/** Divide o arquivo por `export const <Nome>` e devolve [nome, corpo]. */
/**
 * Grupo da barra lateral, lido do NOME DO ARQUIVO.
 *
 * É o arquivo que decide, não o `title`: o `title` do sufixo é sempre
 * `Primitives/<Categoria>/<Slug>/<Grupo>` e repete a informação. Ler do nome
 * dispensa parsear o `meta` e funciona igual nas cinco stacks.
 */
function grupoDaStory(caminhoRelativo) {
  const base = basename(caminhoRelativo).replace(/\.stories\.[a-z]+$/, '');
  const m = base.match(/-(variants|states|compositions|sizes|modes|layouts)$/);
  return m ? m[1] : 'raiz';
}

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
/**
 * Palavras depois das quais uma `/` abre EXPRESSÃO REGULAR, e não divisão.
 *
 * Sem esta lista, `return /x/.test(s)` seria lido como divisão, porque o
 * caractere anterior é letra.
 */
const ANTES_DE_REGEX = new Set([
  'return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void',
  'case', 'do', 'else', 'yield', 'await', 'throw',
]);

/** A `/` nesta posição abre regex, ou é divisão? */
function abreRegex(anterior, palavraAnterior) {
  if (!anterior) return true;                       // começo do arquivo
  if (ANTES_DE_REGEX.has(palavraAnterior)) return true;
  // Depois de valor — identificador, número, `)`, `]`, `}` — só pode ser
  // divisão. Depois de operador ou abre-delimitador, só pode ser regex.
  return !/[\w$)\]}]/.test(anterior);
}

function stripComments(src) {
  let out = '', inStr = null, i = 0;
  // Último caractere significativo e a última palavra, para decidir se `/`
  // abre regex.
  let anterior = '', palavra = '';
  const registrar = (c) => {
    if (/\s/.test(c)) { palavra = ''; return; }
    anterior = c;
    palavra = /[\w$]/.test(c) ? palavra + c : '';
  };
  while (i < src.length) {
    const c = src[i];
    if (inStr) {
      out += c;
      if (c === '\\') { out += src[i + 1] ?? ''; i += 2; continue; }
      if (c === inStr) inStr = null;
      i++;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { inStr = c; out += c; registrar(c); i++; continue; }
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
    /*
     * LITERAL DE EXPRESSÃO REGULAR, copiado inteiro sem passar pelo rastreio de
     * aspas.
     *
     * `/variant="([^"]+)"/g` tem TRÊS aspas duplas. Sem este ramo, a segunda
     * fechava a string aberta pela primeira e a terceira abria outra que nunca
     * fechava — daí para a frente tudo virava "dentro de string", e o `//` da
     * linha seguinte deixava de ser reconhecido como comentário. O comentário
     * sobrevivia e virava código para quem consome esta função: medido, um
     * comentário em português passou a contar como seis identificadores.
     *
     * É o mesmo mecanismo do apóstrofo em `Don't`, agora por outra porta.
     */
    if (c === '/' && abreRegex(anterior, palavra)) {
      let j = i + 1, emClasse = false, fechou = false;
      while (j < src.length) {
        const d = src[j];
        if (d === '\\') { j += 2; continue; }
        if (d === '\n') break;                       // regex não atravessa linha
        if (emClasse) { if (d === ']') emClasse = false; j++; continue; }
        if (d === '[') { emClasse = true; j++; continue; }
        if (d === '/') { fechou = true; break; }
        j++;
      }
      if (fechou) {
        j++;
        while (j < src.length && /[dgimsuvy]/.test(src[j])) j++;   // sinalizadores
        out += src.slice(i, j);                      // offsets preservados
        anterior = '/'; palavra = '';
        i = j;
        continue;
      }
      // Não fechou na linha: era divisão mesmo. Segue o fluxo normal.
    }
    out += c;
    registrar(c);
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
  /** story -> stack -> grupo da barra lateral. Ver `story_group_divergent`. */
  const grupos = {};

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
    // `startsWith` (ou `-[a-z]+` genérico) atribuiria alert-dialog-states ao
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
        // O GRUPO é lido antes do filtro de `play`: story sem play já reprova
        // por outra regra, e deixá-la fora daqui esconderia a divergência de
        // barra lateral justamente no caso mais malfeito.
        if (/\.stories\.[a-z]+$/.test(rel)) {
          (grupos[name] ??= {})[stack] = grupoDaStory(rel);
        }
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
      //
      // O lookbehind é o mesmo de `dead_class_in_component` (ver a nota lá), e
      // entrou aqui pelo mesmo motivo: `:class="captionClass"` e
      // `v-bind:class="x"` casavam por terminarem em `class=`, e o que entrava
      // como "classe" era o nome da EXPRESSÃO. A regra reprovava a story por
      // uma classe chamada `captionClass`, que ninguém escreveu. A forma de
      // objeto em JS (`class: 'nds-x'`) continua casando: ali o caractere
      // anterior é espaço ou `{`, não `:`.
      // `cellClass`, `headerClass`, `triggerClass`…: chave de configuração que
      // carrega classe e cai direto no `class` do elemento. O lookbehind
      // `(?<![:[\w-])` as excluía — o caractere antes de "class" é uma letra —
      // e por isso `cellClass: 'font-medium tabular-nums'` sobreviveu no Svelte
      // do data-table, inerte, enquanto a MESMA classe era acusada no Vue por
      // estar escrita como `class:`. O sufixo `Class` só é aceito depois de
      // outra palavra em camelCase, para não voltar a casar `captionClass` do
      // lado do VALOR (que é nome de expressão, não classe).
      // O `\s*` antes de `[:=]` é o que faz a ATRIBUIÇÃO ser vista. Sem ele a
      // regra exigia o operador colado ao nome, então `el.className = '…'`
      // escapava e `el.className='…'` não — diferença de um espaço. As
      // composições do dropdown-menu no Vanilla montavam o menu à mão assim e
      // passavam limpas com ~120 linhas de utilitário morto.
      const seen = new Set();
      const RX_CLASSE_LITERAL =
        /(?<![:[\w-])(?:class(?:Name)?|[a-z]+Class)\s*[:=]\s*["'`]([^"'`]+)["'`]/g;
      for (const m of content.matchAll(RX_CLASSE_LITERAL)) {
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

  // Mesma story em GRUPOS diferentes da barra lateral conforme a stack.
  //
  // Cinco pessoas leem "uma story por variante" e classificam igual; cinco
  // AGENTES em paralelo, que não se veem, classificam diferente — e o que sai
  // é o mesmo componente com cinco árvores de menu.
  //
  // O caso que originou a regra, e que JÁ FOI CORRIGIDO — fica como registro do
  // que ela mede, não como descrição do estado de hoje: no combobox,
  // `MultipleWithChips` estava na raiz em três stacks e em variantes em duas,
  // `SingleLineChips` em composições numa e em variantes em quatro, e
  // `CustomFilter` e `Controlled` cada uma em dois grupos.
  //
  // Nenhum portão via isso. `coverage_divergence` compara CONTAGEM de asserção
  // da mesma story e precisa que o nome exista dos dois lados; `contract_
  // divergent` compara item de contrato. Em que arquivo a story mora — que é o
  // que decide o grupo — não era medido por ninguém, e a árvore divergia com
  // tudo verde.
  for (const [name, byStack] of Object.entries(grupos)) {
    const presentes = Object.entries(byStack);
    if (presentes.length < 2) continue;
    const distintos = new Set(presentes.map(([, g]) => g));
    if (distintos.size < 2) continue;
    const detalhe = presentes.map(([s, g]) => `${s}:${g}`).join(' ');
    violations.push({
      category: 'quality', severity: 'medium', slug, stack: 'cross-stack',
      file: `stories/${slug}`, rule: 'story_group_divergent',
      message:
        `story ${name} aparece em grupos diferentes da barra lateral conforme a stack (${detalhe})` +
        ' — quem lê a documentação de uma stack encontra a mesma story em outro lugar. O grupo sai do' +
        ' ARQUIVO: raiz é só o Playground, e o resto vai para -variants, -states ou -compositions',
    });
  }

  violations.push(...auditTextSurfaces(slug));
  violations.push(...auditNonexistentLibProps(slug));
  violations.push(...auditDeadClassInComponent(slug));
  violations.push(...auditUnknownClass(slug));
  violations.push(...auditExportSemStory(slug));
  violations.push(...auditTailwindUtility(slug));
  violations.push(...auditTokenTableRow(slug));

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
  // `existe[mn]?` porque o `\b` fazia "não existem" (plural) escapar da
  // negação e virar achado: a frase acusada em `09-disclosure-components.md`
  // era "Não existem props type nem collapsible (esses eram do @radix-ui
  // legado)" — escrita justamente para registrar a remoção. `legad` cobre a
  // outra forma de dizer a mesma coisa.
  /\bnunca\b|\bnão\s+(crie|recriar|recrie|usa|existe[mn]?|use|confie)\b|\bnenhum[ao]?\b|proib|removid|saí?ram|saiu|deprecat|resíduo|herdad|inerte|legad|em vez de|no lugar de/i;

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
  // Libs de gráfico que saíram do projeto — hoje é ECharts. Entraram na lista
  // depois da rodada do chart: as guidelines ensinavam `<BarChart
  // accessibilityLayer>` e `import { ... } from 'recharts'`, e a regra não as
  // via porque o vocabulário morto só listava lib de componente, não de dado.
  { rx: /\brecharts\b/i, label: 'Recharts' },
  { rx: /\bchart\.js\b|\bchartjs\b/i, label: 'Chart.js' },
  // `@apply` é diretiva do Tailwind e exige o build dele. Nenhuma das 5 stacks
  // declara Tailwind em `dependencies` nem em `devDependencies` (medido), então
  // o snippet de customização que ensina `@apply` é conselho inerte: quem
  // seguir não obtém estilo nenhum. O `\btailwind\b` não pegava, porque a
  // diretiva não nomeia a lib.
  { rx: /@apply\b/, label: '@apply (diretiva do Tailwind, que o projeto não tem)' },
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
      // Arquivo de TESTE fica de fora. Ele não vira markup, e o que ele carrega
      // são EXPRESSÕES sobre markup — `/nds-max-w-w+/`, `nds-w-(xs|full)` — que
      // esta regra lia como se fossem nomes de classe. Três falsos positivos
      // apareceram assim no dia em que os `*.source.test.ts` entraram na
      // varredura; classe morta de verdade mora no que renderiza.
      return all
        .filter((file) => !/.(test|spec).[jt]sx?$/.test(file))
        .map((file) => ({ file, stack: s }));
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

    // Degrau de ESCALA com fallback literal. Para token comum o fallback é
    // intenção declarada, e por isso a regra acima o aceita. Para uma escala
    // não é: `--spacing-3` ou existe, e aí o fallback é ruído, ou não existe, e
    // aí a propriedade resolve para o literal SEMPRE — deixando de acompanhar a
    // densidade sem sintoma nenhum. Foi por essa fresta que 166 fallbacks
    // atravessaram 39 folhas até a rodada `168a61bb`.
    //
    // O encadeamento `var(--x, var(--y))` continua permitido: ali a reserva é
    // outro token, não um número cravado.
    lines.forEach((line, i) => {
      for (const m of line.matchAll(/var\(\s*(--(?:spacing|size|radius|text|font-weight|line-height)-[a-z0-9-]+)\s*,\s*([^),]+)\)/gi)) {
        const token = m[1].toLowerCase();
        const reserva = m[2].trim();
        if (reserva.startsWith('var(')) continue; // reserva é outro token
        // Só acusa quando o degrau NÃO existe. Com o token definido, o literal
        // é letra morta — nunca se aplica — e acusá-lo renderia 51 achados sem
        // um defeito sequer, que é o tipo de ruído que ensina a ignorar a regra.
        if (known.has(token)) continue;
        const chave = `escala:${token}`;
        if (seen.has(chave)) continue;
        seen.add(chave);
        violations.push({
          category: 'quality', severity: 'high', slug: '_infra', stack: 'shared',
          file: rel, line: i + 1, rule: 'escala_com_fallback_literal',
          message: `var(${token}, ${reserva}) — o degrau NÃO existe na escala, então isto resolve para ${reserva} sempre e nunca acompanha a densidade`,
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
    // Guidelines POR STACK. Ficavam de fora, e era onde o vocabulário morto
    // mais sobrevivia: a rodada do chart reescreveu a seção compartilhada e as
    // quatro de `08-display-components`, e o Recharts continuou vivo em
    // `03-sistema-design`, `11-documentacao-componentes` e `13-system-design`
    // do React — arquivos que descrevem como construir componente novo.
    ...STACKS.flatMap((s) => walkDir(join(ROOT, stackDir(s), 'guidelines'), ['.md'])),
    ...walkDir(join(ROOT, 'docs', 'shared', 'skill-refs'), ['.md']),
    ...walkDir(join(ROOT, 'docs', 'shared', 'tokens'), ['.css']),
    ...walkDir(join(ROOT, 'docs', 'shared', 'themes'), ['.css']),
    ...walkDir(join(ROOT, 'docs', 'shared', 'styles'), ['.css']),
  ];

  for (const file of targets) {
    const content = readFile(file);
    if (!content) continue;
    const rel = relative(ROOT, file);
    // Havia aqui uma exceção para `tw-compat.css`, justificada por ele ser a
    // ponte declarada de compatibilidade. O arquivo foi fundido no
    // `utilities.css` e a exceção saiu junto: as duas menções afirmativas que
    // ela cobria viraram prosa negada, que é o que a regra já aceita. Exceção
    // por nome de arquivo é pior que negação no texto — ela isenta o arquivo
    // inteiro, para sempre, inclusive do que ainda vai ser escrito nele.
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
/**
 * Nome de utilitário do Tailwind numa docs page — lib que saiu do projeto.
 *
 * `dead_lib_reference` procura o NOME da lib ("Tailwind", "shadcn", "Radix").
 * Isto procura a FORMA do utilitário, que é como o vocabulário sobreviveu: a
 * coluna "Aplicação no tema" da tabela de tokens dizia `bg-primary` ao lado de
 * "Borda (variante default)" — instrução errada, não resíduo inerte, porque a
 * coluna existe para dizer ONDE o token entra e quem copiar `bg-primary` não
 * muda nada.
 *
 * Medido na primeira rodada: 104 ocorrências em 38 páginas, em quatro stacks.
 * A quinta já estava limpa e é a referência da forma certa — a coluna nomeia o
 * seletor `.nds-*` que lê o token.
 *
 * Só casa prefixo de utilitário seguido de nome de TOKEN do design system:
 * `border-radius` e `border-top` são CSS de verdade e ficam de fora. Snippet
 * exibido ao leitor também fica: dentro de crase é código que a página ENSINA,
 * e pode legitimamente mostrar markup de outra época.
 */
const TAILWIND_TOKEN =
  '(foreground|background|primary|secondary|muted|accent|destructive|warning|success|info|border|ring|card|popover|sidebar|input)';
const TAILWIND_UTILITY_RX = new RegExp(
  `['"](?:hover:|focus:|focus-visible:|dark:|group-hover:)?` +
    `(?:bg|text|border|ring|ring-offset|fill|stroke)-${TAILWIND_TOKEN}[a-z0-9/-]*['"]`,
  'g',
);

/**
 * Mesma varredura, no CONTEÚDO COMPARTILHADO. Precisa de regex própria porque
 * ali a utilitária não vem delimitada por aspas — vem dentro de prosa
 * (`recebe <code>bg-accent</code>`) ou no meio de um atributo já escapado do
 * snippet. A aspa do outro regex servia de âncora à esquerda; aqui a âncora
 * tem de ser explícita.
 *
 * `(?<![\w-])` é o ponto todo desta regra. Sem ela, `nds-text-muted-foreground`
 * — a classe VIVA, o alvo da correção — casa no sufixo e entra na conta como
 * morta. Medido nesta campanha: a varredura sem âncora acusou 53 chaves em 13
 * componentes; com âncora, 31 em 10, e as 22 diferenças eram todas classe já
 * corrigida. Portão que conta o consertado como quebrado manda gente reescrever
 * texto que estava certo, e é o terceiro erro de medição desta mesma varredura
 * — os outros dois foram regex só de aspas simples (escondeu uma stack
 * inteira) e `lastIndex` compartilhado entre `.test()` e `matchAll`.
 *
 * Aqui NÃO há máscara de snippet. Na docs page, crase é código que a página
 * ENSINA e pode mostrar markup de outra época; no conteúdo compartilhado, a
 * chave `*Code` É o snippet recomendado, copiado pelo leitor nas cinco stacks
 * de uma vez. É o caso mais grave, não a exceção.
 */
const TAILWIND_UTILITY_CONTEUDO_RX = new RegExp(
  `(?<![\\w-])(?:hover:|focus:|focus-visible:|dark:|group-hover:)?` +
    `(?:bg|text|border|ring|ring-offset|fill|stroke)-${TAILWIND_TOKEN}[a-z0-9/-]*(?![\\w-])`,
  'g',
);

function auditTailwindUtility(slug) {
  const violations = [];
  for (const stack of STACKS) {
    const { docs } = filesForSlug(slug, stack);
    for (const file of docs) {
      const content = readFile(file);
      if (!content) continue;
      // Pré-filtro no texto CRU: descascar comentário e montar a máscara de
      // snippet custa uma varredura cada, e a maioria das páginas não tem
      // ocorrência nenhuma. Sem esta linha o `--all` passava de dois minutos.
      TAILWIND_UTILITY_RX.lastIndex = 0;
      const temAlgo = TAILWIND_UTILITY_RX.test(content);
      // `.test()` num regex GLOBAL avança `lastIndex`, e `matchAll` COPIA esse
      // índice — sem zerar aqui, a varredura começava depois do primeiro
      // achado. Efeito: todo arquivo relatava n−1 ocorrências, e arquivo com
      // exatamente UMA sumia do relatório. Medido: duas páginas do Vue ficaram
      // invisíveis, e o portão dizia 26 quando eram 28.
      TAILWIND_UTILITY_RX.lastIndex = 0;
      if (!temAlgo) continue;

      const src = stripComments(content);
      const mask = snippetMask(src);
      const achados = new Set();
      for (const m of src.matchAll(TAILWIND_UTILITY_RX)) {
        if (mask[m.index]) continue;              // dentro de crase: é snippet
        achados.add(m[0].slice(1, -1));
      }
      if (!achados.size) continue;
      violations.push({
        category: 'quality', severity: 'medium', slug, stack,
        file: relative(ROOT, file), rule: 'tailwind_utility_in_docs',
        message:
          `${achados.size} nome(s) de utilitário do Tailwind na docs page (${[...achados].slice(0, 4).join(', ')})` +
          ' — a lib saiu do projeto. Na tabela de tokens, a coluna do meio nomeia o SELETOR' +
          ' `.nds-*` que lê o token; quem copiar `bg-primary` não muda nada',
      });
    }
  }

  // O conteúdo compartilhado renderiza nas CINCO stacks de uma vez, nas três
  // línguas — é a forma mais cara do mesmo defeito, e ficava fora do alcance
  // porque a regra só olhava docs page. Varre o arquivo cru: as três línguas
  // carregam o mesmo snippet, e o Set já colapsa a repetição.
  const conteudo = join(ROOT, 'docs', 'shared', 'content', slug, 'translations.json');
  const bruto = readFile(conteudo);
  if (bruto) {
    TAILWIND_UTILITY_CONTEUDO_RX.lastIndex = 0;
    const achados = new Set(bruto.match(TAILWIND_UTILITY_CONTEUDO_RX) || []);
    if (achados.size) {
      violations.push({
        category: 'quality', severity: 'high', slug, stack: 'shared',
        file: relative(ROOT, conteudo), rule: 'tailwind_utility_in_docs',
        message:
          `${achados.size} nome(s) de utilitário do Tailwind no conteúdo COMPARTILHADO ` +
          `(${[...achados].slice(0, 4).join(', ')}) — renderiza nas cinco stacks. ` +
          'Em prosa, descreva o efeito e nomeie o TOKEN (`--accent`); em chave `*Code`,' +
          ' use a classe `.nds-*` que existe na folha — o leitor copia o snippet',
      });
    }
  }

  return violations;
}

/**
 * `token_table_row_incoerente` — a linha da tabela de tokens traz DUAS colunas
 * que precisam fechar entre si: o token, e o seletor `.nds-*` que o lê. A regra
 * pergunta se a regra CSS daquele seletor declara aquele token. As duas pontas
 * saem do mesmo objeto literal, então é verificação fechada, sem heurística de
 * composição.
 *
 * Medido: 11 achados em 594 linhas, nas cinco stacks, e os quatro grupos
 * conferidos na folha um a um. O pior deles ensinava o oposto de uma decisão
 * registrada — a tabela do alert-dialog mandava sobrescrever
 * `--destructive-foreground`, e o `button.css` diz por escrito que esse token
 * não entra ali porque a variante destrutiva é soft.
 *
 * A versão LARGA desta ideia — "a folha do slug lê o token?" — foi medida e
 * DESCARTADA: 46 achados, 25% de precisão. Reprovava a seta do carrossel (que é
 * um `.nds-button`, e quem lê é `button.css`), a paleta do gráfico (que chega
 * por `getComputedStyle`, não por CSS) e toda utilitária `.nds-text-*`. Portão
 * que reprova três quartos do que aponta ensina a ignorar o portão, e junto some
 * o achado que importava.
 *
 * Três armadilhas, todas medidas ao construir isto:
 *
 * 1. A coluna do meio CONTÉM aspas: `.nds-checkbox[data-state="checked"]`.
 *    Fechar a captura em qualquer aspa trunca o seletor no meio do atributo e a
 *    linha vira "seletor inexistente" — 40 falsos positivos, todos iguais.
 * 2. `--radius-md: calc(var(--radius) - 2px)`. A linha nomeia `--radius` e o
 *    seletor lê `--radius-md`, e mesmo assim a linha é VERDADEIRA: sobrescrever
 *    `--radius` move o raio. Sem resolver a derivação, o portão mandaria trocar
 *    o token de cima pelo de baixo, que é o ponto de customização PIOR.
 * 3. A classe pode estar em qualquer posição do seletor: quem lê
 *    `--sidebar-border` é `.nds-sidebar-root[…] .nds-sidebar-panel`, com a
 *    classe da linha no FIM. Casar só pelo início reprovava quatro linhas
 *    corretas de uma vez.
 *
 * Duas exigências de higiene, deliberadas:
 *
 * - Travessão na coluna do meio é declaração EXPLÍCITA de ausência e PASSA.
 *   Duas stacks já usavam a convenção por conta própria; formalizar vale mais
 *   que reinventar.
 * - Tabela cuja coluna do meio não é seletor CSS — a do chart tem cabeçalho
 *   "Uso no componente" e valores como `axisPointer` — sai por AUSÊNCIA DE
 *   `.nds-` no próprio valor, que é declaração no dado, não filtro por nome de
 *   arquivo. Filtro por nome é o defeito do `source-snippets.test.ts`: a
 *   contagem encolheu e a suíte seguiu verde medindo menos.
 */
const LINHA_TABELA_RX = new RegExp(
  String.raw`\{[^{}]*?\btoken:\s*(['"\`])(--[A-Za-z0-9-]+)\1` +
    String.raw`[^{}]*?\b(?:value|target):\s*(['"\`])((?:\\.|(?!\3)[^\\])*)\3`,
  'g',
);

let _indiceFolhas = null;

function indiceFolhas() {
  if (_indiceFolhas) return _indiceFolhas;

  const dir = join(ROOT, 'docs', 'shared', 'styles', 'nds');
  const porSeletor = new Map();
  const derivaDe = new Map();

  const regrasDe = (css) => {
    const limpo = css.replace(/\/\*[\s\S]*?\*\//g, '');
    const regras = [];
    const pilha = [];
    let buf = '';
    for (const ch of limpo) {
      if (ch === '{') { pilha.push(buf.trim()); buf = ''; }
      else if (ch === '}') { regras.push({ sel: pilha.pop() ?? '', body: buf }); buf = ''; }
      else buf += ch;
    }
    return regras;
  };

  for (const f of readdirSync(dir).filter((x) => x.endsWith('.css'))) {
    for (const { sel, body } of regrasDe(readFileSync(join(dir, f), 'utf8'))) {
      if (!sel || sel.startsWith('@')) continue;
      const tokens = new Set();
      for (const m of body.matchAll(/var\(\s*(--[A-Za-z0-9-]+)/g)) tokens.add(m[1]);
      for (const m of body.matchAll(/(?:^|[;{\s])(--[A-Za-z0-9-]+)\s*:/g)) tokens.add(m[1]);
      if (!tokens.size) continue;
      for (const peca of sel.split(',')) {
        const p = peca.trim();
        if (!p) continue;
        if (!porSeletor.has(p)) porSeletor.set(p, new Set());
        for (const t of tokens) porSeletor.get(p).add(t);
      }
    }
  }

  const tokensCss = join(ROOT, 'docs', 'shared', 'tokens', 'tokens.css');
  if (existsSync(tokensCss)) {
    const css = readFileSync(tokensCss, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const m of css.matchAll(/(--[A-Za-z0-9-]+)\s*:\s*([^;]+);/g)) {
      const pais = [...m[2].matchAll(/var\(\s*(--[A-Za-z0-9-]+)/g)].map((x) => x[1]);
      if (!pais.length) continue;
      if (!derivaDe.has(m[1])) derivaDe.set(m[1], new Set());
      for (const pai of pais) derivaDe.get(m[1]).add(pai);
    }
  }

  _indiceFolhas = { porSeletor, derivaDe };
  return _indiceFolhas;
}

function seletorCasa(peca, nomeado) {
  const COMBINADOR = [' ', '>', '+', '~'];
  let i = peca.indexOf(nomeado);
  while (i !== -1) {
    const antes = i === 0 ? '' : peca[i - 1];
    const depois = peca[i + nomeado.length] ?? '';
    const abre = antes === '' || COMBINADOR.includes(antes);
    const fecha = depois === '' || depois === ':' || depois === '[' || COMBINADOR.includes(depois);
    if (abre && fecha) return true;
    i = peca.indexOf(nomeado, i + 1);
  }
  return false;
}

function auditTokenTableRow(slug) {
  const violations = [];
  const { porSeletor, derivaDe } = indiceFolhas();

  const comAncestrais = (tokens) => {
    const saida = new Set(tokens);
    const fila = [...tokens];
    while (fila.length) {
      const t = fila.pop();
      for (const pai of derivaDe.get(t) || []) {
        if (saida.has(pai)) continue;
        saida.add(pai);
        fila.push(pai);
      }
    }
    return saida;
  };

  const tokensDe = (nomeado) => {
    const achados = new Set();
    for (const [peca, tokens] of porSeletor) {
      if (!seletorCasa(peca, nomeado)) continue;
      for (const t of tokens) achados.add(t);
    }
    return achados;
  };

  for (const stack of STACKS) {
    const { docs } = filesForSlug(slug, stack);
    for (const file of docs) {
      const content = readFile(file);
      if (!content) continue;
      LINHA_TABELA_RX.lastIndex = 0;
      for (const m of content.matchAll(LINHA_TABELA_RX)) {
        const token = m[2];
        const valor = m[4].replace(/\\(['"`])/g, '$1').trim();

        if (!valor || valor === '—' || valor === '-') continue;   // ausência declarada
        if (!valor.includes('.nds-')) continue;                    // coluna não é seletor

        const nomeados = valor.split(/·|,/).map((s) => s.trim()).filter((s) => s.startsWith('.nds-'));
        if (!nomeados.length) continue;

        const lidos = new Set();
        for (const n of nomeados) for (const t of comAncestrais(tokensDe(n))) lidos.add(t);
        if (lidos.has(token)) continue;

        const orfao = nomeados.every((n) => tokensDe(n).size === 0);
        violations.push({
          category: 'quality', severity: 'medium', slug, stack,
          file: relative(ROOT, file), rule: 'token_table_row_incoerente',
          message:
            `a tabela diz que \`${valor}\` lê \`${token}\`, e a regra desse seletor não o declara` +
            (orfao ? ' — e esse seletor não existe em folha nenhuma' : '') +
            '. Quem seguir a linha sobrescreve um token que não chega ao componente:' +
            ' nomeie o seletor que de fato lê, ou `—` se nada ler',
        });
      }
    }
  }
  return violations;
}

function auditExportSemStory(slug) {
  const violations = [];
  const RAIZ_RX = new RegExp(`^${slug.replace(/-([a-z])/g, (_, c) => c.toUpperCase())}$`, 'i');

  for (const stack of STACKS) {
    const { ui } = filesForSlug(slug, stack);
    const arquivosDeStory = ui.filter(f => /\.stories\./.test(basename(f)));
    if (!arquivosDeStory.length) continue;
    // Comentário NÃO é uso. Sem tirar, a regra dava por renderizado qualquer
    // export cujo nome aparecesse em prosa — e nome curto de palavra comum é
    // coberto por acidente. Medido: o `regiao()` do sonner passou meses
    // "coberto" por um comentário sobre região rolável no arquivo de OUTRO
    // componente, e só apareceu quando alguém reescreveu aquela frase.
    const textoDasStories = arquivosDeStory
      .map(f => stripComments(readFile(f) || ''))
      .join('\n');

    const exportados = new Map();
    const origensDeAlias = new Set();
    for (const file of ui) {
      const nome = basename(file);
      if (/\.stories\./.test(nome) || /story\.svelte$/i.test(nome)) continue;
      // Comentário não declara export — e a assimetria custou 8 achados falsos.
      //
      // O lado do USO já passava por `stripComments` em três lugares (stories,
      // arquivo de definição, consumidores); o lado da DECLARAÇÃO lia o arquivo
      // cru. Toda `*.fixtures.ts` abre com uma nota explicando por que a fixture
      // mora fora do arquivo de story, e a nota cita o próprio padrão:
      //
      //     // story: `export function waitForPanel()` dentro de um
      //     // `*.stories.tsx` viraria uma story que não renderiza nada.
      //
      // O extrator colhia dali um símbolo que não existe e o procurava em vão
      // pelo grafo — "exportado e nada o renderiza" sobre um export imaginário.
      // Enquanto o nome citado coincidia com um export real, o falso positivo
      // ficava escondido; a tradução dos identificadores renomeou o export, a
      // prosa ficou para trás, e os oito apareceram de uma vez.
      const content = stripComments(readFile(file) || '');
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
    // O `index.ts` ENTRA na lista, mas sem as linhas de re-export.
    //
    // Filtrá-lo inteiro era o atalho antigo, e ele mente quando o barril não é
    // só barril: o `index.ts` do chart no Svelte CONSTRÓI as opções e usa a
    // constante `ARIA` ali mesmo. Com o arquivo fora, a constante aparecia como
    // exportada e não usada — falso positivo que só surgiu quando a regra passou
    // a exigir import, porque antes qualquer menção solta a cobria.
    //
    // O que não conta é `export { … }` e `export … from`; o resto do arquivo é
    // código como outro qualquer.
    const consumidores = globStack(stack, 'components', ['.ts', '.tsx', '.vue', '.svelte']);

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
      // Comentário não é uso, aqui também: o arquivo de definição passa pelo
      // mesmo filtro que as stories e os consumidores. Sem isto, citar o
      // símbolo em prosa — inclusive numa nota explicando por que ele existe —
      // o dava por renderizado.
      const proprio = stripComments(readFile(file) || '')
        .replace(/export\s*\{[^}]*\}/g, '')
        .replace(new RegExp(`(?:function|const)\\s+${simbolo}\\b`, 'g'), '');
      if (rx.test(proprio)) continue;

      // Fora do arquivo de definição, uso exige IMPORT — não basta o
      // identificador aparecer.
      //
      // Tirar comentário resolveu metade do problema; a outra metade é que a
      // regra casava variável LOCAL de qualquer arquivo da stack. O `regiao()`
      // do sonner passou de "coberto por um comentário" para "coberto por um
      // `const regiao` declarado numa story do skeleton" — componente diferente,
      // arquivo diferente, zero relação. Nome curto de palavra comum é campo
      // minado: `regiao`, `item`, `titulo`, `valor`.
      //
      // Exigir que o símbolo apareça numa lista de import amarra o uso ao grafo
      // de módulos, que é o que "nada o renderiza" quer dizer.
      const usadoPorOutro = consumidores.some(f => {
        if (f === file) return false;
        const c = readFile(f);
        if (!c) return false;
        // Re-export não é uso — nem no barril, nem em arquivo nenhum.
        const limpo = stripComments(c)
          .replace(/export\s*\{[^}]*\}(?:\s*from\s*['"][^'"]+['"])?/g, '')
          .replace(/export\s+\*\s+from\s*['"][^'"]+['"]/g, '');
        if (!rx.test(limpo)) return false;
        // Num arquivo que IMPORTA o símbolo, a referência é uso. Num arquivo que
        // não importa, ela é homônima — variável local com o mesmo nome.
        const importa = [...limpo.matchAll(/import\s+(?:type\s+)?([\s\S]*?)\s+from\s/g)]
          .some(m => rx.test(m[1]));
        // Import de NAMESPACE cobre tudo o que o módulo exporta.
        //
        // `import * as Command from '…/command'` seguido de `<Command.Dialog>`
        // não deixa o nome do símbolo aparecer em lugar nenhum que esta regra
        // consiga ler. Reivindicar "nada renderiza" aí é afirmar mais do que se
        // sabe — e o padrão é comum no Svelte, o que fazia quase todo `index.ts`
        // daquela stack acusar os próprios aliases públicos.
        if (/import\s+\*\s+as\s+\w+\s+from/.test(limpo)) return true;
        // O próprio módulo que declara e o barril que o constrói não importam
        // de lugar nenhum: ali a referência vale por si.
        return importa || /^index\.ts$/i.test(basename(f));
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
      // Teste também sai, pelo mesmo motivo da regra irmã: ele guarda
      // EXPRESSÕES sobre markup, e a asserção que procura `undefined` num
      // snippet virava "classe undefined não existe".
      if (/\.stories\./.test(nome) || /\.(test|spec)\.[jt]sx?$/.test(nome) || nome.endsWith('story.svelte')) continue;

      const content = readFile(file);
      if (!content) continue;
      const rel = relative(ROOT, file);

      const vistas = new Set();
      // O lookbehind exclui BINDING, que não é classe literal: `:class="x"` e
      // `v-bind:class="x"` do Vue casavam a regex por terminarem em `class=`, e
      // o que entrava como "classe" era o nome da EXPRESSÃO. Foi assim que o
      // `containerClass` do ChartContainer.vue — um `computed` que devolve
      // `cn('nds-chart', props.class)` — virou achado de classe inexistente.
      // As outras formas já não casavam por acidente de sintaxe (`[class]="x"`
      // e `[ngClass]="x"` têm `]` antes do `=`; `class:ativo={x}` do Svelte não
      // tem `=` logo após `class`; `className={…}` usa chave, não aspas), mas
      // depender de acidente é o que produziu este falso positivo.
      for (const m of content.matchAll(/(?<![:[\w-])class(?:Name)?=["']([^"']+)["']/g)) {
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

  /**
   * `<…>` que é TAG, e não genérico de TypeScript.
   *
   * `Promise<string | null>` casava com `<[a-z][^>]*>` e virava achado: o `s`
   * de `string` faz as vezes de nome de tag. A correção que a regra sugere
   * (`toPlainText()`) APAGARIA `<string | null>`, e a tabela de props passaria
   * a mentir o tipo — pior que o falso positivo.
   *
   * O que separa os dois é o conteúdo: tipo carrega `|`, `=>` ou vírgula, e
   * nome de tag é uma palavra seguida de atributo ou do fecho. `code-block` e
   * `skeleton` também declaram genérico em `props.table.*.type`.
   */
  const temTag = (texto) => {
    if (/&lt;|&gt;/.test(texto)) return true;
    for (const m of texto.matchAll(/<([a-z][^>]*)>/g)) {
      const dentro = m[1];
      if (/[|,]|=>/.test(dentro)) continue;          // genérico, não tag
      if (!/^[a-z][a-z0-9-]*(\s|\/|$)/.test(dentro)) continue;
      return true;
    }
    return false;
  };

  // chave -> tem markup em algum idioma
  const comMarkup = new Set();
  for (const locale of Object.keys(json)) {
    (function varre(node, caminho) {
      if (typeof node === 'string') {
        if (temTag(node)) comMarkup.add(caminho.replace(/^\./, ''));
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

// ─── Apoio de `snippet_sem_lastro` ──────────────────────────────────────────

/** Cada chave que termina em `Code`, com o caminho até ela. */
function chavesDeCodigo(obj, cam = '', out = []) {
  for (const [k, v] of Object.entries(obj ?? {})) {
    const c = cam ? `${cam}.${k}` : k;
    if (k.endsWith('Code')) out.push([c, v]);
    else if (v && typeof v === 'object' && !Array.isArray(v)) chavesDeCodigo(v, c, out);
  }
  return out;
}

/** Variante da stack, com a mesma queda `web` -> `react` do `code-variants.ts`. */
function varianteDoStack(valor, stack) {
  if (typeof valor === 'string') return valor;
  if (!valor || typeof valor !== 'object') return null;
  if (typeof valor[stack] === 'string') return valor[stack];
  if (typeof valor.web === 'string') return valor.web;
  if (typeof valor.react === 'string') return valor.react;
  return null;
}

/**
 * Comentário de código e de markup, inclusive o de fim de linha.
 *
 * A guarda de `:` antes do `//` existe porque sem ela `https://` vira
 * comentário e leva o resto da linha junto.
 */
function semComentariosDeSnippet(src) {
  return src
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:"'`\w])\/\/.*$/gm, '$1 ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
}

let _slugsPascal = null;
/** `AlertDialogTrigger` -> `alert-dialog`. Prefixo Pascal mais longo que casa. */
function slugDeComponente(tag) {
  if (!_slugsPascal) {
    _slugsPascal = slugsDoConteudo()
      .map((s) => [s.split('-').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(''), s])
      .sort((a, b) => b[0].length - a[0].length);
  }
  const nome = tag.replace(/^(nds|create)/, '');
  for (const [P, s] of _slugsPascal) if (nome.startsWith(P)) return s;
  return null;
}

function tagsDeComponente(codigo) {
  const out = new Set();
  for (const m of codigo.matchAll(/<([A-Z][\w.]*)/g)) out.add(m[1]);
  for (const m of codigo.matchAll(/\b(nds[A-Z][\w]*)/g)) out.add(m[1]);
  for (const m of codigo.matchAll(/\b(create[A-Z][\w]*)\(/g)) out.add(m[1]);
  return out;
}

/**
 * Mantém as CHAVES de `argTypes` e apaga a configuração de dentro.
 *
 * A chave é nome de prop de verdade — é assim que o `onValueChange` do tabs no
 * Svelte se prova. O que mora DENTRO dela é vocabulário do Storybook:
 * `control: { type: 'boolean' }` fazia o `type` do accordion e o `control` do
 * form se corroborarem sozinhos, absolvendo exatamente os defeitos que esta
 * regra existe para achar.
 */
function semConfiguracaoDeArgTypes(src) {
  let out = src;
  for (;;) {
    const i = out.indexOf('argTypes:');
    if (i < 0) break;
    const abre = out.indexOf('{', i);
    if (abre < 0) break;
    const fim = fimDoObjeto(out, abre);
    if (fim < 0) break;
    let nivel = 0;
    let plano = '';
    for (const ch of out.slice(abre + 1, fim)) {
      if (ch === '{' || ch === '[' || ch === '(') nivel++;
      else if (ch === '}' || ch === ']' || ch === ')') nivel--;
      plano += nivel === 0 ? ch : ' ';
    }
    // `argTipos` no lugar de `argTypes` para o laço não reencontrar o bloco.
    out = out.slice(0, i) + 'argTipos: {' + plano + '}' + out.slice(fim + 1);
  }
  return out;
}

const _corpusCache = new Map();
/** Componente + stories + transforms do painel Code. A docs page fica de fora. */
function corpusDaStack(slug, stack) {
  const k = `${slug}|${stack}`;
  if (!_corpusCache.has(k)) {
    const { ui } = filesForSlug(slug, stack);
    const bruto = ui.map((f) => readFile(f) || '').join('\n');
    _corpusCache.set(k, semConfiguracaoDeArgTypes(semComentariosDeSnippet(bruto)));
  }
  return _corpusCache.get(k);
}

const DIRETIVA_DE_FRAMEWORK = /^(v-|bind:|on:|use:|transition:|in:|out:|animate:|let:|class:|style:|slot|key|ref|is|xmlns|ng[A-Z*]|\*ng|#)/;
/**
 * Passagem livre, e a lista é curta DE PROPÓSITO.
 *
 * Só entram aqui os atributos que todo componente encaminha sem que isso diga
 * nada sobre a API dele. `type`, `value`, `open`, `disabled` e companhia ficaram
 * de FORA: num componente elas são prop de verdade, e mantê-las na lista foi o
 * que fez a primeira versão desta regra passar batido justamente no defeito que
 * a originou — o `type="single"` do accordion. O portão só tem dentes se a
 * exceção for a mínima.
 *
 * `aria-*` e `data-*` saem por prefixo, logo abaixo.
 */
const ATRIBUTO_NATIVO = new Set(['class', 'className', 'style', 'id', 'key', 'ref']);

/** Fecha a chave aberta em `abre`, contando aninhamento. */
function fimDoObjeto(s, abre) {
  let n = 0;
  for (let i = abre; i < s.length; i++) {
    if (s[i] === '{') n++;
    else if (s[i] === '}') { n--; if (n === 0) return i; }
  }
  return -1;
}

/**
 * Props que o snippet ensina, lidas só de dentro de tag de componente do design
 * system. Fora da tag há prosa; dentro não — por isso o booleano solto
 * (`asChild`) é seguro de ler aqui.
 */
function propsDoSnippet(codigo, stack) {
  const props = new Set();

  if (stack === 'vanilla') {
    for (const m of codigo.matchAll(/create[A-Z]\w*\(\s*\{/g)) {
      const abre = codigo.indexOf('{', m.index);
      const fim = fimDoObjeto(codigo, abre);
      if (fim < 0) continue;
      let nivel = 0;
      let plano = '';
      for (const ch of codigo.slice(abre + 1, fim)) {
        if (ch === '{' || ch === '[' || ch === '(') nivel++;
        else if (ch === '}' || ch === ']' || ch === ')') nivel--;
        plano += nivel === 0 ? ch : ' ';
      }
      for (const k of plano.matchAll(/(?:^|,)\s*([a-zA-Z][\w]*)\s*:/g)) props.add(k[1]);
    }
    return [...props];
  }

  for (const m of codigo.matchAll(/<([A-Z][\w.]*)((?:[^<>]|=>)*?)\/?>/g)) {
    if (!slugDeComponente(m[1])) continue;
    const dentro = m[2];
    for (const a of dentro.matchAll(/(?:^|\s)[:@]?([a-zA-Z][\w-]*)\s*=/g)) props.add(a[1]);
    const semValores = dentro
      .replace(/=\s*"[^"]*"/g, ' ')
      .replace(/=\s*'[^']*'/g, ' ')
      .replace(/\{[\s\S]*?\}/g, ' ');
    for (const a of semValores.matchAll(/(?:^|\s)([a-z][\w]*)(?=\s|$)/g)) props.add(a[1]);
  }
  return [...props].filter((p) =>
    !DIRETIVA_DE_FRAMEWORK.test(p) && !ATRIBUTO_NATIVO.has(p)
    && !p.startsWith('aria-') && !p.startsWith('data-'));
}

function classesDoSnippet(codigo) {
  const out = new Set();
  for (const m of codigo.matchAll(/(?:class|className)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
    for (const c of (m[1] || m[2] || '').split(/\s+/)) if (c) out.add(c);
  }
  return out;
}

/** Forma de utilitária do Tailwind — a lib que saiu do projeto. */
const FORMA_TAILWIND = /^-?(flex|grid|block|inline|hidden|absolute|relative|fixed|sticky|container|items-|justify-|self-|content-|place-|gap-|space-[xy]-|p[xytblrse]?-|m[xytblrse]?-|w-|h-|min-|max-|text-|font-|leading-|tracking-|bg-|border|rounded|shadow|opacity-|z-|overflow-|cursor-|select-|transition|duration-|ease-|animate-|ring|outline|truncate|sr-only|aspect-|object-|col-|row-|order-|basis-|grow|shrink)/;

/** A prop aparece, em alguma forma de uso ou declaração, no código da stack? */
function lastroNoCodigo(prop, corpus) {
  const camel = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  const kebab = prop.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());
  for (const forma of new Set([prop, camel, kebab])) {
    const p = forma.replace(/[.*+?^${}()|[\]\\]/g, '\\function auditTaxonomy(slug) {');
    // Fronteira que rejeita o hifen, e nao `\b`: o hifen É fronteira de palavra,
    // entao `\btype` casava dentro de `data-type={mode}` e o accordion se
    // auto-absolvia do proprio defeito. O mesmo valeria para `label` dentro de
    // `aria-label`.
    const antes = '(?<![\\w-])';
    const re = new RegExp([
      `${antes}${p}\\s*=`,        // uso com valor, ou default de destructuring
      `${antes}${p}\\s*\\?\\s*:`, // declaração opcional de tipo
      `${antes}${p}\\s*:`,        // chave de objeto: membro obrigatório de
                                    // tipo, default de `withDefaults`, chave de `argTypes`
      `${antes}${p}\\s*[,}]`,     // destructuring
      `${antes}${p}\\s*\\/?>`,    // atributo BOOLEANO: `<DrawerTrigger asChild>`
      `['"\`]${p}['"\`]`,    // lista de inputs do Angular
      `\\{\\s*${p}\\s*\\}`,  // forma abreviada do Svelte
    ].join('|'));
    if (re.test(corpus)) return true;
  }
  return false;
}

/**
 * `snippet_sem_lastro` — o snippet do conteúdo compartilhado ensina uma prop
 * ou uma classe que o código daquela stack não conhece.
 *
 * O defeito que a criou: a Anatomia do Accordion mostrava
 * `<Accordion type="single">` enquanto o painel Code da mesma página mostrava
 * `<Accordion defaultValue={["item-1"]}>`. O painel estava certo — ele é gerado
 * a partir da story, que renderiza o componente de verdade. O snippet do JSON é
 * uma string que ninguém executa, e por isso `type` sobreviveu à migração
 * inteira: é vocabulário do Radix, e o `@base-ui/react` expõe `multiple`.
 *
 * ── Contra o quê comparar ───────────────────────────────────────────────────
 *
 * Nem a API declarada nem o Playground sozinhos servem:
 *
 * - Contra a API do WRAPPER: o `multiple` do accordion vem do tipo da lib
 *   (`AccordionPrimitive.Root.Props`), não do wrapper. Um auditor de grep não
 *   resolve tipo, e reprovaria prop válida.
 * - Contra o snippet do PLAYGROUND: a anatomia documenta legitimamente o que o
 *   Playground não exercita — `delay={400}` no `TooltipProvider` é anatomia, não
 *   control.
 *
 * O que sobra, e é o que pegou os três defeitos: a prop aparece em ALGUM lugar
 * do código real daquela stack para aquele slug? O corpo de evidência é o
 * componente + as stories + as transforms do painel Code, o que SUBSUME o
 * Playground sem depender de tipo.
 *
 * A docs page fica FORA do corpo de propósito: ela renderiza o próprio JSON, e
 * corroborar ali seria circular.
 *
 * ── O que um achado significa ───────────────────────────────────────────────
 *
 * Duas causas, e as duas pedem ação:
 *
 * 1. A prop não existe (o `type` do accordion, o `asChild` do tooltip, o
 *    `delayDuration` do navigation-menu — cujo próprio componente registra que
 *    "a tipagem daqui anunciava `delayDuration`"). O leitor copia e não
 *    funciona.
 * 2. A prop existe na lib mas NADA nesta stack a usa (o `getAriaValueText` do
 *    progress existe no base-ui; o `autoSaveId` do resizable existe no
 *    paneforge). Aí o snippet promete o que o design system não demonstra — o
 *    mesmo estado de "especificado e não entregue" que o `export_sem_story`
 *    cobra das peças.
 *
 * ── O que NÃO é achado ──────────────────────────────────────────────────────
 *
 * Cada exceção abaixo nasceu de um falso positivo medido nesta base:
 *
 * - Tag que não é do design system: `<FiltersForm onConfirm={…}>` é o
 *   formulário do leitor, e `onConfirm` não tem por que existir aqui.
 * - Sintaxe de framework (`v-model`, `bind:`, `#`, `*ngIf`): erro ali é do
 *   compilador, não do design system.
 * - Atributo nativo de HTML (`id`, `src`, `htmlFor`, `placeholder`…).
 * - Comentário: `// Raiz: borda…` dentro de uma chamada de fábrica dava as
 *   "props" `Raiz` e `caixa`. O corte de `//` guarda o `:` anterior, senão
 *   `https://` engole o resto da linha.
 * - Objeto aninhado numa chamada de fábrica: `index:` num payload de evento não
 *   é opção de componente. Só o primeiro nível do objeto de opções conta.
 * - Forma kebab × camel: `side-offset` no Vue é `sideOffset` no código.
 */
/**
 * `largura_fluida_sob_centered` — `nds-w-full nds-max-w-*` numa story cujo
 * `layout` é `centered`.
 *
 * Sob `layout: 'centered'` o Storybook encolhe o ancestral para o conteúdo, e
 * `width: 100%` não tem contra o que resolver: a caixa fica do tamanho do TEXTO
 * que ela contém. Medido na story `Multi Responsive` do carousel — 448px
 * declarados, 163px na tela.
 *
 * O que fez isso sobreviver: as outras stacks pareciam certas por ACIDENTE. Com
 * rótulos longos o encolhe-para-o-conteúdo passa do teto e o `max-width` capa
 * no valor pretendido; encurte um rótulo e a mesma marcação colapsa. Nenhuma
 * suíte alcança isso, porque o runner do vitest não aplica `layout`.
 *
 * A forma correta é `.nds-w-cap-*`, que declara a largura. As duas são
 * EQUIVALENTES em qualquer pai de largura definida — só diferem no pai que
 * encolhe, que é o caso quebrado.
 */
function auditLarguraFluidaSobCentered(slug) {
  const violations = [];
  for (const stack of STACKS) {
    const { ui } = filesForSlug(slug, stack);
    for (const file of ui) {
      if (!/\.stories\./.test(file)) continue;
      const content = readFile(file);
      if (!content) continue;
      // O `layout` do `meta` vale para o arquivo inteiro.
      if (!/layout:\s*['"]centered['"]/.test(content)) continue;

      const achadas = new Set();
      for (const m of content.matchAll(/nds-w-full\s+nds-max-w-([a-z]+)/g)) achadas.add(m[1]);
      if (!achadas.size) continue;

      violations.push({
        category: 'quality', severity: 'high', slug, stack,
        file: relative(ROOT, file), rule: 'largura_fluida_sob_centered',
        message: `\`nds-w-full nds-max-w-${[...achadas].join('/')}\` sob \`layout: 'centered'\`: o ancestral encolhe para o conteúdo e \`width: 100%\` não resolve contra nada — a caixa fica do tamanho do texto. Use \`nds-w-cap-${[...achadas][0]}\`, que declara a largura`,
      });
    }
  }
  return violations;
}

/**
 * `host_inline_com_largura` — host de componente Angular cuja classe não
 * declara `display`, recebendo classe de largura de quem o consome.
 *
 * `<nds-carousel>` é elemento que o navegador não conhece: sem `display` na
 * folha, ele é `inline`, e largura em elemento inline é IGNORADA. Medido: com
 * `nds-w-cap-lg` (512px) declarado, o host media 1200px — a largura inteira do
 * pai. Toda story de carrossel do Angular vinha larga demais desde sempre, e as
 * outras quatro respeitavam a medida.
 *
 * Só vale para o Angular porque só lá a classe mora no HOST; nas outras quatro
 * ela vai num `<div>`, que já é bloco. Por isso o conserto (`display: block` em
 * `.nds-carousel`) não muda um pixel nas outras.
 */
function auditHostInlineComLargura(slug) {
  const violations = [];
  const arquivos = filesForSlug(slug, 'angular').all;
  if (!arquivos.length) return violations;

  const comDisplay = classesComDisplay();
  const corpo = arquivos.map((f) => readFile(f) || '').join('\n');

  for (const f of arquivos) {
    const src = readFile(f);
    if (!src || /\.stories\./.test(f)) continue;
    for (const m of src.matchAll(/class:\s*'(nds-[\w-]+)'/g)) {
      const classe = m[1];
      if (comDisplay.has(classe)) continue;
      const sel = [...src.slice(0, m.index).matchAll(/selector:\s*'([\w[\]-]+)'/g)].pop();
      if (!sel) continue;
      // Só seletor de ELEMENTO. Um seletor entre colchetes é diretiva de
      // ATRIBUTO: o host é o elemento que a carrega, que já é bloco, e o
      // problema de `inline` não existe. Foi o falso positivo do
      // `[ndsNavigationMenuPanel]`.
      if (/[[\]]/.test(sel[1])) continue;
      const tag = sel[1];
      const comoTag = new RegExp(`<${tag}\\b[^>]*\\bclass="[^"]*nds-(w-|max-w-|w-cap-)`);
      if (!comoTag.test(corpo)) continue;

      violations.push({
        category: 'quality', severity: 'high', slug, stack: 'angular',
        file: relative(ROOT, f), rule: 'host_inline_com_largura',
        message: `\`<${tag}>\` recebe classe de largura, mas \`.${classe}\` não declara \`display\` — elemento customizado é \`inline\` por padrão, e largura em inline é ignorada. Declare \`display\` na folha compartilhada`,
      });
    }
  }
  return violations;
}

let _classesComDisplay;
/**
 * Classes `.nds-*` que declaram `display` em alguma folha compartilhada.
 *
 * Varre BLOCO a bloco, casando chaves. Uma regex única erra: basta um bloco
 * anterior desalinhar o casamento para uma classe que declara `display` sair
 * como se não declarasse — foi o que fez este portão acusar o `.nds-carousel`
 * no dia seguinte ao conserto dele.
 */
function classesComDisplay() {
  if (_classesComDisplay) return _classesComDisplay;
  _classesComDisplay = new Set();
  for (const f of walkDir(join(ROOT, 'docs', 'shared', 'styles'), ['.css'])) {
    const css = (readFile(f) || '').replace(/\/\*[\s\S]*?\*\//g, ' ');
    let i = 0;
    let anterior = 0;
    while ((i = css.indexOf('{', i)) >= 0) {
      const seletor = css.slice(anterior, i);
      let n = 0;
      let j = i;
      for (; j < css.length; j++) {
        if (css[j] === '{') n++;
        else if (css[j] === '}') { n--; if (n === 0) break; }
      }
      if (/(^|[;\s])display\s*:/.test(css.slice(i + 1, j))) {
        for (const m of seletor.matchAll(/\.(nds-[\w-]+)/g)) _classesComDisplay.add(m[1]);
      }
      i = j + 1;
      anterior = i;
    }
  }
  return _classesComDisplay;
}

function auditSnippetSemLastro(slug) {
  const violations = [];
  const arq = join(ROOT, 'docs', 'shared', 'content', slug, 'translations.json');
  if (!existsSync(arq)) return violations;

  let json;
  try { json = JSON.parse(readFile(arq) || '{}'); } catch { return violations; }
  const pt = json['pt-BR'];
  if (!pt) return violations;

  const rel = relative(ROOT, arq);
  const conhecidas = ndsClasses();

  for (const [caminho, valor] of chavesDeCodigo(pt)) {
    for (const stack of STACKS) {
      const cru = varianteDoStack(valor, stack);
      if (!cru) continue;
      const codigo = semComentariosDeSnippet(cru);

      const slugs = new Set([slug]);
      for (const tag of tagsDeComponente(codigo)) {
        const s = slugDeComponente(tag);
        if (s) slugs.add(s);
      }
      let corpus = '';
      for (const s of slugs) corpus += corpusDaStack(s, stack) + '\n';
      if (!corpus.trim()) continue;

      for (const prop of propsDoSnippet(codigo, stack)) {
        if (lastroNoCodigo(prop, corpus)) continue;
        violations.push({
          category: 'quality', severity: 'medium', slug, stack,
          file: rel, rule: 'snippet_sem_lastro',
          message: `${caminho} ensina "${prop}", que nada no código desta stack usa — ou a prop não existe, ou existe e nenhuma story a exercita`,
        });
      }

      for (const cls of classesDoSnippet(codigo)) {
        if (cls.startsWith('nds-') || !FORMA_TAILWIND.test(cls)) continue;
        violations.push({
          category: 'quality', severity: 'high', slug, stack,
          file: rel, rule: 'snippet_sem_lastro',
          message: `${caminho} ensina a classe "${cls}", que tem forma de Tailwind — a lib saiu do projeto e a folha compartilhada não a define, então quem copiar recebe markup sem estilo`,
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
// Propriedades em que número PURO é a forma correta, e não px implícito.
const INLINE_UNITLESS_OK = new Set([
  'line-height', 'font-weight', 'opacity', 'z-index', 'order',
  'flex', 'flex-grow', 'flex-shrink', 'aspect-ratio',
]);
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

/**
 * Marca os trechos que são SNIPPET EXIBIDO AO LEITOR, não estilo aplicado.
 *
 * Foi o que separou a regra útil da regra ruidosa quando o alcance passou a
 * incluir stories e docs pages: das 1457 declarações que a varredura crua
 * achou, 429 (29%) estavam dentro de um bloco de código que a página ENSINA —
 * `code: \`<SelectTrigger style="width: 14rem">\``, o `padding-bottom: 56.25%`
 * do AspectRatio, o `structureCode` do vanilla. `style` num trecho que ensina
 * não é `style` aplicado, e acusá-lo faz o leitor do relatório desconfiar de
 * todos os outros achados.
 *
 * O sinal é a crase: template literal é onde as cinco stacks guardam snippet, e
 * crase não aparece em markup renderizado. Medido antes de confiar nisso — nos
 * 219 arquivos com achado, o número de crases é PAR em todos, então o rastreio
 * caractere a caractere pelo arquivo inteiro nunca fica preso num estado errado.
 * Rastrear só dentro de `<script>` seria pior: em Svelte o `code:` do
 * `DocsCompositions` mora no markup, dentro de uma expressão `{…}`.
 *
 * Posição, não linha: `code: \`<Tabs style="max-width: 36rem">` abre a crase na
 * mesma linha do achado, e `<code …>data={\`{5000 linhas}\`}</code>` tem crase
 * em markup de verdade. Só o offset do match distingue os dois.
 */
function snippetMask(src) {
  const mask = new Uint8Array(src.length);
  let dentro = false;
  for (let i = 0; i < src.length; i++) {
    if (src[i] === '\\') {
      if (dentro) { mask[i] = 1; if (i + 1 < src.length) mask[i + 1] = 1; }
      i++;
      continue;
    }
    if (src[i] === '`') { dentro = !dentro; mask[i] = 1; continue; }
    if (dentro) mask[i] = 1;
  }
  return mask;
}

/** Declarações inline de um arquivo, nas sintaxes que as cinco stacks usam. */
function inlineStyleDecls(content) {
  const out = [];
  const src = stripMarkupComments(stripComments(content));
  const mask = snippetMask(src);

  // `template: `…`` do Vue é markup APLICADO, não trecho exibido.
  //
  // A guarda de snippet marca tudo entre crases como "mostrado ao leitor", e
  // acerta na maioria — foi ela que separou 29% de falso positivo. Mas a story
  // do Vue declara o markup que RENDERIZA numa template string, e a máscara o
  // escondia: 260 declarações em 54 arquivos, invisíveis ao portão, enquanto o
  // relatório mostrava 3 na stack inteira.
  //
  // O que distingue é a chave, não a crase: `code:` ensina, `template:` executa.
  for (const m of src.matchAll(/\btemplate:\s*`/g)) {
    const ini = src.indexOf('`', m.index);
    const fim = src.indexOf('`', ini + 1);
    if (fim < 0) continue;
    for (let i = ini; i <= fim; i++) mask[i] = 0;
  }

  // Posição absoluta -> linha. Necessário porque um objeto de estilo pode estar
  // quebrado em várias linhas, e o achado tem que ser reportado onde ele está.
  const inicioDaLinha = [0];
  for (let i = 0; i < src.length; i++) if (src[i] === '\n') inicioDaLinha.push(i + 1);
  const linhaDe = (abs) => {
    let lo = 0, hi = inicioDaLinha.length - 1;
    while (lo < hi) {
      const meio = (lo + hi + 1) >> 1;
      if (inicioDaLinha[meio] <= abs) lo = meio; else hi = meio - 1;
    }
    return lo + 1;
  };

  // `jaConferido` existe para o gabarito do Svelte: lá a validação de snippet é
  // feita na posição do `style=`, e reconferir na posição da declaração daria
  // sempre mascarado — ela fica DEPOIS da crase de abertura, que é justamente o
  // que a máscara marca.
  const push = (prop, valor, abs, jaConferido = false) => {
    if (!jaConferido && mask[abs]) return;              // snippet exibido, não aplicado
    const nome = kebab(String(prop).trim().replace(/['"]/g, ''));
    const v = String(valor).trim().replace(/['"]/g, '');
    if (!INLINE_DESIGN_PROPS.has(nome)) return;
    if (INLINE_MECHANICAL_VALUE.test(v)) return;
    if (INLINE_DYNAMIC.test(v)) return;
    if (!INLINE_QUANTITY.test(v)) return;
    out.push({ line: linhaDe(abs), decl: `${nome}: ${v}` });
  };
  const pares = (txt, delta) => {
    for (const m of txt.matchAll(/([a-zA-Z-]+)\s*:\s*(["'])([^"']*)\2/g)) push(m[1], m[3], delta + m.index);
  };

  // Em objeto JSX o número vai SEM aspas e SEM unidade — `minHeight: 120`, que
  // o React renderiza como `120px`. O casamento acima exige aspas, então esse
  // valor nunca chegava a ser lido: um `minHeight: 120` em docs page passou
  // pelo portão três vezes no mesmo arquivo. Não vale para `line-height` e
  // companhia, onde número puro é a forma correta.
  const paresJsx = (txt, delta) => {
    pares(txt, delta);
    for (const m of txt.matchAll(/([a-zA-Z-]+)\s*:\s*(-?\d*\.?\d+)\s*[,}]/g)) {
      if (INLINE_UNITLESS_OK.has(kebab(m[1]))) continue;
      push(m[1], m[2] + 'px', delta + m.index);
    }
  };

  // style={{ … }} — jsx, com o objeto numa linha ou quebrado em várias.
  //
  // A primeira versão varria linha a linha e só enxergava o objeto inteiro numa
  // linha só. `style={{` seguido das propriedades nas linhas de baixo — que é o
  // que o prettier produz assim que a linha passa de 80 colunas — ficava
  // invisível: 14 ocorrências, DUAS DELAS EM PRIMITIVO, a categoria de
  // gravidade alta que o inventário dava como zerada. Por isso o casamento é de
  // chaves, sobre a fonte inteira, e não por linha.
  for (const m of src.matchAll(/style=\{\{/g)) {
    let i = m.index + m[0].length, prof = 2;
    while (i < src.length && prof > 0) {
      if (src[i] === '{') prof++;
      else if (src[i] === '}') prof--;
      i++;
    }
    paresJsx(src.slice(m.index, i), m.index);
  }

  // style={`width: 1.5rem; background: ${cor}`} — svelte com literal de gabarito.
  //
  // Some da varredura geral por um efeito colateral da guarda de snippet: a
  // crase que abre o gabarito abre também uma região "exibida ao leitor", e
  // tudo depois dela fica mascarado. A consulta aqui é na posição do `style=`,
  // ANTES da crase — se o atributo em si não está dentro de um snippet, o que
  // vem nele é estilo aplicado. Uma ocorrência real hoje, virando guarda para
  // não voltar a passar despercebida.
  for (const m of src.matchAll(/style=\{`([^`]*)`\}/g)) {
    if (mask[m.index]) continue;
    const corpo = m[1];
    const delta = m.index + m[0].indexOf('`') + 1;
    for (const d of corpo.split(';')) {
      const rel = corpo.indexOf(d);
      const [p, ...r] = d.split(':');
      if (p && r.length) push(p, r.join(':'), delta + rel, true);
    }
  }

  let base = 0;
  src.split('\n').forEach((linha) => {
    const ini = base;
    base += linha.length + 1;
    // :style="{ minHeight: '200px' }" — vue com objeto ligado
    for (const m of linha.matchAll(/:style=(["'])\s*\{([\s\S]*?)\}\s*\1/g)) pares(m[2], ini + m.index);
    // style="a: 1rem; b: 2rem" — vue, svelte, angular, html
    for (const m of linha.matchAll(/(?<!:)style=(["'])([^"']*)\1/g)) {
      if (m[2].trim().startsWith('{')) continue;         // objeto, já tratado acima
      for (const d of m[2].split(';')) {
        const [p, ...r] = d.split(':');
        if (p && r.length) push(p, r.join(':'), ini + m.index);
      }
    }
    // el.style.height = '2rem' — factories vanilla
    for (const m of linha.matchAll(/\.style\.([a-zA-Z]+)\s*=\s*(["'])([^"']*)\2/g)) {
      if (m[1] === 'cssText') continue;                 // tratado abaixo, é folha inteira
      push(m[1], m[3], ini + m.index);
    }
    // el.style.cssText = 'width:20rem;padding:1rem' — mesma coisa, uma linha só.
    // Ficou de fora da primeira versão e escondia 12 declarações reais no vanilla,
    // entre elas `min-height: 7.5rem` repetido em três arquivos do sonner.
    for (const m of linha.matchAll(/\.style\.cssText\s*\+?=\s*(["'])([^"']*)\1/g)) {
      for (const d of m[2].split(';')) {
        const [p, ...r] = d.split(':');
        if (p && r.length) push(p, r.join(':'), ini + m.index);
      }
    }
  });
  out.sort((a, b) => a.line - b.line);
  return out;
}

/**
 * Valor de design cravado em `style` inline. Regra GERAL das cinco stacks.
 *
 * Inline vence qualquer folha, então a declaração fica fora do tema, fora da
 * densidade e fora da escala tipográfica — e `height` cravado é o defeito de
 * WCAG 1.4.4 que a convenção de altura já proíbe.
 *
 * O alcance começou em `components/ui` sem stories, e era estreito demais: a
 * proibição valia para o repositório inteiro, mas o detector só olhava o
 * primitivo. As DOCS PAGES ficaram de fora por medo do falso positivo — elas
 * misturam estilo renderizado com snippet exibido ao leitor — e é justamente
 * lá que o dano é maior: é o markup que o leitor copia, e a fase 3 do carrossel
 * corrigiu exatamente esse defeito. A separação hoje é feita por
 * `snippetMask`, medida em 29% dos achados crus.
 *
 * Severidade por dano: docs page e primitivo são **high** (o leitor copia um,
 * o produto usa o outro); andaime de story é **medium**.
 */
/**
 * Fixture de story copiada entre arquivos do mesmo componente.
 *
 * Um componente tem quatro ou cinco arquivos de story, e cada um costuma
 * precisar do mesmo andaime — montar o slide, embrulhar o campo, medir o painel.
 * A saída fácil é copiar a função, e o custo só aparece muito depois: quem
 * conserta uma cópia acredita ter resolvido, e as outras continuam erradas.
 *
 * Foi exatamente assim que o slide do carousel no Vanilla ficou branco em quatro
 * arquivos depois de eu corrigir o quinto — a dona viu na tela o que nenhuma
 * regra media. A varredura que investigou aquilo achou 182 cópias no repositório.
 *
 * DUAS SEVERIDADES, porque são dois problemas:
 *  · cópias com corpos DIFERENTES são o caso grave — mesmo nome, comportamento
 *    divergente, e nenhum sinal de que divergiram;
 *  · cópias idênticas são dívida mecânica, e entram como `low`.
 *
 * O que NÃO conta: função de uma linha (`const x = () => …` não é andaime),
 * e nome que aparece uma vez só por arquivo do slug.
 */
function auditFixtureDuplicada(slug) {
  const violations = [];
  const normalizar = (s) => s.replace(/\/\/[^\n]*/g, '').replace(/\s+/g, ' ').trim();

  for (const stack of STACKS) {
    const { ui } = filesForSlug(slug, stack);
    const stories = ui.filter((f) => /\.stories\.[jt]sx?$/.test(f));
    if (stories.length < 2) continue;

    const porNome = {};
    for (const file of stories) {
      const src = readFile(file);
      if (!src) continue;
      // `async` entra. A primeira versão desta regra casava só `function`, e o
      // helper que ABRE um overlay — o mais copiado de todos, porque toda story
      // de painel precisa dele — é assíncrono por natureza. `popover.abrir`
      // estava em três arquivos byte a byte e não aparecia no relatório.
      const re = /^(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(/gm;
      let m;
      while ((m = re.exec(src))) {
        // Pula a lista de parâmetros ANTES de procurar o corpo. Sem isto, o
        // primeiro `{` de `function X({ label }: Props)` é a desestruturação, e
        // a comparação passa a ser entre ASSINATURAS — foi o que fez a varredura
        // que motivou esta regra reportar divergência onde os corpos eram iguais.
        let p = src.indexOf('(', m.index), prof = 0;
        for (; p < src.length; p++) {
          if (src[p] === '(') prof++;
          else if (src[p] === ')') { prof--; if (prof === 0) { p++; break; } }
        }
        const abre = src.indexOf('{', p);
        if (abre < 0) continue;
        let chaves = 0, i = abre;
        for (; i < src.length; i++) {
          if (src[i] === '{') chaves++;
          else if (src[i] === '}') { chaves--; if (chaves === 0) { i++; break; } }
        }
        const corpo = normalizar(src.slice(abre, i));
        // Corpo de uma linha não é andaime — é atalho local, e extrair custaria
        // mais leitura do que economiza.
        if (corpo.length < 80) continue;
        (porNome[m[1]] ??= []).push({ file: basename(file), corpo });
      }
    }

    for (const [nome, usos] of Object.entries(porNome)) {
      if (usos.length < 2) continue;
      const divergiu = new Set(usos.map((u) => u.corpo)).size > 1;
      violations.push({
        category: 'quality',
        severity: divergiu ? 'high' : 'low',
        slug, stack,
        file: relative(ROOT, stories[0]),
        rule: 'fixture_duplicada_entre_stories',
        message: divergiu
          ? `\`${nome}\` existe em ${usos.length} arquivos de story com CORPOS DIFERENTES (${usos.map((u) => u.file).join(', ')}) — mesmo nome, comportamento divergente; corrigir um não corrige os outros. Extraia para \`${slug}.fixtures.*\` com a variação em parâmetro`
          : `\`${nome}\` está copiada em ${usos.length} arquivos de story (${usos.map((u) => u.file).join(', ')}) — extraia para \`${slug}.fixtures.*\``,
      });
    }
  }
  return violations;
}

function auditInlineStyle(slug) {
  const violations = [];
  for (const stack of STACKS) {
    const { ui, docs } = filesForSlug(slug, stack);
    for (const file of [...ui, ...docs]) {
      const content = readFile(file);
      if (!content) continue;
      const decls = inlineStyleDecls(content);
      if (!decls.length) continue;
      // Andaime de demo tem peso menor que o primitivo e que a docs page, mas é
      // o que as pessoas copiam — por isso entra, em vez de ser ignorado.
      const andaime = /Story\.[a-z]+$/i.test(basename(file)) || /\.stories\./.test(file);
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
/**
 * `tema_incompleto` — todo tema tem de declarar os 39 tokens de cor, no claro,
 * e no escuro tudo que MUDA de valor.
 *
 * Isto virou fatal quando a cor saiu do `:root`. Antes, o tema que esquecia um
 * token caía no valor do Default e ninguém via; hoje o token fica sem valor
 * nenhum, e `hsl(var(--primary))` não pinta nada. O sintoma é cor faltando na
 * tela — coisa que nem build nem type-check enxergam, e que a suíte só pegaria
 * se houvesse story daquele tema exercitando aquele componente.
 *
 * O bloco claro `.tema-<id>` casa também com o `<html>` em modo escuro, porque a
 * classe está lá. Por isso o escuro só precisa declarar a diferença — e por isso
 * a conferência do escuro é feita sobre a UNIÃO dos dois blocos, não sobre o
 * bloco escuro sozinho. Os cinco `--chart-*` são o caso normal disso: nenhum
 * tema os redeclara no escuro, de propósito.
 */
const TOKENS_DE_TEMA = [
  'background', 'foreground', 'card', 'card-foreground', 'popover', 'popover-foreground',
  'primary', 'primary-foreground', 'secondary', 'secondary-foreground',
  'muted', 'muted-foreground', 'accent', 'accent-foreground',
  'destructive', 'destructive-foreground', 'success', 'success-foreground',
  'warning', 'warning-foreground', 'info', 'info-foreground',
  'border', 'input', 'input-background', 'ring',
  // Oito, e não cinco: a paleta de gráfico passou a vir da paleta de sintaxe do
  // code-block, que tem oito matizes e — o que resolveu o defeito — variante por
  // MODO. Antes os cinco eram declarados só no bloco claro e a mesma cor servia
  // à página quase branca e ao fundo quase preto; no Default isso deixava uma
  // série com contraste 1.00, a cor do próprio fundo.
  'chart-1', 'chart-2', 'chart-3', 'chart-4',
  'chart-5', 'chart-6', 'chart-7', 'chart-8',
  'sidebar', 'sidebar-foreground', 'sidebar-primary', 'sidebar-primary-foreground',
  'sidebar-accent', 'sidebar-accent-foreground', 'sidebar-border', 'sidebar-ring',
].map((t) => `--${t}`);

function auditTemasCompletos() {
  const violations = [];
  const dir = join(ROOT, 'docs', 'shared', 'themes');
  if (!existsSync(dir)) return violations;

  for (const arquivo of readdirSync(dir).filter((f) => /\.css$/.test(f))) {
    const conteudo = readFile(join(dir, arquivo)) || '';
    const id = arquivo.replace(/\.css$/, '');
    // Só arquivo que DECLARA um tema entra; `index`, `densities`, `fonts` e
    // `typescale` não são tema e não têm bloco `.tema-<id>`.
    if (!new RegExp(`\\.tema-${id}\\b`).test(conteudo)) continue;

    const declaradosEm = (seletor) => {
      const set = new Set();
      // `(?<![\w-])` é obrigatório: sem ele, `.tema-cold` casa DENTRO de
      // `.dark.tema-cold`, o bloco claro passa a incluir o escuro, e a regra
      // deixa de ver token que só o claro perdeu. Verificado reintroduzindo o
      // defeito — na primeira versão o portão ficou verde com o token removido.
      const rx = new RegExp(
        `(?<![\\w-])${seletor.replace(/[.\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`,
        'g',
      );
      for (const m of conteudo.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(rx)) {
        for (const d of m[1].matchAll(/(--[A-Za-z0-9-]+)\s*:/g)) set.add(d[1]);
      }
      return set;
    };

    const claro = declaradosEm(`.tema-${id}`);
    const escuro = new Set([...claro, ...declaradosEm(`.dark.tema-${id}`)]);

    const faltando = TOKENS_DE_TEMA.filter((t) => !claro.has(t));
    const faltandoEscuro = TOKENS_DE_TEMA.filter((t) => !escuro.has(t));
    const ausentes = [...new Set([...faltando, ...faltandoEscuro])];
    if (!ausentes.length) continue;

    violations.push({
      category: 'quality', severity: 'high', slug: '_infra', stack: 'shared',
      file: relative(ROOT, join(dir, arquivo)), rule: 'tema_incompleto',
      message:
        `o tema \`${id}\` não declara ${ausentes.length} token(s) de cor ` +
        `(${ausentes.slice(0, 5).join(', ')}) — e desde que a cor saiu do \`:root\` ` +
        'não há valor de reserva: o token fica indefinido e a propriedade não pinta',
    });
  }
  return violations;
}

/**
 * Story de componente sem tag de CATEGORIA.
 *
 * O filtro da sidebar do Storybook é por tag, e tag em CSF não se herda: cada
 * arquivo de story carrega as suas. Um componente é escrito em quatro arquivos
 * — `<slug>.stories`, `-variants`, `-compositions`, `-states` —, e a categoria
 * costumava ser declarada só no primeiro.
 *
 * O efeito é silencioso e enganoso, que é o que torna esta regra necessária:
 * sem filtro a árvore está inteira, e ao filtrar por "display" o MediaPlayer
 * aparece com Documentação e Playground e MAIS NADA. A pasta continua lá, o que
 * faz parecer bug de renderização em vez de ausência de tag. Nenhum portão via:
 * não é tipo, não é classe, não é texto — o build compila e a story roda.
 *
 * Medido em 2026-08-30: 93 arquivos nas cinco stacks, 77 deles no Angular, que
 * nasceu sem esta convenção.
 *
 * Desde que a árvore virou `Primitives/<Categoria>/<Componente>`, a categoria
 * também é a PASTA — e a regra confere as duas uma contra a outra. Tag que
 * discorda da pasta produz o mesmo sintoma da tag ausente, e só esta regra vê.
 *
 * `QA/` e `Foundations/` ficam de fora de propósito: são stories de portão e de
 * fundamento, não de componente, e não pertencem a categoria nenhuma.
 */
const CATEGORIAS_SIDEBAR = new Set([
  'form', 'overlay', 'layout', 'navigation', 'feedback',
  'display', 'conversational', 'disclosure', 'tables',
]);

/**
 * Cartão dentro de cartão sem descontar o inset.
 *
 * A regra é `Rᵢ = Rₑ − E` — o raio do filho é o do pai menos o espaçamento
 * entre eles —, e a página de fundamentos Elevação a documenta com a
 * consequência: "repetir o raio do pai deixa o canto interno visualmente mais
 * grosso". As seções das docs pages nasceram ANTES da regra e nunca foram
 * atualizadas: `.nds-card` dentro de `.nds-card` com 16px de inset, os dois com
 * `--radius-card`. 16px a mais no filho, em todos os temas.
 *
 * Ficou invisível por muito tempo porque a base era 14px e o erro passava por
 * decoração. Com o tema `warm` em 32px, o cartão externo vai a 36px e o canto
 * grosso aparece — foi assim que o defeito foi notado, por olho, não por portão.
 *
 * A conferência é POSICIONAL, e é o que dá para fazer sem parsear cinco
 * sintaxes: nas seções compartilhadas o cartão de fora é sempre declarado antes
 * dos de dentro, então todo cartão depois do primeiro precisa de
 * `nds-card-nested`. Arquivo cujos cartões são IRMÃOS (o `DocsTestes` é o caso)
 * se declara com `audit-ignore: card-nested — <motivo>` na primeira linha do
 * bloco de comentário. Exceção sem motivo escrito não conta.
 */
const CARTAO_POR_STACK = {
  react: /<Card\b/g,
  vue: /<Card\b/g,
  svelte: /<Card\b/g,
  angular: /<div\s+ndsCard\b/g,
  vanilla: /createCard\(/g,
};

function auditCardNestedRadius() {
  const violations = [];
  for (const stack of STACKS) {
    const dir = join(ROOT, stackDir(stack), 'src', 'components', 'docs', 'shared', 'sections');
    const rx = CARTAO_POR_STACK[stack];
    if (!rx || !existsSync(dir)) continue;

    for (const file of walkDir(dir, ['.ts', '.tsx', '.vue', '.svelte'])) {
      const content = readFile(file);
      if (!content) continue;
      if (/audit-ignore:\s*card-nested\s*[—-]\s*\S/.test(content)) continue;

      const cartoes = [...content.matchAll(new RegExp(rx.source, 'g'))].map((m) => m.index);
      if (cartoes.length < 2) continue;

      // Do segundo em diante: cada um tem de carregar a classe. Olha só a
      // janela daquele cartão, senão a classe de um vizinho absolveria todos.
      let semClasse = 0;
      for (let i = 1; i < cartoes.length; i++) {
        const fim = i + 1 < cartoes.length ? cartoes[i + 1] : content.length;
        const janela = content.slice(cartoes[i], Math.min(fim, cartoes[i] + 600));
        if (!janela.includes('nds-card-nested')) semClasse++;
      }
      if (semClasse === 0) continue;

      violations.push({
        category: 'quality', severity: 'medium', slug: '_infra', stack,
        file: relative(ROOT, file), rule: 'card_aninhado_sem_desconto',
        message:
          `${semClasse} cartão(ões) aninhado(s) sem \`nds-card-nested\` — filho que repete` +
          ' o raio do pai fica com o canto grosso (Rᵢ = Rₑ − E, ver a página de' +
          ' fundamentos Elevação). Se os cartões forem IRMÃOS e não aninhados, declare' +
          ' `audit-ignore: card-nested — <motivo>` no arquivo',
      });
    }
  }
  return violations;
}

function auditStoryCategoryTag() {
  const violations = [];
  for (const stack of STACKS) {
    const ui = join(ROOT, stackDir(stack), 'src', 'components', 'ui');
    for (const file of walkDir(ui, ['.stories.ts', '.stories.tsx', '.stories.svelte'])) {
      const content = readFile(file);
      if (!content) continue;

      // Ancorado em `Primitives/`, e não no primeiro `title:` do arquivo: o
      // `code-block.stories` declara `title: 'exemplo.ts'` num fixture ANTES do
      // meta, e ler o primeiro fazia o arquivo escapar da regra inteira — o
      // portão que filtra excluindo em silêncio. São 5 arquivos assim hoje.
      const titulo = (content.match(/title:\s*['"](Primitives\/[^'"]+)['"]/) || [])[1];
      if (!titulo) continue;

      const bloco = content.match(/tags:\s*\[([\s\S]*?)\]/);
      const tags = bloco ? [...bloco[1].matchAll(/['"]([^'"]+)['"]/g)].map((m) => m[1]) : [];
      const declarada = tags.find((t) => CATEGORIAS_SIDEBAR.has(t));

      // A pasta é a verdade visível: `Primitives/Form/Button/Variants` põe a
      // story dentro de Formulário quer a tag concorde ou não. Conferir uma
      // contra a outra pega os dois defeitos com a mesma regra — a tag ausente
      // e a tag que discorda da pasta, que produz o MESMO sintoma: a story está
      // na árvore e o filtro daquela categoria não a traz.
      const daPasta = titulo.split('/')[1]?.toLowerCase();

      if (declarada === daPasta) continue;

      violations.push({
        category: 'quality', severity: 'medium', slug: '_infra', stack,
        file: relative(ROOT, file), rule: 'story_sem_categoria',
        message: declarada
          ? `"${titulo}" está na pasta ${daPasta} e declara \`tags: ['${declarada}']\` —` +
            ' ao filtrar por qualquer uma das duas a story some de uma delas. Faça a tag' +
            ' bater com a pasta'
          : `"${titulo}" não declara categoria em \`tags\` — ao filtrar a sidebar por` +
            ' categoria esta story some, e some em silêncio: a pasta do componente' +
            ' continua visível pelas outras stories dele. Declare' +
            ` \`tags: ['${daPasta}']\`, a mesma da pasta`,
      });
    }
  }
  return violations;
}

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

    // ── Classe de tema no ponto de entrada ───────────────────────────────
    //
    // Os 39 tokens de cor deixaram o `:root` e passaram a viver só nos temas
    // (`docs/shared/themes/*.css`), um bloco por tema. Enquanto o Default era
    // "ausência de classe", os valores dele precisavam existir em DOIS lugares
    // — `tokens.css` e `default.css` — mantidos iguais à mão. Divergiram.
    //
    // O preço da correção é que a classe virou obrigatória: sem `tema-*` no
    // `<html>`, não há cor nenhuma. Isso falha de forma feia e silenciosa — a
    // página renderiza, o build passa, e o que aparece é texto preto sobre
    // branco com as bordas invisíveis. Nenhum portão de tipo veria.
    if (existsSync(previewHead)) {
      const conteudo = readFile(previewHead) || '';
      // O bloco da marca condicionava a classe ao valor não ser o default.
      // Densidade, fonte e escala seguem fazendo isso, e está certo: os
      // defaults DELAS continuam no `:root`. Só a cor mudou de contrato.
      if (/globals\.brand\s*(?:!==|!=)\s*['"]default['"]/.test(conteudo)) {
        violations.push({
          category: 'quality', severity: 'high', slug: '_infra', stack,
          file: relative(ROOT, previewHead), rule: 'tema_ausente_no_ponto_de_entrada',
          message:
            'o preview-head só aplica `tema-*` quando a marca NÃO é o default — e o' +
            ' Default deixou de ser ausência de classe. Sem classe não há cor, e como' +
            ' este script roda antes da primeira pintura, o efeito é a página abrir sem' +
            ' tema. Aplique sempre: `tema-` + (globals.brand || "default")',
        });
      }
    }

    const indexHtml = join(ROOT, stackDir(stack), 'index.html');
    if (existsSync(indexHtml)) {
      const abertura = (readFile(indexHtml) || '').match(/<html\b[^>]*>/i);
      if (abertura && !/tema-/.test(abertura[0])) {
        violations.push({
          category: 'quality', severity: 'high', slug: '_infra', stack,
          file: relative(ROOT, indexHtml), rule: 'tema_ausente_no_ponto_de_entrada',
          message:
            'o `<html>` do sandbox não traz classe `tema-*`. Mesmo que o código aplique' +
            ' o tema depois, a primeira pintura sai sem cor — e se não aplicar, nunca vem',
        });
      }
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

/** Nomes ainda em português, lidos do próprio primitivo que os declara. */
let _identsPt = null;
function identsPt() {
  if (_identsPt) return _identsPt;
  const src = readFile(join(ROOT, 'docs', 'shared', 'primitives', 'identificadores-pt.ts')) || '';
  // Chave balanceada, não `\n};`: a primeira versão procurava o fechamento em
  // início de linha e não achava um objeto escrito numa linha só — que é
  // exatamente como `MANTIDOS` nasce (`= {};`) e como fica quando alguém
  // declara a primeira exceção. O bloco vinha vazio, a dispensa não valia, e a
  // regra continuava acusando um nome já decidido.
  const bloco = (nome) => {
    const i = src.indexOf(`export const ${nome}`);
    if (i < 0) return '';
    const abre = src.indexOf('{', i);
    if (abre < 0) return '';
    let n = 0;
    for (let k = abre; k < src.length; k++) {
      if (src[k] === '{') n++;
      else if (src[k] === '}') { n--; if (n === 0) return src.slice(abre, k); }
    }
    return '';
  };
  // Cega o VALOR antes de ler a chave. Os motivos são frases em português e
  // vêm cheios de `:` e de `,` — `'polissêmico: elemento recém-montado…'` —, e
  // qualquer regex que leia o bloco cru acaba colhendo pedaço de prosa como se
  // fosse nome. Com o valor apagado, sobra só `chave:`.
  const chaves = (texto) => {
    const cego = texto.replace(/(['"`])(?:\\.|(?!\1)[\s\S])*\1/g, "''");
    return new Set([...cego.matchAll(/([A-Za-zÀ-ÿ_$][\w$À-ÿ]*)\s*:/g)].map((m) => m[1]));
  };
  _identsPt = { pendentes: chaves(bloco('PENDENTES')), mantidos: chaves(bloco('MANTIDOS')) };
  return _identsPt;
}

/**
 * Identificador em português dentro do componente.
 *
 * Duas fontes, porque uma só não cobre:
 *
 *  · a **lista declarada** em `identificadores-pt.ts`, que é o que sobrou da
 *    campanha de tradução — nomes cujo alvo em inglês já existe no arquivo com
 *    outro sentido, ou que significam duas coisas em dois lugares. Morfologia
 *    não os pega: `texto`, `linhas` e `atual` não têm sufixo português nenhum;
 *  · a **morfologia** de `pareceProtugues`, que pega o que ainda não foi
 *    catalogado — nome novo escrito em português depois desta lista fechar.
 *
 * Só DECLARAÇÃO conta, e só fora de comentário. O detector de colisão da
 * campanha era cego às duas coisas e inflou o backlog: `esperar` entrou como
 * conflito em seis arquivos quando é declarado UMA vez no repositório — nos
 * outros cinco aparecia em prosa.
 */
const DECLARA_RX = (n) =>
  new RegExp(
    `(?:const|let|var|function|type|interface|class|enum)\\s+${n}\\b` +
      `|\\b${n}\\s*[:=]\\s*(?:\\(|function|async|signal|computed|input)`,
    'g',
  );

/**
 * Radicais portugueses que NÃO são palavra inglesa.
 *
 * Fora da lista de propósito: `total`, `item`, `label`, `local`, `final`,
 * `area`, `media`, `modal`, `normal` — iguais nas duas línguas. Incluí-las
 * geraria ruído garantido, e portão ruidoso é portão que se aprende a ignorar.
 */
const RADICAIS_PT = [
  'abrir', 'fechar', 'fechado', 'aberto', 'marcar', 'desmarcar', 'filtrar', 'mover',
  'remover', 'adicionar', 'buscar', 'criar', 'montar', 'limpar', 'salvar', 'enviar',
  'mostrar', 'esconder', 'alternar', 'selecionar', 'escolher', 'ordenar', 'validar',
  'calcular', 'atualizar', 'rotulo', 'gatilho', 'opcao', 'opcoes', 'itens', 'campo',
  'valor', 'valores', 'texto', 'aviso', 'lista', 'listas', 'tamanho', 'largura',
  'altura', 'borda', 'fundo', 'estado', 'ativo', 'ativa', 'visivel', 'visiveis',
  'desabilitado', 'obrigatorio', 'vazio', 'cheio', 'primeiro', 'ultimo', 'proximo',
  'anterior', 'contador', 'indice', 'chave', 'linha', 'coluna', 'tabela', 'pagina',
  'botao', 'entrada', 'saida', 'erro', 'sucesso', 'falha', 'tentativa', 'quantidade',
  'conteudo', 'cabecalho', 'rodape', 'corpo', 'titulo', 'descricao', 'mensagem',
  'resposta', 'usuario', 'senha', 'nome', 'sobrenome', 'endereco', 'telefone',
  'arquivo', 'pasta', 'caminho', 'padrao', 'tamanhos', 'cores', 'icone', 'icones',
  'imagem', 'janela', 'painel', 'seletor', 'ancora', 'posicionador', 'recolher',
  'expandir', 'arrastar', 'soltar', 'rolagem', 'atraso', 'duracao', 'inicio',
  'passo', 'passos', 'nivel', 'ordem', 'grupo', 'grupos', 'filho', 'filhos',
  'raiz', 'folha', 'peca', 'pecas', 'medida', 'medidas', 'regra', 'regras',
  'portao', 'achado', 'achados', 'sitio', 'sitios', 'chamada',
];

/**
 * Nomes portugueses num código, ignorando comentário e texto de interface —
 * comentário em português é a regra da casa, não desvio dela.
 *
 * Usado PELOS DOIS: pela regra e pelo gerador da linha de base. Ter dois
 * contadores é ter duas verdades, e o portão passa a comparar uma com a outra.
 */
function identsPtNoCodigo(bruto, caminho = '') {
  // Comentário de MARCAÇÃO também é comentário. O `stripComments` cobre `//` e
  // `/* */`, que é o bastante para .ts, mas .svelte e .vue escrevem nota em
  // `<!-- -->` — e português ali é a regra da casa, não desvio dela. Sem esta
  // linha o portão empurrava a nota para dentro do `<script>` só para escapar
  // dele, que é o portão mandando piorar o código.
  const semMarcacao = bruto.replace(/<!--[\s\S]*?-->/g, ' ');
  // O blank de literais é heurística de PAREAMENTO, e apóstrofo de prosa
  // ("Don't", "d'água") abre uma aspa que nunca fecha: dali para a frente o
  // pareamento inverte e texto de template passa a contar como código. Foi o
  // que aconteceu ao descascar `<!-- -->`: um "Don't" saiu de dentro de um
  // comentário, a paridade do arquivo virou, e 30 páginas de docs reprovaram
  // por palavra de interface. A guarda é só esta — aspa de abertura não vem
  // grudada em letra ou dígito. Não guardei contra quebra de linha: atributo
  // de marcação atravessa linha por rotina (`:items="[…]"` em três linhas), e
  // proibir isso expôs 12 nomes antigos de uma vez, medido.
  let codigo = stripComments(semMarcacao)
    .replace(/(^|[^\w'])'(?:[^'\\]|\\.)*'/g, "$1''")
    .replace(/(^|[^\w"])"(?:[^"\\]|\\.)*"/g, '$1""')
    .replace(/`(?:[^`\\]|\\.)*`/g, '``');

  // TEXTO ENTRE TAGS é interface, não código: `<Trigger>Item fechado</Trigger>`
  // não declara nada. O contador lia isso, e não reprovava só por acidente —
  // aquele mesmo "Don't" abria uma aspa que apagava metade do template. Tirado
  // o acidente, 30 páginas de docs reprovaram por palavra de tela.
  //
  // Só em arquivo que É marcação (.vue, .svelte, .tsx). Em .ts puro `a > b` e
  // `c < d` casariam o mesmo padrão e apagariam expressão real — e a marcação
  // do Angular mora em crase, que a linha acima já apagou inteira.
  //
  // Duas ressalvas, e as duas são o portão inteiro:
  //  - o corpo de `<script>` fica ENTRE `>` e `<`. Descascar sem tirá-lo de
  //    lado cegava a regra justamente onde mora o código: `const rotuloAtivo`
  //    dentro do `<script>` de um .svelte passava limpo. Medido.
  //  - `{expr}` entre tags é código, não texto. Por isso o padrão recusa chave:
  //    `<span>{rotuloAtivo}</span>` continua sendo lido.
  if (/\.(vue|svelte|tsx)$/.test(caminho)) {
    const scripts = [];
    codigo = codigo
      .replace(/<script[\s\S]*?<\/script>/gi, (bloco) => {
        scripts.push(bloco);
        return '<script></script>';
      })
      .replace(/>[^<>{}]*</g, '><');
    codigo += '\n' + scripts.join('\n');
  }
  const vistos = new Set();
  for (const radical of RADICAIS_PT) {
    const Cap = radical[0].toUpperCase() + radical.slice(1);
    const re = new RegExp('\\b' + radical + '(?:[A-Z]\\w*)?\\b|\\b\\w+' + Cap + '\\b', 'g');
    for (const nome of codigo.match(re) || []) vistos.add(nome);
  }
  return vistos;
}

/**
 * Regenera a linha de base da catraca, com o MESMO contador da regra.
 *
 *   node scripts/audit.mjs --gerar-baseline-pt
 *
 * Rode depois de PAGAR dívida, para a catraca descer. Rodar para calar uma
 * reprovação de código novo é usar a chave de fenda como martelo: funciona uma
 * vez e some com o motivo de o portão existir.
 */
function gerarBaselinePt() {
  const base = {};
  const varrer = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) { if (e.name !== 'node_modules') varrer(p); continue; }
      if (!/\.(tsx?|vue|svelte)$/.test(e.name)) continue;
      const n = identsPtNoCodigo(readFile(p) || '', p).size;
      if (n) base[relative(ROOT, p).split('\\').join('/')] = n;
    }
  };
  for (const stack of STACKS) {
    varrer(join(ROOT, `nortear-design-system-${stack}`, 'src'));
  }
  const ordenado = Object.fromEntries(
    Object.entries(base).sort(([a], [b]) => a.localeCompare(b)),
  );
  writeFileSync(
    join(ROOT, 'docs', 'shared', 'primitives', 'identificadores-pt-baseline.json'),
    JSON.stringify(ordenado, null, 2) + '\n',
  );
  const total = Object.values(ordenado).reduce((a, b) => a + b, 0);
  console.log(`linha de base: ${Object.keys(ordenado).length} arquivos, ${total} nomes`);
}

/**
 * Identificador em português em código NOVO.
 *
 * A regra `identificador_pt` compara contra uma LISTA DECLARADA de nomes
 * conhecidos, e morfologia foi deliberadamente excluída dela. Isso a torna boa
 * para rastrear a dívida antiga e cega para a nova: um arquivo inteiro escrito
 * em português passa limpo, e foi o que aconteceu quando o combobox do Vanilla
 * nasceu com trinta nomes assim.
 *
 * Esta regra fecha o buraco por CATRACA, não por varredura. Uma varredura
 * acharia 1783 nomes em 934 arquivos e afogaria o sinal — a dívida antiga é
 * real e não se paga num commit. A linha de base em
 * `docs/shared/primitives/identificadores-pt-baseline.json` guarda quantos
 * nomes cada arquivo já tinha; reprova quem CRESCE, e arquivo fora da lista
 * reprova com qualquer nome.
 *
 * Assim a dívida só encolhe: quem paga, regenera a linha de base para baixo;
 * quem tenta somar, é barrado.
 *
 * O que ela NÃO alcança, declarado para não virar cobertura fantasma:
 *   - nome igual nas duas línguas (`total`, `item`, `label`) — fora da lista de
 *     radicais de propósito, porque incluí-lo geraria ruído garantido;
 *   - nome importado de módulo compartilhado que ainda carrega a dívida
 *     (`chamada`, `montar` do `story-source`): o consumidor é acusado pelo
 *     import, e a correção é no módulo, não nele;
 *   - CONTAGEM, não identidade: trocar um nome português por outro mantém o
 *     total e passa. A catraca impede crescimento, não substituição.
 */
function auditIdentificadorPtNovo(slug) {
  const violations = [];
  const basePath = join(ROOT, 'docs', 'shared', 'primitives', 'identificadores-pt-baseline.json');
  let base = {};
  try {
    base = JSON.parse(readFile(basePath) || '{}');
  } catch {
    return violations;   // sem linha de base, a catraca não tem contra o que medir
  }

  for (const stack of STACKS) {
    const { all } = filesForSlug(slug, stack);
    for (const file of all) {
      const bruto = readFile(file);
      if (!bruto) continue;
      const vistos = identsPtNoCodigo(bruto, file);

      const rel = relative(ROOT, file).split('\\').join('/');
      const permitido = base[rel] ?? 0;
      if (vistos.size <= permitido) continue;

      violations.push({
        category: 'quality',
        severity: 'medium',
        slug,
        stack,
        file: rel,
        rule: 'identificador_pt_novo',
        message:
          vistos.size + ' identificadores em português, contra ' + permitido +
          ' na linha de base — ' + [...vistos].slice(0, 6).join(', ') +
          '. Código é escrito em inglês — ver "Idioma do código" em' +
          ' docs/shared/guidelines/11-consistencia-cross-stack.md. Se a dívida foi' +
          ' PAGA, regenere docs/shared/primitives/identificadores-pt-baseline.json.',
      });
    }
  }
  return violations;
}

function auditIdentificadorPt(slug) {
  const violations = [];
  const { pendentes, mantidos } = identsPt();

  for (const stack of STACKS) {
    const { all } = filesForSlug(slug, stack);
    for (const file of all) {
      const content = stripComments(readFile(file) || '');
      const vistos = new Set();

      for (const nome of pendentes) {
        // `MANTIDOS` vence `PENDENTES`. Decidir que um nome fica é mover a
        // entrada de uma lista para a outra, e quem faz isso não deve precisar
        // lembrar de apagar a original — a regra tem de ficar calada pelo ato
        // de declarar, não pela limpeza que o segue.
        if (mantidos.has(nome)) continue;
        if (vistos.has(nome) || !content.includes(nome)) continue;
        if (!DECLARA_RX(nome).test(content)) continue;
        vistos.add(nome);
        violations.push({
          category: 'quality', severity: 'low', slug, stack,
          file: relative(ROOT, file), rule: 'identificador_pt',
          message: `\`${nome}\` continua em português — a campanha não pôde traduzi-lo por varredura, e o motivo está em docs/shared/primitives/identificadores-pt.ts. Renomeie e tire da lista, ou mova para MANTIDOS com o motivo`,
        });
      }

      // A morfologia de `pareceProtugues` NÃO entra aqui, e a medição é o
      // motivo: ligada, ela produziu 1178 achados em 50 componentes — 24 por
      // componente, contra os 11 da lista declarada. O que ela pega não são os
      // nomes que a campanha deixou em aberto, e sim uma cauda muito maior que
      // a campanha nunca cobriu (`descricao`, `luminancia`, `deslocamento`,
      // `opcao`), porque estava fora dos 432 radicais varridos.
      //
      // Portão que despeja backlog não é portão: quem abre o componente para
      // revisar testes não vai traduzir 24 nomes de passagem, então aprende a
      // ignorar a regra inteira — e junto some o achado que importava. A cauda
      // é trabalho legítimo, mas é trabalho de um lote próprio, medido de uma
      // vez, e não pedaço avulso no meio da revisão de outro assunto.
    }
  }
  return violations;
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
        // `Primitivos/<Categoria>/<Componente>/<Grupo>`: estrutura é 0, 1 e 3.
        // O índice 2 é o NOME DO COMPONENTE, que fica em inglês de propósito —
        // são 607 nomes e traduzi-los não se sustenta (ver sidebar-labels.ts).
        // Antes da divisão por categoria o grupo morava no índice 2, e conferir
        // aquele índice hoje acusaria os 57 componentes como estrutura sem
        // tradução.
        for (const seg of [
          partes.length > 1 ? partes[0] : null,
          partes.length > 2 ? partes[1] : null,
          partes[3] ?? null,
        ]) {
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
// ─── Links de "Componentes Relacionados" ────────────────────────────────────

/**
 * `sanitize` do Storybook (`storybook/internal/csf`), copiado porque o audit não
 * carrega o Storybook. É ele que transforma o `title` do meta no id da URL:
 * `Primitives/Form/Button` → `primitives-form-button`, e a aba de docs é esse id
 * mais `--docs`. Acento NÃO é removido — `QA/Nome Acessível` vira
 * `qa-nome-acessível`, e é assim que o Storybook resolve mesmo.
 */
function storyIdFromTitle(title) {
  return title
    .toLowerCase()
    .replace(/[ ’–—―′¿'`~!@#$%^&*()_|+\-=?;:'",.<>{}[\]\\/]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Ids que REALMENTE têm página de documentação numa stack.
 *
 * Duas fontes, e as duas importam:
 *   - `*.stories.*` cujo meta declara `tags: [… 'autodocs' …]` — só essas ganham
 *     aba Docs. Kind sem autodocs (Variants, States, Compositions) existe na
 *     árvore e mesmo assim `--docs` não resolve, então entrar aqui pelo título
 *     apenas deixaria o portão cego para o caso mais provável de link errado.
 *   - `*.mdx` com `<Meta title>` — o arquivo JÁ é a página de docs.
 *
 * O `title` é lido depois da âncora do meta, e exigindo título de CAMINHO
 * (inicial maiúscula e uma barra). Ler o primeiro `title:` do arquivo casa
 * fixture de dado — `title: 'exemplo.ts'` no code-block, `title: 'Conta'` em
 * arranjos de demonstração — e um id inventado desses ABSOLVE um link morto.
 */
const _docsIdsPorStack = new Map();
function docsIdsForStack(stack) {
  if (_docsIdsPorStack.has(stack)) return _docsIdsPorStack.get(stack);
  const ids = new Set();
  const dir = join(ROOT, stackDir(stack), 'src');

  for (const file of walkDir(dir, ['.mdx'])) {
    const m = (readFile(file) || '').match(/<Meta\b[^>]*\btitle\s*=\s*(['"])([^'"]+)\1/);
    if (m) ids.add(storyIdFromTitle(m[2]));
  }

  const storyExts = ['.stories.js', '.stories.jsx', '.stories.mjs', '.stories.ts', '.stories.tsx'];
  for (const file of walkDir(dir, storyExts)) {
    const content = readFile(file);
    if (!content) continue;
    const ancora = content.search(/(?:const\s+meta\b|export\s+default\s*\{|satisfies\s+Meta)/);
    if (ancora < 0) continue;
    const bloco = content.slice(ancora);

    const titulos = [...bloco.matchAll(/(?:^|[\s{,])title\s*:\s*(['"`])([^'"`]+)\1/gm)].map((m) => m[2]);
    const titulo = titulos.find((t) => t.includes('/') && /^[A-ZÀ-Ý]/.test(t));
    if (!titulo) continue;

    const tags = bloco.match(/(?:^|[\s{,])tags\s*:\s*\[([^\]]*)\]/m);
    if (!tags || !/['"`]autodocs['"`]/.test(tags[1])) continue;

    ids.add(storyIdFromTitle(titulo));
  }

  _docsIdsPorStack.set(stack, ids);
  return ids;
}

/**
 * Link de navegação apontando para página que não existe.
 *
 * Nenhum portão via isto, e por isso 22 links mortos sobreviveram: o card de
 * "Componentes Relacionados" ABRE — o Storybook aceita qualquer `?path=` e cai
 * numa árvore vazia —, então nem build, nem lint, nem axe, nem play function
 * tinham como reprovar. O defeito só aparecia para quem clicava.
 *
 * O que este portão cobre: todo `?path=/docs/<id>--docs` escrito em `src/`, nas
 * cinco stacks, cruzado contra os ids que têm aba de docs naquela MESMA stack —
 * um link vivo em react e morto em vue é exatamente o caso que passa despercebido.
 *
 * O que ele NÃO cobre, e as duas exclusões são nomeadas de propósito (filtro que
 * exclui em silêncio é como o `source-snippets` encolheu sem ninguém ver):
 *   - arquivo `*.test.*` / `*.spec.*` — o `manager-href.test.ts` monta
 *     `?path=/docs/ui-tabs--docs` e `?path=/docs/x--docs` como ENTRADA sintética
 *     da função sob teste; não são destinos de navegação.
 *   - linha de comentário — o docblock do `analytics.ts` cita
 *     `/?path=/docs/ui-accordion--docs` para ilustrar o formato da URL.
 * Se um desses passar a conter link de navegação de verdade, ele sai da exclusão.
 */
function auditRelatedDeadLink() {
  const violations = [];
  const exts = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.vue', '.svelte', '.mdx', '.html'];

  for (const stack of STACKS) {
    const dir = join(ROOT, stackDir(stack), 'src');
    if (!existsSync(dir)) continue;

    const ids = docsIdsForStack(stack);

    // Cobertura antes de conteúdo: conjunto vazio significa que o leitor de
    // `title`/`tags` parou de casar (meta declarado de outra forma, pasta
    // movida). Sem esta guarda o portão reprovaria os ~70 links de uma vez e
    // pareceria ter achado 70 defeitos, quando quem quebrou foi ele mesmo.
    if (ids.size === 0) {
      violations.push({
        category: 'quality', severity: 'high', slug: '_infra', stack,
        file: `${stackDir(stack)}/src`, rule: 'related_link_alvo_inexistente',
        message:
          'Nenhum id com aba de docs encontrado nesta stack — o leitor de `title`/`tags`' +
          ' do meta não está casando, e o cruzamento de links relacionados ficou sem base.' +
          ' Conserte o leitor em `docsIdsForStack` antes de ler qualquer resultado desta regra',
      });
      continue;
    }

    for (const file of walkDir(dir, exts)) {
      const nome = basename(file);
      if (/\.(test|spec)\./.test(nome)) continue;
      const content = readFile(file);
      if (!content || !content.includes('?path=/docs/')) continue;

      const linhas = content.split('\n');
      for (let i = 0; i < linhas.length; i++) {
        const linha = linhas[i];
        if (/^\s*(\/\/|\*|\/\*|<!--)/.test(linha)) continue;
        for (const m of linha.matchAll(/\?path=\/docs\/([A-Za-z0-9À-Ý-]+?)--docs\b/gi)) {
          const alvo = m[1];
          if (ids.has(alvo)) continue;
          violations.push({
            category: 'quality', severity: 'high', slug: '_infra', stack,
            file: relative(ROOT, file), line: i + 1, rule: 'related_link_alvo_inexistente',
            message:
              `\`?path=/docs/${alvo}--docs\` não corresponde a nenhuma página de documentação` +
              ` desta stack. O link abre uma árvore vazia — o Storybook aceita qualquer` +
              ` \`?path=\`, então nada mais reprova isto. Ou aponte para um id que exista,` +
              ` ou remova a entrada (e a chave \`related.*\` no translations.json, se ela` +
              ` não servir mais a ninguém). Nunca aponte para story de QA: não é página de docs`,
          });
        }
      }
    }
  }
  return violations;
}

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

/**
 * Propriedades cuja customização a doc costuma prometer por classe.
 */
const PROP_CUSTOMIZAVEL =
  /(?:^|[;{\s])(width|max-width|min-width|height|max-height|min-height|padding|margin|background|background-color|color|border-radius|border-bottom-width)\s*:/g;

/** Especificidade "duas ou mais": nenhuma classe única vence. */
function selecaoForte(sel) {
  const classes = (sel.match(/\./g) ?? []).length;
  const attrs = (sel.match(/\[/g) ?? []).length;
  return classes + attrs >= 2;
}

/**
 * A doc promete customizar por classe o que o CSS não deixa.
 *
 * Bateu quatro vezes num bloco só — sheet, hover-card, drawer e sidebar — e o
 * conserto foi sempre o mesmo: expor custom property. O sintoma é a regra do
 * componente ser `(0,2,0)` ou vir depois do `utilities.css`, e a escotilha que
 * a documentação publica ser inerte.
 *
 * A precisão vem do CRUZAMENTO, não da varredura: só flagra propriedade que o
 * `tokens.customizationCode` promete por classe E que o CSS fixa em seletor
 * forte sem `var(--…)`. Sozinha, a varredura do CSS rende 23 achados e quase
 * todos são mecânica interna — `input` de 1px do sr-only, filete de separador,
 * tamanho de ícone —, que ninguém quer customizar.
 */
/**
 * Gap apertado entre botões.
 *
 * A guideline do Button fixa o mínimo em `--spacing-4` (16px), que no cluster é
 * `data-spacing="md"`. Abaixo disso o par de ações lê como controle segmentado,
 * e a faixa de erro entre dois alvos adjacentes encolhe.
 *
 * Vale para QUALQUER slug: par Cancelar/Confirmar aparece em rodapé de dialog,
 * de alert-dialog e de sheet, não só nos arquivos do próprio botão.
 *
 * Reprova em dois casos, e o segundo é o que se erra sem perceber:
 *   1. `data-spacing` declarado como `xs` ou `sm`
 *   2. `data-spacing` AUSENTE — o padrão do `.nds-cluster` é 8px, abaixo do piso
 *
 * EXCEÇÃO: quando TODOS os botões do cluster são `size="sm"` ou da família de
 * ÍCONE (`icon`, `icon-sm`, `icon-lg`, `icon-xs`), o piso cai para
 * `--spacing-2` (8px). Nesse caso passa `sm` e passa também o `data-spacing`
 * ausente, que é justamente 8px; só `xs` continua reprovando.
 *
 * São dois motivos diferentes para o mesmo piso. O botão `sm` vive em
 * superfície compacta — rodapé de popover, de tooltip, de hover-card — onde
 * 16px entre dois alvos pequenos é mais do que a superfície comporta. O botão
 * de ícone é outra coisa: ele é quadrado e sem texto, e uma fileira deles é
 * uma BARRA DE FERRAMENTAS, não um par de ações. Ali a proximidade é o que
 * comunica que os comandos pertencem ao mesmo conjunto, e vale mesmo no
 * tamanho padrão de ícone.
 *
 * "Todos" é medido contando marcas de tamanho contra a contagem de botões:
 * cluster que mistura tamanhos cai na regra estrita, porque o alvo maior é
 * quem define a distância confortável.
 *
 * O escopo do cluster é achado por CASAMENTO DE TAG, não por janela de N
 * caracteres. A janela fixa parecia bastar e não bastava: onde a docs page
 * monta os botões por `.map()` sobre um array de dados, o `<Button>` cai
 * centenas de caracteres abaixo da abertura, e o portão passava calado — o
 * defeito que ele existe para pegar.
 *
 * O que ele NÃO alcança, declarado para não virar cobertura fantasma:
 *   - controle do Angular cujo gatilho é um <button> com diretiva PRÓPRIA
 *     (`ndsSelectTrigger`, e afins): a regex de botão exige `ndsButton`, então
 *     fileira de gatilho de combobox é invisível. É deliberado por ora — a
 *     regra é do componente Button, e gatilho de combobox tem convenção
 *     própria —, mas é um lugar onde o portão mede menos do que parece;
 *   - cluster com MENOS de dois botões, que não tem vizinho e portanto não
 *     tem gap a medir;
 *   - `.nds-button-group`, que emenda os botões sem gap de propósito e é o
 *     caso oposto, legítimo;
 *   - cluster cujo gap venha de classe utilitária em vez de `data-spacing`.
 */
function auditButtonGap(slug) {
  const violations = [];
  // Como um botão se parece em cada stack. O Angular usa atributo em <button>.
  const BOTAO = /<Button[\s>/]|<button[^>]*\bndsButton\b|createButton\s*\(/;
  const BOTAO_G = new RegExp(BOTAO.source, 'g');
  // Tamanhos que dispensam o piso de 16px: `sm` e a família de ícone
  // (`icon`, `icon-sm`, `icon-lg`, `icon-xs`). Nas quatro stacks de markup o
  // atributo é `size="…"`; na fábrica do Vanilla é `size: '…'`.
  const TAMANHO_COMPACTO =
    /size=(?:"|')(?:sm|icon(?:-[a-z]+)?)(?:"|')|size:\s*(?:"|')(?:sm|icon(?:-[a-z]+)?)(?:"|')/g;

  /** Conteúdo entre a abertura em `from` e a tag de fechamento que a casa. */
  const escopoDaTag = (content, from, tag, inicioDoConteudo) => {
    const marcas = new RegExp('<(/?)' + tag + '\\b', 'g');
    marcas.lastIndex = from;
    let profundidade = 0;
    let m;
    while ((m = marcas.exec(content)) !== null) {
      profundidade += m[1] === '/' ? -1 : 1;
      if (profundidade === 0) return content.slice(inicioDoConteudo, m.index);
    }
    return '';   // sem fechamento casado, não há filhos a examinar
  };

  /** Piso do cluster: `sm` quando todos os botões são compactos, senão `md`. */
  const pisoDo = (escopo) => {
    const botoes = (escopo.match(BOTAO_G) || []).length;
    const compactos = (escopo.match(TAMANHO_COMPACTO) || []).length;
    return compactos >= botoes ? 'sm' : 'md';
  };

  /** Um botão sozinho não tem vizinho: não existe gap a medir. */
  const agrupaBotoes = (escopo) => (escopo.match(BOTAO_G) || []).length >= 2;

  /** Verdadeiro quando o gap declarado já alcança o piso do cluster. */
  const aceitavel = (piso, valor) =>
    // Sob o piso `sm` o ausente serve, porque o padrão do cluster é 8px.
    piso === 'sm' && valor !== 'xs';

  const acusar = (stack, file, content, index, valor, piso) => {
    violations.push({
      category: 'quality', severity: 'low', slug, stack,
      file: relative(ROOT, file), line: content.slice(0, index).split('\n').length,
      rule: 'button_gap_apertado',
      message: `cluster de botões com data-spacing ${valor} — use "${piso}" (${piso === 'sm' ? '--spacing-2, 8px: barra de ícones ou botões pequenos' : '--spacing-4, 16px'}); ver a regra em guidelines/06-form-components.md`,
    });
  };

  for (const stack of STACKS) {
    const { all } = filesForSlug(slug, stack);
    for (const file of all) {
      const content = readFile(file);
      if (!content) continue;

      const abertura = /<([a-zA-Z][\w-]*)[^>]*\bclass(?:Name)?=(?:"|')nds-cluster(?:\s[^"']*)?(?:"|')([^>]*)>/g;
      let m;
      while ((m = abertura.exec(content)) !== null) {
        // Auto-fechada não agrupa nada: `<DocsDoDont className="nds-cluster" />`
        // não tem filhos, e sem esta guarda o escopo caía para o resto do
        // arquivo — que contém botões, e o componente se acusava sozinho.
        if (/\/\s*>$/.test(m[0])) continue;
        const declarado = /data-spacing=(?:"|')([a-z0-9]+)(?:"|')/.exec(m[2] || '');
        const valor = declarado ? declarado[1] : '(ausente)';
        if (declarado && !['xs', 'sm'].includes(valor)) continue;
        // O conteúdo começa depois do `>` da abertura: sem isso, um trigger
        // que É um botão e usa `nds-cluster` para arrumar rótulo e ícone por
        // dentro se acusaria a si mesmo.
        const escopo = escopoDaTag(content, m.index, m[1], m.index + m[0].length);
        if (!agrupaBotoes(escopo)) continue;
        const piso = pisoDo(escopo);
        if (aceitavel(piso, valor)) continue;
        acusar(stack, file, content, m.index, valor, piso);
      }

      // Vanilla monta o cluster por DOM: não há tag para casar, e a janela de
      // texto ao redor é palpite ruim — os botões podem ser criados ANTES da
      // linha do `dataset.spacing`, e uma janela para a frente alcança a demo
      // seguinte e conta botão de outro cluster. Em vez de adivinhar por
      // proximidade, resolvemos os IDENTIFICADORES que entram no `append` e
      // olhamos como cada um foi declarado.
      if (stack === 'vanilla') {
        const porDom = /(\w+)\.dataset\.spacing = '([a-z0-9]+)'/g;
        let d;
        while ((d = porDom.exec(content)) !== null) {
          const [, variavel, valor] = d;
          if (!['xs', 'sm'].includes(valor)) continue;

          // A mesma variável precisa ser declarada como CLUSTER. Sem isto o
          // portão acusava `nds-stack` de ritmo vertical — rótulo e campo —
          // como se fosse cluster de botões.
          const ehCluster = new RegExp(
            variavel + "\\.className\\s*=\\s*['\"`][^'\"`]*nds-cluster",
          );
          if (!ehCluster.test(content)) continue;

          // Os filhos do cluster, pelo nome.
          const anexo = new RegExp(variavel + '\\.(?:append|appendChild)\\s*\\(([^)]*)\\)').exec(content);
          if (!anexo) continue;
          const filhos = anexo[1]
            .split(',')
            .map((x) => x.trim())
            .filter((x) => /^\w+$/.test(x));

          // Como cada filho foi declarado decide se é botão e de que tamanho.
          let botoes = 0;
          let compactos = 0;
          for (const filho of filhos) {
            const decl = new RegExp(
              '(?:const|let|var)\\s+' + filho + '\\s*=\\s*createButton\\s*\\(([^;]*)\\)',
            ).exec(content);
            if (!decl) continue;
            botoes += 1;
            if (/size:\s*['\"`](?:sm|icon(?:-[a-z]+)?)['\"`]/.test(decl[1])) compactos += 1;
          }
          if (botoes < 2) continue;

          const piso = compactos >= botoes ? 'sm' : 'md';
          if (piso === 'sm' && valor !== 'xs') continue;
          acusar(stack, file, content, d.index, valor, piso);
        }
      }
    }
  }
  return violations;
}

function auditPromessaDeCustomizacao(slug) {
  const violations = [];
  const cssFile = join(ROOT, 'docs', 'shared', 'styles', 'nds', `${slug}.css`);
  const contentFile = join(ROOT, 'docs', 'shared', 'content', slug, 'translations.json');
  if (!existsSync(cssFile) || !existsSync(contentFile)) return violations;

  let cc = null;
  try {
    const j = JSON.parse(readFile(contentFile) || '{}');
    cc = j['pt-BR']?.tokens?.customizationCode ?? null;
  } catch { return violations; }
  if (!cc) return violations;

  const snippet = typeof cc === 'string' ? cc : Object.values(cc).join('\n');
  // A promessa é por PROPRIEDADE **e** ELEMENTO. Casar só o nome da propriedade
  // rende falso positivo em todos os casos medidos: a doc do input-otp promete
  // a largura do slot e o CSS fixa a do ícone do separador; a do radio-group
  // promete a do controle e o CSS fixa a do input sr-only de 1px. Mesmo nome,
  // elementos diferentes.
  const prometidas = new Map();   // classe .nds-* -> Set(propriedades)
  let alvo = null;
  for (const linha of snippet.split('\n')) {
    const seletor = linha.match(/\.(nds-[a-z0-9-]+)[^{]*\{/);
    if (seletor) { alvo = seletor[1]; continue; }
    if (linha.includes('}')) { alvo = null; continue; }
    if (!alvo || /--[a-z]/.test(linha)) continue;
    for (const m of linha.matchAll(PROP_CUSTOMIZAVEL)) {
      if (!prometidas.has(alvo)) prometidas.set(alvo, new Set());
      prometidas.get(alvo).add(m[1]);
    }
  }
  if (!prometidas.size) return violations;

  const css = stripComments(readFile(cssFile) || '');
  for (const bloco of css.matchAll(/(^|\})\s*([^{}]+)\{([^}]*)\}/g)) {
    const sel = bloco[2].trim().split(',')[0].trim();
    if (!sel.startsWith('.nds-') || !selecaoForte(sel)) continue;

    for (const d of bloco[3].matchAll(/^\s*([a-z-]+)\s*:\s*([^;]+);/gm)) {
      const [, prop, valor] = d;
      // A classe prometida tem que aparecer NO seletor que bloqueia.
      const casa = [...prometidas].some(([classe, props]) =>
        props.has(prop) && new RegExp(`\\.${classe}\\b`).test(sel));
      if (!casa) continue;
      if (/var\(--/.test(valor)) continue;
      violations.push({
        category: 'quality', severity: 'medium', slug, stack: 'shared',
        file: relative(ROOT, cssFile), rule: 'customization_blocked_by_specificity',
        message: `a doc promete customizar \`${prop}\` por classe, mas \`${sel}\` a fixa em seletor que nenhuma classe única vence — exponha uma custom property (como --sheet-width e --hover-card-width) ou tire a promessa do snippet`,
      });
    }
  }
  return violations;
}

/**
 * `transform: translate(...)` e a propriedade `translate` no mesmo arquivo.
 *
 * São propriedades DIFERENTES e elas se COMPÕEM em vez de uma vencer: a paleta
 * de comando dentro de um diálogo levava −100% na horizontal e saía quase fora
 * da tela. O projeto padronizou a propriedade `translate` para centralizar.
 *
 * Limite conhecido, e escrito porque a regra parece maior do que é: o caso real
 * era entre DOIS arquivos (`dialog.css` centralizava, `command.css` deslocava o
 * mesmo elemento). Saber quais seletores casam o mesmo elemento exige análise de
 * CSS que esta regra não faz. Aqui só o mesmo arquivo é coberto — é a parte
 * barata e determinística, não a garantia inteira.
 */
/**
 * Classe morta na coluna de CLASSE da tabela de tokens.
 *
 * A tabela diz ao consumidor qual classe carrega cada token — é instrução
 * direta, não prosa. Medido no repo inteiro: 23 dos 51 componentes
 * documentavam 131 entradas que não pintam nada, quase todas vocabulário do
 * framework utilitário que saiu (`bg-popover`, `border-border`, `rounded-lg`,
 * `ring-ring`, `size-8`). Quem seguir a tabela não obtém estilo nenhum.
 *
 * Nenhuma regra existente via isto, e a razão é instrutiva: o
 * `unknown_class_reference` só julga classe com prefixo `nds-`, e o
 * `legacy_class_in_story` só varre stories. A tabela de tokens ficava no vão
 * entre as duas — conteúdo compartilhado, classe sem prefixo.
 *
 * Só a coluna de classe é lida. As outras (token, valor, descrição) citam
 * `--custom-property` e prosa, onde nome parecido com classe é coincidência.
 */
function auditDeadClassInTokenTable(slug) {
  const violations = [];
  const file = join(ROOT, 'docs', 'shared', 'content', slug, 'translations.json');
  if (!existsSync(file)) return violations;

  let tabela;
  try {
    tabela = JSON.parse(readFile(file) || '{}')['pt-BR']?.tokens?.table;
  } catch { return violations; }
  if (!tabela || typeof tabela !== 'object') return violations;

  const definidas = definedClasses();
  const vistas = new Set();

  for (const [linhaKey, linha] of Object.entries(tabela)) {
    if (!linha || typeof linha !== 'object') continue;
    for (const campo of ['class', 'className', 'selector', 'classe']) {
      const valor = linha[campo];
      if (typeof valor !== 'string') continue;
      for (const bruto of valor.split(/[\s,]+/)) {
        // O sufixo de pseudo-classe/pseudo-elemento é do SELETOR, não do nome da
        // classe: `nds-scroll-area-viewport:focus-visible` documenta um estado de
        // uma classe que existe. Sem cortar aqui, a regra acusava a única entrada
        // honesta da tabela do scroll-area.
        const cls = bruto
          .trim()
          .replace(/^\./, '')
          // Atributo e pseudo-classe/pseudo-elemento são do SELETOR, não do nome
          // da classe. `nds-tabs-trigger[data-state="active"]` e
          // `nds-scroll-area-viewport:focus-visible` documentam ESTADOS de
          // classes que existem — sem cortar, a regra acusava as duas entradas
          // mais precisas de toda a tabela.
          .replace(/\[[^\]]*\]/g, '')
          .replace(/::?[a-z-]+(\([^)]*\))?$/i, '');
        // `—` e `-` são o "não se aplica" da tabela; custom property não é classe.
        if (!cls || /^[-—]+$/.test(cls) || cls.startsWith('--')) continue;

        let motivo = null;
        if (cls.startsWith('nds-')) {
          if (!definidas.has(cls)) motivo = 'não é definida por nenhum CSS do projeto';
        } else if (/^[a-z][a-z0-9:[\]/.-]*$/i.test(cls)) {
          motivo = 'não tem prefixo `nds-` — é vocabulário do framework utilitário que saiu do projeto';
        }
        if (!motivo || vistas.has(cls)) continue;
        vistas.add(cls);

        violations.push({
          category: 'quality', severity: 'medium', slug, stack: 'shared',
          file: relative(ROOT, file), rule: 'dead_class_in_token_table',
          message: `tokens.table.${linhaKey} documenta a classe "${cls}", que ${motivo} — quem seguir a tabela não obtém estilo nenhum`,
        });
      }
    }
  }
  return violations;
}

/** Classes `.nds-*` realmente definidas em qualquer CSS compartilhado ou de stack. */
let _definedClasses = null;
function definedClasses() {
  if (_definedClasses) return _definedClasses;
  _definedClasses = new Set();
  const arquivos = [
    ...walkDir(join(ROOT, 'docs', 'shared'), ['.css']),
    ...STACKS.flatMap((s) => walkDir(join(ROOT, stackDir(s), 'src', 'styles'), ['.css'])),
  ];
  for (const f of arquivos) {
    for (const m of (readFile(f) || '').matchAll(/\.(nds-[a-z0-9-]+)/gi)) {
      _definedClasses.add(m[1]);
    }
  }
  return _definedClasses;
}

/**
 * Anel de foco apagado por especificidade.
 *
 * `:focus-visible` define o anel com `box-shadow`, e uma regra POSTERIOR de
 * especificidade igual ou maior redefine `box-shadow` no mesmo elemento sem
 * repetir o `:focus-visible` — o anel some, e some justamente no estado em que
 * o componente está sendo usado por teclado. É WCAG 2.4.7 (nível AA) quebrado
 * sem nada na tela denunciando, porque quem enxerga e usa mouse nunca vê.
 *
 * A regra nasceu de duas ocorrências reais nesta revisão: no `tabs` o anel
 * nunca aparecia em aba nenhuma (o roving tabindex põe o foco sempre na aba
 * ATIVA, e era a regra de ativa que apagava), e no `toggle-group` sumia na
 * variante outline. Nas duas o defeito era invisível para o audit e para a
 * suíte.
 *
 * Três exclusões, todas medidas contra falso positivo:
 *
 * - **Troca deliberada de anel.** `[aria-invalid="true"]` pinta o próprio anel
 *   em cor destrutiva; o foco continua visível. Declaração que cita `--ring` ou
 *   `--destructive` é substituição, não apagamento — 8 dos 12 primeiros
 *   achados eram disto.
 * - **Restauração posterior.** Uma regra `:focus-visible` mais forte depois do
 *   sobrescritor devolve o anel. É o conserto aplicado no `tabs`, e sem esta
 *   exclusão a regra acusaria o que ela mesma mandou corrigir.
 * - **Pseudo-elemento.** `::picker(select)` e afins são outra caixa de
 *   renderização, não o mesmo elemento — comparar só a última classe os
 *   confundia com o alvo.
 */
function auditFocusRingSobrescrito() {
  const violations = [];
  const dir = join(ROOT, 'docs', 'shared', 'styles', 'nds');
  if (!existsSync(dir)) return violations;

  const especificidade = (sel) => {
    const ids = (sel.match(/#[\w-]+/g) || []).length;
    const cls = (sel.match(/\.[\w-]+|\[[^\]]+\]|:[a-z-]+(\([^)]*\))?/g) || []).length;
    return ids * 100 + cls * 10;
  };
  const alvo = (sel) => {
    const m = sel.match(/\.[\w-]+/g);
    return m ? m[m.length - 1] : null;
  };
  const sombra = (corpo) => {
    const m = corpo.match(/box-shadow\s*:[^;]*/);
    return m ? m[0] : null;
  };

  for (const file of walkDir(dir, ['.css'])) {
    const src = readFile(file);
    if (!src) continue;
    const rel = relative(ROOT, file);
    const regras = [...src.matchAll(/([^{}]+)\{([^}]*)\}/g)].map((m, i) => ({
      sel: m[1].trim().split('\n').pop().trim(),
      corpo: m[2],
      ordem: i,
    }));

    for (const anel of regras) {
      if (!/:focus-visible/.test(anel.sel) || !sombra(anel.corpo)) continue;
      const alvoAnel = alvo(anel.sel);
      if (!alvoAnel) continue;
      const espAnel = especificidade(anel.sel);

      for (const r of regras) {
        if (r.ordem <= anel.ordem) continue;
        if (/:focus-visible/.test(r.sel) || /::/.test(r.sel)) continue;
        const decl = sombra(r.corpo);
        if (!decl) continue;
        if (alvo(r.sel) !== alvoAnel) continue;
        if (especificidade(r.sel) < espAnel) continue;
        // Só é troca legítima quando a regra repinta o PRÓPRIO anel de foco
        // (`--ring`). `--destructive` estava aqui e era largo demais: o anel de
        // estado inválido é PERMANENTE, não some quando o elemento perde o
        // foco, então focar um campo inválido não muda nada na tela. Com vários
        // inválidos na página, não dá para saber qual está em foco — que é o
        // que a 2.4.7 exige. Medido no toggle, onde a asserção que deveria
        // guardar o anel passava justamente por causa dessa sombra permanente.
        if (/--ring/.test(decl)) continue;
        const restaurado = regras.some(
          (z) =>
            z.ordem > r.ordem &&
            /:focus-visible/.test(z.sel) &&
            alvo(z.sel) === alvoAnel &&
            sombra(z.corpo) &&
            especificidade(z.sel) >= especificidade(r.sel),
        );
        if (restaurado) continue;

        violations.push({
          category: 'quality', severity: 'high', slug: '_infra', stack: 'shared',
          file: rel, rule: 'focus_ring_sobrescrito',
          message: `"${r.sel}" redefine box-shadow depois de "${anel.sel}" e com especificidade igual ou maior — o anel de foco não aparece nesse estado (WCAG 2.4.7)`,
        });
      }
    }
  }
  return violations;
}

/**
 * Anel de foco cujo ÚNICO sinal visual é uma banda TRANSLÚCIDA.
 *
 * MEDIDO no botão, e escrito no comentário de `button.css`: com
 * `hsl(var(--ring) / 0.5)` a banda compõe 1.87:1 a 2.42:1 contra a superfície
 * do app, nos três temas e nos dois modos. WCAG 1.4.11 (Non-text Contrast, AA)
 * pede 3:1 para indicador de estado, e a meia opacidade sozinha responde por
 * toda a perda: `--ring` cheio dá 3.7:1 a 5.6:1 nas mesmas seis combinações.
 *
 * POR QUE NENHUM PORTÃO PEGAVA, e é o motivo de esta regra existir:
 *
 *   - o `axe` não avalia contraste de indicador de FOCO — 1.4.11 para anel não
 *     é automatizado por ele;
 *   - as sondas de contraste por componente medem TEXTO
 *     (`contrastDeTextFailures`), não o anel;
 *   - as asserções das stories mediam PRESENÇA (`matches(':focus-visible')`,
 *     `boxShadow !== 'none'`), e a forma antiga satisfaz as duas.
 *
 * O defeito é de RAZÃO, não de presença: o anel existe e é bem visível para
 * quem enxerga bem. Foi corrigido uma vez, no botão e em mais quinze regras, e
 * nunca propagado — as outras 27 ficaram porque não havia quem notasse.
 *
 * O que conta como indicador OPACO, e por isso não é achado:
 *
 *   - uma camada de `box-shadow` com cor sem alfa (a forma nova: vão em
 *     `--background` mais banda cheia);
 *   - `border-color` sem alfa DENTRO do bloco de foco — é a forma antiga
 *     correta do `input` e do `checkbox`, onde a borda muda no foco e o halo
 *     translúcido só a acompanha;
 *   - `outline` com cor sem alfa.
 *
 * Borda declarada na regra BASE não conta: ela está lá em todos os estados, e
 * indicador de foco é o que MUDA quando o foco chega.
 */
function auditFocusRingTranslucido() {
  const violations = [];
  const dir = join(ROOT, 'docs', 'shared', 'styles', 'nds');
  if (!existsSync(dir)) return violations;

  /**
   * A lista está VAZIA, e é por isso que ela continua aqui.
   *
   * Eram nove regras de estado inválido, e o motivo declarado para adiá-las
   * era honesto: ali convivem dois anéis — o destrutivo, que é PERMANENTE, e o
   * de foco, que é transitório — e trocar sem medir seria trocar uma forma que
   * ninguém mediu por outra que ninguém mediu.
   *
   * Medido em 2026-08-29, nos três temas e nos dois modos: num controle
   * inválido a borda já é `--destructive` em repouso, e a regra
   * `[aria-invalid="true"]` vence a de foco por vir depois com a mesma
   * especificidade — então o foco acrescentava só o halo translúcido, 1,70:1 a
   * 1,81:1. Onde o remédio anterior tinha posto `--ring / 0.5` por fora,
   * 1,97:1 a 3,18:1: melhor, e ainda reprovando em cinco dos seis pares. As
   * onze regras passaram a declarar `outline` opaco, 4,63:1 a 9,22:1.
   *
   * O conjunto vazio fica no lugar do array porque a dívida pode voltar, e
   * quando voltar tem de voltar DECLARADA — com o motivo escrito, como esta
   * esteve.
   */
  const PENDENTES = new Set([]);

  /** Cor de token SEM alfa — `hsl(var(--x))`, e não `hsl(var(--x) / 0.5)`. */
  const OPACA = /hsl\(\s*var\(--[\w-]+\)\s*\)/;

  for (const file of walkDir(dir, ['.css'])) {
    const src = readFile(file);
    if (!src) continue;
    const rel = relative(ROOT, file);
    const nome = basename(file);

    // As três pseudoclasses, e não só `:focus-visible`.
    //
    // O lote de estado inválido não cabia na primeira: `input-otp` acende no
    // `:focus` do slot (a lib não entrega `:focus-visible` ali) e `combobox`
    // acende no `:focus-within` do invólucro. As duas ESTAVAM na lista de
    // dívida e nunca foram lidas — entrada morta numa lista de dívida é pior
    // que dívida, porque parece coberta. Com o alcance certo, `input-otp`
    // deixou de ser entrada fantasma e virou regra medida.
    //
    // Para `:focus` e `:focus-within` a regra só cobra em seletor de estado
    // INVÁLIDO. Cobrar em todos despejaria de uma vez uma cauda que ninguém
    // mediu, e portão que despeja backlog ensina a ignorar o portão — junto
    // some o achado que importava. Essa cauda é lote próprio.
    for (const m of src.matchAll(/([^{}]*)(:focus-visible|:focus-within|:focus)([^{}]*)\{([^}]*)\}/g)) {
      if (m[2] !== ':focus-visible' && !`${m[1]}${m[3]}`.includes('[aria-invalid')) continue;
      // O seletor é a última linha do trecho antes da chave: o que vem acima é
      // comentário ou a regra anterior.
      const sel = `${m[1]}${m[2]}${m[3]}`
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .trim()
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .join(' ');
      const corpo = m[4];

      const sombra = (corpo.match(/box-shadow\s*:\s*([^;]+)/) || [])[1];
      if (!sombra) continue;
      // `box-shadow: none` não é banda fraca, é REMOÇÃO deliberada. O caso real
      // é `.nds-input-group-control`, que zera o próprio anel porque quem o
      // desenha é o grupo em volta. Anel apagado por engano é assunto da regra
      // irmã (`focus_ring_sobrescrito`), que mede sobrescrita; esta mede forma.
      if (sombra.trim() === 'none') continue;

      const bordaOpaca = /border(-color)?\s*:[^;]*/.test(corpo)
        && OPACA.test((corpo.match(/border(-color)?\s*:([^;]+)/) || [])[2] || '');
      const contornoOpaco = /outline\s*:[^;]*/.test(corpo)
        && OPACA.test((corpo.match(/outline\s*:([^;]+)/) || [])[1] || '');
      if (OPACA.test(sombra) || bordaOpaca || contornoOpaco) continue;

      const chave = `${nome} :: ${sel}`;
      if (PENDENTES.has(chave)) continue;

      violations.push({
        category: 'quality', severity: 'high', slug: '_infra', stack: 'shared',
        file: rel,
        line: src.slice(0, m.index).split('\n').length,
        rule: 'focus_ring_translucido',
        message: `"${sel}" só tem banda translúcida como indicador de foco — 1.87:1 a 2.42:1 medido, contra os 3:1 que a WCAG 1.4.11 pede. A forma correta é vão em --background mais banda opaca, como em .nds-button`,
      });
    }
  }
  return violations;
}

/**
 * `@keyframes` de mesmo nome definido em mais de um arquivo.
 *
 * Nome de keyframes é global e NÃO colide com aviso: o último a ser importado
 * vence, calado. Não há especificidade envolvida, então nem ler o seletor
 * ajuda — só saber a ordem dos `@import`.
 *
 * O caso real: `progress.css` definia `nds-progress-indeterminate`, e
 * `tw-compat.css` — que é o ÚLTIMO import do `index.css` — definia outro com o
 * mesmo nome e outro conteúdo. A barra indeterminada pedia a animação certa e
 * recebia a de lá, com outro deslocamento e sem respeitar
 * `prefers-reduced-motion`. Ninguém viu por meses.
 *
 * Duas severidades, porque os dois casos têm consequências diferentes:
 *
 * - **conteúdo divergente** → `high`. É sobrescrita silenciosa: alguém está
 *   recebendo uma animação que não pediu.
 * - **conteúdo idêntico** → `low`. Hoje não quebra nada, e é justamente por
 *   isso que é armadilha: quem editar um dos dois cria a divergência acima sem
 *   perceber que existe um gêmeo.
 *
 * Comentários são removidos antes da busca. Sem isso, a regra acusaria os
 * próprios docblocks que explicam o defeito: eles citam o nome do keyframes
 * em prosa, de propósito, para ele não voltar.
 */
function auditKeyframesDuplicado() {
  const violations = [];
  const dir = join(ROOT, 'docs', 'shared', 'styles');
  if (!existsSync(dir)) return violations;

  const porNome = new Map();
  for (const file of walkDir(dir, ['.css'])) {
    const src = readFile(file);
    if (!src) continue;
    const semComentario = src.replace(/\/\*[\s\S]*?\*\//g, '');
    for (const m of semComentario.matchAll(/@keyframes\s+([\w-]+)\s*\{([\s\S]*?)\n\}/g)) {
      const nome = m[1];
      if (!porNome.has(nome)) porNome.set(nome, []);
      porNome.get(nome).push({ file: relative(ROOT, file), corpo: m[2].replace(/\s+/g, ' ').trim() });
    }
  }

  for (const [nome, defs] of porNome) {
    if (defs.length < 2) continue;
    const divergem = new Set(defs.map((d) => d.corpo)).size > 1;
    violations.push({
      category: 'quality',
      severity: divergem ? 'high' : 'low',
      slug: '_infra', stack: 'shared',
      file: defs[0].file, rule: 'keyframes_duplicado',
      message: divergem
        ? `@keyframes "${nome}" é definido com conteúdos DIFERENTES em ${defs.map((d) => d.file).join(' e ')} — o último import vence sem aviso, e quem pede a animação recebe a do outro arquivo`
        : `@keyframes "${nome}" é definido em ${defs.map((d) => d.file).join(' e ')} com o mesmo conteúdo — editar um dos dois cria sobrescrita silenciosa`,
    });
  }
  return violations;
}

function auditTranslateComposto() {
  const violations = [];
  const dir = join(ROOT, 'docs', 'shared', 'styles', 'nds');
  if (!existsSync(dir)) return violations;
  for (const nome of readdirSync(dir)) {
    if (!nome.endsWith('.css')) continue;
    const css = stripComments(readFile(join(dir, nome)) || '');
    const propriedade = /^\s*translate\s*:/m.test(css);
    const funcao = /transform\s*:[^;]*\btranslate/.test(css);
    if (propriedade && funcao) {
      violations.push({
        category: 'quality', severity: 'high', slug: '_infra', stack: 'shared',
        file: relative(ROOT, join(dir, nome)), rule: 'translate_composto',
        message: 'usa a propriedade `translate` E `transform: translate(...)` no mesmo arquivo — elas se compõem em vez de uma vencer, e foi assim que a paleta de comando saiu da tela; padronize na propriedade `translate`',
      });
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

/**
 * Páginas de GALERIA: catálogo visual, não documentação de componente.
 *
 * Não têm as 15 seções porque não deveriam ter — não há anatomia, variante nem
 * tabela de props num mostruário. Sem esta dispensa a regra rendia 108 achados
 * (60 em icons, 48 em theme-colors) nas cinco stacks, 7% de todo o relatório.
 *
 * O custo não era o volume: ruído constante ensina a ignorar a regra, e aí ela
 * para de proteger no dia em que um componente de verdade perder uma seção.
 *
 * Declarado com motivo, no mesmo espírito do `SEM_TRADUCAO` da sidebar — quem
 * acrescentar uma galeria escolhe entre documentar como componente ou justificar
 * aqui.
 */
const GALERIAS = {
  icons: 'catálogo dos 2021 ícones lucide — busca e grade, sem API própria',
  'theme-colors': 'mostruário das paletas por tema; a doc do sistema de temas é a foundation page',
};

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
    // `states` aceita as mesmas DUAS formas que `variants`: os itens sob
    // `items`, ou como chaves irmãs. Ler só as chaves irmãs dava falso em todo
    // nó `{ title, items }` — as duas estão em SECTION_HEADERS, então `hasKeys`
    // via nó vazio onde havia conteúdo, e cobrava a página que o renderizava
    // como placeholder. O `sonner` é o único componente na forma com `items`, e
    // era o único a carregar o achado nas quatro stacks que o renderizam.
    { id: 'estados', label: 'states', has: (pt) => hasKeys(pt.states?.items) || hasKeys(pt.states) },
  ];

  for (const stack of STACKS) {
    const { ui, docs } = filesForSlug(slug, stack);

    // A PÁGINA INTEIRA faltando era invisível.
    //
    // `missing_section` itera as páginas ENCONTRADAS: zero páginas dá zero
    // achados, e a stack que publica stories e esquece a docs page passa limpa
    // — o pior modo de falhar, porque o silêncio se lê como aprovação. Achado
    // ao construir a família 1 da guideline 17, quando uma stack ficou com
    // stories sem página e `audit.mjs` reportou vazio.
    //
    // A guarda é `ui.length`: sem nenhum arquivo do slug na stack, a peça não
    // existe ali e cobrar a página seria cobrar a ausência inteira, que é
    // outro assunto. Com arquivos e sem página, quem lê aquela stack não tem
    // documentação nenhuma do que está publicado na barra lateral.
    if (ui.length && !docs.length) {
      const Slug =
        slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      violations.push({
        category: 'quality', severity: 'high', slug, stack,
        file: `nortear-design-system-${stack}/src/components/docs/${Slug}Docs.*`,
        rule: 'docs_page_ausente',
        message:
          `A stack publica ${ui.length} arquivo(s) de "${slug}" e não tem docs page. ` +
          `O componente aparece na barra lateral sem nada que o explique, e ` +
          `missing_section não alcança isso — ela só olha página que existe.`,
      });
    }

    for (const file of docs) {
      const content = readFile(file);
      if (!content) continue;

      // 1. Seções obrigatórias
      const hasSection = (id) =>
        new RegExp(`\\b(id=|id:\\s*)['"\\\`]${id}['"\\\`]`).test(content);

      for (const id of REQUIRED_SECTIONS) {
        if (GALERIAS[slug]) break;
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
      // `configuracoes` entrou tarde na lista: o arquivo existe em quatro
      // stacks do data-table com uma story cada e ZERO play, e a regra passava
      // por ele porque o nome não estava aqui. O sufixo é convenção do projeto;
      // faltar um deles é ponto cego, não permissão.
      if (basename(file).match(/-(modos|variantes|composicoes|configuracoes|layouts|estados|tamanhos)\.stories\./)) {
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

    // 5b. A MESMA pergunta, na coluna `token` que as docs pages montam em
    // código. O check acima só lê o `translations.json`, e a tabela de tokens é
    // um array local em cada `*Docs.*` — foi por isso que `--foreground/10`,
    // `--shadow`, `--shadow-md` e `--radius-lg` sobreviveram ali no
    // dropdown-menu enquanto o conteúdo compartilhado estava limpo.
    //
    // O julgamento é POR STACK: o que vale é o que a pessoa lendo aquela página
    // consegue redefinir, não se alguma outra stack por acaso define o token.
    for (const stack of STACKS) {
      const conhecidos = definedTokensForStack(stack);
      const vistos = new Set();
      for (const file of filesForSlug(slug, stack).docs) {
        const conteudo = readFile(file);
        if (!conteudo) continue;
        // Token DEFINIDO dentro da própria página conta como existente. É o que
        // separa os dois casos: no sonner, `--normal-bg` é gancho real da lib de
        // terceiro e a página mostra `--normal-bg: var(--popover)` no exemplo de
        // customização — sobrescrever funciona. No dropdown-menu, `--shadow` só
        // aparecia na coluna `token:`, sem definição em canto nenhum, e a
        // customização era inerte. Sem esta distinção a regra acusaria os dois.
        const definidosAqui = new Set(
          [...conteudo.matchAll(/(--[a-z0-9-]+)\s*:/gi)].map((m) => m[1].toLowerCase()),
        );
        // `token:` seguido de string — a forma que as cinco usam para montar a
        // linha. Sufixo de alfa (`/10`) é separado antes: `--foreground/10` é
        // uma composição, e o que precisa existir é `--foreground`.
        for (const m of conteudo.matchAll(/token:\s*["'`](--[a-z0-9-]+)(\/[0-9.]+)?["'`]/gi)) {
          const token = m[1].toLowerCase();
          if (conhecidos.has(token) || definidosAqui.has(token) || vistos.has(token)) continue;
          vistos.add(token);
          violations.push({
            category: 'quality', severity: 'medium', slug, stack,
            file: relative(ROOT, file),
            rule: 'unknown_token_reference',
            message: `token "${token}" na tabela de tokens desta página não existe no CSS visível desta stack — quem copiar a customização não muda nada`,
          });
        }
      }
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
    ...auditLarguraFluidaSobCentered(slug),
    ...auditHostInlineComLargura(slug),
    ...auditSnippetSemLastro(slug),
    ...auditTaxonomy(slug),
    ...auditI18nKeys(slug),
    ...auditComponentVars(slug),
    ...auditInlineStyle(slug),
    ...auditFixtureDuplicada(slug),
    ...auditGuardrails(slug),
    ...auditSidebarVocab(slug),
    ...auditIdentificadorPt(slug),
    ...auditIdentificadorPtNovo(slug),
    ...auditButtonGap(slug),
    ...auditPromessaDeCustomizacao(slug),
    ...auditDeadClassInTokenTable(slug),
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
if (args.includes('--gerar-baseline-pt')) {
  gerarBaselinePt();
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

/**
 * Inventário da dívida de `style` inline, arquivo a arquivo.
 *
 * A regra reprova o arquivo inteiro numa violação só, com amostra de três
 * declarações — o que basta para o gate e não basta para decidir o que fazer
 * com cada arquivo. A dívida vai ser paga em rodadas (só 18% dela tem
 * utilitária hoje), e a cada rodada alguém precisa da quebra por propriedade.
 *
 * Sai daqui, e não de um script à parte, porque reusa `inlineStyleDecls` tal
 * como ela é: uma segunda implementação divergiria da guarda de snippet, que é
 * justamente o que separa 29% de falso positivo do achado real.
 */
if (args.includes('--inline-inventory')) {
  const linhas = [];
  for (const s of slugs) {
    for (const stack of STACKS) {
      const { ui, docs } = filesForSlug(s, stack);
      for (const file of [...ui, ...docs]) {
        const decls = inlineStyleDecls(readFile(file) ?? '');
        if (!decls.length) continue;
        const props = {};
        for (const d of decls) {
          const p = d.decl.split(':')[0];
          (props[p] ??= []).push(d.decl.split(':').slice(1).join(':').trim());
        }
        linhas.push({
          slug: s, stack, file: relative(ROOT, file).replace(/\\/g, '/'),
          tipo: /\.stories\./.test(file) ? 'story' : /components[\\/]docs[\\/]/.test(file) ? 'docs' : 'ui',
          total: decls.length, props,
        });
      }
    }
  }
  linhas.sort((a, b) => b.total - a.total || a.file.localeCompare(b.file));
  if (json) {
    console.log(JSON.stringify(linhas, null, 2));
  } else {
    console.log(`# style inline — ${linhas.length} arquivos, ${linhas.reduce((n, l) => n + l.total, 0)} declarações\n`);
    console.log('| arquivo | tipo | n | propriedades |');
    console.log('|---|---|---|---|');
    for (const l of linhas) {
      const p = Object.entries(l.props)
        .sort((a, b) => b[1].length - a[1].length)
        .map(([k, v]) => `${k}×${v.length}`).join(', ');
      console.log(`| ${l.file} | ${l.tipo} | ${l.total} | ${p} |`);
    }
  }
  process.exit(0);
}

/**
 * Slug que não existe em lugar nenhum não é slug LIMPO — é slug AUSENTE.
 *
 * `runAudit` audita o que encontra, e para um slug sem arquivo nenhum ele
 * encontra nada e devolve `[]`. Lido de fora, `{"document-reference": []}` é
 * indistinguível de "auditado, zero achados", e foi assim que uma porta tomou
 * por verde a ausência da peça que ela tinha ido construir. O portão auditava o
 * que existe; ausência ele não via.
 *
 * A guarda pede as DUAS pontas vazias: nenhum arquivo nas cinco stacks E nenhum
 * `translations.json` compartilhado. Componente em construção tem uma das duas
 * — conteúdo antes do código ou código antes do conteúdo —, e reprovar ali
 * seria ruído em cima de trabalho legítimo.
 *
 * Fora de `--all` de propósito: lá os slugs saem de quem TEM
 * `translations.json`, então a condição nunca dispara e a varredura pagaria
 * cinco `filesForSlug` por slug para nada.
 */
function auditSlugInexistente(slug) {
  if (STACKS.some((stack) => filesForSlug(slug, stack).all.length > 0)) return [];
  if (existsSync(join(ROOT, 'docs', 'shared', 'content', slug, 'translations.json'))) return [];
  return [{
    category: 'quality', severity: 'high', slug, stack: 'todas',
    file: `nortear-design-system-*/src/components/{ui,docs}/${slug}*`,
    rule: 'slug_inexistente',
    message:
      `Nenhum arquivo nas cinco stacks e nenhum docs/shared/content/${slug}/translations.json. ` +
      `Não há o que auditar: lista vazia AQUI significa ausente, não limpo. ` +
      `Se o slug deveria existir, ele não foi construído; se colapsou na triagem, ` +
      `não rode o auditor contra ele.`,
  }];
}

const allViolations = {};
for (const s of slugs) {
  allViolations[s] = all ? runAudit(s, category) : [...auditSlugInexistente(s), ...runAudit(s, category)];
}

// Infra é slug-independente: roda 1x por processo, sob "_infra".
if (!category || category === 'security') {
  const infra = auditSecurityInfra();
  if (infra.length > 0) allViolations['_infra'] = [...(allViolations['_infra'] ?? []), ...infra];
}
if (!category || category === 'analytics') {
  const infra = [...auditAnalyticsInfra(), ...auditAnalyticsPayloads()];
  if (infra.length > 0) allViolations['_infra'] = [...(allViolations['_infra'] ?? []), ...infra];
}
if (!category || category === 'quality') {
  const infra = [...auditDeadLibInfra(), ...auditCssTokenUsage(), ...auditOrphanTokens(), ...auditTypeRamp(), ...auditDocumentLang(), ...auditStorybookInfra(), ...auditStoryCategoryTag(), ...auditCardNestedRadius(), ...auditTemasCompletos(), ...auditGuidelineCode(), ...auditFoundationLabels(), ...auditTranslateComposto(), ...auditFocusRingSobrescrito(), ...auditFocusRingTranslucido(), ...auditKeyframesDuplicado(), ...auditRelatedDeadLink()];
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
