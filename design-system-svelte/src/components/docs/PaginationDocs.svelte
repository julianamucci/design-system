<script lang="ts">
  import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
  } from '@/components/ui/pagination';
  import { locale, useTranslation } from '@/lib/i18n';
  import { applySeo } from '@/lib/use-seo';
  import { track } from '@/lib/analytics';
  import { createActiveSection } from '@/lib/use-active-section.svelte';
  import { sanitizeHtml } from '@/lib/sanitize-html';
  import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.svelte';
  import {
    DocsHeader, DocsDemonstration, DocsAnatomy, DocsWhenToUse, DocsDoDont,
    DocsImport, DocsVariants, DocsCompositions, DocsStates, DocsProps, DocsTokens,
    DocsAccessibility, DocsRelated, DocsNotes, DocsAnalytics, DocsTestes,
  } from '@/components/docs/shared/sections';
  import uiTranslations from '@/i18n/ui.json';
  import paginationTranslations from '@shared/content/pagination/translations.json';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(paginationTranslations);

  // ─── SEO + Analytics ─────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale: l,
      componentSlug: 'pagination',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      aiIntent: t('seo.aiIntent'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: t('category'), item: '/components/navigation' },
        { name: t('title') },
      ],
    });
    track('docs_page_view', {
      component_name: 'pagination',
      locale: l,
      page_title: `${t('title')} · Design System`,
    });
    return cleanup;
  });

  // ─── Active section ──────────────────────────────────────────────────────────


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
        { id: 'importacao',   label: tContent('nav.import')   },
        { id: 'variantes',    label: tContent('nav.variants') },
        { id: 'composicoes',  label: tNav('nav.compositions') },
        { id: 'estados',      label: tContent('nav.states')   },
        { id: 'propriedades', label: tContent('nav.props')    },
        { id: 'tokens',       label: tContent('nav.tokens')   },
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

  const sectionIds = NAV_GROUPS.flatMap(g => g.sections.map(s => s.id));
  const section = createActiveSection(sectionIds, (id) => {
    track('docs_section_viewed', { section_id: id, component_name: 'pagination', locale: $locale });
  });
  $effect(() => section.attach());

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  function stripHtml(s: string) {
    return s.replace(/<[^>]*>/g, '');
  }

  const priorityKeyMap: Record<string, string> = {
    high: 'common.high',
    medium: 'common.medium',
    low: 'common.low',
  };
  function localPriority(raw: string, tNav: (k: string) => string): string {
    return tNav(priorityKeyMap[raw] ?? 'common.high');
  }

  // ─── Code strings ────────────────────────────────────────────────────────────

  const codeImportBasic = `import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";`;

  const codeImportUsage = `<Pagination count={50} perPage={10} page={1}>
  {#snippet children({ pages, currentPage })}
    <PaginationContent>
      <PaginationItem>
        <PaginationPrevious />
      </PaginationItem>
      {#each pages as p (p.key)}
        <PaginationItem>
          {#if p.type === 'ellipsis'}
            <PaginationEllipsis />
          {:else}
            <PaginationLink page={p} isActive={currentPage === p.value}>
              {p.value}
            </PaginationLink>
          {/if}
        </PaginationItem>
      {/each}
      <PaginationItem>
        <PaginationNext />
      </PaginationItem>
    </PaginationContent>
  {/snippet}
</Pagination>`;

  const codeDefault = `<PaginationLink page={pageObj}>2</PaginationLink>`;
  const codeActive = `<PaginationLink page={pageObj} isActive>3</PaginationLink>`;
  const codeDirectional = `<PaginationPrevious aria-label="Anterior" />
<PaginationNext aria-label="Próxima" />`;

  const interfaceCode = `// Pagination (Root)
interface PaginationProps {
  count: number;
  perPage?: number;       // default 1
  page?: number;          // bindable, default 1
  siblingCount?: number;  // default 1
  loop?: boolean;         // default false
  onPageChange?: (page: number) => void;
}

// PaginationLink
interface PaginationLinkProps {
  page: { type: 'page'; value: number };
  isActive?: boolean;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  class?: string;
}

// PaginationPrevious / PaginationNext
interface PaginationDirectionalProps {
  class?: string;
}

// PaginationEllipsis — span decorativo (aria-hidden)`;

  const propsTableCols = $derived({
    prop: $tStore('props.table.prop'),
    type: $tStore('props.table.type'),
    default: $tStore('props.table.default'),
    required: $tStore('props.table.required'),
    description: $tStore('props.table.description'),
  });

  let interactiveCurrent = $state(3);
</script>

<DocsPageLayout navGroups={NAV_GROUPS} activeSection={section.value} componentSlug="pagination">
  {#snippet header()}
    <DocsHeader
      title={$tStore('title')}
      description={$tStore('description')}
      category={$tStore('category')}
      type={$tStore('type')}
      installNote="npx shadcn-svelte@latest add pagination"
    />
  {/snippet}

  <!-- ── Demonstração ───────────────────────────────────────────── -->
  <DocsDemonstration title={$tStore('demonstration.title')}>
    {#snippet children()}
      <div class="flex items-center justify-center w-full" style="contain: layout">
        <Pagination count={120} perPage={10} page={6} siblingCount={1}>
          {#snippet children({ pages, currentPage })}
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious aria-label={$tStore('demonstration.labels.previous')} />
              </PaginationItem>
              {#each pages as p (p.key)}
                <PaginationItem>
                  {#if p.type === 'ellipsis'}
                    <PaginationEllipsis />
                  {:else}
                    <PaginationLink
                      page={p}
                      isActive={currentPage === p.value}
                      aria-label={currentPage === p.value
                        ? `${$tStore('demonstration.labels.current')}, ${p.value}`
                        : `${$tStore('demonstration.labels.page')} ${p.value}`}
                    >
                      {p.value}
                    </PaginationLink>
                  {/if}
                </PaginationItem>
              {/each}
              <PaginationItem>
                <PaginationNext aria-label={$tStore('demonstration.labels.next')} />
              </PaginationItem>
            </PaginationContent>
          {/snippet}
        </Pagination>
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
      $tStore('anatomy.item6'),
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
        stripHtml($tStore('usage.guidelines.item1')),
        stripHtml($tStore('usage.guidelines.item2')),
        stripHtml($tStore('usage.guidelines.item3')),
        stripHtml($tStore('usage.guidelines.item4')),
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
    uxWriting={{
      title: $tStore('usage.uxWriting.title'),
      cols: {
        element: $tStore('usage.uxWriting.table.element'),
        rules: $tStore('usage.uxWriting.table.rules'),
        do: $tStore('usage.uxWriting.table.correct'),
        dont: $tStore('usage.uxWriting.table.avoid'),
      },
      items: [
        { element: $tStore('usage.uxWriting.table.previous.name'), rules: $tStore('usage.uxWriting.table.previous.format'), do: $tStore('usage.uxWriting.table.previous.good'), dont: $tStore('usage.uxWriting.table.previous.bad') },
        { element: $tStore('usage.uxWriting.table.next.name'),     rules: $tStore('usage.uxWriting.table.next.format'),     do: $tStore('usage.uxWriting.table.next.good'),     dont: $tStore('usage.uxWriting.table.next.bad') },
        { element: $tStore('usage.uxWriting.table.page.name'),     rules: $tStore('usage.uxWriting.table.page.format'),     do: $tStore('usage.uxWriting.table.page.good'),     dont: $tStore('usage.uxWriting.table.page.bad') },
        { element: $tStore('usage.uxWriting.table.ellipsis.name'), rules: $tStore('usage.uxWriting.table.ellipsis.format'), do: $tStore('usage.uxWriting.table.ellipsis.good'), dont: $tStore('usage.uxWriting.table.ellipsis.bad') },
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
        stripHtml($tStore('usage.dont.item1')),
        stripHtml($tStore('usage.dont.item2')),
        stripHtml($tStore('usage.dont.item3')),
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
    <Pagination count={120} perPage={10} page={6} siblingCount={1}>
      {#snippet children({ pages, currentPage })}
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious aria-label="Anterior" />
          </PaginationItem>
          {#each pages as p (p.key)}
            <PaginationItem>
              {#if p.type === 'ellipsis'}
                <PaginationEllipsis />
              {:else}
                <PaginationLink page={p} isActive={currentPage === p.value} aria-label={`Ir para página ${p.value}`}>
                  {p.value}
                </PaginationLink>
              {/if}
            </PaginationItem>
          {/each}
          <PaginationItem>
            <PaginationNext aria-label="Próxima" />
          </PaginationItem>
        </PaginationContent>
      {/snippet}
    </Pagination>
  {/snippet}
  {#snippet dontPair1()}
    <Pagination count={150} perPage={10} page={6} siblingCount={20}>
      {#snippet children({ pages, currentPage })}
        <PaginationContent>
          {#each pages.slice(0, 10) as p (p.key)}
            <PaginationItem>
              {#if p.type !== 'ellipsis'}
                <PaginationLink page={p} isActive={currentPage === p.value}>
                  {p.value}
                </PaginationLink>
              {/if}
            </PaginationItem>
          {/each}
        </PaginationContent>
      {/snippet}
    </Pagination>
  {/snippet}
  {#snippet doPair2()}
    <Pagination count={50} perPage={10} page={2}>
      {#snippet children({ pages, currentPage })}
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious aria-label="Anterior" />
          </PaginationItem>
          {#each pages as p (p.key)}
            <PaginationItem>
              {#if p.type !== 'ellipsis'}
                <PaginationLink page={p} isActive={currentPage === p.value}>
                  {p.value}
                </PaginationLink>
              {/if}
            </PaginationItem>
          {/each}
          <PaginationItem>
            <PaginationNext aria-label="Próxima" />
          </PaginationItem>
        </PaginationContent>
      {/snippet}
    </Pagination>
  {/snippet}
  {#snippet dontPair2()}
    <Pagination count={50} perPage={10} page={2}>
      {#snippet children({ pages, currentPage })}
        <PaginationContent>
          <PaginationItem>
            <PaginationLink page={{ type: 'page', value: 1, key: 'p1' } as any} isActive={false}>
              {'<'}
            </PaginationLink>
          </PaginationItem>
          {#each pages as p (p.key)}
            <PaginationItem>
              {#if p.type !== 'ellipsis'}
                <PaginationLink page={p} isActive={currentPage === p.value}>
                  {p.value}
                </PaginationLink>
              {/if}
            </PaginationItem>
          {/each}
          <PaginationItem>
            <PaginationLink page={{ type: 'page', value: 5, key: 'p5' } as any} isActive={false}>
              {'>'}
            </PaginationLink>
          </PaginationItem>
        </PaginationContent>
      {/snippet}
    </Pagination>
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
      { name: $tStore('variants.items.default'),     description: stripHtml($tStore('variants.styles.default')),     code: codeDefault,     preview: variantDefault     },
      { name: $tStore('variants.items.active'),      description: stripHtml($tStore('variants.styles.active')),      code: codeActive,      preview: variantActive      },
      { name: $tStore('variants.items.directional'), description: stripHtml($tStore('variants.styles.directional')), code: codeDirectional, preview: variantDirectional },
    ]}
  />

  {#snippet variantDefault()}
    <Pagination count={50} perPage={10} page={1} siblingCount={2}>
      {#snippet children({ pages })}
        <PaginationContent>
          {#each pages as p (p.key)}
            <PaginationItem>
              {#if p.type !== 'ellipsis'}
                <PaginationLink page={p} isActive={false} aria-label={`Ir para página ${p.value}`}>
                  {p.value}
                </PaginationLink>
              {/if}
            </PaginationItem>
          {/each}
        </PaginationContent>
      {/snippet}
    </Pagination>
  {/snippet}
  {#snippet variantActive()}
    <Pagination count={50} perPage={10} page={3} siblingCount={2}>
      {#snippet children({ pages, currentPage })}
        <PaginationContent>
          {#each pages as p (p.key)}
            <PaginationItem>
              {#if p.type !== 'ellipsis'}
                <PaginationLink page={p} isActive={currentPage === p.value} aria-label={currentPage === p.value ? `Página atual, ${p.value}` : `Ir para página ${p.value}`}>
                  {p.value}
                </PaginationLink>
              {/if}
            </PaginationItem>
          {/each}
        </PaginationContent>
      {/snippet}
    </Pagination>
  {/snippet}
  {#snippet variantDirectional()}
    <Pagination count={50} perPage={10} page={2}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious aria-label="Ir para a página anterior" />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext aria-label="Ir para a próxima página" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  {/snippet}

  <!-- ── Composições ──────────────────────────────────────────────── -->
  <DocsCompositions
    title={$tStore('variants.compositionsTitle')}
    useWhenLabel={$tNavStore('common.useWhen')}
    componentSlug="pagination"
    items={[
      {
        name: $tStore('variants.compositions.simple.name'),
        description: $tStore('variants.compositions.simple.description'),
        useWhen: $tStore('variants.compositions.simple.use'),
        code: `<Pagination count={50} perPage={10} page={1}>
  {#snippet children({ pages, currentPage })}
    <PaginationContent>
      <PaginationItem><PaginationPrevious /></PaginationItem>
      {#each pages as p (p.key)}
        <PaginationItem>
          {#if p.type !== 'ellipsis'}
            <PaginationLink page={p} isActive={currentPage === p.value}>{p.value}</PaginationLink>
          {/if}
        </PaginationItem>
      {/each}
      <PaginationItem><PaginationNext /></PaginationItem>
    </PaginationContent>
  {/snippet}
</Pagination>`,
        preview: compSimple,
      },
      {
        name: $tStore('variants.compositions.withEllipsis.name'),
        description: $tStore('variants.compositions.withEllipsis.description'),
        useWhen: $tStore('variants.compositions.withEllipsis.use'),
        code: `<Pagination count={120} perPage={10} page={6} siblingCount={1}>
  {#snippet children({ pages, currentPage })}
    <PaginationContent>
      <PaginationItem><PaginationPrevious /></PaginationItem>
      {#each pages as p (p.key)}
        <PaginationItem>
          {#if p.type === 'ellipsis'}
            <PaginationEllipsis />
          {:else}
            <PaginationLink page={p} isActive={currentPage === p.value}>{p.value}</PaginationLink>
          {/if}
        </PaginationItem>
      {/each}
      <PaginationItem><PaginationNext /></PaginationItem>
    </PaginationContent>
  {/snippet}
</Pagination>`,
        preview: compWithEllipsis,
      },
      {
        name: $tStore('variants.compositions.lastPage.name'),
        description: $tStore('variants.compositions.lastPage.description'),
        useWhen: $tStore('variants.compositions.lastPage.use'),
        code: `<Pagination count={100} perPage={10} page={10}>
  {#snippet children({ pages, currentPage })}
    <PaginationContent>
      <PaginationItem><PaginationPrevious /></PaginationItem>
      {#each pages as p (p.key)}
        <PaginationItem>
          {#if p.type !== 'ellipsis'}
            <PaginationLink page={p} isActive={currentPage === p.value}>{p.value}</PaginationLink>
          {/if}
        </PaginationItem>
      {/each}
      <PaginationItem><PaginationNext /></PaginationItem>
    </PaginationContent>
  {/snippet}
</Pagination>`,
        preview: compLastPage,
      },
      {
        name: $tStore('variants.compositions.interactive.name'),
        description: $tStore('variants.compositions.interactive.description'),
        useWhen: $tStore('variants.compositions.interactive.use'),
        code: `let current = $state(3);

<Pagination count={80} perPage={10} bind:page={current}>
  {#snippet children({ pages, currentPage })}
    <PaginationContent>
      <PaginationItem><PaginationPrevious /></PaginationItem>
      {#each pages as p (p.key)}
        <PaginationItem>
          {#if p.type !== 'ellipsis'}
            <PaginationLink page={p} isActive={currentPage === p.value}>{p.value}</PaginationLink>
          {/if}
        </PaginationItem>
      {/each}
      <PaginationItem><PaginationNext /></PaginationItem>
    </PaginationContent>
  {/snippet}
</Pagination>
<p>Página atual: {current}</p>`,
        preview: compInteractive,
      },
    ]}
  />

  {#snippet compSimple()}
    <Pagination count={50} perPage={10} page={1}>
      {#snippet children({ pages, currentPage })}
        <PaginationContent>
          <PaginationItem><PaginationPrevious aria-label="Anterior" /></PaginationItem>
          {#each pages as p (p.key)}
            <PaginationItem>
              {#if p.type !== 'ellipsis'}
                <PaginationLink page={p} isActive={currentPage === p.value}>{p.value}</PaginationLink>
              {/if}
            </PaginationItem>
          {/each}
          <PaginationItem><PaginationNext aria-label="Próxima" /></PaginationItem>
        </PaginationContent>
      {/snippet}
    </Pagination>
  {/snippet}
  {#snippet compWithEllipsis()}
    <Pagination count={120} perPage={10} page={6} siblingCount={1}>
      {#snippet children({ pages, currentPage })}
        <PaginationContent>
          <PaginationItem><PaginationPrevious aria-label="Anterior" /></PaginationItem>
          {#each pages as p (p.key)}
            <PaginationItem>
              {#if p.type === 'ellipsis'}
                <PaginationEllipsis />
              {:else}
                <PaginationLink page={p} isActive={currentPage === p.value}>{p.value}</PaginationLink>
              {/if}
            </PaginationItem>
          {/each}
          <PaginationItem><PaginationNext aria-label="Próxima" /></PaginationItem>
        </PaginationContent>
      {/snippet}
    </Pagination>
  {/snippet}
  {#snippet compLastPage()}
    <Pagination count={100} perPage={10} page={10}>
      {#snippet children({ pages, currentPage })}
        <PaginationContent>
          <PaginationItem><PaginationPrevious aria-label="Anterior" /></PaginationItem>
          {#each pages as p (p.key)}
            <PaginationItem>
              {#if p.type === 'ellipsis'}
                <PaginationEllipsis />
              {:else}
                <PaginationLink page={p} isActive={currentPage === p.value}>{p.value}</PaginationLink>
              {/if}
            </PaginationItem>
          {/each}
          <PaginationItem><PaginationNext aria-label="Próxima" /></PaginationItem>
        </PaginationContent>
      {/snippet}
    </Pagination>
  {/snippet}
  {#snippet compInteractive()}
    <div class="flex flex-col items-center gap-3 w-full">
      <Pagination count={80} perPage={10} bind:page={interactiveCurrent}>
        {#snippet children({ pages, currentPage })}
          <PaginationContent>
            <PaginationItem><PaginationPrevious aria-label="Anterior" /></PaginationItem>
            {#each pages as p (p.key)}
              <PaginationItem>
                {#if p.type === 'ellipsis'}
                  <PaginationEllipsis />
                {:else}
                  <PaginationLink page={p} isActive={currentPage === p.value}>{p.value}</PaginationLink>
                {/if}
              </PaginationItem>
            {/each}
            <PaginationItem><PaginationNext aria-label="Próxima" /></PaginationItem>
          </PaginationContent>
        {/snippet}
      </Pagination>
      <p class="text-sm text-muted-foreground">Página atual: {interactiveCurrent} / 8</p>
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
      { label: $tStore('states.items.default'),  trigger: '—',                                 behavior: stripHtml($tStore('states.descriptions.default'))  },
      { label: $tStore('states.items.hover'),    trigger: 'mouseenter',                        behavior: stripHtml($tStore('states.descriptions.hover'))    },
      { label: $tStore('states.items.active'),   trigger: 'isActive=true',                     behavior: stripHtml($tStore('states.descriptions.active'))   },
      { label: $tStore('states.items.disabled'), trigger: 'page === 1 (Previous) / last (Next)', behavior: stripHtml($tStore('states.descriptions.disabled')) },
      { label: $tStore('states.items.focus'),    trigger: 'Tab',                               behavior: stripHtml($tStore('states.descriptions.focus'))    },
    ]}
  />

  <!-- ── Propriedades ───────────────────────────────────────────── -->
  <DocsProps
    title={$tStore('props.title')}
    tables={[
      {
        cols: propsTableCols,
        items: [
          { name: 'isActive',  type: $tStore('props.table.isActive.type'),  defaultValue: $tStore('props.table.isActive.default'),  required: $tStore('props.table.isActive.required'),  description: stripHtml($tStore('props.table.isActive.description'))  },
          { name: 'size',      type: $tStore('props.table.size.type'),      defaultValue: $tStore('props.table.size.default'),      required: $tStore('props.table.size.required'),      description: stripHtml($tStore('props.table.size.description'))      },
          { name: 'text',      type: $tStore('props.table.text.type'),      defaultValue: $tStore('props.table.text.default'),      required: $tStore('props.table.text.required'),      description: $tStore('props.table.text.description')                  },
          { name: 'class',     type: $tStore('props.table.className.type'), defaultValue: $tStore('props.table.className.default'), required: $tStore('props.table.className.required'), description: $tStore('props.table.className.description')             },
          { name: 'children',  type: 'Snippet',                              defaultValue: $tStore('props.table.children.default'), required: $tStore('props.table.children.required'),  description: $tStore('props.table.children.description')              },
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
      { token: '--background', value: $tStore('tokens.table.background.class'),        description: $tStore('tokens.table.background.part')        },
      { token: '--foreground', value: $tStore('tokens.table.foreground.class'),        description: $tStore('tokens.table.foreground.part')        },
      { token: '--accent',     value: $tStore('tokens.table.accent.class'),            description: $tStore('tokens.table.accent.part')            },
      { token: '--accent-foreground', value: $tStore('tokens.table.accentForeground.class'),  description: $tStore('tokens.table.accentForeground.part')  },
      { token: '--border',     value: $tStore('tokens.table.border.class'),            description: $tStore('tokens.table.border.part')            },
      { token: '--ring',       value: $tStore('tokens.table.ring.class'),              description: $tStore('tokens.table.ring.part')              },
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
      $tStore('accessibility.items.item6'),
    ]}
    keyboardTitle={$tStore('accessibility.keyboard.title')}
    keyboardItems={[
      { key: 'Tab',         description: $tStore('accessibility.keyboard.tab')      },
      { key: 'Enter',       description: $tStore('accessibility.keyboard.enter')    },
      { key: 'Space',       description: $tStore('accessibility.keyboard.space')    },
      { key: 'Shift + Tab', description: $tStore('accessibility.keyboard.shiftTab') },
    ]}
  />

  <!-- ── Relacionados ───────────────────────────────────────────── -->
  <DocsRelated
    title={$tStore('related.title')}
    items={[
      { name: $tStore('related.items.breadcrumb.name'), description: $tStore('related.items.breadcrumb.description'), path: '?path=/docs/ui-breadcrumb--docs' },
      { name: $tStore('related.items.tabs.name'),       description: $tStore('related.items.tabs.description'),       path: '?path=/docs/ui-tabs--docs'       },
      { name: $tStore('related.items.button.name'),     description: $tStore('related.items.button.description'),     path: '?path=/docs/ui-button--docs'     },
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
      { event: 'page_change',         trigger: $tStore('analytics.table.page_change.trigger'), payload: $tStore('analytics.table.page_change.payload') },
      { event: 'docs_page_view',      trigger: 'Docs page mount',  payload: "{ component_name: 'pagination', locale, page_title }" },
      { event: 'docs_section_viewed', trigger: 'Section visible',  payload: "{ section_id, component_name: 'pagination', locale }" },
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
      items: [1, 2, 3, 4].map((i) => ({
        action: stripHtml($tStore(`testes.functional.item${i}.action`)),
        result: stripHtml($tStore(`testes.functional.item${i}.result`)),
        priority: localPriority($tStore(`testes.functional.item${i}.priority`), $tNavStore),
      })),
    }}
    accessibility={{
      title: $tStore('testes.accessibility.title'),
      cols: {
        criterion: $tNavStore('common.criterion'),
        level: 'WCAG',
        how: $tNavStore('common.howToVerify'),
      },
      items: [
        { criterion: stripHtml($tStore('testes.accessibility.item1')), level: 'AA',    how: 'axe-core' },
        { criterion: stripHtml($tStore('testes.accessibility.item2')), level: '1.4.3', how: 'Contrast analyzer' },
        { criterion: stripHtml($tStore('testes.accessibility.item3')), level: '2.4.7', how: 'Keyboard test' },
        { criterion: stripHtml($tStore('testes.accessibility.item4')), level: '4.1.2', how: 'DOM inspection' },
        { criterion: stripHtml($tStore('testes.accessibility.item5')), level: '4.1.2', how: 'DOM inspection' },
      ],
    }}
    visual={{
      title: $tStore('testes.visual.title'),
      cols: {
        story: $tNavStore('common.storyState'),
        priority: $tNavStore('common.priority'),
      },
      items: [1, 2, 3, 4].map((i) => ({
        story: $tStore(`testes.visual.item${i}.story`),
        priority: localPriority($tStore(`testes.visual.item${i}.priority`), $tNavStore),
      })),
    }}
  />
</DocsPageLayout>

<!-- sanitizeHtml available para uso futuro em {@html} dinâmico -->
{#if false}
  {@html sanitizeHtml('')}
{/if}
