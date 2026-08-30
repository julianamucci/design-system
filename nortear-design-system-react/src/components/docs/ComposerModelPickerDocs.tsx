import { Fragment, useCallback, useEffect, useMemo, type ReactNode } from "react";
import { Composer } from "@/components/ui/composer";
import { Separator } from "@/components/ui/separator";
import { useComposerLabels } from "@/components/ui/composer.fixtures";
import { ComposerModelPicker } from "@/components/ui/composer-model-picker";
import {
  availableModels,
  everyModel,
  useModelLabels,
} from "@/components/ui/composer-model-picker.fixtures";
import type { ModelOption } from "@shared/primitives/chat-protocol";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import { useActiveSection } from "@/lib/use-active-section";
import uiTranslations from "@/i18n/ui.json";
import pickerTranslations from "@shared/content/composer-model-picker/translations.json";

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
 * O contraexemplo do primeiro par: o impedimento sem o motivo.
 *
 * A opção continua apagada, e a pergunta "por que não posso?" fica sem
 * resposta na tela.
 */
function withoutReason(): ModelOption[] {
  return everyModel().map((model) =>
    model.unavailable
      ? { id: model.id, label: model.label, description: model.description, unavailable: true }
      : model,
  );
}

/**
 * O contraexemplo do segundo par: a descrição empurrada para dentro do nome.
 *
 * É como um gatilho que "leva a descrição" de fato acontece — não há prop para
 * isso, o que há é alguém escrevendo a frase inteira no nome. E o campo encolhe.
 */
function nameCarryingDescription(): ModelOption[] {
  return everyModel().map((model) => ({
    ...model,
    label: model.description ? `${model.label} — ${model.description}` : model.label,
  }));
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
];

const INTERFACE_CODE = `export interface ComposerModelPickerLabels {
  trigger: string;   // \`{label}\` vira o nome do modelo escolhido
  list: string;      // o nome acessível da lista
}

// O modelo vem de \`@shared/primitives/chat-protocol\`:
export interface ModelOption {
  id: string;
  label: string;
  description?: string;         // aparece na lista, e não no gatilho
  badge?: string;               // reforço; nunca a única portadora
  unavailable?: boolean;
  unavailableReason?: string;   // obrigatório quando indisponível
}`;

// ─── Componente principal ─────────────────────────────────────────────────────

export function ComposerModelPickerDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(pickerTranslations);
  const composerLabels = useComposerLabels();
  const pickerLabels = useModelLabels();

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria.
  // O `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
  const screenReaderItems = useMemo(
    () =>
      Object.entries(
        (pickerTranslations as unknown as Record<
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
    componentSlug: "composer-model-picker",
  });

  useEffect(() => {
    track("docs_page_view", {
      component_name: "composer-model-picker",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "composer-model-picker",
        locale,
      });
    },
    [locale],
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  const priorityLabel = (raw: string) => tNav(priorityKeyMap[raw] ?? "common.high");

  /** O seletor sozinho, do jeito que ele vive no trilho. */
  const picker = (models: ModelOption[], open: boolean, value?: string) => (
    <ComposerModelPicker labels={pickerLabels} models={models} value={value} open={open} />
  );

  /** O seletor dentro do campo — o lugar de onde ele saiu. */
  const inField = (models: ModelOption[], open: boolean) => (
    <Composer labels={composerLabels} railStart={picker(models, open, "fast")} />
  );

  /**
   * Um exemplo rotulado, com a LEGENDA EMBAIXO.
   *
   * É a única divergência de forma em relação às outras docs pages, e ela sai
   * do desenho: a lista abre PARA CIMA, e uma legenda acima do seletor seria a
   * primeira coisa que a lista cobriria. O recuo no topo reserva o espaço que a
   * lista ocupa, que de outro modo não entraria no fluxo — ela é absoluta.
   */
  const example = (labelKey: string, node: ReactNode) => (
    <div className="nds-stack nds-w-full nds-pt-8" data-spacing="xs">
      {node}
      <p className="nds-text-caption nds-text-muted-foreground">
        {stripHtml(tContent(labelKey))}
      </p>
    </div>
  );

  const examples = [
    example("demonstration.labels.closed", picker(everyModel(), false, "balanced")),
    example("demonstration.labels.open", picker(availableModels(), true)),
    example("demonstration.labels.unavailable", picker(everyModel(), true, "fast")),
    example("demonstration.labels.withField", inField(everyModel(), false)),
  ];

  const propCols = {
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
        componentSlug="composer-model-picker"
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
          items: ["trigger", "modelName", "description", "badge", "reason"].map((k) => ({
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
            // O par é a MESMA lista: o que muda é se a opção apagada explica
            // por que está apagada.
            doPreview: picker(everyModel(), true, "fast"),
            dontPreview: picker(withoutReason(), true, "fast"),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doCaption: toPlainText(tContent("doDont.pair2.do")),
            dontCaption: toPlainText(tContent("doDont.pair2.dont")),
            doPreview: inField(everyModel(), false),
            dontPreview: inField(nameCarryingDescription(), false),
          },
        ]}
      />

      {/* ── Importação ────────────────────────────────────────────── */}
      <DocsImport
        title={tContent("import.title")}
        description={tContent("import.basic")}
        code={tContent("import.basicCode")}
        secondaryDescription={tContent("import.withUnavailable")}
        secondaryCode={tContent("import.withUnavailableCode")}
      />

      {/* ── Estados ───────────────────────────────────────────────── */}
      <DocsStates
        title={tContent("states.title")}
        cols={{
          state: tContent("states.cols.state"),
          trigger: tContent("states.cols.trigger"),
          behavior: tContent("states.cols.behavior"),
        }}
        items={["closed", "open", "selected", "unavailable"].map((k) => ({
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
            title: "ComposerModelPicker",
            cols: propCols,
            items: ["models", "labels", "value", "onValueChange", "open", "onOpenChange"].map(
              (k) => ({
                name: tContent(`props.table.${k}.name`),
                type: tContent(`props.table.${k}.type`),
                defaultValue: tContent(`props.table.${k}.default`),
                required: tContent(`props.table.${k}.required`),
                description: toPlainText(tContent(`props.table.${k}.description`)),
              }),
            ),
          },
          {
            title: "ModelOption",
            cols: propCols,
            items: [
              "id",
              "modelLabel",
              "modelDescription",
              "badge",
              "unavailable",
              "unavailableReason",
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
          "popover", "border", "elevationMd", "zPopover", "accent",
          "radiusSm", "spacing6", "textP", "mutedForeground",
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
          { key: "Esc",   description: tContent("accessibility.keyboard.escape") },
        ]}
        screenReaderTitle={tContent("accessibility.screenReader.title")}
        screenReaderItems={screenReaderItems}
      />

      {/* ── Relacionados ──────────────────────────────────────────── */}
      <DocsRelated
        title={tContent("related.title")}
        items={[
          { name: tContent("related.items.composer.name"),               description: toPlainText(tContent("related.items.composer.description")),               path: "?path=/docs/primitives-conversational-composer--docs" },
          { name: tContent("related.items.composerTriggerPopover.name"), description: toPlainText(tContent("related.items.composerTriggerPopover.description")), path: "?path=/docs/primitives-conversational-composertriggerpopover--docs" },
          { name: tContent("related.items.select.name"),                 description: toPlainText(tContent("related.items.select.description")),                 path: "?path=/docs/primitives-form-select--docs" },
          { name: tContent("related.items.badge.name"),                  description: toPlainText(tContent("related.items.badge.description")),                  path: "?path=/docs/primitives-feedback-badge--docs" },
        ]}
      />

      {/* ── Notas ─────────────────────────────────────────────────── */}
      <DocsNotes
        title={tContent("notes.title")}
        componentSlug="composer-model-picker"
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
