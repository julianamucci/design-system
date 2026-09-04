import {
  Fragment,
  useEffect,
  useMemo,
  useCallback,
  type CSSProperties,
  type ReactNode,
} from "react";
import { TraceWaterfall } from "@/components/ui/trace-waterfall";
import { Separator } from "@/components/ui/separator";
import {
  WIDE_TOTAL_MS,
  useTraceWaterfallLabels,
  wideTraceSpans,
} from "@/components/ui/trace-waterfall.fixtures";
import {
  TOOL_CALL_STATES,
  type RunStatus,
  type TraceSpan,
} from "@shared/primitives/chat-protocol";
import { resolveTraceWaterfall } from "@shared/primitives/trace-waterfall-axis";
import {
  TRACE_SPANS_FAILURE,
  TRACE_SPANS_ORDER,
  TRACE_SPANS_PARTIAL,
  TRACE_TOTAL_MS,
} from "@shared/primitives/trace-waterfall-examples";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import { useActiveSection } from "@/lib/use-active-section";
import uiTranslations from "@/i18n/ui.json";
import traceWaterfallTranslations from "@shared/content/trace-waterfall/translations.json";

import { DocsHeader }        from "@/components/docs/shared/sections/DocsHeader";
import { DocsPageLayout }    from "@/components/docs/shared/sections/DocsPageLayout";
import { DocsDemonstration } from "@/components/docs/shared/sections/DocsDemonstration";
import { DocsAnatomy }       from "@/components/docs/shared/sections/DocsAnatomy";
import { DocsWhenToUse }     from "@/components/docs/shared/sections/DocsWhenToUse";
import { DocsDoDont }        from "@/components/docs/shared/sections/DocsDoDont";
import { DocsImport }        from "@/components/docs/shared/sections/DocsImport";
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

const INTERFACE_CODE = `export interface TraceWaterfallLabels {
  region: string;    // o nome da camada que rola — obrigatório
  axis: string;      // molde visível da régua, com \`{total}\`
  duration: string;  // molde da duração visível, com \`{duration}\`
  reading: string;   // molde da leitura, com \`{start}\` e \`{duration}\`
  clipped: string;   // a frase do trecho que não coube no eixo
  state: Record<ToolCallState, string>;
}

// O trecho vem de \`@shared/primitives/chat-protocol\`. \`TraceSpan\` é o
// TERCEIRO tipo daquele arquivo que carrega geometria, e entra pelo mesmo
// critério dos dois primeiros: ser a origem única do que cinco stacks
// reescreveriam.
//
// O INTERVALO É PLANO, e não um tipo aninhado: os dois tipos de geometria que
// já moravam ali carregam as coordenadas soltas, e um tipo que embrulha dois
// campos para um consumidor só é indireção, não vocabulário.
interface TraceSpan {
  id: string;
  label: string;
  startMs: number;     // desde a origem do eixo
  durationMs: number;
  depth: number;       // recuo em degraus, relativo aos demais
  state: ToolCallState;
}

// O TOTAL NÃO MORA NO TRECHO: ele é propriedade do EIXO, e é ele que faz as
// barras dividirem uma régua só. Um total por trecho seriam N verdades sobre
// a mesma régua.

type ToolCallState = 'pending' | 'running' | 'done' | 'failed';`;

// ─── Contraexemplos ──────────────────────────────────────────────────────────

interface WrongTraceWaterfallProps {
  spans: readonly TraceSpan[];
  totalMs: number;
  /** A frase que cada linha diz a quem ouve. Ausente, sobra a barra. */
  withReading: boolean;
  /** O papel e o nome da camada que rola. Ausentes, a parada é anônima. */
  named: boolean;
}

/**
 * A cascata montada À MÃO, e tem de ser: a peça sempre escreve a leitura de
 * cada linha e sempre põe papel e nome na camada que rola, então não há
 * propriedade que produza o erro. A marcação abaixo é a mesma da peça, com
 * uma parte removida de cada vez.
 */
function WrongTraceWaterfall({
  spans,
  totalMs,
  withReading,
  named,
}: WrongTraceWaterfallProps) {
  const labels = useTraceWaterfallLabels();
  const drawing = resolveTraceWaterfall(spans, totalMs);
  if (!drawing) return null;

  return (
    <div className="nds-trace-waterfall" data-slot="trace-waterfall" aria-busy>
      <p className="nds-trace-waterfall-axis" data-slot="trace-waterfall-axis">
        {labels.axis.replace("{total}", String(drawing.totalMs))}
      </p>

      <div
        className="nds-trace-waterfall-viewport"
        data-slot="trace-waterfall-viewport"
        tabIndex={0}
        role={named ? "group" : undefined}
        aria-label={named ? labels.region : undefined}
      >
        <ol className="nds-trace-waterfall-rows" data-slot="trace-waterfall-rows">
          {drawing.rows.map((drawn, index) => (
            <li
              key={`${drawn.span.id}-${index}`}
              className="nds-trace-waterfall-row"
              data-slot="trace-waterfall-row"
              data-state={drawn.span.state}
              data-span-id={drawn.span.id}
              style={
                {
                  "--trace-waterfall-row-indent": drawn.indent,
                } as CSSProperties
              }
            >
              <span className="nds-trace-waterfall-name" data-slot="trace-waterfall-name">
                <span
                  className="nds-trace-waterfall-marker"
                  data-slot="trace-waterfall-marker"
                  aria-hidden="true"
                />
                <span className="nds-trace-waterfall-label" data-slot="trace-waterfall-label">
                  {drawn.span.label}
                </span>
              </span>

              <span
                className="nds-trace-waterfall-track"
                data-slot="trace-waterfall-track"
                aria-hidden="true"
              >
                <span
                  className="nds-trace-waterfall-bar"
                  data-slot="trace-waterfall-bar"
                  style={
                    {
                      "--trace-waterfall-bar-start": drawn.start,
                      "--trace-waterfall-bar-size": drawn.size,
                    } as CSSProperties
                  }
                />
              </span>

              <span className="nds-trace-waterfall-duration" data-slot="trace-waterfall-duration">
                {labels.duration.replace("{duration}", String(drawn.span.durationMs))}
              </span>

              {withReading ? (
                <span className="nds-sr-only" data-slot="trace-waterfall-row-reading">
                  {/* A MESMA frase da peça, para que o contraexemplo do papel
                      e do nome difira em uma coisa só. */}
                  {[
                    labels.state[drawn.span.state],
                    labels.reading
                      .replace("{start}", String(drawn.span.startMs))
                      .replace("{duration}", String(drawn.span.durationMs)),
                  ].join(" ")}
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function TraceWaterfallDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(traceWaterfallTranslations);

  // As chaves de `accessibility.screenReader` variam por componente, então só
  // os valores chegam ao container — o `t()` exige nome de chave e não
  // serviria. O `title` fica de fora: ele é o cabeçalho da lista, não um
  // item dela.
  const screenReaderItems = useMemo(
    () =>
      Object.entries(
        (traceWaterfallTranslations as unknown as Record<
          string,
          { accessibility?: { screenReader?: Record<string, string> } }
        >)[locale]?.accessibility?.screenReader ?? {},
      )
        .filter(([key]) => key !== "title")
        .map(([, value]) => value),
    [locale],
  );

  // O hook, e não a função pura: é ele que subscreve a loja e faz as peças
  // desta página se redesenharem quando o idioma muda.
  const labels = useTraceWaterfallLabels();

  const navGroups = useMemo(() => getNavGroups(tNav), [tNav]);
  const allIds = useMemo(
    () => navGroups.flatMap((g) => g.sections.map((s) => s.id)),
    [navGroups],
  );

  useSeoEffect({
    title: tContent("seo.title"),
    description: tContent("seo.description"),
    locale,
    componentSlug: "trace-waterfall",
  });

  useEffect(() => {
    track("docs_page_view", {
      component_name: "trace-waterfall",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "trace-waterfall",
        locale,
      });
    },
    [locale],
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  const priorityLabel = (raw: string) => tNav(priorityKeyMap[raw] ?? "common.high");

  /** Uma cascata, sem repetir os rótulos em cada chamada. */
  const piece = (
    spans: readonly TraceSpan[],
    totalMs: number = TRACE_TOTAL_MS,
    status: RunStatus = "running",
  ) => <TraceWaterfall spans={spans} totalMs={totalMs} status={status} labels={labels} />;

  /** A cascata larga dentro de um teto de largura, que é o que a faz rolar. */
  const inNarrowColumn = (node: ReactNode) => (
    <div className="nds-max-w-md">{node}</div>
  );

  /** Uma pilha de peças, para o par do certo e do errado. */
  const stackOf = (...pieces: ReactNode[]) => (
    <div className="nds-stack nds-w-full" data-spacing="lg">
      {pieces.map((el, i) => (
        <Fragment key={i}>{el}</Fragment>
      ))}
    </div>
  );

  /**
   * Uma cascata, rotulada.
   *
   * A legenda diz QUAL caso está desenhado — sem ela, quatro réguas
   * empilhadas viram uma só, e o assunto da demonstração é justamente a
   * diferença entre elas.
   */
  const example = (labelKey: string, node: ReactNode) => (
    <div className="nds-stack nds-w-full" data-spacing="xs">
      <p className="nds-text-caption nds-text-muted-foreground">
        {stripHtml(tContent(labelKey))}
      </p>
      {node}
    </div>
  );

  const examples = [
    example("demonstration.labels.order",   piece(TRACE_SPANS_ORDER)),
    example("demonstration.labels.failure", piece(TRACE_SPANS_FAILURE, TRACE_TOTAL_MS, "failed")),
    example("demonstration.labels.partial", piece(TRACE_SPANS_PARTIAL)),
    example("demonstration.labels.wide",    inNarrowColumn(piece(wideTraceSpans(), WIDE_TOTAL_MS))),
  ];

  const propsCols = {
    prop: tContent("props.table.prop"),
    type: tContent("props.table.type"),
    default: tContent("props.table.default"),
    required: tContent("props.table.required"),
    description: tContent("props.table.description"),
  };

  const rows = (keys: string[]) =>
    keys.map((k) => ({
      name: tContent(`props.table.${k}.name`),
      type: tContent(`props.table.${k}.type`),
      defaultValue: tContent(`props.table.${k}.default`),
      required: tContent(`props.table.${k}.required`),
      description: toPlainText(tContent(`props.table.${k}.description`)),
    }));

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
      {/* ── Demonstração ──────────────────────────────────────────── */}
      <DocsDemonstration
        title={tContent("demonstration.title")}
        componentSlug="trace-waterfall"
      >
        <div className="nds-stack nds-w-full" data-spacing="lg">
          {examples.map((el, i) => (
            <Fragment key={i}>
              {i > 0 && <Separator />}
              {el}
            </Fragment>
          ))}
        </div>
      </DocsDemonstration>

      {/* ── Anatomia ──────────────────────────────────────────────── */}
      <DocsAnatomy
        title={tContent("anatomy.title")}
        items={[1, 2, 3, 4, 5].map((i) => tContent(`anatomy.item${i}`))}
        structureLabel={tContent("anatomy.structureLabel")}
        structureCode={tContent("anatomy.structureCode")}
        language="html"
      />

      {/* ── Quando Usar ───────────────────────────────────────────── */}
      <DocsWhenToUse
        title={tContent("usage.title")}
        guidelines={{
          title: tContent("usage.guidelines.title"),
          items: [1, 2, 3, 4, 5].map((i) => tContent(`usage.guidelines.item${i}`)),
        }}
        scenarios={{
          title: tContent("usage.scenarios.title"),
          cols: {
            scenario: tContent("usage.scenarios.cols.scenario"),
            use: tContent("usage.scenarios.cols.use"),
            alternative: tContent("usage.scenarios.cols.alternative"),
          },
          items: [1, 2, 3, 4, 5].map((i) => ({
            s: tContent(`usage.scenarios.item${i}.s`),
            u: tContent(`usage.scenarios.item${i}.u`),
            a: toPlainText(tContent(`usage.scenarios.item${i}.a`)),
          })),
        }}
        uxWriting={{
          title: tContent("usage.uxWriting.title"),
          cols: {
            element: tContent("usage.uxWriting.table.element"),
            rules: tContent("usage.uxWriting.table.rules"),
            do: tContent("usage.uxWriting.table.correct"),
            dont: tContent("usage.uxWriting.table.avoid"),
          },
          items: ["region", "label", "axis", "reading"].map((k) => ({
            element: tContent(`usage.uxWriting.table.${k}.name`),
            rules: tContent(`usage.uxWriting.table.${k}.format`),
            do: tContent(`usage.uxWriting.table.${k}.good`),
            dont: tContent(`usage.uxWriting.table.${k}.bad`),
          })),
        }}
        do={{
          title: tContent("usage.do.title"),
          items: [1, 2, 3, 4].map((i) => tContent(`usage.do.item${i}`)),
        }}
        dont={{
          title: tContent("usage.dont.title"),
          items: [1, 2, 3, 4].map((i) => tContent(`usage.dont.item${i}`)),
        }}
      />

      {/* ── Do & Don't ────────────────────────────────────────────── */}
      <DocsDoDont
        title={tContent("doDont.title")}
        pairs={[
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doCaption: toPlainText(tContent("doDont.pair1.do")),
            dontCaption: toPlainText(tContent("doDont.pair1.dont")),
            doPreview: stackOf(piece(TRACE_SPANS_ORDER)),
            // Sem a frase de cada linha sobra a barra — que é exatamente o
            // que não chega a quem lê de ouvido.
            dontPreview: stackOf(
              <WrongTraceWaterfall
                spans={TRACE_SPANS_ORDER}
                totalMs={TRACE_TOTAL_MS}
                withReading={false}
                named
              />,
            ),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doCaption: toPlainText(tContent("doDont.pair2.do")),
            dontCaption: toPlainText(tContent("doDont.pair2.dont")),
            doPreview: stackOf(
              inNarrowColumn(piece(wideTraceSpans(), WIDE_TOTAL_MS)),
            ),
            // O errado é a camada que rola sem papel e sem nome: quem chega
            // ali por teclado para numa parada anônima. É o defeito que dois
            // componentes desta casa já tiveram, e o motivo pelo qual o
            // papel e o nome andam na mesma linha.
            dontPreview: stackOf(
              inNarrowColumn(
                <WrongTraceWaterfall
                  spans={wideTraceSpans()}
                  totalMs={WIDE_TOTAL_MS}
                  withReading
                  named={false}
                />,
              ),
            ),
          },
        ]}
      />

      {/* ── Importação ────────────────────────────────────────────── */}
      <DocsImport
        title={tContent("import.title")}
        description={tContent("import.basic")}
        code={tContent("import.basicCode")}
        secondaryDescription={tContent("import.withLabels")}
        secondaryCode={tContent("import.withLabelsCode")}
      />

      {/* ── Estados ───────────────────────────────────────────────── */}
      <DocsStates
        title={tContent("states.title")}
        cols={{
          state: tContent("states.cols.state"),
          trigger: tContent("states.cols.trigger"),
          behavior: tContent("states.cols.behavior"),
        }}
        // A ordem sai de `TOOL_CALL_STATES`: a tabela e a story de estados
        // leem a mesma lista, e nenhuma das duas fica para trás quando o
        // tipo cresce.
        items={TOOL_CALL_STATES.map((k) => ({
          label: tContent(`states.${k}.label`),
          trigger: toPlainText(tContent(`states.${k}.trigger`)),
          behavior: toPlainText(tContent(`states.${k}.behavior`)),
        }))}
      />

      {/* ── Propriedades ──────────────────────────────────────────── */}
      <DocsProps
        title={tContent("props.title")}
        tables={[
          {
            title: "TraceWaterfall",
            cols: propsCols,
            items: rows(["spans", "totalMs", "status", "labels"]),
          },
          {
            title: "TraceWaterfallLabels",
            cols: propsCols,
            items: rows([
              "labelsRegion", "labelsAxis", "labelsDuration",
              "labelsReading", "labelsClipped", "labelsState",
            ]),
          },
          {
            title: "TraceSpan",
            cols: propsCols,
            items: rows([
              "spanId", "spanLabel", "spanStart",
              "spanDuration", "spanDepth", "spanState",
            ]),
          },
        ]}
        interfaceCode={INTERFACE_CODE}
        extensibilityTitle={tContent("props.extensibilityTitle")}
        extensibilityNotes={stripHtml(tContent("props.extensibility"))}
        extensibilityCode={tContent("props.extensibilityCode")}
      />

      {/* ── Tokens ────────────────────────────────────────────────── */}
      <DocsTokens
        title={tContent("tokens.title")}
        cols={{
          token: tContent("tokens.table.token"),
          value: tContent("tokens.table.value"),
          description: tContent("tokens.table.description"),
        }}
        items={[
          "textLabel", "spacing24", "spacing40", "spacing2", "lineHeightNormal",
          "spacing3", "border", "radius", "muted", "ring", "spacing4",
          "radiusFull", "mutedForeground", "foreground", "background",
          "primary", "primaryForeground", "spacing1", "success", "destructive",
        ].map((k) => ({
          token: tContent(`tokens.table.${k}.token`),
          value: tContent(`tokens.table.${k}.value`),
          description: toPlainText(tContent(`tokens.table.${k}.description`)),
        }))}
        customizationTitle={tContent("tokens.customizationTitle")}
        customizationCode={tContent("tokens.customizationCode")}
        language="css"
      />

      {/* ── Acessibilidade ────────────────────────────────────────── */}
      <DocsAccessibility
        title={tContent("accessibility.title")}
        summary={tContent("accessibility.summary")}
        items={[1, 2, 3, 4, 5, 6, 7, 8].map((i) => tContent(`accessibility.items.item${i}`))}
        keyboardTitle={tContent("accessibility.keyboard.title")}
        keyboardItems={[
          { key: "Tab",   description: tContent("accessibility.keyboard.tab") },
          { key: "Enter", description: tContent("accessibility.keyboard.enter") },
          { key: "← →",   description: tContent("accessibility.keyboard.arrows") },
        ]}
        screenReaderTitle={tContent("accessibility.screenReader.title")}
        screenReaderItems={screenReaderItems}
      />

      {/* ── Relacionados ──────────────────────────────────────────── */}
      <DocsRelated
        title={tContent("related.title")}
        items={[
          { name: tContent("related.items.flowGraph.name"),     description: toPlainText(tContent("related.items.flowGraph.description")),     path: "?path=/docs/components-conversational-flowgraph--docs"     },
          { name: tContent("related.items.agentPlan.name"),     description: toPlainText(tContent("related.items.agentPlan.description")),     path: "?path=/docs/components-conversational-agentplan--docs"     },
          { name: tContent("related.items.messageTiming.name"), description: toPlainText(tContent("related.items.messageTiming.description")), path: "?path=/docs/components-conversational-messagetiming--docs" },
          { name: tContent("related.items.progress.name"),      description: toPlainText(tContent("related.items.progress.description")),      path: "?path=/docs/components-feedback-progress--docs"            },
        ]}
      />

      {/* ── Notas ─────────────────────────────────────────────────── */}
      <DocsNotes
        title={tContent("notes.title")}
        componentSlug="trace-waterfall"
        items={[1, 2, 3, 4, 5, 6, 7].map((i) => ({ title: "", content: tContent(`notes.item${i}`) }))}
      />

      {/* ── Analytics ─────────────────────────────────────────────── */}
      <DocsAnalytics
        title={tContent("analytics.title")}
        cols={{
          event: tContent("analytics.table.event"),
          trigger: tContent("analytics.table.trigger"),
          payload: tContent("analytics.table.payload"),
        }}
        items={["pageView", "sectionViewed", "demoClick"].map((k) => ({
          event: tContent(`analytics.table.${k}`),
          trigger: toPlainText(tContent(`analytics.table.${k}Trigger`)),
          payload: tContent(`analytics.table.${k}Payload`),
        }))}
      />

      {/* ── Testes ────────────────────────────────────────────────── */}
      <DocsTestes
        title={tContent("testes.title")}
        functional={{
          title: tContent("testes.functional.title"),
          description: tContent("testes.functional.description"),
          cols: {
            action: tNav("common.userAction"),
            result: tNav("common.expectedResult"),
            priority: tNav("common.priority"),
          },
          items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => ({
            action: toPlainText(tContent(`testes.functional.item${i}.action`)),
            result: toPlainText(tContent(`testes.functional.item${i}.result`)),
            priority: priorityLabel(tContent(`testes.functional.item${i}.priority`)),
          })),
        }}
        accessibility={{
          title: tContent("testes.accessibility.title"),
          description: tContent("testes.accessibility.description"),
          cols: {
            criterion: tNav("common.criterion"),
            level: "WCAG",
            how: tNav("common.howToVerify"),
          },
          // A lista é PLANA: cada item é um critério, e o "como verificar" é
          // o próprio addon-a11y rodando em toda story.
          items: [1, 2, 3, 4, 5, 6, 7].map((i) => ({
            criterion: toPlainText(tContent(`testes.accessibility.item${i}`)),
            level: "AA",
            how: "—",
          })),
        }}
        visual={{
          title: tContent("testes.visual.title"),
          description: tContent("testes.visual.description"),
          cols: {
            story: tNav("common.storyState"),
            priority: tNav("common.priority"),
          },
          items: [1, 2, 3, 4, 5, 6, 7, 8].map((i) => ({
            story: toPlainText(tContent(`testes.visual.item${i}.story`)),
            priority: priorityLabel(tContent(`testes.visual.item${i}.priority`)),
          })),
        }}
      />
    </DocsPageLayout>
  );
}
