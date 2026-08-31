import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import {
  createContextBreakdown,
  type ContextBreakdownLabels,
} from '@/components/ui/context-breakdown';
import { createSeparator } from '@/components/ui/separator';
import {
  contextBreakdownLabels,
  partsOf,
  type ContextBreakdownCase,
} from '@/components/ui/context-breakdown.fixtures';
import type { ContextPart } from '@shared/primitives/token-budget';
import uiTranslations from '@/i18n/ui.json';
import breakdownTranslations from '@shared/content/context-breakdown/translations.json';

import {
  createDocsHeader,
  createDocsDemonstration,
  createDocsAnatomy,
  createDocsWhenToUse,
  createDocsDoDont,
  createDocsImport,
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
const { t, subscribe } = createTranslation(breakdownTranslations as Record<string, unknown>);

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria. O
// `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
function screenReaderItems(): string[] {
  const locale = getLocale();
  const raw = (breakdownTranslations as unknown as Record<
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

/** As oito posições da paleta, na ordem em que a folha as atribui. */
const CHART_ROWS = ['chart1', 'chart2', 'chart3', 'chart4', 'chart5', 'chart6', 'chart7', 'chart8'];

/**
 * Uma repartição, rotulada.
 *
 * A legenda diz QUAL caso está desenhado — sem ela, quatro blocos empilhados
 * viram um só, e o assunto da demonstração é justamente a diferença entre eles.
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

// ─── createContextBreakdownDocs ───────────────────────────────────────────────

export function createContextBreakdownDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'context-breakdown',
    });
    track('docs_page_view', {
      component_name: 'context-breakdown',
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
      { id: 'importacao',   labelKey: 'nav.import' },
      { id: 'estados',      labelKey: 'nav.states' },
      { id: 'propriedades', labelKey: 'nav.props'  },
      { id: 'tokens',       labelKey: 'nav.tokens' },
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
    'importacao', 'estados', 'propriedades', 'tokens',
    'acessibilidade', 'relacionados', 'notas', 'analytics', 'testes',
  ] as const;
  type SectionId = typeof sectionOrder[number];

  const sectionEls: Record<SectionId, HTMLElement> = {} as Record<SectionId, HTMLElement>;

  function buildSection(id: SectionId): HTMLElement {
    const block = (
      name: ContextBreakdownCase,
      labels: ContextBreakdownLabels = contextBreakdownLabels(),
    ) => createContextBreakdown({ parts: partsOf(name), labels });

    const custom = (parts: ContextPart[]) =>
      createContextBreakdown({ parts, labels: contextBreakdownLabels() });

    switch (id) {
      case 'demonstracao':
        return createDocsDemonstration({
          title: t('demonstration.title'),
          componentSlug: 'context-breakdown',
          demoFactory: () => {
            const stack = document.createElement('div');
            stack.className = 'nds-stack nds-w-full';
            stack.dataset.spacing = 'lg';
            const examples = [
              example('demonstration.labels.typical', () => block('typical')),
              example('demonstration.labels.sliver',  () => block('sliver')),
              example('demonstration.labels.single',  () => block('single')),
              example('demonstration.labels.empty',   () => block('empty')),
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
            items: ['title', 'part', 'unit'].map(k => ({
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
              // A MESMA repartição nos dois lados: o que muda é só a ordem.
              doPreviewFactory: () => block('typical'),
              // O contraexemplo: ordenada por peso. Parece uma gentileza e é o
              // contrário — a legenda se lê por posição, e a linha de cada
              // origem passa a mudar de lugar a cada turno.
              dontPreviewFactory: () =>
                custom([...partsOf('typical')].sort((a, b) => b.tokens - a.tokens)),
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair2.do')),
              dontCaption: toPlainText(t('doDont.pair2.dont')),
              doPreviewFactory: () => block('single'),
              // O contraexemplo: as parcelas zeradas retiradas. A tela fica mais
              // limpa e a cor de cada linha passa a apontar para a fatia da
              // vizinha — que é o pior defeito possível aqui, porque continua
              // parecendo certo.
              dontPreviewFactory: () =>
                custom(partsOf('single').filter(part => part.tokens > 0)),
            },
          ],
        });

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          description: t('import.basic'),
          code: t('import.basicCode'),
          secondaryDescription: t('import.withLabels'),
          secondaryCode: t('import.withLabelsCode'),
        });

      case 'estados':
        return createDocsStates({
          title: t('states.title'),
          cols: {
            state: t('states.cols.state'),
            trigger: t('states.cols.trigger'),
            behavior: t('states.cols.behavior'),
          },
          // Nenhum destes é um estado que a peça guarda: são os quatro casos em
          // que o desenho sozinho falharia, e o texto responde.
          items: ['sliver', 'single', 'empty', 'unlabeled'].map(k => ({
            label: t(`states.${k}.label`),
            trigger: toPlainText(t(`states.${k}.trigger`)),
            behavior: toPlainText(t(`states.${k}.behavior`)),
          })),
        });

      case 'propriedades': {
        const interfaceCode = `export interface ContextBreakdownLabels {
  title: string;                   // o que está sendo repartido, na tela
  unit: string;                    // o que está sendo contado
  parts: Record<string, string>;   // a palavra de cada origem, por endereço
}

// O dado vem de \`@shared/primitives/token-budget\`. O \`id\` é ENDEREÇO, e não
// texto de tela: a palavra que se lê é interface e tem três idiomas.
interface ContextPart {
  id: string;
  tokens: number;
}

// A conta vem do mesmo módulo, e é ela que guarda a ordem, a parcela zerada e
// as travas do número que se lê em voz:
interface ContextSlice {
  id: string;
  tokens: number;
  fraction: number;   // sobre o TOTAL REPARTIDO, nunca sobre um teto
  percent: number;    // o mesmo peso em inteiro, e este número é TEXTO
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
              title: 'createContextBreakdown',
              cols,
              items: ['parts', 'labels'].map(k => ({
                name: t(`props.table.${k}.name`),
                type: t(`props.table.${k}.type`),
                defaultValue: t(`props.table.${k}.default`),
                required: t(`props.table.${k}.required`),
                description: toPlainText(t(`props.table.${k}.description`)),
              })),
            },
            {
              title: 'ContextBreakdownLabels',
              cols,
              items: ['labelsTitle', 'labelsUnit', 'labelsParts'].map(k => ({
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
            'textLabel', 'mutedForeground', 'foreground', 'fontWeightMedium',
            'muted', 'spacing1', 'spacing2', 'spacing10', 'radiusFull',
            ...CHART_ROWS,
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
          // Uma linha só, e é honesto: não há controle nesta peça. Listar Enter
          // e setas para dizer que não fazem nada seria encher a tabela com
          // ausências.
          keyboardItems: [
            { key: 'Tab', description: t('accessibility.keyboard.tab') },
          ],
          screenReaderTitle: t('accessibility.screenReader.title'),
          screenReaderItems: screenReaderItems(),
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: t('related.items.contextDisplay.name'), description: toPlainText(t('related.items.contextDisplay.description')), path: '?path=/docs/primitives-conversational-contextdisplay--docs' },
            { name: t('related.items.chatThread.name'),     description: toPlainText(t('related.items.chatThread.description')),     path: '?path=/docs/primitives-conversational-chatthread--docs'     },
            { name: t('related.items.chart.name'),          description: toPlainText(t('related.items.chart.description')),          path: '?path=/docs/primitives-display-chart--docs'                  },
            { name: t('related.items.progress.name'),       description: toPlainText(t('related.items.progress.description')),       path: '?path=/docs/primitives-feedback-progress--docs'              },
          ],
        });

      case 'notas':
        return createDocsNotes({
          title: t('notes.title'),
          componentSlug: 'context-breakdown',
          items: [1, 2, 3, 4, 5, 6, 7].map(i => ({ title: '', content: t(`notes.item${i}`) })),
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
            items: [1, 2, 3, 4, 5, 6, 7, 8].map(i => ({
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
            items: [1, 2, 3, 4, 5].map(i => ({
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
            items: [1, 2, 3, 4, 5, 6, 7].map(i => ({
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
        component_name: 'context-breakdown',
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
