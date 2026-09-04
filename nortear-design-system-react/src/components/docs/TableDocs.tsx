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
import { stripHtml, toPlainText } from "@/lib/strip-html";

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria.
  const screenReaderItems = useMemo(
    () =>
      Object.values(
        (tableTranslations as unknown as Record<
          string,
          { accessibility?: { screenReader?: Record<string, string> } }
        >)[locale]?.accessibility?.screenReader ?? {},
      ),
    [locale],
  );

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
  <TableCaption className="nds-sr-only">Lista de faturas recentes</TableCaption>
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
  <TableCaption className="nds-sr-only">Lista de faturas recentes</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead scope="col">Fatura</TableHead>
      <TableHead scope="col">Status</TableHead>
      <TableHead scope="col">Método</TableHead>
      <TableHead scope="col">Valor</TableHead>
      <TableHead scope="col"><span className="nds-sr-only">Ações</span></TableHead>
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
            <MoreHorizontal className="nds-icon" aria-hidden="true" />
          </Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>`;

  const codeEmpty = `<Table>
  <TableCaption className="nds-sr-only">Lista de faturas recentes</TableCaption>
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
        className="nds-table-empty"
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
        />
      }
    >
      {/* ── Demonstração ─────────────────────────────────────────── */}
      <DocsDemonstration title={tContent("demonstration.title")}>
        <div className="nds-w-full">
          <Table>
            <TableCaption className="nds-sr-only">
              {tContent("demonstration.labels.caption")}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">{tContent("demonstration.labels.invoice")}</TableHead>
                <TableHead scope="col">{tContent("demonstration.labels.status")}</TableHead>
                <TableHead scope="col">{tContent("demonstration.labels.method")}</TableHead>
                <TableHead scope="col" className="nds-text-right">
                  {tContent("demonstration.labels.amount")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="nds-font-medium">{invoice.id}</TableCell>
                  <TableCell>{invoice.status}</TableCell>
                  <TableCell>{invoice.method}</TableCell>
                  <TableCell className="nds-text-right">{invoice.amount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3}>{tContent("demonstration.labels.total")}</TableCell>
                <TableCell className="nds-text-right">
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
              <div className="nds-w-full nds-overflow-x">
                <Table>
                  <TableCaption className="nds-sr-only">Lista de faturas</TableCaption>
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
              <div className="nds-w-full nds-overflow-x">
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
            doCaption: toPlainText(tContent("doDont.pair1.do")),
            dontCaption: toPlainText(tContent("doDont.pair1.dont")),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <div className="nds-w-full nds-overflow-x">
                <Table>
                  <TableCaption className="nds-sr-only">Lista de faturas</TableCaption>
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
                        className="nds-table-empty"
                      >
                        Nenhuma fatura encontrada.
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            ),
            dontPreview: (
              <div className="nds-w-full nds-overflow-x">
                <Table>
                  <TableCaption className="nds-sr-only">Lista de faturas</TableCaption>
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
            doCaption: toPlainText(tContent("doDont.pair2.do")),
            dontCaption: toPlainText(tContent("doDont.pair2.dont")),
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
            trackId: "basic",
            name: tContent("variants.items.basic.label"),
            description: stripHtml(tContent("variants.items.basic.description")),
            code: codeBasic,
            preview: (
              <div className="nds-w-full nds-overflow-x">
                <Table>
                  <TableCaption>Lista de faturas recentes</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col">Fatura</TableHead>
                      <TableHead scope="col">Status</TableHead>
                      <TableHead scope="col">Método</TableHead>
                      <TableHead scope="col" className="nds-text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="nds-font-medium">{invoice.id}</TableCell>
                        <TableCell>{invoice.status}</TableCell>
                        <TableCell>{invoice.method}</TableCell>
                        <TableCell className="nds-text-right">{invoice.amount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ),
          },
          {
            trackId: "withFooter",
            name: tContent("variants.items.withFooter.label"),
            description: stripHtml(tContent("variants.items.withFooter.description")),
            code: codeWithFooter,
            preview: (
              <div className="nds-w-full nds-overflow-x">
                <Table>
                  <TableCaption>Lista de faturas recentes</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col">Fatura</TableHead>
                      <TableHead scope="col">Status</TableHead>
                      <TableHead scope="col">Método</TableHead>
                      <TableHead scope="col" className="nds-text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="nds-font-medium">{invoice.id}</TableCell>
                        <TableCell>{invoice.status}</TableCell>
                        <TableCell>{invoice.method}</TableCell>
                        <TableCell className="nds-text-right">{invoice.amount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={3}>Total</TableCell>
                      <TableCell className="nds-text-right">R$ 1.400,00</TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            ),
          },
          {
            trackId: "withSrOnlyCaption",
            name: tContent("variants.items.withSrOnlyCaption.label"),
            description: stripHtml(tContent("variants.items.withSrOnlyCaption.description")),
            code: codeSrOnlyCaption,
            preview: (
              <div className="nds-w-full nds-overflow-x">
                <Table>
                  <TableCaption className="nds-sr-only">Lista de faturas recentes</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col">Fatura</TableHead>
                      <TableHead scope="col">Status</TableHead>
                      <TableHead scope="col">Método</TableHead>
                      <TableHead scope="col" className="nds-text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="nds-font-medium">{invoice.id}</TableCell>
                        <TableCell>{invoice.status}</TableCell>
                        <TableCell>{invoice.method}</TableCell>
                        <TableCell className="nds-text-right">{invoice.amount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ),
          },
          {
            trackId: "withInlineActions",
            name: tContent("variants.items.withInlineActions.label"),
            description: stripHtml(tContent("variants.items.withInlineActions.description")),
            code: codeWithActions,
            preview: (
              <div className="nds-w-full nds-overflow-x">
                <Table>
                  <TableCaption className="nds-sr-only">Lista de faturas recentes</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col">Fatura</TableHead>
                      <TableHead scope="col">Status</TableHead>
                      <TableHead scope="col">Método</TableHead>
                      <TableHead scope="col" className="nds-text-right">Valor</TableHead>
                      <TableHead scope="col">
                        <span className="nds-sr-only">Ações</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="nds-font-medium">{invoice.id}</TableCell>
                        <TableCell>{invoice.status}</TableCell>
                        <TableCell>{invoice.method}</TableCell>
                        <TableCell className="nds-text-right">{invoice.amount}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Ações para fatura ${invoice.id}`}
                          >
                            <MoreHorizontal className="nds-icon" aria-hidden="true" />
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
            trackId: "withEmptyState",
            name: tContent("variants.items.withEmptyState.label"),
            description: stripHtml(tContent("variants.items.withEmptyState.description")),
            code: codeEmpty,
            preview: (
              <div className="nds-w-full nds-overflow-x">
                <Table>
                  <TableCaption className="nds-sr-only">Lista de faturas recentes</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col">Fatura</TableHead>
                      <TableHead scope="col">Status</TableHead>
                      <TableHead scope="col">Método</TableHead>
                      <TableHead scope="col" className="nds-text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="nds-table-empty"
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
            trackId: "filterableToolbar",
            name: tContent("variants.compositions.filterableToolbar.name"),
            description: tContent("variants.compositions.filterableToolbar.description"),
            useWhen: tContent("variants.compositions.filterableToolbar.use"),
            code: `<div className="nds-stack" data-spacing="sm">
  <div className="nds-cluster" data-align="center" data-spacing="md">
    <div className="nds-w-full nds-max-w-sm" style={{ position: "relative" }}>
      <Search className="nds-icon-input-start nds-icon nds-text-muted-foreground" aria-hidden="true" />
      <Input placeholder="Filtrar faturas..." style={{ paddingLeft: "2rem" }} />
    </div>
    <Button variant="outline">Status</Button>
  </div>
  <Table>
    <TableCaption className="nds-sr-only">Lista de faturas filtráveis</TableCaption>
    <TableHeader>
      <TableRow>
        <TableHead scope="col">Fatura</TableHead>
        <TableHead scope="col">Status</TableHead>
        <TableHead scope="col" className="nds-text-right">Valor</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {filteredInvoices.map((invoice) => (
        <TableRow key={invoice.id}>
          <TableCell>{invoice.id}</TableCell>
          <TableCell>{invoice.status}</TableCell>
          <TableCell className="nds-text-right">{invoice.amount}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</div>`,
            preview: (
              <div className="nds-w-full nds-stack" data-spacing="sm">
                <div className="nds-cluster" data-align="center" data-spacing="md">
                  <div className="nds-w-full nds-max-w-sm" style={{ position: "relative" }}>
                    <Search className="nds-icon-input-start nds-icon nds-text-muted-foreground" aria-hidden="true" />
                    <Input placeholder="Filtrar faturas..." style={{ paddingLeft: "2rem" }} />
                  </div>
                  <Button variant="outline">Status</Button>
                </div>
                <div className="nds-w-full nds-overflow-x">
                  <Table>
                    <TableCaption className="nds-sr-only">Lista de faturas filtráveis</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead scope="col">Fatura</TableHead>
                        <TableHead scope="col">Status</TableHead>
                        <TableHead scope="col" className="nds-text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.slice(0, 3).map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="nds-font-medium">{invoice.id}</TableCell>
                          <TableCell>{invoice.status}</TableCell>
                          <TableCell className="nds-text-right">{invoice.amount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ),
          },
          {
            trackId: "sortableHeaders",
            name: tContent("variants.compositions.sortableHeaders.name"),
            description: tContent("variants.compositions.sortableHeaders.description"),
            useWhen: tContent("variants.compositions.sortableHeaders.use"),
            code: `<Table>
  <TableHeader>
    <TableRow>
      <TableHead scope="col" aria-sort="ascending">
        <Button variant="ghost" size="sm">
          Fatura
          <ArrowUpDown className="nds-ml-2 nds-icon" aria-hidden="true" />
        </Button>
      </TableHead>
      <TableHead scope="col" aria-sort="none">
        <Button variant="ghost" size="sm">
          Valor
          <ArrowUpDown className="nds-ml-2 nds-icon" aria-hidden="true" />
        </Button>
      </TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>{/* rows */}</TableBody>
</Table>`,
            preview: (
              <div className="nds-w-full nds-overflow-x">
                <Table>
                  <TableCaption className="nds-sr-only">Faturas ordenáveis</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col" aria-sort="ascending">
                        <Button variant="ghost" size="sm">
                          Fatura
                          <ArrowUpDown className="nds-ml-2 nds-icon" aria-hidden="true" />
                        </Button>
                      </TableHead>
                      <TableHead scope="col" aria-sort="none">
                        <Button variant="ghost" size="sm">
                          Status
                          <ArrowUpDown className="nds-ml-2 nds-icon" aria-hidden="true" />
                        </Button>
                      </TableHead>
                      <TableHead scope="col" aria-sort="none" className="nds-text-right">
                        <Button variant="ghost" size="sm">
                          Valor
                          <ArrowUpDown className="nds-ml-2 nds-icon" aria-hidden="true" />
                        </Button>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.slice(0, 3).map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="nds-font-medium">{invoice.id}</TableCell>
                        <TableCell>{invoice.status}</TableCell>
                        <TableCell className="nds-text-right">{invoice.amount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ),
          },
          {
            trackId: "selectableRows",
            name: tContent("variants.compositions.selectableRows.name"),
            description: tContent("variants.compositions.selectableRows.description"),
            useWhen: tContent("variants.compositions.selectableRows.use"),
            code: `<Table>
  <TableHeader>
    <TableRow>
      <TableHead scope="col">
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
              <div className="nds-w-full nds-overflow-x">
                <Table>
                  <TableCaption className="nds-sr-only">Faturas com seleção</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col">
                        <Checkbox aria-label="Selecionar todas as linhas" />
                      </TableHead>
                      <TableHead scope="col">Fatura</TableHead>
                      <TableHead scope="col">Status</TableHead>
                      <TableHead scope="col" className="nds-text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow data-state="selected">
                      <TableCell>
                        <Checkbox defaultChecked aria-label="Selecionar fatura #INV-001" />
                      </TableCell>
                      <TableCell className="nds-font-medium">#INV-001</TableCell>
                      <TableCell>Pago</TableCell>
                      <TableCell className="nds-text-right">R$ 250,00</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Checkbox aria-label="Selecionar fatura #INV-002" />
                      </TableCell>
                      <TableCell className="nds-font-medium">#INV-002</TableCell>
                      <TableCell>Pendente</TableCell>
                      <TableCell className="nds-text-right">R$ 150,00</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Checkbox aria-label="Selecionar fatura #INV-003" />
                      </TableCell>
                      <TableCell className="nds-font-medium">#INV-003</TableCell>
                      <TableCell>Cancelado</TableCell>
                      <TableCell className="nds-text-right">R$ 350,00</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            ),
          },
          {
            trackId: "withPagination",
            name: tContent("variants.compositions.withPagination.name"),
            description: tContent("variants.compositions.withPagination.description"),
            useWhen: tContent("variants.compositions.withPagination.use"),
            code: `<div className="nds-stack" data-spacing="sm">
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
              <div className="nds-w-full nds-stack" data-spacing="sm">
                <div className="nds-w-full nds-overflow-x">
                  <Table>
                    <TableCaption className="nds-sr-only">Faturas paginadas</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead scope="col">Fatura</TableHead>
                        <TableHead scope="col">Status</TableHead>
                        <TableHead scope="col" className="nds-text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.slice(0, 3).map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="nds-font-medium">{invoice.id}</TableCell>
                          <TableCell>{invoice.status}</TableCell>
                          <TableCell className="nds-text-right">{invoice.amount}</TableCell>
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
          trigger: toPlainText(tContent("states.cols.trigger")),
          behavior: toPlainText(tContent("states.cols.behavior")),
        }}
        items={[
          {
            label:    tContent("states.empty.label"),
            trigger:  toPlainText(tContent("states.empty.trigger")),
            behavior: toPlainText(tContent("states.empty.behavior")),
          },
          {
            label:    tContent("states.selected.label"),
            trigger:  toPlainText(tContent("states.selected.trigger")),
            behavior: toPlainText(tContent("states.selected.behavior")),
          },
          {
            label:    tContent("states.loading.label"),
            trigger:  toPlainText(tContent("states.loading.trigger")),
            behavior: toPlainText(tContent("states.loading.behavior")),
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
          { token: "--border",                       value: "TableHeader / TableBody / TableRow", description: tContent("tokens.items.borderB") },
          { token: "--muted",                    value: "TableFooter / TableRow (hover)",     description: tContent("tokens.items.bgMuted") },
          { token: "--muted", value: "TableRow",                           description: tContent("tokens.items.bgMutedSelected") },
          { token: "--muted-foreground",           value: "TableCaption / empty state",         description: tContent("tokens.items.textMuted") },
          { token: "--font-weight-medium",                    value: "TableHead / TableFooter",             description: tContent("tokens.items.fontMedium") },
          { token: "--spacing-10",                           value: "TableHead",                           description: tContent("tokens.items.h10") },
          { token: "--spacing-2",                            value: "TableCell",                           description: tContent("tokens.items.p2") },
          { token: "caption-side",                 value: "Table (caption)",                     description: tContent("tokens.items.captionBottom") },
        ]}
        customizationTitle={tContent("tokens.customizationTitle")}
      />

      {/* ── Acessibilidade ───────────────────────────────────────── */}
      <DocsAccessibility
        screenReaderTitle={tNav("common.screenReader")}
        screenReaderItems={screenReaderItems}
        title={tContent("accessibility.title")}
        summary={tContent("accessibility.summary")}
        items={[
          tContent("accessibility.aria.scope"),
          tContent("accessibility.aria.caption"),
          tContent("accessibility.aria.ariaLabel"),
          tContent("accessibility.aria.ariaSort"),
          tContent("accessibility.aria.tabIndex"),
        ]}
        keyboardTitle={tNav("common.keyboardNav")}
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
            description: toPlainText(tContent("related.skeleton")),
            path: "?path=/docs/components-feedback-skeleton--docs",
          },
          {
            name: "Badge",
            description: toPlainText(tContent("related.badge")),
            path: "?path=/docs/components-feedback-badge--docs",
          },
          {
            name: "Pagination",
            description: toPlainText(tContent("related.pagination")),
            path: "?path=/docs/components-navigation-pagination--docs",
          },
          {
            name: "DropdownMenu",
            description: toPlainText(tContent("related.dropdownMenu")),
            path: "?path=/docs/components-overlay-dropdownmenu--docs",
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
          trigger: toPlainText(tContent("analytics.table.trigger")),
          payload: tContent("analytics.table.payload"),
        }}
        items={[
          {
            event:   tContent("analytics.table.pageView"),
            trigger: toPlainText(tContent("analytics.table.pageViewTrigger")),
            payload: tContent("analytics.table.pageViewPayload"),
          },
          {
            event:   tContent("analytics.table.sectionViewed"),
            trigger: toPlainText(tContent("analytics.table.sectionViewedTrigger")),
            payload: tContent("analytics.table.sectionViewedPayload"),
          },
          {
            event:   tContent("analytics.table.langSwitch"),
            trigger: toPlainText(tContent("analytics.table.langSwitchTrigger")),
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
