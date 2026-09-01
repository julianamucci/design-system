import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { createActivityGraph } from '@/components/ui/activity-graph';
import { createSeparator } from '@/components/ui/separator';
import {
  WIDE_END,
  WIDE_START,
  activityGraphLabels,
} from '@/components/ui/activity-graph.fixtures';
import type { ActivityDay, RunStatus } from '@shared/primitives/chat-protocol';
import {
  ACTIVITY_DAYS,
  ACTIVITY_DAYS_EMPTY,
  ACTIVITY_END,
  ACTIVITY_MONTH_END,
  ACTIVITY_MONTH_START,
  ACTIVITY_START,
  ACTIVITY_THRESHOLDS,
} from '@shared/primitives/activity-graph-examples';
import uiTranslations from '@/i18n/ui.json';
import activityGraphTranslations from '@shared/content/activity-graph/translations.json';

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
const { t, subscribe } = createTranslation(
  activityGraphTranslations as Record<string, unknown>,
);

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria. O
// `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
function screenReaderItems(): string[] {
  const locale = getLocale();
  return Object.entries(
    (activityGraphTranslations as unknown as Record<
      string,
      { accessibility?: { screenReader?: Record<string, string> } }
    >)[locale]?.accessibility?.screenReader ?? {},
  )
    .filter(([k]) => k !== 'title')
    .map(([, v]) => v);
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
 * Uma grade, rotulada.
 *
 * A legenda diz QUAL caso está desenhado — sem ela, quatro grades empilhadas
 * viram uma só, e o assunto da demonstração é justamente a diferença entre elas.
 */
function example(labelKey: string, build: () => HTMLElement | null) {
  const wrap = document.createElement('div');
  wrap.className = 'nds-stack nds-w-full';
  wrap.dataset.spacing = 'xs';

  const caption = document.createElement('div');
  caption.className = 'nds-text-caption nds-text-muted-foreground';
  caption.textContent = stripHtml(t(labelKey));

  wrap.appendChild(caption);
  const piece = build();
  if (piece) wrap.appendChild(piece);
  return wrap;
}

/** Uma pilha de peças, para o par do certo e errado. */
function stackOf(...pieces: (HTMLElement | null)[]): HTMLElement {
  const stack = document.createElement('div');
  stack.className = 'nds-stack nds-w-full';
  stack.dataset.spacing = 'lg';
  stack.append(...pieces.filter((p): p is HTMLElement => p !== null));
  return stack;
}

// ─── createActivityGraphDocs ──────────────────────────────────────────────────

export function createActivityGraphDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'activity-graph',
    });
    track('docs_page_view', {
      component_name: 'activity-graph',
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
    'importacao', 'estados', 'propriedades', 'tokens',
    'acessibilidade', 'relacionados', 'notas', 'analytics', 'testes',
  ] as const;
  type SectionId = typeof sectionOrder[number];

  const sectionEls: Record<SectionId, HTMLElement> = {} as Record<SectionId, HTMLElement>;

  function buildSection(id: SectionId): HTMLElement {
    const piece = (
      days: readonly ActivityDay[],
      start: string = ACTIVITY_START,
      end: string = ACTIVITY_END,
      status: RunStatus = 'complete',
    ) =>
      createActivityGraph({
        days,
        start,
        end,
        thresholds: ACTIVITY_THRESHOLDS,
        status,
        labels: activityGraphLabels(),
      });

    switch (id) {
      case 'demonstracao':
        return createDocsDemonstration({
          title: t('demonstration.title'),
          componentSlug: 'activity-graph',
          demoFactory: () => {
            const stack = document.createElement('div');
            stack.className = 'nds-stack nds-w-full';
            stack.dataset.spacing = 'lg';
            const examples = [
              example('demonstration.labels.quarter', () => piece(ACTIVITY_DAYS)),
              example('demonstration.labels.empty',   () => piece(ACTIVITY_DAYS_EMPTY)),
              example('demonstration.labels.month',   () => piece(ACTIVITY_DAYS, ACTIVITY_MONTH_START, ACTIVITY_MONTH_END)),
              example('demonstration.labels.wide',    () => {
                const wrap = document.createElement('div');
                wrap.className = 'nds-max-w-md';
                const wide = piece(ACTIVITY_DAYS, WIDE_START, WIDE_END);
                if (wide) wrap.appendChild(wide);
                return wrap;
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
            items: ['region', 'total', 'day', 'level'].map(k => ({
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
              doPreviewFactory: () =>
                stackOf(piece(ACTIVITY_DAYS, ACTIVITY_MONTH_START, ACTIVITY_MONTH_END)),
              // O contraexemplo é montado À MÃO, e tem de ser: a peça sempre
              // escreve a leitura de cada casa, então não há argumento que
              // produza o erro. Aqui a frase é removida, e sobra a tinta — que é
              // exatamente o que não chega a quem lê de ouvido.
              dontPreviewFactory: () => {
                const wrong = piece(ACTIVITY_DAYS, ACTIVITY_MONTH_START, ACTIVITY_MONTH_END);
                wrong
                  ?.querySelectorAll('[data-slot="activity-graph-day-reading"]')
                  .forEach((el) => el.remove());
                return stackOf(wrong);
              },
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair2.do')),
              dontCaption: toPlainText(t('doDont.pair2.dont')),
              doPreviewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'nds-max-w-md';
                const wide = piece(ACTIVITY_DAYS, WIDE_START, WIDE_END);
                if (wide) wrap.appendChild(wide);
                return stackOf(wrap);
              },
              // O errado é a camada que rola sem papel e sem nome: quem chega
              // ali por teclado para numa parada anônima. É o defeito que dois
              // componentes desta casa já tiveram, e o motivo pelo qual o papel
              // e o nome andam na mesma linha.
              dontPreviewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'nds-max-w-md';
                const wrong = piece(ACTIVITY_DAYS, WIDE_START, WIDE_END);
                const viewport = wrong?.querySelector<HTMLElement>(
                  '[data-slot="activity-graph-viewport"]',
                );
                viewport?.removeAttribute('role');
                viewport?.removeAttribute('aria-label');
                if (wrong) wrap.appendChild(wrong);
                return stackOf(wrap);
              },
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
          items: ['empty', 'low', 'high', 'busy'].map(k => ({
            label: t(`states.${k}.label`),
            trigger: toPlainText(t(`states.${k}.trigger`)),
            behavior: toPlainText(t(`states.${k}.behavior`)),
          })),
        });

      case 'propriedades': {
        const interfaceCode = `export interface ActivityGraphLabels {
  region: string;                     // o nome da camada que rola — obrigatório
  total: string;                      // molde com \`{count}\`, \`{start}\` e \`{end}\`
  dateFormat: string;                 // molde com \`{day}\`, \`{month}\` e \`{year}\`
  monthsShort: readonly string[];     // 12, para os rótulos de coluna
  monthsLong: readonly string[];      // 12, para a frase de cada casa
  weekdaysShort: readonly string[];   // 7, começando no domingo
  none: string;                       // a frase do dia sem atividade
  one: string;                        // molde com \`{count}\`, \`{date}\` e \`{level}\`
  many: string;
  levels: readonly string[];          // uma palavra a mais que os degraus
  legendLess: string;
  legendMore: string;
}

// O dia vem de \`@shared/primitives/chat-protocol\`, e é o único tipo daquele
// arquivo desta família que NÃO carrega geometria: a casa em que ele cai não é
// declarada, ela se DEDUZ da data e da janela.
interface ActivityDay {
  date: string;   // ano-mês-dia, um dia civil sem hora e sem fuso
  count: number;  // dias repetidos SOMAM
}

// A JANELA E A ESCALA SÃO DADO, e são o que separa esta peça de um mapa de calor
// de janela fixa: nada aqui olha o relógio, e a escala não se deriva do maior
// valor — derivada, a mesma contagem pintaria diferente em duas grades.`;

        const cols = {
          prop: t('props.table.prop'),
          type: t('props.table.type'),
          default: t('props.table.default'),
          required: t('props.table.required'),
          description: t('props.table.description'),
        };

        const rows = (keys: string[]) =>
          keys.map(k => ({
            name: t(`props.table.${k}.name`),
            type: t(`props.table.${k}.type`),
            defaultValue: t(`props.table.${k}.default`),
            required: t(`props.table.${k}.required`),
            description: toPlainText(t(`props.table.${k}.description`)),
          }));

        return createDocsProps({
          title: t('props.title'),
          tables: [
            {
              title: 'createActivityGraph',
              cols,
              items: rows(['days', 'start', 'end', 'thresholds', 'weekStart', 'status', 'labels']),
            },
            {
              title: 'ActivityGraphLabels',
              cols,
              items: rows([
                'labelsRegion', 'labelsTotal', 'labelsDateFormat',
                'labelsMonthsShort', 'labelsMonthsLong', 'labelsWeekdaysShort',
                'labelsNone', 'labelsOne', 'labelsMany',
                'labelsLevels', 'labelsLegendLess', 'labelsLegendMore',
              ]),
            },
            {
              title: 'ActivityDay',
              cols,
              items: rows(['dayDate', 'dayCount']),
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
            'textLabel', 'spacing3', 'spacing05', 'spacing2', 'mutedForeground',
            'lineHeightNormal', 'spacing3Viewport', 'border', 'radius', 'muted',
            'ring', 'spacing1', 'radiusXs', 'background', 'primary',
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
          items: [1, 2, 3, 4, 5, 6, 7, 8].map(i => t(`accessibility.items.item${i}`)),
          keyboardTitle: t('accessibility.keyboard.title'),
          keyboardItems: [
            { key: 'Tab',   description: t('accessibility.keyboard.tab') },
            { key: 'Enter', description: t('accessibility.keyboard.enter') },
            { key: '← →',   description: t('accessibility.keyboard.arrows') },
          ],
          screenReaderTitle: t('accessibility.screenReader.title'),
          screenReaderItems: screenReaderItems(),
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: t('related.items.chart.name'),          description: toPlainText(t('related.items.chart.description')),          path: '?path=/docs/primitives-display-chart--docs'                 },
            { name: t('related.items.calendar.name'),       description: toPlainText(t('related.items.calendar.description')),       path: '?path=/docs/primitives-form-calendar--docs'                 },
            { name: t('related.items.traceWaterfall.name'), description: toPlainText(t('related.items.traceWaterfall.description')), path: '?path=/docs/primitives-conversational-tracewaterfall--docs' },
            { name: t('related.items.jobProgress.name'),    description: toPlainText(t('related.items.jobProgress.description')),    path: '?path=/docs/primitives-conversational-jobprogress--docs'    },
          ],
        });

      case 'notas':
        return createDocsNotes({
          title: t('notes.title'),
          componentSlug: 'activity-graph',
          items: [1, 2, 3, 4, 5, 6, 7, 8].map(i => ({ title: '', content: t(`notes.item${i}`) })),
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
            items: [1, 2, 3, 4, 5, 6, 7].map(i => ({
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
            items: [1, 2, 3, 4, 5, 6, 7, 8].map(i => ({
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
        component_name: 'activity-graph',
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
