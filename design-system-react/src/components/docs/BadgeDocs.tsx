import { useCallback, useEffect, useMemo } from "react";
import { CheckCircle2, Check, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import { useActiveSection } from "@/lib/use-active-section";
import uiTranslations from "@/i18n/ui.json";
import badgeTranslations from "@shared/content/badge/translations.json";

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

export function BadgeDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(badgeTranslations);

  const navGroups = useMemo(() => getNavGroups(tNav), [tNav]);
  const allIds = useMemo(
    () => navGroups.flatMap((g) => g.sections.map((s) => s.id)),
    [navGroups]
  );

  useSeoEffect({
    title: tContent("seo.title"),
    description: tContent("seo.description"),
    locale,
    componentSlug: "badge",
  });

  useEffect(() => {
    track("docs_page_view", {
      component_name: "badge",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "badge",
        locale,
      });
    },
    [locale]
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  // ─── Code strings ───────────────────────────────────────────────────────────

  const codeImportBasic = `import { Badge } from "@/components/ui/badge";`;
  const codeImportWithIcon = `import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";`;

  const codeDefault = `<Badge variant="default">Novo</Badge>`;
  const codeSecondary = `<Badge variant="secondary">Beta</Badge>`;
  const codeDestructive = `<Badge variant="destructive">Urgente</Badge>`;
  const codeOutline = `<Badge variant="outline">Rascunho</Badge>`;

  const codeCustomizationTokens = `/* Em globals.css — ajustar tokens semânticos */
:root {
  --primary: 222 47% 11%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96%;
  --destructive: 0 84% 60%;
}

.dark {
  --primary: 210 40% 98%;
  --primary-foreground: 222 47% 11%;
}`;

  const interfaceCode = `// Badge
interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "...",
        secondary: "...",
        destructive: "...",
        outline: "...",
      },
    },
    defaultVariants: { variant: "default" },
  }
);`;

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
          installNote="npx shadcn@latest add badge"
        />
      }
    >
      {/* ── Demonstração ──────────────────────────────────────────── */}
      <DocsDemonstration title={tContent("demonstration.title")}>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="default">{tContent("demonstration.labels.defaultLabel")}</Badge>
          <Badge variant="secondary">{tContent("demonstration.labels.secondaryLabel")}</Badge>
          <Badge variant="destructive">{tContent("demonstration.labels.destructiveLabel")}</Badge>
          <Badge variant="outline">{tContent("demonstration.labels.outlineLabel")}</Badge>
          <Badge variant="destructive">{tContent("demonstration.labels.countLabel")}</Badge>
          <Badge variant="secondary">
            <CheckCircle2 aria-hidden="true" className="mr-1 h-3 w-3" />
            {tContent("demonstration.labels.statusLabel")}
          </Badge>
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
          items: [
            { s: tContent("usage.scenarios.item1.s"), u: tContent("usage.scenarios.item1.u"), a: tContent("usage.scenarios.item1.a") },
            { s: tContent("usage.scenarios.item2.s"), u: tContent("usage.scenarios.item2.u"), a: tContent("usage.scenarios.item2.a") },
            { s: tContent("usage.scenarios.item3.s"), u: tContent("usage.scenarios.item3.u"), a: tContent("usage.scenarios.item3.a") },
            { s: tContent("usage.scenarios.item4.s"), u: tContent("usage.scenarios.item4.u"), a: tContent("usage.scenarios.item4.a") },
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
              element: tContent("usage.uxWriting.table.status.name"),
              rules: tContent("usage.uxWriting.table.status.format"),
              do: tContent("usage.uxWriting.table.status.good"),
              dont: tContent("usage.uxWriting.table.status.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.count.name"),
              rules: tContent("usage.uxWriting.table.count.format"),
              do: tContent("usage.uxWriting.table.count.good"),
              dont: tContent("usage.uxWriting.table.count.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.category.name"),
              rules: tContent("usage.uxWriting.table.category.format"),
              do: tContent("usage.uxWriting.table.category.good"),
              dont: tContent("usage.uxWriting.table.category.bad"),
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
            doPreview: <Badge variant="default">Novo</Badge>,
            dontPreview: (
              <Badge variant="default">
                Este item acabou de ser adicionado ao catálogo
              </Badge>
            ),
            doCaption: tContent("doDont.pair1.do"),
            dontCaption: tContent("doDont.pair1.dont"),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: <Badge variant="destructive">Expirado</Badge>,
            dontPreview: <Badge variant="destructive">Em breve</Badge>,
            doCaption: tContent("doDont.pair2.do"),
            dontCaption: tContent("doDont.pair2.dont"),
          },
        ]}
      />

      {/* ── Importação ────────────────────────────────────────────── */}
      <DocsImport
        title={tContent("import.title")}
        description={tContent("import.basic")}
        code={codeImportBasic}
        secondaryDescription={tContent("import.withIcon")}
        secondaryCode={codeImportWithIcon}
      />

      {/* ── Variantes ─────────────────────────────────────────────── */}
      <DocsVariants
        title={tContent("variants.title")}
        items={[
          {
            name: "default",
            description: stripHtml(tContent("variants.items.default")),
            code: codeDefault,
            preview: <Badge variant="default">{tContent("demonstration.labels.defaultLabel")}</Badge>,
          },
          {
            name: "secondary",
            description: stripHtml(tContent("variants.items.secondary")),
            code: codeSecondary,
            preview: <Badge variant="secondary">{tContent("demonstration.labels.secondaryLabel")}</Badge>,
          },
          {
            name: "destructive",
            description: stripHtml(tContent("variants.items.destructive")),
            code: codeDestructive,
            preview: <Badge variant="destructive">{tContent("demonstration.labels.destructiveLabel")}</Badge>,
          },
          {
            name: "outline",
            description: stripHtml(tContent("variants.items.outline")),
            code: codeOutline,
            preview: <Badge variant="outline">{tContent("demonstration.labels.outlineLabel")}</Badge>,
          },
        ]}
      />

      {/* ── Composições ───────────────────────────────────────────── */}
      <DocsCompositions
        title={tContent("variants.compositionsTitle")}
        useWhenLabel={tNav("common.useWhen")}
        componentSlug="badge"
        items={[
          {
            name: tContent("variants.compositions.withIcon.name"),
            description: tContent("variants.compositions.withIcon.description"),
            useWhen: tContent("variants.compositions.withIcon.use"),
            code: `<Badge>\n  <Check className="h-3 w-3" aria-hidden="true" />\n  Ativo\n</Badge>`,
            preview: (
              <Badge>
                <Check className="h-3 w-3" aria-hidden="true" />
                Ativo
              </Badge>
            ),
          },
          {
            name: tContent("variants.compositions.count.name"),
            description: tContent("variants.compositions.count.description"),
            useWhen: tContent("variants.compositions.count.use"),
            code: `<span role="status" aria-label="12 notificações não lidas" className="inline-flex items-center gap-2">\n  <Bell className="h-5 w-5" aria-hidden="true" />\n  <Badge variant="destructive">12</Badge>\n</span>`,
            preview: (
              <span role="status" aria-label="12 notificações não lidas" className="inline-flex items-center gap-2">
                <Bell className="h-5 w-5" aria-hidden="true" />
                <Badge variant="destructive">12</Badge>
              </span>
            ),
          },
          {
            name: tContent("variants.compositions.asLink.name"),
            description: tContent("variants.compositions.asLink.description"),
            useWhen: tContent("variants.compositions.asLink.use"),
            code: `<a href="#design" aria-label="Ver todos os itens da categoria Design" className="inline-flex">\n  <Badge variant="secondary">Design</Badge>\n</a>`,
            preview: (
              <a href="#design" aria-label="Ver todos os itens da categoria Design" className="inline-flex">
                <Badge variant="secondary">Design</Badge>
              </a>
            ),
          },
          {
            name: tContent("variants.compositions.asTrigger.name"),
            description: tContent("variants.compositions.asTrigger.description"),
            useWhen: tContent("variants.compositions.asTrigger.use"),
            code: `<button type="button" aria-label="Filtrar por React" className="inline-flex bg-transparent p-0 border-0 cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus:outline-none rounded-md">\n  <Badge variant="outline">React</Badge>\n</button>`,
            preview: (
              <button type="button" aria-label="Filtrar por React" className="inline-flex bg-transparent p-0 border-0 cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus:outline-none rounded-md">
                <Badge variant="outline">React</Badge>
              </button>
            ),
          },
        ]}
      />

      {/* ── Configurações (States) ────────────────────────────────── */}
      <DocsStates
        title={tContent("states.title")}
        cols={{
          state: tContent("states.cols.state"),
          trigger: tContent("states.cols.trigger"),
          behavior: tContent("states.cols.behavior"),
        }}
        items={[
          {
            label: tContent("states.withIcon.label"),
            trigger: stripHtml(tContent("states.withIcon.trigger")),
            behavior: stripHtml(tContent("states.withIcon.behavior")),
          },
          {
            label: tContent("states.countBadge.label"),
            trigger: stripHtml(tContent("states.countBadge.trigger")),
            behavior: stripHtml(tContent("states.countBadge.behavior")),
          },
          {
            label: tContent("states.asLink.label"),
            trigger: stripHtml(tContent("states.asLink.trigger")),
            behavior: stripHtml(tContent("states.asLink.behavior")),
          },
          {
            label: tContent("states.asTrigger.label"),
            trigger: stripHtml(tContent("states.asTrigger.trigger")),
            behavior: stripHtml(tContent("states.asTrigger.behavior")),
          },
        ]}
      />

      {/* ── Propriedades ──────────────────────────────────────────── */}
      <DocsProps
        title={tContent("props.title")}
        tables={[
          {
            title: tContent("props.badgeTitle"),
            cols: {
              prop: tContent("props.table.prop"),
              type: tContent("props.table.type"),
              default: tContent("props.table.default"),
              required: tContent("props.table.required"),
              description: tContent("props.table.description"),
            },
            items: [
              {
                name: "variant",
                type: '"default" | "secondary" | "destructive" | "outline"',
                defaultValue: '"default"',
                required: "Não",
                description: stripHtml(tContent("props.table.variant")),
              },
              {
                name: "className",
                type: "string",
                defaultValue: "—",
                required: "Não",
                description: tContent("props.table.className"),
              },
              {
                name: "children",
                type: "React.ReactNode",
                defaultValue: "—",
                required: "Sim",
                description: tContent("props.table.children"),
              },
            ],
          },
        ]}
        interfaceCode={interfaceCode}
        extensibilityTitle={tContent("props.extensibilityTitle")}
        extensibilityNotes={tContent("props.extensibility")}
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
          { token: "--primary", value: "bg-primary", description: tContent("tokens.table.primary") },
          { token: "--primary-foreground", value: "text-primary-foreground", description: tContent("tokens.table.primaryForeground") },
          { token: "--secondary", value: "bg-secondary", description: tContent("tokens.table.secondary") },
          { token: "--secondary-foreground", value: "text-secondary-foreground", description: tContent("tokens.table.secondaryForeground") },
          { token: "--destructive", value: "bg-destructive", description: tContent("tokens.table.destructive") },
          { token: "--destructive-foreground", value: "text-destructive-foreground", description: tContent("tokens.table.destructiveForeground") },
          { token: "--foreground", value: "text-foreground", description: tContent("tokens.table.foreground") },
          { token: "--ring", value: "focus:ring-ring", description: tContent("tokens.table.ring") },
          { token: "--background", value: "focus:ring-offset-background", description: tContent("tokens.table.background") },
        ]}
        customizationTitle={tContent("tokens.customizationTitle")}
        customizationCode={codeCustomizationTokens}
      />

      {/* ── Acessibilidade ────────────────────────────────────────── */}
      <DocsAccessibility
        title={tContent("accessibility.title")}
        summary={tContent("accessibility.summary")}
        items={[
          tContent("accessibility.item1"),
          tContent("accessibility.item2"),
          tContent("accessibility.item3"),
          tContent("accessibility.item4"),
          tContent("accessibility.item5"),
        ]}
        keyboardTitle={tContent("accessibility.keyboardTitle")}
        keyboardItems={[
          { key: "—",     description: stripHtml(tContent("keyboard.noFocus")) },
          { key: "Tab",   description: stripHtml(tContent("keyboard.wrappedInButton")) },
          { key: "Enter", description: stripHtml(tContent("keyboard.wrappedInLink")) },
        ]}
      />

      {/* ── Relacionados ──────────────────────────────────────────── */}
      <DocsRelated
        title={tContent("related.title")}
        items={[
          {
            name: "Alert",
            description: tContent("related.alert"),
            path: "?path=/docs/ui-alert--docs",
          },
          {
            name: "Button",
            description: tContent("related.button"),
            path: "?path=/docs/ui-button--docs",
          },
          {
            name: "Avatar",
            description: tContent("related.chip"),
            path: "?path=/docs/ui-avatar--docs",
          },
        ]}
      />

      {/* ── Notas ─────────────────────────────────────────────────── */}
      <DocsNotes
        title={tContent("notes.title")}
        items={[
          { title: "", content: tContent("notes.tip1") },
          { title: "", content: tContent("notes.tip2") },
          { title: "", content: tContent("notes.tip3") },
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
            event: tContent("analytics.table.click"),
            trigger: tContent("analytics.table.clickTrigger"),
            payload: tContent("analytics.table.clickPayload"),
          },
          {
            event: tContent("analytics.table.pageView"),
            trigger: tContent("analytics.table.pageViewTrigger"),
            payload: tContent("analytics.table.pageViewPayload"),
          },
          {
            event: tContent("analytics.table.sectionViewed"),
            trigger: tContent("analytics.table.sectionViewedTrigger"),
            payload: tContent("analytics.table.sectionViewedPayload"),
          },
          {
            event: tContent("analytics.table.langSwitch"),
            trigger: tContent("analytics.table.langSwitchTrigger"),
            payload: tContent("analytics.table.langSwitchPayload"),
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
            {
              criterion: tContent("testes.accessibility.item1.criterion"),
              level: tContent("testes.accessibility.item1.level"),
              how: tContent("testes.accessibility.item1.how"),
            },
            {
              criterion: tContent("testes.accessibility.item2.criterion"),
              level: tContent("testes.accessibility.item2.level"),
              how: tContent("testes.accessibility.item2.how"),
            },
            {
              criterion: tContent("testes.accessibility.item3.criterion"),
              level: tContent("testes.accessibility.item3.level"),
              how: tContent("testes.accessibility.item3.how"),
            },
            {
              criterion: tContent("testes.accessibility.item4.criterion"),
              level: tContent("testes.accessibility.item4.level"),
              how: tContent("testes.accessibility.item4.how"),
            },
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
          ],
        }}
      />
    </DocsPageLayout>
  );
}
