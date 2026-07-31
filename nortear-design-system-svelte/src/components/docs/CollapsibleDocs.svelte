<script lang="ts">
  import { untrack } from 'svelte';
  import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import Filter from '@lucide/svelte/icons/funnel';
  import Settings from '@lucide/svelte/icons/settings';
  import { locale, useTranslation } from '@/lib/i18n';
  import { applySeo } from '@/lib/use-seo';
  import { track } from '@/lib/analytics';
  import { createActiveSection } from '@/lib/use-active-section.svelte';
  import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.svelte';
  import {
    DocsHeader,
    DocsDemonstration,
    DocsAnatomy,
    DocsWhenToUse,
    DocsDoDont,
    DocsImport,
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

  const sectionIds = untrack(() => NAV_GROUPS.flatMap(g => g.sections.map(s => s.id)));
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
import ChevronDown from '@lucide/svelte/icons/chevron-down';`;

  const codeUncontrolled = `<Collapsible class="nds-w-full">
  <CollapsibleTrigger class="nds-cluster nds-w-full nds-rounded-md nds-border-default nds-bg-background nds-px-4 nds-py-2 nds-text-body nds-font-medium nds-hover-bg-accent" data-justify="between">
    Exibir filtros avançados
    <ChevronDown aria-hidden="true" class="nds-icon nds-shrink-0 nds-transition-transform nds-chevron" />
  </CollapsibleTrigger>
  <CollapsibleContent>
    <div class="nds-rounded-md nds-border-default nds-bg-muted-soft nds-p-4 nds-text-body nds-stack nds-mt-2" data-spacing="sm">Conteúdo colapsável</div>
  </CollapsibleContent>
</Collapsible>`;

  const codeControlled = `<script lang="ts">
  let open = $state(false);
<\/script>

<Collapsible bind:open class="nds-w-full">
  <CollapsibleTrigger class="nds-cluster nds-w-full nds-rounded-md nds-border-default nds-bg-background nds-px-4 nds-py-2 nds-text-body nds-font-medium nds-hover-bg-accent" data-justify="between">
    {open ? 'Ocultar' : 'Exibir'} filtros avançados
  </CollapsibleTrigger>
  <CollapsibleContent>
    <div class="nds-rounded-md nds-border-default nds-bg-muted-soft nds-p-4 nds-text-body nds-stack nds-mt-2" data-spacing="sm">Conteúdo colapsável</div>
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
    />
  {/snippet}

  <!-- ── Demonstração ─────────────────────────────────────────────── -->
  <DocsDemonstration title={$tStore('demonstration.title')}>
    <div class="nds-w-full nds-stack" data-spacing="xl">
      <!-- Demo 1: Não-controlado (padrão) -->
      <div class="nds-stack" data-spacing="sm">
        <p class="nds-text-body nds-font-medium">
          Não-controlado
        </p>
        <Collapsible class="nds-w-full" onOpenChange={(o: boolean) => track('collapsible_toggle', { label: 'header-label', value: o ? 'open' : 'closed', location: 'docs_demo' })}>
          <CollapsibleTrigger
            class="nds-cluster nds-w-full nds-rounded-md nds-border-default nds-bg-background nds-px-4 nds-py-2 nds-text-body nds-font-medium nds-hover-bg-accent" data-justify="between"
          >
            {$tStore('demonstration.labels.headerLabel')}
            <ChevronDown
              aria-hidden="true"
              class="nds-icon nds-shrink-0 nds-transition-transform nds-chevron"
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div class="nds-rounded-md nds-border-default nds-bg-muted-soft nds-p-4 nds-text-body nds-stack nds-mt-2" data-spacing="sm">
              <p>{$tStore('demonstration.labels.advancedFilter1')}</p>
              <p>{$tStore('demonstration.labels.advancedFilter2')}</p>
            </div>
          </CollapsibleContent>
        </Collapsible>
        <p class="nds-text-caption nds-text-muted-foreground">{$tStore('demonstration.labels.basicFilter')}</p>
      </div>

      <!-- Demo 2: Controlado -->
      <div class="nds-stack" data-spacing="sm">
        <p class="nds-text-body nds-font-medium">
          Controlado
        </p>
        <Collapsible bind:open={controlledOpen} class="nds-w-full" onOpenChange={(o: boolean) => track('collapsible_toggle', { label: 'trigger-closed', value: o ? 'open' : 'closed', location: 'docs_demo' })}>
          <CollapsibleTrigger
            class="nds-cluster nds-w-full nds-rounded-md nds-border-default nds-bg-background nds-px-4 nds-py-2 nds-text-body nds-font-medium nds-hover-bg-accent" data-justify="between"
          >
            {controlledOpen
              ? $tStore('demonstration.labels.triggerOpen')
              : $tStore('demonstration.labels.triggerClosed')}
            <ChevronDown
              aria-hidden="true"
              class="nds-icon nds-shrink-0 nds-transition-transform nds-chevron"
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div class="nds-rounded-md nds-border-default nds-bg-muted-soft nds-p-4 nds-text-body nds-stack nds-mt-2" data-spacing="sm">
              <p>{$tStore('demonstration.labels.advancedFilter1')}</p>
              <p>{$tStore('demonstration.labels.advancedFilter2')}</p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      <!-- Demo 3: Desabilitado -->
      <div class="nds-stack" data-spacing="sm">
        <p class="nds-text-body nds-font-medium">
          Desabilitado
        </p>
        <Collapsible disabled class="nds-w-full">
          <CollapsibleTrigger
            disabled
            class="nds-cluster nds-w-full nds-rounded-md nds-border-default nds-bg-background nds-px-4 nds-py-2 nds-text-body nds-font-medium"
            data-justify="between"
            style="opacity: 0.5; cursor: not-allowed"
          >
            {$tStore('demonstration.labels.triggerClosed')}
            <ChevronDown
              aria-hidden="true"
              class="nds-icon nds-shrink-0"
            />
          </CollapsibleTrigger>
        </Collapsible>
      </div>
    </div>
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
    <Collapsible class="nds-w-full">
      <CollapsibleTrigger
        class="nds-cluster nds-w-full nds-rounded-md nds-border-default nds-bg-background nds-px-4 nds-py-2 nds-text-body nds-font-medium nds-hover-bg-accent" data-justify="between"
      >
        {$tStore('demonstration.labels.triggerClosed')}
        <ChevronDown aria-hidden="true" class="nds-icon nds-shrink-0" />
      </CollapsibleTrigger>
    </Collapsible>
  {/snippet}
  {#snippet dontPair1()}
    <Collapsible class="nds-w-full">
      <CollapsibleTrigger
        class="nds-cluster nds-w-full nds-rounded-md nds-border-default nds-bg-background nds-px-4 nds-py-2 nds-text-body nds-font-medium nds-hover-bg-accent" data-justify="between"
      >
        Ver mais
        <ChevronDown aria-hidden="true" class="nds-icon nds-shrink-0" />
      </CollapsibleTrigger>
    </Collapsible>
  {/snippet}
  {#snippet doPair2()}
    <Collapsible class="nds-w-full">
      <CollapsibleTrigger
        class="nds-cluster nds-w-full nds-rounded-md nds-border-default nds-bg-background nds-px-4 nds-py-2 nds-text-body nds-font-medium nds-hover-bg-accent" data-justify="between"
      >
        {$tStore('demonstration.labels.headerLabel')}
        <ChevronDown aria-hidden="true" class="nds-icon nds-shrink-0" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div class="nds-rounded-md nds-border-default nds-bg-muted-soft nds-p-4 nds-text-body nds-stack nds-mt-2" data-spacing="sm">
          {$tStore('demonstration.labels.advancedFilter1')}
        </div>
      </CollapsibleContent>
    </Collapsible>
  {/snippet}
  {#snippet dontPair2()}
    <div class="nds-w-full nds-stack" data-spacing="sm">
      {#each [1, 2] as i (i)}
        <Collapsible class="nds-w-full">
          <CollapsibleTrigger
            class="nds-cluster nds-w-full nds-rounded-md nds-border-default nds-bg-background nds-px-4 nds-py-2 nds-text-body nds-font-medium nds-hover-bg-accent" data-justify="between"
          >
            Seção {i}
            <ChevronDown aria-hidden="true" class="nds-icon nds-shrink-0" />
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
  <DocsCompositions
    id="variantes"
    title={$tStore('variants.title')}
    useWhenLabel={$tNavStore('common.useWhen')}
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
      {
        name: $tStore('variants.items.customButton.name'),
        description: $tStore('variants.items.customButton.description'),
        useWhen: $tStore('variants.items.customButton.use'),
        code: `<Collapsible class="nds-w-full nds-max-w-sm">
  <CollapsibleTrigger class="nds-cluster nds-rounded-md nds-border-default nds-bg-background nds-px-4 nds-py-2 nds-text-body nds-font-medium nds-shadow-sm nds-hover-bg-accent" data-spacing="sm" style="display: inline-flex">
    Exibir opções avançadas
  </CollapsibleTrigger>
  <CollapsibleContent>
    <div class="nds-rounded-md nds-border-default nds-bg-muted-soft nds-p-4 nds-text-body nds-stack nds-mt-2" data-spacing="sm">
      <p>Primeira opção avançada.</p>
      <p>Segunda opção avançada.</p>
      <p>Terceira opção avançada.</p>
    </div>
  </CollapsibleContent>
</Collapsible>`,
        preview: variantCustomButton,
      },
    ]}
  />

  {#snippet variantUncontrolled()}
    <Collapsible class="nds-w-full">
      <CollapsibleTrigger
        class="nds-cluster nds-w-full nds-rounded-md nds-border-default nds-bg-background nds-px-4 nds-py-2 nds-text-body nds-font-medium nds-hover-bg-accent" data-justify="between"
      >
        {$tStore('demonstration.labels.triggerClosed')}
        <ChevronDown
          aria-hidden="true"
          class="nds-icon nds-shrink-0 nds-transition-transform nds-chevron"
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div class="nds-rounded-md nds-border-default nds-bg-muted-soft nds-p-4 nds-text-body nds-stack nds-mt-2" data-spacing="sm">
          {$tStore('demonstration.labels.advancedFilter1')}
        </div>
      </CollapsibleContent>
    </Collapsible>
  {/snippet}

  {#snippet variantControlled()}
    <Collapsible bind:open={demoOpen} class="nds-w-full">
      <CollapsibleTrigger
        class="nds-cluster nds-w-full nds-rounded-md nds-border-default nds-bg-background nds-px-4 nds-py-2 nds-text-body nds-font-medium nds-hover-bg-accent" data-justify="between"
      >
        {demoOpen
          ? $tStore('demonstration.labels.triggerOpen')
          : $tStore('demonstration.labels.triggerClosed')}
        <ChevronDown
          aria-hidden="true"
          class="nds-icon nds-shrink-0 nds-transition-transform nds-chevron"
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div class="nds-rounded-md nds-border-default nds-bg-muted-soft nds-p-4 nds-text-body nds-stack nds-mt-2" data-spacing="sm">
          {$tStore('demonstration.labels.advancedFilter1')}
        </div>
      </CollapsibleContent>
    </Collapsible>
  {/snippet}

  {#snippet variantCustomButton()}
    <Collapsible class="nds-w-full nds-max-w-sm">
      <CollapsibleTrigger
        class="nds-cluster nds-rounded-md nds-border-default nds-bg-background nds-px-4 nds-py-2 nds-text-body nds-font-medium nds-shadow-sm nds-hover-bg-accent" data-spacing="sm" style="display: inline-flex"
      >
        Exibir opções avançadas
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div class="nds-rounded-md nds-border-default nds-bg-muted-soft nds-p-4 nds-text-body nds-stack nds-mt-2" data-spacing="sm">
          <p>Primeira opção avançada disponível.</p>
          <p>Segunda opção avançada disponível.</p>
          <p>Terceira opção avançada disponível.</p>
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
        name: $tStore('variants.compositions.iconTrigger.name'),
        description: $tStore('variants.compositions.iconTrigger.description'),
        useWhen: $tStore('variants.compositions.iconTrigger.use'),
        code: `<Collapsible class="nds-w-full">
  <CollapsibleTrigger class="nds-cluster nds-rounded-md nds-border-default nds-bg-background nds-px-4 nds-py-2 nds-text-body nds-font-medium nds-shadow-sm nds-hover-bg-accent" data-spacing="sm" style="display: inline-flex">
    <Filter aria-hidden="true" class="nds-icon nds-shrink-0" />
    Filtros avançados
  </CollapsibleTrigger>
  <CollapsibleContent>
    <div class="nds-rounded-md nds-border-default nds-bg-muted-soft nds-p-4 nds-text-body nds-stack nds-mt-2" data-spacing="sm">
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
        code: `<Collapsible class="nds-w-full">
  <CollapsibleTrigger class="nds-cluster nds-w-full nds-rounded-md nds-border-default nds-bg-background nds-px-4 nds-py-2 nds-text-body nds-font-medium nds-shadow-sm nds-hover-bg-accent" data-justify="between">
    Configurações avançadas
    <ChevronDown aria-hidden="true" class="nds-icon nds-shrink-0 nds-transition-transform duration-200 nds-chevron" />
  </CollapsibleTrigger>
  <CollapsibleContent>
    <div class="nds-rounded-md nds-border-default nds-bg-muted-soft nds-p-4 nds-text-body nds-stack nds-mt-2" data-spacing="sm">
      <div class="nds-cluster" data-justify="between"><span class="nds-text-muted-foreground">Timeout</span><span>30s</span></div>
      <div class="nds-cluster" data-justify="between"><span class="nds-text-muted-foreground">Retries</span><span>3</span></div>
    </div>
  </CollapsibleContent>
</Collapsible>`,
        preview: compRotatingChevron,
      },
      {
        name: $tStore('variants.compositions.richContent.name'),
        description: $tStore('variants.compositions.richContent.description'),
        useWhen: $tStore('variants.compositions.richContent.use'),
        code: `<Collapsible class="nds-w-full">
  <CollapsibleTrigger class="nds-cluster nds-rounded-md nds-border-default nds-bg-background nds-px-4 nds-py-2 nds-text-body nds-font-medium nds-shadow-sm nds-hover-bg-accent" data-spacing="sm" style="display: inline-flex">
    <Settings aria-hidden="true" class="nds-icon nds-shrink-0" />
    Configurações do sistema
  </CollapsibleTrigger>
  <CollapsibleContent>
    <div class="nds-rounded-md nds-border-default nds-bg-muted-soft nds-p-4 nds-text-body nds-stack nds-mt-2" data-spacing="sm">
      <p class="nds-text-muted-foreground nds-text-caption">Selecione as opções desejadas.</p>
      <label class="nds-cluster nds-cursor-pointer" data-spacing="sm"><input type="checkbox" class="nds-icon nds-rounded-sm nds-border-default" /> Notificações por e-mail</label>
      <label class="nds-cluster nds-cursor-pointer" data-spacing="sm"><input type="checkbox" class="nds-icon nds-rounded-sm nds-border-default" /> Sincronização automática</label>
      <label class="nds-cluster nds-cursor-pointer" data-spacing="sm"><input type="checkbox" class="nds-icon nds-rounded-sm nds-border-default" /> Modo escuro</label>
    </div>
  </CollapsibleContent>
</Collapsible>`,
        preview: compRichContent,
      },
    ]}
  />

  {#snippet compIconTrigger()}
    <Collapsible class="nds-w-full">
      <CollapsibleTrigger
        class="nds-cluster nds-rounded-md nds-border-default nds-bg-background nds-px-4 nds-py-2 nds-text-body nds-font-medium nds-shadow-sm nds-hover-bg-accent" data-spacing="sm" style="display: inline-flex"
      >
        <Filter aria-hidden="true" class="nds-icon nds-shrink-0" />
        Filtros avançados
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div class="nds-rounded-md nds-border-default nds-bg-muted-soft nds-p-4 nds-text-body nds-stack nds-mt-2" data-spacing="sm">
          <p>Categoria</p>
          <p>Preço</p>
          <p>Disponibilidade</p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  {/snippet}

  {#snippet compRotatingChevron()}
    <Collapsible class="nds-w-full">
      <CollapsibleTrigger
        class="nds-cluster nds-w-full nds-rounded-md nds-border-default nds-bg-background nds-px-4 nds-py-2 nds-text-body nds-font-medium nds-hover-bg-accent" data-justify="between"
      >
        Configurações avançadas
        <ChevronDown
          aria-hidden="true"
          class="nds-icon nds-shrink-0 nds-transition-transform nds-chevron"
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div class="nds-rounded-md nds-border-default nds-bg-muted-soft nds-p-4 nds-text-body nds-stack nds-mt-2" data-spacing="sm">
          <div class="nds-cluster" data-justify="between"><span class="nds-text-muted-foreground">Timeout</span><span>30s</span></div>
          <div class="nds-cluster" data-justify="between"><span class="nds-text-muted-foreground">Retries</span><span>3</span></div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  {/snippet}

  {#snippet compRichContent()}
    <Collapsible class="nds-w-full">
      <CollapsibleTrigger
        class="nds-cluster nds-rounded-md nds-border-default nds-bg-background nds-px-4 nds-py-2 nds-text-body nds-font-medium nds-shadow-sm nds-hover-bg-accent" data-spacing="sm" style="display: inline-flex"
      >
        <Settings aria-hidden="true" class="nds-icon nds-shrink-0" />
        Configurações do sistema
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div class="nds-rounded-md nds-border-default nds-bg-muted-soft nds-p-4 nds-text-body nds-stack nds-mt-2" data-spacing="sm">
          <p class="nds-text-muted-foreground nds-text-caption">Selecione as opções desejadas.</p>
          <label class="nds-cluster nds-cursor-pointer" data-spacing="sm"><input type="checkbox" class="nds-icon nds-rounded-sm nds-border-default" /> Notificações por e-mail</label>
          <label class="nds-cluster nds-cursor-pointer" data-spacing="sm"><input type="checkbox" class="nds-icon nds-rounded-sm nds-border-default" /> Sincronização automática</label>
          <label class="nds-cluster nds-cursor-pointer" data-spacing="sm"><input type="checkbox" class="nds-icon nds-rounded-sm nds-border-default" /> Modo escuro</label>
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
      { token: '--accent',     value: 'nds-hover-bg-accent',           description: $tStore('tokens.table.triggerHover') },
      { token: '--ring',       value: 'nds-focus-ring',      description: $tStore('tokens.table.triggerFocus') },
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
