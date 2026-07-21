import { useCallback, useEffect, useMemo } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import DOMPurify from 'dompurify';
import { useActiveSection } from "@/lib/use-active-section";
import uiTranslations from "@/i18n/ui.json";
import scrollAreaTranslations from "@shared/content/scroll-area/translations.json";

import { DocsHeader } from "@/components/docs/shared/sections/DocsHeader";
import { DocsPageLayout } from "@/components/docs/shared/sections/DocsPageLayout";
import { DocsDemonstration } from "@/components/docs/shared/sections/DocsDemonstration";
import { DocsAnatomy } from "@/components/docs/shared/sections/DocsAnatomy";
import { DocsWhenToUse } from "@/components/docs/shared/sections/DocsWhenToUse";
import { DocsDoDont } from "@/components/docs/shared/sections/DocsDoDont";
import { DocsImport } from "@/components/docs/shared/sections/DocsImport";
import { DocsVariants } from "@/components/docs/shared/sections/DocsVariants";
import { DocsStates } from "@/components/docs/shared/sections/DocsStates";
import { DocsProps } from "@/components/docs/shared/sections/DocsProps";
import { DocsTokens } from "@/components/docs/shared/sections/DocsTokens";
import { DocsAccessibility } from "@/components/docs/shared/sections/DocsAccessibility";
import { DocsRelated } from "@/components/docs/shared/sections/DocsRelated";
import { DocsNotes } from "@/components/docs/shared/sections/DocsNotes";
import { DocsAnalytics } from "@/components/docs/shared/sections/DocsAnalytics";
import { DocsTestes } from "@/components/docs/shared/sections/DocsTestes";

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
      { id: "anatomia", label: t("nav.anatomy") },
      { id: "quando-usar", label: t("nav.usage") },
      { id: "do-dont", label: t("nav.doDont") },
    ],
  },
  {
    label: t("nav.techRef"),
    sections: [
      { id: "importacao", label: t("nav.import") },
      { id: "variantes", label: t("nav.variants") },
      { id: "estados", label: t("nav.states") },
      { id: "propriedades", label: t("nav.props") },
      { id: "tokens", label: t("nav.tokens") },
    ],
  },
  {
    label: t("nav.context"),
    sections: [
      { id: "acessibilidade", label: t("nav.accessibility") },
      { id: "relacionados", label: t("nav.related") },
      { id: "notas", label: t("nav.notes") },
    ],
  },
  {
    label: t("nav.quality"),
    sections: [
      { id: "analytics", label: t("nav.analytics") },
      { id: "testes", label: t("nav.testes") },
    ],
  },
];


// ─── Demo data ───────────────────────────────────────────────────────────────

const VERTICAL_TAGS = Array.from({ length: 30 }, (_, i) => i + 1);
const HORIZONTAL_CARDS = Array.from({ length: 10 }, (_, i) => i + 1);
const MATRIX_ROWS = Array.from({ length: 12 }, (_, i) => i + 1);
const MATRIX_COLS = Array.from({ length: 12 }, (_, i) => i + 1);

// ─── Componente principal ────────────────────────────────────────────────────

export function ScrollAreaDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(scrollAreaTranslations);

  const navGroups = useMemo(() => getNavGroups(tNav), [tNav]);
  const allIds = useMemo(
    () => navGroups.flatMap((g) => g.sections.map((s) => s.id)),
    [navGroups]
  );

  useSeoEffect({
    title: tContent("seo.title"),
    description: tContent("seo.description"),
    locale,
    componentSlug: "scroll-area",
    aiSummary: tContent("seo.aiSummary"),
    aiEntities: tContent("seo.aiEntities"),
    aiIntent: tContent("seo.aiIntent") as "informational" | "navigational",
    breadcrumb: [
      { name: "Components", item: "/components" },
      { name: tContent("category"), item: "/components/layout" },
      { name: tContent("title") },
    ],
  });

  useEffect(() => {
    track("docs_page_view", {
      component_name: "scroll-area",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "scroll-area",
        locale,
      });
    },
    [locale]
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  // ─── Labels ──────────────────────────────────────────────────────────────
  const lblVertical = tContent("demonstration.labels.verticalTitle");
  const lblHorizontal = tContent("demonstration.labels.horizontalTitle");
  const lblBoth = tContent("demonstration.labels.bothTitle");
  const lblTag = tContent("demonstration.labels.tag");

  // ─── Code strings ────────────────────────────────────────────────────────

  const codeImportBasic = `import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";`;

  const codeVertical = `<div style={{ height: "300px" }}>
  <ScrollArea className="nds-w-full nds-rounded-md nds-border-default" style={{ height: "100%" }}>
    <div className="nds-stack nds-p-4" data-spacing="sm">
      {tags.map((tag) => (
        <div key={tag} className="nds-text-body">Tag {tag}</div>
      ))}
    </div>
  </ScrollArea>
</div>`;

  const codeHorizontal = `<div style={{ width: "500px" }}>
  <ScrollArea className="nds-w-full nds-whitespace-nowrap nds-rounded-md nds-border-default" style={{ height: "100%" }}>
    <div className="nds-cluster nds-p-4" data-spacing="md" style={{ width: "max-content" }}>
      {items.map((item) => (
        <Card key={item.id} />
      ))}
    </div>
    <ScrollBar orientation="horizontal" />
  </ScrollArea>
</div>`;

  const codeBoth = `<div style={{ height: "300px", width: "500px" }}>
  <ScrollArea className="nds-w-full nds-rounded-md nds-border-default" style={{ height: "100%" }}>
    <table style={{ width: "max-content" }}>{/* …conteúdo amplo */}</table>
    <ScrollBar orientation="horizontal" />
  </ScrollArea>
</div>`;

  const interfaceCode = `// @base-ui/react/scroll-area
interface ScrollAreaRootProps {
  type?: "auto" | "always" | "scroll" | "hover"; // default "hover"
  scrollHideDelay?: number;                      // default 600
  className?: string;
  children: ReactNode;
}

interface ScrollBarProps {
  orientation?: "vertical" | "horizontal"; // default "vertical"
  className?: string;
}`;

  // ─── Locale-aware column labels ──────────────────────────────────────────
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
    event: locale === "en" ? "Event" : "Evento",
    trigger: locale === "en" ? "Trigger" : "Disparo",
    payload: "Payload",
  };

  return (
    <DocsPageLayout
      navGroups={navGroups}
      activeSection={activeId}
      componentSlug="scroll-area"
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
      <DocsDemonstration title={tContent("demonstration.title")}>
        <div className="nds-stack nds-w-full" data-spacing="xl">
          {/* Demo 1: Vertical */}
          <div className="nds-stack" data-spacing="sm">
            <p className="nds-text-caption nds-font-medium nds-text-muted-foreground">
              {lblVertical}
            </p>
            <div className="nds-w-full" style={{ height: "300px", maxWidth: "360px" }}>
              <ScrollArea className="nds-w-full nds-rounded-md nds-border-default" style={{ height: "100%" }}>
                <div className="nds-stack nds-p-4" data-spacing="sm">
                  {VERTICAL_TAGS.map((n) => (
                    <div
                      key={n}
                      className="nds-text-body nds-border-b nds-last-border-0"
                      style={{ paddingBottom: "0.5rem" }}
                    >
                      {lblTag} {n}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Demo 2: Horizontal */}
          <div className="nds-stack" data-spacing="sm">
            <p className="nds-text-caption nds-font-medium nds-text-muted-foreground">
              {lblHorizontal}
            </p>
            <div className="nds-w-full" style={{ height: "180px", maxWidth: "500px" }}>
              <ScrollArea className="nds-w-full nds-whitespace-nowrap nds-rounded-md nds-border-default" style={{ height: "100%" }}>
                <div className="nds-cluster nds-p-4" data-spacing="md" style={{ width: "max-content" }}>
                  {HORIZONTAL_CARDS.map((n) => (
                    <div
                      key={n}
                      className="nds-cluster nds-rounded-md nds-bg-muted nds-text-body nds-shrink-0"
                      data-align="center"
                      data-justify="center"
                      style={{ height: "120px", width: "140px" }}
                    >
                      Card {n}
                    </div>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          </div>

          {/* Demo 3: Bidirecional */}
          <div className="nds-stack" data-spacing="sm">
            <p className="nds-text-caption nds-font-medium nds-text-muted-foreground">
              {lblBoth}
            </p>
            <div className="nds-w-full" style={{ height: "260px", maxWidth: "500px" }}>
              <ScrollArea className="nds-w-full nds-rounded-md nds-border-default" style={{ height: "100%" }}>
                <table className="nds-border-collapse nds-text-caption" style={{ width: "max-content" }}>
                  <tbody>
                    {MATRIX_ROWS.map((r) => (
                      <tr key={r}>
                        {MATRIX_COLS.map((c) => (
                          <td
                            key={c}
                            className="nds-border-default nds-whitespace-nowrap"
                            style={{ padding: "0.5rem 0.75rem" }}
                          >
                            R{r}·C{c}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
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
          tContent("anatomy.item4"),
          tContent("anatomy.item5"),
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
              element: tContent("usage.uxWriting.table.container.name"),
              rules: stripHtml(tContent("usage.uxWriting.table.container.format")),
              do: stripHtml(tContent("usage.uxWriting.table.container.good")),
              dont: stripHtml(tContent("usage.uxWriting.table.container.bad")),
            },
            {
              element: tContent("usage.uxWriting.table.scrollArea.name"),
              rules: stripHtml(tContent("usage.uxWriting.table.scrollArea.format")),
              do: stripHtml(tContent("usage.uxWriting.table.scrollArea.good")),
              dont: stripHtml(tContent("usage.uxWriting.table.scrollArea.bad")),
            },
            {
              element: tContent("usage.uxWriting.table.orientation.name"),
              rules: tContent("usage.uxWriting.table.orientation.format"),
              do: tContent("usage.uxWriting.table.orientation.good"),
              dont: tContent("usage.uxWriting.table.orientation.bad"),
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
              <div className="nds-w-full" style={{ height: "160px" }}>
                <ScrollArea className="nds-w-full nds-rounded-md nds-border-default" style={{ height: "100%" }}>
                  <div className="nds-stack nds-text-caption" data-spacing="sm" style={{ padding: "0.75rem" }}>
                    {Array.from({ length: 12 }, (_, i) => (
                      <div key={i}>Item {i + 1}</div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            ),
            dontPreview: (
              <div className="nds-w-full">
                <ScrollArea className="nds-w-full nds-rounded-md nds-border-default" style={{ height: "100%" }}>
                  <div className="nds-stack nds-text-caption" data-spacing="sm" style={{ padding: "0.75rem" }}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <div key={i}>Item {i + 1}</div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            ),
            doCaption: DOMPurify.sanitize(tContent("doDont.pair1.do")),
            dontCaption: DOMPurify.sanitize(tContent("doDont.pair1.dont")),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <div className="nds-w-full" style={{ height: "160px" }}>
                <ScrollArea className="nds-w-full nds-rounded-md nds-border-default" style={{ height: "100%" }}>
                  <div className="nds-stack nds-text-caption" data-spacing="sm" style={{ padding: "0.75rem" }}>
                    {Array.from({ length: 14 }, (_, i) => (
                      <div key={i}>Linha {i + 1}</div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            ),
            dontPreview: (
              <div className="nds-w-full" style={{ height: "160px" }}>
                <ScrollArea className="nds-w-full nds-rounded-md nds-border-default" style={{ height: "100%" }}>
                  <div style={{ height: "140px" }}>
                    <ScrollArea className="nds-w-full" style={{ height: "100%" }}>
                      <div className="nds-stack nds-text-caption" data-spacing="sm" style={{ padding: "0.75rem" }}>
                        {Array.from({ length: 14 }, (_, i) => (
                          <div key={i}>Linha {i + 1}</div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </ScrollArea>
              </div>
            ),
            doCaption: DOMPurify.sanitize(tContent("doDont.pair2.do")),
            dontCaption: DOMPurify.sanitize(tContent("doDont.pair2.dont")),
          },
        ]}
      />

      {/* ── Importação ────────────────────────────────────────────── */}
      <DocsImport title={tContent("import.title")} code={codeImportBasic} />

      {/* ── Variantes ─────────────────────────────────────────────── */}
      <DocsVariants
        title={tContent("variants.title")}
        items={[
          {
            name: tContent("variants.items.vertical"),
            description: stripHtml(tContent("variants.styles.vertical")),
            code: codeVertical,
            preview: (
              <div className="nds-w-full" style={{ height: "200px", maxWidth: "300px" }}>
                <ScrollArea className="nds-w-full nds-rounded-md nds-border-default" style={{ height: "100%" }}>
                  <div className="nds-stack nds-text-caption" data-spacing="sm" style={{ padding: "0.75rem" }}>
                    {VERTICAL_TAGS.slice(0, 20).map((n) => (
                      <div key={n} className="nds-border-b nds-last-border-0" style={{ paddingBottom: "0.25rem" }}>
                        {lblTag} {n}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            ),
          },
          {
            name: tContent("variants.items.horizontal"),
            description: stripHtml(tContent("variants.styles.horizontal")),
            code: codeHorizontal,
            preview: (
              <div className="nds-w-full" style={{ height: "140px", maxWidth: "420px" }}>
                <ScrollArea className="nds-w-full nds-whitespace-nowrap nds-rounded-md nds-border-default" style={{ height: "100%" }}>
                  <div className="nds-cluster" data-spacing="sm" style={{ width: "max-content", padding: "0.75rem" }}>
                    {HORIZONTAL_CARDS.map((n) => (
                      <div
                        key={n}
                        className="nds-cluster nds-rounded-md nds-bg-muted nds-text-caption nds-shrink-0"
                        data-align="center"
                        data-justify="center"
                        style={{ height: "90px", width: "120px" }}
                      >
                        Card {n}
                      </div>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>
            ),
          },
          {
            name: tContent("variants.items.both"),
            description: stripHtml(tContent("variants.styles.both")),
            code: codeBoth,
            preview: (
              <div className="nds-w-full" style={{ height: "200px", maxWidth: "420px" }}>
                <ScrollArea className="nds-w-full nds-rounded-md nds-border-default" style={{ height: "100%" }}>
                  <table className="nds-border-collapse nds-text-caption" style={{ width: "max-content" }}>
                    <tbody>
                      {MATRIX_ROWS.slice(0, 10).map((r) => (
                        <tr key={r}>
                          {MATRIX_COLS.slice(0, 10).map((c) => (
                            <td
                              key={c}
                              className="nds-border-default nds-px-2 nds-py-1 nds-whitespace-nowrap"
                            >
                              R{r}·C{c}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
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
            label: tContent("states.items.idle"),
            trigger: "—",
            behavior: stripHtml(tContent("states.descriptions.idle")),
          },
          {
            label: tContent("states.items.scrolling"),
            trigger: "data-scrolling",
            behavior: stripHtml(tContent("states.descriptions.scrolling")),
          },
          {
            label: tContent("states.items.hover"),
            trigger: ":hover",
            behavior: stripHtml(tContent("states.descriptions.hover")),
          },
          {
            label: tContent("states.items.focus"),
            trigger: ":focus-visible",
            behavior: stripHtml(tContent("states.descriptions.focus")),
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
                name: "type",
                type: tContent("props.table.type_prop.type"),
                defaultValue: tContent("props.table.type_prop.default"),
                required: tContent("props.table.type_prop.required"),
                description: DOMPurify.sanitize(tContent("props.table.type_prop.description")),
              },
              {
                name: "scrollHideDelay",
                type: tContent("props.table.scrollHideDelay.type"),
                defaultValue: tContent("props.table.scrollHideDelay.default"),
                required: tContent("props.table.scrollHideDelay.required"),
                description: DOMPurify.sanitize(tContent("props.table.scrollHideDelay.description")),
              },
              {
                name: "orientation",
                type: tContent("props.table.orientation.type"),
                defaultValue: tContent("props.table.orientation.default"),
                required: tContent("props.table.orientation.required"),
                description: DOMPurify.sanitize(tContent("props.table.orientation.description")),
              },
              {
                name: "className",
                type: tContent("props.table.className.type"),
                defaultValue: tContent("props.table.className.default"),
                required: tContent("props.table.className.required"),
                description: DOMPurify.sanitize(tContent("props.table.className.description")),
              },
              {
                name: "children",
                type: tContent("props.table.children.type"),
                defaultValue: tContent("props.table.children.default"),
                required: tContent("props.table.children.required"),
                description: DOMPurify.sanitize(tContent("props.table.children.description")),
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
            value: tContent("tokens.table.border.class"),
            description: tContent("tokens.table.border.part"),
          },
          {
            token: "--ring",
            value: tContent("tokens.table.ring.class"),
            description: tContent("tokens.table.ring.part"),
          },
          {
            token: "--background",
            value: tContent("tokens.table.background.class"),
            description: tContent("tokens.table.background.part"),
          },
          {
            token: "--foreground",
            value: tContent("tokens.table.foreground.class"),
            description: tContent("tokens.table.foreground.part"),
          },
          {
            token: "--muted",
            value: tContent("tokens.table.muted.class"),
            description: tContent("tokens.table.muted.part"),
          },
          {
            token: "--ring-offset-background",
            value: tContent("tokens.table.ringOffset.class"),
            description: tContent("tokens.table.ringOffset.part"),
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
          tContent("accessibility.items.item6"),
        ]}
        keyboardTitle={tContent("accessibility.keyboard.title")}
        keyboardItems={[
          { key: "Tab", description: stripHtml(tContent("accessibility.keyboard.tab")) },
          { key: "↓", description: stripHtml(tContent("accessibility.keyboard.arrowDown")) },
          { key: "↑", description: stripHtml(tContent("accessibility.keyboard.arrowUp")) },
          { key: "→", description: stripHtml(tContent("accessibility.keyboard.arrowRight")) },
          { key: "←", description: stripHtml(tContent("accessibility.keyboard.arrowLeft")) },
          { key: "PageDown", description: stripHtml(tContent("accessibility.keyboard.pageDown")) },
          { key: "PageUp", description: stripHtml(tContent("accessibility.keyboard.pageUp")) },
          { key: "Home", description: stripHtml(tContent("accessibility.keyboard.home")) },
          { key: "End", description: stripHtml(tContent("accessibility.keyboard.end")) },
        ]}
      />

      {/* ── Relacionados ──────────────────────────────────────────── */}
      <DocsRelated
        title={tContent("related.title")}
        items={[
          {
            name: tContent("related.items.resizable.name"),
            description: tContent("related.items.resizable.description"),
            path: "?path=/docs/ui-resizable--docs",
          },
          {
            name: tContent("related.items.sheet.name"),
            description: tContent("related.items.sheet.description"),
            path: "?path=/docs/ui-sheet--docs",
          },
          {
            name: tContent("related.items.dialog.name"),
            description: tContent("related.items.dialog.description"),
            path: "?path=/docs/ui-dialog--docs",
          },
          {
            name: tContent("related.items.command.name"),
            description: tContent("related.items.command.description"),
            path: "?path=/docs/ui-command--docs",
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
        cols={analyticsCols}
        items={[
          {
            event: "content_scroll",
            trigger: tContent("analytics.table.content_scroll.trigger"),
            payload: tContent("analytics.table.content_scroll.payload"),
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
              priority: tNav(priorityKeyMap[tContent("testes.functional.item4.priority")] ?? "common.medium"),
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
            { criterion: tContent("testes.accessibility.item3"), level: "2.4.7", how: "Keyboard test" },
            { criterion: tContent("testes.accessibility.item4"), level: "2.1.1", how: "Keyboard test" },
            { criterion: tContent("testes.accessibility.item5"), level: "1.4.10", how: "Manual mobile test" },
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

export default ScrollAreaDocs;
