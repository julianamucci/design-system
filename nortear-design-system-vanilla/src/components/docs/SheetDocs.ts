import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import DOMPurify from 'dompurify';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { createSheet, type SheetSide } from '@/components/ui/sheet';
import { createButton } from '@/components/ui/button';
import { createInput } from '@/components/ui/input';
import { createLabel } from '@/components/ui/label';
import uiTranslations from '@/i18n/ui.json';
import sheetTranslations from '@shared/content/sheet/translations.json';

import {
  createDocsHeader,
  createDocsDemonstration,
  createDocsAnatomy,
  createDocsWhenToUse,
  createDocsDoDont,
  createDocsImport,
  createDocsVariants,
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
    (sheetTranslations as unknown as Record<string, { accessibility?: { screenReader?: Record<string, string> } }>)[locale]
      ?.accessibility?.screenReader ?? {},
  )
    .filter(([k]) => k !== 'title')
    .map(([, v]) => v);
}
const { t, subscribe } = createTranslation(sheetTranslations as Record<string, unknown>);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const priorityKeyMap: Record<string, string> = {
  high: 'common.high',
  medium: 'common.medium',
  low: 'common.low',
};
function priorityLabel(raw: string): string {
  return tNav(priorityKeyMap[raw] ?? 'common.high');
}

// ─── Demo builders ────────────────────────────────────────────────────────────

type SheetDemoOptions = {
  side?: SheetSide;
  /**
   * `docs_<section-id>` da seção que RENDERIZA este exemplo — guideline 07,
   * "`location` nas docs pages". Obrigatório e sem default: quem sabe a seção é
   * o call site, e default aqui é exatamente como todas as chamadas passaram a
   * reportar `docs_demo`.
   */
  location: string;
  triggerLabel: string;
  title: string;
  description: string;
  cancelLabel: string;
  applyLabel: string;
  bodyText?: string;
  /**
   * Esconde título e descrição visualmente, mantendo-os no DOM.
   *
   * É o anti-padrão do primeiro "don't": o painel continua com nome acessível
   * (o `aria-labelledby` aponta para o mesmo `h2`), então o exemplo mostra a
   * PERDA de contexto visual sem virar violação real de axe. Sem isto o
   * preview seria imitação estática — guideline 08 §15.
   */
  srOnlyHeader?: boolean;
  /** Corpo já montado — usado pelas composições que mostram um formulário. */
  bodyEl?: HTMLElement;
  /**
   * Id do `<form>` que o corpo carrega, quando ele é um formulário.
   *
   * O rodapé é IRMÃO do corpo por construção da fábrica — é o que o mantém
   * visível enquanto o conteúdo rola —, então a ação primária nunca está dentro
   * do `<form>`. Sem `type: 'submit'` e sem o atributo `form`, o painel tem
   * formulário e NENHUMA forma de submeter: com dois ou mais campos o navegador
   * não faz o envio implícito, e o Enter num campo não dispara nada (PRD D10).
   */
  formId?: string;
};

/** Corpo do exemplo: o parágrafo canônico, ou o que a composição já montou. */
function buildDemoBody(opts: SheetDemoOptions): HTMLElement {
  if (opts.bodyEl) return opts.bodyEl;
  const paragraph = document.createElement('p');
  paragraph.className = 'nds-text-body nds-text-muted-foreground';
  paragraph.textContent = opts.bodyText ?? t('demonstration.labels.body');
  return paragraph;
}

/** Esconde o cabeçalho do painel recém-aberto SEM tirá-lo do DOM. */
function hideHeaderVisually(): void {
  // O painel só é portado para o `body` na abertura, e o Sheet fecha os
  // outros ao abrir — o último `sheet-content` do documento é este.
  const panel = [...document.querySelectorAll<HTMLElement>('[data-slot="sheet-content"]')].pop();
  panel?.querySelector('.nds-sheet-title')?.classList.add('nds-sr-only');
  panel?.querySelector('.nds-sheet-description')?.classList.add('nds-sr-only');
}

function buildSheetDemo(opts: SheetDemoOptions): HTMLElement {
  const trigger = createButton({ variant: 'outline', label: opts.triggerLabel });
  const body = buildDemoBody(opts);

  const cancel = createButton({ variant: 'outline', label: opts.cancelLabel });
  const apply = createButton({
    variant: 'default',
    label: opts.applyLabel,
    type: opts.formId ? 'submit' : 'button',
  });
  // A fábrica de botão não expõe `form`: o religamento entra por atributo.
  if (opts.formId) apply.setAttribute('form', opts.formId);
  const footer = document.createElement('div');
  footer.className = 'nds-cluster';
  footer.dataset.spacing = 'md';
  footer.append(cancel, apply);

  // Fechar ao clicar nas ações: dispara click no overlay (close interno da
  // factory). pendingReason sobrepõe o reason 'overlay' desse caminho sintético
  // para que cancel/apply reportem o motivo semântico correto.
  let pendingReason: 'close-button' | 'action' | null = null;
  const closeFromAction = () => {
    const overlay = document.querySelector<HTMLElement>('[data-slot="sheet-overlay"]');
    overlay?.click();
  };
  cancel.addEventListener('click', () => {
    pendingReason = 'close-button';
    closeFromAction();
  });
  apply.addEventListener('click', () => {
    track('dialog_confirm', {
      component: 'sheet',
      action: 'apply',
      location: opts.location,
    });
    pendingReason = 'action';
    closeFromAction();
  });

  return createSheet({
    trigger,
    side: opts.side ?? 'right',
    title: opts.title,
    description: opts.description,
    content: body,
    footer,
    onOpenChange: (open) => {
      if (open) {
        if (opts.srOnlyHeader) hideHeaderVisually();
        track('dialog_open', {
          component: 'sheet',
          label: opts.side ?? 'right',
          location: opts.location,
        });
      }
    },
    onClose: (reason) => {
      track('dialog_close', {
        component: 'sheet',
        label: opts.side ?? 'right',
        reason: pendingReason ?? reason,
        location: opts.location,
      });
      pendingReason = null;
    },
  });
}

// ─── createSheetDocs ──────────────────────────────────────────────────────────

export function createSheetDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────
  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'sheet',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: t('category'), item: '/components/overlay' },
        { name: t('title') },
      ],
    });
    track('docs_page_view', {
      component_name: 'sheet',
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
      { id: 'composicoes',  labelKey: 'nav.compositions' },
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
    'importacao', 'variantes', 'composicoes', 'estados', 'propriedades', 'tokens',
    'acessibilidade', 'relacionados', 'notas', 'analytics', 'testes',
  ] as const;
  type SectionId = typeof sectionOrder[number];
  const sectionEls: Record<SectionId, HTMLElement> = {} as Record<SectionId, HTMLElement>;

  function buildSection(id: SectionId): HTMLElement {
    switch (id) {

      case 'demonstracao':
        return createDocsDemonstration({
          title: t('demonstration.title'),
          demoFactory: () => {
            const wrap = document.createElement('div');
            wrap.className = 'nds-cluster';
            wrap.dataset.justify = 'center';
            wrap.dataset.spacing = 'sm';
            wrap.appendChild(buildSheetDemo({
              location: 'docs_demo',
              side: 'right',
              triggerLabel: t('demonstration.labels.trigger'),
              title: t('demonstration.labels.title'),
              description: t('demonstration.labels.description'),
              bodyText: t('demonstration.labels.body'),
              cancelLabel: t('demonstration.labels.cancel'),
              applyLabel: t('demonstration.labels.apply'),
            }));
            return wrap;
          },
        });

      case 'anatomia':
        return createDocsAnatomy({
          title: t('anatomy.title'),
          items: [1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => DOMPurify.sanitize(t(`anatomy.item${i}`))),
          structureLabel: t('anatomy.structureLabel'),
          structureCode: t('anatomy.structureCode'),
        });

      case 'quando-usar':
        return createDocsWhenToUse({
          title: t('usage.title'),
          guidelines: {
            title: t('usage.guidelines.title'),
            items: [1, 2, 3, 4].map(i => DOMPurify.sanitize(t(`usage.guidelines.item${i}`))),
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
          uxWriting: {
            title: t('usage.uxWriting.title'),
            cols: {
              element: t('usage.uxWriting.table.element'),
              rules: t('usage.uxWriting.table.rules'),
              do: t('usage.uxWriting.table.correct'),
              dont: t('usage.uxWriting.table.avoid'),
            },
            items: ['title', 'description', 'trigger', 'primary'].map(key => ({
              element: t(`usage.uxWriting.table.${key}.name`),
              rules: t(`usage.uxWriting.table.${key}.format`),
              do: t(`usage.uxWriting.table.${key}.good`),
              dont: t(`usage.uxWriting.table.${key}.bad`),
            })),
          },
          do: {
            title: t('usage.do.title'),
            items: [1, 2, 3, 4].map(i => t(`usage.do.item${i}`)),
          },
          dont: {
            title: t('usage.dont.title'),
            items: [1, 2, 3, 4].map(i => stripHtml(t(`usage.dont.item${i}`))),
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
              // Os quatro previews são o componente VIVO (guideline 08 §15),
              // inclusive o "don't" — a lição do primeiro par só existe
              // renderizada. Todos NASCEM FECHADOS: painel modal aberto na
              // docs page empilha overlay e o axe passa a medir o overlay.
              doPreviewFactory: () => buildSheetDemo({
                location: 'docs_do_dont',
                side: 'right',
                triggerLabel: t('demonstration.labels.trigger'),
                title: t('demonstration.labels.title'),
                description: t('demonstration.labels.description'),
                bodyText: t('demonstration.labels.body'),
                cancelLabel: t('demonstration.labels.cancel'),
                applyLabel: t('demonstration.labels.apply'),
              }),
              dontPreviewFactory: () => buildSheetDemo({
                location: 'docs_do_dont',
                side: 'right',
                srOnlyHeader: true,
                triggerLabel: t('doDont.pair1.dontTrigger'),
                title: t('doDont.pair1.dontTitle'),
                description: t('doDont.pair1.dontDescription'),
                bodyText: t('doDont.pair1.dontBody'),
                cancelLabel: t('demonstration.labels.cancel'),
                applyLabel: t('demonstration.labels.apply'),
              }),
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair2.do')),
              dontCaption: toPlainText(t('doDont.pair2.dont')),
              doPreviewFactory: () => buildSheetDemo({
                location: 'docs_do_dont',
                side: 'right',
                triggerLabel: t('demonstration.labels.trigger'),
                title: t('demonstration.labels.title'),
                description: t('demonstration.labels.description'),
                bodyText: t('demonstration.labels.body'),
                cancelLabel: t('demonstration.labels.cancel'),
                applyLabel: t('demonstration.labels.apply'),
              }),
              dontPreviewFactory: () => buildSheetDemo({
                location: 'docs_do_dont',
                side: 'top',
                triggerLabel: t('demonstration.labels.trigger'),
                title: t('demonstration.labels.title'),
                description: t('demonstration.labels.description'),
                bodyText: t('demonstration.labels.body'),
                cancelLabel: t('demonstration.labels.cancel'),
                applyLabel: t('demonstration.labels.apply'),
              }),
            },
          ],
        });

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          code: `import { createSheet } from '@/components/ui/sheet';
import { createButton } from '@/components/ui/button';`,
        });

      case 'variantes': {
        // Um construtor, e não quatro literais: os três lados que não eram o
        // padrão vinham como uma linha só, com `trigger`, `title` e `content`
        // indefinidos — quem copiasse receberia código que não roda. O lado é a
        // única coisa que muda de um card para o outro.
        const variantCode = (side: SheetSide, panelTitle: string) =>
          `const trigger = createButton({ variant: 'outline', label: '${t('demonstration.labels.trigger')}' });

const body = document.createElement('p');
body.className = 'nds-text-body nds-text-muted-foreground';
body.textContent = '${t('demonstration.labels.body')}';

const footer = document.createElement('div');
footer.className = 'nds-cluster';
footer.dataset.spacing = 'md';
footer.append(
  createButton({ variant: 'outline', label: '${t('demonstration.labels.cancel')}' }),
  createButton({ variant: 'default', label: '${t('demonstration.labels.apply')}' }),
);

createSheet({
  trigger,
  side: '${side}',
  title: '${panelTitle}',
  description: '${t('demonstration.labels.description')}',
  content: body,
  footer,
});`;
        const codeRight = variantCode('right', t('demonstration.labels.rightLabel'));
        const codeLeft = variantCode('left', t('demonstration.labels.leftLabel'));
        const codeTop = variantCode('top', t('demonstration.labels.topLabel'));
        const codeBottom = variantCode('bottom', t('demonstration.labels.bottomLabel'));

        return createDocsVariants({
          title: t('variants.title'),
          items: [
            {
              trackId: 'right',
              name: t('variants.items.right'),
              description: stripHtml(t('variants.styles.right')),
              code: codeRight,
              previewFactory: () => buildSheetDemo({
                location: 'docs_variantes',
                side: 'right',
                triggerLabel: t('demonstration.labels.trigger'),
                title: t('demonstration.labels.rightLabel'),
                description: t('demonstration.labels.description'),
                cancelLabel: t('demonstration.labels.cancel'),
                applyLabel: t('demonstration.labels.apply'),
              }),
            },
            {
              trackId: 'left',
              name: t('variants.items.left'),
              description: stripHtml(t('variants.styles.left')),
              code: codeLeft,
              previewFactory: () => buildSheetDemo({
                location: 'docs_variantes',
                side: 'left',
                // O gatilho nomeia a AÇÃO ("Abrir filtros"), e não o lado: é o
                // que `usage.uxWriting.table.trigger` manda, e o rótulo do
                // lado continua no título do painel.
                triggerLabel: t('demonstration.labels.trigger'),
                title: t('demonstration.labels.leftLabel'),
                description: t('demonstration.labels.description'),
                cancelLabel: t('demonstration.labels.cancel'),
                applyLabel: t('demonstration.labels.apply'),
              }),
            },
            {
              trackId: 'top',
              name: t('variants.items.top'),
              description: stripHtml(t('variants.styles.top')),
              code: codeTop,
              previewFactory: () => buildSheetDemo({
                location: 'docs_variantes',
                side: 'top',
                // O gatilho nomeia a AÇÃO ("Abrir filtros"), e não o lado: é o
                // que `usage.uxWriting.table.trigger` manda, e o rótulo do
                // lado continua no título do painel.
                triggerLabel: t('demonstration.labels.trigger'),
                title: t('demonstration.labels.topLabel'),
                description: t('demonstration.labels.description'),
                cancelLabel: t('demonstration.labels.cancel'),
                applyLabel: t('demonstration.labels.apply'),
              }),
            },
            {
              trackId: 'bottom',
              name: t('variants.items.bottom'),
              description: stripHtml(t('variants.styles.bottom')),
              code: codeBottom,
              previewFactory: () => buildSheetDemo({
                location: 'docs_variantes',
                side: 'bottom',
                // O gatilho nomeia a AÇÃO ("Abrir filtros"), e não o lado: é o
                // que `usage.uxWriting.table.trigger` manda, e o rótulo do
                // lado continua no título do painel.
                triggerLabel: t('demonstration.labels.trigger'),
                title: t('demonstration.labels.bottomLabel'),
                description: t('demonstration.labels.description'),
                cancelLabel: t('demonstration.labels.cancel'),
                applyLabel: t('demonstration.labels.apply'),
              }),
            },
          ],
        });
      }

      case 'composicoes': {
        // Os rótulos vêm do conteúdo compartilhado: campo de filtro cravado em
        // português deixaria a composição meio traduzida nas outras duas línguas.
        //
        // Lista do conteúdo compartilhado: o `flattenDict` do i18n indexa array
        // por posição (`items.0`), então a leitura é por índice.
        const listOf = (path: string, total: number) =>
          Array.from({ length: total }, (_, i) => t(`${path}.${i}`));
        const buildAdvancedFiltersBody = () => {
          const form = document.createElement('form');
          // O id existe para o RODAPÉ: ele mora fora do corpo rolável — é o que
          // o mantém visível enquanto o formulário rola —, então a primária só
          // alcança o formulário pelo atributo `form` (PRD D10).
          form.id = 'docs-sheet-filters';
          form.className = 'nds-stack';
          form.dataset.spacing = 'sm';
          // Guarda de submit: sem ela, o Enter num campo tentaria NAVEGAR a
          // página da documentação.
          form.addEventListener('submit', (e) => e.preventDefault());
          ([
            [t('variants.compositions.advancedFilters.fieldCategory'), 'filtro-categoria', t('variants.compositions.advancedFilters.categoryValue')],
            [t('variants.compositions.advancedFilters.fieldMinPrice'), 'filtro-preco-min', '100'],
          ] as const).forEach(([label, id, value]) => {
            const field = document.createElement('div');
            field.className = 'nds-stack';
            field.dataset.spacing = 'xs';
            field.append(
              createLabel({ text: label, htmlFor: id }),
              createInput({ id, value }),
            );
            form.appendChild(field);
          });
          return form;
        };

        const buildSecondaryNavBody = () => {
          const nav = document.createElement('nav');
          nav.setAttribute('aria-label', t('variants.compositions.secondaryNavigation.navLabel'));
          nav.className = 'nds-stack';
          nav.dataset.spacing = 'xs';
          listOf('variants.compositions.secondaryNavigation.items', 5).forEach((label) => {
            const a = document.createElement('a');
            a.href = '#';
            a.className = 'nds-rounded-md nds-px-4 nds-py-2 nds-text-body nds-hover-bg-accent';
            a.textContent = label;
            nav.appendChild(a);
          });
          return nav;
        };

        const buildProfileEditBody = () => {
          const form = document.createElement('form');
          // Mesmo motivo do formulário de filtros: o rodapé é irmão do corpo, e
          // é o atributo `form` da primária que religa os dois (PRD D10).
          form.id = 'docs-sheet-profile';
          form.className = 'nds-stack';
          form.dataset.spacing = 'sm';
          form.addEventListener('submit', (e) => e.preventDefault());
          // Os três campos saem do conteúdo compartilhado, na ordem que as
          // cinco stacks usam. O valor do nome de usuário é identificador, e
          // por isso é o mesmo nos três idiomas.
          ([
            [
              t('variants.compositions.profileEdit.fieldName'),
              'profile-name',
              t('variants.compositions.profileEdit.fieldNameValue'),
            ],
            [
              t('variants.compositions.profileEdit.fieldHandle'),
              'profile-handle',
              t('variants.compositions.profileEdit.fieldHandleValue'),
            ],
            [
              t('variants.compositions.profileEdit.fieldBio'),
              'profile-bio',
              t('variants.compositions.profileEdit.fieldBioValue'),
            ],
          ] as const).forEach(([label, id, value]) => {
            const field = document.createElement('div');
            field.className = 'nds-stack';
            field.dataset.spacing = 'xs';
            field.append(
              createLabel({ text: label, htmlFor: id }),
              createInput({ id, value }),
            );
            form.appendChild(field);
          });
          return form;
        };

        // A fileira de ações repete a mesma tríade das outras quatro stacks: a
        // composição é documentada no conteúdo compartilhado, então o desenho
        // dela não pode divergir de stack para stack.
        const buildBottomPanelBody = () => {
          const list = document.createElement('div');
          list.className = 'nds-cluster';
          list.dataset.spacing = 'md';
          const [share, duplicate, remove] = listOf(
            'variants.compositions.bottomPanel.actions',
            3,
          );
          list.append(
            createButton({ variant: 'outline', label: share }),
            createButton({ variant: 'outline', label: duplicate }),
            createButton({ variant: 'destructive', label: remove }),
          );
          return list;
        };

        return createDocsCompositions({
          title: t('variants.compositionsTitle'),
          useWhenLabel: tNav('common.useWhen'),
          componentSlug: 'sheet',
          items: [
            {
              trackId: 'advancedFilters',
              name: stripHtml(t('variants.compositions.advancedFilters.name')),
              description: t('variants.compositions.advancedFilters.description'),
              useWhen: t('variants.compositions.advancedFilters.use'),
              code: `const trigger = createButton({ variant: 'outline', label: '${t('demonstration.labels.trigger')}' });
const form = document.createElement('form');
// O rodapé é IRMÃO do formulário: é o que o mantém visível enquanto a área
// rola. Por isso a primária não está dentro do <form>, e é o id daqui que o
// atributo 'form' dela religa — sem isso, a tecla Enter não envia nada.
form.id = 'filters';
form.className = 'nds-stack';
form.dataset.spacing = 'sm';
form.addEventListener('submit', (e) => e.preventDefault());
form.append(
  createLabel({ text: '${t('variants.compositions.advancedFilters.fieldCategory')}', htmlFor: 'filtro-categoria' }),
  createInput({ id: 'filtro-categoria', value: '${t('variants.compositions.advancedFilters.categoryValue')}' }),
  createLabel({ text: '${t('variants.compositions.advancedFilters.fieldMinPrice')}', htmlFor: 'filtro-preco-min' }),
  createInput({ id: 'filtro-preco-min', value: '100' }),
);
const apply = createButton({ variant: 'default', label: '${t('demonstration.labels.apply')}', type: 'submit' });
apply.setAttribute('form', 'filters');
const footer = document.createElement('div');
footer.className = 'nds-cluster';
footer.dataset.spacing = 'md';
footer.append(
  createButton({ variant: 'outline', label: '${t('demonstration.labels.cancel')}' }),
  apply,
);
createSheet({
  trigger,
  side: 'right',
  title: '${t('demonstration.labels.title')}',
  description: '${t('demonstration.labels.description')}',
  content: form,
  footer,
});`,
              previewFactory: () => buildSheetDemo({
                location: 'docs_composicoes',
                side: 'right',
                triggerLabel: t('demonstration.labels.trigger'),
                title: t('demonstration.labels.title'),
                description: t('demonstration.labels.description'),
                bodyEl: buildAdvancedFiltersBody(),
                formId: 'docs-sheet-filters',
                cancelLabel: t('demonstration.labels.cancel'),
                applyLabel: t('demonstration.labels.apply'),
              }),
            },
            {
              trackId: 'secondaryNavigation',
              name: stripHtml(t('variants.compositions.secondaryNavigation.name')),
              description: t('variants.compositions.secondaryNavigation.description'),
              useWhen: t('variants.compositions.secondaryNavigation.use'),
              code: `const trigger = createButton({ variant: 'outline', label: '${t('variants.compositions.secondaryNavigation.trigger')}' });

const nav = document.createElement('nav');
nav.setAttribute('aria-label', '${t('variants.compositions.secondaryNavigation.navLabel')}');
nav.className = 'nds-stack';
nav.dataset.spacing = 'xs';
['${listOf('variants.compositions.secondaryNavigation.items', 5).join("', '")}'].forEach(label => {
  const a = document.createElement('a');
  a.href = '#';
  a.className = 'nds-rounded-md nds-px-4 nds-py-2 nds-text-body nds-hover-bg-accent';
  a.textContent = label;
  nav.appendChild(a);
});
createSheet({
  trigger,
  side: 'left',
  title: '${t('variants.compositions.secondaryNavigation.panelTitle')}',
  description: '${t('variants.compositions.secondaryNavigation.panelDescription')}',
  content: nav,
});`,
              previewFactory: () => {
                const trigger = createButton({
                  variant: 'outline',
                  label: t('variants.compositions.secondaryNavigation.trigger'),
                });
                return createSheet({
                  trigger,
                  side: 'left',
                  title: t('variants.compositions.secondaryNavigation.panelTitle'),
                  description: t('variants.compositions.secondaryNavigation.panelDescription'),
                  content: buildSecondaryNavBody(),
                  // Preview VIVO: clique aqui é tão real quanto na demonstração.
                  // Mesmo padrão do `buildSheetDemo` — `label` carrega o side,
                  // que é valor estável, nunca texto traduzido.
                  onOpenChange: (open) => {
                    if (open) {
                      track('dialog_open', {
                        component: 'sheet',
                        label: 'left',
                        location: 'docs_composicoes',
                      });
                    }
                  },
                  onClose: (reason) => {
                    track('dialog_close', {
                      component: 'sheet',
                      label: 'left',
                      reason,
                      location: 'docs_composicoes',
                    });
                  },
                });
              },
            },
            {
              trackId: 'profileEdit',
              name: stripHtml(t('variants.compositions.profileEdit.name')),
              description: t('variants.compositions.profileEdit.description'),
              useWhen: t('variants.compositions.profileEdit.use'),
              code: `const trigger = createButton({ variant: 'outline', label: '${t('variants.compositions.profileEdit.trigger')}' });
const form = document.createElement('form');
// O rodapé é IRMÃO do formulário: é o que o mantém visível enquanto a área
// rola. Por isso a primária não está dentro do <form>, e é o id daqui que o
// atributo 'form' dela religa — sem isso, a tecla Enter não envia nada.
form.id = 'profile';
form.className = 'nds-stack';
form.dataset.spacing = 'sm';
form.addEventListener('submit', (e) => e.preventDefault());
[
  ['${t('variants.compositions.profileEdit.fieldName')}', 'profile-name', '${t('variants.compositions.profileEdit.fieldNameValue')}'],
  ['${t('variants.compositions.profileEdit.fieldHandle')}', 'profile-handle', '${t('variants.compositions.profileEdit.fieldHandleValue')}'],
  ['${t('variants.compositions.profileEdit.fieldBio')}', 'profile-bio', '${t('variants.compositions.profileEdit.fieldBioValue')}'],
].forEach(([label, id, value]) => {
  const field = document.createElement('div');
  field.className = 'nds-stack';
  field.dataset.spacing = 'xs';
  field.append(
    createLabel({ text: label, htmlFor: id }),
    createInput({ id, value }),
  );
  form.appendChild(field);
});
const save = createButton({ variant: 'default', label: '${t('variants.compositions.profileEdit.submit')}', type: 'submit' });
save.setAttribute('form', 'profile');
const footer = document.createElement('div');
footer.className = 'nds-cluster';
footer.dataset.spacing = 'md';
footer.append(
  createButton({ variant: 'outline', label: '${t('demonstration.labels.cancel')}' }),
  save,
);
createSheet({
  trigger,
  side: 'right',
  title: '${t('variants.compositions.profileEdit.panelTitle')}',
  description: '${t('variants.compositions.profileEdit.panelDescription')}',
  content: form,
  footer,
});`,
              previewFactory: () => {
                const trigger = createButton({
                  variant: 'outline',
                  label: t('variants.compositions.profileEdit.trigger'),
                });
                const save = createButton({
                  variant: 'default',
                  label: t('variants.compositions.profileEdit.submit'),
                  // A confirmação é o ENVIO do formulário. O rodapé mora fora do
                  // corpo rolável, então só o atributo `form` o alcança — sem
                  // ele, três campos e nenhuma forma de submeter (PRD D10).
                  type: 'submit',
                });
                save.setAttribute('form', 'docs-sheet-profile');
                const footer = document.createElement('div');
                footer.className = 'nds-cluster';
                footer.dataset.spacing = 'md';
                footer.append(
                  createButton({ variant: 'outline', label: t('demonstration.labels.cancel') }),
                  save,
                );
                // `action` nomeia a ação que o BOTÃO faz: aqui ele salva, então
                // 'save'. 'apply' segue certo nos previews de filtros.
                save.addEventListener('click', () => {
                  track('dialog_confirm', {
                    component: 'sheet',
                    action: 'save',
                    location: 'docs_composicoes',
                  });
                });
                return createSheet({
                  trigger,
                  side: 'right',
                  title: t('variants.compositions.profileEdit.panelTitle'),
                  description: t('variants.compositions.profileEdit.panelDescription'),
                  content: buildProfileEditBody(),
                  footer,
                  onOpenChange: (open) => {
                    if (open) {
                      track('dialog_open', {
                        component: 'sheet',
                        label: 'right',
                        location: 'docs_composicoes',
                      });
                    }
                  },
                  onClose: (reason) => {
                    track('dialog_close', {
                      component: 'sheet',
                      label: 'right',
                      reason,
                      location: 'docs_composicoes',
                    });
                  },
                });
              },
            },
            {
              trackId: 'bottomPanel',
              name: stripHtml(t('variants.compositions.bottomPanel.name')),
              description: t('variants.compositions.bottomPanel.description'),
              useWhen: t('variants.compositions.bottomPanel.use'),
              code: `const trigger = createButton({ variant: 'outline', label: '${t('variants.compositions.bottomPanel.trigger')}' });
const list = document.createElement('div');
list.className = 'nds-cluster';
list.dataset.spacing = 'md';
list.append(
  createButton({ variant: 'outline', label: '${t('variants.compositions.bottomPanel.actions.0')}' }),
  createButton({ variant: 'outline', label: '${t('variants.compositions.bottomPanel.actions.1')}' }),
  createButton({ variant: 'destructive', label: '${t('variants.compositions.bottomPanel.actions.2')}' }),
);
const footer = document.createElement('div');
footer.className = 'nds-cluster';
footer.dataset.spacing = 'md';
footer.append(createButton({ variant: 'outline', label: '${t('variants.compositions.bottomPanel.close')}' }));
createSheet({
  trigger,
  side: 'bottom',
  title: '${t('variants.compositions.bottomPanel.panelTitle')}',
  description: '${t('variants.compositions.bottomPanel.panelDescription')}',
  content: list,
  footer,
});`,
              previewFactory: () => {
                const trigger = createButton({
                  variant: 'outline',
                  label: t('variants.compositions.bottomPanel.trigger'),
                });
                const footer = document.createElement('div');
                footer.className = 'nds-cluster';
                footer.dataset.spacing = 'md';
                footer.append(
                  createButton({
                    variant: 'outline',
                    label: t('variants.compositions.bottomPanel.close'),
                  }),
                );
                return createSheet({
                  trigger,
                  side: 'bottom',
                  title: t('variants.compositions.bottomPanel.panelTitle'),
                  description: t('variants.compositions.bottomPanel.panelDescription'),
                  content: buildBottomPanelBody(),
                  footer,
                  onOpenChange: (open) => {
                    if (open) {
                      track('dialog_open', {
                        component: 'sheet',
                        label: 'bottom',
                        location: 'docs_composicoes',
                      });
                    }
                  },
                  onClose: (reason) => {
                    track('dialog_close', {
                      component: 'sheet',
                      label: 'bottom',
                      reason,
                      location: 'docs_composicoes',
                    });
                  },
                });
              },
            },
          ],
        });
      }

      case 'estados':
        return createDocsStates({
          title: t('states.title'),
          cols: {
            state: t('states.cols.state'),
            trigger: toPlainText(t('states.cols.trigger')),
            behavior: toPlainText(t('states.cols.behavior')),
          },
          items: [
            { label: t('states.closed.label'),         trigger: toPlainText(t('states.closed.trigger')),         behavior: toPlainText(t('states.closed.behavior')) },
            { label: t('states.open.label'),           trigger: toPlainText(t('states.open.trigger')),           behavior: toPlainText(t('states.open.behavior')) },
            { label: t('states.transitioning.label'),  trigger: toPlainText(t('states.transitioning.trigger')),  behavior: toPlainText(t('states.transitioning.behavior')) },
            { label: t('states.focused.label'),        trigger: toPlainText(t('states.focused.trigger')),        behavior: toPlainText(t('states.focused.behavior')) },
            { label: t('states.longScrollBody.label'), trigger: toPlainText(t('states.longScrollBody.trigger')), behavior: toPlainText(t('states.longScrollBody.behavior')) },
          ],
        });

      case 'propriedades': {
        const interfaceCode = `// createSheet(options) — factory custom Nortear
export type SheetSide = 'top' | 'bottom' | 'left' | 'right';

export type SheetOptions = {
  trigger: HTMLElement;
  side?: SheetSide;
  title?: string;
  description?: string;
  content: HTMLElement;
  footer?: HTMLElement;
  onOpenChange?: (open: boolean) => void;
  class?: string;
};

export function createSheet(options: SheetOptions): HTMLElement;`;

        const propsCols = {
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
              title: 'createSheet(options)',
              cols: propsCols,
              items: [
                { name: 'trigger',         type: 'HTMLElement',                                       defaultValue: '—',       required: 'Sim', description: 'Elemento que abre o Sheet ao receber click (geralmente Button).' },
                { name: 'side',            type: "'top' | 'right' | 'bottom' | 'left'",               defaultValue: "'right'", required: 'Não', description: toPlainText(t('props.table.side.description')) },
                { name: 'title',           type: 'string',                                            defaultValue: '—',       required: 'Não', description: 'Texto do SheetTitle — fonte do aria-labelledby. RECOMENDADO para acessibilidade.' },
                { name: 'description',     type: 'string',                                            defaultValue: '—',       required: 'Não', description: 'Texto da SheetDescription — fonte do aria-describedby. RECOMENDADO para acessibilidade.' },
                { name: 'content',         type: 'HTMLElement',                                       defaultValue: '—',       required: 'Sim', description: 'Body do painel (formulário, lista, mensagem).' },
                { name: 'footer',          type: 'HTMLElement',                                       defaultValue: '—',       required: 'Não', description: 'Container das ações (Cancelar + ação primária).' },
                { name: 'onOpenChange',    type: '(open: boolean) => void',                           defaultValue: '—',       required: 'Não', description: toPlainText(t('props.table.onOpenChange.description')) },
                { name: 'class',           type: 'string',                                            defaultValue: '—',       required: 'Não', description: toPlainText(t('props.table.className.description')) },
                { name: 'open',            type: 'boolean',                                           defaultValue: '—',       required: 'Não', description: 'NÃO SUPORTADO pela factory Nortear — estado é interno (uncontrolled). Use onOpenChange para observar mudanças.' },
                { name: 'defaultOpen',     type: 'boolean',                                           defaultValue: 'false',   required: 'Não', description: 'NÃO SUPORTADO pela factory Nortear — para abrir programaticamente, chame `trigger.click()`.' },
                { name: 'showCloseButton', type: 'boolean',                                           defaultValue: 'true',    required: 'Não', description: 'NÃO SUPORTADO como prop — o botão X é sempre exibido. Esconda via CSS no `class` se necessário.' },
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
          title: t('tokens.title'),
          cols: {
            token: t('tokens.table.token'),
            value: t('tokens.table.class'),
            description: t('tokens.table.part'),
          },
          items: [
            { token: '--background', value: t('tokens.table.background.class'), description: t('tokens.table.background.part') },
            { token: '--foreground', value: t('tokens.table.foreground.class'), description: t('tokens.table.foreground.part') },
            { token: '--muted-foreground', value: t('tokens.table.mutedForeground.class'), description: t('tokens.table.mutedForeground.part') },
            { token: '--border', value: t('tokens.table.border.class'), description: t('tokens.table.border.part') },
            { token: '--overlay', value: t('tokens.table.overlay.class'), description: t('tokens.table.overlay.part') },
            { token: '--ring', value: t('tokens.table.ring.class'), description: t('tokens.table.ring.part') },
            { token: '--sheet-width', value: t('tokens.table.width.class'), description: t('tokens.table.width.part') },
            { token: '--sheet-max-width', value: t('tokens.table.maxWidth.class'), description: t('tokens.table.maxWidth.part') },
          ],
          customizationTitle: t('tokens.customizationTitle'),
          customizationCode: t('tokens.customizationCode'),
        });

      case 'acessibilidade':
        return createDocsAccessibility({
          screenReaderTitle: tNav('common.screenReader'),
          screenReaderItems: screenReaderItems(),
          title: t('accessibility.title'),
          summary: t('accessibility.summary'),
          items: [1, 2, 3, 4, 5, 6, 7, 8].map(i => DOMPurify.sanitize(t(`accessibility.items.item${i}`))),
          keyboardTitle: t('accessibility.keyboard.title'),
          keyboardItems: [
            { key: 'Tab',       description: t('accessibility.keyboard.tab')      },
            { key: 'Shift+Tab', description: t('accessibility.keyboard.shiftTab') },
            { key: 'Esc',       description: t('accessibility.keyboard.escape')   },
            { key: 'Enter',     description: t('accessibility.keyboard.enter')    },
          ],
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: t('related.items.drawer.name'),      description: toPlainText(t('related.items.drawer.description')),      path: '?path=/docs/components-overlay-drawer--docs'      },
            { name: t('related.items.dialog.name'),      description: toPlainText(t('related.items.dialog.description')),      path: '?path=/docs/components-overlay-dialog--docs'       },
            { name: t('related.items.alertDialog.name'), description: toPlainText(t('related.items.alertDialog.description')), path: '?path=/docs/components-overlay-alertdialog--docs' },
            { name: t('related.items.popover.name'),     description: toPlainText(t('related.items.popover.description')),     path: '?path=/docs/components-overlay-popover--docs'     },
          ],
        });

      case 'notas':
        return createDocsNotes({
          title: t('notes.title'),
          items: [
            { title: '', content: DOMPurify.sanitize(t('notes.item1')) },
            { title: '', content: DOMPurify.sanitize(t('notes.item2')) },
            { title: '', content: DOMPurify.sanitize(t('notes.item3')) },
            { title: '', content: DOMPurify.sanitize(t('notes.item4')) },
            // Divergência idiomática Nortear — camada 1 (notes) do padrão 3-layer.
            { title: '', content: DOMPurify.sanitize('<strong>Divergência Nortear</strong>: a factory <code>createSheet</code> não expõe props <code>open</code>/<code>defaultOpen</code>/<code>showCloseButton</code>. Para abertura programática, mantenha referência ao <code>trigger</code> e chame <code>trigger.click()</code>. O X embutido sempre é renderizado.') },
          ],
        });

      case 'analytics':
        return createDocsAnalytics({
          title: t('analytics.title'),
          cols: {
            event: t('analytics.table.event'),
            trigger: toPlainText(t('analytics.table.trigger')),
            payload: t('analytics.table.payload'),
          },
          items: [
            { event: 'dialog_open',    trigger: toPlainText(t('analytics.table.dialog_open.trigger')),    payload: t('analytics.table.dialog_open.payload') },
            { event: 'dialog_close',   trigger: toPlainText(t('analytics.table.dialog_close.trigger')),   payload: t('analytics.table.dialog_close.payload') },
            { event: 'dialog_confirm', trigger: toPlainText(t('analytics.table.dialog_confirm.trigger')), payload: t('analytics.table.dialog_confirm.payload') },
          ],
        });

      case 'testes':
        return createDocsTestes({
          title: t('testes.title'),
          functional: {
            title: t('testes.functional.title'),
            cols: {
              action: tNav('common.userAction'),
              result: tNav('common.expectedResult'),
              priority: tNav('common.priority'),
            },
            items: [1, 2, 3, 4].map(i => ({
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
            items: [1, 2, 3, 4, 5].map(i => ({
              criterion: t(`testes.accessibility.item${i}`),
              level: 'AA',
              how: 'axe-core / manual',
            })),
          },
          visual: {
            title: t('testes.visual.title'),
            cols: {
              story: tNav('common.storyState'),
              priority: tNav('common.priority'),
            },
            items: [1, 2, 3, 4].map(i => ({
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
        component_name: 'sheet',
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
      // Remove qualquer painel/overlay portado para body que tenha sido deixado órfão
      document.querySelectorAll('[data-slot="sheet-content"], [data-slot="sheet-overlay"]').forEach((n) => n.remove());
      mo.disconnect();
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });

  return root;
}
