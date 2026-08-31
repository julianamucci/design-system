import { Fragment, useCallback, useEffect, useMemo, type ReactNode } from "react";
import { Composer } from "@/components/ui/composer";
import { Markdown } from "@/components/ui/markdown";
import { Separator } from "@/components/ui/separator";
import { useComposerLabels } from "@/components/ui/composer.fixtures";
import { ThinkingIndicator } from "@/components/ui/thinking-indicator";
import {
  answerText,
  questionText,
  useIndicatorLabels,
} from "@/components/ui/thinking-indicator.fixtures";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import { useActiveSection } from "@/lib/use-active-section";
import uiTranslations from "@/i18n/ui.json";
import indicatorTranslations from "@shared/content/thinking-indicator/translations.json";

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

/**
 * A divergência de API desta stack, registrada em vez de "alinhada".
 *
 * A `translations.json` é compartilhada pelas cinco e descreve a propriedade de
 * classe pelo nome neutro. Aqui ela se chama de outro jeito, e isso é diferença
 * de FRAMEWORK — não de markup, de classe ou de comportamento —, então não há
 * fonte de verdade a seguir: o que se faz é registrar. O override vale só para
 * o NOME da propriedade; a descrição continua sendo a compartilhada, porque ela
 * não cita API nenhuma. Nunca uma chave `*Code`: snippet em override fica preso
 * a uma stack, invisível para o conteúdo compartilhado.
 */
const PROP_OVERRIDES = {
  "*": { "props.table.class.name": "className" },
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

const INTERFACE_CODE = `export interface ThinkingIndicatorProps {
  // A frase que diz o que está acontecendo. Sem valor padrão de propósito:
  // o padrão escondido seria uma frase numa língua só.
  label: string;
  // Classes extras na raiz, para pôr o indicador onde a resposta vai aparecer.
  className?: string;
}

// Não há propriedade de quantidade de pontos: o atraso escalonado que faz três
// pontos parecerem uma onda está escrito para três.`;

// ─── Componente principal ─────────────────────────────────────────────────────

export function ThinkingIndicatorDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(indicatorTranslations, PROP_OVERRIDES);
  const labels = useIndicatorLabels();
  const fieldLabels = useComposerLabels();

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria.
  // O `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
  const screenReaderItems = useMemo(
    () =>
      Object.entries(
        (indicatorTranslations as unknown as Record<
          string,
          { accessibility?: { screenReader?: Record<string, string> } }
        >)[locale]?.accessibility?.screenReader ?? {},
      )
        .filter(([key]) => key !== "title")
        .map(([, value]) => value),
    [locale],
  );

  const navGroups = useMemo(() => getNavGroups(tNav), [tNav]);
  const allIds = useMemo(
    () => navGroups.flatMap((g) => g.sections.map((s) => s.id)),
    [navGroups],
  );

  useSeoEffect({
    title: tContent("seo.title"),
    description: tContent("seo.description"),
    locale,
    componentSlug: "thinking-indicator",
  });

  useEffect(() => {
    track("docs_page_view", {
      component_name: "thinking-indicator",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "thinking-indicator",
        locale,
      });
    },
    [locale],
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  const priorityLabel = (raw: string) => tNav(priorityKeyMap[raw] ?? "common.high");

  /**
   * O lugar da resposta: a pergunta feita, e embaixo dela o que vier a seguir.
   *
   * A demonstração inteira depende deste enquadramento. Mostrado sozinho, o
   * indicador é só um desenho de três pontos; o que a peça é só aparece quando
   * se vê o LUGAR que ele ocupa — e o mesmo lugar depois, com a resposta dentro.
   */
  const answerPlace = (tail: ReactNode) => (
    <div className="nds-stack nds-w-full" data-spacing="sm">
      <Markdown content={questionText()} />
      {tail}
    </div>
  );

  const waiting = answerPlace(<ThinkingIndicator label={labels.generating} />);
  const arrived = answerPlace(<Markdown content={answerText()} />);

  /**
   * Um caso da demonstração, com a legenda que diz qual é.
   *
   * Sem ela, três lugares empilhados viram um só — e o assunto da demonstração
   * é justamente a diferença entre eles.
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
    example("demonstration.labels.waiting", waiting),
    example("demonstration.labels.arrived", arrived),
    example(
      "demonstration.labels.withComposer",
      <div className="nds-stack nds-w-full" data-spacing="sm">
        {/* Outra frase para a mesma espera, de propósito: o desenho é o mesmo,
            e o que muda é o que o consumidor manda dizer. */}
        <ThinkingIndicator label={labels.searching} />
        {/* O campo é quem oferece o que fazer a respeito da espera; o indicador
            só diz que a resposta vem. */}
        <Composer labels={fieldLabels} running />
      </div>,
    ),
  ];

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
        componentSlug="thinking-indicator"
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
          items: ["phrase", "verb", "length", "promise"].map((k) => ({
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

      {/* ── Certo e errado ────────────────────────────────────────── */}
      <DocsDoDont
        title={tContent("doDont.title")}
        pairs={[
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doCaption: toPlainText(tContent("doDont.pair1.do")),
            dontCaption: toPlainText(tContent("doDont.pair1.dont")),
            doPreview: <ThinkingIndicator label={labels.generating} />,
            // O contraexemplo: a frase apagada, e o que sobra para quem ouve a
            // tela é silêncio — os pontos são desenho, e desenho não se lê.
            dontPreview: <ThinkingIndicator label="" />,
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doCaption: toPlainText(tContent("doDont.pair2.do")),
            dontCaption: toPlainText(tContent("doDont.pair2.dont")),
            doPreview: arrived,
            // O contraexemplo: o indicador continua ao lado do texto que já
            // chegou, dizendo que se espera pelo que já veio.
            dontPreview: (
              <div className="nds-stack nds-w-full" data-spacing="sm">
                <Markdown content={questionText()} />
                <Markdown content={answerText()} />
                <ThinkingIndicator label={labels.generating} />
              </div>
            ),
          },
        ]}
      />

      {/* ── Importação ────────────────────────────────────────────── */}
      <DocsImport
        title={tContent("import.title")}
        description={tContent("import.basic")}
        code={tContent("import.basicCode")}
        secondaryDescription={tContent("import.arrival")}
        secondaryCode={tContent("import.arrivalCode")}
      />

      {/* ── Estados ───────────────────────────────────────────────── */}
      <DocsStates
        title={tContent("states.title")}
        cols={{
          state: tContent("states.cols.state"),
          trigger: tContent("states.cols.trigger"),
          behavior: tContent("states.cols.behavior"),
        }}
        items={["waiting", "arrived", "reducedMotion"].map((k) => ({
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
            title: "ThinkingIndicator",
            cols: {
              prop: tContent("props.table.prop"),
              type: tContent("props.table.type"),
              default: tContent("props.table.default"),
              required: tContent("props.table.required"),
              description: tContent("props.table.description"),
            },
            items: ["label", "class"].map((k) => ({
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
          "spacing2", "spacing1", "radiusFull",
          "mutedForeground", "durationSlow", "easeStandard",
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
        items={[1, 2, 3, 4, 5].map((i) => tContent(`accessibility.items.item${i}`))}
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
          { name: tContent("related.items.agentStatus.name"), description: toPlainText(tContent("related.items.agentStatus.description")), path: "?path=/docs/primitives-conversational-agentstatus--docs" },
          { name: tContent("related.items.chatThread.name"),  description: toPlainText(tContent("related.items.chatThread.description")),  path: "?path=/docs/primitives-conversational-chatthread--docs" },
          { name: tContent("related.items.skeleton.name"),    description: toPlainText(tContent("related.items.skeleton.description")),    path: "?path=/docs/primitives-feedback-skeleton--docs" },
          { name: tContent("related.items.progress.name"),    description: toPlainText(tContent("related.items.progress.description")),    path: "?path=/docs/primitives-feedback-progress--docs" },
        ]}
      />

      {/* ── Notas ─────────────────────────────────────────────────── */}
      <DocsNotes
        title={tContent("notes.title")}
        componentSlug="thinking-indicator"
        items={[1, 2, 3, 4, 5].map((i) => ({ title: "", content: tContent(`notes.item${i}`) }))}
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
          items: [1, 2, 3, 4, 5, 6].map((i) => ({
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
          items: [1, 2, 3, 4, 5].map((i) => ({
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
          items: [1, 2, 3, 4, 5].map((i) => ({
            story: toPlainText(tContent(`testes.visual.item${i}.story`)),
            priority: priorityLabel(tContent(`testes.visual.item${i}.priority`)),
          })),
        }}
      />
    </DocsPageLayout>
  );
}
