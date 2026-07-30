import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, createTranslation, type Locale, type TranslationOverrides } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { createCodeBlock, type CodeBlockOptions } from '@/components/ui/code-block';
import uiTranslations from '@/i18n/ui.json';
import codeBlockTranslations from '@shared/content/code-block/translations.json';

import {
  createDocsHeader,
  createDocsDemonstration,
  createDocsAnatomy,
  createDocsWhenToUse,
  createDocsDoDont,
  createDocsImport,
  createDocsVariants,
  createDocsCompositions,
  createDocsStates,
  createDocsProps,
  createDocsTokens,
  createDocsAccessibility,
  createDocsRelated,
  createDocsNotes,
  createDocsAnalytics,
  createDocsTestes,
  createDocsPageLayout,
} from '@/components/docs/shared/sections';

// ─── i18n ─────────────────────────────────────────────────────────────────────
//
// O translations.json é compartilhado pelas 4 stacks e descreve a API em JSX.
// Nesta stack o componente é uma factory, então três coisas mudam:
//   · `className` chama-se `class`;
//   · `footer` aceita `string | HTMLElement`, não um nó de framework;
//   · os blocos de estrutura e extensibilidade são chamadas de função.

const ANATOMY_STRUCTURE: Record<Locale, string> = {
  'pt-BR': [
    "const bloco = createCodeBlock({    // Raiz: borda, superfície e recorte",
    "  title: 'exemplo.tsx',            // Rótulo do header (opcional)",
    "  language: 'tsx',                 // Classificação de sintaxe",
    "  code: source,                    // Conteúdo exibido e copiado",
    "  showLineNumbers: true,           // Coluna de numeração",
    "  highlightLines: [3, '5-7'],      // Linhas em destaque",
    "  footer: 'Requer Node 20+',       // Observação abaixo do código",
    "});",
  ].join('\n'),
  en: [
    "const block = createCodeBlock({    // Root: border, surface, clipping",
    "  title: 'example.tsx',            // Header label (optional)",
    "  language: 'tsx',                 // Syntax classification",
    "  code: source,                    // Content shown and copied",
    "  showLineNumbers: true,           // Line number column",
    "  highlightLines: [3, '5-7'],      // Highlighted lines",
    "  footer: 'Requires Node 20+',     // Note below the code",
    "});",
  ].join('\n'),
  es: [
    "const bloque = createCodeBlock({   // Raíz: borde, superficie y recorte",
    "  title: 'ejemplo.tsx',            // Etiqueta del header (opcional)",
    "  language: 'tsx',                 // Clasificación de sintaxis",
    "  code: source,                    // Contenido mostrado y copiado",
    "  showLineNumbers: true,           // Columna de numeración",
    "  highlightLines: [3, '5-7'],      // Líneas destacadas",
    "  footer: 'Requiere Node 20+',     // Observación bajo el código",
    "});",
  ].join('\n'),
};

const EXTENSIBILITY_CODE: Record<Locale, string> = {
  'pt-BR': [
    'const bloco = createCodeBlock({',
    '  code: source,',
    "  language: 'bash',",
    "  title: 'terminal',",
    '  showLineNumbers: false,',
    "  class: 'instalacao',",
    "  footer: 'Requer Node 20 ou superior.',",
    '});',
  ].join('\n'),
  en: [
    'const block = createCodeBlock({',
    '  code: source,',
    "  language: 'bash',",
    "  title: 'terminal',",
    '  showLineNumbers: false,',
    "  class: 'install-snippet',",
    "  footer: 'Requires Node 20 or later.',",
    '});',
  ].join('\n'),
  es: [
    'const bloque = createCodeBlock({',
    '  code: source,',
    "  language: 'bash',",
    "  title: 'terminal',",
    '  showLineNumbers: false,',
    "  class: 'instalacion',",
    "  footer: 'Requiere Node 20 o superior.',",
    '});',
  ].join('\n'),
};

const overrides: TranslationOverrides = {
  '*': {
    'props.table.className.name': 'class',
    'props.table.footer.type': 'string | HTMLElement',
  },
  'pt-BR': {
    'anatomy.structureCode': ANATOMY_STRUCTURE['pt-BR'],
    'props.extensibilityCode': EXTENSIBILITY_CODE['pt-BR'],
  },
  en: {
    'anatomy.structureCode': ANATOMY_STRUCTURE.en,
    'props.extensibilityCode': EXTENSIBILITY_CODE.en,
  },
  es: {
    'anatomy.structureCode': ANATOMY_STRUCTURE.es,
    'props.extensibilityCode': EXTENSIBILITY_CODE.es,
  },
};

const { t: tNav } = createTranslation(uiTranslations as Record<string, unknown>);
const { t, subscribe } = createTranslation(codeBlockTranslations as Record<string, unknown>, overrides);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const priorityKeyMap: Record<string, string> = {
  high: 'common.high',
  medium: 'common.medium',
  low: 'common.low',
};

function priorityLabel(raw: string): string {
  return tNav(priorityKeyMap[raw] ?? 'common.high');
}

/**
 * CodeBlock instrumentado para a docs page.
 *
 * Nesta stack os `data-*` não são opção da factory: o observer global de
 * `docs-tracking` resolve o clique por `.closest('[data-track]')`, então basta
 * marcar o elemento devolvido. O id segue o padrão de 3 partes
 * `{component}:{secao}:{elemento}` — é a terceira parte que vira `snippet_id`
 * no evento `docs_code_copy`.
 */
function block(section: string, id: string, options: CodeBlockOptions): HTMLElement {
  const el = createCodeBlock({
    ...options,
    copyLabel: t('demonstration.labels.copy'),
    copiedLabel: t('demonstration.labels.copied'),
    class: ['nds-w-full', options.class].filter(Boolean).join(' '),
  });
  el.dataset.track = 'code';
  el.dataset.trackId = `code-block:${section}:${id}`;
  return el;
}

// ─── Trechos exibidos (idênticos nas 4 stacks) ────────────────────────────────

const DEMO_EXAMPLE_TSX = [
  'import { CodeBlock } from "@/components/ui/code-block";',
  '',
  'const snippet = `npm install`;',
  '',
  'export function Exemplo() {',
  '  return <CodeBlock code={snippet} language="bash" />;',
  '}',
].join('\n');

const DEMO_TERMINAL = [
  '# instala e sobe o Storybook',
  'npm install',
  'npm run storybook',
].join('\n');

const DEMO_THEME_CSS = [
  '.nds-code-block-root {',
  '  --code-block-bg: var(--muted);',
  '  --code-token-keyword: var(--primary);',
  '}',
].join('\n');

const DEMO_PACKAGE_JSON = [
  '{',
  '  "name": "nortear-design-system",',
  '  "private": true,',
  '  "version": "1.0.0"',
  '}',
].join('\n');

const DEMO_PLAIN = [
  'Valor não reconhecido cai em texto simples.',
  'O bloco continua rolando e copiando normalmente.',
].join('\n');

const LANGUAGE_ITEMS: Array<{ key: string; language: string; code: string }> = [
  { key: 'script', language: 'tsx',  code: 'const total = items.length; // soma' },
  { key: 'markup', language: 'vue',  code: '<button class="nds-btn" :disabled="loading">Salvar</button>' },
  { key: 'styles', language: 'css',  code: '.nds-card { padding: var(--spacing-4); }' },
  { key: 'data',   language: 'json', code: '{ "port": 6006, "open": true }' },
  { key: 'shell',  language: 'bash', code: 'npm run build -- --mode production' },
  { key: 'text',   language: 'txt',  code: 'Sem classificação: monoespaçado e sem cor.' },
];

const COMPOSITION_CODE = [
  'const items = await load();',
  'const total = items.length;',
  'render(items, total);',
].join('\n');

// ─── Tokens ───────────────────────────────────────────────────────────────────

const TOKEN_GROUPS: Array<{ titleKey: string; keys: string[] }> = [
  { titleKey: 'tokens.surfaceTitle', keys: ['bg', 'border', 'headerBg', 'highlightBg', 'highlightAccent', 'maxBlockSize'] },
  { titleKey: 'tokens.syntaxTitle',  keys: ['comment', 'string', 'number', 'keyword', 'builtin', 'function', 'tag', 'attr', 'property', 'operator', 'punctuation', 'plain'] },
  { titleKey: 'tokens.inheritedTitle', keys: ['radius', 'mutedForeground', 'foreground', 'borderBase'] },
];

const PROP_KEYS = [
  'code', 'language', 'title', 'showLineNumbers', 'highlightLines',
  'footer', 'copyLabel', 'copiedLabel', 'className',
];

const INTERFACE_CODE = `// createCodeBlock(options)
export interface CodeBlockOptions {
  code: string;
  language?: string;
  title?: string;
  showLineNumbers?: boolean;
  highlightLines?: string | number | Array<string | number>;
  footer?: string | HTMLElement;
  copyLabel?: string;
  copiedLabel?: string;
  class?: string;
}`;

// ─── createCodeBlockDocs ──────────────────────────────────────────────────────

export function createCodeBlockDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────

  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'code-block',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: t('category'), item: '/components/display' },
        { name: t('title') },
      ],
    });
    track('docs_page_view', {
      component_name: 'code-block',
      locale,
      page_title: `${t('title')} · Design System`,
    });
    return cleanup;
  }
  let cleanupSeo = updateSeo();
  cleanups.push(() => cleanupSeo());

  // ── Nav groups ───────────────────────────────────────────────────────────

  const NAV_GROUPS: { labelKey: string; sections: { id: string; labelKey: string }[] }[] = [
    { labelKey: 'nav.overview', sections: [
      { id: 'demonstracao', labelKey: 'nav.demonstration' },
      { id: 'anatomia',     labelKey: 'nav.anatomy'       },
      { id: 'quando-usar',  labelKey: 'nav.usage'         },
      { id: 'do-dont',      labelKey: 'nav.doDont'        },
    ]},
    { labelKey: 'nav.techRef', sections: [
      { id: 'importacao',   labelKey: 'nav.import'       },
      { id: 'variantes',    labelKey: 'nav.variants'     },
      { id: 'composicoes',  labelKey: 'nav.compositions' },
      { id: 'estados',      labelKey: 'nav.states'       },
      { id: 'propriedades', labelKey: 'nav.props'        },
      { id: 'tokens',       labelKey: 'nav.tokens'       },
    ]},
    { labelKey: 'nav.context', sections: [
      { id: 'acessibilidade', labelKey: 'nav.accessibility' },
      { id: 'relacionados',   labelKey: 'nav.related'       },
      { id: 'notas',          labelKey: 'nav.notes'         },
    ]},
    { labelKey: 'nav.quality', sections: [
      { id: 'analytics', labelKey: 'nav.analytics' },
      { id: 'testes',    labelKey: 'nav.testes'    },
    ]},
  ];

  function buildNavGroups() {
    return NAV_GROUPS.map(g => ({
      label: tNav(g.labelKey),
      sections: g.sections.map(s => ({ id: s.id, label: tNav(s.labelKey) })),
    }));
  }

  const pageLayout = createDocsPageLayout({
    navGroups: buildNavGroups(),
    componentSlug: 'code-block',
  });
  const root = pageLayout.root;
  const headerSlot = pageLayout.headerSlot;
  const main = pageLayout.main;
  cleanups.push(() => pageLayout.destroy());

  function renderHeader() {
    headerSlot.replaceChildren(
      createDocsHeader({
        title: t('title'),
        description: t('description'),
        category: t('category'),
        type: t('type'),
      }),
    );
  }

  // ── Sections (rebuilt on locale change) ───────────────────────────────────

  const sectionOrder = [
    'demonstracao', 'anatomia', 'quando-usar', 'do-dont',
    'importacao', 'variantes', 'composicoes', 'estados', 'propriedades', 'tokens',
    'acessibilidade', 'relacionados', 'notas', 'analytics', 'testes',
  ] as const;
  type SectionId = typeof sectionOrder[number];

  const sectionEls: Record<SectionId, HTMLElement> = {} as Record<SectionId, HTMLElement>;

  function buildSection(id: SectionId): HTMLElement {
    switch (id) {
      case 'demonstracao':
        return createDocsDemonstration({
          title: t('demonstration.title'),
          componentSlug: 'code-block',
          demoFactory: () => {
            const wrap = document.createElement('div');
            wrap.className = 'nds-w-full nds-stack';
            wrap.dataset.spacing = 'md';
            wrap.append(
              block('demonstracao', 'exemplo-tsx', {
                code: DEMO_EXAMPLE_TSX,
                language: 'tsx',
                title: t('demonstration.labels.fileName'),
                showLineNumbers: true,
                highlightLines: '3, 5-7',
                footer: t('demonstration.labels.footer'),
              }),
              block('demonstracao', 'terminal', {
                code: DEMO_TERMINAL,
                language: 'bash',
                title: t('demonstration.labels.terminalTitle'),
                showLineNumbers: false,
              }),
              block('demonstracao', 'tema-css', {
                code: DEMO_THEME_CSS,
                language: 'css',
                title: t('demonstration.labels.themeTitle'),
              }),
              block('demonstracao', 'package-json', {
                code: DEMO_PACKAGE_JSON,
                language: 'json',
                title: t('demonstration.labels.dataTitle'),
              }),
              block('demonstracao', 'notas-txt', {
                code: DEMO_PLAIN,
                language: 'txt',
                title: t('demonstration.labels.plainTitle'),
                showLineNumbers: false,
              }),
            );
            return wrap;
          },
        });

      case 'anatomia':
        return createDocsAnatomy({
          title: t('anatomy.title'),
          items: [1, 2, 3, 4, 5, 6, 7, 8].map(i => t(`anatomy.item${i}`)),
          structureLabel: t('anatomy.structureLabel'),
          structureCode: t('anatomy.structureCode'),
        });

      case 'quando-usar':
        return createDocsWhenToUse({
          title: t('usage.title'),
          guidelines: {
            title: t('usage.guidelines.title'),
            items: [1, 2, 3, 4].map(i => t(`usage.guidelines.item${i}`)),
          },
          scenarios: {
            title: t('usage.scenarios.title'),
            cols: {
              scenario: t('usage.scenarios.cols.scenario'),
              use: t('usage.scenarios.cols.use'),
              alternative: t('usage.scenarios.cols.alternative'),
            },
            items: [1, 2, 3, 4].map(i => ({
              s: t(`usage.scenarios.item${i}.s`),
              u: t(`usage.scenarios.item${i}.u`),
              a: t(`usage.scenarios.item${i}.a`),
            })),
          },
          uxWriting: {
            title: t('usage.uxWriting.title'),
            cols: {
              element: t('usage.uxWriting.table.element'),
              rules: t('usage.uxWriting.table.rules'),
              do: t('usage.uxWriting.table.correct'),
              dont: t('usage.uxWriting.table.avoid'),
            },
            items: ['headerTitle', 'footer', 'copy', 'comments'].map(key => ({
              element: t(`usage.uxWriting.table.${key}.name`),
              rules: t(`usage.uxWriting.table.${key}.format`),
              do: t(`usage.uxWriting.table.${key}.good`),
              dont: t(`usage.uxWriting.table.${key}.bad`),
            })),
          },
          do: {
            title: t('usage.do.title'),
            items: [1, 2, 3, 4].map(i => t(`usage.do.item${i}`)),
          },
          dont: {
            title: t('usage.dont.title'),
            items: [1, 2, 3].map(i => t(`usage.dont.item${i}`)),
          },
        });

      case 'do-dont':
        return createDocsDoDont({
          title: t('doDont.title'),
          pairs: [
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: t('doDont.pair1.do'),
              dontCaption: t('doDont.pair1.dont'),
              doPreviewFactory: () => block('do-dont', 'do-1', {
                code: COMPOSITION_CODE,
                language: 'ts',
                title: 'lista.ts',
                highlightLines: [2],
              }),
              dontPreviewFactory: () => block('do-dont', 'dont-1', {
                code: COMPOSITION_CODE,
                highlightLines: '1-2',
              }),
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: t('doDont.pair2.do'),
              dontCaption: t('doDont.pair2.dont'),
              doPreviewFactory: () => block('do-dont', 'do-2', {
                code: 'npm run build -- --mode production',
                language: 'bash',
                showLineNumbers: false,
              }),
              dontPreviewFactory: () => block('do-dont', 'dont-2', {
                code: 'npm run build -- --mode production',
                language: 'bash',
                showLineNumbers: true,
              }),
            },
          ],
        });

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          componentSlug: 'code-block',
          description: t('import.basic'),
          code: `import { createCodeBlock } from '@/components/ui/code-block';`,
          secondaryDescription: t('import.withFooter'),
          secondaryCode: EXTENSIBILITY_CODE[getLocale()],
        });

      case 'variantes':
        return createDocsVariants({
          title: t('variants.title'),
          note: t('variants.note'),
          componentSlug: 'code-block',
          items: LANGUAGE_ITEMS.map(item => ({
            name: item.key,
            description: t(`variants.items.${item.key}`),
            previewFactory: () => block('variantes', item.key, {
              code: item.code,
              language: item.language,
              showLineNumbers: false,
            }),
          })),
        });

      case 'composicoes':
        return createDocsCompositions({
          title: t('variants.compositionsTitle'),
          useWhenLabel: tNav('common.useWhen'),
          componentSlug: 'code-block',
          items: [
            {
              name: t('variants.compositions.withTitle.name'),
              description: t('variants.compositions.withTitle.description'),
              useWhen: t('variants.compositions.withTitle.use'),
              code:
                `const bloco = createCodeBlock({\n` +
                `  code: source,\n` +
                `  language: 'ts',\n` +
                `  title: 'lista.ts',\n` +
                `});`,
              previewFactory: () => block('composicoes', 'with-title', {
                code: COMPOSITION_CODE,
                language: 'ts',
                title: 'lista.ts',
              }),
            },
            {
              name: t('variants.compositions.withoutNumbers.name'),
              description: t('variants.compositions.withoutNumbers.description'),
              useWhen: t('variants.compositions.withoutNumbers.use'),
              code:
                `const bloco = createCodeBlock({\n` +
                `  code: source,\n` +
                `  language: 'ts',\n` +
                `  showLineNumbers: false,\n` +
                `});`,
              previewFactory: () => block('composicoes', 'without-numbers', {
                code: COMPOSITION_CODE,
                language: 'ts',
                showLineNumbers: false,
              }),
            },
            {
              name: t('variants.compositions.highlighted.name'),
              description: t('variants.compositions.highlighted.description'),
              useWhen: t('variants.compositions.highlighted.use'),
              code:
                `const bloco = createCodeBlock({\n` +
                `  code: source,\n` +
                `  language: 'ts',\n` +
                `  highlightLines: [2],\n` +
                `});`,
              previewFactory: () => block('composicoes', 'highlighted', {
                code: COMPOSITION_CODE,
                language: 'ts',
                highlightLines: [2],
              }),
            },
            {
              name: t('variants.compositions.withFooter.name'),
              description: t('variants.compositions.withFooter.description'),
              useWhen: t('variants.compositions.withFooter.use'),
              code:
                `const bloco = createCodeBlock({\n` +
                `  code: source,\n` +
                `  language: 'ts',\n` +
                `  footer: 'A ação de copiar leva apenas o código.',\n` +
                `});`,
              previewFactory: () => block('composicoes', 'with-footer', {
                code: COMPOSITION_CODE,
                language: 'ts',
                footer: t('demonstration.labels.footer'),
              }),
            },
          ],
        });

      case 'estados':
        return createDocsStates({
          title: t('states.title'),
          cols: {
            state: t('states.cols.state'),
            trigger: t('states.cols.trigger'),
            behavior: t('states.cols.behavior'),
          },
          items: ['idle', 'copied', 'numbered', 'unnumbered', 'highlighted', 'scrolling', 'unknownLanguage'].map(key => ({
            label: t(`states.${key}.label`),
            trigger: t(`states.${key}.trigger`),
            behavior: t(`states.${key}.behavior`),
          })),
        });

      case 'propriedades':
        return createDocsProps({
          title: t('props.title'),
          tables: [
            {
              cols: {
                prop: t('props.table.prop'),
                type: t('props.table.type'),
                default: t('props.table.default'),
                required: t('props.table.required'),
                description: t('props.table.description'),
              },
              items: PROP_KEYS.map(key => ({
                name: t(`props.table.${key}.name`),
                type: t(`props.table.${key}.type`),
                defaultValue: t(`props.table.${key}.default`),
                required: t(`props.table.${key}.required`),
                description: t(`props.table.${key}.description`),
              })),
            },
          ],
          interfaceCode: INTERFACE_CODE,
          extensibilityTitle: t('props.extensibilityTitle'),
          extensibilityNotes: t('props.extensibility'),
          extensibilityCode: t('props.extensibilityCode'),
        });

      case 'tokens':
        return createDocsTokens({
          title: t('tokens.title'),
          cols: {
            token: t('tokens.table.token'),
            value: t('tokens.table.group'),
            description: t('tokens.table.part'),
          },
          items: TOKEN_GROUPS.flatMap(group =>
            group.keys.map(key => ({
              token: t(`tokens.table.${key}.token`),
              value: t(group.titleKey),
              description: t(`tokens.table.${key}.part`),
            })),
          ),
          customizationTitle: t('tokens.customizationTitle'),
          customizationCode: t('tokens.customizationCode'),
        });

      case 'acessibilidade':
        return createDocsAccessibility({
          title: t('accessibility.title'),
          summary: t('accessibility.summary'),
          items: [1, 2, 3, 4, 5, 6].map(i => t(`accessibility.item${i}`)),
          keyboardTitle: t('accessibility.keyboardTitle'),
          keyboardItems: [
            { key: 'Tab',         description: t('accessibility.keyboard.tab') },
            { key: 'Enter',       description: t('accessibility.keyboard.enter') },
            { key: 'Space',       description: t('accessibility.keyboard.space') },
            { key: '↑ ↓ ← →',     description: t('accessibility.keyboard.arrows') },
            { key: 'Home / End',  description: t('accessibility.keyboard.homeEnd') },
          ],
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          componentSlug: 'code-block',
          items: [
            { name: 'Table', description: t('related.table'), path: '?path=/docs/ui-table--docs' },
            { name: 'Alert', description: t('related.alert'), path: '?path=/docs/ui-alert--docs' },
            { name: 'Tabs',  description: t('related.tabs'),  path: '?path=/docs/ui-tabs--docs' },
            { name: 'Card',  description: t('related.card'),  path: '?path=/docs/ui-card--docs' },
          ],
        });

      case 'notas':
        return createDocsNotes({
          title: t('notes.title'),
          componentSlug: 'code-block',
          items: [1, 2, 3, 4, 5].map(i => ({ title: '', content: t(`notes.tip${i}`) })),
        });

      case 'analytics':
        return createDocsAnalytics({
          title: t('analytics.title'),
          cols: {
            event: t('analytics.table.event'),
            trigger: t('analytics.table.trigger'),
            payload: t('analytics.table.payload'),
          },
          items: ['copy', 'pageView', 'sectionViewed', 'langSwitch'].map(key => ({
            event: t(`analytics.table.${key}`),
            trigger: t(`analytics.table.${key}Trigger`),
            payload: t(`analytics.table.${key}Payload`),
          })),
        });

      case 'testes':
        return createDocsTestes({
          title: t('testes.title'),
          functional: {
            title: t('testes.functional.title'),
            cols: {
              action: tNav('common.userAction'),
              result: tNav('common.expectedResult'),
              priority: tNav('common.priority'),
            },
            items: [1, 2, 3, 4, 5, 6, 7, 8].map(i => ({
              action: t(`testes.functional.item${i}.action`),
              result: t(`testes.functional.item${i}.result`),
              priority: priorityLabel(t(`testes.functional.item${i}.priority`)),
            })),
          },
          accessibility: {
            title: t('testes.accessibility.title'),
            cols: { criterion: tNav('common.criterion'), level: 'WCAG', how: tNav('common.howToVerify') },
            items: [1, 2, 3, 4, 5].map(i => ({
              criterion: t(`testes.accessibility.item${i}.criterion`),
              level: t(`testes.accessibility.item${i}.level`),
              how: t(`testes.accessibility.item${i}.how`),
            })),
          },
          visual: {
            title: t('testes.visual.title'),
            cols: {
              story: tNav('common.storyState'),
              priority: tNav('common.priority'),
            },
            items: [1, 2, 3, 4, 5].map(i => ({
              story: t(`testes.visual.item${i}.story`),
              priority: priorityLabel(t(`testes.visual.item${i}.priority`)),
            })),
          },
        });
    }
  }

  function renderAllSections() {
    for (const id of sectionOrder) {
      const fresh = buildSection(id);
      const existing = sectionEls[id];
      if (existing && existing.parentNode) {
        existing.replaceWith(fresh);
      } else {
        main.appendChild(fresh);
      }
      sectionEls[id] = fresh;
    }
    attachObserver();
  }

  // ── IntersectionObserver ─────────────────────────────────────────────────

  let activeSectionObserver: { disconnect: () => void } | null = null;

  function attachObserver() {
    activeSectionObserver?.disconnect();
    activeSectionObserver = createActiveSectionObserver(
      sectionOrder as unknown as string[],
      (id) => sectionEls[id as SectionId] ?? null,
      (id) => pageLayout.setActiveSection(id),
      (id) => track('docs_section_viewed', {
        section_id: id,
        component_name: 'code-block',
        locale: getLocale(),
      }),
    );
  }
  cleanups.push(() => activeSectionObserver?.disconnect());

  // ── Initial render ────────────────────────────────────────────────────────

  renderHeader();
  renderAllSections();

  // `subscribe` é o mesmo canal de `onLocaleChange` — registrar uma vez só.
  cleanups.push(subscribe(() => {
    cleanupSeo();
    cleanupSeo = updateSeo();
    renderHeader();
    pageLayout.rebuildNav(buildNavGroups());
    renderAllSections();
  }));

  // ── Cleanup on disconnect ────────────────────────────────────────────────

  const mo = new MutationObserver(() => {
    if (!document.body.contains(root)) {
      cleanups.forEach(fn => fn());
      mo.disconnect();
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });

  return root;
}
