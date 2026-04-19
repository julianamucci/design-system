import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Pencil, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import uiTranslations from "@/i18n/ui.json";
import buttonTranslations from "@shared/content/button/translations.json";

import { DocsNav }           from "@/components/docs/shared/DocsNav";
import { DocsHeader }        from "@/components/docs/shared/sections/DocsHeader";
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

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

const priorityKeyMap: Record<string, string> = {
  high: "common.high",
  medium: "common.medium",
  low: "common.low",
};

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
      { id: "tamanhos",     label: t("nav.sizes") },
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

function useActiveSection(ids: string[], onSectionChange?: (id: string) => void) {
  const [activeId, setActiveId] = useState<string>(ids[0]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            setActiveId(id);
            onSectionChange?.(id);
            break;
          }
        }
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [ids, onSectionChange]);

  return activeId;
}

export function ButtonDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(buttonTranslations);

  const navGroups = useMemo(() => getNavGroups(tNav), [tNav]);
  const allIds = useMemo(
    () => navGroups.flatMap((g) => g.sections.map((s) => s.id)),
    [navGroups]
  );

  useSeoEffect({
    title: tContent("seo.title"),
    description: tContent("seo.description"),
    locale,
    componentSlug: "button",
  });

  useEffect(() => {
    track("docs_page_view", {
      component_name: "button",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "button",
        locale,
      });
    },
    [locale]
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  const codeImportBasic = `import { Button } from "@/components/ui/button";`;
  const codeImportWithIcon = `import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";`;

  const codeDefault = `<Button>Salvar</Button>`;
  const codeDestructive = `<Button variant="destructive">Excluir item</Button>`;
  const codeOutline = `<Button variant="outline">Ver detalhes</Button>`;
  const codeSecondary = `<Button variant="secondary">Cancelar</Button>`;
  const codeGhost = `<Button variant="ghost">Editar</Button>`;
  const codeLink = `<Button variant="link">Saiba mais</Button>`;

  const codeSizeDefault = `<Button>Salvar</Button>`;
  const codeSizeSm = `<Button size="sm">Salvar</Button>`;
  const codeSizeLg = `<Button size="lg">Salvar</Button>`;
  const codeSizeIcon = `<Button size="icon" aria-label="Excluir item">
  <Trash2 aria-hidden="true" />
</Button>`;
  const codeSizeIconSm = `<Button size="icon-sm" aria-label="Editar">
  <Pencil aria-hidden="true" />
</Button>`;
  const codeSizeIconLg = `<Button size="icon-lg" aria-label="Adicionar">
  <Plus aria-hidden="true" />
</Button>`;

  const codeCustomizationTokens = `/* Em globals.css \u2014 tokens do Button */
:root {
  --primary: 222 47% 11%;
  --primary-foreground: 210 40% 98%;
  --radius: 0.5rem;
}

.dark {
  --primary: 210 40% 98%;
  --primary-foreground: 222 47% 11%;
}`;

  const interfaceCode = `interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg";
  asChild?: boolean;
}`;

  return (
    <div className="ds-docs p-8 max-w-5xl mx-auto">

      <DocsHeader
        title={tContent("title")}
        description={tContent("description")}
        category={tContent("category")}
        type={tContent("type")}
        installNote="npx shadcn@latest add button"
      />

      <div className="flex gap-16 items-start">
        <nav
          aria-label="Navegação das seções do componente"
          className="sticky top-8 w-52 shrink-0 self-start space-y-5"
        >
          <DocsNav groups={navGroups} activeSection={activeId} />
        </nav>

        <div className="ds-docs flex-1 min-w-0 space-y-12">

          {/* ── Demonstração ──────────────────────────────────────────── */}
          <DocsDemonstration title={tContent("demonstration.title")}>
            <div className="flex flex-wrap gap-3">
              {([
                { variant: undefined,     label: tContent("demonstration.labels.primary") },
                { variant: "secondary",   label: tContent("demonstration.labels.secondary") },
                { variant: "destructive", label: tContent("demonstration.labels.destructive") },
                { variant: "outline",     label: tContent("demonstration.labels.outline") },
                { variant: "ghost",       label: tContent("demonstration.labels.ghost") },
                { variant: "link",        label: tContent("demonstration.labels.link") },
              ] as const).map(({ variant, label }) => (
                <Button
                  key={label}
                  {...(variant ? { variant } : {})}
                  onClick={() => track("button_click", { component: "button", variant: variant ?? "default", label, location: "docs_demonstration" })}
                >
                  {label}
                </Button>
              ))}
              <Button
                variant="outline"
                onClick={() => track("button_click", { component: "button", variant: "outline", label: tContent("demonstration.labels.withIcon"), location: "docs_demonstration" })}
              >
                <Plus aria-hidden="true" />
                {tContent("demonstration.labels.withIcon")}
              </Button>
              <Button
                size="icon"
                aria-label={tContent("demonstration.labels.iconOnly")}
                onClick={() => track("button_click", { component: "button", variant: "default", label: tContent("demonstration.labels.iconOnly"), location: "docs_demonstration" })}
              >
                <Trash2 aria-hidden="true" />
              </Button>
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
                  element: tContent("usage.uxWriting.table.ariaLabel.name"),
                  rules: tContent("usage.uxWriting.table.ariaLabel.format"),
                  do: tContent("usage.uxWriting.table.ariaLabel.good"),
                  dont: tContent("usage.uxWriting.table.ariaLabel.bad"),
                },
                {
                  element: tContent("usage.uxWriting.table.iconOnly.name"),
                  rules: tContent("usage.uxWriting.table.iconOnly.format"),
                  do: tContent("usage.uxWriting.table.iconOnly.good"),
                  dont: tContent("usage.uxWriting.table.iconOnly.bad"),
                },
                {
                  element: tContent("usage.uxWriting.table.loading.name"),
                  rules: tContent("usage.uxWriting.table.loading.format"),
                  do: tContent("usage.uxWriting.table.loading.good"),
                  dont: tContent("usage.uxWriting.table.loading.bad"),
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
                doPreview: <Button>Salvar</Button>,
                dontPreview: <Button>Clique aqui</Button>,
                doCaption: tContent("doDont.pair1.do"),
                dontCaption: tContent("doDont.pair1.dont"),
              },
              {
                doLabel: tNav("common.do"),
                dontLabel: tNav("common.dont"),
                doPreview: (
                  <div className="flex gap-2">
                    <Button variant="outline">Cancelar</Button>
                    <Button>Salvar</Button>
                  </div>
                ),
                dontPreview: (
                  <div className="flex gap-2">
                    <Button>Salvar</Button>
                    <Button>Enviar</Button>
                  </div>
                ),
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
                preview: <Button>{tContent("demonstration.labels.primary")}</Button>,
              },
              {
                name: "destructive",
                description: stripHtml(tContent("variants.items.destructive")),
                code: codeDestructive,
                preview: <Button variant="destructive">{tContent("demonstration.labels.destructive")}</Button>,
              },
              {
                name: "outline",
                description: stripHtml(tContent("variants.items.outline")),
                code: codeOutline,
                preview: <Button variant="outline">{tContent("demonstration.labels.outline")}</Button>,
              },
              {
                name: "secondary",
                description: stripHtml(tContent("variants.items.secondary")),
                code: codeSecondary,
                preview: <Button variant="secondary">{tContent("demonstration.labels.secondary")}</Button>,
              },
              {
                name: "ghost",
                description: stripHtml(tContent("variants.items.ghost")),
                code: codeGhost,
                preview: <Button variant="ghost">{tContent("demonstration.labels.ghost")}</Button>,
              },
              {
                name: "link",
                description: stripHtml(tContent("variants.items.link")),
                code: codeLink,
                preview: <Button variant="link">{tContent("demonstration.labels.link")}</Button>,
              },
            ]}
          />

          {/* ── Tamanhos ──────────────────────────────────────────────── */}
          <DocsVariants
            title={tContent("variants.sizesTitle")}
            items={[
              {
                name: "default",
                description: stripHtml(tContent("variants.sizes.default")),
                code: codeSizeDefault,
                preview: <Button>{tContent("demonstration.labels.primary")}</Button>,
              },
              {
                name: "sm",
                description: stripHtml(tContent("variants.sizes.sm")),
                code: codeSizeSm,
                preview: <Button size="sm">{tContent("demonstration.labels.primary")}</Button>,
              },
              {
                name: "lg",
                description: stripHtml(tContent("variants.sizes.lg")),
                code: codeSizeLg,
                preview: <Button size="lg">{tContent("demonstration.labels.primary")}</Button>,
              },
              {
                name: "icon",
                description: stripHtml(tContent("variants.sizes.icon")),
                code: codeSizeIcon,
                preview: (
                  <Button size="icon" aria-label={tContent("demonstration.labels.iconOnly")}>
                    <Trash2 aria-hidden="true" />
                  </Button>
                ),
              },
              {
                name: "icon-sm",
                description: stripHtml(tContent("variants.sizes.icon-sm")),
                code: codeSizeIconSm,
                preview: (
                  <Button size="icon-sm" aria-label={tContent("demonstration.labels.ghost")}>
                    <Pencil aria-hidden="true" />
                  </Button>
                ),
              },
              {
                name: "icon-lg",
                description: stripHtml(tContent("variants.sizes.icon-lg")),
                code: codeSizeIconLg,
                preview: (
                  <Button size="icon-lg" aria-label={tContent("demonstration.labels.withIcon")}>
                    <Plus aria-hidden="true" />
                  </Button>
                ),
              },
            ]}
          />

          {/* ── Estados ───────────────────────────────────────────────── */}
          <DocsStates
            title={tContent("states.title")}
            cols={{
              state: tContent("states.cols.state"),
              trigger: tContent("states.cols.trigger"),
              behavior: tContent("states.cols.behavior"),
            }}
            items={[
              {
                label: tContent("states.default.label"),
                trigger: tContent("states.default.trigger"),
                behavior: tContent("states.default.behavior"),
              },
              {
                label: tContent("states.hover.label"),
                trigger: tContent("states.hover.trigger"),
                behavior: stripHtml(tContent("states.hover.behavior")),
              },
              {
                label: tContent("states.focusVisible.label"),
                trigger: tContent("states.focusVisible.trigger"),
                behavior: stripHtml(tContent("states.focusVisible.behavior")),
              },
              {
                label: tContent("states.disabled.label"),
                trigger: stripHtml(tContent("states.disabled.trigger")),
                behavior: stripHtml(tContent("states.disabled.behavior")),
              },
              {
                label: tContent("states.loading.label"),
                trigger: stripHtml(tContent("states.loading.trigger")),
                behavior: tContent("states.loading.behavior"),
              },
              {
                label: tContent("states.invalid.label"),
                trigger: stripHtml(tContent("states.invalid.trigger")),
                behavior: stripHtml(tContent("states.invalid.behavior")),
              },
            ]}
          />

          {/* ── Propriedades ──────────────────────────────────────────── */}
          <DocsProps
            title={tContent("props.title")}
            tables={[
              {
                title: tContent("props.buttonTitle"),
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
                    type: '"default" | "destructive" | "outline" | "secondary" | "ghost" | "link"',
                    defaultValue: '"default"',
                    required: "Não",
                    description: stripHtml(tContent("props.table.variant")),
                  },
                  {
                    name: "size",
                    type: '"default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg"',
                    defaultValue: '"default"',
                    required: "Não",
                    description: stripHtml(tContent("props.table.size")),
                  },
                  {
                    name: "asChild",
                    type: "boolean",
                    defaultValue: "false",
                    required: "Não",
                    description: stripHtml(tContent("props.table.asChild")),
                  },
                  {
                    name: "disabled",
                    type: "boolean",
                    defaultValue: "false",
                    required: "Não",
                    description: stripHtml(tContent("props.table.disabled")),
                  },
                  {
                    name: "type",
                    type: '"button" | "submit" | "reset"',
                    defaultValue: '"button"',
                    required: "Não",
                    description: stripHtml(tContent("props.table.type")),
                  },
                  {
                    name: "onClick",
                    type: "(e: MouseEvent) => void",
                    defaultValue: "—",
                    required: "Não",
                    description: stripHtml(tContent("props.table.onClick")),
                  },
                  {
                    name: "className",
                    type: "string",
                    defaultValue: "—",
                    required: "Não",
                    description: stripHtml(tContent("props.table.className")),
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
              { token: "--destructive", value: "bg-destructive text-white", description: tContent("tokens.table.destructive") },
              { token: "--border", value: "border", description: tContent("tokens.table.border") },
              { token: "--accent", value: "hover:bg-accent", description: tContent("tokens.table.accent") },
              { token: "--ring", value: "focus-visible:ring-ring/50", description: tContent("tokens.table.ring") },
              { token: "--radius", value: "rounded-md", description: tContent("tokens.table.radius") },
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
              { key: "Tab",     description: tContent("accessibility.keyboard.tab") },
              { key: "Enter",   description: stripHtml(tContent("accessibility.keyboard.enter")) },
              { key: "Space",   description: stripHtml(tContent("accessibility.keyboard.space")) },
              { key: "—",       description: stripHtml(tContent("accessibility.keyboard.disabled")) },
            ]}
          />

          {/* ── Relacionados ──────────────────────────────────────────── */}
          <DocsRelated
            title={tContent("related.title")}
            items={[
              {
                name: "Toggle",
                description: stripHtml(tContent("related.toggle")),
                path: "?path=/docs/ui-toggle--docs",
              },
              {
                name: "Switch",
                description: tContent("related.switch"),
                path: "?path=/docs/ui-switch--docs",
              },
              {
                name: "Link",
                description: tContent("related.link"),
                path: "?path=/docs/ui-link--docs",
              },
              {
                name: "Form",
                description: tContent("related.form"),
                path: "?path=/docs/ui-form--docs",
              },
              {
                name: "Dialog",
                description: tContent("related.dialog"),
                path: "?path=/docs/ui-dialog--docs",
              },
              {
                name: "AlertDialog",
                description: tContent("related.alertDialog"),
                path: "?path=/docs/ui-alertdialog--docs",
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
                trigger: stripHtml(tContent("analytics.table.clickTrigger")),
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
              items: [1, 2, 3, 4, 5, 6].map((i) => ({
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
                criterion: stripHtml(tContent(`testes.accessibility.item${i}.criterion`)),
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
              items: [1, 2, 3, 4, 5].map((i) => ({
                story: tContent(`testes.visual.item${i}.story`),
                priority: tNav(priorityKeyMap[tContent(`testes.visual.item${i}.priority`)] ?? "common.high"),
              })),
            }}
          />

        </div>
      </div>
    </div>
  );
}
