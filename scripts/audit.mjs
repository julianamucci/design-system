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
    pares(src.slice(m.index, i), m.index);
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
    const { docs } = filesForSlug(slug, stack);
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
    ...auditSnippetSemLastro(slug),
    ...auditTaxonomy(slug),
    ...auditI18nKeys(slug),
    ...auditComponentVars(slug),
    ...auditInlineStyle(slug),
    ...auditFixtureDuplicada(slug),
    ...auditGuardrails(slug),
    ...auditSidebarVocab(slug),
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

const allViolations = {};
for (const s of slugs) {
  allViolations[s] = runAudit(s, category);
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
  const infra = [...auditDeadLibInfra(), ...auditCssTokenUsage(), ...auditOrphanTokens(), ...auditTypeRamp(), ...auditDocumentLang(), ...auditStorybookInfra(), ...auditGuidelineCode(), ...auditFoundationLabels(), ...auditTranslateComposto(), ...auditFocusRingSobrescrito(), ...auditKeyframesDuplicado()];
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
