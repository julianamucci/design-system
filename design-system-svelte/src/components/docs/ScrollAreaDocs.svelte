<script lang="ts">
  import { ScrollArea } from '@/components/ui/scroll-area';
  import { locale, useTranslation } from '@/lib/i18n';
  import { applySeo } from '@/lib/use-seo';
  import { track } from '@/lib/analytics';
  import { createActiveSection } from '@/lib/use-active-section.svelte';
  import { sanitizeHtml } from '@/lib/sanitize-html';
  import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.svelte';
  import {
    DocsHeader, DocsDemonstration, DocsAnatomy, DocsWhenToUse, DocsDoDont,
    DocsImport, DocsVariants, DocsStates, DocsProps, DocsTokens,
    DocsAccessibility, DocsRelated, DocsNotes, DocsAnalytics, DocsTestes,
  } from '@/components/docs/shared/sections';
  import uiTranslations from '@/i18n/ui.json';
  import scrollAreaTranslations from '@shared/content/scroll-area/translations.json';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(scrollAreaTranslations);

  // ─── SEO + Analytics ─────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale: l,
      componentSlug: 'scroll-area',
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
      component_name: 'scroll-area',
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
    track('docs_section_viewed', { section_id: id, component_name: 'scroll-area', locale: $locale });
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

  // ─── Demo data ───────────────────────────────────────────────────────────────

  const VERTICAL_TAGS = Array.from({ length: 30 }, (_, i) => i + 1);
  const HORIZONTAL_CARDS = Array.from({ length: 10 }, (_, i) => i + 1);
  const MATRIX_ROWS = Array.from({ length: 12 }, (_, i) => i + 1);
  const MATRIX_COLS = Array.from({ length: 12 }, (_, i) => i + 1);

  // ─── Code strings ────────────────────────────────────────────────────────────

  const codeImportBasic = `import { ScrollArea } from "@/components/ui/scroll-area";`;

  const codeVertical = `<div class="h-[300px]">
  <ScrollArea orientation="vertical" class="h-full w-full rounded-md border">
    <div class="p-4 space-y-2">
      {#each tags as tag}
        <div class="text-sm">Tag {tag}</div>
      {/each}
    </div>
  </ScrollArea>
</div>`;

  const codeHorizontal = `<div class="w-[500px]">
  <ScrollArea orientation="horizontal" class="h-full w-full whitespace-nowrap rounded-md border">
    <div class="flex w-max gap-4 p-4">
      {#each items as item}
        <Card {...item} />
      {/each}
    </div>
  </ScrollArea>
</div>`;

  const codeBoth = `<div class="h-[300px] w-[500px]">
  <ScrollArea orientation="both" class="h-full w-full rounded-md border">
    <table class="w-max"><!-- conteúdo amplo --></table>
  </ScrollArea>
</div>`;

  const interfaceCode = `// bits-ui ScrollArea (Svelte)
import type { ScrollArea as ScrollAreaPrimitive } from "bits-ui";

interface ScrollAreaRootProps {
  type?: "auto" | "always" | "scroll" | "hover"; // default "hover"
  scrollHideDelay?: number;                      // default 600
  orientation?: "vertical" | "horizontal" | "both"; // wrapper local
  scrollbarXClasses?: string;
  scrollbarYClasses?: string;
  class?: string;
  children: Snippet;
}

// O wrapper local emite ScrollBar(s) automaticamente conforme orientation.
// Componentes internos (Viewport, Scrollbar, Thumb, Corner) são gerenciados pela lib.`;
</script>

<DocsPageLayout navGroups={NAV_GROUPS} activeSection={section.value}>
  {#snippet header()}
    <DocsHeader
      title={$tStore('title')}
      description={$tStore('description')}
      category={$tStore('category')}
      type={$tStore('type')}
      installNote="npx shadcn-svelte@latest add scroll-area"
    />
  {/snippet}

  <!-- ── Demonstração ───────────────────────────────────────────── -->
  <DocsDemonstration title={$tStore('demonstration.title')}>
    {#snippet children()}
      <div class="grid grid-cols-1 gap-8 w-full">
        <!-- Demo 1: Vertical -->
        <div class="space-y-2">
          <p class="text-xs font-medium text-muted-foreground">
            {$tStore('demonstration.labels.verticalTitle')}
          </p>
          <div class="rounded-md border bg-background overflow-hidden" style="height: 300px; width: 100%; max-width: 360px;">
            <ScrollArea orientation="vertical" class="h-full w-full">
              <div class="p-4 space-y-2">
                {#each VERTICAL_TAGS as n}
                  <div class="text-sm border-b pb-2 last:border-b-0">
                    {$tStore('demonstration.labels.tag')} {n}
                  </div>
                {/each}
              </div>
            </ScrollArea>
          </div>
        </div>

        <!-- Demo 2: Horizontal -->
        <div class="space-y-2">
          <p class="text-xs font-medium text-muted-foreground">
            {$tStore('demonstration.labels.horizontalTitle')}
          </p>
          <div class="rounded-md border bg-background overflow-hidden" style="height: 180px; width: 100%; max-width: 500px;">
            <ScrollArea orientation="horizontal" class="h-full w-full whitespace-nowrap">
              <div class="flex w-max gap-4 p-4">
                {#each HORIZONTAL_CARDS as n}
                  <div class="flex h-[120px] w-[140px] items-center justify-center rounded-md bg-muted text-sm shrink-0">
                    Card {n}
                  </div>
                {/each}
              </div>
            </ScrollArea>
          </div>
        </div>

        <!-- Demo 3: Both -->
        <div class="space-y-2">
          <p class="text-xs font-medium text-muted-foreground">
            {$tStore('demonstration.labels.bothTitle')}
          </p>
          <div class="rounded-md border bg-background overflow-hidden" style="height: 260px; width: 100%; max-width: 500px;">
            <ScrollArea orientation="both" class="h-full w-full">
              <table class="w-max border-collapse text-xs">
                <tbody>
                  {#each MATRIX_ROWS as r}
                    <tr>
                      {#each MATRIX_COLS as c}
                        <td class="border px-3 py-2 whitespace-nowrap">R{r}·C{c}</td>
                      {/each}
                    </tr>
                  {/each}
                </tbody>
              </table>
            </ScrollArea>
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
      $tStore('anatomy.item4'),
      $tStore('anatomy.item5'),
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
        { element: $tStore('usage.uxWriting.table.container.name'),  rules: stripHtml($tStore('usage.uxWriting.table.container.format')),  do: stripHtml($tStore('usage.uxWriting.table.container.good')),  dont: stripHtml($tStore('usage.uxWriting.table.container.bad')) },
        { element: $tStore('usage.uxWriting.table.scrollArea.name'), rules: stripHtml($tStore('usage.uxWriting.table.scrollArea.format')), do: stripHtml($tStore('usage.uxWriting.table.scrollArea.good')), dont: stripHtml($tStore('usage.uxWriting.table.scrollArea.bad')) },
        { element: $tStore('usage.uxWriting.table.orientation.name'),rules: $tStore('usage.uxWriting.table.orientation.format'),          do: $tStore('usage.uxWriting.table.orientation.good'),          dont: $tStore('usage.uxWriting.table.orientation.bad') },
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
    <div class="rounded-md border bg-background overflow-hidden" style="height: 160px; width: 100%;">
      <ScrollArea orientation="vertical" class="h-full w-full">
        <div class="p-3 space-y-2 text-xs">
          {#each Array.from({ length: 12 }, (_, i) => i + 1) as i}
            <div>Item {i}</div>
          {/each}
        </div>
      </ScrollArea>
    </div>
  {/snippet}
  {#snippet dontPair1()}
    <div class="w-full">
      <ScrollArea orientation="vertical" class="h-full w-full rounded-md border">
        <div class="p-3 space-y-2 text-xs">
          {#each Array.from({ length: 5 }, (_, i) => i + 1) as i}
            <div>Item {i}</div>
          {/each}
        </div>
      </ScrollArea>
    </div>
  {/snippet}
  {#snippet doPair2()}
    <div class="rounded-md border bg-background overflow-hidden" style="height: 160px; width: 100%;">
      <ScrollArea orientation="vertical" class="h-full w-full">
        <div class="p-3 space-y-2 text-xs">
          {#each Array.from({ length: 14 }, (_, i) => i + 1) as i}
            <div>Linha {i}</div>
          {/each}
        </div>
      </ScrollArea>
    </div>
  {/snippet}
  {#snippet dontPair2()}
    <div class="rounded-md border bg-background overflow-hidden" style="height: 160px; width: 100%;">
      <ScrollArea orientation="vertical" class="h-full w-full">
        <div style="height: 140px;">
          <ScrollArea orientation="vertical" class="h-full w-full">
            <div class="p-3 space-y-2 text-xs">
              {#each Array.from({ length: 14 }, (_, i) => i + 1) as i}
                <div>Linha {i}</div>
              {/each}
            </div>
          </ScrollArea>
        </div>
      </ScrollArea>
    </div>
  {/snippet}

  <!-- ── Importação ─────────────────────────────────────────────── -->
  <DocsImport title={$tStore('import.title')} code={codeImportBasic} />

  <!-- ── Variantes ──────────────────────────────────────────────── -->
  <DocsVariants
    title={$tStore('variants.title')}
    items={[
      { name: $tStore('variants.items.vertical'),   description: stripHtml($tStore('variants.styles.vertical')),   code: codeVertical,   preview: variantVertical   },
      { name: $tStore('variants.items.horizontal'), description: stripHtml($tStore('variants.styles.horizontal')), code: codeHorizontal, preview: variantHorizontal },
      { name: $tStore('variants.items.both'),       description: stripHtml($tStore('variants.styles.both')),       code: codeBoth,       preview: variantBoth       },
    ]}
  />

  {#snippet variantVertical()}
    <div class="rounded-md border bg-background overflow-hidden" style="height: 200px; width: 100%; max-width: 300px;">
      <ScrollArea orientation="vertical" class="h-full w-full">
        <div class="p-3 space-y-2 text-xs">
          {#each VERTICAL_TAGS.slice(0, 20) as n}
            <div class="border-b pb-1 last:border-b-0">{$tStore('demonstration.labels.tag')} {n}</div>
          {/each}
        </div>
      </ScrollArea>
    </div>
  {/snippet}
  {#snippet variantHorizontal()}
    <div class="rounded-md border bg-background overflow-hidden" style="height: 140px; width: 100%; max-width: 420px;">
      <ScrollArea orientation="horizontal" class="h-full w-full whitespace-nowrap">
        <div class="flex w-max gap-3 p-3">
          {#each HORIZONTAL_CARDS as n}
            <div class="flex h-[90px] w-[120px] items-center justify-center rounded-md bg-muted text-xs shrink-0">
              Card {n}
            </div>
          {/each}
        </div>
      </ScrollArea>
    </div>
  {/snippet}
  {#snippet variantBoth()}
    <div class="rounded-md border bg-background overflow-hidden" style="height: 200px; width: 100%; max-width: 420px;">
      <ScrollArea orientation="both" class="h-full w-full">
        <table class="w-max border-collapse text-xs">
          <tbody>
            {#each MATRIX_ROWS.slice(0, 10) as r}
              <tr>
                {#each MATRIX_COLS.slice(0, 10) as c}
                  <td class="border px-2 py-1 whitespace-nowrap">R{r}·C{c}</td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      </ScrollArea>
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
      { label: $tStore('states.items.idle'),      trigger: '—',                 behavior: stripHtml($tStore('states.descriptions.idle'))      },
      { label: $tStore('states.items.scrolling'), trigger: 'data-scrolling',    behavior: stripHtml($tStore('states.descriptions.scrolling')) },
      { label: $tStore('states.items.hover'),     trigger: ':hover',            behavior: stripHtml($tStore('states.descriptions.hover'))     },
      { label: $tStore('states.items.focus'),     trigger: ':focus-visible',    behavior: stripHtml($tStore('states.descriptions.focus'))     },
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
          { name: 'type',            type: $tStore('props.table.type_prop.type'),        defaultValue: $tStore('props.table.type_prop.default'),        required: $tStore('props.table.type_prop.required'),        description: sanitizeHtml($tStore('props.table.type_prop.description'))        },
          { name: 'scrollHideDelay', type: $tStore('props.table.scrollHideDelay.type'),  defaultValue: $tStore('props.table.scrollHideDelay.default'),  required: $tStore('props.table.scrollHideDelay.required'),  description: sanitizeHtml($tStore('props.table.scrollHideDelay.description'))  },
          { name: 'orientation',     type: '"vertical" | "horizontal" | "both"',         defaultValue: '"vertical"',                                    required: 'Não',                                            description: 'Direção do scroll suportada — controla quais ScrollBars o wrapper renderiza.' },
          { name: 'class',           type: $tStore('props.table.className.type'),        defaultValue: $tStore('props.table.className.default'),        required: $tStore('props.table.className.required'),        description: sanitizeHtml($tStore('props.table.className.description'))        },
          { name: 'children',        type: 'Snippet',                                    defaultValue: '—',                                             required: 'Sim',                                            description: 'Conteúdo renderizado dentro do Viewport.' },
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
    customizationCode={$tStore('tokens.customizationCode')}
  />

  <!-- ── Acessibilidade ─────────────────────────────────────────── -->
  <DocsAccessibility
    title={$tStore('accessibility.title')}
    summary={$tStore('accessibility.summary')}
    items={[
      $tStore('accessibility.items.item1'),
      $tStore('accessibility.items.item2'),
      stripHtml($tStore('accessibility.items.item3')),
      $tStore('accessibility.items.item4'),
      stripHtml($tStore('accessibility.items.item5')),
      $tStore('accessibility.items.item6'),
    ]}
    keyboardTitle={$tStore('accessibility.keyboard.title')}
    keyboardItems={[
      { key: 'Tab',       description: $tStore('accessibility.keyboard.tab')        },
      { key: '↓',         description: $tStore('accessibility.keyboard.arrowDown')  },
      { key: '↑',         description: $tStore('accessibility.keyboard.arrowUp')    },
      { key: '→',         description: $tStore('accessibility.keyboard.arrowRight') },
      { key: '←',         description: $tStore('accessibility.keyboard.arrowLeft')  },
      { key: 'PageDown',  description: $tStore('accessibility.keyboard.pageDown')   },
      { key: 'PageUp',    description: $tStore('accessibility.keyboard.pageUp')     },
      { key: 'Home',      description: $tStore('accessibility.keyboard.home')       },
      { key: 'End',       description: $tStore('accessibility.keyboard.end')        },
    ]}
  />

  <!-- ── Relacionados ───────────────────────────────────────────── -->
  <DocsRelated
    title={$tStore('related.title')}
    items={[
      { name: $tStore('related.items.resizable.name'), description: $tStore('related.items.resizable.description'), path: '?path=/docs/ui-resizable--docs' },
      { name: $tStore('related.items.sheet.name'),     description: $tStore('related.items.sheet.description'),     path: '?path=/docs/ui-sheet--docs'     },
      { name: $tStore('related.items.dialog.name'),    description: $tStore('related.items.dialog.description'),    path: '?path=/docs/ui-dialog--docs'    },
      { name: $tStore('related.items.command.name'),   description: $tStore('related.items.command.description'),   path: '?path=/docs/ui-command--docs'   },
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
      { event: 'content_scroll', trigger: $tStore('analytics.table.content_scroll.trigger'), payload: $tStore('analytics.table.content_scroll.payload') },
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
        { criterion: $tStore('testes.accessibility.item1'), level: 'AA',     how: 'axe-core' },
        { criterion: $tStore('testes.accessibility.item2'), level: '1.4.11', how: 'Contrast checker' },
        { criterion: $tStore('testes.accessibility.item3'), level: '2.4.7',  how: 'Keyboard test' },
        { criterion: $tStore('testes.accessibility.item4'), level: '2.1.1',  how: 'Keyboard test' },
        { criterion: $tStore('testes.accessibility.item5'), level: '1.4.10', how: 'Manual mobile test' },
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
