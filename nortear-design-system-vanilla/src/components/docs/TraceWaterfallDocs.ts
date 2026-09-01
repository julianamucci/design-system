import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { createTraceWaterfall } from '@/components/ui/trace-waterfall';
import { createSeparator } from '@/components/ui/separator';
import {
  WIDE_TOTAL_MS,
  traceWaterfallLabels,
  wideTraceSpans,
} from '@/components/ui/trace-waterfall.fixtures';
import {
  TOOL_CALL_STATES,
  type RunStatus,
  type TraceSpan,
} from '@shared/primitives/chat-protocol';
import {
  TRACE_SPANS_FAILURE,
  TRACE_SPANS_ORDER,
  TRACE_SPANS_PARTIAL,
  TRACE_TOTAL_MS,
} from '@shared/primitives/trace-waterfall-examples';
import uiTranslations from '@/i18n/ui.json';
import traceWaterfallTranslations from '@shared/content/trace-waterfall/translations.json';

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
  traceWaterfallTranslations as Record<string, unknown>,
);

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria. O
// `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
function screenReaderItems(): string[] {
  const locale = getLocale();
  return Object.entries(
    (traceWaterfallTranslations as unknown as Record<
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
 * Uma cascata, rotulada.
 *
 * A legenda diz QUAL caso está desenhado — sem ela, quatro réguas empilhadas
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

// ─── createTraceWaterfallDocs ─────────────────────────────────────────────────

export function createTraceWaterfallDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'trace-waterfall',
    });
    track('docs_page_view', {
      component_name: 'trace-waterfall',
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
      spans: readonly TraceSpan[],
      totalMs: number = TRACE_TOTAL_MS,
      status: RunStatus = 'running',
    ) => createTraceWaterfall({ spans, totalMs, status, labels: traceWaterfallLabels() });

    switch (id) {
      case 'demonstracao':
        return createDocsDemonstration({
          title: t('demonstration.title'),
          componentSlug: 'trace-waterfall',
          demoFactory: () => {
            const stack = document.createElement('div');
            stack.className = 'nds-stack nds-w-full';
            stack.dataset.spacing = 'lg';
            const examples = [
              example('demonstration.labels.order',   () => piece(TRACE_SPANS_ORDER)),
              example('demonstration.labels.failure', () => piece(TRACE_SPANS_FAILURE, TRACE_TOTAL_MS, 'failed')),
              example('demonstration.labels.partial', () => piece(TRACE_SPANS_PARTIAL)),
              example('demonstration.labels.wide',    () => {
                const wrap = document.createElement('div');
                wrap.className = 'nds-max-w-md';
                const wide = piece(wideTraceSpans(), WIDE_TOTAL_MS);
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
            items: ['region', 'label', 'axis', 'reading'].map(k => ({
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
              doPreviewFactory: () => stackOf(piece(TRACE_SPANS_ORDER)),
              // O contraexemplo é montado À MÃO, e tem de ser: a peça sempre
              // escreve a leitura de cada linha, então não há argumento que
              // produza o erro. Aqui a frase é removida, e sobra a barra — que é
              // exatamente o que não chega a quem lê de ouvido.
              dontPreviewFactory: () => {
                const wrong = piece(TRACE_SPANS_ORDER);
                wrong
                  ?.querySelectorAll('[data-slot="trace-waterfall-row-reading"]')
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
                const wide = piece(wideTraceSpans(), WIDE_TOTAL_MS);
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
                const wrong = piece(wideTraceSpans(), WIDE_TOTAL_MS);
                const viewport = wrong?.querySelector<HTMLElement>(
                  '[data-slot="trace-waterfall-viewport"]',
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
          // A ordem sai de `TOOL_CALL_STATES`: a tabela e a story de estados
          // leem a mesma lista, e nenhuma das duas fica para trás quando o tipo
          // cresce.
          items: TOOL_CALL_STATES.map(k => ({
            label: t(`states.${k}.label`),
            trigger: toPlainText(t(`states.${k}.trigger`)),
            behavior: toPlainText(t(`states.${k}.behavior`)),
          })),
        });

      case 'propriedades': {
        const interfaceCode = `export interface TraceWaterfallLabels {
  region: string;    // o nome da camada que rola — obrigatório
  axis: string;      // molde visível da régua, com \`{total}\`
  duration: string;  // molde da duração visível, com \`{duration}\`
  reading: string;   // molde da leitura, com \`{start}\` e \`{duration}\`
  clipped: string;   // a frase do trecho que não coube no eixo
  state: Record<ToolCallState, string>;
}

// O trecho vem de \`@shared/primitives/chat-protocol\`. \`TraceSpan\` é o TERCEIRO
// tipo daquele arquivo que carrega geometria, e entra pelo mesmo critério dos
// dois primeiros: ser a origem única do que cinco stacks reescreveriam.
//
// O INTERVALO É PLANO, e não um tipo aninhado: os dois tipos de geometria que
// já moravam ali carregam as coordenadas soltas, e um tipo que embrulha dois
// campos para um consumidor só é indireção, não vocabulário.
interface TraceSpan {
  id: string;
  label: string;
  startMs: number;     // desde a origem do eixo
  durationMs: number;
  depth: number;       // recuo em degraus, relativo aos demais
  state: ToolCallState;
}

// O TOTAL NÃO MORA NO TRECHO: ele é propriedade do EIXO, e é ele que faz as
// barras dividirem uma régua só. Um total por trecho seriam N verdades sobre a
// mesma régua.

type ToolCallState = 'pending' | 'running' | 'done' | 'failed';`;

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
              title: 'createTraceWaterfall',
              cols,
              items: rows(['spans', 'totalMs', 'status', 'labels']),
            },
            {
              title: 'TraceWaterfallLabels',
              cols,
              items: rows([
                'labelsRegion', 'labelsAxis', 'labelsDuration',
                'labelsReading', 'labelsClipped', 'labelsState',
              ]),
            },
            {
              title: 'TraceSpan',
              cols,
              items: rows([
                'spanId', 'spanLabel', 'spanStart',
                'spanDuration', 'spanDepth', 'spanState',
              ]),
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
            'textLabel', 'spacing24', 'spacing40', 'spacing2', 'lineHeightNormal',
            'spacing3', 'border', 'radius', 'muted', 'ring', 'spacing4',
            'radiusFull', 'mutedForeground', 'foreground', 'background',
            'primary', 'primaryForeground', 'spacing1', 'success', 'destructive',
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
            { name: t('related.items.flowGraph.name'),     description: toPlainText(t('related.items.flowGraph.description')),     path: '?path=/docs/primitives-conversational-flowgraph--docs'     },
            { name: t('related.items.agentPlan.name'),     description: toPlainText(t('related.items.agentPlan.description')),     path: '?path=/docs/primitives-conversational-agentplan--docs'     },
            { name: t('related.items.messageTiming.name'), description: toPlainText(t('related.items.messageTiming.description')), path: '?path=/docs/primitives-conversational-messagetiming--docs' },
            { name: t('related.items.progress.name'),      description: toPlainText(t('related.items.progress.description')),      path: '?path=/docs/primitives-feedback-progress--docs'            },
          ],
        });

      case 'notas':
        return createDocsNotes({
          title: t('notes.title'),
          componentSlug: 'trace-waterfall',
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
        component_name: 'trace-waterfall',
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
