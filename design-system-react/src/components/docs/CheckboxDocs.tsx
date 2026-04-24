import { useCallback, useEffect, useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import uiTranslations from "@/i18n/ui.json";
import checkboxTranslations from "@shared/content/checkbox/translations.json";

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

// ─── Componente principal ─────────────────────────────────────────────────────

export function CheckboxDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(checkboxTranslations);

  const navGroups = useMemo(() => getNavGroups(tNav), [tNav]);
  const allIds = useMemo(
    () => navGroups.flatMap((g) => g.sections.map((s) => s.id)),
    [navGroups]
  );

  useSeoEffect({
    title: tContent("seo.title"),
    description: tContent("seo.description"),
    locale,
    componentSlug: "checkbox",
  });

  useEffect(() => {
    track("docs_page_view", {
      component_name: "checkbox",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "checkbox",
        locale,
      });
    },
    [locale]
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  // ─── Code strings ───────────────────────────────────────────────────────────

  const codeImportBasic = `import { Checkbox } from "@/components/ui/checkbox";`;

  const codeImportWithLabel = `import { Checkbox } from "@/components/ui/checkbox";`;

  const codeDefault = `<Checkbox id="termos" />`;

  const codeChecked = `<Checkbox id="termos" defaultChecked />`;

  const codeWithLabel = `<div className="flex items-center gap-2">
  <Checkbox id="termos" />
  <label
    htmlFor="termos"
    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
  >
    Aceito os termos e condições
  </label>
</div>`;

  const codeWithDescription = `<div className="flex gap-2">
  <Checkbox id="newsletter" className="mt-0.5" />
  <div className="flex flex-col gap-0.5">
    <label
      htmlFor="newsletter"
      className="text-sm font-medium leading-none cursor-pointer"
    >
      Receber novidades por email
    </label>
    <p className="text-sm text-muted-foreground">
      Enviaremos no máximo 2 emails por semana.
    </p>
  </div>
</div>`;

  const codeCustomizationTokens = `/* Em globals.css — tokens do Checkbox */
:root {
  --primary: 222 47% 11%;
  --primary-foreground: 210 40% 98%;
  --input: 214 32% 91%;
  --ring: 222 47% 11%;
  --destructive: 0 72% 51%;
}

.dark {
  --primary: 210 40% 98%;
  --primary-foreground: 222 47% 11%;
  --input: 217 33% 17%;
}`;

  const interfaceCode = `function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  // Estende CheckboxPrimitive.Root.Props do @base-ui/react/checkbox
  // Props principais:
  // checked?: boolean
  // defaultChecked?: boolean
  // onCheckedChange?: (checked: boolean) => void
  // disabled?: boolean
  // required?: boolean
  // name?: string
  // value?: string
  // className?: string
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
          installNote="npx shadcn@latest add checkbox"
        />
      }
    >
          {/* ── Demonstração ──────────────────────────────────────────── */}
          <DocsDemonstration title={tContent("demonstration.title")}>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Checkbox id="demo-terms" />
                <label htmlFor="demo-terms" className="text-sm font-medium leading-none cursor-pointer">
                  {tContent("demonstration.labels.acceptTerms")}
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="demo-newsletter" defaultChecked />
                <label htmlFor="demo-newsletter" className="text-sm font-medium leading-none cursor-pointer">
                  {tContent("demonstration.labels.newsletter")}
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="demo-remember" />
                <label htmlFor="demo-remember" className="text-sm font-medium leading-none cursor-pointer">
                  {tContent("demonstration.labels.rememberMe")}
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="demo-notif" disabled />
                <label
                  htmlFor="demo-notif"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {tContent("demonstration.labels.notifications")}
                </label>
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
              items: [
                { s: tContent("usage.scenarios.item1.s"), u: tContent("usage.scenarios.item1.u"), a: tContent("usage.scenarios.item1.a") },
                { s: tContent("usage.scenarios.item2.s"), u: tContent("usage.scenarios.item2.u"), a: tContent("usage.scenarios.item2.a") },
                { s: tContent("usage.scenarios.item3.s"), u: tContent("usage.scenarios.item3.u"), a: tContent("usage.scenarios.item3.a") },
                { s: tContent("usage.scenarios.item4.s"), u: tContent("usage.scenarios.item4.u"), a: tContent("usage.scenarios.item4.a") },
                { s: tContent("usage.scenarios.item5.s"), u: tContent("usage.scenarios.item5.u"), a: tContent("usage.scenarios.item5.a") },
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
                  <div className="flex items-center gap-2">
                    <Checkbox id="dodont-1-do" defaultChecked />
                    <label htmlFor="dodont-1-do" className="text-sm font-medium leading-none cursor-pointer">
                      Receber notificações por email
                    </label>
                  </div>
                ),
                dontPreview: (
                  <div className="flex items-center gap-2">
                    <Checkbox id="dodont-1-dont" defaultChecked />
                    <label htmlFor="dodont-1-dont" className="text-sm font-medium leading-none cursor-pointer">
                      Email
                    </label>
                  </div>
                ),
                doCaption: tContent("doDont.pair1.do"),
                dontCaption: tContent("doDont.pair1.dont"),
              },
              {
                doLabel: tNav("common.do"),
                dontLabel: tNav("common.dont"),
                doPreview: (
                  <fieldset className="border-none p-0 m-0 space-y-2">
                    <legend className="text-sm font-semibold mb-2">Preferências</legend>
                    {["Email", "SMS", "Push"].map((opt) => (
                      <div key={opt} className="flex items-center gap-2">
                        <Checkbox id={`dodont-2-do-${opt}`} />
                        <label htmlFor={`dodont-2-do-${opt}`} className="text-sm font-medium leading-none cursor-pointer">
                          {opt}
                        </label>
                      </div>
                    ))}
                  </fieldset>
                ),
                dontPreview: (
                  <div className="space-y-2">
                    {["Email", "SMS", "Push"].map((opt) => (
                      <div key={opt} className="flex items-center gap-2">
                        <Checkbox id={`dodont-2-dont-${opt}`} />
                        <label htmlFor={`dodont-2-dont-${opt}`} className="text-sm font-medium leading-none cursor-pointer">
                          {opt}
                        </label>
                      </div>
                    ))}
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
            description={tContent("import.react")}
            code={codeImportBasic}
            secondaryDescription={tContent("import.react")}
            secondaryCode={codeImportWithLabel}
          />

          {/* ── Variantes ─────────────────────────────────────────────── */}
          <DocsVariants
            title={tContent("variants.title")}
            items={[
              {
                name: "default",
                description: stripHtml(tContent("variants.items.default")),
                code: codeDefault,
                preview: (
                  <div className="flex items-center gap-2">
                    <Checkbox id="var-default" />
                    <label htmlFor="var-default" className="text-sm font-medium leading-none cursor-pointer">
                      {tContent("demonstration.labels.rememberMe")}
                    </label>
                  </div>
                ),
              },
              {
                name: "checked",
                description: stripHtml(tContent("variants.items.checked")),
                code: codeChecked,
                preview: (
                  <div className="flex items-center gap-2">
                    <Checkbox id="var-checked" defaultChecked />
                    <label htmlFor="var-checked" className="text-sm font-medium leading-none cursor-pointer">
                      {tContent("demonstration.labels.newsletter")}
                    </label>
                  </div>
                ),
              },
              {
                name: "withLabel",
                description: stripHtml(tContent("variants.items.withLabel")),
                code: codeWithLabel,
                preview: (
                  <div className="flex items-center gap-2">
                    <Checkbox id="var-with-label" />
                    <label
                      htmlFor="var-with-label"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {tContent("demonstration.labels.acceptTerms")}
                    </label>
                  </div>
                ),
              },
              {
                name: "withDescription",
                description: stripHtml(tContent("variants.items.withDescription")),
                code: codeWithDescription,
                preview: (
                  <div className="flex gap-2">
                    <Checkbox id="var-with-desc" className="mt-0.5" />
                    <div className="flex flex-col gap-0.5">
                      <label
                        htmlFor="var-with-desc"
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {tContent("demonstration.labels.newsletter")}
                      </label>
                      <p className="text-sm text-muted-foreground">
                        Enviaremos no máximo 2 emails por semana.
                      </p>
                    </div>
                  </div>
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
                label: tContent("states.unchecked.label"),
                trigger: tContent("states.unchecked.trigger"),
                behavior: stripHtml(tContent("states.unchecked.behavior")),
              },
              {
                label: tContent("states.checked.label"),
                trigger: stripHtml(tContent("states.checked.trigger")),
                behavior: stripHtml(tContent("states.checked.behavior")),
              },
              {
                label: tContent("states.indeterminate.label"),
                trigger: stripHtml(tContent("states.indeterminate.trigger")),
                behavior: stripHtml(tContent("states.indeterminate.behavior")),
              },
              {
                label: tContent("states.disabled.label"),
                trigger: stripHtml(tContent("states.disabled.trigger")),
                behavior: stripHtml(tContent("states.disabled.behavior")),
              },
              {
                label: tContent("states.error.label"),
                trigger: stripHtml(tContent("states.error.trigger")),
                behavior: stripHtml(tContent("states.error.behavior")),
              },
            ]}
          />

          {/* ── Propriedades ──────────────────────────────────────────── */}
          <DocsProps
            title={tContent("props.title")}
            tables={[
              {
                title: tContent("props.reactTitle"),
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
                    type: "boolean",
                    defaultValue: "—",
                    required: "Não",
                    description: stripHtml(tContent("props.items.checked")),
                  },
                  {
                    name: "defaultChecked",
                    type: "boolean",
                    defaultValue: "false",
                    required: "Não",
                    description: stripHtml(tContent("props.items.defaultChecked")),
                  },
                  {
                    name: "onCheckedChange",
                    type: "(checked: boolean) => void",
                    defaultValue: "—",
                    required: "Não",
                    description: stripHtml(tContent("props.items.onCheckedChange")),
                  },
                  {
                    name: "disabled",
                    type: "boolean",
                    defaultValue: "false",
                    required: "Não",
                    description: stripHtml(tContent("props.items.disabled")),
                  },
                  {
                    name: "required",
                    type: "boolean",
                    defaultValue: "false",
                    required: "Não",
                    description: stripHtml(tContent("props.items.required")),
                  },
                  {
                    name: "name",
                    type: "string",
                    defaultValue: "—",
                    required: "Não",
                    description: stripHtml(tContent("props.items.name")),
                  },
                  {
                    name: "value",
                    type: "string",
                    defaultValue: '"on"',
                    required: "Não",
                    description: stripHtml(tContent("props.items.value")),
                  },
                  {
                    name: "className",
                    type: "string",
                    defaultValue: "—",
                    required: "Não",
                    description: stripHtml(tContent("props.items.className")),
                  },
                ],
              },
            ]}
            interfaceCode={interfaceCode}
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
              { token: "--primary",            value: "data-checked:bg-primary",               description: tContent("tokens.table.primary") },
              { token: "--primary-foreground",  value: "data-checked:text-primary-foreground",  description: tContent("tokens.table.primaryForeground") },
              { token: "--input",               value: "border-input",                          description: tContent("tokens.table.input") },
              { token: "--ring",                value: "focus-visible:ring-ring/50",             description: tContent("tokens.table.ring") },
              { token: "--destructive",         value: "aria-invalid:border-destructive",        description: tContent("tokens.table.destructive") },
              { token: "--border",              value: "border",                                description: tContent("tokens.table.border") },
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
            keyboardTitle={tContent("accessibility.title")}
            keyboardItems={[
              { key: "Tab",       description: tContent("accessibility.keyboard.tab") },
              { key: "Space",     description: tContent("accessibility.keyboard.space") },
              { key: "Shift+Tab", description: tContent("accessibility.keyboard.shiftTab") },
              { key: "—",         description: stripHtml(tContent("accessibility.keyboard.disabled")) },
            ]}
          />

          {/* ── Relacionados ──────────────────────────────────────────── */}
          <DocsRelated
            title={tContent("related.title")}
            items={[
              {
                name: "Switch",
                description: stripHtml(tContent("related.switch")),
                path: "?path=/docs/ui-switch--docs",
              },
              {
                name: "RadioGroup",
                description: stripHtml(tContent("related.radioGroup")),
                path: "?path=/docs/ui-radiogroup--docs",
              },
              {
                name: "Form",
                description: tContent("related.form"),
                path: "?path=/docs/ui-form--docs",
              },
              {
                name: "Select",
                description: stripHtml(tContent("related.select")),
                path: "?path=/docs/ui-select--docs",
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
              { title: "", content: tContent("notes.tip4") },
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
                event: tContent("analytics.table.fieldChange"),
                trigger: tContent("analytics.table.fieldChangeTrigger"),
                payload: tContent("analytics.table.fieldChangePayload"),
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
    </DocsPageLayout>
  );
}
