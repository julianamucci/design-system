import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { createTerminalBlock, type TerminalBlockLabels } from '@/components/ui/terminal-block';
import { createSeparator } from '@/components/ui/separator';
import {
  exitCodeFor,
  linesFor,
  terminalBlockLabels,
} from '@/components/ui/terminal-block.fixtures';
import { RUN_STATUSES, type RunStatus } from '@shared/primitives/chat-protocol';
import { TERMINAL_COMMAND } from '@shared/primitives/terminal-block-examples';
import uiTranslations from '@/i18n/ui.json';
import terminalTranslations from '@shared/content/terminal-block/translations.json';

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
const { t, subscribe } = createTranslation(terminalTranslations as Record<string, unknown>);

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria. O
// `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
function screenReaderItems(): string[] {
  const locale = getLocale();
  const raw = (terminalTranslations as unknown as Record<
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
 * Um bloco de terminal, rotulado.
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

/** Uma pilha de peças, para o par do certo e errado. */
function stackOf(...pieces: HTMLElement[]): HTMLElement {
  const stack = document.createElement('div');
  stack.className = 'nds-stack nds-w-full';
  stack.dataset.spacing = 'lg';
  stack.append(...pieces);
  return stack;
}

// ─── createTerminalBlockDocs ──────────────────────────────────────────────────

export function createTerminalBlockDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'terminal-block',
    });
    track('docs_page_view', {
      component_name: 'terminal-block',
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
    // A saída de exemplo ACOMPANHA o estado, e é o vocabulário compartilhado
    // que decide o resto: se há cursor, se a peça se declara ocupada e se o
    // código de saída já existe.
    const piece = (
      status: RunStatus,
      lines: readonly string[] = linesFor(status),
      labels: TerminalBlockLabels = terminalBlockLabels(),
    ) =>
      createTerminalBlock({
        command: TERMINAL_COMMAND,
        lines,
        status,
        exitCode: exitCodeFor(status),
        labels,
      });

    switch (id) {
      case 'demonstracao':
        return createDocsDemonstration({
          title: t('demonstration.title'),
          componentSlug: 'terminal-block',
          demoFactory: () => {
            const stack = document.createElement('div');
            stack.className = 'nds-stack nds-w-full';
            stack.dataset.spacing = 'lg';
            const examples = [
              example('demonstration.labels.running',       () => piece('running')),
              example('demonstration.labels.complete',      () => piece('complete')),
              example('demonstration.labels.failed',        () => piece('failed')),
              example('demonstration.labels.withoutOutput', () => piece('complete', [])),
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
            items: ['command', 'output', 'status', 'exitCode'].map(k => ({
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
              doPreviewFactory: () => stackOf(piece('complete')),
              // O contraexemplo é montado À MÃO, e tem de ser: a peça preserva
              // o espaçamento por construção, então não há argumento que
              // produza o erro. Aqui a caixa passa a quebrar a linha, e a
              // tabela que alinhava os números vira um parágrafo.
              dontPreviewFactory: () => {
                const wrong = piece('complete');
                const output = wrong.querySelector<HTMLElement>(
                  '[data-slot="terminal-block-output"]',
                )!;
                // Mecânico, e não valor de desenho: o que se está mostrando é
                // o efeito de trocar o modo de quebra, e ele não tem token.
                output.style.whiteSpace = 'pre-wrap';
                output.style.overflowX = 'hidden';
                return stackOf(wrong);
              },
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair2.do')),
              dontCaption: toPlainText(t('doDont.pair2.dont')),
              // O par é o MESMO par de estados, e os dois pontos são o que se
              // vê: o que muda é se a palavra chega a quem não distingue verde
              // de vermelho.
              doPreviewFactory: () => stackOf(piece('complete'), piece('failed')),
              dontPreviewFactory: () => {
                const mute: TerminalBlockLabels = {
                  ...terminalBlockLabels(),
                  status: RUN_STATUSES.reduce((acc, status) => {
                    acc[status] = '';
                    return acc;
                  }, {} as Record<RunStatus, string>),
                };
                return stackOf(
                  piece('complete', linesFor('complete'), mute),
                  piece('failed', linesFor('failed'), mute),
                );
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
          // A ordem sai de `RUN_STATUSES`: a tabela e a story de estados leem a
          // mesma lista, e nenhuma das duas fica para trás quando o tipo cresce.
          items: RUN_STATUSES.map(k => ({
            label: t(`states.${k}.label`),
            trigger: toPlainText(t(`states.${k}.trigger`)),
            behavior: toPlainText(t(`states.${k}.behavior`)),
          })),
        });

      case 'propriedades': {
        const interfaceCode = `export interface TerminalBlockLabels {
  status: Record<RunStatus, string>;   // a palavra de cada estado
  exitCode: string;                    // molde com \`{code}\`
}

// O estado vem de \`@shared/primitives/chat-protocol\`, e serve inteiro: um
// comando fica na fila, corre, é interrompido, termina ou quebra. O
// interrompido daqui é o Ctrl-C — escolha de pessoa, e não falha de máquina.
type RunStatus = 'idle' | 'running' | 'stopped' | 'complete' | 'failed';

// É ela que decide se já existe código de saída para mostrar. Mora no
// vocabulário, e não na tela, porque a resposta tem de ser a mesma nas cinco
// stacks — e a que discordaria é a do comando interrompido.
declare function isRunFinished(status: RunStatus): boolean;`;

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
              title: 'createTerminalBlock',
              cols,
              items: ['command', 'lines', 'status', 'exitCode', 'labels'].map(k => ({
                name: t(`props.table.${k}.name`),
                type: t(`props.table.${k}.type`),
                defaultValue: t(`props.table.${k}.default`),
                required: t(`props.table.${k}.required`),
                description: toPlainText(t(`props.table.${k}.description`)),
              })),
            },
            {
              title: 'TerminalBlockLabels',
              cols,
              items: ['labelsStatus', 'labelsExitCode'].map(k => ({
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
            'textLabel', 'spacing2', 'spacing3', 'muted', 'border', 'radius', 'radiusSm',
            'mutedForeground', 'foreground', 'fontWeightMedium', 'ring', 'durationStately',
            'primary', 'success', 'destructive',
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
            { key: '↑ ↓',   description: t('accessibility.keyboard.arrows') },
          ],
          screenReaderTitle: t('accessibility.screenReader.title'),
          screenReaderItems: screenReaderItems(),
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: t('related.items.codeBlock.name'),   description: toPlainText(t('related.items.codeBlock.description')),   path: '?path=/docs/primitives-display-codeblock--docs'           },
            { name: t('related.items.agentStatus.name'), description: toPlainText(t('related.items.agentStatus.description')), path: '?path=/docs/primitives-conversational-agentstatus--docs' },
            { name: t('related.items.toolGroup.name'),   description: toPlainText(t('related.items.toolGroup.description')),   path: '?path=/docs/primitives-conversational-toolgroup--docs'   },
            { name: t('related.items.jobProgress.name'), description: toPlainText(t('related.items.jobProgress.description')), path: '?path=/docs/primitives-conversational-jobprogress--docs' },
          ],
        });

      case 'notas':
        return createDocsNotes({
          title: t('notes.title'),
          componentSlug: 'terminal-block',
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
            items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => ({
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
            items: [1, 2, 3, 4, 5, 6, 7, 8].map(i => ({
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
            items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => ({
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
        component_name: 'terminal-block',
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
