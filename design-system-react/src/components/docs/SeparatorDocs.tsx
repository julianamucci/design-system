import { useCallback, useEffect, useMemo } from "react";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import { useActiveSection } from "@/lib/use-active-section";
import uiTranslations from "@/i18n/ui.json";
import separatorTranslations from "@shared/content/separator/translations.json";

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

export function SeparatorDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(separatorTranslations);

  const navGroups = useMemo(() => getNavGroups(tNav), [tNav]);
  const allIds = useMemo(
    () => navGroups.flatMap((g) => g.sections.map((s) => s.id)),
    [navGroups]
  );

  useSeoEffect({
    title: tContent("seo.title"),
    description: tContent("seo.description"),
    locale,
    componentSlug: "separator",
  });

  useEffect(() => {
    track("docs_page_view", {
      component_name: "separator",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "separator",
        locale,
      });
    },
    [locale]
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  // ─── Code strings ───────────────────────────────────────────────────────────

  const codeImport = `import { Separator } from "@/components/ui/separator";`;

  const codeHorizontal = `<div className="w-64 space-y-4">
  <div>Item 1</div>
  <Separator orientation="horizontal" />
  <div>Item 2</div>
</div>`;

  const codeVertical = `<div className="flex items-center h-12 gap-4">
  <span>Item 1</span>
  <Separator orientation="vertical" />
  <span>Item 2</span>
</div>`;

  const structureCode = tContent('anatomy.structureCode');

  const interfaceCode = `// Separator (Base UI)
interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical"; // padrão: "horizontal"
  decorative?: boolean;                    // padrão: true
  className?: string;
}`;

  // ─── Locale-aware column labels ─────────────────────────────────────────────

  const stateCols = {
    state: locale === "en" ? "State" : "Estado",
    trigger: locale === "en" ? "Trigger" : locale === "es" ? "Disparo" : "Disparo",
    behavior:
      locale === "en"
        ? "Behavior"
        : locale === "es"
        ? "Comportamiento"
        : "Comportamento",
  };

  const analyticsCols = {
    event: locale === "en" ? "Event" : locale === "es" ? "Evento" : "Evento",
    trigger: locale === "en" ? "Trigger" : locale === "es" ? "Disparo" : "Disparo",
    payload: "Payload",
  };

  return (
    <DocsPageLayout
      navGroups={navGroups}
      activeSection={activeId}
      componentSlug="separator"
      header={
        <DocsHeader
          title={tContent("title")}
          description={tContent("description")}
          category={tContent("category")}
          type={tContent("type")}
          installNote="npx shadcn@latest add separator"
        />
      }
    >
      {/* ── Demonstração ──────────────────────────────────────────── */}
      <DocsDemonstration title={tContent("demonstration.title")}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {tContent("demonstration.labels.horizontal")}
            </p>
            <div className="w-full space-y-3 text-sm border rounded-md p-4">
              <div>Item 1</div>
              <Separator orientation="horizontal" />
              <div>Item 2</div>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {tContent("demonstration.labels.vertical")}
            </p>
            <div className="flex items-center h-16 gap-4 text-sm border rounded-md px-4">
              <span>Item 1</span>
              <Separator orientation="vertical" />
              <span>Item 2</span>
              <Separator orientation="vertical" />
              <span>Item 3</span>
            </div>
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
        structureCode={structureCode}
        structureLabel={tContent("anatomy.structureLabel")}
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
              element: tContent("usage.uxWriting.table.decorativeChoice.name"),
              rules: tContent("usage.uxWriting.table.decorativeChoice.format"),
              do: tContent("usage.uxWriting.table.decorativeChoice.good"),
              dont: tContent("usage.uxWriting.table.decorativeChoice.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.vsGap.name"),
              rules: tContent("usage.uxWriting.table.vsGap.format"),
              do: tContent("usage.uxWriting.table.vsGap.good"),
              dont: tContent("usage.uxWriting.table.vsGap.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.vsBorder.name"),
              rules: tContent("usage.uxWriting.table.vsBorder.format"),
              do: tContent("usage.uxWriting.table.vsBorder.good"),
              dont: tContent("usage.uxWriting.table.vsBorder.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.vertical.name"),
              rules: tContent("usage.uxWriting.table.vertical.format"),
              do: tContent("usage.uxWriting.table.vertical.good"),
              dont: tContent("usage.uxWriting.table.vertical.bad"),
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
              <div className="w-full space-y-3 text-sm">
                <div className="font-medium">Header do Card</div>
                <Separator orientation="horizontal" />
                <div className="text-muted-foreground">Conteúdo do Card</div>
              </div>
            ),
            dontPreview: (
              <div className="w-full space-y-6 text-sm">
                <div className="font-medium">Header do Card</div>
                <div className="text-muted-foreground">Conteúdo do Card</div>
              </div>
            ),
            doCaption: stripHtml(tContent("doDont.pair1.do")),
            dontCaption: stripHtml(tContent("doDont.pair1.dont")),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <div className="flex items-center h-12 gap-4 text-sm">
                <a href="#" className="text-primary">Link 1</a>
                <Separator orientation="vertical" />
                <a href="#" className="text-primary">Link 2</a>
                <Separator orientation="vertical" />
                <a href="#" className="text-primary">Link 3</a>
              </div>
            ),
            dontPreview: (
              <div className="flex gap-4 text-sm">
                <a href="#" className="text-primary">Link 1</a>
                <Separator orientation="vertical" />
                <a href="#" className="text-primary">Link 2</a>
              </div>
            ),
            doCaption: stripHtml(tContent("doDont.pair2.do")),
            dontCaption: stripHtml(tContent("doDont.pair2.dont")),
          },
        ]}
      />

      {/* ── Importação ────────────────────────────────────────────── */}
      <DocsImport title={tContent("import.title")} code={codeImport} />

      {/* ── Variantes ─────────────────────────────────────────────── */}
      <DocsVariants
        title={tContent("variants.title")}
        componentSlug="separator"
        items={[
          {
            name: tContent("variants.items.horizontal"),
            description: stripHtml(tContent("variants.styles.horizontal")),
            code: codeHorizontal,
            preview: (
              <div className="w-64 space-y-3 text-sm">
                <div>Seção superior</div>
                <Separator orientation="horizontal" />
                <div>Seção inferior</div>
              </div>
            ),
          },
          {
            name: tContent("variants.items.vertical"),
            description: stripHtml(tContent("variants.styles.vertical")),
            code: codeVertical,
            preview: (
              <div className="flex items-center h-12 gap-4 text-sm">
                <span>Item 1</span>
                <Separator orientation="vertical" />
                <span>Item 2</span>
              </div>
            ),
          },
        ]}
      />

      {/* ── Estados ───────────────────────────────────────────────── */}
      <DocsStates
        title={tContent("states.title")}
        cols={stateCols}
        items={[
          {
            label: tContent("states.items.decorative"),
            trigger: "decorative={true}",
            behavior: stripHtml(tContent("states.descriptions.decorative")),
          },
          {
            label: tContent("states.items.semantic"),
            trigger: "decorative={false}",
            behavior: stripHtml(tContent("states.descriptions.semantic")),
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
                name: "orientation",
                type: tContent("props.table.orientation.type"),
                defaultValue: tContent("props.table.orientation.default"),
                required: tContent("props.table.orientation.required"),
                description: stripHtml(tContent("props.table.orientation.description")),
              },
              {
                name: "decorative",
                type: tContent("props.table.decorative.type"),
                defaultValue: tContent("props.table.decorative.default"),
                required: tContent("props.table.decorative.required"),
                description: stripHtml(tContent("props.table.decorative.description")),
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
          {
            token: "--border",
            value: tContent("tokens.table.background.class"),
            description: tContent("tokens.table.background.part"),
          },
          {
            token: "h-px",
            value: tContent("tokens.table.heightHorizontal.class"),
            description: tContent("tokens.table.heightHorizontal.part"),
          },
          {
            token: "w-full",
            value: tContent("tokens.table.widthHorizontal.class"),
            description: tContent("tokens.table.widthHorizontal.part"),
          },
          {
            token: "w-px",
            value: tContent("tokens.table.widthVertical.class"),
            description: tContent("tokens.table.widthVertical.part"),
          },
          {
            token: "h-full",
            value: tContent("tokens.table.heightVertical.class"),
            description: tContent("tokens.table.heightVertical.part"),
          },
        ]}
        customizationTitle={tContent("tokens.customizationTitle")}
        customizationCode={tContent("tokens.customizationCode")}
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
        ]}
        keyboardTitle={tContent("accessibility.keyboard.title")}
        keyboardItems={[
          { key: "—", description: tContent("accessibility.keyboard.noKeyboard") },
          { key: "Tab", description: tContent("accessibility.keyboard.description") },
        ]}
      />

      {/* ── Relacionados ──────────────────────────────────────────── */}
      <DocsRelated
        title={tContent("related.title")}
        componentSlug="separator"
        items={[
          {
            name: tContent("related.items.card.name"),
            description: tContent("related.items.card.description"),
            path: "?path=/docs/ui-card--docs",
          },
          {
            name: tContent("related.items.sheet.name"),
            description: tContent("related.items.sheet.description"),
            path: "?path=/docs/ui-sheet--docs",
          },
          {
            name: tContent("related.items.sidebar.name"),
            description: tContent("related.items.sidebar.description"),
            path: "?path=/docs/ui-sidebar--docs",
          },
          {
            name: tContent("related.items.navigationMenu.name"),
            description: tContent("related.items.navigationMenu.description"),
            path: "?path=/docs/ui-navigationmenu--docs",
          },
        ]}
      />

      {/* ── Notas ─────────────────────────────────────────────────── */}
      <DocsNotes
        title={tContent("notes.title")}
        componentSlug="separator"
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
        cols={analyticsCols}
        items={[
          {
            event: "—",
            trigger: tContent("analytics.description"),
            payload: "—",
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
            { criterion: tContent("testes.accessibility.item1"), level: "AA", how: "axe-core" },
            { criterion: tContent("testes.accessibility.item2"), level: "1.4.11", how: "Contrast checker" },
            { criterion: tContent("testes.accessibility.item3"), level: "AA", how: "DevTools a11y tree" },
            { criterion: tContent("testes.accessibility.item4"), level: "1.3.1", how: "DevTools a11y tree" },
            { criterion: tContent("testes.accessibility.item5"), level: "2.1.1", how: "Tab keyboard" },
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
            { story: tContent("testes.visual.item5.story"), priority: tNav(priorityKeyMap[tContent("testes.visual.item5.priority")] ?? "common.medium") },
          ],
        }}
      />
    </DocsPageLayout>
  );
}

export default SeparatorDocs;
