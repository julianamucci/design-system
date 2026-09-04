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

export function SwitchDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(switchTranslations);

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria.
  const screenReaderItems = useMemo(
    () =>
      Object.values(
        (switchTranslations as unknown as Record<
          string,
          { accessibility?: { screenReader?: Record<string, string> } }
        >)[locale]?.accessibility?.screenReader ?? {},
      ),
    [locale],
  );

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

  const trackSwitchChange =
    (fieldName: string, setter: (checked: boolean) => void) =>
    (checked: boolean) => {
      setter(checked);
      track("field_change", {
        component: "switch",
        field_name: fieldName,
        value: String(checked),
        location: "docs_demo",
      });
    };
  const [demoMarketing, setDemoMarketing] = useState(false);
  const [demoDarkMode, setDemoDarkMode] = useState(false);
  const [demoSm, setDemoSm] = useState(false);

  // ─── Code strings ───────────────────────────────────────────────────────────

  const codeImportBasic = `import { Switch } from "@/components/ui/switch";`;
  const codeImportWithLabel = `import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";`;

  const codeDefault = `<div className="nds-cluster" data-spacing="sm">
  <Switch id="notifications" />
  <Label htmlFor="notifications">Receber notificações</Label>
</div>`;

  const codeWithDescription = `<div className="nds-cluster nds-rounded-lg nds-border-default nds-p-2" data-justify="between">
  <div className="nds-stack" data-spacing="xs">
    <Label htmlFor="marketing">Emails de marketing</Label>
    <p className="nds-text-body">
      Receba novidades e promoções da plataforma.
    </p>
  </div>
  <Switch id="marketing" />
</div>`;

  const codeSm = `<div className="nds-cluster" data-spacing="sm">
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
        />
      }
    >
      {/* ── Demonstração ──────────────────────────────────────────── */}
      <DocsDemonstration title={tContent("demonstration.title")}>
        <div className="nds-stack" data-spacing="sm">
          <div className="nds-cluster" data-spacing="sm">
            <Switch
              id="demo-notifications"
              checked={demoNotifications}
              onCheckedChange={trackSwitchChange("notifications", setDemoNotifications)}
            />
            <Label htmlFor="demo-notifications">
              {tContent("demonstration.labels.notifications")}
            </Label>
          </div>

          <div className="nds-cluster nds-rounded-lg nds-border-default nds-p-2 nds-w-sm" data-justify="between">
            <div className="nds-stack" data-spacing="xs" style={{ paddingRight: "var(--spacing-2)" }}>
              <Label htmlFor="demo-marketing">
                {tContent("demonstration.labels.marketing")}
              </Label>
              <p className="nds-text-body">
                {tContent("demonstration.labels.marketingDesc")}
              </p>
            </div>
            <Switch
              id="demo-marketing"
              checked={demoMarketing}
              onCheckedChange={trackSwitchChange("marketing_emails", setDemoMarketing)}
            />
          </div>

          <div className="nds-cluster nds-rounded-lg nds-border-default nds-p-2 nds-w-sm" data-justify="between">
            <div className="nds-stack" data-spacing="xs" style={{ paddingRight: "var(--spacing-2)" }}>
              <Label htmlFor="demo-darkmode">
                {tContent("demonstration.labels.darkMode")}
              </Label>
              <p className="nds-text-body">
                {tContent("demonstration.labels.darkModeDesc")}
              </p>
            </div>
            <Switch
              id="demo-darkmode"
              checked={demoDarkMode}
              onCheckedChange={trackSwitchChange("dark_mode", setDemoDarkMode)}
            />
          </div>

          <div className="nds-cluster" data-spacing="sm">
            <Switch
              id="demo-sm"
              size="sm"
              checked={demoSm}
              onCheckedChange={trackSwitchChange("compact_switch", setDemoSm)}
            />
            <Label htmlFor="demo-sm" className="nds-text-caption">
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
              <div className="nds-cluster" data-spacing="sm">
                <Switch id="dodont-1-do" defaultChecked />
                <Label htmlFor="dodont-1-do">Receber notificações</Label>
              </div>
            ),
            dontPreview: (
              <div className="nds-cluster" data-spacing="sm">
                <Switch id="dodont-1-dont" defaultChecked />
                <Label htmlFor="dodont-1-dont">Notificações</Label>
              </div>
            ),
            doCaption: toPlainText(tContent("doDont.pair1.do")),
            dontCaption: toPlainText(tContent("doDont.pair1.dont")),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <div className="nds-cluster" data-spacing="sm">
                <Switch id="dodont-2-do" />
                <Label htmlFor="dodont-2-do">Modo escuro</Label>
              </div>
            ),
            dontPreview: (
              // O "don't" é o texto solto em <span> (sem associação clicável);
              // o aria-label mantém o nome acessível do switch (axe
              // aria-toggle-field-name) sem alterar o pixel do exemplo.
              <div className="nds-cluster" data-spacing="sm">
                <Switch id="dodont-2-dont" aria-label="Modo escuro" />
                <span className="nds-text-body nds-font-medium nds-leading-none">Modo escuro</span>
              </div>
            ),
            doCaption: toPlainText(tContent("doDont.pair2.do")),
            dontCaption: toPlainText(tContent("doDont.pair2.dont")),
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
            trackId: "default",
            name: tContent("variants.items.default"),
            description: stripHtml(tContent("variants.styles.default")),
            code: codeDefault,
            preview: (
              <div className="nds-cluster" data-spacing="sm">
                <Switch id="var-default" />
                <Label htmlFor="var-default">Receber notificações</Label>
              </div>
            ),
          },
          {
            trackId: "withDescription",
            name: tContent("variants.items.withDescription"),
            description: stripHtml(tContent("variants.styles.withDescription")),
            code: codeWithDescription,
            preview: (
              <div className="nds-cluster nds-rounded-lg nds-border-default nds-p-2 nds-w-sm" data-justify="between">
                <div className="nds-stack" data-spacing="xs" style={{ paddingRight: "var(--spacing-2)" }}>
                  <Label htmlFor="var-marketing">Emails de marketing</Label>
                  <p className="nds-text-body">
                    Receba novidades e promoções da plataforma.
                  </p>
                </div>
                <Switch id="var-marketing" />
              </div>
            ),
          },
          {
            trackId: "sm",
            name: tContent("variants.items.sm"),
            description: stripHtml(tContent("variants.styles.sm")),
            code: codeSm,
            preview: (
              <div className="nds-cluster" data-spacing="sm">
                <Switch id="var-sm" size="sm" />
                <Label htmlFor="var-sm" className="nds-text-caption">
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
            trackId: "withLabel",
            name: tContent("variants.compositions.withLabel.name"),
            description: tContent("variants.compositions.withLabel.description"),
            useWhen: tContent("variants.compositions.withLabel.use"),
            code: `<div className="nds-cluster" data-spacing="sm">\n  <Switch id="sw-email" />\n  <Label htmlFor="sw-email" className="nds-text-body nds-font-medium nds-leading-none nds-cursor-pointer">\n    Receber notificações\n  </Label>\n</div>`,
            preview: (
              <div className="nds-cluster" data-spacing="sm">
                <Switch id="sw-email" />
                <Label
                  htmlFor="sw-email"
                  className="nds-text-body nds-font-medium nds-leading-none nds-cursor-pointer"
                >
                  Receber notificações
                </Label>
              </div>
            ),
          },
          {
            trackId: "withoutLabel",
            name: tContent("variants.compositions.withoutLabel.name"),
            description: tContent("variants.compositions.withoutLabel.description"),
            useWhen: tContent("variants.compositions.withoutLabel.use"),
            code: `<Switch id="doc-no-label" aria-label="Ativar modo escuro" />`,
            preview: <Switch id="doc-no-label" aria-label="Ativar modo escuro" />,
          },
          {
            trackId: "settingsList",
            name: tContent("variants.compositions.settingsList.name"),
            description: tContent("variants.compositions.settingsList.description"),
            useWhen: tContent("variants.compositions.settingsList.use"),
            code: `<fieldset className="nds-border-none nds-p-0 nds-m-0 nds-w-sm">\n  <legend className="nds-text-body nds-font-semibold nds-mb-2">Preferências de notificação</legend>\n  <div className="nds-stack" data-spacing="sm">\n    <div className="nds-cluster nds-rounded-lg nds-border-default nds-p-2" data-justify="between">\n      <div className="nds-stack" data-spacing="xs" style={{ paddingRight: "var(--spacing-2)" }}>\n        <Label htmlFor="pref-email">Receber novidades por email</Label>\n        <p className="nds-text-body">Resumo semanal sobre o produto.</p>\n      </div>\n      <Switch id="pref-email" defaultChecked />\n    </div>\n    <div className="nds-cluster nds-rounded-lg nds-border-default nds-p-2" data-justify="between">\n      <div className="nds-stack" data-spacing="xs" style={{ paddingRight: "var(--spacing-2)" }}>\n        <Label htmlFor="pref-push">Receber notificações push</Label>\n        <p className="nds-text-body">Alertas no dispositivo em tempo real.</p>\n      </div>\n      <Switch id="pref-push" />\n    </div>\n    <div className="nds-cluster nds-rounded-lg nds-border-default nds-p-2" data-justify="between">\n      <div className="nds-stack" data-spacing="xs" style={{ paddingRight: "var(--spacing-2)" }}>\n        <Label htmlFor="pref-sms">Alertas por SMS</Label>\n        <p className="nds-text-body">Eventos críticos via mensagem de texto.</p>\n      </div>\n      <Switch id="pref-sms" />\n    </div>\n  </div>\n</fieldset>`,
            preview: (
              // É `fieldset` + `legend`, e não `div` + `<p>`, porque os três
              // interruptores são UM grupo: só o fieldset amarra os controles ao
              // título, e é assim que o leitor de tela anuncia "Preferências de
              // notificação" ao entrar em cada um (WCAG 1.3.1). Com `<p>` o título
              // é texto solto e os três ficam órfãos. O `nds-stack` mora no div
              // INTERNO: fieldset com display flex/grid tem histórico de bug de
              // layout em navegador.
              <fieldset className="nds-border-none nds-p-0 nds-m-0 nds-w-sm">
                {/* Com fieldset a legend virou o NOME ACESSÍVEL do grupo, e nome
                    acessível preso a um idioma quebra nos outros dois: sai da
                    mesma chave de conteúdo que os rótulos vizinhos usam. */}
                <legend className="nds-text-body nds-font-semibold nds-mb-2">
                  {tContent("demonstration.labels.preferencesGroup")}
                </legend>
                <div className="nds-stack" data-spacing="sm">
                  <div className="nds-cluster nds-rounded-lg nds-border-default nds-p-2" data-justify="between">
                    <div className="nds-stack" data-spacing="xs" style={{ paddingRight: "var(--spacing-2)" }}>
                      <Label htmlFor="pref-email">Receber novidades por email</Label>
                      <p className="nds-text-body">
                        Resumo semanal sobre o produto.
                      </p>
                    </div>
                    <Switch id="pref-email" defaultChecked />
                  </div>
                  <div className="nds-cluster nds-rounded-lg nds-border-default nds-p-2" data-justify="between">
                    <div className="nds-stack" data-spacing="xs" style={{ paddingRight: "var(--spacing-2)" }}>
                      <Label htmlFor="pref-push">Receber notificações push</Label>
                      <p className="nds-text-body">
                        Alertas no dispositivo em tempo real.
                      </p>
                    </div>
                    <Switch id="pref-push" />
                  </div>
                  <div className="nds-cluster nds-rounded-lg nds-border-default nds-p-2" data-justify="between">
                    <div className="nds-stack" data-spacing="xs" style={{ paddingRight: "var(--spacing-2)" }}>
                      <Label htmlFor="pref-sms">Alertas por SMS</Label>
                      <p className="nds-text-body">
                        Eventos críticos via mensagem de texto.
                      </p>
                    </div>
                    <Switch id="pref-sms" />
                  </div>
                </div>
              </fieldset>
            ),
          },
          {
            trackId: "inForm",
            name: tContent("variants.compositions.inForm.name"),
            description: tContent("variants.compositions.inForm.description"),
            useWhen: tContent("variants.compositions.inForm.use"),
            code: `<form className="nds-stack nds-w-sm" data-spacing="sm" onSubmit={(e) => e.preventDefault()}>\n  <div className="nds-cluster" data-spacing="sm">\n    <Switch id="sw-form-newsletter" name="newsletter" defaultChecked />\n    <Label htmlFor="sw-form-newsletter">Aceitar newsletter semanal</Label>\n  </div>\n  <Button type="submit">Salvar preferências</Button>\n</form>`,
            preview: (
              <form
                className="nds-stack nds-w-sm" data-spacing="sm"
                onSubmit={(e) => e.preventDefault()}
              >
                <div className="nds-cluster" data-spacing="sm">
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
          state: tContent("states.cols.state"),
          trigger: toPlainText(tContent("states.cols.trigger")),
          behavior: toPlainText(tContent("states.cols.behavior")),
        }}
        items={[
          {
            label: tContent("states.unchecked.label"),
            trigger: toPlainText(tContent("states.unchecked.trigger")),
            behavior: toPlainText(tContent("states.unchecked.behavior")),
          },
          {
            label: tContent("states.checked.label"),
            trigger: toPlainText(tContent("states.checked.trigger")),
            behavior: toPlainText(tContent("states.checked.behavior")),
          },
          {
            label: tContent("states.hover.label"),
            trigger: toPlainText(tContent("states.hover.trigger")),
            behavior: toPlainText(tContent("states.hover.behavior")),
          },
          {
            label: tContent("states.focus.label"),
            trigger: toPlainText(tContent("states.focus.trigger")),
            behavior: toPlainText(tContent("states.focus.behavior")),
          },
          {
            label: tContent("states.disabled.label"),
            trigger: toPlainText(tContent("states.disabled.trigger")),
            behavior: toPlainText(tContent("states.disabled.behavior")),
          },
          {
            label: tContent("states.invalid.label"),
            trigger: toPlainText(tContent("states.invalid.trigger")),
            behavior: toPlainText(tContent("states.invalid.behavior")),
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
                description: toPlainText(tContent("props.table.checked.description")),
              },
              {
                name: "defaultChecked",
                type: tContent("props.table.defaultChecked.type"),
                defaultValue: tContent("props.table.defaultChecked.default"),
                required: tContent("props.table.defaultChecked.required"),
                description: toPlainText(tContent("props.table.defaultChecked.description")),
              },
              {
                name: "onCheckedChange",
                type: tContent("props.table.onCheckedChange.type"),
                defaultValue: tContent("props.table.onCheckedChange.default"),
                required: tContent("props.table.onCheckedChange.required"),
                description: toPlainText(tContent("props.table.onCheckedChange.description")),
              },
              {
                name: "disabled",
                type: tContent("props.table.disabled.type"),
                defaultValue: tContent("props.table.disabled.default"),
                required: tContent("props.table.disabled.required"),
                description: toPlainText(tContent("props.table.disabled.description")),
              },
              {
                name: "name",
                type: tContent("props.table.name.type"),
                defaultValue: tContent("props.table.name.default"),
                required: tContent("props.table.name.required"),
                description: toPlainText(tContent("props.table.name.description")),
              },
              {
                name: "size",
                type: tContent("props.table.size.type"),
                defaultValue: tContent("props.table.size.default"),
                required: tContent("props.table.size.required"),
                description: toPlainText(tContent("props.table.size.description")),
              },
              {
                name: "id",
                type: tContent("props.table.id.type"),
                defaultValue: tContent("props.table.id.default"),
                required: tContent("props.table.id.required"),
                description: toPlainText(tContent("props.table.id.description")),
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
          { token: "--input",       value: tContent("tokens.table.input.class"),       description: tContent("tokens.table.input.part") },
          { token: "--primary",     value: tContent("tokens.table.primary.class"),     description: tContent("tokens.table.primary.part") },
          { token: "--background",  value: tContent("tokens.table.background.class"),  description: tContent("tokens.table.background.part") },
          { token: "--ring",        value: tContent("tokens.table.ring.class"),        description: tContent("tokens.table.ring.part") },
          { token: "--destructive", value: tContent("tokens.table.destructive.class"), description: tContent("tokens.table.destructive.part") },
        ]}
        customizationTitle={tContent("tokens.customizationTitle")}
        customizationCode={codeCustomizationTokens}
      />

      {/* ── Acessibilidade ────────────────────────────────────────── */}
      <DocsAccessibility
        screenReaderTitle={tNav("common.screenReader")}
        screenReaderItems={screenReaderItems}
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
            description: toPlainText(tContent("related.items.checkbox.description")),
            path: "?path=/docs/components-form-checkbox--docs",
          },
          {
            name: tContent("related.items.toggle.name"),
            description: toPlainText(tContent("related.items.toggle.description")),
            path: "?path=/docs/components-form-toggle--docs",
          },
          {
            name: tContent("related.items.radioGroup.name"),
            description: toPlainText(tContent("related.items.radioGroup.description")),
            path: "?path=/docs/components-form-radiogroup--docs",
          },
          {
            name: tContent("related.items.form.name"),
            description: toPlainText(tContent("related.items.form.description")),
            path: "?path=/docs/components-form-form--docs",
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
          trigger: toPlainText(tContent("analytics.table.trigger")),
          payload: tContent("analytics.table.payload"),
        }}
        items={[
          {
            event: "field_change",
            trigger: toPlainText(tContent("analytics.table.field_change.trigger")),
            payload: tContent("analytics.table.field_change.payload"),
          },
          {
            event: "docs_page_view",
            trigger: tNav("common.pageMount"),
            payload: '{ component_name: "switch", locale, page_title }',
          },
          {
            event: "docs_section_viewed",
            trigger: tNav("common.sectionViewed"),
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
            action: toPlainText(tContent(`testes.functional.item${i}.action`)),
            result: toPlainText(tContent(`testes.functional.item${i}.result`)),
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
            criterion: toPlainText(tContent(`testes.accessibility.item${i}`)),
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
