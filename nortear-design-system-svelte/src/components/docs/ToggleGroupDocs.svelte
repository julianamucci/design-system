<script lang="ts">
  import { untrack } from 'svelte';
  import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
  import AlignLeft from '@lucide/svelte/icons/text-align-start';
  import AlignCenter from '@lucide/svelte/icons/text-align-center';
  import AlignRight from '@lucide/svelte/icons/text-align-end';
  import Bold from '@lucide/svelte/icons/bold';
  import Italic from '@lucide/svelte/icons/italic';
  import Underline from '@lucide/svelte/icons/underline';
  import LayoutGrid from '@lucide/svelte/icons/layout-grid';
  import List from '@lucide/svelte/icons/list';
  import Eye from '@lucide/svelte/icons/eye';
  import { locale, useTranslation } from '@/lib/i18n';
  import { applySeo } from '@/lib/use-seo';
  import { track } from '@/lib/analytics';
  import { createActiveSection } from '@/lib/use-active-section.svelte';
  import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.svelte';
  import {
    DocsHeader, DocsDemonstration, DocsAnatomy, DocsWhenToUse, DocsDoDont,
    DocsImport, DocsVariants, DocsCompositions, DocsStates, DocsProps, DocsTokens,
    DocsAccessibility, DocsRelated, DocsNotes, DocsAnalytics, DocsTestes,
  } from '@/components/docs/shared/sections';
  import uiTranslations from '@/i18n/ui.json';
  import toggleGroupTranslations from '@shared/content/toggle-group/translations.json';
  import { stripHtml, toPlainText } from '@/lib/strip-html';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(toggleGroupTranslations);

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria.
  const screenReaderItems = $derived(
    Object.values(
      (toggleGroupTranslations as unknown as Record<
        string,
        { accessibility?: { screenReader?: Record<string, string> } }
      >)[$locale]?.accessibility?.screenReader ?? {},
    ),
  );

  // ─── SEO + Analytics ─────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale: l,
      componentSlug: 'toggle-group',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: t('category'), item: '/components/form' },
        { name: t('title') },
      ],
    });
    track('docs_page_view', {
      component_name: 'toggle-group',
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
        { id: 'importacao',   label: tNav('nav.import')    },
        { id: 'variantes',    label: tNav('nav.variants')  },
        { id: 'composicoes',  label: tNav('nav.compositions') },
        { id: 'estados',      label: tNav('nav.states')    },
        { id: 'propriedades', label: tNav('nav.props')     },
        { id: 'tokens',       label: tNav('nav.tokens')    },
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
    track('docs_section_viewed', { section_id: id, component_name: 'toggle-group', locale: $locale });
  });
  $effect(() => section.attach());

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const priorityKeyMap: Record<string, string> = { high: 'common.high', medium: 'common.medium', low: 'common.low' };

  function localPriority(raw: string, tNav: (k: string) => string): string {
    return tNav(priorityKeyMap[raw] ?? 'common.high');
  }

  // ─── Reactive demo states ────────────────────────────────────────────────────

  let demoAlignment = $state<string>('left');
  let demoFormatting = $state<string[]>(['bold']);
  let demoView = $state<string>('grid');

  // Variants previews
  let varSingle = $state<string>('left');
  let varMultiple = $state<string[]>([]);
  let verticalVar = $state<string>('grid');

  // Compositions previews
  let compAlign = $state<string>('left');
  let compView = $state<string>('grid');
  let compFilter = $state<string[]>(['compact']);

  // Do/Don't
  let dd1DoVal = $state<string>('left');
  let dd1DontVal = $state<boolean>(false);
  let dd2DoVal = $state<string>('left');
  let dd2DontVal = $state<string>('left');

  // ─── Code strings ────────────────────────────────────────────────────────────

  const codeImport = `import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";`;

  const codeSingle = `<script lang="ts">
  import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
  import AlignLeft from '@lucide/svelte/icons/text-align-start';
  import AlignCenter from '@lucide/svelte/icons/text-align-center';
  import AlignRight from '@lucide/svelte/icons/text-align-end';
  let alignment = $state("left");
<\/script>

<ToggleGroup type="single" bind:value={alignment} aria-label="Alinhamento do texto">
  <ToggleGroupItem value="left" aria-label="Alinhar à esquerda">
    <AlignLeft aria-hidden="true" />
  </ToggleGroupItem>
  <ToggleGroupItem value="center" aria-label="Centralizar">
    <AlignCenter aria-hidden="true" />
  </ToggleGroupItem>
  <ToggleGroupItem value="right" aria-label="Alinhar à direita">
    <AlignRight aria-hidden="true" />
  </ToggleGroupItem>
</ToggleGroup>`;

  const codeMultiple = `<script lang="ts">
  import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
  import Bold from '@lucide/svelte/icons/bold';
  import Italic from '@lucide/svelte/icons/italic';
  import Underline from '@lucide/svelte/icons/underline';
  let formats = $state<string[]>([]);
<\/script>

<ToggleGroup type="multiple" bind:value={formats} aria-label="Formatação">
  <ToggleGroupItem value="bold" aria-label="Negrito">
    <Bold aria-hidden="true" />
  </ToggleGroupItem>
  <ToggleGroupItem value="italic" aria-label="Itálico">
    <Italic aria-hidden="true" />
  </ToggleGroupItem>
  <ToggleGroupItem value="underline" aria-label="Sublinhado">
    <Underline aria-hidden="true" />
  </ToggleGroupItem>
</ToggleGroup>`;

  const verticalCode = `<ToggleGroup
  type="single"
  orientation="vertical"
  variant="outline"
  bind:value={view}
  aria-label="Modo de visualização"
>
  <ToggleGroupItem value="grid" aria-label="Grade">
    <LayoutGrid aria-hidden="true" />
  </ToggleGroupItem>
  <ToggleGroupItem value="list" aria-label="Lista">
    <List aria-hidden="true" />
  </ToggleGroupItem>
</ToggleGroup>`;

  const interfaceCode = `// ToggleGroup (Svelte 5 — bits-ui)
interface ToggleGroupProps {
  type: "single" | "multiple";              // OBRIGATÓRIO
  value?: string | string[];                // $bindable — string (single) | string[] (multiple)
  disabled?: boolean;
  orientation?: "horizontal" | "vertical";
  variant?: "default" | "outline";          // herdado pelos items
  size?: "default" | "sm" | "lg";           // herdado pelos items
  'aria-label': string;                     // OBRIGATÓRIO
  class?: string;
}

interface ToggleGroupItemProps {
  value: string;                            // OBRIGATÓRIO e único no grupo
  disabled?: boolean;
  'aria-label'?: string;                    // OBRIGATÓRIO em icon-only
  class?: string;
}`;

</script>

<DocsPageLayout navGroups={NAV_GROUPS} activeSection={section.value} componentSlug="toggle-group">
  {#snippet header()}
    <DocsHeader
      title={$tStore('title')}
      description={$tStore('description')}
      category={$tStore('category')}
      type={$tStore('type')}
    />
  {/snippet}

  <!-- ── Demonstração ─────────────────────────────────────────────────── -->
  <DocsDemonstration title={$tStore('demonstration.title')} componentSlug="toggle-group">
    <div class="nds-stack" data-spacing="lg" data-align="start">
      <!-- Single — alinhamento -->
      <ToggleGroup
        type="single"
        bind:value={demoAlignment}
        onValueChange={(v: string) => track('field_change', { component: 'toggle_group', field_name: 'alignment', value: v, location: 'docs_demo' })}
        aria-label={$tStore('demonstration.labels.alignmentLabel')}
        data-track="demo"
        data-track-id="toggle-group:demo:alignment"
      >
        <ToggleGroupItem value="left" aria-label={$tStore('demonstration.labels.left')}>
          <AlignLeft aria-hidden="true" />
        </ToggleGroupItem>
        <ToggleGroupItem value="center" aria-label={$tStore('demonstration.labels.center')}>
          <AlignCenter aria-hidden="true" />
        </ToggleGroupItem>
        <ToggleGroupItem value="right" aria-label={$tStore('demonstration.labels.right')}>
          <AlignRight aria-hidden="true" />
        </ToggleGroupItem>
      </ToggleGroup>

      <!-- Multiple — formatação -->
      <ToggleGroup
        type="multiple"
        bind:value={demoFormatting}
        onValueChange={(v: string[]) => track('field_change', { component: 'toggle_group', field_name: 'formatting', value: v.join(','), location: 'docs_demo' })}
        variant="outline"
        aria-label={$tStore('demonstration.labels.formattingLabel')}
        data-track="demo"
        data-track-id="toggle-group:demo:formatting"
      >
        <ToggleGroupItem value="bold" aria-label={$tStore('demonstration.labels.bold')}>
          <Bold aria-hidden="true" />
        </ToggleGroupItem>
        <ToggleGroupItem value="italic" aria-label={$tStore('demonstration.labels.italic')}>
          <Italic aria-hidden="true" />
        </ToggleGroupItem>
        <ToggleGroupItem value="underline" aria-label={$tStore('demonstration.labels.underline')}>
          <Underline aria-hidden="true" />
        </ToggleGroupItem>
      </ToggleGroup>

      <!-- Vertical — modo de visualização -->
      <ToggleGroup
        type="single"
        orientation="vertical"
        variant="outline"
        bind:value={demoView}
        onValueChange={(v: string) => track('field_change', { component: 'toggle_group', field_name: 'view', value: v, location: 'docs_demo' })}
        aria-label={$tStore('demonstration.labels.viewLabel')}
        data-track="demo"
        data-track-id="toggle-group:demo:view"
      >
        <ToggleGroupItem value="grid" aria-label={$tStore('demonstration.labels.grid')}>
          <LayoutGrid aria-hidden="true" />
        </ToggleGroupItem>
        <ToggleGroupItem value="list" aria-label={$tStore('demonstration.labels.list')}>
          <List aria-hidden="true" />
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  </DocsDemonstration>

  <!-- ── Anatomia ──────────────────────────────────────────────────────── -->
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

  <!-- ── Quando Usar ───────────────────────────────────────────────────── -->
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
        {
          element: $tStore('usage.uxWriting.table.groupLabel.name'),
          rules: $tStore('usage.uxWriting.table.groupLabel.format'),
          do: $tStore('usage.uxWriting.table.groupLabel.good'),
          dont: $tStore('usage.uxWriting.table.groupLabel.bad'),
        },
        {
          element: $tStore('usage.uxWriting.table.itemLabel.name'),
          rules: $tStore('usage.uxWriting.table.itemLabel.format'),
          do: $tStore('usage.uxWriting.table.itemLabel.good'),
          dont: $tStore('usage.uxWriting.table.itemLabel.bad'),
        },
        {
          element: $tStore('usage.uxWriting.table.order.name'),
          rules: $tStore('usage.uxWriting.table.order.format'),
          do: $tStore('usage.uxWriting.table.order.good'),
          dont: $tStore('usage.uxWriting.table.order.bad'),
        },
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

  <!-- ── Do & Don't ───────────────────────────────────────────────────── -->
  <DocsDoDont
    title={$tStore('doDont.title')}
    pairs={[
      {
        doLabel: $tNavStore('common.do'),
        dontLabel: $tNavStore('common.dont'),
        doCaption: $tStore('doDont.pair1.do'),
        dontCaption: $tStore('doDont.pair1.dont'),
        doPreview: dd1Do,
        dontPreview: dd1Dont,
      },
      {
        doLabel: $tNavStore('common.do'),
        dontLabel: $tNavStore('common.dont'),
        doCaption: $tStore('doDont.pair2.do'),
        dontCaption: $tStore('doDont.pair2.dont'),
        doPreview: dd2Do,
        dontPreview: dd2Dont,
      },
    ]}
  />

  {#snippet dd1Do()}
    <ToggleGroup type="single" bind:value={dd1DoVal} aria-label="Alinhamento do texto">
      <ToggleGroupItem value="left" aria-label="Alinhar à esquerda">
        <AlignLeft aria-hidden="true" />
      </ToggleGroupItem>
      <ToggleGroupItem value="center" aria-label="Centralizar">
        <AlignCenter aria-hidden="true" />
      </ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Alinhar à direita">
        <AlignRight aria-hidden="true" />
      </ToggleGroupItem>
    </ToggleGroup>
  {/snippet}

  {#snippet dd1Dont()}
    <div class="nds-cluster" data-spacing="xs">
      <button
        type="button"
        aria-pressed={dd1DontVal}
        onclick={() => (dd1DontVal = !dd1DontVal)}
        aria-label="Alinhar à esquerda"
        class="nds-cluster nds-rounded-md nds-hover-bg-muted-soft" data-justify="center" data-align="center" style="width: 2.25rem; height: 2.25rem"
      >
        <AlignLeft aria-hidden="true" />
      </button>
      <button type="button" aria-pressed="false" aria-label="Centralizar" class="nds-cluster nds-rounded-md nds-hover-bg-muted-soft" data-justify="center" data-align="center" style="width: 2.25rem; height: 2.25rem">
        <AlignCenter aria-hidden="true" />
      </button>
      <button type="button" aria-pressed="false" aria-label="Alinhar à direita" class="nds-cluster nds-rounded-md nds-hover-bg-muted-soft" data-justify="center" data-align="center" style="width: 2.25rem; height: 2.25rem">
        <AlignRight aria-hidden="true" />
      </button>
    </div>
  {/snippet}

  {#snippet dd2Do()}
    <ToggleGroup type="single" bind:value={dd2DoVal} aria-label="Alinhamento do texto">
      <ToggleGroupItem value="left" aria-label="Alinhar à esquerda">
        <AlignLeft aria-hidden="true" />
      </ToggleGroupItem>
      <ToggleGroupItem value="center" aria-label="Centralizar">
        <AlignCenter aria-hidden="true" />
      </ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Alinhar à direita">
        <AlignRight aria-hidden="true" />
      </ToggleGroupItem>
    </ToggleGroup>
  {/snippet}

  {#snippet dd2Dont()}
    <ToggleGroup type="single" bind:value={dd2DontVal}>
      <ToggleGroupItem value="left" aria-label="Alinhar à esquerda">
        <AlignLeft aria-hidden="true" />
      </ToggleGroupItem>
      <ToggleGroupItem value="center" aria-label="Centralizar">
        <AlignCenter aria-hidden="true" />
      </ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Alinhar à direita">
        <AlignRight aria-hidden="true" />
      </ToggleGroupItem>
    </ToggleGroup>
  {/snippet}

  <!-- ── Importação ────────────────────────────────────────────────────── -->
  <DocsImport
    title={$tStore('import.title')}
    code={codeImport}
    componentSlug="toggle-group"
  />

  <!-- ── Variantes ─────────────────────────────────────────────────────── -->
  <DocsVariants
    title={$tStore('variants.title')}
    componentSlug="toggle-group"
    items={[
      {
        name: $tStore('variants.items.single'),
        description: stripHtml($tStore('variants.styles.single')),
        code: codeSingle,
        preview: variantSingle,
      },
      {
        name: $tStore('variants.items.multiple'),
        description: stripHtml($tStore('variants.styles.multiple')),
        code: codeMultiple,
        preview: variantMultiple,
      },
      {
        name: $tStore('variants.items.vertical'),
        description: stripHtml($tStore('variants.styles.vertical')),
        code: verticalCode,
        preview: variantVertical,
      },
    ]}
  />

  {#snippet variantSingle()}
    <ToggleGroup type="single" bind:value={varSingle} aria-label="Alinhamento do texto">
      <ToggleGroupItem value="left" aria-label="Alinhar à esquerda">
        <AlignLeft aria-hidden="true" />
      </ToggleGroupItem>
      <ToggleGroupItem value="center" aria-label="Centralizar">
        <AlignCenter aria-hidden="true" />
      </ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Alinhar à direita">
        <AlignRight aria-hidden="true" />
      </ToggleGroupItem>
    </ToggleGroup>
  {/snippet}

  {#snippet variantMultiple()}
    <ToggleGroup type="multiple" bind:value={varMultiple} variant="outline" aria-label="Formatação">
      <ToggleGroupItem value="bold" aria-label="Negrito">
        <Bold aria-hidden="true" />
      </ToggleGroupItem>
      <ToggleGroupItem value="italic" aria-label="Itálico">
        <Italic aria-hidden="true" />
      </ToggleGroupItem>
      <ToggleGroupItem value="underline" aria-label="Sublinhado">
        <Underline aria-hidden="true" />
      </ToggleGroupItem>
    </ToggleGroup>
  {/snippet}

  {#snippet variantVertical()}
    <ToggleGroup type="single" orientation="vertical" variant="outline" bind:value={verticalVar} aria-label="Modo de visualização">
      <ToggleGroupItem value="grid" aria-label="Grade">
        <LayoutGrid aria-hidden="true" />
      </ToggleGroupItem>
      <ToggleGroupItem value="list" aria-label="Lista">
        <List aria-hidden="true" />
      </ToggleGroupItem>
    </ToggleGroup>
  {/snippet}

  <!-- ── Composições ──────────────────────────────────────────────────── -->
  <DocsCompositions
    title={$tStore('variants.compositionsTitle')}
    useWhenLabel={$tNavStore('common.useWhen')}
    componentSlug="toggle-group"
    items={[
      {
        name: $tStore('variants.compositions.alignmentBar.name'),
        description: $tStore('variants.compositions.alignmentBar.description'),
        useWhen: $tStore('variants.compositions.alignmentBar.use'),
        code: `<ToggleGroup type="single" variant="outline" value="left" aria-label="Alinhamento do texto">
  <ToggleGroupItem value="left" aria-label="Alinhar à esquerda"><AlignLeft aria-hidden="true" /></ToggleGroupItem>
  <ToggleGroupItem value="center" aria-label="Centralizar"><AlignCenter aria-hidden="true" /></ToggleGroupItem>
  <ToggleGroupItem value="right" aria-label="Alinhar à direita"><AlignRight aria-hidden="true" /></ToggleGroupItem>
</ToggleGroup>`,
        preview: compAlignmentBar,
      },
      {
        name: $tStore('variants.compositions.viewMode.name'),
        description: $tStore('variants.compositions.viewMode.description'),
        useWhen: $tStore('variants.compositions.viewMode.use'),
        code: `<ToggleGroup type="single" variant="outline" value="grid" orientation="vertical" aria-label="Modo de visualização">
  <ToggleGroupItem value="grid" aria-label="Grade"><LayoutGrid aria-hidden="true" /> Grade</ToggleGroupItem>
  <ToggleGroupItem value="list" aria-label="Lista"><List aria-hidden="true" /> Lista</ToggleGroupItem>
</ToggleGroup>`,
        preview: compViewMode,
      },
      {
        name: $tStore('variants.compositions.filterWithText.name'),
        description: $tStore('variants.compositions.filterWithText.description'),
        useWhen: $tStore('variants.compositions.filterWithText.use'),
        code: `<div>
  <p>Filtros de exibição</p>
  <ToggleGroup type="multiple" variant="outline" value={['compact']} aria-label="Filtros de exibição">
    <ToggleGroupItem value="hidden"><Eye aria-hidden="true" /> Ocultos</ToggleGroupItem>
    <ToggleGroupItem value="compact"><List aria-hidden="true" /> Compacto</ToggleGroupItem>
  </ToggleGroup>
</div>`,
        preview: compFilterWithText,
      },
    ]}
  />

  {#snippet compAlignmentBar()}
    <ToggleGroup type="single" variant="outline" bind:value={compAlign} aria-label="Alinhamento do texto">
      <ToggleGroupItem value="left" aria-label="Alinhar à esquerda">
        <AlignLeft aria-hidden="true" />
      </ToggleGroupItem>
      <ToggleGroupItem value="center" aria-label="Centralizar">
        <AlignCenter aria-hidden="true" />
      </ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Alinhar à direita">
        <AlignRight aria-hidden="true" />
      </ToggleGroupItem>
    </ToggleGroup>
  {/snippet}

  {#snippet compViewMode()}
    <ToggleGroup type="single" variant="outline" orientation="vertical" bind:value={compView} aria-label="Modo de visualização">
      <ToggleGroupItem value="grid" aria-label="Grade">
        <LayoutGrid aria-hidden="true" />
        <span>Grade</span>
      </ToggleGroupItem>
      <ToggleGroupItem value="list" aria-label="Lista">
        <List aria-hidden="true" />
        <span>Lista</span>
      </ToggleGroupItem>
    </ToggleGroup>
  {/snippet}

  {#snippet compFilterWithText()}
    <div class="nds-stack" data-spacing="sm" data-align="start">
      <p class="nds-text-body nds-font-medium">Filtros de exibição</p>
      <ToggleGroup type="multiple" variant="outline" bind:value={compFilter} aria-label="Filtros de exibição">
        <ToggleGroupItem value="hidden">
          <Eye aria-hidden="true" />
          <span>Ocultos</span>
        </ToggleGroupItem>
        <ToggleGroupItem value="compact">
          <List aria-hidden="true" />
          <span>Compacto</span>
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  {/snippet}

  <!-- ── Estados ──────────────────────────────────────────────────────── -->
  <DocsStates
    title={$tStore('states.title')}
    cols={{
      state: $tStore('states.cols.state'),
      trigger: toPlainText($tStore('states.cols.trigger')),
      behavior: toPlainText($tStore('states.cols.behavior')),
    }}
    items={[
      { label: $tStore('states.default.label'),      trigger: toPlainText($tStore('states.default.trigger')),                 behavior: toPlainText($tStore('states.default.behavior')) },
      { label: $tStore('states.selected.label'),     trigger: toPlainText($tStore('states.selected.trigger')),                behavior: toPlainText($tStore('states.selected.behavior')) },
      { label: $tStore('states.hover.label'),        trigger: toPlainText($tStore('states.hover.trigger')),                   behavior: toPlainText($tStore('states.hover.behavior')) },
      { label: $tStore('states.focus.label'),        trigger: toPlainText($tStore('states.focus.trigger')),                   behavior: toPlainText($tStore('states.focus.behavior')) },
      { label: $tStore('states.disabled.label'),     trigger: toPlainText($tStore('states.disabled.trigger')),                behavior: toPlainText($tStore('states.disabled.behavior')) },
      { label: $tStore('states.disabledItem.label'), trigger: toPlainText($tStore('states.disabledItem.trigger')), behavior: toPlainText($tStore('states.disabledItem.behavior')) },
    ]}
  />

  <!-- ── Propriedades ─────────────────────────────────────────────────── -->
  <DocsProps
    title={$tStore('props.title')}
    tables={[
      {
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'type',          type: $tStore('props.table.type_prop.type'),      defaultValue: $tStore('props.table.type_prop.default'),      required: $tStore('props.table.type_prop.required'),      description: toPlainText($tStore('props.table.type_prop.description')) },
          { name: 'value',         type: $tStore('props.table.value.type'),          defaultValue: $tStore('props.table.value.default'),          required: $tStore('props.table.value.required'),          description: toPlainText($tStore('props.table.value.description')) },
          { name: 'defaultValue',  type: $tStore('props.table.defaultValue.type'),   defaultValue: $tStore('props.table.defaultValue.default'),   required: $tStore('props.table.defaultValue.required'),   description: toPlainText($tStore('props.table.defaultValue.description')) },
          { name: 'onValueChange', type: $tStore('props.table.onValueChange.type'),  defaultValue: $tStore('props.table.onValueChange.default'),  required: $tStore('props.table.onValueChange.required'),  description: toPlainText($tStore('props.table.onValueChange.description')) },
          { name: 'disabled',      type: $tStore('props.table.disabled.type'),       defaultValue: $tStore('props.table.disabled.default'),       required: $tStore('props.table.disabled.required'),       description: toPlainText($tStore('props.table.disabled.description')) },
          { name: 'orientation',   type: $tStore('props.table.orientation.type'),    defaultValue: $tStore('props.table.orientation.default'),    required: $tStore('props.table.orientation.required'),    description: toPlainText($tStore('props.table.orientation.description')) },
          { name: 'variant',       type: $tStore('props.table.variant.type'),        defaultValue: $tStore('props.table.variant.default'),        required: $tStore('props.table.variant.required'),        description: toPlainText($tStore('props.table.variant.description')) },
          { name: 'size',          type: $tStore('props.table.size.type'),           defaultValue: $tStore('props.table.size.default'),           required: $tStore('props.table.size.required'),           description: toPlainText($tStore('props.table.size.description')) },
        ],
      },
    ]}
    interfaceCode={interfaceCode}
  />

  <!-- ── Tokens ────────────────────────────────────────────────────────── -->
  <DocsTokens
    title={$tStore('tokens.title')}
    cols={{
      token: $tStore('tokens.table.token'),
      value: $tStore('tokens.table.class'),
      description: $tStore('tokens.table.part'),
    }}
    items={[
      { token: '--muted',         value: $tStore('tokens.table.muted.class'),       description: $tStore('tokens.table.muted.part') },
      { token: '--accent',        value: $tStore('tokens.table.accent.class'),      description: $tStore('tokens.table.accent.part') },
      // A borda do conjunto outline sai de `--border`, a mesma do toggle de
      // contorno; `--input` não entra em regra nenhuma da folha. A chave
      // `input` é o nome da linha, não o nome do token.
      { token: '--border',        value: $tStore('tokens.table.input.class'),       description: $tStore('tokens.table.input.part') },
      { token: '--ring',          value: $tStore('tokens.table.ring.class'),        description: $tStore('tokens.table.ring.part') },
      { token: '--destructive',   value: $tStore('tokens.table.destructive.class'), description: $tStore('tokens.table.destructive.part') },
      { token: '--radius-button', value: $tStore('tokens.table.radius.class'),      description: $tStore('tokens.table.radius.part') },
    ]}
    customizationTitle={$tStore('tokens.customizationTitle')}
    customizationCode={$tStore('tokens.customizationCode')}
  />

  <!-- ── Acessibilidade ───────────────────────────────────────────────── -->
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
      { key: 'Tab',         description: $tStore('accessibility.keyboard.tab') },
      { key: 'Arrow Right',  description: $tStore('accessibility.keyboard.arrowRight') },
      { key: 'Arrow Left',   description: $tStore('accessibility.keyboard.arrowLeft') },
      { key: 'Arrow Down',   description: $tStore('accessibility.keyboard.arrowDown') },
      { key: 'Arrow Up',     description: $tStore('accessibility.keyboard.arrowUp') },
      { key: 'Home',        description: $tStore('accessibility.keyboard.home') },
      { key: 'End',         description: $tStore('accessibility.keyboard.end') },
      { key: 'Space',       description: $tStore('accessibility.keyboard.space') },
      { key: 'Enter',       description: $tStore('accessibility.keyboard.enter') },
    ]}
  />

  <!-- ── Relacionados ──────────────────────────────────────────────────── -->
  <DocsRelated
    title={$tStore('related.title')}
    items={[
      { name: $tStore('related.items.toggle.name'),      description: $tStore('related.items.toggle.description'),      path: '?path=/docs/ui-toggle--docs' },
      { name: $tStore('related.items.tabs.name'),        description: $tStore('related.items.tabs.description'),        path: '?path=/docs/ui-tabs--docs' },
      { name: $tStore('related.items.radioGroup.name'),  description: $tStore('related.items.radioGroup.description'),  path: '?path=/docs/ui-radiogroup--docs' },
      { name: $tStore('related.items.checkbox.name'),    description: $tStore('related.items.checkbox.description'),    path: '?path=/docs/ui-checkbox--docs' },
    ]}
  />

  <!-- ── Notas ─────────────────────────────────────────────────────────── -->
  <DocsNotes
    title={$tStore('notes.title')}
    items={[
      { title: '', content: $tStore('notes.item1') },
      { title: '', content: $tStore('notes.item2') },
      { title: '', content: $tStore('notes.item3') },
      { title: '', content: $tStore('notes.item4') },
    ]}
  />

  <!-- ── Analytics ────────────────────────────────────────────────────── -->
  <DocsAnalytics
    title={$tStore('analytics.title')}
    cols={{
      event: $tStore('analytics.table.event'),
      trigger: toPlainText($tStore('analytics.table.trigger')),
      payload: $tStore('analytics.table.payload'),
    }}
    items={[
      {
        event: 'field_change',
        trigger: toPlainText($tStore('analytics.table.field_change.trigger')),
        payload: $tStore('analytics.table.field_change.payload'),
      },
      {
        event: 'docs_page_view',
        trigger: $locale === 'en' ? 'Page mount per locale' : $locale === 'es' ? 'Montaje de página por locale' : 'Mount da página por locale',
        payload: '{ component_name: "toggle-group", locale, page_title }',
      },
      {
        event: 'docs_section_viewed',
        trigger: $locale === 'en' ? 'Section enters viewport' : $locale === 'es' ? 'La sección entra al viewport' : 'Seção entra no viewport',
        payload: '{ component_name: "toggle-group", section_id, locale }',
      },
    ]}
  />

  <!-- ── Testes ────────────────────────────────────────────────────────── -->
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
        { action: toPlainText($tStore('testes.functional.item1.action')), result: toPlainText($tStore('testes.functional.item1.result')), priority: localPriority($tStore('testes.functional.item1.priority'), $tNavStore) },
        { action: toPlainText($tStore('testes.functional.item2.action')), result: toPlainText($tStore('testes.functional.item2.result')), priority: localPriority($tStore('testes.functional.item2.priority'), $tNavStore) },
        { action: toPlainText($tStore('testes.functional.item3.action')), result: toPlainText($tStore('testes.functional.item3.result')), priority: localPriority($tStore('testes.functional.item3.priority'), $tNavStore) },
        { action: toPlainText($tStore('testes.functional.item4.action')), result: toPlainText($tStore('testes.functional.item4.result')), priority: localPriority($tStore('testes.functional.item4.priority'), $tNavStore) },
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
        { criterion: $tStore('testes.accessibility.item1'), level: 'AA',    how: 'axe-core' },
        { criterion: $tStore('testes.accessibility.item2'), level: '1.4.3', how: 'Contrast checker' },
        { criterion: $tStore('testes.accessibility.item3'), level: '2.4.7', how: 'Keyboard test' },
        { criterion: $tStore('testes.accessibility.item4'), level: '4.1.2', how: 'DevTools a11y tree' },
        { criterion: $tStore('testes.accessibility.item5'), level: '4.1.2', how: 'DevTools attribute' },
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
