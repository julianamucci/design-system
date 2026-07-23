<script lang="ts">
  import { untrack } from 'svelte';
  import { Skeleton } from '@/components/ui/skeleton';
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
  import skeletonTranslations from '@shared/content/skeleton/translations.json';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(skeletonTranslations);

  // ─── SEO + Analytics ─────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale: l,
      componentSlug: 'skeleton',
    });
    track('docs_page_view', {
      component_name: 'skeleton',
      locale: l,
      page_title: t('title'),
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
    track('docs_section_viewed', { section_id: id, component_name: 'skeleton', locale: $locale });
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

  const codeImportBasic = `import { Skeleton } from "@/components/ui/skeleton";`;

  const codeImportUsage = `import { Skeleton } from "@/components/ui/skeleton";

<div aria-busy={isLoading} aria-label="Carregando perfil">
  <Skeleton class="nds-rounded-full nds-motion-reduce-none" style="height: 3rem; width: 3rem" aria-hidden="true" />
  <Skeleton class="nds-motion-reduce-none" style="height: 1rem; width: 250px" aria-hidden="true" />
</div>`;

  const codeRectangle = `<Skeleton class="nds-motion-reduce-none" style="height: 5rem; width: 16rem" aria-hidden="true" />`;
  const codeCircle = `<Skeleton class="nds-rounded-full nds-motion-reduce-none" style="height: 3rem; width: 3rem" aria-hidden="true" />`;
  const codeLine = `<Skeleton class="nds-motion-reduce-none" style="height: 1rem; width: 200px" aria-hidden="true" />`;

  const interfaceCode = `interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
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
    />
  {/snippet}

  <!-- ── Demonstração ───────────────────────────────────────────── -->
  <DocsDemonstration title={$tStore('demonstration.title')}>
    {#snippet children()}
      <div class="nds-grid nds-w-full" data-cols="2" data-spacing="lg" data-min="16rem">
        <!-- Card de perfil -->
        <div class="nds-stack" data-spacing="sm">
          <p class="nds-text-caption nds-font-medium nds-text-muted-foreground">{$tStore('demonstration.labels.card')}</p>
          <div
            aria-busy="true"
            aria-label={$tStore('demonstration.labels.card')}
            class="nds-cluster nds-p-4 nds-border-default nds-rounded-md"
            data-spacing="md"
            data-align="center"
          >
            <Skeleton class="nds-rounded-full nds-motion-reduce-none" style="height: 3rem; width: 3rem" aria-hidden="true" />
            <div class="nds-stack nds-flex-1" data-spacing="sm">
              <Skeleton class="nds-motion-reduce-none" style="height: 1rem; width: 180px" aria-hidden="true" />
              <Skeleton class="nds-motion-reduce-none" style="height: 1rem; width: 140px" aria-hidden="true" />
            </div>
          </div>
        </div>

        <!-- Lista -->
        <div class="nds-stack" data-spacing="sm">
          <p class="nds-text-caption nds-font-medium nds-text-muted-foreground">{$tStore('demonstration.labels.list')}</p>
          <ul aria-busy="true" aria-label={$tStore('demonstration.labels.list')} class="nds-stack" data-spacing="sm">
            {#each Array.from({ length: 3 }) as _, i (i)}
              <li class="nds-cluster nds-p-2 nds-border-default nds-rounded-md" data-spacing="sm" data-align="center">
                <Skeleton class="nds-rounded-full nds-motion-reduce-none" style="height: 2rem; width: 2rem" aria-hidden="true" />
                <Skeleton class="nds-motion-reduce-none" style="height: 0.75rem; width: 140px" aria-hidden="true" />
              </li>
            {/each}
          </ul>
        </div>

        <!-- Imagem AspectRatio -->
        <div class="nds-stack" data-spacing="sm">
          <p class="nds-text-caption nds-font-medium nds-text-muted-foreground">{$tStore('demonstration.labels.image')}</p>
          <div aria-busy="true" aria-label={$tStore('demonstration.labels.image')}>
            <div class="nds-w-full" style="position: relative; aspect-ratio: 16 / 9;">
              <Skeleton class="nds-w-full nds-motion-reduce-none" style="position: absolute; inset: 0; height: 100%" aria-hidden="true" />
            </div>
          </div>
        </div>

        <!-- Parágrafo -->
        <div class="nds-stack" data-spacing="sm">
          <p class="nds-text-caption nds-font-medium nds-text-muted-foreground">{$tStore('demonstration.labels.paragraph')}</p>
          <div aria-busy="true" aria-label={$tStore('demonstration.labels.paragraph')} class="nds-stack nds-p-4 nds-border-default nds-rounded-md" data-spacing="sm">
            <Skeleton class="nds-w-full nds-motion-reduce-none" style="height: 0.75rem" aria-hidden="true" />
            <Skeleton class="nds-motion-reduce-none" style="height: 0.75rem; width: 90%" aria-hidden="true" />
            <Skeleton class="nds-motion-reduce-none" style="height: 0.75rem; width: 75%" aria-hidden="true" />
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
    ]}
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
        { s: $tStore('usage.scenarios.item1.s'), u: $tStore('usage.scenarios.item1.u'), a: stripHtml($tStore('usage.scenarios.item1.a')) },
        { s: $tStore('usage.scenarios.item2.s'), u: $tStore('usage.scenarios.item2.u'), a: stripHtml($tStore('usage.scenarios.item2.a')) },
        { s: $tStore('usage.scenarios.item3.s'), u: $tStore('usage.scenarios.item3.u'), a: stripHtml($tStore('usage.scenarios.item3.a')) },
        { s: $tStore('usage.scenarios.item4.s'), u: $tStore('usage.scenarios.item4.u'), a: stripHtml($tStore('usage.scenarios.item4.a')) },
        { s: $tStore('usage.scenarios.item5.s'), u: $tStore('usage.scenarios.item5.u'), a: stripHtml($tStore('usage.scenarios.item5.a')) },
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
    <div aria-busy="true" aria-label="Carregando card" class="nds-w-full nds-max-w-xs nds-p-4 nds-border-default nds-rounded-md nds-stack" data-spacing="sm">
      <Skeleton class="nds-w-full nds-motion-reduce-none" style="height: 5rem" aria-hidden="true" />
      <Skeleton class="nds-motion-reduce-none" style="height: 1rem; width: 180px" aria-hidden="true" />
      <Skeleton class="nds-motion-reduce-none" style="height: 1rem; width: 140px" aria-hidden="true" />
    </div>
  {/snippet}
  {#snippet dontPair1()}
    <div aria-busy="true" aria-label="Carregando" class="nds-w-full nds-max-w-xs nds-p-4 nds-border-default nds-rounded-md">
      <Skeleton class="nds-motion-reduce-none" style="height: 1.5rem; width: 60px" aria-hidden="true" />
    </div>
  {/snippet}
  {#snippet doPair2()}
    <div aria-busy="true" aria-label="Carregando avatar" class="nds-cluster" data-spacing="sm" data-align="center">
      <Skeleton class="nds-rounded-full nds-motion-reduce-none" style="height: 2.5rem; width: 2.5rem" aria-hidden="true" />
      <Skeleton class="nds-motion-reduce-none" style="height: 0.75rem; width: 120px" aria-hidden="true" />
    </div>
  {/snippet}
  {#snippet dontPair2()}
    <div class="nds-cluster" data-spacing="sm" data-align="center">
      <Skeleton class="nds-rounded-full" style="height: 2.5rem; width: 2.5rem" />
      <Skeleton style="height: 0.75rem; width: 120px" />
    </div>
  {/snippet}

  <!-- ── Importação ─────────────────────────────────────────────── -->
  <DocsImport
    title={$tStore('import.title')}
    code={codeImportBasic}
    secondaryCode={codeImportUsage}
  />

  <!-- ── Variantes ──────────────────────────────────────────────── -->
  <DocsVariants
    title={$tStore('variants.title')}
    items={[
      { name: $tStore('variants.items.rectangle'), description: stripHtml($tStore('variants.styles.rectangle')), code: codeRectangle, preview: variantRectangle },
      { name: $tStore('variants.items.circle'),    description: stripHtml($tStore('variants.styles.circle')),    code: codeCircle,    preview: variantCircle    },
      { name: $tStore('variants.items.line'),      description: stripHtml($tStore('variants.styles.line')),      code: codeLine,      preview: variantLine      },
    ]}
  />

  {#snippet variantRectangle()}
    <div aria-busy="true" aria-label="Carregando bloco">
      <Skeleton class="nds-motion-reduce-none" style="height: 5rem; width: 16rem" aria-hidden="true" />
    </div>
  {/snippet}
  {#snippet variantCircle()}
    <div aria-busy="true" aria-label="Carregando avatar">
      <Skeleton class="nds-rounded-full nds-motion-reduce-none" style="height: 3rem; width: 3rem" aria-hidden="true" />
    </div>
  {/snippet}
  {#snippet variantLine()}
    <div aria-busy="true" aria-label="Carregando texto">
      <Skeleton class="nds-motion-reduce-none" style="height: 1rem; width: 200px" aria-hidden="true" />
    </div>
  {/snippet}

  <!-- ── Estados ────────────────────────────────────────────────── -->
  <DocsStates
    title={$tStore('states.title')}
    cols={{
      state: $tStore('props.table.prop'),
      trigger: $tNavStore('common.userAction'),
      behavior: $tNavStore('common.expectedResult'),
    }}
    items={[
      {
        label: $tStore('states.items.default'),
        trigger: 'animate-pulse',
        behavior: stripHtml($tStore('states.descriptions.default')),
      },
      {
        label: $tStore('states.items.motionReduced'),
        trigger: 'motion-reduce:animate-none',
        behavior: stripHtml($tStore('states.descriptions.motionReduced')),
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
          { name: 'class',       type: $tStore('props.table.className.type'),  defaultValue: $tStore('props.table.className.default'),  required: $tStore('props.table.className.required'),  description: $tStore('props.table.className.description')  },
          { name: 'aria-hidden', type: $tStore('props.table.ariaHidden.type'), defaultValue: $tStore('props.table.ariaHidden.default'), required: $tStore('props.table.ariaHidden.required'), description: $tStore('props.table.ariaHidden.description') },
          { name: '...rest',     type: $tStore('props.table.rest.type'),       defaultValue: $tStore('props.table.rest.default'),       required: $tStore('props.table.rest.required'),       description: $tStore('props.table.rest.description')       },
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
      { token: 'bg-muted',      value: $tStore('tokens.table.background.class'),   description: $tStore('tokens.table.background.part')   },
      { token: 'rounded-md',    value: $tStore('tokens.table.rounded.class'),      description: $tStore('tokens.table.rounded.part')      },
      { token: 'animate-pulse', value: $tStore('tokens.table.animation.class'),    description: $tStore('tokens.table.animation.part')    },
      { token: 'motion-reduce', value: $tStore('tokens.table.motionReduce.class'), description: $tStore('tokens.table.motionReduce.part') },
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
    ]}
    keyboardTitle={$tStore('accessibility.keyboard.title')}
    keyboardItems={[
      { key: '—', description: $tStore('accessibility.keyboard.noKeyboard') },
    ]}
  />

  <!-- ── Relacionados ───────────────────────────────────────────── -->
  <DocsRelated
    title={$tStore('related.title')}
    items={[
      { name: $tStore('related.items.progress.name'),    description: $tStore('related.items.progress.description'),    path: '?path=/docs/ui-progress--docs'    },
      { name: $tStore('related.items.spinner.name'),     description: $tStore('related.items.spinner.description'),     path: '?path=/docs/ui-spinner--docs'     },
      { name: $tStore('related.items.aspectRatio.name'), description: $tStore('related.items.aspectRatio.description'), path: '?path=/docs/ui-aspectratio--docs' },
      { name: $tStore('related.items.card.name'),        description: $tStore('related.items.card.description'),        path: '?path=/docs/ui-card--docs'        },
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
      { title: '', content: $tStore('notes.item5') },
    ]}
  />

  <!-- ── Analytics ─────────────────────────────────────────────── -->
  <DocsAnalytics
    title={$tStore('analytics.title')}
    cols={{
      event: 'Evento',
      trigger: 'Trigger',
      payload: 'Payload',
    }}
    items={[
      { event: '—', trigger: stripHtml($tStore('analytics.description')), payload: '—' },
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
        { action: stripHtml($tStore('testes.functional.item1.action')), result: stripHtml($tStore('testes.functional.item1.result')), priority: localPriority($tStore('testes.functional.item1.priority'), $tNavStore) },
        { action: stripHtml($tStore('testes.functional.item2.action')), result: stripHtml($tStore('testes.functional.item2.result')), priority: localPriority($tStore('testes.functional.item2.priority'), $tNavStore) },
        { action: stripHtml($tStore('testes.functional.item3.action')), result: stripHtml($tStore('testes.functional.item3.result')), priority: localPriority($tStore('testes.functional.item3.priority'), $tNavStore) },
        { action: stripHtml($tStore('testes.functional.item4.action')), result: stripHtml($tStore('testes.functional.item4.result')), priority: localPriority($tStore('testes.functional.item4.priority'), $tNavStore) },
        { action: stripHtml($tStore('testes.functional.item5.action')), result: stripHtml($tStore('testes.functional.item5.result')), priority: localPriority($tStore('testes.functional.item5.priority'), $tNavStore) },
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
        { criterion: stripHtml($tStore('testes.accessibility.item1')), level: 'AA',    how: '—' },
        { criterion: stripHtml($tStore('testes.accessibility.item2')), level: '4.1.2', how: '—' },
        { criterion: stripHtml($tStore('testes.accessibility.item3')), level: '4.1.2', how: '—' },
        { criterion: stripHtml($tStore('testes.accessibility.item4')), level: '2.3.3', how: '—' },
        { criterion: stripHtml($tStore('testes.accessibility.item5')), level: '1.4.11', how: '—' },
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
