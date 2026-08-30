import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  OnDestroy,
  viewChild,
  TemplateRef,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useTranslation, getLocale } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { stripHtml, toPlainText } from '@/lib/strip-html';
import { NdsCodeBlock } from '@/components/ui/code-block';
import uiTranslations from '@/i18n/ui.json';
import codeBlockTranslations from '@shared/content/code-block/translations.json';

import {
  NdsDocsPageLayout,
  NdsDocsHeader,
  NdsDocsDemonstration,
  NdsDocsAnatomy,
  NdsDocsWhenToUse,
  NdsDocsDoDont,
  NdsDocsImport,
  NdsDocsVariants,
  NdsDocsStates,
  NdsDocsProps,
  NdsDocsTokens,
  NdsDocsAccessibility,
  NdsDocsRelated,
  NdsDocsNotes,
  NdsDocsAnalytics,
  NdsDocsTestes,
  type DocsVariantItem,
} from '@/components/docs/shared/sections';

const SLUG = 'code-block';

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t: tNav } = useTranslation(uiTranslations as Record<string, unknown>);

// Duas linhas da tabela de props falam de uma API que não é a desta stack:
// `footer` aceita nó de framework no conteúdo compartilhado e aqui é texto, e
// `className` não existe — classes extras vão no atributo `class` nativo, que o
// Angular mescla com a classe base.
const { t, dict } = useTranslation(codeBlockTranslations as Record<string, unknown>, {
  '*': {
    'props.table.footer.type': 'string',
    'props.table.className.name': 'class',
  },
  'pt-BR': {
    'props.table.footer.description':
      'Observação abaixo do código, separada por borda. Recebe texto simples — o rodapé não interpreta marcação.',
    'props.table.className.description':
      'Classes extras vão no atributo class do próprio elemento — o Angular mescla com a classe base. Use para sobrescrever as custom properties do bloco em uma instância.',
  },
  en: {
    'props.table.footer.description':
      'Note below the code, separated by a border. Takes plain text — the footer does not interpret markup.',
    'props.table.className.description':
      'Extra classes go on the class attribute of the element itself — Angular merges them with the base class. Use it to override the block custom properties on a single instance.',
  },
  es: {
    'props.table.footer.description':
      'Observación debajo del código, separada por un borde. Recibe texto simple — el pie no interpreta marcado.',
    'props.table.className.description':
      'Las clases extra van en el atributo class del propio elemento — Angular las combina con la clase base. Úsalo para sobrescribir las custom properties del bloque en una instancia.',
  },
});

const SECTION_IDS = [
  'demonstracao', 'anatomia', 'quando-usar', 'do-dont',
  'importacao', 'variantes', 'estados', 'propriedades', 'tokens',
  'acessibilidade', 'relacionados', 'notas', 'analytics', 'testes',
] as const;

const NAV_GROUPS: { labelKey: string; sections: { id: string; labelKey: string }[] }[] = [
  { labelKey: 'nav.overview', sections: [
    { id: 'demonstracao', labelKey: 'nav.demonstration' },
    { id: 'anatomia',     labelKey: 'nav.anatomy'       },
    { id: 'quando-usar',  labelKey: 'nav.usage'         },
    { id: 'do-dont',      labelKey: 'nav.doDont'        },
  ]},
  { labelKey: 'nav.techRef', sections: [
    { id: 'importacao',   labelKey: 'nav.import'   },
    { id: 'variantes',    labelKey: 'nav.variants' },
    { id: 'estados',      labelKey: 'nav.states'   },
    { id: 'propriedades', labelKey: 'nav.props'    },
    { id: 'tokens',       labelKey: 'nav.tokens'   },
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

// ─── Trechos exibidos pelos blocos da página ──────────────────────────────────
//
// Montados por `join('\n')` e não por template literal: o próprio snippet leva
// crase (o `template` de um @Component), e escapá-las dentro de outra crase
// deixaria de ser o texto que a pessoa copia.

/** Demonstração — arquivo de componente, com destaque e rodapé. */
const DEMO_COMPONENT = [
  "import { Component } from '@angular/core';",
  "import { NdsCodeBlock } from '@/components/ui/code-block';",
  '',
  '@Component({',
  "  selector: 'app-exemplo',",
  '  imports: [NdsCodeBlock],',
  '  template: `<nds-code-block [code]="snippet" language="bash" />`,',
  '})',
  'export class Exemplo {',
  "  readonly snippet = 'npm install';",
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

/**
 * Linguagens da seção Variantes. Exportado porque as stories de variantes
 * mostram exatamente os mesmos trechos — duplicar o literal seria abrir espaço
 * para os dois lados divergirem sem ninguém perceber.
 */
export const LANGUAGE_ITEMS: ReadonlyArray<{ key: string; language: string; code: string }> = [
  { key: 'script', language: 'ts',   code: 'const total = items.length; // soma' },
  // Markup no idioma desta stack: binding de propriedade e seletor de atributo,
  // sem classe inventada.
  { key: 'markup', language: 'html', code: '<button ndsButton [disabled]="carregando()">Salvar</button>' },
  { key: 'styles', language: 'css',  code: '.nds-card { padding: var(--spacing-4); }' },
  { key: 'data',   language: 'json', code: '{ "port": 6010, "open": true }' },
  { key: 'shell',  language: 'bash', code: 'npm run build -- --mode production' },
  { key: 'text',   language: 'txt',  code: 'Sem classificação: monoespaçado e sem cor.' },
];

/** Trecho base das configurações — também usado pelas stories de composição. */
export const COMPOSITION_CODE = [
  'const items = await load();',
  'const total = items.length;',
  'render(items, total);',
].join('\n');

/** Uso mostrado no toggle "Ver código" de cada linguagem suportada. */
function languageSnippet(language: string): string {
  return [
    '<nds-code-block',
    '  [code]="source"',
    `  language="${language}"`,
    '  [showLineNumbers]="false"',
    '/>',
  ].join('\n');
}

const CODE_WITH_TITLE = [
  '<nds-code-block',
  '  [code]="source"',
  '  language="ts"',
  '  title="lista.ts"',
  '/>',
].join('\n');

const CODE_WITHOUT_NUMBERS = [
  '<nds-code-block',
  '  [code]="source"',
  '  language="ts"',
  '  [showLineNumbers]="false"',
  '/>',
].join('\n');

const CODE_HIGHLIGHTED = [
  '<nds-code-block',
  '  [code]="source"',
  '  language="ts"',
  '  [highlightLines]="[2]"',
  '/>',
].join('\n');

const CODE_WITH_FOOTER = [
  '<nds-code-block',
  '  [code]="source"',
  '  language="ts"',
  '  footer="A ação de copiar leva apenas o código."',
  '/>',
].join('\n');

const IMPORT_BASIC = "import { NdsCodeBlock } from '@/components/ui/code-block';";

const INTERFACE_CODE = `// <nds-code-block> — inputs, todos signals.
readonly code = input.required<string>();
readonly language = input<string | undefined>(undefined);
readonly title = input<string>('');
readonly showLineNumbers = input<boolean>(true);
readonly highlightLines = input<LineRangeInput | undefined>(undefined);
readonly footer = input<string>('');
readonly copyLabel = input<string>('Copiar código');
readonly copiedLabel = input<string>('Copiado!');

// Não há input \`class\`: o atributo nativo do elemento já é mesclado
// com a classe base .nds-code-block-root pelo próprio Angular.`;

// ─── Tabelas derivadas do conteúdo ────────────────────────────────────────────

const TOKEN_GROUPS: { titleKey: string; keys: string[] }[] = [
  { titleKey: 'tokens.surfaceTitle', keys: ['bg', 'border', 'headerBg', 'highlightBg', 'highlightAccent', 'maxBlockSize'] },
  { titleKey: 'tokens.syntaxTitle',  keys: ['comment', 'string', 'number', 'keyword', 'builtin', 'function', 'tag', 'attr', 'property', 'operator', 'punctuation', 'plain'] },
  { titleKey: 'tokens.inheritedTitle', keys: ['radius', 'mutedForeground', 'foreground', 'borderBase'] },
];

const PROP_KEYS = [
  'code', 'language', 'title', 'showLineNumbers', 'highlightLines',
  'footer', 'copyLabel', 'copiedLabel', 'className',
];

const STATE_KEYS = ['idle', 'copied', 'numbered', 'unnumbered', 'scrolling', 'unknownLanguage'];

const UX_KEYS = ['headerTitle', 'footer', 'copy', 'comments'];

const RELATED = [
  { key: 'table', name: 'Table', path: '?path=/docs/primitives-tables-table--docs' },
  { key: 'alert', name: 'Alert', path: '?path=/docs/primitives-feedback-alert--docs' },
  { key: 'tabs',  name: 'Tabs',  path: '?path=/docs/primitives-navigation-tabs--docs'  },
  { key: 'card',  name: 'Card',  path: '?path=/docs/primitives-layout-card--docs'  },
];

@Component({
  selector: 'nds-code-block-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NdsCodeBlock,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsVariants,
    NdsDocsStates, NdsDocsProps, NdsDocsTokens, NdsDocsAccessibility,
    NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics, NdsDocsTestes,
  ],
  template: `
    <!-- ── Previews do Do & Don't ─────────────────────────────────────────── -->
    <ng-template #tplDoDont1Do>
      <nds-code-block
        class="nds-w-full"
        [code]="compositionCode"
        language="ts"
        title="lista.ts"
        [highlightLines]="destaqueLinha2"
        [copyLabel]="copyLabel()"
        [copiedLabel]="copiedLabel()"
        data-track="code"
        data-track-id="code-block:do-dont:do-1"
      />
    </ng-template>
    <ng-template #tplDoDont1Dont>
      <nds-code-block
        class="nds-w-full"
        [code]="compositionCode"
        [highlightLines]="'1-2'"
        [copyLabel]="copyLabel()"
        [copiedLabel]="copiedLabel()"
        data-track="code"
        data-track-id="code-block:do-dont:dont-1"
      />
    </ng-template>
    <ng-template #tplDoDont2Do>
      <!-- A legenda fala de um comando de uma linha: o par precisa ser esse
           comando, sem rótulo de arquivo — não um script de três linhas. -->
      <nds-code-block
        class="nds-w-full"
        [code]="shellCode"
        language="bash"
        [showLineNumbers]="false"
        [copyLabel]="copyLabel()"
        [copiedLabel]="copiedLabel()"
        data-track="code"
        data-track-id="code-block:do-dont:do-2"
      />
    </ng-template>
    <ng-template #tplDoDont2Dont>
      <nds-code-block
        class="nds-w-full"
        [code]="shellCode"
        language="bash"
        [showLineNumbers]="true"
        [copyLabel]="copyLabel()"
        [copiedLabel]="copiedLabel()"
        data-track="code"
        data-track-id="code-block:do-dont:dont-2"
      />
    </ng-template>

    <!-- ── Previews das linguagens ────────────────────────────────────────── -->
    <ng-template #tplLangScript>
      <nds-code-block
        class="nds-w-full"
        [code]="lang.script.code"
        [language]="lang.script.language"
        [showLineNumbers]="false"
        [copyLabel]="copyLabel()"
        [copiedLabel]="copiedLabel()"
        data-track="code"
        data-track-id="code-block:variantes:script"
      />
    </ng-template>
    <ng-template #tplLangMarkup>
      <nds-code-block
        class="nds-w-full"
        [code]="lang.markup.code"
        [language]="lang.markup.language"
        [showLineNumbers]="false"
        [copyLabel]="copyLabel()"
        [copiedLabel]="copiedLabel()"
        data-track="code"
        data-track-id="code-block:variantes:markup"
      />
    </ng-template>
    <ng-template #tplLangStyles>
      <nds-code-block
        class="nds-w-full"
        [code]="lang.styles.code"
        [language]="lang.styles.language"
        [showLineNumbers]="false"
        [copyLabel]="copyLabel()"
        [copiedLabel]="copiedLabel()"
        data-track="code"
        data-track-id="code-block:variantes:styles"
      />
    </ng-template>
    <ng-template #tplLangData>
      <nds-code-block
        class="nds-w-full"
        [code]="lang.data.code"
        [language]="lang.data.language"
        [showLineNumbers]="false"
        [copyLabel]="copyLabel()"
        [copiedLabel]="copiedLabel()"
        data-track="code"
        data-track-id="code-block:variantes:data"
      />
    </ng-template>
    <ng-template #tplLangShell>
      <nds-code-block
        class="nds-w-full"
        [code]="lang.shell.code"
        [language]="lang.shell.language"
        [showLineNumbers]="false"
        [copyLabel]="copyLabel()"
        [copiedLabel]="copiedLabel()"
        data-track="code"
        data-track-id="code-block:variantes:shell"
      />
    </ng-template>
    <ng-template #tplLangText>
      <nds-code-block
        class="nds-w-full"
        [code]="lang.text.code"
        [language]="lang.text.language"
        [showLineNumbers]="false"
        [copyLabel]="copyLabel()"
        [copiedLabel]="copiedLabel()"
        data-track="code"
        data-track-id="code-block:variantes:text"
      />
    </ng-template>

    <!-- ── Previews dos arranjos ──────────────────────────────────────────── -->
    <ng-template #tplWithTitle>
      <nds-code-block
        class="nds-w-full"
        [code]="compositionCode"
        language="ts"
        title="lista.ts"
        [copyLabel]="copyLabel()"
        [copiedLabel]="copiedLabel()"
        data-track="code"
        data-track-id="code-block:variantes:with-title"
      />
    </ng-template>
    <ng-template #tplWithoutNumbers>
      <nds-code-block
        class="nds-w-full"
        [code]="compositionCode"
        language="ts"
        [showLineNumbers]="false"
        [copyLabel]="copyLabel()"
        [copiedLabel]="copiedLabel()"
        data-track="code"
        data-track-id="code-block:variantes:without-numbers"
      />
    </ng-template>
    <ng-template #tplHighlighted>
      <nds-code-block
        class="nds-w-full"
        [code]="compositionCode"
        language="ts"
        [highlightLines]="destaqueLinha2"
        [copyLabel]="copyLabel()"
        [copiedLabel]="copiedLabel()"
        data-track="code"
        data-track-id="code-block:variantes:highlighted"
      />
    </ng-template>
    <ng-template #tplWithFooter>
      <nds-code-block
        class="nds-w-full"
        [code]="compositionCode"
        language="ts"
        [footer]="footerNote()"
        [copyLabel]="copyLabel()"
        [copiedLabel]="copiedLabel()"
        data-track="code"
        data-track-id="code-block:variantes:with-footer"
      />
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="code-block"
    >
      <div docsHeader>
        <nds-docs-header
          [title]="t('title')"
          [description]="t('description')"
          [category]="t('category')"
          [type]="t('type')"
        />
      </div>

      <ng-container docsMain>
        <nds-docs-demonstration [title]="t('demonstration.title')">
          <div class="nds-stack nds-w-full" data-spacing="md">
            <nds-code-block
              class="nds-w-full"
              [code]="demoComponent"
              language="ts"
              [title]="t('demonstration.labels.fileName')"
              [showLineNumbers]="true"
              [highlightLines]="'6, 9-11'"
              [footer]="footerNote()"
              [copyLabel]="copyLabel()"
              [copiedLabel]="copiedLabel()"
              data-track="code"
              data-track-id="code-block:demonstracao:exemplo-ts"
            />
            <nds-code-block
              class="nds-w-full"
              [code]="demoTerminal"
              language="bash"
              [title]="t('demonstration.labels.terminalTitle')"
              [showLineNumbers]="false"
              [copyLabel]="copyLabel()"
              [copiedLabel]="copiedLabel()"
              data-track="code"
              data-track-id="code-block:demonstracao:terminal"
            />
            <nds-code-block
              class="nds-w-full"
              [code]="demoThemeCss"
              language="css"
              [title]="t('demonstration.labels.themeTitle')"
              [copyLabel]="copyLabel()"
              [copiedLabel]="copiedLabel()"
              data-track="code"
              data-track-id="code-block:demonstracao:tema-css"
            />
            <nds-code-block
              class="nds-w-full"
              [code]="demoPackageJson"
              language="json"
              [title]="t('demonstration.labels.dataTitle')"
              [copyLabel]="copyLabel()"
              [copiedLabel]="copiedLabel()"
              data-track="code"
              data-track-id="code-block:demonstracao:package-json"
            />
            <nds-code-block
              class="nds-w-full"
              [code]="demoPlain"
              language="txt"
              [title]="t('demonstration.labels.plainTitle')"
              [showLineNumbers]="false"
              [copyLabel]="copyLabel()"
              [copiedLabel]="copiedLabel()"
              data-track="code"
              data-track-id="code-block:demonstracao:notas-txt"
            />
          </div>
        </nds-docs-demonstration>

        <nds-docs-anatomy
          [title]="t('anatomy.title')"
          [items]="anatomyItems()"
          [structureLabel]="t('anatomy.structureLabel')"
          [structureCode]="t('anatomy.structureCode')"
          language="html"
        />

        <nds-docs-when-to-use
          [title]="t('usage.title')"
          [guidelines]="guidelines()"
          [scenarios]="scenarios()"
          [uxWriting]="uxWriting()"
          [do]="usageDo()"
          [dont]="usageDont()"
        />

        <nds-docs-do-dont [title]="t('doDont.title')" [pairs]="doDontPairs()" />

        <nds-docs-import
          [title]="t('import.title')"
          [description]="t('import.basic')"
          [code]="importBasic"
          [secondaryDescription]="t('import.withFooter')"
          [secondaryCode]="t('props.extensibilityCode')"
          componentSlug="code-block"
          language="ts"
        />

        <nds-docs-variants
          [title]="t('variants.title')"
          [note]="t('variants.note')"
          [items]="variantItems()"
          componentSlug="code-block"
          id="variantes"
          language="html"
        />

        <nds-docs-states
          [title]="t('states.title')"
          [cols]="statesCols()"
          [items]="stateItems()"
        />

        <nds-docs-props
          [title]="t('props.title')"
          [tables]="propTables()"
          [interfaceCode]="interfaceCode"
          [extensibilityTitle]="t('props.extensibilityTitle')"
          [extensibilityNotes]="t('props.extensibility')"
          [extensibilityCode]="t('props.extensibilityCode')"
          language="ts"
        />

        <nds-docs-tokens
          [title]="t('tokens.title')"
          [cols]="tokensCols()"
          [items]="tokenItems()"
          [customizationTitle]="t('tokens.customizationTitle')"
          [customizationCode]="t('tokens.customizationCode')"
        />

        <nds-docs-accessibility
          [title]="t('accessibility.title')"
          [summary]="t('accessibility.summary')"
          [items]="a11yItems()"
          [keyboardTitle]="t('accessibility.keyboardTitle')"
          [keyboardItems]="keyboardItems()"
          [screenReaderTitle]="tNav('common.screenReader')"
          [screenReaderItems]="screenReaderItems()"
        />

        <nds-docs-related
          [title]="t('related.title')"
          [items]="relatedItems()"
          componentSlug="code-block"
        />

        <nds-docs-notes
          [title]="t('notes.title')"
          [items]="noteItems()"
          componentSlug="code-block"
        />

        <nds-docs-analytics
          [title]="t('analytics.title')"
          [cols]="analyticsCols()"
          [items]="analyticsItems()"
        />

        <nds-docs-testes
          [title]="t('testes.title')"
          [functional]="testesFunctional()"
          [accessibility]="testesAccessibility()"
          [visual]="testesVisual()"
        />
      </ng-container>
    </nds-docs-page-layout>
  `,
})
export class NdsCodeBlockDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly interfaceCode = INTERFACE_CODE;
  protected readonly importBasic = IMPORT_BASIC;
  protected readonly compositionCode = COMPOSITION_CODE;
  protected readonly demoComponent = DEMO_COMPONENT;
  protected readonly demoTerminal = DEMO_TERMINAL;
  protected readonly demoThemeCss = DEMO_THEME_CSS;
  protected readonly demoPackageJson = DEMO_PACKAGE_JSON;
  protected readonly demoPlain = DEMO_PLAIN;
  protected readonly shellCode = LANGUAGE_ITEMS[4].code;

  /**
   * Literal estável para `[highlightLines]`: um array novo a cada ciclo de
   * detecção invalidaria o `computed` de linhas destacadas sem que nada tenha
   * mudado.
   */
  protected readonly destaqueLinha2: ReadonlyArray<number> = [2];

  /** Trechos por chave — o template não indexa array por posição legível. */
  protected readonly lang = Object.fromEntries(
    LANGUAGE_ITEMS.map((item) => [item.key, item]),
  ) as Record<string, { key: string; language: string; code: string }>;

  protected readonly activeSection = signal<string | undefined>(undefined);

  // Rótulos do botão copiar traduzidos junto com a página.
  protected readonly copyLabel = computed(() => {
    dict();
    return t('demonstration.labels.copy');
  });
  protected readonly copiedLabel = computed(() => {
    dict();
    return t('demonstration.labels.copied');
  });
  protected readonly footerNote = computed(() => {
    dict();
    return toPlainText(t('demonstration.labels.footer'));
  });

  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');
  private readonly tplLangScript = viewChild.required<TemplateRef<unknown>>('tplLangScript');
  private readonly tplLangMarkup = viewChild.required<TemplateRef<unknown>>('tplLangMarkup');
  private readonly tplLangStyles = viewChild.required<TemplateRef<unknown>>('tplLangStyles');
  private readonly tplLangData = viewChild.required<TemplateRef<unknown>>('tplLangData');
  private readonly tplLangShell = viewChild.required<TemplateRef<unknown>>('tplLangShell');
  private readonly tplLangText = viewChild.required<TemplateRef<unknown>>('tplLangText');
  private readonly tplWithTitle = viewChild.required<TemplateRef<unknown>>('tplWithTitle');
  private readonly tplWithoutNumbers = viewChild.required<TemplateRef<unknown>>('tplWithoutNumbers');
  private readonly tplHighlighted = viewChild.required<TemplateRef<unknown>>('tplHighlighted');
  private readonly tplWithFooter = viewChild.required<TemplateRef<unknown>>('tplWithFooter');

  protected readonly navGroups = computed(() => {
    dict();
    return NAV_GROUPS.map((g) => ({
      label: t(g.labelKey),
      sections: g.sections.map((s) => ({ id: s.id, label: t(s.labelKey) })),
    }));
  });

  protected readonly anatomyItems = computed(() => {
    dict();
    return [1, 2, 3, 4, 5, 6, 7, 8].map((i) => t(`anatomy.item${i}`));
  });

  protected readonly guidelines = computed(() => {
    dict();
    return {
      title: t('usage.guidelines.title'),
      items: [1, 2, 3, 4].map((i) => t(`usage.guidelines.item${i}`)),
    };
  });

  protected readonly scenarios = computed(() => {
    const d = dict();
    return {
      title: t('usage.scenarios.title'),
      cols: {
        scenario: t('usage.scenarios.cols.scenario'),
        use: t('usage.scenarios.cols.use'),
        alternative: t('usage.scenarios.cols.alternative'),
      },
      items: itemsFromDict(d, 'usage.scenarios', ['s', 'u', 'a']).map((r) => ({
        s: toPlainText(r.s),
        u: toPlainText(r.u),
        a: toPlainText(r.a),
      })),
    };
  });

  protected readonly uxWriting = computed(() => {
    dict();
    return {
      title: t('usage.uxWriting.title'),
      cols: {
        element: t('usage.uxWriting.table.element'),
        rules: t('usage.uxWriting.table.rules'),
        do: t('usage.uxWriting.table.correct'),
        dont: t('usage.uxWriting.table.avoid'),
      },
      items: UX_KEYS.map((key) => ({
        element: toPlainText(t(`usage.uxWriting.table.${key}.name`)),
        rules: toPlainText(t(`usage.uxWriting.table.${key}.format`)),
        do: toPlainText(t(`usage.uxWriting.table.${key}.good`)),
        dont: toPlainText(t(`usage.uxWriting.table.${key}.bad`)),
      })),
    };
  });

  protected readonly usageDo = computed(() => {
    dict();
    return { title: t('usage.do.title'), items: [1, 2, 3, 4].map((i) => t(`usage.do.item${i}`)) };
  });

  protected readonly usageDont = computed(() => {
    dict();
    return { title: t('usage.dont.title'), items: [1, 2, 3].map((i) => t(`usage.dont.item${i}`)) };
  });

  protected readonly doDontPairs = computed(() => {
    dict();
    return [
      {
        doLabel: tNav('common.do'),
        dontLabel: tNav('common.dont'),
        doCaption: toPlainText(t('doDont.pair1.do')),
        dontCaption: toPlainText(t('doDont.pair1.dont')),
        doPreview: this.tplDoDont1Do(),
        dontPreview: this.tplDoDont1Dont(),
      },
      {
        doLabel: tNav('common.do'),
        dontLabel: tNav('common.dont'),
        doCaption: toPlainText(t('doDont.pair2.do')),
        dontCaption: toPlainText(t('doDont.pair2.dont')),
        doPreview: this.tplDoDont2Do(),
        dontPreview: this.tplDoDont2Dont(),
      },
    ];
  });

  protected readonly variantItems = computed<DocsVariantItem[]>(() => {
    dict();
    const useWhen = tNav('common.useWhen');
    const previewsPorLinguagem: Record<string, TemplateRef<unknown>> = {
      script: this.tplLangScript(),
      markup: this.tplLangMarkup(),
      styles: this.tplLangStyles(),
      data: this.tplLangData(),
      shell: this.tplLangShell(),
      text: this.tplLangText(),
    };

    const linguagens = LANGUAGE_ITEMS.map((item) => ({
      name: item.key,
      description: t(`variants.items.${item.key}`),
      code: languageSnippet(item.language),
      trackId: item.key,
      preview: previewsPorLinguagem[item.key],
    }));

    // `useWhen` entra na descrição como o container de composições faz: o de
    // variantes não tem o campo, e a seção aqui é uma só (id="variantes").
    const arranjo = (
      key: string,
      trackId: string,
      code: string,
      preview: TemplateRef<unknown>,
    ): DocsVariantItem => ({
      name: t(`variants.items.${key}.name`),
      description:
        `${t(`variants.items.${key}.description`)}<br><br>` +
        `<strong>${useWhen}</strong> ${t(`variants.items.${key}.use`)}`,
      code,
      trackId,
      preview,
    });

    return [
      ...linguagens,
      arranjo('withTitle', 'with-title', CODE_WITH_TITLE, this.tplWithTitle()),
      arranjo('withoutNumbers', 'without-numbers', CODE_WITHOUT_NUMBERS, this.tplWithoutNumbers()),
      arranjo('highlighted', 'highlighted', CODE_HIGHLIGHTED, this.tplHighlighted()),
      arranjo('withFooter', 'with-footer', CODE_WITH_FOOTER, this.tplWithFooter()),
    ];
  });

  protected readonly statesCols = computed(() => {
    dict();
    return {
      state: t('states.cols.state'),
      trigger: toPlainText(t('states.cols.trigger')),
      behavior: toPlainText(t('states.cols.behavior')),
    };
  });

  protected readonly stateItems = computed(() => {
    dict();
    return STATE_KEYS.map((k) => ({
      label: toPlainText(t(`states.${k}.label`)),
      trigger: toPlainText(t(`states.${k}.trigger`)),
      behavior: toPlainText(t(`states.${k}.behavior`)),
    }));
  });

  protected readonly propTables = computed(() => {
    dict();
    return [
      {
        cols: {
          prop: t('props.table.prop'),
          type: t('props.table.type'),
          default: t('props.table.default'),
          required: t('props.table.required'),
          description: t('props.table.description'),
        },
        items: PROP_KEYS.map((key) => ({
          name: toPlainText(t(`props.table.${key}.name`)),
          type: toPlainText(t(`props.table.${key}.type`)),
          defaultValue: toPlainText(t(`props.table.${key}.default`)),
          required: toPlainText(t(`props.table.${key}.required`)),
          description: toPlainText(t(`props.table.${key}.description`)),
        })),
      },
    ];
  });

  protected readonly tokensCols = computed(() => {
    dict();
    return {
      token: t('tokens.table.token'),
      value: t('tokens.table.group'),
      description: toPlainText(t('tokens.table.part')),
    };
  });

  protected readonly tokenItems = computed(() => {
    dict();
    // Três grupos numa tabela só: `DocsTokens` monta um único id="tokens", e
    // três seções gerariam id duplicado. O grupo vira a coluna do meio.
    return TOKEN_GROUPS.flatMap(({ titleKey, keys }) =>
      keys.map((key) => ({
        token: toPlainText(t(`tokens.table.${key}.token`)),
        value: t(titleKey),
        description: toPlainText(t(`tokens.table.${key}.part`)),
      })),
    );
  });

  protected readonly a11yItems = computed(() => {
    dict();
    return [1, 2, 3, 4, 5, 6].map((i) => t(`accessibility.item${i}`));
  });

  protected readonly keyboardItems = computed(() => {
    dict();
    return [
      { key: 'Tab',                description: toPlainText(t('accessibility.keyboard.tab')) },
      { key: 'Enter',              description: toPlainText(t('accessibility.keyboard.enter')) },
      { key: 'Space',              description: toPlainText(t('accessibility.keyboard.space')) },
      { key: '↑ ↓ ← →',            description: toPlainText(t('accessibility.keyboard.arrows')) },
      { key: 'Home / End',         description: toPlainText(t('accessibility.keyboard.homeEnd')) },
    ];
  });

  protected readonly screenReaderItems = computed(() => {
    dict();
    const locale = getLocale();
    const byLocale = codeBlockTranslations as unknown as Record<
      string,
      { accessibility?: { screenReader?: Record<string, string> } }
    >;
    return Object.values(byLocale[locale]?.accessibility?.screenReader ?? {});
  });

  protected readonly relatedItems = computed(() => {
    dict();
    return RELATED.map(({ key, name, path }) => ({
      name,
      description: toPlainText(t(`related.${key}`)),
      path,
    }));
  });

  protected readonly noteItems = computed(() => {
    dict();
    return [1, 2, 3, 4, 5].map((i) => ({ title: '', content: t(`notes.tip${i}`) }));
  });

  protected readonly analyticsCols = computed(() => {
    dict();
    return {
      event: t('analytics.table.event'),
      trigger: toPlainText(t('analytics.table.trigger')),
      payload: toPlainText(t('analytics.table.payload')),
    };
  });

  protected readonly analyticsItems = computed(() => {
    dict();
    return ['copy', 'pageView', 'sectionViewed', 'langSwitch'].map((k) => ({
      event: toPlainText(t(`analytics.table.${k}`)),
      trigger: toPlainText(t(`analytics.table.${k}Trigger`)),
      payload: toPlainText(t(`analytics.table.${k}Payload`)),
    }));
  });

  protected readonly testesFunctional = computed(() => {
    const d = dict();
    return {
      title: t('testes.functional.title'),
      description: t('testes.functional.description'),
      cols: {
        action: tNav('common.userAction'),
        result: tNav('common.expectedResult'),
        priority: tNav('common.priority'),
      },
      items: itemsFromDict(d, 'testes.functional', ['action', 'result', 'priority']).map((r) => ({
        action: toPlainText(r.action),
        result: stripHtml(toPlainText(r.result)),
        priority: priorityLabel(r.priority),
      })),
    };
  });

  protected readonly testesAccessibility = computed(() => {
    const d = dict();
    return {
      title: t('testes.accessibility.title'),
      description: t('testes.accessibility.description'),
      cols: { criterion: tNav('common.criterion'), level: 'WCAG', how: tNav('common.howToVerify') },
      items: itemsFromDict(d, 'testes.accessibility', ['criterion', 'level', 'how']).map((r) => ({
        criterion: toPlainText(r.criterion),
        level: r.level,
        how: toPlainText(r.how),
      })),
    };
  });

  protected readonly testesVisual = computed(() => {
    const d = dict();
    return {
      title: t('testes.visual.title'),
      description: t('testes.visual.description'),
      cols: { story: tNav('common.storyState'), priority: tNav('common.priority') },
      items: itemsFromDict(d, 'testes.visual', ['story', 'priority']).map((r) => ({
        story: toPlainText(r.story),
        priority: priorityLabel(r.priority),
      })),
    };
  });

  private observer: { disconnect: () => void } | undefined;

  constructor() {
    effect((onCleanup) => {
      dict();
      const locale = getLocale();
      const cleanup = applySeo({
        title: t('seo.title'),
        description: t('seo.description'),
        locale,
        componentSlug: SLUG,
        aiSummary: t('seo.aiSummary'),
        aiEntities: t('seo.aiEntities'),
        breadcrumb: [
          { name: 'Components', item: '/components' },
          { name: t('category'), item: '/components/display' },
          { name: t('title') },
        ],
      });
      track('docs_page_view', {
        component_name: SLUG,
        locale,
        page_title: `${t('title')} · Design System`,
      });
      onCleanup(cleanup);
    });
  }

  ngAfterViewInit(): void {
    this.observer = createActiveSectionObserver(
      [...SECTION_IDS],
      (id) => document.getElementById(id),
      (id) => this.activeSection.set(id),
      (id) =>
        track('docs_section_viewed', {
          component_name: SLUG,
          section_id: id,
          locale: getLocale(),
        }),
    );
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}

const priorityKeyMap: Record<string, string> = {
  high: 'common.high',
  medium: 'common.medium',
  low: 'common.low',
};

function priorityLabel(raw: string): string {
  return tNav(priorityKeyMap[raw] ?? 'common.high');
}

function itemsFromDict<K extends string>(
  d: Record<string, string>,
  base: string,
  fields: readonly K[],
): Record<K, string>[] {
  const rows: Record<K, string>[] = [];
  for (let i = 1; ; i++) {
    if (d[`${base}.item${i}.${fields[0]}`] === undefined) break;
    const row = {} as Record<K, string>;
    for (const f of fields) row[f] = d[`${base}.item${i}.${f}`] ?? '';
    rows.push(row);
  }
  return rows;
}
