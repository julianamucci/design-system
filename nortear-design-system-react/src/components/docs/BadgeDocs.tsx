import { useCallback, useEffect, useMemo } from "react";
import { Check, X } from "lucide-react";
import { Badge, BadgeCounter } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  badgeAsButtonSnippet,
  badgeAsLinkSnippet,
  badgeWithCounterSnippet,
  badgeWithIconSnippet,
} from "@/components/ui/badge.source";
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

type TestGroup = keyof (typeof badgeTranslations)["pt-BR"]["testes"];

/**
 * Índices dos itens de um grupo de testes, DERIVADOS do dicionário. Lista
 * literal (`[1, 2, 3, 4]`) é o que deixava a página renderizar 4 de 7 quando o
 * conteúdo ganhava item: o dicionário cresce e a página acompanha sozinha.
 */
const testItemIndexes = (group: TestGroup): number[] =>
  Object.keys(badgeTranslations["pt-BR"].testes[group])
    .filter((key) => /^item\d+$/.test(key))
    .map((key) => Number(key.slice("item".length)))
    .sort((a, b) => a - b);

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

  // ─── Rótulos ────────────────────────────────────────────────────────────────

  const labelDefault = tContent("demonstration.labels.defaultLabel");
  const labelDestructive = tContent("demonstration.labels.destructiveLabel");
  const labelWarning = tContent("demonstration.labels.warningLabel");
  const labelSuccess = tContent("demonstration.labels.successLabel");
  const labelInfo = tContent("demonstration.labels.infoLabel");
  const labelStatus = tContent("demonstration.labels.statusLabel");
  const labelCategory = tContent("demonstration.labels.categoryLabel");
  const labelCategoryFilter = tContent("demonstration.labels.categoryFilterLabel");

  // ─── Code strings ───────────────────────────────────────────────────────────

  const codeImportBasic = `import { Badge } from "@/components/ui/badge";`;
  const codeImportWithIcon = `import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";`;

  const codeDefault = `<Badge>${labelDefault}</Badge>`;
  const codeDestructive = `<Badge variant="destructive">${labelDestructive}</Badge>`;
  const codeWarning = `<Badge variant="warning">${labelWarning}</Badge>`;
  const codeSuccess = `<Badge variant="success">${labelSuccess}</Badge>`;
  const codeInfo = `<Badge variant="info">${labelInfo}</Badge>`;

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
      <DocsDemonstration componentSlug="badge">
        <div className="nds-cluster" data-spacing="sm">
          <Badge>{labelDefault}</Badge>
          <Badge variant="destructive">{labelDestructive}</Badge>
          <Badge variant="warning">{labelWarning}</Badge>
          <Badge variant="success">{labelSuccess}</Badge>
          <Badge variant="info">{labelInfo}</Badge>
          <Badge>
            <Check aria-hidden="true" data-icon="inline-start" />
            {labelStatus}
          </Badge>
        </div>
      </DocsDemonstration>

      {/* ── Anatomia ──────────────────────────────────────────────── */}
      <DocsAnatomy
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
      {/* Uma etiqueta por prévia, com o texto de `doDont.previews.*`. */}
      <DocsDoDont
        pairs={[
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: <Badge>{tContent("doDont.previews.pair1Do")}</Badge>,
            dontPreview: <Badge>{tContent("doDont.previews.pair1Dont")}</Badge>,
            doCaption: toPlainText(tContent("doDont.pair1.do")),
            dontCaption: toPlainText(tContent("doDont.pair1.dont")),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <Badge variant="destructive">
                <X aria-hidden="true" data-icon="inline-start" />
                {tContent("doDont.previews.pair2Do")}
              </Badge>
            ),
            dontPreview: (
              <Badge variant="destructive">{tContent("doDont.previews.pair2Dont")}</Badge>
            ),
            doCaption: toPlainText(tContent("doDont.pair2.do")),
            dontCaption: toPlainText(tContent("doDont.pair2.dont")),
          },
        ]}
      />

      {/* ── Importação ────────────────────────────────────────────── */}
      <DocsImport
        componentSlug="badge"
        description={tContent("import.basic")}
        code={codeImportBasic}
        secondaryDescription={tContent("import.withIcon")}
        secondaryCode={codeImportWithIcon}
      />

      {/* ── Variantes ─────────────────────────────────────────────── */}
      <DocsVariants
        componentSlug="badge"
        note={tContent("variants.note")}
        items={[
          {
            name: "default",
            description: stripHtml(tContent("variants.items.default")),
            code: codeDefault,
            preview: <Badge>{labelDefault}</Badge>,
          },
          {
            name: "destructive",
            description: stripHtml(tContent("variants.items.destructive")),
            code: codeDestructive,
            preview: <Badge variant="destructive">{labelDestructive}</Badge>,
          },
          {
            name: "warning",
            description: stripHtml(tContent("variants.items.warning")),
            code: codeWarning,
            preview: <Badge variant="warning">{labelWarning}</Badge>,
          },
          {
            name: "success",
            description: stripHtml(tContent("variants.items.success")),
            code: codeSuccess,
            preview: <Badge variant="success">{labelSuccess}</Badge>,
          },
          {
            name: "info",
            description: stripHtml(tContent("variants.items.info")),
            code: codeInfo,
            preview: <Badge variant="info">{labelInfo}</Badge>,
          },
        ]}
      />

      {/* ── Composições ───────────────────────────────────────────── */}
      <DocsCompositions
        useWhenLabel={tNav("common.useWhen")}
        componentSlug="badge"
        items={[
          {
            trackId: "withIcon",
            name: tContent("variants.compositions.withIcon.name"),
            description: tContent("variants.compositions.withIcon.description"),
            useWhen: tContent("variants.compositions.withIcon.use"),
            code: badgeWithIconSnippet({ label: labelStatus }),
            preview: (
              <Badge>
                <Check aria-hidden="true" data-icon="inline-start" />
                {labelStatus}
              </Badge>
            ),
          },
          {
            trackId: "withCounter",
            name: tContent("variants.compositions.withCounter.name"),
            description: tContent("variants.compositions.withCounter.description"),
            useWhen: tContent("variants.compositions.withCounter.use"),
            // A peça é subcomponente, não prop: qualquer variante a aceita, e o
            // conteúdo nem sempre é número puro ("99+").
            code: badgeWithCounterSnippet({ variant: "destructive", label: labelDestructive, count: "12" }),
            preview: (
              <Badge variant="destructive">
                {labelDestructive}
                <BadgeCounter>12</BadgeCounter>
              </Badge>
            ),
          },
          {
            trackId: "asTrigger",
            name: tContent("variants.compositions.asTrigger.name"),
            description: tContent("variants.compositions.asTrigger.description"),
            useWhen: tContent("variants.compositions.asTrigger.use"),
            // O Button do design system faz o reset, o foco e o anel: nada de
            // <button> cru com `style` inline.
            code: badgeAsButtonSnippet({ label: labelCategory, accessibleName: labelCategoryFilter }),
            preview: (
              <Button variant="ghost" size="sm" aria-label={labelCategoryFilter}>
                <Badge variant="info">{labelCategory}</Badge>
              </Button>
            ),
          },
          {
            trackId: "asLink",
            name: tContent("variants.compositions.asLink.name"),
            description: tContent("variants.compositions.asLink.description"),
            useWhen: tContent("variants.compositions.asLink.use"),
            // A etiqueta é filha DIRETA do link: é a relação que a regra de
            // hover da folha (`a > .nds-badge:hover`) exige.
            code: badgeAsLinkSnippet({ label: labelCategory }),
            preview: (
              <a href="#">
                <Badge variant="info">{labelCategory}</Badge>
              </a>
            ),
          },
        ]}
      />

      {/* ── Configurações (States) ────────────────────────────────── */}
      <DocsStates
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
                required: tNav("common.no"),
                description: toPlainText(tContent("props.table.variant")),
              },
              {
                name: "className",
                type: "string",
                defaultValue: "—",
                required: tNav("common.no"),
                description: tContent("props.table.className"),
              },
              {
                name: "children",
                type: "React.ReactNode",
                defaultValue: "—",
                required: tNav("common.no"),
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
          // pintada por `--border`. `--ring` também não: a etiqueta não tem
          // anel de foco — quem recebe foco é o botão ou o link que a envolve.
          { token: "--primary", value: ".nds-badge-default", description: tContent("tokens.table.primary") },
          { token: "--destructive", value: ".nds-badge-destructive", description: tContent("tokens.table.destructive") },
          { token: "--success", value: ".nds-badge-success", description: tContent("tokens.table.success") },
          { token: "--warning", value: ".nds-badge-warning", description: tContent("tokens.table.warning") },
          { token: "--border", value: ".nds-badge-info", description: tContent("tokens.table.border") },
          { token: "--secondary", value: ".nds-badge-counter", description: tContent("tokens.table.secondary") },
          { token: "--foreground", value: ".nds-badge", description: tContent("tokens.table.foreground") },
          { token: "--background", value: ".nds-badge", description: tContent("tokens.table.background") },
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
        screenReaderTitle={tNav("common.screenReader")}
        screenReaderItems={[
          tContent("screenReader.onRender"),
          tContent("screenReader.onUpdate"),
          tContent("screenReader.icons"),
        ]}
      />

      {/* ── Relacionados ──────────────────────────────────────────── */}
      <DocsRelated
        componentSlug="badge"
        items={[
          {
            name: "Alert",
            description: toPlainText(tContent("related.alert")),
            path: "?path=/docs/components-feedback-alert--docs",
          },
          {
            name: "Button",
            description: toPlainText(tContent("related.button")),
            path: "?path=/docs/components-form-button--docs",
          },
        ]}
      />

      {/* ── Notas ─────────────────────────────────────────────────── */}
      <DocsNotes
        componentSlug="badge"
        items={[
          { title: "", content: tContent("notes.tip1") },
          { title: "", content: tContent("notes.tip2") },
          { title: "", content: tContent("notes.tip3") },
        ]}
      />

      {/* ── Analytics ─────────────────────────────────────────────── */}
      <DocsAnalytics
        cols={{
          event: tContent("analytics.table.event"),
          trigger: toPlainText(tContent("analytics.table.trigger")),
          payload: tContent("analytics.table.payload"),
        }}
        items={[
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
        functional={{
          title: tContent("testes.functional.title"),
          cols: {
            action: tNav("common.userAction"),
            result: tNav("common.expectedResult"),
            priority: tNav("common.priority"),
          },
          items: testItemIndexes("functional").map((i) => ({
            action: tContent(`testes.functional.item${i}.action`),
            result: tContent(`testes.functional.item${i}.result`),
            priority: tNav(priorityKeyMap[tContent(`testes.functional.item${i}.priority`)] ?? "common.medium"),
          })),
        }}
        accessibility={{
          title: tContent("testes.accessibility.title"),
          cols: {
            criterion: tNav("common.criterion"),
            level: "WCAG",
            how: tNav("common.howToVerify"),
          },
          items: testItemIndexes("accessibility").map((i) => ({
            criterion: tContent(`testes.accessibility.item${i}.criterion`),
            level: tContent(`testes.accessibility.item${i}.level`),
            how: tContent(`testes.accessibility.item${i}.how`),
          })),
        }}
        visual={{
          title: tContent("testes.visual.title"),
          cols: {
            story: tNav("common.storyState"),
            priority: tNav("common.priority"),
          },
          items: testItemIndexes("visual").map((i) => ({
            story: tContent(`testes.visual.item${i}.story`),
            priority: tNav(priorityKeyMap[tContent(`testes.visual.item${i}.priority`)] ?? "common.medium"),
          })),
        }}
      />
    </DocsPageLayout>
  );
}
