import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUpDown, ChevronDown, Search } from "lucide-react";
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

/**
 * Quais itens a seção publica HOJE, perguntado ao dicionário.
 *
 * Contar à mão envelhece em silêncio: o conteúdo compartilhado cresce nos três
 * idiomas e a lista da tela fica para trás sem nada ficar vermelho — foi assim
 * que um teste funcional e um visual ficaram escritos e invisíveis. Cravar o
 * número novo repete o defeito daqui a um item.
 */
const itemIndices = (section: unknown): number[] =>
  Object.keys((section ?? {}) as Record<string, unknown>)
    .map((key) => /^item(\d+)$/.exec(key)?.[1])
    .filter((digits): digits is string => digits !== undefined)
    .map(Number)
    .sort((a, b) => a - b);

const priorityKeyMap: Record<string, string> = {
  high:   "common.high",
  medium: "common.medium",
  low:    "common.low",
};

// ─── Prévia de linhas expansíveis ────────────────────────────────────────────

type DemoInvoice = {
  id: string;
  status: string;
  method: string;
  amount: string;
};

/** Id da linha revelada, sem o "#": ele quebraria qualquer seletor. */
const detailRowId = (id: string) => `docs-table-row-detail-${id.replace("#", "")}`;

/**
 * A prévia viva da variante `withExpandableRows`, na mesma forma da story
 * `WithExpandableRows` e em escala menor (três registros).
 *
 * Vive fora de `TableDocs` porque tem estado próprio: o conjunto de linhas
 * abertas é do exemplo, não da página. As quatro decisões da forma, e o motivo
 * de cada uma:
 *
 * 1. **`aria-expanded` no BOTÃO, nunca na linha.** A linha já usa `data-state`
 *    para a SELEÇÃO, e os dois estados coexistem — uma linha marcada pode estar
 *    aberta. Quem faz a linha reagir ao controle é a folha compartilhada, por
 *    `tbody tr:has([aria-expanded="true"])`.
 * 2. **A revelada é IRMÃ, sempre no DOM, escondida por `hidden`.** O `id` dela é
 *    o alvo do `aria-controls`, e um alvo que some deixa o atributo apontando
 *    para nada. O `colSpan` é das colunas de dado mais a do disclosure.
 * 3. **A coluna do disclosure vem primeiro e TEM cabeçalho**, com o rótulo fora
 *    da tela num `<span>` — e não por classe no `<th>`, que desmontaria a grade.
 * 4. **A ordem de foco sai do DOM.** A linha revelada vem logo depois da linha
 *    de dados, então o botão que ela contém é o próximo ponto de tabulação
 *    depois do controle, sem `tabIndex` nenhum.
 *
 * A segunda linha nasce MARCADA: aberta e selecionada ao mesmo tempo é o caso
 * que o `:not([data-state="selected"])` da folha compartilhada protege (C18).
 */
function ExpandableRowsPreview({
  invoices,
  t,
}: {
  invoices: readonly DemoInvoice[];
  t: (key: string) => string;
}) {
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());

  const toggle = (id: string) =>
    setExpanded((atual) => {
      const next = new Set(atual);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="nds-w-full">
      <Table>
        <TableCaption className="nds-sr-only">
          {t("demonstration.labels.caption")}
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">
              <span className="nds-sr-only">{t("demonstration.labels.detailsColumn")}</span>
            </TableHead>
            <TableHead scope="col">{t("demonstration.labels.invoice")}</TableHead>
            <TableHead scope="col">{t("demonstration.labels.status")}</TableHead>
            <TableHead scope="col">{t("demonstration.labels.method")}</TableHead>
            <TableHead scope="col" className="nds-text-right">
              {t("demonstration.labels.amount")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice, index) => (
            <Fragment key={invoice.id}>
              <TableRow data-state={index === 1 ? "selected" : undefined}>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-expanded={expanded.has(invoice.id)}
                    aria-controls={detailRowId(invoice.id)}
                    aria-label={`${t("demonstration.labels.detailsLabel")} ${invoice.id}`}
                    onClick={() => toggle(invoice.id)}
                  >
                    <ChevronDown className="nds-chevron" aria-hidden="true" />
                  </Button>
                </TableCell>
                <TableCell className="nds-font-medium">{invoice.id}</TableCell>
                <TableCell>{invoice.status}</TableCell>
                <TableCell>{invoice.method}</TableCell>
                <TableCell className="nds-text-right">{invoice.amount}</TableCell>
              </TableRow>

              <TableRow id={detailRowId(invoice.id)} hidden={!expanded.has(invoice.id)}>
                <TableCell colSpan={5}>
                  <div className="nds-stack" data-spacing="sm">
                    <p className="nds-text-muted-foreground">
                      {t("demonstration.labels.detailText")}
                    </p>
                    {/* Um controle dentro do detalhe: é ele que prova que o
                        conteúdo revelado vem depois do disclosure na tabulação —
                        e que some dela quando a linha fecha. */}
                    <Button
                      variant="outline"
                      size="sm"
                      aria-label={`${t("demonstration.labels.receiptLabel")} ${invoice.id}`}
                    >
                      {t("demonstration.labels.receipt")}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

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
  // O `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
  const screenReaderItems = useMemo(
    () =>
      Object.entries(
        (tableTranslations as unknown as Record<
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
    const testes = (tableTranslations as unknown as Record<
      string,
      { testes?: Record<string, unknown> }
    >)[locale]?.testes;
    return {
      functional: itemIndices(testes?.functional),
      accessibility: itemIndices(testes?.accessibility),
      visual: itemIndices(testes?.visual),
    };
  }, [locale]);

  /**
   * Dados de exemplo — a linha carrega o TEXTO JÁ TRADUZIDO, resolvido chave a
   * chave em `demonstration.labels`.
   *
   * Estava cravado em português no módulo, e por isso a tabela mostrava "Pago",
   * "Cartão de crédito" e valores em reais no meio de uma página em inglês. O
   * caminho é escrito por extenso de propósito: chave montada por interpolação
   * some das buscas e o auditor de conteúdo não a alcança.
   */
  const invoices = useMemo(
    () => [
      {
        id:     tContent("demonstration.labels.inv001"),
        status: tContent("demonstration.labels.paid"),
        method: tContent("demonstration.labels.creditCard"),
        amount: tContent("demonstration.labels.amount001"),
      },
      {
        id:     tContent("demonstration.labels.inv002"),
        status: tContent("demonstration.labels.pending"),
        method: tContent("demonstration.labels.bankTransfer"),
        amount: tContent("demonstration.labels.amount002"),
      },
      {
        id:     tContent("demonstration.labels.inv003"),
        status: tContent("demonstration.labels.canceled"),
        method: tContent("demonstration.labels.pix"),
        amount: tContent("demonstration.labels.amount003"),
      },
      {
        id:     tContent("demonstration.labels.inv004"),
        status: tContent("demonstration.labels.paid"),
        method: tContent("demonstration.labels.creditCard"),
        amount: tContent("demonstration.labels.amount004"),
      },
      {
        id:     tContent("demonstration.labels.inv005"),
        status: tContent("demonstration.labels.pending"),
        method: tContent("demonstration.labels.pix"),
        amount: tContent("demonstration.labels.amount005"),
      },
    ],
    [tContent],
  );

  /**
   * Rótulo de coluna por CAMINHO POR EXTENSO, nunca interpolado.
   *
   * A prévia é componente VIVO: o que ela escreve é tela, não snippet, e
   * cabeçalho cravado em português aparecia no meio de uma página em inglês —
   * o mesmo defeito que os dados da linha já tinham. O caminho literal também é
   * o que a varredura de conteúdo enxerga; chave montada em template some dela.
   */
  const columnLabel = useMemo(
    () => ({
      invoice: tContent("demonstration.labels.invoice"),
      status:  tContent("demonstration.labels.status"),
      method:  tContent("demonstration.labels.method"),
      amount:  tContent("demonstration.labels.amount"),
      actions: tContent("demonstration.labels.actions"),
    }),
    [tContent],
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
      <TableCell>R$ 1.250,00</TableCell>
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
  <TableCaption>Lista de faturas recentes</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead scope="col">Fatura</TableHead>
      <TableHead scope="col">Status</TableHead>
      <TableHead scope="col">Método</TableHead>
      <TableHead scope="col">Valor</TableHead>
      <TableHead scope="col">Ações</TableHead>
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
            size="sm"
            aria-label={\`Ações para fatura \${invoice.id}\`}
          >
            …
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

  const codeExpandableRows = `const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
const detailRowId = (id: string) => \`table-row-detail-\${id.replace("#", "")}\`;

<Table>
  <TableCaption className="nds-sr-only">Lista de faturas recentes</TableCaption>
  <TableHeader>
    <TableRow>
      {/* A coluna do disclosure vem primeiro; o rótulo dela sai da tela. */}
      <TableHead scope="col"><span className="nds-sr-only">Detalhes</span></TableHead>
      <TableHead scope="col">Fatura</TableHead>
      <TableHead scope="col">Status</TableHead>
      <TableHead scope="col">Método</TableHead>
      <TableHead scope="col">Valor</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {invoices.map((invoice) => (
      <Fragment key={invoice.id}>
        <TableRow data-state={selected.has(invoice.id) ? "selected" : undefined}>
          <TableCell>
            {/* O estado vive no BOTÃO: a linha já usa o \`data-state\` dela
                para a seleção, e os dois acontecem juntos. */}
            <Button
              variant="ghost"
              size="icon-sm"
              aria-expanded={expanded.has(invoice.id)}
              aria-controls={detailRowId(invoice.id)}
              aria-label={\`Detalhes da fatura \${invoice.id}\`}
              onClick={() => toggle(invoice.id)}
            >
              <ChevronDown className="nds-chevron" aria-hidden="true" />
            </Button>
          </TableCell>
          <TableCell>{invoice.id}</TableCell>
          <TableCell>{invoice.status}</TableCell>
          <TableCell>{invoice.method}</TableCell>
          <TableCell>{invoice.amount}</TableCell>
        </TableRow>

        {/* A revelada é IRMÃ e fica SEMPRE no DOM: \`hidden\` tira da tela, da
            árvore de acessibilidade e da tabulação de uma vez, e o \`id\`
            continua sendo alvo válido do \`aria-controls\`. */}
        <TableRow id={detailRowId(invoice.id)} hidden={!expanded.has(invoice.id)}>
          <TableCell colSpan={5}>
            <div className="nds-stack" data-spacing="sm">
              <p className="nds-text-muted-foreground">
                Emitida em 03/09/2026, com vencimento em 03/10/2026.
              </p>
              <Button variant="outline" size="sm" aria-label={\`Baixar recibo da fatura \${invoice.id}\`}>
                Baixar recibo
              </Button>
            </div>
          </TableCell>
        </TableRow>
      </Fragment>
    ))}
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
      <DocsDemonstration >
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
        pairs={[
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            // As duas prévias são IDÊNTICAS a menos da legenda, que é a única
            // coisa que este par trata. Nenhuma das duas escreve `scope`: o
            // `TableHead` já nasce com `scope="col"`, então um lado "sem scope"
            // renderizaria o atributo do mesmo jeito — e escrever
            // `scope={undefined}` para forçar o contraste ensinaria o leitor a
            // desarmar um default seguro.
            doPreview: (
              <div className="nds-w-full">
                <Table>
                  <TableCaption>{tContent("demonstration.labels.caption")}</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{columnLabel.invoice}</TableHead>
                      <TableHead>{columnLabel.amount}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>{tContent("demonstration.labels.inv001")}</TableCell>
                      <TableCell>{tContent("demonstration.labels.amount001")}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            ),
            dontPreview: (
              // Sem legenda: é o defeito que o par ilustra.
              <div className="nds-w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{columnLabel.invoice}</TableHead>
                      <TableHead>{columnLabel.amount}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>{tContent("demonstration.labels.inv001")}</TableCell>
                      <TableCell>{tContent("demonstration.labels.amount001")}</TableCell>
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
              <div className="nds-w-full">
                <Table>
                  <TableCaption>{tContent("demonstration.labels.caption")}</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col">{columnLabel.invoice}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      {/* `.nds-table-empty` é a classe que a folha declara para
                          isto: ela já traz `block-size`, centralização e a cor
                          esmaecida (D3 do PRD). */}
                      <TableCell colSpan={1} className="nds-table-empty">
                        {tContent("demonstration.labels.emptyState")}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            ),
            dontPreview: (
              <div className="nds-w-full">
                <Table>
                  <TableCaption>{tContent("demonstration.labels.caption")}</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col">{columnLabel.invoice}</TableHead>
                    </TableRow>
                  </TableHeader>
                  {/* Corpo vazio: é o defeito que o par ilustra. */}
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
      <DocsImport componentSlug="table"
        code={codeImport}
      />

      {/* ── Variantes ────────────────────────────────────────────── */}
      <DocsVariants
        componentSlug="table"
        items={[
          {
            trackId: "basic",
            name: tContent("variants.items.basic.label"),
            description: stripHtml(tContent("variants.items.basic.description")),
            code: codeBasic,
            preview: (
              <div className="nds-w-full">
                <Table>
                  <TableCaption>{tContent("demonstration.labels.caption")}</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col">{columnLabel.invoice}</TableHead>
                      <TableHead scope="col">{columnLabel.status}</TableHead>
                      <TableHead scope="col">{columnLabel.method}</TableHead>
                      <TableHead scope="col" className="nds-text-right">{columnLabel.amount}</TableHead>
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
              <div className="nds-w-full">
                <Table>
                  <TableCaption>{tContent("demonstration.labels.caption")}</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col">{columnLabel.invoice}</TableHead>
                      <TableHead scope="col">{columnLabel.status}</TableHead>
                      <TableHead scope="col">{columnLabel.method}</TableHead>
                      <TableHead scope="col" className="nds-text-right">{columnLabel.amount}</TableHead>
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
            ),
          },
          {
            trackId: "withSrOnlyCaption",
            name: tContent("variants.items.withSrOnlyCaption.label"),
            description: stripHtml(tContent("variants.items.withSrOnlyCaption.description")),
            code: codeSrOnlyCaption,
            preview: (
              <div className="nds-w-full">
                <Table>
                  <TableCaption className="nds-sr-only">{tContent("demonstration.labels.caption")}</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col">{columnLabel.invoice}</TableHead>
                      <TableHead scope="col">{columnLabel.status}</TableHead>
                      <TableHead scope="col">{columnLabel.method}</TableHead>
                      <TableHead scope="col" className="nds-text-right">{columnLabel.amount}</TableHead>
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
              <div className="nds-w-full">
                <Table>
                  <TableCaption>{tContent("demonstration.labels.caption")}</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col">{columnLabel.invoice}</TableHead>
                      <TableHead scope="col">{columnLabel.status}</TableHead>
                      <TableHead scope="col">{columnLabel.method}</TableHead>
                      <TableHead scope="col" className="nds-text-right">{columnLabel.amount}</TableHead>
                      {/* O rótulo da coluna de ações é VISÍVEL: a coluna existe
                          na grade e nomeá-la fora da tela deixava o leitor
                          vidente sem cabeçalho onde os outros quatro têm um. */}
                      <TableHead scope="col">{columnLabel.actions}</TableHead>
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
                          {/* Conteúdo visível `…` e nenhum ícone: o ícone de uma
                              ação só (lápis, reticência horizontal) promete UMA
                              coisa onde o exemplo documenta um MENU. O nome
                              acessível é o do registro. */}
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={`${tContent("demonstration.labels.actionsLabel")} ${invoice.id}`}
                          >
                            …
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
              <div className="nds-w-full">
                <Table>
                  <TableCaption className="nds-sr-only">{tContent("demonstration.labels.caption")}</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col">{columnLabel.invoice}</TableHead>
                      <TableHead scope="col">{columnLabel.status}</TableHead>
                      <TableHead scope="col">{columnLabel.method}</TableHead>
                      <TableHead scope="col" className="nds-text-right">{columnLabel.amount}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="nds-table-empty"
                      >
                        {tContent("demonstration.labels.emptyState")}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            ),
          },
          {
            trackId: "withExpandableRows",
            name: tContent("variants.items.withExpandableRows.label"),
            description: stripHtml(tContent("variants.items.withExpandableRows.description")),
            code: codeExpandableRows,
            preview: (
              <ExpandableRowsPreview invoices={invoices.slice(0, 3)} t={tContent} />
            ),
          },
        ]}
      />

      {/* ── Composições ──────────────────────────────────────────── */}
      <DocsCompositions
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
      <Input
        aria-label="Filtrar faturas"
        placeholder="Filtrar faturas"
        className="nds-pl-8"
      />
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
                    <Input
                      aria-label={tContent("demonstration.labels.filterLabel")}
                      placeholder={tContent("demonstration.labels.filterLabel")}
                      className="nds-pl-8"
                    />
                  </div>
                  {/* O filtro é POR coluna, então o rótulo dele é o da coluna. */}
                  <Button variant="outline">{columnLabel.status}</Button>
                </div>
                <div className="nds-w-full">
                  <Table>
                    <TableCaption className="nds-sr-only">{tContent("demonstration.labels.caption")}</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead scope="col">{columnLabel.invoice}</TableHead>
                        <TableHead scope="col">{columnLabel.status}</TableHead>
                        <TableHead scope="col" className="nds-text-right">{columnLabel.amount}</TableHead>
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
              <div className="nds-w-full">
                <Table>
                  <TableCaption className="nds-sr-only">{tContent("demonstration.labels.caption")}</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col" aria-sort="ascending">
                        <Button variant="ghost" size="sm">
                          {columnLabel.invoice}
                          <ArrowUpDown className="nds-ml-2 nds-icon" aria-hidden="true" />
                        </Button>
                      </TableHead>
                      <TableHead scope="col" aria-sort="none">
                        <Button variant="ghost" size="sm">
                          {columnLabel.status}
                          <ArrowUpDown className="nds-ml-2 nds-icon" aria-hidden="true" />
                        </Button>
                      </TableHead>
                      <TableHead scope="col" aria-sort="none" className="nds-text-right">
                        <Button variant="ghost" size="sm">
                          {columnLabel.amount}
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
        <Checkbox aria-label="Selecionar todas as faturas" />
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
              <div className="nds-w-full">
                <Table>
                  <TableCaption className="nds-sr-only">{tContent("demonstration.labels.caption")}</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col">
                        {/* O nome acessível da marcação também é conteúdo: ele
                            estava cravado aqui e vivia num override de uma stack
                            só, invisível para quem procurasse no dicionário. */}
                        <Checkbox aria-label={tContent("demonstration.labels.selectAll")} />
                      </TableHead>
                      <TableHead scope="col">{columnLabel.invoice}</TableHead>
                      <TableHead scope="col">{columnLabel.status}</TableHead>
                      <TableHead scope="col" className="nds-text-right">{columnLabel.amount}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.slice(0, 3).map((invoice, index) => (
                      <TableRow
                        key={invoice.id}
                        data-state={index === 0 ? "selected" : undefined}
                      >
                        <TableCell>
                          <Checkbox
                            defaultChecked={index === 0}
                            aria-label={`${tContent("demonstration.labels.selectRow")} ${invoice.id}`}
                          />
                        </TableCell>
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
            trackId: "withPagination",
            name: tContent("variants.compositions.withPagination.name"),
            description: tContent("variants.compositions.withPagination.description"),
            useWhen: tContent("variants.compositions.withPagination.use"),
            code: `<div className="nds-stack" data-spacing="sm">
  <Table>{/* ... */}</Table>
  <Pagination>
    <PaginationContent>
      <PaginationItem>
        <PaginationPrevious />
      </PaginationItem>
      <PaginationItem><PaginationLink isActive>1</PaginationLink></PaginationItem>
      <PaginationItem><PaginationLink>2</PaginationLink></PaginationItem>
      <PaginationItem><PaginationLink>3</PaginationLink></PaginationItem>
      <PaginationItem>
        <PaginationNext />
      </PaginationItem>
    </PaginationContent>
  </Pagination>
</div>`,
            preview: (
              <div className="nds-w-full nds-stack" data-spacing="sm">
                <div className="nds-w-full">
                  <Table>
                    <TableCaption className="nds-sr-only">{tContent("demonstration.labels.caption")}</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead scope="col">{columnLabel.invoice}</TableHead>
                        <TableHead scope="col">{columnLabel.status}</TableHead>
                        <TableHead scope="col" className="nds-text-right">{columnLabel.amount}</TableHead>
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
                      <PaginationPrevious />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink isActive>1</PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink>2</PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext />
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
            path: "?path=/docs/components-navigation-dropdownmenu--docs",
          },
        ]}
      />

      {/* ── Notas ────────────────────────────────────────────────── */}
      <DocsNotes
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
        functional={{
          title: tContent("testes.functional.title"),
          cols: {
            action:   tNav("common.userAction"),
            result:   tNav("common.expectedResult"),
            priority: tNav("common.priority"),
          },
          items: testesIndices.functional.map((n) => ({
            action:   tContent(`testes.functional.item${n}.action`),
            result:   tContent(`testes.functional.item${n}.result`),
            priority: tNav(priorityKeyMap[tContent(`testes.functional.item${n}.priority`)] ?? "common.medium"),
          })),
        }}
        accessibility={{
          title: tContent("testes.accessibility.title"),
          cols: {
            criterion: tNav("common.criterion"),
            level:     "WCAG",
            how:       tNav("common.howToVerify"),
          },
          items: testesIndices.accessibility.map((n) => ({
            criterion: tContent(`testes.accessibility.item${n}.criterion`),
            level:     tContent(`testes.accessibility.item${n}.level`),
            how:       tContent(`testes.accessibility.item${n}.how`),
          })),
        }}
        visual={{
          title: tContent("testes.visual.title"),
          cols: {
            story:    tNav("common.storyState"),
            priority: tNav("common.priority"),
          },
          items: testesIndices.visual.map((n) => ({
            story:    tContent(`testes.visual.item${n}.story`),
            priority: tNav(priorityKeyMap[tContent(`testes.visual.item${n}.priority`)] ?? "common.medium"),
          })),
        }}
      />
    </DocsPageLayout>
  );
}
