import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { createContextMenu } from '@/components/ui/context-menu';
import uiTranslations from '@/i18n/ui.json';
import contextMenuTranslations from '@shared/content/context-menu/translations.json';
import { toPlainText } from '@/lib/strip-html';
import { AREA_CLICK_DIREITO } from '@shared/primitives/context-menu-area';

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

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t: tNav } = createTranslation(uiTranslations as Record<string, unknown>);

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria.
function screenReaderItems(): string[] {
  const locale = getLocale();
  return Object.values(
    (contextMenuTranslations as unknown as Record<string, { accessibility?: { screenReader?: Record<string, string> } }>)[locale]
      ?.accessibility?.screenReader ?? {},
  );
}
const { t, subscribe } = createTranslation(contextMenuTranslations as Record<string, unknown>);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const priorityKeyMap: Record<string, string> = {
  high:   'common.high',
  medium: 'common.medium',
  low:    'common.low',
};

function priorityLabel(raw: string): string {
  return tNav(priorityKeyMap[raw] ?? 'common.high');
}

/**
 * A moldura tracejada é o único sinal de "clique com o botão direito aqui", e a
 * mesma classe vale nas stories e nas cinco docs pages. `nds-border-default` traz
 * largura e cor; `nds-border-dashed` só troca `border-style` — as duas juntas, ou
 * a moldura sai sólida.
 *
 * O que era `style` inline (altura de 120px, largura máxima e `border-style`)
 * virou classe: altura cravada num bloco de texto não cresce com a fonte do
 * navegador (WCAG 1.4.4), e o `nds-p-8` entrega o mesmo quadro sem cravá-la.
 * `user-select: none` já vem de `.nds-context-menu-trigger`, que a factory aplica.
 */
function makeTriggerArea(label: string): HTMLElement {
  const el = document.createElement('div');
  el.className = AREA_CLICK_DIREITO;
  el.dataset.align = 'center';
  el.dataset.justify = 'center';
  el.textContent = label;
  return el;
}

function buildDemoMenu(): HTMLElement {
  const trigger = makeTriggerArea(t('demonstration.labels.triggerLabel'));
  const trackItem = (label: string) => () => {
    track('menu_item_click', { label, menu: 'demo', location: 'docs_demo' });
  };
  return createContextMenu({
    trigger,
    items: [
      { type: 'item',      label: t('demonstration.labels.edit'),      value: 'edit',      onClick: trackItem(t('demonstration.labels.edit')) },
      { type: 'item',      label: t('demonstration.labels.duplicate'), value: 'duplicate', onClick: trackItem(t('demonstration.labels.duplicate')) },
      { type: 'item',      label: t('demonstration.labels.share'),     value: 'share',     onClick: trackItem(t('demonstration.labels.share')) },
      { type: 'separator' },
      { type: 'item',      label: t('demonstration.labels.delete'),    value: 'delete',    onClick: trackItem(t('demonstration.labels.delete')) },
    ],
    onOpenChange: (open) => {
      if (open) {
        track('menu_open', { component: 'context_menu', location: 'docs_demo', menu: 'demo' });
      }
    },
  });
}

function buildSimpleTriggerArea(label: string): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'nds-cluster nds-p-4';
  wrap.dataset.align = 'center';
  wrap.dataset.justify = 'center';
  wrap.appendChild(makeTriggerArea(label));
  return wrap;
}

/**
 * Prévia que monta o COMPONENTE de verdade — a forma que as outras quatro
 * stacks já usavam nesta página.
 *
 * Antes desta passada as prévias e os trechos de código desenhavam painel,
 * item, separador e indicador à mão, com `min-width`, `padding`, `margin` e
 * cor cravados em `style` inline: dezesseis declarações que saíam do tema, da
 * densidade e da escala de tipo. Pior que o estilo era a semântica — havia
 * `<li role="menuitem">` SOLTO, fora de qualquer `role="menu"`, que é órfão
 * para o leitor de tela e viola `aria-required-parent` —, e pior ainda era o
 * fato de a fábrica JÁ entregar tudo isso: marcação, escolha única, submenu,
 * atalho, recuo e variante destrutiva são tipos de item, não markup de quem
 * consome. A página ensinava a contornar um componente completo.
 */
function buildMenuPreview(options: {
  label?: string;
  items: Parameters<typeof createContextMenu>[0]['items'];
  radioValue?: string;
}): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'nds-cluster nds-w-full';
  wrap.dataset.align = 'center';
  wrap.dataset.justify = 'center';
  wrap.appendChild(
    createContextMenu({
      trigger: makeTriggerArea(options.label ?? t('demonstration.labels.triggerLabel')),
      items: options.items,
      radioValue: options.radioValue,
    }),
  );
  return wrap;
}

// ─── createContextMenuDocs ────────────────────────────────────────────────────

export function createContextMenuDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────

  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'context-menu',
    });
    track('docs_page_view', {
      component_name: 'context_menu',
      locale,
      page_title: `${t('title')} · Design System`,
    });
    return cleanup;
  }
  let cleanupSeo = updateSeo();
  cleanups.push(() => cleanupSeo());
  cleanups.push(subscribe(() => { cleanupSeo(); cleanupSeo = updateSeo(); }));

  // ── Nav groups ───────────────────────────────────────────────────────────

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
  const root       = pageLayout.root;
  const headerSlot = pageLayout.headerSlot;
  const main       = pageLayout.main;

  function renderHeader() {
    const header = createDocsHeader({
      title: t('title'),
      description: t('description'),
      category: t('category'),
      type: t('type'),
    });
    headerSlot.replaceChildren(header);
  }

  function buildSidebar() {
    pageLayout.rebuildNav(buildNavGroups());
  }

  function updateActiveNav(activeId: string) {
    pageLayout.setActiveSection(activeId);
  }

  // ── Section order ─────────────────────────────────────────────────────────

  const sectionOrder = [
    'demonstracao', 'anatomia', 'quando-usar', 'do-dont',
    'importacao', 'variantes', 'estados', 'propriedades', 'tokens',
    'acessibilidade', 'relacionados', 'notas', 'analytics', 'testes',
  ] as const;
  type SectionId = typeof sectionOrder[number];

  const sectionEls: Record<SectionId, HTMLElement> = {} as Record<SectionId, HTMLElement>;

  function buildSection(id: SectionId): HTMLElement {
    switch (id) {

      // ── 1. Demonstração ──────────────────────────────────────────────────
      case 'demonstracao':
        return createDocsDemonstration({
          title: t('demonstration.title'),
          demoFactory: () => {
            const wrap = document.createElement('div');
            wrap.className = 'nds-cluster nds-p-8';
            wrap.dataset.align = 'center';
            wrap.dataset.justify = 'center';
            wrap.classList.add('nds-min-h-50');
            wrap.appendChild(buildDemoMenu());
            return wrap;
          },
        });

      // ── 2. Anatomia ──────────────────────────────────────────────────────
      case 'anatomia':
        return createDocsAnatomy({
          title: t('anatomy.title'),
          items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => t(`anatomy.item${i}`)),
          structureLabel: t('anatomy.structureLabel'),
          structureCode: t('anatomy.structureCode'),
        });

      // ── 3. Quando Usar ───────────────────────────────────────────────────
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
              scenario:    t('usage.scenarios.cols.scenario'),
              use:         t('usage.scenarios.cols.use'),
              alternative: t('usage.scenarios.cols.alternative'),
            },
            items: [1, 2, 3, 4].map(i => ({
              s: t(`usage.scenarios.item${i}.s`),
              u: t(`usage.scenarios.item${i}.u`),
              a: t(`usage.scenarios.item${i}.a`),
            })),
          },
          do: {
            title: t('usage.do.title'),
            items: [1, 2, 3, 4].map(i => t(`usage.do.item${i}`)),
          },
          dont: {
            title: t('usage.dont.title'),
            items: [1, 2, 3].map(i => t(`usage.dont.item${i}`)),
          },
        });

      // ── 4. Do & Don't ────────────────────────────────────────────────────
      case 'do-dont':
        return createDocsDoDont({
          title: t('doDont.title'),
          pairs: [
            {
              doLabel:      tNav('common.do'),
              dontLabel:    tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair1.do')),
              dontCaption: toPlainText(t('doDont.pair1.dont')),
              // O menu contextual COM um caminho visível ao lado — o assunto
              // mais importante deste componente é que o gesto nunca seja o
              // único caminho.
              doPreviewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'nds-cluster nds-w-full';
                wrap.dataset.spacing = 'sm';
                wrap.dataset.align = 'center';
                wrap.dataset.justify = 'center';
                wrap.appendChild(
                  createContextMenu({
                    trigger: makeTriggerArea(t('demonstration.labels.triggerLabel')),
                    items: [
                      { type: 'item', label: t('demonstration.labels.edit'), value: 'edit' },
                      { type: 'item', label: t('demonstration.labels.delete'), value: 'delete', variant: 'destructive' },
                    ],
                  }),
                );
                const alternativa = document.createElement('button');
                alternativa.type = 'button';
                alternativa.className = 'nds-button nds-button-outline nds-button-sm';
                alternativa.textContent = t('demonstration.labels.edit');
                wrap.appendChild(alternativa);
                return wrap;
              },
              dontPreviewFactory: () =>
                buildMenuPreview({
                  items: [
                    { type: 'item', label: t('demonstration.labels.delete'), value: 'delete', variant: 'destructive' },
                  ],
                }),
            },
            {
              doLabel:      tNav('common.do'),
              dontLabel:    tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair2.do')),
              dontCaption: toPlainText(t('doDont.pair2.dont')),
              doPreviewFactory: () =>
                buildMenuPreview({
                  items: [
                    { type: 'item', label: t('demonstration.labels.edit'), value: 'edit' },
                    { type: 'item', label: t('demonstration.labels.duplicate'), value: 'duplicate' },
                    { type: 'separator' },
                    { type: 'item', label: t('demonstration.labels.delete'), value: 'delete', variant: 'destructive' },
                  ],
                }),
              // Submenu dentro de submenu — o anti-padrão que `notes.tip3` nomeia.
              dontPreviewFactory: () =>
                buildMenuPreview({
                  items: [
                    {
                      type: 'submenu',
                      label: t('demonstration.labels.share'),
                      value: 'share',
                      items: [
                        {
                          type: 'submenu',
                          label: t('demonstration.labels.shareLink'),
                          value: 'share-link',
                          items: [
                            { type: 'item', label: t('demonstration.labels.shareEmail'), value: 'share-email' },
                          ],
                        },
                      ],
                    },
                  ],
                }),
            },
            {
              doLabel:      tNav('common.do'),
              dontLabel:    tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair3.do')),
              dontCaption: toPlainText(t('doDont.pair3.dont')),
              doPreviewFactory: () =>
                buildMenuPreview({
                  items: [
                    { type: 'item', label: t('demonstration.labels.edit'), value: 'edit', shortcut: t('demonstration.labels.editShortcut') },
                  ],
                }),
              // A área sem nenhuma pista visual de que o gesto existe. Sem
              // `opacity`: o esmaecimento levava o texto a 1.52:1 (axe:
              // color-contrast), e o próprio texto já comunica a ausência.
              dontPreviewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'nds-cluster nds-w-full nds-rounded-md nds-border-destructive-soft nds-text-body nds-text-muted-foreground nds-cursor-default';
                wrap.dataset.align = 'center';
                wrap.dataset.justify = 'center';
                const hint = document.createElement('span');
                hint.textContent = '(sem dica visual)';
                wrap.appendChild(hint);
                return wrap;
              },
            },
          ],
        });

      // ── 5. Importação ────────────────────────────────────────────────────
      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          description: t('import.basic'),
          code: `import { createContextMenu } from '@/components/ui/context-menu';`,
          secondaryDescription: t('import.withCheckbox'),
          secondaryCode: `// Marcação e escolha única são TIPOS de item — a fábrica emite os papéis,
// o aria-checked e o indicador. Não há markup a montar à mão.
createContextMenu({
  trigger,
  radioValue: 'grid',
  items: [
    { type: 'checkbox', label: 'Mostrar grade', value: 'grade', checked: true },
    { type: 'separator' },
    { type: 'radio', label: 'Grade', value: 'grid' },
    { type: 'radio', label: 'Lista', value: 'list' },
  ],
});`,
        });

      // ── 6. Variantes ─────────────────────────────────────────────────────
      case 'variantes': {
        // Os trechos abaixo ensinam a API DA FÁBRICA, e não markup montado à
        // mão. Antes desta passada eles mostravam `<li>` construído item a
        // item — com classes do Tailwind, que saiu do projeto e por isso
        // renderizam sem estilo nenhum; com `aria-hidden` no atalho, que
        // contradiz `accessibility.screenReader.shortcuts` e as asserções das
        // cinco stacks; e com dimensões cravadas em `style` inline. Tudo isso
        // já é tipo de item na fábrica, e quem copiava recebia o contrário do
        // contrato.
        const codeDefault = `const trigger = document.createElement('div');
trigger.textContent = 'Clique com o botão direito';

createContextMenu({
  trigger,
  items: [
    { type: 'item', label: 'Editar',      value: 'edit'      },
    { type: 'item', label: 'Duplicar',    value: 'duplicate' },
    { type: 'separator' },
    { type: 'item', label: 'Excluir',     value: 'delete'    },
  ],
});`;

        const codeDestructive = `// A variante é do ITEM, não classe de cor escrita à mão: é ela que liga
// o data-variant, e é o data-variant que a folha compartilhada lê.
{ type: 'item', label: 'Excluir', value: 'delete', variant: 'destructive' }`;

        const codeLabel = `// Rótulo de grupo, não interativo. inset alinha com os itens que têm
// indicador à esquerda.
{ type: 'label', label: 'Ações', inset: true }`;

        const codeCompCheckbox = `// Marcação: a fábrica emite role="menuitemcheckbox", aria-checked e o
// indicador. indeterminate anuncia "mixed" e desenha traço, não tique.
createContextMenu({
  trigger,
  items: [
    { type: 'label',    label: 'Visualização' },
    { type: 'checkbox', label: 'Mostrar grade',  value: 'grade',  checked: false,
      onCheckedChange: (checked) => console.log('grade', checked) },
    { type: 'checkbox', label: 'Mostrar réguas', value: 'reguas', checked: true },
  ],
});`;

        const codeCompRadio = `// Escolha única: o valor corrente vive no MENU (radioValue), não em cada
// item. Marcar uma opção não fecha o menu.
createContextMenu({
  trigger,
  radioValue: 'grid',
  onRadioChange: (value) => console.log('layout', value),
  items: [
    { type: 'label', label: 'Layout' },
    { type: 'radio', label: 'Grade',   value: 'grid'    },
    { type: 'radio', label: 'Lista',   value: 'list'    },
    { type: 'radio', label: 'Colunas', value: 'columns' },
  ],
});`;

        const codeCompSubmenu = `// Submenu: um item com items. A fábrica cuida de aria-haspopup,
// aria-expanded, do posicionamento à direita e das setas.
createContextMenu({
  trigger,
  items: [
    { type: 'item',    label: 'Editar', value: 'edit' },
    { type: 'submenu', label: 'Compartilhar', value: 'share', items: [
      { type: 'item', label: 'Por e-mail', value: 'share-email' },
      { type: 'item', label: 'Por link',   value: 'share-link'  },
    ]},
  ],
});`;

        const codeCompShortcuts = `// O atalho é campo do item. NÃO leva aria-hidden: "Excluir, Delete" é o
// nome útil, e escondê-lo deixaria a pessoa sem saber que o atalho existe.
// A tecla de verdade continua sendo um listener de quem monta a tela.
createContextMenu({
  trigger,
  items: [
    { type: 'item', label: 'Editar',   value: 'edit',      shortcut: 'Ctrl+E'  },
    { type: 'item', label: 'Duplicar', value: 'duplicate', shortcut: 'Ctrl+D'  },
    { type: 'separator' },
    { type: 'item', label: 'Excluir',  value: 'delete',    shortcut: 'Delete',
      variant: 'destructive' },
  ],
});`;

        return createDocsCompositions({
          id: 'variantes',
          title: t('variants.title'),
          useWhenLabel: tNav('common.useWhen'),
          componentSlug: 'context-menu',
          items: [
            {
              name: 'default',
              description: t('variants.items.default'),
              code: codeDefault,
              previewFactory: () => buildSimpleTriggerArea(t('demonstration.labels.triggerLabel')),
            },
            {
              name: 'destructive',
              description: t('variants.items.destructive'),
              code: codeDestructive,
              previewFactory: () =>
                buildMenuPreview({
                  items: [
                    { type: 'item', label: t('demonstration.labels.edit'), value: 'edit' },
                    { type: 'separator' },
                    { type: 'item', label: t('demonstration.labels.delete'), value: 'delete', variant: 'destructive' },
                  ],
                }),
            },
            {
              name: 'label',
              description: t('variants.items.label'),
              code: codeLabel,
              previewFactory: () =>
                buildMenuPreview({
                  items: [
                    { type: 'label', label: 'Ações', inset: true },
                    { type: 'item', label: t('demonstration.labels.edit'), value: 'edit', inset: true },
                    { type: 'item', label: t('demonstration.labels.duplicate'), value: 'duplicate', inset: true },
                  ],
                }),
            },
            {
              name: t('variants.items.withCheckbox.name'),
              trackId: 'withCheckbox',
              description: t('variants.items.withCheckbox.description'),
              useWhen: t('variants.items.withCheckbox.use'),
              code: codeCompCheckbox,
              previewFactory: () =>
                buildMenuPreview({
                  items: [
                    { type: 'label', label: 'Visualização' },
                    { type: 'checkbox', label: 'Mostrar grade', value: 'grade', checked: true },
                    { type: 'checkbox', label: 'Mostrar réguas', value: 'reguas', checked: false },
                  ],
                }),
            },
            {
              name: t('variants.items.withRadio.name'),
              trackId: 'withRadio',
              description: t('variants.items.withRadio.description'),
              useWhen: t('variants.items.withRadio.use'),
              code: codeCompRadio,
              previewFactory: () =>
                buildMenuPreview({
                  radioValue: '100',
                  items: [
                    { type: 'label', label: 'Zoom' },
                    { type: 'radio', label: '75%',  value: '75'  },
                    { type: 'radio', label: '100%', value: '100' },
                    { type: 'radio', label: '150%', value: '150' },
                  ],
                }),
            },
            {
              name: t('variants.items.withSubmenu.name'),
              trackId: 'withSubmenu',
              description: t('variants.items.withSubmenu.description'),
              useWhen: t('variants.items.withSubmenu.use'),
              code: codeCompSubmenu,
              previewFactory: () =>
                buildMenuPreview({
                  items: [
                    { type: 'item', label: t('demonstration.labels.edit'), value: 'edit' },
                    { type: 'item', label: t('demonstration.labels.duplicate'), value: 'duplicate' },
                    {
                      type: 'submenu',
                      label: t('demonstration.labels.share'),
                      value: 'share',
                      items: [
                        { type: 'item', label: t('demonstration.labels.shareEmail'), value: 'share-email' },
                        { type: 'item', label: t('demonstration.labels.shareLink'), value: 'share-link' },
                      ],
                    },
                  ],
                }),
            },
            {
              name: t('variants.items.withShortcuts.name'),
              trackId: 'withShortcuts',
              description: t('variants.items.withShortcuts.description'),
              useWhen: t('variants.items.withShortcuts.use'),
              code: codeCompShortcuts,
              previewFactory: () =>
                buildMenuPreview({
                  items: [
                    { type: 'item', label: t('demonstration.labels.edit'), value: 'edit', shortcut: 'Ctrl+E' },
                    { type: 'item', label: t('demonstration.labels.duplicate'), value: 'duplicate', shortcut: 'Ctrl+D' },
                    { type: 'separator' },
                    { type: 'item', label: t('demonstration.labels.delete'), value: 'delete', shortcut: 'Delete', variant: 'destructive' },
                  ],
                }),
            },
          ],
        });
      }

      // ── 7. Estados ───────────────────────────────────────────────────────
      case 'estados':
        return createDocsStates({
          title: t('states.title'),
          cols: {
            state:    t('states.cols.state'),
            trigger: toPlainText(t('states.cols.trigger')),
            behavior: toPlainText(t('states.cols.behavior')),
          },
          items: [
            { label: t('states.closed.label'),  trigger: toPlainText(t('states.closed.trigger')),  behavior: toPlainText(t('states.closed.behavior'))},
            { label: t('states.open.label'),     trigger: toPlainText(t('states.open.trigger')),    behavior: toPlainText(t('states.open.behavior'))},
            { label: t('states.focused.label'),  trigger: toPlainText(t('states.focused.trigger')), behavior: toPlainText(t('states.focused.behavior'))},
            { label: t('states.disabled.label'), trigger: toPlainText(t('states.disabled.trigger')),behavior: toPlainText(t('states.disabled.behavior'))},
            { label: t('states.checked.label'),  trigger: toPlainText(t('states.checked.trigger')), behavior: toPlainText(t('states.checked.behavior'))},
            { label: t('states.subOpen.label'),  trigger: toPlainText(t('states.subOpen.trigger')), behavior: toPlainText(t('states.subOpen.behavior'))},
          ],
        });

      // ── 8. Propriedades ──────────────────────────────────────────────────
      case 'propriedades': {
        // A tipagem abaixo é a da fábrica, conferida linha a linha contra
        // `components/ui/context-menu.ts`. A versão anterior parava em
        // `'item' | 'separator' | 'label'` e omitia marcação, escolha única,
        // submenu, atalho, recuo e variante — a página prometia MENOS do que o
        // componente entrega, e por isso os trechos ao lado ensinavam a montar
        // à mão o que já existia.
        const interfaceCode = `// createContextMenu(options)
export type ContextMenuItemDef = {
  type?:           'item' | 'separator' | 'label' | 'checkbox' | 'radio' | 'submenu';
  value?:          string;
  label?:          string;
  disabled?:       boolean;
  inset?:          boolean;
  variant?:        'default' | 'destructive';
  shortcut?:       string;
  checked?:        boolean;
  indeterminate?:  boolean;
  items?:          ContextMenuItemDef[];
  onClick?:              () => void;
  onCheckedChange?:      (checked: boolean) => void;
  onIndeterminateChange?: (indeterminate: boolean) => void;
};

export type ContextMenuOptions = {
  trigger:        HTMLElement;
  items:          ContextMenuItemDef[];
  onOpenChange?:  (open: boolean) => void;
  radioValue?:    string;
  onRadioChange?: (value: string) => void;
  class?:         string;
};`;

        const propsCols = {
          prop:        t('props.table.prop'),
          type:        t('props.table.type'),
          default:     t('props.table.default'),
          required:    t('props.table.required'),
          description: t('props.table.description'),
        };

        return createDocsProps({
          title: t('props.title'),
          tables: [
            {
              title: t('props.rootTitle'),
              cols: propsCols,
              items: [
                { name: 'trigger',       type: 'HTMLElement',             defaultValue: '—', required: 'Sim', description: 'Elemento que captura o gesto — clique direito, tecla de menu ou Shift+F10 sobre ele.' },
                { name: 'items',         type: 'ContextMenuItemDef[]',    defaultValue: '—', required: 'Sim', description: 'Lista de itens, separadores, rótulos e submenus do menu.' },
                { name: 'onOpenChange',  type: '(open: boolean) => void', defaultValue: '—', required: 'Não', description: t('props.items.onOpenChange') },
                { name: 'radioValue',    type: 'string',                  defaultValue: '—', required: 'Não', description: 'Valor corrente do grupo de escolha única — ele vive no menu, não em cada item.' },
                { name: 'onRadioChange', type: '(value: string) => void', defaultValue: '—', required: 'Não', description: 'Disparado quando outra opção de escolha única passa a valer.' },
                { name: 'class',         type: 'string',                  defaultValue: '—', required: 'Não', description: 'Classes extras aplicadas ao painel do menu.' },
              ],
            },
            {
              title: t('props.itemTitle'),
              cols: propsCols,
              items: [
                { name: 'type',          type: '"item" | "separator" | "label" | "checkbox" | "radio" | "submenu"', defaultValue: '"item"', required: 'Não', description: 'Tipo do item. "submenu" exige items; "radio" exige value.' },
                { name: 'label',         type: 'string',                       defaultValue: '—',     required: 'Não', description: 'Texto exibido no item ou no rótulo.' },
                { name: 'value',         type: 'string',                       defaultValue: '—',     required: 'Não', description: t('props.items.value') },
                { name: 'disabled',      type: 'boolean',                      defaultValue: 'false', required: 'Não', description: t('props.items.disabled') },
                { name: 'inset',         type: 'boolean',                      defaultValue: 'false', required: 'Não', description: 'Recuo à esquerda, para alinhar com itens que têm indicador.' },
                { name: 'variant',       type: '"default" | "destructive"',    defaultValue: '"default"', required: 'Não', description: 'Só em item de ação: "destructive" pinta o item com a cor de alerta.' },
                { name: 'shortcut',      type: 'string',                       defaultValue: '—',     required: 'Não', description: 'Atalho exibido à direita do rótulo, e lido junto dele — não é escondido do leitor de tela.' },
                { name: 'checked',       type: 'boolean',                      defaultValue: 'false', required: 'Não', description: 'Estado inicial de um item de marcação.' },
                { name: 'indeterminate', type: 'boolean',                      defaultValue: 'false', required: 'Não', description: 'Estado misto de um item de marcação: anunciado como "mixed" e desenhado com traço. O primeiro clique o resolve para marcado.' },
                { name: 'items',         type: 'ContextMenuItemDef[]',         defaultValue: '—',     required: 'Não', description: 'Itens do submenu, quando o tipo é "submenu".' },
                { name: 'onClick',       type: '() => void',                   defaultValue: '—',     required: 'Não', description: t('props.items.onSelect') },
                { name: 'onCheckedChange', type: '(checked: boolean) => void', defaultValue: '—',     required: 'Não', description: 'Disparado a cada alternância de um item de marcação.' },
              ],
            },
          ],
          interfaceCode,
          extensibilityTitle: t('props.extensibilityTitle'),
          extensibilityNotes: t('props.extensibility'),
        });
      }

      // ── 9. Tokens ────────────────────────────────────────────────────────
      case 'tokens': {
        const customizationCode = `/* Em styles.css — sobrescrever tokens do popover */
:root {
  --popover:            0 0% 100%;
  --popover-foreground: 240 10% 3.9%;
  --accent:             240 4.8% 95.9%;
  --accent-foreground:  240 5.9% 10%;
  --destructive:        0 84.2% 60.2%;
}

.dark {
  --popover:            240 10% 3.9%;
  --popover-foreground: 0 0% 98%;
  --accent:             240 3.7% 15.9%;
  --accent-foreground:  0 0% 98%;
}`;

        return createDocsTokens({
          title: t('tokens.title'),
          cols: {
            token:       t('tokens.table.token'),
            value:       t('tokens.table.class'),
            description: t('tokens.table.part'),
          },
          items: [
            // A coluna do meio é "Classe .nds-*" e trazia nome de utilitária do
            // Tailwind — vocabulário morto desde a migração. Cada linha aponta
            // agora o seletor que o CSS realmente usa, e cada token foi medido
            // no navegador: só `--elevation-md` muda a sombra (`--shadow-md` não
            // move nada aqui), o separador é `--muted` e não `--border`, o raio
            // do item é `--radius-sm` e a camada é `--z-popover` — `z-50` era
            // nome de utilitária, não token.
            { token: '--popover',            value: '.nds-dropdown-menu-content',    description: t('tokens.table.popoverBg')        },
            { token: '--popover-foreground', value: '.nds-dropdown-menu-content',    description: t('tokens.table.popoverFg')        },
            { token: '--accent',             value: '.nds-dropdown-menu-item',       description: t('tokens.table.accentBg')         },
            { token: '--accent-foreground',  value: '.nds-dropdown-menu-item',       description: t('tokens.table.accentFg')         },
            { token: '--destructive',        value: '[data-variant="destructive"]',  description: t('tokens.table.destructive')      },
            { token: '--destructive',        value: '.nds-dropdown-menu-item[data-variant="destructive"]:focus', description: t('tokens.table.destructiveFocus') },
            { token: '--muted-foreground',   value: '.nds-dropdown-menu-shortcut',   description: t('tokens.table.mutedFg')          },
            { token: '--muted-foreground',   value: '.nds-dropdown-menu-label',      description: t('tokens.table.mutedFgLabel')     },
            { token: '--muted',              value: '.nds-dropdown-menu-separator',  description: t('tokens.table.border')           },
            { token: '--border',             value: '.nds-dropdown-menu-content',    description: t('tokens.table.popupBorder')      },
            { token: '--elevation-md',       value: '.nds-dropdown-menu-content',    description: t('tokens.table.shadow')           },
            { token: '--radius',             value: '.nds-dropdown-menu-content',    description: t('tokens.table.radius')           },
            { token: '--radius-sm',          value: '.nds-dropdown-menu-item',       description: t('tokens.table.radiusItem')       },
            { token: '--z-popover',          value: '.nds-dropdown-menu-positioner', description: t('tokens.table.zIndex')           },
          ],
          customizationTitle: t('tokens.customizationTitle'),
          customizationCode,
        });
      }

      // ── 10. Acessibilidade ───────────────────────────────────────────────
      case 'acessibilidade':
        return createDocsAccessibility({
          screenReaderTitle: tNav('common.screenReader'),
          screenReaderItems: screenReaderItems(),
          title: t('accessibility.title'),
          summary: t('accessibility.summary'),
          items: [
            t('accessibility.warning'),
            t('accessibility.aria.roleMenu'),
            t('accessibility.aria.roleMenuItem'),
            t('accessibility.aria.roleMenuitemCheckbox'),
            t('accessibility.aria.roleMenuitemRadio'),
            t('accessibility.aria.ariaChecked'),
            t('accessibility.aria.ariaDisabled'),
            t('accessibility.aria.ariaHaspopup'),
            t('accessibility.aria.ariaExpanded'),
          ],
          keyboardTitle: tNav('common.keyboard'),
          keyboardItems: [
            { key: 'Right-click / Menu / Shift+F10', description: t('accessibility.keyboard.rightClick') },
            { key: 'Arrow Down',  description: t('accessibility.keyboard.arrowDown')  },
            { key: 'Arrow Up',    description: t('accessibility.keyboard.arrowUp')    },
            { key: 'Arrow Right', description: t('accessibility.keyboard.arrowRight') },
            { key: 'Arrow Left',  description: t('accessibility.keyboard.arrowLeft')  },
            { key: 'Home / End',  description: t('accessibility.keyboard.homeEnd')    },
            { key: 'A–Z',         description: t('accessibility.keyboard.typeahead')  },
            { key: 'Enter',       description: t('accessibility.keyboard.enter')      },
            { key: 'Space',       description: t('accessibility.keyboard.space')      },
            { key: 'Esc',         description: t('accessibility.keyboard.escape')     },
            { key: 'Tab',         description: t('accessibility.keyboard.tab')        },
          ],
        });

      // ── 11. Relacionados ─────────────────────────────────────────────────
      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: 'DropdownMenu', description: toPlainText(t('related.dropdownMenu')), path: '?path=/docs/primitives-overlay-dropdownmenu--docs'  },
            { name: 'Menubar',      description: toPlainText(t('related.menubar')),      path: '?path=/docs/primitives-navigation-menubar--docs'       },
            { name: 'Dialog',       description: toPlainText(t('related.dialog')),       path: '?path=/docs/primitives-overlay-dialog--docs'        },
            { name: 'AlertDialog',  description: toPlainText(t('related.alertDialog')),  path: '?path=/docs/primitives-overlay-alertdialog--docs'   },
            { name: 'Tooltip',      description: toPlainText(t('related.tooltip')),      path: '?path=/docs/primitives-overlay-tooltip--docs'       },
          ],
        });

      // ── 12. Notas ────────────────────────────────────────────────────────
      case 'notas':
        return createDocsNotes({
          title: t('notes.title'),
          items: [
            { title: '', content: t('notes.tip1') },
            { title: '', content: t('notes.tip2') },
            { title: '', content: t('notes.tip3') },
            { title: '', content: t('notes.tip4') },
            { title: '', content: t('notes.tip5') },
          ],
        });

      // ── 13. Analytics ────────────────────────────────────────────────────
      case 'analytics':
        return createDocsAnalytics({
          title: t('analytics.title'),
          cols: {
            event:   t('analytics.table.event'),
            trigger: toPlainText(t('analytics.table.trigger')),
            payload: t('analytics.table.payload'),
          },
          items: [
            { event: t('analytics.table.menuOpen'),      trigger: toPlainText(t('analytics.table.menuOpenTrigger')),      payload: t('analytics.table.menuOpenPayload')      },
            { event: t('analytics.table.itemClick'),     trigger: toPlainText(t('analytics.table.itemClickTrigger')),     payload: t('analytics.table.itemClickPayload')     },
            { event: t('analytics.table.pageView'),      trigger: toPlainText(t('analytics.table.pageViewTrigger')),      payload: t('analytics.table.pageViewPayload')      },
            { event: t('analytics.table.sectionViewed'), trigger: toPlainText(t('analytics.table.sectionViewedTrigger')), payload: t('analytics.table.sectionViewedPayload') },
            { event: t('analytics.table.langSwitch'),    trigger: toPlainText(t('analytics.table.langSwitchTrigger')),    payload: t('analytics.table.langSwitchPayload')    },
          ],
        });

      // ── 14. Testes ───────────────────────────────────────────────────────
      case 'testes': {
        return createDocsTestes({
          title: t('testes.title'),
          functional: {
            title: t('testes.functional.title'),
            cols: {
              action:   tNav('common.userAction'),
              result:   tNav('common.expectedResult'),
              priority: tNav('common.priority'),
            },
            items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => ({
              action:   t(`testes.functional.item${i}.action`),
              result:   t(`testes.functional.item${i}.result`),
              priority: priorityLabel(t(`testes.functional.item${i}.priority`)),
            })),
          },
          accessibility: {
            title: t('testes.accessibility.title'),
            cols: {
              criterion: tNav('common.criterion'),
              level:     'WCAG',
              how:       tNav('common.howToVerify'),
            },
            items: [1, 2, 3, 4, 5, 6, 7, 8].map(i => ({
              criterion: t(`testes.accessibility.item${i}`),
              level:     'AA',
              how:       'axe-core / manual',
            })),
          },
          visual: {
            title: t('testes.visual.title'),
            cols: {
              story:    tNav('common.storyState'),
              priority: tNav('common.priority'),
            },
            items: [1, 2, 3, 4, 5, 6].map(i => ({
              story:    t(`testes.visual.item${i}.story`),
              priority: priorityLabel(t(`testes.visual.item${i}.priority`)),
            })),
          },
        });
      }
    }
  }

  // ── Render all sections ────────────────────────────────────────────────────

  function renderAllSections() {
    for (const id of sectionOrder) {
      const fresh    = buildSection(id);
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

  // ── IntersectionObserver ──────────────────────────────────────────────────

  let activeSectionObserver: { disconnect: () => void } | null = null;

  function attachObserver() {
    activeSectionObserver?.disconnect();
    activeSectionObserver = createActiveSectionObserver(
      sectionOrder as unknown as string[],
      (id) => sectionEls[id as keyof typeof sectionEls] ?? null,
      (id) => updateActiveNav(id),
      (id) => track('docs_section_viewed', {
        section_id: id,
        component_name: 'context_menu',
        locale: getLocale(),
      }),
    );
  }
  cleanups.push(() => activeSectionObserver?.disconnect());

  // ── Initial render ─────────────────────────────────────────────────────────

  renderHeader();
  buildSidebar();
  renderAllSections();

  cleanups.push(subscribe(() => {
    renderHeader();
    buildSidebar();
    renderAllSections();
  }));
  cleanups.push(onLocaleChange(() => {
    renderHeader();
    buildSidebar();
    renderAllSections();
  }));

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
