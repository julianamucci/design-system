import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Bold, Italic, Underline,
  LayoutGrid, List, Eye,
} from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import { useActiveSection } from "@/lib/use-active-section";
import uiTranslations from "@/i18n/ui.json";
import toggleGroupTranslations from "@shared/content/toggle-group/translations.json";

import { DocsHeader }        from "@/components/docs/shared/sections/DocsHeader";
import { DocsPageLayout }    from "@/components/docs/shared/sections/DocsPageLayout";
import { DocsDemonstration } from "@/components/docs/shared/sections/DocsDemonstration";
import { DocsAnatomy }       from "@/components/docs/shared/sections/DocsAnatomy";
import { DocsWhenToUse }     from "@/components/docs/shared/sections/DocsWhenToUse";
import { DocsDoDont }        from "@/components/docs/shared/sections/DocsDoDont";
import { DocsImport }        from "@/components/docs/shared/sections/DocsImport";
import { DocsVariants }      from "@/components/docs/shared/sections/DocsVariants";
import { DocsCompositions }  from "@/components/docs/shared/sections/DocsCompositions";
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

export function ToggleGroupDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(toggleGroupTranslations);

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
    componentSlug: "toggle-group",
    aiSummary: tContent("seo.aiSummary"),
    aiEntities: tContent("seo.aiEntities"),
    aiIntent: tContent("seo.aiIntent") as "informational" | "navigational",
    breadcrumb,
  });

  useEffect(() => {
    track("docs_page_view", {
      component_name: "toggle-group",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "toggle-group",
        locale,
      });
    },
    [locale],
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  // ─── Estados controlados para o demo ────────────────────────────────────────

  const [demoAlignment, setDemoAlignment] = useState<string>("left");
  const [demoFormats, setDemoFormats] = useState<string[]>(["bold"]);
  const [demoView, setDemoView] = useState<string>("grid");

  // ─── Code strings ───────────────────────────────────────────────────────────

  const codeImportBasic = `import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";`;
  const codeImportWithIcons = `import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AlignLeft, AlignCenter, AlignRight } from "lucide-react";`;

  const codeSingle = `<ToggleGroup type="single" defaultValue="center" aria-label="Alinhamento do texto">
  <ToggleGroupItem value="left" aria-label="Alinhar à esquerda">
    <AlignLeft aria-hidden="true" />
  </ToggleGroupItem>
  <ToggleGroupItem value="center" aria-label="Centralizar">
    <AlignCenter aria-hidden="true" />
  </ToggleGroupItem>
  <ToggleGroupItem value="right" aria-label="Alinhar à direita">
    <AlignRight aria-hidden="true" />
  </ToggleGroupItem>
</ToggleGroup>`;

  const codeMultiple = `<ToggleGroup type="multiple" defaultValue={["bold", "italic"]} aria-label="Formatação">
  <ToggleGroupItem value="bold" aria-label="Negrito">
    <Bold aria-hidden="true" />
  </ToggleGroupItem>
  <ToggleGroupItem value="italic" aria-label="Itálico">
    <Italic aria-hidden="true" />
  </ToggleGroupItem>
  <ToggleGroupItem value="underline" aria-label="Sublinhado">
    <Underline aria-hidden="true" />
  </ToggleGroupItem>
</ToggleGroup>`;

  const codeVertical = `<ToggleGroup type="single" orientation="vertical" defaultValue="grid" aria-label="Modo de visualização">
  <ToggleGroupItem value="grid" aria-label="Grade">
    <LayoutGrid aria-hidden="true" />
  </ToggleGroupItem>
  <ToggleGroupItem value="list" aria-label="Lista">
    <List aria-hidden="true" />
  </ToggleGroupItem>
</ToggleGroup>`;

  const codeCustomizationTokens = `/* Em globals.css — tokens do ToggleGroup */
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

  const interfaceCode = `function ToggleGroup({
  type,            // "single" | "multiple" — OBRIGATÓRIO
  value,           // string (single) | string[] (multiple)
  defaultValue,
  onValueChange,
  disabled,
  orientation = "horizontal",
  variant = "default",
  size = "default",
  spacing = 0,
  ...props
}: ToggleGroupPrimitive.Props &
  VariantProps<typeof toggleVariants> & {
    spacing?: number;
    orientation?: "horizontal" | "vertical";
  }) {
  // Estende ToggleGroupPrimitive do @base-ui/react/toggle-group
  // Context propaga variant/size/spacing/orientation para os Items
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
          installNote="npx shadcn@latest add toggle-group"
        />
      }
    >
      {/* ── Demonstração ──────────────────────────────────────────── */}
      <DocsDemonstration title={tContent("demonstration.title")}>
        <div className="w-full max-w-md flex flex-col gap-6">
          {/* Single — alinhamento */}
          <div className="flex flex-col gap-2">
            <span className="text-xs text-muted-foreground">
              {tContent("demonstration.labels.alignmentLabel")}
            </span>
            <ToggleGroup
              type="single"
              value={demoAlignment}
              onValueChange={(v: string) => v && setDemoAlignment(v)}
              aria-label={tContent("demonstration.labels.alignmentLabel")}
            >
              <ToggleGroupItem value="left" aria-label={tContent("demonstration.labels.left")}>
                <AlignLeft aria-hidden="true" />
              </ToggleGroupItem>
              <ToggleGroupItem value="center" aria-label={tContent("demonstration.labels.center")}>
                <AlignCenter aria-hidden="true" />
              </ToggleGroupItem>
              <ToggleGroupItem value="right" aria-label={tContent("demonstration.labels.right")}>
                <AlignRight aria-hidden="true" />
              </ToggleGroupItem>
              <ToggleGroupItem value="justify" aria-label={tContent("demonstration.labels.justify")}>
                <AlignJustify aria-hidden="true" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Multiple — formatação */}
          <div className="flex flex-col gap-2">
            <span className="text-xs text-muted-foreground">
              {tContent("demonstration.labels.formattingLabel")}
            </span>
            <ToggleGroup
              type="multiple"
              value={demoFormats}
              onValueChange={(v: string[]) => setDemoFormats(v)}
              aria-label={tContent("demonstration.labels.formattingLabel")}
            >
              <ToggleGroupItem value="bold" aria-label={tContent("demonstration.labels.bold")}>
                <Bold aria-hidden="true" />
              </ToggleGroupItem>
              <ToggleGroupItem value="italic" aria-label={tContent("demonstration.labels.italic")}>
                <Italic aria-hidden="true" />
              </ToggleGroupItem>
              <ToggleGroupItem value="underline" aria-label={tContent("demonstration.labels.underline")}>
                <Underline aria-hidden="true" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Vertical — modos de visualização */}
          <div className="flex flex-col gap-2">
            <span className="text-xs text-muted-foreground">
              {tContent("demonstration.labels.viewLabel")}
            </span>
            <ToggleGroup
              type="single"
              orientation="vertical"
              value={demoView}
              onValueChange={(v: string) => v && setDemoView(v)}
              aria-label={tContent("demonstration.labels.viewLabel")}
            >
              <ToggleGroupItem value="grid" aria-label={tContent("demonstration.labels.grid")}>
                <LayoutGrid aria-hidden="true" />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label={tContent("demonstration.labels.list")}>
                <List aria-hidden="true" />
              </ToggleGroupItem>
            </ToggleGroup>
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
          items: [1, 2, 3, 4, 5].map((i) => ({
            s: tContent(`usage.scenarios.item${i}.s`),
            u: tContent(`usage.scenarios.item${i}.u`),
            a: tContent(`usage.scenarios.item${i}.a`),
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
          items: [
            {
              element: tContent("usage.uxWriting.table.groupLabel.name"),
              rules: tContent("usage.uxWriting.table.groupLabel.format"),
              do: tContent("usage.uxWriting.table.groupLabel.good"),
              dont: tContent("usage.uxWriting.table.groupLabel.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.itemLabel.name"),
              rules: tContent("usage.uxWriting.table.itemLabel.format"),
              do: tContent("usage.uxWriting.table.itemLabel.good"),
              dont: tContent("usage.uxWriting.table.itemLabel.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.order.name"),
              rules: tContent("usage.uxWriting.table.order.format"),
              do: tContent("usage.uxWriting.table.order.good"),
              dont: tContent("usage.uxWriting.table.order.bad"),
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
              <ToggleGroup type="single" defaultValue="center" aria-label="Alinhamento do texto">
                <ToggleGroupItem value="left" aria-label="Alinhar à esquerda">
                  <AlignLeft aria-hidden="true" />
                </ToggleGroupItem>
                <ToggleGroupItem value="center" aria-label="Centralizar">
                  <AlignCenter aria-hidden="true" />
                </ToggleGroupItem>
                <ToggleGroupItem value="right" aria-label="Alinhar à direita">
                  <AlignRight aria-hidden="true" />
                </ToggleGroupItem>
              </ToggleGroup>
            ),
            dontPreview: (
              <div className="flex items-center gap-3">
                {/* anti-padrão: Toggles soltos sem agrupamento ARIA */}
                <button type="button" className="px-2 py-1 border rounded" aria-label="Alinhar à esquerda">
                  <AlignLeft aria-hidden="true" className="size-4" />
                </button>
                <button type="button" className="px-2 py-1 border rounded" aria-label="Centralizar">
                  <AlignCenter aria-hidden="true" className="size-4" />
                </button>
                <button type="button" className="px-2 py-1 border rounded" aria-label="Alinhar à direita">
                  <AlignRight aria-hidden="true" className="size-4" />
                </button>
              </div>
            ),
            doCaption: tContent("doDont.pair1.do"),
            dontCaption: tContent("doDont.pair1.dont"),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <ToggleGroup type="multiple" defaultValue={["bold"]} aria-label="Formatação">
                <ToggleGroupItem value="bold" aria-label="Negrito">
                  <Bold aria-hidden="true" />
                </ToggleGroupItem>
                <ToggleGroupItem value="italic" aria-label="Itálico">
                  <Italic aria-hidden="true" />
                </ToggleGroupItem>
                <ToggleGroupItem value="underline" aria-label="Sublinhado">
                  <Underline aria-hidden="true" />
                </ToggleGroupItem>
              </ToggleGroup>
            ),
            dontPreview: (
              <ToggleGroup type="multiple" defaultValue={["bold"]}>
                {/* anti-padrão: sem aria-label no grupo e items só com letra */}
                <ToggleGroupItem value="bold" aria-label="B">
                  <Bold aria-hidden="true" />
                </ToggleGroupItem>
                <ToggleGroupItem value="italic" aria-label="I">
                  <Italic aria-hidden="true" />
                </ToggleGroupItem>
                <ToggleGroupItem value="underline" aria-label="U">
                  <Underline aria-hidden="true" />
                </ToggleGroupItem>
              </ToggleGroup>
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
        secondaryCode={codeImportWithIcons}
      />

      {/* ── Variantes ─────────────────────────────────────────────── */}
      <DocsVariants
        title={tContent("variants.title")}
        items={[
          {
            name: tContent("variants.items.single"),
            description: stripHtml(tContent("variants.styles.single")),
            code: codeSingle,
            preview: (
              <ToggleGroup type="single" defaultValue="center" aria-label="Alinhamento do texto">
                <ToggleGroupItem value="left" aria-label="Alinhar à esquerda">
                  <AlignLeft aria-hidden="true" />
                </ToggleGroupItem>
                <ToggleGroupItem value="center" aria-label="Centralizar">
                  <AlignCenter aria-hidden="true" />
                </ToggleGroupItem>
                <ToggleGroupItem value="right" aria-label="Alinhar à direita">
                  <AlignRight aria-hidden="true" />
                </ToggleGroupItem>
              </ToggleGroup>
            ),
          },
          {
            name: tContent("variants.items.multiple"),
            description: stripHtml(tContent("variants.styles.multiple")),
            code: codeMultiple,
            preview: (
              <ToggleGroup type="multiple" defaultValue={["bold", "italic"]} aria-label="Formatação">
                <ToggleGroupItem value="bold" aria-label="Negrito">
                  <Bold aria-hidden="true" />
                </ToggleGroupItem>
                <ToggleGroupItem value="italic" aria-label="Itálico">
                  <Italic aria-hidden="true" />
                </ToggleGroupItem>
                <ToggleGroupItem value="underline" aria-label="Sublinhado">
                  <Underline aria-hidden="true" />
                </ToggleGroupItem>
              </ToggleGroup>
            ),
          },
          {
            name: tContent("variants.items.vertical"),
            description: stripHtml(tContent("variants.styles.vertical")),
            code: codeVertical,
            preview: (
              <ToggleGroup
                type="single"
                orientation="vertical"
                defaultValue="grid"
                aria-label="Modo de visualização"
              >
                <ToggleGroupItem value="grid" aria-label="Grade">
                  <LayoutGrid aria-hidden="true" />
                </ToggleGroupItem>
                <ToggleGroupItem value="list" aria-label="Lista">
                  <List aria-hidden="true" />
                </ToggleGroupItem>
              </ToggleGroup>
            ),
          },
        ]}
      />

      {/* ── Composições ───────────────────────────────────────────── */}
      <DocsCompositions
        title={tContent("variants.compositionsTitle")}
        useWhenLabel={tNav("common.useWhen")}
        componentSlug="toggle-group"
        items={[
          {
            name: tContent("variants.compositions.alignmentBar.name"),
            description: tContent("variants.compositions.alignmentBar.description"),
            useWhen: tContent("variants.compositions.alignmentBar.use"),
            code: `<ToggleGroup type="single" variant="outline" defaultValue="left" aria-label="Alinhamento do texto">\n  <ToggleGroupItem value="left" aria-label="Alinhar à esquerda">\n    <AlignLeft aria-hidden="true" />\n  </ToggleGroupItem>\n  <ToggleGroupItem value="center" aria-label="Centralizar">\n    <AlignCenter aria-hidden="true" />\n  </ToggleGroupItem>\n  <ToggleGroupItem value="right" aria-label="Alinhar à direita">\n    <AlignRight aria-hidden="true" />\n  </ToggleGroupItem>\n</ToggleGroup>`,
            preview: (
              <ToggleGroup type="single" variant="outline" defaultValue="left" aria-label="Alinhamento do texto">
                <ToggleGroupItem value="left" aria-label="Alinhar à esquerda">
                  <AlignLeft aria-hidden="true" />
                </ToggleGroupItem>
                <ToggleGroupItem value="center" aria-label="Centralizar">
                  <AlignCenter aria-hidden="true" />
                </ToggleGroupItem>
                <ToggleGroupItem value="right" aria-label="Alinhar à direita">
                  <AlignRight aria-hidden="true" />
                </ToggleGroupItem>
              </ToggleGroup>
            ),
          },
          {
            name: tContent("variants.compositions.formattingBar.name"),
            description: tContent("variants.compositions.formattingBar.description"),
            useWhen: tContent("variants.compositions.formattingBar.use"),
            code: `<ToggleGroup type="multiple" variant="outline" defaultValue={["bold"]} aria-label="Formatação">\n  <ToggleGroupItem value="bold" aria-label="Negrito">\n    <Bold aria-hidden="true" />\n  </ToggleGroupItem>\n  <ToggleGroupItem value="italic" aria-label="Itálico">\n    <Italic aria-hidden="true" />\n  </ToggleGroupItem>\n  <ToggleGroupItem value="underline" aria-label="Sublinhado">\n    <Underline aria-hidden="true" />\n  </ToggleGroupItem>\n</ToggleGroup>`,
            preview: (
              <ToggleGroup type="multiple" variant="outline" defaultValue={["bold"]} aria-label="Formatação">
                <ToggleGroupItem value="bold" aria-label="Negrito">
                  <Bold aria-hidden="true" />
                </ToggleGroupItem>
                <ToggleGroupItem value="italic" aria-label="Itálico">
                  <Italic aria-hidden="true" />
                </ToggleGroupItem>
                <ToggleGroupItem value="underline" aria-label="Sublinhado">
                  <Underline aria-hidden="true" />
                </ToggleGroupItem>
              </ToggleGroup>
            ),
          },
          {
            name: tContent("variants.compositions.viewMode.name"),
            description: tContent("variants.compositions.viewMode.description"),
            useWhen: tContent("variants.compositions.viewMode.use"),
            code: `<ToggleGroup type="single" variant="outline" defaultValue="grid" orientation="vertical" aria-label="Modo de visualização">\n  <ToggleGroupItem value="grid">\n    <LayoutGrid aria-hidden="true" />\n    Grade\n  </ToggleGroupItem>\n  <ToggleGroupItem value="list">\n    <List aria-hidden="true" />\n    Lista\n  </ToggleGroupItem>\n</ToggleGroup>`,
            preview: (
              <ToggleGroup type="single" variant="outline" defaultValue="grid" orientation="vertical" aria-label="Modo de visualização">
                <ToggleGroupItem value="grid">
                  <LayoutGrid aria-hidden="true" />
                  Grade
                </ToggleGroupItem>
                <ToggleGroupItem value="list">
                  <List aria-hidden="true" />
                  Lista
                </ToggleGroupItem>
              </ToggleGroup>
            ),
          },
          {
            name: tContent("variants.compositions.disabledItem.name"),
            description: tContent("variants.compositions.disabledItem.description"),
            useWhen: tContent("variants.compositions.disabledItem.use"),
            code: `<ToggleGroup type="single" variant="outline" defaultValue="left" aria-label="Alinhamento do texto">\n  <ToggleGroupItem value="left" aria-label="Alinhar à esquerda">\n    <AlignLeft aria-hidden="true" />\n  </ToggleGroupItem>\n  <ToggleGroupItem value="center" disabled aria-label="Centralizar (indisponível)">\n    <AlignCenter aria-hidden="true" />\n  </ToggleGroupItem>\n  <ToggleGroupItem value="right" aria-label="Alinhar à direita">\n    <AlignRight aria-hidden="true" />\n  </ToggleGroupItem>\n</ToggleGroup>`,
            preview: (
              <ToggleGroup type="single" variant="outline" defaultValue="left" aria-label="Alinhamento do texto">
                <ToggleGroupItem value="left" aria-label="Alinhar à esquerda">
                  <AlignLeft aria-hidden="true" />
                </ToggleGroupItem>
                <ToggleGroupItem value="center" disabled aria-label="Centralizar (indisponível)">
                  <AlignCenter aria-hidden="true" />
                </ToggleGroupItem>
                <ToggleGroupItem value="right" aria-label="Alinhar à direita">
                  <AlignRight aria-hidden="true" />
                </ToggleGroupItem>
              </ToggleGroup>
            ),
          },
          {
            name: tContent("variants.compositions.filterWithText.name"),
            description: tContent("variants.compositions.filterWithText.description"),
            useWhen: tContent("variants.compositions.filterWithText.use"),
            code: `<div className="flex flex-col gap-2 w-72">\n  <p className="text-sm font-medium">Filtros de exibição</p>\n  <ToggleGroup type="multiple" variant="outline" defaultValue={["compact"]} aria-label="Filtros de exibição">\n    <ToggleGroupItem value="hidden">\n      <Eye aria-hidden="true" />\n      Ocultos\n    </ToggleGroupItem>\n    <ToggleGroupItem value="compact">\n      <List aria-hidden="true" />\n      Compacto\n    </ToggleGroupItem>\n  </ToggleGroup>\n</div>`,
            preview: (
              <div className="flex flex-col gap-2 w-72">
                <p className="text-sm font-medium">Filtros de exibição</p>
                <ToggleGroup type="multiple" variant="outline" defaultValue={["compact"]} aria-label="Filtros de exibição">
                  <ToggleGroupItem value="hidden">
                    <Eye aria-hidden="true" />
                    Ocultos
                  </ToggleGroupItem>
                  <ToggleGroupItem value="compact">
                    <List aria-hidden="true" />
                    Compacto
                  </ToggleGroupItem>
                </ToggleGroup>
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
            label: tContent("states.items.default"),
            trigger: "—",
            behavior: stripHtml(tContent("states.descriptions.default")),
          },
          {
            label: tContent("states.items.selected"),
            trigger: "click / Space / Enter",
            behavior: stripHtml(tContent("states.descriptions.selected")),
          },
          {
            label: tContent("states.items.hover"),
            trigger: "pointer over",
            behavior: stripHtml(tContent("states.descriptions.hover")),
          },
          {
            label: tContent("states.items.focus"),
            trigger: "Tab + setas",
            behavior: stripHtml(tContent("states.descriptions.focus")),
          },
          {
            label: tContent("states.items.disabled"),
            trigger: "disabled prop",
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
                name: "type",
                type: tContent("props.table.type_prop.type"),
                defaultValue: tContent("props.table.type_prop.default"),
                required: tContent("props.table.type_prop.required"),
                description: stripHtml(tContent("props.table.type_prop.description")),
              },
              {
                name: "value",
                type: tContent("props.table.value.type"),
                defaultValue: tContent("props.table.value.default"),
                required: tContent("props.table.value.required"),
                description: stripHtml(tContent("props.table.value.description")),
              },
              {
                name: "defaultValue",
                type: tContent("props.table.defaultValue.type"),
                defaultValue: tContent("props.table.defaultValue.default"),
                required: tContent("props.table.defaultValue.required"),
                description: stripHtml(tContent("props.table.defaultValue.description")),
              },
              {
                name: "onValueChange",
                type: tContent("props.table.onValueChange.type"),
                defaultValue: tContent("props.table.onValueChange.default"),
                required: tContent("props.table.onValueChange.required"),
                description: stripHtml(tContent("props.table.onValueChange.description")),
              },
              {
                name: "disabled",
                type: tContent("props.table.disabled.type"),
                defaultValue: tContent("props.table.disabled.default"),
                required: tContent("props.table.disabled.required"),
                description: stripHtml(tContent("props.table.disabled.description")),
              },
              {
                name: "orientation",
                type: tContent("props.table.orientation.type"),
                defaultValue: tContent("props.table.orientation.default"),
                required: tContent("props.table.orientation.required"),
                description: stripHtml(tContent("props.table.orientation.description")),
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
                name: "spacing",
                type: tContent("props.table.spacing.type"),
                defaultValue: tContent("props.table.spacing.default"),
                required: tContent("props.table.spacing.required"),
                description: stripHtml(tContent("props.table.spacing.description")),
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
          { token: "--muted",         value: tContent("tokens.table.muted.class"),       description: tContent("tokens.table.muted.part") },
          { token: "--foreground",    value: tContent("tokens.table.foreground.class"),  description: tContent("tokens.table.foreground.part") },
          { token: "--input",         value: tContent("tokens.table.input.class"),       description: tContent("tokens.table.input.part") },
          { token: "--ring",          value: tContent("tokens.table.ring.class"),        description: tContent("tokens.table.ring.part") },
          { token: "--destructive",   value: tContent("tokens.table.destructive.class"), description: tContent("tokens.table.destructive.part") },
          { token: "--radius-button", value: tContent("tokens.table.radius.class"),      description: tContent("tokens.table.radius.part") },
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
          { key: "Tab",         description: tContent("accessibility.keyboard.tab") },
          { key: "ArrowRight",  description: tContent("accessibility.keyboard.arrowRight") },
          { key: "ArrowLeft",   description: tContent("accessibility.keyboard.arrowLeft") },
          { key: "ArrowDown",   description: tContent("accessibility.keyboard.arrowDown") },
          { key: "ArrowUp",     description: tContent("accessibility.keyboard.arrowUp") },
          { key: "Home",        description: tContent("accessibility.keyboard.home") },
          { key: "End",         description: tContent("accessibility.keyboard.end") },
          { key: "Space",       description: tContent("accessibility.keyboard.space") },
          { key: "Enter",       description: tContent("accessibility.keyboard.enter") },
        ]}
      />

      {/* ── Relacionados ──────────────────────────────────────────── */}
      <DocsRelated
        title={tContent("related.title")}
        items={[
          {
            name: tContent("related.items.toggle.name"),
            description: tContent("related.items.toggle.description"),
            path: "?path=/docs/ui-toggle--docs",
          },
          {
            name: tContent("related.items.tabs.name"),
            description: tContent("related.items.tabs.description"),
            path: "?path=/docs/ui-tabs--docs",
          },
          {
            name: tContent("related.items.radioGroup.name"),
            description: tContent("related.items.radioGroup.description"),
            path: "?path=/docs/ui-radiogroup--docs",
          },
          {
            name: tContent("related.items.checkbox.name"),
            description: tContent("related.items.checkbox.description"),
            path: "?path=/docs/ui-checkbox--docs",
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
            payload: '{ component_name: "toggle-group", locale, page_title }',
          },
          {
            event: "docs_section_viewed",
            trigger: tNav("common.sectionViewed") || "Seção entra no viewport",
            payload: '{ section_id, component_name: "toggle-group", locale }',
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
          items: [1, 2, 3, 4, 5].map((i) => ({
            story: tContent(`testes.visual.item${i}.story`),
            priority: tNav(priorityKeyMap[tContent(`testes.visual.item${i}.priority`)] ?? "common.high"),
          })),
        }}
      />
    </DocsPageLayout>
  );
}
