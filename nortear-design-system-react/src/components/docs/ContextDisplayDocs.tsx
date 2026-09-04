import { Fragment, useCallback, useEffect, useMemo, type ReactNode } from "react";
import {
  ContextDisplay,
  CONTEXT_DISPLAY_FORMS,
  type ContextDisplayForm,
  type ContextDisplayLabels,
} from "@/components/ui/context-display";
import { Separator } from "@/components/ui/separator";
import {
  useContextDisplayLabels,
  usageOf,
  type ContextDisplayCase,
} from "@/components/ui/context-display.fixtures";
import { BUDGET_LEVELS, type BudgetLevel } from "@shared/primitives/token-budget";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import { useActiveSection } from "@/lib/use-active-section";
import uiTranslations from "@/i18n/ui.json";
import contextTranslations from "@shared/content/context-display/translations.json";

import { DocsHeader }        from "@/components/docs/shared/sections/DocsHeader";
import { DocsPageLayout }    from "@/components/docs/shared/sections/DocsPageLayout";
import { DocsDemonstration } from "@/components/docs/shared/sections/DocsDemonstration";
import { DocsAnatomy }       from "@/components/docs/shared/sections/DocsAnatomy";
import { DocsWhenToUse }     from "@/components/docs/shared/sections/DocsWhenToUse";
import { DocsDoDont }        from "@/components/docs/shared/sections/DocsDoDont";
import { DocsImport }        from "@/components/docs/shared/sections/DocsImport";
import { DocsVariants }      from "@/components/docs/shared/sections/DocsVariants";
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

const SLUG = "context-display";

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

const INTERFACE_CODE = `export interface ContextDisplayLabels {
  title: string;                        // o nome da medida, fora da tela
  level: Record<BudgetLevel, string>;   // a palavra de cada nível
  of: string;                           // liga o consumido ao teto
  unit: string;                         // o que está sendo contado
  unbounded: string;                    // o que dizer sem teto conhecido
}

// O dado vem de \`@shared/primitives/chat-protocol\`. O total é FUNÇÃO, e nunca
// campo: total guardado pode discordar da soma.
interface TokenUsage {
  input: number;
  output: number;
  limit?: number;   // sem ele não há fração, só contagem
}

// A conta vem de \`@shared/primitives/token-budget\`, e o nível com ela:
type BudgetLevel = 'normal' | 'warning' | 'critical';

// A forma é escolha de espaço, e não de significado.
export type ContextDisplayForm = 'ring' | 'bar' | 'text';`;

// ─── Componente principal ─────────────────────────────────────────────────────

export function ContextDisplayDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(contextTranslations);

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria.
  // O `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
  const screenReaderItems = useMemo(
    () =>
      Object.entries(
        (contextTranslations as unknown as Record<
          string,
          { accessibility?: { screenReader?: Record<string, string> } }
        >)[locale]?.accessibility?.screenReader ?? {},
      )
        .filter(([key]) => key !== "title")
        .map(([, value]) => value),
    [locale],
  );

  // O hook, e não a função pura: é ele que subscreve a loja e faz os blocos
  // desta página se redesenharem quando o idioma muda. A função pura serve à
  // `play`, onde não há componente para pendurar um hook.
  const labels = useContextDisplayLabels();

  const navGroups = useMemo(() => getNavGroups(tNav), [tNav]);
  const allIds = useMemo(
    () => navGroups.flatMap((g) => g.sections.map((s) => s.id)),
    [navGroups],
  );

  useSeoEffect({
    title: tContent("seo.title"),
    description: tContent("seo.description"),
    locale,
    componentSlug: SLUG,
  });

  useEffect(() => {
    track("docs_page_view", {
      component_name: SLUG,
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: SLUG,
        locale,
      });
    },
    [locale],
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  const priorityLabel = (raw: string) => tNav(priorityKeyMap[raw] ?? "common.high");

  /** Um bloco de medição, sem repetir os rótulos em cada chamada. */
  const block = (
    name: ContextDisplayCase,
    form: ContextDisplayForm = "ring",
    custom: ContextDisplayLabels = labels,
  ) => <ContextDisplay usage={usageOf(name)} form={form} labels={custom} />;

  /** Uma pilha de medições, para o par do certo e do errado. */
  const stackOf = (...blocks: ReactNode[]) => (
    <div className="nds-stack nds-w-full" data-spacing="sm">
      {blocks.map((el, i) => (
        <Fragment key={i}>{el}</Fragment>
      ))}
    </div>
  );

  /**
   * Uma medição, rotulada.
   *
   * A legenda diz QUAL caso está desenhado — sem ela, quatro blocos empilhados
   * viram um só, e o assunto da demonstração é justamente a diferença entre
   * eles.
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
    example("demonstration.labels.ring",      block("warning", "ring")),
    example("demonstration.labels.bar",       block("warning", "bar")),
    example("demonstration.labels.text",      block("warning", "text")),
    example("demonstration.labels.unbounded", block("unbounded")),
  ];

  // O contraexemplo do primeiro par: as palavras apagadas, e a diferença entre a
  // janela com folga e a janela no limite passa a existir só na cor do anel.
  const mute: ContextDisplayLabels = {
    ...labels,
    level: BUDGET_LEVELS.reduce((acc, entry) => {
      acc[entry] = "";
      return acc;
    }, {} as Record<BudgetLevel, string>),
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
      <DocsDemonstration title={tContent("demonstration.title")} componentSlug={SLUG}>
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
          items: ["name", "level", "unit", "unbounded"].map((k) => ({
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
            // O par é o MESMO par de níveis: o que muda é se a palavra chega a
            // quem não vê a cor do medidor.
            doPreview: stackOf(block("normal"), block("critical")),
            dontPreview: stackOf(
              block("normal", "ring", mute),
              block("critical", "ring", mute),
            ),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doCaption: toPlainText(tContent("doDont.pair2.do")),
            dontCaption: toPlainText(tContent("doDont.pair2.dont")),
            doPreview: stackOf(block("unbounded")),
            // O contraexemplo: a MESMA medição sem teto, desenhada como se o
            // teto fosse conhecido e nada tivesse sido gasto. É o que sai de
            // tratar a ausência de teto como um zero — um anel vazio e "0%",
            // que é o oposto de "não se sabe quanto cabe".
            dontPreview: stackOf(
              <ContextDisplay usage={{ input: 0, output: 0, limit: 32_000 }} labels={labels} />,
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

      {/* ── Formas ────────────────────────────────────────────────── */}
      <DocsVariants
        title={tContent("variants.title")}
        note={stripHtml(tContent("variants.note"))}
        componentSlug={SLUG}
        // A ordem sai de `CONTEXT_DISPLAY_FORMS`: a seção e a story de formas
        // leem a mesma lista, e nenhuma das duas fica para trás quando o tipo
        // cresce.
        items={CONTEXT_DISPLAY_FORMS.map((form) => ({
          name: form,
          description: stripHtml(tContent(`variants.items.${form}.description`)),
          code: tContent(`variants.items.${form}.variantCode`),
          preview: block("warning", form),
        }))}
      />

      {/* ── Estados ───────────────────────────────────────────────── */}
      <DocsStates
        title={tContent("states.title")}
        cols={{
          state: tContent("states.cols.state"),
          trigger: tContent("states.cols.trigger"),
          behavior: tContent("states.cols.behavior"),
        }}
        // Os três níveis saem do primitivo compartilhado; os dois últimos são
        // casos que o nível não modela — passar do teto e não ter teto.
        items={[...BUDGET_LEVELS, "over", "unbounded"].map((k) => ({
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
            title: "ContextDisplay",
            cols: propsCols,
            items: ["usage", "form", "labels"].map((k) => ({
              name: tContent(`props.table.${k}.name`),
              type: tContent(`props.table.${k}.type`),
              defaultValue: tContent(`props.table.${k}.default`),
              required: tContent(`props.table.${k}.required`),
              description: toPlainText(tContent(`props.table.${k}.description`)),
            })),
          },
          {
            title: "ContextDisplayLabels",
            cols: propsCols,
            items: [
              "labelsTitle", "labelsLevel", "labelsOf", "labelsUnit", "labelsUnbounded",
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
          "textLabel", "mutedForeground", "foreground", "fontWeightMedium",
          "primary", "warning", "destructive", "muted",
          "sizeXs", "spacing2", "radiusFull",
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
        // Uma linha só, e é honesto: não há controle nesta peça. Listar Enter e
        // setas para dizer que não fazem nada seria encher a tabela com
        // ausências.
        keyboardItems={[
          { key: "Tab", description: tContent("accessibility.keyboard.tab") },
        ]}
        screenReaderTitle={tContent("accessibility.screenReader.title")}
        screenReaderItems={screenReaderItems}
      />

      {/* ── Relacionados ──────────────────────────────────────────── */}
      <DocsRelated
        title={tContent("related.title")}
        items={[
          { name: tContent("related.items.agentStatus.name"), description: toPlainText(tContent("related.items.agentStatus.description")), path: "?path=/docs/components-conversational-agentstatus--docs" },
          { name: tContent("related.items.chatThread.name"),  description: toPlainText(tContent("related.items.chatThread.description")),  path: "?path=/docs/components-conversational-chatthread--docs"  },
          { name: tContent("related.items.progress.name"),    description: toPlainText(tContent("related.items.progress.description")),    path: "?path=/docs/components-feedback-progress--docs"           },
          { name: tContent("related.items.badge.name"),       description: toPlainText(tContent("related.items.badge.description")),       path: "?path=/docs/components-feedback-badge--docs"              },
        ]}
      />

      {/* ── Notas ─────────────────────────────────────────────────── */}
      <DocsNotes
        title={tContent("notes.title")}
        componentSlug={SLUG}
        items={[1, 2, 3, 4, 5, 6].map((i) => ({ title: "", content: tContent(`notes.item${i}`) }))}
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
          items: [1, 2, 3, 4, 5, 6, 7, 8].map((i) => ({
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
          items: [1, 2, 3, 4, 5, 6].map((i) => ({
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
          items: [1, 2, 3, 4, 5, 6].map((i) => ({
            story: toPlainText(tContent(`testes.visual.item${i}.story`)),
            priority: priorityLabel(tContent(`testes.visual.item${i}.priority`)),
          })),
        }}
      />
    </DocsPageLayout>
  );
}
