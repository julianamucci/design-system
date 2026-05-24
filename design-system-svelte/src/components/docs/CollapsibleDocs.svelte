<script lang="ts">
  import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
  import { ChevronDown, Settings2, Filter, Settings } from 'lucide-svelte';
  import { locale, useTranslation } from '@/lib/i18n';
  import { applySeo } from '@/lib/use-seo';
  import { track } from '@/lib/analytics';
  import { createActiveSection } from '@/lib/use-active-section.svelte';
  import { sanitizeHtml } from '@/lib/sanitize-html';
  import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.svelte';
  import {
    DocsHeader,
    DocsDemonstration,
    DocsAnatomy,
    DocsWhenToUse,
    DocsDoDont,
    DocsImport,
    DocsVariants,
    DocsCompositions,
    DocsStates,
    DocsProps,
    DocsTokens,
    DocsAccessibility,
    DocsRelated,
    DocsNotes,
    DocsAnalytics,
    DocsTestes,
  } from '@/components/docs/shared/sections';
  import uiTranslations from '@/i18n/ui.json';
  import collapsibleTranslations from '@shared/content/collapsible/translations.json';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(collapsibleTranslations);

  // ─── SEO + Analytics ─────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale: l,
      componentSlug: 'collapsible',
    });
    track('docs_page_view', {
      component_name: 'collapsible',
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
    track('docs_section_viewed', { section_id: id, component_name: 'collapsible', locale: $locale });
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

  // ─── Demo states ─────────────────────────────────────────────────────────────

  let demoOpen = $state(false);
  let controlledOpen = $state(false);

  // ─── Code strings ────────────────────────────────────────────────────────────

  const codeImportBasic = `import * as Collapsible from '@/components/ui/collapsible';
// ou:
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';`;

  const codeImportWithButton = `import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-svelte';`;

  const codeUncontrolled = `<Collapsible>
  <CollapsibleTrigger class="flex items-center gap-2 ...">
    Exibir filtros avançados
    <ChevronDown aria-hidden="true" class="h-4 w-4 transition-transform [[data-state=open]_&]:rotate-180" />
  </CollapsibleTrigger>
  <CollapsibleContent>
    <div class="...">Conteúdo colapsável</div>
  </CollapsibleContent>
</Collapsible>`;

  const codeControlled = `<script lang="ts">
  let open = $state(false);
<\/script>

<Collapsible bind:open>
  <CollapsibleTrigger>
    {open ? 'Ocultar' : 'Exibir'} filtros avançados
  </CollapsibleTrigger>
  <CollapsibleContent>
    <div>Conteúdo colapsável</div>
  </CollapsibleContent>
</Collapsible>`;

  const codeCustomizationTokens = `/* Em globals.css */
:root {
  --radius: 0.5rem;
  --border: oklch(0.92 0 0);
  --muted: oklch(0.96 0 0);
}`;

  const interfaceCode = `// Collapsible (Root)
interface CollapsibleProps {
  open?: boolean;        // bind:open — modo controlado
  defaultOpen?: boolean; // modo não-controlado
  disabled?: boolean;
  class?: string;
  children?: Snippet;
}

// CollapsibleTrigger
interface CollapsibleTriggerProps {
  disabled?: boolean;
  class?: string;
  children?: Snippet;
}

// CollapsibleContent
interface CollapsibleContentProps {
  class?: string;
  children?: Snippet;
}`;
</script>

<DocsPageLayout navGroups={NAV_GROUPS} activeSection={section.value} componentSlug="collapsible">
  {#snippet header()}
    <DocsHeader
      title={$tStore('title')}
      description={$tStore('description')}
      category={$tStore('category')}
      type={$tStore('type')}
      installNote="npx shadcn-svelte@latest add collapsible"
    />
  {/snippet}

  <!-- ── Demonstração ─────────────────────────────────────────────── -->
  <DocsDemonstration title={$tStore('demonstration.title')}>
    {#snippet children()}
      <div class="w-full space-y-6">
        <!-- Demo 1: Não-controlado (padrão) -->
        <div class="space-y-2">
          <p class="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Não-controlado
          </p>
          <Collapsible class="w-full">
            <CollapsibleTrigger
              class="flex w-full items-center justify-between rounded-md border border-border bg-card px-4 py-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {$tStore('demonstration.labels.headerLabel')}
              <ChevronDown
                aria-hidden="true"
                class="h-4 w-4 shrink-0 text-muted-foreground transition-transform [[data-state=open]_&]:rotate-180"
              />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div class="rounded-md border border-border bg-muted/50 px-4 py-3 text-sm mt-2 space-y-1">
                <p>{$tStore('demonstration.labels.advancedFilter1')}</p>
                <p>{$tStore('demonstration.labels.advancedFilter2')}</p>
              </div>
            </CollapsibleContent>
          </Collapsible>
          <p class="text-xs text-muted-foreground">{$tStore('demonstration.labels.basicFilter')}</p>
        </div>

        <!-- Demo 2: Controlado -->
        <div class="space-y-2">
          <p class="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Controlado
          </p>
          <Collapsible bind:open={controlledOpen} class="w-full">
            <CollapsibleTrigger
              class="flex w-full items-center justify-between rounded-md border border-border bg-card px-4 py-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {controlledOpen
                ? $tStore('demonstration.labels.triggerOpen')
                : $tStore('demonstration.labels.triggerClosed')}
              <ChevronDown
                aria-hidden="true"
                class="h-4 w-4 shrink-0 text-muted-foreground transition-transform [[data-state=open]_&]:rotate-180"
              />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div class="rounded-md border border-border bg-muted/50 px-4 py-3 text-sm mt-2 space-y-1">
                <p>{$tStore('demonstration.labels.advancedFilter1')}</p>
                <p>{$tStore('demonstration.labels.advancedFilter2')}</p>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <!-- Demo 3: Desabilitado -->
        <div class="space-y-2">
          <p class="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Desabilitado
          </p>
          <Collapsible disabled class="w-full">
            <CollapsibleTrigger
              disabled
              class="flex w-full items-center justify-between rounded-md border border-border bg-card px-4 py-3 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50"
            >
              {$tStore('demonstration.labels.triggerClosed')}
              <ChevronDown
                aria-hidden="true"
                class="h-4 w-4 shrink-0 text-muted-foreground"
              />
            </CollapsibleTrigger>
          </Collapsible>
        </div>
      </div>
    {/snippet}
  </DocsDemonstration>

  <!-- ── Anatomia ──────────────────────────────────────────────────── -->
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

  <!-- ── Quando Usar ───────────────────────────────────────────────── -->
  <DocsWhenToUse
    title={$tStore('usage.title')}
    guidelines={{
      title: $tStore('usage.guidelines.title'),
      items: [
        $tStore('usage.guidelines.item1'),
        $tStore('usage.guidelines.item2'),
        $tStore('usage.guidelines.item3'),
        $tStore('usage.guidelines.item4'),
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
        { s: $tStore('usage.scenarios.item6.s'), u: $tStore('usage.scenarios.item6.u'), a: $tStore('usage.scenarios.item6.a') },
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

  <!-- ── Do & Don't ────────────────────────────────────────────────── -->
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
    <Collapsible class="w-full">
      <CollapsibleTrigger
        class="flex w-full items-center justify-between rounded-md border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
      >
        {$tStore('demonstration.labels.triggerClosed')}
        <ChevronDown aria-hidden="true" class="h-4 w-4 shrink-0" />
      </CollapsibleTrigger>
    </Collapsible>
  {/snippet}
  {#snippet dontPair1()}
    <Collapsible class="w-full">
      <CollapsibleTrigger
        class="flex w-full items-center justify-between rounded-md border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
      >
        Ver mais
        <ChevronDown aria-hidden="true" class="h-4 w-4 shrink-0" />
      </CollapsibleTrigger>
    </Collapsible>
  {/snippet}
  {#snippet doPair2()}
    <Collapsible class="w-full">
      <CollapsibleTrigger
        class="flex w-full items-center justify-between rounded-md border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
      >
        {$tStore('demonstration.labels.headerLabel')}
        <ChevronDown aria-hidden="true" class="h-4 w-4 shrink-0" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div class="rounded-md border border-border bg-muted/50 px-4 py-2 text-sm mt-1">
          {$tStore('demonstration.labels.advancedFilter1')}
        </div>
      </CollapsibleContent>
    </Collapsible>
  {/snippet}
  {#snippet dontPair2()}
    <div class="w-full space-y-1">
      {#each [1, 2] as i}
        <Collapsible class="w-full">
          <CollapsibleTrigger
            class="flex w-full items-center justify-between rounded-md border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
          >
            Seção {i}
            <ChevronDown aria-hidden="true" class="h-4 w-4 shrink-0" />
          </CollapsibleTrigger>
        </Collapsible>
      {/each}
    </div>
  {/snippet}

  <!-- ── Importação ────────────────────────────────────────────────── -->
  <DocsImport
    title={$tStore('import.title')}
    description={$tStore('import.basic')}
    code={codeImportBasic}
    secondaryDescription={$tStore('import.withButton')}
    secondaryCode={codeImportWithButton}
  />

  <!-- ── Variantes ─────────────────────────────────────────────────── -->
  <DocsVariants
    title={$tStore('variants.title')}
    componentSlug="collapsible"
    items={[
      {
        name: 'uncontrolled',
        description: stripHtml($tStore('variants.items.uncontrolled')),
        code: codeUncontrolled,
        preview: variantUncontrolled,
      },
      {
        name: 'controlled',
        description: stripHtml($tStore('variants.items.controlled')),
        code: codeControlled,
        preview: variantControlled,
      },
    ]}
  />

  {#snippet variantUncontrolled()}
    <Collapsible class="w-full">
      <CollapsibleTrigger
        class="flex w-full items-center justify-between rounded-md border border-border bg-card px-4 py-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {$tStore('demonstration.labels.triggerClosed')}
        <ChevronDown
          aria-hidden="true"
          class="h-4 w-4 shrink-0 text-muted-foreground transition-transform [[data-state=open]_&]:rotate-180"
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div class="rounded-md border border-border bg-muted/50 px-4 py-3 text-sm mt-2">
          {$tStore('demonstration.labels.advancedFilter1')}
        </div>
      </CollapsibleContent>
    </Collapsible>
  {/snippet}

  {#snippet variantControlled()}
    <Collapsible bind:open={demoOpen} class="w-full">
      <CollapsibleTrigger
        class="flex w-full items-center justify-between rounded-md border border-border bg-card px-4 py-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {demoOpen
          ? $tStore('demonstration.labels.triggerOpen')
          : $tStore('demonstration.labels.triggerClosed')}
        <ChevronDown
          aria-hidden="true"
          class="h-4 w-4 shrink-0 text-muted-foreground transition-transform [[data-state=open]_&]:rotate-180"
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div class="rounded-md border border-border bg-muted/50 px-4 py-3 text-sm mt-2">
          {$tStore('demonstration.labels.advancedFilter1')}
        </div>
      </CollapsibleContent>
    </Collapsible>
  {/snippet}

  <!-- ── Composições ──────────────────────────────────────────────── -->
  <DocsCompositions
    title={$tStore('variants.compositionsTitle')}
    useWhenLabel={$tNavStore('common.useWhen')}
    componentSlug="collapsible"
    items={[
      {
        name: $tStore('variants.compositions.customButton.name'),
        description: $tStore('variants.compositions.customButton.description'),
        useWhen: $tStore('variants.compositions.customButton.use'),
        code: `<Collapsible class="w-full max-w-sm">
  <CollapsibleTrigger class="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-transparent px-4 py-2 text-sm font-medium hover:bg-accent">
    Exibir opções avançadas
  </CollapsibleTrigger>
  <CollapsibleContent>
    <div class="mt-2 rounded-md bg-muted/50 p-4 text-sm space-y-2">
      <p>Primeira opção avançada.</p>
      <p>Segunda opção avançada.</p>
      <p>Terceira opção avançada.</p>
    </div>
  </CollapsibleContent>
</Collapsible>`,
        preview: compCustomButton,
      },
      {
        name: $tStore('variants.compositions.iconTrigger.name'),
        description: $tStore('variants.compositions.iconTrigger.description'),
        useWhen: $tStore('variants.compositions.iconTrigger.use'),
        code: `<Collapsible class="w-full">
  <CollapsibleTrigger class="flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-accent">
    <Filter aria-hidden="true" class="h-4 w-4" />
    Filtros avançados
  </CollapsibleTrigger>
  <CollapsibleContent>
    <div class="mt-2 rounded-md bg-muted/50 p-4 text-sm space-y-1">
      <p>Categoria</p>
      <p>Preço</p>
      <p>Disponibilidade</p>
    </div>
  </CollapsibleContent>
</Collapsible>`,
        preview: compIconTrigger,
      },
      {
        name: $tStore('variants.compositions.rotatingChevron.name'),
        description: $tStore('variants.compositions.rotatingChevron.description'),
        useWhen: $tStore('variants.compositions.rotatingChevron.use'),
        code: `<Collapsible class="w-full">
  <CollapsibleTrigger class="flex w-full items-center justify-between rounded-md border border-border bg-card px-4 py-3 text-sm font-medium hover:bg-accent">
    Configurações avançadas
    <ChevronDown aria-hidden="true" class="h-4 w-4 transition-transform [[data-state=open]_&]:rotate-180" />
  </CollapsibleTrigger>
  <CollapsibleContent>
    <div class="mt-2 rounded-md bg-muted/50 p-4 text-sm space-y-2">
      <div class="flex justify-between"><span class="text-muted-foreground">Timeout</span><span>30s</span></div>
      <div class="flex justify-between"><span class="text-muted-foreground">Retries</span><span>3</span></div>
    </div>
  </CollapsibleContent>
</Collapsible>`,
        preview: compRotatingChevron,
      },
      {
        name: $tStore('variants.compositions.richContent.name'),
        description: $tStore('variants.compositions.richContent.description'),
        useWhen: $tStore('variants.compositions.richContent.use'),
        code: `<Collapsible class="w-full">
  <CollapsibleTrigger class="flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-accent">
    <Settings aria-hidden="true" class="h-4 w-4" />
    Configurações do sistema
  </CollapsibleTrigger>
  <CollapsibleContent>
    <div class="mt-2 rounded-md bg-muted/50 p-4 text-sm space-y-3">
      <p class="text-muted-foreground">Selecione as opções desejadas.</p>
      <label class="flex items-center gap-2"><input type="checkbox" /> Notificações por e-mail</label>
      <label class="flex items-center gap-2"><input type="checkbox" /> Sincronização automática</label>
      <label class="flex items-center gap-2"><input type="checkbox" /> Modo escuro</label>
    </div>
  </CollapsibleContent>
</Collapsible>`,
        preview: compRichContent,
      },
    ]}
  />

  {#snippet compCustomButton()}
    <Collapsible class="w-full max-w-sm">
      <CollapsibleTrigger
        class="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Exibir opções avançadas
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div class="mt-2 rounded-md bg-muted/50 p-4 text-sm space-y-2">
          <p>Primeira opção avançada disponível.</p>
          <p>Segunda opção avançada disponível.</p>
          <p>Terceira opção avançada disponível.</p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  {/snippet}

  {#snippet compIconTrigger()}
    <Collapsible class="w-full">
      <CollapsibleTrigger
        class="flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Filter aria-hidden="true" class="h-4 w-4 text-muted-foreground" />
        Filtros avançados
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div class="mt-2 rounded-md bg-muted/50 p-4 text-sm space-y-1">
          <p>Categoria</p>
          <p>Preço</p>
          <p>Disponibilidade</p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  {/snippet}

  {#snippet compRotatingChevron()}
    <Collapsible class="w-full">
      <CollapsibleTrigger
        class="flex w-full items-center justify-between rounded-md border border-border bg-card px-4 py-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Configurações avançadas
        <ChevronDown
          aria-hidden="true"
          class="h-4 w-4 shrink-0 text-muted-foreground transition-transform [[data-state=open]_&]:rotate-180"
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div class="mt-2 rounded-md bg-muted/50 p-4 text-sm space-y-2">
          <div class="flex justify-between"><span class="text-muted-foreground">Timeout</span><span>30s</span></div>
          <div class="flex justify-between"><span class="text-muted-foreground">Retries</span><span>3</span></div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  {/snippet}

  {#snippet compRichContent()}
    <Collapsible class="w-full">
      <CollapsibleTrigger
        class="flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Settings aria-hidden="true" class="h-4 w-4 text-muted-foreground" />
        Configurações do sistema
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div class="mt-2 rounded-md bg-muted/50 p-4 text-sm space-y-3">
          <p class="text-muted-foreground text-xs">Selecione as opções desejadas.</p>
          <label class="flex items-center gap-2"><input type="checkbox" class="rounded border-border" /> Notificações por e-mail</label>
          <label class="flex items-center gap-2"><input type="checkbox" class="rounded border-border" /> Sincronização automática</label>
          <label class="flex items-center gap-2"><input type="checkbox" class="rounded border-border" /> Modo escuro</label>
        </div>
      </CollapsibleContent>
    </Collapsible>
  {/snippet}

  <!-- ── Estados ───────────────────────────────────────────────────── -->
  <DocsStates
    title={$tStore('states.title')}
    cols={{
      state: $tStore('states.cols.state'),
      trigger: $tStore('states.cols.trigger'),
      behavior: $tStore('states.cols.behavior'),
    }}
    items={[
      {
        label: $tStore('states.closed.label'),
        trigger: stripHtml($tStore('states.closed.trigger')),
        behavior: $tStore('states.closed.behavior'),
      },
      {
        label: $tStore('states.open.label'),
        trigger: stripHtml($tStore('states.open.trigger')),
        behavior: $tStore('states.open.behavior'),
      },
      {
        label: $tStore('states.defaultOpen.label'),
        trigger: stripHtml($tStore('states.defaultOpen.trigger')),
        behavior: $tStore('states.defaultOpen.behavior'),
      },
      {
        label: $tStore('states.disabled.label'),
        trigger: stripHtml($tStore('states.disabled.trigger')),
        behavior: stripHtml($tStore('states.disabled.behavior')),
      },
    ]}
  />

  <!-- ── Propriedades ──────────────────────────────────────────────── -->
  <DocsProps
    title={$tStore('props.title')}
    tables={[
      {
        title: $tStore('props.collapsibleTitle'),
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'open',          type: 'boolean',              defaultValue: '—',     required: 'Não', description: $tStore('props.table.open')          },
          { name: 'defaultOpen',   type: 'boolean',              defaultValue: 'false', required: 'Não', description: $tStore('props.table.defaultOpen')    },
          { name: 'disabled',      type: 'boolean',              defaultValue: 'false', required: 'Não', description: $tStore('props.table.disabled')        },
          { name: 'class',         type: 'string',               defaultValue: '—',     required: 'Não', description: $tStore('props.table.className')       },
          { name: 'children',      type: 'Snippet',              defaultValue: '—',     required: 'Não', description: $tStore('props.table.children')        },
        ],
      },
      {
        title: $tStore('props.triggerTitle'),
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'disabled',  type: 'boolean', defaultValue: 'false', required: 'Não', description: $tStore('props.table.disabled')  },
          { name: 'class',     type: 'string',  defaultValue: '—',     required: 'Não', description: $tStore('props.table.className') },
          { name: 'children',  type: 'Snippet', defaultValue: '—',     required: 'Não', description: $tStore('props.table.children')  },
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
          { name: 'class',    type: 'string',  defaultValue: '—', required: 'Não', description: $tStore('props.table.className') },
          { name: 'children', type: 'Snippet', defaultValue: '—', required: 'Não', description: $tStore('props.table.children')  },
        ],
      },
    ]}
    interfaceCode={interfaceCode}
    extensibilityTitle={$tStore('props.extensibilityTitle')}
    extensibilityNotes={$tStore('props.extensibility')}
  />

  <!-- ── Tokens ────────────────────────────────────────────────────── -->
  <DocsTokens
    title={$tStore('tokens.title')}
    cols={{
      token: $tStore('tokens.table.token'),
      value: $tStore('tokens.table.class'),
      description: $tStore('tokens.table.part'),
    }}
    items={[
      { token: '--border',     value: 'border',                    description: $tStore('tokens.table.border')       },
      { token: '--background', value: 'bg-background',             description: $tStore('tokens.table.background')   },
      { token: '--radius',     value: 'rounded-md',                description: $tStore('tokens.table.radius')       },
      { token: '--accent',     value: 'hover:bg-accent',           description: $tStore('tokens.table.triggerHover') },
      { token: '--ring',       value: 'focus-visible:ring-2',      description: $tStore('tokens.table.triggerFocus') },
      { token: '—',            value: 'transition-[height]',       description: $tStore('tokens.table.transition')   },
    ]}
    customizationTitle={$tStore('tokens.customizationTitle')}
    customizationCode={codeCustomizationTokens}
  />

  <!-- ── Acessibilidade ────────────────────────────────────────────── -->
  <DocsAccessibility
    title={$tStore('accessibility.title')}
    summary={$tStore('accessibility.summary')}
    items={[
      $tStore('accessibility.item1'),
      $tStore('accessibility.item2'),
      $tStore('accessibility.item3'),
      $tStore('accessibility.item4'),
      $tStore('accessibility.item5'),
    ]}
    keyboardTitle={$tStore('accessibility.keyboardTitle')}
    keyboardItems={[
      { key: 'Tab',   description: $tStore('accessibility.keyboard.tab')     },
      { key: 'Enter', description: $tStore('accessibility.keyboard.enter')   },
      { key: 'Space', description: $tStore('accessibility.keyboard.space')   },
      { key: '—',     description: $tStore('accessibility.keyboard.noArrow') },
    ]}
  />

  <!-- ── Relacionados ──────────────────────────────────────────────── -->
  <DocsRelated
    title={$tStore('related.title')}
    items={[
      { name: 'Accordion', description: $tStore('related.accordion'), path: '?path=/docs/ui-accordion--docs' },
      { name: 'Sheet',     description: $tStore('related.sheet'),     path: '?path=/docs/ui-sheet--docs'     },
      { name: 'Button',    description: $tStore('related.button'),    path: '?path=/docs/ui-button--docs'    },
      { name: 'Tabs',      description: $tStore('related.tabs'),      path: '?path=/docs/ui-tabs--docs'      },
    ]}
  />

  <!-- ── Notas ─────────────────────────────────────────────────────── -->
  <DocsNotes
    title={$tStore('notes.title')}
    items={[
      { title: '', content: $tStore('notes.tip1') },
      { title: '', content: $tStore('notes.tip2') },
      { title: '', content: $tStore('notes.tip3') },
    ]}
  />

  <!-- ── Analytics ─────────────────────────────────────────────────── -->
  <DocsAnalytics
    title={$tStore('analytics.title')}
    cols={{
      event: $tStore('analytics.table.event'),
      trigger: $tStore('analytics.table.trigger'),
      payload: $tStore('analytics.table.payload'),
    }}
    items={[
      { event: $tStore('analytics.table.toggle'),      trigger: $tStore('analytics.table.toggleTrigger'),      payload: $tStore('analytics.table.togglePayload')      },
      { event: $tStore('analytics.table.pageView'),    trigger: $tStore('analytics.table.pageViewTrigger'),    payload: $tStore('analytics.table.pageViewPayload')    },
      { event: $tStore('analytics.table.sectionViewed'), trigger: $tStore('analytics.table.sectionViewedTrigger'), payload: $tStore('analytics.table.sectionViewedPayload') },
      { event: $tStore('analytics.table.langSwitch'),  trigger: $tStore('analytics.table.langSwitchTrigger'),  payload: $tStore('analytics.table.langSwitchPayload')  },
    ]}
  />

  <!-- ── Testes ────────────────────────────────────────────────────── -->
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
        { criterion: $tStore('testes.accessibility.item1.criterion'), level: $tStore('testes.accessibility.item1.level'), how: $tStore('testes.accessibility.item1.how') },
        { criterion: $tStore('testes.accessibility.item2.criterion'), level: $tStore('testes.accessibility.item2.level'), how: $tStore('testes.accessibility.item2.how') },
        { criterion: $tStore('testes.accessibility.item3.criterion'), level: $tStore('testes.accessibility.item3.level'), how: $tStore('testes.accessibility.item3.how') },
        { criterion: $tStore('testes.accessibility.item4.criterion'), level: $tStore('testes.accessibility.item4.level'), how: $tStore('testes.accessibility.item4.how') },
        { criterion: $tStore('testes.accessibility.item5.criterion'), level: $tStore('testes.accessibility.item5.level'), how: $tStore('testes.accessibility.item5.how') },
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
