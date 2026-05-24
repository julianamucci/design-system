<script lang="ts">
  import {
    HoverCard,
    HoverCardTrigger,
    HoverCardContent,
  } from '@/components/ui/hover-card';
  import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
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
  import hoverCardTranslations from '@shared/content/hover-card/translations.json';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(hoverCardTranslations);

  // ─── SEO + Analytics ─────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale: l,
      componentSlug: 'hover-card',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      aiIntent: t('seo.aiIntent'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: 'Overlay', item: '/components/overlay' },
        { name: 'HoverCard' },
      ],
    });
    track('docs_page_view', {
      component_name: 'hover-card',
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
        { id: 'importacao',   label: tContent('nav.import')        },
        { id: 'variantes',    label: tContent('nav.variants')      },
        { id: 'composicoes',  label: tContent('nav.compositions')  },
        { id: 'estados',      label: tContent('nav.states')        },
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
    track('docs_section_viewed', { section_id: id, component_name: 'hover-card', locale: $locale });
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
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";`;

  const codeImportUsage = `<HoverCard>
  <HoverCardTrigger>
    {#snippet child({ props })}
      <a href="/users/joana" {...props}>@joana</a>
    {/snippet}
  </HoverCardTrigger>
  <HoverCardContent side="bottom" align="start">
    <div class="flex gap-3">
      <Avatar>
        <AvatarImage src="/joana.jpg" alt="Joana" />
        <AvatarFallback>JS</AvatarFallback>
      </Avatar>
      <div>
        <p class="font-medium">Joana Silva</p>
        <p class="text-muted-foreground">Designer · 142 seguidores</p>
      </div>
    </div>
  </HoverCardContent>
</HoverCard>`;

  const codeDefault = `<HoverCard>
  <HoverCardTrigger>
    {#snippet child({ props })}
      <a href="/users/joana" {...props}>@joana</a>
    {/snippet}
  </HoverCardTrigger>
  <HoverCardContent>
    <!-- conteúdo -->
  </HoverCardContent>
</HoverCard>`;

  const codeWithDelay = `<HoverCard openDelay={500} closeDelay={200}>
  <HoverCardTrigger>
    {#snippet child({ props })}
      <a href="/link" {...props}>@joana</a>
    {/snippet}
  </HoverCardTrigger>
  <HoverCardContent>...</HoverCardContent>
</HoverCard>`;

  const interfaceCode = `// HoverCard (bits-ui/LinkPreview)
interface HoverCardProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  openDelay?: number;   // default 700ms
  closeDelay?: number;  // default 300ms
}

interface HoverCardContentProps {
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  alignOffset?: number;
}`;

  const propsTableCols = $derived({
    prop: $tStore('props.table.prop'),
    type: $tStore('props.table.type'),
    default: $tStore('props.table.default'),
    required: $tStore('props.table.required'),
    description: $tStore('props.table.description'),
  });
</script>

<DocsPageLayout navGroups={NAV_GROUPS} activeSection={section.value} componentSlug="hover-card">
  {#snippet header()}
    <DocsHeader
      title={$tStore('title')}
      description={$tStore('description')}
      category={$tStore('category')}
      type={$tStore('type')}
      installNote="npx shadcn-svelte@latest add hover-card"
    />
  {/snippet}

  <!-- ── Demonstração ───────────────────────────────────────────── -->
  <DocsDemonstration title={$tStore('demonstration.title')}>
    {#snippet children()}
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
        <!-- Profile preview -->
        <div class="space-y-2" style="contain: layout">
          <p class="text-xs font-medium text-muted-foreground">
            {$tStore('demonstration.labels.userProfile')}
          </p>
          <HoverCard openDelay={50} closeDelay={50} defaultOpen={true}>
            <HoverCardTrigger>
              {#snippet child({ props })}
                <a href="#joana" class="text-primary underline-offset-4 hover:underline" {...props}>@joana</a>
              {/snippet}
            </HoverCardTrigger>
            <HoverCardContent>
              <div class="flex gap-3">
                <Avatar>
                  <AvatarImage src="" alt="" />
                  <AvatarFallback>JS</AvatarFallback>
                </Avatar>
                <div class="flex flex-col">
                  <p class="font-medium text-sm">Joana Silva</p>
                  <p class="text-xs text-muted-foreground">Designer · 142 seguidores</p>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>

        <!-- Link preview -->
        <div class="space-y-2" style="contain: layout">
          <p class="text-xs font-medium text-muted-foreground">
            {$tStore('demonstration.labels.linkPreview')}
          </p>
          <HoverCard openDelay={50} closeDelay={50} defaultOpen={true}>
            <HoverCardTrigger>
              {#snippet child({ props })}
                <a href="#link" class="text-primary underline-offset-4 hover:underline" {...props}>design-system.dev</a>
              {/snippet}
            </HoverCardTrigger>
            <HoverCardContent>
              <div class="flex flex-col gap-2">
                <div class="flex items-center gap-2 text-xs text-muted-foreground">
                  <span class="inline-flex h-4 w-4 items-center justify-center rounded bg-muted">D</span>
                  <span>design-system.dev</span>
                </div>
                <p class="font-medium">Guia de overlays acessíveis</p>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>

        <!-- Definition -->
        <div class="space-y-2" style="contain: layout">
          <p class="text-xs font-medium text-muted-foreground">
            {$tStore('demonstration.labels.definitionTooltip')}
          </p>
          <HoverCard openDelay={50} closeDelay={50} defaultOpen={true}>
            <HoverCardTrigger>
              {#snippet child({ props })}
                <a href="#wcag" class="text-primary underline-offset-4 hover:underline" {...props}>WCAG 2.1</a>
              {/snippet}
            </HoverCardTrigger>
            <HoverCardContent>
              <p class="font-medium text-sm">WCAG 2.1</p>
              <p class="text-xs text-muted-foreground">
                Web Content Accessibility Guidelines: padrão internacional de acessibilidade.
              </p>
            </HoverCardContent>
          </HoverCard>
        </div>

        <!-- Metric -->
        <div class="space-y-2" style="contain: layout">
          <p class="text-xs font-medium text-muted-foreground">
            {$tStore('demonstration.labels.metricExplainer')}
          </p>
          <HoverCard openDelay={50} closeDelay={50} defaultOpen={true}>
            <HoverCardTrigger>
              {#snippet child({ props })}
                <a href="#metric" class="text-primary underline-offset-4 hover:underline" {...props}>3,42%</a>
              {/snippet}
            </HoverCardTrigger>
            <HoverCardContent>
              <p class="text-xs text-muted-foreground">Conversão (últimos 30d)</p>
              <p class="text-2xl font-semibold">3,42%</p>
              <p class="text-xs text-muted-foreground">Cliques no CTA / usuários únicos.</p>
            </HoverCardContent>
          </HoverCard>
        </div>
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
        { element: $tStore('usage.uxWriting.table.trigger.name'), rules: $tStore('usage.uxWriting.table.trigger.format'), do: $tStore('usage.uxWriting.table.trigger.good'), dont: $tStore('usage.uxWriting.table.trigger.bad') },
        { element: $tStore('usage.uxWriting.table.content.name'), rules: $tStore('usage.uxWriting.table.content.format'), do: $tStore('usage.uxWriting.table.content.good'), dont: $tStore('usage.uxWriting.table.content.bad') },
        { element: $tStore('usage.uxWriting.table.delay.name'),   rules: $tStore('usage.uxWriting.table.delay.format'),   do: $tStore('usage.uxWriting.table.delay.good'),   dont: $tStore('usage.uxWriting.table.delay.bad')   },
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
    <div class="text-sm space-y-1" style="contain: layout">
      <div class="text-primary underline">@joana</div>
      <div class="text-xs text-muted-foreground">+ link para /users/joana</div>
    </div>
  {/snippet}
  {#snippet dontPair1()}
    <div class="text-sm" style="contain: layout">
      <div class="text-primary underline">@joana</div>
      <div class="text-xs text-muted-foreground italic">apenas hover (touch users perdem)</div>
    </div>
  {/snippet}
  {#snippet doPair2()}
    <div class="text-sm font-mono" style="contain: layout">openDelay={'{500}'}</div>
  {/snippet}
  {#snippet dontPair2()}
    <div class="text-sm font-mono" style="contain: layout">openDelay={'{0}'}</div>
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
      { name: $tStore('variants.items.default'),   description: stripHtml($tStore('variants.styles.default')),   code: codeDefault,   preview: variantDefault   },
      { name: $tStore('variants.items.withDelay'), description: stripHtml($tStore('variants.styles.withDelay')), code: codeWithDelay, preview: variantWithDelay },
    ]}
  />

  {#snippet variantDefault()}
    <div class="text-xs font-mono text-muted-foreground" style="contain: layout">
      openDelay=700 / closeDelay=300
    </div>
  {/snippet}
  {#snippet variantWithDelay()}
    <div class="text-xs font-mono text-muted-foreground" style="contain: layout">
      openDelay=500 / closeDelay=200
    </div>
  {/snippet}

  <!-- ── Composições ─────────────────────────────────────────────── -->
  <DocsCompositions
    title={$tStore('variants.compositionsTitle')}
    useWhenLabel={$tNavStore('common.useWhen')}
    componentSlug="hover-card"
    items={[
      {
        name: $tStore('variants.compositions.userProfile.name'),
        description: $tStore('variants.compositions.userProfile.description'),
        useWhen: $tStore('variants.compositions.userProfile.use'),
        code: `<HoverCard openDelay={500} closeDelay={200}>
  <HoverCardTrigger>
    {#snippet child({ props })}
      <a href="/users/joana" {...props}>@joana</a>
    {/snippet}
  </HoverCardTrigger>
  <HoverCardContent>
    <div class="flex gap-3">
      <Avatar>
        <AvatarImage src="/joana.jpg" alt="" />
        <AvatarFallback>JS</AvatarFallback>
      </Avatar>
      <div class="flex flex-col">
        <p class="font-medium text-sm">Joana Silva</p>
        <p class="text-xs text-muted-foreground">Designer · 142 seguidores</p>
      </div>
    </div>
  </HoverCardContent>
</HoverCard>`,
        preview: compUserProfile,
      },
      {
        name: $tStore('variants.compositions.linkPreview.name'),
        description: $tStore('variants.compositions.linkPreview.description'),
        useWhen: $tStore('variants.compositions.linkPreview.use'),
        code: `<HoverCard openDelay={500} closeDelay={200}>
  <HoverCardTrigger>
    {#snippet child({ props })}
      <a href="https://design-system.dev" {...props}>design-system.dev</a>
    {/snippet}
  </HoverCardTrigger>
  <HoverCardContent>
    <div class="flex flex-col gap-2">
      <div class="flex items-center gap-2 text-xs text-muted-foreground">
        <span class="inline-flex h-4 w-4 items-center justify-center rounded bg-muted">D</span>
        <span>design-system.dev</span>
      </div>
      <p class="font-medium">Guia de overlays acessíveis</p>
    </div>
  </HoverCardContent>
</HoverCard>`,
        preview: compLinkPreview,
      },
      {
        name: $tStore('variants.compositions.definitionTooltip.name'),
        description: $tStore('variants.compositions.definitionTooltip.description'),
        useWhen: $tStore('variants.compositions.definitionTooltip.use'),
        code: `<HoverCard openDelay={400} closeDelay={150}>
  <HoverCardTrigger>
    {#snippet child({ props })}
      <button type="button" class="underline decoration-dotted underline-offset-4" {...props}>
        WCAG 2.1 AA
      </button>
    {/snippet}
  </HoverCardTrigger>
  <HoverCardContent>
    <p class="font-medium text-sm">WCAG 2.1 AA</p>
    <p class="text-xs text-muted-foreground">
      Web Content Accessibility Guidelines 2.1 — nível AA.
    </p>
  </HoverCardContent>
</HoverCard>`,
        preview: compDefinition,
      },
      {
        name: $tStore('variants.compositions.metricExplainer.name'),
        description: $tStore('variants.compositions.metricExplainer.description'),
        useWhen: $tStore('variants.compositions.metricExplainer.use'),
        code: `<HoverCard openDelay={400} closeDelay={150}>
  <HoverCardTrigger>
    {#snippet child({ props })}
      <button type="button" class="underline decoration-dotted underline-offset-4" {...props}>
        LCP 1.8s
      </button>
    {/snippet}
  </HoverCardTrigger>
  <HoverCardContent>
    <div class="flex items-baseline justify-between gap-2">
      <p class="text-sm font-medium">Largest Contentful Paint</p>
      <span class="text-xs font-medium text-emerald-600">1.8s</span>
    </div>
    <p class="text-xs text-muted-foreground">
      Tempo até o maior elemento visível. Bom: &lt;2.5s · Ruim: &gt;4s.
    </p>
  </HoverCardContent>
</HoverCard>`,
        preview: compMetric,
      },
    ]}
  />

  {#snippet compUserProfile()}
    <div style="contain: layout; min-height: 140px; position: relative;" class="w-full">
      <HoverCard openDelay={50} closeDelay={50} defaultOpen={true}>
        <HoverCardTrigger>
          {#snippet child({ props })}
            <a href="#joana" class="text-primary underline-offset-4 hover:underline" {...props}>@joana</a>
          {/snippet}
        </HoverCardTrigger>
        <HoverCardContent>
          <div class="flex gap-3">
            <Avatar>
              <AvatarImage src="" alt="" />
              <AvatarFallback>JS</AvatarFallback>
            </Avatar>
            <div class="flex flex-col">
              <p class="font-medium text-sm">Joana Silva</p>
              <p class="text-xs text-muted-foreground">Designer · 142 seguidores</p>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    </div>
  {/snippet}

  {#snippet compLinkPreview()}
    <div style="contain: layout; min-height: 140px; position: relative;" class="w-full">
      <HoverCard openDelay={50} closeDelay={50} defaultOpen={true}>
        <HoverCardTrigger>
          {#snippet child({ props })}
            <a href="#link" class="text-primary underline-offset-4 hover:underline" {...props}>design-system.dev</a>
          {/snippet}
        </HoverCardTrigger>
        <HoverCardContent>
          <div class="flex flex-col gap-2">
            <div class="flex items-center gap-2 text-xs text-muted-foreground">
              <span class="inline-flex h-4 w-4 items-center justify-center rounded bg-muted">D</span>
              <span>design-system.dev</span>
            </div>
            <p class="font-medium">Guia de overlays acessíveis</p>
          </div>
        </HoverCardContent>
      </HoverCard>
    </div>
  {/snippet}

  {#snippet compDefinition()}
    <div style="contain: layout; min-height: 140px; position: relative;" class="w-full">
      <HoverCard openDelay={50} closeDelay={50} defaultOpen={true}>
        <HoverCardTrigger>
          {#snippet child({ props })}
            <button
              type="button"
              class="bg-transparent border-0 p-0 text-primary text-sm font-medium underline decoration-dotted underline-offset-4 cursor-help"
              {...props}
            >
              WCAG 2.1 AA
            </button>
          {/snippet}
        </HoverCardTrigger>
        <HoverCardContent>
          <p class="font-medium text-sm">WCAG 2.1 AA</p>
          <p class="text-xs text-muted-foreground">
            Web Content Accessibility Guidelines 2.1 — nível AA. Contraste mínimo 4.5:1 e operação por teclado.
          </p>
        </HoverCardContent>
      </HoverCard>
    </div>
  {/snippet}

  {#snippet compMetric()}
    <div style="contain: layout; min-height: 140px; position: relative;" class="w-full">
      <HoverCard openDelay={50} closeDelay={50} defaultOpen={true}>
        <HoverCardTrigger>
          {#snippet child({ props })}
            <button
              type="button"
              class="bg-transparent border-0 p-0 text-primary text-sm font-medium underline decoration-dotted underline-offset-4 cursor-help"
              {...props}
            >
              LCP 1.8s
            </button>
          {/snippet}
        </HoverCardTrigger>
        <HoverCardContent>
          <div class="flex items-baseline justify-between gap-2">
            <p class="text-sm font-medium">Largest Contentful Paint</p>
            <span class="text-xs font-medium text-emerald-600">1.8s</span>
          </div>
          <p class="text-xs text-muted-foreground">
            Tempo até o maior elemento visível ser renderizado. Bom: &lt;2.5s · Ruim: &gt;4s.
          </p>
        </HoverCardContent>
      </HoverCard>
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
      { label: $tStore('states.items.closed'),     trigger: 'defaultOpen={false}',  behavior: stripHtml($tStore('states.descriptions.closed'))     },
      { label: $tStore('states.items.open'),       trigger: 'defaultOpen={true}',   behavior: stripHtml($tStore('states.descriptions.open'))       },
      { label: $tStore('states.items.controlled'), trigger: 'open + onOpenChange',  behavior: stripHtml($tStore('states.descriptions.controlled')) },
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
          { name: 'openDelay',    type: $tStore('props.table.openDelay.type'),    defaultValue: $tStore('props.table.openDelay.default'),    required: $tStore('props.table.openDelay.required'),    description: $tStore('props.table.openDelay.description')    },
          { name: 'closeDelay',   type: $tStore('props.table.closeDelay.type'),   defaultValue: $tStore('props.table.closeDelay.default'),   required: $tStore('props.table.closeDelay.required'),   description: $tStore('props.table.closeDelay.description')   },
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
      { token: '--popover',            value: $tStore('tokens.table.background.class'), description: $tStore('tokens.table.background.part') },
      { token: '--popover-foreground', value: $tStore('tokens.table.foreground.class'), description: $tStore('tokens.table.foreground.part') },
      { token: '--foreground/10',      value: $tStore('tokens.table.border.class'),     description: $tStore('tokens.table.border.part')     },
      { token: 'shadow',               value: $tStore('tokens.table.shadow.class'),     description: $tStore('tokens.table.shadow.part')     },
      { token: '--radius',             value: $tStore('tokens.table.rounded.class'),    description: $tStore('tokens.table.rounded.part')    },
      { token: 'spacing',              value: $tStore('tokens.table.padding.class'),    description: $tStore('tokens.table.padding.part')    },
      { token: 'size',                 value: $tStore('tokens.table.width.class'),      description: $tStore('tokens.table.width.part')      },
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
      { key: 'Tab',       description: stripHtml($tStore('accessibility.keyboard.tab'))      },
      { key: 'Esc',       description: stripHtml($tStore('accessibility.keyboard.escape'))   },
      { key: 'Shift+Tab', description: stripHtml($tStore('accessibility.keyboard.shiftTab')) },
      { key: 'Enter',     description: stripHtml($tStore('accessibility.keyboard.enter'))    },
    ]}
  />

  <!-- ── Relacionados ───────────────────────────────────────────── -->
  <DocsRelated
    title={$tStore('related.title')}
    items={[
      { name: $tStore('related.items.tooltip.name'),      description: $tStore('related.items.tooltip.description'),      path: '?path=/docs/ui-tooltip--docs'      },
      { name: $tStore('related.items.popover.name'),      description: $tStore('related.items.popover.description'),      path: '?path=/docs/ui-popover--docs'      },
      { name: $tStore('related.items.dropdownMenu.name'), description: $tStore('related.items.dropdownMenu.description'), path: '?path=/docs/ui-dropdownmenu--docs' },
      { name: $tStore('related.items.card.name'),         description: $tStore('related.items.card.description'),         path: '?path=/docs/ui-card--docs'         },
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
      { event: 'hover_card_open',  trigger: 'onOpenChange(true)',  payload: "{ component: 'hover-card', location, label }" },
      { event: 'hover_card_close', trigger: 'onOpenChange(false)', payload: "{ component: 'hover-card', location, label }" },
      { event: '—',                trigger: stripHtml($tStore('analytics.description')), payload: '—' },
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
      items: [1, 2, 3, 4, 5, 6].map((i) => ({
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
        { criterion: stripHtml($tStore('testes.accessibility.item1')), level: 'AA',     how: 'axe-core'           },
        { criterion: stripHtml($tStore('testes.accessibility.item2')), level: '4.1.2',  how: 'DevTools a11y tree' },
        { criterion: stripHtml($tStore('testes.accessibility.item3')), level: '1.4.13', how: 'Keyboard test'      },
        { criterion: stripHtml($tStore('testes.accessibility.item4')), level: '1.4.13', how: 'Keyboard test'      },
        { criterion: stripHtml($tStore('testes.accessibility.item5')), level: '1.4.3',  how: 'Contrast checker'   },
        { criterion: stripHtml($tStore('testes.accessibility.item6')), level: 'AA',     how: 'Manual review'      },
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
