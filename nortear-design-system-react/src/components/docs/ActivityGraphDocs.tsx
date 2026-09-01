import { Fragment, useCallback, useEffect, useMemo, type CSSProperties, type ReactNode } from "react"
import { ActivityGraph } from "@/components/ui/activity-graph"
import { Separator } from "@/components/ui/separator"
import {
  WIDE_END,
  WIDE_START,
  useActivityGraphLabels,
} from "@/components/ui/activity-graph.fixtures"
import type { ActivityDay, RunStatus } from "@shared/primitives/chat-protocol"
import { resolveActivityCalendar } from "@shared/primitives/activity-calendar"
import {
  ACTIVITY_DAYS,
  ACTIVITY_DAYS_EMPTY,
  ACTIVITY_END,
  ACTIVITY_MONTH_END,
  ACTIVITY_MONTH_START,
  ACTIVITY_START,
  ACTIVITY_THRESHOLDS,
} from "@shared/primitives/activity-graph-examples"
import { useTranslation } from "@/lib/i18n"
import { useSeoEffect } from "@/lib/use-seo"
import { track } from "@/lib/analytics"
import { useActiveSection } from "@/lib/use-active-section"
import uiTranslations from "@/i18n/ui.json"
import activityGraphTranslations from "@shared/content/activity-graph/translations.json"

import { DocsHeader }        from "@/components/docs/shared/sections/DocsHeader"
import { DocsPageLayout }    from "@/components/docs/shared/sections/DocsPageLayout"
import { DocsDemonstration } from "@/components/docs/shared/sections/DocsDemonstration"
import { DocsAnatomy }       from "@/components/docs/shared/sections/DocsAnatomy"
import { DocsWhenToUse }     from "@/components/docs/shared/sections/DocsWhenToUse"
import { DocsDoDont }        from "@/components/docs/shared/sections/DocsDoDont"
import { DocsImport }        from "@/components/docs/shared/sections/DocsImport"
import { DocsStates }        from "@/components/docs/shared/sections/DocsStates"
import { DocsProps }         from "@/components/docs/shared/sections/DocsProps"
import { DocsTokens }        from "@/components/docs/shared/sections/DocsTokens"
import { DocsAccessibility } from "@/components/docs/shared/sections/DocsAccessibility"
import { DocsRelated }       from "@/components/docs/shared/sections/DocsRelated"
import { DocsNotes }         from "@/components/docs/shared/sections/DocsNotes"
import { DocsAnalytics }     from "@/components/docs/shared/sections/DocsAnalytics"
import { DocsTestes }        from "@/components/docs/shared/sections/DocsTestes"
import { stripHtml, toPlainText } from "@/lib/strip-html"

// ─── Helpers ─────────────────────────────────────────────────────────────────

const priorityKeyMap: Record<string, string> = {
  high: "common.high",
  medium: "common.medium",
  low: "common.low",
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
]

const INTERFACE_CODE = `export interface ActivityGraphLabels {
  region: string;                     // o nome da camada que rola — obrigatório
  total: string;                      // molde com \`{count}\`, \`{start}\` e \`{end}\`
  dateFormat: string;                 // molde com \`{day}\`, \`{month}\` e \`{year}\`
  monthsShort: readonly string[];     // 12, para os rótulos de coluna
  monthsLong: readonly string[];      // 12, para a frase de cada casa
  weekdaysShort: readonly string[];   // 7, começando no domingo
  none: string;                       // a frase do dia sem atividade
  one: string;                        // molde com \`{count}\`, \`{date}\` e \`{level}\`
  many: string;
  levels: readonly string[];          // uma palavra a mais que os degraus
  legendLess: string;
  legendMore: string;
}

// O dia vem de \`@shared/primitives/chat-protocol\`, e é o único tipo daquele
// arquivo desta família que NÃO carrega geometria: a casa em que ele cai não
// é declarada, ela se DEDUZ da data e da janela.
interface ActivityDay {
  date: string;   // ano-mês-dia, um dia civil sem hora e sem fuso
  count: number;  // dias repetidos SOMAM
}

// A JANELA E A ESCALA SÃO DADO, e são o que separa esta peça de um mapa de
// calor de janela fixa: nada aqui olha o relógio, e a escala não se deriva do
// maior valor — derivada, a mesma contagem pintaria diferente em duas
// grades.`

// ─── Contraexemplos ──────────────────────────────────────────────────────────

interface WrongActivityGraphProps {
  days: readonly ActivityDay[]
  start: string
  end: string
  thresholds: readonly number[]
  /** A frase de cada casa. Ausente, sobra a tinta. */
  withReading: boolean
  /** O papel e o nome da camada que rola. Ausentes, a parada é anônima. */
  named: boolean
}

/**
 * A grade montada À MÃO, e tem de ser: a peça sempre escreve a leitura de
 * cada casa e sempre põe papel e nome na camada que rola, então não há
 * propriedade que produza o erro. A marcação abaixo é a mesma da peça, com
 * uma parte removida de cada vez.
 */
function WrongActivityGraph({
  days,
  start,
  end,
  thresholds,
  withReading,
  named,
}: WrongActivityGraphProps) {
  const labels = useActivityGraphLabels()
  const drawing = resolveActivityCalendar(days, { start, end, thresholds })
  if (!drawing) return null

  return (
    <div
      className="nds-activity-graph"
      data-slot="activity-graph"
      style={{ "--activity-graph-levels": drawing.levels } as CSSProperties}
    >
      <p className="nds-activity-graph-total" data-slot="activity-graph-total">
        {labels.total
          .replace("{count}", String(drawing.total))
          .replace("{start}", String(drawing.from.date))
          .replace("{end}", String(drawing.to.date))}
      </p>

      <div
        className="nds-activity-graph-viewport"
        data-slot="activity-graph-viewport"
        tabIndex={0}
        role={named ? "group" : undefined}
        aria-label={named ? labels.region : undefined}
      >
        <div
          className="nds-activity-graph-calendar"
          data-slot="activity-graph-calendar"
          style={{ "--activity-graph-weeks": drawing.weeks } as CSSProperties}
        >
          <ol className="nds-activity-graph-days" data-slot="activity-graph-days">
            {drawing.cells.map((cell) => (
              <li
                key={cell.date}
                className="nds-activity-graph-day"
                data-slot="activity-graph-day"
                data-level={cell.level}
                data-date={cell.date}
                style={
                  {
                    "--activity-graph-day-column": cell.column,
                    "--activity-graph-day-row": cell.row,
                    "--activity-graph-day-level": cell.level,
                  } as CSSProperties
                }
              >
                {withReading ? (
                  <span className="nds-sr-only" data-slot="activity-graph-day-reading">
                    {cell.count === 0
                      ? labels.none.replace("{date}", cell.date)
                      : (cell.count === 1 ? labels.one : labels.many)
                          .replace("{count}", String(cell.count))
                          .replace("{date}", cell.date)
                          .replace("{level}", labels.levels[cell.level] ?? "")}
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function ActivityGraphDocs() {
  const { t: tNav } = useTranslation(uiTranslations)
  const { t: tContent, locale } = useTranslation(activityGraphTranslations)

  // As chaves de `accessibility.screenReader` variam por componente, então só
  // os valores chegam ao container — o `t()` exige nome de chave e não
  // serviria. O `title` fica de fora: ele é o cabeçalho da lista, não um
  // item dela.
  const screenReaderItems = useMemo(
    () =>
      Object.entries(
        (activityGraphTranslations as unknown as Record<
          string,
          { accessibility?: { screenReader?: Record<string, string> } }
        >)[locale]?.accessibility?.screenReader ?? {},
      )
        .filter(([key]) => key !== "title")
        .map(([, value]) => value),
    [locale],
  )

  // O hook, e não a função pura: é ele que subscreve a loja e faz as peças
  // desta página se redesenharem quando o idioma muda.
  const labels = useActivityGraphLabels()

  const navGroups = useMemo(() => getNavGroups(tNav), [tNav])
  const allIds = useMemo(
    () => navGroups.flatMap((g) => g.sections.map((s) => s.id)),
    [navGroups],
  )

  useSeoEffect({
    title: tContent("seo.title"),
    description: tContent("seo.description"),
    locale,
    componentSlug: "activity-graph",
  })

  useEffect(() => {
    track("docs_page_view", {
      component_name: "activity-graph",
      locale,
      page_title: `${tContent("title")} · Design System`,
    })
  }, [locale, tContent])

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "activity-graph",
        locale,
      })
    },
    [locale],
  )

  const activeId = useActiveSection(allIds, handleSectionChange)

  const priorityLabel = (raw: string) => tNav(priorityKeyMap[raw] ?? "common.high")

  /** Uma grade, sem repetir os rótulos em cada chamada. */
  const piece = (
    days: readonly ActivityDay[],
    start: string = ACTIVITY_START,
    end: string = ACTIVITY_END,
    status: RunStatus = "complete",
  ) => (
    <ActivityGraph
      days={days}
      start={start}
      end={end}
      thresholds={ACTIVITY_THRESHOLDS}
      status={status}
      labels={labels}
    />
  )

  /** A grade larga dentro de um teto de largura, que é o que a faz rolar. */
  const inNarrowColumn = (node: ReactNode) => <div className="nds-max-w-md">{node}</div>

  /** Uma pilha de peças, para o par do certo e do errado. */
  const stackOf = (...pieces: ReactNode[]) => (
    <div className="nds-stack nds-w-full" data-spacing="lg">
      {pieces.map((el, i) => (
        <Fragment key={i}>{el}</Fragment>
      ))}
    </div>
  )

  /**
   * Uma grade, rotulada.
   *
   * A legenda diz QUAL caso está desenhado — sem ela, quatro grades
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
  )

  const examples = [
    example("demonstration.labels.quarter", piece(ACTIVITY_DAYS)),
    example("demonstration.labels.empty",   piece(ACTIVITY_DAYS_EMPTY)),
    example("demonstration.labels.month",   piece(ACTIVITY_DAYS, ACTIVITY_MONTH_START, ACTIVITY_MONTH_END)),
    example("demonstration.labels.wide",    inNarrowColumn(piece(ACTIVITY_DAYS, WIDE_START, WIDE_END))),
  ]

  const propsCols = {
    prop: tContent("props.table.prop"),
    type: tContent("props.table.type"),
    default: tContent("props.table.default"),
    required: tContent("props.table.required"),
    description: tContent("props.table.description"),
  }

  const rows = (keys: string[]) =>
    keys.map((k) => ({
      name: tContent(`props.table.${k}.name`),
      type: tContent(`props.table.${k}.type`),
      defaultValue: tContent(`props.table.${k}.default`),
      required: tContent(`props.table.${k}.required`),
      description: toPlainText(tContent(`props.table.${k}.description`)),
    }))

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
        componentSlug="activity-graph"
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
          items: ["region", "total", "day", "level"].map((k) => ({
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
            doPreview: stackOf(piece(ACTIVITY_DAYS, ACTIVITY_MONTH_START, ACTIVITY_MONTH_END)),
            // Sem a frase de cada casa sobra a tinta — que é exatamente o
            // que não chega a quem lê de ouvido.
            dontPreview: stackOf(
              <WrongActivityGraph
                days={ACTIVITY_DAYS}
                start={ACTIVITY_MONTH_START}
                end={ACTIVITY_MONTH_END}
                thresholds={ACTIVITY_THRESHOLDS}
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
            doPreview: stackOf(inNarrowColumn(piece(ACTIVITY_DAYS, WIDE_START, WIDE_END))),
            // O errado é a camada que rola sem papel e sem nome: quem chega
            // ali por teclado para numa parada anônima. É o defeito que
            // dois componentes desta casa já tiveram, e o motivo pelo qual
            // o papel e o nome andam na mesma linha.
            dontPreview: stackOf(
              inNarrowColumn(
                <WrongActivityGraph
                  days={ACTIVITY_DAYS}
                  start={WIDE_START}
                  end={WIDE_END}
                  thresholds={ACTIVITY_THRESHOLDS}
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
        items={["empty", "low", "high", "busy"].map((k) => ({
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
            title: "ActivityGraph",
            cols: propsCols,
            items: rows(["days", "start", "end", "thresholds", "weekStart", "status", "labels"]),
          },
          {
            title: "ActivityGraphLabels",
            cols: propsCols,
            items: rows([
              "labelsRegion", "labelsTotal", "labelsDateFormat",
              "labelsMonthsShort", "labelsMonthsLong", "labelsWeekdaysShort",
              "labelsNone", "labelsOne", "labelsMany",
              "labelsLevels", "labelsLegendLess", "labelsLegendMore",
            ]),
          },
          {
            title: "ActivityDay",
            cols: propsCols,
            items: rows(["dayDate", "dayCount"]),
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
          "textLabel", "spacing3", "spacing05", "spacing2", "mutedForeground",
          "lineHeightNormal", "spacing3Viewport", "border", "radius", "muted",
          "ring", "spacing1", "radiusXs", "background", "primary",
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
          { name: tContent("related.items.chart.name"),          description: toPlainText(tContent("related.items.chart.description")),          path: "?path=/docs/primitives-display-chart--docs"                 },
          { name: tContent("related.items.calendar.name"),       description: toPlainText(tContent("related.items.calendar.description")),       path: "?path=/docs/primitives-form-calendar--docs"                 },
          { name: tContent("related.items.traceWaterfall.name"), description: toPlainText(tContent("related.items.traceWaterfall.description")), path: "?path=/docs/primitives-conversational-tracewaterfall--docs" },
          { name: tContent("related.items.jobProgress.name"),    description: toPlainText(tContent("related.items.jobProgress.description")),    path: "?path=/docs/primitives-conversational-jobprogress--docs"    },
        ]}
      />

      {/* ── Notas ─────────────────────────────────────────────────── */}
      <DocsNotes
        title={tContent("notes.title")}
        componentSlug="activity-graph"
        items={[1, 2, 3, 4, 5, 6, 7, 8].map((i) => ({ title: "", content: tContent(`notes.item${i}`) }))}
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
  )
}
