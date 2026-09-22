import { useCallback, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import { useActiveSection } from "@/lib/use-active-section";
import uiTranslations from "@/i18n/ui.json";
import dataTableTranslations from "@shared/content/data-table/translations.json";

import { DocsHeader }        from "@/components/docs/shared/sections/DocsHeader";
import { DocsPageLayout }    from "@/components/docs/shared/sections/DocsPageLayout";
import { DocsDemonstration } from "@/components/docs/shared/sections/DocsDemonstration";
import { DocsAnatomy }       from "@/components/docs/shared/sections/DocsAnatomy";
import { DocsWhenToUse }     from "@/components/docs/shared/sections/DocsWhenToUse";
import { DocsDoDont }        from "@/components/docs/shared/sections/DocsDoDont";
import { DocsImport }        from "@/components/docs/shared/sections/DocsImport";
import { DocsCompositions }  from "@/components/docs/shared/sections/DocsCompositions";
import { DocsStates }        from "@/components/docs/shared/sections/DocsStates";
import { DocsProps }         from "@/components/docs/shared/sections/DocsProps";
import { DocsTokens }        from "@/components/docs/shared/sections/DocsTokens";
import { DocsAccessibility } from "@/components/docs/shared/sections/DocsAccessibility";
import { DocsRelated }       from "@/components/docs/shared/sections/DocsRelated";
import { DocsNotes }         from "@/components/docs/shared/sections/DocsNotes";
import { DocsAnalytics }     from "@/components/docs/shared/sections/DocsAnalytics";
import { DocsTestes }        from "@/components/docs/shared/sections/DocsTestes";
import { stripHtml, toPlainText } from "@/lib/strip-html";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const priorityKeyMap: Record<string, string> = {
  high: "common.high",
  medium: "common.medium",
  low: "common.low",
};

/**
 * Índices dos `item<N>` que a seção publica, tirados das PRÓPRIAS chaves.
 *
 * Contar à mão envelhece em silêncio: o conteúdo compartilhado cresce nos três
 * idiomas e a lista da tela fica para trás sem nada ficar vermelho — foi assim
 * que dois testes funcionais e dois critérios de acessibilidade ficaram escritos
 * e invisíveis. Cravar o número novo repete o defeito daqui a um item.
 */
const itemIndices = (section: unknown): number[] =>
  Object.keys((section ?? {}) as Record<string, unknown>)
    .map((key) => /^item(\d+)$/.exec(key)?.[1])
    .filter((digits): digits is string => digits !== undefined)
    .map(Number)
    .sort((a, b) => a - b);

// ─── Dados de exemplo (preview do componente real) ───────────────────────────

/**
 * A linha carrega CHAVE, não rótulo.
 *
 * O texto vem de `demonstration.labels`, resolvido na hora de montar a coluna —
 * mesma regra do payload de analytics: valor estável no dado, tradução só na
 * borda. Com o rótulo dentro da linha, a tabela ficava em português no meio de
 * uma página em inglês, e o mapa de variante do Badge só funcionava enquanto
 * ninguém reescrevesse a tradução.
 */
type InvoiceStatus = "paid" | "pending" | "canceled";

type InvoiceMethod = "pix" | "bankSlip" | "creditCard" | "debitCard" | "transfer";

type Invoice = {
  id: string;
  customer: string;
  status: InvoiceStatus;
  method: InvoiceMethod;
  amount: number;
};

const sampleInvoices: Invoice[] = [
  { id: "INV-001", customer: "Ana Souza",    status: "paid",     method: "pix",        amount: 250 },
  { id: "INV-002", customer: "Bruno Lima",   status: "pending",  method: "bankSlip",   amount: 150 },
  { id: "INV-003", customer: "Carla Mendes", status: "canceled", method: "creditCard", amount: 350 },
  { id: "INV-004", customer: "Diego Faria",  status: "paid",     method: "debitCard",  amount: 450 },
  { id: "INV-005", customer: "Eva Oliveira", status: "pending",  method: "transfer",   amount: 200 },
];

// Caminho INTEIRO e escrito por extenso, e não interpolado: quem procura por
// `demonstration.labels.paid` na árvore precisa achar esta página. Chave montada
// em tempo de execução some da busca — e some também do portão que compara o
// conjunto de rótulos das cinco demonstrações.
const statusLabelKey: Record<InvoiceStatus, string> = {
  paid: "demonstration.labels.paid",
  pending: "demonstration.labels.pending",
  canceled: "demonstration.labels.canceled",
};

const methodLabelKey: Record<InvoiceMethod, string> = {
  pix: "demonstration.labels.methodPix",
  bankSlip: "demonstration.labels.methodBankSlip",
  creditCard: "demonstration.labels.methodCreditCard",
  debitCard: "demonstration.labels.methodDebitCard",
  transfer: "demonstration.labels.methodTransfer",
};

const statusVariantMap: Record<InvoiceStatus, "default" | "warning" | "destructive"> = {
  paid: "default",
  pending: "warning",
  canceled: "destructive",
};

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

// ─── Nav ─────────────────────────────────────────────────────────────────────

const getNavGroups = (t: (key: string) => string) => [
  {
    label: t("nav.overview"),
    sections: [
      { id: "demonstracao", label: t("nav.demonstration") },
      { id: "anatomia",     label: t("nav.anatomy") },
      { id: "quando-usar",  label: t("nav.usage") },
      { id: "do-dont",      label: t("nav.doDont") },
    ],
  },
  {
    label: t("nav.techRef"),
    sections: [
      { id: "importacao",   label: t("nav.import") },
      { id: "variantes",    label: t("nav.variants") },
      { id: "composicoes",  label: "Composições" },
      { id: "estados",      label: t("nav.states") },
      { id: "propriedades", label: t("nav.props") },
      { id: "tokens",       label: t("nav.tokens") },
    ],
  },
  {
    label: t("nav.context"),
    sections: [
      { id: "acessibilidade", label: t("nav.accessibility") },
      { id: "relacionados",   label: t("nav.related") },
      { id: "notas",          label: t("nav.notes") },
    ],
  },
  {
    label: t("nav.quality"),
    sections: [
      { id: "analytics", label: t("nav.analytics") },
      { id: "testes",    label: t("nav.testes") },
    ],
  },
];

// ─── Componente principal ────────────────────────────────────────────────────

export function DataTableDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(dataTableTranslations);

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria.
  // O `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
  const screenReaderItems = useMemo(
    () =>
      Object.entries(
        (dataTableTranslations as unknown as Record<
          string,
          { accessibility?: { screenReader?: Record<string, string> } }
        >)[locale]?.accessibility?.screenReader ?? {},
      )
        .filter(([key]) => key !== "title")
        .map(([, value]) => value),
    [locale],
  );

  // Quantos itens cada lista de testes publica hoje, perguntado ao dicionário.
  const testesIndices = useMemo(() => {
    const testes = (dataTableTranslations as unknown as Record<
      string,
      { testes?: Record<string, unknown> }
    >)[locale]?.testes;
    return {
      functional: itemIndices(testes?.functional),
      accessibility: itemIndices(testes?.accessibility),
      visual: itemIndices(testes?.visual),
    };
  }, [locale]);

  const navGroups = useMemo(() => getNavGroups(tNav), [tNav]);
  const allIds = useMemo(
    () => navGroups.flatMap((g) => g.sections.map((s) => s.id)),
    [navGroups]
  );

  useSeoEffect({
    title: tContent("seo.title"),
    description: tContent("seo.description"),
    locale,
    componentSlug: "data-table",
    aiSummary: tContent("seo.aiSummary"),
    aiEntities: tContent("seo.aiEntities"),
    breadcrumb: [
      { name: "Components", item: "/components" },
      { name: tContent("category"), item: "/components/display" },
      { name: tContent("title") },
    ],
  });

  useEffect(() => {
    track("docs_page_view", {
      component_name: "data-table",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "data-table",
        locale,
      });
    },
    [locale]
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  // ─── Columns memoizadas ─────────────────────────────────────────────────────

  const demoColumns = useMemo<DataTableColumn<Invoice>[]>(
    () => [
      { accessorKey: "id", header: tContent("demonstration.labels.invoice"), size: 110 },
      { accessorKey: "customer", header: tContent("demonstration.labels.customer"), size: 180 },
      {
        // `accessorFn` e não `accessorKey`: o valor que a busca varre e a
        // ordenação compara tem de ser o TEXTO que a pessoa lê. Com a chave
        // crua no acessor, procurar "Pago" não acharia nada e a ordenação
        // seguiria o alfabeto do identificador, igual nos três idiomas.
        id: "status",
        accessorFn: (row) => tContent(statusLabelKey[row.status]),
        header: tContent("demonstration.labels.status"),
        size: 140,
        cell: ({ row }) => (
          <Badge variant={statusVariantMap[row.original.status]}>
            {tContent(statusLabelKey[row.original.status])}
          </Badge>
        ),
      },
      {
        id: "method",
        accessorFn: (row) => tContent(methodLabelKey[row.method]),
        header: tContent("demonstration.labels.method"),
        size: 180,
      },
      {
        accessorKey: "amount",
        header: tContent("demonstration.labels.amount"),
        size: 130,
        // Coluna numérica: alinha à direita na célula E no cabeçalho
        // (guideline 20, §coluna numérica). Quem escreve as classes é o
        // primitivo, porque o `<th>` não passa por aqui.
        meta: { numeric: true },
        cell: ({ row }) => (
          <span className="nds-font-medium nds-tabular-nums">
            {currency.format(row.original.amount)}
          </span>
        ),
      },
    ],
    [tContent]
  );

  // ─── Rótulos e nome acessível dos exemplos ──────────────────────────────────

  /*
   * O conjunto COMPLETO de rótulos, e não só o placeholder da busca.
   *
   * Sem ele o rodapé ficava em pt-BR fixo em `en` e `es` — "Linhas por
   * página", "Página X de Y", "Primeira página" — porque o componente cai nos
   * valores padrão, que são o idioma em que o design system nasce. Cada
   * caminho vai POR EXTENSO: chave interpolada some da busca de quem lê a
   * árvore e do portão `demonstration_labels_divergent`.
   */
  const demoLabels = useMemo(
    () => ({
      columns: tContent("demonstration.labels.columns"),
      rowsPerPage: tContent("demonstration.labels.rowsPerPage"),
      page: tContent("demonstration.labels.page"),
      pageOf: tContent("demonstration.labels.of"),
      firstPage: tContent("demonstration.labels.firstPage"),
      prevPage: tContent("demonstration.labels.prevPage"),
      nextPage: tContent("demonstration.labels.nextPage"),
      lastPage: tContent("demonstration.labels.lastPage"),
    }),
    [tContent]
  );

  /*
   * Nome acessível de uma tabela do exemplo.
   *
   * A legenda é o nome da tabela para o leitor de tela. Sem ela a página
   * chegava como "tabela, 6 colunas" onze vezes seguidas; com a MESMA legenda
   * em todas, continuaria indistinguível — por isso o sufixo por exemplo.
   * Também é ela que nomeia a região rolável, que lê a legenda.
   */
  const caption = useCallback(
    (suffix: string) =>
      `${tContent("demonstration.labels.caption")} — ${toPlainText(suffix)}`,
    [tContent]
  );

  // ─── Code strings ───────────────────────────────────────────────────────────

  const codeImportBasic = `import { DataTable, type DataTableColumn } from "@/components/ui/data-table";`;
  const codeImportWithMeta = `import { DataTable, type DataTableColumn } from "@/components/ui/data-table";

// meta.filter e meta.editable já vêm tipados em DataTableColumn: os metadados
// moram no conjunto de recursos do próprio componente. Não é preciso declarar
// nada sobre a biblioteca — e é melhor assim, porque a declaração global valia
// para toda tabela do projeto, não só para esta.
const columns: DataTableColumn<Invoice>[] = [
  {
    accessorKey: "cliente",
    header: "Cliente",
    meta: { filter: { type: "text" } },
  },
  { accessorKey: "valor", header: "Valor", meta: { editable: true } },
];`;

  const codeGlobalFilter = `<DataTable
  columns={columns}
  data={data}
  enableGlobalFilter
  globalFilterPlaceholder="Buscar fatura, cliente, método..."
/>`;

  const codeColumnFilters = `const columns: DataTableColumn<Invoice>[] = [
  { accessorKey: "customer", header: "Cliente", meta: { filter: { type: "text" } } },
  {
    accessorKey: "status",
    header: "Status",
    meta: { filter: { type: "select", options: ["Pago", "Pendente", "Cancelado"] } },
  },
];

<DataTable columns={columns} data={data} enableColumnFilters />`;

  const codeRowSelection = `<DataTable
  columns={columns}
  data={data}
  enableRowSelection
  onTableReady={(table) => {
    const selected = table.getSelectedRowModel().rows;
    // disparar ações em lote
  }}
/>`;

  const codeResize = `const columns: DataTableColumn<Invoice>[] = [
  { accessorKey: "id", header: "Fatura", size: 110 },
  { accessorKey: "customer", header: "Cliente", size: 200 },
];

<DataTable columns={columns} data={data} enableColumnResizing />`;

  const codeReorder = `<DataTable
  columns={columns}
  data={data}
  enableColumnOrdering
/>`;

  const codePin = `<DataTable
  columns={columns}
  data={data}
  enableColumnPinning
/>`;

  const codeEdit = `const columns: DataTableColumn<Invoice>[] = [
  { accessorKey: "customer", header: "Cliente", meta: { editable: true } },
  { accessorKey: "amount", header: "Valor", meta: { editable: true } },
];

<DataTable
  columns={columns}
  data={data}
  onCellEdit={(rowIndex, columnId, value) => {
    setData((rows) =>
      rows.map((r, i) => (i === rowIndex ? { ...r, [columnId]: value } : r))
    );
  }}
/>`;

  const codeVirtual = `<DataTable
  columns={columns}
  data={bigData}
  virtualized
  maxHeight="400px"
/>`;

  const codePagination = `<DataTable
  columns={columns}
  data={data}
  enablePagination
  pageSize={10}
  pageSizeOptions={[10, 20, 50, 100]}
/>`;

  const codeVisibility = `<DataTable
  columns={columns}
  data={data}
  enableColumnVisibility
/>`;

  const codeCustomizationTokens = `/* themes/*.css — sobrescrever tokens reflete em todos os recursos */
:root {
  --border: 220 13% 91%;
  --muted: 220 14% 96%;
  --muted-foreground: 220 9% 46%;
  --primary: 222 47% 11%;
  --ring: 215 20% 65%;
}`;

  const interfaceCode = `export interface DataTableProps<TData> {
  columns: DataTableColumn<TData>[]
  data: TData[]
  enableGlobalFilter?: boolean
  globalFilterPlaceholder?: string
  enableRowSelection?: boolean
  enableColumnVisibility?: boolean
  enableColumnFilters?: boolean
  enableColumnResizing?: boolean
  enableColumnOrdering?: boolean
  enableColumnPinning?: boolean
  enablePagination?: boolean
  virtualized?: boolean
  virtualRowHeight?: number
  maxHeight?: string
  pageSize?: number
  pageSizeOptions?: number[]
  emptyMessage?: string
  caption?: string
  rowKey?: (row: TData, index: number) => string
  rowLabel?: (row: TData) => string
  labels?: Partial<DataTableLabels>
  className?: string
  onTableReady?: (table: Table<DataTableFeatures, TData>) => void
  onCellEdit?: (rowIndex: number, columnId: string, value: unknown) => void
}

// O meta de coluna, já embutido em DataTableColumn
type DataTableColumnMeta = {
  filter?: { type: "text" | "select"; options?: string[]; placeholder?: string }
  editable?: boolean
  // Coluna numérica: alinha à direita na célula e no cabeçalho
  numeric?: boolean
}`;

  // ─── Previews reutilizáveis ─────────────────────────────────────────────────

  /*
   * O exemplo que os recursos sem preview proprio reutilizam.
   *
   * E FUNCAO por causa da legenda: cada recurso precisa do proprio nome
   * acessivel, e um no unico nao teria como carregar sete nomes diferentes.
   */
  const previewBasic = (suffix: string) => (
    <DataTable<Invoice>
      columns={demoColumns}
      data={sampleInvoices}
      enableGlobalFilter={false}
      enableColumnVisibility={false}
      enablePagination={false}
      labels={demoLabels}
      emptyMessage={tContent("demonstration.labels.noResults")}
      caption={caption(suffix)}
    />
  );

  return (
    <DocsPageLayout
      navGroups={navGroups}
      activeSection={activeId}
      header={
        <DocsHeader
          title={tContent("title")}
          description={tContent("description")}
          category={tContent("category")}
          type={tContent("type")}
          installNote="npm install @tanstack/react-table @tanstack/react-virtual"
        />
      }
    >
      {/* ── Demonstração ──────────────────────────────────────────── */}
      <DocsDemonstration >
        <div className="nds-w-full">
          <DataTable<Invoice>
            columns={demoColumns}
            data={sampleInvoices}
            enableRowSelection
            enableGlobalFilter
            globalFilterPlaceholder={tContent("demonstration.labels.search")}
            enablePagination={false}
            labels={demoLabels}
            emptyMessage={tContent("demonstration.labels.noResults")}
            caption={caption(tNav("nav.demonstration"))}
          />
        </div>
      </DocsDemonstration>

      {/* ── Anatomia ──────────────────────────────────────────────── */}
      <DocsAnatomy
        items={[
          tContent("anatomy.item1"),
          tContent("anatomy.item2"),
          tContent("anatomy.item3"),
          tContent("anatomy.item4"),
          tContent("anatomy.item5"),
          tContent("anatomy.item6"),
        ]}
        structureLabel={tContent("anatomy.structureLabel")}
        structureCode={tContent("anatomy.structureCode")}
      />

      {/* ── Quando Usar ───────────────────────────────────────────── */}
      <DocsWhenToUse
        guidelines={{
          title: tContent("usage.guidelines.title"),
          items: [
            tContent("usage.guidelines.item1"),
            tContent("usage.guidelines.item2"),
            tContent("usage.guidelines.item3"),
            tContent("usage.guidelines.item4"),
            tContent("usage.guidelines.item5"),
            tContent("usage.guidelines.item6"),
          ],
        }}
        scenarios={{
          title: tContent("usage.scenarios.title"),
          cols: {
            scenario: tContent("usage.scenarios.cols.scenario"),
            use: tContent("usage.scenarios.cols.use"),
            alternative: tContent("usage.scenarios.cols.alternative"),
          },
          items: [
            { s: toPlainText(tContent("usage.scenarios.item1.s")), u: tContent("usage.scenarios.item1.u"), a: tContent("usage.scenarios.item1.a") },
            { s: toPlainText(tContent("usage.scenarios.item2.s")), u: tContent("usage.scenarios.item2.u"), a: tContent("usage.scenarios.item2.a") },
            { s: toPlainText(tContent("usage.scenarios.item3.s")), u: tContent("usage.scenarios.item3.u"), a: tContent("usage.scenarios.item3.a") },
            { s: toPlainText(tContent("usage.scenarios.item4.s")), u: tContent("usage.scenarios.item4.u"), a: tContent("usage.scenarios.item4.a") },
            { s: toPlainText(tContent("usage.scenarios.item5.s")), u: tContent("usage.scenarios.item5.u"), a: tContent("usage.scenarios.item5.a") },
            { s: toPlainText(tContent("usage.scenarios.item6.s")), u: tContent("usage.scenarios.item6.u"), a: tContent("usage.scenarios.item6.a") },
          ],
        }}
        uxWriting={{
          title: tContent("usage.uxWriting.title"),
          cols: {
            element: tContent("usage.uxWriting.table.element"),
            rules: tContent("usage.uxWriting.table.rules"),
            do: tContent("usage.uxWriting.table.correct"),
            dont: tContent("usage.uxWriting.table.avoid"),
          },
          items: [
            {
              element: tContent("usage.uxWriting.table.columnHeader.name"),
              rules: tContent("usage.uxWriting.table.columnHeader.format"),
              do: tContent("usage.uxWriting.table.columnHeader.good"),
              dont: tContent("usage.uxWriting.table.columnHeader.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.filterPlaceholder.name"),
              rules: tContent("usage.uxWriting.table.filterPlaceholder.format"),
              do: tContent("usage.uxWriting.table.filterPlaceholder.good"),
              dont: tContent("usage.uxWriting.table.filterPlaceholder.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.emptyState.name"),
              rules: tContent("usage.uxWriting.table.emptyState.format"),
              do: tContent("usage.uxWriting.table.emptyState.good"),
              dont: tContent("usage.uxWriting.table.emptyState.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.selectionLabel.name"),
              rules: tContent("usage.uxWriting.table.selectionLabel.format"),
              do: tContent("usage.uxWriting.table.selectionLabel.good"),
              dont: tContent("usage.uxWriting.table.selectionLabel.bad"),
            },
          ],
        }}
        do={{
          title: tContent("usage.do.title"),
          items: [
            tContent("usage.do.item1"),
            tContent("usage.do.item2"),
            tContent("usage.do.item3"),
            tContent("usage.do.item4"),
          ],
        }}
        dont={{
          title: tContent("usage.dont.title"),
          items: [
            tContent("usage.dont.item1"),
            tContent("usage.dont.item2"),
            tContent("usage.dont.item3"),
          ],
        }}
      />

      {/* ── Do & Don't ────────────────────────────────────────────── */}
      <DocsDoDont
        pairs={[
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <DataTable<Invoice>
                columns={demoColumns}
                data={sampleInvoices.slice(0, 3)}
                enableGlobalFilter
                globalFilterPlaceholder={tContent("demonstration.labels.search")}
                enableColumnVisibility={false}
                enablePagination={false}
                labels={demoLabels}
                emptyMessage={tContent("demonstration.labels.noResults")}
                caption={caption(tContent("doDont.pair1.do"))}
              />
            ),
            dontPreview: (
              <DataTable<Invoice>
                columns={demoColumns}
                data={sampleInvoices.slice(0, 3)}
                enableGlobalFilter
                globalFilterPlaceholder="Buscar..."
                enableColumnVisibility={false}
                enablePagination={false}
                labels={demoLabels}
                emptyMessage={tContent("demonstration.labels.noResults")}
                caption={caption(tContent("doDont.pair1.dont"))}
              />
            ),
            doCaption: toPlainText(tContent("doDont.pair1.do")),
            dontCaption: toPlainText(tContent("doDont.pair1.dont")),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <DataTable<Invoice>
                columns={demoColumns}
                data={sampleInvoices}
                virtualized
                maxHeight="180px"
                enableGlobalFilter={false}
                enableColumnVisibility={false}
                labels={demoLabels}
                emptyMessage={tContent("demonstration.labels.noResults")}
                caption={caption(tContent("doDont.pair2.do"))}
              />
            ),
            dontPreview: (
              <DataTable<Invoice>
                columns={demoColumns}
                data={sampleInvoices}
                enablePagination
                pageSize={3}
                enableGlobalFilter={false}
                enableColumnVisibility={false}
                labels={demoLabels}
                emptyMessage={tContent("demonstration.labels.noResults")}
                caption={caption(tContent("doDont.pair2.dont"))}
              />
            ),
            doCaption: toPlainText(tContent("doDont.pair2.do")),
            dontCaption: toPlainText(tContent("doDont.pair2.dont")),
          },
        ]}
      />

      {/* ── Importação ────────────────────────────────────────────── */}
      <DocsImport componentSlug="data-table"
        description={tContent("import.basic")}
        code={codeImportBasic}
        secondaryDescription={tContent("import.withMeta")}
        secondaryCode={codeImportWithMeta}
      />

      {/* ── Recursos (Variants) ───────────────────────────────────── */}
      <DocsCompositions
        id="variantes"
        note={stripHtml(tContent("variants.note"))}
        useWhenLabel={tNav("common.useWhen")}
        componentSlug="data-table"
        items={[
          {
            trackId: "globalFilter",
            name: tContent("variants.items.globalFilter.name"),
            description: tContent("variants.items.globalFilter.description"),
            code: codeGlobalFilter,
            preview: previewBasic(tContent("variants.items.globalFilter.name")),
          },
          {
            trackId: "columnFilters",
            name: tContent("variants.items.columnFilters.name"),
            description: tContent("variants.items.columnFilters.description"),
            code: codeColumnFilters,
            preview: previewBasic(tContent("variants.items.columnFilters.name")),
          },
          {
            trackId: "selection",
            name: tContent("variants.items.selection.name"),
            description: tContent("variants.items.selection.description"),
            code: codeRowSelection,
            preview: (
              <DataTable<Invoice>
                columns={demoColumns}
                data={sampleInvoices.slice(0, 3)}
                enableRowSelection
                enableGlobalFilter={false}
                enableColumnVisibility={false}
                enablePagination={false}
                labels={demoLabels}
                emptyMessage={tContent("demonstration.labels.noResults")}
                caption={caption(tContent("variants.items.selection.name"))}
              />
            ),
          },
          {
            trackId: "visibility",
            name: tContent("variants.items.visibility.name"),
            description: tContent("variants.items.visibility.description"),
            code: codeVisibility,
            preview: previewBasic(tContent("variants.items.visibility.name")),
          },
          {
            trackId: "resize",
            name: tContent("variants.items.resize.name"),
            description: tContent("variants.items.resize.description"),
            code: codeResize,
            preview: previewBasic(tContent("variants.items.resize.name")),
          },
          {
            trackId: "reorder",
            name: tContent("variants.items.reorder.name"),
            description: tContent("variants.items.reorder.description"),
            code: codeReorder,
            preview: previewBasic(tContent("variants.items.reorder.name")),
          },
          {
            trackId: "pagination",
            name: tContent("variants.items.pagination.name"),
            description: tContent("variants.items.pagination.description"),
            code: codePagination,
            preview: previewBasic(tContent("variants.items.pagination.name")),
          },
          {
            trackId: "editableSheet",
            name: tContent("variants.items.editableSheet.name"),
            description: tContent("variants.items.editableSheet.description"),
            useWhen: tContent("variants.items.editableSheet.use"),
            code: codeEdit,
            preview: previewBasic(tContent("variants.items.editableSheet.name")),
          },
          {
            trackId: "virtualizedLog",
            name: tContent("variants.items.virtualizedLog.name"),
            description: tContent("variants.items.virtualizedLog.description"),
            useWhen: tContent("variants.items.virtualizedLog.use"),
            code: codeVirtual,
            preview: (
              <DataTable<Invoice>
                columns={demoColumns}
                data={sampleInvoices}
                virtualized
                maxHeight="180px"
                enableGlobalFilter={false}
                enableColumnVisibility={false}
                labels={demoLabels}
                emptyMessage={tContent("demonstration.labels.noResults")}
                caption={caption(tContent("variants.items.virtualizedLog.name"))}
              />
            ),
          },
          {
            trackId: "pinnedKey",
            name: tContent("variants.items.pinnedKey.name"),
            description: tContent("variants.items.pinnedKey.description"),
            useWhen: tContent("variants.items.pinnedKey.use"),
            code: codePin,
            preview: previewBasic(tContent("variants.items.pinnedKey.name")),
          },
        ]}
      />

      {/* ── Composições ───────────────────────────────────────────── */}
      <DocsCompositions
        useWhenLabel={tNav("common.useWhen")}
        componentSlug="data-table"
        items={[
          {
            trackId: "selectionWithActions",
            name: tContent("variants.compositions.selectionWithActions.name"),
            description: tContent("variants.compositions.selectionWithActions.description"),
            useWhen: tContent("variants.compositions.selectionWithActions.use"),
            code: codeRowSelection,
            preview: (
              <DataTable<Invoice>
                columns={demoColumns}
                data={sampleInvoices.slice(0, 3)}
                enableRowSelection
                enableGlobalFilter={false}
                enableColumnVisibility={false}
                enablePagination={false}
                labels={demoLabels}
                emptyMessage={tContent("demonstration.labels.noResults")}
                caption={caption(
                  tContent("variants.compositions.selectionWithActions.name")
                )}
              />
            ),
          },
        ]}
      />

      {/* ── Estados ───────────────────────────────────────────────── */}
      <DocsStates
        cols={{
          state: tContent("states.cols.state"),
          trigger: toPlainText(tContent("states.cols.trigger")),
          behavior: toPlainText(tContent("states.cols.behavior")),
        }}
        items={[
          {
            label: tContent("states.empty.label"),
            trigger: toPlainText(tContent("states.empty.trigger")),
            behavior: toPlainText(tContent("states.empty.behavior")),
          },
          {
            label: tContent("states.sorted.label"),
            trigger: toPlainText(tContent("states.sorted.trigger")),
            behavior: toPlainText(tContent("states.sorted.behavior")),
          },
          {
            label: tContent("states.filtered.label"),
            trigger: toPlainText(tContent("states.filtered.trigger")),
            behavior: toPlainText(tContent("states.filtered.behavior")),
          },
          {
            label: tContent("states.selected.label"),
            trigger: toPlainText(tContent("states.selected.trigger")),
            behavior: toPlainText(tContent("states.selected.behavior")),
          },
          {
            label: tContent("states.editing.label"),
            trigger: toPlainText(tContent("states.editing.trigger")),
            behavior: toPlainText(tContent("states.editing.behavior")),
          },
          {
            label: tContent("states.resizing.label"),
            trigger: toPlainText(tContent("states.resizing.trigger")),
            behavior: toPlainText(tContent("states.resizing.behavior")),
          },
          {
            label: tContent("states.virtualized.label"),
            trigger: toPlainText(tContent("states.virtualized.trigger")),
            behavior: toPlainText(tContent("states.virtualized.behavior")),
          },
        ]}
      />

      {/* ── Propriedades ──────────────────────────────────────────── */}
      <DocsProps
        tables={[
          {
            title: tContent("props.containerTitle"),
            cols: {
              prop: tContent("props.table.prop"),
              type: tContent("props.table.type"),
              default: tContent("props.table.default"),
              required: tContent("props.table.required"),
              description: tContent("props.table.description"),
            },
            items: [
              { name: "columns", type: "ColumnDef<TData>[]", defaultValue: "—", required: "Sim", description: toPlainText(tContent("props.table.columns")) },
              { name: "data", type: "TData[]", defaultValue: "—", required: "Sim", description: toPlainText(tContent("props.table.data")) },
              { name: "enableGlobalFilter", type: "boolean", defaultValue: "true", required: "Não", description: tContent("props.table.enableGlobalFilter") },
              { name: "globalFilterPlaceholder", type: "string", defaultValue: '"Buscar..."', required: "Não", description: tContent("props.table.globalFilterPlaceholder") },
              { name: "enableRowSelection", type: "boolean", defaultValue: "false", required: "Não", description: tContent("props.table.enableRowSelection") },
              { name: "enableColumnVisibility", type: "boolean", defaultValue: "true", required: "Não", description: tContent("props.table.enableColumnVisibility") },
              { name: "enableColumnFilters", type: "boolean", defaultValue: "false", required: "Não", description: toPlainText(tContent("props.table.enableColumnFilters")) },
              { name: "enableColumnResizing", type: "boolean", defaultValue: "false", required: "Não", description: toPlainText(tContent("props.table.enableColumnResizing")) },
              { name: "enableColumnOrdering", type: "boolean", defaultValue: "false", required: "Não", description: tContent("props.table.enableColumnOrdering") },
              { name: "enableColumnPinning", type: "boolean", defaultValue: "false", required: "Não", description: tContent("props.table.enableColumnPinning") },
              { name: "enablePagination", type: "boolean", defaultValue: "true", required: "Não", description: tContent("props.table.enablePagination") },
              { name: "virtualized", type: "boolean", defaultValue: "false", required: "Não", description: tContent("props.table.virtualized") },
              { name: "virtualRowHeight", type: "number", defaultValue: "36", required: "Não", description: tContent("props.table.virtualRowHeight") },
              { name: "maxHeight", type: "string", defaultValue: '"480px"', required: "Não", description: toPlainText(tContent("props.table.maxHeight")) },
              { name: "pageSize", type: "number", defaultValue: "10", required: "Não", description: tContent("props.table.pageSize") },
              { name: "pageSizeOptions", type: "number[]", defaultValue: "[10, 20, 50, 100]", required: "Não", description: toPlainText(tContent("props.table.pageSizeOptions")) },
              { name: "emptyMessage", type: "string", defaultValue: '"Sem resultados."', required: "Não", description: tContent("props.table.emptyMessage") },
              { name: "caption", type: "string", defaultValue: "—", required: "Não", description: tContent("props.table.caption") },
              { name: "labels", type: "Partial<DataTableLabels>", defaultValue: "DATA_TABLE_LABELS_DEFAULT", required: "Não", description: tContent("props.table.labels") },
              { name: "rowKey", type: "(row: TData, index: number) => string", defaultValue: "—", required: "Não", description: tContent("props.table.rowKey") },
              { name: "rowLabel", type: "(row: TData) => string", defaultValue: "—", required: "Não", description: tContent("props.table.rowLabel") },
              { name: "onCellEdit", type: "(rowIndex, columnId, value) => void", defaultValue: "—", required: "Não", description: toPlainText(tContent("props.table.onCellEdit")) },
              { name: "onTableReady", type: "(table: Table<TData>) => void", defaultValue: "—", required: "Não", description: tContent("props.table.onTableReady") },
            ],
          },
          {
            title: tContent("props.tooltipTitle"),
            cols: {
              prop: tContent("props.table.prop"),
              type: tContent("props.table.type"),
              default: tContent("props.table.default"),
              required: tContent("props.table.required"),
              description: tContent("props.table.description"),
            },
            items: [
              { name: "meta.filter", type: '{ type: "text" | "select"; options?: string[] }', defaultValue: "—", required: "Não", description: toPlainText(tContent("props.table.metaFilter")) },
              { name: "meta.editable", type: "boolean", defaultValue: "false", required: "Não", description: toPlainText(tContent("props.table.metaEditable")) },
            ],
          },
        ]}
        interfaceCode={interfaceCode}
        extensibilityTitle={tContent("props.extensibilityTitle")}
        extensibilityNotes={tContent("props.extensibility")}
      />

      {/* ── Tokens ────────────────────────────────────────────────── */}
      <DocsTokens
        cols={{
          token: tContent("tokens.table.token"),
          value: tContent("tokens.table.class"),
          description: tContent("tokens.table.part"),
        }}
        items={[
          { token: "--border", value: toPlainText(tContent("tokens.table.border")), description: tContent("tokens.table.borderPart") },
          { token: "--muted", value: toPlainText(tContent("tokens.table.muted")), description: tContent("tokens.table.mutedPart") },
          { token: "--muted-foreground", value: toPlainText(tContent("tokens.table.mutedForeground")), description: tContent("tokens.table.mutedForegroundPart") },
          { token: "--primary", value: toPlainText(tContent("tokens.table.primary")), description: tContent("tokens.table.primaryPart") },
          { token: "--background", value: toPlainText(tContent("tokens.table.background")), description: tContent("tokens.table.backgroundPart") },
          { token: "--ring", value: toPlainText(tContent("tokens.table.ring")), description: tContent("tokens.table.ringPart") },
        ]}
        customizationTitle={tContent("tokens.customizationTitle")}
        customizationCode={codeCustomizationTokens}
      />

      {/* ── Acessibilidade ────────────────────────────────────────── */}
      <DocsAccessibility
        screenReaderTitle={tNav("common.screenReader")}
        screenReaderItems={screenReaderItems}
        summary={tContent("accessibility.summary")}
        items={[
          tContent("accessibility.item1"),
          tContent("accessibility.item2"),
          tContent("accessibility.item3"),
          tContent("accessibility.item4"),
          tContent("accessibility.item5"),
          tContent("accessibility.item6"),
        ]}
        keyboardTitle={tContent("accessibility.keyboardTitle")}
        keyboardItems={[
          { key: "Tab",    description: tContent("accessibility.keyboard.tab") },
          { key: "Enter",  description: tContent("accessibility.keyboard.enter") },
          { key: "Space",  description: tContent("accessibility.keyboard.space") },
          { key: "Escape", description: tContent("accessibility.keyboard.escape") },
          { key: "Arrow Up / Arrow Down", description: toPlainText(tContent("accessibility.keyboard.arrowKeys")) },
        ]}
      />

      {/* ── Relacionados ──────────────────────────────────────────── */}
      <DocsRelated componentSlug="data-table"
        items={[
          { name: "Table",         description: toPlainText(tContent("related.table")),         path: "?path=/docs/components-tables-table--docs" },
          { name: "Chart",         description: toPlainText(tContent("related.chart")),         path: "?path=/docs/components-display-chart--docs" },
          { name: "Pagination",    description: toPlainText(tContent("related.pagination")),    path: "?path=/docs/components-navigation-pagination--docs" },
          { name: "Checkbox",      description: toPlainText(tContent("related.checkbox")),      path: "?path=/docs/components-form-checkbox--docs" },
          { name: "Input",         description: toPlainText(tContent("related.input")),         path: "?path=/docs/components-form-input--docs" },
          { name: "DropdownMenu",  description: toPlainText(tContent("related.dropdownMenu")),  path: "?path=/docs/components-navigation-dropdownmenu--docs" },
        ]}
      />

      {/* ── Notas ─────────────────────────────────────────────────── */}
      <DocsNotes componentSlug="data-table"
        items={[
          { title: "", content: tContent("notes.tip1") },
          { title: "", content: tContent("notes.tip2") },
          { title: "", content: tContent("notes.tip3") },
          { title: "", content: tContent("notes.tip4") },
          { title: "", content: tContent("notes.tip5") },
          { title: "", content: tContent("notes.tip6") },
        ]}
      />

      {/* ── Analytics ─────────────────────────────────────────────── */}
      <DocsAnalytics
        cols={{
          event: tContent("analytics.table.event"),
          trigger: toPlainText(tContent("analytics.table.trigger")),
          payload: tContent("analytics.table.payload"),
        }}
        items={[
          {
            event: tContent("analytics.table.pageView"),
            trigger: toPlainText(tContent("analytics.table.pageViewTrigger")),
            payload: tContent("analytics.table.pageViewPayload"),
          },
          {
            event: tContent("analytics.table.sectionViewed"),
            trigger: toPlainText(tContent("analytics.table.sectionViewedTrigger")),
            payload: tContent("analytics.table.sectionViewedPayload"),
          },
          {
            event: tContent("analytics.table.langSwitch"),
            trigger: toPlainText(tContent("analytics.table.langSwitchTrigger")),
            payload: tContent("analytics.table.langSwitchPayload"),
          },
        ]}
      />

      {/* ── Testes ────────────────────────────────────────────────── */}
      <DocsTestes
        functional={{
          title: tContent("testes.functional.title"),
          cols: {
            action: tNav("common.userAction"),
            result: tNav("common.expectedResult"),
            priority: tNav("common.priority"),
          },
          items: testesIndices.functional.map((n) => ({
            action: tContent(`testes.functional.item${n}.action`),
            result: tContent(`testes.functional.item${n}.result`),
            priority: tNav(priorityKeyMap[tContent(`testes.functional.item${n}.priority`)] ?? "common.medium"),
          })),
        }}
        accessibility={{
          title: tContent("testes.accessibility.title"),
          cols: {
            criterion: tNav("common.criterion"),
            level: "WCAG",
            how: tNav("common.howToVerify"),
          },
          items: testesIndices.accessibility.map((n) => ({
            criterion: tContent(`testes.accessibility.item${n}.criterion`),
            level: tContent(`testes.accessibility.item${n}.level`),
            how: toPlainText(tContent(`testes.accessibility.item${n}.how`)),
          })),
        }}
        visual={{
          title: tContent("testes.visual.title"),
          cols: {
            story: tNav("common.storyState"),
            priority: tNav("common.priority"),
          },
          items: testesIndices.visual.map((n) => ({
            story: tContent(`testes.visual.item${n}.story`),
            priority: tNav(priorityKeyMap[tContent(`testes.visual.item${n}.priority`)] ?? "common.medium"),
          })),
        }}
      />
    </DocsPageLayout>
  );
}
