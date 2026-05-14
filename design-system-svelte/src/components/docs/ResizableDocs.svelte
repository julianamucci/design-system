<script lang="ts">
  import { PaneGroup, Pane, Handle } from '@/components/ui/resizable';
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
  import resizableTranslations from '@shared/content/resizable/translations.json';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(resizableTranslations);

  // ─── SEO + Analytics ─────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale: l,
      componentSlug: 'resizable',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      aiIntent: t('seo.aiIntent'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: t('category'), item: '/components/layout' },
        { name: t('title') },
      ],
    });
    track('docs_page_view', {
      component_name: 'resizable',
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
    track('docs_section_viewed', { section_id: id, component_name: 'resizable', locale: $locale });
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

  const codeImportBasic = `import { PaneGroup, Pane, Handle } from "@/components/ui/resizable";`;

  const codeImportAliased = `// Aliases que espelham a API React/Vue
import {
  ResizablePaneGroup,
  ResizablePane,
  ResizableHandle,
} from "@/components/ui/resizable";`;

  const codeHorizontal = `<PaneGroup direction="horizontal" class="h-60">
  <Pane defaultSize={30} minSize={20} maxSize={50}>
    <!-- Sidebar -->
  </Pane>
  <Handle withHandle aria-label="Redimensionar painéis — use setas" />
  <Pane defaultSize={70} minSize={50} maxSize={80}>
    <!-- Conteúdo -->
  </Pane>
</PaneGroup>`;

  const codeVertical = `<PaneGroup direction="vertical" class="h-80">
  <Pane defaultSize={50} minSize={20}>
    <!-- Topo -->
  </Pane>
  <Handle withHandle aria-label="Redimensionar painéis verticalmente — use setas" />
  <Pane defaultSize={50} minSize={20}>
    <!-- Rodapé -->
  </Pane>
</PaneGroup>`;

  const codeNested = `<PaneGroup direction="horizontal" class="h-80">
  <Pane defaultSize={30} minSize={20}>
    <!-- Sidebar -->
  </Pane>
  <Handle withHandle aria-label="Redimensionar sidebar — use setas" />
  <Pane defaultSize={70}>
    <PaneGroup direction="vertical" class="h-full">
      <Pane defaultSize={60}><!-- Editor --></Pane>
      <Handle withHandle aria-label="Redimensionar editor — use setas" />
      <Pane defaultSize={40}><!-- Console --></Pane>
    </PaneGroup>
  </Pane>
</PaneGroup>`;

  const interfaceCode = `// API real do paneforge (Svelte)
import type { PaneGroupProps, PaneProps, PaneResizerProps } from "paneforge";

// PaneGroup
interface PaneGroupProps {
  direction: "horizontal" | "vertical"; // OBRIGATÓRIO
  autoSaveId?: string;                  // persistência em storage
  storage?: PaneGroupStorage;
  onLayoutChange?: (sizes: number[]) => void;
  keyboardResizeBy?: number;            // incremento por seta (default 10)
  class?: string;
}

// Pane (alias: ResizablePane)
interface PaneProps {
  defaultSize?: number;  // 0-100
  minSize?: number;      // 0-100
  maxSize?: number;      // 0-100
  collapsible?: boolean;
  collapsedSize?: number;
  id?: string;
  order?: number;
  onCollapse?: () => void;
  onExpand?: () => void;
  onResize?: (size: number) => void;
}

// Handle (alias: ResizableHandle) — wrapper sobre PaneResizer
interface HandleProps {
  withHandle?: boolean;  // exibe pegador visual
  disabled?: boolean;
  "aria-label"?: string; // OBRIGATÓRIO para WCAG
}`;

  const codeCustomizationTokens = `/* Handle mais espesso para mobile */
[data-slot="resizable-handle"] {
  --handle-width: 3px;
}
[data-slot="resizable-handle"][aria-orientation="vertical"] {
  width: var(--handle-width);
}
[data-slot="resizable-handle"][aria-orientation="horizontal"] {
  height: var(--handle-width);
}`;
</script>

<DocsPageLayout navGroups={NAV_GROUPS} activeSection={section.value}>
  {#snippet header()}
    <DocsHeader
      title={$tStore('title')}
      description={$tStore('description')}
      category={$tStore('category')}
      type={$tStore('type')}
      installNote="npm install paneforge"
    />
  {/snippet}

  <!-- ── Demonstração ───────────────────────────────────────────── -->
  <DocsDemonstration title={$tStore('demonstration.title')}>
    {#snippet children()}
      <div class="w-full space-y-6">
        <div>
          <p class="text-xs text-muted-foreground mb-2">{$tStore('demonstration.labels.horizontal')}</p>
          <div class="w-full rounded-md border bg-background overflow-hidden" style="height: 200px;">
            <PaneGroup direction="horizontal" class="h-full">
              <Pane defaultSize={30} minSize={20} maxSize={50} class="flex items-center justify-center bg-muted/40">
                <span class="text-sm text-muted-foreground">{$tStore('demonstration.labels.sidebar')}</span>
              </Pane>
              <Handle withHandle aria-label="Redimensionar painéis — use setas para ajustar" />
              <Pane defaultSize={70} minSize={50} maxSize={80} class="flex items-center justify-center">
                <span class="text-sm text-foreground">{$tStore('demonstration.labels.content')}</span>
              </Pane>
            </PaneGroup>
          </div>
        </div>

        <div>
          <p class="text-xs text-muted-foreground mb-2">{$tStore('demonstration.labels.vertical')}</p>
          <div class="w-full rounded-md border bg-background overflow-hidden" style="height: 240px;">
            <PaneGroup direction="vertical" class="h-full">
              <Pane defaultSize={50} minSize={20} class="flex items-center justify-center bg-muted/40">
                <span class="text-sm text-muted-foreground">{$tStore('demonstration.labels.top')}</span>
              </Pane>
              <Handle withHandle aria-label="Redimensionar painéis verticalmente — use setas" />
              <Pane defaultSize={50} minSize={20} class="flex items-center justify-center">
                <span class="text-sm text-foreground">{$tStore('demonstration.labels.bottom')}</span>
              </Pane>
            </PaneGroup>
          </div>
        </div>

        <div>
          <p class="text-xs text-muted-foreground mb-2">{$tStore('demonstration.labels.nested')}</p>
          <div class="w-full rounded-md border bg-background overflow-hidden" style="height: 280px;">
            <PaneGroup direction="horizontal" class="h-full">
              <Pane defaultSize={30} minSize={20} maxSize={50} class="flex items-center justify-center bg-muted/40">
                <span class="text-sm text-muted-foreground">{$tStore('demonstration.labels.sidebar')}</span>
              </Pane>
              <Handle withHandle aria-label="Redimensionar sidebar — use setas" />
              <Pane defaultSize={70} minSize={40}>
                <PaneGroup direction="vertical" class="h-full">
                  <Pane defaultSize={60} minSize={20} class="flex items-center justify-center">
                    <span class="text-sm text-foreground">{$tStore('demonstration.labels.top')}</span>
                  </Pane>
                  <Handle withHandle aria-label="Redimensionar editor — use setas" />
                  <Pane defaultSize={40} minSize={20} class="flex items-center justify-center bg-muted/40">
                    <span class="text-sm text-muted-foreground">{$tStore('demonstration.labels.bottom')}</span>
                  </Pane>
                </PaneGroup>
              </Pane>
            </PaneGroup>
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
        { element: $tStore('usage.uxWriting.table.ariaLabel.name'),  rules: $tStore('usage.uxWriting.table.ariaLabel.format'),  do: $tStore('usage.uxWriting.table.ariaLabel.good'),  dont: $tStore('usage.uxWriting.table.ariaLabel.bad') },
        { element: $tStore('usage.uxWriting.table.panelLabel.name'), rules: $tStore('usage.uxWriting.table.panelLabel.format'), do: $tStore('usage.uxWriting.table.panelLabel.good'), dont: $tStore('usage.uxWriting.table.panelLabel.bad') },
        { element: $tStore('usage.uxWriting.table.size.name'),       rules: $tStore('usage.uxWriting.table.size.format'),       do: stripHtml($tStore('usage.uxWriting.table.size.good')), dont: $tStore('usage.uxWriting.table.size.bad') },
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
        stripHtml($tStore('usage.dont.item2')),
        $tStore('usage.dont.item3'),
        stripHtml($tStore('usage.dont.item4')),
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
    <div class="w-full rounded-md border bg-background overflow-hidden" style="height: 140px;">
      <PaneGroup direction="horizontal" class="h-full">
        <Pane defaultSize={30} minSize={20} maxSize={50} class="flex items-center justify-center bg-muted/40">
          <span class="text-xs text-muted-foreground">{$tStore('demonstration.labels.sidebar')}</span>
        </Pane>
        <Handle withHandle aria-label="Redimensionar painéis — use setas" />
        <Pane defaultSize={70} minSize={50} maxSize={80} class="flex items-center justify-center">
          <span class="text-xs text-foreground">{$tStore('demonstration.labels.content')}</span>
        </Pane>
      </PaneGroup>
    </div>
  {/snippet}
  {#snippet dontPair1()}
    <div class="w-full rounded-md border bg-background overflow-hidden" style="height: 140px;">
      <PaneGroup direction="horizontal" class="h-full">
        <Pane class="flex items-center justify-center bg-muted/40">
          <span class="text-xs text-muted-foreground">{$tStore('demonstration.labels.sidebar')}</span>
        </Pane>
        <Handle withHandle aria-label="Redimensionar" />
        <Pane class="flex items-center justify-center">
          <span class="text-xs text-foreground">{$tStore('demonstration.labels.content')}</span>
        </Pane>
      </PaneGroup>
    </div>
  {/snippet}
  {#snippet doPair2()}
    <div class="w-full rounded-md border bg-background overflow-hidden" style="height: 140px;">
      <PaneGroup direction="horizontal" class="h-full">
        <Pane defaultSize={50} minSize={20} maxSize={80} class="flex items-center justify-center bg-muted/40">
          <span class="text-xs text-muted-foreground">{$tStore('demonstration.labels.left')}</span>
        </Pane>
        <Handle withHandle aria-label="Redimensionar painéis — use setas para ajustar" />
        <Pane defaultSize={50} minSize={20} maxSize={80} class="flex items-center justify-center">
          <span class="text-xs text-foreground">{$tStore('demonstration.labels.right')}</span>
        </Pane>
      </PaneGroup>
    </div>
  {/snippet}
  {#snippet dontPair2()}
    <div class="w-full rounded-md border bg-background overflow-hidden" style="height: 140px;">
      <PaneGroup direction="horizontal" class="h-full">
        <Pane defaultSize={50} minSize={20} maxSize={80} class="flex items-center justify-center bg-muted/40">
          <span class="text-xs text-muted-foreground">{$tStore('demonstration.labels.left')}</span>
        </Pane>
        <Handle withHandle aria-label="Handle" />
        <Pane defaultSize={50} minSize={20} maxSize={80} class="flex items-center justify-center">
          <span class="text-xs text-foreground">{$tStore('demonstration.labels.right')}</span>
        </Pane>
      </PaneGroup>
    </div>
  {/snippet}

  <!-- ── Importação ─────────────────────────────────────────────── -->
  <DocsImport
    title={$tStore('import.title')}
    code={codeImportBasic}
    secondaryCode={codeImportAliased}
  />

  <!-- ── Variantes ──────────────────────────────────────────────── -->
  <DocsVariants
    title={$tStore('variants.title')}
    items={[
      { name: $tStore('variants.items.horizontal'), description: stripHtml($tStore('variants.styles.horizontal')), code: codeHorizontal, preview: variantHorizontal },
      { name: $tStore('variants.items.vertical'),   description: stripHtml($tStore('variants.styles.vertical')),   code: codeVertical,   preview: variantVertical   },
      { name: $tStore('variants.items.nested'),     description: stripHtml($tStore('variants.styles.nested')),     code: codeNested,     preview: variantNested     },
    ]}
  />

  {#snippet variantHorizontal()}
    <div class="w-full rounded-md border bg-background overflow-hidden" style="height: 180px;">
      <PaneGroup direction="horizontal" class="h-full">
        <Pane defaultSize={30} minSize={20} maxSize={50} class="flex items-center justify-center bg-muted/40">
          <span class="text-xs text-muted-foreground">{$tStore('demonstration.labels.left')}</span>
        </Pane>
        <Handle withHandle aria-label="Redimensionar painéis — use setas" />
        <Pane defaultSize={70} minSize={50} maxSize={80} class="flex items-center justify-center">
          <span class="text-xs text-foreground">{$tStore('demonstration.labels.right')}</span>
        </Pane>
      </PaneGroup>
    </div>
  {/snippet}
  {#snippet variantVertical()}
    <div class="w-full rounded-md border bg-background overflow-hidden" style="height: 200px;">
      <PaneGroup direction="vertical" class="h-full">
        <Pane defaultSize={50} minSize={20} class="flex items-center justify-center bg-muted/40">
          <span class="text-xs text-muted-foreground">{$tStore('demonstration.labels.top')}</span>
        </Pane>
        <Handle withHandle aria-label="Redimensionar painéis verticalmente — use setas" />
        <Pane defaultSize={50} minSize={20} class="flex items-center justify-center">
          <span class="text-xs text-foreground">{$tStore('demonstration.labels.bottom')}</span>
        </Pane>
      </PaneGroup>
    </div>
  {/snippet}
  {#snippet variantNested()}
    <div class="w-full rounded-md border bg-background overflow-hidden" style="height: 240px;">
      <PaneGroup direction="horizontal" class="h-full">
        <Pane defaultSize={30} minSize={20} class="flex items-center justify-center bg-muted/40">
          <span class="text-xs text-muted-foreground">{$tStore('demonstration.labels.sidebar')}</span>
        </Pane>
        <Handle withHandle aria-label="Redimensionar sidebar — use setas" />
        <Pane defaultSize={70} minSize={40}>
          <PaneGroup direction="vertical" class="h-full">
            <Pane defaultSize={60} class="flex items-center justify-center">
              <span class="text-xs text-foreground">{$tStore('demonstration.labels.top')}</span>
            </Pane>
            <Handle withHandle aria-label="Redimensionar editor — use setas" />
            <Pane defaultSize={40} class="flex items-center justify-center bg-muted/40">
              <span class="text-xs text-muted-foreground">{$tStore('demonstration.labels.bottom')}</span>
            </Pane>
          </PaneGroup>
        </Pane>
      </PaneGroup>
    </div>
  {/snippet}

  <!-- ── Estados ────────────────────────────────────────────────── -->
  <DocsStates
    title={$tStore('states.title')}
    cols={{
      state: $tNavStore('common.state') ?? 'Estado',
      trigger: $tNavStore('common.trigger') ?? 'Gatilho',
      behavior: $tNavStore('common.behavior') ?? 'Comportamento',
    }}
    items={[
      { label: $tStore('states.items.idle'),     trigger: '—',                                        behavior: stripHtml($tStore('states.descriptions.idle'))     },
      { label: $tStore('states.items.hover'),    trigger: 'pointerenter',                             behavior: stripHtml($tStore('states.descriptions.hover'))    },
      { label: $tStore('states.items.dragging'), trigger: 'pointerdown + drag',                       behavior: stripHtml($tStore('states.descriptions.dragging')) },
      { label: $tStore('states.items.focus'),    trigger: 'Tab',                                      behavior: stripHtml($tStore('states.descriptions.focus'))    },
      { label: $tStore('states.items.disabled'), trigger: 'disabled',                                 behavior: stripHtml($tStore('states.descriptions.disabled')) },
    ]}
  />

  <!-- ── Propriedades ───────────────────────────────────────────── -->
  <DocsProps
    title={$tStore('props.title')}
    tables={[
      {
        title: 'PaneGroup',
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'direction',      type: $tStore('props.table.direction.type'),  defaultValue: $tStore('props.table.direction.default'),  required: $tStore('props.table.direction.required'),  description: stripHtml($tStore('props.table.direction.description')) },
          { name: 'autoSaveId',     type: 'string',                                defaultValue: '—',                                       required: 'Não',                                       description: 'Persiste tamanhos no storage automaticamente quando definido.' },
          { name: 'onLayoutChange', type: $tStore('props.table.onLayout.type'),    defaultValue: '—',                                       required: 'Não',                                       description: stripHtml($tStore('props.table.onLayout.description')) },
          { name: 'class',          type: 'string',                                defaultValue: '—',                                       required: 'Não',                                       description: 'Classes Tailwind aplicadas ao container.' },
        ],
      },
      {
        title: 'Pane',
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'defaultSize', type: $tStore('props.table.defaultSize.type'), defaultValue: $tStore('props.table.defaultSize.default'), required: $tStore('props.table.defaultSize.required'), description: $tStore('props.table.defaultSize.description') },
          { name: 'minSize',     type: $tStore('props.table.minSize.type'),     defaultValue: $tStore('props.table.minSize.default'),     required: $tStore('props.table.minSize.required'),     description: $tStore('props.table.minSize.description') },
          { name: 'maxSize',     type: $tStore('props.table.maxSize.type'),     defaultValue: $tStore('props.table.maxSize.default'),     required: $tStore('props.table.maxSize.required'),     description: $tStore('props.table.maxSize.description') },
          { name: 'id',          type: $tStore('props.table.id.type'),          defaultValue: $tStore('props.table.id.default'),          required: $tStore('props.table.id.required'),          description: $tStore('props.table.id.description') },
          { name: 'collapsible', type: 'boolean',                                defaultValue: 'false',                                    required: 'Não',                                       description: 'Permite colapsar o painel para collapsedSize.' },
        ],
      },
      {
        title: 'Handle',
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'withHandle', type: $tStore('props.table.withHandle.type'), defaultValue: $tStore('props.table.withHandle.default'), required: $tStore('props.table.withHandle.required'), description: stripHtml($tStore('props.table.withHandle.description')) },
          { name: 'disabled',   type: 'boolean',                               defaultValue: 'false',                                   required: 'Não',                                       description: 'Desabilita o handle (sem cursor de resize, sem teclado).' },
          { name: 'aria-label', type: 'string',                                defaultValue: '—',                                       required: 'Sim',                                       description: 'Rótulo acessível descritivo — incluir o atalho de teclado.' },
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
      { token: '--border',                  value: $tStore('tokens.table.border.class'),     description: $tStore('tokens.table.border.part')     },
      { token: '--ring',                    value: $tStore('tokens.table.ring.class'),       description: $tStore('tokens.table.ring.part')       },
      { token: '--background',              value: $tStore('tokens.table.background.class'), description: $tStore('tokens.table.background.part') },
      { token: '--foreground',              value: $tStore('tokens.table.foreground.class'), description: $tStore('tokens.table.foreground.part') },
      { token: '--muted',                   value: $tStore('tokens.table.muted.class'),      description: $tStore('tokens.table.muted.part')      },
      { token: '--ring-offset-background',  value: $tStore('tokens.table.ringOffset.class'), description: $tStore('tokens.table.ringOffset.part') },
    ]}
    customizationTitle={$tStore('tokens.customizationTitle')}
    customizationCode={codeCustomizationTokens}
  />

  <!-- ── Acessibilidade ─────────────────────────────────────────── -->
  <DocsAccessibility
    title={$tStore('accessibility.title')}
    summary={$tStore('accessibility.summary')}
    items={[
      stripHtml($tStore('accessibility.items.item1')),
      stripHtml($tStore('accessibility.items.item2')),
      stripHtml($tStore('accessibility.items.item3')),
      $tStore('accessibility.items.item4'),
      stripHtml($tStore('accessibility.items.item5')),
      stripHtml($tStore('accessibility.items.item6')),
    ]}
    keyboardTitle={$tStore('accessibility.keyboard.title')}
    keyboardItems={[
      { key: 'Tab',         description: $tStore('accessibility.keyboard.tab')        },
      { key: 'ArrowLeft',   description: $tStore('accessibility.keyboard.arrowLeft')  },
      { key: 'ArrowRight',  description: $tStore('accessibility.keyboard.arrowRight') },
      { key: 'ArrowUp',     description: $tStore('accessibility.keyboard.arrowUp')    },
      { key: 'ArrowDown',   description: $tStore('accessibility.keyboard.arrowDown')  },
      { key: 'Home',        description: $tStore('accessibility.keyboard.home')       },
      { key: 'End',         description: $tStore('accessibility.keyboard.end')        },
      { key: 'Enter',       description: $tStore('accessibility.keyboard.enter')      },
    ]}
  />

  <!-- ── Relacionados ───────────────────────────────────────────── -->
  <DocsRelated
    title={$tStore('related.title')}
    items={[
      { name: $tStore('related.items.scrollArea.name'),  description: $tStore('related.items.scrollArea.description'),  path: '?path=/docs/ui-scrollarea--docs'   },
      { name: $tStore('related.items.sheet.name'),       description: $tStore('related.items.sheet.description'),       path: '?path=/docs/ui-sheet--docs'        },
      { name: $tStore('related.items.separator.name'),   description: $tStore('related.items.separator.description'),   path: '?path=/docs/ui-separator--docs'    },
      { name: $tStore('related.items.aspectRatio.name'), description: $tStore('related.items.aspectRatio.description'), path: '?path=/docs/ui-aspectratio--docs'  },
    ]}
  />

  <!-- ── Notas ──────────────────────────────────────────────────── -->
  <DocsNotes
    title={$tStore('notes.title')}
    items={[
      { title: '', content: stripHtml($tStore('notes.item1')) },
      { title: '', content: stripHtml($tStore('notes.item2')) },
      { title: '', content: stripHtml($tStore('notes.item3')) },
      { title: '', content: stripHtml($tStore('notes.item4')) },
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
      { event: 'panel_resize', trigger: $tStore('analytics.table.panel_resize.trigger'), payload: $tStore('analytics.table.panel_resize.payload') },
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
        { criterion: $tStore('testes.accessibility.item1'), level: '—', how: '—' },
        { criterion: $tStore('testes.accessibility.item2'), level: '1.4.11', how: '—' },
        { criterion: $tStore('testes.accessibility.item3'), level: '2.4.7', how: '—' },
        { criterion: $tStore('testes.accessibility.item4'), level: '4.1.2', how: '—' },
        { criterion: $tStore('testes.accessibility.item5'), level: '4.1.2', how: '—' },
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
