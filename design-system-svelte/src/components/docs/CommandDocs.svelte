<script lang="ts">
  import * as Command from '@/components/ui/command';
  import { Button } from '@/components/ui/button';
  import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
  import LanguageSwitcher from '@/components/product/LanguageSwitcher.svelte';
  import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';
  import CheckIcon from '@lucide/svelte/icons/check';
  import Search from '@lucide/svelte/icons/search';
  import FileText from '@lucide/svelte/icons/file-text';
  import Settings from '@lucide/svelte/icons/settings';
  import Users from '@lucide/svelte/icons/users';
  import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
  import ExternalLink from '@lucide/svelte/icons/external-link';
  import BookOpen from '@lucide/svelte/icons/book-open';
  import Loader2 from '@lucide/svelte/icons/loader-2';

  import { locale, useTranslation } from '@/lib/i18n';
  import { applySeo } from '@/lib/use-seo';
  import { track } from '@/lib/analytics';
  import { createActiveSection } from '@/lib/use-active-section.svelte';
  import { sanitizeHtml } from '@/lib/sanitize-html';

  import uiTranslations from '@/i18n/ui.json';
  import componentTranslations from '@shared/content/command/translations.json';

  import DocsPageLayout    from '@/components/docs/shared/sections/DocsPageLayout.svelte';
  import DocsHeader        from '@/components/docs/shared/sections/DocsHeader.svelte';
  import DocsDemonstration from '@/components/docs/shared/sections/DocsDemonstration.svelte';
  import DocsAnatomy       from '@/components/docs/shared/sections/DocsAnatomy.svelte';
  import DocsWhenToUse     from '@/components/docs/shared/sections/DocsWhenToUse.svelte';
  import DocsDoDont        from '@/components/docs/shared/sections/DocsDoDont.svelte';
  import DocsImport        from '@/components/docs/shared/sections/DocsImport.svelte';
  import DocsVariants      from '@/components/docs/shared/sections/DocsVariants.svelte';
  import DocsCompositions  from '@/components/docs/shared/sections/DocsCompositions.svelte';
  import DocsStates        from '@/components/docs/shared/sections/DocsStates.svelte';
  import DocsProps         from '@/components/docs/shared/sections/DocsProps.svelte';
  import DocsTokens        from '@/components/docs/shared/sections/DocsTokens.svelte';
  import DocsAccessibility from '@/components/docs/shared/sections/DocsAccessibility.svelte';
  import DocsRelated       from '@/components/docs/shared/sections/DocsRelated.svelte';
  import DocsNotes         from '@/components/docs/shared/sections/DocsNotes.svelte';
  import DocsAnalytics     from '@/components/docs/shared/sections/DocsAnalytics.svelte';
  import DocsTestes        from '@/components/docs/shared/sections/DocsTestes.svelte';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(componentTranslations);

  // ─── SEO + Analytics ─────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale: l,
      componentSlug: 'command',
    });
    track('docs_page_view', {
      component_name: 'command',
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
        { id: 'composicoes',  label: tNav('nav.compositions') },
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

  const sectionIds = NAV_GROUPS.flatMap(g => g.sections.map(s => s.id));
  const section = createActiveSection(sectionIds, (id) => {
    track('docs_section_viewed', { section_id: id, component_name: 'command', locale: $locale });
  });
  $effect(() => section.attach());

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  function stripHtml(s: string) {
    return s.replace(/<[^>]*>/g, '');
  }

  const priorityKeyMap: Record<string, string> = { high: 'common.high', medium: 'common.medium', low: 'common.low' };

  function localPriority(raw: string, tNav: (k: string) => string): string {
    return tNav(priorityKeyMap[raw] ?? 'common.high');
  }

  // ─── Demo combobox state ──────────────────────────────────────────────────

  let comboboxOpen = $state(false);
  let comboboxValue = $state('');
  const comboboxItems = [
    { value: 'button',   label: 'Button'   },
    { value: 'input',    label: 'Input'    },
    { value: 'select',   label: 'Select'   },
    { value: 'textarea', label: 'Textarea' },
    { value: 'badge',    label: 'Badge'    },
  ];

  // ─── Demo palette state ───────────────────────────────────────────────────

  let paletteOpen = $state(false);

  $effect(() => {
    function onKeydown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        paletteOpen = !paletteOpen;
      }
    }
    window.addEventListener('keydown', onKeydown);
    return () => window.removeEventListener('keydown', onKeydown);
  });

  // ─── Code strings ────────────────────────────────────────────────────────────

  const codeImportBasic = `import * as Command from "@/components/ui/command";`;

  const codeImportWithDialog = `import * as Command from "@/components/ui/command";
// CommandDialog já está incluído no namespace Command`;

  const codeInline = `<Command.Root>
  <Command.Input placeholder="Buscar componente..." />
  <Command.List>
    <Command.Empty>Nenhum resultado encontrado.</Command.Empty>
    <Command.Group heading="Componentes">
      <Command.Item value="button">Button</Command.Item>
      <Command.Item value="input">Input</Command.Item>
    </Command.Group>
    <Command.Separator />
    <Command.Group heading="Utilitários">
      <Command.Item value="separator">Separator</Command.Item>
    </Command.Group>
  </Command.List>
</Command.Root>`;

  const codeWithLoading = `<script lang="ts">
  import { Loader2 } from "lucide-svelte";
  import * as Command from "@/components/ui/command";

  let loading = $state(true);
<\/script>

<Command.Root>
  <Command.Input placeholder="Buscar..." />
  <Command.List>
    <Command.Empty>Nenhum resultado.</Command.Empty>
    {#if loading}
      <Command.Loading>
        <div class="flex items-center gap-2 py-4 text-sm text-muted-foreground" role="progressbar">
          <Loader2 class="size-4 animate-spin" aria-hidden="true" />
          <span>Carregando resultados...</span>
        </div>
      </Command.Loading>
    {:else}
      <Command.Group heading="Resultados">
        <Command.Item value="item1">Item 1</Command.Item>
      </Command.Group>
    {/if}
  </Command.List>
</Command.Root>`;

  const codePalette = `<script lang="ts">
  import * as Command from "@/components/ui/command";
  import { Button } from "@/components/ui/button";

  let open = $state(false);

  $effect(() => {
    function onKeydown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        open = !open;
      }
    }
    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  });
<\/script>

<Button variant="outline" onclick={() => { open = true; }}>
  Buscar <kbd>⌘K</kbd>
</Button>

<Command.Dialog bind:open title="Command Palette" description="Busque por um comando...">
  <Command.Input placeholder="Buscar comando ou ação..." />
  <Command.List>
    <Command.Empty>Nenhum resultado encontrado.</Command.Empty>
    <Command.Group heading="Páginas">
      <Command.Item value="dashboard" onselect={() => { open = false; }}>
        Dashboard
        <Command.Shortcut>⌘D</Command.Shortcut>
      </Command.Item>
    </Command.Group>
  </Command.List>
</Command.Dialog>`;

  const codeVariantInline = `<Command.Root>
  <Command.Input placeholder="Buscar componente..." />
  <Command.List>
    <Command.Empty>Nenhum resultado encontrado.</Command.Empty>
    <Command.Group heading="Componentes">
      <Command.Item value="button">Button</Command.Item>
      <Command.Item value="input">Input</Command.Item>
    </Command.Group>
  </Command.List>
</Command.Root>`;

  const codeVariantCombobox = `<script lang="ts">
  import * as Command from "@/components/ui/command";
  import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
  import { Button } from "@/components/ui/button";

  let open = $state(false);
  let selected = $state('');
  const items = [
    { value: 'button', label: 'Button' },
    { value: 'input', label: 'Input' },
    { value: 'select', label: 'Select' },
  ];
<\/script>

<Popover bind:open>
  <PopoverTrigger asChild>
    <Button variant="outline" role="combobox" aria-expanded={open} class="w-56 justify-between">
      {selected ? items.find(i => i.value === selected)?.label : 'Selecione...'}
    </Button>
  </PopoverTrigger>
  <PopoverContent class="w-56 p-0">
    <Command.Root>
      <Command.Input placeholder="Buscar item..." />
      <Command.List>
        <Command.Empty>Nenhum resultado.</Command.Empty>
        <Command.Group>
          {#each items as item}
            <Command.Item value={item.value} onselect={() => { selected = item.value; open = false; }}>
              {item.label}
            </Command.Item>
          {/each}
        </Command.Group>
      </Command.List>
    </Command.Root>
  </PopoverContent>
</Popover>`;

  const codeVariantPalette = `<Command.Dialog bind:open title="Command Palette" description="Busque por um comando...">
  <Command.Input placeholder="Buscar comando ou ação..." />
  <Command.List>
    <Command.Empty>Nenhum resultado encontrado.</Command.Empty>
    <Command.Group heading="Ações">
      <Command.Item value="settings" onselect={() => { open = false; }}>
        Configurações
        <Command.Shortcut>⌘,</Command.Shortcut>
      </Command.Item>
    </Command.Group>
  </Command.List>
</Command.Dialog>`;

  const codeCustomizationTokens = `/* Em globals.css — customizar tokens do Command */
:root {
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 47.4% 11.2%;
}

.dark {
  --popover: 224 71% 4%;
  --popover-foreground: 215 20.2% 65.1%;
}`;

  const interfaceCode = `// Command
interface CommandRootProps {
  value?: string;           // item selecionado (bindable)
  filter?: (value: string, search: string, keywords?: string[]) => number;
  shouldFilter?: boolean;   // padrão: true
  loop?: boolean;           // navegação em loop
  class?: string;
  children?: Snippet;
}

// CommandInput
interface CommandInputProps {
  value?: string;           // bindable
  placeholder?: string;
  class?: string;
}

// CommandItem
interface CommandItemProps {
  value: string;            // obrigatório para filtro
  disabled?: boolean;
  onselect?: (value: string) => void;
  keywords?: string[];      // palavras extras para matching
  class?: string;
  children?: Snippet;
}

// CommandDialog
interface CommandDialogProps {
  open?: boolean;           // bindable
  title?: string;           // sr-only
  description?: string;     // sr-only
  showCloseButton?: boolean;
  class?: string;
  children?: Snippet;
}

// CommandLinkItem (Svelte only)
interface CommandLinkItemProps {
  href: string;
  target?: string;
  disabled?: boolean;
  class?: string;
  children?: Snippet;
}

// CommandLoading (Svelte only)
interface CommandLoadingProps {
  children?: Snippet;
}`;

  // ─── Compositions ──────────────────────────────────────────────────────────

  const longListItems = [
    'Accordion','Alert','AlertDialog','AspectRatio','Avatar',
    'Badge','Breadcrumb','Button','Calendar','Card',
    'Carousel','Chart','Checkbox','Collapsible','Command',
    'ContextMenu','DataTable','DatePicker','Dialog','Drawer',
    'DropdownMenu','Form','HoverCard','Input','InputOTP',
    'Label','Menubar','NavigationMenu','Pagination','Popover',
  ];

  const codeCompWithGroups = `<Command.Root>
  <Command.Input placeholder="Buscar componente..." />
  <Command.List>
    <Command.Empty>Nenhum resultado encontrado.</Command.Empty>
    <Command.Group heading="Componentes">
      <Command.Item value="button">Button</Command.Item>
      <Command.Item value="input">Input</Command.Item>
      <Command.Item value="badge">Badge</Command.Item>
      <Command.Item value="separator">Separator</Command.Item>
    </Command.Group>
    <Command.Separator />
    <Command.Group heading="Utilitários">
      <Command.Item value="cn">cn()</Command.Item>
      <Command.Item value="clsx">clsx()</Command.Item>
      <Command.Item value="twmerge">twMerge()</Command.Item>
    </Command.Group>
  </Command.List>
</Command.Root>`;

  const codeCompWithDisabled = `<Command.Root>
  <Command.Input placeholder="Buscar..." />
  <Command.List>
    <Command.Empty>Nenhum resultado encontrado.</Command.Empty>
    <Command.Group heading="Componentes">
      <Command.Item value="button">Button</Command.Item>
      <Command.Item value="input" disabled>Input (em breve)</Command.Item>
      <Command.Item value="badge">Badge</Command.Item>
      <Command.Item value="select" disabled>Select (em breve)</Command.Item>
    </Command.Group>
    <Command.Separator />
    <Command.Group heading="Utilitários">
      <Command.Item value="cn">cn()</Command.Item>
      <Command.Item value="clsx" disabled>clsx() (depreciado)</Command.Item>
    </Command.Group>
  </Command.List>
</Command.Root>`;

  const codeCompLongList = `<script lang="ts">
  import * as Command from "@/components/ui/command";
  const items = [
    'Accordion','Alert','AlertDialog','AspectRatio','Avatar',
    'Badge','Breadcrumb','Button','Calendar','Card',
    'Carousel','Chart','Checkbox','Collapsible','Command',
    'ContextMenu','DataTable','DatePicker','Dialog','Drawer',
    'DropdownMenu','Form','HoverCard','Input','InputOTP',
    'Label','Menubar','NavigationMenu','Pagination','Popover',
  ];
<\/script>

<Command.Root>
  <Command.Input placeholder="Buscar componente..." />
  <Command.List>
    <Command.Empty>Nenhum resultado encontrado.</Command.Empty>
    <Command.Group heading="Componentes">
      {#each items as label}
        <Command.Item value={label.toLowerCase()}>{label}</Command.Item>
      {/each}
    </Command.Group>
  </Command.List>
</Command.Root>`;
</script>

<DocsPageLayout navGroups={NAV_GROUPS} activeSection={section.value} componentSlug="command">
  {#snippet header()}
    <DocsHeader
      title={$tStore('title')}
      description={$tStore('description')}
      category={$tStore('category')}
      type={$tStore('type')}
      installNote="npx shadcn-svelte@latest add command"
    >
      {#snippet languageSwitcher()}
        <LanguageSwitcher />
      {/snippet}
    </DocsHeader>
  {/snippet}

  <!-- ── Demonstração ─────────────────────────────────────────────── -->
  <DocsDemonstration title={$tStore('demonstration.title')}>
    {#snippet children()}
      <div class="flex w-full flex-col items-center gap-8">

        <!-- Demo 1: Inline -->
        <div class="w-full max-w-sm">
          <p class="mb-2 text-sm font-medium text-muted-foreground">Inline</p>
          <div class="rounded-xl border shadow-md">
            <Command.Root>
              <Command.Input placeholder={$tStore('demonstration.labels.searchPlaceholder')} />
              <Command.List>
                <Command.Empty>{$tStore('demonstration.labels.emptyMessage')}</Command.Empty>
                <Command.Group heading={$tStore('demonstration.labels.groupComponents')}>
                  <Command.Item value="button">{$tStore('demonstration.labels.itemButton')}</Command.Item>
                  <Command.Item value="input">{$tStore('demonstration.labels.itemInput')}</Command.Item>
                </Command.Group>
                <Command.Separator />
                <Command.Group heading={$tStore('demonstration.labels.groupUtils')}>
                  <Command.Item value="separator">{$tStore('demonstration.labels.itemSeparator')}</Command.Item>
                </Command.Group>
              </Command.List>
            </Command.Root>
          </div>
        </div>

        <!-- Demo 2: Com CommandLoading -->
        <div class="w-full max-w-sm">
          <p class="mb-2 text-sm font-medium text-muted-foreground">Com CommandLoading</p>
          <div class="rounded-xl border shadow-md">
            <Command.Root>
              <Command.Input placeholder={$tStore('demonstration.labels.searchPlaceholder')} />
              <Command.List>
                <Command.Empty>{$tStore('demonstration.labels.emptyMessage')}</Command.Empty>
                <Command.Loading>
                  <div class="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground" role="progressbar" aria-label="Carregando resultados">
                    <Loader2 class="size-4 animate-spin" aria-hidden="true" />
                    <span>Carregando resultados...</span>
                  </div>
                </Command.Loading>
              </Command.List>
            </Command.Root>
          </div>
        </div>

        <!-- Demo 3: Command Palette -->
        <div class="flex flex-col items-center gap-3">
          <p class="text-sm font-medium text-muted-foreground">Command Palette</p>
          <Button
            variant="outline"
            class="w-[280px] justify-between text-muted-foreground"
            onclick={() => { paletteOpen = true; track('command_palette_open', { trigger: 'button', locale: $locale }); }}
          >
            <span class="flex items-center gap-2">
              <Search class="size-4" aria-hidden="true" />
              {$tStore('demonstration.labels.openPalette')}
            </span>
            <kbd class="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
              <span class="text-xs">⌘</span>K
            </kbd>
          </Button>
          <Command.Dialog bind:open={paletteOpen} title={$tStore('demonstration.labels.dialogTitle')} description={$tStore('demonstration.labels.dialogDescription')}>
            <Command.Input placeholder={$tStore('demonstration.labels.searchPlaceholder')} />
            <Command.List>
              <Command.Empty>{$tStore('demonstration.labels.emptyMessage')}</Command.Empty>
              <Command.Group heading={$tStore('demonstration.labels.groupComponents')}>
                <Command.Item value="dashboard" onselect={() => { paletteOpen = false; }}>
                  <LayoutDashboard class="mr-2" aria-hidden="true" />
                  Dashboard
                  <Command.Shortcut>⌘D</Command.Shortcut>
                </Command.Item>
                <Command.Item value="documents" onselect={() => { paletteOpen = false; }}>
                  <FileText class="mr-2" aria-hidden="true" />
                  Documentos
                </Command.Item>
                <Command.Item value="users" onselect={() => { paletteOpen = false; }}>
                  <Users class="mr-2" aria-hidden="true" />
                  Usuários
                </Command.Item>
              </Command.Group>
              <Command.Separator />
              <Command.Group heading={$tStore('demonstration.labels.groupUtils')}>
                <Command.Item value="settings" onselect={() => { paletteOpen = false; }}>
                  <Settings class="mr-2" aria-hidden="true" />
                  Configurações
                  <Command.Shortcut>⌘,</Command.Shortcut>
                </Command.Item>
              </Command.Group>
            </Command.List>
          </Command.Dialog>
        </div>

      </div>
    {/snippet}
  </DocsDemonstration>

  <!-- ── Anatomia ─────────────────────────────────────────────────── -->
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
      '<strong>CommandLinkItem</strong> — variante de <code>CommandItem</code> que renderiza como <code>&lt;a&gt;</code>. Exclusivo Svelte (bits-ui). Aceita <code>href</code> e <code>target</code>.',
      '<strong>CommandLoading</strong> — slot para exibir indicador de carregamento dentro da <code>CommandList</code>. Exclusivo Svelte (bits-ui). Aceita qualquer conteúdo como children.',
    ]}
    structureLabel={$tStore('anatomy.structureLabel')}
    structureCode={$tStore('anatomy.structureCode')}
  />

  <!-- ── Quando Usar ──────────────────────────────────────────────── -->
  <DocsWhenToUse
    title={$tStore('usage.title')}
    guidelines={{
      title: $tStore('usage.guidelines.title'),
      items: [
        $tStore('usage.guidelines.item1'),
        $tStore('usage.guidelines.item2'),
        $tStore('usage.guidelines.item3'),
        $tStore('usage.guidelines.item4'),
        $tStore('usage.guidelines.item5'),
        $tStore('usage.guidelines.item6'),
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
      ],
    }}
  />

  <!-- ── Do & Don't ───────────────────────────────────────────────── -->
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
    <div class="w-full rounded-xl border shadow-sm">
      <Command.Root>
        <Command.Input placeholder="Buscar..." />
        <Command.List>
          <Command.Empty>Nenhum resultado encontrado.</Command.Empty>
          <Command.Group heading="Componentes">
            <Command.Item value="button">Button</Command.Item>
          </Command.Group>
        </Command.List>
      </Command.Root>
    </div>
  {/snippet}
  {#snippet dontPair1()}
    <div class="w-full rounded-xl border shadow-sm">
      <Command.Root>
        <Command.Input placeholder="Buscar..." />
        <Command.List>
          <!-- sem CommandEmpty — área em branco ao filtrar -->
          <Command.Group heading="Componentes">
            <Command.Item value="button">Button</Command.Item>
          </Command.Group>
        </Command.List>
      </Command.Root>
    </div>
  {/snippet}
  {#snippet doPair2()}
    <Button
      variant="outline"
      class="w-full justify-between text-muted-foreground"
    >
      <span class="flex items-center gap-2">
        <Search class="size-4" aria-hidden="true" />
        Buscar...
      </span>
      <kbd class="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
        <span class="text-xs">⌘</span>K
      </kbd>
    </Button>
  {/snippet}
  {#snippet dontPair2()}
    <Button
      variant="outline"
      class="w-full"
    >
      Abrir painel
    </Button>
  {/snippet}

  <!-- ── Importação ───────────────────────────────────────────────── -->
  <DocsImport
    title={$tStore('import.title')}
    description={$tStore('import.basic')}
    code={codeImportBasic}
    secondaryDescription={$tStore('import.withDialog')}
    secondaryCode={codeImportWithDialog}
  />

  <!-- ── Variantes ────────────────────────────────────────────────── -->
  <DocsVariants
    title={$tStore('variants.title')}
    items={[
      { name: 'inline',   description: stripHtml($tStore('variants.items.inline')),   code: codeVariantInline,   preview: variantInline   },
      { name: 'combobox', description: stripHtml($tStore('variants.items.combobox')), code: codeVariantCombobox, preview: variantCombobox },
      { name: 'palette',  description: stripHtml($tStore('variants.items.palette')),  code: codeVariantPalette,  preview: variantPalette  },
    ]}
  />

  {#snippet variantCombobox()}
    <Popover bind:open={comboboxOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={comboboxOpen}
          class="w-56 justify-between"
        >
          {comboboxValue ? comboboxItems.find(i => i.value === comboboxValue)?.label : $tStore('demonstration.labels.selectPlaceholder')}
          <ChevronsUpDown class="ml-2 size-4 shrink-0 opacity-50" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-56 p-0">
        <Command.Root>
          <Command.Input placeholder={$tStore('demonstration.labels.comboboxSearch')} />
          <Command.List>
            <Command.Empty>{$tStore('demonstration.labels.emptyMessage')}</Command.Empty>
            <Command.Group>
              {#each comboboxItems as item}
                <Command.Item
                  value={item.value}
                  onselect={() => { comboboxValue = item.value; comboboxOpen = false; }}
                >
                  {item.label}
                  {#if comboboxValue === item.value}
                    <CheckIcon class="ml-auto size-4" aria-hidden="true" />
                  {/if}
                </Command.Item>
              {/each}
            </Command.Group>
          </Command.List>
        </Command.Root>
      </PopoverContent>
    </Popover>
  {/snippet}

  {#snippet variantInline()}
    <div class="w-full max-w-sm rounded-xl border shadow-md">
      <Command.Root>
        <Command.Input placeholder={$tStore('demonstration.labels.searchPlaceholder')} />
        <Command.List>
          <Command.Empty>{$tStore('demonstration.labels.emptyMessage')}</Command.Empty>
          <Command.Group heading={$tStore('demonstration.labels.groupComponents')}>
            <Command.Item value="button">{$tStore('demonstration.labels.itemButton')}</Command.Item>
            <Command.Item value="input">{$tStore('demonstration.labels.itemInput')}</Command.Item>
          </Command.Group>
        </Command.List>
      </Command.Root>
    </div>
  {/snippet}
  {#snippet variantPalette()}
    <div class="flex flex-col items-center gap-2">
      <p class="text-xs text-muted-foreground">{$tStore('demonstration.labels.shortcutHint')} {$tStore('demonstration.labels.shortcutKey')} {$tStore('demonstration.labels.openPalette')}</p>
      <kbd class="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
        <span class="text-xs">⌘</span>K
      </kbd>
    </div>
  {/snippet}

  <!-- ── Composições ──────────────────────────────────────────────── -->
  <DocsCompositions
    title={$tStore('variants.compositionsTitle')}
    useWhenLabel={$tNavStore('common.useWhen')}
    componentSlug="command"
    items={[
      {
        name: $tStore('variants.compositions.withGroups.name'),
        description: $tStore('variants.compositions.withGroups.description'),
        useWhen: $tStore('variants.compositions.withGroups.use'),
        code: codeCompWithGroups,
        preview: compWithGroups,
      },
      {
        name: $tStore('variants.compositions.withDisabled.name'),
        description: $tStore('variants.compositions.withDisabled.description'),
        useWhen: $tStore('variants.compositions.withDisabled.use'),
        code: codeCompWithDisabled,
        preview: compWithDisabled,
      },
      {
        name: $tStore('variants.compositions.longList.name'),
        description: $tStore('variants.compositions.longList.description'),
        useWhen: $tStore('variants.compositions.longList.use'),
        code: codeCompLongList,
        preview: compLongList,
      },
    ]}
  />

  {#snippet compWithGroups()}
    <div class="w-full max-w-xs rounded-md border shadow-md">
      <Command.Root>
        <Command.Input placeholder="Buscar componente..." />
        <Command.List>
          <Command.Empty>{$tStore('demonstration.labels.emptyMessage')}</Command.Empty>
          <Command.Group heading="Componentes">
            <Command.Item value="button">Button</Command.Item>
            <Command.Item value="input">Input</Command.Item>
            <Command.Item value="badge">Badge</Command.Item>
            <Command.Item value="separator">Separator</Command.Item>
          </Command.Group>
          <Command.Separator />
          <Command.Group heading="Utilitários">
            <Command.Item value="cn">cn()</Command.Item>
            <Command.Item value="clsx">clsx()</Command.Item>
            <Command.Item value="twmerge">twMerge()</Command.Item>
          </Command.Group>
        </Command.List>
      </Command.Root>
    </div>
  {/snippet}

  {#snippet compWithDisabled()}
    <div class="w-full max-w-xs rounded-md border shadow-md">
      <Command.Root>
        <Command.Input placeholder="Buscar..." />
        <Command.List>
          <Command.Empty>{$tStore('demonstration.labels.emptyMessage')}</Command.Empty>
          <Command.Group heading="Componentes">
            <Command.Item value="button">Button</Command.Item>
            <Command.Item value="input" disabled>Input (em breve)</Command.Item>
            <Command.Item value="badge">Badge</Command.Item>
            <Command.Item value="select" disabled>Select (em breve)</Command.Item>
          </Command.Group>
          <Command.Separator />
          <Command.Group heading="Utilitários">
            <Command.Item value="cn">cn()</Command.Item>
            <Command.Item value="clsx" disabled>clsx() (depreciado)</Command.Item>
          </Command.Group>
        </Command.List>
      </Command.Root>
    </div>
  {/snippet}

  {#snippet compLongList()}
    <div class="w-full max-w-xs rounded-md border shadow-md">
      <Command.Root>
        <Command.Input placeholder="Buscar componente..." />
        <Command.List>
          <Command.Empty>{$tStore('demonstration.labels.emptyMessage')}</Command.Empty>
          <Command.Group heading="Componentes">
            {#each longListItems as label}
              <Command.Item value={label.toLowerCase()}>{label}</Command.Item>
            {/each}
          </Command.Group>
        </Command.List>
      </Command.Root>
    </div>
  {/snippet}

  <!-- ── Estados ──────────────────────────────────────────────────── -->
  <DocsStates
    title={$tStore('states.title')}
    cols={{
      state: $tStore('states.cols.state'),
      trigger: $tStore('states.cols.trigger'),
      behavior: $tStore('states.cols.behavior'),
    }}
    items={[
      { label: $tStore('states.empty.label'),    trigger: stripHtml($tStore('states.empty.trigger')),    behavior: $tStore('states.empty.behavior')    },
      { label: $tStore('states.selected.label'), trigger: stripHtml($tStore('states.selected.trigger')), behavior: $tStore('states.selected.behavior') },
      { label: $tStore('states.disabled.label'), trigger: stripHtml($tStore('states.disabled.trigger')), behavior: $tStore('states.disabled.behavior') },
      { label: $tStore('states.loading.label'),  trigger: stripHtml($tStore('states.loading.trigger')),  behavior: $tStore('states.loading.behavior')  },
    ]}
  />

  <!-- ── Propriedades ─────────────────────────────────────────────── -->
  <DocsProps
    title={$tStore('props.title')}
    tables={[
      {
        title: $tStore('props.commandTitle'),
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'value',          type: 'string',                                   defaultValue: '""',  required: 'Não', description: stripHtml($tStore('props.table.commandValue'))         },
          { name: 'filter',         type: '(value, search, keywords?) => number',     defaultValue: '—',   required: 'Não', description: stripHtml($tStore('props.table.commandFilter'))        },
          { name: 'onValueChange',  type: '(value: string) => void',                  defaultValue: '—',   required: 'Não', description: stripHtml($tStore('props.table.commandOnValueChange')) },
          { name: 'class',          type: 'string',                                   defaultValue: '—',   required: 'Não', description: stripHtml($tStore('props.table.className'))            },
          { name: 'children',       type: 'Snippet',                                  defaultValue: '—',   required: 'Não', description: stripHtml($tStore('props.table.children'))             },
        ],
      },
      {
        title: $tStore('props.commandInputTitle'),
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'placeholder', type: 'string',  defaultValue: '—',    required: 'Não', description: stripHtml($tStore('props.table.inputPlaceholder')) },
          { name: 'value',       type: 'string',  defaultValue: '""',   required: 'Não', description: 'Valor controlado do input (bindable).'            },
          { name: 'class',       type: 'string',  defaultValue: '—',    required: 'Não', description: stripHtml($tStore('props.table.className'))        },
        ],
      },
      {
        title: $tStore('props.commandItemTitle'),
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'value',    type: 'string',              defaultValue: '—',     required: 'Sim', description: stripHtml($tStore('props.table.itemValue'))    },
          { name: 'disabled', type: 'boolean',             defaultValue: 'false', required: 'Não', description: stripHtml($tStore('props.table.itemDisabled')) },
          { name: 'onselect', type: '(value: string) => void', defaultValue: '—', required: 'Não', description: stripHtml($tStore('props.table.itemOnSelect')) },
          { name: 'class',    type: 'string',              defaultValue: '—',     required: 'Não', description: stripHtml($tStore('props.table.className'))    },
          { name: 'children', type: 'Snippet',             defaultValue: '—',     required: 'Não', description: stripHtml($tStore('props.table.children'))    },
        ],
      },
      {
        title: $tStore('props.commandDialogTitle'),
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'open',             type: 'boolean', defaultValue: 'false',              required: 'Não', description: 'Estado de abertura do Dialog (bindable).'                     },
          { name: 'title',            type: 'string',  defaultValue: '"Command Palette"',  required: 'Não', description: stripHtml($tStore('props.table.dialogTitle'))            },
          { name: 'description',      type: 'string',  defaultValue: '"Search for a command to run..."', required: 'Não', description: stripHtml($tStore('props.table.dialogDescription')) },
          { name: 'showCloseButton',  type: 'boolean', defaultValue: 'false',              required: 'Não', description: stripHtml($tStore('props.table.dialogShowCloseButton'))  },
          { name: 'class',            type: 'string',  defaultValue: '—',                  required: 'Não', description: stripHtml($tStore('props.table.className'))              },
          { name: 'children',         type: 'Snippet', defaultValue: '—',                  required: 'Sim', description: stripHtml($tStore('props.table.children'))              },
        ],
      },
    ]}
    interfaceCode={interfaceCode}
    extensibilityTitle={$tStore('props.extensibilityTitle')}
    extensibilityNotes={$tStore('props.extensibility')}
  />

  <!-- ── Tokens ───────────────────────────────────────────────────── -->
  <DocsTokens
    title={$tStore('tokens.title')}
    cols={{
      token: $tStore('tokens.table.token'),
      value: $tStore('tokens.table.class'),
      description: $tStore('tokens.table.part'),
    }}
    items={[
      { token: '--popover',            value: 'bg-popover',          description: $tStore('tokens.table.popoverBg')   },
      { token: '--popover-foreground', value: 'text-popover-foreground', description: $tStore('tokens.table.popoverFg') },
      { token: '--muted-foreground',   value: 'text-muted-foreground',  description: $tStore('tokens.table.mutedFg')   },
      { token: '--input',              value: 'bg-input/30',            description: $tStore('tokens.table.inputBg')   },
      { token: '--input',              value: 'border-input/30',        description: $tStore('tokens.table.inputBorder') },
      { token: '--muted',              value: 'data-selected:bg-muted', description: $tStore('tokens.table.selectedBg') },
      { token: '--foreground',         value: 'data-selected:text-foreground', description: $tStore('tokens.table.selectedFg') },
      { token: '--border',             value: 'border',                description: $tStore('tokens.table.border')    },
      { token: '--radius',             value: 'rounded-xl / rounded-sm', description: $tStore('tokens.table.radius') },
    ]}
    customizationTitle={$tStore('tokens.customizationTitle')}
    customizationCode={codeCustomizationTokens}
  />

  <!-- ── Acessibilidade ───────────────────────────────────────────── -->
  <DocsAccessibility
    title={$tStore('accessibility.title')}
    summary={$tStore('accessibility.summary')}
    items={[
      $tStore('accessibility.item1'),
      $tStore('accessibility.item2'),
      $tStore('accessibility.item3'),
      $tStore('accessibility.item4'),
    ]}
    keyboardTitle="Navegação por Teclado"
    keyboardItems={[
      { key: '↓',       description: $tStore('accessibility.keyboard.arrowDown') },
      { key: '↑',       description: $tStore('accessibility.keyboard.arrowUp')   },
      { key: 'Enter',   description: $tStore('accessibility.keyboard.enter')     },
      { key: 'Escape',  description: $tStore('accessibility.keyboard.escape')    },
      { key: 'Tab',     description: $tStore('accessibility.keyboard.tab')       },
      { key: '⌘K',      description: $tStore('accessibility.keyboard.cmdK')      },
    ]}
  />

  <!-- ── Relacionados ─────────────────────────────────────────────── -->
  <DocsRelated
    title={$tStore('related.title')}
    items={[
      { name: 'Select',        description: $tStore('related.select'),       path: '?path=/docs/ui-select--docs'       },
      { name: 'DropdownMenu',  description: $tStore('related.dropdownMenu'), path: '?path=/docs/ui-dropdownmenu--docs' },
      { name: 'Popover',       description: $tStore('related.popover'),      path: '?path=/docs/ui-popover--docs'      },
      { name: 'Dialog',        description: $tStore('related.dialog'),       path: '?path=/docs/ui-dialog--docs'       },
    ]}
  />

  <!-- ── Notas ────────────────────────────────────────────────────── -->
  <DocsNotes
    title={$tStore('notes.title')}
    items={[
      { title: '', content: $tStore('notes.tip1') },
      { title: '', content: $tStore('notes.tip2') },
      { title: '', content: $tStore('notes.tip3') },
      { title: '', content: $tStore('notes.tip4') },
    ]}
  />

  <!-- ── Analytics ────────────────────────────────────────────────── -->
  <DocsAnalytics
    title={$tStore('analytics.title')}
    cols={{
      event: $tStore('analytics.table.event'),
      trigger: $tStore('analytics.table.trigger'),
      payload: $tStore('analytics.table.payload'),
    }}
    items={[
      { event: $tStore('analytics.table.itemSelect'),    trigger: $tStore('analytics.table.itemSelectTrigger'),    payload: $tStore('analytics.table.itemSelectPayload')    },
      { event: $tStore('analytics.table.paletteOpen'),   trigger: $tStore('analytics.table.paletteOpenTrigger'),   payload: $tStore('analytics.table.paletteOpenPayload')   },
      { event: $tStore('analytics.table.pageView'),      trigger: $tStore('analytics.table.pageViewTrigger'),      payload: $tStore('analytics.table.pageViewPayload')      },
      { event: $tStore('analytics.table.sectionViewed'), trigger: $tStore('analytics.table.sectionViewedTrigger'), payload: $tStore('analytics.table.sectionViewedPayload') },
      { event: $tStore('analytics.table.langSwitch'),    trigger: $tStore('analytics.table.langSwitchTrigger'),    payload: $tStore('analytics.table.langSwitchPayload')    },
    ]}
  />

  <!-- ── Testes ───────────────────────────────────────────────────── -->
  <DocsTestes
    title={$tStore('testes.title')}
    functional={{
      title: $tStore('testes.functional.title'),
      cols: {
        action: $tNavStore('common.userAction'),
        result: $tNavStore('common.expectedResult'),
        priority: $tNavStore('common.priority'),
      },
      items: [
        { action: $tStore('testes.functional.item1.action'), result: $tStore('testes.functional.item1.result'), priority: localPriority($tStore('testes.functional.item1.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item2.action'), result: $tStore('testes.functional.item2.result'), priority: localPriority($tStore('testes.functional.item2.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item3.action'), result: $tStore('testes.functional.item3.result'), priority: localPriority($tStore('testes.functional.item3.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item4.action'), result: $tStore('testes.functional.item4.result'), priority: localPriority($tStore('testes.functional.item4.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item5.action'), result: $tStore('testes.functional.item5.result'), priority: localPriority($tStore('testes.functional.item5.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item6.action'), result: $tStore('testes.functional.item6.result'), priority: localPriority($tStore('testes.functional.item6.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item7.action'), result: $tStore('testes.functional.item7.result'), priority: localPriority($tStore('testes.functional.item7.priority'), $tNavStore) },
      ],
    }}
    accessibility={{
      title: $tStore('testes.accessibility.title'),
      cols: {
        criterion: $tNavStore('common.criterion'),
        level: 'WCAG',
        how: $tNavStore('common.howToVerify'),
      },
      items: [
        { criterion: $tStore('testes.accessibility.item1'), level: 'AA', how: 'axe-core' },
        { criterion: $tStore('testes.accessibility.item2'), level: 'AA', how: 'Teclado manual' },
        { criterion: $tStore('testes.accessibility.item3'), level: 'AA', how: 'Leitor de tela' },
        { criterion: $tStore('testes.accessibility.item4'), level: 'AA', how: 'Teclado manual' },
        { criterion: $tStore('testes.accessibility.item5'), level: 'AA', how: 'DOM inspection' },
      ],
    }}
    visual={{
      title: $tStore('testes.visual.title'),
      cols: {
        story: $tNavStore('common.storyState'),
        priority: $tNavStore('common.priority'),
      },
      items: [
        { story: $tStore('testes.visual.item1.story'), priority: localPriority($tStore('testes.visual.item1.priority'), $tNavStore) },
        { story: $tStore('testes.visual.item2.story'), priority: localPriority($tStore('testes.visual.item2.priority'), $tNavStore) },
        { story: $tStore('testes.visual.item3.story'), priority: localPriority($tStore('testes.visual.item3.priority'), $tNavStore) },
        { story: $tStore('testes.visual.item4.story'), priority: localPriority($tStore('testes.visual.item4.priority'), $tNavStore) },
        { story: $tStore('testes.visual.item5.story'), priority: localPriority($tStore('testes.visual.item5.priority'), $tNavStore) },
      ],
    }}
  />
</DocsPageLayout>
