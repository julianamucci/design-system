<script lang="ts">
  import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
  import radioGroupTranslations from '@shared/content/radio-group/translations.json';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(radioGroupTranslations);

  // ─── SEO + Analytics ─────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale: l,
      componentSlug: 'radio-group',
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
      component_name: 'radio-group',
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

  const sectionIds = NAV_GROUPS.flatMap(g => g.sections.map(s => s.id));
  const section = createActiveSection(sectionIds, (id) => {
    track('docs_section_viewed', { section_id: id, component_name: 'radio-group', locale: $locale });
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

  let paymentValue = $state('');
  let deliveryValue = $state('');
  let descValue = $state('');

  // Variants preview state
  let varVerticalValue = $state('');
  let varHorizontalValue = $state('');
  let varDescValue = $state('');

  // Compositions preview state
  let compVerticalValue = $state('');
  let compHorizontalValue = $state('');
  let compDescValue = $state('');
  let compFormValue = $state('');
  let compFormOutput = $state('');

  function handleCompFormSubmit(e: Event) {
    e.preventDefault();
    compFormOutput = compFormValue || '—';
  }

  // Do & Don't state
  let dd1DoValue = $state('pix');
  let dd1DontValue = $state('pix');
  let dd2DoValue = $state('');
  let dd2DontValue = $state('express');

  // ─── Code strings ────────────────────────────────────────────────────────────

  const codeImport = `import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";`;

  const codeVertical = `<RadioGroup aria-label="Forma de pagamento">
  <div class="flex items-center gap-2">
    <RadioGroupItem value="cartao" id="v-cartao" />
    <Label for="v-cartao">Cartão de crédito</Label>
  </div>
  <div class="flex items-center gap-2">
    <RadioGroupItem value="pix" id="v-pix" />
    <Label for="v-pix">Pix</Label>
  </div>
  <div class="flex items-center gap-2">
    <RadioGroupItem value="boleto" id="v-boleto" />
    <Label for="v-boleto">Boleto bancário</Label>
  </div>
</RadioGroup>`;

  const codeHorizontal = `<RadioGroup orientation="horizontal" class="flex gap-6" aria-label="Forma de entrega">
  <div class="flex items-center gap-2">
    <RadioGroupItem value="padrao" id="h-padrao" />
    <Label for="h-padrao">Padrão</Label>
  </div>
  <div class="flex items-center gap-2">
    <RadioGroupItem value="expressa" id="h-expressa" />
    <Label for="h-expressa">Expressa</Label>
  </div>
  <div class="flex items-center gap-2">
    <RadioGroupItem value="retirar" id="h-retirar" />
    <Label for="h-retirar">Retirar</Label>
  </div>
</RadioGroup>`;

  const codeWithDescription = `<RadioGroup aria-label="Forma de entrega">
  <div class="flex items-start gap-2">
    <RadioGroupItem value="padrao" id="d-padrao" class="mt-0.5" />
    <div class="flex flex-col gap-0.5">
      <Label for="d-padrao">Padrão</Label>
      <p class="text-sm text-muted-foreground">Entrega em até 5 dias úteis.</p>
    </div>
  </div>
  <div class="flex items-start gap-2">
    <RadioGroupItem value="expressa" id="d-expressa" class="mt-0.5" />
    <div class="flex flex-col gap-0.5">
      <Label for="d-expressa">Expressa</Label>
      <p class="text-sm text-muted-foreground">Entrega em 1 dia útil.</p>
    </div>
  </div>
</RadioGroup>`;

  const interfaceCode = `// RadioGroup (Svelte 5 — bits-ui)
interface RadioGroupProps {
  value?: string;        // $bindable — estado controlado
  ref?: HTMLElement;     // $bindable
  disabled?: boolean;
  name?: string;
  orientation?: "horizontal" | "vertical";
  class?: string;
}

interface RadioGroupItemProps {
  value: string;         // OBRIGATÓRIO
  id?: string;
  disabled?: boolean;
  class?: string;
}`;

  const customizationCode = `/* Override do tamanho do radio */
[data-slot="radio-group-item"] {
  width: 1.25rem;
  height: 1.25rem;
}

/* Cor customizada via Tailwind */
.payment-radio [data-slot="radio-group-item"][data-checked] {
  @apply bg-blue-600 border-blue-600;
}`;

  const descCopy = $derived.by(() => {
    const l = $locale;
    if (l === 'en') {
      return {
        standard: 'Free shipping in 5 business days.',
        express: 'Delivery in 1 business day.',
        pickup: 'Available within 2 hours.',
      };
    }
    if (l === 'es') {
      return {
        standard: 'Envío gratuito en 5 días hábiles.',
        express: 'Entrega en 1 día hábil.',
        pickup: 'Disponible en 2 horas.',
      };
    }
    return {
      standard: 'Frete grátis em até 5 dias úteis.',
      express: 'Entrega em 1 dia útil.',
      pickup: 'Disponível em 2 horas.',
    };
  });
</script>

<DocsPageLayout navGroups={NAV_GROUPS} activeSection={section.value} componentSlug="radio-group">
  {#snippet header()}
    <DocsHeader
      title={$tStore('title')}
      description={$tStore('description')}
      category={$tStore('category')}
      type={$tStore('type')}
      installNote="npx shadcn-svelte@latest add radio-group"
    />
  {/snippet}

  <!-- ── Demonstração ─────────────────────────────────────────────────── -->
  <DocsDemonstration title={$tStore('demonstration.title')} componentSlug="radio-group">
    {#snippet children()}
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full">
        <!-- Demo 1: vertical -->
        <div class="space-y-3">
          <p class="text-sm font-semibold">{$tStore('demonstration.labels.groupLabel')}</p>
          <RadioGroup
            bind:value={paymentValue}
            aria-label={$tStore('demonstration.labels.groupLabel')}
            data-track="demo"
            data-track-id="radio-group:demo:payment"
            data-track-label={$tStore('demonstration.labels.groupLabel')}
          >
            <div class="flex items-center gap-2">
              <RadioGroupItem value="cartao" id="demo-cartao" />
              <Label for="demo-cartao">{$tStore('demonstration.labels.card')}</Label>
            </div>
            <div class="flex items-center gap-2">
              <RadioGroupItem value="pix" id="demo-pix" />
              <Label for="demo-pix">{$tStore('demonstration.labels.pix')}</Label>
            </div>
            <div class="flex items-center gap-2">
              <RadioGroupItem value="boleto" id="demo-boleto" />
              <Label for="demo-boleto">{$tStore('demonstration.labels.boleto')}</Label>
            </div>
          </RadioGroup>
        </div>

        <!-- Demo 2: horizontal -->
        <div class="space-y-3">
          <p class="text-sm font-semibold">{$tStore('demonstration.labels.deliveryLabel')}</p>
          <RadioGroup
            bind:value={deliveryValue}
            orientation="horizontal"
            class="flex flex-wrap gap-6"
            aria-label={$tStore('demonstration.labels.deliveryLabel')}
            data-track="demo"
            data-track-id="radio-group:demo:delivery"
            data-track-label={$tStore('demonstration.labels.deliveryLabel')}
          >
            <div class="flex items-center gap-2">
              <RadioGroupItem value="standard" id="demo-standard" />
              <Label for="demo-standard">{$tStore('demonstration.labels.standard')}</Label>
            </div>
            <div class="flex items-center gap-2">
              <RadioGroupItem value="express" id="demo-express" />
              <Label for="demo-express">{$tStore('demonstration.labels.express')}</Label>
            </div>
            <div class="flex items-center gap-2">
              <RadioGroupItem value="pickup" id="demo-pickup" />
              <Label for="demo-pickup">{$tStore('demonstration.labels.pickup')}</Label>
            </div>
          </RadioGroup>
        </div>

        <!-- Demo 3: with description -->
        <div class="space-y-3 sm:col-span-2">
          <p class="text-sm font-semibold">{$tStore('demonstration.labels.deliveryLabel')}</p>
          <RadioGroup
            bind:value={descValue}
            aria-label={$tStore('demonstration.labels.deliveryLabel')}
            data-track="demo"
            data-track-id="radio-group:demo:delivery-desc"
            data-track-label={$tStore('demonstration.labels.deliveryLabel')}
          >
            <div class="flex items-start gap-2">
              <RadioGroupItem value="standard" id="demo-desc-standard" class="mt-0.5" />
              <div class="flex flex-col gap-0.5">
                <Label for="demo-desc-standard">{$tStore('demonstration.labels.standard')}</Label>
                <p class="text-sm text-muted-foreground">{descCopy.standard}</p>
              </div>
            </div>
            <div class="flex items-start gap-2">
              <RadioGroupItem value="express" id="demo-desc-express" class="mt-0.5" />
              <div class="flex flex-col gap-0.5">
                <Label for="demo-desc-express">{$tStore('demonstration.labels.express')}</Label>
                <p class="text-sm text-muted-foreground">{descCopy.express}</p>
              </div>
            </div>
            <div class="flex items-start gap-2">
              <RadioGroupItem value="pickup" id="demo-desc-pickup" class="mt-0.5" />
              <div class="flex flex-col gap-0.5">
                <Label for="demo-desc-pickup">{$tStore('demonstration.labels.pickup')}</Label>
                <p class="text-sm text-muted-foreground">{descCopy.pickup}</p>
              </div>
            </div>
          </RadioGroup>
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
    <RadioGroup bind:value={dd1DoValue} aria-label="Forma de pagamento" class="grid gap-2">
      <div class="flex items-center gap-2">
        <RadioGroupItem value="cartao" id="dd1-do-cartao" />
        <Label for="dd1-do-cartao">Cartão de crédito</Label>
      </div>
      <div class="flex items-center gap-2">
        <RadioGroupItem value="pix" id="dd1-do-pix" />
        <Label for="dd1-do-pix">Pix</Label>
      </div>
    </RadioGroup>
  {/snippet}

  {#snippet dd1Dont()}
    <RadioGroup bind:value={dd1DontValue} aria-label="Forma de pagamento" class="grid gap-2">
      <div class="flex items-center gap-2">
        <RadioGroupItem value="cartao" id="dd1-dont-cartao" />
        <span class="text-sm">Cartão de crédito</span>
      </div>
      <div class="flex items-center gap-2">
        <RadioGroupItem value="pix" id="dd1-dont-pix" />
        <span class="text-sm">Pix</span>
      </div>
    </RadioGroup>
  {/snippet}

  {#snippet dd2Do()}
    <RadioGroup bind:value={dd2DoValue} aria-label="Forma de entrega" class="grid gap-2">
      <div class="flex items-center gap-2">
        <RadioGroupItem value="standard" id="dd2-do-standard" />
        <Label for="dd2-do-standard">Padrão</Label>
      </div>
      <div class="flex items-center gap-2">
        <RadioGroupItem value="express" id="dd2-do-express" />
        <Label for="dd2-do-express">Expressa</Label>
      </div>
    </RadioGroup>
  {/snippet}

  {#snippet dd2Dont()}
    <RadioGroup bind:value={dd2DontValue} aria-label="Forma de entrega" class="grid gap-2">
      <div class="flex items-center gap-2">
        <RadioGroupItem value="standard" id="dd2-dont-standard" />
        <Label for="dd2-dont-standard">Padrão</Label>
      </div>
      <div class="flex items-center gap-2">
        <RadioGroupItem value="express" id="dd2-dont-express" />
        <Label for="dd2-dont-express">Expressa</Label>
      </div>
    </RadioGroup>
  {/snippet}

  <!-- ── Importação ────────────────────────────────────────────────────── -->
  <DocsImport
    title={$tStore('import.title')}
    code={codeImport}
    componentSlug="radio-group"
  />

  <!-- ── Variantes ─────────────────────────────────────────────────────── -->
  <DocsVariants
    title={$tStore('variants.title')}
    componentSlug="radio-group"
    items={[
      {
        name: $tStore('variants.items.vertical'),
        description: stripHtml($tStore('variants.styles.vertical')),
        code: codeVertical,
        preview: variantVertical,
      },
      {
        name: $tStore('variants.items.horizontal'),
        description: stripHtml($tStore('variants.styles.horizontal')),
        code: codeHorizontal,
        preview: variantHorizontal,
      },
      {
        name: $tStore('variants.items.withDescription'),
        description: stripHtml($tStore('variants.styles.withDescription')),
        code: codeWithDescription,
        preview: variantWithDescription,
      },
    ]}
  />

  {#snippet variantVertical()}
    <RadioGroup bind:value={varVerticalValue} aria-label="Forma de pagamento" class="grid gap-2 w-64">
      <div class="flex items-center gap-2">
        <RadioGroupItem value="cartao" id="var-v-cartao" />
        <Label for="var-v-cartao">Cartão de crédito</Label>
      </div>
      <div class="flex items-center gap-2">
        <RadioGroupItem value="pix" id="var-v-pix" />
        <Label for="var-v-pix">Pix</Label>
      </div>
      <div class="flex items-center gap-2">
        <RadioGroupItem value="boleto" id="var-v-boleto" />
        <Label for="var-v-boleto">Boleto bancário</Label>
      </div>
    </RadioGroup>
  {/snippet}

  {#snippet variantHorizontal()}
    <RadioGroup
      bind:value={varHorizontalValue}
      orientation="horizontal"
      class="flex flex-wrap gap-6"
      aria-label="Forma de entrega"
    >
      <div class="flex items-center gap-2">
        <RadioGroupItem value="padrao" id="var-h-padrao" />
        <Label for="var-h-padrao">Padrão</Label>
      </div>
      <div class="flex items-center gap-2">
        <RadioGroupItem value="expressa" id="var-h-expressa" />
        <Label for="var-h-expressa">Expressa</Label>
      </div>
      <div class="flex items-center gap-2">
        <RadioGroupItem value="retirar" id="var-h-retirar" />
        <Label for="var-h-retirar">Retirar</Label>
      </div>
    </RadioGroup>
  {/snippet}

  {#snippet variantWithDescription()}
    <RadioGroup bind:value={varDescValue} aria-label="Forma de entrega" class="grid gap-3 w-80">
      <div class="flex items-start gap-2">
        <RadioGroupItem value="padrao" id="var-d-padrao" class="mt-0.5" />
        <div class="flex flex-col gap-0.5">
          <Label for="var-d-padrao">Padrão</Label>
          <p class="text-sm text-muted-foreground">Entrega em até 5 dias úteis.</p>
        </div>
      </div>
      <div class="flex items-start gap-2">
        <RadioGroupItem value="expressa" id="var-d-expressa" class="mt-0.5" />
        <div class="flex flex-col gap-0.5">
          <Label for="var-d-expressa">Expressa</Label>
          <p class="text-sm text-muted-foreground">Entrega em 1 dia útil.</p>
        </div>
      </div>
    </RadioGroup>
  {/snippet}

  <!-- ── Composições ───────────────────────────────────────────────────── -->
  <DocsCompositions
    title={$tStore('variants.compositionsTitle')}
    useWhenLabel={$tNavStore('common.useWhen')}
    componentSlug="radio-group"
    items={[
      {
        name: $tStore('variants.compositions.vertical.name'),
        description: $tStore('variants.compositions.vertical.description'),
        useWhen: $tStore('variants.compositions.vertical.use'),
        code: codeVertical,
        preview: compVertical,
      },
      {
        name: $tStore('variants.compositions.horizontal.name'),
        description: $tStore('variants.compositions.horizontal.description'),
        useWhen: $tStore('variants.compositions.horizontal.use'),
        code: codeHorizontal,
        preview: compHorizontal,
      },
      {
        name: $tStore('variants.compositions.withDescription.name'),
        description: $tStore('variants.compositions.withDescription.description'),
        useWhen: $tStore('variants.compositions.withDescription.use'),
        code: codeWithDescription,
        preview: compWithDescription,
      },
      {
        name: $tStore('variants.compositions.inForm.name'),
        description: $tStore('variants.compositions.inForm.description'),
        useWhen: $tStore('variants.compositions.inForm.use'),
        code: codeVertical,
        preview: compInForm,
      },
    ]}
  />

  {#snippet compVertical()}
    <div class="flex flex-col gap-2">
      <p class="text-sm font-semibold">Forma de pagamento</p>
      <RadioGroup bind:value={compVerticalValue} aria-label="Forma de pagamento" class="grid gap-2">
        <div class="flex items-center gap-2">
          <RadioGroupItem value="card" id="comp-v-card" />
          <Label for="comp-v-card">Cartão de crédito</Label>
        </div>
        <div class="flex items-center gap-2">
          <RadioGroupItem value="pix" id="comp-v-pix" />
          <Label for="comp-v-pix">Pix</Label>
        </div>
        <div class="flex items-center gap-2">
          <RadioGroupItem value="boleto" id="comp-v-boleto" />
          <Label for="comp-v-boleto">Boleto bancário</Label>
        </div>
      </RadioGroup>
    </div>
  {/snippet}

  {#snippet compHorizontal()}
    <div class="flex flex-col gap-2">
      <p class="text-sm font-semibold">Forma de entrega</p>
      <RadioGroup
        bind:value={compHorizontalValue}
        orientation="horizontal"
        class="grid grid-flow-col auto-cols-max gap-6"
        aria-label="Forma de entrega"
      >
        <div class="flex items-center gap-2">
          <RadioGroupItem value="standard" id="comp-h-standard" />
          <Label for="comp-h-standard">Padrão (5 dias)</Label>
        </div>
        <div class="flex items-center gap-2">
          <RadioGroupItem value="express" id="comp-h-express" />
          <Label for="comp-h-express">Expressa (1 dia)</Label>
        </div>
        <div class="flex items-center gap-2">
          <RadioGroupItem value="pickup" id="comp-h-pickup" />
          <Label for="comp-h-pickup">Retirar na loja</Label>
        </div>
      </RadioGroup>
    </div>
  {/snippet}

  {#snippet compWithDescription()}
    <div class="flex flex-col gap-2 w-80">
      <p class="text-sm font-semibold">Forma de entrega</p>
      <RadioGroup bind:value={compDescValue} aria-label="Forma de entrega" class="grid gap-3">
        <div class="flex items-start gap-2">
          <RadioGroupItem value="standard" id="comp-d-standard" class="mt-1" />
          <div class="flex flex-col gap-0.5">
            <Label for="comp-d-standard">Padrão</Label>
            <p class="text-sm text-muted-foreground">Entrega em 5 dias úteis — frete grátis acima de R$ 199.</p>
          </div>
        </div>
        <div class="flex items-start gap-2">
          <RadioGroupItem value="express" id="comp-d-express" class="mt-1" />
          <div class="flex flex-col gap-0.5">
            <Label for="comp-d-express">Expressa</Label>
            <p class="text-sm text-muted-foreground">Receba em 1 dia útil — taxa adicional de R$ 19,90.</p>
          </div>
        </div>
        <div class="flex items-start gap-2">
          <RadioGroupItem value="pickup" id="comp-d-pickup" class="mt-1" />
          <div class="flex flex-col gap-0.5">
            <Label for="comp-d-pickup">Retirar na loja</Label>
            <p class="text-sm text-muted-foreground">Disponível em 2h — sem custo de frete.</p>
          </div>
        </div>
      </RadioGroup>
    </div>
  {/snippet}

  {#snippet compInForm()}
    <form class="flex flex-col gap-4 w-80 p-4 border rounded-lg" onsubmit={handleCompFormSubmit}>
      <fieldset class="border-0 p-0 m-0 flex flex-col gap-2">
        <legend class="text-sm font-semibold mb-2">Forma de pagamento</legend>
        <RadioGroup bind:value={compFormValue} aria-label="Forma de pagamento" class="grid gap-2">
          <div class="flex items-center gap-2">
            <RadioGroupItem value="card" id="comp-f-card" />
            <Label for="comp-f-card">Cartão de crédito</Label>
          </div>
          <div class="flex items-center gap-2">
            <RadioGroupItem value="pix" id="comp-f-pix" />
            <Label for="comp-f-pix">Pix</Label>
          </div>
          <div class="flex items-center gap-2">
            <RadioGroupItem value="boleto" id="comp-f-boleto" />
            <Label for="comp-f-boleto">Boleto bancário</Label>
          </div>
        </RadioGroup>
      </fieldset>
      <Button type="submit" class="self-end">Continuar</Button>
      <p class="text-sm text-muted-foreground">Selecionado: {compFormOutput}</p>
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
      { label: $tStore('states.items.checked'),  trigger: 'value="cartao"',          behavior: stripHtml($tStore('states.descriptions.checked')) },
      { label: $tStore('states.items.hover'),    trigger: ':hover',                  behavior: stripHtml($tStore('states.descriptions.hover')) },
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
          { name: 'orientation',   type: $tStore('props.table.orientation.type'),   defaultValue: $tStore('props.table.orientation.default'),   required: $tStore('props.table.orientation.required'),   description: stripHtml($tStore('props.table.orientation.description')) },
          { name: 'class',         type: $tStore('props.table.className.type'),     defaultValue: $tStore('props.table.className.default'),     required: $tStore('props.table.className.required'),     description: stripHtml($tStore('props.table.className.description')) },
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
      { token: '--primary',            value: $tStore('tokens.table.primary.class'),           description: $tStore('tokens.table.primary.part') },
      { token: '--primary-foreground', value: $tStore('tokens.table.primaryForeground.class'), description: $tStore('tokens.table.primaryForeground.part') },
      { token: '--ring',               value: $tStore('tokens.table.ring.class'),              description: $tStore('tokens.table.ring.part') },
      { token: '--destructive',        value: $tStore('tokens.table.destructive.class'),       description: $tStore('tokens.table.destructive.part') },
      { token: '--foreground',         value: $tStore('tokens.table.foreground.class'),        description: $tStore('tokens.table.foreground.part') },
    ]}
    customizationTitle={$tStore('tokens.customizationTitle')}
    customizationCode={customizationCode}
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
      { key: 'Tab',          description: stripHtml($tStore('accessibility.keyboard.tab')) },
      { key: '↓ ArrowDown',  description: stripHtml($tStore('accessibility.keyboard.arrowDown')) },
      { key: '↑ ArrowUp',    description: stripHtml($tStore('accessibility.keyboard.arrowUp')) },
      { key: '→ ArrowRight', description: stripHtml($tStore('accessibility.keyboard.arrowRight')) },
      { key: '← ArrowLeft',  description: stripHtml($tStore('accessibility.keyboard.arrowLeft')) },
      { key: 'Space',        description: stripHtml($tStore('accessibility.keyboard.space')) },
    ]}
  />

  <!-- ── Relacionados ──────────────────────────────────────────────────── -->
  <DocsRelated
    title={$tStore('related.title')}
    items={[
      { name: $tStore('related.items.checkbox.name'), description: $tStore('related.items.checkbox.description'), path: '?path=/docs/ui-checkbox--docs' },
      { name: $tStore('related.items.switch.name'),   description: $tStore('related.items.switch.description'),   path: '?path=/docs/ui-switch--docs' },
      { name: $tStore('related.items.select.name'),   description: $tStore('related.items.select.description'),   path: '?path=/docs/ui-select--docs' },
      { name: $tStore('related.items.form.name'),     description: $tStore('related.items.form.description'),     path: '?path=/docs/ui-form--docs' },
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
        event: 'radio_change',
        trigger: $tStore('analytics.table.radio_change.trigger'),
        payload: $tStore('analytics.table.radio_change.payload'),
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
      ],
    }}
  />
</DocsPageLayout>
