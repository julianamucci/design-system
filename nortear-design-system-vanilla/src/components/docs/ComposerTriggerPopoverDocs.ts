import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { createComposer } from '@/components/ui/composer';
import { createSeparator } from '@/components/ui/separator';
import {
  commandSource,
  composerLabels,
  mentionSource,
  triggerLabels,
} from '@/components/ui/composer-trigger-popover.fixtures';
import uiTranslations from '@/i18n/ui.json';
import triggerTranslations from '@shared/content/composer-trigger-popover/translations.json';

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
import { stripHtml, toPlainText } from '@/lib/strip-html';

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t: tNav } = createTranslation(uiTranslations as Record<string, unknown>);
const { t, subscribe } = createTranslation(triggerTranslations as Record<string, unknown>);

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria. O
// `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
function screenReaderItems(): string[] {
  const locale = getLocale();
  const raw = (triggerTranslations as unknown as Record<
    string,
    { accessibility?: { screenReader?: Record<string, string> } }
  >)[locale]?.accessibility?.screenReader ?? {};
  return Object.entries(raw).filter(([k]) => k !== 'title').map(([, v]) => v);
}

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
 * Um composer com gatilho, rotulado.
 *
 * A legenda diz QUAL caso está desenhado. O painel do seletor só abre com o
 * campo em foco e o cursor no lugar certo — coisa que uma foto estática não
 * tem —, então a demonstração mostra os CAMPOS prontos para receber cada
 * gatilho, e quem experimenta abre o painel digitando. As stories é que fixam
 * o painel aberto para o Chromatic.
 */
function example(labelKey: string, build: () => HTMLElement) {
  const wrap = document.createElement('div');
  wrap.className = 'nds-stack nds-w-full';
  wrap.dataset.spacing = 'xs';

  const caption = document.createElement('div');
  caption.className = 'nds-text-caption nds-text-muted-foreground';
  caption.textContent = stripHtml(t(labelKey));

  wrap.append(caption, build());
  return wrap;
}

// ─── createComposerTriggerPopoverDocs ──────────────────────────────────────

export function createComposerTriggerPopoverDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'composer-trigger-popover',
    });
    track('docs_page_view', {
      component_name: 'composer-trigger-popover',
      locale,
      page_title: `${t('title')} · Design System`,
    });
    return cleanup;
  }
  let cleanupSeo = updateSeo();
  cleanups.push(() => cleanupSeo());
  cleanups.push(subscribe(() => { cleanupSeo(); cleanupSeo = updateSeo(); }));

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

  const buildNavGroups = () =>
    NAV_GROUPS.map(g => ({
      label: tNav(g.labelKey),
      sections: g.sections.map(s => ({ id: s.id, label: tNav(s.labelKey) })),
    }));

  const pageLayout = createDocsPageLayout({ navGroups: buildNavGroups() });
  const root = pageLayout.root;
  const main = pageLayout.main;

  function renderHeader() {
    pageLayout.headerSlot.replaceChildren(createDocsHeader({
      title: t('title'),
      description: t('description'),
      category: t('category'),
      type: t('type'),
    }));
  }

  const sectionOrder = [
    'demonstracao', 'anatomia', 'quando-usar', 'do-dont',
    'importacao', 'variantes', 'estados', 'propriedades', 'tokens',
    'acessibilidade', 'relacionados', 'notas', 'analytics', 'testes',
  ] as const;
  type SectionId = typeof sectionOrder[number];

  const sectionEls: Record<SectionId, HTMLElement> = {} as Record<SectionId, HTMLElement>;

  function buildSection(id: SectionId): HTMLElement {
    const comGatilhos = (...fontes: ReturnType<typeof mentionSource>[]) =>
      createComposer({
        labels: composerLabels(),
        triggerLabels: triggerLabels(),
        triggers: fontes,
      });

    switch (id) {
      case 'demonstracao':
        return createDocsDemonstration({
          title: t('demonstration.title'),
          componentSlug: 'composer-trigger-popover',
          demoFactory: () => {
            const stack = document.createElement('div');
            stack.className = 'nds-stack nds-w-full';
            stack.dataset.spacing = 'lg';
            const examples = [
              example('demonstration.labels.mentions', () => comGatilhos(mentionSource())),
              example('demonstration.labels.commands', () => comGatilhos(commandSource())),
              example('demonstration.labels.filtered', () => {
                const c = comGatilhos(mentionSource());
                c.setValue('avisa a @an');
                return c;
              }),
              example('demonstration.labels.empty', () => {
                const c = comGatilhos(mentionSource());
                c.setValue('avisa a @zzz');
                return c;
              }),
            ];
            examples.forEach((el, i) => {
              if (i > 0) stack.appendChild(createSeparator());
              stack.appendChild(el);
            });
            return stack;
          },
        });

      case 'anatomia':
        return createDocsAnatomy({
          title: t('anatomy.title'),
          items: [1, 2, 3, 4, 5].map(i => t(`anatomy.item${i}`)),
          structureLabel: t('anatomy.structureLabel'),
          structureCode: t('anatomy.structureCode'),
          language: 'html',
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
            items: [1, 2, 3, 4, 5].map(i => ({
              s: t(`usage.scenarios.item${i}.s`),
              u: t(`usage.scenarios.item${i}.u`),
              a: toPlainText(t(`usage.scenarios.item${i}.a`)),
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
            items: ['label', 'hint', 'empty', 'command'].map(k => ({
              element: t(`usage.uxWriting.table.${k}.name`),
              rules: t(`usage.uxWriting.table.${k}.format`),
              do: t(`usage.uxWriting.table.${k}.good`),
              dont: t(`usage.uxWriting.table.${k}.bad`),
            })),
          },
          do: {
            title: t('usage.do.title'),
            items: [1, 2, 3, 4].map(i => t(`usage.do.item${i}`)),
          },
          dont: {
            title: t('usage.dont.title'),
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
              // O par é o MESMO campo com a mesma menção pela metade: o que
              // muda é de quem é a tecla de envio naquele instante.
              doPreviewFactory: () => {
                const c = comGatilhos(mentionSource());
                c.setValue('avisa a @an');
                return c;
              },
              dontPreviewFactory: () => {
                const c = createComposer({
                  labels: composerLabels(),
                  value: 'avisa a @an',
                });
                return c;
              },
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair2.do')),
              dontCaption: toPlainText(t('doDont.pair2.dont')),
              doPreviewFactory: () => {
                const c = comGatilhos(mentionSource());
                c.setValue('avisa a @zzz');
                return c;
              },
              // O contraexemplo: o mesmo campo com a frase de nenhum resultado
              // apagada — o painel abre e não diz nada.
              dontPreviewFactory: () =>
                createComposer({
                  labels: composerLabels(),
                  triggerLabels: { ...triggerLabels(), empty: '' },
                  triggers: [mentionSource()],
                  value: 'avisa a @zzz',
                }),
            },
          ],
        });

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          description: t('import.basic'),
          code: t('import.basicCode'),
          secondaryDescription: t('import.withCommands'),
          secondaryCode: t('import.withCommandsCode'),
        });

      case 'variantes':
        return createDocsVariants({
          title: t('variants.title'),
          note: stripHtml(t('variants.note')),
          componentSlug: 'composer-trigger-popover',
          items: (['mention', 'command'] as const).map(modo => ({
            name: modo,
            description: stripHtml(t(`variants.items.${modo}.description`)),
            code: t(`variants.items.${modo}.code`),
            previewFactory: () =>
              comGatilhos(modo === 'mention' ? mentionSource() : commandSource()),
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
          items: ['closed', 'open', 'filtered', 'empty'].map(k => ({
            label: t(`states.${k}.label`),
            trigger: toPlainText(t(`states.${k}.trigger`)),
            behavior: toPlainText(t(`states.${k}.behavior`)),
          })),
        });

      case 'propriedades': {
        const interfaceCode = `// Entram no \`createComposer\`, junto do resto.
export interface TriggerSource {
  spec: TriggerSpec;           // o caractere e onde ele vale
  options: TriggerOption[];
}

export interface TriggerOption {
  id: string;
  label: string;               // o que se lê, e o que o filtro compara
  hint?: string;               // o apoio à direita
  value?: string;              // o que fica escrito, quando difere do rótulo
}

export interface TriggerPopoverLabels {
  empty: string;               // a frase de nenhum resultado
  list: string;                // o nome acessível da lista
}`;

        const cols = {
          prop: t('props.table.prop'),
          type: t('props.table.type'),
          default: t('props.table.default'),
          required: t('props.table.required'),
          description: t('props.table.description'),
        };

        return createDocsProps({
          title: t('props.title'),
          tables: [
            {
              title: 'createComposer',
              cols,
              items: ['triggers', 'triggerLabels'].map(k => ({
                name: t(`props.table.${k}.name`),
                type: t(`props.table.${k}.type`),
                defaultValue: t(`props.table.${k}.default`),
                required: t(`props.table.${k}.required`),
                description: toPlainText(t(`props.table.${k}.description`)),
              })),
            },
            {
              title: 'TriggerSource · TriggerOption',
              cols,
              items: ['spec', 'options', 'label', 'hint', 'value'].map(k => ({
                name: t(`props.table.${k}.name`),
                type: t(`props.table.${k}.type`),
                defaultValue: t(`props.table.${k}.default`),
                required: t(`props.table.${k}.required`),
                description: toPlainText(t(`props.table.${k}.description`)),
              })),
            },
          ],
          interfaceCode,
          extensibilityTitle: t('props.extensibilityTitle'),
          extensibilityNotes: stripHtml(t('props.extensibility')),
          extensibilityCode: t('props.extensibilityCode'),
        });
      }

      case 'tokens':
        return createDocsTokens({
          title: t('tokens.title'),
          cols: {
            token: t('tokens.table.token'),
            value: t('tokens.table.value'),
            description: t('tokens.table.description'),
          },
          items: [
            'popover', 'popoverForeground', 'border', 'elevation', 'zIndex',
            'accent', 'accentForeground', 'mutedForeground', 'radiusSm',
          ].map(k => ({
            token: t(`tokens.table.${k}.token`),
            value: t(`tokens.table.${k}.value`),
            description: toPlainText(t(`tokens.table.${k}.description`)),
          })),
          customizationTitle: t('tokens.customizationTitle'),
          customizationCode: t('tokens.customizationCode'),
          language: 'css',
        });

      case 'acessibilidade':
        return createDocsAccessibility({
          title: t('accessibility.title'),
          summary: t('accessibility.summary'),
          items: [1, 2, 3, 4, 5].map(i => t(`accessibility.items.item${i}`)),
          keyboardTitle: t('accessibility.keyboard.title'),
          keyboardItems: [
            { key: 'Tab',   description: t('accessibility.keyboard.tab') },
            { key: 'Enter', description: t('accessibility.keyboard.enter') },
            { key: '↑ ↓',   description: t('accessibility.keyboard.arrows') },
          ],
          screenReaderTitle: t('accessibility.screenReader.title'),
          screenReaderItems: screenReaderItems(),
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: t('related.items.composer.name'), description: toPlainText(t('related.items.composer.description')), path: '?path=/docs/ui-composer--docs' },
            { name: t('related.items.combobox.name'), description: toPlainText(t('related.items.combobox.description')), path: '?path=/docs/ui-combobox--docs' },
            { name: t('related.items.command.name'),  description: toPlainText(t('related.items.command.description')),  path: '?path=/docs/ui-command--docs' },
            { name: t('related.items.popover.name'),  description: toPlainText(t('related.items.popover.description')),  path: '?path=/docs/ui-popover--docs' },
          ],
        });

      case 'notas':
        return createDocsNotes({
          title: t('notes.title'),
          componentSlug: 'composer-trigger-popover',
          items: [1, 2, 3, 4, 5].map(i => ({ title: '', content: t(`notes.item${i}`) })),
        });

      case 'analytics':
        return createDocsAnalytics({
          title: t('analytics.title'),
          cols: {
            event: t('analytics.table.event'),
            trigger: t('analytics.table.trigger'),
            payload: t('analytics.table.payload'),
          },
          items: ['pageView', 'sectionViewed', 'demoClick'].map(k => ({
            event: t(`analytics.table.${k}`),
            trigger: toPlainText(t(`analytics.table.${k}Trigger`)),
            payload: t(`analytics.table.${k}Payload`),
          })),
        });

      case 'testes':
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
            items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => ({
              action: toPlainText(t(`testes.functional.item${i}.action`)),
              result: toPlainText(t(`testes.functional.item${i}.result`)),
              priority: priorityLabel(t(`testes.functional.item${i}.priority`)),
            })),
          },
          accessibility: {
            title: t('testes.accessibility.title'),
            description: t('testes.accessibility.description'),
            cols: {
              criterion: tNav('common.criterion'),
              level: 'WCAG',
              how: tNav('common.howToVerify'),
            },
            // A lista é PLANA: cada item é um critério, e o "como verificar" é
            // o próprio addon-a11y rodando em toda story.
            items: [1, 2, 3, 4, 5, 6].map(i => ({
              criterion: toPlainText(t(`testes.accessibility.item${i}`)),
              level: 'AA',
              how: '—',
            })),
          },
          visual: {
            title: t('testes.visual.title'),
            description: t('testes.visual.description'),
            cols: {
              story: tNav('common.storyState'),
              priority: tNav('common.priority'),
            },
            items: [1, 2, 3, 4, 5, 6].map(i => ({
              story: toPlainText(t(`testes.visual.item${i}.story`)),
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
      if (existing && existing.parentNode) existing.replaceWith(fresh);
      else main.appendChild(fresh);
      sectionEls[id] = fresh;
    }
    attachObserver();
  }

  let activeSectionObserver: { disconnect: () => void } | null = null;

  function attachObserver() {
    activeSectionObserver?.disconnect();
    activeSectionObserver = createActiveSectionObserver(
      sectionOrder as unknown as string[],
      (id) => sectionEls[id as SectionId] ?? null,
      (id) => pageLayout.setActiveSection(id),
      (id) => track('docs_section_viewed', {
        section_id: id,
        component_name: 'composer-trigger-popover',
        locale: getLocale(),
      }),
    );
  }
  cleanups.push(() => activeSectionObserver?.disconnect());

  renderHeader();
  pageLayout.rebuildNav(buildNavGroups());
  renderAllSections();

  const rerender = () => {
    renderHeader();
    pageLayout.rebuildNav(buildNavGroups());
    renderAllSections();
  };
  cleanups.push(subscribe(rerender));
  cleanups.push(onLocaleChange(rerender));

  const mo = new MutationObserver(() => {
    if (!document.body.contains(root)) {
      cleanups.forEach(fn => fn());
      mo.disconnect();
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });

  return root;
}
