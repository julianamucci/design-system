import { useCallback, useEffect, useMemo, useState } from "react";
import { Bold, Italic, Underline, List, Eye } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import { useActiveSection } from "@/lib/use-active-section";
import uiTranslations from "@/i18n/ui.json";
import toggleTranslations from "@shared/content/toggle/translations.json";

import { DocsHeader }        from "@/components/docs/shared/sections/DocsHeader";
import { DocsPageLayout }    from "@/components/docs/shared/sections/DocsPageLayout";
import { DocsDemonstration } from "@/components/docs/shared/sections/DocsDemonstration";
import { DocsAnatomy }       from "@/components/docs/shared/sections/DocsAnatomy";
import { DocsWhenToUse }     from "@/components/docs/shared/sections/DocsWhenToUse";
import { DocsDoDont }        from "@/components/docs/shared/sections/DocsDoDont";
import { DocsImport }        from "@/components/docs/shared/sections/DocsImport";
import { DocsVariants }      from "@/components/docs/shared/sections/DocsVariants";
import { DocsCompositions } from "@/components/docs/shared/sections/DocsCompositions";
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

export function ToggleDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(toggleTranslations);

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
    componentSlug: "toggle",
    aiSummary: tContent("seo.aiSummary"),
    aiEntities: tContent("seo.aiEntities"),
    aiIntent: tContent("seo.aiIntent") as "informational" | "navigational",
    breadcrumb,
  });

  useEffect(() => {
    track("docs_page_view", {
      component_name: "toggle",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "toggle",
        locale,
      });
    },
    [locale],
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  // ─── Estados controlados para o demo ────────────────────────────────────────

  const [demoBold, setDemoBold] = useState(false);
  const [demoItalic, setDemoItalic] = useState(true);
  const [demoUnderline, setDemoUnderline] = useState(false);
  const [demoShowHidden, setDemoShowHidden] = useState(false);
  const [demoCompact, setDemoCompact] = useState(false);

  // ─── Code strings ───────────────────────────────────────────────────────────

  const codeImportBasic = `import { Toggle } from "@/components/ui/toggle";`;
  const codeImportWithIcon = `import { Toggle } from "@/components/ui/toggle";
import { Bold } from "lucide-react";`;

  const codeDefault = `<Toggle aria-label="Negrito">
  <Bold aria-hidden="true" />
</Toggle>`;

  const codeOutline = `<Toggle variant="outline" aria-label="Itálico">
  <Italic aria-hidden="true" />
</Toggle>`;

  const codeWithLabel = `<Toggle aria-label="Mostrar ocultos">
  <Eye aria-hidden="true" />
  Mostrar ocultos
</Toggle>`;

  const codeCustomizationTokens = `/* Em globals.css — tokens do Toggle */
:root {
  --muted: 210 40% 96%;
  --foreground: 222 47% 11%;
  --input: 214 32% 91%;
  --ring: 222 47% 11%;
  --destructive: 0 72% 51%;
  --radius-button: 0.5rem;
}

.dark {
  --muted: 217 33% 17%;
  --foreground: 210 40% 98%;
  --input: 217 33% 17%;
}`;

  const interfaceCode = `function Toggle({
  className,
  variant = "default",
  size = "default",
  ...props
}: TogglePrimitive.Props & VariantProps<typeof toggleVariants>) {
  // Estende TogglePrimitive.Props do @base-ui/react/toggle
  // Props principais:
  // pressed?: boolean
  // defaultPressed?: boolean
  // onPressedChange?: (pressed: boolean) => void
  // disabled?: boolean
  // variant?: "default" | "outline"
  // size?: "default" | "sm" | "lg"
  // aria-label?: string  // OBRIGATÓRIO em icon-only
}`;

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
          installNote="npx shadcn@latest add toggle"
        />
      }
    >
      {/* ── Demonstração ──────────────────────────────────────────── */}
      <DocsDemonstration title={tContent("demonstration.title")}>
        <div className="w-full max-w-md flex flex-col gap-5">
          <div className="flex items-center gap-1 rounded-lg border p-1 w-fit">
            <Toggle
              pressed={demoBold}
              onPressedChange={setDemoBold}
              aria-label={tContent("demonstration.labels.bold")}
            >
              <Bold aria-hidden="true" />
            </Toggle>
            <Toggle
              pressed={demoItalic}
              onPressedChange={setDemoItalic}
              aria-label={tContent("demonstration.labels.italic")}
            >
              <Italic aria-hidden="true" />
            </Toggle>
            <Toggle
              pressed={demoUnderline}
              onPressedChange={setDemoUnderline}
              aria-label={tContent("demonstration.labels.underline")}
            >
              <Underline aria-hidden="true" />
            </Toggle>
            <Toggle aria-label={tContent("demonstration.labels.list")}>
              <List aria-hidden="true" />
            </Toggle>
          </div>

          <Toggle
            variant="outline"
            pressed={demoShowHidden}
            onPressedChange={setDemoShowHidden}
            aria-label={tContent("demonstration.labels.showHidden")}
            className="w-fit"
          >
            <Eye aria-hidden="true" />
            {tContent("demonstration.labels.showHidden")}
          </Toggle>

          <div className="flex items-center gap-3">
            <Toggle
              size="sm"
              pressed={demoCompact}
              onPressedChange={setDemoCompact}
              aria-label={`${tContent("demonstration.labels.compactView")} (sm)`}
            >
              <Bold aria-hidden="true" />
            </Toggle>
            <Toggle
              size="default"
              aria-label={`${tContent("demonstration.labels.compactView")} (default)`}
            >
              <Bold aria-hidden="true" />
            </Toggle>
            <Toggle
              size="lg"
              aria-label={`${tContent("demonstration.labels.compactView")} (lg)`}
            >
              <Bold aria-hidden="true" />
            </Toggle>
          </div>
        </div>
      </DocsDemonstration>

      {/* ── Anatomia ──────────────────────────────────────────────── */}
      <DocsAnatomy
        title={tContent("anatomy.title")}
        items={[
          tContent("anatomy.item1"),
          tContent("anatomy.item2"),
          tContent("anatomy.item3"),
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
            element: tContent("usage.uxWriting.table.element"),
            rules: tContent("usage.uxWriting.table.rules"),
            do: tContent("usage.uxWriting.table.correct"),
            dont: tContent("usage.uxWriting.table.avoid"),
          },
          items: [
            {
              element: tContent("usage.uxWriting.table.ariaLabel.name"),
              rules: tContent("usage.uxWriting.table.ariaLabel.format"),
              do: tContent("usage.uxWriting.table.ariaLabel.good"),
              dont: tContent("usage.uxWriting.table.ariaLabel.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.label.name"),
              rules: tContent("usage.uxWriting.table.label.format"),
              do: tContent("usage.uxWriting.table.label.good"),
              dont: tContent("usage.uxWriting.table.label.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.icon.name"),
              rules: tContent("usage.uxWriting.table.icon.format"),
              do: tContent("usage.uxWriting.table.icon.good"),
              dont: tContent("usage.uxWriting.table.icon.bad"),
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
            tContent("usage.dont.item4"),
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
              <Toggle aria-label="Negrito" defaultPressed>
                <Bold aria-hidden="true" />
              </Toggle>
            ),
            dontPreview: (
              <Toggle aria-label="B" defaultPressed>
                <Bold aria-hidden="true" />
              </Toggle>
            ),
            doCaption: tContent("doDont.pair1.do"),
            dontCaption: tContent("doDont.pair1.dont"),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <div className="flex items-center gap-1 rounded-lg border p-1">
                <Toggle aria-label="Negrito">
                  <Bold aria-hidden="true" />
                </Toggle>
                <Toggle aria-label="Itálico">
                  <Italic aria-hidden="true" />
                </Toggle>
                <Toggle aria-label="Sublinhado">
                  <Underline aria-hidden="true" />
                </Toggle>
              </div>
            ),
            dontPreview: (
              <div className="flex items-center gap-3">
                <Toggle aria-label="Negrito">
                  <Bold aria-hidden="true" />
                </Toggle>
                <Toggle aria-label="Itálico">
                  <Italic aria-hidden="true" />
                </Toggle>
                <Toggle aria-label="Sublinhado">
                  <Underline aria-hidden="true" />
                </Toggle>
              </div>
            ),
            doCaption: tContent("doDont.pair2.do"),
            dontCaption: tContent("doDont.pair2.dont"),
          },
        ]}
      />

      {/* ── Importação ────────────────────────────────────────────── */}
      <DocsImport
        title={tContent("import.title")}
        code={codeImportBasic}
        secondaryCode={codeImportWithIcon}
      />

      {/* ── Variantes ─────────────────────────────────────────────── */}
      <DocsVariants
        title={tContent("variants.title")}
        items={[
          {
            name: tContent("variants.items.default"),
            description: stripHtml(tContent("variants.styles.default")),
            code: codeDefault,
            preview: (
              <Toggle aria-label="Negrito">
                <Bold aria-hidden="true" />
              </Toggle>
            ),
          },
          {
            name: tContent("variants.items.outline"),
            description: stripHtml(tContent("variants.styles.outline")),
            code: codeOutline,
            preview: (
              <Toggle variant="outline" aria-label="Itálico">
                <Italic aria-hidden="true" />
              </Toggle>
            ),
          },
          {
            name: tContent("variants.items.withLabel"),
            description: stripHtml(tContent("variants.styles.withLabel")),
            code: codeWithLabel,
            preview: (
              <Toggle aria-label="Mostrar ocultos">
                <Eye aria-hidden="true" />
                Mostrar ocultos
              </Toggle>
            ),
          },
        ]}
      />

      {/* ── Composições ───────────────────────────────────────────── */}
      <DocsCompositions
        title={tContent("variants.compositionsTitle")}
        useWhenLabel={tNav("common.useWhen")}
        componentSlug="toggle"
        items={[
          {
            name: tContent("variants.compositions.toolbar.name"),
            description: tContent("variants.compositions.toolbar.description"),
            useWhen: tContent("variants.compositions.toolbar.use"),
            code: `<div role="group" aria-label="Formatação de texto" className="flex items-center gap-1 rounded-md border border-input p-1">
  <Toggle aria-label="Negrito" defaultPressed>
    <Bold className="h-4 w-4" />
  </Toggle>
  <Toggle aria-label="Itálico">
    <Italic className="h-4 w-4" />
  </Toggle>
  <Toggle aria-label="Sublinhado">
    <Underline className="h-4 w-4" />
  </Toggle>
</div>`,
            preview: (
              <div role="group" aria-label="Formatação de texto" className="flex items-center gap-1 rounded-md border border-input p-1">
                <Toggle aria-label="Negrito" defaultPressed>
                  <Bold className="h-4 w-4" />
                </Toggle>
                <Toggle aria-label="Itálico">
                  <Italic className="h-4 w-4" />
                </Toggle>
                <Toggle aria-label="Sublinhado">
                  <Underline className="h-4 w-4" />
                </Toggle>
              </div>
            ),
          },
          {
            name: tContent("variants.compositions.filterWithLabel.name"),
            description: tContent("variants.compositions.filterWithLabel.description"),
            useWhen: tContent("variants.compositions.filterWithLabel.use"),
            code: `<Toggle variant="outline">
  <Eye className="h-4 w-4" />
  Mostrar ocultos
</Toggle>`,
            preview: (
              <Toggle variant="outline">
                <Eye className="h-4 w-4" />
                Mostrar ocultos
              </Toggle>
            ),
          },
          {
            name: tContent("variants.compositions.sizes.name"),
            description: tContent("variants.compositions.sizes.description"),
            useWhen: tContent("variants.compositions.sizes.use"),
            code: `<div className="flex items-center gap-3">
  <Toggle variant="outline" size="sm" aria-label="Negrito (sm)">
    <Bold className="h-4 w-4" />
  </Toggle>
  <Toggle variant="outline" size="default" aria-label="Negrito (default)">
    <Bold className="h-4 w-4" />
  </Toggle>
  <Toggle variant="outline" size="lg" aria-label="Negrito (lg)">
    <Bold className="h-4 w-4" />
  </Toggle>
</div>`,
            preview: (
              <div className="flex items-center gap-3">
                <Toggle variant="outline" size="sm" aria-label="Negrito (sm)">
                  <Bold className="h-4 w-4" />
                </Toggle>
                <Toggle variant="outline" size="default" aria-label="Negrito (default)">
                  <Bold className="h-4 w-4" />
                </Toggle>
                <Toggle variant="outline" size="lg" aria-label="Negrito (lg)">
                  <Bold className="h-4 w-4" />
                </Toggle>
              </div>
            ),
          },
          {
            name: tContent("variants.compositions.filterList.name"),
            description: tContent("variants.compositions.filterList.description"),
            useWhen: tContent("variants.compositions.filterList.use"),
            code: `<div className="flex flex-col gap-2 w-72">
  <p className="text-sm font-semibold mb-1">Filtros de exibição</p>
  <div className="flex flex-wrap gap-2">
    <Toggle variant="outline">
      <Eye className="h-4 w-4" />
      Mostrar ocultos
    </Toggle>
    <Toggle variant="outline" defaultPressed>
      <List className="h-4 w-4" />
      Visão compacta
    </Toggle>
  </div>
</div>`,
            preview: (
              <div className="flex flex-col gap-2 w-72">
                <p className="text-sm font-semibold mb-1">Filtros de exibição</p>
                <div className="flex flex-wrap gap-2">
                  <Toggle variant="outline">
                    <Eye className="h-4 w-4" />
                    Mostrar ocultos
                  </Toggle>
                  <Toggle variant="outline" defaultPressed>
                    <List className="h-4 w-4" />
                    Visão compacta
                  </Toggle>
                </div>
              </div>
            ),
          },
        ]}
      />

      {/* ── Estados ───────────────────────────────────────────────── */}
      <DocsStates
        title={tContent("states.title")}
        cols={{
          state: tContent("states.title"),
          trigger: tNav("common.userAction"),
          behavior: tNav("common.expectedResult"),
        }}
        items={[
          {
            label: tContent("states.items.off"),
            trigger: "—",
            behavior: stripHtml(tContent("states.descriptions.off")),
          },
          {
            label: tContent("states.items.on"),
            trigger: "click / Space / Enter",
            behavior: stripHtml(tContent("states.descriptions.on")),
          },
          {
            label: tContent("states.items.hover"),
            trigger: "pointer over",
            behavior: stripHtml(tContent("states.descriptions.hover")),
          },
          {
            label: tContent("states.items.focus"),
            trigger: "Tab",
            behavior: stripHtml(tContent("states.descriptions.focus")),
          },
          {
            label: tContent("states.items.disabled"),
            trigger: "disabled prop",
            behavior: stripHtml(tContent("states.descriptions.disabled")),
          },
          {
            label: tContent("states.items.invalid"),
            trigger: "aria-invalid",
            behavior: stripHtml(tContent("states.descriptions.invalid")),
          },
        ]}
      />

      {/* ── Propriedades ──────────────────────────────────────────── */}
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
            items: [
              {
                name: "pressed",
                type: tContent("props.table.pressed.type"),
                defaultValue: tContent("props.table.pressed.default"),
                required: tContent("props.table.pressed.required"),
                description: stripHtml(tContent("props.table.pressed.description")),
              },
              {
                name: "defaultPressed",
                type: tContent("props.table.defaultPressed.type"),
                defaultValue: tContent("props.table.defaultPressed.default"),
                required: tContent("props.table.defaultPressed.required"),
                description: stripHtml(tContent("props.table.defaultPressed.description")),
              },
              {
                name: "onPressedChange",
                type: tContent("props.table.onPressedChange.type"),
                defaultValue: tContent("props.table.onPressedChange.default"),
                required: tContent("props.table.onPressedChange.required"),
                description: stripHtml(tContent("props.table.onPressedChange.description")),
              },
              {
                name: "disabled",
                type: tContent("props.table.disabled.type"),
                defaultValue: tContent("props.table.disabled.default"),
                required: tContent("props.table.disabled.required"),
                description: stripHtml(tContent("props.table.disabled.description")),
              },
              {
                name: "variant",
                type: tContent("props.table.variant.type"),
                defaultValue: tContent("props.table.variant.default"),
                required: tContent("props.table.variant.required"),
                description: stripHtml(tContent("props.table.variant.description")),
              },
              {
                name: "size",
                type: tContent("props.table.size.type"),
                defaultValue: tContent("props.table.size.default"),
                required: tContent("props.table.size.required"),
                description: stripHtml(tContent("props.table.size.description")),
              },
              {
                name: "className",
                type: tContent("props.table.className.type"),
                defaultValue: tContent("props.table.className.default"),
                required: tContent("props.table.className.required"),
                description: stripHtml(tContent("props.table.className.description")),
              },
            ],
          },
        ]}
        interfaceCode={interfaceCode}
        extensibilityTitle={tContent("props.extensibilityTitle")}
        extensibilityNotes={tContent("props.extensibilityCode")}
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
          { token: "--muted",       value: tContent("tokens.table.muted.class"),       description: tContent("tokens.table.muted.part") },
          { token: "--foreground",  value: tContent("tokens.table.foreground.class"),  description: tContent("tokens.table.foreground.part") },
          { token: "--input",       value: tContent("tokens.table.input.class"),       description: tContent("tokens.table.input.part") },
          { token: "--ring",        value: tContent("tokens.table.ring.class"),        description: tContent("tokens.table.ring.part") },
          { token: "--destructive", value: tContent("tokens.table.destructive.class"), description: tContent("tokens.table.destructive.part") },
          { token: "--radius-button", value: tContent("tokens.table.radius.class"),    description: tContent("tokens.table.radius.part") },
        ]}
        customizationTitle={tContent("tokens.customizationTitle")}
        customizationCode={codeCustomizationTokens}
      />

      {/* ── Acessibilidade ────────────────────────────────────────── */}
      <DocsAccessibility
        title={tContent("accessibility.title")}
        summary={tContent("accessibility.summary")}
        items={[
          tContent("accessibility.items.item1"),
          tContent("accessibility.items.item2"),
          tContent("accessibility.items.item3"),
          tContent("accessibility.items.item4"),
          tContent("accessibility.items.item5"),
          tContent("accessibility.items.item6"),
        ]}
        keyboardTitle={tContent("accessibility.keyboard.title")}
        keyboardItems={[
          { key: "Tab",   description: tContent("accessibility.keyboard.tab") },
          { key: "Space", description: tContent("accessibility.keyboard.space") },
          { key: "Enter", description: tContent("accessibility.keyboard.enter") },
        ]}
      />

      {/* ── Relacionados ──────────────────────────────────────────── */}
      <DocsRelated
        title={tContent("related.title")}
        items={[
          {
            name: tContent("related.items.toggleGroup.name"),
            description: tContent("related.items.toggleGroup.description"),
            path: "?path=/docs/ui-togglegroup--docs",
          },
          {
            name: tContent("related.items.switch.name"),
            description: tContent("related.items.switch.description"),
            path: "?path=/docs/ui-switch--docs",
          },
          {
            name: tContent("related.items.checkbox.name"),
            description: tContent("related.items.checkbox.description"),
            path: "?path=/docs/ui-checkbox--docs",
          },
          {
            name: tContent("related.items.button.name"),
            description: tContent("related.items.button.description"),
            path: "?path=/docs/ui-button--docs",
          },
        ]}
      />

      {/* ── Notas ─────────────────────────────────────────────────── */}
      <DocsNotes
        title={tContent("notes.title")}
        items={[
          { title: "", content: tContent("notes.item1") },
          { title: "", content: tContent("notes.item2") },
          { title: "", content: tContent("notes.item3") },
          { title: "", content: tContent("notes.item4") },
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
            event: "field_change",
            trigger: tContent("analytics.table.field_change.trigger"),
            payload: tContent("analytics.table.field_change.payload"),
          },
          {
            event: "docs_page_view",
            trigger: tNav("common.pageMount") || "Página de docs é montada",
            payload: '{ component_name: "toggle", locale, page_title }',
          },
          {
            event: "docs_section_viewed",
            trigger: tNav("common.sectionViewed") || "Seção entra no viewport",
            payload: '{ section_id, component_name: "toggle", locale }',
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
          items: [1, 2, 3, 4].map((i) => ({
            action: stripHtml(tContent(`testes.functional.item${i}.action`)),
            result: stripHtml(tContent(`testes.functional.item${i}.result`)),
            priority: tNav(priorityKeyMap[tContent(`testes.functional.item${i}.priority`)] ?? "common.high"),
          })),
        }}
        accessibility={{
          title: tContent("testes.accessibility.title"),
          cols: {
            criterion: tNav("common.criterion"),
            level: "WCAG",
            how: tNav("common.howToVerify"),
          },
          items: [1, 2, 3, 4, 5].map((i) => ({
            criterion: stripHtml(tContent(`testes.accessibility.item${i}`)),
            level: "AA",
            how: "—",
          })),
        }}
        visual={{
          title: tContent("testes.visual.title"),
          cols: {
            story: tNav("common.storyState"),
            priority: tNav("common.priority"),
          },
          items: [1, 2, 3, 4].map((i) => ({
            story: tContent(`testes.visual.item${i}.story`),
            priority: tNav(priorityKeyMap[tContent(`testes.visual.item${i}.priority`)] ?? "common.high"),
          })),
        }}
      />
    </DocsPageLayout>
  );
}
