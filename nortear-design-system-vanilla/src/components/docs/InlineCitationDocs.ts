import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { createInlineCitation } from '@/components/ui/inline-citation';
import { createSeparator } from '@/components/ui/separator';
import {
  citationOf,
  inlineCitationLabels,
  sentenceCitations,
  sentenceParts,
  type InlineCitationCase,
} from '@/components/ui/inline-citation.fixtures';
import uiTranslations from '@/i18n/ui.json';
import inlineCitationTranslations from '@shared/content/inline-citation/translations.json';

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
const { t, subscribe } = createTranslation(inlineCitationTranslations as Record<string, unknown>);

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria. O
// `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
function screenReaderItems(): string[] {
  const locale = getLocale();
  const raw = (inlineCitationTranslations as unknown as Record<
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
 * Uma frase com uma marca, que é a única forma em que esta peça existe.
 *
 * A frase é montada AQUI, e não pelo componente: é a demonstração do contrato —
 * quem escreve a frase decide onde a afirmação precisa de apoio. Nenhum pedaço
 * termina em espaço, e é isso que mantém a marca colada à palavra na quebra de
 * linha.
 */
function citationSentence(name: InlineCitationCase, open: boolean): HTMLElement {
  const parts = sentenceParts();
  const citation = citationOf(name);

  const sentence = document.createElement('p');
  sentence.append(
    parts[0],
    createInlineCitation({
      citation,
      index: 1,
      defaultOpen: open,
      labels: inlineCitationLabels(1, citation),
    }),
    parts[1] + parts[2],
  );
  return sentence;
}

/** A frase com as DUAS marcas, cada uma com a própria numeração. */
function sentenceWithTwo(): HTMLElement {
  const parts = sentenceParts();
  const citations = sentenceCitations();

  const sentence = document.createElement('p');
  sentence.append(parts[0]);
  citations.forEach((citation, i) => {
    sentence.append(
      createInlineCitation({
        citation,
        index: i + 1,
        labels: inlineCitationLabels(i + 1, citation),
      }),
      parts[i + 1],
    );
  });
  return sentence;
}

/**
 * Uma frase, rotulada.
 *
 * A legenda diz QUAL exemplo está desenhado — sem ela, quatro frases quase
 * iguais viram uma só, e o assunto da demonstração é justamente a diferença
 * entre elas.
 *
 * `reserve` dá altura ao exemplo cuja prévia nasce aberta: a caixa é posicionada
 * fora do fluxo, então sem folga ela cobriria a legenda do exemplo seguinte.
 */
function example(labelKey: string, build: () => HTMLElement, reserve = false) {
  const wrap = document.createElement('div');
  wrap.className = 'nds-stack nds-w-full';
  wrap.dataset.spacing = 'xs';

  const caption = document.createElement('div');
  caption.className = 'nds-text-caption nds-text-muted-foreground';
  caption.textContent = stripHtml(t(labelKey));

  const body = document.createElement('div');
  if (reserve) body.className = 'nds-min-h-50';
  body.appendChild(build());

  wrap.append(caption, body);
  return wrap;
}

// ─── createInlineCitationDocs ─────────────────────────────────────────────────

export function createInlineCitationDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'inline-citation',
    });
    track('docs_page_view', {
      component_name: 'inline-citation',
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
    switch (id) {
      case 'demonstracao':
        return createDocsDemonstration({
          title: t('demonstration.title'),
          componentSlug: 'inline-citation',
          demoFactory: () => {
            const stack = document.createElement('div');
            stack.className = 'nds-stack nds-w-full';
            stack.dataset.spacing = 'lg';
            const examples = [
              // O primeiro é o único fechado, e é ele que mostra a peça como
              // ela vive: duas marcas dentro de uma frase, à espera de quem lê.
              example('demonstration.labels.inSentence', () => sentenceWithTwo()),
              example('demonstration.labels.open', () => citationSentence('full', true), true),
              example('demonstration.labels.minimal', () => citationSentence('minimal', true), true),
              example('demonstration.labels.unsafe', () => citationSentence('unsafe', true), true),
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
            items: [1, 2, 3, 4, 5, 6].map(i => t(`usage.guidelines.item${i}`)),
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
            items: ['marker', 'unsafeSource', 'sourceTitle', 'anchor'].map(k => ({
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
              // A MESMA citação nos dois lados: o que muda é o nome acessível.
              doPreviewFactory: () => citationSentence('full', false),
              // O contraexemplo: o nome acessível é o número. Quem vê não nota
              // diferença nenhuma, e é esse o ponto.
              dontPreviewFactory: () => {
                const citation = citationOf('full');
                const parts = sentenceParts();
                const sentence = document.createElement('p');
                sentence.append(
                  parts[0],
                  createInlineCitation({
                    citation,
                    index: 1,
                    labels: { marker: '1', unsafeSource: t('labels.unsafeSource') },
                  }),
                  parts[1] + parts[2],
                );
                return sentence;
              },
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair2.do')),
              dontCaption: toPlainText(t('doDont.pair2.dont')),
              doPreviewFactory: () => citationSentence('minimal', true),
              // O contraexemplo: um traço no lugar do trecho que não veio. A
              // prévia passa a afirmar que existe um trecho vazio.
              dontPreviewFactory: () => {
                const plain = citationOf('minimal');
                const parts = sentenceParts();
                const sentence = document.createElement('p');
                sentence.append(
                  parts[0],
                  createInlineCitation({
                    citation: { source: plain.source, excerpt: '—', anchor: '—' },
                    index: 1,
                    defaultOpen: true,
                    labels: inlineCitationLabels(1, plain),
                  }),
                  parts[1] + parts[2],
                );
                return sentence;
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
          // Só os dois primeiros são estados que a peça guarda — recolhida e
          // expandida. Os outros dois são o que a mesma prévia faz conforme o
          // que a citação trouxe.
          items: ['closed', 'open', 'minimal', 'unsafe'].map(k => ({
            label: t(`states.${k}.label`),
            trigger: toPlainText(t(`states.${k}.trigger`)),
            behavior: toPlainText(t(`states.${k}.behavior`)),
          })),
        });

      case 'propriedades': {
        const interfaceCode = `export interface InlineCitationOptions {
  citation: Citation;                    // a fonte, o trecho e onde dentro dela
  index: number;                         // o número que a marca mostra
  defaultOpen?: boolean;                 // nasce com a prévia aberta
  onOpenChange?: (open: boolean) => void;
  labels: InlineCitationLabels;
}

// O VOCABULÁRIO NÃO É DAQUI. \`Citation\` e \`ChatSource\` vêm de
// \`@shared/primitives/chat-protocol\`, e é lá que está escrito por que o trecho
// mora na CITAÇÃO e não na fonte: a mesma fonte apoia afirmações diferentes.
export interface Citation {
  source: ChatSource;         // o documento
  excerpt?: string;           // o texto citado, como saiu da fonte
  anchor?: string;            // onde dentro dele — página, âncora, linhas
}

export interface InlineCitationLabels {
  marker: string;             // o nome acessível, já escrito, com o número dentro
  unsafeSource: string;       // o que se diz no lugar de um endereço recusado
}

// A MARCA É CONTROLÁVEL, e o comando é o que resolve a exclusão mútua entre
// duas prévias — a peça não conhece as vizinhas, e não conhecê-las é o que
// permite que duas marcas da mesma frase venham de lugares diferentes.
export type InlineCitationElement = HTMLElement & {
  open: () => void;
  close: () => void;
  toggle: () => void;
  isOpen: () => boolean;
};`;

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
              title: 'createInlineCitation',
              cols,
              items: rows(['citation', 'index', 'defaultOpen', 'onOpenChange', 'labels']),
            },
            {
              title: 'Citation',
              cols,
              items: rows(['citationSource', 'citationExcerpt', 'citationAnchor']),
            },
            { title: 'ChatSource', cols, items: rows(['sourceTitle', 'sourceUrl']) },
            {
              title: 'InlineCitationLabels',
              cols,
              items: rows(['labelsMarker', 'labelsUnsafeSource']),
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
            'muted', 'foreground', 'primary', 'primaryForeground', 'ring',
            'sizeXs', 'radiusSm', 'textLabel',
            'textControlSm', 'spacing2', 'mutedForeground', 'border',
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
            { key: 'Tab', description: t('accessibility.keyboard.tab') },
            { key: 'Enter / Space', description: t('accessibility.keyboard.enter') },
            { key: 'Escape', description: t('accessibility.keyboard.escape') },
          ],
          screenReaderTitle: t('accessibility.screenReader.title'),
          screenReaderItems: screenReaderItems(),
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: t('related.items.chatThread.name'), description: toPlainText(t('related.items.chatThread.description')), path: '?path=/docs/primitives-conversational-chatthread--docs' },
            { name: t('related.items.hoverCard.name'), description: toPlainText(t('related.items.hoverCard.description')), path: '?path=/docs/primitives-overlay-hovercard--docs'       },
            { name: t('related.items.popover.name'),   description: toPlainText(t('related.items.popover.description')),   path: '?path=/docs/primitives-overlay-popover--docs'         },
            { name: t('related.items.tooltip.name'),   description: toPlainText(t('related.items.tooltip.description')),   path: '?path=/docs/primitives-overlay-tooltip--docs'         },
          ],
        });

      case 'notas':
        return createDocsNotes({
          title: t('notes.title'),
          componentSlug: 'inline-citation',
          items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => ({ title: '', content: t(`notes.item${i}`) })),
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
        component_name: 'inline-citation',
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
