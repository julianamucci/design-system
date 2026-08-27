import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, createTranslation } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { createButton } from '@/components/ui/button';
import { createEditor, type EditorOptions, type EditorRoot } from '@/components/ui/editor';
import {
  ADVANCED_CONTENT,
  BASIC_CONTENT,
  DO_DONT_CONTENT,
  editorLabels,
  nounLabels,
  PLAYGROUND_CONTENT,
} from '@/components/ui/editor.fixtures';
import uiTranslations from '@/i18n/ui.json';
import editorTranslations from '@shared/content/editor/translations.json';
import { toPlainText } from '@/lib/strip-html';

import {
  createDocsHeader,
  createDocsDemonstration,
  createDocsAnatomy,
  createDocsWhenToUse,
  createDocsDoDont,
  createDocsImport,
  createDocsVariants,
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
// Quase sem overrides: o `translations.json` do editor descreve a API em
// nomenclatura neutra, e nesta stack os nomes coincidem — `content`,
// `editable`, `preset`, `labels`, `resolveImage`, `describeImage`.
//
// A exceção é `onChange`. O conteúdo compartilhado o nomeia "callback de
// mudança" porque o nome REAL muda de stack para stack, e a tabela de
// propriedades desta página promete o nome que se digita aqui. Só o `name`
// muda: tipo, padrão e descrição valem nos cinco.

const { t: tNav } = createTranslation(uiTranslations as Record<string, unknown>);
const { t, subscribe } = createTranslation(editorTranslations as Record<string, unknown>, {
  '*': { 'props.table.onChange.name': 'onChange' },
});

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
 * Editor de preview, com os rótulos no idioma da página.
 *
 * Toda instância desta página passa por aqui: são vários editores na mesma
 * página (demonstração, dois pares de Do & Don't, dois cards de conjunto), e
 * cada um precisa dos 38 rótulos para montar a barra. Eles saem do conteúdo
 * compartilhado, e não de uma constante em pt-BR: o rótulo é o NOME ACESSÍVEL
 * de um botão só de ícone, e uma barra em português numa página em espanhol é
 * ilegível para quem ouve.
 *
 * Como a página refaz as seções a cada troca de idioma, e `editorLabels()`
 * resolve no idioma corrente, a barra troca junto com o texto em volta.
 */
function previewEditor(options: Omit<EditorOptions, 'labels'> & { labels?: EditorOptions['labels'] }): EditorRoot {
  return createEditor({
    ...options,
    labels: options.labels ?? editorLabels(),
    class: ['nds-w-full', options.class].filter(Boolean).join(' '),
  });
}

/** Chaves da tabela de propriedades, na ordem do contrato. */
const PROP_KEYS = [
  'content', 'editable', 'preset', 'labels', 'onChange', 'resolveImage', 'describeImage',
];

/** Chaves da tabela de tokens, na ordem em que o conteúdo as declara. */
const TOKEN_KEYS = [
  'border', 'background', 'muted', 'mutedForeground', 'foreground',
  'primary', 'accent', 'ring', 'textH1',
];

/** Estados descritos pelo conteúdo compartilhado, na ordem em que ele os lista. */
const STATE_KEYS = [
  'editing', 'readOnly', 'imageSelected', 'inTable', 'fieldOpen', 'invalidValue',
];

const INTERFACE_CODE = `// createEditor(options)
export type EditorOptions = {
  content?: string;
  editable?: boolean;
  preset?: 'basic' | 'advanced';
  labels: EditorLabels;
  onChange?: (html: string) => void;
  resolveImage?: (file: File) => Promise<string | null>;
  describeImage?: (file: File | null, src: string) => Promise<string | null>;
  class?: string;
};`;

/** Chamada mostrada no card de cada conjunto. */
function presetSnippet(preset: 'basic' | 'advanced'): string {
  return [
    'const editor = createEditor({',
    `  preset: '${preset}',`,
    '  labels,',
    '});',
  ].join('\n');
}

// ─── createEditorDocs ─────────────────────────────────────────────────────────

export function createEditorDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────

  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'editor',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: t('category'), item: '/components/form' },
        { name: t('title') },
      ],
    });
    track('docs_page_view', {
      component_name: 'editor',
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
    componentSlug: 'editor',
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

  // ── Demonstração ─────────────────────────────────────────────────────────
  //
  // Uma instância só, do primeiro clique ao último. Trocar de conjunto refaz a
  // BARRA, e desligar a edição não refaz nada — as duas coisas passam por
  // método da raiz. A versão anterior remontava a fábrica a cada clique de
  // controle: o texto que a pessoa acabava de escrever na demonstração sumia,
  // que é o oposto do que uma demonstração existe para mostrar.

  type DemoState = { preset: 'basic' | 'advanced'; editable: boolean };

  function buildDemo(): HTMLElement {
    const state: DemoState = { preset: 'advanced', editable: true };

    const wrap = document.createElement('div');
    wrap.className = 'nds-w-full nds-stack';
    wrap.dataset.spacing = 'md';

    const controls = document.createElement('div');
    controls.className = 'nds-cluster';
    controls.dataset.spacing = 'sm';
    controls.setAttribute('role', 'group');
    controls.setAttribute('aria-label', t('demonstration.title'));

    const slot = document.createElement('div');
    slot.className = 'nds-w-full';

    const current: EditorRoot = previewEditor({
      content: PLAYGROUND_CONTENT,
      preset: state.preset,
      editable: state.editable,
    });
    slot.replaceChildren(current);

    function applyState() {
      current.setPreset(state.preset);
      current.setEditable(state.editable);
    }

    const buttons: Array<{ key: string; el: HTMLButtonElement; on: () => boolean }> = [];

    function syncControls() {
      for (const button of buttons) {
        button.el.setAttribute('aria-pressed', String(button.on()));
      }
    }

    function addControl(key: string, label: string, on: () => boolean, apply: () => void) {
      const el = createButton({
        variant: 'outline',
        size: 'sm',
        label,
        onClick: () => {
          apply();
          applyState();
          syncControls();
        },
      });
      // O evento sai do próprio botão: o observer resolve por
      // `.closest('[data-track]')`, e a terceira parte do id vira `element_id`.
      el.dataset.track = 'demo';
      el.dataset.trackId = `editor:demonstracao:${key}`;
      el.dataset.trackLabel = label;
      buttons.push({ key, el, on });
      controls.appendChild(el);
    }

    addControl(
      'basic',
      t('demonstration.labels.basic'),
      () => state.preset === 'basic',
      () => { state.preset = 'basic'; },
    );
    addControl(
      'advanced',
      t('demonstration.labels.advanced'),
      () => state.preset === 'advanced',
      () => { state.preset = 'advanced'; },
    );
    addControl(
      'readOnly',
      t('demonstration.labels.readOnly'),
      () => !state.editable,
      () => { state.editable = !state.editable; },
    );

    syncControls();
    wrap.append(controls, slot);
    return wrap;
  }

  // ── Sections (rebuilt on locale change) ───────────────────────────────────

  const sectionOrder = [
    'demonstracao', 'anatomia', 'quando-usar', 'do-dont',
    'importacao', 'variantes', 'estados', 'propriedades', 'tokens',
    'acessibilidade', 'relacionados', 'notas', 'analytics', 'testes',
  ] as const;
  type SectionId = typeof sectionOrder[number];

  const sectionEls: Record<SectionId, HTMLElement> = {} as Record<SectionId, HTMLElement>;

  function buildSection(id: SectionId): HTMLElement {
    switch (id) {
      case 'demonstracao':
        return createDocsDemonstration({
          title: t('demonstration.title'),
          componentSlug: 'editor',
          demoFactory: buildDemo,
        });

      case 'anatomia':
        return createDocsAnatomy({
          title: t('anatomy.title'),
          items: [1, 2, 3, 4, 5, 6, 7].map(i => t(`anatomy.item${i}`)),
          structureLabel: t('anatomy.structureLabel'),
          structureCode: t('anatomy.structureCode'),
        });

      case 'quando-usar':
        return createDocsWhenToUse({
          title: t('usage.title'),
          guidelines: {
            title: t('usage.guidelines.title'),
            items: [1, 2, 3, 4, 5].map(i => t(`usage.guidelines.item${i}`)),
          },
          scenarios: {
            title: t('usage.scenarios.title'),
            cols: {
              scenario: t('usage.scenarios.cols.scenario'),
              use: t('usage.scenarios.cols.use'),
              alternative: t('usage.scenarios.cols.alternative'),
            },
            items: [1, 2, 3, 4, 5, 6].map(i => ({
              s: t(`usage.scenarios.item${i}.s`),
              u: t(`usage.scenarios.item${i}.u`),
              a: t(`usage.scenarios.item${i}.a`),
            })),
          },
          do: {
            title: tNav('common.do'),
            items: [1, 2, 3, 4].map(i => t(`usage.do.item${i}`)),
          },
          dont: {
            title: tNav('common.dont'),
            items: [1, 2, 3, 4].map(i => t(`usage.dont.item${i}`)),
          },
        });

      case 'do-dont':
        return createDocsDoDont({
          title: t('doDont.title'),
          pairs: [
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair1.do')),
              dontCaption: toPlainText(t('doDont.pair1.dont')),
              // Os dois editores são o MESMO conjunto e o MESMO conteúdo: muda
              // UM rótulo, o do botão de link — `labels.actions.link`
              // ("Inserir link") de um lado, `labels.nouns.link` ("Link") do
              // outro, os dois vindos do conteúdo. É exatamente o que a legenda
              // deste par contrasta, e um segundo texto diferente daria à
              // comparação uma segunda variável.
              doPreviewFactory: () => previewEditor({
                content: BASIC_CONTENT,
                preset: 'basic',
                labels: editorLabels(),
              }),
              dontPreviewFactory: () => previewEditor({
                content: BASIC_CONTENT,
                preset: 'basic',
                labels: nounLabels(),
              }),
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair2.do')),
              dontCaption: toPlainText(t('doDont.pair2.dont')),
              doPreviewFactory: () => previewEditor({
                content: DO_DONT_CONTENT,
                preset: 'basic',
              }),
              dontPreviewFactory: () => previewEditor({
                content: DO_DONT_CONTENT,
                preset: 'advanced',
              }),
            },
          ],
        });

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          componentSlug: 'editor',
          description: t('import.basic'),
          code: t('import.basicCode'),
          secondaryDescription: t('import.withStorage'),
          secondaryCode: t('import.withStorageCode'),
        });

      case 'variantes':
        return createDocsVariants({
          title: t('variants.title'),
          note: t('variants.note'),
          componentSlug: 'editor',
          items: (['basic', 'advanced'] as const).map(key => ({
            // O `name` é a chave ESTÁVEL, não traduzida: é ela que vira
            // `snippet_id` do `docs_code_copy`, e um nome traduzido partiria o
            // mesmo evento em três no GA4.
            name: t(`variants.items.${key}.name`),
            trackId: key,
            description: t(`variants.items.${key}.description`),
            code: presetSnippet(key),
            previewFactory: () => previewEditor({
              content: key === 'basic' ? BASIC_CONTENT : ADVANCED_CONTENT,
              preset: key,
            }),
          })),
        });

      case 'estados':
        return createDocsStates({
          title: t('states.title'),
          cols: {
            state: t('states.cols.state'),
            trigger: t('states.cols.trigger'),
            behavior: t('states.cols.behavior'),
          },
          items: STATE_KEYS.map(key => ({
            label: t(`states.${key}.label`),
            trigger: t(`states.${key}.trigger`),
            behavior: toPlainText(t(`states.${key}.behavior`)),
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
            value: t('tokens.table.value'),
            description: t('tokens.table.description'),
          },
          items: TOKEN_KEYS.map(key => ({
            token: t(`tokens.table.${key}.token`),
            value: t(`tokens.table.${key}.value`),
            description: t(`tokens.table.${key}.description`),
          })),
          customizationTitle: t('tokens.customizationTitle'),
          customizationCode: t('tokens.customizationCode'),
        });

      case 'acessibilidade':
        return createDocsAccessibility({
          title: t('accessibility.title'),
          summary: t('accessibility.summary'),
          items: [1, 2, 3, 4, 5, 6, 7].map(i => t(`accessibility.item${i}`)),
          keyboardTitle: t('accessibility.keyboardTitle'),
          keyboardItems: ['tab', 'arrows', 'homeEnd', 'enter', 'escape'].map(key => ({
            key: t(`accessibility.keyboard.${key}.key`),
            description: t(`accessibility.keyboard.${key}.action`),
          })),
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          componentSlug: 'editor',
          items: [
            { name: 'Textarea',    description: toPlainText(t('related.textarea')),    path: '?path=/docs/ui-textarea--docs' },
            { name: 'CodeBlock',   description: toPlainText(t('related.codeBlock')),   path: '?path=/docs/ui-codeblock--docs' },
            { name: 'ToggleGroup', description: toPlainText(t('related.toggleGroup')), path: '?path=/docs/ui-togglegroup--docs' },
            { name: 'Button',      description: toPlainText(t('related.button')),      path: '?path=/docs/ui-button--docs' },
          ],
        });

      case 'notas':
        return createDocsNotes({
          title: t('notes.title'),
          componentSlug: 'editor',
          items: [1, 2, 3, 4, 5, 6].map(i => ({ title: '', content: t(`notes.tip${i}`) })),
        });

      case 'analytics':
        return createDocsAnalytics({
          title: t('analytics.title'),
          cols: {
            event: t('analytics.table.event'),
            trigger: toPlainText(t('analytics.table.trigger')),
            payload: t('analytics.table.payload'),
          },
          items: ['pageView', 'sectionViewed', 'demoClick'].map(key => ({
            event: t(`analytics.table.${key}`),
            trigger: toPlainText(t(`analytics.table.${key}Trigger`)),
            payload: t(`analytics.table.${key}Payload`),
          })),
        });

      case 'testes':
        // As três sub-seções do conteúdo do editor usam a MESMA forma
        // (`action`/`result`/`priority`). Os containers de acessibilidade e de
        // visual foram desenhados para outra: aqui cada campo entra no lugar
        // que o preserva, sem descartar texto.
        return createDocsTestes({
          title: t('testes.title'),
          functional: {
            title: t('testes.functional.title'),
            description: t('testes.functional.description'),
            cols: {
              action: tNav('common.userAction'),
              result: tNav('common.expectedResult'),
              priority: tNav('common.priority'),
            },
            items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => ({
              action: t(`testes.functional.item${i}.action`),
              result: t(`testes.functional.item${i}.result`),
              priority: priorityLabel(t(`testes.functional.item${i}.priority`)),
            })),
          },
          accessibility: {
            title: t('testes.accessibility.title'),
            description: t('testes.accessibility.description'),
            cols: {
              criterion: tNav('common.userAction'),
              level: tNav('common.priority'),
              how: tNav('common.expectedResult'),
            },
            items: [1, 2, 3, 4, 5].map(i => ({
              criterion: t(`testes.accessibility.item${i}.action`),
              level: priorityLabel(t(`testes.accessibility.item${i}.priority`)),
              how: t(`testes.accessibility.item${i}.result`),
            })),
          },
          visual: {
            title: t('testes.visual.title'),
            description: t('testes.visual.description'),
            cols: {
              story: tNav('common.storyState'),
              priority: tNav('common.priority'),
            },
            items: [1, 2, 3].map(i => ({
              story: `${t(`testes.visual.item${i}.action`)} — ${t(`testes.visual.item${i}.result`)}`,
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
        component_name: 'editor',
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
