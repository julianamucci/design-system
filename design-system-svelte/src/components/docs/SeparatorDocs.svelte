<script lang="ts">
  import { Separator } from '@/components/ui/separator';
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
  import separatorTranslations from '@shared/content/separator/translations.json';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(separatorTranslations);

  // ─── SEO + Analytics ─────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale: l,
      componentSlug: 'separator',
    });
    track('docs_page_view', {
      component_name: 'separator',
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

  const sectionIds = NAV_GROUPS.flatMap(g => g.sections.map(s => s.id));
  const section = createActiveSection(sectionIds, (id) => {
    track('docs_section_viewed', { section_id: id, component_name: 'separator', locale: $locale });
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

  const codeImportBasic = `import { Separator } from "@/components/ui/separator";`;

  const codeImportUsage = `import { Separator } from "@/components/ui/separator";

<Separator orientation="horizontal" />

<div class="nds-cluster" data-spacing="md" data-align="center" style="height: 1.25rem">
  <span>Item A</span>
  <Separator orientation="vertical" />
  <span>Item B</span>
</div>`;

  const codeHorizontal = `<Separator orientation="horizontal" />`;
  const codeVertical = `<div class="nds-cluster" data-spacing="md" data-align="center" style="height: 3rem">
  <span>A</span>
  <Separator orientation="vertical" />
  <span>B</span>
  <Separator orientation="vertical" />
  <span>C</span>
</div>`;

  const codeDecorative = `<Separator decorative={true} />`;
  const codeSemantic = `<Separator decorative={false} />`;

  const interfaceCode = `interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical';
  decorative?: boolean;
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
      installNote="npx shadcn-svelte@latest add separator"
    />
  {/snippet}

  <!-- ── Demonstração ───────────────────────────────────────────── -->
  <DocsDemonstration title={$tStore('demonstration.title')}>
    {#snippet children()}
      <div class="nds-grid nds-w-full" data-cols="2" data-spacing="lg">
        <!-- Horizontal -->
        <div class="nds-stack" data-spacing="sm">
          <p class="nds-text-caption nds-font-medium nds-text-muted-foreground">{$tStore('demonstration.labels.horizontal')}</p>
          <div class="nds-stack nds-rounded-md nds-border-default nds-p-4 nds-text-body" data-spacing="sm">
            <p class="nds-font-medium">Header</p>
            <Separator orientation="horizontal" />
            <p class="nds-text-muted-foreground">Content</p>
          </div>
        </div>

        <!-- Vertical -->
        <div class="nds-stack" data-spacing="sm">
          <p class="nds-text-caption nds-font-medium nds-text-muted-foreground">{$tStore('demonstration.labels.vertical')}</p>
          <div class="nds-cluster nds-rounded-md nds-border-default nds-px-4 nds-text-body" data-spacing="md" data-align="center" style="height: 4rem">
            <span>Docs</span>
            <Separator orientation="vertical" />
            <span>Source</span>
            <Separator orientation="vertical" />
            <span>API</span>
          </div>
        </div>

        <!-- In Menu -->
        <div class="nds-stack" data-spacing="sm">
          <p class="nds-text-caption nds-font-medium nds-text-muted-foreground">{$tStore('demonstration.labels.inMenu')}</p>
          <div class="nds-rounded-md nds-border-default nds-p-2 nds-w-full nds-max-w-xs">
            <ul class="nds-list-none nds-text-body">
              <li class="nds-px-2 nds-py-1">Perfil</li>
              <li class="nds-px-2 nds-py-1">Configurações</li>
              <li><Separator class="nds-mt-1 nds-mb-1" /></li>
              <li class="nds-px-2 nds-py-1 nds-text-destructive">Sair</li>
            </ul>
          </div>
        </div>

        <!-- In Card -->
        <div class="nds-stack" data-spacing="sm">
          <p class="nds-text-caption nds-font-medium nds-text-muted-foreground">{$tStore('demonstration.labels.inCard')}</p>
          <div class="nds-rounded-md nds-border-default nds-bg-card nds-text-card-foreground">
            <div class="nds-p-4 nds-text-body nds-font-semibold">Notificações</div>
            <Separator />
            <div class="nds-p-4 nds-text-body nds-text-muted-foreground">Você tem 3 mensagens não lidas.</div>
            <Separator />
            <div class="nds-p-4 nds-text-body nds-text-muted-foreground">Ver tudo</div>
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
    <div class="nds-stack nds-w-full nds-max-w-xs nds-rounded-md nds-border-default nds-p-4 nds-text-body" data-spacing="sm">
      <p class="nds-font-medium">Mensagens</p>
      <Separator />
      <p class="nds-text-muted-foreground">3 não lidas</p>
    </div>
  {/snippet}
  {#snippet dontPair1()}
    <div class="nds-w-full nds-max-w-xs nds-rounded-md nds-border-default nds-p-4 nds-text-body">
      <p class="nds-font-medium">Mensagens</p>
      <Separator class="nds-mt-2 nds-mb-2" />
      <Separator class="nds-mt-2 nds-mb-2" />
      <p class="nds-text-muted-foreground">3 não lidas</p>
    </div>
  {/snippet}
  {#snippet doPair2()}
    <div class="nds-cluster nds-text-body nds-rounded-md nds-border-default nds-px-4" data-spacing="md" data-align="center" style="height: 2rem">
      <span>Docs</span>
      <Separator orientation="vertical" />
      <span>API</span>
    </div>
  {/snippet}
  {#snippet dontPair2()}
    <div class="nds-block nds-rounded-md nds-border-default nds-px-4 nds-py-2 nds-text-body">
      <span>Docs</span>
      <Separator orientation="vertical" />
      <span>API</span>
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
      { name: $tStore('variants.items.horizontal'), description: stripHtml($tStore('variants.styles.horizontal')), code: codeHorizontal, preview: variantHorizontal },
      { name: $tStore('variants.items.vertical'),   description: stripHtml($tStore('variants.styles.vertical')),   code: codeVertical,   preview: variantVertical   },
    ]}
  />

  {#snippet variantHorizontal()}
    <div class="nds-stack nds-text-body" data-spacing="sm" style="width: 18rem">
      <p class="nds-text-muted-foreground">Linha A</p>
      <Separator />
      <p class="nds-text-muted-foreground">Linha B</p>
    </div>
  {/snippet}
  {#snippet variantVertical()}
    <div class="nds-cluster nds-text-body" data-spacing="md" data-align="center" style="height: 3rem">
      <span>A</span>
      <Separator orientation="vertical" />
      <span>B</span>
      <Separator orientation="vertical" />
      <span>C</span>
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
        label: $tStore('states.items.decorative'),
        trigger: 'decorative={true}',
        behavior: stripHtml($tStore('states.descriptions.decorative')),
      },
      {
        label: $tStore('states.items.semantic'),
        trigger: 'decorative={false}',
        behavior: stripHtml($tStore('states.descriptions.semantic')),
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
          { name: 'orientation', type: $tStore('props.table.orientation.type'),  defaultValue: $tStore('props.table.orientation.default'),  required: $tStore('props.table.orientation.required'),  description: $tStore('props.table.orientation.description')  },
          { name: 'decorative',  type: $tStore('props.table.decorative.type'),   defaultValue: $tStore('props.table.decorative.default'),   required: $tStore('props.table.decorative.required'),   description: $tStore('props.table.decorative.description')   },
          { name: 'class',       type: $tStore('props.table.className.type'),    defaultValue: $tStore('props.table.className.default'),    required: $tStore('props.table.className.required'),    description: $tStore('props.table.className.description')    },
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
      { token: 'bg-border', value: $tStore('tokens.table.background.class'),       description: $tStore('tokens.table.background.part')       },
      { token: 'h-px',      value: $tStore('tokens.table.heightHorizontal.class'), description: $tStore('tokens.table.heightHorizontal.part') },
      { token: 'w-full',    value: $tStore('tokens.table.widthHorizontal.class'),  description: $tStore('tokens.table.widthHorizontal.part')  },
      { token: 'w-px',      value: $tStore('tokens.table.widthVertical.class'),    description: $tStore('tokens.table.widthVertical.part')    },
      { token: 'h-full',    value: $tStore('tokens.table.heightVertical.class'),   description: $tStore('tokens.table.heightVertical.part')   },
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
      { name: $tStore('related.items.card.name'),           description: $tStore('related.items.card.description'),           path: '?path=/docs/ui-card--docs'           },
      { name: $tStore('related.items.sheet.name'),          description: $tStore('related.items.sheet.description'),          path: '?path=/docs/ui-sheet--docs'          },
      { name: $tStore('related.items.sidebar.name'),        description: $tStore('related.items.sidebar.description'),        path: '?path=/docs/ui-sidebar--docs'        },
      { name: $tStore('related.items.navigationMenu.name'), description: $tStore('related.items.navigationMenu.description'), path: '?path=/docs/ui-navigationmenu--docs' },
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
        { criterion: stripHtml($tStore('testes.accessibility.item1')), level: 'AA', how: '—' },
        { criterion: stripHtml($tStore('testes.accessibility.item2')), level: '1.4.11', how: '—' },
        { criterion: stripHtml($tStore('testes.accessibility.item3')), level: 'AA', how: '—' },
        { criterion: stripHtml($tStore('testes.accessibility.item4')), level: '1.3.1', how: '—' },
        { criterion: stripHtml($tStore('testes.accessibility.item5')), level: '2.1.1', how: '—' },
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
