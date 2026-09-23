<script lang="ts">
  import { untrack } from 'svelte';
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
  import DOMPurify from 'dompurify';
  import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.svelte';
  import {
    DocsHeader, DocsDemonstration, DocsAnatomy, DocsWhenToUse, DocsDoDont,
    DocsImport, DocsCompositions, DocsStates, DocsProps, DocsTokens,
    DocsAccessibility, DocsRelated, DocsNotes, DocsAnalytics, DocsTestes,
  } from '@/components/docs/shared/sections';
  import uiTranslations from '@/i18n/ui.json';
  import paginationTranslations from '@shared/content/pagination/translations.json';
  import { stripHtml, toPlainText } from '@/lib/strip-html';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(paginationTranslations);

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria. O
  // `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
  const screenReaderItems = $derived(
    Object.entries(
      (paginationTranslations as unknown as Record<
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
      componentSlug: 'pagination',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
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
    track('docs_section_viewed', { section_id: id, component_name: 'pagination', locale: $locale });
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

  /**
   * `href` é prop só desta stack — o conteúdo compartilhado não tem chave para
   * ela —, então a descrição mora aqui. Nos três idiomas: um texto cravado em
   * português deixaria a tabela meio traduzida. Sem marcação de tag no texto,
   * porque a tabela renderiza descrição como HTML.
   */
  const HREF_PROP_DESCRIPTION: Record<'pt-BR' | 'en' | 'es', string> = {
    'pt-BR':
      'Endereço da página. Com ele o controle é uma âncora navegável; sem ele, um botão que age na própria página.',
    en: 'Page address. With it the control is a navigable anchor; without it, a button that acts on the current page.',
    es: 'Dirección de la página. Con ella el control es un ancla navegable; sin ella, un botón que actúa en la propia página.',
  };

  const hrefPropDescription = $derived(
    HREF_PROP_DESCRIPTION[$locale as 'pt-BR' | 'en' | 'es'] ?? HREF_PROP_DESCRIPTION['pt-BR'],
  );

  /**
   * Listas numeradas DERIVADAS do dicionário: quem conta os itens é o conteúdo,
   * e não um intervalo cravado aqui — foi assim que o sexto critério de
   * acessibilidade (alvo de toque, WCAG 2.5.8) ficou escrito nos três idiomas
   * sem chegar à tela. Cravar o número novo repete o defeito daqui a um item.
   * A parada usa o contrato do `t()` desta stack (chave ausente volta como a
   * própria chave), e o primeiro campo é quem decide se o item existe — os
   * demais acompanham.
   */
  function itemsFromDict<K extends string>(
    tFn: (key: string) => string,
    base: string,
    fields: readonly K[],
  ): Record<K, string>[] {
    const rows: Record<K, string>[] = [];
    for (let i = 1; ; i++) {
      const probe = `${base}.item${i}.${fields[0]}`;
      if (tFn(probe) === probe) break;
      const row = {} as Record<K, string>;
      for (const f of fields) row[f] = tFn(`${base}.item${i}.${f}`);
      rows.push(row);
    }
    return rows;
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
  href?: string;          // com rota: <a href>; sem rota: <button type="button">
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
    />
  {/snippet}

  <!-- ── Demonstração ───────────────────────────────────────────── -->
  <DocsDemonstration>
    <div class="nds-cluster nds-w-full" data-justify="center" style="contain: layout">
      <!-- aria-label por instância: a página monta vários nav "pagination"; sem rótulo distinto o axe acusa landmark-unique -->
      <Pagination count={120} perPage={10} page={6} siblingCount={1} aria-label={$tStore('demonstration.labels.navigationLabel')} onPageChange={(p: number) => track('page_change', { component: 'pagination', page: p, total_pages: 12, location: 'docs_demo' })}>
        {#snippet children({ pages, currentPage })}
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious text={$tStore('demonstration.labels.previous')} aria-label={$tStore('demonstration.labels.previousLabel')} />
            </PaginationItem>
            {#each pages as p (p.key)}
              <PaginationItem>
                {#if p.type === 'ellipsis'}
                  <PaginationEllipsis />
                {:else}
                  <!-- Rótulo IGUAL para a página atual: quem anuncia "página atual" é o
                       `aria-current="page"`, nativamente e em qualquer idioma. Prefixo
                       próprio aqui duplicava o anúncio e contradizia o comentário do
                       próprio `pagination-link`, que já documenta essa decisão. -->
                  <PaginationLink
                    page={p}
                    isActive={currentPage === p.value}
                    aria-label={`${$tStore('demonstration.labels.page')} ${p.value}`}
                  >
                    {p.value}
                  </PaginationLink>
                {/if}
              </PaginationItem>
            {/each}
            <PaginationItem>
              <PaginationNext text={$tStore('demonstration.labels.next')} aria-label={$tStore('demonstration.labels.nextLabel')} />
            </PaginationItem>
          </PaginationContent>
        {/snippet}
      </Pagination>
    </div>
  </DocsDemonstration>

  <!-- ── Anatomia ───────────────────────────────────────────────── -->
  <DocsAnatomy
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
    <Pagination count={120} perPage={10} page={6} siblingCount={1} aria-label={stripHtml($tStore('doDont.pair1.do'))}>
      {#snippet children({ pages, currentPage })}
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious text={$tStore('demonstration.labels.previous')} aria-label={$tStore('demonstration.labels.previousLabel')} />
          </PaginationItem>
          {#each pages as p (p.key)}
            <PaginationItem>
              {#if p.type === 'ellipsis'}
                <PaginationEllipsis />
              {:else}
                <PaginationLink page={p} isActive={currentPage === p.value} aria-label={`${$tStore('demonstration.labels.page')} ${p.value}`}>
                  {p.value}
                </PaginationLink>
              {/if}
            </PaginationItem>
          {/each}
          <PaginationItem>
            <PaginationNext text={$tStore('demonstration.labels.next')} aria-label={$tStore('demonstration.labels.nextLabel')} />
          </PaginationItem>
        </PaginationContent>
      {/snippet}
    </Pagination>
  {/snippet}
  {#snippet dontPair1()}
    <Pagination count={150} perPage={10} page={6} siblingCount={20} aria-label={stripHtml($tStore('doDont.pair1.dont'))}>
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
    <Pagination count={50} perPage={10} page={2} aria-label={stripHtml($tStore('doDont.pair2.do'))}>
      {#snippet children({ pages, currentPage })}
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious text={$tStore('demonstration.labels.previous')} aria-label={$tStore('demonstration.labels.previousLabel')} />
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
            <PaginationNext text={$tStore('demonstration.labels.next')} aria-label={$tStore('demonstration.labels.nextLabel')} />
          </PaginationItem>
        </PaginationContent>
      {/snippet}
    </Pagination>
  {/snippet}
  {#snippet dontPair2()}
    <Pagination count={50} perPage={10} page={2} aria-label={stripHtml($tStore('doDont.pair2.dont'))}>
      {#snippet children({ pages, currentPage })}
        <PaginationContent>
          <PaginationItem>
            <PaginationLink page={{ type: 'page', value: 1 }} isActive={false}>
              &lt;
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
            <PaginationLink page={{ type: 'page', value: 5 }} isActive={false}>
              &gt;
            </PaginationLink>
          </PaginationItem>
        </PaginationContent>
      {/snippet}
    </Pagination>
  {/snippet}

  <!-- ── Importação ─────────────────────────────────────────────── -->
  <DocsImport componentSlug="pagination"
    code={codeImportBasic}
    secondaryCode={codeImportUsage}
  />

  <!-- ── Variantes ──────────────────────────────────────────────── -->
  <DocsCompositions
    id="variantes"
    useWhenLabel={$tNavStore('common.useWhen')}
    componentSlug="pagination"
    items={[
      { trackId: 'default', name: $tStore('variants.items.default'),     description: stripHtml($tStore('variants.styles.default')),     code: codeDefault,     preview: variantDefault     },
      { trackId: 'directional', name: $tStore('variants.items.directional'), description: stripHtml($tStore('variants.styles.directional')), code: codeDirectional, preview: variantDirectional },
      {
        trackId: 'simple',
        name: $tStore('variants.items.simple.name'),
        description: $tStore('variants.items.simple.description'),
        useWhen: $tStore('variants.items.simple.use'),
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
        preview: variantSimple,
      },
      {
        trackId: 'withEllipsis',
        name: $tStore('variants.items.withEllipsis.name'),
        description: $tStore('variants.items.withEllipsis.description'),
        useWhen: $tStore('variants.items.withEllipsis.use'),
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
        preview: variantWithEllipsis,
      },
      {
        trackId: 'interactive',
        name: $tStore('variants.items.interactive.name'),
        description: $tStore('variants.items.interactive.description'),
        useWhen: $tStore('variants.items.interactive.use'),
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
        preview: variantInteractive,
      },
    ]}
  />

  {#snippet variantDefault()}
    <Pagination count={50} perPage={10} page={1} siblingCount={2} aria-label={$tStore('variants.items.default')}>
      {#snippet children({ pages })}
        <PaginationContent>
          {#each pages as p (p.key)}
            <PaginationItem>
              {#if p.type !== 'ellipsis'}
                <PaginationLink page={p} isActive={false} aria-label={`${$tStore('demonstration.labels.page')} ${p.value}`}>
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
    <Pagination count={50} perPage={10} page={2} aria-label={$tStore('variants.items.directional')}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious text={$tStore('demonstration.labels.previous')} aria-label={$tStore('demonstration.labels.previousLabel')} />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext text={$tStore('demonstration.labels.next')} aria-label={$tStore('demonstration.labels.nextLabel')} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  {/snippet}

  {#snippet variantSimple()}
    <Pagination count={50} perPage={10} page={1} aria-label={$tStore('variants.items.simple.name')}>
      {#snippet children({ pages, currentPage })}
        <PaginationContent>
          <PaginationItem><PaginationPrevious text={$tStore('demonstration.labels.previous')} aria-label={$tStore('demonstration.labels.previousLabel')} /></PaginationItem>
          {#each pages as p (p.key)}
            <PaginationItem>
              {#if p.type !== 'ellipsis'}
                <PaginationLink page={p} isActive={currentPage === p.value}>{p.value}</PaginationLink>
              {/if}
            </PaginationItem>
          {/each}
          <PaginationItem><PaginationNext text={$tStore('demonstration.labels.next')} aria-label={$tStore('demonstration.labels.nextLabel')} /></PaginationItem>
        </PaginationContent>
      {/snippet}
    </Pagination>
  {/snippet}
  {#snippet variantWithEllipsis()}
    <Pagination count={120} perPage={10} page={6} siblingCount={1} aria-label={$tStore('variants.items.withEllipsis.name')}>
      {#snippet children({ pages, currentPage })}
        <PaginationContent>
          <PaginationItem><PaginationPrevious text={$tStore('demonstration.labels.previous')} aria-label={$tStore('demonstration.labels.previousLabel')} /></PaginationItem>
          {#each pages as p (p.key)}
            <PaginationItem>
              {#if p.type === 'ellipsis'}
                <PaginationEllipsis />
              {:else}
                <PaginationLink page={p} isActive={currentPage === p.value}>{p.value}</PaginationLink>
              {/if}
            </PaginationItem>
          {/each}
          <PaginationItem><PaginationNext text={$tStore('demonstration.labels.next')} aria-label={$tStore('demonstration.labels.nextLabel')} /></PaginationItem>
        </PaginationContent>
      {/snippet}
    </Pagination>
  {/snippet}
  {#snippet variantInteractive()}
    <div class="nds-stack nds-w-full" data-spacing="sm" data-align="center">
      <Pagination count={80} perPage={10} bind:page={interactiveCurrent} aria-label={$tStore('variants.items.interactive.name')}>
        {#snippet children({ pages, currentPage })}
          <PaginationContent>
            <PaginationItem><PaginationPrevious text={$tStore('demonstration.labels.previous')} aria-label={$tStore('demonstration.labels.previousLabel')} /></PaginationItem>
            {#each pages as p (p.key)}
              <PaginationItem>
                {#if p.type === 'ellipsis'}
                  <PaginationEllipsis />
                {:else}
                  <PaginationLink page={p} isActive={currentPage === p.value}>{p.value}</PaginationLink>
                {/if}
              </PaginationItem>
            {/each}
            <PaginationItem><PaginationNext text={$tStore('demonstration.labels.next')} aria-label={$tStore('demonstration.labels.nextLabel')} /></PaginationItem>
          </PaginationContent>
        {/snippet}
      </Pagination>
      <!--
        O leitor do estado EXTERNO. A composição existe para ensinar que o
        componente não guarda a página — sem esta linha a demo parece guardá-la
        sozinha, que é o oposto do que a seção ensina. Aqui `labels.current` é
        legenda VISÍVEL, nunca prefixo de nome acessível: no controle ativo ela
        duplicaria o que o `aria-current="page"` já anuncia.
      -->
      <p class="nds-text-body nds-text-muted-foreground">
        {$tStore('demonstration.labels.current')}: {interactiveCurrent} / 8
      </p>
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
      { label: $tStore('states.default.label'),  trigger: toPlainText($tStore('states.default.trigger')),             behavior: toPlainText($tStore('states.default.behavior')) },
      { label: $tStore('states.hover.label'),    trigger: toPlainText($tStore('states.hover.trigger')),               behavior: toPlainText($tStore('states.hover.behavior')) },
      { label: $tStore('states.active.label'),   trigger: toPlainText($tStore('states.active.trigger')),              behavior: toPlainText($tStore('states.active.behavior')) },
      { label: $tStore('states.disabled.label'), trigger: toPlainText($tStore('states.disabled.trigger')),            behavior: toPlainText($tStore('states.disabled.behavior')) },
      { label: $tStore('states.focus.label'),    trigger: toPlainText($tStore('states.focus.trigger')),               behavior: toPlainText($tStore('states.focus.behavior')) },
      { label: $tStore('states.lastPage.label'), trigger: toPlainText($tStore('states.lastPage.trigger')), behavior: toPlainText($tStore('states.lastPage.behavior')) },
    ]}
  />

  <!-- ── Propriedades ───────────────────────────────────────────── -->
  <DocsProps
    tables={[
      {
        cols: propsTableCols,
        items: [
          { name: 'isActive',  type: $tStore('props.table.isActive.type'),  defaultValue: $tStore('props.table.isActive.default'),  required: $tStore('props.table.isActive.required'),  description: toPlainText($tStore('props.table.isActive.description'))  },
          { name: 'size',      type: $tStore('props.table.size.type'),      defaultValue: $tStore('props.table.size.default'),      required: $tStore('props.table.size.required'),      description: toPlainText($tStore('props.table.size.description'))      },
          { name: 'href',      type: 'string',                              defaultValue: '—',                                     required: $tStore('props.table.size.required'),      description: hrefPropDescription                                      },
          { name: 'text',      type: $tStore('props.table.text.type'),      defaultValue: $tStore('props.table.text.default'),      required: $tStore('props.table.text.required'),      description: $tStore('props.table.text.description')                  },
          { name: 'class',     type: $tStore('props.table.className.type'), defaultValue: $tStore('props.table.className.default'), required: $tStore('props.table.className.required'), description: $tStore('props.table.className.description')             },
          { name: 'children',  type: 'Snippet',                              defaultValue: $tStore('props.table.children.default'), required: $tStore('props.table.children.required'),  description: $tStore('props.table.children.description')              },
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
    items={[
      { token: '--foreground', value: $tStore('tokens.table.foreground.class'),        description: $tStore('tokens.table.foreground.part')        },
      { token: '--accent',     value: $tStore('tokens.table.accent.class'),            description: $tStore('tokens.table.accent.part')            },
      { token: '--accent-foreground', value: $tStore('tokens.table.accentForeground.class'),  description: $tStore('tokens.table.accentForeground.part')  },
      { token: '--ring',       value: $tStore('tokens.table.ring.class'),              description: $tStore('tokens.table.ring.part')              },
      { token: '--muted-foreground', value: $tStore('tokens.table.ellipsis.class'),    description: $tStore('tokens.table.ellipsis.part')          },
      { token: '--radius',     value: $tStore('tokens.table.radius.class'),            description: $tStore('tokens.table.radius.part')            },
      { token: '--spacing-1',  value: $tStore('tokens.table.gap.class'),               description: $tStore('tokens.table.gap.part')               },
    ]}
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
  <DocsRelated componentSlug="pagination"
    items={[
      { name: $tStore('related.items.breadcrumb.name'), description: $tStore('related.items.breadcrumb.description'), path: '?path=/docs/components-navigation-breadcrumb--docs' },
      { name: $tStore('related.items.tabs.name'),       description: $tStore('related.items.tabs.description'),       path: '?path=/docs/components-navigation-tabs--docs'       },
      { name: $tStore('related.items.button.name'),     description: $tStore('related.items.button.description'),     path: '?path=/docs/components-form-button--docs'     },
    ]}
  />

  <!-- ── Notas ──────────────────────────────────────────────────── -->
  <DocsNotes componentSlug="pagination"
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
      event: $tStore('analytics.table.event'),
      trigger: toPlainText($tStore('analytics.table.trigger')),
      payload: $tStore('analytics.table.payload'),
    }}
    items={[
      { event: 'page_change',         trigger: toPlainText($tStore('analytics.table.page_change.trigger')), payload: $tStore('analytics.table.page_change.payload') },
      { event: 'docs_page_view',      trigger: 'Docs page mount',  payload: "{ component_name: 'pagination', locale, page_title }" },
      { event: 'docs_section_viewed', trigger: 'Section visible',  payload: "{ section_id, component_name: 'pagination', locale }" },
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
      items: itemsFromDict($tStore, 'testes.functional', ['action', 'result', 'priority']).map((r) => ({
        action: toPlainText(r.action),
        result: toPlainText(r.result),
        priority: localPriority(r.priority, $tNavStore),
      })),
    }}
    accessibility={{
      title: $tStore('testes.accessibility.title'),
      cols: {
        criterion: $tNavStore('common.criterion'),
        level: 'WCAG',
        how: $tNavStore('common.howToVerify'),
      },
      items: itemsFromDict($tStore, 'testes.accessibility', ['criterion', 'level', 'how']).map((r) => ({
        criterion: toPlainText(r.criterion),
        level: r.level,
        how: toPlainText(r.how),
      })),
    }}
    visual={{
      title: $tStore('testes.visual.title'),
      cols: {
        story: $tNavStore('common.storyState'),
        priority: $tNavStore('common.priority'),
      },
      items: itemsFromDict($tStore, 'testes.visual', ['story', 'priority']).map((r) => ({
        story: r.story,
        priority: localPriority(r.priority, $tNavStore),
      })),
    }}
  />
</DocsPageLayout>

<!-- DOMPurify.sanitize available para uso futuro em {@html} dinâmico -->
{#if false}
  {@html DOMPurify.sanitize('')}
{/if}
