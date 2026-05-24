<script lang="ts">
  import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
    TooltipProvider,
  } from '@/components/ui/tooltip';
  import { Button } from '@/components/ui/button';
  import { Save, Trash2, Share2, HelpCircle, Info } from 'lucide-svelte';
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
  import tooltipTranslations from '@shared/content/tooltip/translations.json';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(tooltipTranslations);

  // ─── SEO + Analytics ─────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale: l,
      componentSlug: 'tooltip',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      aiIntent: t('seo.aiIntent'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: t('category'), item: '/components/overlay' },
        { name: t('title') },
      ],
    });
    track('docs_page_view', {
      component_name: 'tooltip',
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
        { id: 'variantes',    label: tContent('nav.variants') },
        { id: 'composicoes',  label: tNav('nav.compositions') },
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
    track('docs_section_viewed', { section_id: id, component_name: 'tooltip', locale: $locale });
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

  // ─── Code strings ────────────────────────────────────────────────────────────

  const codeImportBasic = `import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";`;

  const codeImportUsage = `<!-- No root da app — uma única vez -->
<TooltipProvider delayDuration={400}>
  <App />
</TooltipProvider>

<!-- Onde precisar -->
<Tooltip>
  <TooltipTrigger>
    {#snippet child({ props })}
      <Button variant="ghost" size="icon" aria-label="Salvar" {...props}>
        <Save aria-hidden="true" class="size-4" />
      </Button>
    {/snippet}
  </TooltipTrigger>
  <TooltipContent>Salvar (Ctrl+S)</TooltipContent>
</Tooltip>`;

  const codeDefault = `<Tooltip>
  <TooltipTrigger>
    {#snippet child({ props })}
      <Button variant="outline" size="icon" aria-label="Salvar" {...props}>
        <Save aria-hidden="true" class="size-4" />
      </Button>
    {/snippet}
  </TooltipTrigger>
  <TooltipContent>Salvar item</TooltipContent>
</Tooltip>`;

  const codeWithShortcut = `<Tooltip>
  <TooltipTrigger>
    {#snippet child({ props })}
      <Button variant="outline" size="icon" aria-label="Salvar" {...props}>
        <Save aria-hidden="true" class="size-4" />
      </Button>
    {/snippet}
  </TooltipTrigger>
  <TooltipContent>
    Salvar
    <kbd data-slot="kbd">Ctrl</kbd>
    <kbd data-slot="kbd">S</kbd>
  </TooltipContent>
</Tooltip>`;

  const codeLongText = `<Tooltip>
  <TooltipTrigger>
    {#snippet child({ props })}
      <Button variant="outline" size="icon" aria-label="Compartilhar link" {...props}>
        <Share2 aria-hidden="true" class="size-4" />
      </Button>
    {/snippet}
  </TooltipTrigger>
  <TooltipContent>
    Compartilhe o link público desta página com qualquer pessoa.
  </TooltipContent>
</Tooltip>`;

  const codeCustomizationTokens = `/* Tooltip claro em tema dark (override de variante) */
.tooltip-light [data-slot="tooltip-content"] {
  @apply bg-popover text-popover-foreground ring-1 ring-foreground/10;
}
.tooltip-light [data-slot="tooltip-content"] svg {
  @apply fill-popover;
}`;

  const interfaceCode = `// TooltipProvider (bits-ui)
interface TooltipProviderProps {
  delayDuration?: number;
  disableHoverableContent?: boolean;
  children?: Snippet;
}

// Tooltip (Root)
interface TooltipProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: Snippet;
}

// TooltipContent
interface TooltipContentProps {
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  class?: string;
}

// TooltipTrigger
interface TooltipTriggerProps {
  class?: string;
  child?: Snippet<[{ props: Record<string, any> }]>;
}`;

  const propsTableCols = $derived({
    prop: $tStore('props.table.prop'),
    type: $tStore('props.table.type'),
    default: $tStore('props.table.default'),
    required: $tStore('props.table.required'),
    description: $tStore('props.table.description'),
  });
</script>

<DocsPageLayout navGroups={NAV_GROUPS} activeSection={section.value} componentSlug="tooltip">
  {#snippet header()}
    <DocsHeader
      title={$tStore('title')}
      description={$tStore('description')}
      category={$tStore('category')}
      type={$tStore('type')}
      installNote="npx shadcn-svelte@latest add tooltip"
    />
  {/snippet}

  <!-- ── Demonstração ───────────────────────────────────────────── -->
  <DocsDemonstration title={$tStore('demonstration.title')}>
    {#snippet children()}
      <TooltipProvider delayDuration={200}>
        <div class="flex flex-wrap items-center justify-center gap-6 w-full py-6">
          <Tooltip>
            <TooltipTrigger>
              {#snippet child({ props })}
                <Button variant="outline" size="icon" aria-label={$tStore('demonstration.labels.saveButton')} {...props}>
                  <Save aria-hidden="true" class="size-4" />
                </Button>
              {/snippet}
            </TooltipTrigger>
            <TooltipContent>{$tStore('demonstration.labels.save')}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger>
              {#snippet child({ props })}
                <Button variant="outline" size="icon" aria-label={$tStore('demonstration.labels.deleteButton')} {...props}>
                  <Trash2 aria-hidden="true" class="size-4" />
                </Button>
              {/snippet}
            </TooltipTrigger>
            <TooltipContent>{$tStore('demonstration.labels.delete')}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger>
              {#snippet child({ props })}
                <Button variant="outline" size="icon" aria-label={$tStore('demonstration.labels.shareButton')} {...props}>
                  <Share2 aria-hidden="true" class="size-4" />
                </Button>
              {/snippet}
            </TooltipTrigger>
            <TooltipContent>{$tStore('demonstration.labels.share')}</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
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
        { element: $tStore('usage.uxWriting.table.content.name'),  rules: stripHtml($tStore('usage.uxWriting.table.content.format')),  do: $tStore('usage.uxWriting.table.content.good'),  dont: $tStore('usage.uxWriting.table.content.bad') },
        { element: $tStore('usage.uxWriting.table.shortcut.name'), rules: stripHtml($tStore('usage.uxWriting.table.shortcut.format')), do: $tStore('usage.uxWriting.table.shortcut.good'), dont: $tStore('usage.uxWriting.table.shortcut.bad') },
        { element: $tStore('usage.uxWriting.table.icon.name'),     rules: stripHtml($tStore('usage.uxWriting.table.icon.format')),     do: $tStore('usage.uxWriting.table.icon.good'),     dont: $tStore('usage.uxWriting.table.icon.bad') },
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
        stripHtml($tStore('usage.dont.item1')),
        stripHtml($tStore('usage.dont.item2')),
        stripHtml($tStore('usage.dont.item3')),
        stripHtml($tStore('usage.dont.item4')),
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
    <TooltipProvider delayDuration={0}>
      <Tooltip defaultOpen>
        <TooltipTrigger>
          {#snippet child({ props })}
            <Button variant="outline" size="icon" aria-label="Salvar" {...props}>
              <Save aria-hidden="true" class="size-4" />
            </Button>
          {/snippet}
        </TooltipTrigger>
        <TooltipContent>Salvar (Ctrl+S)</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  {/snippet}
  {#snippet dontPair1()}
    <TooltipProvider delayDuration={0}>
      <Tooltip defaultOpen>
        <TooltipTrigger>
          {#snippet child({ props })}
            <Button variant="outline" size="icon" {...props}>
              <Save aria-hidden="true" class="size-4" />
            </Button>
          {/snippet}
        </TooltipTrigger>
        <TooltipContent>Salvar</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  {/snippet}
  {#snippet doPair2()}
    <TooltipProvider delayDuration={0}>
      <Tooltip defaultOpen>
        <TooltipTrigger>
          {#snippet child({ props })}
            <Button variant="outline" size="icon" aria-label="Salvar" {...props}>
              <Save aria-hidden="true" class="size-4" />
            </Button>
          {/snippet}
        </TooltipTrigger>
        <TooltipContent>Salvar (Ctrl+S)</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  {/snippet}
  {#snippet dontPair2()}
    <TooltipProvider delayDuration={0}>
      <Tooltip defaultOpen>
        <TooltipTrigger>
          {#snippet child({ props })}
            <Button variant="outline" size="icon" aria-label="Salvar" {...props}>
              <Save aria-hidden="true" class="size-4" />
            </Button>
          {/snippet}
        </TooltipTrigger>
        <TooltipContent>
          Clique aqui para salvar o documento atual no servidor — pode demorar alguns segundos dependendo do tamanho.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
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
      { name: $tStore('variants.items.default'),      description: stripHtml($tStore('variants.styles.default')),      code: codeDefault,      preview: variantDefault      },
      { name: $tStore('variants.items.withShortcut'), description: stripHtml($tStore('variants.styles.withShortcut')), code: codeWithShortcut, preview: variantWithShortcut },
      { name: $tStore('variants.items.longText'),     description: stripHtml($tStore('variants.styles.longText')),     code: codeLongText,     preview: variantLongText     },
    ]}
  />

  {#snippet variantDefault()}
    <TooltipProvider delayDuration={0}>
      <Tooltip defaultOpen>
        <TooltipTrigger>
          {#snippet child({ props })}
            <Button variant="outline" size="icon" aria-label="Salvar" {...props}>
              <Save aria-hidden="true" class="size-4" />
            </Button>
          {/snippet}
        </TooltipTrigger>
        <TooltipContent>Salvar item</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  {/snippet}
  {#snippet variantWithShortcut()}
    <TooltipProvider delayDuration={0}>
      <Tooltip defaultOpen>
        <TooltipTrigger>
          {#snippet child({ props })}
            <Button variant="outline" size="icon" aria-label="Salvar" {...props}>
              <Save aria-hidden="true" class="size-4" />
            </Button>
          {/snippet}
        </TooltipTrigger>
        <TooltipContent>
          <span>Salvar</span>
          <kbd data-slot="kbd" class="bg-background/15 text-background ml-1 inline-flex h-4 items-center rounded px-1 text-[10px] font-medium">Ctrl</kbd>
          <kbd data-slot="kbd" class="bg-background/15 text-background inline-flex h-4 items-center rounded px-1 text-[10px] font-medium">S</kbd>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  {/snippet}
  {#snippet variantLongText()}
    <TooltipProvider delayDuration={0}>
      <Tooltip defaultOpen>
        <TooltipTrigger>
          {#snippet child({ props })}
            <Button variant="outline" size="icon" aria-label="Compartilhar link" {...props}>
              <Share2 aria-hidden="true" class="size-4" />
            </Button>
          {/snippet}
        </TooltipTrigger>
        <TooltipContent>
          Compartilhe o link público desta página com qualquer pessoa.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  {/snippet}

  <!-- ── Composições ─────────────────────────────────────────────── -->
  <DocsCompositions
    title={$tStore('variants.compositionsTitle')}
    useWhenLabel={$tNavStore('common.useWhen')}
    componentSlug="tooltip"
    items={[
      {
        name: $tStore('variants.compositions.iconButtonWithShortcut.name'),
        description: $tStore('variants.compositions.iconButtonWithShortcut.description'),
        useWhen: $tStore('variants.compositions.iconButtonWithShortcut.use'),
        code: `<Tooltip>
  <TooltipTrigger>
    {#snippet child({ props })}
      <Button variant="ghost" size="icon" aria-label="Salvar" {...props}>
        <Save aria-hidden="true" />
      </Button>
    {/snippet}
  </TooltipTrigger>
  <TooltipContent>
    Salvar <kbd>Ctrl</kbd><kbd>S</kbd>
  </TooltipContent>
</Tooltip>`,
        preview: compIconShortcut,
      },
      {
        name: $tStore('variants.compositions.formFieldHelp.name'),
        description: $tStore('variants.compositions.formFieldHelp.description'),
        useWhen: $tStore('variants.compositions.formFieldHelp.use'),
        code: `<div class="flex flex-col gap-2">
  <div class="flex items-center gap-2">
    <label for="api-token" class="text-sm font-medium">Token de API</label>
    <Tooltip>
      <TooltipTrigger>
        {#snippet child({ props })}
          <Button variant="ghost" size="icon" aria-label="Ajuda sobre Token de API" {...props}>
            <HelpCircle aria-hidden="true" />
          </Button>
        {/snippet}
      </TooltipTrigger>
      <TooltipContent side="right" class="max-w-xs">
        Cole o token gerado em Configurações &gt; Integrações.
      </TooltipContent>
    </Tooltip>
  </div>
  <input id="api-token" type="text" class="input w-64" placeholder="sk-..." />
</div>`,
        preview: compFormHelp,
      },
      {
        name: $tStore('variants.compositions.metricDescription.name'),
        description: $tStore('variants.compositions.metricDescription.description'),
        useWhen: $tStore('variants.compositions.metricDescription.use'),
        code: `<div class="flex flex-col gap-1">
  <div class="flex items-center gap-2">
    <p class="text-xs font-medium text-muted-foreground uppercase tracking-wide">LCP</p>
    <Tooltip>
      <TooltipTrigger>
        {#snippet child({ props })}
          <Button variant="ghost" size="icon" aria-label="O que é LCP" {...props}>
            <Info aria-hidden="true" />
          </Button>
        {/snippet}
      </TooltipTrigger>
      <TooltipContent side="top" class="max-w-xs">
        Largest Contentful Paint — tempo até o maior elemento visível ser renderizado.
      </TooltipContent>
    </Tooltip>
  </div>
  <p class="text-2xl font-semibold">1.8s</p>
</div>`,
        preview: compMetric,
      },
      {
        name: $tStore('variants.compositions.positioningSides.name'),
        description: $tStore('variants.compositions.positioningSides.description'),
        useWhen: $tStore('variants.compositions.positioningSides.use'),
        code: `<div class="grid grid-cols-2 sm:grid-cols-4 gap-8 place-items-center">
  {#each ['top','right','bottom','left'] as s}
    <Tooltip>
      <TooltipTrigger>
        {#snippet child({ props })}
          <Button variant="outline" {...props}>{s}</Button>
        {/snippet}
      </TooltipTrigger>
      <TooltipContent side={s}>Tooltip {s}</TooltipContent>
    </Tooltip>
  {/each}
</div>`,
        preview: compSides,
      },
    ]}
  />

  {#snippet compIconShortcut()}
    <TooltipProvider delayDuration={0}>
      <Tooltip defaultOpen>
        <TooltipTrigger>
          {#snippet child({ props })}
            <Button variant="ghost" size="icon" aria-label="Salvar" {...props}>
              <Save aria-hidden="true" class="size-4" />
            </Button>
          {/snippet}
        </TooltipTrigger>
        <TooltipContent>
          <span>Salvar</span>
          <kbd data-slot="kbd" class="bg-background/15 text-background ml-1 inline-flex h-4 items-center rounded px-1 text-[10px] font-medium">Ctrl</kbd>
          <kbd data-slot="kbd" class="bg-background/15 text-background inline-flex h-4 items-center rounded px-1 text-[10px] font-medium">S</kbd>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  {/snippet}

  {#snippet compFormHelp()}
    <TooltipProvider delayDuration={0}>
      <div class="flex flex-col gap-2 items-start">
        <div class="flex items-center gap-2">
          <label for="api-token-svelte-comp" class="text-sm font-medium">Token de API</label>
          <Tooltip>
            <TooltipTrigger>
              {#snippet child({ props })}
                <Button variant="ghost" size="icon" aria-label="Ajuda sobre Token de API" {...props}>
                  <HelpCircle aria-hidden="true" class="size-4" />
                </Button>
              {/snippet}
            </TooltipTrigger>
            <TooltipContent side="right" class="max-w-xs">
              Cole o token gerado em Configurações &gt; Integrações.
            </TooltipContent>
          </Tooltip>
        </div>
        <input
          id="api-token-svelte-comp"
          type="text"
          class="h-9 w-64 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          placeholder="sk-..."
        />
      </div>
    </TooltipProvider>
  {/snippet}

  {#snippet compMetric()}
    <TooltipProvider delayDuration={0}>
      <div class="flex flex-col gap-1 items-start">
        <div class="flex items-center gap-2">
          <p class="text-xs font-medium text-muted-foreground uppercase tracking-wide">LCP</p>
          <Tooltip>
            <TooltipTrigger>
              {#snippet child({ props })}
                <Button variant="ghost" size="icon" aria-label="O que é LCP" {...props}>
                  <Info aria-hidden="true" class="size-4" />
                </Button>
              {/snippet}
            </TooltipTrigger>
            <TooltipContent side="top" class="max-w-xs">
              Largest Contentful Paint — tempo até o maior elemento visível ser renderizado.
            </TooltipContent>
          </Tooltip>
        </div>
        <p class="text-2xl font-semibold">1.8s</p>
      </div>
    </TooltipProvider>
  {/snippet}

  {#snippet compSides()}
    <TooltipProvider delayDuration={0}>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-8 place-items-center w-full" style="contain: layout; min-height: 160px;">
        <Tooltip>
          <TooltipTrigger>
            {#snippet child({ props })}
              <Button variant="outline" {...props}>Top</Button>
            {/snippet}
          </TooltipTrigger>
          <TooltipContent side="top">Tooltip top</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger>
            {#snippet child({ props })}
              <Button variant="outline" {...props}>Right</Button>
            {/snippet}
          </TooltipTrigger>
          <TooltipContent side="right">Tooltip right</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger>
            {#snippet child({ props })}
              <Button variant="outline" {...props}>Bottom</Button>
            {/snippet}
          </TooltipTrigger>
          <TooltipContent side="bottom">Tooltip bottom</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger>
            {#snippet child({ props })}
              <Button variant="outline" {...props}>Left</Button>
            {/snippet}
          </TooltipTrigger>
          <TooltipContent side="left">Tooltip left</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
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
      { label: $tStore('states.items.closed'),  trigger: 'defaultOpen={false}',     behavior: stripHtml($tStore('states.descriptions.closed'))  },
      { label: $tStore('states.items.open'),    trigger: 'defaultOpen={true} / open', behavior: stripHtml($tStore('states.descriptions.open'))    },
      { label: $tStore('states.items.hover'),   trigger: 'pointer enter trigger',   behavior: stripHtml($tStore('states.descriptions.hover'))   },
      { label: $tStore('states.items.focus'),   trigger: 'Tab → focus trigger',     behavior: stripHtml($tStore('states.descriptions.focus'))   },
      { label: $tStore('states.items.delayed'), trigger: 'data-state="delayed-open"', behavior: stripHtml($tStore('states.descriptions.delayed')) },
    ]}
  />

  <!-- ── Propriedades ───────────────────────────────────────────── -->
  <DocsProps
    title={$tStore('props.title')}
    tables={[
      {
        cols: propsTableCols,
        items: [
          { name: 'delay',        type: $tStore('props.table.delay.type'),        defaultValue: $tStore('props.table.delay.default'),        required: $tStore('props.table.delay.required'),        description: stripHtml($tStore('props.table.delay.description'))        },
          { name: 'open',         type: $tStore('props.table.open.type'),         defaultValue: $tStore('props.table.open.default'),         required: $tStore('props.table.open.required'),         description: stripHtml($tStore('props.table.open.description'))         },
          { name: 'defaultOpen',  type: $tStore('props.table.defaultOpen.type'),  defaultValue: $tStore('props.table.defaultOpen.default'),  required: $tStore('props.table.defaultOpen.required'),  description: stripHtml($tStore('props.table.defaultOpen.description'))  },
          { name: 'onOpenChange', type: $tStore('props.table.onOpenChange.type'), defaultValue: $tStore('props.table.onOpenChange.default'), required: $tStore('props.table.onOpenChange.required'), description: stripHtml($tStore('props.table.onOpenChange.description')) },
          { name: 'side',         type: $tStore('props.table.side.type'),         defaultValue: $tStore('props.table.side.default'),         required: $tStore('props.table.side.required'),         description: stripHtml($tStore('props.table.side.description'))         },
          { name: 'align',        type: $tStore('props.table.align.type'),        defaultValue: $tStore('props.table.align.default'),        required: $tStore('props.table.align.required'),        description: stripHtml($tStore('props.table.align.description'))        },
          { name: 'sideOffset',   type: $tStore('props.table.sideOffset.type'),   defaultValue: $tStore('props.table.sideOffset.default'),   required: $tStore('props.table.sideOffset.required'),   description: stripHtml($tStore('props.table.sideOffset.description'))   },
          { name: 'class',        type: $tStore('props.table.className.type'),    defaultValue: $tStore('props.table.className.default'),    required: $tStore('props.table.className.required'),    description: stripHtml($tStore('props.table.className.description'))    },
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
      { token: '--foreground', value: $tStore('tokens.table.foreground.class'), description: $tStore('tokens.table.foreground.part') },
      { token: '--background', value: $tStore('tokens.table.background.class'), description: $tStore('tokens.table.background.part') },
      { token: 'fill',         value: $tStore('tokens.table.fill.class'),       description: $tStore('tokens.table.fill.part')       },
      { token: 'radius',       value: $tStore('tokens.table.radius.class'),     description: $tStore('tokens.table.radius.part')     },
      { token: 'zIndex',       value: $tStore('tokens.table.zIndex.class'),     description: $tStore('tokens.table.zIndex.part')     },
    ]}
    customizationTitle={$tStore('tokens.customizationTitle')}
    customizationCode={codeCustomizationTokens}
  />

  <!-- ── Acessibilidade ─────────────────────────────────────────── -->
  <DocsAccessibility
    title={$tStore('accessibility.title')}
    summary={$tStore('accessibility.summary')}
    items={[
      stripHtml($tStore('accessibility.items.item1')),
      stripHtml($tStore('accessibility.items.item2')),
      stripHtml($tStore('accessibility.items.item3')),
      stripHtml($tStore('accessibility.items.item4')),
      stripHtml($tStore('accessibility.items.item5')),
      stripHtml($tStore('accessibility.items.item6')),
    ]}
    keyboardTitle={$tStore('accessibility.keyboard.title')}
    keyboardItems={[
      { key: 'Tab',       description: stripHtml($tStore('accessibility.keyboard.tab'))      },
      { key: 'Escape',    description: stripHtml($tStore('accessibility.keyboard.escape'))   },
      { key: 'Shift+Tab', description: stripHtml($tStore('accessibility.keyboard.shiftTab')) },
    ]}
  />

  <!-- ── Relacionados ───────────────────────────────────────────── -->
  <DocsRelated
    title={$tStore('related.title')}
    items={[
      { name: $tStore('related.items.popover.name'),   description: $tStore('related.items.popover.description'),   path: '?path=/docs/ui-popover--docs'   },
      { name: $tStore('related.items.hoverCard.name'), description: $tStore('related.items.hoverCard.description'), path: '?path=/docs/ui-hovercard--docs' },
      { name: $tStore('related.items.button.name'),    description: $tStore('related.items.button.description'),    path: '?path=/docs/ui-button--docs'    },
      { name: $tStore('related.items.kbd.name'),       description: $tStore('related.items.kbd.description'),       path: '?path=/docs/ui-kbd--docs'       },
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
    ]}
  />

  <!-- ── Analytics ─────────────────────────────────────────────── -->
  <DocsAnalytics
    title={$tStore('analytics.title')}
    cols={{
      event: $tStore('analytics.table.event'),
      trigger: $tStore('analytics.table.trigger'),
      payload: $tStore('analytics.table.payload'),
    }}
    items={[
      { event: 'tooltip_view', trigger: $tStore('analytics.table.tooltip_view.trigger'), payload: $tStore('analytics.table.tooltip_view.payload') },
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
      items: [1, 2, 3, 4].map((i) => ({
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
        { criterion: stripHtml($tStore('testes.accessibility.item1')), level: 'AA',     how: 'axe-core'         },
        { criterion: stripHtml($tStore('testes.accessibility.item2')), level: '1.4.3',  how: 'Contrast checker' },
        { criterion: stripHtml($tStore('testes.accessibility.item3')), level: '4.1.2',  how: 'DevTools a11y'    },
        { criterion: stripHtml($tStore('testes.accessibility.item4')), level: '1.3.1',  how: 'DevTools a11y'    },
        { criterion: stripHtml($tStore('testes.accessibility.item5')), level: '4.1.2',  how: 'DevTools a11y'    },
      ],
    }}
    visual={{
      title: $tStore('testes.visual.title'),
      cols: {
        story: $tNavStore('common.storyState'),
        priority: $tNavStore('common.priority'),
      },
      items: [1, 2, 3, 4].map((i) => ({
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
