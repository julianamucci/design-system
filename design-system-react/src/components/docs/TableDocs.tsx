import { useCallback, useEffect, useMemo } from "react";
import { MoreHorizontal, ArrowUpDown, Search } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import { useActiveSection } from "@/lib/use-active-section";
import uiTranslations from "@/i18n/ui.json";
import tableTranslations from "@shared/content/table/translations.json";

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
  high:   "common.high",
  medium: "common.medium",
  low:    "common.low",
};

// ─── Dados de exemplo ─────────────────────────────────────────────────────────

const invoices = [
  { id: "#INV-001", status: "Pago",      method: "Cartão de crédito",  amount: "R$ 250,00" },
  { id: "#INV-002", status: "Pendente",  method: "Boleto bancário",    amount: "R$ 150,00" },
  { id: "#INV-003", status: "Cancelado", method: "Pix",                amount: "R$ 350,00" },
  { id: "#INV-004", status: "Pago",      method: "Cartão de débito",   amount: "R$ 450,00" },
  { id: "#INV-005", status: "Pendente",  method: "Transferência",      amount: "R$ 200,00" },
];

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
      { id: "composicoes",  label: t("nav.compositions") },
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


// ─── Componente principal ─────────────────────────────────────────────────────

export function TableDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(tableTranslations);

  const navGroups = useMemo(() => getNavGroups(tNav), [tNav]);
  const allIds = useMemo(
    () => navGroups.flatMap((g) => g.sections.map((s) => s.id)),
    [navGroups]
  );

  useSeoEffect({
    title: tContent("seo.title"),
    description: tContent("seo.description"),
    locale,
    componentSlug: "table",
  });

  useEffect(() => {
    track("docs_page_view", {
      component_name: "table",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "table",
        locale,
      });
    },
    [locale]
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  // ─── Code strings ─────────────────────────────────────────────────────────

  const codeImport = `import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "@/components/ui/table";`;

  const codeBasic = `<Table>
  <TableCaption>Lista de faturas recentes</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead scope="col">Fatura</TableHead>
      <TableHead scope="col">Status</TableHead>
      <TableHead scope="col">Método</TableHead>
      <TableHead scope="col">Valor</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {invoices.map((invoice) => (
      <TableRow key={invoice.id}>
        <TableCell>{invoice.id}</TableCell>
        <TableCell>{invoice.status}</TableCell>
        <TableCell>{invoice.method}</TableCell>
        <TableCell>{invoice.amount}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>`;

  const codeWithFooter = `<Table>
  <TableCaption>Lista de faturas recentes</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead scope="col">Fatura</TableHead>
      <TableHead scope="col">Status</TableHead>
      <TableHead scope="col">Método</TableHead>
      <TableHead scope="col">Valor</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {invoices.map((invoice) => (
      <TableRow key={invoice.id}>
        <TableCell>{invoice.id}</TableCell>
        <TableCell>{invoice.status}</TableCell>
        <TableCell>{invoice.method}</TableCell>
        <TableCell>{invoice.amount}</TableCell>
      </TableRow>
    ))}
  </TableBody>
  <TableFooter>
    <TableRow>
      <TableCell colSpan={3}>Total</TableCell>
      <TableCell>R$ 1.400,00</TableCell>
    </TableRow>
  </TableFooter>
</Table>`;

  const codeSrOnlyCaption = `<Table>
  <TableCaption className="sr-only">Lista de faturas recentes</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead scope="col">Fatura</TableHead>
      <TableHead scope="col">Status</TableHead>
      <TableHead scope="col">Método</TableHead>
      <TableHead scope="col">Valor</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {invoices.map((invoice) => (
      <TableRow key={invoice.id}>
        <TableCell>{invoice.id}</TableCell>
        <TableCell>{invoice.status}</TableCell>
        <TableCell>{invoice.method}</TableCell>
        <TableCell>{invoice.amount}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>`;

  const codeWithActions = `<Table>
  <TableCaption className="sr-only">Lista de faturas recentes</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead scope="col">Fatura</TableHead>
      <TableHead scope="col">Status</TableHead>
      <TableHead scope="col">Método</TableHead>
      <TableHead scope="col">Valor</TableHead>
      <TableHead scope="col"><span className="sr-only">Ações</span></TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {invoices.map((invoice) => (
      <TableRow key={invoice.id}>
        <TableCell>{invoice.id}</TableCell>
        <TableCell>{invoice.status}</TableCell>
        <TableCell>{invoice.method}</TableCell>
        <TableCell>{invoice.amount}</TableCell>
        <TableCell>
          <Button
            variant="ghost"
            size="icon"
            aria-label={\`Ações para fatura \${invoice.id}\`}
          >
            <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
          </Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>`;

  const codeEmpty = `<Table>
  <TableCaption className="sr-only">Lista de faturas recentes</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead scope="col">Fatura</TableHead>
      <TableHead scope="col">Status</TableHead>
      <TableHead scope="col">Método</TableHead>
      <TableHead scope="col">Valor</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell
        colSpan={4}
        className="h-24 text-center text-muted-foreground"
      >
        Nenhum dado encontrado.
      </TableCell>
    </TableRow>
  </TableBody>
</Table>`;

  const interfaceCode = `// Table — wrapper div + table
interface TableProps extends React.ComponentProps<"table"> {}

// TableHeader
interface TableHeaderProps extends React.ComponentProps<"thead"> {}

// TableBody
interface TableBodyProps extends React.ComponentProps<"tbody"> {}

// TableFooter
interface TableFooterProps extends React.ComponentProps<"tfoot"> {}

// TableRow
interface TableRowProps extends React.ComponentProps<"tr"> {
  "data-state"?: "selected";
}

// TableHead — scope obrigatório
interface TableHeadProps extends React.ComponentProps<"th"> {
  scope?: "col" | "row" | "colgroup" | "rowgroup";
}

// TableCell
interface TableCellProps extends React.ComponentProps<"td"> {
  colSpan?: number;
  rowSpan?: number;
}

// TableCaption
interface TableCaptionProps extends React.ComponentProps<"caption"> {}`;

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
          installNote="npx shadcn@latest add table"
        />
      }
    >
      {/* ── Demonstração ─────────────────────────────────────────── */}
      <DocsDemonstration title={tContent("demonstration.title")}>
        <div className="w-full">
          <Table>
            <TableCaption className="sr-only">
              {tContent("demonstration.labels.caption")}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">{tContent("demonstration.labels.invoice")}</TableHead>
                <TableHead scope="col">{tContent("demonstration.labels.status")}</TableHead>
                <TableHead scope="col">{tContent("demonstration.labels.method")}</TableHead>
                <TableHead scope="col" className="text-right">
                  {tContent("demonstration.labels.amount")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.id}</TableCell>
                  <TableCell>{invoice.status}</TableCell>
                  <TableCell>{invoice.method}</TableCell>
                  <TableCell className="text-right">{invoice.amount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3}>{tContent("demonstration.labels.total")}</TableCell>
                <TableCell className="text-right">
                  {tContent("demonstration.labels.totalAmount")}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </DocsDemonstration>

      {/* ── Anatomia ─────────────────────────────────────────────── */}
      <DocsAnatomy
        title={tContent("anatomy.title")}
        items={[
          tContent("anatomy.item1"),
          tContent("anatomy.item2"),
          tContent("anatomy.item3"),
          tContent("anatomy.item4"),
          tContent("anatomy.item5"),
          tContent("anatomy.item6"),
          tContent("anatomy.item7"),
          tContent("anatomy.item8"),
        ]}
        structureLabel={tContent("anatomy.structureLabel")}
        structureCode={tContent("anatomy.structureCode")}
      />

      {/* ── Quando Usar ──────────────────────────────────────────── */}
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
            { s: tContent("usage.scenarios.item1.s"), u: tContent("usage.scenarios.item1.u"), a: tContent("usage.scenarios.item1.a") },
            { s: tContent("usage.scenarios.item2.s"), u: tContent("usage.scenarios.item2.u"), a: tContent("usage.scenarios.item2.a") },
            { s: tContent("usage.scenarios.item3.s"), u: tContent("usage.scenarios.item3.u"), a: tContent("usage.scenarios.item3.a") },
            { s: tContent("usage.scenarios.item4.s"), u: tContent("usage.scenarios.item4.u"), a: tContent("usage.scenarios.item4.a") },
            { s: tContent("usage.scenarios.item5.s"), u: tContent("usage.scenarios.item5.u"), a: tContent("usage.scenarios.item5.a") },
          ],
        }}
        uxWriting={{
          title: tContent("usage.uxWriting.title"),
          cols: {
            element:  tContent("usage.uxWriting.table.element"),
            rules:    tContent("usage.uxWriting.table.rules"),
            do:       tContent("usage.uxWriting.table.correct"),
            dont:     tContent("usage.uxWriting.table.avoid"),
          },
          items: [
            {
              element: tContent("usage.uxWriting.table.caption.name"),
              rules:   tContent("usage.uxWriting.table.caption.format"),
              do:      tContent("usage.uxWriting.table.caption.good"),
              dont:    tContent("usage.uxWriting.table.caption.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.head.name"),
              rules:   tContent("usage.uxWriting.table.head.format"),
              do:      tContent("usage.uxWriting.table.head.good"),
              dont:    tContent("usage.uxWriting.table.head.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.emptyState.name"),
              rules:   tContent("usage.uxWriting.table.emptyState.format"),
              do:      tContent("usage.uxWriting.table.emptyState.good"),
              dont:    tContent("usage.uxWriting.table.emptyState.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.actionLabel.name"),
              rules:   tContent("usage.uxWriting.table.actionLabel.format"),
              do:      tContent("usage.uxWriting.table.actionLabel.good"),
              dont:    tContent("usage.uxWriting.table.actionLabel.bad"),
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

      {/* ── Do & Don't ───────────────────────────────────────────── */}
      <DocsDoDont
        title={tContent("doDont.title")}
        pairs={[
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <div className="w-full overflow-x-auto">
                <Table>
                  <TableCaption className="sr-only">Lista de faturas</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col">Fatura</TableHead>
                      <TableHead scope="col">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>#INV-001</TableCell>
                      <TableCell>Pago</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            ),
            dontPreview: (
              <div className="w-full overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fatura</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>#INV-001</TableCell>
                      <TableCell>Pago</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            ),
            doCaption: tContent("doDont.pair1.do"),
            dontCaption: tContent("doDont.pair1.dont"),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <div className="w-full overflow-x-auto">
                <Table>
                  <TableCaption className="sr-only">Lista de faturas</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col">Fatura</TableHead>
                      <TableHead scope="col">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell
                        colSpan={2}
                        className="h-16 text-center text-muted-foreground"
                      >
                        Nenhuma fatura encontrada.
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            ),
            dontPreview: (
              <div className="w-full overflow-x-auto">
                <Table>
                  <TableCaption className="sr-only">Lista de faturas</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col">Fatura</TableHead>
                      <TableHead scope="col">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody />
                </Table>
              </div>
            ),
            doCaption: tContent("doDont.pair2.do"),
            dontCaption: tContent("doDont.pair2.dont"),
          },
        ]}
      />

      {/* ── Importação ───────────────────────────────────────────── */}
      <DocsImport
        title={tContent("import.title")}
        code={codeImport}
      />

      {/* ── Variantes ────────────────────────────────────────────── */}
      <DocsVariants
        title={tContent("variants.title")}
        componentSlug="table"
        items={[
          {
            name: tContent("variants.basic.label"),
            description: stripHtml(tContent("variants.basic.description")),
            code: codeBasic,
            preview: (
              <div className="w-full overflow-x-auto">
                <Table>
                  <TableCaption>Lista de faturas recentes</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col">Fatura</TableHead>
                      <TableHead scope="col">Status</TableHead>
                      <TableHead scope="col">Método</TableHead>
                      <TableHead scope="col" className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.id}</TableCell>
                        <TableCell>{invoice.status}</TableCell>
                        <TableCell>{invoice.method}</TableCell>
                        <TableCell className="text-right">{invoice.amount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ),
          },
          {
            name: tContent("variants.withFooter.label"),
            description: stripHtml(tContent("variants.withFooter.description")),
            code: codeWithFooter,
            preview: (
              <div className="w-full overflow-x-auto">
                <Table>
                  <TableCaption>Lista de faturas recentes</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col">Fatura</TableHead>
                      <TableHead scope="col">Status</TableHead>
                      <TableHead scope="col">Método</TableHead>
                      <TableHead scope="col" className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.id}</TableCell>
                        <TableCell>{invoice.status}</TableCell>
                        <TableCell>{invoice.method}</TableCell>
                        <TableCell className="text-right">{invoice.amount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={3}>Total</TableCell>
                      <TableCell className="text-right">R$ 1.400,00</TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            ),
          },
          {
            name: tContent("variants.withSrOnlyCaption.label"),
            description: stripHtml(tContent("variants.withSrOnlyCaption.description")),
            code: codeSrOnlyCaption,
            preview: (
              <div className="w-full overflow-x-auto">
                <Table>
                  <TableCaption className="sr-only">Lista de faturas recentes</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col">Fatura</TableHead>
                      <TableHead scope="col">Status</TableHead>
                      <TableHead scope="col">Método</TableHead>
                      <TableHead scope="col" className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.id}</TableCell>
                        <TableCell>{invoice.status}</TableCell>
                        <TableCell>{invoice.method}</TableCell>
                        <TableCell className="text-right">{invoice.amount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ),
          },
          {
            name: tContent("variants.withInlineActions.label"),
            description: stripHtml(tContent("variants.withInlineActions.description")),
            code: codeWithActions,
            preview: (
              <div className="w-full overflow-x-auto">
                <Table>
                  <TableCaption className="sr-only">Lista de faturas recentes</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col">Fatura</TableHead>
                      <TableHead scope="col">Status</TableHead>
                      <TableHead scope="col">Método</TableHead>
                      <TableHead scope="col" className="text-right">Valor</TableHead>
                      <TableHead scope="col" className="w-10">
                        <span className="sr-only">Ações</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.id}</TableCell>
                        <TableCell>{invoice.status}</TableCell>
                        <TableCell>{invoice.method}</TableCell>
                        <TableCell className="text-right">{invoice.amount}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Ações para fatura ${invoice.id}`}
                          >
                            <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ),
          },
          {
            name: tContent("variants.withEmptyState.label"),
            description: stripHtml(tContent("variants.withEmptyState.description")),
            code: codeEmpty,
            preview: (
              <div className="w-full overflow-x-auto">
                <Table>
                  <TableCaption className="sr-only">Lista de faturas recentes</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col">Fatura</TableHead>
                      <TableHead scope="col">Status</TableHead>
                      <TableHead scope="col">Método</TableHead>
                      <TableHead scope="col" className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="h-24 text-center text-muted-foreground"
                      >
                        Nenhum dado encontrado.
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            ),
          },
        ]}
      />

      {/* ── Composições ──────────────────────────────────────────── */}
      <DocsCompositions
        title={tContent("variants.compositionsTitle")}
        useWhenLabel={tNav("common.useWhen")}
        componentSlug="table"
        items={[
          {
            name: tContent("variants.compositions.filterableToolbar.name"),
            description: tContent("variants.compositions.filterableToolbar.description"),
            useWhen: tContent("variants.compositions.filterableToolbar.use"),
            code: `<div className="flex flex-col gap-3">
  <div className="flex items-center gap-2">
    <div className="relative w-full max-w-sm">
      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
      <Input placeholder="Filtrar faturas..." className="pl-8" />
    </div>
    <Button variant="outline">Status</Button>
  </div>
  <Table>
    <TableCaption className="sr-only">Lista de faturas filtráveis</TableCaption>
    <TableHeader>
      <TableRow>
        <TableHead scope="col">Fatura</TableHead>
        <TableHead scope="col">Status</TableHead>
        <TableHead scope="col" className="text-right">Valor</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {filteredInvoices.map((invoice) => (
        <TableRow key={invoice.id}>
          <TableCell>{invoice.id}</TableCell>
          <TableCell>{invoice.status}</TableCell>
          <TableCell className="text-right">{invoice.amount}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</div>`,
            preview: (
              <div className="w-full flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <Input placeholder="Filtrar faturas..." className="pl-8" />
                  </div>
                  <Button variant="outline">Status</Button>
                </div>
                <div className="w-full overflow-x-auto">
                  <Table>
                    <TableCaption className="sr-only">Lista de faturas filtráveis</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead scope="col">Fatura</TableHead>
                        <TableHead scope="col">Status</TableHead>
                        <TableHead scope="col" className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.slice(0, 3).map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">{invoice.id}</TableCell>
                          <TableCell>{invoice.status}</TableCell>
                          <TableCell className="text-right">{invoice.amount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ),
          },
          {
            name: tContent("variants.compositions.sortableHeaders.name"),
            description: tContent("variants.compositions.sortableHeaders.description"),
            useWhen: tContent("variants.compositions.sortableHeaders.use"),
            code: `<Table>
  <TableHeader>
    <TableRow>
      <TableHead scope="col" aria-sort="ascending">
        <Button variant="ghost" size="sm" className="-ml-2">
          Fatura
          <ArrowUpDown className="ml-2 h-4 w-4" aria-hidden="true" />
        </Button>
      </TableHead>
      <TableHead scope="col" aria-sort="none">
        <Button variant="ghost" size="sm" className="-ml-2">
          Valor
          <ArrowUpDown className="ml-2 h-4 w-4" aria-hidden="true" />
        </Button>
      </TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>{/* rows */}</TableBody>
</Table>`,
            preview: (
              <div className="w-full overflow-x-auto">
                <Table>
                  <TableCaption className="sr-only">Faturas ordenáveis</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col" aria-sort="ascending">
                        <Button variant="ghost" size="sm" className="-ml-2 h-8">
                          Fatura
                          <ArrowUpDown className="ml-2 h-4 w-4" aria-hidden="true" />
                        </Button>
                      </TableHead>
                      <TableHead scope="col" aria-sort="none">
                        <Button variant="ghost" size="sm" className="-ml-2 h-8">
                          Status
                          <ArrowUpDown className="ml-2 h-4 w-4" aria-hidden="true" />
                        </Button>
                      </TableHead>
                      <TableHead scope="col" aria-sort="none" className="text-right">
                        <Button variant="ghost" size="sm" className="-ml-2 h-8">
                          Valor
                          <ArrowUpDown className="ml-2 h-4 w-4" aria-hidden="true" />
                        </Button>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.slice(0, 3).map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.id}</TableCell>
                        <TableCell>{invoice.status}</TableCell>
                        <TableCell className="text-right">{invoice.amount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ),
          },
          {
            name: tContent("variants.compositions.selectableRows.name"),
            description: tContent("variants.compositions.selectableRows.description"),
            useWhen: tContent("variants.compositions.selectableRows.use"),
            code: `<Table>
  <TableHeader>
    <TableRow>
      <TableHead scope="col" className="w-10">
        <Checkbox aria-label="Selecionar todas as linhas" />
      </TableHead>
      <TableHead scope="col">Fatura</TableHead>
      <TableHead scope="col">Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {invoices.map((invoice) => (
      <TableRow key={invoice.id} data-state={selected.has(invoice.id) ? "selected" : undefined}>
        <TableCell>
          <Checkbox
            checked={selected.has(invoice.id)}
            onCheckedChange={(c) => toggle(invoice.id, c)}
            aria-label={\`Selecionar fatura \${invoice.id}\`}
          />
        </TableCell>
        <TableCell>{invoice.id}</TableCell>
        <TableCell>{invoice.status}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>`,
            preview: (
              <div className="w-full overflow-x-auto">
                <Table>
                  <TableCaption className="sr-only">Faturas com seleção</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col" className="w-10">
                        <Checkbox aria-label="Selecionar todas as linhas" />
                      </TableHead>
                      <TableHead scope="col">Fatura</TableHead>
                      <TableHead scope="col">Status</TableHead>
                      <TableHead scope="col" className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow data-state="selected">
                      <TableCell>
                        <Checkbox defaultChecked aria-label="Selecionar fatura #INV-001" />
                      </TableCell>
                      <TableCell className="font-medium">#INV-001</TableCell>
                      <TableCell>Pago</TableCell>
                      <TableCell className="text-right">R$ 250,00</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Checkbox aria-label="Selecionar fatura #INV-002" />
                      </TableCell>
                      <TableCell className="font-medium">#INV-002</TableCell>
                      <TableCell>Pendente</TableCell>
                      <TableCell className="text-right">R$ 150,00</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Checkbox aria-label="Selecionar fatura #INV-003" />
                      </TableCell>
                      <TableCell className="font-medium">#INV-003</TableCell>
                      <TableCell>Cancelado</TableCell>
                      <TableCell className="text-right">R$ 350,00</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            ),
          },
          {
            name: tContent("variants.compositions.withPagination.name"),
            description: tContent("variants.compositions.withPagination.description"),
            useWhen: tContent("variants.compositions.withPagination.use"),
            code: `<div className="flex flex-col gap-3">
  <Table>{/* ... */}</Table>
  <Pagination>
    <PaginationContent>
      <PaginationItem>
        <PaginationPrevious href="#" />
      </PaginationItem>
      <PaginationItem><PaginationLink href="#" isActive>1</PaginationLink></PaginationItem>
      <PaginationItem><PaginationLink href="#">2</PaginationLink></PaginationItem>
      <PaginationItem><PaginationLink href="#">3</PaginationLink></PaginationItem>
      <PaginationItem>
        <PaginationNext href="#" />
      </PaginationItem>
    </PaginationContent>
  </Pagination>
</div>`,
            preview: (
              <div className="w-full flex flex-col gap-3">
                <div className="w-full overflow-x-auto">
                  <Table>
                    <TableCaption className="sr-only">Faturas paginadas</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead scope="col">Fatura</TableHead>
                        <TableHead scope="col">Status</TableHead>
                        <TableHead scope="col" className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.slice(0, 3).map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">{invoice.id}</TableCell>
                          <TableCell>{invoice.status}</TableCell>
                          <TableCell className="text-right">{invoice.amount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious href="#" />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink href="#" isActive>1</PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink href="#">2</PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext href="#" />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            ),
          },
        ]}
      />

      {/* ── Estados ──────────────────────────────────────────────── */}
      <DocsStates
        title={tContent("states.title")}
        cols={{
          state:    tContent("states.cols.state"),
          trigger:  tContent("states.cols.trigger"),
          behavior: tContent("states.cols.behavior"),
        }}
        items={[
          {
            label:    tContent("states.empty.label"),
            trigger:  stripHtml(tContent("states.empty.trigger")),
            behavior: tContent("states.empty.behavior"),
          },
          {
            label:    tContent("states.selected.label"),
            trigger:  stripHtml(tContent("states.selected.trigger")),
            behavior: tContent("states.selected.behavior"),
          },
          {
            label:    tContent("states.loading.label"),
            trigger:  stripHtml(tContent("states.loading.trigger")),
            behavior: tContent("states.loading.behavior"),
          },
        ]}
      />

      {/* ── Propriedades ─────────────────────────────────────────── */}
      <DocsProps
        title={tContent("props.title")}
        tables={[
          {
            title: tContent("props.tableTitle"),
            cols: {
              prop:        tContent("props.table.prop"),
              type:        tContent("props.table.type"),
              default:     tContent("props.table.default"),
              required:    tContent("props.table.required"),
              description: tContent("props.table.description"),
            },
            items: [
              { name: "className", type: "string", defaultValue: "—", required: "Não", description: tContent("props.items.className") },
              { name: "children",  type: "React.ReactNode", defaultValue: "—", required: "Sim", description: tContent("props.items.children") },
            ],
          },
          {
            title: tContent("props.tableHeaderTitle"),
            cols: {
              prop:        tContent("props.table.prop"),
              type:        tContent("props.table.type"),
              default:     tContent("props.table.default"),
              required:    tContent("props.table.required"),
              description: tContent("props.table.description"),
            },
            items: [
              { name: "className", type: "string", defaultValue: "—", required: "Não", description: tContent("props.items.className") },
              { name: "children",  type: "React.ReactNode", defaultValue: "—", required: "Sim", description: tContent("props.items.children") },
            ],
          },
          {
            title: tContent("props.tableBodyTitle"),
            cols: {
              prop:        tContent("props.table.prop"),
              type:        tContent("props.table.type"),
              default:     tContent("props.table.default"),
              required:    tContent("props.table.required"),
              description: tContent("props.table.description"),
            },
            items: [
              { name: "className", type: "string", defaultValue: "—", required: "Não", description: tContent("props.items.className") },
              { name: "children",  type: "React.ReactNode", defaultValue: "—", required: "Sim", description: tContent("props.items.children") },
            ],
          },
          {
            title: tContent("props.tableFooterTitle"),
            cols: {
              prop:        tContent("props.table.prop"),
              type:        tContent("props.table.type"),
              default:     tContent("props.table.default"),
              required:    tContent("props.table.required"),
              description: tContent("props.table.description"),
            },
            items: [
              { name: "className", type: "string", defaultValue: "—", required: "Não", description: tContent("props.items.className") },
              { name: "children",  type: "React.ReactNode", defaultValue: "—", required: "Sim", description: tContent("props.items.children") },
            ],
          },
          {
            title: tContent("props.tableRowTitle"),
            cols: {
              prop:        tContent("props.table.prop"),
              type:        tContent("props.table.type"),
              default:     tContent("props.table.default"),
              required:    tContent("props.table.required"),
              description: tContent("props.table.description"),
            },
            items: [
              { name: "data-state", type: '"selected"', defaultValue: "—", required: "Não", description: stripHtml(tContent("props.items.dataState")) },
              { name: "className",  type: "string",     defaultValue: "—", required: "Não", description: tContent("props.items.className") },
              { name: "children",   type: "React.ReactNode", defaultValue: "—", required: "Sim", description: tContent("props.items.children") },
            ],
          },
          {
            title: tContent("props.tableHeadTitle"),
            cols: {
              prop:        tContent("props.table.prop"),
              type:        tContent("props.table.type"),
              default:     tContent("props.table.default"),
              required:    tContent("props.table.required"),
              description: tContent("props.table.description"),
            },
            items: [
              { name: "scope",     type: '"col" | "row" | "colgroup" | "rowgroup"', defaultValue: "—", required: "Sim", description: stripHtml(tContent("props.items.scope")) },
              { name: "className", type: "string", defaultValue: "—", required: "Não", description: tContent("props.items.className") },
              { name: "children",  type: "React.ReactNode", defaultValue: "—", required: "Sim", description: tContent("props.items.children") },
            ],
          },
          {
            title: tContent("props.tableCellTitle"),
            cols: {
              prop:        tContent("props.table.prop"),
              type:        tContent("props.table.type"),
              default:     tContent("props.table.default"),
              required:    tContent("props.table.required"),
              description: tContent("props.table.description"),
            },
            items: [
              { name: "colSpan",   type: "number", defaultValue: "—", required: "Não", description: stripHtml(tContent("props.items.colSpan")) },
              { name: "rowSpan",   type: "number", defaultValue: "—", required: "Não", description: stripHtml(tContent("props.items.rowSpan")) },
              { name: "className", type: "string", defaultValue: "—", required: "Não", description: tContent("props.items.className") },
              { name: "children",  type: "React.ReactNode", defaultValue: "—", required: "Sim", description: tContent("props.items.children") },
            ],
          },
          {
            title: tContent("props.tableCaptionTitle"),
            cols: {
              prop:        tContent("props.table.prop"),
              type:        tContent("props.table.type"),
              default:     tContent("props.table.default"),
              required:    tContent("props.table.required"),
              description: tContent("props.table.description"),
            },
            items: [
              { name: "className", type: "string", defaultValue: "—", required: "Não", description: tContent("props.items.className") },
              { name: "children",  type: "React.ReactNode", defaultValue: "—", required: "Sim", description: tContent("props.items.children") },
            ],
          },
        ]}
        interfaceCode={interfaceCode}
        extensibilityTitle={tContent("props.extensibilityTitle")}
        extensibilityNotes={tContent("props.extensibility")}
      />

      {/* ── Tokens ───────────────────────────────────────────────── */}
      <DocsTokens
        title={tContent("tokens.title")}
        cols={{
          token:       tContent("tokens.table.token"),
          value:       tContent("tokens.table.part"),
          description: tContent("tokens.table.description"),
        }}
        items={[
          { token: "border-b",                       value: "TableHeader / TableBody / TableRow", description: tContent("tokens.items.borderB") },
          { token: "bg-muted/50",                    value: "TableFooter / TableRow (hover)",     description: tContent("tokens.items.bgMuted") },
          { token: "data-[state=selected]:bg-muted", value: "TableRow",                           description: tContent("tokens.items.bgMutedSelected") },
          { token: "text-muted-foreground",           value: "TableCaption / empty state",         description: tContent("tokens.items.textMuted") },
          { token: "font-medium",                    value: "TableHead / TableFooter",             description: tContent("tokens.items.fontMedium") },
          { token: "h-10",                           value: "TableHead",                           description: tContent("tokens.items.h10") },
          { token: "p-2",                            value: "TableCell",                           description: tContent("tokens.items.p2") },
          { token: "caption-bottom",                 value: "Table (caption)",                     description: tContent("tokens.items.captionBottom") },
        ]}
        customizationTitle={tContent("tokens.customizationTitle")}
      />

      {/* ── Acessibilidade ───────────────────────────────────────── */}
      <DocsAccessibility
        title={tContent("accessibility.title")}
        summary={tContent("accessibility.summary")}
        items={[
          tContent("accessibility.aria.scope"),
          tContent("accessibility.aria.caption"),
          tContent("accessibility.aria.ariaLabel"),
          tContent("accessibility.aria.ariaSort"),
          tContent("accessibility.aria.tabIndex"),
        ]}
        keyboardTitle={tNav("common.keyboardNavigation")}
        keyboardItems={[
          { key: "Tab",   description: tContent("accessibility.keyboard.tab") },
          { key: "Enter", description: tContent("accessibility.keyboard.enter") },
          { key: "Space", description: tContent("accessibility.keyboard.space") },
          { key: "—",     description: tContent("accessibility.keyboard.noKeyboard") },
        ]}
      />

      {/* ── Relacionados ─────────────────────────────────────────── */}
      <DocsRelated
        title={tContent("related.title")}
        componentSlug="table"
        items={[
          {
            name: "Skeleton",
            description: tContent("related.skeleton"),
            path: "?path=/docs/ui-skeleton--docs",
          },
          {
            name: "Badge",
            description: tContent("related.badge"),
            path: "?path=/docs/ui-badge--docs",
          },
          {
            name: "Pagination",
            description: tContent("related.pagination"),
            path: "?path=/docs/ui-pagination--docs",
          },
          {
            name: "DropdownMenu",
            description: tContent("related.dropdownMenu"),
            path: "?path=/docs/ui-dropdownmenu--docs",
          },
        ]}
      />

      {/* ── Notas ────────────────────────────────────────────────── */}
      <DocsNotes
        title={tContent("notes.title")}
        componentSlug="table"
        items={[
          { title: "", content: tContent("notes.tip1") },
          { title: "", content: tContent("notes.tip2") },
          { title: "", content: tContent("notes.tip3") },
          { title: "", content: tContent("notes.tip4") },
          { title: "", content: tContent("notes.tip5") },
        ]}
      />

      {/* ── Analytics ────────────────────────────────────────────── */}
      <DocsAnalytics
        title={tContent("analytics.title")}
        cols={{
          event:   tContent("analytics.table.event"),
          trigger: tContent("analytics.table.trigger"),
          payload: tContent("analytics.table.payload"),
        }}
        items={[
          {
            event:   tContent("analytics.table.pageView"),
            trigger: tContent("analytics.table.pageViewTrigger"),
            payload: tContent("analytics.table.pageViewPayload"),
          },
          {
            event:   tContent("analytics.table.sectionViewed"),
            trigger: tContent("analytics.table.sectionViewedTrigger"),
            payload: tContent("analytics.table.sectionViewedPayload"),
          },
          {
            event:   tContent("analytics.table.langSwitch"),
            trigger: tContent("analytics.table.langSwitchTrigger"),
            payload: tContent("analytics.table.langSwitchPayload"),
          },
        ]}
      />

      {/* ── Testes ───────────────────────────────────────────────── */}
      <DocsTestes
        title={tContent("testes.title")}
        functional={{
          title: tContent("testes.functional.title"),
          cols: {
            action:   tNav("common.userAction"),
            result:   tNav("common.expectedResult"),
            priority: tNav("common.priority"),
          },
          items: [
            {
              action:   tContent("testes.functional.item1.action"),
              result:   tContent("testes.functional.item1.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item1.priority")] ?? "common.high"),
            },
            {
              action:   tContent("testes.functional.item2.action"),
              result:   tContent("testes.functional.item2.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item2.priority")] ?? "common.high"),
            },
            {
              action:   tContent("testes.functional.item3.action"),
              result:   tContent("testes.functional.item3.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item3.priority")] ?? "common.medium"),
            },
            {
              action:   tContent("testes.functional.item4.action"),
              result:   tContent("testes.functional.item4.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item4.priority")] ?? "common.medium"),
            },
            {
              action:   tContent("testes.functional.item5.action"),
              result:   tContent("testes.functional.item5.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item5.priority")] ?? "common.high"),
            },
            {
              action:   tContent("testes.functional.item6.action"),
              result:   tContent("testes.functional.item6.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item6.priority")] ?? "common.medium"),
            },
          ],
        }}
        accessibility={{
          title: tContent("testes.accessibility.title"),
          cols: {
            criterion: tNav("common.criterion"),
            level:     "WCAG",
            how:       tNav("common.howToVerify"),
          },
          items: [
            {
              criterion: tContent("testes.accessibility.item1.criterion"),
              level:     tContent("testes.accessibility.item1.level"),
              how:       tContent("testes.accessibility.item1.how"),
            },
            {
              criterion: tContent("testes.accessibility.item2.criterion"),
              level:     tContent("testes.accessibility.item2.level"),
              how:       tContent("testes.accessibility.item2.how"),
            },
            {
              criterion: tContent("testes.accessibility.item3.criterion"),
              level:     tContent("testes.accessibility.item3.level"),
              how:       tContent("testes.accessibility.item3.how"),
            },
            {
              criterion: tContent("testes.accessibility.item4.criterion"),
              level:     tContent("testes.accessibility.item4.level"),
              how:       tContent("testes.accessibility.item4.how"),
            },
          ],
        }}
        visual={{
          title: tContent("testes.visual.title"),
          cols: {
            story:    tNav("common.storyState"),
            priority: tNav("common.priority"),
          },
          items: [
            { story: tContent("testes.visual.item1.story"), priority: tNav(priorityKeyMap[tContent("testes.visual.item1.priority")] ?? "common.high") },
            { story: tContent("testes.visual.item2.story"), priority: tNav(priorityKeyMap[tContent("testes.visual.item2.priority")] ?? "common.high") },
            { story: tContent("testes.visual.item3.story"), priority: tNav(priorityKeyMap[tContent("testes.visual.item3.priority")] ?? "common.medium") },
            { story: tContent("testes.visual.item4.story"), priority: tNav(priorityKeyMap[tContent("testes.visual.item4.priority")] ?? "common.medium") },
            { story: tContent("testes.visual.item5.story"), priority: tNav(priorityKeyMap[tContent("testes.visual.item5.priority")] ?? "common.medium") },
          ],
        }}
      />
    </DocsPageLayout>
  );
}
