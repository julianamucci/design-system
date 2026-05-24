<script lang="ts">
  import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectGroup,
    SelectGroupHeading,
  } from '@/components/ui/select';
  import MapPinIcon from '@lucide/svelte/icons/map-pin';
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
  import selectTranslations from '@shared/content/select/translations.json';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(selectTranslations);

  // ─── SEO + Analytics ─────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale: l,
      componentSlug: 'select',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      aiIntent: t('seo.aiIntent') as 'informational' | 'navigational',
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: t('category'), item: '/components/form' },
        { name: t('title') },
      ],
    });
    track('docs_page_view', {
      component_name: 'select',
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
        { id: 'importacao',   label: tContent('nav.import')    },
        { id: 'variantes',    label: tContent('nav.variants')  },
        { id: 'composicoes',  label: tContent('nav.compositions') },
        { id: 'estados',      label: tContent('nav.states')    },
        { id: 'propriedades', label: tContent('nav.props')     },
        { id: 'tokens',       label: tContent('nav.tokens')    },
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
    track('docs_section_viewed', { section_id: id, component_name: 'select', locale: $locale });
  });
  $effect(() => section.attach());

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  function stripHtml(s: string) {
    return s.replace(/<[^>]*>/g, '');
  }

  const priorityKeyMap: Record<string, string> = { high: 'common.high', medium: 'common.medium', low: 'common.low' };
  function localPriority(raw: string, tNav: (k: string) => string): string {
    return tNav(priorityKeyMap[raw] ?? 'common.high');
  }

  // ─── Demo state (não pré-seleciona) ──────────────────────────────────────────

  let demoStateValue = $state('');
  let demoRegionValue = $state('');
  let demoSmValue = $state('');

  // Variant previews
  let varDefaultValue = $state('');
  let varGroupsValue = $state('');
  let varIconValue = $state('');

  // Estados previews
  let stateDefaultValue = $state('');
  let stateSelectedValue = $state('sp');
  let stateInvalidValue = $state('');

  // Do & Don't state
  let dd1DoValue = $state('');
  let dd1DontValue = $state('');
  let dd2DoValue = $state('');
  let dd2DontValue = $state('');

  // Composições state
  let compStatesValue = $state('');
  let compGroupsValue = $state('');
  let compFormValue = $state('');

  // ─── Localized labels ────────────────────────────────────────────────────────

  const demoLabels = $derived.by(() => {
    const t = $tStore;
    return {
      placeholder: t('demonstration.labels.placeholder'),
      stateLabel: t('demonstration.labels.stateLabel'),
      regionLabel: t('demonstration.labels.regionLabel'),
      groupSoutheast: t('demonstration.labels.groupSoutheast'),
      groupSouth: t('demonstration.labels.groupSouth'),
      sp: t('demonstration.labels.sp'),
      rj: t('demonstration.labels.rj'),
      mg: t('demonstration.labels.mg'),
      es: t('demonstration.labels.es'),
      rs: t('demonstration.labels.rs'),
      sc: t('demonstration.labels.sc'),
      pr: t('demonstration.labels.pr'),
    };
  });

  const stateOptions = $derived([
    { value: 'sp', label: demoLabels.sp },
    { value: 'rj', label: demoLabels.rj },
    { value: 'mg', label: demoLabels.mg },
    { value: 'es', label: demoLabels.es },
  ]);

  const regionGroups = $derived([
    {
      label: demoLabels.groupSoutheast,
      options: [
        { value: 'sp', label: demoLabels.sp },
        { value: 'rj', label: demoLabels.rj },
        { value: 'mg', label: demoLabels.mg },
        { value: 'es', label: demoLabels.es },
      ],
    },
    {
      label: demoLabels.groupSouth,
      options: [
        { value: 'rs', label: demoLabels.rs },
        { value: 'sc', label: demoLabels.sc },
        { value: 'pr', label: demoLabels.pr },
      ],
    },
  ]);

  function findLabel(opts: { value: string; label: string }[], v: string) {
    return opts.find((o) => o.value === v)?.label ?? '';
  }

  function findLabelInGroups(groups: { options: { value: string; label: string }[] }[], v: string) {
    for (const g of groups) {
      const f = g.options.find((o) => o.value === v);
      if (f) return f.label;
    }
    return '';
  }

  // ─── Code strings ────────────────────────────────────────────────────────────

  const codeImport = `import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectGroupHeading,
} from "@/components/ui/select";`;

  const codeDefault = `<Select type="single" bind:value>
  <SelectTrigger aria-label="Selecionar estado">
    {value || "Selecione..."}
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="sp" label="São Paulo" />
    <SelectItem value="rj" label="Rio de Janeiro" />
    <SelectItem value="mg" label="Minas Gerais" />
    <SelectItem value="es" label="Espírito Santo" />
  </SelectContent>
</Select>`;

  const codeWithGroups = `<Select type="single" bind:value>
  <SelectTrigger aria-label="Selecionar região">
    {value || "Selecione..."}
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectGroupHeading>Sudeste</SelectGroupHeading>
      <SelectItem value="sp" label="São Paulo" />
      <SelectItem value="rj" label="Rio de Janeiro" />
    </SelectGroup>
    <SelectGroup>
      <SelectGroupHeading>Sul</SelectGroupHeading>
      <SelectItem value="rs" label="Rio Grande do Sul" />
      <SelectItem value="sc" label="Santa Catarina" />
    </SelectGroup>
  </SelectContent>
</Select>`;

  const codeWithIcon = `<Select type="single" bind:value>
  <SelectTrigger aria-label="Selecionar estado">
    {value || "Selecione..."}
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="sp" label="São Paulo">
      {#snippet children()}
        <MapPinIcon class="size-4 text-muted-foreground" />
        <span>São Paulo</span>
      {/snippet}
    </SelectItem>
  </SelectContent>
</Select>`;

  const interfaceCode = `// Select (Root — bits-ui)
interface SelectProps {
  type: "single" | "multiple"; // OBRIGATÓRIO
  value?: string;              // $bindable
  open?: boolean;              // $bindable
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  name?: string;
}

// SelectTrigger
interface SelectTriggerProps {
  size?: "default" | "sm";     // tokens --height-default / --height-sm
  class?: string;
}

// SelectItem
interface SelectItemProps {
  value: string;               // OBRIGATÓRIO
  label?: string;
  disabled?: boolean;
  class?: string;
}`;
</script>

<DocsPageLayout navGroups={NAV_GROUPS} activeSection={section.value} componentSlug="select">
  {#snippet header()}
    <DocsHeader
      title={$tStore('title')}
      description={$tStore('description')}
      category={$tStore('category')}
      type={$tStore('type')}
      installNote="npx shadcn-svelte@latest add select"
    />
  {/snippet}

  <!-- ── Demonstração ─────────────────────────────────────────────────── -->
  <DocsDemonstration title={$tStore('demonstration.title')} componentSlug="select">
    {#snippet children()}
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full">
        <!-- Demo 1: default -->
        <div class="space-y-2" style="contain: layout">
          <p class="text-sm font-semibold">{demoLabels.stateLabel}</p>
          <Select type="single" bind:value={demoStateValue}>
            <SelectTrigger
              class="w-full"
              aria-label={demoLabels.stateLabel}
              data-track="demo"
              data-track-id="select:demo:state"
              data-track-label={demoLabels.stateLabel}
            >
              {#if demoStateValue}
                <span>{findLabel(stateOptions, demoStateValue)}</span>
              {:else}
                <span class="text-muted-foreground">{demoLabels.placeholder}</span>
              {/if}
            </SelectTrigger>
            <SelectContent>
              {#each stateOptions as opt (opt.value)}
                <SelectItem value={opt.value} label={opt.label} />
              {/each}
            </SelectContent>
          </Select>
        </div>

        <!-- Demo 2: groups -->
        <div class="space-y-2" style="contain: layout">
          <p class="text-sm font-semibold">{demoLabels.regionLabel}</p>
          <Select type="single" bind:value={demoRegionValue}>
            <SelectTrigger
              class="w-full"
              aria-label={demoLabels.regionLabel}
              data-track="demo"
              data-track-id="select:demo:region"
              data-track-label={demoLabels.regionLabel}
            >
              {#if demoRegionValue}
                <span>{findLabelInGroups(regionGroups, demoRegionValue)}</span>
              {:else}
                <span class="text-muted-foreground">{demoLabels.placeholder}</span>
              {/if}
            </SelectTrigger>
            <SelectContent>
              {#each regionGroups as group (group.label)}
                <SelectGroup>
                  <SelectGroupHeading>{group.label}</SelectGroupHeading>
                  {#each group.options as opt (opt.value)}
                    <SelectItem value={opt.value} label={opt.label} />
                  {/each}
                </SelectGroup>
              {/each}
            </SelectContent>
          </Select>
        </div>

        <!-- Demo 3: size sm -->
        <div class="space-y-2 sm:col-span-2" style="contain: layout">
          <p class="text-sm font-semibold">{demoLabels.stateLabel} (sm)</p>
          <Select type="single" bind:value={demoSmValue}>
            <SelectTrigger
              size="sm"
              class="w-56"
              aria-label={demoLabels.stateLabel}
              data-track="demo"
              data-track-id="select:demo:state-sm"
              data-track-label={demoLabels.stateLabel}
            >
              {#if demoSmValue}
                <span>{findLabel(stateOptions, demoSmValue)}</span>
              {:else}
                <span class="text-muted-foreground">{demoLabels.placeholder}</span>
              {/if}
            </SelectTrigger>
            <SelectContent>
              {#each stateOptions as opt (opt.value)}
                <SelectItem value={opt.value} label={opt.label} />
              {/each}
            </SelectContent>
          </Select>
        </div>
      </div>
    {/snippet}
  </DocsDemonstration>

  <!-- ── Anatomia ──────────────────────────────────────────────────────── -->
  <DocsAnatomy
    title={$tStore('anatomy.title')}
    items={[
      $tStore('anatomy.item1'),
      $tStore('anatomy.item2'),
      $tStore('anatomy.item3'),
      $tStore('anatomy.item4'),
      $tStore('anatomy.item5'),
      $tStore('anatomy.item6'),
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
          element: $tStore('usage.uxWriting.table.placeholder.name'),
          rules: $tStore('usage.uxWriting.table.placeholder.format'),
          do: $tStore('usage.uxWriting.table.placeholder.good'),
          dont: $tStore('usage.uxWriting.table.placeholder.bad'),
        },
        {
          element: $tStore('usage.uxWriting.table.itemLabel.name'),
          rules: $tStore('usage.uxWriting.table.itemLabel.format'),
          do: $tStore('usage.uxWriting.table.itemLabel.good'),
          dont: $tStore('usage.uxWriting.table.itemLabel.bad'),
        },
        {
          element: $tStore('usage.uxWriting.table.groupLabel.name'),
          rules: $tStore('usage.uxWriting.table.groupLabel.format'),
          do: $tStore('usage.uxWriting.table.groupLabel.good'),
          dont: $tStore('usage.uxWriting.table.groupLabel.bad'),
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
    <div style="contain: layout">
      <Select type="single" bind:value={dd1DoValue}>
        <SelectTrigger class="w-56" aria-label="Estado">
          {#if dd1DoValue}
            <span>{findLabel(stateOptions, dd1DoValue)}</span>
          {:else}
            <span class="text-muted-foreground">Selecione...</span>
          {/if}
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="sp" label="São Paulo" />
          <SelectItem value="rj" label="Rio de Janeiro" />
          <SelectItem value="mg" label="Minas Gerais" />
        </SelectContent>
      </Select>
    </div>
  {/snippet}

  {#snippet dd1Dont()}
    <div style="contain: layout">
      <Select type="single" bind:value={dd1DontValue}>
        <SelectTrigger class="w-56" aria-label="Estado">
          {#if dd1DontValue}
            <span>{dd1DontValue.toUpperCase()}</span>
          {:else}
            <span class="text-muted-foreground">Selecione...</span>
          {/if}
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="sp" label="SP" />
          <SelectItem value="rj" label="Rio de Janeiro" />
          <SelectItem value="mg" label="Minas Gerais" />
        </SelectContent>
      </Select>
    </div>
  {/snippet}

  {#snippet dd2Do()}
    <div style="contain: layout">
      <Select type="single" bind:value={dd2DoValue}>
        <SelectTrigger class="w-56" aria-label="Região">
          {#if dd2DoValue}
            <span>{findLabelInGroups(regionGroups, dd2DoValue)}</span>
          {:else}
            <span class="text-muted-foreground">Selecione...</span>
          {/if}
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectGroupHeading>Sudeste</SelectGroupHeading>
            <SelectItem value="sp" label="São Paulo" />
            <SelectItem value="rj" label="Rio de Janeiro" />
          </SelectGroup>
          <SelectGroup>
            <SelectGroupHeading>Sul</SelectGroupHeading>
            <SelectItem value="rs" label="Rio Grande do Sul" />
            <SelectItem value="sc" label="Santa Catarina" />
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  {/snippet}

  {#snippet dd2Dont()}
    <div style="contain: layout">
      <Select type="single" bind:value={dd2DontValue}>
        <SelectTrigger class="w-56" aria-label="Região">
          {#if dd2DontValue}
            <span>{dd2DontValue}</span>
          {:else}
            <span class="text-muted-foreground">Selecione...</span>
          {/if}
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectGroupHeading>Sudeste</SelectGroupHeading>
            <SelectItem value="sp" label="São Paulo" />
          </SelectGroup>
          <SelectGroup>
            <SelectGroupHeading>Sul</SelectGroupHeading>
            <SelectItem value="rs" label="Rio Grande do Sul" />
            <SelectItem value="sc" label="Santa Catarina" />
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  {/snippet}

  <!-- ── Importação ────────────────────────────────────────────────────── -->
  <DocsImport
    title={$tStore('import.title')}
    code={codeImport}
    componentSlug="select"
  />

  <!-- ── Variantes ─────────────────────────────────────────────────────── -->
  <DocsVariants
    title={$tStore('variants.title')}
    componentSlug="select"
    items={[
      {
        name: $tStore('variants.items.default'),
        description: stripHtml($tStore('variants.styles.default')),
        code: codeDefault,
        preview: variantDefault,
      },
      {
        name: $tStore('variants.items.withGroups'),
        description: stripHtml($tStore('variants.styles.withGroups')),
        code: codeWithGroups,
        preview: variantWithGroups,
      },
      {
        name: $tStore('variants.items.withIcon'),
        description: stripHtml($tStore('variants.styles.withIcon')),
        code: codeWithIcon,
        preview: variantWithIcon,
      },
    ]}
  />

  {#snippet variantDefault()}
    <div style="contain: layout">
      <Select type="single" bind:value={varDefaultValue}>
        <SelectTrigger class="w-56" aria-label={demoLabels.stateLabel}>
          {#if varDefaultValue}
            <span>{findLabel(stateOptions, varDefaultValue)}</span>
          {:else}
            <span class="text-muted-foreground">{demoLabels.placeholder}</span>
          {/if}
        </SelectTrigger>
        <SelectContent>
          {#each stateOptions as opt (opt.value)}
            <SelectItem value={opt.value} label={opt.label} />
          {/each}
        </SelectContent>
      </Select>
    </div>
  {/snippet}

  {#snippet variantWithGroups()}
    <div style="contain: layout">
      <Select type="single" bind:value={varGroupsValue}>
        <SelectTrigger class="w-56" aria-label={demoLabels.regionLabel}>
          {#if varGroupsValue}
            <span>{findLabelInGroups(regionGroups, varGroupsValue)}</span>
          {:else}
            <span class="text-muted-foreground">{demoLabels.placeholder}</span>
          {/if}
        </SelectTrigger>
        <SelectContent>
          {#each regionGroups as group (group.label)}
            <SelectGroup>
              <SelectGroupHeading>{group.label}</SelectGroupHeading>
              {#each group.options as opt (opt.value)}
                <SelectItem value={opt.value} label={opt.label} />
              {/each}
            </SelectGroup>
          {/each}
        </SelectContent>
      </Select>
    </div>
  {/snippet}

  {#snippet variantWithIcon()}
    <div style="contain: layout">
      <Select type="single" bind:value={varIconValue}>
        <SelectTrigger class="w-56" aria-label={demoLabels.stateLabel}>
          {#if varIconValue}
            <span class="flex items-center gap-2">
              <MapPinIcon class="size-4 text-muted-foreground" />
              <span>{findLabel(stateOptions, varIconValue)}</span>
            </span>
          {:else}
            <span class="text-muted-foreground">{demoLabels.placeholder}</span>
          {/if}
        </SelectTrigger>
        <SelectContent>
          {#each stateOptions as opt (opt.value)}
            <SelectItem value={opt.value} label={opt.label}>
              {#snippet children()}
                <MapPinIcon class="size-4 text-muted-foreground" />
                <span>{opt.label}</span>
              {/snippet}
            </SelectItem>
          {/each}
        </SelectContent>
      </Select>
    </div>
  {/snippet}

  <!-- ── Composições ──────────────────────────────────────────────────── -->
  <DocsCompositions
    title={$tStore('variants.compositionsTitle')}
    useWhenLabel={$tNavStore('common.useWhen')}
    componentSlug="select"
    items={[
      {
        name: $tStore('variants.compositions.states.name'),
        description: $tStore('variants.compositions.states.description'),
        useWhen: $tStore('variants.compositions.states.use'),
        code: `<div class="flex flex-col gap-2 w-80">
  <label for="state" class="text-sm font-semibold">Estado</label>
  <Select type="single" bind:value>
    <SelectTrigger id="state" aria-label="Estado" class="w-full" />
    <SelectContent>
      {#each stateOptions as opt (opt.value)}
        <SelectItem value={opt.value} label={opt.label} />
      {/each}
    </SelectContent>
  </Select>
</div>`,
        preview: compStatesSnippet,
      },
      {
        name: $tStore('variants.compositions.regionGroups.name'),
        description: $tStore('variants.compositions.regionGroups.description'),
        useWhen: $tStore('variants.compositions.regionGroups.use'),
        code: `<div class="flex flex-col gap-2 w-80">
  <label for="region" class="text-sm font-semibold">Região</label>
  <Select type="single" bind:value>
    <SelectTrigger id="region" aria-label="Região" class="w-full" />
    <SelectContent>
      {#each regionGroups as group (group.label)}
        <SelectGroup>
          <SelectGroupHeading>{group.label}</SelectGroupHeading>
          {#each group.options as opt (opt.value)}
            <SelectItem value={opt.value} label={opt.label} />
          {/each}
        </SelectGroup>
      {/each}
    </SelectContent>
  </Select>
</div>`,
        preview: compGroupsSnippet,
      },
      {
        name: $tStore('variants.compositions.inForm.name'),
        description: $tStore('variants.compositions.inForm.description'),
        useWhen: $tStore('variants.compositions.inForm.use'),
        code: `<form
  class="flex flex-col gap-4 w-80 p-4 border rounded-lg"
  onsubmit={(e) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    console.log('Estado:', data.get('state'));
  }}
>
  <div class="flex flex-col gap-2">
    <label for="form-state" class="text-sm font-semibold">Estado</label>
    <Select type="single" name="state" required bind:value>
      <SelectTrigger id="form-state" aria-label="Estado" class="w-full" />
      <SelectContent>
        {#each stateOptions as opt (opt.value)}
          <SelectItem value={opt.value} label={opt.label} />
        {/each}
      </SelectContent>
    </Select>
  </div>
  <button type="submit" class="self-end">Continuar</button>
</form>`,
        preview: compFormSnippet,
      },
    ]}
  />

  {#snippet compStatesSnippet()}
    <div class="flex flex-col gap-2 w-80" style="contain: layout">
      <label for="comp-state" class="text-sm font-semibold">{demoLabels.stateLabel}</label>
      <Select type="single" bind:value={compStatesValue}>
        <SelectTrigger id="comp-state" class="w-full" aria-label={demoLabels.stateLabel}>
          {#if compStatesValue}
            <span>{findLabel(stateOptions, compStatesValue)}</span>
          {:else}
            <span class="text-muted-foreground">{demoLabels.placeholder}</span>
          {/if}
        </SelectTrigger>
        <SelectContent>
          {#each stateOptions as opt (opt.value)}
            <SelectItem value={opt.value} label={opt.label} />
          {/each}
        </SelectContent>
      </Select>
    </div>
  {/snippet}

  {#snippet compGroupsSnippet()}
    <div class="flex flex-col gap-2 w-80" style="contain: layout">
      <label for="comp-region" class="text-sm font-semibold">{demoLabels.regionLabel}</label>
      <Select type="single" bind:value={compGroupsValue}>
        <SelectTrigger id="comp-region" class="w-full" aria-label={demoLabels.regionLabel}>
          {#if compGroupsValue}
            <span>{findLabelInGroups(regionGroups, compGroupsValue)}</span>
          {:else}
            <span class="text-muted-foreground">{demoLabels.placeholder}</span>
          {/if}
        </SelectTrigger>
        <SelectContent>
          {#each regionGroups as group (group.label)}
            <SelectGroup>
              <SelectGroupHeading>{group.label}</SelectGroupHeading>
              {#each group.options as opt (opt.value)}
                <SelectItem value={opt.value} label={opt.label} />
              {/each}
            </SelectGroup>
          {/each}
        </SelectContent>
      </Select>
    </div>
  {/snippet}

  {#snippet compFormSnippet()}
    <form
      class="flex flex-col gap-4 w-80 p-4 border rounded-lg"
      style="contain: layout"
      onsubmit={(e) => e.preventDefault()}
    >
      <div class="flex flex-col gap-2">
        <label for="comp-form-state" class="text-sm font-semibold">{demoLabels.stateLabel}</label>
        <Select type="single" name="state" bind:value={compFormValue}>
          <SelectTrigger id="comp-form-state" class="w-full" aria-label={demoLabels.stateLabel}>
            {#if compFormValue}
              <span>{findLabel(stateOptions, compFormValue)}</span>
            {:else}
              <span class="text-muted-foreground">{demoLabels.placeholder}</span>
            {/if}
          </SelectTrigger>
          <SelectContent>
            {#each stateOptions as opt (opt.value)}
              <SelectItem value={opt.value} label={opt.label} />
            {/each}
          </SelectContent>
        </Select>
      </div>
      <button
        type="submit"
        class="self-end inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-medium"
      >
        Continuar
      </button>
    </form>
  {/snippet}

  <!-- ── Estados ──────────────────────────────────────────────────────── -->
  <DocsStates
    title={$tStore('states.title')}
    cols={{
      state: 'Estado',
      trigger: 'Disparo',
      behavior: 'Comportamento',
    }}
    items={[
      { label: $tStore('states.items.default'),  trigger: '—',                       behavior: stripHtml($tStore('states.descriptions.default')) },
      { label: $tStore('states.items.open'),     trigger: 'data-state="open"',       behavior: stripHtml($tStore('states.descriptions.open')) },
      { label: $tStore('states.items.selected'), trigger: 'value="sp"',              behavior: stripHtml($tStore('states.descriptions.selected')) },
      { label: $tStore('states.items.hover'),    trigger: ':hover (item)',           behavior: stripHtml($tStore('states.descriptions.hover')) },
      { label: $tStore('states.items.focus'),    trigger: ':focus-visible',          behavior: stripHtml($tStore('states.descriptions.focus')) },
      { label: $tStore('states.items.disabled'), trigger: 'disabled',                behavior: stripHtml($tStore('states.descriptions.disabled')) },
      { label: $tStore('states.items.invalid'),  trigger: 'aria-invalid="true"',     behavior: stripHtml($tStore('states.descriptions.invalid')) },
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
          { name: 'value',         type: $tStore('props.table.value.type'),         defaultValue: $tStore('props.table.value.default'),         required: $tStore('props.table.value.required'),         description: stripHtml($tStore('props.table.value.description')) },
          { name: 'defaultValue',  type: $tStore('props.table.defaultValue.type'),  defaultValue: $tStore('props.table.defaultValue.default'),  required: $tStore('props.table.defaultValue.required'),  description: stripHtml($tStore('props.table.defaultValue.description')) },
          { name: 'onValueChange', type: $tStore('props.table.onValueChange.type'), defaultValue: $tStore('props.table.onValueChange.default'), required: $tStore('props.table.onValueChange.required'), description: stripHtml($tStore('props.table.onValueChange.description')) },
          { name: 'disabled',      type: $tStore('props.table.disabled.type'),      defaultValue: $tStore('props.table.disabled.default'),      required: $tStore('props.table.disabled.required'),      description: stripHtml($tStore('props.table.disabled.description')) },
          { name: 'name',          type: $tStore('props.table.name.type'),          defaultValue: $tStore('props.table.name.default'),          required: $tStore('props.table.name.required'),          description: stripHtml($tStore('props.table.name.description')) },
          { name: 'size',          type: $tStore('props.table.size.type'),          defaultValue: $tStore('props.table.size.default'),          required: $tStore('props.table.size.required'),          description: stripHtml($tStore('props.table.size.description')) },
          { name: 'placeholder',   type: $tStore('props.table.placeholder.type'),   defaultValue: $tStore('props.table.placeholder.default'),   required: $tStore('props.table.placeholder.required'),   description: stripHtml($tStore('props.table.placeholder.description')) },
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
      { token: '--input',              value: $tStore('tokens.table.input.class'),             description: $tStore('tokens.table.input.part') },
      { token: '--popover',            value: $tStore('tokens.table.popover.class'),           description: $tStore('tokens.table.popover.part') },
      { token: '--popover-foreground', value: $tStore('tokens.table.popoverForeground.class'), description: $tStore('tokens.table.popoverForeground.part') },
      { token: '--accent',             value: $tStore('tokens.table.accent.class'),            description: $tStore('tokens.table.accent.part') },
      { token: '--accent-foreground',  value: $tStore('tokens.table.accentForeground.class'),  description: $tStore('tokens.table.accentForeground.part') },
      { token: '--ring',               value: $tStore('tokens.table.ring.class'),              description: $tStore('tokens.table.ring.part') },
      { token: '--destructive',        value: $tStore('tokens.table.destructive.class'),       description: $tStore('tokens.table.destructive.part') },
      { token: '--muted-foreground',   value: $tStore('tokens.table.mutedForeground.class'),   description: $tStore('tokens.table.mutedForeground.part') },
    ]}
    customizationTitle={$tStore('tokens.customizationTitle')}
    customizationCode={$tStore('tokens.customizationCode')}
  />

  <!-- ── Acessibilidade ───────────────────────────────────────────────── -->
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
      { key: 'Tab',         description: stripHtml($tStore('accessibility.keyboard.tab')) },
      { key: 'Enter',       description: stripHtml($tStore('accessibility.keyboard.enter')) },
      { key: 'Space',       description: stripHtml($tStore('accessibility.keyboard.space')) },
      { key: '↓ ArrowDown', description: stripHtml($tStore('accessibility.keyboard.arrowDown')) },
      { key: '↑ ArrowUp',   description: stripHtml($tStore('accessibility.keyboard.arrowUp')) },
      { key: 'Home',        description: stripHtml($tStore('accessibility.keyboard.home')) },
      { key: 'End',         description: stripHtml($tStore('accessibility.keyboard.end')) },
      { key: 'Escape',      description: stripHtml($tStore('accessibility.keyboard.escape')) },
      { key: 'A-Z',         description: stripHtml($tStore('accessibility.keyboard.typeAhead')) },
    ]}
  />

  <!-- ── Relacionados ──────────────────────────────────────────────────── -->
  <DocsRelated
    title={$tStore('related.title')}
    items={[
      { name: $tStore('related.items.combobox.name'),   description: $tStore('related.items.combobox.description'),   path: '?path=/docs/ui-combobox--docs' },
      { name: $tStore('related.items.radioGroup.name'), description: $tStore('related.items.radioGroup.description'), path: '?path=/docs/ui-radiogroup--docs' },
      { name: $tStore('related.items.dropdownMenu.name'), description: $tStore('related.items.dropdownMenu.description'), path: '?path=/docs/ui-dropdownmenu--docs' },
      { name: $tStore('related.items.form.name'),       description: $tStore('related.items.form.description'),       path: '?path=/docs/ui-form--docs' },
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
      trigger: $tStore('analytics.table.trigger'),
      payload: $tStore('analytics.table.payload'),
    }}
    items={[
      {
        event: 'option_select',
        trigger: $tStore('analytics.table.option_select.trigger'),
        payload: $tStore('analytics.table.option_select.payload'),
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
        { action: stripHtml($tStore('testes.functional.item1.action')), result: stripHtml($tStore('testes.functional.item1.result')), priority: localPriority($tStore('testes.functional.item1.priority'), $tNavStore) },
        { action: stripHtml($tStore('testes.functional.item2.action')), result: stripHtml($tStore('testes.functional.item2.result')), priority: localPriority($tStore('testes.functional.item2.priority'), $tNavStore) },
        { action: stripHtml($tStore('testes.functional.item3.action')), result: stripHtml($tStore('testes.functional.item3.result')), priority: localPriority($tStore('testes.functional.item3.priority'), $tNavStore) },
        { action: stripHtml($tStore('testes.functional.item4.action')), result: stripHtml($tStore('testes.functional.item4.result')), priority: localPriority($tStore('testes.functional.item4.priority'), $tNavStore) },
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
