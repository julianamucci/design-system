<script lang="ts">
  import { untrack } from 'svelte';
  import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuLabel,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuCheckboxItem,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    createMenuCloseWatch,
  } from '@/components/ui/dropdown-menu';
  import { dropdownMenuEntriesSource } from '@/components/ui/dropdown-menu/dropdown-menu.source';
  import {
    menuEntriesState,
    type MenuDocsEntry,
  } from '@/components/ui/dropdown-menu/dropdown-menu.fixtures';
  import { Button } from '@/components/ui/button';
  import { locale, useTranslation } from '@/lib/i18n';
  import { applySeo } from '@/lib/use-seo';
  import { track } from '@/lib/analytics';
  import { createActiveSection } from '@/lib/use-active-section.svelte';
  import DOMPurify from 'dompurify';
  import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.svelte';
  import {
    DocsHeader, DocsDemonstration, DocsAnatomy, DocsWhenToUse, DocsDoDont,
    DocsImport, DocsCompositions, DocsStates, DocsProps, DocsTokens,
    DocsAccessibility, DocsRelated, DocsNotes, DocsAnalytics, DocsTestes,
  } from '@/components/docs/shared/sections';
  import uiTranslations from '@/i18n/ui.json';
  import dropdownMenuTranslations from '@shared/content/dropdown-menu/translations.json';
  import { stripHtml, toPlainText } from '@/lib/strip-html';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(dropdownMenuTranslations);

  /**
   * Varre `base.item1`, `base.item2`, … enquanto existirem no conteúdo.
   *
   * Citar índice por índice trava a lista no tamanho de hoje: o conteúdo
   * compartilhado ganha um item e ele simplesmente não existe para quem lê —
   * sem erro, sem aviso, nos três idiomas de uma vez. Foi o que aconteceu com o
   * sétimo critério de acessibilidade deste componente.
   */
  function stringsFromDict(
    t: (key: string, defaultValue?: string) => string,
    base: string,
  ): string[] {
    const out: string[] = [];
    for (let i = 1; ; i++) {
      const value = t(`${base}.item${i}`, '');
      if (!value) break;
      out.push(value);
    }
    return out;
  }

  /**
   * A mesma varredura para a lista cujo item é um OBJETO — critério funcional,
   * story de regressão visual. O primeiro campo é quem decide se o item existe,
   * e os demais acompanham. Contagem fixa aqui escondia os critérios novos: a
   * página renderizava 8 dos 14 funcionais.
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

  // Nível WCAG e forma de verificar ficam aqui, e não no conteúdo compartilhado,
  // porque são IDENTIFICADORES (número de critério, consulta da suíte, regra do
  // axe) e identificador não se traduz. A coluna "como verificar" dizia "DOM
  // inspection", "Keyboard test" e "Contrast analyzer" — frase em inglês, igual
  // nos três idiomas e sem dizer o que de fato mede; agora diz a consulta ou a
  // regra, como no ContextMenu desta stack e no DropdownMenu do vue. Item novo
  // além da lista cai no par padrão em vez de sumir.
  const a11yTestLevels = ['AA', '4.1.2', '4.1.2', '4.1.2', '2.4.3', '1.4.3', '4.1.2'];
  const a11yTestHow = [
    'axe-core',
    'aria-haspopup · aria-expanded',
    "getByRole('menu')",
    "getAllByRole('menuitem' | 'menuitemcheckbox' | 'menuitemradio')",
    'Escape · document.activeElement',
    'axe-core · color-contrast',
    'ArrowDown · document.activeElement',
  ];

  // ─── Rastreio ────────────────────────────────────────────────────────────────

  /** As seções desta página que renderizam o menu VIVO. */
  type MenuLocation = 'docs_demo' | 'docs_variantes' | 'docs_do_dont';

  /** O painel de submenu, pelo `data-slot` que o wrapper escreve nele. */
  const SUB_CONTENT_SELECTOR = '[data-slot="dropdown-menu-sub-content"]';

  /**
   * Abertura, escolha e fechamento de UM menu vivo desta página, no formato da
   * família (ContextMenu e Menubar): todo payload leva `component`, `menu` e
   * `location`; o de item soma `label`, o de fechamento soma `reason`.
   *
   * `menu` é o id estável da prévia — `demo-account`, `pair1-do`,
   * `with-checkbox-items` — e `label` o do item, a chave do rótulo em kebab.
   * `location` é a SEÇÃO onde o menu está (guideline 07), e vem de quem chama:
   * um clique no preview de Variantes ou do Do & Don't é tão real quanto o da
   * Demonstração. Nenhum dos três leva texto traduzido, sob pena de partir o
   * mesmo evento em um por idioma.
   *
   * O MOTIVO do fechamento vem do `menu-close-reason.ts`, ao lado das peças e
   * compartilhado pelos três membros da família: o `onOpenChange` da lib diz só
   * que o menu fechou, e quem traduz gesto em palavra é o componente — esta
   * página só repassa. Até 2026-09-12 a tradução morava AQUI, e a mesma dedução
   * vivia copiada em três docs pages, nenhuma com teste.
   *
   * Duas portas para o item, porque só uma decide: `select` é o item de AÇÃO,
   * que fecha o menu e arma `api`; `toggle` é a marcação e a opção de rádio,
   * que alternam e deixam o menu aberto sem armar motivo.
   */
  function dropdownMenuTracker(menu: string, location: MenuLocation) {
    let open = false;
    const closeWatch = createMenuCloseWatch({
      subContentSelector: SUB_CONTENT_SELECTOR,
      isOpen: () => open,
    });
    const announce = (label: string) =>
      track('dropdown_menu_item_select', { component: 'dropdown-menu', menu, label, location });
    return {
      onOpenChange(next: boolean) {
        open = next;
        if (next) {
          closeWatch.reset();
          track('dropdown_menu_open', { component: 'dropdown-menu', menu, location });
          return;
        }
        track('dropdown_menu_close', {
          component: 'dropdown-menu',
          menu,
          reason: closeWatch.takeReason(),
          location,
        });
      },
      /** O que o PAINEL anota — espalhado no `Content`: Escape, clique fora e Tab. */
      content: closeWatch.content,
      /** O painel do submenu vive num portal à parte: o Tab dado nele não passa pelo de cima. */
      subContent: closeWatch.subContent,
      /** O clique no gatilho do menu ABERTO o fecha sem decidir nada. */
      trigger: closeWatch.trigger,
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

  type DropdownMenuTracker = ReturnType<typeof dropdownMenuTracker>;

  // Um rastreador por menu vivo: o motivo do fechamento é estado de CADA menu.
  // A demonstração tem quatro menus, então o id é o da prévia seguido do gatilho;
  // Variantes usa a chave do card em kebab; o Do & Don't, o par e o lado.
  const menus = {
    demoAccount:       dropdownMenuTracker('demo-account',        'docs_demo'),
    demoColumns:       dropdownMenuTracker('demo-columns',        'docs_demo'),
    demoTheme:         dropdownMenuTracker('demo-theme',          'docs_demo'),
    demoFile:          dropdownMenuTracker('demo-file',           'docs_demo'),
    pair1Do:           dropdownMenuTracker('pair1-do',            'docs_do_dont'),
    pair1Dont:         dropdownMenuTracker('pair1-dont',          'docs_do_dont'),
    pair2Do:           dropdownMenuTracker('pair2-do',            'docs_do_dont'),
    pair2Dont:         dropdownMenuTracker('pair2-dont',          'docs_do_dont'),
    default:           dropdownMenuTracker('default',             'docs_variantes'),
    destructive:       dropdownMenuTracker('destructive',         'docs_variantes'),
    withLabel:         dropdownMenuTracker('with-label',          'docs_variantes'),
    withCheckboxItems: dropdownMenuTracker('with-checkbox-items', 'docs_variantes'),
    withRadioGroup:    dropdownMenuTracker('with-radio-group',    'docs_variantes'),
    withShortcuts:     dropdownMenuTracker('with-shortcuts',      'docs_variantes'),
  };

  // Os dez itens do contraexemplo "menu longo demais": o rótulo é o de
  // `action` seguido do número, e o id do item, `action-1` … `action-10`.
  const ACTION_NUMBERS = Array.from({ length: 10 }, (_, index) => index + 1);

  // ─── Cards de Variantes ──────────────────────────────────────────────────────
  //
  // Os seis cards, pela CHAVE do conteúdo compartilhado. A MESMA lista monta a
  // prévia (o snippet `menuEntries`) e imprime o código
  // (`dropdownMenuEntriesSource`), como no ContextMenu desta stack e na
  // `variantMenu` do vanilla. Até 2026-09-11 cada card tinha um literal em
  // português ao lado da prévia: em inglês a prévia dizia "Account" e o código
  // "Conta", e os cards `default` e `destructive` mostravam um item solto que a
  // prévia nem tinha. Rótulo sai de `demonstration.labels.*`; o `value` de cada
  // item é o valor estável do evento.

  const VARIANT_KEYS = [
    'default',
    'destructive',
    'withLabel',
    'withCheckboxItems',
    'withRadioGroup',
    'withShortcuts',
  ] as const;
  type VariantKey = (typeof VARIANT_KEYS)[number];

  /** O gatilho de cada card, pela chave inteira do conteúdo: ele diz o que o menu é. */
  const VARIANT_TRIGGER: Record<VariantKey, string> = {
    default: 'demonstration.labels.account',
    destructive: 'demonstration.labels.account',
    withLabel: 'demonstration.labels.account',
    withCheckboxItems: 'demonstration.labels.columns',
    withRadioGroup: 'demonstration.labels.theme',
    withShortcuts: 'demonstration.labels.edit',
  };

  function variantEntries(key: VariantKey, t: (key: string) => string): MenuDocsEntry[] {
    // A chave do rótulo vai inteira, e não montada por partes: é por ela que o
    // `audit.mjs` confere que a página usa os mesmos rótulos das outras stacks.
    const action = (
      value: string,
      labelKey: string,
      extra: { shortcut?: string; variant?: 'destructive' } = {},
    ): MenuDocsEntry => ({ type: 'item', value, label: t(labelKey), ...extra });
    const separator: MenuDocsEntry = { type: 'separator' };
    // Conta: o grupo nomeado de `demo-account`, que três cards repetem.
    const accountGroup: MenuDocsEntry = {
      type: 'group',
      label: t('demonstration.labels.account'),
      items: [
        action('profile', 'demonstration.labels.profile'),
        action('settings', 'demonstration.labels.settings'),
      ],
    };

    switch (key) {
      case 'default':
        // Os itens de `demo-account`, com a saída destrutiva.
        return [
          accountGroup,
          separator,
          action('logout', 'demonstration.labels.logout', { variant: 'destructive' }),
        ];
      case 'destructive':
        return [
          action('rename', 'demonstration.labels.rename'),
          separator,
          action('delete-account', 'demonstration.labels.deleteAccount', { variant: 'destructive' }),
        ];
      case 'withLabel':
        return [
          accountGroup,
          separator,
          {
            type: 'group',
            label: t('demonstration.labels.support'),
            items: [
              action('documentation', 'demonstration.labels.documentation'),
              action('logout', 'demonstration.labels.logout'),
            ],
          },
        ];
      case 'withCheckboxItems':
        // Como `demo-columns`: Nome marcado, E-mail e Função não.
        return [
          {
            type: 'group',
            label: t('demonstration.labels.visibleColumns'),
            items: [
              { type: 'checkbox', value: 'column-name', label: t('demonstration.labels.columnName'), checked: true },
              { type: 'checkbox', value: 'column-email', label: t('demonstration.labels.columnEmail'), checked: false },
              { type: 'checkbox', value: 'column-role', label: t('demonstration.labels.columnRole'), checked: false },
            ],
          },
        ];
      case 'withRadioGroup':
        // Como `demo-theme`: a aparência nasce em "Claro".
        return [
          {
            type: 'radio-group',
            label: t('demonstration.labels.appearance'),
            name: 'theme',
            value: 'light',
            items: [
              { value: 'light', label: t('demonstration.labels.light') },
              { value: 'dark', label: t('demonstration.labels.dark') },
              { value: 'system', label: t('demonstration.labels.system') },
            ],
          },
        ];
      case 'withShortcuts':
        return [
          action('undo', 'demonstration.labels.undo', { shortcut: t('demonstration.labels.undoShortcut') }),
          action('copy', 'demonstration.labels.copy', { shortcut: t('demonstration.labels.copyShortcut') }),
          separator,
          action('paste', 'demonstration.labels.paste', { shortcut: t('demonstration.labels.pasteShortcut') }),
        ];
    }
  }

  // As listas no idioma da página, lidas uma vez por troca de idioma: é delas
  // que saem a prévia e o código de cada card.
  const variantMenus = $derived.by(() => {
    const t = $tStore;
    return Object.fromEntries(VARIANT_KEYS.map((key) => [key, variantEntries(key, t)])) as Record<
      VariantKey,
      MenuDocsEntry[]
    >;
  });

  const variantCode = (key: VariantKey) =>
    dropdownMenuEntriesSource({
      triggerLabel: $tStore(VARIANT_TRIGGER[key]),
      entries: variantMenus[key],
    });

  // As marcações e a escolha única dos cards abrem no estado que a lista
  // declara — o mesmo que o código publica. O rótulo não importa aqui, e por
  // isso a leitura dispensa o idioma.
  const variantState = $state(
    menuEntriesState(VARIANT_KEYS.flatMap((key) => variantEntries(key, (name) => name))),
  );

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria. O
  // `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
  const screenReaderItems = $derived(
    Object.entries(
      (dropdownMenuTranslations as unknown as Record<
        string,
        { accessibility?: { screenReader?: Record<string, string> } }
      >)[$locale]?.accessibility?.screenReader ?? {},
    )
      .filter(([key]) => key !== 'title')
      .map(([, value]) => value),
  );

  // ─── SEO + Analytics ─────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale: l,
      componentSlug: 'dropdown-menu',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: 'Overlay', item: '/components/overlay' },
        { name: 'DropdownMenu' },
      ],
    });
    // O título da ABA, com o sufixo que `applySeo` escreve — o mesmo valor das
    // outras páginas desta stack. Sem ele o GA4 abria duas linhas por página.
    track('docs_page_view', {
      component_name: 'dropdown-menu',
      locale: l,
      page_title: `${t('title')} · Design System`,
    });
    return cleanup;
  });

  // ─── Active section ──────────────────────────────────────────────────────────

  const NAV_GROUPS = $derived.by(() => {
    const tNav = $tNavStore;
    const tContent = $tStore;
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
    track('docs_section_viewed', { section_id: id, component_name: 'dropdown-menu', locale: $locale });
  });
  $effect(() => section.attach());

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const priorityKeyMap: Record<string, string> = {
    high: 'common.high',
    medium: 'common.medium',
    low: 'common.low',
  };
  function localPriority(raw: string, tNav: (k: string) => string): string {
    return tNav(priorityKeyMap[raw] ?? 'common.high');
  }

  // ─── State para demos interativos ────────────────────────────────────────────

  // Os valores iniciais da demonstração são os dos cards de Variantes e os do
  // snippet do painel Code: Nome marcado, E-mail e Função não, e a aparência em
  // "Claro". Nascia com o e-mail marcado e o tema em "Sistema" — a prévia dizia
  // uma coisa e o código logo abaixo dela dizia outra, que é a deriva medida no
  // vanilla. O id estável do item é a chave: é o mesmo valor que vai no evento.
  const columns = $state({ 'column-name': true, 'column-email': false, 'column-role': false });
  let theme = $state('light');

  // ─── Code strings ────────────────────────────────────────────────────────────

  // O exemplo de uso da seção Importação: o menu de `demo-account`, pela mesma
  // lista do card `default` — no idioma de quem lê. Era um literal em português
  // nos três idiomas.
  const codeImportUsage = $derived(
    dropdownMenuEntriesSource({
      triggerLabel: $tStore('demonstration.labels.account'),
      entries: variantMenus.default,
    }),
  );

  const codeImportBasic = `import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";`;

  const interfaceCode = `// DropdownMenu (Root)
interface DropdownMenuProps {
  open?: boolean;               // bindável: também define o estado inicial
  onOpenChange?: (open: boolean) => void;
  dir?: 'ltr' | 'rtl';
}

// DropdownMenuContent
interface DropdownMenuContentProps {
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  alignOffset?: number;
}

// DropdownMenuItem
interface DropdownMenuItemProps {
  variant?: 'default' | 'destructive';
  inset?: boolean;
  disabled?: boolean;
  onSelect?: (e: Event) => void;
}

// DropdownMenuCheckboxItem
interface DropdownMenuCheckboxItemProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
}

// DropdownMenuRadioGroup
interface DropdownMenuRadioGroupProps {
  value?: string;
  onValueChange?: (value: string) => void;
}`;

  const propsTableCols = $derived({
    prop: $tStore('props.table.prop'),
    type: $tStore('props.table.type'),
    default: $tStore('props.table.default'),
    required: $tStore('props.table.required'),
    description: $tStore('props.table.description'),
  });
</script>

<DocsPageLayout navGroups={NAV_GROUPS} activeSection={section.value} componentSlug="dropdown-menu">
  {#snippet header()}
    <DocsHeader
      title={$tStore('title')}
      description={$tStore('description')}
      category={$tStore('category')}
      type={$tStore('type')}
    />
  {/snippet}

  <!-- ── Demonstração ───────────────────────────────────────────── -->
  <DocsDemonstration>
    <!--
      Quatro células, cada uma com a LEGENDA do conteúdo em cima e o menu
      embaixo, como no vanilla. A legenda descreve a célula; o gatilho diz o que
      o menu é. Até 2026-09-11 o texto da legenda ia no gatilho — o botão dizia
      "Com checkbox-items (toggles)" —, e os rótulos do menu eram literais em
      português nos três idiomas. `--grid-min` é custom property: a grade decide
      quantas colunas cabem a partir dela.
    -->
    <div class="nds-grid nds-w-full nds-min-h-40" data-spacing="md" style="--grid-min: 9rem; contain: layout">
      <div class="nds-stack nds-min-h-20" data-spacing="sm" style="contain: layout">
        <p class="nds-text-caption nds-font-medium nds-text-muted-foreground">{$tStore('demonstration.labels.basic')}</p>
        <DropdownMenu onOpenChange={menus.demoAccount.onOpenChange}>
          <DropdownMenuTrigger {...menus.demoAccount.trigger}>
            {#snippet child({ props })}
              <Button variant="outline" {...props}>{$tStore('demonstration.labels.account')}</Button>
            {/snippet}
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="start" {...menus.demoAccount.content}>
            {@render accountItems(menus.demoAccount)}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div class="nds-stack nds-min-h-20" data-spacing="sm" style="contain: layout">
        <p class="nds-text-caption nds-font-medium nds-text-muted-foreground">{$tStore('demonstration.labels.withCheckbox')}</p>
        <DropdownMenu onOpenChange={menus.demoColumns.onOpenChange}>
          <DropdownMenuTrigger {...menus.demoColumns.trigger}>
            {#snippet child({ props })}
              <Button variant="outline" {...props}>{$tStore('demonstration.labels.columns')}</Button>
            {/snippet}
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="start" {...menus.demoColumns.content}>
            {@render columnsItems(menus.demoColumns)}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div class="nds-stack nds-min-h-20" data-spacing="sm" style="contain: layout">
        <p class="nds-text-caption nds-font-medium nds-text-muted-foreground">{$tStore('demonstration.labels.withRadio')}</p>
        <DropdownMenu onOpenChange={menus.demoTheme.onOpenChange}>
          <DropdownMenuTrigger {...menus.demoTheme.trigger}>
            {#snippet child({ props })}
              <Button variant="outline" {...props}>{$tStore('demonstration.labels.theme')}</Button>
            {/snippet}
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="start" {...menus.demoTheme.content}>
            {@render themeItems(menus.demoTheme)}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div class="nds-stack nds-min-h-20" data-spacing="sm" style="contain: layout">
        <p class="nds-text-caption nds-font-medium nds-text-muted-foreground">{$tStore('demonstration.labels.withSubmenu')}</p>
        <DropdownMenu onOpenChange={menus.demoFile.onOpenChange}>
          <DropdownMenuTrigger {...menus.demoFile.trigger}>
            {#snippet child({ props })}
              <Button variant="outline" {...props}>{$tStore('demonstration.labels.file')}</Button>
            {/snippet}
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="start" {...menus.demoFile.content}>
            <DropdownMenuItem onSelect={menus.demoFile.select('rename')}>{$tStore('demonstration.labels.rename')}</DropdownMenuItem>
            <!-- O sub-gatilho não tem ação própria: ele abre o painel filho, e é lá que estão os itens. -->
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>{$tStore('demonstration.labels.export')}</DropdownMenuSubTrigger>
              <DropdownMenuSubContent {...menus.demoFile.subContent}>
                <DropdownMenuItem onSelect={menus.demoFile.select('pdf')}>{$tStore('demonstration.labels.pdf')}</DropdownMenuItem>
                <DropdownMenuItem onSelect={menus.demoFile.select('csv')}>{$tStore('demonstration.labels.csv')}</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  </DocsDemonstration>

  <!--
    Os miolos que se repetem entre seções, pela CHAVE do conteúdo — um literal
    em português ficava em português para quem lê a página em inglês ou
    espanhol. A chave vai inteira, e não montada por partes: é por ela que o
    `audit.mjs` confere que a página usa os mesmos rótulos das outras stacks.
    O `label` de cada item é o id estável do evento, a chave em kebab.
  -->

  <!-- Conta: o grupo nomeado e a saída destrutiva — `demo-account`. -->
  {#snippet accountItems(tracker: DropdownMenuTracker)}
    <!--
      `Group` + `Label` é a dupla que dá NOME ao agrupamento: dentro do grupo o
      rótulo vira o cabeçalho da lib, e o `id` dele entra no `aria-labelledby`.
      Um `Label` FORA de um grupo rotula visualmente e não nomeia nada.
    -->
    <DropdownMenuGroup>
      <DropdownMenuLabel>{$tStore('demonstration.labels.account')}</DropdownMenuLabel>
      <DropdownMenuItem onSelect={tracker.select('profile')}>{$tStore('demonstration.labels.profile')}</DropdownMenuItem>
      <DropdownMenuItem onSelect={tracker.select('settings')}>{$tStore('demonstration.labels.settings')}</DropdownMenuItem>
    </DropdownMenuGroup>
    <DropdownMenuSeparator />
    <DropdownMenuItem variant="destructive" onSelect={tracker.select('logout')}>{$tStore('demonstration.labels.logout')}</DropdownMenuItem>
  {/snippet}

  <!-- Dois grupos nomeados, Conta e Suporte — o faça do par 1. -->
  {#snippet accountSupportItems(tracker: DropdownMenuTracker)}
    <DropdownMenuGroup>
      <DropdownMenuLabel>{$tStore('demonstration.labels.account')}</DropdownMenuLabel>
      <DropdownMenuItem onSelect={tracker.select('profile')}>{$tStore('demonstration.labels.profile')}</DropdownMenuItem>
      <DropdownMenuItem onSelect={tracker.select('settings')}>{$tStore('demonstration.labels.settings')}</DropdownMenuItem>
    </DropdownMenuGroup>
    <DropdownMenuSeparator />
    <DropdownMenuGroup>
      <DropdownMenuLabel>{$tStore('demonstration.labels.support')}</DropdownMenuLabel>
      <DropdownMenuItem onSelect={tracker.select('documentation')}>{$tStore('demonstration.labels.documentation')}</DropdownMenuItem>
      <DropdownMenuItem onSelect={tracker.select('logout')}>{$tStore('demonstration.labels.logout')}</DropdownMenuItem>
    </DropdownMenuGroup>
  {/snippet}

  <!--
    Colunas visíveis: alternadores independentes, no grupo que o rótulo nomeia.
    Marcar não fecha o menu — `toggle`, sem motivo de fechamento.
  -->
  {#snippet columnsItems(tracker: DropdownMenuTracker)}
    <DropdownMenuGroup>
      <DropdownMenuLabel>{$tStore('demonstration.labels.visibleColumns')}</DropdownMenuLabel>
      <DropdownMenuCheckboxItem
        bind:checked={columns['column-name']}
        onSelect={tracker.toggle('column-name')}
      >
        {$tStore('demonstration.labels.columnName')}
      </DropdownMenuCheckboxItem>
      <DropdownMenuCheckboxItem
        bind:checked={columns['column-email']}
        onSelect={tracker.toggle('column-email')}
      >
        {$tStore('demonstration.labels.columnEmail')}
      </DropdownMenuCheckboxItem>
      <DropdownMenuCheckboxItem
        bind:checked={columns['column-role']}
        onSelect={tracker.toggle('column-role')}
      >
        {$tStore('demonstration.labels.columnRole')}
      </DropdownMenuCheckboxItem>
    </DropdownMenuGroup>
  {/snippet}

  <!-- Aparência: escolha única; o grupo de rádio já é um grupo, e o rótulo o nomeia. -->
  {#snippet themeItems(tracker: DropdownMenuTracker)}
    <DropdownMenuRadioGroup bind:value={theme}>
      <DropdownMenuLabel>{$tStore('demonstration.labels.appearance')}</DropdownMenuLabel>
      <DropdownMenuRadioItem value="light" onSelect={tracker.toggle('light')}>{$tStore('demonstration.labels.light')}</DropdownMenuRadioItem>
      <DropdownMenuRadioItem value="dark" onSelect={tracker.toggle('dark')}>{$tStore('demonstration.labels.dark')}</DropdownMenuRadioItem>
      <DropdownMenuRadioItem value="system" onSelect={tracker.toggle('system')}>{$tStore('demonstration.labels.system')}</DropdownMenuRadioItem>
    </DropdownMenuRadioGroup>
  {/snippet}

  <!--
    Renomear e excluir. `destructive` separa a ação irreversível e a pinta de
    perigo; sem ele, é o contraexemplo do par 2.
  -->
  {#snippet renameDeleteItems(tracker: DropdownMenuTracker, destructive: boolean)}
    <DropdownMenuItem onSelect={tracker.select('rename')}>{$tStore('demonstration.labels.rename')}</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem
      variant={destructive ? 'destructive' : 'default'}
      onSelect={tracker.select('delete-account')}
    >
      {$tStore('demonstration.labels.deleteAccount')}
    </DropdownMenuItem>
  {/snippet}

  <!--
    As entradas de um card de Variantes, recursivas no submenu — a MESMA lista
    que `dropdownMenuEntriesSource` imprime no painel Code do card. Item de AÇÃO
    escolhe e fecha (`select`, motivo `api`); marcação e opção de rádio alternam
    e deixam o menu aberto (`toggle`, sem motivo). O atalho mora dentro do item,
    à direita do rótulo, e é lido junto dele.
  -->
  {#snippet menuEntries(entries: MenuDocsEntry[], tracker: DropdownMenuTracker)}
    {#each entries as entry, index (index)}
      {#if entry.type === 'item'}
        <DropdownMenuItem variant={entry.variant} onSelect={tracker.select(entry.value)}>
          {entry.label}
          {#if entry.shortcut}
            <DropdownMenuShortcut>{entry.shortcut}</DropdownMenuShortcut>
          {/if}
        </DropdownMenuItem>
      {:else if entry.type === 'separator'}
        <DropdownMenuSeparator />
      {:else if entry.type === 'group'}
        <DropdownMenuGroup>
          <DropdownMenuLabel>{entry.label}</DropdownMenuLabel>
          {@render menuEntries(entry.items, tracker)}
        </DropdownMenuGroup>
      {:else if entry.type === 'checkbox'}
        <DropdownMenuCheckboxItem
          bind:checked={variantState.checked[entry.value]}
          onSelect={tracker.toggle(entry.value)}
        >
          {entry.label}
        </DropdownMenuCheckboxItem>
      {:else if entry.type === 'radio-group'}
        <DropdownMenuRadioGroup bind:value={variantState.radio[entry.name]}>
          <DropdownMenuLabel>{entry.label}</DropdownMenuLabel>
          {#each entry.items as option (option.value)}
            <DropdownMenuRadioItem value={option.value} onSelect={tracker.toggle(option.value)}>
              {option.label}
            </DropdownMenuRadioItem>
          {/each}
        </DropdownMenuRadioGroup>
      {:else if entry.type === 'submenu'}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>{entry.label}</DropdownMenuSubTrigger>
          <DropdownMenuSubContent {...tracker.subContent}>
            {@render menuEntries(entry.items, tracker)}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      {/if}
    {/each}
  {/snippet}

  <!--
    Um card: o gatilho, que diz o que o menu é, e o menu da lista, com o
    rastreador do card. (As prévias do Do & Don't escrevem o menu por extenso: o
    `dodont_preview_sem_componente` procura o componente na própria prévia, e
    não atravessa um snippet.)
  -->
  {#snippet variantCard(key: VariantKey)}
    <div style="contain: layout">
      <DropdownMenu onOpenChange={menus[key].onOpenChange}>
        <DropdownMenuTrigger {...menus[key].trigger}>
          {#snippet child({ props })}
            <Button variant="outline" size="sm" {...props}>{$tStore(VARIANT_TRIGGER[key])}</Button>
          {/snippet}
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="start" {...menus[key].content}>
          {@render menuEntries(variantMenus[key], menus[key])}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  {/snippet}

  <!-- ── Anatomia ───────────────────────────────────────────────── -->
  <DocsAnatomy
    items={[
      $tStore('anatomy.item1'),
      $tStore('anatomy.item2'),
      $tStore('anatomy.item3'),
      $tStore('anatomy.item4'),
      $tStore('anatomy.item5'),
      $tStore('anatomy.item6'),
      $tStore('anatomy.item7'),
      $tStore('anatomy.item8'),
      $tStore('anatomy.item9'),
    ]}
    structureLabel={$tStore('anatomy.structureLabel')}
    structureCode={$tStore('anatomy.structureCode')}
  />

  <!-- ── Quando Usar ────────────────────────────────────────────── -->
  <DocsWhenToUse
    guidelines={{
      title: $tStore('usage.guidelines.title'),
      items: [
        stripHtml($tStore('usage.guidelines.item1')),
        stripHtml($tStore('usage.guidelines.item2')),
        stripHtml($tStore('usage.guidelines.item3')),
        stripHtml($tStore('usage.guidelines.item4')),
        stripHtml($tStore('usage.guidelines.item5')),
      ],
    }}
    scenarios={{
      title: $tStore('usage.scenarios.title'),
      cols: {
        scenario: $tStore('usage.scenarios.cols.scenario'),
        use: $tStore('usage.scenarios.cols.use'),
        alternative: $tStore('usage.scenarios.cols.alternative'),
      },
      items: [
        { s: $tStore('usage.scenarios.item1.s'), u: $tStore('usage.scenarios.item1.u'), a: $tStore('usage.scenarios.item1.a') },
        { s: $tStore('usage.scenarios.item2.s'), u: $tStore('usage.scenarios.item2.u'), a: $tStore('usage.scenarios.item2.a') },
        { s: $tStore('usage.scenarios.item3.s'), u: $tStore('usage.scenarios.item3.u'), a: $tStore('usage.scenarios.item3.a') },
        { s: $tStore('usage.scenarios.item4.s'), u: $tStore('usage.scenarios.item4.u'), a: $tStore('usage.scenarios.item4.a') },
        { s: $tStore('usage.scenarios.item5.s'), u: $tStore('usage.scenarios.item5.u'), a: $tStore('usage.scenarios.item5.a') },
      ],
    }}
    uxWriting={{
      title: $tStore('usage.uxWriting.title'),
      cols: {
        element: $tStore('usage.uxWriting.table.element'),
        rules: $tStore('usage.uxWriting.table.rules'),
        do: $tStore('usage.uxWriting.table.correct'),
        dont: $tStore('usage.uxWriting.table.avoid'),
      },
      items: [
        { element: $tStore('usage.uxWriting.table.trigger.name'),     rules: $tStore('usage.uxWriting.table.trigger.format'),     do: $tStore('usage.uxWriting.table.trigger.good'),     dont: $tStore('usage.uxWriting.table.trigger.bad') },
        { element: $tStore('usage.uxWriting.table.label.name'),       rules: $tStore('usage.uxWriting.table.label.format'),       do: $tStore('usage.uxWriting.table.label.good'),       dont: $tStore('usage.uxWriting.table.label.bad') },
        { element: $tStore('usage.uxWriting.table.item.name'),        rules: $tStore('usage.uxWriting.table.item.format'),        do: $tStore('usage.uxWriting.table.item.good'),        dont: $tStore('usage.uxWriting.table.item.bad') },
        { element: $tStore('usage.uxWriting.table.destructive.name'), rules: $tStore('usage.uxWriting.table.destructive.format'), do: $tStore('usage.uxWriting.table.destructive.good'), dont: $tStore('usage.uxWriting.table.destructive.bad') },
      ],
    }}
    do={{
      title: $tStore('usage.do.title'),
      items: [
        $tStore('usage.do.item1'),
        $tStore('usage.do.item2'),
        $tStore('usage.do.item3'),
        $tStore('usage.do.item4'),
      ],
    }}
    dont={{
      title: $tStore('usage.dont.title'),
      items: [
        $tStore('usage.dont.item1'),
        $tStore('usage.dont.item2'),
        $tStore('usage.dont.item3'),
        $tStore('usage.dont.item4'),
      ],
    }}
  />

  <!-- ── Do & Don't ─────────────────────────────────────────────── -->
  <DocsDoDont
    pairs={[
      {
        doLabel: $tNavStore('common.do'),
        dontLabel: $tNavStore('common.dont'),
        doCaption: $tStore('doDont.pair1.do'),
        dontCaption: $tStore('doDont.pair1.dont'),
        doPreview: doPair1,
        dontPreview: dontPair1,
      },
      {
        doLabel: $tNavStore('common.do'),
        dontLabel: $tNavStore('common.dont'),
        doCaption: $tStore('doDont.pair2.do'),
        dontCaption: $tStore('doDont.pair2.dont'),
        doPreview: doPair2,
        dontPreview: dontPair2,
      },
    ]}
  />

  <!--
    Par 1: agrupar. O faça traz os dois grupos nomeados, Conta e Suporte, com a
    divisória entre eles — é o que a legenda descreve; o evite, dez itens soltos.
    Par 2: a ação destrutiva. Os dois lados têm os mesmos itens e a mesma
    divisória; o que muda é a variante de perigo, o assunto da legenda.
  -->
  {#snippet doPair1()}
    <div style="contain: layout">
      <DropdownMenu onOpenChange={menus.pair1Do.onOpenChange}>
        <DropdownMenuTrigger {...menus.pair1Do.trigger}>
          {#snippet child({ props })}
            <Button variant="outline" size="sm" {...props}>{$tStore('demonstration.labels.account')}</Button>
          {/snippet}
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="start" {...menus.pair1Do.content}>
          {@render accountSupportItems(menus.pair1Do)}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  {/snippet}
  {#snippet dontPair1()}
    <div style="contain: layout">
      <DropdownMenu onOpenChange={menus.pair1Dont.onOpenChange}>
        <DropdownMenuTrigger {...menus.pair1Dont.trigger}>
          {#snippet child({ props })}
            <Button variant="outline" size="sm" {...props}>{$tStore('demonstration.labels.menu')}</Button>
          {/snippet}
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="start" {...menus.pair1Dont.content}>
          <!--
            Dez itens planos, que é o número da legenda: com seis a lista ainda
            parece curta, e o "vira lista de scroll" não aparece.
          -->
          {#each ACTION_NUMBERS as number (number)}
            <DropdownMenuItem onSelect={menus.pair1Dont.select(`action-${number}`)}>
              {$tStore('demonstration.labels.action')} {number}
            </DropdownMenuItem>
          {/each}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  {/snippet}
  {#snippet doPair2()}
    <div style="contain: layout">
      <DropdownMenu onOpenChange={menus.pair2Do.onOpenChange}>
        <DropdownMenuTrigger {...menus.pair2Do.trigger}>
          {#snippet child({ props })}
            <Button variant="outline" size="sm" {...props}>{$tStore('demonstration.labels.account')}</Button>
          {/snippet}
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="start" {...menus.pair2Do.content}>
          {@render renameDeleteItems(menus.pair2Do, true)}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  {/snippet}
  {#snippet dontPair2()}
    <div style="contain: layout">
      <DropdownMenu onOpenChange={menus.pair2Dont.onOpenChange}>
        <DropdownMenuTrigger {...menus.pair2Dont.trigger}>
          {#snippet child({ props })}
            <Button variant="outline" size="sm" {...props}>{$tStore('demonstration.labels.account')}</Button>
          {/snippet}
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="start" {...menus.pair2Dont.content}>
          {@render renameDeleteItems(menus.pair2Dont, false)}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  {/snippet}

  <!-- ── Importação ─────────────────────────────────────────────── -->
  <DocsImport
    code={codeImportBasic}
    secondaryCode={codeImportUsage}
  />

  <!-- ── Variantes ──────────────────────────────────────────────── -->
  <DocsCompositions
    id="variantes"
    useWhenLabel={$tNavStore('common.useWhen')}
    componentSlug="dropdown-menu"
    items={[
      { trackId: 'default',     name: $tStore('variants.items.default'),     description: stripHtml($tStore('variants.styles.default')),     code: variantCode('default'),     preview: variantDefault     },
      { trackId: 'destructive', name: $tStore('variants.items.destructive'), description: stripHtml($tStore('variants.styles.destructive')), code: variantCode('destructive'), preview: variantDestructive },
      {
        trackId: 'withLabel',
        name: $tStore('variants.items.withLabel.name'),
        description: $tStore('variants.items.withLabel.description'),
        useWhen: $tStore('variants.items.withLabel.use'),
        code: variantCode('withLabel'),
        preview: variantWithLabel,
      },
      {
        trackId: 'withCheckboxItems',
        name: $tStore('variants.items.withCheckboxItems.name'),
        description: $tStore('variants.items.withCheckboxItems.description'),
        useWhen: $tStore('variants.items.withCheckboxItems.use'),
        code: variantCode('withCheckboxItems'),
        preview: variantWithCheckboxItems,
      },
      {
        trackId: 'withRadioGroup',
        name: $tStore('variants.items.withRadioGroup.name'),
        description: $tStore('variants.items.withRadioGroup.description'),
        useWhen: $tStore('variants.items.withRadioGroup.use'),
        code: variantCode('withRadioGroup'),
        preview: variantWithRadioGroup,
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
    Os seis cards de Variantes, cada um com o rastreador dele e `location`
    `docs_variantes`. Até 2026-09-11 nenhum rastreava, e os gatilhos diziam o
    NOME do card ("Default", "Destructive") em vez do que o menu é. O container
    pede uma prévia sem argumento por card.
  -->
  {#snippet variantDefault()}{@render variantCard('default')}{/snippet}
  {#snippet variantDestructive()}{@render variantCard('destructive')}{/snippet}
  {#snippet variantWithLabel()}{@render variantCard('withLabel')}{/snippet}
  {#snippet variantWithCheckboxItems()}{@render variantCard('withCheckboxItems')}{/snippet}
  {#snippet variantWithRadioGroup()}{@render variantCard('withRadioGroup')}{/snippet}
  {#snippet variantWithShortcuts()}{@render variantCard('withShortcuts')}{/snippet}

  <!-- ── Estados ────────────────────────────────────────────────── -->
  <DocsStates
    cols={{
      state: $tStore('states.cols.state'),
      trigger: toPlainText($tStore('states.cols.trigger')),
      behavior: toPlainText($tStore('states.cols.behavior')),
    }}
    items={[
      { label: $tStore('states.closed.label'),   trigger: toPlainText($tStore('states.closed.trigger')),   behavior: toPlainText($tStore('states.closed.behavior')) },
      { label: $tStore('states.open.label'),     trigger: toPlainText($tStore('states.open.trigger')),     behavior: toPlainText($tStore('states.open.behavior')) },
      { label: $tStore('states.disabled.label'), trigger: toPlainText($tStore('states.disabled.trigger')), behavior: toPlainText($tStore('states.disabled.behavior')) },
      { label: $tStore('states.checked.label'),  trigger: toPlainText($tStore('states.checked.trigger')),  behavior: toPlainText($tStore('states.checked.behavior')) },
    ]}
  />

  <!-- ── Propriedades ───────────────────────────────────────────── -->
  <DocsProps
    tables={[
      {
        cols: propsTableCols,
        items: [
          { name: 'open',         type: $tStore('props.table.open.type'),         defaultValue: $tStore('props.table.open.default'),         required: $tStore('props.table.open.required'),         description: $tStore('props.table.open.description')         },
          { name: 'onOpenChange', type: $tStore('props.table.onOpenChange.type'), defaultValue: $tStore('props.table.onOpenChange.default'), required: $tStore('props.table.onOpenChange.required'), description: $tStore('props.table.onOpenChange.description') },
          // `defaultOpen` e `modal` não entram: não existem na API deste stack —
          // eram aceitos e ignorados em silêncio. O estado inicial sai do
          // próprio `open`, que é bindável, e o bloqueio de interação não é
          // configurável aqui. Documentar prop que o componente ignora é
          // prometer o que o produto não cumpre.
          //
          // A premissa é conferida por `ui/bits-menu-premissas.test.ts`: o
          // `MenuRootPropsWithoutHTML` do bits declara `open` e `onOpenChange` e
          // nada mais. Se um bump passar a expor as duas props, o portão reprova
          // e esta omissão vira dívida em vez de decisão.
          { name: 'side',         type: $tStore('props.table.side.type'),         defaultValue: $tStore('props.table.side.default'),         required: $tStore('props.table.side.required'),         description: $tStore('props.table.side.description')         },
          { name: 'align',        type: $tStore('props.table.align.type'),        defaultValue: $tStore('props.table.align.default'),        required: $tStore('props.table.align.required'),        description: $tStore('props.table.align.description')        },
        ],
      },
    ]}
    interfaceCode={interfaceCode}
    extensibilityTitle={$tStore('props.extensibilityTitle')}
    extensibilityCode={$tStore('props.extensibilityCode')}
  />

  <!-- ── Tokens ─────────────────────────────────────────────────── -->
  <DocsTokens
    cols={{
      token: $tStore('tokens.table.token'),
      value: $tStore('tokens.table.class'),
      description: $tStore('tokens.table.part'),
    }}
    items={[
      { token: '--popover',            value: $tStore('tokens.table.background.class'),  description: $tStore('tokens.table.background.part')  },
      { token: '--popover-foreground', value: $tStore('tokens.table.foreground.class'),  description: $tStore('tokens.table.foreground.part')  },
      { token: '--border',             value: $tStore('tokens.table.border.class'),      description: $tStore('tokens.table.border.part')      },
      { token: '--elevation-md',             value: $tStore('tokens.table.shadow.class'),      description: $tStore('tokens.table.shadow.part')      },
      { token: '--radius',             value: $tStore('tokens.table.rounded.class'),     description: $tStore('tokens.table.rounded.part')     },
      { token: '--accent',             value: $tStore('tokens.table.itemHover.class'),   description: $tStore('tokens.table.itemHover.part')   },
      { token: '--destructive',        value: $tStore('tokens.table.destructive.class'), description: $tStore('tokens.table.destructive.part') },
    ]}
    customizationTitle={$tStore('tokens.customizationTitle')}
    customizationCode={$tStore('tokens.customizationCode')}
  />

  <!-- ── Acessibilidade ─────────────────────────────────────────── -->
  <DocsAccessibility
    screenReaderTitle={$tNavStore('common.screenReader')}
    screenReaderItems={screenReaderItems}
    summary={$tStore('accessibility.summary')}
    items={[
      $tStore('accessibility.items.item1'),
      $tStore('accessibility.items.item2'),
      $tStore('accessibility.items.item3'),
      $tStore('accessibility.items.item4'),
      $tStore('accessibility.items.item5'),
      $tStore('accessibility.items.item6'),
    ]}
    keyboardTitle={$tStore('accessibility.keyboard.title')}
    keyboardItems={[
      { key: 'Tab',                description: $tStore('accessibility.keyboard.tab')       },
      { key: 'Arrow Up / Arrow Down',                description: $tStore('accessibility.keyboard.arrows')    },
      { key: 'Enter / Space',      description: $tStore('accessibility.keyboard.enter')     },
      { key: 'Escape',             description: $tStore('accessibility.keyboard.escape')    },
      { key: 'Home / End',         description: $tStore('accessibility.keyboard.homeEnd')   },
      { key: 'A-Z',                description: $tStore('accessibility.keyboard.typeahead') },
    ]}
  />

  <!-- ── Relacionados ───────────────────────────────────────────── -->
  <DocsRelated
    items={[
      { name: $tStore('related.items.contextMenu.name'), description: $tStore('related.items.contextMenu.description'), path: '?path=/docs/components-overlay-contextmenu--docs' },
      { name: $tStore('related.items.menubar.name'),     description: $tStore('related.items.menubar.description'),     path: '?path=/docs/components-navigation-menubar--docs'     },
      { name: $tStore('related.items.command.name'),     description: $tStore('related.items.command.description'),     path: '?path=/docs/components-overlay-command--docs'     },
      { name: $tStore('related.items.popover.name'),     description: $tStore('related.items.popover.description'),     path: '?path=/docs/components-overlay-popover--docs'     },
      { name: $tStore('related.items.select.name'),      description: $tStore('related.items.select.description'),      path: '?path=/docs/components-form-select--docs'      },
    ]}
  />

  <!-- ── Notas ──────────────────────────────────────────────────── -->
  <DocsNotes
    items={[
      { title: '', content: $tStore('notes.item1') },
      { title: '', content: $tStore('notes.item2') },
      { title: '', content: $tStore('notes.item3') },
      { title: '', content: $tStore('notes.item4') },
      { title: '', content: $tStore('notes.item5') },
    ]}
  />

  <!-- ── Analytics ─────────────────────────────────────────────── -->
  <!--
    Cabeçalho e linhas saem do conteúdo compartilhado, como no ContextMenu: a
    tabela escrita aqui ensinava `label` onde o evento leva `menu`, não tinha o
    `reason` e ficava em português nos três idiomas.
  -->
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

  <!-- ── Testes ─────────────────────────────────────────────────── -->
  <DocsTestes
    functional={{
      title: $tStore('testes.functional.title'),
      cols: {
        action: $tNavStore('common.userAction'),
        result: $tNavStore('common.expectedResult'),
        priority: $tNavStore('common.priority'),
      },
      items: entriesFromDict($tStore, 'testes.functional', ['action', 'result', 'priority']).map(
        (entry) => ({
          action: toPlainText(entry.action),
          result: toPlainText(entry.result),
          priority: localPriority(entry.priority, $tNavStore),
        }),
      ),
    }}
    accessibility={{
      title: $tStore('testes.accessibility.title'),
      cols: {
        criterion: $tNavStore('common.criterion'),
        level: 'WCAG',
        how: $tNavStore('common.howToVerify'),
      },
      items: stringsFromDict($tStore, 'testes.accessibility').map((criterion, i) => ({
        criterion: toPlainText(criterion),
        level: a11yTestLevels[i] ?? 'AA',
        how: a11yTestHow[i] ?? 'axe-core',
      })),
    }}
    visual={{
      title: $tStore('testes.visual.title'),
      cols: {
        story: $tNavStore('common.storyState'),
        priority: $tNavStore('common.priority'),
      },
      items: entriesFromDict($tStore, 'testes.visual', ['story', 'priority']).map((entry) => ({
        story: entry.story,
        priority: localPriority(entry.priority, $tNavStore),
      })),
    }}
  />
</DocsPageLayout>

<!-- DOMPurify.sanitize available para uso futuro em {@html} dinâmico -->
{#if false}
  {@html DOMPurify.sanitize('')}
{/if}
