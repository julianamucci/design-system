<script lang="ts">
  import { untrack } from 'svelte';
  import DataTable from '@/components/ui/data-table/data-table.svelte';
  import type { DataTableColumn, DataTableLabels } from '@/components/ui/data-table';
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
  import dataTableTranslations from '@shared/content/data-table/translations.json';
  import { stripHtml, toPlainText } from '@/lib/strip-html';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(dataTableTranslations);

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria. O
  // `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
  const screenReaderItems = $derived(
    Object.entries(
      (dataTableTranslations as unknown as Record<
        string,
        { accessibility?: { screenReader?: Record<string, string> } }
      >)[$locale]?.accessibility?.screenReader ?? {},
    )
      .filter(([key]) => key !== 'title')
      .map(([, value]) => value),
  );

  // ─── SEO + Analytics ─────────────────────────────────────────────────────
  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale: l,
      componentSlug: 'data-table',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
    });
    track('docs_page_view', {
      component_name: 'data-table',
      locale: l,
      page_title: `${t('title')} · Design System`,
    });
    return cleanup;
  });

  // ─── Active section ──────────────────────────────────────────────────────
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

  const sectionIds = untrack(() => NAV_GROUPS.flatMap(g => g.sections.map(s => s.id)));
  const section = createActiveSection(sectionIds, (id) => {
    track('docs_section_viewed', { section_id: id, component_name: 'data-table', locale: $locale });
  });
  $effect(() => section.attach());

  const priorityKeyMap: Record<string, string> = { high: 'common.high', medium: 'common.medium', low: 'common.low' };
  function localPriority(raw: string, tNav: (k: string) => string): string {
    return tNav(priorityKeyMap[raw] ?? 'common.high');
  }

  /**
   * Listas numeradas DERIVADAS do dicionário: quem conta os itens é o conteúdo,
   * e não um intervalo cravado aqui — foi assim que um teste funcional e dois
   * critérios de acessibilidade ficaram escritos nos três idiomas sem chegar à
   * tela. Cravar o número novo repete o defeito daqui a um item. A parada usa o
   * contrato do `t()` desta stack (chave ausente volta como a própria chave).
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

  // ─── Demo data ───────────────────────────────────────────────────────────

  /**
   * A linha carrega CHAVE, não rótulo.
   *
   * O texto vem de `demonstration.labels`, resolvido na hora de montar a coluna
   * — mesma regra do payload de analytics: valor estável no dado, tradução só na
   * borda. Com o rótulo dentro da linha, a tabela ficava em português no meio de
   * uma página em inglês, e o mapa de variante do selo só funcionava enquanto
   * ninguém reescrevesse a tradução.
   */
  type InvoiceStatus = 'paid' | 'pending' | 'canceled';
  type InvoiceMethod = 'pix' | 'bankSlip' | 'creditCard' | 'debitCard' | 'transfer';
  type Invoice = {
    id: string;
    customer: string;
    status: InvoiceStatus;
    method: InvoiceMethod;
    amount: number;
  };

  // Caminho INTEIRO e escrito por extenso, e não interpolado: quem procura por
  // `demonstration.labels.paid` na árvore precisa achar esta página. Chave
  // montada em tempo de execução some da busca — e some também do portão que
  // compara o conjunto de rótulos das cinco demonstrações.
  const STATUS_LABEL_KEY: Record<InvoiceStatus, string> = {
    paid: 'demonstration.labels.paid',
    pending: 'demonstration.labels.pending',
    canceled: 'demonstration.labels.canceled',
  };

  const METHOD_LABEL_KEY: Record<InvoiceMethod, string> = {
    pix: 'demonstration.labels.methodPix',
    bankSlip: 'demonstration.labels.methodBankSlip',
    creditCard: 'demonstration.labels.methodCreditCard',
    debitCard: 'demonstration.labels.methodDebitCard',
    transfer: 'demonstration.labels.methodTransfer',
  };

  const STATUS_VARIANT: Record<InvoiceStatus, 'default' | 'warning' | 'destructive'> = {
    paid: 'default',
    // Pendência tem variante própria desde que a `secondary` saiu: `warning`
    // diz o que o estado é, e não só que ele é menos importante que o pago.
    pending: 'warning',
    canceled: 'destructive',
  };

  // A moeda acompanha o idioma: a tabela traduzida com a coluna de valor em
  // reais dizia, no meio de um texto em inglês, que o exemplo era de outro
  // lugar. Formatador é $derived porque o locale muda em tempo de execução —
  // uma constante criada uma vez ficaria presa ao idioma da montagem.
  const currency = $derived(
    $locale === 'en'
      ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
      : $locale === 'es'
        ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })
        : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }),
  );

  const demoData: Invoice[] = [
    { id: 'INV-001', customer: 'Ana Souza',    status: 'paid',     method: 'pix',        amount: 250 },
    { id: 'INV-002', customer: 'Bruno Lima',   status: 'pending',  method: 'bankSlip',   amount: 150 },
    { id: 'INV-003', customer: 'Carla Mendes', status: 'canceled', method: 'creditCard', amount: 350 },
    { id: 'INV-004', customer: 'Diego Faria',  status: 'paid',     method: 'debitCard',  amount: 450 },
    { id: 'INV-005', customer: 'Eva Oliveira', status: 'pending',  method: 'transfer',   amount: 200 },
  ];

  const demoColumns: DataTableColumn<Invoice>[] = $derived([
    { accessorKey: 'id', header: $tStore('demonstration.labels.invoice'), size: 110 },
    { accessorKey: 'customer', header: $tStore('demonstration.labels.customer'), size: 200 },
    {
      // O valor da célula é o RÓTULO e o dado da linha é a CHAVE: busca e
      // ordenação seguem o que está escrito na tela, enquanto a variante do
      // selo continua saindo de um valor que nenhuma tradução move.
      id: 'status',
      accessorFn: (row: Invoice) => $tStore(STATUS_LABEL_KEY[row.status]),
      header: $tStore('demonstration.labels.status'),
      size: 140,
      // O slot de `meta` do conjunto de recursos é declarado sobre `RowData`, e
      // não sobre `Invoice`: a linha chega solta aqui e o estreitamento é local.
      meta: { badgeVariant: (_v: unknown, row: unknown) => STATUS_VARIANT[(row as Invoice).status] },
    },
    {
      id: 'method',
      accessorFn: (row: Invoice) => $tStore(METHOD_LABEL_KEY[row.method]),
      header: $tStore('demonstration.labels.method'),
      size: 200,
    },
    {
      accessorKey: 'amount',
      header: $tStore('demonstration.labels.amount'),
      size: 130,
      meta: {
        // Coluna de número alinha à direita na célula E no cabeçalho, e a
        // célula ainda ganha figura tabular (guideline 20) — quem aplica as
        // duas coisas é o primitivo, então o call site não repete a figura.
        numeric: true,
        format: (v: unknown) => currency.format(Number(v)),
        cellClass: 'nds-font-medium',
      },
    },
  ]);

  /**
   * Nome acessível de cada tabela desta página.
   *
   * A legenda base vem do conteúdo compartilhado; o sufixo distingue um preview
   * do outro. Sem ela a demonstração e os quatro previews chegavam ao leitor de
   * tela como "tabela, 6 colunas" — e meia dúzia de tabelas com o mesmo nome não
   * ajuda ninguém a se localizar. A legenda também nomeia a região rolável, que
   * lê o `caption`.
   */
  function captionFor(suffix: string): string {
    return `${$tStore('demonstration.labels.caption')} — ${toPlainText(suffix)}`;
  }

  /**
   * Rótulos da interface do componente, montados a partir do conteúdo.
   *
   * Passando só o placeholder da busca, o rodapé ficava preso ao pt-BR do padrão
   * em `en` e `es` — "Linhas por página", "Página X de Y", "Primeira página".
   * Caminho de tradução escrito por extenso e nunca interpolado, mesma razão do
   * `STATUS_LABEL_KEY`: quem procura a chave na árvore precisa achar esta página.
   */
  const demoLabels: Partial<DataTableLabels> = $derived({
    columns: $tStore('demonstration.labels.columns'),
    rowsPerPage: $tStore('demonstration.labels.rowsPerPage'),
    page: $tStore('demonstration.labels.page'),
    pageOf: $tStore('demonstration.labels.of'),
    firstPage: $tStore('demonstration.labels.firstPage'),
    prevPage: $tStore('demonstration.labels.prevPage'),
    nextPage: $tStore('demonstration.labels.nextPage'),
    lastPage: $tStore('demonstration.labels.lastPage'),
  });

  // ─── Code strings ────────────────────────────────────────────────────────
  const codeImportBasic = `import DataTable from '@/components/ui/data-table/data-table.svelte';
import type { DataTableColumn } from '@/components/ui/data-table';`;

  const codeImportWithMeta = `import DataTable from '@/components/ui/data-table/data-table.svelte';
import type { DataTableColumn } from '@/components/ui/data-table';

const columns: DataTableColumn<Invoice>[] = [
  { accessorKey: 'customer', header: 'Cliente', meta: { filter: { type: 'text' }, editable: true } },
];`;

  const interfaceCode = `export interface DataTableProps<TData> {
  columns: DataTableColumn<TData>[];
  data: TData[];
  enableGlobalFilter?: boolean;
  globalFilterPlaceholder?: string;
  enableRowSelection?: boolean;
  enableColumnVisibility?: boolean;
  enableColumnFilters?: boolean;
  enableColumnResizing?: boolean;
  enableColumnOrdering?: boolean;
  enableColumnPinning?: boolean;
  enablePagination?: boolean;
  virtualized?: boolean;
  virtualRowHeight?: number;
  maxHeight?: string;
  pageSize?: number;
  pageSizeOptions?: number[];
  emptyMessage?: string;
  class?: string;
  onTableReady?: (table: Table<TData>) => void;
  onCellEdit?: (rowIndex: number, columnId: string, value: unknown) => void;
}`;

  const codeCustomizationTokens = `/* Em globals.css — sobrescrever tokens reflete em todos os recursos */
:root {
  --primary: 222 47% 11%;
  --muted: 210 40% 96%;
  --muted-foreground: 215 16% 47%;
  --ring: 222 84% 5%;
}`;
</script>

<DocsPageLayout navGroups={NAV_GROUPS} activeSection={section.value}>
  {#snippet header()}
    <DocsHeader
      title={$tStore('title')}
      description={$tStore('description')}
      category={$tStore('category')}
      type={$tStore('type')}
      installNote="npm install @tanstack/table-core @tanstack/svelte-virtual"
    />
  {/snippet}

  <!-- ── Demonstração ───────────────────────────────────────────── -->
  <DocsDemonstration componentSlug="data-table">
    <div class="nds-w-full">
      <DataTable
        caption={captionFor($tNavStore('nav.demonstration'))}
        columns={demoColumns}
        data={demoData}
        enableRowSelection
        labels={demoLabels}
        globalFilterPlaceholder={$tStore('demonstration.labels.search')}
        emptyMessage={$tStore('demonstration.labels.noResults')}
      />
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
        $tStore('usage.guidelines.item1'),
        $tStore('usage.guidelines.item2'),
        $tStore('usage.guidelines.item3'),
        $tStore('usage.guidelines.item4'),
        $tStore('usage.guidelines.item5'),
        $tStore('usage.guidelines.item6'),
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
        { s: toPlainText($tStore('usage.scenarios.item3.s')), u: $tStore('usage.scenarios.item3.u'), a: $tStore('usage.scenarios.item3.a') },
        { s: $tStore('usage.scenarios.item4.s'), u: $tStore('usage.scenarios.item4.u'), a: $tStore('usage.scenarios.item4.a') },
        { s: $tStore('usage.scenarios.item5.s'), u: $tStore('usage.scenarios.item5.u'), a: $tStore('usage.scenarios.item5.a') },
        { s: $tStore('usage.scenarios.item6.s'), u: $tStore('usage.scenarios.item6.u'), a: $tStore('usage.scenarios.item6.a') },
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
        { element: $tStore('usage.uxWriting.table.columnHeader.name'),     rules: $tStore('usage.uxWriting.table.columnHeader.format'),     do: $tStore('usage.uxWriting.table.columnHeader.good'),     dont: $tStore('usage.uxWriting.table.columnHeader.bad') },
        { element: $tStore('usage.uxWriting.table.filterPlaceholder.name'), rules: $tStore('usage.uxWriting.table.filterPlaceholder.format'), do: $tStore('usage.uxWriting.table.filterPlaceholder.good'), dont: $tStore('usage.uxWriting.table.filterPlaceholder.bad') },
        { element: $tStore('usage.uxWriting.table.emptyState.name'),        rules: $tStore('usage.uxWriting.table.emptyState.format'),        do: $tStore('usage.uxWriting.table.emptyState.good'),        dont: $tStore('usage.uxWriting.table.emptyState.bad') },
        { element: $tStore('usage.uxWriting.table.selectionLabel.name'),    rules: $tStore('usage.uxWriting.table.selectionLabel.format'),    do: $tStore('usage.uxWriting.table.selectionLabel.good'),    dont: $tStore('usage.uxWriting.table.selectionLabel.bad') },
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
      ],
    }}
  />

  <!-- ── Do & Don't ─────────────────────────────────────────────── -->
  <DocsDoDont
    pairs={[
      {
        doLabel: $tNavStore('common.do'),
        dontLabel: $tNavStore('common.dont'),
        doCaption: toPlainText($tStore('doDont.pair1.do')),
        dontCaption: toPlainText($tStore('doDont.pair1.dont')),
        doPreview: doPair1,
        dontPreview: dontPair1,
      },
      {
        doLabel: $tNavStore('common.do'),
        dontLabel: $tNavStore('common.dont'),
        doCaption: toPlainText($tStore('doDont.pair2.do')),
        dontCaption: toPlainText($tStore('doDont.pair2.dont')),
        doPreview: doPair2,
        dontPreview: dontPair2,
      },
    ]}
  />

  <!-- Os quatro previews instanciam o componente VIVO (guideline 08 §15). A
       imitação anterior eram quatro `<code>` com o padding cravado em `style`:
       ela ensinava a prop pelo texto sem mostrar a diferença que a prop faz, e
       o valor inline saía do tema, da densidade e da escala tipográfica. -->
  {#snippet doPair1()}
    <DataTable
      caption={captionFor($tStore('doDont.pair1.do'))}
      columns={demoColumns}
      data={demoData.slice(0, 3)}
      enableGlobalFilter
      labels={demoLabels}
      globalFilterPlaceholder={$tStore('demonstration.labels.search')}
      emptyMessage={$tStore('demonstration.labels.noResults')}
      enableColumnVisibility={false}
      enablePagination={false}
    />
  {/snippet}
  {#snippet dontPair1()}
    <DataTable
      caption={captionFor($tStore('doDont.pair1.dont'))}
      columns={demoColumns}
      data={demoData.slice(0, 3)}
      enableGlobalFilter
      labels={demoLabels}
      globalFilterPlaceholder="Buscar..."
      emptyMessage={$tStore('demonstration.labels.noResults')}
      enableColumnVisibility={false}
      enablePagination={false}
    />
  {/snippet}
  {#snippet doPair2()}
    <DataTable
      caption={captionFor($tStore('doDont.pair2.do'))}
      columns={demoColumns}
      data={demoData}
      virtualized
      maxHeight="180px"
      labels={demoLabels}
      emptyMessage={$tStore('demonstration.labels.noResults')}
      enableGlobalFilter={false}
      enableColumnVisibility={false}
    />
  {/snippet}
  {#snippet dontPair2()}
    <DataTable
      caption={captionFor($tStore('doDont.pair2.dont'))}
      columns={demoColumns}
      data={demoData}
      enablePagination
      pageSize={3}
      labels={demoLabels}
      emptyMessage={$tStore('demonstration.labels.noResults')}
      enableGlobalFilter={false}
      enableColumnVisibility={false}
    />
  {/snippet}

  <!-- ── Importação ─────────────────────────────────────────────── -->
  <DocsImport componentSlug="data-table"
    description={$tStore('import.basic')}
    code={codeImportBasic}
    secondaryDescription={$tStore('import.withMeta')}
    secondaryCode={codeImportWithMeta}
  />

  <!-- ── Recursos (Variantes) ───────────────────────────────────── -->
  <!-- trackId estável em cada card: o name vem traduzido e viraria snippet_id traduzido. -->
  <DocsCompositions
    id="variantes"
    useWhenLabel={$tNavStore('common.useWhen')}
    componentSlug="data-table"
    items={[
      {
        trackId: 'globalFilter',
        name: $tStore('variants.items.globalFilter.name'),
        description: stripHtml($tStore('variants.items.globalFilter.description')),
        code: '<DataTable enableGlobalFilter />',
        preview: noPreview,
      },
      {
        trackId: 'columnFilters',
        name: $tStore('variants.items.columnFilters.name'),
        description: stripHtml($tStore('variants.items.columnFilters.description')),
        code: '<DataTable enableColumnFilters />',
        preview: noPreview,
      },
      {
        trackId: 'selection',
        name: $tStore('variants.items.selection.name'),
        description: stripHtml($tStore('variants.items.selection.description')),
        code: '<DataTable enableRowSelection />',
        preview: noPreview,
      },
      {
        trackId: 'visibility',
        name: $tStore('variants.items.visibility.name'),
        description: stripHtml($tStore('variants.items.visibility.description')),
        code: '<DataTable enableColumnVisibility />',
        preview: noPreview,
      },
      {
        trackId: 'resize',
        name: $tStore('variants.items.resize.name'),
        description: stripHtml($tStore('variants.items.resize.description')),
        code: '<DataTable enableColumnResizing />',
        preview: noPreview,
      },
      {
        trackId: 'reorder',
        name: $tStore('variants.items.reorder.name'),
        description: stripHtml($tStore('variants.items.reorder.description')),
        code: '<DataTable enableColumnOrdering />',
        preview: noPreview,
      },
      {
        trackId: 'pagination',
        name: $tStore('variants.items.pagination.name'),
        description: stripHtml($tStore('variants.items.pagination.description')),
        code: '<DataTable enablePagination />',
        preview: noPreview,
      },
      {
        trackId: 'editableSheet',
        name: $tStore('variants.items.editableSheet.name'),
        description: $tStore('variants.items.editableSheet.description'),
        useWhen: $tStore('variants.items.editableSheet.use'),
        code: '<DataTable {columns} {data} enableColumnFilters enablePagination={false} onCellEdit={handleCellEdit} />',
        preview: noPreview,
      },
      {
        trackId: 'virtualizedLog',
        name: $tStore('variants.items.virtualizedLog.name'),
        description: $tStore('variants.items.virtualizedLog.description'),
        useWhen: $tStore('variants.items.virtualizedLog.use'),
        code: '<DataTable {columns} {data} virtualized maxHeight="480px" enablePagination={false} />',
        preview: noPreview,
      },
      {
        trackId: 'pinnedKey',
        name: $tStore('variants.items.pinnedKey.name'),
        description: $tStore('variants.items.pinnedKey.description'),
        useWhen: $tStore('variants.items.pinnedKey.use'),
        code: '<DataTable {columns} {data} enableColumnPinning />',
        preview: noPreview,
      },
    ]}
  />

  <!-- ── Composições ────────────────────────────────────────────── -->
  <DocsCompositions
    useWhenLabel={$tNavStore('common.useWhen')}
    componentSlug="data-table"
    items={[
      {
        trackId: 'selectionWithActions',
        name: $tStore('variants.compositions.selectionWithActions.name'),
        description: $tStore('variants.compositions.selectionWithActions.description'),
        useWhen: $tStore('variants.compositions.selectionWithActions.use'),
        code: '<DataTable {columns} {data} enableRowSelection onTableReady={(table) => (selection = table)} />',
        preview: noPreview,
      },
    ]}
  />

  {#snippet noPreview()}
    <span class="nds-text-caption nds-text-muted-foreground nds-italic">Flag opcional — combine livremente conforme o caso de uso.</span>
  {/snippet}

  <!-- ── Estados ────────────────────────────────────────────────── -->
  <DocsStates
    cols={{
      state: $tStore('states.cols.state'),
      trigger: toPlainText($tStore('states.cols.trigger')),
      behavior: toPlainText($tStore('states.cols.behavior')),
    }}
    items={[
      { label: $tStore('states.empty.label'),       trigger: toPlainText($tStore('states.empty.trigger')),       behavior: toPlainText($tStore('states.empty.behavior'))       },
      { label: $tStore('states.sorted.label'),      trigger: toPlainText($tStore('states.sorted.trigger')),                 behavior: toPlainText($tStore('states.sorted.behavior'))      },
      { label: $tStore('states.filtered.label'),    trigger: toPlainText($tStore('states.filtered.trigger')),               behavior: toPlainText($tStore('states.filtered.behavior'))},
      { label: $tStore('states.selected.label'),    trigger: toPlainText($tStore('states.selected.trigger')),               behavior: toPlainText($tStore('states.selected.behavior'))    },
      { label: $tStore('states.editing.label'),     trigger: toPlainText($tStore('states.editing.trigger')),     behavior: toPlainText($tStore('states.editing.behavior'))     },
      { label: $tStore('states.resizing.label'),    trigger: toPlainText($tStore('states.resizing.trigger')),               behavior: toPlainText($tStore('states.resizing.behavior'))    },
      { label: $tStore('states.virtualized.label'), trigger: toPlainText($tStore('states.virtualized.trigger')), behavior: toPlainText($tStore('states.virtualized.behavior'))},
    ]}
  />

  <!-- ── Propriedades ───────────────────────────────────────────── -->
  <DocsProps
    tables={[
      {
        title: $tStore('props.containerTitle'),
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'columns',                 type: 'ColumnDef<TData>[]',     defaultValue: '—',         required: 'Sim', description: toPlainText($tStore('props.table.columns')) },
          { name: 'data',                    type: 'TData[]',                defaultValue: '—',         required: 'Sim', description: toPlainText($tStore('props.table.data')) },
          { name: 'enableGlobalFilter',      type: 'boolean',                defaultValue: 'true',      required: 'Não', description: $tStore('props.table.enableGlobalFilter') },
          { name: 'globalFilterPlaceholder', type: 'string',                 defaultValue: '"Buscar..."', required: 'Não', description: $tStore('props.table.globalFilterPlaceholder') },
          { name: 'enableRowSelection',      type: 'boolean',                defaultValue: 'false',     required: 'Não', description: $tStore('props.table.enableRowSelection') },
          { name: 'enableColumnVisibility',  type: 'boolean',                defaultValue: 'true',      required: 'Não', description: $tStore('props.table.enableColumnVisibility') },
          { name: 'enableColumnFilters',     type: 'boolean',                defaultValue: 'false',     required: 'Não', description: toPlainText($tStore('props.table.enableColumnFilters')) },
          { name: 'enableColumnResizing',    type: 'boolean',                defaultValue: 'false',     required: 'Não', description: toPlainText($tStore('props.table.enableColumnResizing')) },
          { name: 'enableColumnOrdering',    type: 'boolean',                defaultValue: 'false',     required: 'Não', description: $tStore('props.table.enableColumnOrdering') },
          { name: 'enableColumnPinning',     type: 'boolean',                defaultValue: 'false',     required: 'Não', description: $tStore('props.table.enableColumnPinning') },
          { name: 'enablePagination',        type: 'boolean',                defaultValue: 'true',      required: 'Não', description: $tStore('props.table.enablePagination') },
          { name: 'virtualized',             type: 'boolean',                defaultValue: 'false',     required: 'Não', description: $tStore('props.table.virtualized') },
          { name: 'virtualRowHeight',        type: 'number',                 defaultValue: '36',        required: 'Não', description: $tStore('props.table.virtualRowHeight') },
          { name: 'maxHeight',               type: 'string',                 defaultValue: '"480px"',   required: 'Não', description: toPlainText($tStore('props.table.maxHeight')) },
          { name: 'pageSize',                type: 'number',                 defaultValue: '10',        required: 'Não', description: $tStore('props.table.pageSize') },
          { name: 'pageSizeOptions',         type: 'number[]',               defaultValue: '[10,20,50,100]', required: 'Não', description: toPlainText($tStore('props.table.pageSizeOptions')) },
          { name: 'emptyMessage',            type: 'string',                 defaultValue: '"Sem resultados."', required: 'Não', description: $tStore('props.table.emptyMessage') },
          { name: 'caption',                 type: 'string',                 defaultValue: '—',         required: 'Não', description: toPlainText($tStore('props.table.caption')) },
          { name: 'labels',                  type: 'Partial<DataTableLabels>', defaultValue: 'DATA_TABLE_LABELS_DEFAULT', required: 'Não', description: toPlainText($tStore('props.table.labels')) },
          { name: 'rowKey',                  type: '(row: TData, index: number) => string', defaultValue: '—', required: 'Não', description: toPlainText($tStore('props.table.rowKey')) },
          { name: 'rowLabel',                type: '(row: TData) => string', defaultValue: '—',         required: 'Não', description: toPlainText($tStore('props.table.rowLabel')) },
          { name: 'onCellEdit',              type: '(rowIndex, columnId, value) => void', defaultValue: '—', required: 'Não', description: toPlainText($tStore('props.table.onCellEdit')) },
          { name: 'onTableReady',            type: '(table: Table<TData>) => void',        defaultValue: '—', required: 'Não', description: $tStore('props.table.onTableReady') },
        ],
      },
      {
        title: $tStore('props.tooltipTitle'),
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'meta.filter',   type: '{ type: "text" | "select"; options?: string[]; placeholder?: string }', defaultValue: '—', required: 'Não', description: toPlainText($tStore('props.table.metaFilter')) },
          { name: 'meta.editable', type: 'boolean', defaultValue: 'false', required: 'Não', description: toPlainText($tStore('props.table.metaEditable')) },
        ],
      },
    ]}
    interfaceCode={interfaceCode}
    extensibilityTitle={$tStore('props.extensibilityTitle')}
    extensibilityNotes={stripHtml($tStore('props.extensibility'))}
  />

  <!-- ── Tokens ─────────────────────────────────────────────────── -->
  <DocsTokens
    cols={{
      token: $tStore('tokens.table.token'),
      value: $tStore('tokens.table.class'),
      description: $tStore('tokens.table.part'),
    }}
    items={[
      { token: '--border',           value: '.nds-data-table-scroll, .nds-table thead tr, .nds-table tbody tr', description: toPlainText($tStore('tokens.table.borderPart')) },
      { token: '--muted',            value: '.nds-data-table-tr:hover',    description: toPlainText($tStore('tokens.table.mutedPart'))           },
      { token: '--muted-foreground', value: '.nds-data-table-pagination-count', description: toPlainText($tStore('tokens.table.mutedForegroundPart')) },
      { token: '--primary',          value: '.nds-data-table-sort-btn:hover', description: toPlainText($tStore('tokens.table.primaryPart'))       },
      { token: '--background',       value: '.nds-data-table-th-pinned, .nds-data-table-td-pinned', description: toPlainText($tStore('tokens.table.backgroundPart')) },
      { token: '--ring',             value: '.nds-data-table-sort-btn:focus-visible', description: toPlainText($tStore('tokens.table.ringPart'))    },
    ]}
    customizationTitle={$tStore('tokens.customizationTitle')}
    customizationCode={codeCustomizationTokens}
  />

  <!-- ── Acessibilidade ─────────────────────────────────────────── -->
  <DocsAccessibility
    screenReaderTitle={$tNavStore('common.screenReader')}
    screenReaderItems={screenReaderItems}
    summary={stripHtml($tStore('accessibility.summary'))}
    items={[
      $tStore('accessibility.item1'),
      $tStore('accessibility.item2'),
      $tStore('accessibility.item3'),
      $tStore('accessibility.item4'),
      $tStore('accessibility.item5'),
      $tStore('accessibility.item6'),
    ]}
    keyboardTitle={$tStore('accessibility.keyboardTitle')}
    keyboardItems={[
      { key: 'Tab',    description: $tStore('accessibility.keyboard.tab')       },
      { key: 'Enter',  description: $tStore('accessibility.keyboard.enter')     },
      { key: 'Space',  description: $tStore('accessibility.keyboard.space')     },
      { key: 'Escape', description: $tStore('accessibility.keyboard.escape')    },
      { key: 'Arrow Up / Arrow Down',    description: toPlainText($tStore('accessibility.keyboard.arrowKeys')) },
    ]}
  />

  <!-- ── Relacionados ───────────────────────────────────────────── -->
  <DocsRelated componentSlug="data-table"
    items={[
      { name: 'Table',        description: $tStore('related.table'),        path: '?path=/docs/components-tables-table--docs'        },
      { name: 'Chart',        description: $tStore('related.chart'),        path: '?path=/docs/components-display-chart--docs'        },
      { name: 'Pagination',   description: $tStore('related.pagination'),   path: '?path=/docs/components-navigation-pagination--docs'   },
      { name: 'Checkbox',     description: $tStore('related.checkbox'),     path: '?path=/docs/components-form-checkbox--docs'     },
      { name: 'Input',        description: $tStore('related.input'),        path: '?path=/docs/components-form-input--docs'        },
      { name: 'DropdownMenu', description: $tStore('related.dropdownMenu'), path: '?path=/docs/components-navigation-dropdownmenu--docs' },
    ]}
  />

  <!-- ── Notas ──────────────────────────────────────────────────── -->
  <DocsNotes componentSlug="data-table"
    items={[
      { title: '', content: $tStore('notes.tip1') },
      { title: '', content: $tStore('notes.tip2') },
      { title: '', content: $tStore('notes.tip3') },
      { title: '', content: $tStore('notes.tip4') },
      { title: '', content: $tStore('notes.tip5') },
      { title: '', content: $tStore('notes.tip6') },
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
      { event: $tStore('analytics.table.pageView'),      trigger: toPlainText($tStore('analytics.table.pageViewTrigger')),      payload: $tStore('analytics.table.pageViewPayload')      },
      { event: $tStore('analytics.table.sectionViewed'), trigger: toPlainText($tStore('analytics.table.sectionViewedTrigger')), payload: $tStore('analytics.table.sectionViewedPayload') },
      { event: $tStore('analytics.table.langSwitch'),    trigger: toPlainText($tStore('analytics.table.langSwitchTrigger')),    payload: $tStore('analytics.table.langSwitchPayload')    },
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
        action: r.action,
        result: r.result,
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
        criterion: r.criterion,
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
