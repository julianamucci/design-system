import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { createQuotaBanner } from '@/components/ui/quota-banner';
import { createSeparator } from '@/components/ui/separator';
import {
  quotaBannerAction,
  quotaBannerLabels,
  quotaOf,
  renewalOf,
  type QuotaBannerCase,
} from '@/components/ui/quota-banner.fixtures';
import uiTranslations from '@/i18n/ui.json';
import quotaTranslations from '@shared/content/quota-banner/translations.json';

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
const { t, subscribe } = createTranslation(quotaTranslations as Record<string, unknown>);

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria. O
// `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
function screenReaderItems(): string[] {
  const locale = getLocale();
  const raw = (quotaTranslations as unknown as Record<
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
 * Uma faixa, rotulada.
 *
 * A legenda diz QUAL exemplo está desenhado — sem ela, quatro caixas empilhadas
 * viram uma só, e o assunto da demonstração é justamente a diferença entre
 * elas.
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

// ─── createQuotaBannerDocs ────────────────────────────────────────────────────

export function createQuotaBannerDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'quota-banner',
    });
    track('docs_page_view', {
      component_name: 'quota-banner',
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
    /**
     * A faixa daquele exemplo, com o horizonte já escrito quando ele existe.
     *
     * O controle entra só onde ele muda alguma coisa — a cota esgotada —, e é
     * de propósito: repeti-lo nas quatro faria a demonstração parecer que a
     * faixa nasce com um botão, quando o botão é de quem a monta.
     */
    const banner = (name: QuotaBannerCase, actions?: HTMLElement[]) =>
      createQuotaBanner({
        quota: quotaOf(name),
        renewsIn: renewalOf(name),
        actions,
        labels: quotaBannerLabels(),
      });

    switch (id) {
      case 'demonstracao':
        return createDocsDemonstration({
          title: t('demonstration.title'),
          componentSlug: 'quota-banner',
          demoFactory: () => {
            const stack = document.createElement('div');
            stack.className = 'nds-stack nds-w-full';
            stack.dataset.spacing = 'lg';
            const examples = [
              example('demonstration.labels.normal',    () => banner('normal')),
              example('demonstration.labels.threshold', () => banner('threshold')),
              example('demonstration.labels.exhausted', () => banner('exhausted', [quotaBannerAction()])),
              example('demonstration.labels.noRenewal', () => banner('noRenewal')),
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
          items: [1, 2, 3, 4, 5, 6].map(i => t(`anatomy.item${i}`)),
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
            items: ['title', 'unit', 'left', 'exhausted'].map(k => ({
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
              // O MESMO uso nos dois lados: o que muda é o horizonte chegar.
              doPreviewFactory: () => banner('warning'),
              // O contraexemplo: a cota renova, mas o horizonte não é passado.
              // A faixa só pode dizer que está no fim, e esperar vira aposta —
              // sem que nada pareça errado na tela.
              dontPreviewFactory: () =>
                createQuotaBanner({ quota: quotaOf('warning'), labels: quotaBannerLabels() }),
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair2.do')),
              dontCaption: toPlainText(t('doDont.pair2.dont')),
              doPreviewFactory: () => banner('warning'),
              // O contraexemplo: o horizonte escrito à mão. Ponto decimal,
              // unidade por extenso e nenhuma das duas trocando com o idioma de
              // quem lê — que é exatamente o que a peça não tem como consertar.
              dontPreviewFactory: () =>
                createQuotaBanner({
                  quota: quotaOf('warning'),
                  renewsIn: '3.2 hours',
                  labels: quotaBannerLabels(),
                }),
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
          // Nenhum destes é um estado que a peça guarda: são as cinco respostas
          // que a mesma faixa dá conforme o que a conta devolve.
          items: ['normal', 'warning', 'critical', 'exhausted', 'noRenewal'].map(k => ({
            label: t(`states.${k}.label`),
            trigger: toPlainText(t(`states.${k}.trigger`)),
            behavior: toPlainText(t(`states.${k}.behavior`)),
          })),
        });

      case 'propriedades': {
        const interfaceCode = `export interface QuotaBannerOptions {
  quota: QuotaAllowance;      // o uso e o teto
  renewsIn?: string;          // quando renova, JÁ ESCRITO; ausente é "não renova"
  actions?: HTMLElement[];    // os controles, prontos de quem consome
  labels: QuotaBannerLabels;
}

// O teto é OBRIGATÓRIO aqui, ao contrário das medições irmãs: a cota É o teto,
// e "quanto ainda resta" não tem resposta sem ele. Quem não tem teto não monta
// a faixa.
export interface QuotaAllowance {
  used: number;               // quanto já foi usado
  limit: number;              // o teto da cota
}

export interface QuotaBannerLabels {
  title: string;                      // de qual cota se trata; só para quem ouve
  unit: string;                       // o que está sendo contado
  left: string;                       // a palavra que acompanha o resto
  exhausted: string;                  // o que dizer quando não sobra nada
  renews: string;                     // a palavra que antecede o horizonte
  of: string;                         // liga o usado ao teto na razão
  level: Record<BudgetLevel, string>; // a palavra de cada nível
}

// A conta vem de \`@shared/primitives/token-budget\`, e é a MESMA que as outras
// medições leem — é isso que faz a palavra do nível querer dizer o mesmo em
// todas elas:
//   remainingUnits(uso, teto)    // o resto, nunca negativo
//   spentFraction(uso, teto)     // de 0 a 1, ou \`null\` quando o teto não é teto
//   fractionLevel(fracao)        // 'normal' | 'warning' | 'critical'
//   fractionPercent(fracao)      // inteiro travado nas duas pontas`;

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
              title: 'createQuotaBanner',
              cols,
              items: rows(['quota', 'renewsIn', 'actions', 'labels']),
            },
            { title: 'QuotaAllowance', cols, items: rows(['quotaUsed', 'quotaLimit']) },
            {
              title: 'QuotaBannerLabels',
              cols,
              items: rows([
                'labelsTitle', 'labelsUnit', 'labelsLeft', 'labelsExhausted',
                'labelsRenews', 'labelsOf', 'labelsLevel',
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
            'textLabel', 'mutedForeground', 'foreground', 'fontWeightMedium',
            'primary', 'warning', 'destructive', 'muted',
            'spacing2', 'spacing3', 'spacing6', 'radius', 'radiusFull',
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
          items: [1, 2, 3, 4, 5, 6, 7].map(i => t(`accessibility.items.item${i}`)),
          keyboardTitle: t('accessibility.keyboard.title'),
          // Duas linhas, e as duas são honestas: a faixa em si não tem
          // controle, mas os controles que chegam de fora entram na ordem de
          // foco — e é aí que o teclado tem o que fazer.
          keyboardItems: [
            { key: 'Tab', description: t('accessibility.keyboard.tab') },
            { key: 'Enter', description: t('accessibility.keyboard.enter') },
          ],
          screenReaderTitle: t('accessibility.screenReader.title'),
          screenReaderItems: screenReaderItems(),
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: t('related.items.contextDisplay.name'), description: toPlainText(t('related.items.contextDisplay.description')), path: '?path=/docs/components-conversational-contextdisplay--docs' },
            { name: t('related.items.costMeter.name'),      description: toPlainText(t('related.items.costMeter.description')),      path: '?path=/docs/components-conversational-costmeter--docs'      },
            { name: t('related.items.alert.name'),          description: toPlainText(t('related.items.alert.description')),          path: '?path=/docs/components-feedback-alert--docs'                },
            { name: t('related.items.progress.name'),       description: toPlainText(t('related.items.progress.description')),       path: '?path=/docs/components-feedback-progress--docs'             },
          ],
        });

      case 'notas':
        return createDocsNotes({
          title: t('notes.title'),
          componentSlug: 'quota-banner',
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
        component_name: 'quota-banner',
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
