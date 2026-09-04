<script lang="ts">
  import { tick, untrack } from 'svelte';
  import {
    Stepper,
    StepperDescription,
    StepperIndicator,
    StepperItem,
    StepperSeparator,
    StepperTitle,
    StepperTrigger,
  } from '@/components/ui/stepper';
  import {
    stepperWithDescriptionsSource,
    stepperWizardSource,
  } from '@/components/ui/stepper/stepper.source';
  import { Button } from '@/components/ui/button';
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
  import stepperTranslations from '@shared/content/stepper/translations.json';
  import { stripHtml, toPlainText } from '@/lib/strip-html';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(stepperTranslations);

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria.
  const screenReaderItems = $derived(
    Object.values(
      (stepperTranslations as unknown as Record<
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
      componentSlug: 'stepper',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: t('category'), item: '/components/navigation' },
        { name: t('title') },
      ],
    });
    track('docs_page_view', {
      component_name: 'stepper',
      locale: l,
      page_title: `${t('title')} · Design System`,
    });
    return cleanup;
  });

  // ─── Active section ──────────────────────────────────────────────────────────

  // Sem grupo "Variantes": o Stepper tem UMA forma. O que muda de etapa para
  // etapa é situação, e situação mora em Estados.
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
        { id: 'importacao',   label: tContent('nav.import')       },
        { id: 'composicoes',  label: tContent('nav.compositions') },
        { id: 'estados',      label: tContent('nav.states')       },
        { id: 'propriedades', label: tContent('nav.props')        },
        { id: 'tokens',       label: tContent('nav.tokens')       },
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

  const sectionIds = untrack(() => NAV_GROUPS.flatMap(g => g.sections.map(s => s.id)));
  const section = createActiveSection(sectionIds, (id) => {
    track('docs_section_viewed', { section_id: id, component_name: 'stepper', locale: $locale });
  });
  $effect(() => section.attach());

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const priorityKeyMap: Record<string, string> = {
    high: 'common.high',
    medium: 'common.medium',
    low: 'common.low',
  };
  function localPriority(raw: string, tNav: (k: string) => string): string {
    return tNav(priorityKeyMap[raw] ?? 'common.high');
  }

  // ─── Demonstração ────────────────────────────────────────────────────────────

  const DEMO_TOTAL = 4;

  const demoSteps = $derived([
    { step: 1, title: $tStore('demonstration.labels.account'), hint: $tStore('demonstration.labels.accountHint') },
    { step: 2, title: $tStore('demonstration.labels.address'), hint: $tStore('demonstration.labels.addressHint') },
    { step: 3, title: $tStore('demonstration.labels.payment'), hint: $tStore('demonstration.labels.paymentHint') },
    { step: 4, title: $tStore('demonstration.labels.review'),  hint: $tStore('demonstration.labels.reviewHint')  },
  ]);

  const demoLabels = $derived({
    completed: $tStore('demonstration.labels.completed'),
    current: $tStore('demonstration.labels.current'),
  });

  let demoValue = $state(2);
  let demoPanel: HTMLDivElement | null = $state(null);

  const demoActive = $derived(demoSteps.find(s => s.step === demoValue) ?? demoSteps[0]);

  /**
   * O foco vai para o painel porque o componente NÃO tem região viva: quem
   * anuncia o avanço é o conteúdo que mudou. Só acontece em resposta a uma ação
   * da pessoa — não há efeito que roube o foco na montagem.
   */
  async function goToDemoStep(step: number) {
    if (step < 1 || step > DEMO_TOTAL) return;
    demoValue = step;
    track('step_change', {
      component: 'stepper',
      step,
      total: DEMO_TOTAL,
      location: 'docs_demo',
    });
    await tick();
    demoPanel?.focus();
  }

  // ─── Composição: fluxo completo ──────────────────────────────────────────────

  let compositionValue = $state(2);
  const compositionActive = $derived(demoSteps.find(s => s.step === compositionValue) ?? demoSteps[0]);

  // ─── Code strings ────────────────────────────────────────────────────────────

  const codeImport = `import {
  Stepper,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/components/ui/stepper";`;

  const interfaceCode = `// Stepper — raiz do fluxo
interface StepperProps {
  value?: number;                      // etapa atual, contando de 1
  'aria-label': string;                // OBRIGATÓRIO
  labels?: { completed?: string; current?: string };
  onStepSelect?: (step: number) => void;
  class?: string;
}

// StepperItem — uma etapa
interface StepperItemProps {
  step: number;                        // OBRIGATÓRIO
  completed?: boolean;
  disabled?: boolean;
  class?: string;
}

// StepperTrigger, StepperIndicator, StepperTitle,
// StepperDescription, StepperSeparator
interface StepperPartProps {
  class?: string;
}`;

  const propsTableCols = $derived({
    prop: $tStore('props.table.prop'),
    type: $tStore('props.table.type'),
    default: $tStore('props.table.default'),
    required: $tStore('props.table.required'),
    description: $tStore('props.table.description'),
  });

  // ─── Tokens ──────────────────────────────────────────────────────────────────

  const TOKEN_ROWS: Array<{ key: string; token: string }> = [
    { key: 'gap',                token: '--spacing-2'              },
    { key: 'itemGap',            token: '--spacing-2'              },
    { key: 'triggerGap',         token: '--spacing-1'              },
    { key: 'triggerRadius',      token: '--radius-md'              },
    { key: 'ring',               token: '--ring'                   },
    { key: 'ringHalo',           token: '--background'             },
    { key: 'indicatorSize',      token: '--spacing-8'              },
    { key: 'indicatorRadius',    token: '--radius-full'            },
    { key: 'indicatorBg',        token: '--muted'                  },
    { key: 'indicatorFg',        token: '--muted-foreground'       },
    { key: 'activeBg',           token: '--primary'                },
    { key: 'activeFg',           token: '--primary-foreground'     },
    { key: 'completedBg',        token: '--accent'                 },
    { key: 'completedFg',        token: '--accent-foreground'      },
    { key: 'titleSize',          token: '--text-control-lg'        },
    { key: 'titleWeight',        token: '--font-weight-semi-bold'  },
    { key: 'descriptionSize',    token: '--text-control-sm'        },
    { key: 'descriptionColor',   token: '--muted-foreground'       },
    { key: 'separator',          token: '--border'                 },
    { key: 'separatorLength',    token: '--spacing-8'              },
    { key: 'separatorCompleted', token: '--accent'                 },
    { key: 'separatorDisabled',  token: '--muted'                  },
  ];

  const tokenItems = $derived(
    TOKEN_ROWS.map(({ key, token }) => ({
      token,
      value: $tStore(`tokens.table.${key}.class`),
      description: $tStore(`tokens.table.${key}.part`),
    })),
  );
</script>

<DocsPageLayout navGroups={NAV_GROUPS} activeSection={section.value} componentSlug="stepper">
  {#snippet header()}
    <DocsHeader
      title={$tStore('title')}
      description={$tStore('description')}
      category={$tStore('category')}
      type={$tStore('type')}
    />
  {/snippet}

  <!-- ── Demonstração ───────────────────────────────────────────── -->
  <DocsDemonstration title={$tStore('demonstration.title')} componentSlug="stepper">
    <div class="nds-stack nds-w-full" data-spacing="lg">
      <Stepper
        value={demoValue}
        aria-label={$tStore('demonstration.labels.flow')}
        labels={demoLabels}
        onStepSelect={goToDemoStep}
      >
        {#each demoSteps as entry, index (entry.step)}
          <StepperItem step={entry.step}>
            <StepperTrigger>
              <StepperIndicator />
              <StepperTitle>{entry.title}</StepperTitle>
              <StepperDescription>{entry.hint}</StepperDescription>
            </StepperTrigger>
            {#if index < demoSteps.length - 1}
              <StepperSeparator />
            {/if}
          </StepperItem>
        {/each}
      </Stepper>

      <!-- `tabindex="-1"` permite foco programático sem entrar na ordem de
           tabulação; `aria-labelledby` faz o leitor anunciar o título da etapa
           ao receber o foco. -->
      <div
        bind:this={demoPanel}
        id="stepper-demo-panel"
        tabindex="-1"
        aria-labelledby="stepper-demo-panel-title"
        class="nds-p-4 nds-rounded-md nds-border-default nds-bg-card nds-stack"
        data-spacing="sm"
      >
        <h3 id="stepper-demo-panel-title" class="nds-text-body nds-font-semibold">
          {demoActive.title}
        </h3>
        <p class="nds-text-body nds-text-muted-foreground">{demoActive.hint}</p>
      </div>

      <div class="nds-cluster" data-spacing="md">
        <Button
          variant="outline"
          disabled={demoValue === 1}
          onclick={() => goToDemoStep(demoValue - 1)}
        >
          {$tStore('demonstration.labels.back')}
        </Button>
        <Button
          disabled={demoValue === DEMO_TOTAL}
          onclick={() => goToDemoStep(demoValue + 1)}
        >
          {$tStore('demonstration.labels.next')}
        </Button>
      </div>
    </div>
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
      $tStore('anatomy.item7'),
    ]}
    structureLabel={$tStore('anatomy.structureLabel')}
    structureCode={$tStore('anatomy.structureCode')}
  />

  <!-- ── Quando Usar ────────────────────────────────────────────── -->
  <DocsWhenToUse
    title={$tStore('usage.title')}
    guidelines={{
      title: $tStore('usage.guidelines.title'),
      items: [1, 2, 3, 4, 5].map(i => stripHtml($tStore(`usage.guidelines.item${i}`))),
    }}
    scenarios={{
      title: $tStore('usage.scenarios.title'),
      cols: {
        scenario: $tStore('usage.scenarios.cols.scenario'),
        use: $tStore('usage.scenarios.cols.use'),
        alternative: $tStore('usage.scenarios.cols.alternative'),
      },
      items: [1, 2, 3, 4, 5].map(i => ({
        s: toPlainText($tStore(`usage.scenarios.item${i}.s`)),
        u: toPlainText($tStore(`usage.scenarios.item${i}.u`)),
        a: toPlainText($tStore(`usage.scenarios.item${i}.a`)),
      })),
    }}
    uxWriting={{
      title: $tStore('usage.uxWriting.title'),
      cols: {
        element: $tStore('usage.uxWriting.table.element'),
        rules: $tStore('usage.uxWriting.table.rules'),
        do: $tStore('usage.uxWriting.table.correct'),
        dont: $tStore('usage.uxWriting.table.avoid'),
      },
      items: ['title', 'description', 'stateLabel', 'flowName'].map(key => ({
        element: $tStore(`usage.uxWriting.table.${key}.name`),
        rules:   $tStore(`usage.uxWriting.table.${key}.format`),
        do:      toPlainText($tStore(`usage.uxWriting.table.${key}.good`)),
        dont:    toPlainText($tStore(`usage.uxWriting.table.${key}.bad`)),
      })),
    }}
    do={{
      title: $tStore('usage.do.title'),
      items: [1, 2, 3, 4].map(i => $tStore(`usage.do.item${i}`)),
    }}
    dont={{
      title: $tStore('usage.dont.title'),
      items: [1, 2, 3, 4].map(i => $tStore(`usage.dont.item${i}`)),
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
      {
        doLabel: $tNavStore('common.do'),
        dontLabel: $tNavStore('common.dont'),
        doCaption: $tStore('doDont.pair3.do'),
        dontCaption: $tStore('doDont.pair3.dont'),
        doPreview: doPair3,
        dontPreview: dontPair3,
      },
    ]}
  />

  {#snippet doPair1()}
    <Stepper value={3} aria-label="Cadastro" labels={demoLabels} class="nds-text-body">
      <StepperItem step={1}>
        <StepperTrigger><StepperIndicator /><StepperTitle>Conta</StepperTitle></StepperTrigger>
        <StepperSeparator />
      </StepperItem>
      <StepperItem step={2}>
        <StepperTrigger><StepperIndicator /><StepperTitle>Endereço</StepperTitle></StepperTrigger>
        <StepperSeparator />
      </StepperItem>
      <StepperItem step={3}>
        <StepperTrigger><StepperIndicator /><StepperTitle>Revisão</StepperTitle></StepperTrigger>
      </StepperItem>
    </Stepper>
  {/snippet}
  {#snippet dontPair1()}
    <!-- Indicador com conteúdo próprio força o número a ficar mesmo na etapa
         concluída: a diferença passa a ser só a cor do círculo. -->
    <Stepper value={3} aria-label="Cadastro" class="nds-text-body">
      <StepperItem step={1}>
        <StepperTrigger><StepperIndicator>1</StepperIndicator><StepperTitle>Conta</StepperTitle></StepperTrigger>
        <StepperSeparator />
      </StepperItem>
      <StepperItem step={2}>
        <StepperTrigger><StepperIndicator>2</StepperIndicator><StepperTitle>Endereço</StepperTitle></StepperTrigger>
        <StepperSeparator />
      </StepperItem>
      <StepperItem step={3}>
        <StepperTrigger><StepperIndicator>3</StepperIndicator><StepperTitle>Revisão</StepperTitle></StepperTrigger>
      </StepperItem>
    </Stepper>
  {/snippet}

  {#snippet doPair2()}
    <Stepper value={2} aria-label="Cadastro" labels={demoLabels} class="nds-text-body">
      <StepperItem step={1}>
        <StepperTrigger><StepperIndicator /><StepperTitle>Conta</StepperTitle></StepperTrigger>
        <StepperSeparator />
      </StepperItem>
      <StepperItem step={2}>
        <StepperTrigger><StepperIndicator /><StepperTitle>Endereço</StepperTitle></StepperTrigger>
        <StepperSeparator />
      </StepperItem>
      <StepperItem step={3}>
        <StepperTrigger><StepperIndicator /><StepperTitle>Revisão</StepperTitle></StepperTrigger>
      </StepperItem>
    </Stepper>
  {/snippet}
  {#snippet dontPair2()}
    <div class="nds-stack" data-spacing="sm">
      <Stepper value={2} aria-label="Cadastro" labels={demoLabels} class="nds-text-body">
        <StepperItem step={1}>
          <StepperTrigger><StepperIndicator /><StepperTitle>Conta</StepperTitle></StepperTrigger>
          <StepperSeparator />
        </StepperItem>
        <StepperItem step={2}>
          <StepperTrigger><StepperIndicator /><StepperTitle>Endereço</StepperTitle></StepperTrigger>
          <StepperSeparator />
        </StepperItem>
        <StepperItem step={3}>
          <StepperTrigger><StepperIndicator /><StepperTitle>Revisão</StepperTitle></StepperTrigger>
        </StepperItem>
      </Stepper>
      <!-- Ilustração do defeito, e não o defeito: o aviso extra aparece, mas
           esta caixa NÃO declara aria-live. Conteúdo estático dentro de região
           viva interromperia a leitura da página inteira ao abrir. -->
      <p class="nds-text-body nds-text-muted-foreground">Etapa 2 de 3 — atualizado</p>
    </div>
  {/snippet}

  {#snippet doPair3()}
    <Stepper value={2} aria-label="Cadastro" labels={demoLabels} class="nds-text-body">
      <StepperItem step={1}>
        <StepperTrigger><StepperIndicator /><StepperTitle>Conta</StepperTitle></StepperTrigger>
        <StepperSeparator />
      </StepperItem>
      <StepperItem step={2}>
        <StepperTrigger><StepperIndicator /><StepperTitle>Endereço</StepperTitle></StepperTrigger>
        <StepperSeparator />
      </StepperItem>
      <StepperItem step={3} disabled>
        <StepperTrigger><StepperIndicator /><StepperTitle>Revisão</StepperTitle></StepperTrigger>
      </StepperItem>
    </Stepper>
  {/snippet}
  {#snippet dontPair3()}
    <Stepper value={2} aria-label="Cadastro" labels={demoLabels} class="nds-text-body">
      <StepperItem step={1}>
        <StepperTrigger><StepperIndicator /><StepperTitle>Conta</StepperTitle></StepperTrigger>
        <StepperSeparator />
      </StepperItem>
      <StepperItem step={2}>
        <StepperTrigger><StepperIndicator /><StepperTitle>Endereço</StepperTitle></StepperTrigger>
        <StepperSeparator />
      </StepperItem>
      <StepperItem step={3}>
        <StepperTrigger><StepperIndicator /><StepperTitle>Revisão</StepperTitle></StepperTrigger>
      </StepperItem>
    </Stepper>
  {/snippet}

  <!-- ── Importação ─────────────────────────────────────────────── -->
  <DocsImport
    title={$tStore('import.title')}
    code={codeImport}
    componentSlug="stepper"
  />

  <!-- ── Composições ────────────────────────────────────────────── -->
  <DocsCompositions
    title={$tStore('variants.title')}
    useWhenLabel={$tNavStore('common.useWhen')}
    componentSlug="stepper"
    items={[
      {
        name: $tStore('variants.compositions.wizard.name'),
        description: $tStore('variants.compositions.wizard.description'),
        useWhen: $tStore('variants.compositions.wizard.use'),
        trackId: 'wizard',
        code: stepperWizardSource(),
        preview: compositionWizard,
      },
      {
        name: $tStore('variants.compositions.withDescriptions.name'),
        description: $tStore('variants.compositions.withDescriptions.description'),
        useWhen: $tStore('variants.compositions.withDescriptions.use'),
        trackId: 'withDescriptions',
        code: stepperWithDescriptionsSource(),
        preview: compositionWithDescriptions,
      },
    ]}
  />

  {#snippet compositionWizard()}
    <div class="nds-stack nds-w-full nds-text-body" data-spacing="md">
      <Stepper
        value={compositionValue}
        aria-label={$tStore('demonstration.labels.flow')}
        labels={demoLabels}
        onStepSelect={(step) => (compositionValue = step)}
      >
        {#each demoSteps as entry, index (entry.step)}
          <StepperItem step={entry.step}>
            <StepperTrigger>
              <StepperIndicator />
              <StepperTitle>{entry.title}</StepperTitle>
            </StepperTrigger>
            {#if index < demoSteps.length - 1}
              <StepperSeparator />
            {/if}
          </StepperItem>
        {/each}
      </Stepper>
      <div class="nds-p-4 nds-rounded-md nds-border-default nds-bg-card nds-stack" data-spacing="sm">
        <p class="nds-text-body nds-font-semibold nds-m-0">{compositionActive.title}</p>
        <p class="nds-text-body nds-text-muted-foreground nds-m-0">{compositionActive.hint}</p>
      </div>
      <div class="nds-cluster" data-spacing="md">
        <Button
          variant="outline"
          disabled={compositionValue === 1}
          onclick={() => (compositionValue -= 1)}
        >
          {$tStore('demonstration.labels.back')}
        </Button>
        <Button
          disabled={compositionValue === DEMO_TOTAL}
          onclick={() => (compositionValue += 1)}
        >
          {$tStore('demonstration.labels.next')}
        </Button>
      </div>
    </div>
  {/snippet}

  {#snippet compositionWithDescriptions()}
    <Stepper
      value={2}
      aria-label={$tStore('demonstration.labels.flow')}
      labels={demoLabels}
      class="nds-text-body"
    >
      {#each demoSteps as entry, index (entry.step)}
        <StepperItem step={entry.step}>
          <StepperTrigger>
            <StepperIndicator />
            <StepperTitle>{entry.title}</StepperTitle>
            <StepperDescription>{entry.hint}</StepperDescription>
          </StepperTrigger>
          {#if index < demoSteps.length - 1}
            <StepperSeparator />
          {/if}
        </StepperItem>
      {/each}
    </Stepper>
  {/snippet}

  <!-- ── Estados ────────────────────────────────────────────────── -->
  <DocsStates
    title={$tStore('states.title')}
    cols={{
      state: $tStore('states.cols.state'),
      trigger: toPlainText($tStore('states.cols.trigger')),
      behavior: toPlainText($tStore('states.cols.behavior')),
    }}
    items={['inactive', 'active', 'completed', 'disabled'].map(key => ({
      label:    $tStore(`states.${key}.label`),
      trigger:  toPlainText($tStore(`states.${key}.trigger`)),
      behavior: toPlainText($tStore(`states.${key}.behavior`)),
    }))}
  />

  <!-- ── Propriedades ───────────────────────────────────────────── -->
  <DocsProps
    title={$tStore('props.title')}
    tables={[
      {
        cols: propsTableCols,
        items: [
          { name: 'value',        type: $tStore('props.table.value.type'),        defaultValue: $tStore('props.table.value.default'),        required: $tStore('props.table.value.required'),        description: toPlainText($tStore('props.table.value.description'))        },
          { name: 'aria-label',   type: $tStore('props.table.ariaLabel.type'),    defaultValue: $tStore('props.table.ariaLabel.default'),    required: $tStore('props.table.ariaLabel.required'),    description: toPlainText($tStore('props.table.ariaLabel.description'))    },
          { name: 'labels',       type: $tStore('props.table.labels.type'),       defaultValue: $tStore('props.table.labels.default'),       required: $tStore('props.table.labels.required'),       description: toPlainText($tStore('props.table.labels.description'))       },
          { name: 'onStepSelect', type: $tStore('props.table.onStepSelect.type'), defaultValue: $tStore('props.table.onStepSelect.default'), required: $tStore('props.table.onStepSelect.required'), description: toPlainText($tStore('props.table.onStepSelect.description')) },
          { name: 'step',         type: $tStore('props.table.step.type'),         defaultValue: $tStore('props.table.step.default'),         required: $tStore('props.table.step.required'),         description: toPlainText($tStore('props.table.step.description'))         },
          { name: 'completed',    type: $tStore('props.table.completed.type'),    defaultValue: $tStore('props.table.completed.default'),    required: $tStore('props.table.completed.required'),    description: toPlainText($tStore('props.table.completed.description'))    },
          { name: 'disabled',     type: $tStore('props.table.disabled.type'),     defaultValue: $tStore('props.table.disabled.default'),     required: $tStore('props.table.disabled.required'),     description: toPlainText($tStore('props.table.disabled.description'))     },
          /* `class`, e não `className`: esta stack nomeia a prop como o
             atributo do HTML, e o conteúdo compartilhado descreve a mesma
             coisa. */
          { name: 'class',        type: $tStore('props.table.class.type'),        defaultValue: $tStore('props.table.class.default'),        required: $tStore('props.table.class.required'),        description: toPlainText($tStore('props.table.class.description'))        },
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
    items={tokenItems}
    customizationTitle={$tStore('tokens.customizationTitle')}
    customizationCode={$tStore('tokens.customizationCode')}
  />

  <!-- ── Acessibilidade ─────────────────────────────────────────── -->
  <DocsAccessibility
    screenReaderTitle={$tNavStore('common.screenReader')}
    screenReaderItems={screenReaderItems}
    title={$tStore('accessibility.title')}
    summary={$tStore('accessibility.summary')}
    items={[1, 2, 3, 4, 5, 6, 7].map(i => $tStore(`accessibility.items.item${i}`))}
    keyboardTitle={$tStore('accessibility.keyboard.title')}
    keyboardItems={[
      { key: 'Tab',       description: toPlainText($tStore('accessibility.keyboard.tab'))      },
      { key: 'Shift+Tab', description: toPlainText($tStore('accessibility.keyboard.shiftTab')) },
      { key: 'Enter',     description: toPlainText($tStore('accessibility.keyboard.enter'))    },
      { key: 'Space',     description: toPlainText($tStore('accessibility.keyboard.space'))    },
    ]}
  />

  <!-- ── Relacionados ───────────────────────────────────────────── -->
  <DocsRelated
    title={$tStore('related.title')}
    componentSlug="stepper"
    items={[
      { name: $tStore('related.items.tabs.name'),       description: $tStore('related.items.tabs.description'),       path: '?path=/docs/components-navigation-tabs--docs'       },
      { name: $tStore('related.items.breadcrumb.name'), description: $tStore('related.items.breadcrumb.description'), path: '?path=/docs/components-navigation-breadcrumb--docs' },
      { name: $tStore('related.items.progress.name'),   description: $tStore('related.items.progress.description'),   path: '?path=/docs/components-feedback-progress--docs'     },
      { name: $tStore('related.items.form.name'),       description: $tStore('related.items.form.description'),       path: '?path=/docs/components-form-form--docs'             },
    ]}
  />

  <!-- ── Notas ──────────────────────────────────────────────────── -->
  <DocsNotes
    title={$tStore('notes.title')}
    componentSlug="stepper"
    items={[1, 2, 3, 4, 5].map(i => ({ title: '', content: $tStore(`notes.item${i}`) }))}
  />

  <!-- ── Analytics ─────────────────────────────────────────────── -->
  <DocsAnalytics
    title={$tStore('analytics.title')}
    cols={{
      event: $tStore('analytics.table.event'),
      trigger: toPlainText($tStore('analytics.table.trigger')),
      payload: $tStore('analytics.table.payload'),
    }}
    items={[
      { event: 'step_change',         trigger: toPlainText($tStore('analytics.table.step_change.trigger')),         payload: $tStore('analytics.table.step_change.payload')         },
      { event: 'docs_section_viewed', trigger: toPlainText($tStore('analytics.table.docs_section_viewed.trigger')), payload: $tStore('analytics.table.docs_section_viewed.payload') },
    ]}
  />

  <!-- ── Testes ─────────────────────────────────────────────────── -->
  <DocsTestes
    title={$tStore('testes.title')}
    functional={{
      title: $tStore('testes.functional.title'),
      description: $tStore('testes.functional.description'),
      cols: {
        action: $tNavStore('common.userAction'),
        result: $tNavStore('common.expectedResult'),
        priority: $tNavStore('common.priority'),
      },
      items: [1, 2, 3, 4].map(i => ({
        action:   toPlainText($tStore(`testes.functional.item${i}.action`)),
        result:   toPlainText($tStore(`testes.functional.item${i}.result`)),
        priority: localPriority($tStore(`testes.functional.item${i}.priority`), $tNavStore),
      })),
    }}
    accessibility={{
      title: $tStore('testes.accessibility.title'),
      description: $tStore('testes.accessibility.description'),
      cols: {
        criterion: $tNavStore('common.criterion'),
        level: 'WCAG',
        how: $tNavStore('common.howToVerify'),
      },
      items: [
        { criterion: toPlainText($tStore('testes.accessibility.item1')), level: 'AA',    how: 'axe-core'       },
        { criterion: toPlainText($tStore('testes.accessibility.item2')), level: '1.3.1', how: 'DOM inspection' },
        { criterion: toPlainText($tStore('testes.accessibility.item3')), level: '4.1.2', how: 'DOM inspection' },
        { criterion: toPlainText($tStore('testes.accessibility.item4')), level: '1.3.1', how: 'DOM inspection' },
        { criterion: toPlainText($tStore('testes.accessibility.item5')), level: '2.1.1', how: 'Keyboard test'  },
        { criterion: toPlainText($tStore('testes.accessibility.item6')), level: '4.1.2', how: 'DOM inspection' },
      ],
    }}
    visual={{
      title: $tStore('testes.visual.title'),
      description: $tStore('testes.visual.description'),
      cols: {
        story: $tNavStore('common.storyState'),
        priority: $tNavStore('common.priority'),
      },
      items: [1, 2, 3, 4].map(i => ({
        story:    $tStore(`testes.visual.item${i}.story`),
        priority: localPriority($tStore(`testes.visual.item${i}.priority`), $tNavStore),
      })),
    }}
  />
</DocsPageLayout>
