import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Editor, type EditorLabels, type EditorProps } from "@/components/ui/editor";
import {
  ADVANCED_CONTENT,
  BASIC_CONTENT,
  DO_DONT_CONTENT,
  LABELS,
  NOUN_LABELS,
  PLAYGROUND_CONTENT,
} from "@/components/ui/editor.fixtures";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import { useActiveSection } from "@/lib/use-active-section";
import { toPlainText } from "@/lib/strip-html";
import uiTranslations from "@/i18n/ui.json";
import editorTranslations from "@shared/content/editor/translations.json";

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

// ─── i18n ─────────────────────────────────────────────────────────────────────
//
// Sem overrides: o `translations.json` do editor descreve a API em nomenclatura
// neutra, e nesta stack os nomes coincidem — `content`, `editable`, `preset`,
// `labels`, `onChange`, `resolveImage`, `describeImage`.
//
// Os 38 RÓTULOS de ação não têm chave no conteúdo compartilhado (só os quatro
// controles da demonstração têm). Enquanto não tiverem, a página usa os mesmos
// rótulos das stories, e o único que troca de idioma é o nome acessível da área
// editável.

// ─── Helpers ──────────────────────────────────────────────────────────────────

const priorityKeyMap: Record<string, string> = {
  high: "common.high",
  medium: "common.medium",
  low: "common.low",
};

/** Chaves da tabela de propriedades, na ordem do contrato. */
const PROP_KEYS = [
  "content",
  "editable",
  "preset",
  "labels",
  "onChange",
  "resolveImage",
  "describeImage",
];

/** Chaves da tabela de tokens, agrupadas por assunto. */
const TOKEN_GROUPS: Array<{ titleKey: string; keys: string[] }> = [
  { titleKey: "tokens.surfaceTitle", keys: ["border", "background", "muted", "ring"] },
  {
    titleKey: "tokens.contentTitle",
    keys: ["foreground", "mutedForeground", "primary", "accent", "textH1"],
  },
];

/** Estados descritos pelo conteúdo compartilhado, na ordem em que ele os lista. */
const STATE_KEYS = [
  "editing",
  "readOnly",
  "imageSelected",
  "inTable",
  "fieldOpen",
  "invalidValue",
];

const INTERFACE_CODE = `// <Editor {...props} />
export type EditorProps = {
  content?: string;
  editable?: boolean;
  preset?: "basic" | "advanced";
  labels: EditorLabels;
  onChange?: (html: string) => void;
  resolveImage?: (file: File) => Promise<string | null>;
  describeImage?: (file: File | null, src: string) => Promise<string | null>;
  className?: string;
};`;

/** Chamada mostrada no card de cada conjunto. */
function presetSnippet(preset: "basic" | "advanced"): string {
  return `<Editor preset="${preset}" labels={labels} />`;
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

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

// ─── Componente principal ─────────────────────────────────────────────────────

export function EditorDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(editorTranslations);

  const navGroups = useMemo(() => getNavGroups(tNav), [tNav]);
  const allIds = useMemo(
    () => navGroups.flatMap((g) => g.sections.map((s) => s.id)),
    [navGroups],
  );

  const breadcrumb = useMemo(
    () => [
      { name: "Components", item: "/components" },
      { name: tContent("category"), item: "/components/form" },
      { name: tContent("title") },
    ],
    [tContent],
  );

  useSeoEffect({
    title: tContent("seo.title"),
    description: tContent("seo.description"),
    locale,
    componentSlug: "editor",
    aiSummary: tContent("seo.aiSummary"),
    aiEntities: tContent("seo.aiEntities"),
    breadcrumb,
  });

  useEffect(() => {
    track("docs_page_view", {
      component_name: "editor",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "editor",
        locale,
      });
    },
    [locale],
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  // ─── Estado da demonstração ───────────────────────────────────────────────
  //
  // Trocar de conjunto ou desligar a edição é opção de MONTAGEM da barra, e não
  // do documento: a instância continua a mesma, e o que muda é o que a barra
  // expõe. Remontar a cada clique apagaria o que a pessoa acabou de escrever.

  const [demoPreset, setDemoPreset] = useState<"basic" | "advanced">("advanced");
  const [demoEditable, setDemoEditable] = useState(true);

  /**
   * Editor de preview, com os rótulos das stories e o nome do campo traduzido.
   *
   * Toda instância desta página passa por aqui: são vários editores na mesma
   * página (demonstração, dois pares de Do & Don't, dois cards de conjunto), e
   * cada um precisa dos 38 rótulos para montar a barra.
   */
  const previewEditor = useCallback(
    (props: Omit<EditorProps, "labels" | "ref"> & { labels?: EditorLabels }) => {
      const base = props.labels ?? LABELS;
      return (
        <Editor
          {...props}
          className="nds-w-full"
          labels={{ ...base, editorField: tContent("demonstration.labels.content") }}
        />
      );
    },
    [tContent],
  );

  /** Um controle da demonstração. O evento sai do próprio botão. */
  const demoControl = (
    key: string,
    label: string,
    pressed: boolean,
    apply: () => void,
  ) => (
    <Button
      key={key}
      type="button"
      variant="outline"
      size="sm"
      aria-pressed={pressed}
      // O observer resolve por `.closest('[data-track]')`, e a terceira parte
      // do id estruturado vira `element_id`.
      data-track="demo"
      data-track-id={`editor:demonstracao:${key}`}
      data-track-label={label}
      onClick={apply}
    >
      {label}
    </Button>
  );

  return (
    <DocsPageLayout
      navGroups={navGroups}
      activeSection={activeId}
      componentSlug="editor"
      header={
        <DocsHeader
          title={tContent("title")}
          description={tContent("description")}
          category={tContent("category")}
          type={tContent("type")}
        />
      }
    >
      {/* ── Demonstração ────────────────────────────────────────────── */}
      <DocsDemonstration title={tContent("demonstration.title")} componentSlug="editor">
        <div className="nds-stack nds-w-full" data-spacing="md">
          <div
            className="nds-cluster"
            data-spacing="sm"
            role="group"
            aria-label={tContent("demonstration.title")}
          >
            {demoControl(
              "basic",
              tContent("demonstration.labels.basic"),
              demoPreset === "basic",
              () => setDemoPreset("basic"),
            )}
            {demoControl(
              "advanced",
              tContent("demonstration.labels.advanced"),
              demoPreset === "advanced",
              () => setDemoPreset("advanced"),
            )}
            {demoControl(
              "readOnly",
              tContent("demonstration.labels.readOnly"),
              !demoEditable,
              () => setDemoEditable((previous) => !previous),
            )}
          </div>
          <div className="nds-w-full">
            {previewEditor({
              content: PLAYGROUND_CONTENT,
              preset: demoPreset,
              editable: demoEditable,
            })}
          </div>
        </div>
      </DocsDemonstration>

      {/* ── Anatomia ────────────────────────────────────────────────── */}
      <DocsAnatomy
        title={tContent("anatomy.title")}
        items={[1, 2, 3, 4, 5, 6, 7].map((i) => tContent(`anatomy.item${i}`))}
        structureLabel={tContent("anatomy.structureLabel")}
        structureCode={tContent("anatomy.structureCode")}
      />

      {/* ── Quando Usar ─────────────────────────────────────────────── */}
      {/* O conteúdo compartilhado do editor traz `guidelines` como parágrafo e
          `scenarios` como frases soltas — sem título de bloco e sem rótulo de
          coluna. Os seis textos entram na mesma lista, na ordem em que o
          conteúdo os declara; inventar título aqui deixaria a página em
          português nos três idiomas. */}
      <DocsWhenToUse
        title={tContent("usage.title")}
        guidelines={{
          items: [
            tContent("usage.guidelines"),
            ...[1, 2, 3, 4].map((i) => tContent(`usage.scenarios.item${i}`)),
            tContent("usage.uxWriting"),
          ],
        }}
        do={{
          title: tNav("common.do"),
          items: [1, 2, 3, 4].map((i) => tContent(`usage.do.item${i}`)),
        }}
        dont={{
          title: tNav("common.dont"),
          items: [1, 2, 3, 4].map((i) => tContent(`usage.dont.item${i}`)),
        }}
      />

      {/* ── Do & Don't ──────────────────────────────────────────────── */}
      <DocsDoDont
        title={tContent("doDont.title")}
        pairs={[
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doCaption: toPlainText(tContent("doDont.pair1.do")),
            dontCaption: toPlainText(tContent("doDont.pair1.dont")),
            // Os dois editores são o MESMO conjunto e o MESMO conteúdo: só os
            // rótulos de "link" e "tabela" mudam, porque é deles que o par
            // fala. Trocar qualquer outra coisa daria à comparação uma segunda
            // variável.
            doPreview: previewEditor({
              content: BASIC_CONTENT,
              preset: "basic",
              labels: LABELS,
            }),
            dontPreview: previewEditor({
              content: BASIC_CONTENT,
              preset: "basic",
              labels: NOUN_LABELS,
            }),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doCaption: toPlainText(tContent("doDont.pair2.do")),
            dontCaption: toPlainText(tContent("doDont.pair2.dont")),
            doPreview: previewEditor({ content: DO_DONT_CONTENT, preset: "basic" }),
            dontPreview: previewEditor({ content: DO_DONT_CONTENT, preset: "advanced" }),
          },
        ]}
      />

      {/* ── Importação ──────────────────────────────────────────────── */}
      <DocsImport
        title={tContent("import.title")}
        componentSlug="editor"
        description={tContent("import.basic")}
        code={tContent("import.basicCode")}
        secondaryDescription={tContent("import.withStorage")}
        secondaryCode={tContent("import.withStorageCode")}
      />

      {/* ── Variantes ───────────────────────────────────────────────── */}
      <DocsVariants
        title={tContent("variants.title")}
        note={tContent("variants.note")}
        componentSlug="editor"
        items={(["basic", "advanced"] as const).map((key) => ({
          // O `name` é a chave ESTÁVEL, não traduzida: é ela que vira
          // `snippet_id` do `docs_code_copy`, e um nome traduzido partiria o
          // mesmo evento em três no GA4.
          name: tContent(`variants.items.${key}.name`),
          trackId: key,
          description: tContent(`variants.items.${key}.description`),
          code: presetSnippet(key),
          preview: previewEditor({
            content: key === "basic" ? BASIC_CONTENT : ADVANCED_CONTENT,
            preset: key,
          }),
        }))}
      />

      {/* ── Estados ─────────────────────────────────────────────────── */}
      {/* Duas colunas, e não três: o conteúdo compartilhado do editor declara
          só `state` e `description` em `states.cols`. */}
      <DocsStates
        title={tContent("states.title")}
        cols={{
          state: tContent("states.cols.state"),
          trigger: tContent("states.cols.description"),
        }}
        items={STATE_KEYS.map((key) => {
          const full = toPlainText(tContent(`states.${key}`));
          const dash = full.indexOf(" — ");
          return dash < 0
            ? { label: full, trigger: "" }
            : { label: full.slice(0, dash), trigger: full.slice(dash + 3) };
        })}
      />

      {/* ── Propriedades ────────────────────────────────────────────── */}
      <DocsProps
        title={tContent("props.title")}
        tables={[
          {
            cols: {
              prop: tContent("props.table.prop"),
              type: tContent("props.table.type"),
              default: tContent("props.table.default"),
              required: tContent("props.table.required"),
              description: tContent("props.table.description"),
            },
            items: PROP_KEYS.map((key) => ({
              name: tContent(`props.table.${key}.name`),
              type: tContent(`props.table.${key}.type`),
              defaultValue: tContent(`props.table.${key}.default`),
              required: tContent(`props.table.${key}.required`),
              description: toPlainText(tContent(`props.table.${key}.description`)),
            })),
          },
        ]}
        interfaceCode={INTERFACE_CODE}
        extensibilityTitle={tContent("props.extensibilityTitle")}
        extensibilityNotes={tContent("props.extensibility")}
        extensibilityCode={tContent("props.extensibilityCode")}
      />

      {/* ── Tokens ──────────────────────────────────────────────────── */}
      <DocsTokens
        title={tContent("tokens.title")}
        cols={{
          token: tContent("tokens.table.token"),
          value: tContent("tokens.surfaceTitle"),
          description: tContent("tokens.table.usage"),
        }}
        items={TOKEN_GROUPS.flatMap((group) =>
          group.keys.map((key) => ({
            token: tContent(`tokens.table.${key}.name`),
            value: tContent(group.titleKey),
            description: tContent(`tokens.table.${key}.usage`),
          })),
        )}
        customizationTitle={tContent("tokens.customizationTitle")}
        customizationCode={tContent("tokens.customizationCode")}
      />

      {/* ── Acessibilidade ──────────────────────────────────────────── */}
      <DocsAccessibility
        title={tContent("accessibility.title")}
        summary={tContent("accessibility.summary")}
        items={[1, 2, 3, 4, 5, 6, 7].map((i) => tContent(`accessibility.item${i}`))}
        keyboardTitle={tContent("accessibility.keyboardTitle")}
        keyboardItems={["tab", "arrows", "homeEnd", "enter", "escape"].map((key) => ({
          key: tContent(`accessibility.keyboard.${key}.key`),
          description: tContent(`accessibility.keyboard.${key}.action`),
        }))}
      />

      {/* ── Relacionados ────────────────────────────────────────────── */}
      <DocsRelated
        title={tContent("related.title")}
        componentSlug="editor"
        items={[
          {
            name: "Textarea",
            description: toPlainText(tContent("related.textarea")),
            path: "?path=/docs/ui-textarea--docs",
          },
          {
            name: "CodeBlock",
            description: toPlainText(tContent("related.codeBlock")),
            path: "?path=/docs/ui-codeblock--docs",
          },
          {
            name: "ToggleGroup",
            description: toPlainText(tContent("related.toggleGroup")),
            path: "?path=/docs/ui-togglegroup--docs",
          },
          {
            name: "Button",
            description: toPlainText(tContent("related.button")),
            path: "?path=/docs/ui-button--docs",
          },
        ]}
      />

      {/* ── Notas ───────────────────────────────────────────────────── */}
      <DocsNotes
        title={tContent("notes.title")}
        componentSlug="editor"
        items={[1, 2, 3, 4, 5, 6].map((i) => ({
          title: "",
          content: tContent(`notes.tip${i}`),
        }))}
      />

      {/* ── Analytics ───────────────────────────────────────────────── */}
      <DocsAnalytics
        title={tContent("analytics.title")}
        cols={{
          event: tContent("analytics.table.event"),
          trigger: toPlainText(tContent("analytics.table.trigger")),
          payload: tContent("analytics.table.payload"),
        }}
        items={["pageView", "sectionViewed", "demoClick"].map((key) => ({
          event: tContent(`analytics.table.${key}`),
          trigger: toPlainText(tContent(`analytics.table.${key}Trigger`)),
          payload: tContent(`analytics.table.${key}Payload`),
        }))}
      />

      {/* ── Testes ──────────────────────────────────────────────────── */}
      {/* As três sub-seções do conteúdo do editor usam a MESMA forma
          (`action`/`result`/`priority`). Os containers de acessibilidade e de
          visual foram desenhados para outra: aqui cada campo entra no lugar que
          o preserva, sem descartar texto. */}
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
            priority: tNav(
              priorityKeyMap[tContent(`testes.functional.item${i}.priority`)] ?? "common.high",
            ),
          })),
        }}
        accessibility={{
          title: tContent("testes.accessibility.title"),
          description: tContent("testes.accessibility.description"),
          cols: {
            criterion: tNav("common.userAction"),
            level: tNav("common.priority"),
            how: tNav("common.expectedResult"),
          },
          items: [1, 2, 3, 4, 5].map((i) => ({
            criterion: toPlainText(tContent(`testes.accessibility.item${i}.action`)),
            level: tNav(
              priorityKeyMap[tContent(`testes.accessibility.item${i}.priority`)] ?? "common.high",
            ),
            how: toPlainText(tContent(`testes.accessibility.item${i}.result`)),
          })),
        }}
        visual={{
          title: tContent("testes.visual.title"),
          description: tContent("testes.visual.description"),
          cols: {
            story: tNav("common.storyState"),
            priority: tNav("common.priority"),
          },
          items: [1, 2, 3].map((i) => ({
            story: `${toPlainText(tContent(`testes.visual.item${i}.action`))} — ${toPlainText(
              tContent(`testes.visual.item${i}.result`),
            )}`,
            priority: tNav(
              priorityKeyMap[tContent(`testes.visual.item${i}.priority`)] ?? "common.high",
            ),
          })),
        }}
      />
    </DocsPageLayout>
  );
}
