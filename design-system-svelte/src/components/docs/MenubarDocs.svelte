<script lang="ts">
  import {
    Menubar,
    MenubarMenu,
    MenubarTrigger,
    MenubarContent,
    MenubarItem,
    MenubarLabel,
    MenubarSeparator,
    MenubarShortcut,
    MenubarCheckboxItem,
    MenubarRadioGroup,
    MenubarRadioItem,
    MenubarSub,
    MenubarSubTrigger,
    MenubarSubContent,
  } from '@/components/ui/menubar';
  import { locale, useTranslation } from '@/lib/i18n';
  import { applySeo } from '@/lib/use-seo';
  import { track } from '@/lib/analytics';
  import { createActiveSection } from '@/lib/use-active-section.svelte';
  import { sanitizeHtml } from '@/lib/sanitize-html';
  import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.svelte';
  import {
    DocsHeader, DocsDemonstration, DocsAnatomy, DocsWhenToUse, DocsDoDont,
    DocsImport, DocsVariants, DocsCompositions, DocsStates, DocsProps, DocsTokens,
    DocsAccessibility, DocsRelated, DocsNotes, DocsAnalytics, DocsTestes,
  } from '@/components/docs/shared/sections';
  import uiTranslations from '@/i18n/ui.json';
  import menubarTranslations from '@shared/content/menubar/translations.json';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(menubarTranslations);

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
      aiIntent: t('seo.aiIntent'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: $tStore('category'), item: '/components/navigation' },
        { name: 'Menubar' },
      ],
    });
    track('docs_page_view', {
      component_name: 'menubar',
      locale: l,
      page_title: t('title'),
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
        { id: 'composicoes',  label: tContent('nav.compositions') },
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

  const sectionIds = NAV_GROUPS.flatMap(g => g.sections.map(s => s.id));
  const section = createActiveSection(sectionIds, (id) => {
    track('docs_section_viewed', { section_id: id, component_name: 'menubar', locale: $locale });
  });
  $effect(() => section.attach());

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  function stripHtml(s: string) {
    return s.replace(/<[^>]*>/g, '');
  }

  const priorityKeyMap: Record<string, string> = {
    high: 'common.high',
    medium: 'common.medium',
    low: 'common.low',
  };
  function localPriority(raw: string, tNav: (k: string) => string): string {
    return tNav(priorityKeyMap[raw] ?? 'common.high');
  }

  // ─── State para demos interativos ────────────────────────────────────────────

  let demoStatus = $state(true);
  let demoActivity = $state(false);
  let demoZoom = $state('100');
  let compShowSidebar = $state(true);
  let compShowGrid = $state(false);
  let compTheme = $state('system');

  // ─── Code strings ────────────────────────────────────────────────────────────

  const codeImportBasic = `import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
} from "@/components/ui/menubar";`;

  const codeImportUsage = `<Menubar>
  <MenubarMenu>
    <MenubarTrigger>Arquivo</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>
        Novo
        <MenubarShortcut>⌘N</MenubarShortcut>
      </MenubarItem>
      <MenubarSeparator />
      <MenubarItem variant="destructive">Excluir</MenubarItem>
    </MenubarContent>
  </MenubarMenu>
</Menubar>`;

  const codeDefault = `<MenubarItem>Novo arquivo</MenubarItem>`;
  const codeDestructive = `<MenubarItem variant="destructive">
  Excluir arquivo
</MenubarItem>`;

  const interfaceCode = `// Menubar (Root)
interface MenubarProps {
  value?: string;
  defaultValue?: string;
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
      installNote="npx shadcn-svelte@latest add menubar"
    />
  {/snippet}

  <!-- ── Demonstração ───────────────────────────────────────────── -->
  <DocsDemonstration title={$tStore('demonstration.title')}>
    {#snippet children()}
      <div class="flex items-center justify-center w-full" style="contain: layout">
        <Menubar>
          <MenubarMenu value="file">
            <MenubarTrigger>Arquivo</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>
                Novo
                <MenubarShortcut>⌘N</MenubarShortcut>
              </MenubarItem>
              <MenubarItem>
                Abrir...
                <MenubarShortcut>⌘O</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarSub>
                <MenubarSubTrigger>Exportar como</MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem>PDF</MenubarItem>
                  <MenubarItem>CSV</MenubarItem>
                  <MenubarItem>JSON</MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
              <MenubarSeparator />
              <MenubarItem variant="destructive">Excluir arquivo</MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu value="edit">
            <MenubarTrigger>Editar</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>
                Desfazer
                <MenubarShortcut>⌘Z</MenubarShortcut>
              </MenubarItem>
              <MenubarItem>
                Refazer
                <MenubarShortcut>⇧⌘Z</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem>
                Copiar
                <MenubarShortcut>⌘C</MenubarShortcut>
              </MenubarItem>
              <MenubarItem>
                Colar
                <MenubarShortcut>⌘V</MenubarShortcut>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu value="view">
            <MenubarTrigger>Exibir</MenubarTrigger>
            <MenubarContent>
              <MenubarLabel>Visualização</MenubarLabel>
              <MenubarSeparator />
              <MenubarCheckboxItem
                checked={demoStatus}
                onCheckedChange={(v) => (demoStatus = v)}
              >
                Status bar
              </MenubarCheckboxItem>
              <MenubarCheckboxItem
                checked={demoActivity}
                onCheckedChange={(v) => (demoActivity = v)}
              >
                Activity bar
              </MenubarCheckboxItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu value="tools">
            <MenubarTrigger>Ferramentas</MenubarTrigger>
            <MenubarContent>
              <MenubarLabel>Zoom</MenubarLabel>
              <MenubarSeparator />
              <MenubarRadioGroup bind:value={demoZoom}>
                <MenubarRadioItem value="50">50%</MenubarRadioItem>
                <MenubarRadioItem value="100">100%</MenubarRadioItem>
                <MenubarRadioItem value="150">150%</MenubarRadioItem>
              </MenubarRadioGroup>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>
    {/snippet}
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

  {#snippet doPair1()}
    <div style="contain: layout">
      <Menubar>
        <MenubarMenu value="file">
          <MenubarTrigger>Arquivo</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Novo</MenubarItem>
            <MenubarItem>Abrir</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu value="edit">
          <MenubarTrigger>Editar</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Copiar</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu value="view">
          <MenubarTrigger>Exibir</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Zoom in</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
  {/snippet}
  {#snippet dontPair1()}
    <div style="contain: layout">
      <Menubar>
        <MenubarMenu value="actions">
          <MenubarTrigger>Ações</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Nova ação</MenubarItem>
            <MenubarItem>Outra ação</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
  {/snippet}
  {#snippet doPair2()}
    <div style="contain: layout">
      <Menubar defaultValue="file">
        <MenubarMenu value="file">
          <MenubarTrigger>Arquivo</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              Salvar
              <MenubarShortcut>⌘S</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              Desfazer
              <MenubarShortcut>⌘Z</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
  {/snippet}
  {#snippet dontPair2()}
    <div style="contain: layout">
      <Menubar defaultValue="file">
        <MenubarMenu value="file">
          <MenubarTrigger>Arquivo</MenubarTrigger>
          <MenubarContent>
            <MenubarSub>
              <MenubarSubTrigger>Exportar</MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarSub>
                  <MenubarSubTrigger>Formato</MenubarSubTrigger>
                  <MenubarSubContent>
                    <MenubarItem>PDF</MenubarItem>
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
  <DocsVariants
    title={$tStore('variants.title')}
    items={[
      { name: $tStore('variants.items.default'),     description: stripHtml($tStore('variants.styles.default')),     code: codeDefault,     preview: variantDefault     },
      { name: $tStore('variants.items.destructive'), description: stripHtml($tStore('variants.styles.destructive')), code: codeDestructive, preview: variantDestructive },
    ]}
  />

  {#snippet variantDefault()}
    <div style="contain: layout">
      <Menubar defaultValue="file">
        <MenubarMenu value="file">
          <MenubarTrigger>Arquivo</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Novo</MenubarItem>
            <MenubarItem>Abrir</MenubarItem>
            <MenubarItem>Salvar</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
  {/snippet}
  {#snippet variantDestructive()}
    <div style="contain: layout">
      <Menubar defaultValue="file">
        <MenubarMenu value="file">
          <MenubarTrigger>Arquivo</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Editar</MenubarItem>
            <MenubarSeparator />
            <MenubarItem variant="destructive">Excluir arquivo</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
  {/snippet}

  <!-- ── Composições ────────────────────────────────────────────── -->
  <DocsCompositions
    title={$tStore('variants.compositionsTitle')}
    useWhenLabel={$tNavStore('common.useWhen')}
    componentSlug="menubar"
    items={[
      {
        name: $tStore('variants.compositions.withShortcuts.name'),
        description: $tStore('variants.compositions.withShortcuts.description'),
        useWhen: $tStore('variants.compositions.withShortcuts.use'),
        code: `<Menubar defaultValue="edit">
  <MenubarMenu value="edit">
    <MenubarTrigger>Editar</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>Desfazer <MenubarShortcut>⌘Z</MenubarShortcut></MenubarItem>
      <MenubarItem>Refazer <MenubarShortcut>⇧⌘Z</MenubarShortcut></MenubarItem>
      <MenubarSeparator />
      <MenubarItem>Copiar <MenubarShortcut>⌘C</MenubarShortcut></MenubarItem>
      <MenubarItem>Colar <MenubarShortcut>⌘V</MenubarShortcut></MenubarItem>
    </MenubarContent>
  </MenubarMenu>
</Menubar>`,
        preview: compWithShortcuts,
      },
      {
        name: $tStore('variants.compositions.withCheckbox.name'),
        description: $tStore('variants.compositions.withCheckbox.description'),
        useWhen: $tStore('variants.compositions.withCheckbox.use'),
        code: `<Menubar defaultValue="view">
  <MenubarMenu value="view">
    <MenubarTrigger>Exibir</MenubarTrigger>
    <MenubarContent>
      <MenubarCheckboxItem bind:checked={showSidebar}>Sidebar</MenubarCheckboxItem>
      <MenubarCheckboxItem bind:checked={showGrid}>Grid</MenubarCheckboxItem>
    </MenubarContent>
  </MenubarMenu>
</Menubar>`,
        preview: compWithCheckbox,
      },
      {
        name: $tStore('variants.compositions.withRadio.name'),
        description: $tStore('variants.compositions.withRadio.description'),
        useWhen: $tStore('variants.compositions.withRadio.use'),
        code: `<Menubar defaultValue="theme">
  <MenubarMenu value="theme">
    <MenubarTrigger>Tema</MenubarTrigger>
    <MenubarContent>
      <MenubarRadioGroup bind:value={theme}>
        <MenubarRadioItem value="light">Claro</MenubarRadioItem>
        <MenubarRadioItem value="dark">Escuro</MenubarRadioItem>
        <MenubarRadioItem value="system">Sistema</MenubarRadioItem>
      </MenubarRadioGroup>
    </MenubarContent>
  </MenubarMenu>
</Menubar>`,
        preview: compWithRadio,
      },
      {
        name: $tStore('variants.compositions.editorComplete.name'),
        description: $tStore('variants.compositions.editorComplete.description'),
        useWhen: $tStore('variants.compositions.editorComplete.use'),
        code: `<Menubar>
  <MenubarMenu value="file">
    <MenubarTrigger>Arquivo</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>Novo <MenubarShortcut>⌘N</MenubarShortcut></MenubarItem>
      <MenubarItem>Abrir... <MenubarShortcut>⌘O</MenubarShortcut></MenubarItem>
      <MenubarItem>Salvar <MenubarShortcut>⌘S</MenubarShortcut></MenubarItem>
    </MenubarContent>
  </MenubarMenu>
  <MenubarMenu value="edit">
    <MenubarTrigger>Editar</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>Desfazer <MenubarShortcut>⌘Z</MenubarShortcut></MenubarItem>
    </MenubarContent>
  </MenubarMenu>
  <MenubarMenu value="view">
    <MenubarTrigger>Exibir</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>Tela cheia <MenubarShortcut>F11</MenubarShortcut></MenubarItem>
    </MenubarContent>
  </MenubarMenu>
  <MenubarMenu value="help">
    <MenubarTrigger>Ajuda</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>Sobre</MenubarItem>
    </MenubarContent>
  </MenubarMenu>
</Menubar>`,
        preview: compEditorComplete,
      },
    ]}
  />

  {#snippet compWithShortcuts()}
    <div style="contain: layout">
      <Menubar defaultValue="edit">
        <MenubarMenu value="edit">
          <MenubarTrigger>Editar</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Desfazer <MenubarShortcut>⌘Z</MenubarShortcut></MenubarItem>
            <MenubarItem>Refazer <MenubarShortcut>⇧⌘Z</MenubarShortcut></MenubarItem>
            <MenubarSeparator />
            <MenubarItem>Copiar <MenubarShortcut>⌘C</MenubarShortcut></MenubarItem>
            <MenubarItem>Colar <MenubarShortcut>⌘V</MenubarShortcut></MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
  {/snippet}

  {#snippet compWithCheckbox()}
    <div style="contain: layout">
      <Menubar defaultValue="view">
        <MenubarMenu value="view">
          <MenubarTrigger>Exibir</MenubarTrigger>
          <MenubarContent>
            <MenubarCheckboxItem bind:checked={compShowSidebar}>Sidebar</MenubarCheckboxItem>
            <MenubarCheckboxItem bind:checked={compShowGrid}>Grid</MenubarCheckboxItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
  {/snippet}

  {#snippet compWithRadio()}
    <div style="contain: layout">
      <Menubar defaultValue="theme">
        <MenubarMenu value="theme">
          <MenubarTrigger>Tema</MenubarTrigger>
          <MenubarContent>
            <MenubarRadioGroup bind:value={compTheme}>
              <MenubarRadioItem value="light">Claro</MenubarRadioItem>
              <MenubarRadioItem value="dark">Escuro</MenubarRadioItem>
              <MenubarRadioItem value="system">Sistema</MenubarRadioItem>
            </MenubarRadioGroup>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
  {/snippet}

  {#snippet compEditorComplete()}
    <div style="contain: layout">
      <Menubar>
        <MenubarMenu value="file">
          <MenubarTrigger>Arquivo</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Novo <MenubarShortcut>⌘N</MenubarShortcut></MenubarItem>
            <MenubarItem>Abrir... <MenubarShortcut>⌘O</MenubarShortcut></MenubarItem>
            <MenubarItem>Salvar <MenubarShortcut>⌘S</MenubarShortcut></MenubarItem>
            <MenubarSeparator />
            <MenubarItem>Sair <MenubarShortcut>⌘Q</MenubarShortcut></MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu value="edit">
          <MenubarTrigger>Editar</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Desfazer <MenubarShortcut>⌘Z</MenubarShortcut></MenubarItem>
            <MenubarItem>Refazer <MenubarShortcut>⇧⌘Z</MenubarShortcut></MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu value="view">
          <MenubarTrigger>Exibir</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Modo escuro</MenubarItem>
            <MenubarItem>Tela cheia <MenubarShortcut>F11</MenubarShortcut></MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu value="help">
          <MenubarTrigger>Ajuda</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Documentação</MenubarItem>
            <MenubarItem>Sobre</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
  {/snippet}

  <!-- ── Estados ────────────────────────────────────────────────── -->
  <DocsStates
    title={$tStore('states.title')}
    cols={{
      state: $tStore('props.table.prop'),
      trigger: $tNavStore('common.userAction'),
      behavior: $tNavStore('common.expectedResult'),
    }}
    items={[
      { label: $tStore('states.items.closed'),   trigger: 'defaultValue=undefined',    behavior: stripHtml($tStore('states.descriptions.closed'))   },
      { label: $tStore('states.items.open'),     trigger: 'defaultValue / click Trigger', behavior: stripHtml($tStore('states.descriptions.open'))     },
      { label: $tStore('states.items.disabled'), trigger: 'disabled prop on Item',     behavior: stripHtml($tStore('states.descriptions.disabled')) },
      { label: $tStore('states.items.checked'),  trigger: 'CheckboxItem / RadioItem',  behavior: stripHtml($tStore('states.descriptions.checked'))  },
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
          { name: 'defaultValue',  type: $tStore('props.table.defaultValue.type'),  defaultValue: $tStore('props.table.defaultValue.default'),  required: $tStore('props.table.defaultValue.required'),  description: $tStore('props.table.defaultValue.description')  },
          { name: 'loop',          type: $tStore('props.table.loop.type'),          defaultValue: $tStore('props.table.loop.default'),          required: $tStore('props.table.loop.required'),          description: $tStore('props.table.loop.description')          },
          { name: 'side',          type: $tStore('props.table.side.type'),          defaultValue: $tStore('props.table.side.default'),          required: $tStore('props.table.side.required'),          description: $tStore('props.table.side.description')          },
          { name: 'align',         type: $tStore('props.table.align.type'),         defaultValue: $tStore('props.table.align.default'),         required: $tStore('props.table.align.required'),         description: $tStore('props.table.align.description')         },
        ],
      },
    ]}
    interfaceCode={interfaceCode}
    extensibilityTitle={$tStore('props.extensibilityTitle')}
    extensibilityNotes={$tStore('props.extensibilityCode')}
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
      { token: '--popover',            value: $tStore('tokens.table.contentBg.class'),     description: $tStore('tokens.table.contentBg.part')     },
      { token: '--foreground',         value: $tStore('tokens.table.contentBorder.class'), description: $tStore('tokens.table.contentBorder.part') },
      { token: '--radius',             value: $tStore('tokens.table.rounded.class'),       description: $tStore('tokens.table.rounded.part')       },
      { token: '--accent',             value: $tStore('tokens.table.itemHover.class'),     description: $tStore('tokens.table.itemHover.part')     },
      { token: '--destructive',        value: $tStore('tokens.table.destructive.class'),   description: $tStore('tokens.table.destructive.part')   },
    ]}
    customizationTitle={$tStore('tokens.customizationTitle')}
    customizationCode={$tStore('tokens.customizationCode')}
  />

  <!-- ── Acessibilidade ─────────────────────────────────────────── -->
  <DocsAccessibility
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
      { key: '← →',           description: $tStore('accessibility.keyboard.arrowsHorizontal') },
      { key: '↑ ↓',           description: $tStore('accessibility.keyboard.arrowsVertical')   },
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
      { name: $tStore('related.items.navigationMenu.name'), description: $tStore('related.items.navigationMenu.description'), path: '?path=/docs/ui-navigationmenu--docs' },
      { name: $tStore('related.items.dropdownMenu.name'),   description: $tStore('related.items.dropdownMenu.description'),   path: '?path=/docs/ui-dropdownmenu--docs'   },
      { name: $tStore('related.items.sidebar.name'),        description: $tStore('related.items.sidebar.description'),        path: '?path=/docs/ui-sidebar--docs'        },
      { name: $tStore('related.items.command.name'),        description: $tStore('related.items.command.description'),        path: '?path=/docs/ui-command--docs'        },
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
  <DocsAnalytics
    title={$tStore('analytics.title')}
    cols={{
      event: 'Evento',
      trigger: 'Trigger',
      payload: 'Payload',
    }}
    items={[
      { event: 'menubar_menu_open',       trigger: 'onValueChange(menu)', payload: "{ component: 'menubar', menu, label }" },
      { event: 'menubar_item_select',     trigger: 'onSelect',            payload: "{ component: 'menubar', menu, label }" },
      { event: 'menubar_shortcut_invoke', trigger: 'useHotkeys (consumer)', payload: "{ component: 'menubar', shortcut }" },
      { event: '—',                       trigger: stripHtml($tStore('analytics.description')), payload: '—' },
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
      items: [1, 2, 3, 4, 5, 6, 7, 8].map((i) => ({
        action: stripHtml($tStore(`testes.functional.item${i}.action`)),
        result: stripHtml($tStore(`testes.functional.item${i}.result`)),
        priority: localPriority($tStore(`testes.functional.item${i}.priority`), $tNavStore),
      })),
    }}
    accessibility={{
      title: $tStore('testes.accessibility.title'),
      cols: {
        criterion: $tNavStore('common.criterion'),
        level: 'WCAG',
        how: $tNavStore('common.howToVerify'),
      },
      items: [
        { criterion: stripHtml($tStore('testes.accessibility.item1')), level: 'AA',    how: 'axe-core' },
        { criterion: stripHtml($tStore('testes.accessibility.item2')), level: '1.3.1', how: 'DOM inspection' },
        { criterion: stripHtml($tStore('testes.accessibility.item3')), level: '4.1.2', how: 'DOM inspection' },
        { criterion: stripHtml($tStore('testes.accessibility.item4')), level: '4.1.2', how: 'DOM inspection' },
        { criterion: stripHtml($tStore('testes.accessibility.item5')), level: '4.1.2', how: 'DOM inspection' },
        { criterion: stripHtml($tStore('testes.accessibility.item6')), level: '2.4.3', how: 'Keyboard test' },
        { criterion: stripHtml($tStore('testes.accessibility.item7')), level: '1.4.3', how: 'Contrast analyzer' },
      ],
    }}
    visual={{
      title: $tStore('testes.visual.title'),
      cols: {
        story: $tNavStore('common.storyState'),
        priority: $tNavStore('common.priority'),
      },
      items: [1, 2, 3, 4, 5].map((i) => ({
        story: $tStore(`testes.visual.item${i}.story`),
        priority: localPriority($tStore(`testes.visual.item${i}.priority`), $tNavStore),
      })),
    }}
  />
</DocsPageLayout>

<!-- sanitizeHtml available para uso futuro em {@html} dinâmico -->
{#if false}
  {@html sanitizeHtml('')}
{/if}
