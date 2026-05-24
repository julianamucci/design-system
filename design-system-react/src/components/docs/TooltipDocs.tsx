import { useCallback, useEffect, useMemo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { useActiveSection } from "@/lib/use-active-section";
import uiTranslations from "@/i18n/ui.json";
import tooltipTranslations from "@shared/content/tooltip/translations.json";
import { Save, Trash2, Share2, HelpCircle, Info } from "lucide-react";

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

const kbdClass =
  "inline-flex h-4 min-w-4 items-center justify-center rounded-sm bg-background/15 px-1 font-mono text-[10px] font-medium text-background";

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

export function TooltipDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(tooltipTranslations);

  const navGroups = useMemo(() => getNavGroups(tNav), [tNav]);
  const allIds = useMemo(
    () => navGroups.flatMap((g) => g.sections.map((s) => s.id)),
    [navGroups]
  );

  useSeoEffect({
    title: tContent("seo.title"),
    description: tContent("seo.description"),
    locale,
    componentSlug: "tooltip",
    aiSummary: tContent("seo.aiSummary"),
    aiEntities: tContent("seo.aiEntities"),
    aiIntent: tContent("seo.aiIntent") as "informational" | "navigational",
    breadcrumb: [
      { name: "Components", item: "/components" },
      { name: tContent("category"), item: "/components/overlay" },
      { name: tContent("title") },
    ],
  });

  useEffect(() => {
    track("docs_page_view", {
      component_name: "tooltip",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "tooltip",
        locale,
      });
    },
    [locale]
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  // ─── Code strings ───────────────────────────────────────────────────────────

  const codeImport = `import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";`;

  const structureCode = tContent("anatomy.structureCode");

  const codeDefault = `<Tooltip>
  <TooltipTrigger asChild>
    <Button variant="ghost" size="icon" aria-label="Salvar">
      <Save aria-hidden="true" />
    </Button>
  </TooltipTrigger>
  <TooltipContent>Salvar</TooltipContent>
</Tooltip>`;

  const codeWithShortcut = `<Tooltip>
  <TooltipTrigger asChild>
    <Button variant="ghost" size="icon" aria-label="Salvar">
      <Save aria-hidden="true" />
    </Button>
  </TooltipTrigger>
  <TooltipContent>
    Salvar <kbd>Ctrl</kbd>+<kbd>S</kbd>
  </TooltipContent>
</Tooltip>`;

  const codeLongText = `<Tooltip>
  <TooltipTrigger asChild>
    <Button variant="outline">Compartilhar</Button>
  </TooltipTrigger>
  <TooltipContent side="bottom">
    Cria um link público com permissão de leitura — qualquer pessoa com o link pode visualizar.
  </TooltipContent>
</Tooltip>`;

  const interfaceCode = `// TooltipProvider (base-ui/tooltip)
interface TooltipProviderProps {
  delay?: number; // default 0 (ms)
}

// Tooltip
interface TooltipProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// TooltipContent
interface TooltipContentProps {
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  alignOffset?: number;
  className?: string;
}`;

  // ─── Locale-aware column labels ─────────────────────────────────────────────

  const stateCols = {
    state: locale === "en" ? "State" : "Estado",
    trigger: locale === "en" ? "Trigger" : locale === "es" ? "Disparo" : "Disparo",
    behavior:
      locale === "en"
        ? "Behavior"
        : locale === "es"
        ? "Comportamiento"
        : "Comportamento",
  };

  const analyticsCols = {
    event: locale === "en" ? "Event" : locale === "es" ? "Evento" : "Evento",
    trigger: locale === "en" ? "Trigger" : locale === "es" ? "Disparo" : "Disparo",
    payload: "Payload",
  };

  const labelSave = tContent("demonstration.labels.save");
  const labelDelete = tContent("demonstration.labels.delete");
  const labelShare = tContent("demonstration.labels.share");
  const labelSaveBtn = tContent("demonstration.labels.saveButton");
  const labelDeleteBtn = tContent("demonstration.labels.deleteButton");
  const labelShareBtn = tContent("demonstration.labels.shareButton");

  return (
    <TooltipProvider delay={0}>
      <DocsPageLayout
        navGroups={navGroups}
        activeSection={activeId}
        componentSlug="tooltip"
        header={
          <DocsHeader
            title={tContent("title")}
            description={tContent("description")}
            category={tContent("category")}
            type={tContent("type")}
            installNote="npx shadcn@latest add tooltip"
          />
        }
      >
        {/* ── Demonstração ──────────────────────────────────────────── */}
        <DocsDemonstration title={tContent("demonstration.title")}>
          <div
            className="flex flex-wrap items-center justify-center gap-6"
            style={{ contain: "layout", minHeight: 120, position: "relative" }}
          >
            <Tooltip>
              <TooltipTrigger
                render={(props) => (
                  <Button {...props} variant="ghost" size="icon" aria-label={labelSaveBtn}>
                    <Save aria-hidden="true" />
                  </Button>
                )}
              />
              <TooltipContent>{labelSave}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                render={(props) => (
                  <Button {...props} variant="ghost" size="icon" aria-label={labelDeleteBtn}>
                    <Trash2 aria-hidden="true" />
                  </Button>
                )}
              />
              <TooltipContent>{labelDelete}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                render={(props) => (
                  <Button {...props} variant="ghost" size="icon" aria-label={labelShareBtn}>
                    <Share2 aria-hidden="true" />
                  </Button>
                )}
              />
              <TooltipContent>{labelShare}</TooltipContent>
            </Tooltip>
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
          structureCode={structureCode}
          structureLabel={tContent("anatomy.structureLabel")}
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
                element: tContent("usage.uxWriting.table.content.name"),
                rules: tContent("usage.uxWriting.table.content.format"),
                do: tContent("usage.uxWriting.table.content.good"),
                dont: tContent("usage.uxWriting.table.content.bad"),
              },
              {
                element: tContent("usage.uxWriting.table.shortcut.name"),
                rules: tContent("usage.uxWriting.table.shortcut.format"),
                do: tContent("usage.uxWriting.table.shortcut.good"),
                dont: tContent("usage.uxWriting.table.shortcut.bad"),
              },
              {
                element: tContent("usage.uxWriting.table.icon.name"),
                rules: tContent("usage.uxWriting.table.icon.format"),
                do: tContent("usage.uxWriting.table.icon.good"),
                dont: tContent("usage.uxWriting.table.icon.bad"),
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
                <div className="text-xs font-mono text-muted-foreground">
                  &lt;Button aria-label="Salvar"&gt;
                  <br />
                  + Tooltip "Salvar (Ctrl+S)"
                </div>
              ),
              dontPreview: (
                <div className="text-xs font-mono text-muted-foreground">
                  &lt;Button&gt; (sem aria-label)
                  <br />
                  + Tooltip "Salvar"
                </div>
              ),
              doCaption: sanitizeHtml(tContent("doDont.pair1.do")),
              dontCaption: sanitizeHtml(tContent("doDont.pair1.dont")),
            },
            {
              doLabel: tNav("common.do"),
              dontLabel: tNav("common.dont"),
              doPreview: (
                <div className="text-xs text-muted-foreground">"Salvar (Ctrl+S)"</div>
              ),
              dontPreview: (
                <div className="text-xs text-muted-foreground italic">
                  "Clique aqui para salvar o documento atual no servidor."
                </div>
              ),
              doCaption: sanitizeHtml(tContent("doDont.pair2.do")),
              dontCaption: sanitizeHtml(tContent("doDont.pair2.dont")),
            },
          ]}
        />

        {/* ── Importação ────────────────────────────────────────────── */}
        <DocsImport title={tContent("import.title")} code={codeImport} />

        {/* ── Variantes ─────────────────────────────────────────────── */}
        <DocsVariants
          title={tContent("variants.title")}
          componentSlug="tooltip"
          items={[
            {
              name: tContent("variants.items.default"),
              description: stripHtml(tContent("variants.styles.default")),
              code: codeDefault,
              preview: (
                <Tooltip>
                  <TooltipTrigger
                    render={(props) => (
                      <Button {...props} variant="ghost" size="icon" aria-label={labelSaveBtn}>
                        <Save aria-hidden="true" />
                      </Button>
                    )}
                  />
                  <TooltipContent>{labelSaveBtn}</TooltipContent>
                </Tooltip>
              ),
            },
            {
              name: tContent("variants.items.withShortcut"),
              description: stripHtml(tContent("variants.styles.withShortcut")),
              code: codeWithShortcut,
              preview: (
                <Tooltip>
                  <TooltipTrigger
                    render={(props) => (
                      <Button {...props} variant="ghost" size="icon" aria-label={labelSaveBtn}>
                        <Save aria-hidden="true" />
                      </Button>
                    )}
                  />
                  <TooltipContent>
                    <span>{labelSaveBtn}</span>
                    <kbd className={kbdClass}>Ctrl</kbd>
                    <kbd className={kbdClass}>S</kbd>
                  </TooltipContent>
                </Tooltip>
              ),
            },
            {
              name: tContent("variants.items.longText"),
              description: stripHtml(tContent("variants.styles.longText")),
              code: codeLongText,
              preview: (
                <Tooltip>
                  <TooltipTrigger
                    render={(props) => (
                      <Button {...props} variant="outline">
                        {labelShareBtn}
                      </Button>
                    )}
                  />
                  <TooltipContent side="bottom">
                    {locale === "en"
                      ? "Creates a public link with read-only access — anyone with the link can view."
                      : locale === "es"
                      ? "Crea un enlace público con acceso de solo lectura — cualquiera con el enlace puede ver."
                      : "Cria um link público com permissão de leitura — qualquer pessoa com o link pode visualizar."}
                  </TooltipContent>
                </Tooltip>
              ),
            },
          ]}
        />

        {/* ── Composições ───────────────────────────────────────────── */}
        <DocsCompositions
          title={tContent("variants.compositionsTitle")}
          useWhenLabel={tNav("common.useWhen")}
          componentSlug="tooltip"
          items={[
            {
              name: tContent("variants.compositions.iconButtonWithShortcut.name"),
              description: tContent("variants.compositions.iconButtonWithShortcut.description"),
              useWhen: tContent("variants.compositions.iconButtonWithShortcut.use"),
              code: `<Tooltip>
  <TooltipTrigger
    render={(props) => (
      <Button {...props} variant="ghost" size="icon" aria-label="Salvar">
        <Save aria-hidden="true" />
      </Button>
    )}
  />
  <TooltipContent side="bottom">
    <span>Salvar</span>
    <kbd>Ctrl</kbd>
    <kbd>S</kbd>
  </TooltipContent>
</Tooltip>`,
              preview: (
                <Tooltip>
                  <TooltipTrigger
                    render={(props) => (
                      <Button {...props} variant="ghost" size="icon" aria-label={labelSaveBtn}>
                        <Save aria-hidden="true" />
                      </Button>
                    )}
                  />
                  <TooltipContent>
                    <span>{labelSaveBtn}</span>
                    <kbd className={kbdClass}>Ctrl</kbd>
                    <kbd className={kbdClass}>S</kbd>
                  </TooltipContent>
                </Tooltip>
              ),
            },
            {
              name: tContent("variants.compositions.formFieldHelp.name"),
              description: tContent("variants.compositions.formFieldHelp.description"),
              useWhen: tContent("variants.compositions.formFieldHelp.use"),
              code: `<div className="flex flex-col gap-2">
  <div className="flex items-center gap-2">
    <label htmlFor="api-token" className="text-sm font-medium">Token de API</label>
    <Tooltip>
      <TooltipTrigger
        render={(props) => (
          <Button {...props} variant="ghost" size="icon" aria-label="Ajuda sobre Token de API">
            <HelpCircle aria-hidden="true" />
          </Button>
        )}
      />
      <TooltipContent side="right" className="max-w-xs">
        Cole o token gerado em Configurações &gt; Integrações.
      </TooltipContent>
    </Tooltip>
  </div>
  <input id="api-token" type="text" className="input w-64" placeholder="sk-..." />
</div>`,
              preview: (
                <div className="flex flex-col gap-2 items-start">
                  <div className="flex items-center gap-2">
                    <label htmlFor="api-token-react-comp" className="text-sm font-medium">
                      {locale === "en" ? "API Token" : locale === "es" ? "Token de API" : "Token de API"}
                    </label>
                    <Tooltip>
                      <TooltipTrigger
                        render={(props) => (
                          <Button
                            {...props}
                            variant="ghost"
                            size="icon"
                            aria-label={
                              locale === "en"
                                ? "Help about API Token"
                                : locale === "es"
                                ? "Ayuda sobre Token de API"
                                : "Ajuda sobre Token de API"
                            }
                          >
                            <HelpCircle aria-hidden="true" />
                          </Button>
                        )}
                      />
                      <TooltipContent side="right" className="max-w-xs">
                        {locale === "en"
                          ? "Paste the token generated in Settings > Integrations."
                          : locale === "es"
                          ? "Pega el token generado en Ajustes > Integraciones."
                          : "Cole o token gerado em Configurações > Integrações."}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <input
                    id="api-token-react-comp"
                    type="text"
                    className="h-9 w-64 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    placeholder="sk-..."
                  />
                </div>
              ),
            },
            {
              name: tContent("variants.compositions.metricDescription.name"),
              description: tContent("variants.compositions.metricDescription.description"),
              useWhen: tContent("variants.compositions.metricDescription.use"),
              code: `<div className="flex flex-col gap-1">
  <div className="flex items-center gap-2">
    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">LCP</p>
    <Tooltip>
      <TooltipTrigger
        render={(props) => (
          <Button {...props} variant="ghost" size="icon" aria-label="O que é LCP">
            <Info aria-hidden="true" />
          </Button>
        )}
      />
      <TooltipContent side="top" className="max-w-xs">
        Largest Contentful Paint — tempo até o maior elemento visível ser renderizado.
      </TooltipContent>
    </Tooltip>
  </div>
  <p className="text-2xl font-semibold">1.8s</p>
</div>`,
              preview: (
                <div className="flex flex-col gap-1 items-start">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">LCP</p>
                    <Tooltip>
                      <TooltipTrigger
                        render={(props) => (
                          <Button
                            {...props}
                            variant="ghost"
                            size="icon"
                            aria-label={
                              locale === "en"
                                ? "What is LCP"
                                : locale === "es"
                                ? "Qué es LCP"
                                : "O que é LCP"
                            }
                          >
                            <Info aria-hidden="true" />
                          </Button>
                        )}
                      />
                      <TooltipContent side="top" className="max-w-xs">
                        {locale === "en"
                          ? "Largest Contentful Paint — time until the largest visible element is rendered."
                          : locale === "es"
                          ? "Largest Contentful Paint — tiempo hasta que el elemento visible más grande se renderiza."
                          : "Largest Contentful Paint — tempo até o maior elemento visível ser renderizado."}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-2xl font-semibold">1.8s</p>
                </div>
              ),
            },
            {
              name: tContent("variants.compositions.positioningSides.name"),
              description: tContent("variants.compositions.positioningSides.description"),
              useWhen: tContent("variants.compositions.positioningSides.use"),
              code: `<div className="grid grid-cols-2 sm:grid-cols-4 gap-8 place-items-center">
  {(["top", "right", "bottom", "left"] as const).map((side) => (
    <Tooltip key={side}>
      <TooltipTrigger
        render={(props) => (
          <Button {...props} variant="outline">{side}</Button>
        )}
      />
      <TooltipContent side={side}>Tooltip {side}</TooltipContent>
    </Tooltip>
  ))}
</div>`,
              preview: (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 place-items-center w-full" style={{ contain: "layout", minHeight: 140 }}>
                  {(["top", "right", "bottom", "left"] as const).map((side) => (
                    <Tooltip key={side}>
                      <TooltipTrigger
                        render={(props) => (
                          <Button {...props} variant="outline">
                            {side.charAt(0).toUpperCase() + side.slice(1)}
                          </Button>
                        )}
                      />
                      <TooltipContent side={side}>Tooltip {side}</TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              ),
            },
          ]}
        />

        {/* ── Estados ───────────────────────────────────────────────── */}
        <DocsStates
          title={tContent("states.title")}
          cols={stateCols}
          items={[
            {
              label: tContent("states.items.closed"),
              trigger: 'data-state="closed"',
              behavior: stripHtml(tContent("states.descriptions.closed")),
            },
            {
              label: tContent("states.items.open"),
              trigger: 'data-state="open"',
              behavior: stripHtml(tContent("states.descriptions.open")),
            },
            {
              label: tContent("states.items.hover"),
              trigger: "mouseenter",
              behavior: stripHtml(tContent("states.descriptions.hover")),
            },
            {
              label: tContent("states.items.focus"),
              trigger: "focus",
              behavior: stripHtml(tContent("states.descriptions.focus")),
            },
            {
              label: tContent("states.items.delayed"),
              trigger: 'data-state="delayed-open"',
              behavior: stripHtml(tContent("states.descriptions.delayed")),
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
                  name: "delay",
                  type: tContent("props.table.delay.type"),
                  defaultValue: tContent("props.table.delay.default"),
                  required: tContent("props.table.delay.required"),
                  description: sanitizeHtml(tContent("props.table.delay.description")),
                },
                {
                  name: "open",
                  type: tContent("props.table.open.type"),
                  defaultValue: tContent("props.table.open.default"),
                  required: tContent("props.table.open.required"),
                  description: sanitizeHtml(tContent("props.table.open.description")),
                },
                {
                  name: "defaultOpen",
                  type: tContent("props.table.defaultOpen.type"),
                  defaultValue: tContent("props.table.defaultOpen.default"),
                  required: tContent("props.table.defaultOpen.required"),
                  description: sanitizeHtml(tContent("props.table.defaultOpen.description")),
                },
                {
                  name: "onOpenChange",
                  type: tContent("props.table.onOpenChange.type"),
                  defaultValue: tContent("props.table.onOpenChange.default"),
                  required: tContent("props.table.onOpenChange.required"),
                  description: sanitizeHtml(tContent("props.table.onOpenChange.description")),
                },
                {
                  name: "side",
                  type: tContent("props.table.side.type"),
                  defaultValue: tContent("props.table.side.default"),
                  required: tContent("props.table.side.required"),
                  description: sanitizeHtml(tContent("props.table.side.description")),
                },
                {
                  name: "align",
                  type: tContent("props.table.align.type"),
                  defaultValue: tContent("props.table.align.default"),
                  required: tContent("props.table.align.required"),
                  description: sanitizeHtml(tContent("props.table.align.description")),
                },
                {
                  name: "sideOffset",
                  type: tContent("props.table.sideOffset.type"),
                  defaultValue: tContent("props.table.sideOffset.default"),
                  required: tContent("props.table.sideOffset.required"),
                  description: sanitizeHtml(tContent("props.table.sideOffset.description")),
                },
                {
                  name: "className",
                  type: tContent("props.table.className.type"),
                  defaultValue: tContent("props.table.className.default"),
                  required: tContent("props.table.className.required"),
                  description: sanitizeHtml(tContent("props.table.className.description")),
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
              token: "--foreground",
              value: tContent("tokens.table.foreground.class"),
              description: tContent("tokens.table.foreground.part"),
            },
            {
              token: "--background",
              value: tContent("tokens.table.background.class"),
              description: tContent("tokens.table.background.part"),
            },
            {
              token: "--foreground",
              value: tContent("tokens.table.fill.class"),
              description: tContent("tokens.table.fill.part"),
            },
            {
              token: "--radius",
              value: tContent("tokens.table.radius.class"),
              description: tContent("tokens.table.radius.part"),
            },
            {
              token: "z-index",
              value: tContent("tokens.table.zIndex.class"),
              description: tContent("tokens.table.zIndex.part"),
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
            { key: "Tab", description: stripHtml(tContent("accessibility.keyboard.tab")) },
            { key: "Esc", description: stripHtml(tContent("accessibility.keyboard.escape")) },
            { key: "Shift+Tab", description: stripHtml(tContent("accessibility.keyboard.shiftTab")) },
          ]}
        />

        {/* ── Relacionados ──────────────────────────────────────────── */}
        <DocsRelated
          title={tContent("related.title")}
          componentSlug="tooltip"
          items={[
            {
              name: tContent("related.items.popover.name"),
              description: tContent("related.items.popover.description"),
              path: "?path=/docs/ui-popover--docs",
            },
            {
              name: tContent("related.items.hoverCard.name"),
              description: tContent("related.items.hoverCard.description"),
              path: "?path=/docs/ui-hovercard--docs",
            },
            {
              name: tContent("related.items.button.name"),
              description: tContent("related.items.button.description"),
              path: "?path=/docs/ui-button--docs",
            },
            {
              name: tContent("related.items.kbd.name"),
              description: tContent("related.items.kbd.description"),
              path: "?path=/docs/ui-kbd--docs",
            },
          ]}
        />

        {/* ── Notas ─────────────────────────────────────────────────── */}
        <DocsNotes
          title={tContent("notes.title")}
          componentSlug="tooltip"
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
          cols={analyticsCols}
          items={[
            {
              event: "tooltip_view",
              trigger: sanitizeHtml(tContent("analytics.table.tooltip_view.trigger")),
              payload: sanitizeHtml(tContent("analytics.table.tooltip_view.payload")),
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
              { criterion: tContent("testes.accessibility.item2"), level: "1.4.3", how: "Contrast checker" },
              { criterion: tContent("testes.accessibility.item3"), level: "4.1.2", how: "DevTools a11y tree" },
              { criterion: tContent("testes.accessibility.item4"), level: "4.1.2", how: "DevTools a11y tree" },
              { criterion: tContent("testes.accessibility.item5"), level: "1.1.1", how: "Manual review" },
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
    </TooltipProvider>
  );
}

export default TooltipDocs;
