<script lang="ts">
  import { Calendar } from '@/components/ui/calendar';
  import CalendarStory from '@/components/ui/calendar/CalendarStory.svelte';
  import { CalendarDate, type DateValue } from '@internationalized/date';
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
  import calendarTranslations from '@shared/content/calendar/translations.json';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(calendarTranslations);

  // ─── SEO + Analytics ─────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale: l,
      componentSlug: 'calendar',
    });
    track('docs_page_view', {
      component_name: 'calendar',
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
    track('docs_section_viewed', { section_id: id, component_name: 'calendar', locale: $locale });
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

  // ─── Locale string for preview (bits-ui usa string, não Locale object) ───
  const previewLocale = $derived($locale === 'en' ? 'en-US' : $locale === 'es' ? 'es-ES' : 'pt-BR');

  // ─── DateValue hoje para Demonstração direta (state) ─────────────────────
  const today = new Date();
  const todayDV = new CalendarDate(today.getFullYear(), today.getMonth() + 1, today.getDate());
  let demoValue = $state<DateValue | undefined>(todayDV);

  // ─── Code strings ────────────────────────────────────────────────────────────

  const codeImportBasic = `import { Calendar } from '@/components/ui/calendar';`;

  const codeImportWithLocale = `<script lang="ts">
  import { Calendar } from '@/components/ui/calendar';
  import { CalendarDate, type DateValue } from '@internationalized/date';

  let value = $state<DateValue | undefined>();
<\/script>

<Calendar type="single" bind:value locale="pt-BR" />`;

  const codeSingle = `<script lang="ts">
  import { Calendar } from '@/components/ui/calendar';
  import type { DateValue } from '@internationalized/date';

  let value = $state<DateValue | undefined>();
<\/script>

<Calendar type="single" bind:value locale="pt-BR" />`;

  const codeMultiple = `<script lang="ts">
  import { Calendar } from '@/components/ui/calendar';
  import type { DateValue } from '@internationalized/date';

  let values = $state<DateValue[]>([]);
<\/script>

<Calendar type="multiple" bind:value={values} locale="pt-BR" />`;

  const codeCaptionDropdown = `<Calendar
  type="single"
  bind:value
  locale="pt-BR"
  captionLayout="dropdown"
/>`;

  const codeTwoMonths = `<Calendar
  type="single"
  bind:value
  locale="pt-BR"
  numberOfMonths={2}
/>`;

  const codeDisabled = `<script lang="ts">
  import { Calendar } from '@/components/ui/calendar';
  import { CalendarDate, type DateValue } from '@internationalized/date';

  const today = new Date();
  const todayDV = new CalendarDate(today.getFullYear(), today.getMonth() + 1, today.getDate());

  function isPast(date: DateValue): boolean {
    return date.compare(todayDV) < 0;
  }
<\/script>

<Calendar type="single" locale="pt-BR" isDateDisabled={isPast} />`;

  const codeCustomizationTokens = `/* app.css — personalize as cores e dimensões do Calendar via tokens */
:root {
  --primary: 240 5.9% 10%;
  --primary-foreground: 0 0% 98%;
  --muted: 240 4.8% 95.9%;
  --muted-foreground: 240 3.8% 46.1%;
  --ring: 240 5% 64.9%;
  --radius-md: 0.375rem;
}`;

  const interfaceCode = `// Calendar (wrapper sobre bits-ui)
interface CalendarProps {
  type: 'single' | 'multiple';
  value?: DateValue | DateValue[];
  placeholder?: DateValue;
  onValueChange?: (v: DateValue | DateValue[] | undefined) => void;
  locale?: string;                       // "pt-BR" | "en-US" | "es-ES"
  isDateDisabled?: (date: DateValue) => boolean;
  isDateUnavailable?: (date: DateValue) => boolean;
  minValue?: DateValue;
  maxValue?: DateValue;
  numberOfMonths?: number;               // default 1
  weekdayFormat?: 'long' | 'short' | 'narrow'; // default "short"
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  fixedWeeks?: boolean;                  // exibe sempre 6 semanas
  captionLayout?: 'label' | 'dropdown' | 'dropdown-months' | 'dropdown-years';
  buttonVariant?: 'default' | 'ghost' | 'outline' | 'secondary' | 'link';
  months?: number[];                     // 1-12 subset p/ dropdown
  years?: number[];                      // subset p/ dropdown
  monthFormat?: 'long' | 'short' | 'narrow' | 'numeric' | '2-digit';
  yearFormat?: 'numeric' | '2-digit';
  disableDaysOutsideMonth?: boolean;
  initialFocus?: boolean;
  pagedNavigation?: boolean;
  class?: string;
  day?: Snippet<[{ day: DateValue; outsideMonth: boolean }]>;
}`;
</script>

<DocsPageLayout navGroups={NAV_GROUPS} activeSection={section.value}>
  {#snippet header()}
    <DocsHeader
      title={$tStore('title')}
      description={$tStore('description')}
      category={$tStore('category')}
      type={$tStore('type')}
      installNote="npx shadcn-svelte@latest add calendar"
    />
  {/snippet}

  <!-- ── Demonstração ───────────────────────────────────────────── -->
  <DocsDemonstration title={$tStore('demonstration.title')}>
    {#snippet children()}
      <div class="flex flex-col items-center gap-3">
        <Calendar
          type="single"
          bind:value={demoValue}
          locale={previewLocale}
        />
        <p class="text-xs text-muted-foreground">
          {#if demoValue}
            {$tStore('demonstration.labels.singleLabel')}: {demoValue.toString()}
          {:else}
            {$tStore('demonstration.labels.noDate')}
          {/if}
        </p>
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
    ]}
    structureLabel={$tStore('anatomy.structureLabel')}
    structureCode={`<Calendar                             <!-- wrapper bits-ui -->
  type="single"                       <!-- single | multiple -->
  bind:value={value}                  <!-- DateValue | DateValue[] -->
  locale="pt-BR"                      <!-- string (bits-ui) -->
  captionLayout="label"               <!-- label | dropdown -->
  isDateDisabled={matcher}            <!-- (d: DateValue) => boolean -->
/>`}
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
        $tStore('usage.guidelines.item5'),
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
    uxWriting={{
      title: $tStore('usage.uxWriting.title'),
      cols: {
        element: $tStore('usage.uxWriting.table.element'),
        rules: $tStore('usage.uxWriting.table.rules'),
        do: $tStore('usage.uxWriting.table.correct'),
        dont: $tStore('usage.uxWriting.table.avoid'),
      },
      items: [
        { element: $tStore('usage.uxWriting.table.label.name'),    rules: stripHtml($tStore('usage.uxWriting.table.label.format')),    do: $tStore('usage.uxWriting.table.label.good'),    dont: $tStore('usage.uxWriting.table.label.bad') },
        { element: $tStore('usage.uxWriting.table.trigger.name'),  rules: stripHtml($tStore('usage.uxWriting.table.trigger.format')),  do: $tStore('usage.uxWriting.table.trigger.good'),  dont: $tStore('usage.uxWriting.table.trigger.bad') },
        { element: $tStore('usage.uxWriting.table.disabled.name'), rules: stripHtml($tStore('usage.uxWriting.table.disabled.format')), do: stripHtml($tStore('usage.uxWriting.table.disabled.good')), dont: $tStore('usage.uxWriting.table.disabled.bad') },
        { element: $tStore('usage.uxWriting.table.srOnly.name'),   rules: stripHtml($tStore('usage.uxWriting.table.srOnly.format')),   do: $tStore('usage.uxWriting.table.srOnly.good'),   dont: $tStore('usage.uxWriting.table.srOnly.bad') },
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
        doCaption: stripHtml($tStore('doDont.pair1.do')),
        dontCaption: stripHtml($tStore('doDont.pair1.dont')),
        doPreview: doPair1,
        dontPreview: dontPair1,
      },
      {
        doLabel: $tNavStore('common.do'),
        dontLabel: $tNavStore('common.dont'),
        doCaption: stripHtml($tStore('doDont.pair2.do')),
        dontCaption: $tStore('doDont.pair2.dont'),
        doPreview: doPair2,
        dontPreview: dontPair2,
      },
    ]}
  />

  {#snippet doPair1()}
    <CalendarStory variant="single" locale={previewLocale} />
  {/snippet}
  {#snippet dontPair1()}
    <CalendarStory variant="single" locale="en-US" />
  {/snippet}
  {#snippet doPair2()}
    <CalendarStory variant="disabled" locale={previewLocale} />
  {/snippet}
  {#snippet dontPair2()}
    <CalendarStory variant="single" locale={previewLocale} />
  {/snippet}

  <!-- ── Importação ─────────────────────────────────────────────── -->
  <DocsImport
    title={$tStore('import.title')}
    description={$tStore('import.basic')}
    code={codeImportBasic}
    secondaryDescription={$tStore('import.withLocale')}
    secondaryCode={codeImportWithLocale}
  />

  <!-- ── Modos e Layouts (Variants) ─────────────────────────────── -->
  <DocsVariants
    title={$tStore('variants.visualTitle')}
    items={[
      { name: 'type="single"',              description: stripHtml($tStore('variants.items.single')),          code: codeSingle,          preview: variantSingle          },
      { name: 'type="multiple"',            description: stripHtml($tStore('variants.items.multiple')),        code: codeMultiple,        preview: variantMultiple        },
      { name: 'captionLayout="dropdown"',   description: stripHtml($tStore('variants.items.captionDropdown')), code: codeCaptionDropdown, preview: variantCaptionDropdown },
      { name: 'numberOfMonths={2}',         description: stripHtml($tStore('variants.items.numberOfMonths')),  code: codeTwoMonths,       preview: variantTwoMonths       },
    ]}
  />

  {#snippet variantSingle()}
    <CalendarStory variant="single" locale={previewLocale} />
  {/snippet}
  {#snippet variantMultiple()}
    <CalendarStory variant="multiple" locale={previewLocale} />
  {/snippet}
  {#snippet variantCaptionDropdown()}
    <CalendarStory variant="captionDropdown" locale={previewLocale} />
  {/snippet}
  {#snippet variantTwoMonths()}
    <CalendarStory variant="twoMonths" locale={previewLocale} />
  {/snippet}

  <!-- ── Composições ─────────────────────────────────────────────── -->
  <DocsCompositions
    title={$tStore('variants.compositionsTitle')}
    useWhenLabel={$tNavStore('common.useWhen')}
    componentSlug="calendar"
    items={[
      {
        name: $tStore('variants.compositions.inlineBordered.name'),
        description: $tStore('variants.compositions.inlineBordered.description'),
        useWhen: $tStore('variants.compositions.inlineBordered.use'),
        code: `<div class="rounded-md border">
  <Calendar type="single" bind:value locale="pt-BR" />
</div>`,
        preview: compInline,
      },
      {
        name: $tStore('variants.compositions.disabledPast.name'),
        description: $tStore('variants.compositions.disabledPast.description'),
        useWhen: $tStore('variants.compositions.disabledPast.use'),
        code: `<Calendar
  type="single"
  bind:value
  locale="pt-BR"
  isDateDisabled={(d) => d.compare(today(getLocalTimeZone())) < 0}
/>`,
        preview: compDisabledPast,
      },
      {
        name: $tStore('variants.compositions.rangeTwoMonths.name'),
        description: $tStore('variants.compositions.rangeTwoMonths.description'),
        useWhen: $tStore('variants.compositions.rangeTwoMonths.use'),
        code: `<Calendar
  type="single"
  bind:value
  locale="pt-BR"
  numberOfMonths={2}
/>`,
        preview: compTwoMonths,
      },
    ]}
  />

  {#snippet compInline()}
    <div class="rounded-md border">
      <CalendarStory variant="single" locale={previewLocale} />
    </div>
  {/snippet}
  {#snippet compDisabledPast()}
    <CalendarStory variant="disabled" locale={previewLocale} />
  {/snippet}
  {#snippet compTwoMonths()}
    <CalendarStory variant="twoMonths" locale={previewLocale} />
  {/snippet}

  <!-- ── Estados ────────────────────────────────────────────────── -->
  <DocsStates
    title={$tStore('states.title')}
    cols={{
      state: $tStore('states.cols.state'),
      trigger: $tStore('states.cols.trigger'),
      behavior: $tStore('states.cols.behavior'),
    }}
    items={[
      { label: $tStore('states.default.label'),     trigger: stripHtml($tStore('states.default.trigger')),     behavior: stripHtml($tStore('states.default.behavior'))     },
      { label: $tStore('states.selected.label'),    trigger: stripHtml($tStore('states.selected.trigger')),    behavior: stripHtml($tStore('states.selected.behavior'))    },
      { label: $tStore('states.disabled.label'),    trigger: stripHtml($tStore('states.disabled.trigger')),    behavior: stripHtml($tStore('states.disabled.behavior'))    },
      { label: $tStore('states.today.label'),       trigger: stripHtml($tStore('states.today.trigger')),       behavior: stripHtml($tStore('states.today.behavior'))       },
      { label: $tStore('states.outside.label'),     trigger: stripHtml($tStore('states.outside.trigger')),     behavior: stripHtml($tStore('states.outside.behavior'))     },
      { label: $tStore('states.rangeMiddle.label'), trigger: stripHtml($tStore('states.rangeMiddle.trigger')), behavior: stripHtml($tStore('states.rangeMiddle.behavior')) },
    ]}
  />

  <!-- ── Propriedades ───────────────────────────────────────────── -->
  <DocsProps
    title={$tStore('props.title')}
    tables={[
      {
        title: $tStore('props.calendarTitle'),
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'type',            type: '"single" | "multiple"',                      defaultValue: '—',        required: 'Sim', description: 'Modo de seleção. bits-ui não expõe "range" nativo — componha dois selects ou use `multiple`.' },
          { name: 'value',           type: 'DateValue | DateValue[]',                    defaultValue: 'undefined', required: 'Não', description: 'Valor selecionado. Use `bind:value` para two-way binding. Tipo depende de `type`.' },
          { name: 'onValueChange',   type: '(v) => void',                                defaultValue: '—',        required: 'Não', description: stripHtml($tStore('props.table.onSelect')) },
          { name: 'locale',          type: 'string',                                     defaultValue: '"en-US"',   required: 'Não', description: 'String de locale BCP-47 (ex: "pt-BR", "en-US"). Controla nomes de meses e dias.' },
          { name: 'isDateDisabled',  type: '(d: DateValue) => boolean',                  defaultValue: '—',        required: 'Não', description: stripHtml($tStore('props.table.disabled')) },
          { name: 'isDateUnavailable', type: '(d: DateValue) => boolean',                defaultValue: '—',        required: 'Não', description: 'Datas marcadas como indisponíveis — focáveis mas marcam o calendar como inválido.' },
          { name: 'minValue',        type: 'DateValue',                                  defaultValue: '—',        required: 'Não', description: 'Data mínima selecionável.' },
          { name: 'maxValue',        type: 'DateValue',                                  defaultValue: '—',        required: 'Não', description: 'Data máxima selecionável.' },
          { name: 'captionLayout',   type: '"label" | "dropdown" | "dropdown-months" | "dropdown-years"', defaultValue: '"label"', required: 'Não', description: stripHtml($tStore('props.table.captionLayout')) },
          { name: 'buttonVariant',   type: 'ButtonVariant',                              defaultValue: '"ghost"',   required: 'Não', description: stripHtml($tStore('props.table.buttonVariant')) },
          { name: 'numberOfMonths',  type: 'number',                                     defaultValue: '1',        required: 'Não', description: stripHtml($tStore('props.table.numberOfMonths')) },
          { name: 'weekdayFormat',   type: '"long" | "short" | "narrow"',                defaultValue: '"short"',   required: 'Não', description: 'Formato dos rótulos dos dias da semana no cabeçalho.' },
          { name: 'fixedWeeks',      type: 'boolean',                                    defaultValue: 'false',    required: 'Não', description: 'Exibe sempre 6 semanas — preenche com dias do mês vizinho (outside-month).' },
          { name: 'disableDaysOutsideMonth', type: 'boolean',                            defaultValue: 'false',    required: 'Não', description: 'Esconde/desabilita os dias fora do mês exibido.' },
          { name: 'class',           type: 'string',                                     defaultValue: '—',        required: 'Não', description: stripHtml($tStore('props.table.className')) },
          { name: 'day',             type: 'Snippet<[{ day; outsideMonth }]>',           defaultValue: '—',        required: 'Não', description: 'Snippet opcional para renderizar customizações por célula.' },
        ],
      },
    ]}
    interfaceCode={interfaceCode}
    extensibilityTitle={$tStore('props.extensibilityTitle')}
    extensibilityNotes="Para customização profunda na stack Svelte, importe subcomponentes diretamente (<code>Calendar.Cell</code>, <code>Calendar.Day</code>, <code>Calendar.MonthSelect</code>, etc.) e monte sua própria composição. Diferente do React (que expõe o mapa `classNames`), cada subcomponente aceita `class`."
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
      { token: '--primary',          value: 'data-[selected]:bg-primary',     description: $tStore('tokens.table.primary')         },
      { token: '--primary-foreground', value: 'data-[selected]:text-primary-foreground', description: 'Texto da data selecionada'  },
      { token: '--accent',           value: '[&[data-today]]:bg-accent',      description: stripHtml($tStore('tokens.table.muted')) },
      { token: '--muted-foreground', value: 'text-muted-foreground',          description: stripHtml($tStore('tokens.table.mutedForeground')) },
      { token: '--foreground',       value: 'text-foreground',                description: $tStore('tokens.table.foreground')      },
      { token: '--ring',             value: 'focus:ring-ring/50',             description: $tStore('tokens.table.ring')            },
      { token: '--cell-radius',      value: 'rounded-(--cell-radius)',        description: stripHtml($tStore('tokens.table.cellRadius')) },
      { token: '--cell-size',        value: 'size-(--cell-size)',             description: stripHtml($tStore('tokens.table.cellSize')) },
    ]}
    customizationTitle={$tStore('tokens.customizationTitle')}
    customizationCode={codeCustomizationTokens}
  />

  <!-- ── Acessibilidade ─────────────────────────────────────────── -->
  <DocsAccessibility
    title={$tStore('accessibility.title')}
    summary={$tStore('accessibility.summary')}
    items={[
      $tStore('accessibility.item1'),
      $tStore('accessibility.item2'),
      $tStore('accessibility.item3'),
      $tStore('accessibility.item4'),
      $tStore('accessibility.item5'),
      $tStore('accessibility.item6'),
    ]}
    keyboardTitle={$tStore('accessibility.keyboardTitle')}
    keyboardItems={[
      { key: 'Arrow',          description: stripHtml($tStore('accessibility.keyboard.arrows'))    },
      { key: 'Page Up/Down',   description: stripHtml($tStore('accessibility.keyboard.pageUpDown')) },
      { key: 'Home/End',       description: stripHtml($tStore('accessibility.keyboard.homeEnd'))   },
      { key: 'Enter',          description: stripHtml($tStore('accessibility.keyboard.enter'))     },
      { key: 'Tab',            description: stripHtml($tStore('accessibility.keyboard.tab'))       },
    ]}
  />

  <!-- ── Relacionados ───────────────────────────────────────────── -->
  <DocsRelated
    title={$tStore('related.title')}
    items={[
      { name: 'Popover',  description: $tStore('related.popover'),  path: '?path=/docs/ui-popover--docs'  },
      { name: 'Button',   description: $tStore('related.datePicker'), path: '?path=/docs/ui-button--docs'   },
      { name: 'Form',     description: $tStore('related.form'),     path: '?path=/docs/ui-form--docs'     },
      { name: 'Input',    description: $tStore('related.input'),    path: '?path=/docs/ui-input--docs'    },
    ]}
  />

  <!-- ── Notas ──────────────────────────────────────────────────── -->
  <DocsNotes
    title={$tStore('notes.title')}
    items={[
      { title: '', content: 'Na stack Svelte (bits-ui), o <code>locale</code> é uma <strong>string BCP-47</strong> (ex: <code>"pt-BR"</code>) — não o objeto <code>Locale</code> do <code>date-fns</code> que o React utiliza.' },
      { title: '', content: 'Valores são instâncias de <code>DateValue</code> do <code>@internationalized/date</code> — use <code>CalendarDate</code> para criar e <code>.toString()</code> para serializar como ISO (YYYY-MM-DD).' },
      { title: '', content: $tStore('notes.tip3') },
      { title: '', content: 'bits-ui não expõe <code>type="range"</code> nativamente. Para seleção de período, componha com dois calendários ou use <code>isDateDisabled</code> + <code>type="multiple"</code>.' },
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
      { event: $tStore('analytics.table.fieldChange'), trigger: stripHtml($tStore('analytics.table.fieldChangeTrigger')), payload: $tStore('analytics.table.fieldChangePayload') },
      { event: $tStore('analytics.table.dialogOpen'),  trigger: stripHtml($tStore('analytics.table.dialogOpenTrigger')),  payload: $tStore('analytics.table.dialogOpenPayload')  },
      { event: $tStore('analytics.table.pageView'),    trigger: $tStore('analytics.table.pageViewTrigger'),               payload: $tStore('analytics.table.pageViewPayload')    },
      { event: $tStore('analytics.table.sectionViewed'), trigger: $tStore('analytics.table.sectionViewedTrigger'),         payload: $tStore('analytics.table.sectionViewedPayload') },
      { event: $tStore('analytics.table.langSwitch'),  trigger: $tStore('analytics.table.langSwitchTrigger'),             payload: $tStore('analytics.table.langSwitchPayload')  },
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
        { action: $tStore('testes.functional.item1.action'), result: stripHtml($tStore('testes.functional.item1.result')), priority: localPriority($tStore('testes.functional.item1.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item2.action'), result: stripHtml($tStore('testes.functional.item2.result')), priority: localPriority($tStore('testes.functional.item2.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item3.action'), result: stripHtml($tStore('testes.functional.item3.result')), priority: localPriority($tStore('testes.functional.item3.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item4.action'), result: stripHtml($tStore('testes.functional.item4.result')), priority: localPriority($tStore('testes.functional.item4.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item5.action'), result: stripHtml($tStore('testes.functional.item5.result')), priority: localPriority($tStore('testes.functional.item5.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item6.action'), result: stripHtml($tStore('testes.functional.item6.result')), priority: localPriority($tStore('testes.functional.item6.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item7.action'), result: stripHtml($tStore('testes.functional.item7.result')), priority: localPriority($tStore('testes.functional.item7.priority'), $tNavStore) },
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
        { criterion: stripHtml($tStore('testes.accessibility.item1.criterion')), level: $tStore('testes.accessibility.item1.level'), how: $tStore('testes.accessibility.item1.how') },
        { criterion: stripHtml($tStore('testes.accessibility.item2.criterion')), level: $tStore('testes.accessibility.item2.level'), how: $tStore('testes.accessibility.item2.how') },
        { criterion: stripHtml($tStore('testes.accessibility.item3.criterion')), level: $tStore('testes.accessibility.item3.level'), how: $tStore('testes.accessibility.item3.how') },
        { criterion: $tStore('testes.accessibility.item4.criterion'),            level: $tStore('testes.accessibility.item4.level'), how: $tStore('testes.accessibility.item4.how') },
        { criterion: $tStore('testes.accessibility.item5.criterion'),            level: $tStore('testes.accessibility.item5.level'), how: stripHtml($tStore('testes.accessibility.item5.how')) },
        { criterion: $tStore('testes.accessibility.item6.criterion'),            level: $tStore('testes.accessibility.item6.level'), how: $tStore('testes.accessibility.item6.how') },
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
