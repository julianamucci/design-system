import { useCallback, useEffect, useMemo } from "react";
import { CheckCircle2, Check } from "lucide-react";
import { Badge, BadgeCounter } from "@/components/ui/badge";
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
import { stripHtml, toPlainText } from "@/lib/strip-html";

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
  const codeDestructive = `<Badge variant="destructive">Urgente</Badge>`;
  const codeWarning = `<Badge variant="warning">Vence hoje</Badge>`;
  const codeSuccess = `<Badge variant="success">Aprovado</Badge>`;
  const codeInfo = `<Badge variant="info">Novidade</Badge>`;

  const interfaceCode = `// Badge
interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

// A variante reaponta uma coisa só: a cor da borda.
const badgeVariants = cva(
  "nds-badge",
  {
    variants: {
      variant: {
        default: "nds-badge-default",
        destructive: "nds-badge-destructive",
        warning: "nds-badge-warning",
        success: "nds-badge-success",
        info: "nds-badge-info",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

// BadgeCounter — peça que qualquer variante aceita, não uma variante a mais.
interface BadgeCounterProps extends React.HTMLAttributes<HTMLSpanElement> {}`;

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
        />
      }
    >
      {/* ── Demonstração ──────────────────────────────────────────── */}
      <DocsDemonstration title={tContent("demonstration.title")}>
        <div className="nds-cluster" data-spacing="sm">
          <Badge variant="default">{tContent("demonstration.labels.defaultLabel")}</Badge>
          <Badge variant="destructive">{tContent("demonstration.labels.destructiveLabel")}</Badge>
          <Badge variant="warning">{tContent("demonstration.labels.warningLabel")}</Badge>
          <Badge variant="success">{tContent("demonstration.labels.successLabel")}</Badge>
          <Badge variant="info">{tContent("demonstration.labels.infoLabel")}</Badge>
          <Badge variant="success">
            <CheckCircle2 aria-hidden="true" />
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
            doCaption: toPlainText(tContent("doDont.pair1.do")),
            dontCaption: toPlainText(tContent("doDont.pair1.dont")),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: <Badge variant="destructive">Expirado</Badge>,
            dontPreview: <Badge variant="destructive">Em breve</Badge>,
            doCaption: toPlainText(tContent("doDont.pair2.do")),
            dontCaption: toPlainText(tContent("doDont.pair2.dont")),
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
            name: "destructive",
            description: stripHtml(tContent("variants.items.destructive")),
            code: codeDestructive,
            preview: <Badge variant="destructive">{tContent("demonstration.labels.destructiveLabel")}</Badge>,
          },
          {
            name: "warning",
            description: stripHtml(tContent("variants.items.warning")),
            code: codeWarning,
            preview: <Badge variant="warning">{tContent("demonstration.labels.warningLabel")}</Badge>,
          },
          {
            name: "success",
            description: stripHtml(tContent("variants.items.success")),
            code: codeSuccess,
            preview: <Badge variant="success">{tContent("demonstration.labels.successLabel")}</Badge>,
          },
          {
            name: "info",
            description: stripHtml(tContent("variants.items.info")),
            code: codeInfo,
            preview: <Badge variant="info">{tContent("demonstration.labels.infoLabel")}</Badge>,
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
            code: `<Badge>\n  <Check aria-hidden="true" />\n  Ativo\n</Badge>`,
            preview: (
              <Badge>
                <Check aria-hidden="true" />
                Ativo
              </Badge>
            ),
          },
          {
            name: tContent("variants.compositions.withCounter.name"),
            description: tContent("variants.compositions.withCounter.description"),
            useWhen: tContent("variants.compositions.withCounter.use"),
            // A peça é subcomponente, não prop: qualquer variante a aceita, e o
            // conteúdo nem sempre é número puro ("99+").
            code: `<Badge variant="destructive">\n  Urgente\n  <BadgeCounter>12</BadgeCounter>\n</Badge>`,
            preview: (
              <Badge variant="destructive">
                Urgente
                <BadgeCounter>12</BadgeCounter>
              </Badge>
            ),
          },
          {
            name: tContent("variants.compositions.asTrigger.name"),
            description: tContent("variants.compositions.asTrigger.description"),
            useWhen: tContent("variants.compositions.asTrigger.use"),
            // `padding` e `border` a zero continuam inline: são o RESET do
            // <button>, não valor de design. O que saiu foi o `display`, que a
            // classe já dá — e é a mesma que a story usa.
            code: `<button type="button" aria-label="Filtrar por React" className="nds-cluster nds-rounded-md nds-cursor-pointer nds-bg-transparent" style={{ padding: 0, border: 0 }}>\n  <Badge variant="info">React</Badge>\n</button>`,
            preview: (
              <button
                type="button"
                aria-label="Filtrar por React"
                className="nds-cluster nds-rounded-md nds-cursor-pointer nds-bg-transparent"
                style={{ padding: 0, border: 0 }}
                onClick={() =>
                  track("badge_click", {
                    component: "badge",
                    label: "React",
                    variant: "info",
                    location: "docs_demo",
                  })
                }
              >
                <Badge variant="info">React</Badge>
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
          trigger: toPlainText(tContent("states.cols.trigger")),
          behavior: toPlainText(tContent("states.cols.behavior")),
        }}
        items={[
          {
            label: tContent("states.countBadge.label"),
            trigger: toPlainText(tContent("states.countBadge.trigger")),
            behavior: toPlainText(tContent("states.countBadge.behavior")),
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
                type: '"default" | "destructive" | "warning" | "success" | "info"',
                defaultValue: '"default"',
                required: "Não",
                description: toPlainText(tContent("props.table.variant")),
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
          // A tabela lista o que a folha LÊ, e a coluna do meio nomeia o
          // seletor que lê. A variante mora na BORDA; fundo e texto são
          // neutros em todas elas, e a única peça preenchida é o contador.
          // `--info` não tem linha porque a folha não o lê: a variante info é
          // pintada por `--border`. Linha com travessão só ocuparia espaço
          // dizendo que o token não faz nada aqui.
          { token: "--primary", value: ".nds-badge-default", description: tContent("tokens.table.primary") },
          { token: "--destructive", value: ".nds-badge-destructive", description: tContent("tokens.table.destructive") },
          { token: "--success", value: ".nds-badge-success", description: tContent("tokens.table.success") },
          { token: "--warning", value: ".nds-badge-warning", description: tContent("tokens.table.warning") },
          { token: "--border", value: ".nds-badge-info", description: tContent("tokens.table.border") },
          { token: "--secondary", value: ".nds-badge-counter", description: tContent("tokens.table.secondary") },
          { token: "--foreground", value: ".nds-badge", description: tContent("tokens.table.foreground") },
          { token: "--background", value: ".nds-badge", description: tContent("tokens.table.background") },
          { token: "--ring", value: ".nds-badge:focus-visible", description: tContent("tokens.table.ring") },
          { token: "--radius-badge", value: ".nds-badge", description: tContent("tokens.table.radius") },
          // As três vars internas, que é o que o override escopado alcança.
          { token: "--badge-bg", value: "hsl(var(--background))", description: tContent("tokens.table.badgeBg") },
          { token: "--badge-fg", value: "hsl(var(--foreground))", description: tContent("tokens.table.badgeFg") },
          { token: "--badge-border", value: "hsl(var(--primary))", description: tContent("tokens.table.badgeBorder") },
        ]}
        customizationTitle={tContent("tokens.customizationTitle")}
        customizationCode={tContent("tokens.customizationCode")}
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
            description: toPlainText(tContent("related.alert")),
            path: "?path=/docs/primitives-feedback-alert--docs",
          },
          {
            name: "Button",
            description: toPlainText(tContent("related.button")),
            path: "?path=/docs/primitives-form-button--docs",
          },
          {
            name: "Avatar",
            description: toPlainText(tContent("related.chip")),
            path: "?path=/docs/primitives-display-avatar--docs",
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
          trigger: toPlainText(tContent("analytics.table.trigger")),
          payload: tContent("analytics.table.payload"),
        }}
        items={[
          {
            event: tContent("analytics.table.click"),
            trigger: toPlainText(tContent("analytics.table.clickTrigger")),
            payload: tContent("analytics.table.clickPayload"),
          },
          {
            event: tContent("analytics.table.pageView"),
            trigger: toPlainText(tContent("analytics.table.pageViewTrigger")),
            payload: tContent("analytics.table.pageViewPayload"),
          },
          {
            event: tContent("analytics.table.sectionViewed"),
            trigger: toPlainText(tContent("analytics.table.sectionViewedTrigger")),
            payload: tContent("analytics.table.sectionViewedPayload"),
          },
          {
            event: tContent("analytics.table.langSwitch"),
            trigger: toPlainText(tContent("analytics.table.langSwitchTrigger")),
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
