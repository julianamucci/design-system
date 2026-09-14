<script lang="ts">
  import { untrack } from 'svelte';
  import { Progress } from '@/components/ui/progress';
  import { locale, useTranslation } from '@/lib/i18n';
  import { applySeo } from '@/lib/use-seo';
  import { track } from '@/lib/analytics';
  import { createActiveSection } from '@/lib/use-active-section.svelte';
  import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.svelte';
  import {
    DocsHeader, DocsDemonstration, DocsAnatomy, DocsWhenToUse, DocsDoDont,
    DocsImport, DocsVariants, DocsStates, DocsProps, DocsTokens,
    DocsAccessibility, DocsRelated, DocsNotes, DocsAnalytics, DocsTestes,
  } from '@/components/docs/shared/sections';
  import uiTranslations from '@/i18n/ui.json';
  import progressTranslations from '@shared/content/progress/translations.json';
  import { stripHtml, toPlainText } from '@/lib/strip-html';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  // O conteúdo compartilhado descreve a função de texto de forma neutra; o tipo
  // é o da assinatura desta stack.
  const { tStore } = useTranslation(progressTranslations, {
    '*': {
      'props.table.getAriaValueText.type': '(value: number | null, min: number, max: number) => string',
    },
  });

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria. O
  // `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
  const screenReaderItems = $derived(
    Object.entries(
      (progressTranslations as unknown as Record<
        string,
        { accessibility?: { screenReader?: Record<string, string> } }
      >)[$locale]?.accessibility?.screenReader ?? {},
    )
      .filter(([key]) => key !== 'title')
      .map(([, value]) => value),
  );

  // ─── SEO + Analytics ─────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale: l,
      componentSlug: 'progress',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: t('category'), item: '/components/feedback' },
        { name: t('title') },
      ],
    });
    track('docs_page_view', {
      component_name: 'progress',
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

  const sectionIds = untrack(() => NAV_GROUPS.flatMap(g => g.sections.map(s => s.id)));
  const section = createActiveSection(sectionIds, (id) => {
    track('docs_section_viewed', { section_id: id, component_name: 'progress', locale: $locale });
  });
  $effect(() => section.attach());

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const priorityKeyMap: Record<string, string> = { high: 'common.high', medium: 'common.medium', low: 'common.low' };
  function localPriority(raw: string, tNav: (k: string) => string): string {
    return tNav(priorityKeyMap[raw] ?? 'common.high');
  }

  // ─── Animated values for demonstration ───────────────────────────────────────

  // A mesma demonstração da referência: uma linha de upload animada, duas
  // estáticas (carregando e concluído) e uma indeterminada.
  let uploadValue = $state(0);

  // Marcos de task_progress/task_complete: apenas no primeiro ciclo da animação,
  // para não inundar o GA4 com o loop infinito da demo.
  $effect(() => {
    const uploadStart = Date.now();
    let firstCycleDone = false;
    const id = setInterval(() => {
      uploadValue = uploadValue >= 100 ? 0 : uploadValue + 5;
      if (!firstCycleDone && uploadValue % 25 === 0 && uploadValue > 0) {
        track('task_progress', { component: 'progress', task: 'upload', percent: uploadValue, location: 'docs_demo' });
        if (uploadValue === 100) {
          track('task_complete', {
            component: 'progress',
            task: 'upload',
            duration_ms: Date.now() - uploadStart,
            location: 'docs_demo',
          });
          firstCycleDone = true;
        }
      }
    }, 400);
    return () => clearInterval(id);
  });

  // ─── Code strings ────────────────────────────────────────────────────────────

  const codeImport = `import { Progress } from "@/components/ui/progress";`;

  const codeDeterminate = `<Progress value={42} aria-label="Progresso do upload" />`;

  const codeWithLabel = `<div class="nds-stack" data-spacing="xs">
  <div class="nds-cluster nds-text-body" data-justify="between">
    <span class="nds-text-foreground">Enviando arquivo</span>
    <span class="nds-text-muted-foreground nds-tabular-nums" aria-live="polite">42%</span>
  </div>
  <Progress value={42} aria-label="Enviando arquivo" />
</div>`;

  const codeSemantic = `<Progress value={100} data-variant="success" aria-label="Sincronização concluída" />
<Progress value={92} data-variant="destructive" aria-label="Espaço de armazenamento quase esgotado" />`;

  const interfaceCode = `// Progress (root, bits-ui)
interface ProgressProps {
  /** Omitido ou null: indeterminado. Limitado ao mínimo e ao máximo. */
  value?: number | null;
  min?: number;
  max?: number;
  getAriaValueText?: (value: number | null, min: number, max: number) => string;
  'data-variant'?: 'success' | 'destructive';
  class?: string;
  'aria-label': string;
  // ...demais Progress.RootProps de bits-ui
}`;

  // Tabela de tokens — cada linha é uma declaração de
  // `docs/shared/styles/nds/progress.css`. O token é o mesmo nas cinco stacks;
  // a classe e a aplicação vêm do conteúdo compartilhado.
  const TOKEN_ROWS = [
    { token: '--primary',           key: 'track' },
    { token: '--primary',           key: 'indicator' },
    { token: '--success',           key: 'success' },
    { token: '--destructive',       key: 'destructive' },
    { token: '--spacing-2',         key: 'height' },
    { token: '--radius-full',       key: 'radius' },
    { token: '--muted-foreground',  key: 'value' },
    { token: '--text-control',      key: 'label' },
    { token: '--duration-base',     key: 'motion' },
    { token: '--duration-stately',  key: 'motionIndeterminate' },
  ] as const;
</script>

<DocsPageLayout navGroups={NAV_GROUPS} activeSection={section.value} componentSlug="progress">
  {#snippet header()}
    <DocsHeader
      title={$tStore('title')}
      description={$tStore('description')}
      category={$tStore('category')}
      type={$tStore('type')}
    />
  {/snippet}

  <!-- ── Demonstração ───────────────────────────────────────────── -->
  <DocsDemonstration componentSlug="progress">
    <div class="nds-stack nds-w-full" data-spacing="lg">
      {@render labeledBar(uploadValue, $tStore('demonstration.labels.upload'))}
      {@render labeledBar(50, $tStore('demonstration.labels.loading'))}
      {@render labeledBar(100, $tStore('demonstration.labels.complete'))}

      <!-- Indeterminado: só o rótulo, porque não há percentual para mostrar. -->
      <div class="nds-stack nds-w-full" data-spacing="xs">
        <div class="nds-cluster nds-text-body" data-align="center" data-justify="between">
          <span class="nds-text-foreground">{$tStore('demonstration.labels.indeterminate')}</span>
        </div>
        <Progress value={null} aria-label={$tStore('demonstration.labels.indeterminate')} />
      </div>
    </div>
  </DocsDemonstration>

  {#snippet labeledBar(value: number, label: string)}
    <div class="nds-stack nds-w-full" data-spacing="xs">
      <div class="nds-cluster nds-text-body" data-align="center" data-justify="between">
        <span class="nds-text-foreground">{label}</span>
        <span class="nds-text-muted-foreground nds-tabular-nums" aria-live="polite">{value}%</span>
      </div>
      <Progress {value} aria-label={label} />
    </div>
  {/snippet}

  <!-- ── Anatomia ───────────────────────────────────────────────── -->
  <DocsAnatomy
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
        { element: $tStore('usage.uxWriting.table.label.name'),     rules: $tStore('usage.uxWriting.table.label.format'),     do: $tStore('usage.uxWriting.table.label.good'),     dont: $tStore('usage.uxWriting.table.label.bad') },
        { element: $tStore('usage.uxWriting.table.value.name'),     rules: $tStore('usage.uxWriting.table.value.format'),     do: $tStore('usage.uxWriting.table.value.good'),     dont: $tStore('usage.uxWriting.table.value.bad') },
        { element: $tStore('usage.uxWriting.table.ariaLabel.name'), rules: $tStore('usage.uxWriting.table.ariaLabel.format'), do: $tStore('usage.uxWriting.table.ariaLabel.good'), dont: $tStore('usage.uxWriting.table.ariaLabel.bad') },
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
    <div class="nds-w-full">
      <Progress value={42} aria-label="Progresso do upload" />
    </div>
  {/snippet}
  {#snippet dontPair1()}
    <div class="nds-w-full">
      <Progress value={42} aria-label="Barra" />
    </div>
  {/snippet}
  {#snippet doPair2()}
    <div class="nds-stack nds-w-full" data-spacing="xs">
      <div class="nds-cluster nds-text-body" data-align="center" data-justify="between">
        <span class="nds-text-foreground">{$tStore('demonstration.labels.upload')}</span>
        <span class="nds-text-muted-foreground nds-tabular-nums" aria-live="polite">50%</span>
      </div>
      <Progress value={50} aria-label="Progresso do upload" />
    </div>
  {/snippet}
  <!-- O Don't é a região `assertive`: interrompe o leitor a cada avanço. -->
  {#snippet dontPair2()}
    <div class="nds-stack nds-w-full" data-spacing="xs">
      <div class="nds-cluster nds-text-body" data-align="center" data-justify="between">
        <span class="nds-text-foreground">{$tStore('demonstration.labels.upload')}</span>
        <span class="nds-text-muted-foreground nds-tabular-nums" aria-live="assertive">47%</span>
      </div>
      <Progress value={47} aria-label="Progresso do upload" />
    </div>
  {/snippet}

  <!-- ── Importação ─────────────────────────────────────────────── -->
  <DocsImport code={codeImport} componentSlug="progress" />

  <!-- ── Variantes ──────────────────────────────────────────────── -->
  <DocsVariants
    componentSlug="progress"
    items={[
      { trackId: 'determinate', name: $tStore('variants.items.determinate'),   description: stripHtml($tStore('variants.styles.determinate')),   code: codeDeterminate,   preview: variantDeterminate   },
      { trackId: 'withLabel', name: $tStore('variants.items.withLabel'),     description: stripHtml($tStore('variants.styles.withLabel')),     code: codeWithLabel,     preview: variantWithLabel     },
      { trackId: 'semantic', name: $tStore('variants.items.semantic'),      description: stripHtml($tStore('variants.styles.semantic')),      code: codeSemantic,      preview: variantSemantic      },
    ]}
  />

  {#snippet variantDeterminate()}
    <div class="nds-w-full">
      <Progress value={42} aria-label="Progresso do upload" />
    </div>
  {/snippet}
  {#snippet variantWithLabel()}
    <div class="nds-stack nds-w-full" data-spacing="xs">
      <div class="nds-cluster nds-text-body" data-justify="between">
        <span class="nds-text-foreground">{$tStore('demonstration.labels.upload')}</span>
        <span class="nds-text-muted-foreground nds-tabular-nums" aria-live="polite">42%</span>
      </div>
      <Progress value={42} aria-label={$tStore('demonstration.labels.upload')} />
    </div>
  {/snippet}
  {#snippet variantSemantic()}
    <div class="nds-stack nds-w-full" data-spacing="sm">
      <Progress value={100} data-variant="success" aria-label="Sincronização concluída" />
      <Progress value={92} data-variant="destructive" aria-label="Espaço de armazenamento quase esgotado" />
    </div>
  {/snippet}

  <!-- ── Estados ────────────────────────────────────────────────── -->
  <DocsStates
    cols={{
      state: $tStore('states.cols.state'),
      trigger: toPlainText($tStore('states.cols.trigger')),
      behavior: toPlainText($tStore('states.cols.behavior')),
    }}
    items={[
      { label: $tStore('states.default.label'),       trigger: toPlainText($tStore('states.default.trigger')),       behavior: toPlainText($tStore('states.default.behavior')) },
      { label: $tStore('states.loading.label'),       trigger: toPlainText($tStore('states.loading.trigger')),       behavior: toPlainText($tStore('states.loading.behavior')) },
      { label: $tStore('states.complete.label'),      trigger: toPlainText($tStore('states.complete.trigger')),      behavior: toPlainText($tStore('states.complete.behavior')) },
      { label: $tStore('states.indeterminate.label'), trigger: toPlainText($tStore('states.indeterminate.trigger')), behavior: toPlainText($tStore('states.indeterminate.behavior')) },
    ]}
  />

  <!-- ── Propriedades ───────────────────────────────────────────── -->
  <DocsProps
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
          { name: 'value',            type: $tStore('props.table.value.type'),            defaultValue: $tStore('props.table.value.default'),            required: $tStore('props.table.value.required'),            description: toPlainText($tStore('props.table.value.description'))            },
          { name: 'min',              type: $tStore('props.table.min.type'),              defaultValue: $tStore('props.table.min.default'),              required: $tStore('props.table.min.required'),              description: $tStore('props.table.min.description')                          },
          { name: 'max',              type: $tStore('props.table.max.type'),              defaultValue: $tStore('props.table.max.default'),              required: $tStore('props.table.max.required'),              description: $tStore('props.table.max.description')                          },
          { name: 'data-variant',     type: $tStore('props.table.variant.type'),          defaultValue: $tStore('props.table.variant.default'),          required: $tStore('props.table.variant.required'),          description: toPlainText($tStore('props.table.variant.description'))          },
          { name: 'aria-label',       type: $tStore('props.table.ariaLabel.type'),        defaultValue: $tStore('props.table.ariaLabel.default'),        required: $tStore('props.table.ariaLabel.required'),        description: $tStore('props.table.ariaLabel.description')                    },
          { name: 'getAriaValueText', type: $tStore('props.table.getAriaValueText.type'), defaultValue: $tStore('props.table.getAriaValueText.default'), required: $tStore('props.table.getAriaValueText.required'), description: $tStore('props.table.getAriaValueText.description')            },
          { name: 'class',            type: $tStore('props.table.className.type'),        defaultValue: $tStore('props.table.className.default'),        required: $tStore('props.table.className.required'),        description: toPlainText($tStore('props.table.className.description'))        },
        ],
      },
    ]}
    interfaceCode={interfaceCode}
    extensibilityTitle={$tStore('props.extensibilityTitle')}
    extensibilityCode={$tStore('props.extensibilityCode')}
  />

  <!-- ── Tokens ─────────────────────────────────────────────────── -->
  <DocsTokens
    cols={{
      token: $tStore('tokens.table.token'),
      value: $tStore('tokens.table.class'),
      description: $tStore('tokens.table.part'),
    }}
    items={TOKEN_ROWS.map(({ token, key }) => ({
      token,
      value: $tStore(`tokens.table.${key}.class`),
      description: $tStore(`tokens.table.${key}.part`),
    }))}
    customizationTitle={$tStore('tokens.customizationTitle')}
    customizationCode={$tStore('tokens.customizationCode')}
  />

  <!-- ── Acessibilidade ─────────────────────────────────────────── -->
  <DocsAccessibility
    screenReaderTitle={$tNavStore('common.screenReader')}
    screenReaderItems={screenReaderItems}
    summary={$tStore('accessibility.summary')}
    items={[
      $tStore('accessibility.items.item1'),
      $tStore('accessibility.items.item2'),
      $tStore('accessibility.items.item3'),
      $tStore('accessibility.items.item4'),
      $tStore('accessibility.items.item5'),
      $tStore('accessibility.items.item6'),
      $tStore('accessibility.aria.valuetext'),
    ]}
    keyboardTitle={$tStore('accessibility.keyboard.title')}
    keyboardItems={[
      { key: '—',   description: $tStore('accessibility.keyboard.noInteraction') },
      { key: 'Tab', description: $tStore('accessibility.keyboard.container')     },
    ]}
  />

  <!-- ── Relacionados ───────────────────────────────────────────── -->
  <DocsRelated
    componentSlug="progress"
    items={[
      { name: $tStore('related.items.skeleton.name'), description: $tStore('related.items.skeleton.description'), path: '?path=/docs/components-feedback-skeleton--docs' },
      { name: $tStore('related.items.alert.name'),    description: $tStore('related.items.alert.description'),    path: '?path=/docs/components-feedback-alert--docs'    },
      { name: $tStore('related.items.sonner.name'),   description: $tStore('related.items.sonner.description'),   path: '?path=/docs/components-feedback-sonner--docs'   },
    ]}
  />

  <!-- ── Notas ──────────────────────────────────────────────────── -->
  <DocsNotes
    componentSlug="progress"
    items={[
      { title: '', content: $tStore('notes.item1') },
      { title: '', content: $tStore('notes.item2') },
      { title: '', content: $tStore('notes.item3') },
      { title: '', content: $tStore('notes.item4') },
    ]}
  />

  <!-- ── Analytics ─────────────────────────────────────────────── -->
  <DocsAnalytics
    cols={{
      event: $tNavStore('common.event'),
      trigger: $tNavStore('common.eventTrigger'),
      payload: $tNavStore('common.payload'),
    }}
    items={[
      { event: 'task_progress', trigger: toPlainText($tStore('analytics.table.task_progress.trigger')), payload: $tStore('analytics.table.task_progress.payload') },
      { event: 'task_complete', trigger: toPlainText($tStore('analytics.table.task_complete.trigger')), payload: $tStore('analytics.table.task_complete.payload') },
    ]}
  />

  <!-- ── Testes ─────────────────────────────────────────────────── -->
  <DocsTestes
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
        { action: $tStore('testes.functional.item7.action'), result: $tStore('testes.functional.item7.result'), priority: localPriority($tStore('testes.functional.item7.priority'), $tNavStore) },
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
        { criterion: $tStore('testes.accessibility.item1'), level: 'AA',     how: $tStore('testes.accessibility.how.item1') },
        { criterion: $tStore('testes.accessibility.item2'), level: 'AA',     how: $tStore('testes.accessibility.how.item2') },
        { criterion: $tStore('testes.accessibility.item3'), level: 'AA',     how: $tStore('testes.accessibility.how.item3') },
        { criterion: $tStore('testes.accessibility.item4'), level: 'AA',     how: $tStore('testes.accessibility.how.item4') },
        { criterion: $tStore('testes.accessibility.item5'), level: 'AA',     how: $tStore('testes.accessibility.how.item5') },
        { criterion: $tStore('testes.accessibility.item6'), level: 'AA',     how: $tStore('testes.accessibility.how.item6') },
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
