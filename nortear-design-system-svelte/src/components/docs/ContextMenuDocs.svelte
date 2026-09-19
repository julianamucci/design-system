<script lang="ts">
  import { untrack } from 'svelte';
  import * as ContextMenu from '@/components/ui/context-menu';
  // Import nomeado ao lado do namespace, e não `ContextMenu.createMenuCloseWatch`:
  // pelo namespace nenhuma varredura por nome enxerga o uso do tradutor.
  import { createMenuCloseWatch } from '@/components/ui/context-menu';
  import { contextMenuEntriesSource } from '@/components/ui/context-menu/context-menu.source';
  import {
    contextMenuEntriesState,
    type ContextMenuDocsEntry,
  } from '@/components/ui/context-menu/context-menu.fixtures';
  import { Button } from '@/components/ui/button';
  import { AREA_CLICK_DIREITO } from '@shared/primitives/context-menu-area';
  import { locale, useTranslation } from '@/lib/i18n';
  import { applySeo } from '@/lib/use-seo';
  import { track } from '@/lib/analytics';
  import { createActiveSection } from '@/lib/use-active-section.svelte';
  import DocsPageLayout    from '@/components/docs/shared/sections/DocsPageLayout.svelte';
  import DocsHeader        from '@/components/docs/shared/sections/DocsHeader.svelte';
  import DocsDemonstration from '@/components/docs/shared/sections/DocsDemonstration.svelte';
  import DocsAnatomy       from '@/components/docs/shared/sections/DocsAnatomy.svelte';
  import DocsWhenToUse     from '@/components/docs/shared/sections/DocsWhenToUse.svelte';
  import DocsDoDont        from '@/components/docs/shared/sections/DocsDoDont.svelte';
  import DocsImport        from '@/components/docs/shared/sections/DocsImport.svelte';
  import DocsCompositions  from '@/components/docs/shared/sections/DocsCompositions.svelte';
  import DocsStates        from '@/components/docs/shared/sections/DocsStates.svelte';
  import DocsProps         from '@/components/docs/shared/sections/DocsProps.svelte';
  import DocsTokens        from '@/components/docs/shared/sections/DocsTokens.svelte';
  import DocsAccessibility from '@/components/docs/shared/sections/DocsAccessibility.svelte';
  import DocsRelated       from '@/components/docs/shared/sections/DocsRelated.svelte';
  import DocsNotes         from '@/components/docs/shared/sections/DocsNotes.svelte';
  import DocsAnalytics     from '@/components/docs/shared/sections/DocsAnalytics.svelte';
  import DocsTestes        from '@/components/docs/shared/sections/DocsTestes.svelte';

  import uiTranslations from '@/i18n/ui.json';
  import componentTranslations from '@shared/content/context-menu/translations.json';
  import { toPlainText } from '@/lib/strip-html';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(componentTranslations);

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria. O
  // `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
  const screenReaderItems = $derived(
    Object.entries(
      (componentTranslations as unknown as Record<
        string,
        { accessibility?: { screenReader?: Record<string, string> } }
      >)[$locale]?.accessibility?.screenReader ?? {},
    )
      .filter(([key]) => key !== 'title')
      .map(([, value]) => value),
  );

  // ─── SEO + Analytics ────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    // `aiSummary` e `aiEntities` são o que a página oferece aos motores
    // generativos (JSON-LD `abstract` e `about`). Estavam no conteúdo e não
    // chegavam aqui — a página publicava o artigo sem resumo nem entidades.
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale: l,
      componentSlug: 'context-menu',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
    });
    track('docs_page_view', {
      component_name: 'context-menu',
      locale: l,
      page_title: `${t('title')} · Design System`,
    });
    return cleanup;
  });

  // ─── Active section ──────────────────────────────────────────────────────────

  const NAV_GROUPS = $derived.by(() => {
    const tNav = $tNavStore;
    return [
      { label: tNav('nav.overview'), sections: [
        { id: 'demonstracao', label: tNav('nav.demonstration') },
        { id: 'anatomia',     label: tNav('nav.anatomy')       },
        { id: 'quando-usar',  label: tNav('nav.usage')         },
        { id: 'do-dont',      label: tNav('nav.doDont')        },
      ]},
      { label: tNav('nav.techRef'), sections: [
        { id: 'importacao',   label: tNav('nav.import')   },
        { id: 'variantes',    label: tNav('nav.variants') },
        { id: 'estados',      label: tNav('nav.states')   },
        { id: 'propriedades', label: tNav('nav.props')    },
        { id: 'tokens',       label: tNav('nav.tokens')   },
      ]},
      { label: tNav('nav.context'), sections: [
        { id: 'acessibilidade', label: tNav('nav.accessibility') },
        { id: 'relacionados',   label: tNav('nav.related')       },
        { id: 'notas',          label: tNav('nav.notes')         },
      ]},
      { label: tNav('nav.quality'), sections: [
        { id: 'analytics', label: tNav('nav.analytics') },
        { id: 'testes',    label: tNav('nav.testes')    },
      ]},
    ];
  });

  const sectionIds = untrack(() => NAV_GROUPS.flatMap(g => g.sections.map(s => s.id)));
  const section = createActiveSection(sectionIds, (id) => {
    track('docs_section_viewed', { section_id: id, component_name: 'context-menu', locale: $locale });
  });
  $effect(() => section.attach());

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  // A moldura tracejada da área vem da constante COMPARTILHADA. Esta página
  // escrevia a cadeia à mão em treze lugares, e com `nds-w-full nds-max-w-xs`
  // no lugar de `nds-w-xs` — a divergência que a constante existe justamente
  // para impedir (o docblock dela registra a rodada em que as cinco stacks
  // desenhavam molduras diferentes).
  const areaClasse = AREA_CLICK_DIREITO;

  const priorityKeyMap: Record<string, string> = { high: 'common.high', medium: 'common.medium', low: 'common.low' };
  function localPriority(raw: string, tNav: (k: string) => string): string {
    return tNav(priorityKeyMap[raw] ?? 'common.high');
  }

  /**
   * Varre `base.item1`, `base.item2`, … enquanto existirem no conteúdo.
   *
   * Citar índice por índice trava a lista no tamanho de hoje: o conteúdo
   * compartilhado ganha um item e ele simplesmente não existe para quem lê —
   * sem erro, sem aviso, nos três idiomas de uma vez. Foi o que aconteceu com o
   * nono critério de acessibilidade deste componente, o que registra que a seta
   * POUSA no item desabilitado em vez de pulá-lo.
   */
  function stringsFromDict(
    t: (key: string, defaultValue?: string) => string,
    base: string,
    prefix = 'item',
  ): string[] {
    const out: string[] = [];
    for (let i = 1; ; i++) {
      const value = t(`${base}.${prefix}${i}`, '');
      if (!value) break;
      out.push(value);
    }
    return out;
  }

  /**
   * A mesma varredura para a lista cujo item é um OBJETO — cenário, critério
   * funcional, story de regressão visual. O primeiro campo é quem decide se o
   * item existe, e os demais acompanham.
   */
  function entriesFromDict<K extends string>(
    t: (key: string, defaultValue?: string) => string,
    base: string,
    fields: readonly K[],
  ): Array<Record<K, string>> {
    const out: Array<Record<K, string>> = [];
    for (let i = 1; ; i++) {
      if (!t(`${base}.item${i}.${fields[0]}`, '')) break;
      out.push(
        Object.fromEntries(
          fields.map((field) => [field, t(`${base}.item${i}.${field}`, '')]),
        ) as Record<K, string>,
      );
    }
    return out;
  }

  // Nível WCAG e forma de verificar cada critério de acessibilidade, por índice —
  // a MESMA lista nas cinco stacks. São identificadores (número de critério,
  // consulta da suíte, regra do axe), e identificador não se traduz: por isso
  // ficam aqui e não no conteúdo compartilhado. Item além da lista cai no par
  // padrão em vez de sumir.
  const A11Y_TEST_LEVELS = [
    'AA',
    '4.1.2 · A',
    '4.1.2 · A',
    '4.1.2 · A',
    '4.1.2 · A',
    '4.1.2 · A',
    '2.1.1 · A',
    '1.4.3 · AA',
    '2.1.1 · A',
    '4.1.2 · A',
  ];
  const A11Y_TEST_HOW = [
    'axe-core',
    "getByRole('menu')",
    "getAllByRole('menuitem')",
    "getAllByRole('menuitemcheckbox') · aria-checked",
    "getAllByRole('menuitemradio') · aria-checked",
    'aria-disabled',
    'Escape · document.activeElement',
    'axe-core · color-contrast',
    'ArrowDown · document.activeElement',
    'aria-haspopup · aria-expanded',
  ];

  /**
   * Abertura, escolha e fechamento de UM menu vivo desta página.
   *
   * `menu` é o id estável do menu e `location` a SEÇÃO onde ele está (guideline
   * 07): um clique no preview de Variantes ou do Do & Don't é tão real quanto o
   * da Demonstração. `label` é o valor estável do item. Nenhum dos três leva
   * texto traduzido, sob pena de partir o mesmo evento em um por idioma.
   *
   * O MOTIVO do fechamento vem do `menu-close-reason.ts`, ao lado das peças e
   * compartilhado pelos três membros da família: o `onOpenChange` da lib diz só
   * que o menu fechou, e quem traduz gesto em palavra é o componente — esta
   * página só repassa. Até 2026-09-12 a tradução morava AQUI, numa união
   * anônima que nem os portões de vocabulário enxergavam, e a mesma dedução
   * vivia copiada em três docs pages, nenhuma com teste.
   *
   * Duas portas para o item, porque só uma decide: `select` é o item de AÇÃO,
   * que fecha o menu e arma `api`; `toggle` é a marcação e a opção de rádio,
   * que alternam e deixam o menu aberto sem armar motivo.
   */
  function contextMenuTracker(menu: string, location: string) {
    // Não há `isOpen`: o menu de contexto não tem gatilho que se clique aberto —
    // ele nasce do botão direito sobre a área.
    const closeWatch = createMenuCloseWatch({
      subContentSelector: '[data-slot="context-menu-sub-content"]',
    });
    const announce = (label: string) =>
      track('context_menu_item_select', { component: 'context-menu', label, menu, location });
    return {
      onOpenChange(open: boolean) {
        if (open) {
          closeWatch.reset();
          track('context_menu_open', { component: 'context-menu', menu, location });
          return;
        }
        track('context_menu_close', {
          component: 'context-menu',
          menu,
          reason: closeWatch.takeReason(),
          location,
        });
      },
      /** O que o PAINEL anota — espalhado no `Content`: Escape, clique fora e Tab. */
      content: closeWatch.content,
      /** O painel do submenu vive num portal à parte: o Tab dado nele não passa pelo de cima. */
      subContent: closeWatch.subContent,
      select(label: string) {
        return () => {
          closeWatch.markItemPress();
          announce(label);
        };
      },
      toggle(label: string) {
        return () => announce(label);
      },
    };
  }

  type ContextMenuTracker = ReturnType<typeof contextMenuTracker>;

  // Um rastreador por menu vivo: o motivo do fechamento é estado de CADA menu.
  // Os ids de Variantes são a chave do card em kebab; os do Do & Don't, o par e
  // o lado.
  const menus = {
    demo:          contextMenuTracker('demo',           'docs_demo'),
    pair1Do:       contextMenuTracker('pair1-do',       'docs_do_dont'),
    pair1Dont:     contextMenuTracker('pair1-dont',     'docs_do_dont'),
    pair2Do:       contextMenuTracker('pair2-do',       'docs_do_dont'),
    pair2Dont:     contextMenuTracker('pair2-dont',     'docs_do_dont'),
    pair3Do:       contextMenuTracker('pair3-do',       'docs_do_dont'),
    pair3Dont:     contextMenuTracker('pair3-dont',     'docs_do_dont'),
    default:       contextMenuTracker('default',        'docs_variantes'),
    destructive:   contextMenuTracker('destructive',    'docs_variantes'),
    label:         contextMenuTracker('label',          'docs_variantes'),
    withCheckbox:  contextMenuTracker('with-checkbox',  'docs_variantes'),
    withRadio:     contextMenuTracker('with-radio',     'docs_variantes'),
    withSubmenu:   contextMenuTracker('with-submenu',   'docs_variantes'),
    withShortcuts: contextMenuTracker('with-shortcuts', 'docs_variantes'),
  };

  // ─── Cards de Variantes ──────────────────────────────────────────────────────
  //
  // Os sete cards, pela CHAVE do conteúdo compartilhado. A MESMA lista monta a
  // prévia (o snippet `menuEntries`) e imprime o código
  // (`contextMenuEntriesSource`), como a `variantMenu` do vanilla. Até
  // 2026-09-10 cada card tinha um literal em português ao lado da prévia: em
  // inglês ou espanhol a prévia dizia "Edit" e o código "Editar", o de marcação
  // publicava os estados trocados e o destrutivo mostrava um atalho que as outras
  // stacks não mostram. Rótulo sai de `demonstration.labels.*`; o `value` de
  // cada item é o valor estável do evento.

  const VARIANT_KEYS = [
    'default',
    'destructive',
    'label',
    'withCheckbox',
    'withRadio',
    'withSubmenu',
    'withShortcuts',
  ] as const;
  type VariantKey = (typeof VARIANT_KEYS)[number];

  function variantEntries(key: VariantKey, t: (key: string) => string): ContextMenuDocsEntry[] {
    // A chave do rótulo vai inteira, e não montada por partes: é por ela que o
    // `audit.mjs` confere que a página usa os mesmos rótulos das outras stacks.
    const action = (
      value: string,
      labelKey: string,
      extra: { shortcut?: string; variant?: 'destructive'; inset?: boolean } = {},
    ): ContextMenuDocsEntry => ({ type: 'item', value, label: t(labelKey), ...extra });
    const separator: ContextMenuDocsEntry = { type: 'separator' };

    switch (key) {
      case 'default':
        return [
          action('edit', 'demonstration.labels.edit'),
          action('duplicate', 'demonstration.labels.duplicate'),
        ];
      case 'destructive':
        // Sem atalho, como nas outras quatro: atalho é assunto de `withShortcuts`.
        return [
          action('edit', 'demonstration.labels.edit'),
          separator,
          action('delete', 'demonstration.labels.delete', { variant: 'destructive' }),
        ];
      case 'label':
        // O rótulo mora DENTRO do grupo, e é por isso que ele nomeia o bloco.
        return [
          {
            type: 'group',
            label: t('demonstration.labels.groupActions'),
            inset: true,
            items: [
              action('edit', 'demonstration.labels.edit', { inset: true }),
              action('duplicate', 'demonstration.labels.duplicate', { inset: true }),
            ],
          },
        ];
      case 'withCheckbox':
        // "Mostrar grade" desmarcada e "Mostrar réguas" marcada, como no vanilla
        // e na story `WithCheckbox`.
        return [
          {
            type: 'group',
            label: t('demonstration.labels.groupView'),
            items: [
              {
                type: 'checkbox',
                value: 'show-grid',
                label: t('demonstration.labels.showGrid'),
                checked: false,
              },
              {
                type: 'checkbox',
                value: 'show-rulers',
                label: t('demonstration.labels.showRulers'),
                checked: true,
              },
            ],
          },
        ];
      case 'withRadio':
        // O grupo de rádio já é um grupo: o rótulo mora dentro dele e o nomeia.
        return [
          {
            type: 'radio-group',
            label: t('demonstration.labels.groupLayout'),
            name: 'layout',
            value: 'layout-grid',
            items: [
              { value: 'layout-grid', label: t('demonstration.labels.layoutGrid') },
              { value: 'layout-list', label: t('demonstration.labels.layoutList') },
              { value: 'layout-columns', label: t('demonstration.labels.layoutColumns') },
            ],
          },
        ];
      case 'withSubmenu':
        return [
          action('edit', 'demonstration.labels.edit'),
          action('duplicate', 'demonstration.labels.duplicate'),
          {
            type: 'submenu',
            label: t('demonstration.labels.share'),
            items: [
              action('share-email', 'demonstration.labels.shareEmail'),
              action('share-link', 'demonstration.labels.shareLink'),
            ],
          },
        ];
      case 'withShortcuts':
        return [
          action('edit', 'demonstration.labels.edit', {
            shortcut: t('demonstration.labels.editShortcut'),
          }),
          action('duplicate', 'demonstration.labels.duplicate', {
            shortcut: t('demonstration.labels.duplicateShortcut'),
          }),
          separator,
          action('delete', 'demonstration.labels.delete', {
            shortcut: t('demonstration.labels.deleteShortcut'),
            variant: 'destructive',
          }),
        ];
    }
  }

  // As listas no idioma da página, lidas uma vez por troca de idioma: é delas
  // que saem a prévia e o código de cada card.
  const variantMenus = $derived.by(() => {
    const t = $tStore;
    return Object.fromEntries(VARIANT_KEYS.map((key) => [key, variantEntries(key, t)])) as Record<
      VariantKey,
      ContextMenuDocsEntry[]
    >;
  });

  const variantCode = (key: VariantKey) =>
    contextMenuEntriesSource({
      triggerLabel: $tStore('demonstration.labels.triggerLabel'),
      entries: variantMenus[key],
    });

  // As marcações e a escolha única dos cards abrem no estado que a lista
  // declara — o mesmo que o código publica. O rótulo não importa aqui, e por
  // isso a leitura dispensa o idioma.
  const variantState = $state(
    contextMenuEntriesState(VARIANT_KEYS.flatMap((key) => variantEntries(key, (name) => name))),
  );

  // ─── Code strings ────────────────────────────────────────────────────────────

  const codeImportBasic = `import * as ContextMenu from "@/components/ui/context-menu";`;

  const codeImportWithCheckbox = `import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuCheckboxItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
} from "@/components/ui/context-menu";`;

  // As peças que esta stack TEM, com os nomes dela. `inset` só onde a folha o
  // lê — item, rótulo e sub-gatilho —, e os itens de marcação e de rádio não
  // fecham o menu ao alternar (`closeOnSelect` nasce desligado neles).
  const interfaceCode = `// ContextMenuItem
interface ContextMenuItemProps {
  variant?: 'default' | 'destructive';
  inset?: boolean;
  disabled?: boolean;
  onSelect?: (event: Event) => void;
  class?: string;
}

// ContextMenuCheckboxItem
interface ContextMenuCheckboxItemProps {
  checked?: boolean;          // bind:checked
  indeterminate?: boolean;    // bind:indeterminate
  disabled?: boolean;
  closeOnSelect?: boolean;    // false
  onCheckedChange?: (checked: boolean) => void;
}

// ContextMenuRadioGroup
interface ContextMenuRadioGroupProps {
  value?: string;             // bind:value
  onValueChange?: (value: string) => void;
}

// ContextMenuRadioItem
interface ContextMenuRadioItemProps {
  value: string;
  disabled?: boolean;
  closeOnSelect?: boolean;    // false
}

// ContextMenuLabel
interface ContextMenuLabelProps {
  inset?: boolean;
}`;
</script>

<DocsPageLayout navGroups={NAV_GROUPS} activeSection={section.value} componentSlug="context-menu">
  {#snippet header()}
    <DocsHeader
      title={$tStore('title')}
      description={$tStore('description')}
      category={$tStore('category')}
      type={$tStore('type')}
    />
  {/snippet}

  <!-- ── Demonstração ──────────────────────────────────────────────────── -->
  <DocsDemonstration>
    <div class="nds-cluster nds-w-full nds-p-8" data-align="center" data-justify="center">
      <ContextMenu.Root onOpenChange={menus.demo.onOpenChange}>
        <ContextMenu.Trigger class={areaClasse} data-align="center" data-justify="center">
          {$tStore('demonstration.labels.triggerLabel')}
        </ContextMenu.Trigger>
        <ContextMenu.Content {...menus.demo.content}>
          <ContextMenu.Item onSelect={menus.demo.select('edit')}>
            {$tStore('demonstration.labels.edit')}
            <ContextMenu.Shortcut>{$tStore('demonstration.labels.editShortcut')}</ContextMenu.Shortcut>
          </ContextMenu.Item>
          <ContextMenu.Item onSelect={menus.demo.select('duplicate')}>
            {$tStore('demonstration.labels.duplicate')}
          </ContextMenu.Item>
          <ContextMenu.Sub>
            <ContextMenu.SubTrigger>{$tStore('demonstration.labels.share')}</ContextMenu.SubTrigger>
            <ContextMenu.SubContent {...menus.demo.subContent}>
              <ContextMenu.Item onSelect={menus.demo.select('share-email')}>
                {$tStore('demonstration.labels.shareEmail')}
              </ContextMenu.Item>
              <ContextMenu.Item onSelect={menus.demo.select('share-link')}>
                {$tStore('demonstration.labels.shareLink')}
              </ContextMenu.Item>
            </ContextMenu.SubContent>
          </ContextMenu.Sub>
          <ContextMenu.Separator />
          <ContextMenu.Item variant="destructive" onSelect={menus.demo.select('delete')}>
            {$tStore('demonstration.labels.delete')}
            <ContextMenu.Shortcut>{$tStore('demonstration.labels.deleteShortcut')}</ContextMenu.Shortcut>
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Root>
    </div>
  </DocsDemonstration>

  <!-- ── Anatomia ──────────────────────────────────────────────────────── -->
  <DocsAnatomy
    items={stringsFromDict($tStore, 'anatomy')}
    structureLabel={$tStore('anatomy.structureLabel')}
    structureCode={$tStore('anatomy.structureCode')}
  />

  <!-- ── Quando Usar ───────────────────────────────────────────────────── -->
  <DocsWhenToUse
    guidelines={{
      title: $tStore('usage.guidelines.title'),
      items: stringsFromDict($tStore, 'usage.guidelines'),
    }}
    scenarios={{
      title: $tStore('usage.scenarios.title'),
      cols: {
        scenario: $tStore('usage.scenarios.cols.scenario'),
        use: $tStore('usage.scenarios.cols.use'),
        alternative: $tStore('usage.scenarios.cols.alternative'),
      },
      items: entriesFromDict($tStore, 'usage.scenarios', ['s', 'u', 'a']),
    }}
    do={{
      title: $tStore('usage.do.title'),
      items: stringsFromDict($tStore, 'usage.do'),
    }}
    dont={{
      title: $tStore('usage.dont.title'),
      items: stringsFromDict($tStore, 'usage.dont'),
    }}
  />

  <!-- ── Do & Don't ───────────────────────────────────────────────────── -->
  <!--
    As legendas são TEXTO no container, e o conteúdo pode trazer marcação: sem
    `toPlainText` a tag chegaria à tela como texto.
  -->
  <DocsDoDont
    pairs={[
      {
        doLabel: $tNavStore('common.do'),
        dontLabel: $tNavStore('common.dont'),
        doCaption: toPlainText($tStore('doDont.pair1.do')),
        dontCaption: toPlainText($tStore('doDont.pair1.dont')),
        doPreview: doPair1,
        dontPreview: dontPair1,
      },
      {
        doLabel: $tNavStore('common.do'),
        dontLabel: $tNavStore('common.dont'),
        doCaption: toPlainText($tStore('doDont.pair2.do')),
        dontCaption: toPlainText($tStore('doDont.pair2.dont')),
        doPreview: doPair2,
        dontPreview: dontPair2,
      },
      {
        doLabel: $tNavStore('common.do'),
        dontLabel: $tNavStore('common.dont'),
        doCaption: toPlainText($tStore('doDont.pair3.do')),
        dontCaption: toPlainText($tStore('doDont.pair3.dont')),
        doPreview: doPair3,
        dontPreview: dontPair3,
      },
    ]}
  />

  <!--
    Par 1: alternativa explícita.

    A legenda promete "as mesmas ações também via botão visível", então o lado do
    faça DESENHA o botão — anunciá-lo por escrito ("+ botão visível") era CONTAR
    o que o par existe para MOSTRAR, e um texto solto não prova que a ação é
    alcançável sem o botão direito. Os dois menus são o MESMO — Editar e Excluir,
    sem divisória, como no vanilla —; o que muda entre os lados é só o botão.
    A divisória é assunto do par 2, e aqui ela seria uma segunda diferença
    competindo com a alternativa visível.

    Todo rótulo sai do conteúdo compartilhado: literal em português fica em
    português para quem lê a página em inglês ou espanhol, sem erro e sem aviso.
  -->
  {#snippet doPair1()}
    <div class="nds-stack" data-spacing="sm" data-align="center">
      <ContextMenu.Root onOpenChange={menus.pair1Do.onOpenChange}>
        <ContextMenu.Trigger class={areaClasse} data-align="center" data-justify="center">
          {$tStore('demonstration.labels.triggerLabel')}
        </ContextMenu.Trigger>
        <ContextMenu.Content {...menus.pair1Do.content}>
          <ContextMenu.Item onSelect={menus.pair1Do.select('edit')}>
            {$tStore('demonstration.labels.edit')}
          </ContextMenu.Item>
          <ContextMenu.Item variant="destructive" onSelect={menus.pair1Do.select('delete')}>
            {$tStore('demonstration.labels.delete')}
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Root>
      <!-- A MESMA ação do menu, alcançável sem o botão direito. -->
      <Button variant="outline" size="sm">{$tStore('demonstration.labels.edit')}</Button>
    </div>
  {/snippet}
  {#snippet dontPair1()}
    <ContextMenu.Root onOpenChange={menus.pair1Dont.onOpenChange}>
      <ContextMenu.Trigger class={areaClasse} data-align="center" data-justify="center">
        {$tStore('demonstration.labels.triggerLabel')}
      </ContextMenu.Trigger>
      <ContextMenu.Content {...menus.pair1Dont.content}>
        <ContextMenu.Item onSelect={menus.pair1Dont.select('edit')}>
          {$tStore('demonstration.labels.edit')}
        </ContextMenu.Item>
        <ContextMenu.Item variant="destructive" onSelect={menus.pair1Dont.select('delete')}>
          {$tStore('demonstration.labels.delete')}
        </ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Root>
  {/snippet}

  <!--
    Par 2: a ação destrutiva. No faça ela vem na variante destrutiva, separada
    das outras por uma linha; no evite ela tem a mesma aparência das outras e
    mora no MEIO da lista — é o que a legenda de cada lado descreve.
  -->
  {#snippet doPair2()}
    <ContextMenu.Root onOpenChange={menus.pair2Do.onOpenChange}>
      <ContextMenu.Trigger class={areaClasse} data-align="center" data-justify="center">
        {$tStore('demonstration.labels.triggerLabel')}
      </ContextMenu.Trigger>
      <ContextMenu.Content {...menus.pair2Do.content}>
        <ContextMenu.Item onSelect={menus.pair2Do.select('edit')}>
          {$tStore('demonstration.labels.edit')}
        </ContextMenu.Item>
        <ContextMenu.Item onSelect={menus.pair2Do.select('duplicate')}>
          {$tStore('demonstration.labels.duplicate')}
        </ContextMenu.Item>
        <ContextMenu.Separator />
        <ContextMenu.Item variant="destructive" onSelect={menus.pair2Do.select('delete')}>
          {$tStore('demonstration.labels.delete')}
        </ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Root>
  {/snippet}
  {#snippet dontPair2()}
    <ContextMenu.Root onOpenChange={menus.pair2Dont.onOpenChange}>
      <ContextMenu.Trigger class={areaClasse} data-align="center" data-justify="center">
        {$tStore('demonstration.labels.triggerLabel')}
      </ContextMenu.Trigger>
      <ContextMenu.Content {...menus.pair2Dont.content}>
        <ContextMenu.Item onSelect={menus.pair2Dont.select('edit')}>
          {$tStore('demonstration.labels.edit')}
        </ContextMenu.Item>
        <ContextMenu.Item onSelect={menus.pair2Dont.select('delete')}>
          {$tStore('demonstration.labels.delete')}
        </ContextMenu.Item>
        <ContextMenu.Item onSelect={menus.pair2Dont.select('duplicate')}>
          {$tStore('demonstration.labels.duplicate')}
        </ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Root>
  {/snippet}

  <!--
    Os dois lados montam o MESMO menu; o que os separa é a DICA VISUAL, que é o
    assunto da legenda deste par. O "faça" traz a moldura tracejada da constante
    compartilhada; o "evite" é a mesma área sem contorno, sem cursor e sem aviso
    — o menu existe e ninguém tem como saber.

    O lado direito era um `<div>` desenhado à mão, com `border-style` e
    `text-align` em `style` inline: ensinava markup que o design system não
    emite, e a guideline 08 §15 pede componente VIVO em toda seção com exemplo.
  -->
  {#snippet doPair3()}
    <ContextMenu.Root onOpenChange={menus.pair3Do.onOpenChange}>
      <ContextMenu.Trigger class={areaClasse} data-align="center" data-justify="center">
        {$tStore('demonstration.labels.triggerLabel')}
      </ContextMenu.Trigger>
      <ContextMenu.Content {...menus.pair3Do.content}>
        <ContextMenu.Item onSelect={menus.pair3Do.select('edit')}>
          {$tStore('demonstration.labels.edit')}
        </ContextMenu.Item>
        <ContextMenu.Item onSelect={menus.pair3Do.select('duplicate')}>
          {$tStore('demonstration.labels.duplicate')}
        </ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Root>
  {/snippet}
  {#snippet dontPair3()}
    <ContextMenu.Root onOpenChange={menus.pair3Dont.onOpenChange}>
      <ContextMenu.Trigger
        class="nds-cluster nds-w-xs nds-p-8 nds-rounded-md nds-text-body nds-text-muted-foreground"
        data-align="center"
        data-justify="center"
      >
        {$tStore('demonstration.labels.areaNoHint')}
      </ContextMenu.Trigger>
      <ContextMenu.Content {...menus.pair3Dont.content}>
        <ContextMenu.Item onSelect={menus.pair3Dont.select('edit')}>
          {$tStore('demonstration.labels.edit')}
        </ContextMenu.Item>
        <ContextMenu.Item onSelect={menus.pair3Dont.select('duplicate')}>
          {$tStore('demonstration.labels.duplicate')}
        </ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Root>
  {/snippet}

  <!-- ── Importação ────────────────────────────────────────────────────── -->
  <DocsImport
    description={$tStore('import.basic')}
    code={codeImportBasic}
    secondaryDescription={$tStore('import.withCheckbox')}
    secondaryCode={codeImportWithCheckbox}
  />

  <!-- ── Variantes ─────────────────────────────────────────────────────── -->
  <!--
    O `trackId` de todo card é a CHAVE do conteúdo: é ela que vira o
    `snippet_id` da cópia de código, e uma etiqueta com espaço ("Label + Inset")
    partia a série no GA4. O TÍTULO dos três primeiros sai de
    `variants.names.*` (Padrão, Destrutivo, Rótulo) — até 2026-09-11 o card
    mostrava a chave crua, "default", como título; os outros quatro seguem em
    `variants.items.<card>.name`. Prévia e código saem da mesma lista
    (`variantMenus`), e a nota da seção diz que só o item de ação tem variante.
  -->
  <DocsCompositions
    id="variantes"
    note={$tStore('variants.note')}
    useWhenLabel={$tNavStore('common.useWhen')}
    componentSlug="context-menu"
    items={[
      { trackId: 'default',     name: $tStore('variants.names.default'),     description: $tStore('variants.items.default'),     code: variantCode('default'),     preview: variantDefault     },
      { trackId: 'destructive', name: $tStore('variants.names.destructive'), description: $tStore('variants.items.destructive'), code: variantCode('destructive'), preview: variantDestructive },
      { trackId: 'label',       name: $tStore('variants.names.label'),       description: $tStore('variants.items.label'),       code: variantCode('label'),       preview: variantLabel       },
      {
        trackId: 'withCheckbox',
        name: $tStore('variants.items.withCheckbox.name'),
        description: $tStore('variants.items.withCheckbox.description'),
        useWhen: $tStore('variants.items.withCheckbox.use'),
        code: variantCode('withCheckbox'),
        preview: variantWithCheckbox,
      },
      {
        trackId: 'withRadio',
        name: $tStore('variants.items.withRadio.name'),
        description: $tStore('variants.items.withRadio.description'),
        useWhen: $tStore('variants.items.withRadio.use'),
        code: variantCode('withRadio'),
        preview: variantWithRadio,
      },
      {
        trackId: 'withSubmenu',
        name: $tStore('variants.items.withSubmenu.name'),
        description: $tStore('variants.items.withSubmenu.description'),
        useWhen: $tStore('variants.items.withSubmenu.use'),
        code: variantCode('withSubmenu'),
        preview: variantWithSubmenu,
      },
      {
        trackId: 'withShortcuts',
        name: $tStore('variants.items.withShortcuts.name'),
        description: $tStore('variants.items.withShortcuts.description'),
        useWhen: $tStore('variants.items.withShortcuts.use'),
        code: variantCode('withShortcuts'),
        preview: variantWithShortcuts,
      },
    ]}
  />

  <!--
    As entradas de um menu, recursivas no submenu. Item de AÇÃO escolhe e fecha
    (`select`, motivo `api`); marcação e opção de rádio alternam e deixam o menu
    aberto (`toggle`, sem motivo) — ver `contextMenuTracker`.
  -->
  {#snippet menuEntries(entries: ContextMenuDocsEntry[], tracker: ContextMenuTracker)}
    {#each entries as entry, index (index)}
      {#if entry.type === 'item'}
        <ContextMenu.Item variant={entry.variant} inset={entry.inset} onSelect={tracker.select(entry.value)}>
          {entry.label}
          {#if entry.shortcut}
            <ContextMenu.Shortcut>{entry.shortcut}</ContextMenu.Shortcut>
          {/if}
        </ContextMenu.Item>
      {:else if entry.type === 'separator'}
        <ContextMenu.Separator />
      {:else if entry.type === 'group'}
        <ContextMenu.Group>
          <ContextMenu.Label inset={entry.inset}>{entry.label}</ContextMenu.Label>
          {@render menuEntries(entry.items, tracker)}
        </ContextMenu.Group>
      {:else if entry.type === 'checkbox'}
        <ContextMenu.CheckboxItem
          bind:checked={variantState.checked[entry.value]}
          onSelect={tracker.toggle(entry.value)}
        >
          {entry.label}
        </ContextMenu.CheckboxItem>
      {:else if entry.type === 'radio-group'}
        <ContextMenu.RadioGroup bind:value={variantState.radio[entry.name]}>
          <ContextMenu.Label>{entry.label}</ContextMenu.Label>
          {#each entry.items as option (option.value)}
            <ContextMenu.RadioItem value={option.value} onSelect={tracker.toggle(option.value)}>
              {option.label}
            </ContextMenu.RadioItem>
          {/each}
        </ContextMenu.RadioGroup>
      {:else if entry.type === 'submenu'}
        <ContextMenu.Sub>
          <ContextMenu.SubTrigger>{entry.label}</ContextMenu.SubTrigger>
          <ContextMenu.SubContent {...tracker.subContent}>
            {@render menuEntries(entry.items, tracker)}
          </ContextMenu.SubContent>
        </ContextMenu.Sub>
      {/if}
    {/each}
  {/snippet}

  <!-- Um card: a área do gesto e o menu da lista, com o rastreador do card. -->
  {#snippet variantCard(key: VariantKey)}
    <ContextMenu.Root onOpenChange={menus[key].onOpenChange}>
      <ContextMenu.Trigger class={areaClasse} data-align="center" data-justify="center">
        {$tStore('demonstration.labels.triggerLabel')}
      </ContextMenu.Trigger>
      <ContextMenu.Content {...menus[key].content}>
        {@render menuEntries(variantMenus[key], menus[key])}
      </ContextMenu.Content>
    </ContextMenu.Root>
  {/snippet}

  <!-- O container pede uma prévia sem argumento por card. -->
  {#snippet variantDefault()}{@render variantCard('default')}{/snippet}
  {#snippet variantDestructive()}{@render variantCard('destructive')}{/snippet}
  {#snippet variantLabel()}{@render variantCard('label')}{/snippet}
  {#snippet variantWithCheckbox()}{@render variantCard('withCheckbox')}{/snippet}
  {#snippet variantWithRadio()}{@render variantCard('withRadio')}{/snippet}
  {#snippet variantWithSubmenu()}{@render variantCard('withSubmenu')}{/snippet}
  {#snippet variantWithShortcuts()}{@render variantCard('withShortcuts')}{/snippet}

  <!-- ── Estados ───────────────────────────────────────────────────────── -->
  <DocsStates
    cols={{
      state: $tStore('states.cols.state'),
      trigger: toPlainText($tStore('states.cols.trigger')),
      behavior: toPlainText($tStore('states.cols.behavior')),
    }}
    items={[
      { label: $tStore('states.closed.label'),   trigger: toPlainText($tStore('states.closed.trigger')),   behavior: toPlainText($tStore('states.closed.behavior'))},
      { label: $tStore('states.open.label'),     trigger: toPlainText($tStore('states.open.trigger')),     behavior: toPlainText($tStore('states.open.behavior'))},
      { label: $tStore('states.focused.label'),  trigger: toPlainText($tStore('states.focused.trigger')),  behavior: toPlainText($tStore('states.focused.behavior'))},
      { label: $tStore('states.disabled.label'), trigger: toPlainText($tStore('states.disabled.trigger')), behavior: toPlainText($tStore('states.disabled.behavior'))},
      { label: $tStore('states.checked.label'),  trigger: toPlainText($tStore('states.checked.trigger')),  behavior: toPlainText($tStore('states.checked.behavior'))},
      { label: $tStore('states.mixed.label'),    trigger: toPlainText($tStore('states.mixed.trigger')),    behavior: toPlainText($tStore('states.mixed.behavior'))},
      { label: $tStore('states.subOpen.label'),  trigger: toPlainText($tStore('states.subOpen.trigger')),  behavior: toPlainText($tStore('states.subOpen.behavior'))},
    ]}
  />

  <!-- ── Propriedades ──────────────────────────────────────────────────── -->
  <!--
    Só o que esta stack TEM, com os nomes dela, e os padrões da coluna Padrão são
    os do WRAPPER desta stack — não os da lib. A distinção passou a importar em
    2026-09-18: a D15 fixou o ContextMenu raiz em `sideOffset: 0`, e o
    `context-menu-content.svelte` daqui declara o `0` por cima do `2` do bits. A
    tabela publicava o `2` da lib, que esta stack já não entrega — medido em
    2026-09-19, com a quina do painel a dx=+2,00 do ponteiro no `2` e a dx=0,00
    no `0`. Os outros três saem do wrapper também (`side = "right"`,
    `align = "start"`, `alignOffset = 0`). `inset` fica fora dos itens de marcação e de rádio: a folha não
    os recua, e a prop saiu dos dois. "Obrigatório" sai de `common.yes`/`no`.
    O `value` do GRUPO de rádio é a opção marcada (`props.items.modelValue`); o
    do ITEM é o valor dele no grupo (`props.items.value`) — o nome da prop é o
    mesmo nas duas peças, a descrição não. O item de marcação lista o
    `indeterminate`, que ele tem e que o bloco de interface já declarava.
  -->
  <DocsProps
    tables={[
      {
        title: $tStore('props.rootTitle'),
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'onOpenChange', type: '(open: boolean) => void', defaultValue: '—', required: $tNavStore('common.no'), description: toPlainText($tStore('props.items.onOpenChange')) },
        ],
      },
      {
        title: $tStore('props.contentTitle'),
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'align',       type: '"start" | "center" | "end"',          defaultValue: '"start"', required: $tNavStore('common.no'), description: toPlainText($tStore('props.items.align'))       },
          { name: 'alignOffset', type: 'number',                               defaultValue: '0',       required: $tNavStore('common.no'), description: toPlainText($tStore('props.items.alignOffset')) },
          { name: 'side',        type: '"top" | "right" | "bottom" | "left"', defaultValue: '"right"', required: $tNavStore('common.no'), description: toPlainText($tStore('props.items.side'))        },
          { name: 'sideOffset',  type: 'number',                               defaultValue: '0',       required: $tNavStore('common.no'), description: toPlainText($tStore('props.items.sideOffset'))  },
        ],
      },
      {
        title: $tStore('props.itemTitle'),
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'variant',  type: '"default" | "destructive"', defaultValue: '"default"', required: $tNavStore('common.no'), description: toPlainText($tStore('props.items.variant'))  },
          { name: 'inset',    type: 'boolean',                   defaultValue: 'false',     required: $tNavStore('common.no'), description: toPlainText($tStore('props.items.inset'))    },
          { name: 'disabled', type: 'boolean',                   defaultValue: 'false',     required: $tNavStore('common.no'), description: toPlainText($tStore('props.items.disabled')) },
          { name: 'onSelect', type: '(event: Event) => void',    defaultValue: '—',         required: $tNavStore('common.no'), description: toPlainText($tStore('props.items.onSelect')) },
        ],
      },
      {
        title: $tStore('props.checkboxItemTitle'),
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'checked',         type: 'boolean',                    defaultValue: 'false', required: $tNavStore('common.no'), description: toPlainText($tStore('props.items.checked'))         },
          { name: 'indeterminate',   type: 'boolean',                    defaultValue: 'false', required: $tNavStore('common.no'), description: toPlainText($tStore('props.items.indeterminate'))   },
          { name: 'onCheckedChange', type: '(checked: boolean) => void', defaultValue: '—',     required: $tNavStore('common.no'), description: toPlainText($tStore('props.items.onCheckedChange')) },
          { name: 'disabled',        type: 'boolean',                    defaultValue: 'false', required: $tNavStore('common.no'), description: toPlainText($tStore('props.items.disabled'))        },
        ],
      },
      {
        title: $tStore('props.radioGroupTitle'),
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'value',         type: 'string',                  defaultValue: '""', required: $tNavStore('common.no'), description: toPlainText($tStore('props.items.modelValue'))    },
          { name: 'onValueChange', type: '(value: string) => void', defaultValue: '—',  required: $tNavStore('common.no'), description: toPlainText($tStore('props.items.onValueChange')) },
        ],
      },
      {
        title: $tStore('props.radioItemTitle'),
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'value',    type: 'string',  defaultValue: '—',     required: $tNavStore('common.yes'), description: toPlainText($tStore('props.items.value'))    },
          { name: 'disabled', type: 'boolean', defaultValue: 'false', required: $tNavStore('common.no'),  description: toPlainText($tStore('props.items.disabled')) },
        ],
      },
      {
        title: $tStore('props.labelTitle'),
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'inset', type: 'boolean', defaultValue: 'false', required: $tNavStore('common.no'), description: toPlainText($tStore('props.items.inset')) },
        ],
      },
    ]}
    interfaceCode={interfaceCode}
    extensibilityTitle={$tStore('props.extensibilityTitle')}
    extensibilityNotes={$tStore('props.extensibility')}
  />

  <!-- ── Tokens ────────────────────────────────────────────────────────── -->
  <DocsTokens
    cols={{
      token: $tStore('tokens.table.token'),
      value: $tStore('tokens.table.class'),
      description: $tStore('tokens.table.part'),
    }}
    items={[
      // A coluna do meio é "Classe .nds-*" e trazia nome de utilitária do
      // Tailwind — vocabulário morto desde a migração. Cada linha aponta agora o
      // seletor que o CSS realmente usa, e cada token foi medido no navegador:
      // só `--elevation-md` muda a sombra (`--shadow` e `--shadow-md` não movem
      // nada), o separador é `--muted` e não `--border`, e o raio do item é
      // `--radius-sm`, não `--radius`.
      { token: '--popover',            value: '.nds-dropdown-menu-content',    description: $tStore('tokens.table.popoverBg')        },
      { token: '--popover-foreground', value: '.nds-dropdown-menu-content',    description: $tStore('tokens.table.popoverFg')        },
      { token: '--accent',             value: '.nds-dropdown-menu-item',       description: $tStore('tokens.table.accentBg')         },
      { token: '--accent-foreground',  value: '.nds-dropdown-menu-item',       description: $tStore('tokens.table.accentFg')         },
      { token: '--destructive',        value: '[data-variant="destructive"]',  description: $tStore('tokens.table.destructive')      },
      { token: '--destructive',        value: '.nds-dropdown-menu-item[data-variant="destructive"]:focus', description: $tStore('tokens.table.destructiveFocus') },
      { token: '--muted-foreground',   value: '.nds-dropdown-menu-shortcut',   description: $tStore('tokens.table.mutedFg')          },
      { token: '--muted-foreground',   value: '.nds-dropdown-menu-label',      description: $tStore('tokens.table.mutedFgLabel')     },
      { token: '--muted',              value: '.nds-dropdown-menu-separator',  description: $tStore('tokens.table.border')           },
      { token: '--border',             value: '.nds-dropdown-menu-content',    description: $tStore('tokens.table.popupBorder')      },
      { token: '--elevation-md',       value: '.nds-dropdown-menu-content',    description: $tStore('tokens.table.shadow')           },
      { token: '--radius',             value: '.nds-dropdown-menu-content',    description: $tStore('tokens.table.radius')           },
      { token: '--radius-sm',          value: '.nds-dropdown-menu-item',       description: $tStore('tokens.table.radiusItem')       },
      { token: '--z-popover',          value: '.nds-dropdown-menu-positioner', description: $tStore('tokens.table.zIndex')           },
    ]}
    customizationTitle={$tStore('tokens.customizationTitle')}
    customizationCode={$tStore('tokens.customizationCode')}
  />

  <!-- ── Acessibilidade ───────────────────────────────────────────────── -->
  <!--
    O aviso vem PRIMEIRO: é a regra que decide se o componente pode ser usado
    (clique direito não se anuncia), e as outras quatro stacks o põem no topo.
    Depois, os oito atributos, na ordem do conteúdo.
  -->
  <DocsAccessibility
    screenReaderTitle={$tNavStore('common.screenReader')}
    screenReaderItems={screenReaderItems}
    summary={$tStore('accessibility.summary')}
    items={[
      $tStore('accessibility.warning'),
      $tStore('accessibility.aria.roleMenu'),
      $tStore('accessibility.aria.roleMenuItem'),
      $tStore('accessibility.aria.roleMenuitemCheckbox'),
      $tStore('accessibility.aria.roleMenuitemRadio'),
      $tStore('accessibility.aria.ariaChecked'),
      $tStore('accessibility.aria.ariaDisabled'),
      $tStore('accessibility.aria.ariaHaspopup'),
      $tStore('accessibility.aria.ariaExpanded'),
    ]}
    keyboardTitle={$tStore('accessibility.keyboardTitle')}
    keyboardItems={[
      { key: 'Right-click / Menu / Shift+F10', description: $tStore('accessibility.keyboard.rightClick') },
      { key: 'Arrow Down',  description: $tStore('accessibility.keyboard.arrowDown')  },
      { key: 'Arrow Up',    description: $tStore('accessibility.keyboard.arrowUp')    },
      { key: 'Arrow Right', description: $tStore('accessibility.keyboard.arrowRight') },
      { key: 'Arrow Left',  description: $tStore('accessibility.keyboard.arrowLeft')  },
      { key: 'Home / End',  description: $tStore('accessibility.keyboard.homeEnd')    },
      { key: 'A–Z',         description: $tStore('accessibility.keyboard.typeahead')  },
      { key: 'Enter',       description: $tStore('accessibility.keyboard.enter')      },
      { key: 'Space',       description: $tStore('accessibility.keyboard.space')      },
      { key: 'Esc',         description: $tStore('accessibility.keyboard.escape')     },
      { key: 'Tab',         description: $tStore('accessibility.keyboard.tab')        },
    ]}
  />

  <!-- ── Relacionados ─────────────────────────────────────────────────── -->
  <!-- A descrição é TEXTO no container: sem `toPlainText`, tag vira texto. -->
  <DocsRelated
    items={[
      { name: 'DropdownMenu', description: toPlainText($tStore('related.dropdownMenu')), path: '?path=/docs/components-overlay-dropdownmenu--docs' },
      { name: 'Menubar',      description: toPlainText($tStore('related.menubar')),      path: '?path=/docs/components-navigation-menubar--docs'      },
      { name: 'Dialog',       description: toPlainText($tStore('related.dialog')),       path: '?path=/docs/components-overlay-dialog--docs'       },
      { name: 'AlertDialog',  description: toPlainText($tStore('related.alertDialog')),  path: '?path=/docs/components-overlay-alertdialog--docs'  },
      { name: 'Tooltip',      description: toPlainText($tStore('related.tooltip')),      path: '?path=/docs/components-overlay-tooltip--docs'      },
    ]}
  />

  <!-- ── Notas ────────────────────────────────────────────────────────── -->
  <DocsNotes
    items={stringsFromDict($tStore, 'notes', 'tip').map((content) => ({ title: '', content }))}
  />

  <!-- ── Analytics ────────────────────────────────────────────────────── -->
  <DocsAnalytics
    cols={{
      event:   $tStore('analytics.table.event'),
      trigger: toPlainText($tStore('analytics.table.trigger')),
      payload: $tStore('analytics.table.payload'),
    }}
    items={[
      { event: $tStore('analytics.table.menuOpen'),      trigger: toPlainText($tStore('analytics.table.menuOpenTrigger')),      payload: $tStore('analytics.table.menuOpenPayload')      },
      { event: $tStore('analytics.table.itemClick'),     trigger: toPlainText($tStore('analytics.table.itemClickTrigger')),     payload: $tStore('analytics.table.itemClickPayload')     },
      { event: $tStore('analytics.table.close'),         trigger: toPlainText($tStore('analytics.table.closeTrigger')),         payload: $tStore('analytics.table.closePayload')         },
      { event: $tStore('analytics.table.pageView'),      trigger: toPlainText($tStore('analytics.table.pageViewTrigger')),      payload: $tStore('analytics.table.pageViewPayload')      },
      { event: $tStore('analytics.table.sectionViewed'), trigger: toPlainText($tStore('analytics.table.sectionViewedTrigger')), payload: $tStore('analytics.table.sectionViewedPayload') },
      { event: $tStore('analytics.table.langSwitch'),    trigger: toPlainText($tStore('analytics.table.langSwitchTrigger')),    payload: $tStore('analytics.table.langSwitchPayload')    },
    ]}
  />

  <!-- ── Testes ────────────────────────────────────────────────────────── -->
  <DocsTestes
    functional={{
      title: $tStore('testes.functional.title'),
      cols: {
        action:   $tNavStore('common.userAction'),
        result:   $tNavStore('common.expectedResult'),
        priority: $tNavStore('common.priority'),
      },
      items: entriesFromDict($tStore, 'testes.functional', ['action', 'result', 'priority']).map(
        (entry) => ({ ...entry, priority: localPriority(entry.priority, $tNavStore) }),
      ),
    }}
    accessibility={{
      title: $tStore('testes.accessibility.title'),
      cols: {
        criterion: $tNavStore('common.criterion'),
        level:     'WCAG',
        how:       $tNavStore('common.howToVerify'),
      },
      items: stringsFromDict($tStore, 'testes.accessibility').map((criterion, i) => ({
        criterion,
        level: A11Y_TEST_LEVELS[i] ?? 'AA',
        how: A11Y_TEST_HOW[i] ?? 'axe-core',
      })),
    }}
    visual={{
      title: $tStore('testes.visual.title'),
      cols: {
        story:    $tNavStore('common.storyState'),
        priority: $tNavStore('common.priority'),
      },
      items: entriesFromDict($tStore, 'testes.visual', ['story', 'priority']).map((entry) => ({
        ...entry,
        priority: localPriority(entry.priority, $tNavStore),
      })),
    }}
  />
</DocsPageLayout>
