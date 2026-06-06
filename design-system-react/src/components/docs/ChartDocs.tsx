import { useCallback, useEffect, useMemo } from "react";
import {
  ChartContainer,
  buildBarOption,
  buildLineOption,
  buildAreaOption,
  buildPieOption,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import { useActiveSection } from "@/lib/use-active-section";
import uiTranslations from "@/i18n/ui.json";
import chartTranslations from "@shared/content/chart/translations.json";

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

// ─── Chart data / config ──────────────────────────────────────────────────────

// ECharts API: dado simples (label/value) ou xAxis + series.

const xMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

const singleSeries = [{ name: 'Desktop', data: [186, 305, 237, 73, 209, 214] }];

const multiSeries = [
  { name: 'Desktop', data: [186, 305, 237, 73, 209, 214] },
  { name: 'Mobile',  data: [80, 200, 120, 190, 130, 140] },
];

const pieData = [
  { label: 'Desktop', value: 1224 },
  { label: 'Mobile',  value: 860 },
  { label: 'Tablet',  value: 320 },
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

export function ChartDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(chartTranslations);

  const navGroups = useMemo(() => getNavGroups(tNav), [tNav]);
  const allIds = useMemo(
    () => navGroups.flatMap((g) => g.sections.map((s) => s.id)),
    [navGroups]
  );

  useSeoEffect({
    title: tContent("seo.title"),
    description: tContent("seo.description"),
    locale,
    componentSlug: "chart",
  });

  useEffect(() => {
    track("docs_page_view", {
      component_name: "chart",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "chart",
        locale,
      });
    },
    [locale]
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  // ─── Code strings ─────────────────────────────────────────────────────────

  const codeImportBasic = `import { ChartContainer } from "@/components/ui/chart";`;

  const codeImportWithBuilders = `import {
  ChartContainer,
  buildBarOption,
  buildLineOption,
  buildAreaOption,
  buildPieOption,
} from "@/components/ui/chart";`;

  const codeBar = `const xMonths = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"];
const series = [
  { name: "Desktop", data: [186, 305, 237, 73, 209, 214] },
  { name: "Mobile",  data: [80, 200, 120, 190, 130, 140] },
];

<ChartContainer
  option={buildBarOption({ xAxis: xMonths, series })}
  className="h-[300px] w-full"
  aria-label="Gráfico de barras: acessos mensais"
/>`;

  const codeLine = `<ChartContainer
  option={buildLineOption({ xAxis: xMonths, series })}
  className="h-[300px] w-full"
  aria-label="Gráfico de linhas: tendência mensal"
/>`;

  const codeArea = `<ChartContainer
  option={buildAreaOption({ xAxis: xMonths, series })}
  className="h-[300px] w-full"
  aria-label="Gráfico de área: volume mensal"
/>`;

  const codePie = `const pieData = [
  { label: "Desktop", value: 580 },
  { label: "Mobile",  value: 420 },
  { label: "Tablet",  value: 180 },
];

<ChartContainer
  option={buildPieOption({ data: pieData })}
  className="h-[300px] w-full"
  aria-label="Gráfico de pizza: distribuição por dispositivo"
/>`;

  const codeTokens = `/* Personalização de tokens no tema */
:root {
  --chart-1: 220 70% 50%;
  --chart-2: 160 60% 45%;
  --chart-3: 30 80% 55%;
  --chart-4: 280 65% 60%;
  --chart-5: 340 75% 55%;
}

.dark {
  --chart-1: 220 70% 60%;
  --chart-2: 160 60% 55%;
}`;

  const interfaceCode = `// ChartContainer
interface ChartContainerProps extends React.ComponentProps<"div"> {
  option: EChartsCoreOption;
  renderer?: "svg" | "canvas";
}

// Builders auxiliares — montam o option para os tipos comuns.
export interface ChartDataPoint { label: string; value: number }
export interface ChartSeries     { name: string; data: number[]; color?: string }

interface OptionsBase {
  data?: ChartDataPoint[];      // 1 série, formato simples
  xAxis?: Array<string | number>;
  series?: ChartSeries[];        // multi-série
  title?: string;
  showLegend?: boolean;
}

declare function buildBarOption(o: OptionsBase): EChartsCoreOption;
declare function buildLineOption(o: OptionsBase): EChartsCoreOption;
declare function buildAreaOption(o: OptionsBase): EChartsCoreOption;
declare function buildPieOption(o: { data: ChartDataPoint[]; title?: string }): EChartsCoreOption;`;

  return (
    <DocsPageLayout
      navGroups={navGroups}
      activeSection={activeId}
      componentSlug="chart"
      header={
        <DocsHeader
          title={tContent("title")}
          description={tContent("description")}
          category={tContent("category")}
          type={tContent("type")}
          installNote="npm install echarts echarts-for-react"
        />
      }
    >
      {/* ── Demonstração ──────────────────────────────────────────── */}
      <DocsDemonstration title={tContent("demonstration.title")}>
        <div className="flex w-full items-center justify-center">
          <ChartContainer
            option={buildBarOption({ xAxis: xMonths, series: multiSeries })}
            className="h-[300px] w-full max-w-xl"
            aria-label="Gráfico de barras: acessos mensais por dispositivo"
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
            { s: tContent("usage.scenarios.item1.s"), u: tContent("usage.scenarios.item1.u"), a: tContent("usage.scenarios.item1.a") },
            { s: tContent("usage.scenarios.item2.s"), u: tContent("usage.scenarios.item2.u"), a: tContent("usage.scenarios.item2.a") },
            { s: tContent("usage.scenarios.item3.s"), u: tContent("usage.scenarios.item3.u"), a: tContent("usage.scenarios.item3.a") },
            { s: tContent("usage.scenarios.item4.s"), u: tContent("usage.scenarios.item4.u"), a: tContent("usage.scenarios.item4.a") },
            { s: tContent("usage.scenarios.item5.s"), u: tContent("usage.scenarios.item5.u"), a: tContent("usage.scenarios.item5.a") },
            { s: tContent("usage.scenarios.item6.s"), u: tContent("usage.scenarios.item6.u"), a: tContent("usage.scenarios.item6.a") },
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
              element: tContent("usage.uxWriting.table.axisLabel.name"),
              rules: tContent("usage.uxWriting.table.axisLabel.format"),
              do: tContent("usage.uxWriting.table.axisLabel.good"),
              dont: tContent("usage.uxWriting.table.axisLabel.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.tooltipValue.name"),
              rules: tContent("usage.uxWriting.table.tooltipValue.format"),
              do: tContent("usage.uxWriting.table.tooltipValue.good"),
              dont: tContent("usage.uxWriting.table.tooltipValue.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.legendLabel.name"),
              rules: tContent("usage.uxWriting.table.legendLabel.format"),
              do: tContent("usage.uxWriting.table.legendLabel.good"),
              dont: tContent("usage.uxWriting.table.legendLabel.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.emptyState.name"),
              rules: tContent("usage.uxWriting.table.emptyState.format"),
              do: tContent("usage.uxWriting.table.emptyState.good"),
              dont: tContent("usage.uxWriting.table.emptyState.bad"),
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
              <ChartContainer
                option={buildBarOption({ xAxis: xMonths, series: multiSeries })}
                className="h-[200px] w-full"
                aria-label="Gráfico multi-séries com legenda"
              />
            ),
            dontPreview: (
              <ChartContainer
                option={buildBarOption({ xAxis: xMonths, series: multiSeries, showLegend: false })}
                className="h-[200px] w-full"
                aria-label="Gráfico multi-séries sem legenda"
              />
            ),
            doCaption: tContent("doDont.pair1.do"),
            dontCaption: tContent("doDont.pair1.dont"),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <ChartContainer
                option={buildBarOption({ xAxis: xMonths, series: singleSeries })}
                className="h-[200px] w-full"
                aria-label="Gráfico de barras: acessos mensais desktop"
              />
            ),
            dontPreview: (
              <ChartContainer
                option={buildBarOption({ xAxis: xMonths, series: singleSeries })}
                className="h-[200px] w-full"
              />
            ),
            doCaption: tContent("doDont.pair2.do"),
            dontCaption: tContent("doDont.pair2.dont"),
          },
        ]}
      />

      {/* ── Importação ────────────────────────────────────────────── */}
      <DocsImport
        title={tContent("import.title")}
        description={tContent("import.basic")}
        code={codeImportBasic}
        secondaryDescription={tContent("import.withBuilders")}
        secondaryCode={codeImportWithBuilders}
      />

      {/* ── Variantes (Tipos) ─────────────────────────────────────── */}
      <DocsVariants
        title={tContent("variants.title")}
        componentSlug="chart"
        items={[
          {
            name: "bar",
            description: stripHtml(tContent("variants.items.bar")),
            code: codeBar,
            preview: (
              <ChartContainer
                option={buildBarOption({ xAxis: xMonths, series: multiSeries })}
                className="h-[250px] w-full"
                aria-label="Gráfico de barras: acessos mensais"
               />
            ),
          },
          {
            name: "line",
            description: stripHtml(tContent("variants.items.line")),
            code: codeLine,
            preview: (
              <ChartContainer
                option={buildLineOption({ xAxis: xMonths, series: multiSeries })}
                className="h-[250px] w-full"
                aria-label="Gráfico de linhas: tendência mensal"
               />
            ),
          },
          {
            name: "area",
            description: stripHtml(tContent("variants.items.area")),
            code: codeArea,
            preview: (
              <ChartContainer
                option={buildAreaOption({ xAxis: xMonths, series: multiSeries })}
                className="h-[250px] w-full"
                aria-label="Gráfico de área: volume mensal"
               />
            ),
          },
          {
            name: "pie",
            description: stripHtml(tContent("variants.items.pie")),
            code: codePie,
            preview: (
              <ChartContainer
                option={buildPieOption({ data: pieData })}
                className="h-[250px] w-full max-w-sm mx-auto"
                aria-label="Gráfico de pizza: distribuição por dispositivo"
               />
            ),
          },
        ]}
      />

      {/* ── Composições ───────────────────────────────────────────── */}
      <DocsCompositions
        title={tContent("variants.compositionsTitle")}
        useWhenLabel={tNav("common.useWhen")}
        componentSlug="chart"
        items={[
          {
            name: tContent("variants.compositions.inCard.name"),
            description: tContent("variants.compositions.inCard.description"),
            useWhen: tContent("variants.compositions.inCard.use"),
            code: `<Card className="w-full max-w-sm">
  <CardHeader>
    <CardTitle>Acessos mensais</CardTitle>
  </CardHeader>
  <CardContent>
    <ChartContainer
      option={buildBarOption({ xAxis: xMonths, series: multiSeries })}
      className="h-[200px] w-full"
      aria-label="Gráfico de barras: acessos mensais por dispositivo"
     />
  </CardContent>
</Card>`,
            preview: (
              <Card className="w-full max-w-sm">
                <CardHeader>
                  <CardTitle>Acessos mensais</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    option={buildBarOption({ xAxis: xMonths, series: multiSeries })}
                    className="h-[200px] w-full"
                    aria-label="Gráfico de barras: acessos mensais por dispositivo"
                   />
                </CardContent>
              </Card>
            ),
          },
          {
            name: tContent("variants.compositions.multiSeriesWithLegend.name"),
            description: tContent("variants.compositions.multiSeriesWithLegend.description"),
            useWhen: tContent("variants.compositions.multiSeriesWithLegend.use"),
            code: `<ChartContainer
  option={buildBarOption({ xAxis: xMonths, series: multiSeries })}
  className="h-[240px] w-full"
  aria-label="Gráfico multi-séries: Desktop e Mobile"
 />`,
            preview: (
              <ChartContainer
                option={buildBarOption({ xAxis: xMonths, series: multiSeries })}
                className="h-[240px] w-full"
                aria-label="Gráfico multi-séries: Desktop e Mobile"
               />
            ),
          },
          {
            name: tContent("variants.compositions.smallInline.name"),
            description: tContent("variants.compositions.smallInline.description"),
            useWhen: tContent("variants.compositions.smallInline.use"),
            code: `<div className="flex items-center gap-4 rounded-md border p-4 w-fit">
  <div>
    <p className="text-xs text-muted-foreground">Acessos</p>
    <p className="text-2xl font-semibold">1.224</p>
  </div>
  <ChartContainer
    option={buildLineOption({ xAxis: xMonths, series: multiSeries })}
    className="h-[48px] w-[120px]"
    aria-label="Tendência de acessos nos últimos 6 meses"
   />
</div>`,
            preview: (
              <div className="flex items-center gap-4 rounded-md border p-4 w-fit">
                <div>
                  <p className="text-xs text-muted-foreground">Acessos</p>
                  <p className="text-2xl font-semibold">1.224</p>
                </div>
                <ChartContainer
                  option={buildLineOption({ xAxis: xMonths, series: multiSeries })}
                  className="h-[48px] w-[120px]"
                  aria-label="Tendência de acessos nos últimos 6 meses"
                 />
              </div>
            ),
          },
          {
            name: tContent("variants.compositions.withEmptyState.name"),
            description: tContent("variants.compositions.withEmptyState.description"),
            useWhen: tContent("variants.compositions.withEmptyState.use"),
            code: `{data.length === 0 ? (
  <div
    role="status"
    className="flex h-[200px] w-full items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground"
  >
    Nenhum dado disponível para o período selecionado.
  </div>
) : (
  <ChartContainer option={buildBarOption({ xAxis: xMonths, series: multiSeries })} className="h-[200px] w-full" aria-label="..." />
)}`,
            preview: (
              <div
                role="status"
                className="flex h-[200px] w-full max-w-sm items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground"
              >
                Nenhum dado disponível para o período selecionado.
              </div>
            ),
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
            behavior: tContent("states.empty.behavior"),
          },
          {
            label: tContent("states.loading.label"),
            trigger: stripHtml(tContent("states.loading.trigger")),
            behavior: stripHtml(tContent("states.loading.behavior")),
          },
          {
            label: tContent("states.singleSeries.label"),
            trigger: stripHtml(tContent("states.singleSeries.trigger")),
            behavior: stripHtml(tContent("states.singleSeries.behavior")),
          },
          {
            label: tContent("states.multiSeries.label"),
            trigger: stripHtml(tContent("states.multiSeries.trigger")),
            behavior: stripHtml(tContent("states.multiSeries.behavior")),
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
              {
                name: "option",
                type: "EChartsCoreOption",
                defaultValue: "—",
                required: "Sim",
                description: stripHtml(tContent("props.table.option")),
              },
              {
                name: "renderer",
                type: '"svg" | "canvas"',
                defaultValue: '"svg"',
                required: "Não",
                description: stripHtml(tContent("props.table.renderer")),
              },
              {
                name: "className",
                type: "string",
                defaultValue: "—",
                required: "Não",
                description: stripHtml(tContent("props.table.className")),
              },
              {
                name: "aria-label",
                type: "string",
                defaultValue: "—",
                required: "Sim",
                description: stripHtml(tContent("props.table.ariaLabel")),
              },
            ],
          },
          {
            title: tContent("props.legendTitle"),
            cols: {
              prop: tContent("props.table.prop"),
              type: tContent("props.table.type"),
              default: tContent("props.table.default"),
              required: tContent("props.table.required"),
              description: tContent("props.table.description"),
            },
            items: [
              {
                name: "data",
                type: "{ label: string; value: number }[]",
                defaultValue: "—",
                required: "Não",
                description: stripHtml(tContent("props.table.data")),
              },
              {
                name: "xAxis",
                type: "(string | number)[]",
                defaultValue: "—",
                required: "Não",
                description: stripHtml(tContent("props.table.xAxis")),
              },
              {
                name: "series",
                type: "{ name: string; data: number[]; color?: string }[]",
                defaultValue: "—",
                required: "Não",
                description: stripHtml(tContent("props.table.series")),
              },
              {
                name: "title",
                type: "string",
                defaultValue: "—",
                required: "Não",
                description: stripHtml(tContent("props.table.title")),
              },
              {
                name: "showLegend",
                type: "boolean",
                defaultValue: "auto",
                required: "Não",
                description: stripHtml(tContent("props.table.showLegend")),
              },
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
          { token: "--chart-1",          value: "color série 1",  description: tContent("tokens.table.chart1") },
          { token: "--chart-2",          value: "color série 2",  description: tContent("tokens.table.chart2") },
          { token: "--chart-3",          value: "color série 3",  description: tContent("tokens.table.chart3") },
          { token: "--chart-4",          value: "color série 4",  description: tContent("tokens.table.chart4") },
          { token: "--chart-5",          value: "color série 5",  description: tContent("tokens.table.chart5") },
          { token: "--primary",          value: "axisPointer",    description: tContent("tokens.table.primary") },
          { token: "--muted-foreground", value: "axisLabel",      description: tContent("tokens.table.mutedForeground") },
          { token: "--border",           value: "axisLine + grid", description: tContent("tokens.table.border") },
          { token: "--foreground",       value: "title + tooltip", description: tContent("tokens.table.foreground") },
          { token: "--card",             value: "tooltip bg",     description: tContent("tokens.table.card") },
        ]}
        customizationTitle={tContent("tokens.customizationTitle")}
        customizationCode={codeTokens}
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
          { key: "Tab",        description: tContent("accessibility.keyboard.tab") },
          { key: "ArrowRight", description: tContent("accessibility.keyboard.arrowRight") },
          { key: "ArrowLeft",  description: tContent("accessibility.keyboard.arrowLeft") },
        ]}
      />

      {/* ── Relacionados ──────────────────────────────────────────── */}
      <DocsRelated
        title={tContent("related.title")}
        componentSlug="chart"
        items={[
          {
            name: "Table",
            description: tContent("related.table"),
            path: "?path=/docs/ui-table--docs",
          },
          {
            name: "Card",
            description: tContent("related.card"),
            path: "?path=/docs/ui-card--docs",
          },
          {
            name: "DataTable",
            description: tContent("related.dataTable"),
            path: "?path=/docs/ui-data-table--docs",
          },
        ]}
      />

      {/* ── Notas ─────────────────────────────────────────────────── */}
      <DocsNotes
        title={tContent("notes.title")}
        componentSlug="chart"
        items={[
          { title: "", content: tContent("notes.tip1") },
          { title: "", content: tContent("notes.tip2") },
          { title: "", content: tContent("notes.tip3") },
          { title: "", content: tContent("notes.tip4") },
          { title: "", content: tContent("notes.tip5") },
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
          items: [
            {
              action: tContent("testes.functional.item1.action"),
              result: tContent("testes.functional.item1.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item1.priority")] ?? "common.high"),
            },
            {
              action: tContent("testes.functional.item2.action"),
              result: tContent("testes.functional.item2.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item2.priority")] ?? "common.high"),
            },
            {
              action: tContent("testes.functional.item3.action"),
              result: tContent("testes.functional.item3.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item3.priority")] ?? "common.high"),
            },
            {
              action: tContent("testes.functional.item4.action"),
              result: tContent("testes.functional.item4.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item4.priority")] ?? "common.high"),
            },
            {
              action: tContent("testes.functional.item5.action"),
              result: tContent("testes.functional.item5.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item5.priority")] ?? "common.medium"),
            },
            {
              action: tContent("testes.functional.item6.action"),
              result: tContent("testes.functional.item6.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item6.priority")] ?? "common.medium"),
            },
          ],
        }}
        accessibility={{
          title: tContent("testes.accessibility.title"),
          cols: {
            criterion: tNav("common.criterion"),
            level: "WCAG",
            how: tNav("common.howToVerify"),
          },
          items: [
            {
              criterion: tContent("testes.accessibility.item1.criterion"),
              level: tContent("testes.accessibility.item1.level"),
              how: tContent("testes.accessibility.item1.how"),
            },
            {
              criterion: tContent("testes.accessibility.item2.criterion"),
              level: tContent("testes.accessibility.item2.level"),
              how: tContent("testes.accessibility.item2.how"),
            },
            {
              criterion: tContent("testes.accessibility.item3.criterion"),
              level: tContent("testes.accessibility.item3.level"),
              how: tContent("testes.accessibility.item3.how"),
            },
            {
              criterion: tContent("testes.accessibility.item4.criterion"),
              level: tContent("testes.accessibility.item4.level"),
              how: tContent("testes.accessibility.item4.how"),
            },
          ],
        }}
        visual={{
          title: tContent("testes.visual.title"),
          cols: {
            story: tNav("common.storyState"),
            priority: tNav("common.priority"),
          },
          items: [
            { story: tContent("testes.visual.item1.story"), priority: tNav(priorityKeyMap[tContent("testes.visual.item1.priority")] ?? "common.high") },
            { story: tContent("testes.visual.item2.story"), priority: tNav(priorityKeyMap[tContent("testes.visual.item2.priority")] ?? "common.high") },
            { story: tContent("testes.visual.item3.story"), priority: tNav(priorityKeyMap[tContent("testes.visual.item3.priority")] ?? "common.high") },
            { story: tContent("testes.visual.item4.story"), priority: tNav(priorityKeyMap[tContent("testes.visual.item4.priority")] ?? "common.medium") },
          ],
        }}
      />
    </DocsPageLayout>
  );
}

export default ChartDocs;
