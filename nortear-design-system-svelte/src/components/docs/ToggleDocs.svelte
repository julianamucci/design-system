<script lang="ts">
  import { untrack } from 'svelte';
  import { Toggle } from '@/components/ui/toggle';
  import Bold from '@lucide/svelte/icons/bold';
  import Italic from '@lucide/svelte/icons/italic';
  import Underline from '@lucide/svelte/icons/underline';
  import List from '@lucide/svelte/icons/list';
  import Eye from '@lucide/svelte/icons/eye';
  import LayoutGrid from '@lucide/svelte/icons/layout-grid';
  import { locale, useTranslation } from '@/lib/i18n';
  import { applySeo } from '@/lib/use-seo';
  import { track } from '@/lib/analytics';
  import { createActiveSection } from '@/lib/use-active-section.svelte';
  import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.svelte';
  import {
    DocsHeader, DocsDemonstration, DocsAnatomy, DocsWhenToUse, DocsDoDont,
    DocsImport, DocsCompositions, DocsStates, DocsProps, DocsTokens,
    DocsAccessibility, DocsRelated, DocsNotes, DocsAnalytics, DocsTestes,
  } from '@/components/docs/shared/sections';
  import uiTranslations from '@/i18n/ui.json';
  import toggleTranslations from '@shared/content/toggle/translations.json';
  import { stripHtml, toPlainText } from '@/lib/strip-html';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(toggleTranslations);

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria.
  const screenReaderItems = $derived(
    Object.values(
      (toggleTranslations as unknown as Record<
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
      componentSlug: 'toggle',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: t('category'), item: '/components/form' },
        { name: t('title') },
      ],
    });
    track('docs_page_view', {
      component_name: 'toggle',
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
    track('docs_section_viewed', { section_id: id, component_name: 'toggle', locale: $locale });
  });
  $effect(() => section.attach());

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const priorityKeyMap: Record<string, string> = { high: 'common.high', medium: 'common.medium', low: 'common.low' };

  function localPriority(raw: string, tNav: (k: string) => string): string {
    return tNav(priorityKeyMap[raw] ?? 'common.high');
  }

  // ─── Reactive demo states ────────────────────────────────────────────────────

  let demoBold = $state(true);
  let demoItalic = $state(false);
  let demoUnderline = $state(false);
  let demoShowHidden = $state(false);
  let demoCompact = $state(false);

  // Variants
  let varDefault = $state(false);
  let varOutline = $state(false);
  let varWithLabel = $state(false);

  // Do/Don't
  let dd1DoPressed = $state(false);
  let dd1DontPressed = $state(false);
  let dd2DoPressed = $state(false);
  let dd2DontPressed = $state(false);

  // ─── Code strings ────────────────────────────────────────────────────────────

  const codeImport = `import { Toggle } from "@/components/ui/toggle";`;

  const codeDefault = `<script lang="ts">
  import { Toggle } from "@/components/ui/toggle";
  import Bold from '@lucide/svelte/icons/bold';
  let pressed = $state(false);
<\/script>

<Toggle bind:pressed aria-label="Negrito">
  <Bold aria-hidden="true" />
</Toggle>`;

  const codeOutline = `<script lang="ts">
  import { Toggle } from "@/components/ui/toggle";
  import Italic from '@lucide/svelte/icons/italic';
  let pressed = $state(false);
<\/script>

<Toggle bind:pressed variant="outline" aria-label="Itálico">
  <Italic aria-hidden="true" />
</Toggle>`;

  const codeWithLabel = `<script lang="ts">
  import { Toggle } from "@/components/ui/toggle";
  import Eye from '@lucide/svelte/icons/eye';
  let showHidden = $state(false);
<\/script>

<Toggle bind:pressed={showHidden} variant="outline">
  <Eye aria-hidden="true" />
  Mostrar ocultos
</Toggle>`;

  const interfaceCode = `// Toggle (Svelte 5 — bits-ui)
interface ToggleProps {
  pressed?: boolean;                   // $bindable — estado controlado
  ref?: HTMLElement;                   // $bindable
  disabled?: boolean;
  variant?: "default" | "outline";     // estilo visual
  size?: "default" | "sm" | "lg";      // altura via tokens --height-*
  'aria-label'?: string;               // OBRIGATÓRIO em icon-only
  class?: string;
}`;

</script>

<DocsPageLayout navGroups={NAV_GROUPS} activeSection={section.value} componentSlug="toggle">
  {#snippet header()}
    <DocsHeader
      title={$tStore('title')}
      description={$tStore('description')}
      category={$tStore('category')}
      type={$tStore('type')}
    />
  {/snippet}

  <!-- ── Demonstração ─────────────────────────────────────────────────── -->
  <DocsDemonstration title={$tStore('demonstration.title')} componentSlug="toggle">
    <div class="nds-stack" data-spacing="lg" style="align-items: flex-start">
      <!-- Formatting toolbar (icon-only) -->
      <div class="nds-cluster" data-spacing="xs">
        <Toggle
          bind:pressed={demoBold}
          onPressedChange={(v: boolean) => track('field_change', { component: 'toggle', field_name: 'bold', value: String(v), location: 'docs_demo' })}
          aria-label={$tStore('demonstration.labels.bold')}
          data-track="demo"
          data-track-id="toggle:demo:bold"
          data-track-label={$tStore('demonstration.labels.bold')}
        >
          <Bold aria-hidden="true" />
        </Toggle>
        <Toggle
          bind:pressed={demoItalic}
          onPressedChange={(v: boolean) => track('field_change', { component: 'toggle', field_name: 'italic', value: String(v), location: 'docs_demo' })}
          aria-label={$tStore('demonstration.labels.italic')}
          data-track="demo"
          data-track-id="toggle:demo:italic"
          data-track-label={$tStore('demonstration.labels.italic')}
        >
          <Italic aria-hidden="true" />
        </Toggle>
        <Toggle
          bind:pressed={demoUnderline}
          onPressedChange={(v: boolean) => track('field_change', { component: 'toggle', field_name: 'underline', value: String(v), location: 'docs_demo' })}
          aria-label={$tStore('demonstration.labels.underline')}
          data-track="demo"
          data-track-id="toggle:demo:underline"
          data-track-label={$tStore('demonstration.labels.underline')}
        >
          <Underline aria-hidden="true" />
        </Toggle>
      </div>

      <!-- Outline com label visível -->
      <Toggle
        bind:pressed={demoShowHidden}
        onPressedChange={(v: boolean) => track('field_change', { component: 'toggle', field_name: 'showHidden', value: String(v), location: 'docs_demo' })}
        variant="outline"
        data-track="demo"
        data-track-id="toggle:demo:showHidden"
        data-track-label={$tStore('demonstration.labels.showHidden')}
      >
        <Eye aria-hidden="true" />
        <span>{$tStore('demonstration.labels.showHidden')}</span>
      </Toggle>

      <!-- Tamanho lg com label visível -->
      <Toggle
        bind:pressed={demoCompact}
        onPressedChange={(v: boolean) => track('field_change', { component: 'toggle', field_name: 'compactView', value: String(v), location: 'docs_demo' })}
        variant="outline"
        size="lg"
        data-track="demo"
        data-track-id="toggle:demo:compactView"
        data-track-label={$tStore('demonstration.labels.compactView')}
      >
        <LayoutGrid aria-hidden="true" />
        <span>{$tStore('demonstration.labels.compactView')}</span>
      </Toggle>
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
          element: $tStore('usage.uxWriting.table.ariaLabel.name'),
          rules: $tStore('usage.uxWriting.table.ariaLabel.format'),
          do: $tStore('usage.uxWriting.table.ariaLabel.good'),
          dont: $tStore('usage.uxWriting.table.ariaLabel.bad'),
        },
        {
          element: $tStore('usage.uxWriting.table.label.name'),
          rules: $tStore('usage.uxWriting.table.label.format'),
          do: $tStore('usage.uxWriting.table.label.good'),
          dont: $tStore('usage.uxWriting.table.label.bad'),
        },
        {
          element: $tStore('usage.uxWriting.table.icon.name'),
          rules: toPlainText($tStore('usage.uxWriting.table.icon.format')),
          do: toPlainText($tStore('usage.uxWriting.table.icon.good')),
          dont: $tStore('usage.uxWriting.table.icon.bad'),
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
    <Toggle bind:pressed={dd1DoPressed} aria-label="Negrito">
      <Bold aria-hidden="true" />
    </Toggle>
  {/snippet}

  {#snippet dd1Dont()}
    <Toggle bind:pressed={dd1DontPressed} aria-label="Botão B">
      <Bold aria-hidden="true" />
    </Toggle>
  {/snippet}

  {#snippet dd2Do()}
    <div class="nds-cluster" data-spacing="xs">
      <Toggle bind:pressed={dd2DoPressed} aria-label="Negrito">
        <Bold aria-hidden="true" />
      </Toggle>
      <Toggle aria-label="Itálico">
        <Italic aria-hidden="true" />
      </Toggle>
      <Toggle aria-label="Sublinhado">
        <Underline aria-hidden="true" />
      </Toggle>
    </div>
  {/snippet}

  {#snippet dd2Dont()}
    <div class="nds-cluster" data-spacing="sm">
      <Toggle bind:pressed={dd2DontPressed} aria-label="Negrito">
        <Bold aria-hidden="true" />
      </Toggle>
      <Toggle aria-label="Itálico">
        <Italic aria-hidden="true" />
      </Toggle>
    </div>
  {/snippet}

  <!-- ── Importação ────────────────────────────────────────────────────── -->
  <DocsImport
    title={$tStore('import.title')}
    code={codeImport}
    componentSlug="toggle"
  />

  <!-- ── Variantes ─────────────────────────────────────────────────────── -->
  <DocsCompositions
    id="variantes"
    title={$tStore('variants.title')}
    useWhenLabel={$tNavStore('common.useWhen')}
    componentSlug="toggle"
    items={[
      {
        name: $tStore('variants.items.default'),
        description: stripHtml($tStore('variants.styles.default')),
        code: codeDefault,
        preview: variantDefault,
      },
      {
        name: $tStore('variants.items.outline'),
        description: stripHtml($tStore('variants.styles.outline')),
        code: codeOutline,
        preview: variantOutline,
      },
      {
        name: $tStore('variants.items.withLabel'),
        description: stripHtml($tStore('variants.styles.withLabel')),
        code: codeWithLabel,
        preview: variantWithLabel,
      },
      {
        name: $tStore('variants.items.sizes.name'),
        description: $tStore('variants.items.sizes.description'),
        useWhen: $tStore('variants.items.sizes.use'),
        code: `<div class="nds-cluster" data-spacing="sm">
  <Toggle variant="outline" size="sm" aria-label="Negrito (sm)"><Bold aria-hidden="true" /></Toggle>
  <Toggle variant="outline" aria-label="Negrito (default)"><Bold aria-hidden="true" /></Toggle>
  <Toggle variant="outline" size="lg" aria-label="Negrito (lg)"><Bold aria-hidden="true" /></Toggle>
</div>`,
        preview: variantSizes,
      },
    ]}
  />

  {#snippet variantDefault()}
    <Toggle bind:pressed={varDefault} aria-label="Negrito">
      <Bold aria-hidden="true" />
    </Toggle>
  {/snippet}

  {#snippet variantOutline()}
    <Toggle bind:pressed={varOutline} variant="outline" aria-label="Itálico">
      <Italic aria-hidden="true" />
    </Toggle>
  {/snippet}

  {#snippet variantWithLabel()}
    <Toggle bind:pressed={varWithLabel} variant="outline">
      <Eye aria-hidden="true" />
      <span>Mostrar ocultos</span>
    </Toggle>
  {/snippet}

  <!-- ── Composições ──────────────────────────────────────────────────── -->
  <DocsCompositions
    title={$tStore('variants.compositionsTitle')}
    useWhenLabel={$tNavStore('common.useWhen')}
    componentSlug="toggle"
    items={[
      {
        name: $tStore('variants.compositions.toolbar.name'),
        description: $tStore('variants.compositions.toolbar.description'),
        useWhen: $tStore('variants.compositions.toolbar.use'),
        code: `<div role="group" aria-label="Formatação de texto" class="nds-cluster nds-rounded-md nds-border-default nds-p-1" data-spacing="xs">
  <Toggle pressed aria-label="Negrito"><Bold aria-hidden="true" /></Toggle>
  <Toggle aria-label="Itálico"><Italic aria-hidden="true" /></Toggle>
  <Toggle aria-label="Sublinhado"><Underline aria-hidden="true" /></Toggle>
</div>`,
        preview: compToolbar,
      },
      {
        name: $tStore('variants.compositions.filterList.name'),
        description: $tStore('variants.compositions.filterList.description'),
        useWhen: $tStore('variants.compositions.filterList.use'),
        code: `<div class="nds-stack" data-spacing="sm">
  <span class="nds-text-body nds-font-medium">Filtros de exibição</span>
  <div class="nds-cluster" data-spacing="sm">
    <Toggle variant="outline"><Eye aria-hidden="true" /><span>Mostrar ocultos</span></Toggle>
    <Toggle pressed variant="outline"><List aria-hidden="true" /><span>Em lista</span></Toggle>
  </div>
</div>`,
        preview: compFilterList,
      },
    ]}
  />

  {#snippet compToolbar()}
    <div role="group" aria-label="Formatação de texto" class="nds-cluster nds-rounded-md nds-border-default nds-p-1" data-spacing="xs">
      <Toggle pressed aria-label="Negrito"><Bold aria-hidden="true" /></Toggle>
      <Toggle aria-label="Itálico"><Italic aria-hidden="true" /></Toggle>
      <Toggle aria-label="Sublinhado"><Underline aria-hidden="true" /></Toggle>
    </div>
  {/snippet}

  {#snippet variantSizes()}
    <div class="nds-cluster" data-spacing="sm">
      <Toggle variant="outline" size="sm" aria-label="Negrito (sm)"><Bold aria-hidden="true" /></Toggle>
      <Toggle variant="outline" aria-label="Negrito (default)"><Bold aria-hidden="true" /></Toggle>
      <Toggle variant="outline" size="lg" aria-label="Negrito (lg)"><Bold aria-hidden="true" /></Toggle>
    </div>
  {/snippet}

  {#snippet compFilterList()}
    <div class="nds-stack" data-spacing="sm">
      <span class="nds-text-body nds-font-medium">Filtros de exibição</span>
      <div class="nds-cluster" data-spacing="sm">
        <Toggle variant="outline"><Eye aria-hidden="true" /><span>Mostrar ocultos</span></Toggle>
        <Toggle pressed variant="outline"><List aria-hidden="true" /><span>Em lista</span></Toggle>
      </div>
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
      { label: $tStore('states.off.label'),      trigger: toPlainText($tStore('states.off.trigger')),      behavior: toPlainText($tStore('states.off.behavior')) },
      { label: $tStore('states.on.label'),       trigger: toPlainText($tStore('states.on.trigger')),       behavior: toPlainText($tStore('states.on.behavior')) },
      { label: $tStore('states.hover.label'),    trigger: toPlainText($tStore('states.hover.trigger')),    behavior: toPlainText($tStore('states.hover.behavior')) },
      { label: $tStore('states.focus.label'),    trigger: toPlainText($tStore('states.focus.trigger')),    behavior: toPlainText($tStore('states.focus.behavior')) },
      { label: $tStore('states.disabled.label'), trigger: toPlainText($tStore('states.disabled.trigger')), behavior: toPlainText($tStore('states.disabled.behavior')) },
      { label: $tStore('states.invalid.label'),  trigger: toPlainText($tStore('states.invalid.trigger')),  behavior: toPlainText($tStore('states.invalid.behavior')) },
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
          { name: 'pressed',          type: $tStore('props.table.pressed.type'),          defaultValue: $tStore('props.table.pressed.default'),          required: $tStore('props.table.pressed.required'),          description: toPlainText($tStore('props.table.pressed.description')) },
          { name: 'defaultPressed',   type: $tStore('props.table.defaultPressed.type'),   defaultValue: $tStore('props.table.defaultPressed.default'),   required: $tStore('props.table.defaultPressed.required'),   description: toPlainText($tStore('props.table.defaultPressed.description')) },
          { name: 'onPressedChange',  type: $tStore('props.table.onPressedChange.type'),  defaultValue: $tStore('props.table.onPressedChange.default'),  required: $tStore('props.table.onPressedChange.required'),  description: toPlainText($tStore('props.table.onPressedChange.description')) },
          { name: 'disabled',         type: $tStore('props.table.disabled.type'),         defaultValue: $tStore('props.table.disabled.default'),         required: $tStore('props.table.disabled.required'),         description: toPlainText($tStore('props.table.disabled.description')) },
          { name: 'variant',          type: $tStore('props.table.variant.type'),          defaultValue: $tStore('props.table.variant.default'),          required: $tStore('props.table.variant.required'),          description: toPlainText($tStore('props.table.variant.description')) },
          { name: 'size',             type: $tStore('props.table.size.type'),             defaultValue: $tStore('props.table.size.default'),             required: $tStore('props.table.size.required'),             description: toPlainText($tStore('props.table.size.description')) },
          { name: 'class',            type: $tStore('props.table.className.type'),        defaultValue: $tStore('props.table.className.default'),        required: $tStore('props.table.className.required'),        description: toPlainText($tStore('props.table.className.description')) },
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
      { token: '--accent',            k: 'accent'           },
      { token: '--accent-foreground', k: 'accentForeground' },
      { token: '--muted',             k: 'muted'            },
      // A borda da variante outline é `--border`: o toggle acompanha o botão
      // de contorno, e `--input` ficou reservado à borda de campo. A chave
      // `input` é o nome da linha, não o nome do token.
      { token: '--border',            k: 'input'            },
      { token: '--ring',              k: 'ring'             },
      { token: '--destructive',       k: 'destructive'      },
      { token: '--radius-button',     k: 'radius'           },
    ].map(({ token, k }) => ({
      token,
      value: $tStore(`tokens.table.${k}.class`),
      description: $tStore(`tokens.table.${k}.part`),
    }))}
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
      { key: 'Tab',   description: $tStore('accessibility.keyboard.tab') },
      { key: 'Space', description: $tStore('accessibility.keyboard.space') },
      { key: 'Enter', description: $tStore('accessibility.keyboard.enter') },
    ]}
  />

  <!-- ── Relacionados ──────────────────────────────────────────────────── -->
  <DocsRelated
    title={$tStore('related.title')}
    items={[
      { name: $tStore('related.items.toggleGroup.name'), description: $tStore('related.items.toggleGroup.description'), path: '?path=/docs/ui-togglegroup--docs' },
      { name: $tStore('related.items.switch.name'),      description: $tStore('related.items.switch.description'),      path: '?path=/docs/ui-switch--docs' },
      { name: $tStore('related.items.checkbox.name'),    description: $tStore('related.items.checkbox.description'),    path: '?path=/docs/ui-checkbox--docs' },
      { name: $tStore('related.items.button.name'),      description: $tStore('related.items.button.description'),      path: '?path=/docs/ui-button--docs' },
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
      ],
    }}
  />
</DocsPageLayout>
