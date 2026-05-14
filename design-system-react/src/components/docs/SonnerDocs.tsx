import { useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import { useActiveSection } from "@/lib/use-active-section";
import uiTranslations from "@/i18n/ui.json";
import sonnerTranslations from "@shared/content/sonner/translations.json";

import { DocsHeader }        from "@/components/docs/shared/sections/DocsHeader";
import { DocsPageLayout }    from "@/components/docs/shared/sections/DocsPageLayout";
import { DocsDemonstration } from "@/components/docs/shared/sections/DocsDemonstration";
import { DocsAnatomy }       from "@/components/docs/shared/sections/DocsAnatomy";
import { DocsWhenToUse }     from "@/components/docs/shared/sections/DocsWhenToUse";
import { DocsDoDont }        from "@/components/docs/shared/sections/DocsDoDont";
import { DocsImport }        from "@/components/docs/shared/sections/DocsImport";
import { DocsVariants }      from "@/components/docs/shared/sections/DocsVariants";
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

export function SonnerDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(sonnerTranslations);

  const navGroups = useMemo(() => getNavGroups(tNav), [tNav]);
  const allIds = useMemo(
    () => navGroups.flatMap((g) => g.sections.map((s) => s.id)),
    [navGroups]
  );

  useSeoEffect({
    title: tContent("seo.title"),
    description: tContent("seo.description"),
    locale,
    componentSlug: "sonner",
  });

  useEffect(() => {
    track("docs_page_view", {
      component_name: "sonner",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "sonner",
        locale,
      });
    },
    [locale]
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  // ─── Code strings ───────────────────────────────────────────────────────────

  const codeImport = `import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";`;

  const codeDefault = `// Setup no root (uma vez)
<Toaster position="top-right" richColors />

// Disparo
toast("Código copiado.")`;

  const codeSuccess = `toast.success("Alterações salvas.")`;

  const codeError = `toast.error("Não foi possível salvar. Tente novamente.")`;

  const codeWarning = `toast.warning("Sua sessão expira em 5 minutos.")`;

  const codeInfo = `toast.info("Nova versão disponível.")`;

  const codeWithDescription = `toast.success("Preferências atualizadas.", {
  description: "Suas configurações foram salvas e entrarão em vigor na próxima sessão.",
})`;

  const codeWithAction = `toast("Item excluído.", {
  action: {
    label: "Desfazer",
    onClick: () => restoreItem(),
  },
})`;

  const codePromise = `toast.promise(uploadFile(), {
  loading: "Enviando arquivo...",
  success: "Arquivo enviado com sucesso.",
  error: "Erro ao enviar. Tente novamente.",
})`;

  const codePersistent = `toast.error("Falha crítica no servidor.", {
  duration: Infinity,
  dismissible: true,
})`;

  const codeTokens = `/* Personalize via CSS variables no seu tema */
[data-sonner-toaster] {
  --normal-bg: var(--popover);
  --normal-text: var(--popover-foreground);
  --normal-border: var(--border);
  --border-radius: var(--radius);
}`;

  const interfaceCode = `// Toaster — wrapper em torno da lib externa sonner
interface ToasterProps {
  position?: ToastPosition;    // ex: "top-right"
  richColors?: boolean;
  expand?: boolean;
  duration?: number;
  theme?: "light" | "dark" | "system";
  icons?: ToastIcons;
  toastOptions?: ToastOptions;
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
          installNote="npx shadcn@latest add sonner"
        />
      }
    >
      {/* ── Demonstração ──────────────────────────────────────────── */}
      <DocsDemonstration
        title={tContent("demonstration.title")}
        componentSlug="sonner"
      >
        <div
          style={{ contain: "layout", minHeight: 80, position: "relative" }}
          className="w-full"
        >
          <Toaster position="top-right" richColors />
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              data-track="demo"
              data-track-id="sonner:demo:default"
              data-track-label={tContent("demonstration.labels.triggerDefault")}
              onClick={() => toast(tContent("demonstration.labels.default"))}
            >
              {tContent("demonstration.labels.triggerDefault")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              data-track="demo"
              data-track-id="sonner:demo:success"
              data-track-label={tContent("demonstration.labels.triggerSuccess")}
              onClick={() => toast.success(tContent("demonstration.labels.success"))}
            >
              {tContent("demonstration.labels.triggerSuccess")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              data-track="demo"
              data-track-id="sonner:demo:error"
              data-track-label={tContent("demonstration.labels.triggerError")}
              onClick={() => toast.error(tContent("demonstration.labels.error"))}
            >
              {tContent("demonstration.labels.triggerError")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              data-track="demo"
              data-track-id="sonner:demo:warning"
              data-track-label={tContent("demonstration.labels.triggerWarning")}
              onClick={() => toast.warning(tContent("demonstration.labels.warning"))}
            >
              {tContent("demonstration.labels.triggerWarning")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              data-track="demo"
              data-track-id="sonner:demo:info"
              data-track-label={tContent("demonstration.labels.triggerInfo")}
              onClick={() => toast.info(tContent("demonstration.labels.info"))}
            >
              {tContent("demonstration.labels.triggerInfo")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              data-track="demo"
              data-track-id="sonner:demo:loading"
              data-track-label={tContent("demonstration.labels.triggerLoading")}
              onClick={() => toast.loading(tContent("demonstration.labels.loading"))}
            >
              {tContent("demonstration.labels.triggerLoading")}
            </Button>
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
          tContent("anatomy.item6"),
          tContent("anatomy.item7"),
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
              element: tContent("usage.uxWriting.table.action.name"),
              rules: tContent("usage.uxWriting.table.action.format"),
              do: tContent("usage.uxWriting.table.action.good"),
              dont: tContent("usage.uxWriting.table.action.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.error.name"),
              rules: tContent("usage.uxWriting.table.error.format"),
              do: tContent("usage.uxWriting.table.error.good"),
              dont: tContent("usage.uxWriting.table.error.bad"),
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
              <div
                style={{ contain: "layout", minHeight: 80, position: "relative" }}
                className="w-full"
              >
                <Toaster position="top-right" richColors />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toast.success("Alterações salvas.")}
                >
                  toast.success
                </Button>
              </div>
            ),
            dontPreview: (
              <div
                style={{ contain: "layout", minHeight: 80, position: "relative" }}
                className="w-full"
              >
                <Toaster position="top-right" richColors />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toast.error("Erro crítico — tudo perdido!")}
                >
                  toast.error (crítico)
                </Button>
              </div>
            ),
            doCaption: tContent("doDont.pair1.do"),
            dontCaption: tContent("doDont.pair1.dont"),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <div
                style={{ contain: "layout", minHeight: 80, position: "relative" }}
                className="w-full"
              >
                <Toaster position="top-right" richColors />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const p = new Promise<void>((resolve) =>
                      setTimeout(resolve, 1500)
                    );
                    toast.promise(p, {
                      loading: "Salvando...",
                      success: "Salvo.",
                      error: "Erro.",
                    });
                  }}
                >
                  toast.promise
                </Button>
              </div>
            ),
            dontPreview: (
              <div
                style={{ contain: "layout", minHeight: 80, position: "relative" }}
                className="w-full"
              >
                <Toaster position="top-right" richColors />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toast.error("Campo obrigatório não preenchido.")}
                >
                  toast.error (formulário)
                </Button>
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
        code={codeImport}
      />

      {/* ── Variantes ─────────────────────────────────────────────── */}
      <DocsVariants
        title={tContent("variants.title")}
        componentSlug="sonner"
        items={[
          {
            name: "default",
            description: stripHtml(tContent("variants.items.default")),
            code: codeDefault,
            preview: (
              <div
                style={{ contain: "layout", minHeight: 60, position: "relative" }}
                className="w-full flex justify-center"
              >
                <Toaster position="top-right" richColors />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast("Código copiado.")}
                >
                  Default
                </Button>
              </div>
            ),
          },
          {
            name: "success",
            description: stripHtml(tContent("variants.items.success")),
            code: codeSuccess,
            preview: (
              <div
                style={{ contain: "layout", minHeight: 60, position: "relative" }}
                className="w-full flex justify-center"
              >
                <Toaster position="top-right" richColors />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.success("Alterações salvas.")}
                >
                  Success
                </Button>
              </div>
            ),
          },
          {
            name: "error",
            description: stripHtml(tContent("variants.items.error")),
            code: codeError,
            preview: (
              <div
                style={{ contain: "layout", minHeight: 60, position: "relative" }}
                className="w-full flex justify-center"
              >
                <Toaster position="top-right" richColors />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.error("Não foi possível salvar. Tente novamente.")}
                >
                  Error
                </Button>
              </div>
            ),
          },
          {
            name: "warning",
            description: stripHtml(tContent("variants.items.warning")),
            code: codeWarning,
            preview: (
              <div
                style={{ contain: "layout", minHeight: 60, position: "relative" }}
                className="w-full flex justify-center"
              >
                <Toaster position="top-right" richColors />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.warning("Sua sessão expira em 5 minutos.")}
                >
                  Warning
                </Button>
              </div>
            ),
          },
          {
            name: "info",
            description: stripHtml(tContent("variants.items.info")),
            code: codeInfo,
            preview: (
              <div
                style={{ contain: "layout", minHeight: 60, position: "relative" }}
                className="w-full flex justify-center"
              >
                <Toaster position="top-right" richColors />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.info("Nova versão disponível.")}
                >
                  Info
                </Button>
              </div>
            ),
          },
        ]}
      />

      {/* ── Estados (Composições) ─────────────────────────────────── */}
      <section id="estados">
        <h2 className="text-xl font-semibold mb-4">{tContent("states.title")}</h2>
        <div className="space-y-4">
          {/* WithDescription */}
          <div className="rounded-lg border border-border p-4 space-y-2">
            <p className="text-sm font-semibold">{tContent("states.items.withDescription.label")}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {tContent("states.items.withDescription.description")}
            </p>
            <div
              style={{ contain: "layout", minHeight: 60, position: "relative" }}
              className="flex items-center"
            >
              <Toaster position="top-right" richColors />
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  toast.success(tContent("demonstration.labels.withDescription"), {
                    description: tContent("demonstration.labels.withDescriptionDesc"),
                  })
                }
              >
                {tContent("demonstration.labels.triggerWithDescription")}
              </Button>
            </div>
            <div className="bg-muted rounded p-3 font-mono text-xs overflow-x-auto">
              <code className="whitespace-pre">{codeWithDescription}</code>
            </div>
          </div>

          {/* WithAction */}
          <div className="rounded-lg border border-border p-4 space-y-2">
            <p className="text-sm font-semibold">{tContent("states.items.withAction.label")}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {stripHtml(tContent("states.items.withAction.description"))}
            </p>
            <div
              style={{ contain: "layout", minHeight: 60, position: "relative" }}
              className="flex items-center"
            >
              <Toaster position="top-right" richColors />
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  toast(tContent("demonstration.labels.withAction"), {
                    action: {
                      label: tContent("demonstration.labels.withActionLabel"),
                      onClick: () => {
                        track("toast_action_click", {
                          label: tContent("demonstration.labels.withActionLabel"),
                          component: "toast",
                          location: "sonner:estados:withAction",
                        });
                      },
                    },
                  })
                }
              >
                {tContent("demonstration.labels.triggerWithAction")}
              </Button>
            </div>
            <div className="bg-muted rounded p-3 font-mono text-xs overflow-x-auto">
              <code className="whitespace-pre">{codeWithAction}</code>
            </div>
          </div>

          {/* Promise */}
          <div className="rounded-lg border border-border p-4 space-y-2">
            <p className="text-sm font-semibold">{tContent("states.items.promise.label")}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {tContent("states.items.promise.description")}
            </p>
            <div
              style={{ contain: "layout", minHeight: 60, position: "relative" }}
              className="flex items-center"
            >
              <Toaster position="top-right" richColors />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const p = new Promise<void>((resolve) =>
                    setTimeout(resolve, 2000)
                  );
                  toast.promise(p, {
                    loading: tContent("demonstration.labels.promiseLoading"),
                    success: tContent("demonstration.labels.promise"),
                    error: tContent("demonstration.labels.promiseError"),
                  });
                }}
              >
                {tContent("demonstration.labels.triggerPromise")}
              </Button>
            </div>
            <div className="bg-muted rounded p-3 font-mono text-xs overflow-x-auto">
              <code className="whitespace-pre">{codePromise}</code>
            </div>
          </div>

          {/* Persistent */}
          <div className="rounded-lg border border-border p-4 space-y-2">
            <p className="text-sm font-semibold">{tContent("states.items.persistent.label")}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {stripHtml(tContent("states.items.persistent.description"))}
            </p>
            <div
              style={{ contain: "layout", minHeight: 60, position: "relative" }}
              className="flex items-center"
            >
              <Toaster position="top-right" richColors />
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  toast.error(tContent("demonstration.labels.persistent"), {
                    duration: Infinity,
                    dismissible: true,
                  })
                }
              >
                {tContent("demonstration.labels.triggerPersistent")}
              </Button>
            </div>
            <div className="bg-muted rounded p-3 font-mono text-xs overflow-x-auto">
              <code className="whitespace-pre">{codePersistent}</code>
            </div>
          </div>
        </div>
      </section>

      {/* ── Propriedades ──────────────────────────────────────────── */}
      <DocsProps
        title={tContent("props.title")}
        tables={[
          {
            title: tContent("props.toasterTitle"),
            cols: {
              prop: tContent("props.table.prop"),
              type: tContent("props.table.type"),
              default: tContent("props.table.default"),
              required: tContent("props.table.required"),
              description: tContent("props.table.description"),
            },
            items: [
              {
                name: "position",
                type: "ToastPosition",
                defaultValue: '"bottom-right"',
                required: "Não",
                description: stripHtml(tContent("props.table.position")),
              },
              {
                name: "richColors",
                type: "boolean",
                defaultValue: "false",
                required: "Não",
                description: tContent("props.table.richColors"),
              },
              {
                name: "expand",
                type: "boolean",
                defaultValue: "false",
                required: "Não",
                description: tContent("props.table.expand"),
              },
              {
                name: "duration",
                type: "number",
                defaultValue: "4000",
                required: "Não",
                description: tContent("props.table.duration"),
              },
              {
                name: "theme",
                type: '"light" | "dark" | "system"',
                defaultValue: '"system"',
                required: "Não",
                description: stripHtml(tContent("props.table.theme")),
              },
              {
                name: "icons",
                type: "ToastIcons",
                defaultValue: "—",
                required: "Não",
                description: tContent("props.table.icons"),
              },
              {
                name: "toastOptions",
                type: "ToastOptions",
                defaultValue: "—",
                required: "Não",
                description: stripHtml(tContent("props.table.toastOptions")),
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
          value: tContent("tokens.table.value"),
          description: tContent("tokens.table.description"),
        }}
        items={[
          { token: "--normal-bg",     value: "var(--popover)",            description: tContent("tokens.table.normalBg") },
          { token: "--normal-text",   value: "var(--popover-foreground)", description: tContent("tokens.table.normalText") },
          { token: "--normal-border", value: "var(--border)",             description: tContent("tokens.table.normalBorder") },
          { token: "--border-radius", value: "var(--radius)",             description: tContent("tokens.table.borderRadius") },
        ]}
        customizationTitle={tContent("tokens.customizationTitle")}
        customizationCode={codeTokens}
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
          { key: "Tab",    description: tContent("accessibility.keyboard.tab") },
          { key: "Enter",  description: tContent("accessibility.keyboard.enter") },
          { key: "Escape", description: tContent("accessibility.keyboard.escape") },
          { key: "—",      description: tContent("accessibility.keyboard.noKeyboard") },
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
        componentSlug="sonner"
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
        cols={{
          event: tContent("analytics.table.event"),
          trigger: tContent("analytics.table.trigger"),
          payload: tContent("analytics.table.payload"),
        }}
        items={[
          {
            event: tContent("analytics.table.actionClick"),
            trigger: tContent("analytics.table.actionClickTrigger"),
            payload: tContent("analytics.table.actionClickPayload"),
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
              priority: tNav(priorityKeyMap[tContent("testes.functional.item5.priority")] ?? "common.high"),
            },
            {
              action: tContent("testes.functional.item6.action"),
              result: tContent("testes.functional.item6.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item6.priority")] ?? "common.medium"),
            },
            {
              action: tContent("testes.functional.item7.action"),
              result: tContent("testes.functional.item7.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item7.priority")] ?? "common.medium"),
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
