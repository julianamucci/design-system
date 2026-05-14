import { useCallback, useEffect, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { useActiveSection } from "@/lib/use-active-section";
import uiTranslations from "@/i18n/ui.json";
import skeletonTranslations from "@shared/content/skeleton/translations.json";

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

export function SkeletonDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(skeletonTranslations);

  const navGroups = useMemo(() => getNavGroups(tNav), [tNav]);
  const allIds = useMemo(
    () => navGroups.flatMap((g) => g.sections.map((s) => s.id)),
    [navGroups]
  );

  useSeoEffect({
    title: tContent("seo.title"),
    description: tContent("seo.description"),
    locale,
    componentSlug: "skeleton",
  });

  useEffect(() => {
    track("docs_page_view", {
      component_name: "skeleton",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "skeleton",
        locale,
      });
    },
    [locale]
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  // ─── Code strings ───────────────────────────────────────────────────────────

  const codeImport = `import { Skeleton } from "@/components/ui/skeleton";`;

  const codeRectangle = `<Skeleton className="h-20 w-full" aria-hidden="true" />`;
  const codeCircle = `<Skeleton className="h-12 w-12 rounded-full" aria-hidden="true" />`;
  const codeLine = `<Skeleton className="h-4 w-[200px]" aria-hidden="true" />`;

  const interfaceCode = `// Skeleton
interface SkeletonProps extends React.ComponentProps<"div"> {
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
      componentSlug="skeleton"
      header={
        <DocsHeader
          title={tContent("title")}
          description={tContent("description")}
          category={tContent("category")}
          type={tContent("type")}
          installNote="npx shadcn@latest add skeleton"
        />
      }
    >
      {/* ── Demonstração ──────────────────────────────────────────── */}
      <DocsDemonstration title={tContent("demonstration.title")}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
          {/* Card de perfil */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {sanitizeHtml(tContent("demonstration.labels.card"))}
            </p>
            <div
              aria-busy="true"
              aria-label={sanitizeHtml(tContent("demonstration.labels.card"))}
              className="flex items-center gap-4 p-4 border rounded-md"
            >
              <Skeleton
                className="h-12 w-12 rounded-full motion-reduce:animate-none"
                aria-hidden="true"
              />
              <div className="space-y-2 flex-1">
                <Skeleton
                  className="h-4 w-[70%] motion-reduce:animate-none"
                  aria-hidden="true"
                />
                <Skeleton
                  className="h-4 w-[50%] motion-reduce:animate-none"
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>

          {/* Lista */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {sanitizeHtml(tContent("demonstration.labels.list"))}
            </p>
            <div
              aria-busy="true"
              aria-label={sanitizeHtml(tContent("demonstration.labels.list"))}
              className="space-y-3 p-4 border rounded-md"
            >
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton
                    className="h-8 w-8 rounded-md motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                  <div className="flex-1 space-y-1">
                    <Skeleton
                      className="h-3 w-[60%] motion-reduce:animate-none"
                      aria-hidden="true"
                    />
                    <Skeleton
                      className="h-3 w-[40%] motion-reduce:animate-none"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Imagem em AspectRatio */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {sanitizeHtml(tContent("demonstration.labels.image"))}
            </p>
            <div
              aria-busy="true"
              aria-label={sanitizeHtml(tContent("demonstration.labels.image"))}
            >
              <AspectRatio ratio={16 / 9}>
                <Skeleton
                  className="h-full w-full motion-reduce:animate-none"
                  aria-hidden="true"
                />
              </AspectRatio>
            </div>
          </div>

          {/* Parágrafo */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {sanitizeHtml(tContent("demonstration.labels.paragraph"))}
            </p>
            <div
              aria-busy="true"
              aria-label={sanitizeHtml(tContent("demonstration.labels.paragraph"))}
              className="space-y-2 p-4 border rounded-md"
            >
              <Skeleton
                className="h-4 w-full motion-reduce:animate-none"
                aria-hidden="true"
              />
              <Skeleton
                className="h-4 w-[90%] motion-reduce:animate-none"
                aria-hidden="true"
              />
              <Skeleton
                className="h-4 w-[60%] motion-reduce:animate-none"
                aria-hidden="true"
              />
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
              element: tContent("usage.uxWriting.table.ariaLabel.name"),
              rules: tContent("usage.uxWriting.table.ariaLabel.format"),
              do: tContent("usage.uxWriting.table.ariaLabel.good"),
              dont: tContent("usage.uxWriting.table.ariaLabel.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.dimensions.name"),
              rules: tContent("usage.uxWriting.table.dimensions.format"),
              do: tContent("usage.uxWriting.table.dimensions.good"),
              dont: tContent("usage.uxWriting.table.dimensions.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.shape.name"),
              rules: tContent("usage.uxWriting.table.shape.format"),
              do: tContent("usage.uxWriting.table.shape.good"),
              dont: tContent("usage.uxWriting.table.shape.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.motionReduce.name"),
              rules: tContent("usage.uxWriting.table.motionReduce.format"),
              do: tContent("usage.uxWriting.table.motionReduce.good"),
              dont: tContent("usage.uxWriting.table.motionReduce.bad"),
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
                aria-busy="true"
                aria-label="Carregando texto"
                className="w-full space-y-2"
              >
                <Skeleton className="h-4 w-full motion-reduce:animate-none" aria-hidden="true" />
                <Skeleton className="h-4 w-[70%] motion-reduce:animate-none" aria-hidden="true" />
              </div>
            ),
            dontPreview: (
              <div className="w-full">
                <Skeleton className="h-2 w-12 motion-reduce:animate-none" aria-hidden="true" />
              </div>
            ),
            doCaption: sanitizeHtml(tContent("doDont.pair1.do")),
            dontCaption: sanitizeHtml(tContent("doDont.pair1.dont")),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <div
                aria-busy="true"
                aria-label="Carregando avatar e texto"
                className="flex items-center gap-3 w-full"
              >
                <Skeleton className="h-10 w-10 rounded-full motion-reduce:animate-none" aria-hidden="true" />
                <Skeleton className="h-4 w-[160px] motion-reduce:animate-none" aria-hidden="true" />
              </div>
            ),
            dontPreview: (
              <div className="flex items-center gap-3 w-full">
                <Skeleton className="h-10 w-10 rounded-full motion-reduce:animate-none" />
                <Skeleton className="h-4 w-[160px] motion-reduce:animate-none" />
              </div>
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
        componentSlug="skeleton"
        items={[
          {
            name: tContent("variants.items.rectangle"),
            description: stripHtml(tContent("variants.styles.rectangle")),
            code: codeRectangle,
            preview: (
              <div aria-busy="true" aria-label="Carregando bloco" className="w-48">
                <Skeleton className="h-20 w-full motion-reduce:animate-none" aria-hidden="true" />
              </div>
            ),
          },
          {
            name: tContent("variants.items.circle"),
            description: stripHtml(tContent("variants.styles.circle")),
            code: codeCircle,
            preview: (
              <div aria-busy="true" aria-label="Carregando avatar">
                <Skeleton className="h-12 w-12 rounded-full motion-reduce:animate-none" aria-hidden="true" />
              </div>
            ),
          },
          {
            name: tContent("variants.items.line"),
            description: stripHtml(tContent("variants.styles.line")),
            code: codeLine,
            preview: (
              <div aria-busy="true" aria-label="Carregando linha de texto">
                <Skeleton className="h-4 w-[200px] motion-reduce:animate-none" aria-hidden="true" />
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
            label: tContent("states.items.default"),
            trigger: "animate-pulse",
            behavior: stripHtml(tContent("states.descriptions.default")),
          },
          {
            label: tContent("states.items.motionReduced"),
            trigger: "prefers-reduced-motion",
            behavior: stripHtml(tContent("states.descriptions.motionReduced")),
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
                name: "className",
                type: tContent("props.table.className.type"),
                defaultValue: tContent("props.table.className.default"),
                required: tContent("props.table.className.required"),
                description: sanitizeHtml(tContent("props.table.className.description")),
              },
              {
                name: "aria-hidden",
                type: tContent("props.table.ariaHidden.type"),
                defaultValue: tContent("props.table.ariaHidden.default"),
                required: tContent("props.table.ariaHidden.required"),
                description: sanitizeHtml(tContent("props.table.ariaHidden.description")),
              },
              {
                name: "...rest",
                type: tContent("props.table.rest.type"),
                defaultValue: tContent("props.table.rest.default"),
                required: tContent("props.table.rest.required"),
                description: sanitizeHtml(tContent("props.table.rest.description")),
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
            token: "--muted",
            value: tContent("tokens.table.background.class"),
            description: tContent("tokens.table.background.part"),
          },
          {
            token: "--radius",
            value: tContent("tokens.table.rounded.class"),
            description: tContent("tokens.table.rounded.part"),
          },
          {
            token: "animate-pulse",
            value: tContent("tokens.table.animation.class"),
            description: tContent("tokens.table.animation.part"),
          },
          {
            token: "motion-reduce",
            value: tContent("tokens.table.motionReduce.class"),
            description: tContent("tokens.table.motionReduce.part"),
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
        componentSlug="skeleton"
        items={[
          {
            name: tContent("related.items.progress.name"),
            description: tContent("related.items.progress.description"),
            path: "?path=/docs/ui-progress--docs",
          },
          {
            name: tContent("related.items.spinner.name"),
            description: tContent("related.items.spinner.description"),
            path: "?path=/docs/ui-spinner--docs",
          },
          {
            name: tContent("related.items.aspectRatio.name"),
            description: tContent("related.items.aspectRatio.description"),
            path: "?path=/docs/ui-aspectratio--docs",
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
        componentSlug="skeleton"
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
            event: "—",
            trigger: sanitizeHtml(tContent("analytics.description")),
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
            { criterion: tContent("testes.accessibility.item2"), level: "4.1.2", how: "DevTools a11y tree" },
            { criterion: tContent("testes.accessibility.item3"), level: "4.1.2", how: "DevTools a11y tree" },
            { criterion: tContent("testes.accessibility.item4"), level: "2.3.3", how: "prefers-reduced-motion" },
            { criterion: tContent("testes.accessibility.item5"), level: "1.4.11", how: "Contrast checker" },
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
            { story: tContent("testes.visual.item4.story"), priority: tNav(priorityKeyMap[tContent("testes.visual.item4.priority")] ?? "common.high") },
            { story: tContent("testes.visual.item5.story"), priority: tNav(priorityKeyMap[tContent("testes.visual.item5.priority")] ?? "common.medium") },
          ],
        }}
      />
    </DocsPageLayout>
  );
}

export default SkeletonDocs;
