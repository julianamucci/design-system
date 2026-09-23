import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import DOMPurify from 'dompurify';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { createPagination, type PaginationLabels } from '@/components/ui/pagination';
import uiTranslations from '@/i18n/ui.json';
import paginationTranslations from '@shared/content/pagination/translations.json';

import {
  createDocsHeader,
  createDocsDemonstration,
  createDocsAnatomy,
  createDocsWhenToUse,
  createDocsDoDont,
  createDocsImport,
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
import { stripHtml, toPlainText } from '@/lib/strip-html';

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t: tNav } = createTranslation(uiTranslations as Record<string, unknown>);

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria. O
// `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
function screenReaderItems(): string[] {
  const locale = getLocale();
  return Object.entries(
    (paginationTranslations as unknown as Record<string, { accessibility?: { screenReader?: Record<string, string> } }>)[locale]
      ?.accessibility?.screenReader ?? {},
  )
    .filter(([k]) => k !== 'title')
    .map(([, v]) => v);
}
const { t, subscribe } = createTranslation(paginationTranslations as Record<string, unknown>);

/**
 * Os índices `itemN` de uma seção do dicionário, em ordem.
 *
 * Contar à mão envelhece em silêncio: `testes.accessibility` tinha SEIS itens
 * escritos nos três idiomas e a página publicava cinco — o sexto existia, era
 * traduzido, e não chegava à tela. Cravar `[1..6]` no lugar de `[1..5]`
 * repetiria o defeito na próxima entrada, então a lista sai do próprio
 * dicionário e passa a acompanhar quem escreve o conteúdo.
 */
function itemIndices(path: string): number[] {
  const locale = getLocale();
  const section = path
    .split('.')
    .reduce<unknown>(
      (node, key) =>
        node && typeof node === 'object' ? (node as Record<string, unknown>)[key] : undefined,
      (paginationTranslations as Record<string, unknown>)[locale],
    );
  if (!section || typeof section !== 'object') return [];
  return Object.keys(section)
    .map((key) => /^item(\d+)$/.exec(key))
    .filter((m): m is RegExpExecArray => m !== null)
    .map((m) => Number(m[1]))
    .sort((a, b) => a - b);
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
 * Rótulos dos controles no IDIOMA DA PÁGINA.
 *
 * Sem isto a faixa desta stack anunciava "Ir para página 3" em português nas
 * páginas `en` e `es`: os rótulos eram constante de módulo da fábrica, e só o
 * nome do landmark aceitava valor de fora. As outras quatro stacks sempre
 * passaram os seus por `demonstration.labels.*`.
 *
 * Cada caminho aparece POR EXTENSO, nunca montado por interpolação: chave
 * interpolada some da busca de quem lê e do próprio portão que compara as cinco
 * demonstrações — foi assim que o vanilla apareceu divergente no `data-table`
 * sendo a referência.
 *
 * Texto VISÍVEL e NOME ACESSÍVEL dos direcionais são chaves diferentes, e é o
 * que faltava: `previous` / `next` são "Anterior" / "Próxima", que somem abaixo
 * de 40rem; `previousLabel` / `nextLabel` são a frase inteira que o leitor de
 * tela anuncia, e sem elas o padrão da fábrica saía em português nas páginas
 * `en` e `es`. `navigationLabel` é o nome do landmark — a opção `aria-label`
 * continua vencendo quando a instância precisa de nome distinto.
 */
function demoLabels(): Partial<PaginationLabels> {
  const pagePrefix = t('demonstration.labels.page');
  return {
    navigation: t('demonstration.labels.navigationLabel'),
    previous: t('demonstration.labels.previousLabel'),
    next: t('demonstration.labels.nextLabel'),
    previousText: t('demonstration.labels.previous'),
    nextText: t('demonstration.labels.next'),
    page: (n: number) => `${pagePrefix} ${n}`,
  };
}

function buildDemoPagination(total: number, current: number, label?: string): HTMLElement {
  const nav = createPagination({
    total,
    current,
    // aria-label distinto por instância (landmark-unique): usa a string que já
    // intitula visivelmente o bloco onde o preview aparece. Pela OPÇÃO da
    // fábrica, e não por um setAttribute depois de construir — o retoque some
    // na primeira refatoração.
    ...(label ? { 'aria-label': label } : {}),
    labels: demoLabels(),
    onPageChange: (page) => {
      track('page_change', {
        component: 'pagination',
        page,
        total_pages: total,
        location: 'docs_demo',
      });
    },
  });
  return nav;
}

/**
 * Deixa a faixa quebrar linha dentro do painel do Do & Don't.
 *
 * O painel do par ocupa METADE da largura da seção, e `.nds-button` declara
 * `flex-shrink: 0`: a lista não encolhe, ela transborda — e quem clipa corta os
 * dois lados, porque `.nds-pagination` é largura total centrada. O axe acha
 * isso pela beirada, em `target-size`, com sobras de poucos pixels; foi medido
 * assim no vue. O risco cresceu aqui quando o direcional passou a carregar
 * "Anterior"/"Próxima" por extenso.
 *
 * `flex-wrap` é mecânica, não valor de desenho.
 */
function allowWrap(nav: HTMLElement): HTMLElement {
  const list = nav.querySelector<HTMLElement>('[data-slot="pagination-content"]');
  if (list) list.style.flexWrap = 'wrap';
  return nav;
}

/**
 * Anti-padrão do par 1: a MESMA faixa, com as reticências abertas.
 *
 * A fábrica colapsa toda faixa acima de sete páginas e não expõe como desligar.
 * Desenhar `<a>` cru no lugar é imitação — a guideline 08 §15 pede componente
 * VIVO em toda seção com exemplo, e era o que faltava aqui —, então a faixa é a
 * que a fábrica produziu e cada reticência é trocada pelos números que ela
 * escondia, clonando o link vizinho. O que o leitor compara continua sendo o
 * componente.
 */
function expandEllipsis(nav: HTMLElement): HTMLElement {
  const list = nav.querySelector<HTMLElement>('[data-slot="pagination-content"]');
  const template = nav.querySelector<HTMLAnchorElement>(
    '[data-slot="pagination-link"]:not([aria-current])',
  );
  if (!list || !template) return nav;
  allowWrap(nav);

  const itemNumber = (li: Element | null): number | null => {
    const text = li?.querySelector('[data-slot="pagination-link"]')?.textContent?.trim();
    const value = Number(text);
    return text && Number.isInteger(value) ? value : null;
  };

  for (const li of Array.from(list.children)) {
    if (!li.querySelector('[data-slot="pagination-ellipsis"]')) continue;
    const from = itemNumber(li.previousElementSibling);
    const to = itemNumber(li.nextElementSibling);
    if (from === null || to === null) continue;

    const replacement = document.createDocumentFragment();
    for (let page = from + 1; page < to; page++) {
      const item = li.cloneNode(false) as HTMLElement;
      const link = template.cloneNode(true) as HTMLAnchorElement;
      link.textContent = String(page);
      // O rótulo sai do próprio template, para seguir o idioma da fábrica em vez
      // de uma segunda frase escrita aqui.
      const label = template.getAttribute('aria-label');
      if (label) link.setAttribute('aria-label', label.replace(/\d+/, String(page)));
      // `cloneNode` não copia ouvinte, e o `href` do clone é `#`: sem isto o
      // clique rolaria a página ao topo.
      link.addEventListener('click', (e) => e.preventDefault());
      item.appendChild(link);
      replacement.appendChild(item);
    }
    li.replaceWith(replacement);
  }
  return nav;
}

/**
 * Anti-padrão do par 2: os direcionais reduzidos a "<" e ">".
 *
 * Mesma forma do par acima — o componente é o de verdade, e o que muda é o
 * CONTEÚDO do controle: somem o chevron e o "Anterior"/"Próxima" por extenso,
 * que é o que a legenda condena.
 *
 * O `aria-label` da fábrica FICA. Tirá-lo deixaria o link sem nome acessível e
 * plantaria uma violação de axe na própria docs page; o defeito que o par
 * mostra é o que se vê na tela, e é assim também nas outras stacks.
 */
function arrowsOnly(nav: HTMLElement): HTMLElement {
  const arrows: Array<[string, string]> = [
    ['pagination-previous', '<'],
    ['pagination-next', '>'],
  ];
  for (const [slot, arrow] of arrows) {
    nav.querySelector<HTMLElement>(`[data-slot="${slot}"]`)?.replaceChildren(arrow);
  }
  return nav;
}

// ─── createPaginationDocs ─────────────────────────────────────────────────────

export function createPaginationDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────
  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'pagination',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: t('category'), item: '/components/navigation' },
        { name: t('title') },
      ],
    });
    track('docs_page_view', {
      component_name: 'pagination',
      locale,
      page_title: `${t('title')} · Design System`,
    });
    return cleanup;
  }
  let cleanupSeo = updateSeo();
  cleanups.push(() => cleanupSeo());
  cleanups.push(subscribe(() => { cleanupSeo(); cleanupSeo = updateSeo(); }));

  // ── Nav groups ────────────────────────────────────────────────────────────
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

  function buildNavGroups() {
    return NAV_GROUPS.map(g => ({
      label: tNav(g.labelKey),
      sections: g.sections.map(s => ({ id: s.id, label: tNav(s.labelKey) })),
    }));
  }

  const pageLayout = createDocsPageLayout({ navGroups: buildNavGroups() });
  const root = pageLayout.root;
  const headerSlot = pageLayout.headerSlot;
  const main = pageLayout.main;

  function renderHeader() {
    const header = createDocsHeader({
      title: t('title'),
      description: t('description'),
      category: t('category'),
      type: t('type'),
    });
    headerSlot.replaceChildren(header);
  }
  function buildSidebar() { pageLayout.rebuildNav(buildNavGroups()); }
  function updateActiveNav(id: string) { pageLayout.setActiveSection(id); }

  // ── Sections ──────────────────────────────────────────────────────────────
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
          demoFactory: () => {
            const wrap = document.createElement('div');
            wrap.style.contain = 'layout';
            wrap.className = 'nds-cluster nds-w-full nds-p-2';
            wrap.dataset.justify = 'center';
            wrap.classList.add('nds-min-h-30');
            // Sem nome distinto de propósito: esta é a faixa que mostra o
            // padrão, e o padrão do landmark é `labels.navigation`. As outras
            // instâncias da página seguem com nome próprio, que é o que mantém
            // o `landmark-unique` do axe satisfeito.
            wrap.appendChild(buildDemoPagination(10, 3));
            return wrap;
          },
        });

      case 'anatomia':
        return createDocsAnatomy({
          items: itemIndices('anatomy').map(i => DOMPurify.sanitize(t(`anatomy.item${i}`))),
          structureLabel: t('anatomy.structureLabel'),
          structureCode: t('anatomy.structureCode'),
        });

      case 'quando-usar':
        return createDocsWhenToUse({
          guidelines: {
            title: t('usage.guidelines.title'),
            items: itemIndices('usage.guidelines').map(i => DOMPurify.sanitize(t(`usage.guidelines.item${i}`))),
          },
          scenarios: {
            title: t('usage.scenarios.title'),
            cols: {
              scenario: t('usage.scenarios.cols.scenario'),
              use: t('usage.scenarios.cols.use'),
              alternative: t('usage.scenarios.cols.alternative'),
            },
            items: itemIndices('usage.scenarios').map(i => ({
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
            items: ['previous', 'next', 'page', 'ellipsis'].map(key => ({
              element: t(`usage.uxWriting.table.${key}.name`),
              rules: t(`usage.uxWriting.table.${key}.format`),
              do: t(`usage.uxWriting.table.${key}.good`),
              dont: t(`usage.uxWriting.table.${key}.bad`),
            })),
          },
          do: {
            title: t('usage.do.title'),
            items: itemIndices('usage.do').map(i => t(`usage.do.item${i}`)),
          },
          dont: {
            title: t('usage.dont.title'),
            items: itemIndices('usage.dont').map(i => DOMPurify.sanitize(t(`usage.dont.item${i}`))),
          },
        });

      case 'do-dont':
        return createDocsDoDont({
          pairs: [
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair1.do')),
              dontCaption: toPlainText(t('doDont.pair1.dont')),
              doPreviewFactory: () => {
                const wrap = document.createElement('div');
                wrap.style.contain = 'layout';
                wrap.className = 'nds-cluster';
                wrap.dataset.justify = 'center';
                wrap.classList.add('nds-min-h-20');
                wrap.appendChild(allowWrap(buildDemoPagination(12, 6, stripHtml(t('doDont.pair1.do')))));
                return wrap;
              },
              dontPreviewFactory: () => {
                const wrap = document.createElement('div');
                wrap.style.contain = 'layout';
                wrap.className = 'nds-cluster';
                wrap.dataset.justify = 'center';
                wrap.classList.add('nds-min-h-20');
                // Don't: a faixa de 12 páginas com as reticências abertas —
                // componente vivo, e não um `<a>` desenhado à mão.
                wrap.appendChild(
                  expandEllipsis(
                    buildDemoPagination(12, 6, stripHtml(t('doDont.pair1.dont'))),
                  ),
                );
                return wrap;
              },
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair2.do')),
              dontCaption: toPlainText(t('doDont.pair2.dont')),
              doPreviewFactory: () => {
                const wrap = document.createElement('div');
                wrap.style.contain = 'layout';
                wrap.className = 'nds-cluster';
                wrap.dataset.justify = 'center';
                wrap.classList.add('nds-min-h-20');
                wrap.appendChild(allowWrap(buildDemoPagination(5, 2, stripHtml(t('doDont.pair2.do')))));
                return wrap;
              },
              dontPreviewFactory: () => {
                const wrap = document.createElement('div');
                wrap.style.contain = 'layout';
                wrap.className = 'nds-cluster';
                wrap.dataset.justify = 'center';
                wrap.classList.add('nds-min-h-20');
                // Don't: os direcionais reduzidos a "<" e ">" — componente
                // vivo, com o conteúdo do controle trocado.
                wrap.appendChild(
                  allowWrap(arrowsOnly(buildDemoPagination(3, 2, stripHtml(t('doDont.pair2.dont'))))),
                );
                return wrap;
              },
            },
          ],
        });

      case 'importacao':
        return createDocsImport({
          componentSlug: 'pagination',
          code: `import { createPagination } from '@/components/ui/pagination';`,
          secondaryDescription: 'Com endereços reais, para a página ser compartilhável e indexável:',
          secondaryCode: `const nav = createPagination({
  total: 10,
  current: 2,
  // Com endereço, cada controle é um link de verdade e o clique NÃO é
  // anulado: abrir em nova aba funciona, e o roteador de cliente intercepta
  // como faria com qualquer link da página. Sem ele, o controle é um botão.
  hrefForPage: (page) => \`?page=\${page}\`,
  onPageChange: (page) => track('page_change', { page }),
  align: 'end',
  'aria-label': 'Paginação de resultados',
});`,
        });

      case 'variantes': {
        const codeDefault = `const nav = createPagination({
  total: 5,
  current: 2,
  onPageChange: (page) => console.log('page', page),
});`;

        const codeDirectional = `// Previous/Next são montados quando showPrevNext=true (padrão).
const nav = createPagination({
  total: 10,
  current: 1,
  showPrevNext: true,
  onPageChange: (page) => console.log('page', page),
});
// Previous fica desabilitado automaticamente em current=1
// (recebe pointer-events-none + opacity-50).`;

        return createDocsCompositions({
          id: 'variantes',
          useWhenLabel: tNav('common.useWhen'),
          componentSlug: 'pagination',
          items: [
            {
              trackId: 'default',
              name: t('variants.items.default'),
              description: stripHtml(t('variants.styles.default')),
              code: codeDefault,
              previewFactory: () => {
                const wrap = document.createElement('div');
                wrap.style.contain = 'layout';
                wrap.className = 'nds-cluster';
                wrap.dataset.justify = 'center';
                wrap.classList.add('nds-min-h-20');
                wrap.appendChild(buildDemoPagination(5, 2, t('variants.items.default')));
                return wrap;
              },
            },
            {
              trackId: 'directional',
              name: t('variants.items.directional'),
              description: stripHtml(t('variants.styles.directional')),
              code: codeDirectional,
              previewFactory: () => {
                const wrap = document.createElement('div');
                wrap.style.contain = 'layout';
                wrap.className = 'nds-cluster';
                wrap.dataset.justify = 'center';
                wrap.classList.add('nds-min-h-20');
                wrap.appendChild(buildDemoPagination(10, 1, t('variants.items.directional')));
                return wrap;
              },
            },
            {
              name: t('variants.items.simple.name'),
              trackId: 'simple',
              description: t('variants.items.simple.description'),
              useWhen: t('variants.items.simple.use'),
              code:
                `const nav = createPagination({\n` +
                `  total: 5,\n` +
                `  current: 1,\n` +
                `  showPrevNext: true,\n` +
                `  onPageChange: (page) => console.log('page', page),\n` +
                `});`,
              previewFactory: () => {
                const wrap = document.createElement('div');
                wrap.style.contain = 'layout';
                wrap.className = 'nds-cluster';
                wrap.dataset.justify = 'center';
                wrap.classList.add('nds-min-h-20');
                const nav = createPagination({
                  total: 5,
                  current: 1,
                  showPrevNext: true,
                  labels: demoLabels(),
                  onPageChange: () => {},
                });
                nav.setAttribute('aria-label', t('variants.items.simple.name'));
                wrap.appendChild(nav);
                return wrap;
              },
            },
            {
              name: t('variants.items.withEllipsis.name'),
              trackId: 'withEllipsis',
              description: t('variants.items.withEllipsis.description'),
              useWhen: t('variants.items.withEllipsis.use'),
              code:
                `const nav = createPagination({\n` +
                `  total: 12,\n` +
                `  current: 6,\n` +
                `  showPrevNext: true,\n` +
                `  onPageChange: (page) => console.log('page', page),\n` +
                `});`,
              previewFactory: () => {
                const wrap = document.createElement('div');
                wrap.style.contain = 'layout';
                wrap.className = 'nds-cluster';
                wrap.dataset.justify = 'center';
                wrap.classList.add('nds-min-h-20');
                const nav = createPagination({
                  total: 12,
                  current: 6,
                  showPrevNext: true,
                  labels: demoLabels(),
                  onPageChange: () => {},
                });
                nav.setAttribute('aria-label', t('variants.items.withEllipsis.name'));
                wrap.appendChild(nav);
                return wrap;
              },
            },
            {
              name: t('variants.items.interactive.name'),
              trackId: 'interactive',
              description: t('variants.items.interactive.description'),
              useWhen: t('variants.items.interactive.use'),
              code:
                `let current = 3;\n` +
                `const total = 8;\n` +
                `const wrapper = document.createElement('div');\n` +
                `wrapper.className = 'nds-stack';\n` +
                `wrapper.dataset.spacing = 'sm';\n` +
                `wrapper.style.alignItems = 'center';\n` +
                `const status = document.createElement('p');\n` +
                `status.className = 'nds-text-body nds-text-muted-foreground';\n` +
                `const navContainer = document.createElement('div');\n` +
                `function rerender() {\n` +
                `  status.textContent = \`Página atual: \${current} / \${total}\`;\n` +
                `  navContainer.replaceChildren(createPagination({\n` +
                `    total,\n` +
                `    current,\n` +
                `    showPrevNext: true,\n` +
                `    onPageChange: (page) => { current = page; rerender(); },\n` +
                `  }));\n` +
                `}\n` +
                `wrapper.append(navContainer, status);\n` +
                `rerender();`,
              previewFactory: () => {
                const wrap = document.createElement('div');
                wrap.style.contain = 'layout';
                wrap.className = 'nds-cluster';
            wrap.dataset.justify = 'center';
            wrap.classList.add('nds-min-h-30');

                const wrapper = document.createElement('div');
                wrapper.className = 'nds-stack';
                wrapper.dataset.spacing = 'sm';
                wrapper.style.alignItems = 'center';

                // O leitor do estado EXTERNO: a composição existe para ensinar
                // que a fábrica não guarda a página, e sem a legenda a demo
                // parece guardá-la sozinha — o oposto do que a seção ensina.
                const status = document.createElement('p');
                status.className = 'nds-text-body nds-text-muted-foreground';

                const navContainer = document.createElement('div');

                let current = 3;
                const total = 8;

                const rerender = () => {
                  status.textContent = `${t('demonstration.labels.current')}: ${current} / ${total}`;
                  // Pela OPÇÃO da fábrica, e não por um `setAttribute` depois de
                  // construir: o retoque some na primeira refatoração.
                  navContainer.replaceChildren(
                    createPagination({
                      total,
                      current,
                      showPrevNext: true,
                      'aria-label': t('variants.items.interactive.name'),
                      labels: demoLabels(),
                      onPageChange: (page: number) => { current = page; rerender(); },
                    }),
                  );
                };

                wrapper.append(navContainer, status);
                rerender();
                wrap.appendChild(wrapper);
                return wrap;
              },
            },
          ],
        });
      }

      case 'estados':
        return createDocsStates({
          cols: {
            state: t('states.cols.state'),
            trigger: toPlainText(t('states.cols.trigger')),
            behavior: toPlainText(t('states.cols.behavior')),
          },
          items: [
            { label: t('states.default.label'),  trigger: toPlainText(t('states.default.trigger')),  behavior: toPlainText(t('states.default.behavior')) },
            { label: t('states.hover.label'),    trigger: toPlainText(t('states.hover.trigger')),    behavior: toPlainText(t('states.hover.behavior')) },
            { label: t('states.active.label'),   trigger: toPlainText(t('states.active.trigger')),   behavior: toPlainText(t('states.active.behavior')) },
            { label: t('states.disabled.label'), trigger: toPlainText(t('states.disabled.trigger')), behavior: toPlainText(t('states.disabled.behavior')) },
            { label: t('states.focus.label'),    trigger: toPlainText(t('states.focus.trigger')),    behavior: toPlainText(t('states.focus.behavior')) },
            { label: t('states.lastPage.label'), trigger: toPlainText(t('states.lastPage.trigger')), behavior: toPlainText(t('states.lastPage.behavior')) },
          ],
        });

      case 'propriedades': {
        const interfaceCode = `// createPagination(options)
export type PaginationOptions = {
  total: number;                           // total de páginas
  current: number;                         // página atualmente ativa (1-based)
  onPageChange?: (page: number) => void;   // avisado quando outra página é pedida
  hrefForPage?: (page: number) => string;  // endereço real; decide a tag do controle
  showPrevNext?: boolean;                  // exibe Previous e Next (default true)
  'aria-label'?: string;                   // nome do landmark (default 'Paginação')
  align?: 'start' | 'end';                 // encosta a faixa numa das pontas
  class?: string;                          // classes .nds-* extras no <nav>
  labels?: Partial<PaginationLabels>;      // textos dos controles; o resto fica no padrão
};

export interface PaginationLabels {
  navigation: string;                      // nome do landmark; 'aria-label' vence
  previous: string;                        // nome acessível do controle anterior
  next: string;                            // nome acessível do controle próximo
  page: (n: number) => string;             // nome acessível de cada página numerada
  previousText: string;                    // texto visível do controle anterior
  nextText: string;                        // texto visível do controle próximo
}

export const PAGINATION_LABELS_DEFAULT: PaginationLabels;

export function createPagination(options: PaginationOptions): HTMLElement;`;

        const propsCols = {
          prop: t('props.table.prop'),
          type: t('props.table.type'),
          default: t('props.table.default'),
          required: t('props.table.required'),
          description: t('props.table.description'),
        };

        return createDocsProps({
          tables: [
            {
              title: 'createPagination(options)',
              cols: propsCols,
              items: [
                { name: 'total',         type: 'number',                    defaultValue: '—',            required: 'Sim', description: 'Total de páginas. Define quantos itens são renderizados.' },
                { name: 'current',       type: 'number',                    defaultValue: '—',            required: 'Sim', description: 'Página atual (1-based). Recebe aria-current="page".' },
                { name: 'onPageChange',  type: '(page: number) => void',    defaultValue: '—',            required: 'Não', description: 'Avisado quando outra página é pedida — clique numa página, no anterior ou no próximo. Continua sendo chamado junto com hrefForPage: é por ele que passam a analítica e o estado da tela.' },
                { name: 'hrefForPage',   type: '(page: number) => string',  defaultValue: '—',            required: 'Não', description: 'Endereço real de cada página, e é ele que decide a tag do controle. Com ele cada controle é um link de verdade, que abre em nova aba e é indexável, e o clique SEGUE — quem usa roteador de cliente o intercepta como faria com qualquer link. Sem ele o controle é um botão, e o estado desabilitado passa a ser o nativo.' },
                { name: 'showPrevNext',  type: 'boolean',                   defaultValue: 'true',         required: 'Não', description: 'Exibe controles Previous/Next nas extremidades.' },
                { name: 'aria-label',    type: 'string',                    defaultValue: "'Paginação'",  required: 'Não', description: 'Nome acessível do landmark de navegação. Aceita também o apelido depreciado label; quando os dois vêm, aria-label vence.' },
                { name: 'align',         type: "'start' | 'end'",           defaultValue: '—',            required: 'Não', description: 'Sem valor, a faixa ocupa a linha inteira e fica centrada; start e end a encolhem e a encostam na ponta — o caso do rodapé de tabela.' },
                { name: 'class',         type: 'string',                    defaultValue: '—',            required: 'Não', description: 'Classes .nds-* extras no <nav>.' },
                { name: 'labels',        type: 'Partial<PaginationLabels>', defaultValue: 'PAGINATION_LABELS_DEFAULT', required: 'Não', description: 'Textos dos controles, parcial: o que não vier continua no padrão em português. Cobre o nome do landmark, o nome acessível do anterior e do próximo, o rótulo de cada página numerada e o texto visível dos dois direcionais. É por aqui que a faixa fala o idioma da página.' },
              ],
            },
          ],
          interfaceCode,
          extensibilityTitle: t('props.extensibilityTitle'),
          extensibilityCode: t('props.extensibilityCode'),
        });
      }

      case 'tokens':
        return createDocsTokens({
          cols: {
            token: t('tokens.table.token'),
            value: t('tokens.table.class'),
            description: t('tokens.table.part'),
          },
          items: [
            { token: '--foreground',         value: t('tokens.table.foreground.class'),         description: t('tokens.table.foreground.part')         },
            { token: '--accent',             value: t('tokens.table.accent.class'),             description: t('tokens.table.accent.part')             },
            { token: '--accent-foreground',  value: t('tokens.table.accentForeground.class'),   description: t('tokens.table.accentForeground.part')   },
            { token: '--ring',               value: t('tokens.table.ring.class'),               description: t('tokens.table.ring.part')               },
            { token: '--muted-foreground',   value: t('tokens.table.ellipsis.class'),           description: t('tokens.table.ellipsis.part')           },
            { token: '--radius',             value: t('tokens.table.radius.class'),             description: t('tokens.table.radius.part')             },
            { token: '--spacing-1',          value: t('tokens.table.gap.class'),                description: t('tokens.table.gap.part')                },
          ],
          customizationTitle: t('tokens.customizationTitle'),
          customizationCode: t('tokens.customizationCode'),
        });

      case 'acessibilidade':
        return createDocsAccessibility({
          screenReaderTitle: tNav('common.screenReader'),
          screenReaderItems: screenReaderItems(),
          summary: t('accessibility.summary'),
          items: itemIndices('accessibility.items').map(i => DOMPurify.sanitize(t(`accessibility.items.item${i}`))),
          keyboardTitle: t('accessibility.keyboard.title'),
          keyboardItems: [
            { key: 'Tab',         description: toPlainText(t('accessibility.keyboard.tab'))      },
            { key: 'Enter',       description: toPlainText(t('accessibility.keyboard.enter'))    },
            { key: 'Space',       description: toPlainText(t('accessibility.keyboard.space'))    },
            { key: 'Shift+Tab',   description: toPlainText(t('accessibility.keyboard.shiftTab')) },
          ],
        });

      case 'relacionados':
        return createDocsRelated({
          componentSlug: 'pagination',
          items: [
            { name: t('related.items.breadcrumb.name'), description: toPlainText(t('related.items.breadcrumb.description')), path: '?path=/docs/components-navigation-breadcrumb--docs' },
            { name: t('related.items.tabs.name'),       description: toPlainText(t('related.items.tabs.description')),       path: '?path=/docs/components-navigation-tabs--docs'       },
            { name: t('related.items.button.name'),     description: toPlainText(t('related.items.button.description')),     path: '?path=/docs/components-form-button--docs'     },
          ],
        });

      case 'notas':
        return createDocsNotes({
          componentSlug: 'pagination',
          items: itemIndices('notes').map(i => ({ title: '', content: DOMPurify.sanitize(t(`notes.item${i}`)) })),
        });

      case 'analytics':
        return createDocsAnalytics({
          cols: {
            event: t('analytics.table.event'),
            trigger: toPlainText(t('analytics.table.trigger')),
            payload: t('analytics.table.payload'),
          },
          items: [
            {
              event: 'page_change',
              trigger: toPlainText(t('analytics.table.page_change.trigger')),
              payload: t('analytics.table.page_change.payload'),
            },
            {
              event: 'docs_page_view',
              trigger: 'mount da docs page',
              payload: "{ component_name: 'pagination', locale, page_title }",
            },
            {
              event: 'docs_section_viewed',
              trigger: 'IntersectionObserver atinge seção',
              payload: "{ section_id, component_name: 'pagination', locale }",
            },
          ],
        });

      case 'testes':
        return createDocsTestes({
          functional: {
            title: t('testes.functional.title'),
            cols: {
              action: tNav('common.userAction'),
              result: tNav('common.expectedResult'),
              priority: tNav('common.priority'),
            },
            items: itemIndices('testes.functional').map(i => ({
              action: t(`testes.functional.item${i}.action`),
              result: t(`testes.functional.item${i}.result`),
              priority: priorityLabel(t(`testes.functional.item${i}.priority`)),
            })),
          },
          accessibility: {
            title: t('testes.accessibility.title'),
            cols: {
              criterion: tNav('common.criterion'),
              level: 'WCAG',
              how: tNav('common.howToVerify'),
            },
            // Nível e ferramenta vêm do DICIONÁRIO, como em `functional` e
            // `visual`. Enquanto o item era uma string solta, cada stack cravava
            // os seus dois campos aqui — e as cinco páginas publicavam quatro
            // respostas diferentes para a mesma pergunta.
            items: itemIndices('testes.accessibility').map(i => ({
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
            items: itemIndices('testes.visual').map(i => ({
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
      if (existing && existing.parentNode) existing.replaceWith(fresh);
      else main.appendChild(fresh);
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
      (id) => sectionEls[id as keyof typeof sectionEls] ?? null,
      (id) => updateActiveNav(id),
      (id) => track('docs_section_viewed', {
        section_id: id,
        component_name: 'pagination',
        locale: getLocale(),
      }),
    );
  }
  cleanups.push(() => activeSectionObserver?.disconnect());

  // ── Initial render ────────────────────────────────────────────────────────
  renderHeader();
  buildSidebar();
  renderAllSections();

  cleanups.push(subscribe(() => { renderHeader(); buildSidebar(); renderAllSections(); }));
  cleanups.push(onLocaleChange(() => { renderHeader(); buildSidebar(); renderAllSections(); }));

  // ── Cleanup on disconnect ─────────────────────────────────────────────────
  const mo = new MutationObserver(() => {
    if (!document.body.contains(root)) {
      cleanups.forEach(fn => fn());
      mo.disconnect();
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });

  return root;
}
