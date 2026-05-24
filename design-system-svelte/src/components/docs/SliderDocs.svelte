<script lang="ts">
  import { Slider } from '@/components/ui/slider';
  import { Label } from '@/components/ui/label';
  import { Button } from '@/components/ui/button';
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
  import sliderTranslations from '@shared/content/slider/translations.json';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(sliderTranslations);

  // ─── SEO + Analytics ─────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale: l,
      componentSlug: 'slider',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      aiIntent: (t('seo.aiIntent') as 'informational' | 'navigational') ?? 'informational',
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: t('category'), item: '/components/form' },
        { name: t('title') },
      ],
    });
    track('docs_page_view', {
      component_name: 'slider',
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
    track('docs_section_viewed', { section_id: id, component_name: 'slider', locale: $locale });
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

  // ─── Demo state ──────────────────────────────────────────────────────────────

  let demoVolume = $state<number[]>([50]);
  let demoBrightness = $state<number[]>([70]);
  let demoPriceRange = $state<number[]>([100, 400]);

  // Composições
  let compVolume = $state<number[]>([50]);
  let compBrightness = $state<number[]>([75]);
  let compPrice = $state<number[]>([100, 400]);
  let compFormVolume = $state<number[]>([60]);
  let compFormCommitted = $state<number>(60);
  function onCompFormSubmit(e: SubmitEvent) {
    e.preventDefault();
    compFormCommitted = compFormVolume[0];
  }

  // ─── Code strings ────────────────────────────────────────────────────────────

  const codeImport = `import { Slider } from "@/components/ui/slider";`;

  const codeSingle = `<script lang="ts">
  let value = $state([50]);
<\/script>

<Slider bind:value min={0} max={100} step={1} aria-label="Volume" />`;

  const codeRange = `<script lang="ts">
  let value = $state([20, 80]);
<\/script>

<Slider bind:value min={0} max={100} step={1} aria-label="Faixa de preço" />`;

  const codeVertical = `<div class="h-40 flex justify-center">
  <Slider
    bind:value
    orientation="vertical"
    min={0}
    max={100}
    aria-label="Brilho"
  />
</div>`;

  const codeCompVolume = `<script lang="ts">
  let value = $state([50]);
<\/script>

<div class="space-y-3 w-72">
  <div class="flex items-center justify-between">
    <Label>Volume</Label>
    <span aria-live="polite" class="text-sm tabular-nums">{value[0]}%</span>
  </div>
  <Slider bind:value min={0} max={100} aria-label="Volume" />
</div>`;

  const codeCompBrightness = `<Slider
  bind:value
  min={0}
  max={100}
  step={5}
  aria-label="Brilho"
/>`;

  const codeCompPrice = `<script lang="ts">
  let range = $state([100, 400]);
<\/script>

<Slider
  bind:value={range}
  min={0}
  max={1000}
  step={10}
  aria-label="Faixa de preço"
/>`;

  const codeCompForm = `<form aria-label="Configurações de áudio" onsubmit={onSubmit}>
  <Label>Volume</Label>
  <Slider
    bind:value
    onValueCommit={(v) => track('slider_change', {
      component: 'slider',
      field_name: 'volume',
      value: v[0],
    })}
    min={0}
    max={100}
    aria-label="Volume"
  />
  <Button type="submit">Salvar</Button>
</form>`;

  const interfaceCode = `// Slider (root, bits-ui)
interface SliderProps {
  value?: number[];        // SEMPRE array, mesmo single
  defaultValue?: number[];
  min?: number;            // 0
  max?: number;            // 100
  step?: number;           // 1
  orientation?: 'horizontal' | 'vertical';
  disabled?: boolean;
  onValueChange?: (v: number[]) => void;
  onValueCommit?: (v: number[]) => void;
  'aria-label': string;    // obrigatório
  class?: string;
}`;
</script>

<DocsPageLayout navGroups={NAV_GROUPS} activeSection={section.value}>
  {#snippet header()}
    <DocsHeader
      title={$tStore('title')}
      description={$tStore('description')}
      category={$tStore('category')}
      type={$tStore('type')}
      installNote="npx shadcn-svelte@latest add slider"
    />
  {/snippet}

  <!-- ── Demonstração ───────────────────────────────────────────── -->
  <DocsDemonstration title={$tStore('demonstration.title')}>
    {#snippet children()}
      <div class="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Single — Volume -->
        <div class="space-y-2">
          <p class="text-xs font-medium text-muted-foreground">{$tStore('demonstration.labels.single')}</p>
          <div class="p-4 border rounded-md space-y-3">
            <div class="flex items-center justify-between">
              <Label>{$tStore('demonstration.labels.volume')}</Label>
              <span class="text-sm tabular-nums" aria-live="polite">{demoVolume[0]}%</span>
            </div>
            <Slider
              bind:value={demoVolume}
              min={0}
              max={100}
              step={1}
              aria-label={$tStore('demonstration.labels.volume')}
            />
          </div>
        </div>

        <!-- Range — Preço -->
        <div class="space-y-2">
          <p class="text-xs font-medium text-muted-foreground">{$tStore('demonstration.labels.range')}</p>
          <div class="p-4 border rounded-md space-y-3">
            <div class="flex items-center justify-between">
              <Label>{$tStore('demonstration.labels.priceRange')}</Label>
              <span class="text-sm tabular-nums" aria-live="polite">
                R$ {demoPriceRange[0]} — R$ {demoPriceRange[1]}
              </span>
            </div>
            <Slider
              bind:value={demoPriceRange}
              min={0}
              max={500}
              step={10}
              aria-label={$tStore('demonstration.labels.priceRange')}
            />
          </div>
        </div>

        <!-- Vertical — Brilho -->
        <div class="space-y-2">
          <p class="text-xs font-medium text-muted-foreground">{$tStore('demonstration.labels.vertical')}</p>
          <div class="p-4 border rounded-md space-y-3">
            <div class="flex items-center justify-between w-40">
              <Label>{$tStore('demonstration.labels.brightness')}</Label>
              <span class="text-sm tabular-nums" aria-live="polite">{demoBrightness[0]}%</span>
            </div>
            <div class="h-40 flex justify-center">
              <Slider
                bind:value={demoBrightness}
                orientation="vertical"
                min={0}
                max={100}
                step={1}
                aria-label={$tStore('demonstration.labels.brightness')}
              />
            </div>
          </div>
        </div>

        <!-- Disabled -->
        <div class="space-y-2">
          <p class="text-xs font-medium text-muted-foreground">Disabled</p>
          <div class="p-4 border rounded-md space-y-3">
            <div class="flex items-center justify-between">
              <Label>{$tStore('demonstration.labels.volume')}</Label>
              <span class="text-sm tabular-nums">30%</span>
            </div>
            <Slider value={[30]} min={0} max={100} disabled aria-label={$tStore('demonstration.labels.volume')} />
          </div>
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
      $tStore('anatomy.item4'),
      $tStore('anatomy.item5'),
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
        { element: $tStore('usage.uxWriting.table.ariaLabel.name'),    rules: $tStore('usage.uxWriting.table.ariaLabel.format'),    do: $tStore('usage.uxWriting.table.ariaLabel.good'),    dont: $tStore('usage.uxWriting.table.ariaLabel.bad') },
        { element: $tStore('usage.uxWriting.table.valueDisplay.name'), rules: $tStore('usage.uxWriting.table.valueDisplay.format'), do: $tStore('usage.uxWriting.table.valueDisplay.good'), dont: $tStore('usage.uxWriting.table.valueDisplay.bad') },
        { element: $tStore('usage.uxWriting.table.range.name'),        rules: $tStore('usage.uxWriting.table.range.format'),        do: $tStore('usage.uxWriting.table.range.good'),        dont: $tStore('usage.uxWriting.table.range.bad') },
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
    <div class="w-full space-y-2">
      <div class="flex items-center justify-between">
        <Label>Volume</Label>
        <span class="text-sm tabular-nums" aria-live="polite">60%</span>
      </div>
      <Slider value={[60]} min={0} max={100} aria-label="Volume" />
    </div>
  {/snippet}
  {#snippet dontPair1()}
    <div class="w-full space-y-2">
      <Label>Volume</Label>
      <Slider value={[60]} min={0} max={100} aria-label="Volume" />
    </div>
  {/snippet}
  {#snippet doPair2()}
    <div class="w-full">
      <Slider value={[60]} min={0} max={100} aria-label="Volume" />
    </div>
  {/snippet}
  {#snippet dontPair2()}
    <div class="w-full">
      <Slider value={[60]} min={0} max={100} aria-label="Slider" />
    </div>
  {/snippet}

  <!-- ── Importação ─────────────────────────────────────────────── -->
  <DocsImport title={$tStore('import.title')} code={codeImport} />

  <!-- ── Variantes ──────────────────────────────────────────────── -->
  <DocsVariants
    title={$tStore('variants.title')}
    items={[
      { name: $tStore('variants.items.single'),   description: stripHtml($tStore('variants.styles.single')),   code: codeSingle,   preview: variantSingle   },
      { name: $tStore('variants.items.range'),    description: stripHtml($tStore('variants.styles.range')),    code: codeRange,    preview: variantRange    },
      { name: $tStore('variants.items.vertical'), description: stripHtml($tStore('variants.styles.vertical')), code: codeVertical, preview: variantVertical },
    ]}
  />

  {#snippet variantSingle()}
    <div class="w-64">
      <Slider value={[50]} min={0} max={100} aria-label="Volume" />
    </div>
  {/snippet}
  {#snippet variantRange()}
    <div class="w-64">
      <Slider value={[20, 80]} min={0} max={100} aria-label="Faixa" />
    </div>
  {/snippet}
  {#snippet variantVertical()}
    <div class="h-40 flex justify-center">
      <Slider value={[50]} orientation="vertical" min={0} max={100} aria-label="Brilho" />
    </div>
  {/snippet}

  <!-- ── Composições ────────────────────────────────────────────── -->
  <DocsCompositions
    title={$tStore('variants.compositionsTitle')}
    useWhenLabel={$tNavStore('common.useWhen')}
    componentSlug="slider"
    items={[
      {
        name: $tStore('variants.compositions.volume.name'),
        description: $tStore('variants.compositions.volume.description'),
        useWhen: $tStore('variants.compositions.volume.use'),
        code: codeCompVolume,
        preview: compVolumePreview,
      },
      {
        name: $tStore('variants.compositions.brightness.name'),
        description: $tStore('variants.compositions.brightness.description'),
        useWhen: $tStore('variants.compositions.brightness.use'),
        code: codeCompBrightness,
        preview: compBrightnessPreview,
      },
      {
        name: $tStore('variants.compositions.priceRange.name'),
        description: $tStore('variants.compositions.priceRange.description'),
        useWhen: $tStore('variants.compositions.priceRange.use'),
        code: codeCompPrice,
        preview: compPricePreview,
      },
      {
        name: $tStore('variants.compositions.form.name'),
        description: $tStore('variants.compositions.form.description'),
        useWhen: $tStore('variants.compositions.form.use'),
        code: codeCompForm,
        preview: compFormPreview,
      },
    ]}
  />

  {#snippet compVolumePreview()}
    <div class="space-y-3 w-72">
      <div class="flex items-center justify-between">
        <Label>Volume</Label>
        <span aria-live="polite" class="text-sm tabular-nums">{compVolume[0]}%</span>
      </div>
      <Slider bind:value={compVolume} min={0} max={100} aria-label="Volume" />
    </div>
  {/snippet}

  {#snippet compBrightnessPreview()}
    <div class="space-y-3 w-72">
      <div class="flex items-center justify-between">
        <Label>Brilho</Label>
        <span aria-live="polite" class="text-sm tabular-nums">{compBrightness[0]}%</span>
      </div>
      <Slider bind:value={compBrightness} min={0} max={100} step={5} aria-label="Brilho" />
    </div>
  {/snippet}

  {#snippet compPricePreview()}
    <div class="space-y-3 w-72">
      <div class="flex items-center justify-between">
        <Label>Faixa de preço</Label>
        <span aria-live="polite" class="text-sm tabular-nums">
          R$ {compPrice[0]} — R$ {compPrice[1]}
        </span>
      </div>
      <Slider bind:value={compPrice} min={0} max={1000} step={10} aria-label="Faixa de preço" />
    </div>
  {/snippet}

  {#snippet compFormPreview()}
    <form
      aria-label="Configurações de áudio"
      class="flex flex-col gap-4 w-72"
      onsubmit={onCompFormSubmit}
    >
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <Label>Volume</Label>
          <span aria-live="polite" class="text-sm tabular-nums">{compFormVolume[0]}%</span>
        </div>
        <Slider
          bind:value={compFormVolume}
          onValueCommit={(v: number[]) => (compFormCommitted = v[0])}
          min={0}
          max={100}
          aria-label="Volume"
        />
      </div>
      <Button type="submit" size="sm" class="self-start">Salvar</Button>
      <p class="text-xs text-muted-foreground" aria-live="polite">
        Último commit: {compFormCommitted}%
      </p>
    </form>
  {/snippet}

  <!-- ── Estados ────────────────────────────────────────────────── -->
  <DocsStates
    title={$tStore('states.title')}
    cols={{
      state: $tStore('states.title'),
      trigger: 'Trigger',
      behavior: $tStore('usage.scenarios.cols.scenario'),
    }}
    items={[
      { label: $tStore('states.items.default'),  trigger: '—',         behavior: stripHtml($tStore('states.descriptions.default'))  },
      { label: $tStore('states.items.hover'),    trigger: 'mouseover', behavior: stripHtml($tStore('states.descriptions.hover'))    },
      { label: $tStore('states.items.focus'),    trigger: 'Tab',       behavior: stripHtml($tStore('states.descriptions.focus'))    },
      { label: $tStore('states.items.active'),   trigger: 'drag',      behavior: stripHtml($tStore('states.descriptions.active'))   },
      { label: $tStore('states.items.disabled'), trigger: 'disabled',  behavior: stripHtml($tStore('states.descriptions.disabled')) },
    ]}
  />

  <!-- ── Propriedades ───────────────────────────────────────────── -->
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
          { name: 'value',            type: $tStore('props.table.value.type'),            defaultValue: $tStore('props.table.value.default'),            required: $tStore('props.table.value.required'),            description: $tStore('props.table.value.description') },
          { name: 'defaultValue',     type: $tStore('props.table.defaultValue.type'),     defaultValue: $tStore('props.table.defaultValue.default'),     required: $tStore('props.table.defaultValue.required'),     description: $tStore('props.table.defaultValue.description') },
          { name: 'onValueChange',    type: $tStore('props.table.onValueChange.type'),    defaultValue: $tStore('props.table.onValueChange.default'),    required: $tStore('props.table.onValueChange.required'),    description: $tStore('props.table.onValueChange.description') },
          { name: 'onValueCommit',    type: $tStore('props.table.onValueCommitted.type'), defaultValue: $tStore('props.table.onValueCommitted.default'), required: $tStore('props.table.onValueCommitted.required'), description: $tStore('props.table.onValueCommitted.description') },
          { name: 'min',              type: $tStore('props.table.min.type'),              defaultValue: $tStore('props.table.min.default'),              required: $tStore('props.table.min.required'),              description: $tStore('props.table.min.description') },
          { name: 'max',              type: $tStore('props.table.max.type'),              defaultValue: $tStore('props.table.max.default'),              required: $tStore('props.table.max.required'),              description: $tStore('props.table.max.description') },
          { name: 'step',             type: $tStore('props.table.step.type'),             defaultValue: $tStore('props.table.step.default'),             required: $tStore('props.table.step.required'),             description: $tStore('props.table.step.description') },
          { name: 'orientation',      type: $tStore('props.table.orientation.type'),      defaultValue: $tStore('props.table.orientation.default'),      required: $tStore('props.table.orientation.required'),      description: $tStore('props.table.orientation.description') },
          { name: 'disabled',         type: $tStore('props.table.disabled.type'),         defaultValue: $tStore('props.table.disabled.default'),         required: $tStore('props.table.disabled.required'),         description: $tStore('props.table.disabled.description') },
          { name: 'aria-label',       type: 'string',                                     defaultValue: '—',                                             required: 'Sim',                                            description: 'Obrigatório. Descreve o valor controlado para leitores de tela.' },
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
      { token: '--muted',            value: $tStore('tokens.table.muted.class'),           description: $tStore('tokens.table.muted.part')           },
      { token: '--primary',          value: $tStore('tokens.table.primary.class'),         description: $tStore('tokens.table.primary.part')         },
      { token: '--ring',             value: $tStore('tokens.table.ring.class'),            description: $tStore('tokens.table.ring.part')            },
      { token: '--background',       value: $tStore('tokens.table.background.class'),      description: $tStore('tokens.table.background.part')      },
      { token: '--foreground',       value: $tStore('tokens.table.foreground.class'),      description: $tStore('tokens.table.foreground.part')      },
      { token: '--muted-foreground', value: $tStore('tokens.table.mutedForeground.class'), description: $tStore('tokens.table.mutedForeground.part') },
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
      { key: 'Tab',        description: $tStore('accessibility.keyboard.tab')        },
      { key: 'ArrowRight', description: stripHtml($tStore('accessibility.keyboard.arrowRight')) },
      { key: 'ArrowLeft',  description: stripHtml($tStore('accessibility.keyboard.arrowLeft'))  },
      { key: 'ArrowUp',    description: stripHtml($tStore('accessibility.keyboard.arrowUp'))    },
      { key: 'ArrowDown',  description: stripHtml($tStore('accessibility.keyboard.arrowDown'))  },
      { key: 'Home',       description: stripHtml($tStore('accessibility.keyboard.home'))       },
      { key: 'End',        description: stripHtml($tStore('accessibility.keyboard.end'))        },
      { key: 'PageUp',     description: $tStore('accessibility.keyboard.pageUp')     },
      { key: 'PageDown',   description: $tStore('accessibility.keyboard.pageDown')   },
    ]}
  />

  <!-- ── Relacionados ───────────────────────────────────────────── -->
  <DocsRelated
    title={$tStore('related.title')}
    items={[
      { name: $tStore('related.items.input.name'),      description: $tStore('related.items.input.description'),      path: '?path=/docs/ui-input--docs'      },
      { name: $tStore('related.items.switch.name'),     description: $tStore('related.items.switch.description'),     path: '?path=/docs/ui-switch--docs'     },
      { name: $tStore('related.items.progress.name'),   description: $tStore('related.items.progress.description'),   path: '?path=/docs/ui-progress--docs'   },
      { name: $tStore('related.items.radioGroup.name'), description: $tStore('related.items.radioGroup.description'), path: '?path=/docs/ui-radiogroup--docs' },
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
      { event: 'slider_change', trigger: $tStore('analytics.table.slider_change.trigger'), payload: $tStore('analytics.table.slider_change.payload') },
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
      items: [
        { action: $tStore('testes.functional.item1.action'), result: $tStore('testes.functional.item1.result'), priority: localPriority($tStore('testes.functional.item1.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item2.action'), result: $tStore('testes.functional.item2.result'), priority: localPriority($tStore('testes.functional.item2.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item3.action'), result: $tStore('testes.functional.item3.result'), priority: localPriority($tStore('testes.functional.item3.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item4.action'), result: $tStore('testes.functional.item4.result'), priority: localPriority($tStore('testes.functional.item4.priority'), $tNavStore) },
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
        { criterion: $tStore('testes.accessibility.item1'), level: 'AA',     how: 'axe-core'           },
        { criterion: $tStore('testes.accessibility.item2'), level: '1.4.11', how: 'Contrast checker'   },
        { criterion: $tStore('testes.accessibility.item3'), level: '2.4.7',  how: 'DevTools a11y tree' },
        { criterion: $tStore('testes.accessibility.item4'), level: '4.1.2',  how: 'DevTools a11y tree' },
        { criterion: $tStore('testes.accessibility.item5'), level: '4.1.2',  how: 'DevTools a11y tree' },
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
      ],
    }}
  />
</DocsPageLayout>
