<script lang="ts">
  import { untrack } from 'svelte';
  import {
    Menubar,
    MenubarMenu,
    MenubarTrigger,
    MenubarContent,
    MenubarItem,
    MenubarGroup,
    MenubarGroupHeading,
    MenubarSeparator,
    MenubarShortcut,
    MenubarCheckboxItem,
    MenubarRadioGroup,
    MenubarRadioItem,
    MenubarSub,
    MenubarSubTrigger,
    MenubarSubContent,
    createMenuCloseWatch,
  } from '@/components/ui/menubar';
  import { menubarEntriesSource, type MenubarDocsMenu } from '@/components/ui/menubar/menubar.source';
  import {
    menuEntriesState,
    type MenuDocsEntry,
  } from '@/components/ui/dropdown-menu/dropdown-menu.fixtures';
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
  import menubarTranslations from '@shared/content/menubar/translations.json';
  import { stripHtml, toPlainText } from '@/lib/strip-html';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(menubarTranslations);

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria. O
  // `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
  const screenReaderItems = $derived(
    Object.entries(
      (menubarTranslations as unknown as Record<
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
      componentSlug: 'menubar',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: $tStore('category'), item: '/components/navigation' },
        { name: 'Menubar' },
      ],
    });
    // O título da ABA, com o sufixo que `applySeo` escreve — o mesmo valor das
    // outras páginas desta stack. Sem ele o GA4 abria duas linhas por página.
    track('docs_page_view', {
      component_name: 'menubar',
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
        { id: 'demonstracao', label: tContent('nav.demonstration') },
        { id: 'anatomia',     label: tContent('nav.anatomy')       },
        { id: 'quando-usar',  label: tContent('nav.usage')         },
        { id: 'do-dont',      label: tContent('nav.doDont')        },
      ]},
      { label: tNav('nav.techRef'), sections: [
        { id: 'importacao',   label: tContent('nav.import')   },
        { id: 'variantes',    label: tContent('nav.variants')     },
        { id: 'estados',      label: tContent('nav.states')       },
        { id: 'propriedades', label: tContent('nav.props')    },
        { id: 'tokens',       label: tContent('nav.tokens')   },
      ]},
      { label: tNav('nav.context'), sections: [
        { id: 'acessibilidade', label: tContent('nav.accessibility') },
        { id: 'relacionados',   label: tContent('nav.related')       },
        { id: 'notas',          label: tContent('nav.notes')         },
      ]},
      { label: tNav('nav.quality'), sections: [
        { id: 'analytics', label: tContent('nav.analytics') },
        { id: 'testes',    label: tContent('nav.testes')    },
      ]},
    ];
  });

  const sectionIds = untrack(() => NAV_GROUPS.flatMap(g => g.sections.map(s => s.id)));
  const section = createActiveSection(sectionIds, (id) => {
    track('docs_section_viewed', { section_id: id, component_name: 'menubar', locale: $locale });
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

  /**
   * Varre `base.item1`, `base.item2`, … enquanto existirem no conteúdo.
   *
   * Citar índice por índice trava a lista no tamanho de hoje: o conteúdo
   * compartilhado ganha um item e ele simplesmente não existe para quem lê —
   * sem erro, sem aviso, nos três idiomas de uma vez. Foi o que aconteceu aqui:
   * a página renderizava 9 dos 16 critérios funcionais e 7 dos 8 de
   * acessibilidade.
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

  /** A mesma varredura para a lista cujo item é um OBJETO; o primeiro campo decide. */
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

  // Nível WCAG e forma de verificar cada critério de acessibilidade, por índice.
  // São identificadores (número de critério, ferramenta), e identificador não se
  // traduz: por isso ficam aqui e não no conteúdo. Item além da lista cai no par
  // padrão em vez de sumir.
  const a11yTestLevels = ['AA', '1.3.1', '4.1.2', '4.1.2', '4.1.2', '2.4.3', '1.4.3', '2.1.1'];
  const a11yTestHow = [
    'axe-core',
    'DOM inspection',
    'DOM inspection',
    'DOM inspection',
    'DOM inspection',
    'Keyboard test',
    'Contrast analyzer',
    'Keyboard test',
  ];

  // ─── Rastreio ────────────────────────────────────────────────────────────────

  /** As seções desta página que renderizam a barra VIVA. */
  type MenuLocation = 'docs_demo' | 'docs_variantes' | 'docs_do_dont';

  /** O painel de submenu, pelo `data-slot` que o wrapper escreve nele. */
  const SUB_CONTENT_SELECTOR = '[data-slot="menubar-sub-content"]';

  /**
   * Abertura, escolha e fechamento dos menus de UMA barra viva desta página, no
   * formato da família (DropdownMenu e ContextMenu): todo payload leva
   * `component`, `menu` e `location`; o de item soma `label`, o de fechamento
   * soma `reason`. Até 2026-09-11 a barra não disparava nada.
   *
   * `menu` é o id estável: numa barra de um menu só, o id da prévia
   * (`pair2-do`, `with-shortcuts`); numa barra de vários, o id da prévia seguido
   * do menu (`demo-file`, `pair1-do-edit`) — o `value` de cada `MenubarMenu` é a
   * chave do gatilho, e é ele que completa o id. `label` é o id do item, a chave
   * do rótulo em kebab. `location` é a SEÇÃO onde a barra está, e vem de quem
   * chama. Nenhum leva texto traduzido.
   *
   * Quem diz abertura e fechamento é o `onValueChange` da RAIZ, e não o de cada
   * menu: é o único aviso que passa por todo caminho — o menu que a lib abre e
   * fecha, a passagem ao vizinho (um valor troca direto pelo outro) e o
   * fechamento por Tab que o wrapper faz quando a lib deixa o menu aberto
   * (`menubar/tab-leaves-menu.ts`), que escreve o valor por fora da lib.
   *
   * O MOTIVO vem do `menu-close-reason.ts`, ao lado das peças e compartilhado
   * pelos três membros da família: o aviso da lib diz só que o menu fechou, e
   * quem traduz gesto em palavra é o componente — esta página só repassa. Até
   * 2026-09-12 a tradução morava AQUI, e a mesma dedução vivia copiada em três
   * docs pages, nenhuma com teste. A passagem ao menu VIZINHO (um valor que
   * troca direto por outro) é o gesto que só a barra tem, e é ela que o anota.
   *
   * `select` é o item de AÇÃO, que fecha e arma `api`; `toggle` é a marcação e a
   * opção de rádio, que alternam e deixam o menu aberto sem armar motivo.
   */
  function menubarTracker(preview: string, location: MenuLocation, severalMenus = false) {
    let current = '';
    const closeWatch = createMenuCloseWatch({
      subContentSelector: SUB_CONTENT_SELECTOR,
      isOpen: () => Boolean(current),
    });
    const menuId = (value: string) => (severalMenus ? `${preview}-${value}` : preview);
    const announce = (label: string) =>
      track('menubar_item_select', { component: 'menubar', menu: menuId(current), label, location });
    return {
      onValueChange(next: string) {
        if (next === current) return;
        if (current) {
          // Um valor que troca direto por outro é a passagem ao menu vizinho.
          if (next) closeWatch.markSiblingOpen();
          track('menubar_close', {
            component: 'menubar',
            menu: menuId(current),
            reason: closeWatch.takeReason(),
            location,
          });
        }
        current = next;
        closeWatch.reset();
        if (next) track('menubar_open', { component: 'menubar', menu: menuId(next), location });
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

  type MenubarTracker = ReturnType<typeof menubarTracker>;

  // Um rastreador por BARRA: o menu aberto e o motivo do fechamento são estado
  // de cada uma. Variantes usa a chave do card em kebab; o Do & Don't, o par e o
  // lado.
  const bars = {
    demo:           menubarTracker('demo',            'docs_demo',      true),
    pair1Do:        menubarTracker('pair1-do',        'docs_do_dont',   true),
    pair1Dont:      menubarTracker('pair1-dont',      'docs_do_dont'),
    pair2Do:        menubarTracker('pair2-do',        'docs_do_dont'),
    pair2Dont:      menubarTracker('pair2-dont',      'docs_do_dont'),
    default:        menubarTracker('default',         'docs_variantes'),
    destructive:    menubarTracker('destructive',     'docs_variantes'),
    withShortcuts:  menubarTracker('with-shortcuts',  'docs_variantes'),
    withCheckbox:   menubarTracker('with-checkbox',   'docs_variantes'),
    withRadio:      menubarTracker('with-radio',      'docs_variantes'),
    editorComplete: menubarTracker('editor-complete', 'docs_variantes', true),
  };

  // ─── Cards de Variantes ──────────────────────────────────────────────────────
  //
  // Os seis cards, pela CHAVE do conteúdo compartilhado. A MESMA lista de menus
  // monta a prévia (o snippet `menuEntries`) e imprime o código
  // (`menubarEntriesSource`), como no ContextMenu desta stack e na `variantMenu`
  // do vanilla. Até 2026-09-11 cada card tinha um literal em português ao lado
  // da prévia, e os de `default` e `destructive` mostravam um item solto ("Novo
  // arquivo", que nem é chave do conteúdo) no lugar do menu da prévia. Rótulo
  // sai de `demonstration.labels.*`; o `value` de cada item é o valor estável do
  // evento, e o de cada menu, a chave do gatilho.

  const VARIANT_KEYS = [
    'default',
    'destructive',
    'withShortcuts',
    'withCheckbox',
    'withRadio',
    'editorComplete',
  ] as const;
  type VariantKey = (typeof VARIANT_KEYS)[number];

  function variantMenusOf(key: VariantKey, t: (key: string) => string): MenubarDocsMenu[] {
    // A chave do rótulo vai inteira, e não montada por partes: é por ela que o
    // `audit.mjs` confere que a página usa os mesmos rótulos das outras stacks.
    const action = (
      value: string,
      labelKey: string,
      extra: { shortcut?: string; variant?: 'destructive' } = {},
    ): MenuDocsEntry => ({ type: 'item', value, label: t(labelKey), ...extra });
    const separator: MenuDocsEntry = { type: 'separator' };
    const file = (entries: MenuDocsEntry[]): MenubarDocsMenu => ({
      value: 'file',
      triggerLabel: t('demonstration.labels.file'),
      entries,
    });

    switch (key) {
      case 'default':
        return [
          file([
            action('new', 'demonstration.labels.new', { shortcut: t('demonstration.labels.newShortcut') }),
            action('save', 'demonstration.labels.save', { shortcut: t('demonstration.labels.saveShortcut') }),
          ]),
        ];
      case 'destructive':
        return [
          file([
            action('save', 'demonstration.labels.save'),
            separator,
            action('delete-file', 'demonstration.labels.deleteFile', { variant: 'destructive' }),
          ]),
        ];
      case 'withShortcuts':
        return [
          {
            value: 'edit',
            triggerLabel: t('demonstration.labels.edit'),
            entries: [
              action('undo', 'demonstration.labels.undo', { shortcut: t('demonstration.labels.undoShortcut') }),
              action('redo', 'demonstration.labels.redo', { shortcut: t('demonstration.labels.redoShortcut') }),
              separator,
              action('copy', 'demonstration.labels.copy', { shortcut: t('demonstration.labels.copyShortcut') }),
              action('paste', 'demonstration.labels.paste', { shortcut: t('demonstration.labels.pasteShortcut') }),
            ],
          },
        ];
      case 'withCheckbox':
        // Itens de marcação de verdade: o tique é o indicador do componente, não
        // um glifo no texto. Só a barra lateral nasce marcada, como no vanilla.
        return [
          {
            value: 'view',
            triggerLabel: t('demonstration.labels.view'),
            entries: [
              {
                type: 'group',
                label: t('demonstration.labels.panels'),
                items: [
                  { type: 'checkbox', value: 'sidebar', label: t('demonstration.labels.sidebar'), checked: true },
                  { type: 'checkbox', value: 'grid', label: t('demonstration.labels.grid'), checked: false },
                  { type: 'checkbox', value: 'ruler', label: t('demonstration.labels.ruler'), checked: false },
                ],
              },
            ],
          },
        ];
      case 'withRadio':
        // O grupo de rádio já é um grupo: o rótulo mora dentro dele e o nomeia.
        // O escuro nasce escolhido, como no vanilla.
        return [
          {
            value: 'theme',
            triggerLabel: t('demonstration.labels.theme'),
            entries: [
              {
                type: 'radio-group',
                label: t('demonstration.labels.appearance'),
                name: 'appearance',
                value: 'dark',
                items: [
                  { value: 'light', label: t('demonstration.labels.light') },
                  { value: 'dark', label: t('demonstration.labels.dark') },
                  { value: 'system', label: t('demonstration.labels.system') },
                ],
              },
            ],
          },
        ];
      case 'editorComplete':
        return [
          file([
            action('new', 'demonstration.labels.new', { shortcut: t('demonstration.labels.newShortcut') }),
            action('open', 'demonstration.labels.open', { shortcut: t('demonstration.labels.openShortcut') }),
            action('save', 'demonstration.labels.save', { shortcut: t('demonstration.labels.saveShortcut') }),
            separator,
            action('quit', 'demonstration.labels.quit', { shortcut: t('demonstration.labels.quitShortcut') }),
          ]),
          {
            value: 'edit',
            triggerLabel: t('demonstration.labels.edit'),
            entries: [
              action('undo', 'demonstration.labels.undo', { shortcut: t('demonstration.labels.undoShortcut') }),
              action('redo', 'demonstration.labels.redo', { shortcut: t('demonstration.labels.redoShortcut') }),
            ],
          },
          {
            value: 'view',
            triggerLabel: t('demonstration.labels.view'),
            entries: [
              {
                type: 'group',
                label: t('demonstration.labels.appearance'),
                items: [action('dark-mode', 'demonstration.labels.darkMode')],
              },
              separator,
              action('full-screen', 'demonstration.labels.fullScreen', {
                shortcut: t('demonstration.labels.fullScreenShortcut'),
              }),
            ],
          },
          {
            value: 'help',
            triggerLabel: t('demonstration.labels.help'),
            entries: [
              action('documentation', 'demonstration.labels.documentation'),
              action('about', 'demonstration.labels.about'),
            ],
          },
        ];
    }
  }

  // As listas no idioma da página, lidas uma vez por troca de idioma: é delas
  // que saem a prévia e o código de cada card.
  const variantMenus = $derived.by(() => {
    const t = $tStore;
    return Object.fromEntries(VARIANT_KEYS.map((key) => [key, variantMenusOf(key, t)])) as Record<
      VariantKey,
      MenubarDocsMenu[]
    >;
  });

  const variantCode = (key: VariantKey) => menubarEntriesSource({ menus: variantMenus[key] });

  // As marcações e a escolha única dos cards abrem no estado que a lista
  // declara — o mesmo que o código publica. O rótulo não importa aqui, e por
  // isso a leitura dispensa o idioma.
  const variantState = $state(
    menuEntriesState(
      VARIANT_KEYS.flatMap((key) => variantMenusOf(key, (name) => name)).flatMap((menu) => menu.entries),
    ),
  );

  // ─── State para demos interativos ────────────────────────────────────────────
  //
  // Os estados de partida são os do vanilla: na demonstração, "Modo escuro"
  // desmarcado, "Mostrar régua" marcada e o tema do sistema escolhido.

  let demoDarkMode = $state(false);
  let demoShowRuler = $state(true);
  let demoTheme = $state('system-theme');

  // ─── Code strings ────────────────────────────────────────────────────────────

  // O exemplo de uso da seção Importação: a barra do card `default`, pela mesma
  // lista — no idioma de quem lê. Era um literal em português nos três idiomas.
  const codeImportUsage = $derived(menubarEntriesSource({ menus: variantMenus.default }));

  const codeImportBasic = `import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarGroup,
  MenubarGroupHeading,
  MenubarSeparator,
  MenubarShortcut,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
} from "@/components/ui/menubar";`;

  const interfaceCode = `// Menubar (Root)
interface MenubarProps {
  value?: string; // também é o valor inicial, sem bind
  onValueChange?: (value: string) => void;
  loop?: boolean; // default true
}

// MenubarMenu
interface MenubarMenuProps {
  value?: string;
}

// MenubarContent
interface MenubarContentProps {
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  alignOffset?: number;
}

// MenubarItem
interface MenubarItemProps {
  variant?: 'default' | 'destructive';
  inset?: boolean;
  disabled?: boolean;
  onSelect?: (e: Event) => void;
}

// MenubarCheckboxItem
interface MenubarCheckboxItemProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
}

// MenubarRadioGroup
interface MenubarRadioGroupProps {
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

<DocsPageLayout navGroups={NAV_GROUPS} activeSection={section.value} componentSlug="menubar">
  {#snippet header()}
    <DocsHeader
      title={$tStore('title')}
      description={$tStore('description')}
      category={$tStore('category')}
      type={$tStore('type')}
    />
  {/snippet}

  <!-- ── Demonstração ───────────────────────────────────────────── -->
  <DocsDemonstration title={$tStore('demonstration.title')}>
    <!--
      UMA barra com quatro menus, como no vanilla. Tudo pela chave do conteúdo:
      até 2026-09-11 a barra desta stack tinha itens próprios — "Status bar" e
      "Activity bar" em inglês numa página em português, um zoom de 50/100/150%
      e um "Excluir arquivo" que nenhuma outra stack mostrava —, e nada disso
      mudava de idioma.
    -->
    <div class="nds-cluster nds-w-full" data-justify="center" style="contain: layout">
      <Menubar onValueChange={bars.demo.onValueChange}>
        <MenubarMenu value="file">
          <MenubarTrigger {...bars.demo.trigger}>{$tStore('demonstration.labels.file')}</MenubarTrigger>
          <MenubarContent {...bars.demo.content}>
            <MenubarItem onSelect={bars.demo.select('new')}>
              {$tStore('demonstration.labels.new')}
              <MenubarShortcut>{$tStore('demonstration.labels.newShortcut')}</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onSelect={bars.demo.select('open')}>
              {$tStore('demonstration.labels.open')}
              <MenubarShortcut>{$tStore('demonstration.labels.openShortcut')}</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onSelect={bars.demo.select('save')}>
              {$tStore('demonstration.labels.save')}
              <MenubarShortcut>{$tStore('demonstration.labels.saveShortcut')}</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <!-- O sub-gatilho não tem ação própria: ele abre o painel filho. -->
            <MenubarSub>
              <MenubarSubTrigger>{$tStore('demonstration.labels.export')}</MenubarSubTrigger>
              <MenubarSubContent {...bars.demo.subContent}>
                <MenubarItem onSelect={bars.demo.select('pdf')}>{$tStore('demonstration.labels.pdf')}</MenubarItem>
                <MenubarItem onSelect={bars.demo.select('csv')}>{$tStore('demonstration.labels.csv')}</MenubarItem>
              </MenubarSubContent>
            </MenubarSub>
            <MenubarSeparator />
            <MenubarItem onSelect={bars.demo.select('quit')}>
              {$tStore('demonstration.labels.quit')}
              <MenubarShortcut>{$tStore('demonstration.labels.quitShortcut')}</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu value="edit">
          <MenubarTrigger {...bars.demo.trigger}>{$tStore('demonstration.labels.edit')}</MenubarTrigger>
          <MenubarContent {...bars.demo.content}>
            <MenubarItem onSelect={bars.demo.select('undo')}>
              {$tStore('demonstration.labels.undo')}
              <MenubarShortcut>{$tStore('demonstration.labels.undoShortcut')}</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onSelect={bars.demo.select('redo')}>
              {$tStore('demonstration.labels.redo')}
              <MenubarShortcut>{$tStore('demonstration.labels.redoShortcut')}</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onSelect={bars.demo.select('cut')}>
              {$tStore('demonstration.labels.cut')}
              <MenubarShortcut>{$tStore('demonstration.labels.cutShortcut')}</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onSelect={bars.demo.select('copy')}>
              {$tStore('demonstration.labels.copy')}
              <MenubarShortcut>{$tStore('demonstration.labels.copyShortcut')}</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onSelect={bars.demo.select('paste')}>
              {$tStore('demonstration.labels.paste')}
              <MenubarShortcut>{$tStore('demonstration.labels.pasteShortcut')}</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu value="view">
          <MenubarTrigger {...bars.demo.trigger}>{$tStore('demonstration.labels.view')}</MenubarTrigger>
          <MenubarContent {...bars.demo.content}>
            <!--
              `Group` + `GroupHeading`: o cabeçalho vira o `aria-labelledby` do
              grupo, e é isso que dá nome aos alternadores para quem ouve.
            -->
            <MenubarGroup>
              <MenubarGroupHeading>{$tStore('demonstration.labels.appearance')}</MenubarGroupHeading>
              <MenubarCheckboxItem
                checked={demoDarkMode}
                onCheckedChange={(v) => (demoDarkMode = v)}
                onSelect={bars.demo.toggle('dark-mode')}
              >
                {$tStore('demonstration.labels.darkMode')}
              </MenubarCheckboxItem>
              <MenubarCheckboxItem
                checked={demoShowRuler}
                onCheckedChange={(v) => (demoShowRuler = v)}
                onSelect={bars.demo.toggle('show-ruler')}
              >
                {$tStore('demonstration.labels.showRuler')}
              </MenubarCheckboxItem>
            </MenubarGroup>
            <MenubarSeparator />
            <MenubarItem onSelect={bars.demo.select('full-screen')}>
              {$tStore('demonstration.labels.fullScreen')}
              <MenubarShortcut>{$tStore('demonstration.labels.fullScreenShortcut')}</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu value="tools">
          <MenubarTrigger {...bars.demo.trigger}>{$tStore('demonstration.labels.tools')}</MenubarTrigger>
          <MenubarContent {...bars.demo.content}>
            <MenubarItem onSelect={bars.demo.select('find')}>
              {$tStore('demonstration.labels.find')}
              <MenubarShortcut>{$tStore('demonstration.labels.findShortcut')}</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onSelect={bars.demo.select('replace')}>
              {$tStore('demonstration.labels.replace')}
              <MenubarShortcut>{$tStore('demonstration.labels.replaceShortcut')}</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarRadioGroup bind:value={demoTheme}>
              <MenubarRadioItem value="light-theme" onSelect={bars.demo.toggle('light-theme')}>
                {$tStore('demonstration.labels.lightTheme')}
              </MenubarRadioItem>
              <MenubarRadioItem value="dark-theme" onSelect={bars.demo.toggle('dark-theme')}>
                {$tStore('demonstration.labels.darkTheme')}
              </MenubarRadioItem>
              <MenubarRadioItem value="system-theme" onSelect={bars.demo.toggle('system-theme')}>
                {$tStore('demonstration.labels.systemTheme')}
              </MenubarRadioItem>
            </MenubarRadioGroup>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
  </DocsDemonstration>

  <!-- ── Anatomia ───────────────────────────────────────────────── -->
  <DocsAnatomy
    title={$tStore('anatomy.title')}
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
    title={$tStore('usage.title')}
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
        { element: $tStore('usage.uxWriting.table.item.name'),        rules: $tStore('usage.uxWriting.table.item.format'),        do: $tStore('usage.uxWriting.table.item.good'),        dont: $tStore('usage.uxWriting.table.item.bad') },
        { element: $tStore('usage.uxWriting.table.shortcut.name'),    rules: $tStore('usage.uxWriting.table.shortcut.format'),    do: $tStore('usage.uxWriting.table.shortcut.good'),    dont: $tStore('usage.uxWriting.table.shortcut.bad') },
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
    title={$tStore('doDont.title')}
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
    Todas as barras desta página nascem FECHADAS. As prévias de Do & Don't e de
    Variantes abriam pelo `value` inicial, e a página carregava com vários
    menus abertos ao mesmo tempo, por cima do texto — e o primeiro evento de
    abertura nunca saía, porque o menu já estava aberto antes de alguém chegar.

    Par 1: três menus categorizados contra uma barra de um menu só, que é
    trabalho de DropdownMenu. Cada menu do faça tem TRÊS itens — a regra de uso
    (`usage.guidelines.item3`) pede de 3 a 10, e um item por menu era o próprio
    contraexemplo do outro lado. Par 2: o atalho visível contra o submenu dentro
    de submenu — vivo, para que a navegação confusa da legenda se sinta no
    teclado.
  -->
  {#snippet doPair1()}
    <div style="contain: layout">
      <Menubar onValueChange={bars.pair1Do.onValueChange}>
        <MenubarMenu value="file">
          <MenubarTrigger {...bars.pair1Do.trigger}>{$tStore('demonstration.labels.file')}</MenubarTrigger>
          <MenubarContent {...bars.pair1Do.content}>
            <MenubarItem onSelect={bars.pair1Do.select('new')}>{$tStore('demonstration.labels.new')}</MenubarItem>
            <MenubarItem onSelect={bars.pair1Do.select('open')}>{$tStore('demonstration.labels.open')}</MenubarItem>
            <MenubarItem onSelect={bars.pair1Do.select('save')}>{$tStore('demonstration.labels.save')}</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu value="edit">
          <MenubarTrigger {...bars.pair1Do.trigger}>{$tStore('demonstration.labels.edit')}</MenubarTrigger>
          <MenubarContent {...bars.pair1Do.content}>
            <MenubarItem onSelect={bars.pair1Do.select('undo')}>{$tStore('demonstration.labels.undo')}</MenubarItem>
            <MenubarItem onSelect={bars.pair1Do.select('copy')}>{$tStore('demonstration.labels.copy')}</MenubarItem>
            <MenubarItem onSelect={bars.pair1Do.select('paste')}>{$tStore('demonstration.labels.paste')}</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu value="view">
          <MenubarTrigger {...bars.pair1Do.trigger}>{$tStore('demonstration.labels.view')}</MenubarTrigger>
          <MenubarContent {...bars.pair1Do.content}>
            <MenubarItem onSelect={bars.pair1Do.select('zoom')}>{$tStore('demonstration.labels.zoom')}</MenubarItem>
            <MenubarItem onSelect={bars.pair1Do.select('full-screen')}>{$tStore('demonstration.labels.fullScreen')}</MenubarItem>
            <!-- Item de AÇÃO aqui, não de marcação: o par é sobre categorizar. -->
            <MenubarItem onSelect={bars.pair1Do.select('show-ruler')}>{$tStore('demonstration.labels.showRuler')}</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
  {/snippet}
  {#snippet dontPair1()}
    <div style="contain: layout">
      <Menubar onValueChange={bars.pair1Dont.onValueChange}>
        <MenubarMenu value="menu">
          <MenubarTrigger {...bars.pair1Dont.trigger}>{$tStore('demonstration.labels.menu')}</MenubarTrigger>
          <MenubarContent {...bars.pair1Dont.content}>
            <MenubarItem onSelect={bars.pair1Dont.select('single-action')}>{$tStore('demonstration.labels.singleAction')}</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
  {/snippet}
  {#snippet doPair2()}
    <div style="contain: layout">
      <Menubar onValueChange={bars.pair2Do.onValueChange}>
        <MenubarMenu value="file">
          <MenubarTrigger {...bars.pair2Do.trigger}>{$tStore('demonstration.labels.file')}</MenubarTrigger>
          <MenubarContent {...bars.pair2Do.content}>
            <MenubarItem onSelect={bars.pair2Do.select('save')}>
              {$tStore('demonstration.labels.save')}
              <MenubarShortcut>{$tStore('demonstration.labels.saveShortcut')}</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onSelect={bars.pair2Do.select('open')}>
              {$tStore('demonstration.labels.open')}
              <MenubarShortcut>{$tStore('demonstration.labels.openShortcut')}</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
  {/snippet}
  {#snippet dontPair2()}
    <div style="contain: layout">
      <Menubar onValueChange={bars.pair2Dont.onValueChange}>
        <MenubarMenu value="file">
          <MenubarTrigger {...bars.pair2Dont.trigger}>{$tStore('demonstration.labels.file')}</MenubarTrigger>
          <MenubarContent {...bars.pair2Dont.content}>
            <MenubarSub>
              <MenubarSubTrigger>{$tStore('demonstration.labels.export')}</MenubarSubTrigger>
              <MenubarSubContent {...bars.pair2Dont.subContent}>
                <MenubarSub>
                  <MenubarSubTrigger>{$tStore('demonstration.labels.format')}</MenubarSubTrigger>
                  <MenubarSubContent {...bars.pair2Dont.subContent}>
                    <MenubarItem onSelect={bars.pair2Dont.select('pdf')}>{$tStore('demonstration.labels.pdf')}</MenubarItem>
                  </MenubarSubContent>
                </MenubarSub>
              </MenubarSubContent>
            </MenubarSub>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
  {/snippet}

  <!-- ── Importação ─────────────────────────────────────────────── -->
  <DocsImport
    title={$tStore('import.title')}
    code={codeImportBasic}
    secondaryCode={codeImportUsage}
  />

  <!-- ── Variantes ──────────────────────────────────────────────── -->
  <DocsCompositions
    id="variantes"
    title={$tStore('variants.title')}
    useWhenLabel={$tNavStore('common.useWhen')}
    componentSlug="menubar"
    items={[
      { trackId: 'default',     name: $tStore('variants.items.default'),     description: stripHtml($tStore('variants.styles.default')),     code: variantCode('default'),     preview: variantDefault     },
      { trackId: 'destructive', name: $tStore('variants.items.destructive'), description: stripHtml($tStore('variants.styles.destructive')), code: variantCode('destructive'), preview: variantDestructive },
      {
        trackId: 'withShortcuts',
        name: $tStore('variants.items.withShortcuts.name'),
        description: $tStore('variants.items.withShortcuts.description'),
        useWhen: $tStore('variants.items.withShortcuts.use'),
        code: variantCode('withShortcuts'),
        preview: variantWithShortcuts,
      },
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
        trackId: 'editorComplete',
        name: $tStore('variants.items.editorComplete.name'),
        description: $tStore('variants.items.editorComplete.description'),
        useWhen: $tStore('variants.items.editorComplete.use'),
        code: variantCode('editorComplete'),
        preview: variantEditorComplete,
      },
    ]}
  />

  <!--
    As entradas de um menu da barra, recursivas no submenu — a MESMA lista que
    `menubarEntriesSource` imprime no painel Code do card. Item de AÇÃO escolhe
    e fecha (`select`, motivo `api`); marcação e opção de rádio alternam e
    deixam o menu aberto (`toggle`, sem motivo). O atalho mora dentro do item,
    à direita do rótulo, e é lido junto dele.
  -->
  {#snippet menuEntries(entries: MenuDocsEntry[], tracker: MenubarTracker)}
    {#each entries as entry, index (index)}
      {#if entry.type === 'item'}
        <MenubarItem variant={entry.variant} onSelect={tracker.select(entry.value)}>
          {entry.label}
          {#if entry.shortcut}
            <MenubarShortcut>{entry.shortcut}</MenubarShortcut>
          {/if}
        </MenubarItem>
      {:else if entry.type === 'separator'}
        <MenubarSeparator />
      {:else if entry.type === 'group'}
        <MenubarGroup>
          <MenubarGroupHeading>{entry.label}</MenubarGroupHeading>
          {@render menuEntries(entry.items, tracker)}
        </MenubarGroup>
      {:else if entry.type === 'checkbox'}
        <MenubarCheckboxItem
          bind:checked={variantState.checked[entry.value]}
          onSelect={tracker.toggle(entry.value)}
        >
          {entry.label}
        </MenubarCheckboxItem>
      {:else if entry.type === 'radio-group'}
        <MenubarRadioGroup bind:value={variantState.radio[entry.name]}>
          <MenubarGroupHeading>{entry.label}</MenubarGroupHeading>
          {#each entry.items as option (option.value)}
            <MenubarRadioItem value={option.value} onSelect={tracker.toggle(option.value)}>
              {option.label}
            </MenubarRadioItem>
          {/each}
        </MenubarRadioGroup>
      {:else if entry.type === 'submenu'}
        <MenubarSub>
          <MenubarSubTrigger>{entry.label}</MenubarSubTrigger>
          <MenubarSubContent {...tracker.subContent}>
            {@render menuEntries(entry.items, tracker)}
          </MenubarSubContent>
        </MenubarSub>
      {/if}
    {/each}
  {/snippet}

  <!--
    Um card: a barra com os menus da lista, e o rastreador da barra com
    `location` `docs_variantes`. O `value` de cada menu é a chave do gatilho,
    e é ele que completa o id do menu no evento (`editor-complete-file`). Até
    2026-09-11 nenhum card rastreava, e todos abriam sozinhos pelo `value`
    inicial.
  -->
  {#snippet variantCard(key: VariantKey)}
    <div style="contain: layout">
      <Menubar onValueChange={bars[key].onValueChange}>
        {#each variantMenus[key] as menu (menu.value)}
          <MenubarMenu value={menu.value}>
            <MenubarTrigger {...bars[key].trigger}>{menu.triggerLabel}</MenubarTrigger>
            <MenubarContent {...bars[key].content}>
              {@render menuEntries(menu.entries, bars[key])}
            </MenubarContent>
          </MenubarMenu>
        {/each}
      </Menubar>
    </div>
  {/snippet}

  <!-- O container pede uma prévia sem argumento por card. -->
  {#snippet variantDefault()}{@render variantCard('default')}{/snippet}
  {#snippet variantDestructive()}{@render variantCard('destructive')}{/snippet}
  {#snippet variantWithShortcuts()}{@render variantCard('withShortcuts')}{/snippet}
  {#snippet variantWithCheckbox()}{@render variantCard('withCheckbox')}{/snippet}
  {#snippet variantWithRadio()}{@render variantCard('withRadio')}{/snippet}
  {#snippet variantEditorComplete()}{@render variantCard('editorComplete')}{/snippet}

  <!-- ── Estados ────────────────────────────────────────────────── -->
  <DocsStates
    title={$tStore('states.title')}
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
    title={$tStore('props.title')}
    tables={[
      {
        cols: propsTableCols,
        items: [
          { name: 'value',         type: $tStore('props.table.value.type'),         defaultValue: $tStore('props.table.value.default'),         required: $tStore('props.table.value.required'),         description: $tStore('props.table.value.description')         },
          { name: 'onValueChange', type: $tStore('props.table.onValueChange.type'), defaultValue: $tStore('props.table.onValueChange.default'), required: $tStore('props.table.onValueChange.required'), description: $tStore('props.table.onValueChange.description') },
          { name: 'loop',          type: $tStore('props.table.loop.type'),          defaultValue: $tStore('props.table.loop.default'),          required: $tStore('props.table.loop.required'),          description: $tStore('props.table.loop.description')          },
          { name: 'side',          type: $tStore('props.table.side.type'),          defaultValue: $tStore('props.table.side.default'),          required: $tStore('props.table.side.required'),          description: $tStore('props.table.side.description')          },
          { name: 'align',         type: $tStore('props.table.align.type'),         defaultValue: $tStore('props.table.align.default'),         required: $tStore('props.table.align.required'),         description: $tStore('props.table.align.description')         },
        ],
      },
    ]}
    interfaceCode={interfaceCode}
    extensibilityTitle={$tStore('props.extensibilityTitle')}
    extensibilityCode={$tStore('props.extensibilityCode')}
  />

  <!-- ── Tokens ─────────────────────────────────────────────────── -->
  <DocsTokens
    title={$tStore('tokens.title')}
    cols={{
      token: $tStore('tokens.table.token'),
      value: $tStore('tokens.table.class'),
      description: $tStore('tokens.table.part'),
    }}
    items={[
      { token: '--background',         value: $tStore('tokens.table.menubarBg.class'),     description: $tStore('tokens.table.menubarBg.part')     },
      { token: '--border',             value: $tStore('tokens.table.menubarBorder.class'), description: $tStore('tokens.table.menubarBorder.part') },
      { token: '--accent',             value: $tStore('tokens.table.triggerHover.class'),  description: $tStore('tokens.table.triggerHover.part')  },
      { token: '--accent-foreground',  value: $tStore('tokens.table.triggerText.class'),   description: $tStore('tokens.table.triggerText.part')   },
      { token: '--radius-sm',          value: $tStore('tokens.table.triggerRadius.class'), description: $tStore('tokens.table.triggerRadius.part') },
      { token: '--popover',            value: $tStore('tokens.table.contentBg.class'),     description: $tStore('tokens.table.contentBg.part')     },
      { token: '--border',             value: $tStore('tokens.table.contentBorder.class'), description: $tStore('tokens.table.contentBorder.part') },
      { token: '--radius',             value: $tStore('tokens.table.rounded.class'),       description: $tStore('tokens.table.rounded.part')       },
      { token: '--accent',             value: $tStore('tokens.table.itemHover.class'),     description: $tStore('tokens.table.itemHover.part')     },
      { token: '--destructive',        value: $tStore('tokens.table.destructive.class'),   description: $tStore('tokens.table.destructive.part')   },
    ]}
    customizationTitle={$tStore('tokens.customizationTitle')}
    customizationCode={$tStore('tokens.customizationCode')}
  />

  <!-- ── Acessibilidade ─────────────────────────────────────────── -->
  <DocsAccessibility
    screenReaderTitle={$tNavStore('common.screenReader')}
    screenReaderItems={screenReaderItems}
    title={$tStore('accessibility.title')}
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
      { key: 'Tab',           description: $tStore('accessibility.keyboard.tab')              },
      { key: 'Arrow Left / Arrow Right',           description: $tStore('accessibility.keyboard.arrowsHorizontal') },
      { key: 'Arrow Up / Arrow Down',           description: $tStore('accessibility.keyboard.arrowsVertical')   },
      { key: 'Enter / Space', description: $tStore('accessibility.keyboard.enter')            },
      { key: 'Escape',        description: $tStore('accessibility.keyboard.escape')           },
      { key: 'Home / End',    description: $tStore('accessibility.keyboard.homeEnd')          },
      { key: 'A-Z',           description: $tStore('accessibility.keyboard.typeahead')        },
    ]}
  />

  <!-- ── Relacionados ───────────────────────────────────────────── -->
  <DocsRelated
    title={$tStore('related.title')}
    items={[
      { name: $tStore('related.items.navigationMenu.name'), description: $tStore('related.items.navigationMenu.description'), path: '?path=/docs/components-navigation-navigationmenu--docs' },
      { name: $tStore('related.items.dropdownMenu.name'),   description: $tStore('related.items.dropdownMenu.description'),   path: '?path=/docs/components-overlay-dropdownmenu--docs'   },
      { name: $tStore('related.items.sidebar.name'),        description: $tStore('related.items.sidebar.description'),        path: '?path=/docs/components-layout-sidebar--docs'        },
      { name: $tStore('related.items.command.name'),        description: $tStore('related.items.command.description'),        path: '?path=/docs/components-overlay-command--docs'        },
    ]}
  />

  <!-- ── Notas ──────────────────────────────────────────────────── -->
  <DocsNotes
    title={$tStore('notes.title')}
    items={[
      { title: '', content: $tStore('notes.item1') },
      { title: '', content: $tStore('notes.item2') },
      { title: '', content: $tStore('notes.item3') },
      { title: '', content: $tStore('notes.item4') },
      { title: '', content: $tStore('notes.item5') },
      { title: '', content: $tStore('notes.item6') },
    ]}
  />

  <!-- ── Analytics ─────────────────────────────────────────────── -->
  <!--
    Cabeçalho e linhas saem do conteúdo compartilhado, como no ContextMenu. A
    tabela escrita aqui listava `menubar_menu_open` e `menubar_shortcut_invoke`,
    dois eventos que nenhum tipo declara e que a página nunca disparou.
  -->
  <DocsAnalytics
    title={$tStore('analytics.title')}
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
    title={$tStore('testes.title')}
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
