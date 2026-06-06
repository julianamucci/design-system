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
import { DocsVariants }      from "@/components/docs/shared/sections/DocsVariants";
import { DocsCompositions }  from "@/components/docs/shared/sections/DocsCompositions";
import { DocsStates }        from "@/components/docs/shared/sections/DocsStates";
import { DocsProps }         from "@/components/docs/shared/sections/DocsProps";
import { DocsTokens }        from "@/components/docs/shared/sections/DocsTokens";
import { DocsAccessibility } from "@/components/docs/shared/sections/DocsAccessibility";
import { DocsRelated }       from "@/components/docs/shared/sections/DocsRelated";
import { DocsNotes }         from "@/components/docs/shared/sections/DocsNotes";
import { DocsAnalytics }     from "@/components/docs/shared/sections/DocsAnalytics";
import { DocsTestes }        from "@/components/docs/shared/sections/DocsTestes";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

const priorityKeyMap: Record<string, string> = {
  high: "common.high",
  medium: "common.medium",
  low: "common.low",
};

// ─── Dados de exemplo (preview do componente real) ───────────────────────────

type Invoice = {
  id: string;
  customer: string;
  status: "Pago" | "Pendente" | "Cancelado";
  method: string;
  amount: number;
};

const sampleInvoices: Invoice[] = [
  { id: "INV-001", customer: "Ana Souza",    status: "Pago",      method: "Pix",               amount: 250 },
  { id: "INV-002", customer: "Bruno Lima",   status: "Pendente",  method: "Boleto bancário",   amount: 150 },
  { id: "INV-003", customer: "Carla Mendes", status: "Cancelado", method: "Cartão de crédito", amount: 350 },
  { id: "INV-004", customer: "Diego Faria",  status: "Pago",      method: "Cartão de débito",  amount: 450 },
  { id: "INV-005", customer: "Eva Oliveira", status: "Pendente",  method: "Transferência",     amount: 200 },
];

const statusVariantMap: Record<Invoice["status"], "default" | "secondary" | "destructive"> = {
  Pago: "default",
  Pendente: "secondary",
  Cancelado: "destructive",
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
    aiIntent: tContent("seo.aiIntent") as "informational" | "navigational",
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
        accessorKey: "status",
        header: tContent("demonstration.labels.status"),
        size: 140,
        cell: ({ row }) => (
          <Badge variant={statusVariantMap[row.original.status]}>
            {row.original.status}
          </Badge>
        ),
      },
      { accessorKey: "method", header: tContent("demonstration.labels.method"), size: 180 },
      {
        accessorKey: "amount",
        header: tContent("demonstration.labels.amount"),
        size: 130,
        cell: ({ row }) => (
          <span className="font-medium tabular-nums">
            {currency.format(row.original.amount)}
          </span>
        ),
      },
    ],
    [tContent]
  );

  // ─── Code strings ───────────────────────────────────────────────────────────

  const codeImportBasic = `import { DataTable, type DataTableColumn } from "@/components/ui/data-table";`;
  const codeImportWithMeta = `import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import type { ColumnDef } from "@tanstack/react-table";

// Estende ColumnMeta com filter e editable
declare module "@tanstack/react-table" {
  interface ColumnMeta<TData, TValue> {
    filter?: { type: "text" | "select"; options?: string[] };
    editable?: boolean;
  }
}`;

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
  className?: string
  onTableReady?: (table: Table<TData>) => void
  onCellEdit?: (rowIndex: number, columnId: string, value: unknown) => void
}

// Extensão de ColumnMeta
declare module "@tanstack/react-table" {
  interface ColumnMeta<TData, TValue> {
    filter?: { type: "text" | "select"; options?: string[]; placeholder?: string }
    editable?: boolean
  }
}`;

  // ─── Previews reutilizáveis ─────────────────────────────────────────────────

  const PreviewBasic = (
    <DataTable<Invoice>
      columns={demoColumns}
      data={sampleInvoices}
      enableGlobalFilter={false}
      enableColumnVisibility={false}
      enablePagination={false}
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
      <DocsDemonstration title={tContent("demonstration.title")}>
        <div className="w-full">
          <DataTable<Invoice>
            columns={demoColumns}
            data={sampleInvoices}
            enableRowSelection
            enableGlobalFilter
            globalFilterPlaceholder={tContent("demonstration.labels.search")}
            enablePagination={false}
          />
        </div>
      </DocsDemonstration>

      {/* ── Anatomia ──────────────────────────────────────────────── */}
      <DocsAnatomy
        title={tContent("anatomy.title")}
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
        title={tContent("usage.title")}
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
            { s: stripHtml(tContent("usage.scenarios.item1.s")), u: tContent("usage.scenarios.item1.u"), a: tContent("usage.scenarios.item1.a") },
            { s: stripHtml(tContent("usage.scenarios.item2.s")), u: tContent("usage.scenarios.item2.u"), a: tContent("usage.scenarios.item2.a") },
            { s: stripHtml(tContent("usage.scenarios.item3.s")), u: tContent("usage.scenarios.item3.u"), a: tContent("usage.scenarios.item3.a") },
            { s: stripHtml(tContent("usage.scenarios.item4.s")), u: tContent("usage.scenarios.item4.u"), a: tContent("usage.scenarios.item4.a") },
            { s: stripHtml(tContent("usage.scenarios.item5.s")), u: tContent("usage.scenarios.item5.u"), a: tContent("usage.scenarios.item5.a") },
            { s: stripHtml(tContent("usage.scenarios.item6.s")), u: tContent("usage.scenarios.item6.u"), a: tContent("usage.scenarios.item6.a") },
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
        title={tContent("doDont.title")}
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
              />
            ),
            doCaption: stripHtml(tContent("doDont.pair1.do")),
            dontCaption: stripHtml(tContent("doDont.pair1.dont")),
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
              />
            ),
            doCaption: stripHtml(tContent("doDont.pair2.do")),
            dontCaption: stripHtml(tContent("doDont.pair2.dont")),
          },
        ]}
      />

      {/* ── Importação ────────────────────────────────────────────── */}
      <DocsImport
        title={tContent("import.title")}
        description={tContent("import.basic")}
        code={codeImportBasic}
        secondaryDescription={tContent("import.withMeta")}
        secondaryCode={codeImportWithMeta}
      />

      {/* ── Recursos (Variants) ───────────────────────────────────── */}
      <DocsVariants
        title={tContent("variants.title")}
        note={stripHtml(tContent("variants.note"))}
        componentSlug="data-table"
        items={[
          {
            name: "enableGlobalFilter",
            description: tContent("variants.items.globalFilter"),
            code: codeGlobalFilter,
            preview: PreviewBasic,
          },
          {
            name: "enableColumnFilters",
            description: tContent("variants.items.columnFilters"),
            code: codeColumnFilters,
            preview: PreviewBasic,
          },
          {
            name: "enableRowSelection",
            description: tContent("variants.items.selection"),
            code: codeRowSelection,
            preview: (
              <DataTable<Invoice>
                columns={demoColumns}
                data={sampleInvoices.slice(0, 3)}
                enableRowSelection
                enableGlobalFilter={false}
                enableColumnVisibility={false}
                enablePagination={false}
              />
            ),
          },
          {
            name: "enableColumnVisibility",
            description: tContent("variants.items.visibility"),
            code: codeVisibility,
            preview: PreviewBasic,
          },
          {
            name: "enableColumnResizing",
            description: tContent("variants.items.resize"),
            code: codeResize,
            preview: PreviewBasic,
          },
          {
            name: "enableColumnOrdering",
            description: tContent("variants.items.reorder"),
            code: codeReorder,
            preview: PreviewBasic,
          },
          {
            name: "enableColumnPinning",
            description: tContent("variants.items.pin"),
            code: codePin,
            preview: PreviewBasic,
          },
          {
            name: "enablePagination",
            description: tContent("variants.items.pagination"),
            code: codePagination,
            preview: PreviewBasic,
          },
          {
            name: "onCellEdit + meta.editable",
            description: tContent("variants.items.edit"),
            code: codeEdit,
            preview: PreviewBasic,
          },
          {
            name: "virtualized",
            description: tContent("variants.items.virtual"),
            code: codeVirtual,
            preview: (
              <DataTable<Invoice>
                columns={demoColumns}
                data={sampleInvoices}
                virtualized
                maxHeight="180px"
                enableGlobalFilter={false}
                enableColumnVisibility={false}
              />
            ),
          },
        ]}
      />

      {/* ── Composições ───────────────────────────────────────────── */}
      <DocsCompositions
        title={tContent("variants.compositionsTitle")}
        useWhenLabel={tNav("common.useWhen")}
        componentSlug="data-table"
        items={[
          {
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
              />
            ),
          },
          {
            name: tContent("variants.compositions.editableSheet.name"),
            description: tContent("variants.compositions.editableSheet.description"),
            useWhen: tContent("variants.compositions.editableSheet.use"),
            code: codeEdit,
            preview: PreviewBasic,
          },
          {
            name: tContent("variants.compositions.virtualizedLog.name"),
            description: tContent("variants.compositions.virtualizedLog.description"),
            useWhen: tContent("variants.compositions.virtualizedLog.use"),
            code: codeVirtual,
            preview: (
              <DataTable<Invoice>
                columns={demoColumns}
                data={sampleInvoices}
                virtualized
                maxHeight="180px"
                enableGlobalFilter={false}
                enableColumnVisibility={false}
              />
            ),
          },
          {
            name: tContent("variants.compositions.pinnedKey.name"),
            description: tContent("variants.compositions.pinnedKey.description"),
            useWhen: tContent("variants.compositions.pinnedKey.use"),
            code: codePin,
            preview: PreviewBasic,
          },
        ]}
      />

      {/* ── Estados ───────────────────────────────────────────────── */}
      <DocsStates
        title={tContent("states.title")}
        cols={{
          state: tContent("states.cols.state"),
          trigger: tContent("states.cols.trigger"),
          behavior: tContent("states.cols.behavior"),
        }}
        items={[
          {
            label: tContent("states.empty.label"),
            trigger: stripHtml(tContent("states.empty.trigger")),
            behavior: stripHtml(tContent("states.empty.behavior")),
          },
          {
            label: tContent("states.sorted.label"),
            trigger: tContent("states.sorted.trigger"),
            behavior: stripHtml(tContent("states.sorted.behavior")),
          },
          {
            label: tContent("states.filtered.label"),
            trigger: tContent("states.filtered.trigger"),
            behavior: tContent("states.filtered.behavior"),
          },
          {
            label: tContent("states.selected.label"),
            trigger: tContent("states.selected.trigger"),
            behavior: stripHtml(tContent("states.selected.behavior")),
          },
          {
            label: tContent("states.editing.label"),
            trigger: stripHtml(tContent("states.editing.trigger")),
            behavior: stripHtml(tContent("states.editing.behavior")),
          },
          {
            label: tContent("states.resizing.label"),
            trigger: tContent("states.resizing.trigger"),
            behavior: stripHtml(tContent("states.resizing.behavior")),
          },
          {
            label: tContent("states.virtualized.label"),
            trigger: stripHtml(tContent("states.virtualized.trigger")),
            behavior: tContent("states.virtualized.behavior"),
          },
        ]}
      />

      {/* ── Propriedades ──────────────────────────────────────────── */}
      <DocsProps
        title={tContent("props.title")}
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
              { name: "columns", type: "ColumnDef<TData>[]", defaultValue: "—", required: "Sim", description: stripHtml(tContent("props.table.columns")) },
              { name: "data", type: "TData[]", defaultValue: "—", required: "Sim", description: stripHtml(tContent("props.table.data")) },
              { name: "enableGlobalFilter", type: "boolean", defaultValue: "true", required: "Não", description: tContent("props.table.enableGlobalFilter") },
              { name: "globalFilterPlaceholder", type: "string", defaultValue: '"Buscar..."', required: "Não", description: tContent("props.table.globalFilterPlaceholder") },
              { name: "enableRowSelection", type: "boolean", defaultValue: "false", required: "Não", description: tContent("props.table.enableRowSelection") },
              { name: "enableColumnVisibility", type: "boolean", defaultValue: "true", required: "Não", description: tContent("props.table.enableColumnVisibility") },
              { name: "enableColumnFilters", type: "boolean", defaultValue: "false", required: "Não", description: stripHtml(tContent("props.table.enableColumnFilters")) },
              { name: "enableColumnResizing", type: "boolean", defaultValue: "false", required: "Não", description: stripHtml(tContent("props.table.enableColumnResizing")) },
              { name: "enableColumnOrdering", type: "boolean", defaultValue: "false", required: "Não", description: tContent("props.table.enableColumnOrdering") },
              { name: "enableColumnPinning", type: "boolean", defaultValue: "false", required: "Não", description: tContent("props.table.enableColumnPinning") },
              { name: "enablePagination", type: "boolean", defaultValue: "true", required: "Não", description: tContent("props.table.enablePagination") },
              { name: "virtualized", type: "boolean", defaultValue: "false", required: "Não", description: tContent("props.table.virtualized") },
              { name: "virtualRowHeight", type: "number", defaultValue: "36", required: "Não", description: tContent("props.table.virtualRowHeight") },
              { name: "maxHeight", type: "string", defaultValue: '"480px"', required: "Não", description: stripHtml(tContent("props.table.maxHeight")) },
              { name: "pageSize", type: "number", defaultValue: "10", required: "Não", description: tContent("props.table.pageSize") },
              { name: "pageSizeOptions", type: "number[]", defaultValue: "[10, 20, 50, 100]", required: "Não", description: stripHtml(tContent("props.table.pageSizeOptions")) },
              { name: "emptyMessage", type: "string", defaultValue: '"Sem resultados."', required: "Não", description: tContent("props.table.emptyMessage") },
              { name: "onCellEdit", type: "(rowIndex, columnId, value) => void", defaultValue: "—", required: "Não", description: stripHtml(tContent("props.table.onCellEdit")) },
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
              { name: "meta.filter", type: '{ type: "text" | "select"; options?: string[] }', defaultValue: "—", required: "Não", description: stripHtml(tContent("props.table.metaFilter")) },
              { name: "meta.editable", type: "boolean", defaultValue: "false", required: "Não", description: stripHtml(tContent("props.table.metaEditable")) },
            ],
          },
        ]}
        interfaceCode={interfaceCode}
        extensibilityTitle={tContent("props.extensibilityTitle")}
        extensibilityNotes={tContent("props.extensibility")}
      />

      {/* ── Tokens ────────────────────────────────────────────────── */}
      <DocsTokens
        title={tContent("tokens.title")}
        cols={{
          token: tContent("tokens.table.token"),
          value: tContent("tokens.table.class"),
          description: tContent("tokens.table.part"),
        }}
        items={[
          { token: "--border", value: stripHtml(tContent("tokens.table.border")), description: tContent("tokens.table.borderPart") },
          { token: "--muted", value: stripHtml(tContent("tokens.table.muted")), description: tContent("tokens.table.mutedPart") },
          { token: "--muted-foreground", value: stripHtml(tContent("tokens.table.mutedForeground")), description: tContent("tokens.table.mutedForegroundPart") },
          { token: "--primary", value: stripHtml(tContent("tokens.table.primary")), description: tContent("tokens.table.primaryPart") },
          { token: "--background", value: stripHtml(tContent("tokens.table.background")), description: tContent("tokens.table.backgroundPart") },
          { token: "--ring", value: stripHtml(tContent("tokens.table.ring")), description: tContent("tokens.table.ringPart") },
        ]}
        customizationTitle={tContent("tokens.customizationTitle")}
        customizationCode={codeCustomizationTokens}
      />

      {/* ── Acessibilidade ────────────────────────────────────────── */}
      <DocsAccessibility
        title={tContent("accessibility.title")}
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
          { key: "Arrows", description: tContent("accessibility.keyboard.arrowKeys") },
        ]}
      />

      {/* ── Relacionados ──────────────────────────────────────────── */}
      <DocsRelated
        title={tContent("related.title")}
        items={[
          { name: "Table",         description: tContent("related.table"),         path: "?path=/docs/ui-table--docs" },
          { name: "Chart",         description: tContent("related.chart"),         path: "?path=/docs/ui-chart--docs" },
          { name: "Pagination",    description: tContent("related.pagination"),    path: "?path=/docs/ui-pagination--docs" },
          { name: "Checkbox",      description: tContent("related.checkbox"),      path: "?path=/docs/ui-checkbox--docs" },
          { name: "Input",         description: tContent("related.input"),         path: "?path=/docs/ui-input--docs" },
          { name: "DropdownMenu",  description: tContent("related.dropdownMenu"),  path: "?path=/docs/ui-dropdownmenu--docs" },
        ]}
      />

      {/* ── Notas ─────────────────────────────────────────────────── */}
      <DocsNotes
        title={tContent("notes.title")}
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
        title={tContent("analytics.title")}
        cols={{
          event: tContent("analytics.table.event"),
          trigger: tContent("analytics.table.trigger"),
          payload: tContent("analytics.table.payload"),
        }}
        items={[
          {
            event: tContent("analytics.table.pageView"),
            trigger: tContent("analytics.table.pageViewTrigger"),
            payload: tContent("analytics.table.pageViewPayload"),
          },
          {
            event: tContent("analytics.table.sectionViewed"),
            trigger: tContent("analytics.table.sectionViewedTrigger"),
            payload: tContent("analytics.table.sectionViewedPayload"),
          },
          {
            event: tContent("analytics.table.langSwitch"),
            trigger: tContent("analytics.table.langSwitchTrigger"),
            payload: tContent("analytics.table.langSwitchPayload"),
          },
        ]}
      />

      {/* ── Testes ────────────────────────────────────────────────── */}
      <DocsTestes
        title={tContent("testes.title")}
        functional={{
          title: tContent("testes.functional.title"),
          cols: {
            action: tNav("common.userAction"),
            result: tNav("common.expectedResult"),
            priority: tNav("common.priority"),
          },
          items: [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
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
          items: [1, 2, 3, 4].map((n) => ({
            criterion: tContent(`testes.accessibility.item${n}.criterion`),
            level: tContent(`testes.accessibility.item${n}.level`),
            how: tContent(`testes.accessibility.item${n}.how`),
          })),
        }}
        visual={{
          title: tContent("testes.visual.title"),
          cols: {
            story: tNav("common.storyState"),
            priority: tNav("common.priority"),
          },
          items: [1, 2, 3, 4, 5, 6].map((n) => ({
            story: tContent(`testes.visual.item${n}.story`),
            priority: tNav(priorityKeyMap[tContent(`testes.visual.item${n}.priority`)] ?? "common.medium"),
          })),
        }}
      />
    </DocsPageLayout>
  );
}
