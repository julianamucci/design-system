<script lang="ts">
  import { Label } from '@/components/ui/label';
  import { Input } from '@/components/ui/input';
  import { Checkbox } from '@/components/ui/checkbox';
  import { locale, useTranslation } from '@/lib/i18n';
  import { applySeo } from '@/lib/use-seo';
  import { track } from '@/lib/analytics';
  import { createActiveSection } from '@/lib/use-active-section.svelte';
  import { sanitizeHtml } from '@/lib/sanitize-html';
  import DocsPageLayout    from '@/components/docs/shared/sections/DocsPageLayout.svelte';
  import {
    DocsHeader,
    DocsDemonstration,
    DocsAnatomy,
    DocsWhenToUse,
    DocsDoDont,
    DocsImport,
    DocsVariants,
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
  import labelTranslations from '@shared/content/label/translations.json';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(labelTranslations);

  // ─── SEO + Analytics ─────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale: l,
      componentSlug: 'label',
    });
    track('docs_page_view', {
      component_name: 'label',
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
    track('docs_section_viewed', { section_id: id, component_name: 'label', locale: $locale });
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

  // ─── Code strings ────────────────────────────────────────────────────────────

  const codeImport = `import { Label } from "@/components/ui/label";`;

  const codeDefault = `<Label for="nome">Nome completo</Label>
<Input id="nome" type="text" />`;

  const codeRequired = `<Label for="email">
  Email profissional
  <span class="text-destructive" aria-hidden="true">*</span>
</Label>
<Input id="email" type="email" aria-required="true" />`;

  const codeDisabled = `<!-- Input com peer + disabled dispara peer-disabled no Label -->
<Input id="cpf" disabled class="peer" />
<Label for="cpf">CPF</Label>`;

  const codeCustomization = `<!-- Personalização via class -->
<Label for="field" class="text-muted-foreground">
  Rótulo secundário
</Label>`;

  const interfaceCode = `// Label — Svelte 5
interface LabelProps {
  for?: string;       // associa ao campo com id correspondente
  class?: string;     // classes Tailwind adicionais
  children?: Snippet; // texto do rótulo
  // + todos os atributos HTML nativos de <label>
}`;
</script>

<DocsPageLayout navGroups={NAV_GROUPS} activeSection={section.value} componentSlug="label">
  {#snippet header()}
    <DocsHeader
      title={$tStore('title')}
      description={$tStore('description')}
      category={$tStore('category')}
      type={$tStore('type')}
      installNote="npx shadcn-svelte@latest add label"
    />
  {/snippet}

  <!-- ── Demonstração ───────────────────────────────────────────── -->
  <DocsDemonstration title={$tStore('demonstration.title')} componentSlug="label">
    {#snippet children()}
      <div class="w-full space-y-6">
        <!-- Padrão -->
        <div class="flex flex-col gap-2">
          <Label for="demo-default">{$tStore('demonstration.labels.default')}</Label>
          <Input id="demo-default" type="text" />
        </div>

        <!-- Required -->
        <div class="flex flex-col gap-2">
          <Label for="demo-required">
            {$tStore('demonstration.labels.required')}
            <span class="text-destructive" aria-hidden="true">{$tStore('demonstration.labels.requiredMarker')}</span>
          </Label>
          <Input id="demo-required" type="email" aria-required="true" />
        </div>

        <!-- Disabled via peer -->
        <div class="flex flex-col gap-2">
          <Input id="demo-disabled" disabled class="peer" />
          <Label for="demo-disabled">{$tStore('demonstration.labels.disabled')}</Label>
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
      ],
    }}
    do={{
      title: $tStore('usage.do.title'),
      items: [
        $tStore('usage.do.item1'),
        $tStore('usage.do.item2'),
        $tStore('usage.do.item3'),
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
    <div class="flex flex-col gap-2 w-full">
      <Label for="dodont-do-1">Nome completo</Label>
      <Input id="dodont-do-1" type="text" />
    </div>
  {/snippet}
  {#snippet dontPair1()}
    <div class="flex flex-col gap-2 w-full">
      <Label>Nome completo</Label>
      <Input type="text" />
    </div>
  {/snippet}
  {#snippet doPair2()}
    <div class="flex flex-col gap-2 w-full">
      <Label for="dodont-do-2">Email profissional</Label>
      <Input id="dodont-do-2" type="email" />
    </div>
  {/snippet}
  {#snippet dontPair2()}
    <div class="flex flex-col gap-2 w-full">
      <Input type="email" placeholder="Informe seu email" />
    </div>
  {/snippet}

  <!-- ── Importação ─────────────────────────────────────────────── -->
  <DocsImport
    title={$tStore('import.title')}
    code={codeImport}
    componentSlug="label"
  />

  <!-- ── Variantes ──────────────────────────────────────────────── -->
  <DocsVariants
    title={$tStore('variants.title')}
    componentSlug="label"
    items={[
      {
        name: 'default',
        description: stripHtml($tStore('variants.default.description')),
        code: codeDefault,
        preview: variantDefault,
      },
    ]}
  />

  {#snippet variantDefault()}
    <div class="flex flex-col gap-2 w-full">
      <Label for="variant-default">Nome completo</Label>
      <Input id="variant-default" type="text" />
    </div>
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
      {
        label: $tStore('states.default.label'),
        trigger: stripHtml($tStore('states.default.trigger')),
        behavior: $tStore('states.default.behavior'),
      },
      {
        label: $tStore('states.disabled.label'),
        trigger: stripHtml($tStore('states.disabled.trigger')),
        behavior: stripHtml($tStore('states.disabled.behavior')),
      },
      {
        label: $tStore('states.required.label'),
        trigger: $tStore('states.required.trigger'),
        behavior: stripHtml($tStore('states.required.behavior')),
      },
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
          { name: 'for',      type: 'string',  defaultValue: '—', required: 'Não', description: stripHtml($tStore('props.table.htmlFor'))   },
          { name: 'class',    type: 'string',  defaultValue: '—', required: 'Não', description: $tStore('props.table.className')             },
          { name: 'children', type: 'Snippet', defaultValue: '—', required: 'Não', description: $tStore('props.table.children')              },
        ],
      },
    ]}
    interfaceCode={interfaceCode}
    extensibilityNotes={$tStore('props.note')}
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
      { token: '--foreground',  value: 'text-foreground',  description: $tStore('tokens.table.foreground')       },
      { token: '--muted',       value: 'opacity-50',       description: $tStore('tokens.table.foregroundMuted')  },
      { token: '--font-size-sm', value: 'text-sm',         description: $tStore('tokens.table.fontSize')         },
      { token: '--font-weight',  value: 'font-medium',     description: $tStore('tokens.table.fontWeight')       },
      { token: '--leading-none', value: 'leading-none',    description: $tStore('tokens.table.lineHeight')       },
      { token: '--destructive',  value: 'text-destructive', description: $tStore('tokens.table.destructive')     },
    ]}
    customizationTitle="Personalização"
    customizationCode={codeCustomization}
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
    ]}
    keyboardTitle="Teclado"
    keyboardItems={[
      { key: 'Tab', description: $tStore('accessibility.keyboard.tab') },
      { key: '—',   description: $tStore('accessibility.keyboard.noKeyboard') },
    ]}
  />

  <!-- ── Relacionados ───────────────────────────────────────────── -->
  <DocsRelated
    title={$tStore('related.title')}
    componentSlug="label"
    items={[
      { name: 'Input',      description: $tStore('related.input'),      path: '?path=/docs/ui-input--docs'      },
      { name: 'FormLabel',  description: $tStore('related.formLabel'),  path: '?path=/docs/ui-formlabel--docs'  },
      { name: 'FormField',  description: $tStore('related.formField'),  path: '?path=/docs/ui-formfield--docs'  },
      { name: 'Checkbox',   description: $tStore('related.checkbox'),   path: '?path=/docs/ui-checkbox--docs'   },
    ]}
  />

  <!-- ── Notas ──────────────────────────────────────────────────── -->
  <DocsNotes
    title={$tStore('notes.title')}
    componentSlug="label"
    items={[
      { title: '', content: $tStore('notes.tip1') },
      { title: '', content: $tStore('notes.tip2') },
      { title: '', content: $tStore('notes.tip3') },
    ]}
  />

  <!-- ── Analytics ─────────────────────────────────────────────── -->
  <DocsAnalytics
    title={$tStore('analytics.title')}
    cols={{
      event: $tNavStore('analytics.table.event') ?? 'Evento',
      trigger: $tNavStore('analytics.table.trigger') ?? 'Gatilho',
      payload: $tNavStore('analytics.table.payload') ?? 'Payload',
    }}
    items={[
      {
        event: 'docs_page_view',
        trigger: 'Página carregada',
        payload: 'component_name: "label", locale, page_title',
      },
      {
        event: 'docs_section_viewed',
        trigger: 'Seção entra no viewport',
        payload: 'component_name: "label", section_id, locale',
      },
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
        { criterion: $tStore('testes.accessibility.item1'), level: 'AA', how: 'axe-core'             },
        { criterion: $tStore('testes.accessibility.item2'), level: 'AA', how: 'getByLabelText()'     },
        { criterion: $tStore('testes.accessibility.item3'), level: 'AA', how: 'Inspecionar atributos DOM' },
        { criterion: $tStore('testes.accessibility.item4'), level: 'AA', how: 'Ferramenta de contraste' },
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
