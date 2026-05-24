<script lang="ts">
  import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuCheckboxItem,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuGroup,
  } from '@/components/ui/dropdown-menu';
  import { Button } from '@/components/ui/button';
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
  import dropdownMenuTranslations from '@shared/content/dropdown-menu/translations.json';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(dropdownMenuTranslations);

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
      aiIntent: t('seo.aiIntent'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: 'Overlay', item: '/components/overlay' },
        { name: 'DropdownMenu' },
      ],
    });
    track('docs_page_view', {
      component_name: 'dropdown-menu',
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
        { id: 'variantes',    label: tContent('nav.variants') },
        { id: 'composicoes',  label: tContent('nav.compositions') },
        { id: 'estados',      label: tContent('nav.states')   },
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
    track('docs_section_viewed', { section_id: id, component_name: 'dropdown-menu', locale: $locale });
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

  let demoShowStatus = $state(true);
  let demoShowActivity = $state(false);
  let demoRadio = $state('bottom');
  let variantCheckbox = $state(true);
  let variantRadio = $state('system');

  // Compositions interactive state
  let compShowName = $state(true);
  let compShowEmail = $state(true);
  let compShowRole = $state(false);
  let compTheme = $state('system');

  // ─── Code strings ────────────────────────────────────────────────────────────

  const codeImportBasic = `import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";`;

  const codeImportUsage = `<DropdownMenu>
  <DropdownMenuTrigger>
    {#snippet child({ props })}
      <Button variant="outline" {...props}>Abrir menu</Button>
    {/snippet}
  </DropdownMenuTrigger>
  <DropdownMenuContent side="bottom" align="start">
    <DropdownMenuLabel>Conta</DropdownMenuLabel>
    <DropdownMenuItem>Perfil</DropdownMenuItem>
    <DropdownMenuItem>Configurações</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem variant="destructive">Sair</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`;

  const codeDefault = `<DropdownMenuItem>Perfil</DropdownMenuItem>`;
  const codeDestructive = `<DropdownMenuItem variant="destructive">
  Excluir conta
</DropdownMenuItem>`;

  const interfaceCode = `// DropdownMenu (Root)
interface DropdownMenuProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
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
      installNote="npx shadcn-svelte@latest add dropdown-menu"
    />
  {/snippet}

  <!-- ── Demonstração ───────────────────────────────────────────── -->
  <DocsDemonstration title={$tStore('demonstration.title')}>
    {#snippet children()}
      <div class="flex flex-wrap items-center justify-center gap-3 w-full" style="contain: layout">
        <DropdownMenu>
          <DropdownMenuTrigger>
            {#snippet child({ props })}
              <Button variant="outline" {...props}>{$tStore('demonstration.labels.basic')}</Button>
            {/snippet}
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="start">
            <DropdownMenuLabel>Conta</DropdownMenuLabel>
            <DropdownMenuItem>Perfil</DropdownMenuItem>
            <DropdownMenuItem>Configurações</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">Sair</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger>
            {#snippet child({ props })}
              <Button variant="outline" {...props}>{$tStore('demonstration.labels.withCheckbox')}</Button>
            {/snippet}
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="start">
            <DropdownMenuLabel>Visualização</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={demoShowStatus}
              onCheckedChange={(v) => (demoShowStatus = v)}
            >
              Status bar
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={demoShowActivity}
              onCheckedChange={(v) => (demoShowActivity = v)}
            >
              Activity bar
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger>
            {#snippet child({ props })}
              <Button variant="outline" {...props}>{$tStore('demonstration.labels.withRadio')}</Button>
            {/snippet}
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="start">
            <DropdownMenuLabel>Posição</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup bind:value={demoRadio}>
              <DropdownMenuRadioItem value="top">Topo</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="bottom">Inferior</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="right">Direita</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger>
            {#snippet child({ props })}
              <Button variant="outline" {...props}>{$tStore('demonstration.labels.withSubmenu')}</Button>
            {/snippet}
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="start">
            <DropdownMenuItem>Novo arquivo</DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Exportar como</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>PDF</DropdownMenuItem>
                <DropdownMenuItem>CSV</DropdownMenuItem>
                <DropdownMenuItem>JSON</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">Excluir</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
      <DropdownMenu defaultOpen={true}>
        <DropdownMenuTrigger>
          {#snippet child({ props })}
            <Button variant="outline" {...props}>Conta</Button>
          {/snippet}
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Conta</DropdownMenuLabel>
          <DropdownMenuItem>Perfil</DropdownMenuItem>
          <DropdownMenuItem>Configurações</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Equipe</DropdownMenuLabel>
          <DropdownMenuItem>Convidar</DropdownMenuItem>
          <DropdownMenuItem>Membros</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  {/snippet}
  {#snippet dontPair1()}
    <div style="contain: layout">
      <DropdownMenu defaultOpen={true}>
        <DropdownMenuTrigger>
          {#snippet child({ props })}
            <Button variant="outline" {...props}>Tudo</Button>
          {/snippet}
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Perfil</DropdownMenuItem>
          <DropdownMenuItem>Configurações</DropdownMenuItem>
          <DropdownMenuItem>Convidar</DropdownMenuItem>
          <DropdownMenuItem>Membros</DropdownMenuItem>
          <DropdownMenuItem>Faturas</DropdownMenuItem>
          <DropdownMenuItem>Suporte</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  {/snippet}
  {#snippet doPair2()}
    <div style="contain: layout">
      <DropdownMenu defaultOpen={true}>
        <DropdownMenuTrigger>
          {#snippet child({ props })}
            <Button variant="outline" {...props}>Ações</Button>
          {/snippet}
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Editar</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">Excluir conta</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  {/snippet}
  {#snippet dontPair2()}
    <div style="contain: layout">
      <DropdownMenu defaultOpen={true}>
        <DropdownMenuTrigger>
          {#snippet child({ props })}
            <Button variant="outline" {...props}>Ações</Button>
          {/snippet}
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Editar</DropdownMenuItem>
          <DropdownMenuItem>Excluir conta</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
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
      <DropdownMenu defaultOpen={true}>
        <DropdownMenuTrigger>
          {#snippet child({ props })}
            <Button variant="outline" {...props}>Default</Button>
          {/snippet}
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Perfil</DropdownMenuItem>
          <DropdownMenuItem>Configurações</DropdownMenuItem>
          <DropdownMenuItem>Equipe</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  {/snippet}
  {#snippet variantDestructive()}
    <div style="contain: layout">
      <DropdownMenu defaultOpen={true}>
        <DropdownMenuTrigger>
          {#snippet child({ props })}
            <Button variant="outline" {...props}>Destructive</Button>
          {/snippet}
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Editar</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">Excluir conta</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  {/snippet}

  <!-- ── Composições ────────────────────────────────────────────── -->
  <DocsCompositions
    title={$tStore('variants.compositionsTitle')}
    useWhenLabel={$tNavStore('common.useWhen')}
    componentSlug="dropdown-menu"
    items={[
      {
        name: $tStore('variants.compositions.withLabel.name'),
        description: $tStore('variants.compositions.withLabel.description'),
        useWhen: $tStore('variants.compositions.withLabel.use'),
        code: `<DropdownMenu>
  <DropdownMenuTrigger>
    {#snippet child({ props })}
      <Button variant="outline" {...props}>Conta</Button>
    {/snippet}
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>Conta</DropdownMenuLabel>
    <DropdownMenuItem>Perfil</DropdownMenuItem>
    <DropdownMenuItem>Configurações</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuLabel>Suporte</DropdownMenuLabel>
    <DropdownMenuItem>Documentação</DropdownMenuItem>
    <DropdownMenuItem>Sair</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`,
        preview: compWithLabel,
      },
      {
        name: $tStore('variants.compositions.withCheckboxItems.name'),
        description: $tStore('variants.compositions.withCheckboxItems.description'),
        useWhen: $tStore('variants.compositions.withCheckboxItems.use'),
        code: `<DropdownMenu>
  <DropdownMenuTrigger>
    {#snippet child({ props })}
      <Button variant="outline" {...props}>Colunas</Button>
    {/snippet}
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>Colunas visíveis</DropdownMenuLabel>
    <DropdownMenuCheckboxItem bind:checked={showName}>Nome</DropdownMenuCheckboxItem>
    <DropdownMenuCheckboxItem bind:checked={showEmail}>E-mail</DropdownMenuCheckboxItem>
    <DropdownMenuCheckboxItem bind:checked={showRole}>Cargo</DropdownMenuCheckboxItem>
  </DropdownMenuContent>
</DropdownMenu>`,
        preview: compCheckbox,
      },
      {
        name: $tStore('variants.compositions.withRadioGroup.name'),
        description: $tStore('variants.compositions.withRadioGroup.description'),
        useWhen: $tStore('variants.compositions.withRadioGroup.use'),
        code: `<DropdownMenu>
  <DropdownMenuTrigger>
    {#snippet child({ props })}
      <Button variant="outline" {...props}>Tema</Button>
    {/snippet}
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>Aparência</DropdownMenuLabel>
    <DropdownMenuRadioGroup bind:value={theme}>
      <DropdownMenuRadioItem value="light">Claro</DropdownMenuRadioItem>
      <DropdownMenuRadioItem value="dark">Escuro</DropdownMenuRadioItem>
      <DropdownMenuRadioItem value="system">Sistema</DropdownMenuRadioItem>
    </DropdownMenuRadioGroup>
  </DropdownMenuContent>
</DropdownMenu>`,
        preview: compRadio,
      },
      {
        name: $tStore('variants.compositions.withShortcuts.name'),
        description: $tStore('variants.compositions.withShortcuts.description'),
        useWhen: $tStore('variants.compositions.withShortcuts.use'),
        code: `<DropdownMenu>
  <DropdownMenuTrigger>
    {#snippet child({ props })}
      <Button variant="outline" {...props}>Editar</Button>
    {/snippet}
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>
      Desfazer
      <DropdownMenuShortcut>⌘Z</DropdownMenuShortcut>
    </DropdownMenuItem>
    <DropdownMenuItem>
      Refazer
      <DropdownMenuShortcut>⇧⌘Z</DropdownMenuShortcut>
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem>
      Copiar
      <DropdownMenuShortcut>⌘C</DropdownMenuShortcut>
    </DropdownMenuItem>
    <DropdownMenuItem>
      Colar
      <DropdownMenuShortcut>⌘V</DropdownMenuShortcut>
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`,
        preview: compShortcuts,
      },
    ]}
  />

  {#snippet compWithLabel()}
    <div style="contain: layout; min-height: 240px;">
      <DropdownMenu defaultOpen={true}>
        <DropdownMenuTrigger>
          {#snippet child({ props })}
            <Button variant="outline" size="sm" {...props}>Conta</Button>
          {/snippet}
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="start">
          <DropdownMenuLabel>Conta</DropdownMenuLabel>
          <DropdownMenuItem>Perfil</DropdownMenuItem>
          <DropdownMenuItem>Configurações</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Suporte</DropdownMenuLabel>
          <DropdownMenuItem>Documentação</DropdownMenuItem>
          <DropdownMenuItem>Sair</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  {/snippet}

  {#snippet compCheckbox()}
    <div style="contain: layout; min-height: 200px;">
      <DropdownMenu defaultOpen={true}>
        <DropdownMenuTrigger>
          {#snippet child({ props })}
            <Button variant="outline" size="sm" {...props}>Colunas</Button>
          {/snippet}
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="start">
          <DropdownMenuLabel>Colunas visíveis</DropdownMenuLabel>
          <DropdownMenuCheckboxItem
            checked={compShowName}
            onCheckedChange={(v) => (compShowName = v)}
          >
            Nome
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={compShowEmail}
            onCheckedChange={(v) => (compShowEmail = v)}
          >
            E-mail
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={compShowRole}
            onCheckedChange={(v) => (compShowRole = v)}
          >
            Cargo
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  {/snippet}

  {#snippet compRadio()}
    <div style="contain: layout; min-height: 200px;">
      <DropdownMenu defaultOpen={true}>
        <DropdownMenuTrigger>
          {#snippet child({ props })}
            <Button variant="outline" size="sm" {...props}>Tema</Button>
          {/snippet}
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="start">
          <DropdownMenuLabel>Aparência</DropdownMenuLabel>
          <DropdownMenuRadioGroup bind:value={compTheme}>
            <DropdownMenuRadioItem value="light">Claro</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark">Escuro</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="system">Sistema</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  {/snippet}

  {#snippet compShortcuts()}
    <div style="contain: layout; min-height: 220px;">
      <DropdownMenu defaultOpen={true}>
        <DropdownMenuTrigger>
          {#snippet child({ props })}
            <Button variant="outline" size="sm" {...props}>Editar</Button>
          {/snippet}
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="start">
          <DropdownMenuItem>
            Desfazer
            <DropdownMenuShortcut>⌘Z</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            Refazer
            <DropdownMenuShortcut>⇧⌘Z</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            Copiar
            <DropdownMenuShortcut>⌘C</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            Colar
            <DropdownMenuShortcut>⌘V</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
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
      { label: $tStore('states.items.closed'),   trigger: 'defaultOpen=false',                behavior: stripHtml($tStore('states.descriptions.closed'))   },
      { label: $tStore('states.items.open'),     trigger: 'defaultOpen=true / click trigger', behavior: stripHtml($tStore('states.descriptions.open'))     },
      { label: $tStore('states.items.disabled'), trigger: 'disabled prop on Item',            behavior: stripHtml($tStore('states.descriptions.disabled')) },
      { label: $tStore('states.items.checked'),  trigger: 'CheckboxItem / RadioItem',         behavior: stripHtml($tStore('states.descriptions.checked'))  },
    ]}
  />

  <!-- ── Propriedades ───────────────────────────────────────────── -->
  <DocsProps
    title={$tStore('props.title')}
    tables={[
      {
        cols: propsTableCols,
        items: [
          { name: 'open',         type: $tStore('props.table.open.type'),         defaultValue: $tStore('props.table.open.default'),         required: $tStore('props.table.open.required'),         description: $tStore('props.table.open.description')         },
          { name: 'onOpenChange', type: $tStore('props.table.onOpenChange.type'), defaultValue: $tStore('props.table.onOpenChange.default'), required: $tStore('props.table.onOpenChange.required'), description: $tStore('props.table.onOpenChange.description') },
          { name: 'defaultOpen',  type: $tStore('props.table.defaultOpen.type'),  defaultValue: $tStore('props.table.defaultOpen.default'),  required: $tStore('props.table.defaultOpen.required'),  description: $tStore('props.table.defaultOpen.description')  },
          { name: 'modal',        type: $tStore('props.table.modal.type'),        defaultValue: $tStore('props.table.modal.default'),        required: $tStore('props.table.modal.required'),        description: $tStore('props.table.modal.description')        },
          { name: 'side',         type: $tStore('props.table.side.type'),         defaultValue: $tStore('props.table.side.default'),         required: $tStore('props.table.side.required'),         description: $tStore('props.table.side.description')         },
          { name: 'align',        type: $tStore('props.table.align.type'),        defaultValue: $tStore('props.table.align.default'),        required: $tStore('props.table.align.required'),        description: $tStore('props.table.align.description')        },
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
      { token: '--popover',            value: $tStore('tokens.table.background.class'),  description: $tStore('tokens.table.background.part')  },
      { token: '--popover-foreground', value: $tStore('tokens.table.foreground.class'),  description: $tStore('tokens.table.foreground.part')  },
      { token: '--border',             value: $tStore('tokens.table.border.class'),      description: $tStore('tokens.table.border.part')      },
      { token: '--shadow',             value: $tStore('tokens.table.shadow.class'),      description: $tStore('tokens.table.shadow.part')      },
      { token: '--radius',             value: $tStore('tokens.table.rounded.class'),     description: $tStore('tokens.table.rounded.part')     },
      { token: '--accent',             value: $tStore('tokens.table.itemHover.class'),   description: $tStore('tokens.table.itemHover.part')   },
      { token: '--destructive',        value: $tStore('tokens.table.destructive.class'), description: $tStore('tokens.table.destructive.part') },
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
      { key: 'Tab',                description: $tStore('accessibility.keyboard.tab')       },
      { key: '↑ ↓',                description: $tStore('accessibility.keyboard.arrows')    },
      { key: 'Enter / Space',      description: $tStore('accessibility.keyboard.enter')     },
      { key: 'Escape',             description: $tStore('accessibility.keyboard.escape')    },
      { key: 'Home / End',         description: $tStore('accessibility.keyboard.homeEnd')   },
      { key: 'A-Z',                description: $tStore('accessibility.keyboard.typeahead') },
    ]}
  />

  <!-- ── Relacionados ───────────────────────────────────────────── -->
  <DocsRelated
    title={$tStore('related.title')}
    items={[
      { name: $tStore('related.items.contextMenu.name'), description: $tStore('related.items.contextMenu.description'), path: '?path=/docs/ui-contextmenu--docs' },
      { name: $tStore('related.items.menubar.name'),     description: $tStore('related.items.menubar.description'),     path: '?path=/docs/ui-menubar--docs'     },
      { name: $tStore('related.items.command.name'),     description: $tStore('related.items.command.description'),     path: '?path=/docs/ui-command--docs'     },
      { name: $tStore('related.items.popover.name'),     description: $tStore('related.items.popover.description'),     path: '?path=/docs/ui-popover--docs'     },
      { name: $tStore('related.items.select.name'),      description: $tStore('related.items.select.description'),      path: '?path=/docs/ui-select--docs'      },
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
      { event: 'dropdown_menu_open',        trigger: 'onOpenChange(true)',  payload: "{ component: 'dropdown-menu', location, label }" },
      { event: 'dropdown_menu_close',       trigger: 'onOpenChange(false)', payload: "{ component: 'dropdown-menu', location, label }" },
      { event: 'dropdown_menu_item_select', trigger: 'onSelect',            payload: "{ component: 'dropdown-menu', location, label }" },
      { event: '—',                         trigger: stripHtml($tStore('analytics.description')), payload: '—' },
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
      items: [1, 2, 3, 4, 5, 6, 7].map((i) => ({
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
        { criterion: stripHtml($tStore('testes.accessibility.item2')), level: '4.1.2', how: 'DOM inspection' },
        { criterion: stripHtml($tStore('testes.accessibility.item3')), level: '4.1.2', how: 'DOM inspection' },
        { criterion: stripHtml($tStore('testes.accessibility.item4')), level: '4.1.2', how: 'DOM inspection' },
        { criterion: stripHtml($tStore('testes.accessibility.item5')), level: '2.4.3', how: 'Keyboard test' },
        { criterion: stripHtml($tStore('testes.accessibility.item6')), level: '1.4.3', how: 'Contrast analyzer' },
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
