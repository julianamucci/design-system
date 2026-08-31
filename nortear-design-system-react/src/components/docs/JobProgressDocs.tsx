import { Fragment, useCallback, useEffect, useMemo, type ReactNode } from "react";
import { JobProgress, type JobProgressLabels } from "@/components/ui/job-progress";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  useJobLabel,
  useJobProgressLabels,
  JOB_COUNT,
  JOB_COUNT_WITHOUT_TOTAL,
} from "@/components/ui/job-progress.fixtures";
import {
  RUN_STATUSES,
  type JobCount,
  type RunStatus,
} from "@shared/primitives/chat-protocol";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import { useActiveSection } from "@/lib/use-active-section";
import uiTranslations from "@/i18n/ui.json";
import jobTranslations from "@shared/content/job-progress/translations.json";

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

const INTERFACE_CODE = `export interface JobProgressLabels {
  status: Record<RunStatus, string>;                  // a palavra de cada estado
  count: string;                                      // molde com \`{done}\` e \`{total}\`
  countWithoutTotal: string;                          // molde com \`{done}\` só
  action?: Partial<Record<RunStatus, string>>;        // o rótulo da ação onde ela existe
}

// A conta e o que a barra mostra vêm de \`@shared/primitives/chat-protocol\`:
interface JobCount {
  done: number;
  total?: number;   // ausente é "não se sabe", nunca zero
}

// É ela que decide se a barra tem uma fração para mostrar. Mora no vocabulário,
// e não na tela, porque a resposta tem de ser a mesma nas cinco stacks — e a
// que discordaria é a do trabalho parado sem total.
declare function jobProgressValue(status: RunStatus, count?: JobCount): number | null;`;

// ─── Componente principal ─────────────────────────────────────────────────────

export function JobProgressDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(jobTranslations);

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria.
  // O `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
  const screenReaderItems = useMemo(
    () =>
      Object.entries(
        (jobTranslations as unknown as Record<
          string,
          { accessibility?: { screenReader?: Record<string, string> } }
        >)[locale]?.accessibility?.screenReader ?? {},
      )
        .filter(([key]) => key !== "title")
        .map(([, value]) => value),
    [locale],
  );

  // O hook, e não a função pura: é ele que subscreve a loja e faz as peças
  // desta página se redesenharem quando o idioma muda. A função pura serve à
  // `play`, onde não há componente para pendurar um hook.
  const label = useJobLabel();
  const labels = useJobProgressLabels();

  const navGroups = useMemo(() => getNavGroups(tNav), [tNav]);
  const allIds = useMemo(
    () => navGroups.flatMap((g) => g.sections.map((s) => s.id)),
    [navGroups],
  );

  useSeoEffect({
    title: tContent("seo.title"),
    description: tContent("seo.description"),
    locale,
    componentSlug: "job-progress",
  });

  useEffect(() => {
    track("docs_page_view", {
      component_name: "job-progress",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "job-progress",
        locale,
      });
    },
    [locale],
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  const priorityLabel = (raw: string) => tNav(priorityKeyMap[raw] ?? "common.high");

  /**
   * Uma peça de andamento, sem repetir os rótulos em cada chamada.
   *
   * A MESMA conta vai para as fotos, de propósito: quem decide o que a barra
   * mostra em cada estado é o vocabulário compartilhado, e não esta página.
   */
  const piece = (
    status: RunStatus,
    count: JobCount | undefined = JOB_COUNT,
    custom: JobProgressLabels = labels,
  ) => <JobProgress label={label} status={status} count={count} labels={custom} />;

  /** Uma pilha de peças, para o par do certo e do errado. */
  const stackOf = (...pieces: ReactNode[]) => (
    <div className="nds-stack nds-w-full" data-spacing="lg">
      {pieces.map((el, i) => (
        <Fragment key={i}>{el}</Fragment>
      ))}
    </div>
  );

  /**
   * Uma peça de andamento, rotulada.
   *
   * A legenda diz QUAL caso está desenhado — sem ela, quatro peças empilhadas
   * viram uma só, e o assunto da demonstração é justamente a diferença entre
   * elas.
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
    example("demonstration.labels.running",      piece("running")),
    example("demonstration.labels.unknownTotal", piece("running", JOB_COUNT_WITHOUT_TOTAL)),
    example("demonstration.labels.stopped",      piece("stopped")),
    example("demonstration.labels.complete",     piece("complete")),
  ];

  // O contraexemplo do primeiro par é montado À MÃO, e tem de ser: a peça trata
  // total zero como ausência, então não há argumento que produza o erro. Aqui a
  // barra determinada em zero é posta no lugar da indeterminada, para que se
  // veja a trilha vazia dizendo "acabou de começar" para algo que já andou
  // muito.
  const zeroBar = (
    <div
      data-slot="job-progress"
      className="nds-job-progress"
      data-status="running"
      aria-busy="true"
    >
      <span className="nds-job-progress-label" data-slot="job-progress-label">
        {label}
      </span>
      <span
        className="nds-job-progress-count"
        data-slot="job-progress-count"
        aria-hidden="true"
      >
        {labels.countWithoutTotal.replace(
          "{done}",
          JOB_COUNT_WITHOUT_TOTAL.done.toLocaleString(),
        )}
      </span>
      <Progress className="nds-job-progress-bar" value={0} aria-label={label} />
      <span className="nds-job-progress-status" data-slot="job-progress-status">
        {labels.status.running}
      </span>
      <Button
        className="nds-job-progress-action"
        data-slot="job-progress-action"
        type="button"
        variant="outline"
        size="sm"
      >
        {labels.action?.running}
      </Button>
    </div>
  );

  // O contraexemplo do segundo par: as palavras apagadas, e a diferença entre o
  // que corre e o que foi interrompido passa a existir só na barra — que nos
  // dois casos para no mesmo lugar.
  const mute: JobProgressLabels = {
    ...labels,
    status: RUN_STATUSES.reduce((acc, status) => {
      acc[status] = "";
      return acc;
    }, {} as Record<RunStatus, string>),
  };

  const propsCols = {
    prop: tContent("props.table.prop"),
    type: tContent("props.table.type"),
    default: tContent("props.table.default"),
    required: tContent("props.table.required"),
    description: tContent("props.table.description"),
  };

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
        componentSlug="job-progress"
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
          items: ["jobLabel", "count", "countWithoutTotal", "status", "action"].map((k) => ({
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
            doPreview: stackOf(piece("running", JOB_COUNT_WITHOUT_TOTAL)),
            dontPreview: stackOf(zeroBar),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doCaption: toPlainText(tContent("doDont.pair2.do")),
            dontCaption: toPlainText(tContent("doDont.pair2.dont")),
            // O par é o MESMO par de estados, e as duas barras param no mesmo
            // lugar: o que muda é se a palavra chega a quem não distingue uma
            // barra parada de outra.
            doPreview: stackOf(piece("running"), piece("stopped")),
            dontPreview: stackOf(
              piece("running", JOB_COUNT, mute),
              piece("stopped", JOB_COUNT, mute),
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
        // A ordem sai de `RUN_STATUSES`: a tabela e a story de estados leem a
        // mesma lista, e nenhuma das duas fica para trás quando o tipo cresce.
        items={RUN_STATUSES.map((k) => ({
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
            title: "JobProgress",
            cols: propsCols,
            items: ["label", "status", "count", "labels", "onAction"].map((k) => ({
              name: tContent(`props.table.${k}.name`),
              type: tContent(`props.table.${k}.type`),
              defaultValue: tContent(`props.table.${k}.default`),
              required: tContent(`props.table.${k}.required`),
              description: toPlainText(tContent(`props.table.${k}.description`)),
            })),
          },
          {
            title: "JobProgressLabels",
            cols: propsCols,
            items: [
              "labelsStatus",
              "labelsCount",
              "labelsCountWithoutTotal",
              "labelsAction",
            ].map((k) => ({
              name: tContent(`props.table.${k}.name`),
              type: tContent(`props.table.${k}.type`),
              defaultValue: tContent(`props.table.${k}.default`),
              required: tContent(`props.table.${k}.required`),
              description: toPlainText(tContent(`props.table.${k}.description`)),
            })),
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
          "textLabel", "mutedForeground", "spacing1", "spacing2",
          "foreground", "fontWeightMedium", "spacing6",
          "primary", "success", "destructive",
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
        items={[1, 2, 3, 4, 5, 6, 7].map((i) => tContent(`accessibility.items.item${i}`))}
        keyboardTitle={tContent("accessibility.keyboard.title")}
        keyboardItems={[
          { key: "Tab",   description: tContent("accessibility.keyboard.tab") },
          { key: "Enter", description: tContent("accessibility.keyboard.enter") },
          { key: "↑ ↓",   description: tContent("accessibility.keyboard.arrows") },
        ]}
        screenReaderTitle={tContent("accessibility.screenReader.title")}
        screenReaderItems={screenReaderItems}
      />

      {/* ── Relacionados ──────────────────────────────────────────── */}
      <DocsRelated
        title={tContent("related.title")}
        items={[
          { name: tContent("related.items.agentStatus.name"),     description: toPlainText(tContent("related.items.agentStatus.description")),     path: "?path=/docs/primitives-conversational-agentstatus--docs"     },
          { name: tContent("related.items.agentPlan.name"),       description: toPlainText(tContent("related.items.agentPlan.description")),       path: "?path=/docs/primitives-conversational-agentplan--docs"       },
          { name: tContent("related.items.progress.name"),        description: toPlainText(tContent("related.items.progress.description")),        path: "?path=/docs/primitives-feedback-progress--docs"              },
          { name: tContent("related.items.connectionState.name"), description: toPlainText(tContent("related.items.connectionState.description")), path: "?path=/docs/primitives-conversational-connectionstate--docs" },
        ]}
      />

      {/* ── Notas ─────────────────────────────────────────────────── */}
      <DocsNotes
        title={tContent("notes.title")}
        componentSlug="job-progress"
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
          items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => ({
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
          // A lista é PLANA: cada item é um critério, e o "como verificar" é o
          // próprio addon-a11y rodando em toda story.
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
          items: [1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => ({
            story: toPlainText(tContent(`testes.visual.item${i}.story`)),
            priority: priorityLabel(tContent(`testes.visual.item${i}.priority`)),
          })),
        }}
      />
    </DocsPageLayout>
  );
}
