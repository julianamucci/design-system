<script lang="ts">
  import { Textarea } from '@/components/ui/textarea';
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
  import textareaTranslations from '@shared/content/textarea/translations.json';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(textareaTranslations);

  // ─── SEO + Analytics ─────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale: l,
      componentSlug: 'textarea',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      aiIntent: t('seo.aiIntent'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: t('category'), item: '/components/form' },
        { name: t('title') },
      ],
    });
    track('docs_page_view', {
      component_name: 'textarea',
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
    track('docs_section_viewed', { section_id: id, component_name: 'textarea', locale: $locale });
  });
  $effect(() => section.attach());

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const priorityKeyMap: Record<string, string> = { high: 'common.high', medium: 'common.medium', low: 'common.low' };
  function localPriority(raw: string, tNav: (k: string) => string): string {
    return tNav(priorityKeyMap[raw] ?? 'common.high');
  }

  // ─── Demo state ──────────────────────────────────────────────────────────────

  let demoDescriptionValue = $state('');
  let demoBioValue = $state('');
  const demoMax = 500;
  const demoBioMax = 200;

  // Composition state
  let compCounterValue = $state('');
  let compFormValue = $state('');
  let compFormSubmitted = $state(false);
  const compMax = 500;
  const compCounterAriaLabel = $derived(`${compCounterValue.length} de ${compMax} caracteres usados`);
  const compFormAriaLabel = $derived(`${compFormValue.length} de ${compMax} caracteres usados`);

  function handleCompFormSubmit(e: Event) {
    e.preventDefault();
    compFormSubmitted = true;
  }

  // ─── Code strings ────────────────────────────────────────────────────────────

  const codeImportBasic = `import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";`;

  const codeDefault = `<div class="flex flex-col gap-1.5">
  <Label for="descricao">Descrição</Label>
  <Textarea
    id="descricao"
    placeholder="ex: Descreva o produto..."
    class="resize-y min-h-[120px]"
  />
</div>`;

  const codeWithCounter = [
    '<' + 'script lang="ts">',
    "  let value = $state('');",
    '  const max = 500;',
    '<' + '/script>',
    '',
    '<div class="flex flex-col gap-1.5">',
    '  <Label for="descricao">Descrição</Label>',
    '  <Textarea',
    '    id="descricao"',
    '    bind:value',
    '    maxlength={max}',
    '    placeholder="ex: Descreva o produto..."',
    '    class="resize-y min-h-[120px]"',
    '  />',
    '  <div class="flex justify-between text-xs text-muted-foreground">',
    '    <span>Descreva com clareza.</span>',
    '    <span',
    '      aria-live="polite"',
    '      aria-label="{value.length} de {max} caracteres usados"',
    '    >{value.length}/{max}</span>',
    '  </div>',
    '</div>',
  ].join('\n');

  const codeNoResize = `<div class="flex flex-col gap-1.5">
  <Label for="obs">Observações</Label>
  <Textarea
    id="obs"
    placeholder="Adicione observações..."
    class="resize-none min-h-[120px]"
  />
</div>`;

  const codeTokenCustomization = `/* Altura mínima customizada */
[data-slot="textarea"] {
  min-height: 180px;
}

/* Borda colorida quando inválido + foco */
[data-slot="textarea"][aria-invalid="true"]:focus-visible {
  --ring-color: hsl(var(--destructive));
}`;

  const interfaceCode = `// Textarea — estende todos os atributos HTML nativos de <textarea>
interface TextareaProps extends HTMLTextareaAttributes {
  class?: string;
  ref?: HTMLTextAreaElement | null;
  value?: string;
}`;

  const counterAriaLabel = $derived(`${demoDescriptionValue.length} de ${demoMax} caracteres usados`);
  const bioAriaLabel = $derived(`${demoBioValue.length} de ${demoBioMax} caracteres usados`);
</script>

<DocsPageLayout navGroups={NAV_GROUPS} activeSection={section.value} componentSlug="textarea">
  {#snippet header()}
    <DocsHeader
      title={$tStore('title')}
      description={$tStore('description')}
      category={$tStore('category')}
      type={$tStore('type')}
      installNote="npx shadcn-svelte@latest add textarea"
    />
  {/snippet}

  <!-- ── Demonstração ───────────────────────────────────────────── -->
  <DocsDemonstration title={$tStore('demonstration.title')}>
    {#snippet children()}
      <div class="w-full space-y-6 max-w-md">
        <div class="flex flex-col gap-1.5">
          <Label for="demo-descricao">{$tStore('demonstration.labels.descriptionLabel')}</Label>
          <Textarea
            id="demo-descricao"
            bind:value={demoDescriptionValue}
            maxlength={demoMax}
            placeholder={$tStore('demonstration.labels.descriptionPlaceholder')}
            class="resize-y min-h-[120px]"
          />
          <div class="flex justify-between text-xs text-muted-foreground">
            <span>{$tStore('demonstration.labels.descriptionHelp')}</span>
            <span aria-live="polite" aria-label={counterAriaLabel}>
              {demoDescriptionValue.length}/{demoMax}
            </span>
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <Label for="demo-bio">{$tStore('demonstration.labels.bioLabel')}</Label>
          <Textarea
            id="demo-bio"
            bind:value={demoBioValue}
            maxlength={demoBioMax}
            placeholder={$tStore('demonstration.labels.bioPlaceholder')}
            class="resize-none min-h-[100px]"
          />
          <div class="flex justify-end text-xs text-muted-foreground">
            <span aria-live="polite" aria-label={bioAriaLabel}>
              {demoBioValue.length}/{demoBioMax}
            </span>
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <Label for="demo-feedback">{$tStore('demonstration.labels.feedbackLabel')}</Label>
          <Textarea
            id="demo-feedback"
            placeholder={$tStore('demonstration.labels.feedbackPlaceholder')}
            class="resize-y min-h-[120px]"
          />
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
    <div class="flex flex-col gap-1.5 w-full">
      <Label for="do1-desc">Descrição</Label>
      <Textarea id="do1-desc" maxlength={500} placeholder="ex: Descreva o produto..." class="resize-y min-h-[100px]" />
      <div class="flex justify-end text-xs text-muted-foreground">
        <span aria-live="polite" aria-label="0 de 500 caracteres usados">0/500</span>
      </div>
    </div>
  {/snippet}
  {#snippet dontPair1()}
    <div class="flex flex-col gap-1.5 w-full">
      <Label for="dont1-desc">Descrição</Label>
      <Textarea id="dont1-desc" maxlength={500} placeholder="ex: Descreva o produto..." class="resize-y min-h-[100px]" />
    </div>
  {/snippet}

  {#snippet doPair2()}
    <div class="flex flex-col gap-1.5 w-full">
      <Label for="do2-obs">Observações</Label>
      <Textarea id="do2-obs" placeholder="Adicione observações..." class="resize-y min-h-[100px]" />
    </div>
  {/snippet}
  {#snippet dontPair2()}
    <div class="flex flex-col gap-1.5 w-full">
      <Label for="dont2-obs">Observações</Label>
      <Textarea id="dont2-obs" placeholder="Adicione observações..." class="resize min-h-[100px]" />
    </div>
  {/snippet}

  <!-- ── Importação ─────────────────────────────────────────────── -->
  <DocsImport
    title={$tStore('import.title')}
    code={codeImportBasic}
  />

  <!-- ── Variantes ──────────────────────────────────────────────── -->
  <DocsVariants
    title={$tStore('variants.title')}
    componentSlug="textarea"
    items={[
      { name: $tStore('variants.items.default'),     description: $tStore('variants.styles.default'),     code: codeDefault,     preview: variantDefault     },
      { name: $tStore('variants.items.withCounter'), description: $tStore('variants.styles.withCounter'), code: codeWithCounter, preview: variantWithCounter },
      { name: $tStore('variants.items.noResize'),    description: $tStore('variants.styles.noResize'),    code: codeNoResize,    preview: variantNoResize    },
    ]}
  />

  {#snippet variantDefault()}
    <div class="flex flex-col gap-1.5 w-72">
      <Label for="v-default">Descrição</Label>
      <Textarea id="v-default" placeholder="ex: Descreva o produto..." class="resize-y min-h-[100px]" />
    </div>
  {/snippet}
  {#snippet variantWithCounter()}
    <div class="flex flex-col gap-1.5 w-72">
      <Label for="v-counter">Biografia</Label>
      <Textarea id="v-counter" maxlength={200} placeholder="Conte um pouco sobre você..." class="resize-y min-h-[100px]" />
      <div class="flex justify-end text-xs text-muted-foreground">
        <span aria-live="polite" aria-label="0 de 200 caracteres usados">0/200</span>
      </div>
    </div>
  {/snippet}
  {#snippet variantNoResize()}
    <div class="flex flex-col gap-1.5 w-72">
      <Label for="v-noresize">Observações</Label>
      <Textarea id="v-noresize" placeholder="Adicione observações..." class="resize-none min-h-[100px]" />
    </div>
  {/snippet}

  <!-- ── Composições ──────────────────────────────────────────────── -->
  <DocsCompositions
    title={$tStore('variants.compositionsTitle')}
    useWhenLabel={$tNavStore('common.useWhen')}
    componentSlug="textarea"
    items={[
      {
        name: $tStore('variants.compositions.withLabel.name'),
        description: $tStore('variants.compositions.withLabel.description'),
        useWhen: $tStore('variants.compositions.withLabel.use'),
        code: `<div class="flex flex-col gap-1.5 w-full max-w-md">\n  <Label for="ta-label">Descrição</Label>\n  <Textarea id="ta-label" placeholder="ex: Descreva o produto..." class="resize-y min-h-[120px]" />\n</div>`,
        preview: compWithLabel,
      },
      {
        name: $tStore('variants.compositions.withHint.name'),
        description: $tStore('variants.compositions.withHint.description'),
        useWhen: $tStore('variants.compositions.withHint.use'),
        code: `<div class="flex flex-col gap-1.5 w-full max-w-md">\n  <Label for="ta-hint">Descrição</Label>\n  <Textarea id="ta-hint" placeholder="ex: Descreva o produto..." class="resize-y min-h-[120px]" />\n  <p class="text-xs text-muted-foreground">Descreva o produto com clareza, destacando os principais atributos.</p>\n</div>`,
        preview: compWithHint,
      },
      {
        name: $tStore('variants.compositions.withCounter.name'),
        description: $tStore('variants.compositions.withCounter.description'),
        useWhen: $tStore('variants.compositions.withCounter.use'),
        code: `<script lang="ts">\n  let value = $state('');\n  const max = 500;\n</` + `script>\n\n<div class="flex flex-col gap-1.5 w-full max-w-md">\n  <Label for="ta-counter">Descrição</Label>\n  <Textarea id="ta-counter" bind:value maxlength={max} class="resize-y min-h-[120px]" />\n  <div class="flex justify-between text-xs text-muted-foreground">\n    <span>Descreva com clareza.</span>\n    <span class="tabular-nums shrink-0" aria-live="polite" aria-label={\`\${value.length} de \${max} caracteres usados\`}>{value.length}/{max}</span>\n  </div>\n</div>`,
        preview: compWithCounter,
      },
      {
        name: $tStore('variants.compositions.withError.name'),
        description: $tStore('variants.compositions.withError.description'),
        useWhen: $tStore('variants.compositions.withError.use'),
        code: `<div class="flex flex-col gap-1.5 w-full max-w-md">\n  <Label for="ta-error">Descrição</Label>\n  <Textarea id="ta-error" aria-invalid="true" aria-describedby="ta-error-error" class="resize-y min-h-[120px]" />\n  <p id="ta-error-error" class="text-xs text-destructive">A descrição é obrigatória e deve ter pelo menos 20 caracteres.</p>\n</div>`,
        preview: compWithError,
      },
      {
        name: $tStore('variants.compositions.inForm.name'),
        description: $tStore('variants.compositions.inForm.description'),
        useWhen: $tStore('variants.compositions.inForm.use'),
        code: `<form class="flex flex-col gap-4 w-full max-w-md" aria-label="Formulário de feedback" onsubmit={handleSubmit}>\n  <div class="flex flex-col gap-1.5">\n    <Label for="ta-form">Feedback</Label>\n    <Textarea id="ta-form" name="feedback" bind:value maxlength={500} class="resize-y min-h-[120px]" />\n    <div class="flex justify-end text-xs text-muted-foreground">\n      <span class="tabular-nums shrink-0" aria-live="polite">{value.length}/500</span>\n    </div>\n  </div>\n  <Button type="submit">Enviar</Button>\n  {#if submitted}<p aria-live="polite" class="text-xs text-success">Obrigado pelo feedback!</p>{/if}\n</form>`,
        preview: compInForm,
      },
    ]}
  />

  {#snippet compWithLabel()}
    <div class="flex flex-col gap-1.5 w-full max-w-md">
      <Label for="ta-label">Descrição</Label>
      <Textarea id="ta-label" class="resize-y min-h-[120px]" placeholder="ex: Descreva o produto..." />
    </div>
  {/snippet}
  {#snippet compWithHint()}
    <div class="flex flex-col gap-1.5 w-full max-w-md">
      <Label for="ta-hint">Descrição</Label>
      <Textarea id="ta-hint" class="resize-y min-h-[120px]" placeholder="ex: Descreva o produto..." />
      <p class="text-xs text-muted-foreground">Descreva o produto com clareza, destacando os principais atributos.</p>
    </div>
  {/snippet}
  {#snippet compWithCounter()}
    <div class="flex flex-col gap-1.5 w-full max-w-md">
      <Label for="ta-counter">Descrição</Label>
      <Textarea
        id="ta-counter"
        bind:value={compCounterValue}
        maxlength={compMax}
        class="resize-y min-h-[120px]"
        placeholder="ex: Descreva o produto..."
      />
      <div class="flex justify-between text-xs text-muted-foreground">
        <span>Descreva com clareza.</span>
        <span class="tabular-nums shrink-0" aria-live="polite" aria-label={compCounterAriaLabel}>
          {compCounterValue.length}/{compMax}
        </span>
      </div>
    </div>
  {/snippet}
  {#snippet compWithError()}
    <div class="flex flex-col gap-1.5 w-full max-w-md">
      <Label for="ta-error">Descrição</Label>
      <Textarea
        id="ta-error"
        aria-invalid="true"
        aria-describedby="ta-error-error"
        class="resize-y min-h-[120px]"
        placeholder="ex: Descreva o produto..."
      />
      <p id="ta-error-error" class="text-xs text-destructive">
        A descrição é obrigatória e deve ter pelo menos 20 caracteres.
      </p>
    </div>
  {/snippet}
  {#snippet compInForm()}
    <form
      class="flex flex-col gap-4 w-full max-w-md"
      aria-label="Formulário de feedback"
      onsubmit={handleCompFormSubmit}
    >
      <div class="flex flex-col gap-1.5">
        <Label for="ta-form">Feedback</Label>
        <Textarea
          id="ta-form"
          name="feedback"
          bind:value={compFormValue}
          maxlength={compMax}
          class="resize-y min-h-[120px]"
          placeholder="Conte sua experiência..."
        />
        <div class="flex justify-end text-xs text-muted-foreground">
          <span class="tabular-nums shrink-0" aria-live="polite" aria-label={compFormAriaLabel}>
            {compFormValue.length}/{compMax}
          </span>
        </div>
      </div>
      <Button type="submit">Enviar</Button>
      {#if compFormSubmitted}
        <p aria-live="polite" class="text-xs text-success">Obrigado pelo feedback!</p>
      {/if}
    </form>
  {/snippet}

  <!-- ── Estados ────────────────────────────────────────────────── -->
  <DocsStates
    title={$tStore('states.title')}
    cols={{
      state: $tNavStore('common.storyState'),
      trigger: $tNavStore('common.userAction'),
      behavior: $tNavStore('common.expectedResult'),
    }}
    items={[
      { label: $tStore('states.items.default'),  trigger: '—',                              behavior: $tStore('states.descriptions.default')  },
      { label: $tStore('states.items.focus'),    trigger: 'Tab / click',                    behavior: $tStore('states.descriptions.focus')    },
      { label: $tStore('states.items.filled'),   trigger: 'Type',                           behavior: $tStore('states.descriptions.filled')   },
      { label: $tStore('states.items.disabled'), trigger: 'disabled',                       behavior: $tStore('states.descriptions.disabled') },
      { label: $tStore('states.items.invalid'),  trigger: 'aria-invalid="true"',            behavior: $tStore('states.descriptions.invalid')  },
      { label: $tStore('states.items.readonly'), trigger: 'readonly',                       behavior: $tStore('states.descriptions.readonly') },
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
          { name: 'value',        type: $tStore('props.table.value.type'),        defaultValue: $tStore('props.table.value.default'),        required: $tStore('props.table.value.required'),        description: $tStore('props.table.value.description')        },
          { name: 'defaultValue', type: $tStore('props.table.defaultValue.type'), defaultValue: $tStore('props.table.defaultValue.default'), required: $tStore('props.table.defaultValue.required'), description: $tStore('props.table.defaultValue.description') },
          { name: 'placeholder',  type: $tStore('props.table.placeholder.type'),  defaultValue: $tStore('props.table.placeholder.default'),  required: $tStore('props.table.placeholder.required'),  description: $tStore('props.table.placeholder.description')  },
          { name: 'maxlength',    type: $tStore('props.table.maxLength.type'),    defaultValue: $tStore('props.table.maxLength.default'),    required: $tStore('props.table.maxLength.required'),    description: $tStore('props.table.maxLength.description')    },
          { name: 'rows',         type: $tStore('props.table.rows.type'),         defaultValue: $tStore('props.table.rows.default'),         required: $tStore('props.table.rows.required'),         description: $tStore('props.table.rows.description')         },
          { name: 'disabled',     type: $tStore('props.table.disabled.type'),     defaultValue: $tStore('props.table.disabled.default'),     required: $tStore('props.table.disabled.required'),     description: $tStore('props.table.disabled.description')     },
          { name: 'readonly',     type: $tStore('props.table.readOnly.type'),     defaultValue: $tStore('props.table.readOnly.default'),     required: $tStore('props.table.readOnly.required'),     description: $tStore('props.table.readOnly.description')     },
          { name: 'class',        type: $tStore('props.table.className.type'),    defaultValue: $tStore('props.table.className.default'),    required: $tStore('props.table.className.required'),    description: $tStore('props.table.className.description')    },
        ],
      },
    ]}
    interfaceCode={interfaceCode}
    extensibilityTitle={$tStore('props.extensibilityTitle')}
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
      { token: '--input',             value: $tStore('tokens.table.input.class'),           description: $tStore('tokens.table.input.part')           },
      { token: 'transparent',         value: $tStore('tokens.table.background.class'),      description: $tStore('tokens.table.background.part')      },
      { token: '--foreground',        value: $tStore('tokens.table.foreground.class'),      description: $tStore('tokens.table.foreground.part')      },
      { token: '--muted-foreground',  value: $tStore('tokens.table.mutedForeground.class'), description: $tStore('tokens.table.mutedForeground.part') },
      { token: '--ring',              value: $tStore('tokens.table.ring.class'),            description: $tStore('tokens.table.ring.part')            },
      { token: '--destructive',       value: $tStore('tokens.table.destructive.class'),     description: $tStore('tokens.table.destructive.part')     },
    ]}
    customizationTitle={$tStore('tokens.customizationTitle')}
    customizationCode={codeTokenCustomization}
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
      { key: 'Tab',         description: $tStore('accessibility.keyboard.tab')        },
      { key: 'Shift+Tab',   description: $tStore('accessibility.keyboard.shiftTab')   },
      { key: 'Enter',       description: $tStore('accessibility.keyboard.enter')      },
      { key: 'Shift+Enter', description: $tStore('accessibility.keyboard.shiftEnter') },
      { key: 'Esc',         description: $tStore('accessibility.keyboard.esc')        },
    ]}
  />

  <!-- ── Relacionados ───────────────────────────────────────────── -->
  <DocsRelated
    title={$tStore('related.title')}
    items={[
      { name: $tStore('related.items.input.name'),    description: $tStore('related.items.input.description'),    path: '?path=/docs/ui-input--docs'    },
      { name: $tStore('related.items.label.name'),    description: $tStore('related.items.label.description'),    path: '?path=/docs/ui-label--docs'    },
      { name: $tStore('related.items.form.name'),     description: $tStore('related.items.form.description'),     path: '?path=/docs/ui-form--docs'     },
      { name: $tStore('related.items.inputOTP.name'), description: $tStore('related.items.inputOTP.description'), path: '?path=/docs/ui-inputotp--docs' },
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
      { event: 'field_blur', trigger: $tStore('analytics.table.field_blur.trigger'), payload: $tStore('analytics.table.field_blur.payload') },
      { event: 'docs_page_view', trigger: $locale === 'en' ? 'Page mount per locale' : $locale === 'es' ? 'Montaje de página por locale' : 'Mount da página por locale', payload: '{ component_name: "textarea", locale, page_title }' },
      { event: 'docs_section_viewed', trigger: $locale === 'en' ? 'Section enters viewport' : $locale === 'es' ? 'La sección entra al viewport' : 'Seção entra no viewport', payload: '{ component_name: "textarea", section_id, locale }' },
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
        { criterion: $tStore('testes.accessibility.item1'), level: 'AA', how: 'axe-core / testing-library' },
        { criterion: $tStore('testes.accessibility.item2'), level: 'AA', how: 'Lighthouse contrast audit'   },
        { criterion: $tStore('testes.accessibility.item3'), level: 'AA', how: 'Inspecionar foco no DOM'     },
        { criterion: $tStore('testes.accessibility.item4'), level: 'AA', how: 'getByLabelText na testing-library' },
        { criterion: $tStore('testes.accessibility.item5'), level: 'AA', how: 'Inspecionar aria-invalid no DOM'  },
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
