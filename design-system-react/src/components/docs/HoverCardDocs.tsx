import { useCallback, useEffect, useMemo } from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { useActiveSection } from "@/lib/use-active-section";
import uiTranslations from "@/i18n/ui.json";
import hoverCardTranslations from "@shared/content/hover-card/translations.json";

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

export function HoverCardDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(hoverCardTranslations);

  const navGroups = useMemo(() => getNavGroups(tNav), [tNav]);
  const allIds = useMemo(
    () => navGroups.flatMap((g) => g.sections.map((s) => s.id)),
    [navGroups]
  );

  useSeoEffect({
    title: tContent("seo.title"),
    description: tContent("seo.description"),
    locale,
    componentSlug: "hover-card",
    aiSummary: tContent("seo.aiSummary"),
    aiEntities: tContent("seo.aiEntities"),
    aiIntent: tContent("seo.aiIntent") as "informational" | "navigational",
    breadcrumb: [
      { name: "Components", item: "/components" },
      { name: tContent("category"), item: "/components/overlay" },
      { name: tContent("title") },
    ],
  });

  useEffect(() => {
    track("docs_page_view", {
      component_name: "hover-card",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "hover-card",
        locale,
      });
    },
    [locale]
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  // ─── Code strings ───────────────────────────────────────────────────────────

  const codeImport = `import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";`;

  const structureCode = tContent("anatomy.structureCode");

  const codeDefault = `<HoverCard>
  <HoverCardTrigger asChild>
    <a href="/users/joana">@joana</a>
  </HoverCardTrigger>
  <HoverCardContent>
    {/* conteúdo */}
  </HoverCardContent>
</HoverCard>`;

  const codeWithDelay = `<HoverCard openDelay={500} closeDelay={200}>
  <HoverCardTrigger asChild>
    <a href="/link">@joana</a>
  </HoverCardTrigger>
  <HoverCardContent>...</HoverCardContent>
</HoverCard>`;

  const interfaceCode = `// HoverCard (base-ui/preview-card)
interface HoverCardProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  openDelay?: number;   // default 700ms
  closeDelay?: number;  // default 300ms
}

interface HoverCardContentProps {
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  alignOffset?: number;
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
      componentSlug="hover-card"
      header={
        <DocsHeader
          title={tContent("title")}
          description={tContent("description")}
          category={tContent("category")}
          type={tContent("type")}
          installNote="npx shadcn@latest add hover-card"
        />
      }
    >
      {/* ── Demonstração ──────────────────────────────────────────── */}
      <DocsDemonstration title={tContent("demonstration.title")}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
          {/* Profile preview */}
          <div
            className="space-y-2"
            style={{ contain: "layout", minHeight: 100, position: "relative" }}
          >
            <p className="text-xs font-medium text-muted-foreground">
              {sanitizeHtml(tContent("demonstration.labels.userProfile"))}
            </p>
            <HoverCard openDelay={50} closeDelay={50} defaultOpen>
              <HoverCardTrigger asChild>
                <a href="#joana" className="text-primary underline-offset-4 hover:underline">
                  @joana
                </a>
              </HoverCardTrigger>
              <HoverCardContent>
                <div className="flex gap-3">
                  <Avatar>
                    <AvatarImage src="" alt="" />
                    <AvatarFallback>JS</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <p className="font-medium text-sm">Joana Silva</p>
                    <p className="text-xs text-muted-foreground">Designer · 142 seguidores</p>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          </div>

          {/* Link preview */}
          <div
            className="space-y-2"
            style={{ contain: "layout", minHeight: 100, position: "relative" }}
          >
            <p className="text-xs font-medium text-muted-foreground">
              {sanitizeHtml(tContent("demonstration.labels.linkPreview"))}
            </p>
            <HoverCard openDelay={50} closeDelay={50} defaultOpen>
              <HoverCardTrigger asChild>
                <a href="#link" className="text-primary underline-offset-4 hover:underline">
                  design-system.dev
                </a>
              </HoverCardTrigger>
              <HoverCardContent>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-muted">D</span>
                    <span>design-system.dev</span>
                  </div>
                  <p className="font-medium">Guia de overlays acessíveis</p>
                </div>
              </HoverCardContent>
            </HoverCard>
          </div>

          {/* Definition */}
          <div
            className="space-y-2"
            style={{ contain: "layout", minHeight: 100, position: "relative" }}
          >
            <p className="text-xs font-medium text-muted-foreground">
              {sanitizeHtml(tContent("demonstration.labels.definitionTooltip"))}
            </p>
            <HoverCard openDelay={50} closeDelay={50} defaultOpen>
              <HoverCardTrigger asChild>
                <a href="#wcag" className="text-primary underline-offset-4 hover:underline">
                  WCAG 2.1
                </a>
              </HoverCardTrigger>
              <HoverCardContent>
                <p className="font-medium text-sm">WCAG 2.1</p>
                <p className="text-xs text-muted-foreground">
                  Web Content Accessibility Guidelines: padrão internacional de acessibilidade.
                </p>
              </HoverCardContent>
            </HoverCard>
          </div>

          {/* Metric */}
          <div
            className="space-y-2"
            style={{ contain: "layout", minHeight: 100, position: "relative" }}
          >
            <p className="text-xs font-medium text-muted-foreground">
              {sanitizeHtml(tContent("demonstration.labels.metricExplainer"))}
            </p>
            <HoverCard openDelay={50} closeDelay={50} defaultOpen>
              <HoverCardTrigger asChild>
                <a href="#metric" className="text-primary underline-offset-4 hover:underline">
                  3,42%
                </a>
              </HoverCardTrigger>
              <HoverCardContent>
                <p className="text-xs text-muted-foreground">Conversão (últimos 30d)</p>
                <p className="text-2xl font-semibold">3,42%</p>
                <p className="text-xs text-muted-foreground">
                  Cliques no CTA / usuários únicos.
                </p>
              </HoverCardContent>
            </HoverCard>
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
              element: tContent("usage.uxWriting.table.trigger.name"),
              rules: tContent("usage.uxWriting.table.trigger.format"),
              do: tContent("usage.uxWriting.table.trigger.good"),
              dont: tContent("usage.uxWriting.table.trigger.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.content.name"),
              rules: tContent("usage.uxWriting.table.content.format"),
              do: tContent("usage.uxWriting.table.content.good"),
              dont: tContent("usage.uxWriting.table.content.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.delay.name"),
              rules: tContent("usage.uxWriting.table.delay.format"),
              do: tContent("usage.uxWriting.table.delay.good"),
              dont: tContent("usage.uxWriting.table.delay.bad"),
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
              <div className="text-sm space-y-1">
                <div className="text-primary underline">@joana</div>
                <div className="text-xs text-muted-foreground">+ link para /users/joana</div>
              </div>
            ),
            dontPreview: (
              <div className="text-sm">
                <div className="text-primary underline">@joana</div>
                <div className="text-xs text-muted-foreground italic">apenas hover (touch users perdem)</div>
              </div>
            ),
            doCaption: sanitizeHtml(tContent("doDont.pair1.do")),
            dontCaption: sanitizeHtml(tContent("doDont.pair1.dont")),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <div className="text-sm font-mono">openDelay={`{500}`}</div>
            ),
            dontPreview: (
              <div className="text-sm font-mono">openDelay={`{0}`}</div>
            ),
            doCaption: sanitizeHtml(tContent("doDont.pair2.do")),
            dontCaption: sanitizeHtml(tContent("doDont.pair2.dont")),
          },
        ]}
      />

      {/* ── Importação ────────────────────────────────────────────── */}
      <DocsImport title={tContent("import.title")} code={codeImport} />

      {/* ── Variantes ─────────────────────────────────────────────── */}
      <DocsVariants
        title={tContent("variants.title")}
        componentSlug="hover-card"
        items={[
          {
            name: tContent("variants.items.default"),
            description: stripHtml(tContent("variants.styles.default")),
            code: codeDefault,
            preview: (
              <div className="text-xs font-mono text-muted-foreground">
                openDelay=700 / closeDelay=300
              </div>
            ),
          },
          {
            name: tContent("variants.items.withDelay"),
            description: stripHtml(tContent("variants.styles.withDelay")),
            code: codeWithDelay,
            preview: (
              <div className="text-xs font-mono text-muted-foreground">
                openDelay=500 / closeDelay=200
              </div>
            ),
          },
        ]}
      />

      {/* ── Composições ───────────────────────────────────────────── */}
      <DocsCompositions
        title={tContent("variants.compositionsTitle")}
        useWhenLabel={tNav("common.useWhen")}
        componentSlug="hover-card"
        items={[
          {
            name: tContent("variants.compositions.userProfile.name"),
            description: tContent("variants.compositions.userProfile.description"),
            useWhen: tContent("variants.compositions.userProfile.use"),
            code: `<HoverCard openDelay={500} closeDelay={200}>
  <HoverCardTrigger asChild>
    <a href="/users/joana">@joana</a>
  </HoverCardTrigger>
  <HoverCardContent>
    <div className="flex gap-3">
      <Avatar>
        <AvatarImage src="/joana.jpg" alt="" />
        <AvatarFallback>JS</AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <p className="font-medium text-sm">Joana Silva</p>
        <p className="text-xs text-muted-foreground">Designer · 142 seguidores</p>
      </div>
    </div>
  </HoverCardContent>
</HoverCard>`,
            preview: (
              <div style={{ contain: "layout", minHeight: 140, position: "relative" }}>
                <HoverCard openDelay={50} closeDelay={50} defaultOpen>
                  <HoverCardTrigger asChild>
                    <a href="#joana" className="text-primary underline-offset-4 hover:underline">@joana</a>
                  </HoverCardTrigger>
                  <HoverCardContent>
                    <div className="flex gap-3">
                      <Avatar>
                        <AvatarImage src="" alt="" />
                        <AvatarFallback>JS</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <p className="font-medium text-sm">Joana Silva</p>
                        <p className="text-xs text-muted-foreground">Designer · 142 seguidores</p>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </div>
            ),
          },
          {
            name: tContent("variants.compositions.linkPreview.name"),
            description: tContent("variants.compositions.linkPreview.description"),
            useWhen: tContent("variants.compositions.linkPreview.use"),
            code: `<HoverCard openDelay={500} closeDelay={200}>
  <HoverCardTrigger asChild>
    <a href="https://design-system.dev">design-system.dev</a>
  </HoverCardTrigger>
  <HoverCardContent>
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-muted">D</span>
        <span>design-system.dev</span>
      </div>
      <p className="font-medium">Guia de overlays acessíveis</p>
    </div>
  </HoverCardContent>
</HoverCard>`,
            preview: (
              <div style={{ contain: "layout", minHeight: 140, position: "relative" }}>
                <HoverCard openDelay={50} closeDelay={50} defaultOpen>
                  <HoverCardTrigger asChild>
                    <a href="#link" className="text-primary underline-offset-4 hover:underline">design-system.dev</a>
                  </HoverCardTrigger>
                  <HoverCardContent>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-muted">D</span>
                        <span>design-system.dev</span>
                      </div>
                      <p className="font-medium">Guia de overlays acessíveis</p>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </div>
            ),
          },
          {
            name: tContent("variants.compositions.definitionTooltip.name"),
            description: tContent("variants.compositions.definitionTooltip.description"),
            useWhen: tContent("variants.compositions.definitionTooltip.use"),
            code: `<HoverCard openDelay={400} closeDelay={150}>
  <HoverCardTrigger asChild>
    <button type="button" className="underline decoration-dotted underline-offset-4">
      WCAG 2.1 AA
    </button>
  </HoverCardTrigger>
  <HoverCardContent>
    <p className="font-medium text-sm">WCAG 2.1 AA</p>
    <p className="text-xs text-muted-foreground">
      Web Content Accessibility Guidelines 2.1 — nível AA.
    </p>
  </HoverCardContent>
</HoverCard>`,
            preview: (
              <div style={{ contain: "layout", minHeight: 140, position: "relative" }}>
                <HoverCard openDelay={50} closeDelay={50} defaultOpen>
                  <HoverCardTrigger asChild>
                    <button
                      type="button"
                      className="bg-transparent border-0 p-0 text-primary text-sm font-medium underline decoration-dotted underline-offset-4 cursor-help"
                    >
                      WCAG 2.1 AA
                    </button>
                  </HoverCardTrigger>
                  <HoverCardContent>
                    <p className="font-medium text-sm">WCAG 2.1 AA</p>
                    <p className="text-xs text-muted-foreground">
                      Web Content Accessibility Guidelines 2.1 — nível AA. Contraste mínimo 4.5:1 e operação por teclado.
                    </p>
                  </HoverCardContent>
                </HoverCard>
              </div>
            ),
          },
          {
            name: tContent("variants.compositions.metricExplainer.name"),
            description: tContent("variants.compositions.metricExplainer.description"),
            useWhen: tContent("variants.compositions.metricExplainer.use"),
            code: `<HoverCard openDelay={400} closeDelay={150}>
  <HoverCardTrigger asChild>
    <button type="button" className="underline decoration-dotted underline-offset-4">
      LCP 1.8s
    </button>
  </HoverCardTrigger>
  <HoverCardContent>
    <div className="flex items-baseline justify-between gap-2">
      <p className="text-sm font-medium">Largest Contentful Paint</p>
      <span className="text-xs font-medium text-emerald-600">1.8s</span>
    </div>
    <p className="text-xs text-muted-foreground">
      Tempo até o maior elemento visível. Bom: &lt;2.5s · Ruim: &gt;4s.
    </p>
  </HoverCardContent>
</HoverCard>`,
            preview: (
              <div style={{ contain: "layout", minHeight: 140, position: "relative" }}>
                <HoverCard openDelay={50} closeDelay={50} defaultOpen>
                  <HoverCardTrigger asChild>
                    <button
                      type="button"
                      className="bg-transparent border-0 p-0 text-primary text-sm font-medium underline decoration-dotted underline-offset-4 cursor-help"
                    >
                      LCP 1.8s
                    </button>
                  </HoverCardTrigger>
                  <HoverCardContent>
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-medium">Largest Contentful Paint</p>
                      <span className="text-xs font-medium text-emerald-600">1.8s</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Tempo até o maior elemento visível ser renderizado. Bom: &lt;2.5s · Ruim: &gt;4s.
                    </p>
                  </HoverCardContent>
                </HoverCard>
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
            label: tContent("states.items.closed"),
            trigger: "defaultOpen={false}",
            behavior: stripHtml(tContent("states.descriptions.closed")),
          },
          {
            label: tContent("states.items.open"),
            trigger: "defaultOpen={true}",
            behavior: stripHtml(tContent("states.descriptions.open")),
          },
          {
            label: tContent("states.items.controlled"),
            trigger: "open + onOpenChange",
            behavior: stripHtml(tContent("states.descriptions.controlled")),
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
                name: "open",
                type: tContent("props.table.open.type"),
                defaultValue: tContent("props.table.open.default"),
                required: tContent("props.table.open.required"),
                description: sanitizeHtml(tContent("props.table.open.description")),
              },
              {
                name: "onOpenChange",
                type: tContent("props.table.onOpenChange.type"),
                defaultValue: tContent("props.table.onOpenChange.default"),
                required: tContent("props.table.onOpenChange.required"),
                description: sanitizeHtml(tContent("props.table.onOpenChange.description")),
              },
              {
                name: "defaultOpen",
                type: tContent("props.table.defaultOpen.type"),
                defaultValue: tContent("props.table.defaultOpen.default"),
                required: tContent("props.table.defaultOpen.required"),
                description: sanitizeHtml(tContent("props.table.defaultOpen.description")),
              },
              {
                name: "openDelay",
                type: tContent("props.table.openDelay.type"),
                defaultValue: tContent("props.table.openDelay.default"),
                required: tContent("props.table.openDelay.required"),
                description: sanitizeHtml(tContent("props.table.openDelay.description")),
              },
              {
                name: "closeDelay",
                type: tContent("props.table.closeDelay.type"),
                defaultValue: tContent("props.table.closeDelay.default"),
                required: tContent("props.table.closeDelay.required"),
                description: sanitizeHtml(tContent("props.table.closeDelay.description")),
              },
              {
                name: "side",
                type: tContent("props.table.side.type"),
                defaultValue: tContent("props.table.side.default"),
                required: tContent("props.table.side.required"),
                description: sanitizeHtml(tContent("props.table.side.description")),
              },
              {
                name: "align",
                type: tContent("props.table.align.type"),
                defaultValue: tContent("props.table.align.default"),
                required: tContent("props.table.align.required"),
                description: sanitizeHtml(tContent("props.table.align.description")),
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
            token: "--popover",
            value: tContent("tokens.table.background.class"),
            description: tContent("tokens.table.background.part"),
          },
          {
            token: "--popover-foreground",
            value: tContent("tokens.table.foreground.class"),
            description: tContent("tokens.table.foreground.part"),
          },
          {
            token: "--foreground/10",
            value: tContent("tokens.table.border.class"),
            description: tContent("tokens.table.border.part"),
          },
          {
            token: "shadow",
            value: tContent("tokens.table.shadow.class"),
            description: tContent("tokens.table.shadow.part"),
          },
          {
            token: "--radius",
            value: tContent("tokens.table.rounded.class"),
            description: tContent("tokens.table.rounded.part"),
          },
          {
            token: "spacing",
            value: tContent("tokens.table.padding.class"),
            description: tContent("tokens.table.padding.part"),
          },
          {
            token: "size",
            value: tContent("tokens.table.width.class"),
            description: tContent("tokens.table.width.part"),
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
          { key: "Esc", description: stripHtml(tContent("accessibility.keyboard.escape")) },
          { key: "Shift+Tab", description: stripHtml(tContent("accessibility.keyboard.shiftTab")) },
          { key: "Enter", description: stripHtml(tContent("accessibility.keyboard.enter")) },
        ]}
      />

      {/* ── Relacionados ──────────────────────────────────────────── */}
      <DocsRelated
        title={tContent("related.title")}
        componentSlug="hover-card"
        items={[
          {
            name: tContent("related.items.tooltip.name"),
            description: tContent("related.items.tooltip.description"),
            path: "?path=/docs/ui-tooltip--docs",
          },
          {
            name: tContent("related.items.popover.name"),
            description: tContent("related.items.popover.description"),
            path: "?path=/docs/ui-popover--docs",
          },
          {
            name: tContent("related.items.dropdownMenu.name"),
            description: tContent("related.items.dropdownMenu.description"),
            path: "?path=/docs/ui-dropdownmenu--docs",
          },
          {
            name: tContent("related.items.card.name"),
            description: tContent("related.items.card.description"),
            path: "?path=/docs/ui-card--docs",
          },
        ]}
      />

      {/* ── Notas ─────────────────────────────────────────────────── */}
      <DocsNotes
        title={tContent("notes.title")}
        componentSlug="hover-card"
        items={[
          { title: "", content: tContent("notes.item1") },
          { title: "", content: tContent("notes.item2") },
          { title: "", content: tContent("notes.item3") },
          { title: "", content: tContent("notes.item4") },
          { title: "", content: tContent("notes.item5") },
        ]}
      />

      {/* ── Analytics ─────────────────────────────────────────────── */}
      <DocsAnalytics
        title={tContent("analytics.title")}
        cols={analyticsCols}
        items={[
          {
            event: "hover_card_open / hover_card_close",
            trigger: sanitizeHtml(tContent("analytics.description")),
            payload: "component, location, label",
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
              priority: tNav(priorityKeyMap[tContent("testes.functional.item5.priority")] ?? "common.high"),
            },
            {
              action: tContent("testes.functional.item6.action"),
              result: tContent("testes.functional.item6.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item6.priority")] ?? "common.medium"),
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
            { criterion: tContent("testes.accessibility.item2"), level: "4.1.2", how: "DevTools a11y tree" },
            { criterion: tContent("testes.accessibility.item3"), level: "1.4.13", how: "Keyboard test" },
            { criterion: tContent("testes.accessibility.item4"), level: "1.4.13", how: "Keyboard test" },
            { criterion: tContent("testes.accessibility.item5"), level: "1.4.3", how: "Contrast checker" },
            { criterion: tContent("testes.accessibility.item6"), level: "AA", how: "Manual review" },
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
            { story: tContent("testes.visual.item3.story"), priority: tNav(priorityKeyMap[tContent("testes.visual.item3.priority")] ?? "common.medium") },
            { story: tContent("testes.visual.item4.story"), priority: tNav(priorityKeyMap[tContent("testes.visual.item4.priority")] ?? "common.medium") },
            { story: tContent("testes.visual.item5.story"), priority: tNav(priorityKeyMap[tContent("testes.visual.item5.priority")] ?? "common.medium") },
          ],
        }}
      />
    </DocsPageLayout>
  );
}

export default HoverCardDocs;
