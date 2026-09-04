import { useCallback, useEffect, useMemo } from "react";
import { CHART_SCATTER_CLUSTERS } from '@shared/primitives/chart-scatter-clusters';
import {
  ChartContainer,
  buildBarOption,
  buildLineOption,
  buildAreaOption,
  buildPieOption,
  buildFunnelOption,
  buildRadarOption,
  buildPieNestOption,
  buildScatterOption,
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

// Quatro etapas de um processo que afunila, da mais larga para a mais estreita.
const funnelStages = [
  { label: 'Visitas',   value: 4000 },
  { label: 'Cadastros', value: 2400 },
  { label: 'Carrinho',  value: 1200 },
  { label: 'Compra',    value: 480 },
];

// Cinco grandezas do mesmo item, cada uma com o SEU teto. Os tetos diferentes
// são o exemplo, não um detalhe: é por eles que a tabela do radar traz uma
// coluna de máximo — sem ela, o 9 de um eixo que vai a 10 e o 96 de um que vai a
// 100 sairiam como dois números soltos.
const radarAxes = [
  { label: 'Desempenho',     max: 100 },
  { label: 'Acessibilidade', max: 100 },
  { label: 'Boas práticas',  max: 10  },
  { label: 'SEO',            max: 100 },
  { label: 'Conteúdo',       max: 5   },
];

const radarSeries = [
  { name: 'Antes',  data: [72, 64, 6, 88, 2] },
  { name: 'Depois', data: [94, 97, 9, 96, 4] },
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

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria.
  const screenReaderItems = useMemo(
    () =>
      Object.values(
        (chartTranslations as unknown as Record<
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
  buildFunnelOption,
  buildRadarOption,
} from "@/components/ui/chart";`;

  const codeBar = `const xMonths = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"];
const series = [
  { name: "Desktop", data: [186, 305, 237, 73, 209, 214] },
  { name: "Mobile",  data: [80, 200, 120, 190, 130, 140] },
];

<ChartContainer
  option={buildBarOption({ xAxis: xMonths, series })}
  height={300}
  aria-label="Gráfico de barras: acessos mensais"
/>`;

  const codeLine = `<ChartContainer
  option={buildLineOption({ xAxis: xMonths, series })}
  height={300}
  aria-label="Gráfico de linhas: tendência mensal"
/>`;

  const codeArea = `<ChartContainer
  option={buildAreaOption({ xAxis: xMonths, series })}
  height={300}
  aria-label="Gráfico de área: volume mensal"
/>`;

  const codePie = `const pieData = [
  { label: "Desktop", value: 580 },
  { label: "Mobile",  value: 420 },
  { label: "Tablet",  value: 180 },
];

<ChartContainer
  option={buildPieOption({ data: pieData })}
  height={300}
  aria-label="Gráfico de pizza: distribuição por dispositivo"
/>`;

  const codeFunnel = `const funnelStages = [
  { label: "Visitas",   value: 4000 },
  { label: "Cadastros", value: 2400 },
  { label: "Carrinho",  value: 1200 },
  { label: "Compra",    value: 480 },
];

<ChartContainer
  option={buildFunnelOption({ data: funnelStages })}
  height={300}
  aria-label="Funil de conversão: da visita à compra"
/>`;

  // O agrupamento vem PRONTO de `docs/shared/primitives`, gerado uma vez por
  // `scripts/gerar-agrupamento-scatter.mjs`: k-means sorteia o início, e rodá-lo
  // aqui faria o desenho mudar sozinho entre visitas — a partição se repete de
  // 92 a 98 vezes em 100 — enquanto a tabela, que sai de função pura,
  // descreveria outro agrupamento.
  const scatterSeries = CHART_SCATTER_CLUSTERS.map((c) => ({ name: c.name, points: c.points }));

  // Cada ponto declara o GRUPO a que pertence, e o anel de dentro sai da soma —
  // não se declara. Declarar os dois abriria a porta para eles discordarem, e o
  // desenho mentiria sem nada acusar.
  const nestData = [
  { label: 'Orgânica',  value: 300, group: 'Busca'  },
  { label: 'Paga',      value: 100, group: 'Busca'  },
  { label: 'Instagram', value: 200, group: 'Social' },
  { label: 'LinkedIn',  value: 150, group: 'Social' },
  { label: 'App',       value: 250, group: 'Direto' },
  ];

  const codeNest = `const canais = [
  { label: 'Orgânica',  value: 300, group: 'Busca'  },
  { label: 'Paga',      value: 100, group: 'Busca'  },
  { label: 'Instagram', value: 200, group: 'Social' },
  { label: 'LinkedIn',  value: 150, group: 'Social' },
  { label: 'App',       value: 250, group: 'Direto' },
];

<ChartContainer
  option={buildPieNestOption({ data: canais })}
  groupLabel="Canal"
  categoryLabel="Origem"
  aria-label="Sessões por canal e origem, em dois anéis"
/>`;

  const codeScatter = `const sessoes = [
  { name: "Grupo 1", points: [[1.5, 1.1], [1.9, 1.8], [3, 1.6]] },
  { name: "Grupo 2", points: [[7, 4.1], [8, 4.8], [9, 3.8]] },
  { name: "Grupo 3", points: [[12.7, 2.4], [13.4, 2.7], [14.9, 1.9]] },
];

<ChartContainer
  option={buildScatterOption({
    series: sessoes,
    xLabel: "Minutos na página",
    yLabel: "Páginas vistas",
  })}
  seriesLabel="Grupo"
  aria-label="Dispersão de sessões de leitura, em três grupos"
/>`;

  const codeRadar = `const eixos = [
  { label: "Desempenho",     max: 100 },
  { label: "Acessibilidade", max: 100 },
  { label: "Boas práticas",  max: 10  },
  { label: "SEO",            max: 100 },
  { label: "Conteúdo",       max: 5   },
];

const medicoes = [
  { name: "Antes",  data: [72, 64, 6, 88, 2] },
  { name: "Depois", data: [94, 97, 9, 96, 4] },
];

<ChartContainer
  option={buildRadarOption({ axes: eixos, series: medicoes })}
  height={320}
  categoryLabel="Eixo"
  maxLabel="Máximo"
  aria-label="Radar de qualidade: cinco grandezas, antes e depois"
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
  /** Altura do desenho em px. Sem valor, vale o piso do próprio bloco. */
  height?: number;
  /** Frase mostrada no lugar do desenho quando nenhuma série tem dado. */
  emptyLabel?: string;
  /** Mostra a tabela de dados para todo mundo — emitida sempre, escondida por padrão. */
  showData?: boolean;
  /** Cabeçalhos da tabela de dados. */
  categoryLabel?: string;
  valueLabel?: string;
  shareLabel?: string;
  /** Cabeçalho da coluna de máximo do eixo — só o radar a tem. */
  maxLabel?: string;
}

/** Frase padrão do estado vazio, exportada para reuso. */
declare const CHART_EMPTY_LABEL: string;

/** O objeto de configuração descreve alguma série com dado? */
declare function isChartOptionEmpty(option: EChartsCoreOption): boolean;

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
declare function buildPieOption(o: { data: ChartDataPoint[]; title?: string }): EChartsCoreOption;
declare function buildFunnelOption(o: { data: ChartDataPoint[]; title?: string }): EChartsCoreOption;

// O radar recebe os EIXOS (nome mais teto) além das séries: o teto é a única
// informação dele que não está em nenhum outro lugar, e é o que a coluna de
// máximo da tabela escreve.
export interface ChartRadarAxis { label: string; max: number }

declare function buildRadarOption(o: {
  axes: ChartRadarAxis[];
  series: ChartSeries[];
  title?: string;
  showLegend?: boolean;
}): EChartsCoreOption;`;

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
        <div className="nds-cluster nds-w-full" data-justify="center">
          <ChartContainer
            option={buildBarOption({ xAxis: xMonths, series: multiSeries })}
            className="nds-w-full nds-max-w-prose"
            height={300}
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
                className="nds-w-full"
                height={200}
                aria-label="Gráfico multi-séries com legenda"
              />
            ),
            dontPreview: (
              <ChartContainer
                option={buildBarOption({ xAxis: xMonths, series: multiSeries, showLegend: false })}
                className="nds-w-full"
                height={200}
                aria-label="Gráfico multi-séries sem legenda"
              />
            ),
            doCaption: toPlainText(tContent("doDont.pair1.do")),
            dontCaption: toPlainText(tContent("doDont.pair1.dont")),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <ChartContainer
                option={buildBarOption({ xAxis: xMonths, series: singleSeries })}
                className="nds-w-full"
                height={200}
                aria-label="Gráfico de barras: acessos mensais desktop"
              />
            ),
            dontPreview: (
              <ChartContainer
                option={buildBarOption({ xAxis: xMonths, series: singleSeries })}
                className="nds-w-full"
                height={200}
              />
            ),
            doCaption: toPlainText(tContent("doDont.pair2.do")),
            dontCaption: toPlainText(tContent("doDont.pair2.dont")),
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
      <DocsCompositions
        id="variantes"
        title={tContent("variants.title")}
        useWhenLabel={tNav("common.useWhen")}
        componentSlug="chart"
        items={[
          {
            name: "bar",
            description: stripHtml(tContent("variants.items.bar")),
            code: codeBar,
            preview: (
              <ChartContainer
                option={buildBarOption({ xAxis: xMonths, series: multiSeries })}
                className="nds-w-full"
                height={250}
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
                className="nds-w-full"
                height={250}
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
                className="nds-w-full"
                height={250}
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
                className="nds-w-full nds-max-w-sm"
                height={250}
                aria-label="Gráfico de pizza: distribuição por dispositivo"
               />
            ),
          },
          {
            name: "funnel",
            description: stripHtml(tContent("variants.items.funnel")),
            code: codeFunnel,
            preview: (
              // A primeira coluna da tabela do funil não é uma categoria
              // qualquer: é a ETAPA do processo, e é esse o nome que a pessoa
              // lê. O rótulo genérico serve a barra e a linha, onde a coluna
              // nomeia mesmo uma categoria.
              <ChartContainer
                option={buildFunnelOption({ data: funnelStages })}
                className="nds-w-full nds-max-w-sm"
                height={250}
                categoryLabel={stripHtml(tContent("demonstration.labels.funnelStage"))}
                aria-label="Funil de conversão: da visita à compra"
               />
            ),
          },
          {
            name: "radar",
            description: stripHtml(tContent("variants.items.radar")),
            code: codeRadar,
            preview: (
              // No radar a primeira coluna da tabela não nomeia uma categoria:
              // nomeia o EIXO, e a segunda traz o teto dele. Os dois títulos vêm
              // do conteúdo compartilhado para acompanharem o idioma da página —
              // com o rótulo padrão, a tabela ficaria em português no meio de uma
              // página em espanhol.
              <ChartContainer
                option={buildRadarOption({ axes: radarAxes, series: radarSeries })}
                className="nds-w-full nds-max-w-sm"
                height={280}
                categoryLabel={stripHtml(tContent("demonstration.labels.radarAxis"))}
                maxLabel={stripHtml(tContent("demonstration.labels.radarMax"))}
                aria-label="Radar de qualidade do site: cinco grandezas, antes e depois da revisão"
               />
            ),
          },
          {
            name: "pie-nest",
            description: stripHtml(tContent("variants.items.pieNest")),
            code: codeNest,
            preview: (
              // A primeira coluna da tabela nomeia o GRUPO e a segunda a parte;
              // os dois títulos vêm do conteúdo compartilhado para acompanharem
              // o idioma da página.
              <ChartContainer
                option={buildPieNestOption({ data: nestData })}
                className="nds-w-full nds-max-w-sm"
                height={280}
                groupLabel={stripHtml(tContent("demonstration.labels.nestGroup"))}
                categoryLabel={stripHtml(tContent("demonstration.labels.nestPart"))}
                aria-label="Sessões por canal e origem: três canais abertos em suas origens, em dois anéis"
               />
            ),
          },
          {
            name: "scatter",
            description: stripHtml(tContent("variants.items.scatter")),
            code: codeScatter,
            preview: (
              // A primeira coluna da tabela nomeia o GRUPO, e as duas de número
              // nomeiam as GRANDEZAS que o desenho põe nos eixos — sem elas a
              // tabela diria onde o ponto está e não o que ele mede. Os três
              // títulos vêm do conteúdo compartilhado para acompanharem o idioma
              // da página.
              <ChartContainer
                option={buildScatterOption({
                  series: scatterSeries,
                  xLabel: stripHtml(tContent("demonstration.labels.scatterX")),
                  yLabel: stripHtml(tContent("demonstration.labels.scatterY")),
                })}
                className="nds-w-full nds-max-w-sm"
                height={280}
                seriesLabel={stripHtml(tContent("demonstration.labels.scatterSeries"))}
                aria-label="Dispersão de sessões de leitura: minutos na página por páginas vistas, em três grupos"
               />
            ),
          },
          {
            trackId: "smallInline",
            name: tContent("variants.items.smallInline.name"),
            description: tContent("variants.items.smallInline.description"),
            useWhen: tContent("variants.items.smallInline.use"),
            code: `<div className="nds-cluster nds-rounded-md nds-border-default nds-p-4" data-spacing="md" data-align="center" style={{ width: "fit-content" }}>
  <div>
    <p className="nds-text-caption nds-text-muted-foreground">Acessos</p>
    <p className="nds-font-semibold" style={{ fontSize: "1.5rem", lineHeight: "2rem" }}>1.224</p>
  </div>
  <ChartContainer
    option={buildLineOption({ xAxis: xMonths, series: multiSeries })}
    style={{ height: "48px", width: "120px" }}
    aria-label="Tendência de acessos nos últimos 6 meses"
   />
</div>`,
            preview: (
              <div className="nds-cluster nds-rounded-md nds-border-default nds-p-4" data-spacing="md" data-align="center" style={{ width: "fit-content" }}>
                <div>
                  <p className="nds-text-caption nds-text-muted-foreground">Acessos</p>
                  <p className="nds-font-semibold" style={{ fontSize: "1.5rem", lineHeight: "2rem" }}>1.224</p>
                </div>
                <ChartContainer
                  option={buildLineOption({ xAxis: xMonths, series: multiSeries })}
                  style={{ height: "48px", width: "120px" }}
                  aria-label="Tendência de acessos nos últimos 6 meses"
                 />
              </div>
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
            trackId: "inCard",
            name: tContent("variants.compositions.inCard.name"),
            description: tContent("variants.compositions.inCard.description"),
            useWhen: tContent("variants.compositions.inCard.use"),
            code: `<Card className="nds-w-full nds-max-w-sm">
  <CardHeader>
    <CardTitle>Acessos mensais</CardTitle>
  </CardHeader>
  <CardContent>
    <ChartContainer
      option={buildBarOption({ xAxis: xMonths, series: multiSeries })}
      className="nds-w-full"
                height={200}
      aria-label="Gráfico de barras: acessos mensais por dispositivo"
     />
  </CardContent>
</Card>`,
            preview: (
              <Card className="nds-w-full nds-max-w-sm">
                <CardHeader>
                  <CardTitle>Acessos mensais</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    option={buildBarOption({ xAxis: xMonths, series: multiSeries })}
                    className="nds-w-full"
                height={200}
                    aria-label="Gráfico de barras: acessos mensais por dispositivo"
                   />
                </CardContent>
              </Card>
            ),
          },
        ]}
      />

      {/* ── Estados ───────────────────────────────────────────────── */}
      <DocsStates
        title={tContent("states.title")}
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
            label: tContent("states.loading.label"),
            trigger: toPlainText(tContent("states.loading.trigger")),
            behavior: toPlainText(tContent("states.loading.behavior")),
          },
          {
            label: tContent("states.singleSeries.label"),
            trigger: toPlainText(tContent("states.singleSeries.trigger")),
            behavior: toPlainText(tContent("states.singleSeries.behavior")),
          },
          {
            label: tContent("states.multiSeries.label"),
            trigger: toPlainText(tContent("states.multiSeries.trigger")),
            behavior: toPlainText(tContent("states.multiSeries.behavior")),
          },
          {
            label: tContent("states.withEmptyState.label"),
            trigger: toPlainText(tContent("states.withEmptyState.trigger")),
            behavior: toPlainText(tContent("states.withEmptyState.behavior")),
          },
          {
            label: tContent("states.multiSeriesWithLegend.label"),
            trigger: toPlainText(tContent("states.multiSeriesWithLegend.trigger")),
            behavior: toPlainText(tContent("states.multiSeriesWithLegend.behavior")),
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
                description: toPlainText(tContent("props.table.option")),
              },
              {
                name: "renderer",
                type: '"svg" | "canvas"',
                defaultValue: '"svg"',
                required: "Não",
                description: toPlainText(tContent("props.table.renderer")),
              },
              {
                name: "height",
                type: "number",
                defaultValue: "—",
                required: "Não",
                description: toPlainText(tContent("props.table.height")),
              },
              {
                name: "emptyLabel",
                type: "string",
                defaultValue: '"Sem dados para exibir"',
                required: "Não",
                description: toPlainText(tContent("props.table.emptyLabel")),
              },
              {
                name: "className",
                type: "string",
                defaultValue: "—",
                required: "Não",
                description: toPlainText(tContent("props.table.className")),
              },
              {
                name: "aria-label",
                type: "string",
                defaultValue: "—",
                required: "Sim",
                description: toPlainText(tContent("props.table.ariaLabel")),
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
                // Nesta stack o tipo do gráfico não é uma propriedade: é a
                // escolha de qual builder monta o objeto de configuração.
                name: "buildBarOption · buildLineOption · buildAreaOption · buildPieOption · buildFunnelOption · buildRadarOption",
                type: "(o: OptionsBase) => EChartsCoreOption",
                defaultValue: "—",
                required: "Sim",
                description: toPlainText(tContent("props.table.chartType")),
              },
              {
                name: "data",
                type: "{ label: string; value: number }[]",
                defaultValue: "—",
                required: "Não",
                description: toPlainText(tContent("props.table.data")),
              },
              {
                name: "xAxis",
                type: "(string | number)[]",
                defaultValue: "—",
                required: "Não",
                description: toPlainText(tContent("props.table.xAxis")),
              },
              {
                name: "series",
                type: "{ name: string; data: number[]; color?: string }[]",
                defaultValue: "—",
                required: "Não",
                description: toPlainText(tContent("props.table.series")),
              },
              {
                name: "title",
                type: "string",
                defaultValue: "—",
                required: "Não",
                description: toPlainText(tContent("props.table.title")),
              },
              {
                name: "showLegend",
                type: "boolean",
                defaultValue: "auto",
                required: "Não",
                description: toPlainText(tContent("props.table.showLegend")),
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
          { token: "--chart-1",          value: "color série 1",  description: toPlainText(tContent("tokens.table.chart1")) },
          { token: "--chart-2",          value: "color série 2",  description: toPlainText(tContent("tokens.table.chart2")) },
          { token: "--chart-3",          value: "color série 3",  description: toPlainText(tContent("tokens.table.chart3")) },
          { token: "--chart-4",          value: "color série 4",  description: toPlainText(tContent("tokens.table.chart4")) },
          { token: "--chart-5",          value: "color série 5",  description: toPlainText(tContent("tokens.table.chart5")) },
          { token: "--chart-6",          value: "color série 6",  description: toPlainText(tContent("tokens.table.chart6")) },
          { token: "--chart-7",          value: "color série 7",  description: toPlainText(tContent("tokens.table.chart7")) },
          { token: "--chart-8",          value: "color série 8",  description: toPlainText(tContent("tokens.table.chart8")) },
          { token: "--primary",          value: "axisPointer",    description: toPlainText(tContent("tokens.table.primary")) },
          { token: "--muted-foreground", value: "axisLabel",      description: toPlainText(tContent("tokens.table.mutedForeground")) },
          { token: "--border",           value: "axisLine + grid", description: toPlainText(tContent("tokens.table.border")) },
          { token: "--background",       value: "aria.decal",     description: toPlainText(tContent("tokens.table.background")) },
          { token: "--foreground",       value: "title + tooltip", description: toPlainText(tContent("tokens.table.foreground")) },
          { token: "--card",             value: "tooltip bg",     description: toPlainText(tContent("tokens.table.card")) },
        ]}
        customizationTitle={tContent("tokens.customizationTitle")}
        customizationCode={codeTokens}
      />

      {/* ── Acessibilidade ────────────────────────────────────────── */}
      <DocsAccessibility
        screenReaderTitle={tNav("common.screenReader")}
        screenReaderItems={screenReaderItems}
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
          { key: "Tab",        description: toPlainText(tContent("accessibility.keyboard.tab")) },
          { key: "Arrow Right", description: toPlainText(tContent("accessibility.keyboard.arrowRight")) },
          { key: "Arrow Left",  description: toPlainText(tContent("accessibility.keyboard.arrowLeft")) },
        ]}
      />

      {/* ── Relacionados ──────────────────────────────────────────── */}
      <DocsRelated
        title={tContent("related.title")}
        componentSlug="chart"
        items={[
          {
            name: "Table",
            description: toPlainText(tContent("related.table")),
            path: "?path=/docs/components-tables-table--docs",
          },
          {
            name: "Card",
            description: toPlainText(tContent("related.card")),
            path: "?path=/docs/components-layout-card--docs",
          },
          {
            name: "DataTable",
            description: toPlainText(tContent("related.dataTable")),
            path: "?path=/docs/components-tables-datatable--docs",
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
              action: toPlainText(tContent("testes.functional.item1.action")),
              result: toPlainText(tContent("testes.functional.item1.result")),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item1.priority")] ?? "common.high"),
            },
            {
              action: toPlainText(tContent("testes.functional.item2.action")),
              result: toPlainText(tContent("testes.functional.item2.result")),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item2.priority")] ?? "common.high"),
            },
            {
              action: toPlainText(tContent("testes.functional.item3.action")),
              result: toPlainText(tContent("testes.functional.item3.result")),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item3.priority")] ?? "common.high"),
            },
            {
              action: toPlainText(tContent("testes.functional.item4.action")),
              result: toPlainText(tContent("testes.functional.item4.result")),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item4.priority")] ?? "common.high"),
            },
            {
              action: toPlainText(tContent("testes.functional.item5.action")),
              result: toPlainText(tContent("testes.functional.item5.result")),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item5.priority")] ?? "common.medium"),
            },
            {
              action: toPlainText(tContent("testes.functional.item6.action")),
              result: toPlainText(tContent("testes.functional.item6.result")),
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
