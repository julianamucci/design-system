import { useCallback, useEffect, useMemo } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  TriangleAlert,
} from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import { useActiveSection } from "@/lib/use-active-section";
import uiTranslations from "@/i18n/ui.json";
import alertTranslations from "@shared/content/alert/translations.json";

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

export function AlertDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(alertTranslations);

  const navGroups = useMemo(() => getNavGroups(tNav), [tNav]);
  const allIds = useMemo(
    () => navGroups.flatMap((g) => g.sections.map((s) => s.id)),
    [navGroups]
  );

  useSeoEffect({
    title: tContent("seo.title"),
    description: tContent("seo.description"),
    locale,
    componentSlug: "alert",
  });

  useEffect(() => {
    track("docs_page_view", {
      component_name: "alert",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "alert",
        locale,
      });
    },
    [locale]
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  // ─── Code strings ───────────────────────────────────────────────────────────

  const codeImportBasic = `import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";`;
  const codeImportWithIcon = `import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";`;

  const codeDefault = `<Alert>
  <Info aria-hidden="true" className="h-4 w-4" />
  <AlertTitle>Atenção</AlertTitle>
  <AlertDescription>
    Suas alterações serão aplicadas na próxima sessão.
  </AlertDescription>
</Alert>`;

  const codeDestructive = `<Alert variant="destructive">
  <AlertCircle aria-hidden="true" className="h-4 w-4" />
  <AlertTitle>Erro ao salvar</AlertTitle>
  <AlertDescription>
    Não foi possível salvar. Verifique sua conexão e tente novamente.
  </AlertDescription>
</Alert>`;

  const codeSuccess = `<Alert className="bg-success/10 text-success border-success/30">
  <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
  <AlertTitle>Perfil atualizado</AlertTitle>
  <AlertDescription>
    Suas informações foram salvas com sucesso.
  </AlertDescription>
</Alert>`;

  const codeWarning = `<Alert className="bg-warning/10 text-warning border-warning/30">
  <TriangleAlert aria-hidden="true" className="h-4 w-4" />
  <AlertTitle>Assinatura expirando</AlertTitle>
  <AlertDescription>
    Sua assinatura expira em 3 dias. Renove para evitar interrupções.
  </AlertDescription>
</Alert>`;

  const codeWithoutTitle = `<Alert>
  <Info aria-hidden="true" className="h-4 w-4" />
  <AlertDescription>
    Suas alterações serão aplicadas na próxima sessão.
  </AlertDescription>
</Alert>`;

  const codeCustomizationTokens = `/* Em globals.css — definir tokens semânticos */
:root {
  --success: 142 76% 36%;
  --warning: 38 92% 50%;
}

.dark {
  --success: 142 69% 58%;
  --warning: 48 96% 53%;
}`;

  const interfaceCode = `// Alert
interface AlertProps extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof alertVariants> {}

// AlertTitle
interface AlertTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

// AlertDescription
interface AlertDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}`;

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
          installNote="npx shadcn@latest add alert"
        />
      }
    >
          {/* ── Demonstração ──────────────────────────────────────────── */}
          <DocsDemonstration title={tContent("demonstration.title")}>
            <div className="w-full space-y-3">
              <Alert>
                <Info aria-hidden="true" className="h-4 w-4" />
                <AlertTitle>{tContent("demonstration.labels.infoTitle")}</AlertTitle>
                <AlertDescription>{tContent("demonstration.labels.infoDesc")}</AlertDescription>
              </Alert>
              <Alert variant="destructive">
                <AlertCircle aria-hidden="true" className="h-4 w-4" />
                <AlertTitle>{tContent("demonstration.labels.errorTitle")}</AlertTitle>
                <AlertDescription>{tContent("demonstration.labels.errorDesc")}</AlertDescription>
              </Alert>
              <Alert className="bg-success/10 text-success border-success/30">
                <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                <AlertTitle>{tContent("demonstration.labels.successTitle")}</AlertTitle>
                <AlertDescription>{tContent("demonstration.labels.successDesc")}</AlertDescription>
              </Alert>
              <Alert className="bg-warning/10 text-warning border-warning/30">
                <TriangleAlert aria-hidden="true" className="h-4 w-4" />
                <AlertTitle>{tContent("demonstration.labels.warningTitle")}</AlertTitle>
                <AlertDescription>{tContent("demonstration.labels.warningDesc")}</AlertDescription>
              </Alert>
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
                  element: tContent("usage.uxWriting.table.title.name"),
                  rules: tContent("usage.uxWriting.table.title.format"),
                  do: tContent("usage.uxWriting.table.title.good"),
                  dont: tContent("usage.uxWriting.table.title.bad"),
                },
                {
                  element: tContent("usage.uxWriting.table.description.name"),
                  rules: tContent("usage.uxWriting.table.description.format"),
                  do: tContent("usage.uxWriting.table.description.good"),
                  dont: tContent("usage.uxWriting.table.description.bad"),
                },
                {
                  element: tContent("usage.uxWriting.table.error.name"),
                  rules: tContent("usage.uxWriting.table.error.format"),
                  do: tContent("usage.uxWriting.table.error.good"),
                  dont: tContent("usage.uxWriting.table.error.bad"),
                },
                {
                  element: tContent("usage.uxWriting.table.warning.name"),
                  rules: tContent("usage.uxWriting.table.warning.format"),
                  do: tContent("usage.uxWriting.table.warning.good"),
                  dont: tContent("usage.uxWriting.table.warning.bad"),
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
                doPreview: (
                  <Alert>
                    <Info aria-hidden="true" className="h-4 w-4" />
                    <AlertTitle>Erro ao salvar</AlertTitle>
                    <AlertDescription>Não foi possível salvar. Verifique sua conexão.</AlertDescription>
                  </Alert>
                ),
                dontPreview: (
                  <Alert>
                    <AlertDescription>Salvo!</AlertDescription>
                  </Alert>
                ),
                doCaption: tContent("doDont.pair1.do"),
                dontCaption: tContent("doDont.pair1.dont"),
              },
              {
                doLabel: tNav("common.do"),
                dontLabel: tNav("common.dont"),
                doPreview: (
                  <Alert variant="destructive">
                    <AlertCircle aria-hidden="true" className="h-4 w-4" />
                    <AlertTitle>Erro ao salvar</AlertTitle>
                    <AlertDescription>Verifique sua conexão.</AlertDescription>
                  </Alert>
                ),
                dontPreview: (
                  <Alert variant="destructive">
                    <AlertTitle>Erro ao salvar</AlertTitle>
                    <AlertDescription>Verifique sua conexão.</AlertDescription>
                  </Alert>
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
                description: tContent("variants.items.default"),
                code: codeDefault,
                preview: (
                  <Alert className="w-full">
                    <Info aria-hidden="true" className="h-4 w-4" />
                    <AlertTitle>{tContent("demonstration.labels.infoTitle")}</AlertTitle>
                    <AlertDescription>{tContent("demonstration.labels.infoDesc")}</AlertDescription>
                  </Alert>
                ),
              },
              {
                name: "destructive",
                description: stripHtml(tContent("variants.items.destructive")),
                code: codeDestructive,
                preview: (
                  <Alert variant="destructive" className="w-full">
                    <AlertCircle aria-hidden="true" className="h-4 w-4" />
                    <AlertTitle>{tContent("demonstration.labels.errorTitle")}</AlertTitle>
                    <AlertDescription>{tContent("demonstration.labels.errorDesc")}</AlertDescription>
                  </Alert>
                ),
              },
              {
                name: "success",
                description: stripHtml(tContent("variants.items.success")),
                code: codeSuccess,
                preview: (
                  <Alert className="w-full bg-success/10 text-success border-success/30">
                    <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                    <AlertTitle>{tContent("demonstration.labels.successTitle")}</AlertTitle>
                    <AlertDescription>{tContent("demonstration.labels.successDesc")}</AlertDescription>
                  </Alert>
                ),
              },
              {
                name: "warning",
                description: stripHtml(tContent("variants.items.warning")),
                code: codeWarning,
                preview: (
                  <Alert className="w-full bg-warning/10 text-warning border-warning/30">
                    <TriangleAlert aria-hidden="true" className="h-4 w-4" />
                    <AlertTitle>{tContent("demonstration.labels.warningTitle")}</AlertTitle>
                    <AlertDescription>{tContent("demonstration.labels.warningDesc")}</AlertDescription>
                  </Alert>
                ),
              },
              {
                name: tContent("states.withoutTitle.label"),
                description: tContent("states.withoutTitle.behavior"),
                code: codeWithoutTitle,
                preview: (
                  <Alert className="w-full">
                    <Info aria-hidden="true" className="h-4 w-4" />
                    <AlertDescription>{tContent("demonstration.labels.infoDesc")}</AlertDescription>
                  </Alert>
                ),
              },
            ]}
          />

          {/* ── Composições ───────────────────────────────────────────── */}
          <DocsCompositions
            title={tContent("variants.compositionsTitle")}
            useWhenLabel={tNav("common.useWhen")}
            componentSlug="alert"
            items={[
              {
                name: tContent("variants.compositions.withIcon.name"),
                description: tContent("variants.compositions.withIcon.description"),
                useWhen: tContent("variants.compositions.withIcon.use"),
                code: `<Alert>\n  <Info aria-hidden="true" className="h-4 w-4" />\n  <AlertTitle>Informação</AlertTitle>\n  <AlertDescription>Ícone SVG posicionado automaticamente.</AlertDescription>\n</Alert>`,
                preview: (
                  <Alert className="w-full">
                    <Info aria-hidden="true" className="h-4 w-4" />
                    <AlertTitle>{tContent("demonstration.labels.infoTitle")}</AlertTitle>
                    <AlertDescription>{tContent("demonstration.labels.infoDesc")}</AlertDescription>
                  </Alert>
                ),
              },
              {
                name: tContent("variants.compositions.withAction.name"),
                description: tContent("variants.compositions.withAction.description"),
                useWhen: tContent("variants.compositions.withAction.use"),
                code: `<Alert>\n  <Info aria-hidden="true" className="h-4 w-4" />\n  <AlertTitle>Sessão expira em 5 minutos</AlertTitle>\n  <AlertDescription className="flex items-center justify-between gap-4 mt-1">\n    <span>Salve seu trabalho para não perder as alterações.</span>\n    <Button size="sm" variant="outline">Salvar agora</Button>\n  </AlertDescription>\n</Alert>`,
                preview: (
                  <Alert className="w-full">
                    <Info aria-hidden="true" className="h-4 w-4" />
                    <AlertTitle>Sessão expira em 5 minutos</AlertTitle>
                    <AlertDescription className="flex items-center justify-between gap-4 mt-1">
                      <span>Salve seu trabalho para não perder as alterações.</span>
                      <Button size="sm" variant="outline">Salvar agora</Button>
                    </AlertDescription>
                  </Alert>
                ),
              },
              {
                name: tContent("variants.compositions.compact.name"),
                description: tContent("variants.compositions.compact.description"),
                useWhen: tContent("variants.compositions.compact.use"),
                code: `<Alert variant="destructive">\n  <AlertCircle aria-hidden="true" className="h-4 w-4" />\n  <AlertDescription>Formulário incompleto.</AlertDescription>\n</Alert>`,
                preview: (
                  <Alert variant="destructive" className="w-full">
                    <AlertCircle aria-hidden="true" className="h-4 w-4" />
                    <AlertDescription>{tContent("demonstration.labels.errorDesc")}</AlertDescription>
                  </Alert>
                ),
              },
              {
                name: tContent("variants.compositions.multipleTypes.name"),
                description: tContent("variants.compositions.multipleTypes.description"),
                useWhen: tContent("variants.compositions.multipleTypes.use"),
                code: `<div className="space-y-3">\n  <Alert>\n    <Info aria-hidden="true" className="h-4 w-4" />\n    <AlertTitle>Informação</AlertTitle>\n    <AlertDescription>Mensagem informativa e neutra.</AlertDescription>\n  </Alert>\n  <Alert variant="destructive">\n    <AlertCircle aria-hidden="true" className="h-4 w-4" />\n    <AlertTitle>Erro</AlertTitle>\n    <AlertDescription>Erro crítico que bloqueia o fluxo.</AlertDescription>\n  </Alert>\n  <Alert className="bg-success/10 text-success border-success/30">\n    <CheckCircle2 aria-hidden="true" className="h-4 w-4" />\n    <AlertTitle>Sucesso</AlertTitle>\n    <AlertDescription>Ação concluída com sucesso.</AlertDescription>\n  </Alert>\n  <Alert className="bg-warning/10 text-warning border-warning/30">\n    <TriangleAlert aria-hidden="true" className="h-4 w-4" />\n    <AlertTitle>Aviso</AlertTitle>\n    <AlertDescription>Aviso que requer atenção.</AlertDescription>\n  </Alert>\n</div>`,
                preview: (
                  <div className="space-y-3 w-full">
                    <Alert>
                      <Info aria-hidden="true" className="h-4 w-4" />
                      <AlertTitle>Informação</AlertTitle>
                      <AlertDescription>Mensagem informativa e neutra.</AlertDescription>
                    </Alert>
                    <Alert variant="destructive">
                      <AlertCircle aria-hidden="true" className="h-4 w-4" />
                      <AlertTitle>Erro</AlertTitle>
                      <AlertDescription>Erro crítico que bloqueia o fluxo.</AlertDescription>
                    </Alert>
                    <Alert className="bg-success/10 text-success border-success/30">
                      <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                      <AlertTitle>Sucesso</AlertTitle>
                      <AlertDescription>Ação concluída com sucesso.</AlertDescription>
                    </Alert>
                    <Alert className="bg-warning/10 text-warning border-warning/30">
                      <TriangleAlert aria-hidden="true" className="h-4 w-4" />
                      <AlertTitle>Aviso</AlertTitle>
                      <AlertDescription>Aviso que requer atenção.</AlertDescription>
                    </Alert>
                  </div>
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
                label: tContent("states.complete.label"),
                trigger: stripHtml(tContent("states.complete.trigger")),
                behavior: tContent("states.complete.behavior"),
              },
              {
                label: tContent("states.withoutTitle.label"),
                trigger: stripHtml(tContent("states.withoutTitle.trigger")),
                behavior: tContent("states.withoutTitle.behavior"),
              },
              {
                label: tContent("states.withoutIcon.label"),
                trigger: tContent("states.withoutIcon.trigger"),
                behavior: tContent("states.withoutIcon.behavior"),
              },
              {
                label: tContent("states.dynamicInsert.label"),
                trigger: tContent("states.dynamicInsert.trigger"),
                behavior: stripHtml(tContent("states.dynamicInsert.behavior")),
              },
            ]}
          />

          {/* ── Propriedades ──────────────────────────────────────────── */}
          <DocsProps
            title={tContent("props.title")}
            tables={[
              {
                title: tContent("props.alertTitle"),
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
                    type: '"default" | "destructive"',
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
              {
                title: tContent("props.alertTitleTitle"),
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
              {
                title: tContent("props.alertDescTitle"),
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
              { token: "--background", value: "bg-background", description: tContent("tokens.table.background") },
              { token: "--foreground", value: "text-foreground", description: tContent("tokens.table.foreground") },
              { token: "--border", value: "border", description: tContent("tokens.table.border") },
              { token: "--destructive", value: "border-destructive/50", description: tContent("tokens.table.destructiveBorder") },
              { token: "--destructive", value: "text-destructive", description: tContent("tokens.table.destructiveText") },
              { token: "--success", value: "bg-success/10 text-success border-success/30", description: tContent("tokens.table.success") },
              { token: "--warning", value: "bg-warning/10 text-warning border-warning/30", description: tContent("tokens.table.warning") },
              { token: "--radius", value: "rounded-lg", description: tContent("tokens.table.radius") },
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
              { key: "Tab",   description: tContent("accessibility.keyboard.tab") },
              { key: "Enter", description: tContent("accessibility.keyboard.enter") },
              { key: "—",     description: tContent("accessibility.keyboard.noKeyboard") },
            ]}
          />

          {/* ── Relacionados ──────────────────────────────────────────── */}
          <DocsRelated
            title={tContent("related.title")}
            items={[
              {
                name: "Sonner",
                description: tContent("related.sonner"),
                path: "?path=/docs/ui-sonner--docs",
              },
              {
                name: "AlertDialog",
                description: tContent("related.alertDialog"),
                path: "?path=/docs/ui-alertdialog--docs",
              },
              {
                name: "Badge",
                description: tContent("related.badge"),
                path: "?path=/docs/ui-badge--docs",
              },
              {
                name: "Progress",
                description: tContent("related.progress"),
                path: "?path=/docs/ui-progress--docs",
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
                event: tContent("analytics.table.dismiss"),
                trigger: tContent("analytics.table.dismissTrigger"),
                payload: tContent("analytics.table.dismissPayload"),
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
                  priority: tNav(priorityKeyMap[tContent("testes.functional.item4.priority")] ?? "common.medium"),
                },
                {
                  action: tContent("testes.functional.item5.action"),
                  result: tContent("testes.functional.item5.result"),
                  priority: tNav(priorityKeyMap[tContent("testes.functional.item5.priority")] ?? "common.medium"),
                },
                {
                  action: tContent("testes.functional.item6.action"),
                  result: tContent("testes.functional.item6.result"),
                  priority: tNav(priorityKeyMap[tContent("testes.functional.item6.priority")] ?? "common.high"),
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
