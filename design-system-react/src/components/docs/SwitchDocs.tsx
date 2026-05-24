import { useCallback, useEffect, useMemo, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import { useActiveSection } from "@/lib/use-active-section";
import uiTranslations from "@/i18n/ui.json";
import switchTranslations from "@shared/content/switch/translations.json";

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

export function SwitchDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(switchTranslations);

  const navGroups = useMemo(() => getNavGroups(tNav), [tNav]);
  const allIds = useMemo(
    () => navGroups.flatMap((g) => g.sections.map((s) => s.id)),
    [navGroups]
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
    componentSlug: "switch",
    aiSummary: tContent("seo.aiSummary"),
    aiEntities: tContent("seo.aiEntities"),
    aiIntent: tContent("seo.aiIntent") as "informational" | "navigational",
    breadcrumb,
  });

  useEffect(() => {
    track("docs_page_view", {
      component_name: "switch",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "switch",
        locale,
      });
    },
    [locale]
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  // ─── Estados controlados para o demo ────────────────────────────────────────

  const [demoNotifications, setDemoNotifications] = useState(true);
  const [demoMarketing, setDemoMarketing] = useState(false);
  const [demoDarkMode, setDemoDarkMode] = useState(false);
  const [demoSm, setDemoSm] = useState(false);

  // ─── Code strings ───────────────────────────────────────────────────────────

  const codeImportBasic = `import { Switch } from "@/components/ui/switch";`;
  const codeImportWithLabel = `import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";`;

  const codeDefault = `<div className="flex items-center space-x-2">
  <Switch id="notifications" />
  <Label htmlFor="notifications">Receber notificações por email</Label>
</div>`;

  const codeWithDescription = `<div className="flex items-center justify-between rounded-lg border p-4">
  <div className="space-y-0.5">
    <Label htmlFor="marketing">Emails de marketing</Label>
    <p className="text-sm text-muted-foreground">
      Receba novidades e promoções da plataforma.
    </p>
  </div>
  <Switch id="marketing" />
</div>`;

  const codeSm = `<div className="flex items-center space-x-2">
  <Switch id="airplane" size="sm" />
  <Label htmlFor="airplane">Modo avião</Label>
</div>`;

  const codeCustomizationTokens = `/* Em globals.css — tokens do Switch */
:root {
  --primary: 222 47% 11%;
  --primary-foreground: 210 40% 98%;
  --input: 214 32% 91%;
  --background: 0 0% 100%;
  --ring: 222 47% 11%;
  --destructive: 0 72% 51%;
  --foreground: 222 47% 11%;
}

.dark {
  --primary: 210 40% 98%;
  --primary-foreground: 222 47% 11%;
  --input: 217 33% 17%;
}`;

  const interfaceCode = `function Switch({
  className,
  size = "default",
  ...props
}: SwitchPrimitive.Root.Props & {
  size?: "sm" | "default"
}) {
  // Estende SwitchPrimitive.Root.Props do @base-ui/react/switch
  // Props principais:
  // checked?: boolean
  // defaultChecked?: boolean
  // onCheckedChange?: (checked: boolean) => void
  // disabled?: boolean
  // name?: string
  // size?: "default" | "sm"
  // id?: string
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
          installNote="npx shadcn@latest add switch"
        />
      }
    >
      {/* ── Demonstração ──────────────────────────────────────────── */}
      <DocsDemonstration title={tContent("demonstration.title")}>
        <div className="w-full max-w-md flex flex-col gap-5">
          <div className="flex items-center space-x-2">
            <Switch
              id="demo-notifications"
              checked={demoNotifications}
              onCheckedChange={setDemoNotifications}
            />
            <Label htmlFor="demo-notifications">
              {tContent("demonstration.labels.notifications")}
            </Label>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5 pr-4">
              <Label htmlFor="demo-marketing">
                {tContent("demonstration.labels.marketing")}
              </Label>
              <p className="text-sm text-muted-foreground">
                {tContent("demonstration.labels.marketingDesc")}
              </p>
            </div>
            <Switch
              id="demo-marketing"
              checked={demoMarketing}
              onCheckedChange={setDemoMarketing}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5 pr-4">
              <Label htmlFor="demo-darkmode">
                {tContent("demonstration.labels.darkMode")}
              </Label>
              <p className="text-sm text-muted-foreground">
                {tContent("demonstration.labels.darkModeDesc")}
              </p>
            </div>
            <Switch
              id="demo-darkmode"
              checked={demoDarkMode}
              onCheckedChange={setDemoDarkMode}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="demo-sm"
              size="sm"
              checked={demoSm}
              onCheckedChange={setDemoSm}
            />
            <Label htmlFor="demo-sm" className="text-xs">
              {tContent("demonstration.labels.sm")}
            </Label>
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
              element: tContent("usage.uxWriting.table.label.name"),
              rules: tContent("usage.uxWriting.table.label.format"),
              do: tContent("usage.uxWriting.table.label.good"),
              dont: tContent("usage.uxWriting.table.label.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.description.name"),
              rules: tContent("usage.uxWriting.table.description.format"),
              do: tContent("usage.uxWriting.table.description.good"),
              dont: tContent("usage.uxWriting.table.description.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.panel.name"),
              rules: tContent("usage.uxWriting.table.panel.format"),
              do: tContent("usage.uxWriting.table.panel.good"),
              dont: tContent("usage.uxWriting.table.panel.bad"),
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
              <div className="flex items-center space-x-2">
                <Switch id="dodont-1-do" defaultChecked />
                <Label htmlFor="dodont-1-do">Receber notificações por email</Label>
              </div>
            ),
            dontPreview: (
              <div className="flex items-center space-x-2">
                <Switch id="dodont-1-dont" defaultChecked />
                <Label htmlFor="dodont-1-dont">Notificações</Label>
              </div>
            ),
            doCaption: tContent("doDont.pair1.do"),
            dontCaption: tContent("doDont.pair1.dont"),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <div className="flex items-center space-x-2">
                <Switch id="dodont-2-do" />
                <Label htmlFor="dodont-2-do">Modo escuro</Label>
              </div>
            ),
            dontPreview: (
              <div className="flex items-center space-x-2">
                <Switch id="dodont-2-dont" />
                <span className="text-sm font-medium">Modo escuro</span>
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
        code={codeImportBasic}
        secondaryCode={codeImportWithLabel}
      />

      {/* ── Variantes ─────────────────────────────────────────────── */}
      <DocsVariants
        title={tContent("variants.title")}
        items={[
          {
            name: tContent("variants.items.default"),
            description: stripHtml(tContent("variants.styles.default")),
            code: codeDefault,
            preview: (
              <div className="flex items-center space-x-2">
                <Switch id="var-default" />
                <Label htmlFor="var-default">Receber notificações por email</Label>
              </div>
            ),
          },
          {
            name: tContent("variants.items.withDescription"),
            description: stripHtml(tContent("variants.styles.withDescription")),
            code: codeWithDescription,
            preview: (
              <div className="flex items-center justify-between w-80 rounded-lg border p-4">
                <div className="space-y-0.5 pr-4">
                  <Label htmlFor="var-marketing">Emails de marketing</Label>
                  <p className="text-sm text-muted-foreground">
                    Receba novidades e promoções da plataforma.
                  </p>
                </div>
                <Switch id="var-marketing" />
              </div>
            ),
          },
          {
            name: tContent("variants.items.sm"),
            description: stripHtml(tContent("variants.styles.sm")),
            code: codeSm,
            preview: (
              <div className="flex items-center space-x-2">
                <Switch id="var-sm" size="sm" />
                <Label htmlFor="var-sm" className="text-xs">
                  Modo avião
                </Label>
              </div>
            ),
          },
        ]}
      />

      {/* ── Composições ───────────────────────────────────────────── */}
      <DocsCompositions
        title={tContent("variants.compositionsTitle")}
        useWhenLabel={tNav("common.useWhen")}
        componentSlug="switch"
        items={[
          {
            name: tContent("variants.compositions.withLabel.name"),
            description: tContent("variants.compositions.withLabel.description"),
            useWhen: tContent("variants.compositions.withLabel.use"),
            code: `<div className="flex items-center space-x-2">\n  <Switch id="sw-email" />\n  <Label htmlFor="sw-email" className="text-sm font-medium leading-none cursor-pointer">\n    Receber notificações por email\n  </Label>\n</div>`,
            preview: (
              <div className="flex items-center space-x-2">
                <Switch id="sw-email" />
                <Label
                  htmlFor="sw-email"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  Receber notificações por email
                </Label>
              </div>
            ),
          },
          {
            name: tContent("variants.compositions.withDescription.name"),
            description: tContent("variants.compositions.withDescription.description"),
            useWhen: tContent("variants.compositions.withDescription.use"),
            code: `<div className="flex items-center justify-between rounded-lg border p-3 w-80">\n  <div className="flex flex-col gap-0.5 pr-3">\n    <Label htmlFor="sw-marketing">Emails de marketing</Label>\n    <p className="text-sm text-muted-foreground">\n      Receba novidades e promoções da plataforma.\n    </p>\n  </div>\n  <Switch id="sw-marketing" defaultChecked />\n</div>`,
            preview: (
              <div className="flex items-center justify-between rounded-lg border p-3 w-80">
                <div className="flex flex-col gap-0.5 pr-3">
                  <Label htmlFor="sw-marketing">Emails de marketing</Label>
                  <p className="text-sm text-muted-foreground">
                    Receba novidades e promoções da plataforma.
                  </p>
                </div>
                <Switch id="sw-marketing" defaultChecked />
              </div>
            ),
          },
          {
            name: tContent("variants.compositions.settingsList.name"),
            description: tContent("variants.compositions.settingsList.description"),
            useWhen: tContent("variants.compositions.settingsList.use"),
            code: `<div className="space-y-2 w-96">\n  <p className="text-sm font-semibold mb-3">Preferências de notificação</p>\n  <div className="flex items-center justify-between rounded-lg border p-3">\n    <div className="flex flex-col gap-0.5 pr-3">\n      <Label htmlFor="pref-email">Receber novidades por email</Label>\n      <p className="text-sm text-muted-foreground">Resumo semanal sobre o produto.</p>\n    </div>\n    <Switch id="pref-email" defaultChecked />\n  </div>\n  <div className="flex items-center justify-between rounded-lg border p-3">\n    <div className="flex flex-col gap-0.5 pr-3">\n      <Label htmlFor="pref-push">Receber notificações push</Label>\n      <p className="text-sm text-muted-foreground">Alertas no dispositivo em tempo real.</p>\n    </div>\n    <Switch id="pref-push" />\n  </div>\n  <div className="flex items-center justify-between rounded-lg border p-3">\n    <div className="flex flex-col gap-0.5 pr-3">\n      <Label htmlFor="pref-sms">Alertas por SMS</Label>\n      <p className="text-sm text-muted-foreground">Eventos críticos via mensagem de texto.</p>\n    </div>\n    <Switch id="pref-sms" />\n  </div>\n</div>`,
            preview: (
              <div className="space-y-2 w-96">
                <p className="text-sm font-semibold mb-3">Preferências de notificação</p>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex flex-col gap-0.5 pr-3">
                    <Label htmlFor="pref-email">Receber novidades por email</Label>
                    <p className="text-sm text-muted-foreground">
                      Resumo semanal sobre o produto.
                    </p>
                  </div>
                  <Switch id="pref-email" defaultChecked />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex flex-col gap-0.5 pr-3">
                    <Label htmlFor="pref-push">Receber notificações push</Label>
                    <p className="text-sm text-muted-foreground">
                      Alertas no dispositivo em tempo real.
                    </p>
                  </div>
                  <Switch id="pref-push" />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex flex-col gap-0.5 pr-3">
                    <Label htmlFor="pref-sms">Alertas por SMS</Label>
                    <p className="text-sm text-muted-foreground">
                      Eventos críticos via mensagem de texto.
                    </p>
                  </div>
                  <Switch id="pref-sms" />
                </div>
              </div>
            ),
          },
          {
            name: tContent("variants.compositions.inForm.name"),
            description: tContent("variants.compositions.inForm.description"),
            useWhen: tContent("variants.compositions.inForm.use"),
            code: `<form className="flex flex-col gap-3 w-80" onSubmit={(e) => e.preventDefault()}>\n  <div className="flex items-center space-x-2">\n    <Switch id="sw-form-newsletter" name="newsletter" defaultChecked />\n    <Label htmlFor="sw-form-newsletter">Aceitar newsletter semanal</Label>\n  </div>\n  <Button type="submit">Salvar preferências</Button>\n</form>`,
            preview: (
              <form
                className="flex flex-col gap-3 w-80"
                onSubmit={(e) => e.preventDefault()}
              >
                <div className="flex items-center space-x-2">
                  <Switch id="sw-form-newsletter" name="newsletter" defaultChecked />
                  <Label htmlFor="sw-form-newsletter">Aceitar newsletter semanal</Label>
                </div>
                <Button type="submit">Salvar preferências</Button>
              </form>
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
            label: tContent("states.items.unchecked"),
            trigger: "—",
            behavior: stripHtml(tContent("states.descriptions.unchecked")),
          },
          {
            label: tContent("states.items.checked"),
            trigger: "click / Space",
            behavior: stripHtml(tContent("states.descriptions.checked")),
          },
          {
            label: tContent("states.items.hover"),
            trigger: "pointer over",
            behavior: stripHtml(tContent("states.descriptions.hover")),
          },
          {
            label: tContent("states.items.focus"),
            trigger: "Tab",
            behavior: stripHtml(tContent("states.descriptions.focus")),
          },
          {
            label: tContent("states.items.disabled"),
            trigger: "disabled prop",
            behavior: stripHtml(tContent("states.descriptions.disabled")),
          },
          {
            label: tContent("states.items.invalid"),
            trigger: "aria-invalid",
            behavior: stripHtml(tContent("states.descriptions.invalid")),
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
                name: "checked",
                type: tContent("props.table.checked.type"),
                defaultValue: tContent("props.table.checked.default"),
                required: tContent("props.table.checked.required"),
                description: stripHtml(tContent("props.table.checked.description")),
              },
              {
                name: "defaultChecked",
                type: tContent("props.table.defaultChecked.type"),
                defaultValue: tContent("props.table.defaultChecked.default"),
                required: tContent("props.table.defaultChecked.required"),
                description: stripHtml(tContent("props.table.defaultChecked.description")),
              },
              {
                name: "onCheckedChange",
                type: tContent("props.table.onCheckedChange.type"),
                defaultValue: tContent("props.table.onCheckedChange.default"),
                required: tContent("props.table.onCheckedChange.required"),
                description: stripHtml(tContent("props.table.onCheckedChange.description")),
              },
              {
                name: "disabled",
                type: tContent("props.table.disabled.type"),
                defaultValue: tContent("props.table.disabled.default"),
                required: tContent("props.table.disabled.required"),
                description: stripHtml(tContent("props.table.disabled.description")),
              },
              {
                name: "name",
                type: tContent("props.table.name.type"),
                defaultValue: tContent("props.table.name.default"),
                required: tContent("props.table.name.required"),
                description: stripHtml(tContent("props.table.name.description")),
              },
              {
                name: "size",
                type: tContent("props.table.size.type"),
                defaultValue: tContent("props.table.size.default"),
                required: tContent("props.table.size.required"),
                description: stripHtml(tContent("props.table.size.description")),
              },
              {
                name: "id",
                type: tContent("props.table.id.type"),
                defaultValue: tContent("props.table.id.default"),
                required: tContent("props.table.id.required"),
                description: stripHtml(tContent("props.table.id.description")),
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
          { token: "--input",              value: tContent("tokens.table.input.class"),             description: tContent("tokens.table.input.part") },
          { token: "--primary",            value: tContent("tokens.table.primary.class"),            description: tContent("tokens.table.primary.part") },
          { token: "--background",         value: tContent("tokens.table.background.class"),         description: tContent("tokens.table.background.part") },
          { token: "--primary-foreground", value: tContent("tokens.table.primaryForeground.class"),  description: tContent("tokens.table.primaryForeground.part") },
          { token: "--ring",               value: tContent("tokens.table.ring.class"),               description: tContent("tokens.table.ring.part") },
          { token: "--destructive",        value: tContent("tokens.table.destructive.class"),        description: tContent("tokens.table.destructive.part") },
          { token: "--foreground",         value: tContent("tokens.table.foreground.class"),         description: tContent("tokens.table.foreground.part") },
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
          { key: "Tab",   description: tContent("accessibility.keyboard.tab") },
          { key: "Space", description: tContent("accessibility.keyboard.space") },
          { key: "Enter", description: tContent("accessibility.keyboard.enter") },
        ]}
      />

      {/* ── Relacionados ──────────────────────────────────────────── */}
      <DocsRelated
        title={tContent("related.title")}
        items={[
          {
            name: tContent("related.items.checkbox.name"),
            description: tContent("related.items.checkbox.description"),
            path: "?path=/docs/ui-checkbox--docs",
          },
          {
            name: tContent("related.items.toggle.name"),
            description: tContent("related.items.toggle.description"),
            path: "?path=/docs/ui-toggle--docs",
          },
          {
            name: tContent("related.items.radioGroup.name"),
            description: tContent("related.items.radioGroup.description"),
            path: "?path=/docs/ui-radiogroup--docs",
          },
          {
            name: tContent("related.items.form.name"),
            description: tContent("related.items.form.description"),
            path: "?path=/docs/ui-form--docs",
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
            payload: '{ component_name: "switch", locale, page_title }',
          },
          {
            event: "docs_section_viewed",
            trigger: tNav("common.sectionViewed") || "Seção entra no viewport",
            payload: '{ section_id, component_name: "switch", locale }',
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
          items: [1, 2, 3, 4].map((i) => ({
            story: tContent(`testes.visual.item${i}.story`),
            priority: tNav(priorityKeyMap[tContent(`testes.visual.item${i}.priority`)] ?? "common.high"),
          })),
        }}
      />
    </DocsPageLayout>
  );
}
