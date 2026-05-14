import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Progress,
  ProgressLabel,
  ProgressTrack,
  ProgressIndicator,
  ProgressValue,
} from "@/components/ui/progress";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import { useActiveSection } from "@/lib/use-active-section";
import uiTranslations from "@/i18n/ui.json";
import progressTranslations from "@shared/content/progress/translations.json";

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


// ─── Animated demo (incremental value) ───────────────────────────────────────

function useAnimatedProgress(intervalMs: number = 500, step: number = 5) {
  const [value, setValue] = useState<number>(0);
  useEffect(() => {
    const id = setInterval(() => {
      setValue((v) => (v >= 100 ? 0 : v + step));
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, step]);
  return value;
}

// ─── Componente principal ────────────────────────────────────────────────────

export function ProgressDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(progressTranslations);

  const navGroups = useMemo(() => getNavGroups(tNav), [tNav]);
  const allIds = useMemo(
    () => navGroups.flatMap((g) => g.sections.map((s) => s.id)),
    [navGroups]
  );

  useSeoEffect({
    title: tContent("seo.title"),
    description: tContent("seo.description"),
    locale,
    componentSlug: "progress",
    aiSummary: tContent("seo.aiSummary"),
    aiEntities: tContent("seo.aiEntities"),
    aiIntent: tContent("seo.aiIntent") as "informational" | "navigational",
    breadcrumb: [
      { name: "Components", item: "/components" },
      { name: tContent("category"), item: "/components/feedback" },
      { name: tContent("title") },
    ],
  });

  useEffect(() => {
    track("docs_page_view", {
      component_name: "progress",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "progress",
        locale,
      });
    },
    [locale]
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  // Animated values for demonstration
  const uploadValue = useAnimatedProgress(500, 5);
  const loadingValue = useAnimatedProgress(700, 10);

  // ─── Code strings ──────────────────────────────────────────────────────────

  const codeImport = `import {
  Progress,
  ProgressLabel,
  ProgressTrack,
  ProgressIndicator,
  ProgressValue,
} from "@/components/ui/progress";`;

  const codeDeterminate = `<Progress value={42} aria-label="Progresso do upload" />`;

  const codeIndeterminate = `<Progress
  value={null}
  aria-label="Processando dados"
  className="[&>div]:animate-indeterminate"
/>`;

  const codeWithLabel = `<Progress value={42} aria-label="Enviando arquivo">
  <ProgressLabel>Enviando arquivo</ProgressLabel>
  <ProgressValue />
  <ProgressTrack>
    <ProgressIndicator />
  </ProgressTrack>
</Progress>`;

  const interfaceCode = `// Progress (root)
interface ProgressProps extends Progress.Root.Props {
  value?: number | null;
  max?: number;
  min?: number;
  getAriaValueText?: (value: number) => string;
  className?: string;
  "aria-label": string;
}`;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <DocsPageLayout
      navGroups={navGroups}
      activeSection={activeId}
      componentSlug="progress"
      header={
        <DocsHeader
          title={tContent("title")}
          description={tContent("description")}
          category={tContent("category")}
          type={tContent("type")}
          installNote="npx shadcn@latest add progress"
        />
      }
    >
      {/* ── Demonstração ──────────────────────────────────────────── */}
      <DocsDemonstration title={tContent("demonstration.title")}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
          {/* Upload animado com label e valor */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {tContent("demonstration.labels.upload")}
            </p>
            <div className="p-4 border rounded-md">
              <Progress
                value={uploadValue}
                aria-label={tContent("demonstration.labels.upload")}
              >
                <ProgressLabel>
                  {tContent("demonstration.labels.upload")}
                </ProgressLabel>
                <ProgressValue />
                <ProgressTrack>
                  <ProgressIndicator />
                </ProgressTrack>
              </Progress>
            </div>
          </div>

          {/* Loading animado simples */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {tContent("demonstration.labels.loading")}
            </p>
            <div className="p-4 border rounded-md">
              <Progress
                value={loadingValue}
                aria-label={tContent("demonstration.labels.loading")}
              />
            </div>
          </div>

          {/* Completo */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {tContent("demonstration.labels.complete")}
            </p>
            <div className="p-4 border rounded-md">
              <Progress
                value={100}
                aria-label={tContent("demonstration.labels.complete")}
                className="[&>div]:bg-success"
              />
            </div>
          </div>

          {/* Indeterminate */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {tContent("demonstration.labels.indeterminate")}
            </p>
            <div className="p-4 border rounded-md">
              <Progress
                value={null}
                aria-label={tContent("demonstration.labels.indeterminate")}
                className="[&>div]:animate-indeterminate"
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
              element: tContent("usage.uxWriting.table.label.name"),
              rules: tContent("usage.uxWriting.table.label.format"),
              do: tContent("usage.uxWriting.table.label.good"),
              dont: tContent("usage.uxWriting.table.label.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.value.name"),
              rules: tContent("usage.uxWriting.table.value.format"),
              do: tContent("usage.uxWriting.table.value.good"),
              dont: tContent("usage.uxWriting.table.value.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.ariaLabel.name"),
              rules: tContent("usage.uxWriting.table.ariaLabel.format"),
              do: tContent("usage.uxWriting.table.ariaLabel.good"),
              dont: tContent("usage.uxWriting.table.ariaLabel.bad"),
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
            stripHtml(tContent("usage.dont.item1")),
            stripHtml(tContent("usage.dont.item2")),
            tContent("usage.dont.item3"),
            stripHtml(tContent("usage.dont.item4")),
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
              <div className="w-full">
                <Progress value={42} aria-label="Progresso do upload" />
              </div>
            ),
            dontPreview: (
              <div className="w-full">
                <Progress value={42} aria-label="Barra" />
              </div>
            ),
            doCaption: tContent("doDont.pair1.do"),
            dontCaption: tContent("doDont.pair1.dont"),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <div className="w-full space-y-2">
                <p className="text-sm text-muted-foreground" aria-live="polite">
                  50%
                </p>
                <Progress value={50} aria-label="Progresso do upload" />
              </div>
            ),
            dontPreview: (
              <div className="w-full space-y-2">
                <p className="text-sm text-muted-foreground" aria-live="assertive">
                  51%
                </p>
                <Progress value={51} aria-label="Progresso do upload" />
              </div>
            ),
            doCaption: tContent("doDont.pair2.do"),
            dontCaption: tContent("doDont.pair2.dont"),
          },
        ]}
      />

      {/* ── Importação ────────────────────────────────────────────── */}
      <DocsImport title={tContent("import.title")} code={codeImport} />

      {/* ── Variantes ─────────────────────────────────────────────── */}
      <DocsVariants
        title={tContent("variants.title")}
        componentSlug="progress"
        items={[
          {
            name: tContent("variants.items.determinate"),
            description: stripHtml(tContent("variants.styles.determinate")),
            code: codeDeterminate,
            preview: (
              <div className="w-full">
                <Progress value={42} aria-label="Progresso do upload" />
              </div>
            ),
          },
          {
            name: tContent("variants.items.indeterminate"),
            description: stripHtml(tContent("variants.styles.indeterminate")),
            code: codeIndeterminate,
            preview: (
              <div className="w-full">
                <Progress
                  value={null}
                  aria-label="Processando dados"
                  className="[&>div]:animate-indeterminate"
                />
              </div>
            ),
          },
          {
            name: tContent("variants.items.withLabel"),
            description: stripHtml(tContent("variants.styles.withLabel")),
            code: codeWithLabel,
            preview: (
              <div className="w-full">
                <Progress value={42} aria-label="Enviando arquivo">
                  <ProgressLabel>Enviando arquivo</ProgressLabel>
                  <ProgressValue />
                  <ProgressTrack>
                    <ProgressIndicator />
                  </ProgressTrack>
                </Progress>
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
          trigger: "value",
          behavior: tContent("usage.scenarios.cols.scenario"),
        }}
        items={[
          {
            label: tContent("states.items.default"),
            trigger: "0",
            behavior: stripHtml(tContent("states.descriptions.default")),
          },
          {
            label: tContent("states.items.loading"),
            trigger: "0 < v < 100",
            behavior: stripHtml(tContent("states.descriptions.loading")),
          },
          {
            label: tContent("states.items.complete"),
            trigger: "100",
            behavior: stripHtml(tContent("states.descriptions.complete")),
          },
          {
            label: tContent("states.items.indeterminate"),
            trigger: "null",
            behavior: stripHtml(tContent("states.descriptions.indeterminate")),
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
                name: "value",
                type: tContent("props.table.value.type"),
                defaultValue: tContent("props.table.value.default"),
                required: tContent("props.table.value.required"),
                description: stripHtml(tContent("props.table.value.description")),
              },
              {
                name: "max",
                type: tContent("props.table.max.type"),
                defaultValue: tContent("props.table.max.default"),
                required: tContent("props.table.max.required"),
                description: tContent("props.table.max.description"),
              },
              {
                name: "min",
                type: tContent("props.table.min.type"),
                defaultValue: tContent("props.table.min.default"),
                required: tContent("props.table.min.required"),
                description: tContent("props.table.min.description"),
              },
              {
                name: "getAriaValueText",
                type: tContent("props.table.getAriaValueText.type"),
                defaultValue: tContent("props.table.getAriaValueText.default"),
                required: tContent("props.table.getAriaValueText.required"),
                description: tContent("props.table.getAriaValueText.description"),
              },
              {
                name: "className",
                type: tContent("props.table.className.type"),
                defaultValue: tContent("props.table.className.default"),
                required: tContent("props.table.className.required"),
                description: stripHtml(tContent("props.table.className.description")),
              },
              {
                name: "aria-label",
                type: "string",
                defaultValue: "—",
                required: "Sim",
                description:
                  locale === "en"
                    ? "Required. Describes what is being measured for screen readers."
                    : locale === "es"
                    ? "Obligatorio. Describe lo que se está midiendo para lectores de pantalla."
                    : "Obrigatório. Descreve o que está sendo medido para leitores de tela.",
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
            value: tContent("tokens.table.muted.class"),
            description: tContent("tokens.table.muted.part"),
          },
          {
            token: "--primary",
            value: tContent("tokens.table.primary.class"),
            description: tContent("tokens.table.primary.part"),
          },
          {
            token: "--primary-foreground",
            value: tContent("tokens.table.primaryForeground.class"),
            description: tContent("tokens.table.primaryForeground.part"),
          },
          {
            token: "--foreground",
            value: tContent("tokens.table.foreground.class"),
            description: tContent("tokens.table.foreground.part"),
          },
          {
            token: "--muted-foreground",
            value: tContent("tokens.table.mutedForeground.class"),
            description: tContent("tokens.table.mutedForeground.part"),
          },
          {
            token: "--ring",
            value: tContent("tokens.table.ring.class"),
            description: tContent("tokens.table.ring.part"),
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
          { key: "—", description: tContent("accessibility.keyboard.noInteraction") },
          { key: "Tab", description: tContent("accessibility.keyboard.container") },
        ]}
      />

      {/* ── Relacionados ──────────────────────────────────────────── */}
      <DocsRelated
        title={tContent("related.title")}
        componentSlug="progress"
        items={[
          {
            name: tContent("related.items.skeleton.name"),
            description: tContent("related.items.skeleton.description"),
            path: "?path=/docs/ui-skeleton--docs",
          },
          {
            name: tContent("related.items.spinner.name"),
            description: tContent("related.items.spinner.description"),
            path: "?path=/docs/ui-spinner--docs",
          },
          {
            name: tContent("related.items.alert.name"),
            description: tContent("related.items.alert.description"),
            path: "?path=/docs/ui-alert--docs",
          },
          {
            name: tContent("related.items.sonner.name"),
            description: tContent("related.items.sonner.description"),
            path: "?path=/docs/ui-sonner--docs",
          },
        ]}
      />

      {/* ── Notas ─────────────────────────────────────────────────── */}
      <DocsNotes
        title={tContent("notes.title")}
        componentSlug="progress"
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
            event: "task_progress",
            trigger: tContent("analytics.table.task_progress.trigger"),
            payload: tContent("analytics.table.task_progress.payload"),
          },
          {
            event: "task_complete",
            trigger: tContent("analytics.table.task_complete.trigger"),
            payload: tContent("analytics.table.task_complete.payload"),
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
            { criterion: tContent("testes.accessibility.item3"), level: "4.1.2", how: "DevTools a11y tree" },
            { criterion: tContent("testes.accessibility.item4"), level: "4.1.2", how: "DevTools a11y tree" },
            { criterion: tContent("testes.accessibility.item5"), level: "4.1.2", how: "DevTools a11y tree" },
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

export default ProgressDocs;
