import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, Filter, Settings } from "lucide-react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import { useActiveSection } from "@/lib/use-active-section";
import uiTranslations from "@/i18n/ui.json";
import collapsibleTranslations from "@shared/content/collapsible/translations.json";

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

const priorityKeyMap: Record<string, string> = {
  high: "common.high",
  medium: "common.medium",
  low: "common.low",
};

// ─── Nav ──────────────────────────────────────────────────────────────────────

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


// ─── Demo: Controlled ─────────────────────────────────────────────────────────

function ControlledDemo({ tContent }: { tContent: (key: string) => string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="w-full max-w-sm space-y-3">
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          {tContent("demonstration.labels.triggerClosed")}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setOpen(false)}>
          {tContent("demonstration.labels.triggerOpen")}
        </Button>
      </div>
      <Collapsible open={open} onOpenChange={setOpen} className="space-y-2">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="flex w-full items-center justify-between px-4"
            aria-label={open
              ? tContent("demonstration.labels.triggerOpen")
              : tContent("demonstration.labels.triggerClosed")
            }
          >
            <span>
              {open
                ? tContent("demonstration.labels.triggerOpen")
                : tContent("demonstration.labels.triggerClosed")
              }
            </span>
            <ChevronDown
              aria-hidden="true"
              className="h-4 w-4 transition-transform [[data-state=open]_&]:rotate-180"
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="rounded-md border border-border bg-muted/40 px-4 py-3 text-sm space-y-1">
          <p>{tContent("demonstration.labels.advancedFilter1")}</p>
          <p>{tContent("demonstration.labels.advancedFilter2")}</p>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function CollapsibleDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(collapsibleTranslations);

  const navGroups = useMemo(() => getNavGroups(tNav), [tNav]);
  const allIds = useMemo(
    () => navGroups.flatMap((g) => g.sections.map((s) => s.id)),
    [navGroups]
  );

  useSeoEffect({
    title: tContent("seo.title"),
    description: tContent("seo.description"),
    locale,
    componentSlug: "collapsible",
  });

  useEffect(() => {
    track("docs_page_view", {
      component_name: "collapsible",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "collapsible",
        locale,
      });
    },
    [locale]
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  // ─── Code strings ─────────────────────────────────────────────────────────

  const codeImportBasic = `import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";`;

  const codeImportWithButton = `import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";`;

  const codeUncontrolled = `<Collapsible defaultOpen={false} className="space-y-2">
  <CollapsibleTrigger asChild>
    <Button variant="ghost" className="flex w-full items-center justify-between px-4">
      <span>Exibir filtros avançados</span>
      <ChevronDown aria-hidden="true" className="h-4 w-4 transition-transform [[data-state=open]_&]:rotate-180" />
    </Button>
  </CollapsibleTrigger>
  <CollapsibleContent className="rounded-md border px-4 py-3 text-sm">
    <p>Filtro avançado 1</p>
    <p>Filtro avançado 2</p>
  </CollapsibleContent>
</Collapsible>`;

  const codeControlled = `const [open, setOpen] = useState(false);

<Collapsible open={open} onOpenChange={setOpen} className="space-y-2">
  <CollapsibleTrigger asChild>
    <Button
      variant="ghost"
      className="flex w-full items-center justify-between px-4"
      aria-label={open ? "Ocultar filtros avançados" : "Exibir filtros avançados"}
    >
      <span>{open ? "Ocultar filtros avançados" : "Exibir filtros avançados"}</span>
      <ChevronDown aria-hidden="true" className="h-4 w-4 transition-transform [[data-state=open]_&]:rotate-180" />
    </Button>
  </CollapsibleTrigger>
  <CollapsibleContent className="rounded-md border px-4 py-3 text-sm">
    <p>Filtro avançado 1</p>
  </CollapsibleContent>
</Collapsible>`;

  const codeCustomizationTokens = `/* Em globals.css — sobrescrever tokens de borda e fundo do painel */
:root {
  --collapsible-panel-bg: hsl(var(--muted) / 0.4);
  --collapsible-panel-border: hsl(var(--border));
}`;

  const interfaceCode = `// Collapsible (Root)
interface CollapsibleProps extends CollapsiblePrimitive.Root.Props {}

// CollapsibleTrigger
interface CollapsibleTriggerProps extends CollapsiblePrimitive.Trigger.Props {
  asChild?: boolean;
}

// CollapsibleContent
interface CollapsibleContentProps extends CollapsiblePrimitive.Panel.Props {}`;

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
        <div className="w-full space-y-6">
          {/* Default — uncontrolled */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Padrão (não-controlado)
            </p>
            <Collapsible className="w-full max-w-sm space-y-2">
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex w-full items-center justify-between px-4"
                  aria-label={tContent("demonstration.labels.triggerClosed")}
                >
                  <span>{tContent("demonstration.labels.headerLabel")}</span>
                  <ChevronDown
                    aria-hidden="true"
                    className="h-4 w-4 transition-transform [[data-state=open]_&]:rotate-180"
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="rounded-md border border-border bg-muted/40 px-4 py-3 text-sm space-y-1">
                <p>{tContent("demonstration.labels.advancedFilter1")}</p>
                <p>{tContent("demonstration.labels.advancedFilter2")}</p>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Controlled */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Controlado
            </p>
            <ControlledDemo tContent={tContent} />
          </div>

          {/* Disabled */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Desabilitado
            </p>
            <Collapsible className="w-full max-w-sm space-y-2">
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex w-full items-center justify-between px-4"
                  disabled
                >
                  <span>{tContent("demonstration.labels.headerLabel")}</span>
                  <ChevronDown aria-hidden="true" className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="rounded-md border border-border bg-muted/40 px-4 py-3 text-sm space-y-1">
                <p>{tContent("demonstration.labels.advancedFilter1")}</p>
              </CollapsibleContent>
            </Collapsible>
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
            { s: tContent("usage.scenarios.item6.s"), u: tContent("usage.scenarios.item6.u"), a: tContent("usage.scenarios.item6.a") },
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
              <Collapsible className="w-full space-y-2">
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex w-full items-center justify-between px-4"
                    aria-label="Exibir filtros avançados"
                  >
                    <span>Exibir filtros avançados</span>
                    <ChevronDown
                      aria-hidden="true"
                      className="h-4 w-4 transition-transform [[data-state=open]_&]:rotate-180"
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="rounded-md border border-border bg-muted/40 px-4 py-3 text-sm">
                  <p>Filtro avançado 1</p>
                </CollapsibleContent>
              </Collapsible>
            ),
            dontPreview: (
              <Collapsible className="w-full space-y-2">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="flex w-full items-center justify-between px-4">
                    <span>Ver mais</span>
                    <ChevronDown aria-hidden="true" className="h-4 w-4" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="rounded-md border border-border bg-muted/40 px-4 py-3 text-sm">
                  <p>Filtro avançado 1</p>
                </CollapsibleContent>
              </Collapsible>
            ),
            doCaption: tContent("doDont.pair1.do"),
            dontCaption: tContent("doDont.pair1.dont"),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <Collapsible className="w-full space-y-2">
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex w-full items-center justify-between px-4"
                  >
                    <span>Filtros avançados</span>
                    <ChevronDown aria-hidden="true" className="h-4 w-4 transition-transform [[data-state=open]_&]:rotate-180" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="rounded-md border border-border bg-muted/40 px-4 py-3 text-sm">
                  <p>Filtro avançado 1</p>
                </CollapsibleContent>
              </Collapsible>
            ),
            dontPreview: (
              <div className="w-full space-y-2">
                {[1, 2, 3].map((i) => (
                  <Collapsible key={i} className="space-y-1">
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="flex w-full items-center justify-between px-4 text-sm">
                        <span>Seção {i}</span>
                        <ChevronDown aria-hidden="true" className="h-3 w-3" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="rounded border px-3 py-2 text-xs">
                      Conteúdo {i}
                    </CollapsibleContent>
                  </Collapsible>
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
        description={tContent("import.basic")}
        code={codeImportBasic}
        secondaryDescription={tContent("import.withButton")}
        secondaryCode={codeImportWithButton}
      />

      {/* ── Variantes (Modos) ─────────────────────────────────────── */}
      <DocsVariants
        title={tContent("variants.title")}
        componentSlug="collapsible"
        items={[
          {
            name: "uncontrolled",
            description: stripHtml(tContent("variants.items.uncontrolled")),
            code: codeUncontrolled,
            preview: (
              <Collapsible defaultOpen={false} className="w-full max-w-sm space-y-2">
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex w-full items-center justify-between px-4"
                  >
                    <span>{tContent("demonstration.labels.triggerClosed")}</span>
                    <ChevronDown
                      aria-hidden="true"
                      className="h-4 w-4 transition-transform [[data-state=open]_&]:rotate-180"
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="rounded-md border border-border bg-muted/40 px-4 py-3 text-sm space-y-1">
                  <p>{tContent("demonstration.labels.advancedFilter1")}</p>
                  <p>{tContent("demonstration.labels.advancedFilter2")}</p>
                </CollapsibleContent>
              </Collapsible>
            ),
          },
          {
            name: "controlled",
            description: stripHtml(tContent("variants.items.controlled")),
            code: codeControlled,
            preview: <ControlledDemo tContent={tContent} />,
          },
        ]}
      />

      {/* ── Composições ───────────────────────────────────────────── */}
      <DocsCompositions
        title={tContent("variants.compositionsTitle")}
        useWhenLabel={tNav("common.useWhen")}
        componentSlug="collapsible"
        items={[
          {
            name: tContent("variants.compositions.customButton.name"),
            description: tContent("variants.compositions.customButton.description"),
            useWhen: tContent("variants.compositions.customButton.use"),
            code: `<Collapsible className="w-full max-w-sm">
  <CollapsibleTrigger asChild>
    <Button variant="outline">Exibir opções avançadas</Button>
  </CollapsibleTrigger>
  <CollapsibleContent className="rounded-md border border-border bg-muted/50 p-4 text-sm space-y-2 mt-2">
    <p>Opção avançada 1</p>
    <p>Opção avançada 2</p>
    <p>Opção avançada 3</p>
  </CollapsibleContent>
</Collapsible>`,
            preview: (
              <Collapsible className="w-full max-w-sm">
                <CollapsibleTrigger asChild>
                  <Button variant="outline">Exibir opções avançadas</Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="rounded-md border border-border bg-muted/50 p-4 text-sm space-y-2 mt-2">
                  <p>Opção avançada 1</p>
                  <p>Opção avançada 2</p>
                  <p>Opção avançada 3</p>
                </CollapsibleContent>
              </Collapsible>
            ),
          },
          {
            name: tContent("variants.compositions.iconTrigger.name"),
            description: tContent("variants.compositions.iconTrigger.description"),
            useWhen: tContent("variants.compositions.iconTrigger.use"),
            code: `<Collapsible className="w-full max-w-sm">
  <CollapsibleTrigger asChild>
    <Button variant="outline">
      <span className="flex items-center gap-2">
        <Filter aria-hidden="true" className="h-4 w-4" />
        Filtros avançados
      </span>
    </Button>
  </CollapsibleTrigger>
  <CollapsibleContent className="rounded-md border border-border bg-muted/50 p-4 text-sm space-y-2 mt-2">
    <p>Filtro por categoria</p>
    <p>Filtro por data</p>
    <p>Filtro por status</p>
  </CollapsibleContent>
</Collapsible>`,
            preview: (
              <Collapsible className="w-full max-w-sm">
                <CollapsibleTrigger asChild>
                  <Button variant="outline">
                    <span className="flex items-center gap-2">
                      <Filter aria-hidden="true" className="h-4 w-4" />
                      Filtros avançados
                    </span>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="rounded-md border border-border bg-muted/50 p-4 text-sm space-y-2 mt-2">
                  <p>Filtro por categoria</p>
                  <p>Filtro por data</p>
                  <p>Filtro por status</p>
                </CollapsibleContent>
              </Collapsible>
            ),
          },
          {
            name: tContent("variants.compositions.rotatingChevron.name"),
            description: tContent("variants.compositions.rotatingChevron.description"),
            useWhen: tContent("variants.compositions.rotatingChevron.use"),
            code: `<Collapsible className="group/collapsible w-full max-w-sm">
  <CollapsibleTrigger asChild>
    <button
      type="button"
      className="flex w-full items-center justify-between rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent"
    >
      <span>Configurações avançadas</span>
      <ChevronDown
        aria-hidden="true"
        className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180"
      />
    </button>
  </CollapsibleTrigger>
  <CollapsibleContent className="rounded-md border border-border bg-muted/50 p-4 text-sm space-y-2 mt-2">
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">Notificações</span>
      <span className="font-medium">Ativadas</span>
    </div>
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">Privacidade</span>
      <span className="font-medium">Modo estrito</span>
    </div>
  </CollapsibleContent>
</Collapsible>`,
            preview: (
              <Collapsible className="group/collapsible w-full max-w-sm">
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent"
                  >
                    <span>Configurações avançadas</span>
                    <ChevronDown
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180"
                    />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="rounded-md border border-border bg-muted/50 p-4 text-sm space-y-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Notificações</span>
                    <span className="font-medium">Ativadas</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Privacidade</span>
                    <span className="font-medium">Modo estrito</span>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ),
          },
          {
            name: tContent("variants.compositions.richContent.name"),
            description: tContent("variants.compositions.richContent.description"),
            useWhen: tContent("variants.compositions.richContent.use"),
            code: `<Collapsible className="w-full max-w-sm">
  <CollapsibleTrigger asChild>
    <Button variant="outline">
      <span className="flex items-center gap-2">
        <Settings aria-hidden="true" className="h-4 w-4" />
        Configurações do sistema
      </span>
    </Button>
  </CollapsibleTrigger>
  <CollapsibleContent className="rounded-md border border-border bg-muted/50 p-4 text-sm space-y-3 mt-2">
    <p className="text-muted-foreground">
      Altere as configurações abaixo com cuidado. As mudanças são aplicadas imediatamente.
    </p>
    <label className="flex items-center gap-2">
      <input type="checkbox" />
      <span>Habilitar modo de depuração</span>
    </label>
    <label className="flex items-center gap-2">
      <input type="checkbox" />
      <span>Limpar cache ao sair</span>
    </label>
    <label className="flex items-center gap-2">
      <input type="checkbox" />
      <span>Exportar logs automaticamente</span>
    </label>
  </CollapsibleContent>
</Collapsible>`,
            preview: (
              <Collapsible className="w-full max-w-sm">
                <CollapsibleTrigger asChild>
                  <Button variant="outline">
                    <span className="flex items-center gap-2">
                      <Settings aria-hidden="true" className="h-4 w-4" />
                      Configurações do sistema
                    </span>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="rounded-md border border-border bg-muted/50 p-4 text-sm space-y-3 mt-2">
                  <p className="text-muted-foreground">
                    Altere as configurações abaixo com cuidado. As mudanças são aplicadas imediatamente.
                  </p>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" />
                    <span>Habilitar modo de depuração</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" />
                    <span>Limpar cache ao sair</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" />
                    <span>Exportar logs automaticamente</span>
                  </label>
                </CollapsibleContent>
              </Collapsible>
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
            label: tContent("states.closed.label"),
            trigger: stripHtml(tContent("states.closed.trigger")),
            behavior: tContent("states.closed.behavior"),
          },
          {
            label: tContent("states.open.label"),
            trigger: stripHtml(tContent("states.open.trigger")),
            behavior: tContent("states.open.behavior"),
          },
          {
            label: tContent("states.defaultOpen.label"),
            trigger: stripHtml(tContent("states.defaultOpen.trigger")),
            behavior: tContent("states.defaultOpen.behavior"),
          },
          {
            label: tContent("states.disabled.label"),
            trigger: stripHtml(tContent("states.disabled.trigger")),
            behavior: stripHtml(tContent("states.disabled.behavior")),
          },
        ]}
      />

      {/* ── Propriedades ──────────────────────────────────────────── */}
      <DocsProps
        title={tContent("props.title")}
        tables={[
          {
            title: tContent("props.collapsibleTitle"),
            cols: {
              prop: tContent("props.table.prop"),
              type: tContent("props.table.type"),
              default: tContent("props.table.default"),
              required: tContent("props.table.required"),
              description: tContent("props.table.description"),
            },
            items: [
              {
                name: "open",
                type: "boolean",
                defaultValue: "—",
                required: "Não",
                description: tContent("props.table.open"),
              },
              {
                name: "defaultOpen",
                type: "boolean",
                defaultValue: "false",
                required: "Não",
                description: tContent("props.table.defaultOpen"),
              },
              {
                name: "onOpenChange",
                type: "(open: boolean) => void",
                defaultValue: "—",
                required: "Não",
                description: tContent("props.table.onOpenChange"),
              },
              {
                name: "disabled",
                type: "boolean",
                defaultValue: "false",
                required: "Não",
                description: tContent("props.table.disabled"),
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
            title: tContent("props.triggerTitle"),
            cols: {
              prop: tContent("props.table.prop"),
              type: tContent("props.table.type"),
              default: tContent("props.table.default"),
              required: tContent("props.table.required"),
              description: tContent("props.table.description"),
            },
            items: [
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
                description: tContent("props.table.disabled"),
              },
              {
                name: "className",
                type: "string",
                defaultValue: "—",
                required: "Não",
                description: tContent("props.table.className"),
              },
            ],
          },
          {
            title: tContent("props.contentTitle"),
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
          { token: "--border",     value: "border-border",           description: tContent("tokens.table.border") },
          { token: "--muted",      value: "bg-muted/40",             description: tContent("tokens.table.background") },
          { token: "--radius",     value: "rounded-md",              description: tContent("tokens.table.radius") },
          { token: "--accent",     value: "hover:bg-accent",         description: tContent("tokens.table.triggerHover") },
          { token: "--ring",       value: "focus-visible:ring-ring", description: tContent("tokens.table.triggerFocus") },
          { token: "transition",   value: "transition-[height]",     description: tContent("tokens.table.transition") },
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
          { key: "Space", description: tContent("accessibility.keyboard.space") },
          { key: "—",     description: tContent("accessibility.keyboard.noArrow") },
        ]}
      />

      {/* ── Relacionados ──────────────────────────────────────────── */}
      <DocsRelated
        title={tContent("related.title")}
        items={[
          {
            name: "Accordion",
            description: tContent("related.accordion"),
            path: "?path=/docs/ui-accordion--docs",
          },
          {
            name: "Sheet",
            description: tContent("related.sheet"),
            path: "?path=/docs/ui-sheet--docs",
          },
          {
            name: "Button",
            description: tContent("related.button"),
            path: "?path=/docs/ui-button--docs",
          },
          {
            name: "Tabs",
            description: tContent("related.tabs"),
            path: "?path=/docs/ui-tabs--docs",
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
            event: tContent("analytics.table.toggle"),
            trigger: tContent("analytics.table.toggleTrigger"),
            payload: tContent("analytics.table.togglePayload"),
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
            {
              criterion: tContent("testes.accessibility.item5.criterion"),
              level: tContent("testes.accessibility.item5.level"),
              how: tContent("testes.accessibility.item5.how"),
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
            { story: tContent("testes.visual.item3.story"), priority: tNav(priorityKeyMap[tContent("testes.visual.item3.priority")] ?? "common.high") },
            { story: tContent("testes.visual.item4.story"), priority: tNav(priorityKeyMap[tContent("testes.visual.item4.priority")] ?? "common.medium") },
            { story: tContent("testes.visual.item5.story"), priority: tNav(priorityKeyMap[tContent("testes.visual.item5.priority")] ?? "common.medium") },
          ],
        }}
      />
    </DocsPageLayout>
  );
}
