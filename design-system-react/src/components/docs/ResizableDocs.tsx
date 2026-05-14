import { useCallback, useEffect, useMemo } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { useActiveSection } from "@/lib/use-active-section";
import uiTranslations from "@/i18n/ui.json";
import resizableTranslations from "@shared/content/resizable/translations.json";

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


// ─── Componente principal ────────────────────────────────────────────────────

export function ResizableDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(resizableTranslations);

  const navGroups = useMemo(() => getNavGroups(tNav), [tNav]);
  const allIds = useMemo(
    () => navGroups.flatMap((g) => g.sections.map((s) => s.id)),
    [navGroups]
  );

  useSeoEffect({
    title: tContent("seo.title"),
    description: tContent("seo.description"),
    locale,
    componentSlug: "resizable",
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
      component_name: "resizable",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "resizable",
        locale,
      });
    },
    [locale]
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  // ─── Labels reutilizáveis ────────────────────────────────────────────────
  const lblSidebar = tContent("demonstration.labels.sidebar");
  const lblContent = tContent("demonstration.labels.content");
  const lblTop = tContent("demonstration.labels.top");
  const lblBottom = tContent("demonstration.labels.bottom");
  const lblHorizontal = tContent("demonstration.labels.horizontal");
  const lblVertical = tContent("demonstration.labels.vertical");
  const lblNested = tContent("demonstration.labels.nested");

  const ariaResize =
    locale === "en"
      ? "Resize panels — use arrow keys to adjust"
      : locale === "es"
      ? "Redimensionar paneles — usa flechas para ajustar"
      : "Redimensionar painéis — use setas para ajustar";

  // ─── Code strings ────────────────────────────────────────────────────────

  const codeImportBasic = `import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";`;

  const codeHorizontal = `<ResizablePanelGroup direction="horizontal">
  <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
    <Sidebar />
  </ResizablePanel>
  <ResizableHandle withHandle aria-label="Redimensionar painéis — use setas" />
  <ResizablePanel defaultSize={70} minSize={50} maxSize={80}>
    <Content />
  </ResizablePanel>
</ResizablePanelGroup>`;

  const codeVertical = `<ResizablePanelGroup direction="vertical">
  <ResizablePanel defaultSize={50} minSize={20} maxSize={80}>
    <Top />
  </ResizablePanel>
  <ResizableHandle withHandle aria-label="Redimensionar painéis — use setas" />
  <ResizablePanel defaultSize={50} minSize={20} maxSize={80}>
    <Bottom />
  </ResizablePanel>
</ResizablePanelGroup>`;

  const codeNested = `<ResizablePanelGroup direction="horizontal">
  <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
    <Sidebar />
  </ResizablePanel>
  <ResizableHandle withHandle aria-label="Redimensionar painéis — use setas" />
  <ResizablePanel defaultSize={75} minSize={50}>
    <ResizablePanelGroup direction="vertical">
      <ResizablePanel defaultSize={70} minSize={30}>
        <Editor />
      </ResizablePanel>
      <ResizableHandle withHandle aria-label="Redimensionar painéis — use setas" />
      <ResizablePanel defaultSize={30} minSize={15}>
        <Console />
      </ResizablePanel>
    </ResizablePanelGroup>
  </ResizablePanel>
</ResizablePanelGroup>`;

  const interfaceCode = `// react-resizable-panels
interface PanelGroupProps {
  direction: "horizontal" | "vertical";
  autoSaveId?: string;
  onLayout?: (sizes: number[]) => void;
  id?: string;
}

interface PanelProps {
  defaultSize?: number;   // 0–100
  minSize?: number;       // default 10
  maxSize?: number;       // default 100
  id?: string;
  order?: number;
  collapsible?: boolean;
  collapsedSize?: number;
}

interface PanelResizeHandleProps {
  withHandle?: boolean;
  disabled?: boolean;
  "aria-label": string;   // obrigatório
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
    event: locale === "en" ? "Event" : locale === "es" ? "Evento" : "Evento",
    trigger: locale === "en" ? "Trigger" : locale === "es" ? "Disparo" : "Disparo",
    payload: "Payload",
  };

  const demoBoxStyle: React.CSSProperties = {
    minHeight: 220,
  };

  return (
    <DocsPageLayout
      navGroups={navGroups}
      activeSection={activeId}
      componentSlug="resizable"
      header={
        <DocsHeader
          title={tContent("title")}
          description={tContent("description")}
          category={tContent("category")}
          type={tContent("type")}
          installNote="npx shadcn@latest add resizable"
        />
      }
    >
      {/* ── Demonstração ──────────────────────────────────────────── */}
      <DocsDemonstration title={tContent("demonstration.title")}>
        <div className="grid grid-cols-1 gap-8 w-full">
          {/* Demo 1: Horizontal */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {lblHorizontal}
            </p>
            <div
              className="rounded-lg border overflow-hidden"
              style={demoBoxStyle}
            >
              <ResizablePanelGroup direction="horizontal">
                <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
                  <div className="flex h-full items-center justify-center bg-muted p-4 text-sm">
                    {lblSidebar}
                  </div>
                </ResizablePanel>
                <ResizableHandle withHandle aria-label={ariaResize} />
                <ResizablePanel defaultSize={70} minSize={50} maxSize={80}>
                  <div className="flex h-full items-center justify-center p-4 text-sm">
                    {lblContent}
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </div>
          </div>

          {/* Demo 2: Vertical */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {lblVertical}
            </p>
            <div
              className="rounded-lg border overflow-hidden"
              style={{ minHeight: 260 }}
            >
              <ResizablePanelGroup direction="vertical">
                <ResizablePanel defaultSize={50} minSize={20} maxSize={80}>
                  <div className="flex h-full items-center justify-center p-4 text-sm">
                    {lblTop}
                  </div>
                </ResizablePanel>
                <ResizableHandle withHandle aria-label={ariaResize} />
                <ResizablePanel defaultSize={50} minSize={20} maxSize={80}>
                  <div className="flex h-full items-center justify-center bg-muted p-4 text-sm">
                    {lblBottom}
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </div>
          </div>

          {/* Demo 3: Nested */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {lblNested}
            </p>
            <div
              className="rounded-lg border overflow-hidden"
              style={{ minHeight: 300 }}
            >
              <ResizablePanelGroup direction="horizontal">
                <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
                  <div className="flex h-full items-center justify-center bg-muted p-4 text-sm">
                    {lblSidebar}
                  </div>
                </ResizablePanel>
                <ResizableHandle withHandle aria-label={ariaResize} />
                <ResizablePanel defaultSize={75} minSize={50}>
                  <ResizablePanelGroup direction="vertical">
                    <ResizablePanel defaultSize={70} minSize={30}>
                      <div className="flex h-full items-center justify-center p-4 text-sm">
                        {lblContent}
                      </div>
                    </ResizablePanel>
                    <ResizableHandle withHandle aria-label={ariaResize} />
                    <ResizablePanel defaultSize={30} minSize={15}>
                      <div className="flex h-full items-center justify-center bg-muted/60 p-4 text-sm">
                        Console
                      </div>
                    </ResizablePanel>
                  </ResizablePanelGroup>
                </ResizablePanel>
              </ResizablePanelGroup>
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
              element: tContent("usage.uxWriting.table.panelLabel.name"),
              rules: tContent("usage.uxWriting.table.panelLabel.format"),
              do: tContent("usage.uxWriting.table.panelLabel.good"),
              dont: tContent("usage.uxWriting.table.panelLabel.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.size.name"),
              rules: tContent("usage.uxWriting.table.size.format"),
              do: stripHtml(tContent("usage.uxWriting.table.size.good")),
              dont: tContent("usage.uxWriting.table.size.bad"),
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
              <div
                className="rounded-md border overflow-hidden w-full"
                style={{ minHeight: 120 }}
              >
                <ResizablePanelGroup direction="horizontal">
                  <ResizablePanel defaultSize={35} minSize={20} maxSize={60}>
                    <div className="flex h-full items-center justify-center bg-muted p-3 text-xs">
                      {lblSidebar}
                    </div>
                  </ResizablePanel>
                  <ResizableHandle withHandle aria-label={ariaResize} />
                  <ResizablePanel defaultSize={65} minSize={40}>
                    <div className="flex h-full items-center justify-center p-3 text-xs">
                      {lblContent}
                    </div>
                  </ResizablePanel>
                </ResizablePanelGroup>
              </div>
            ),
            dontPreview: (
              <div
                className="rounded-md border overflow-hidden w-full"
                style={{ minHeight: 120 }}
              >
                <ResizablePanelGroup direction="horizontal">
                  <ResizablePanel defaultSize={35}>
                    <div className="flex h-full items-center justify-center bg-muted p-3 text-xs">
                      {lblSidebar}
                    </div>
                  </ResizablePanel>
                  <ResizableHandle aria-label="Handle" />
                  <ResizablePanel defaultSize={65}>
                    <div className="flex h-full items-center justify-center p-3 text-xs">
                      {lblContent}
                    </div>
                  </ResizablePanel>
                </ResizablePanelGroup>
              </div>
            ),
            doCaption: sanitizeHtml(tContent("doDont.pair1.do")),
            dontCaption: sanitizeHtml(tContent("doDont.pair1.dont")),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <div className="text-xs font-mono text-muted-foreground p-3 rounded-md border">
                aria-label=&quot;{ariaResize}&quot;
              </div>
            ),
            dontPreview: (
              <div className="text-xs font-mono text-muted-foreground italic p-3 rounded-md border">
                aria-label=&quot;Handle&quot;
              </div>
            ),
            doCaption: sanitizeHtml(tContent("doDont.pair2.do")),
            dontCaption: sanitizeHtml(tContent("doDont.pair2.dont")),
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
            name: tContent("variants.items.horizontal"),
            description: stripHtml(tContent("variants.styles.horizontal")),
            code: codeHorizontal,
            preview: (
              <div
                className="rounded-md border overflow-hidden w-full"
                style={{ minHeight: 160 }}
              >
                <ResizablePanelGroup direction="horizontal">
                  <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
                    <div className="flex h-full items-center justify-center bg-muted p-3 text-xs">
                      {lblSidebar}
                    </div>
                  </ResizablePanel>
                  <ResizableHandle withHandle aria-label={ariaResize} />
                  <ResizablePanel defaultSize={70} minSize={50} maxSize={80}>
                    <div className="flex h-full items-center justify-center p-3 text-xs">
                      {lblContent}
                    </div>
                  </ResizablePanel>
                </ResizablePanelGroup>
              </div>
            ),
          },
          {
            name: tContent("variants.items.vertical"),
            description: stripHtml(tContent("variants.styles.vertical")),
            code: codeVertical,
            preview: (
              <div
                className="rounded-md border overflow-hidden w-full"
                style={{ minHeight: 200 }}
              >
                <ResizablePanelGroup direction="vertical">
                  <ResizablePanel defaultSize={50} minSize={20} maxSize={80}>
                    <div className="flex h-full items-center justify-center p-3 text-xs">
                      {lblTop}
                    </div>
                  </ResizablePanel>
                  <ResizableHandle withHandle aria-label={ariaResize} />
                  <ResizablePanel defaultSize={50} minSize={20} maxSize={80}>
                    <div className="flex h-full items-center justify-center bg-muted p-3 text-xs">
                      {lblBottom}
                    </div>
                  </ResizablePanel>
                </ResizablePanelGroup>
              </div>
            ),
          },
          {
            name: tContent("variants.items.nested"),
            description: stripHtml(tContent("variants.styles.nested")),
            code: codeNested,
            preview: (
              <div
                className="rounded-md border overflow-hidden w-full"
                style={{ minHeight: 240 }}
              >
                <ResizablePanelGroup direction="horizontal">
                  <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
                    <div className="flex h-full items-center justify-center bg-muted p-3 text-xs">
                      {lblSidebar}
                    </div>
                  </ResizablePanel>
                  <ResizableHandle withHandle aria-label={ariaResize} />
                  <ResizablePanel defaultSize={75} minSize={50}>
                    <ResizablePanelGroup direction="vertical">
                      <ResizablePanel defaultSize={70} minSize={30}>
                        <div className="flex h-full items-center justify-center p-3 text-xs">
                          {lblContent}
                        </div>
                      </ResizablePanel>
                      <ResizableHandle withHandle aria-label={ariaResize} />
                      <ResizablePanel defaultSize={30} minSize={15}>
                        <div className="flex h-full items-center justify-center bg-muted/60 p-3 text-xs">
                          Console
                        </div>
                      </ResizablePanel>
                    </ResizablePanelGroup>
                  </ResizablePanel>
                </ResizablePanelGroup>
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
            label: tContent("states.items.hover"),
            trigger: ":hover",
            behavior: stripHtml(tContent("states.descriptions.hover")),
          },
          {
            label: tContent("states.items.dragging"),
            trigger: "data-resize-handle-active",
            behavior: stripHtml(tContent("states.descriptions.dragging")),
          },
          {
            label: tContent("states.items.focus"),
            trigger: ":focus-visible",
            behavior: stripHtml(tContent("states.descriptions.focus")),
          },
          {
            label: tContent("states.items.disabled"),
            trigger: "disabled",
            behavior: stripHtml(tContent("states.descriptions.disabled")),
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
                name: "direction",
                type: tContent("props.table.direction.type"),
                defaultValue: tContent("props.table.direction.default"),
                required: tContent("props.table.direction.required"),
                description: sanitizeHtml(tContent("props.table.direction.description")),
              },
              {
                name: "defaultSize",
                type: tContent("props.table.defaultSize.type"),
                defaultValue: tContent("props.table.defaultSize.default"),
                required: tContent("props.table.defaultSize.required"),
                description: sanitizeHtml(tContent("props.table.defaultSize.description")),
              },
              {
                name: "minSize",
                type: tContent("props.table.minSize.type"),
                defaultValue: tContent("props.table.minSize.default"),
                required: tContent("props.table.minSize.required"),
                description: sanitizeHtml(tContent("props.table.minSize.description")),
              },
              {
                name: "maxSize",
                type: tContent("props.table.maxSize.type"),
                defaultValue: tContent("props.table.maxSize.default"),
                required: tContent("props.table.maxSize.required"),
                description: sanitizeHtml(tContent("props.table.maxSize.description")),
              },
              {
                name: "id",
                type: tContent("props.table.id.type"),
                defaultValue: tContent("props.table.id.default"),
                required: tContent("props.table.id.required"),
                description: sanitizeHtml(tContent("props.table.id.description")),
              },
              {
                name: "withHandle",
                type: tContent("props.table.withHandle.type"),
                defaultValue: tContent("props.table.withHandle.default"),
                required: tContent("props.table.withHandle.required"),
                description: sanitizeHtml(tContent("props.table.withHandle.description")),
              },
              {
                name: "onLayout",
                type: tContent("props.table.onLayout.type"),
                defaultValue: tContent("props.table.onLayout.default"),
                required: tContent("props.table.onLayout.required"),
                description: sanitizeHtml(tContent("props.table.onLayout.description")),
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
          { key: "← / →", description: `${stripHtml(tContent("accessibility.keyboard.arrowLeft"))} · ${stripHtml(tContent("accessibility.keyboard.arrowRight"))}` },
          { key: "↑ / ↓", description: `${stripHtml(tContent("accessibility.keyboard.arrowUp"))} · ${stripHtml(tContent("accessibility.keyboard.arrowDown"))}` },
          { key: "Home", description: stripHtml(tContent("accessibility.keyboard.home")) },
          { key: "End", description: stripHtml(tContent("accessibility.keyboard.end")) },
          { key: "Enter", description: stripHtml(tContent("accessibility.keyboard.enter")) },
        ]}
      />

      {/* ── Relacionados ──────────────────────────────────────────── */}
      <DocsRelated
        title={tContent("related.title")}
        items={[
          {
            name: tContent("related.items.scrollArea.name"),
            description: tContent("related.items.scrollArea.description"),
            path: "?path=/docs/ui-scrollarea--docs",
          },
          {
            name: tContent("related.items.sheet.name"),
            description: tContent("related.items.sheet.description"),
            path: "?path=/docs/ui-sheet--docs",
          },
          {
            name: tContent("related.items.separator.name"),
            description: tContent("related.items.separator.description"),
            path: "?path=/docs/ui-separator--docs",
          },
          {
            name: tContent("related.items.aspectRatio.name"),
            description: tContent("related.items.aspectRatio.description"),
            path: "?path=/docs/ui-aspectratio--docs",
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
            event: "panel_resize",
            trigger: tContent("analytics.table.panel_resize.trigger"),
            payload: tContent("analytics.table.panel_resize.payload"),
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
            { criterion: tContent("testes.accessibility.item4"), level: "4.1.2", how: "DevTools a11y tree" },
            { criterion: tContent("testes.accessibility.item5"), level: "4.1.2", how: "DevTools attribute" },
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

export default ResizableDocs;
