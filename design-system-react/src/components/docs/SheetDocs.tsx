import { useCallback, useEffect, useMemo } from "react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import { useActiveSection } from "@/lib/use-active-section";
import uiTranslations from "@/i18n/ui.json";
import sheetTranslations from "@shared/content/sheet/translations.json";

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


type DemoProps = {
  trigger: string;
  title: string;
  description: string;
  cancel: string;
  apply: string;
  side?: "top" | "right" | "bottom" | "left";
  location: string;
};

function SheetDemo({ trigger, title, description, cancel, apply, side = "right", location }: DemoProps) {
  return (
    <div style={{ contain: "layout" }}>
      <Sheet
        onOpenChange={(open) =>
          track(open ? "dialog_open" : "dialog_close", {
            component: "sheet",
            ...(open ? { trigger_label: trigger } : { reason: "user" }),
            location,
          })
        }
      >
        <SheetTrigger render={<Button variant="outline" />}>{trigger}</SheetTrigger>
        <SheetContent side={side}>
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>{description}</SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <SheetClose render={<Button variant="outline" />}>{cancel}</SheetClose>
            <Button
              onClick={() =>
                track("dialog_confirm", {
                  component: "sheet",
                  action: apply,
                  location,
                })
              }
            >
              {apply}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function FiltersFormDemo({ trigger, title, description, cancel, apply, location }: DemoProps) {
  return (
    <div style={{ contain: "layout" }}>
      <Sheet
        onOpenChange={(open) =>
          open &&
          track("dialog_open", {
            component: "sheet",
            trigger_label: trigger,
            location,
          })
        }
      >
        <SheetTrigger render={<Button variant="outline" />}>{trigger}</SheetTrigger>
        <SheetContent side="right" className="w-[400px] sm:w-[420px]">
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>{description}</SheetDescription>
          </SheetHeader>
          <form
            className="grid gap-4 px-4"
            onSubmit={(e) => {
              e.preventDefault();
              track("dialog_confirm", {
                component: "sheet",
                action: apply,
                location,
              });
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor="docs-sheet-category">Categoria</Label>
              <Input id="docs-sheet-category" defaultValue="Eletrônicos" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="docs-sheet-min">Preço mínimo</Label>
              <Input id="docs-sheet-min" type="number" defaultValue="100" />
            </div>
            <SheetFooter>
              <SheetClose render={<Button type="button" variant="outline" />}>
                {cancel}
              </SheetClose>
              <Button type="submit">{apply}</Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export function SheetDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(sheetTranslations);

  const navGroups = useMemo(() => getNavGroups(tNav), [tNav]);
  const allIds = useMemo(
    () => navGroups.flatMap((g) => g.sections.map((s) => s.id)),
    [navGroups]
  );

  useSeoEffect({
    title: tContent("seo.title"),
    description: tContent("seo.description"),
    locale,
    componentSlug: "sheet",
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
      component_name: "sheet",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "sheet",
        locale,
      });
    },
    [locale]
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  const codeImport = `import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";`;

  const codeRight = `<Sheet>
  <SheetTrigger asChild>
    <Button variant="outline">Abrir filtros</Button>
  </SheetTrigger>
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>Filtros avançados</SheetTitle>
      <SheetDescription>Configure os filtros para refinar os resultados.</SheetDescription>
    </SheetHeader>
    <SheetFooter>
      <SheetClose asChild>
        <Button variant="outline">Cancelar</Button>
      </SheetClose>
      <Button>Aplicar filtros</Button>
    </SheetFooter>
  </SheetContent>
</Sheet>`;

  const codeLeft = `<SheetContent side="left">
  <SheetHeader>
    <SheetTitle>Navegação</SheetTitle>
    <SheetDescription>Acesse seções secundárias do app.</SheetDescription>
  </SheetHeader>
  {/* itens de menu */}
</SheetContent>`;

  const codeTop = `<SheetContent side="top">
  <SheetHeader>
    <SheetTitle>Notificações</SheetTitle>
    <SheetDescription>Avisos importantes deslizam do topo.</SheetDescription>
  </SheetHeader>
</SheetContent>`;

  const codeBottom = `<SheetContent side="bottom">
  <SheetHeader>
    <SheetTitle>Ações rápidas</SheetTitle>
    <SheetDescription>Compartilhar, duplicar ou excluir.</SheetDescription>
  </SheetHeader>
</SheetContent>`;

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
          installNote="npx shadcn@latest add sheet"
        />
      }
    >
      <DocsDemonstration title={tContent("demonstration.title")}>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <SheetDemo
            trigger={tContent("demonstration.labels.trigger")}
            title={tContent("demonstration.labels.title")}
            description={tContent("demonstration.labels.description")}
            cancel={tContent("demonstration.labels.cancel")}
            apply={tContent("demonstration.labels.apply")}
            location="docs:demo"
          />
          <FiltersFormDemo
            trigger={tContent("demonstration.labels.trigger")}
            title={tContent("demonstration.labels.title")}
            description={tContent("demonstration.labels.description")}
            cancel={tContent("demonstration.labels.cancel")}
            apply={tContent("demonstration.labels.apply")}
            location="docs:demo:form"
          />
        </div>
      </DocsDemonstration>

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
          tContent("anatomy.item8"),
        ]}
        structureLabel={tContent("anatomy.structureLabel")}
        structureCode={tContent("anatomy.structureCode")}
      />

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
          items: [1, 2, 3, 4, 5, 6].map((i) => ({
            s: tContent(`usage.scenarios.item${i}.s`),
            u: tContent(`usage.scenarios.item${i}.u`),
            a: tContent(`usage.scenarios.item${i}.a`),
          })),
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
              element: tContent("usage.uxWriting.table.trigger.name"),
              rules: tContent("usage.uxWriting.table.trigger.format"),
              do: tContent("usage.uxWriting.table.trigger.good"),
              dont: tContent("usage.uxWriting.table.trigger.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.primary.name"),
              rules: tContent("usage.uxWriting.table.primary.format"),
              do: tContent("usage.uxWriting.table.primary.good"),
              dont: tContent("usage.uxWriting.table.primary.bad"),
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
            stripHtml(tContent("usage.dont.item1")),
            stripHtml(tContent("usage.dont.item2")),
            stripHtml(tContent("usage.dont.item3")),
            stripHtml(tContent("usage.dont.item4")),
          ],
        }}
      />

      <DocsDoDont
        title={tContent("doDont.title")}
        pairs={[
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <SheetDemo
                trigger={tContent("demonstration.labels.trigger")}
                title={tContent("demonstration.labels.title")}
                description={tContent("demonstration.labels.description")}
                cancel={tContent("demonstration.labels.cancel")}
                apply={tContent("demonstration.labels.apply")}
                location="docs:dodont:pair1:do"
              />
            ),
            dontPreview: (
              <div style={{ contain: "layout" }}>
                <Sheet>
                  <SheetTrigger render={<Button variant="outline" />}>
                    Abrir
                  </SheetTrigger>
                  <SheetContent side="right">
                    {/* Sem Title/Description — exemplo do "Don't" */}
                    <SheetHeader>
                      <SheetTitle className="sr-only">Sem título visível</SheetTitle>
                      <SheetDescription className="sr-only">
                        Sem descrição visível
                      </SheetDescription>
                    </SheetHeader>
                    <p className="px-4 text-sm text-muted-foreground">
                      Conteúdo sem cabeçalho — leitores de tela perdem contexto.
                    </p>
                  </SheetContent>
                </Sheet>
              </div>
            ),
            doCaption: stripHtml(tContent("doDont.pair1.do")),
            dontCaption: stripHtml(tContent("doDont.pair1.dont")),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <SheetDemo
                trigger={tContent("demonstration.labels.trigger")}
                title={tContent("demonstration.labels.title")}
                description={tContent("demonstration.labels.description")}
                cancel={tContent("demonstration.labels.cancel")}
                apply={tContent("demonstration.labels.apply")}
                side="right"
                location="docs:dodont:pair2:do"
              />
            ),
            dontPreview: (
              <SheetDemo
                trigger={tContent("demonstration.labels.trigger")}
                title={tContent("demonstration.labels.title")}
                description={tContent("demonstration.labels.description")}
                cancel={tContent("demonstration.labels.cancel")}
                apply={tContent("demonstration.labels.apply")}
                side="top"
                location="docs:dodont:pair2:dont"
              />
            ),
            doCaption: stripHtml(tContent("doDont.pair2.do")),
            dontCaption: stripHtml(tContent("doDont.pair2.dont")),
          },
        ]}
      />

      <DocsImport title={tContent("import.title")} code={codeImport} />

      <DocsVariants
        title={tContent("variants.title")}
        componentSlug="sheet"
        items={[
          {
            name: tContent("variants.items.right"),
            description: stripHtml(tContent("variants.styles.right")),
            code: codeRight,
            preview: (
              <SheetDemo
                trigger={tContent("demonstration.labels.trigger")}
                title={tContent("demonstration.labels.rightLabel")}
                description={tContent("demonstration.labels.description")}
                cancel={tContent("demonstration.labels.cancel")}
                apply={tContent("demonstration.labels.apply")}
                side="right"
                location="docs:variants:right"
              />
            ),
          },
          {
            name: tContent("variants.items.left"),
            description: stripHtml(tContent("variants.styles.left")),
            code: codeLeft,
            preview: (
              <SheetDemo
                trigger={tContent("demonstration.labels.trigger")}
                title={tContent("demonstration.labels.leftLabel")}
                description={tContent("demonstration.labels.description")}
                cancel={tContent("demonstration.labels.cancel")}
                apply={tContent("demonstration.labels.apply")}
                side="left"
                location="docs:variants:left"
              />
            ),
          },
          {
            name: tContent("variants.items.top"),
            description: stripHtml(tContent("variants.styles.top")),
            code: codeTop,
            preview: (
              <SheetDemo
                trigger={tContent("demonstration.labels.trigger")}
                title={tContent("demonstration.labels.topLabel")}
                description={tContent("demonstration.labels.description")}
                cancel={tContent("demonstration.labels.cancel")}
                apply={tContent("demonstration.labels.apply")}
                side="top"
                location="docs:variants:top"
              />
            ),
          },
          {
            name: tContent("variants.items.bottom"),
            description: stripHtml(tContent("variants.styles.bottom")),
            code: codeBottom,
            preview: (
              <SheetDemo
                trigger={tContent("demonstration.labels.trigger")}
                title={tContent("demonstration.labels.bottomLabel")}
                description={tContent("demonstration.labels.description")}
                cancel={tContent("demonstration.labels.cancel")}
                apply={tContent("demonstration.labels.apply")}
                side="bottom"
                location="docs:variants:bottom"
              />
            ),
          },
        ]}
      />

      <DocsCompositions
        title={tContent("variants.compositionsTitle")}
        useWhenLabel={tNav("common.useWhen")}
        componentSlug="sheet"
        items={[
          {
            name: tContent("variants.compositions.advancedFilters.name"),
            description: tContent("variants.compositions.advancedFilters.description"),
            useWhen: tContent("variants.compositions.advancedFilters.use"),
            code: `<Sheet>
  <SheetTrigger render={<Button variant="outline" />}>Abrir filtros</SheetTrigger>
  <SheetContent side="right" className="w-[400px] sm:w-[420px]">
    <SheetHeader>
      <SheetTitle>Filtros avançados</SheetTitle>
      <SheetDescription>Configure os filtros para refinar os resultados.</SheetDescription>
    </SheetHeader>
    <form className="grid gap-4 px-4">
      <Label htmlFor="cat">Categoria</Label>
      <Input id="cat" defaultValue="Eletrônicos" />
      <Label htmlFor="min">Preço mínimo</Label>
      <Input id="min" type="number" defaultValue="100" />
    </form>
    <SheetFooter>
      <SheetClose render={<Button variant="outline" />}>Cancelar</SheetClose>
      <Button>Aplicar filtros</Button>
    </SheetFooter>
  </SheetContent>
</Sheet>`,
            preview: (
              <FiltersFormDemo
                trigger={tContent("demonstration.labels.trigger")}
                title={tContent("demonstration.labels.title")}
                description={tContent("demonstration.labels.description")}
                cancel={tContent("demonstration.labels.cancel")}
                apply={tContent("demonstration.labels.apply")}
                location="docs:comp:filters"
              />
            ),
          },
          {
            name: tContent("variants.compositions.secondaryNavigation.name"),
            description: tContent("variants.compositions.secondaryNavigation.description"),
            useWhen: tContent("variants.compositions.secondaryNavigation.use"),
            code: `<Sheet>
  <SheetTrigger render={<Button variant="outline" />}>Abrir menu</SheetTrigger>
  <SheetContent side="left">
    <SheetHeader>
      <SheetTitle>Menu</SheetTitle>
      <SheetDescription>Navegue entre as áreas do sistema.</SheetDescription>
    </SheetHeader>
    <nav aria-label="Navegação secundária" className="flex flex-col gap-1 px-4">
      <a href="#" className="px-3 py-2 rounded-md text-sm hover:bg-accent">Dashboard</a>
      <a href="#" className="px-3 py-2 rounded-md text-sm hover:bg-accent">Projetos</a>
      <a href="#" className="px-3 py-2 rounded-md text-sm hover:bg-accent">Equipe</a>
      <a href="#" className="px-3 py-2 rounded-md text-sm hover:bg-accent">Configurações</a>
    </nav>
  </SheetContent>
</Sheet>`,
            preview: (
              <div style={{ contain: "layout" }}>
                <Sheet>
                  <SheetTrigger render={<Button variant="outline" />}>Abrir menu</SheetTrigger>
                  <SheetContent side="left">
                    <SheetHeader>
                      <SheetTitle>Menu</SheetTitle>
                      <SheetDescription>Navegue entre as áreas do sistema.</SheetDescription>
                    </SheetHeader>
                    <nav aria-label="Navegação secundária" className="flex flex-col gap-1 px-4">
                      <a href="#" className="px-3 py-2 rounded-md text-sm hover:bg-accent">Dashboard</a>
                      <a href="#" className="px-3 py-2 rounded-md text-sm hover:bg-accent">Projetos</a>
                      <a href="#" className="px-3 py-2 rounded-md text-sm hover:bg-accent">Equipe</a>
                      <a href="#" className="px-3 py-2 rounded-md text-sm hover:bg-accent">Configurações</a>
                    </nav>
                  </SheetContent>
                </Sheet>
              </div>
            ),
          },
          {
            name: tContent("variants.compositions.mobileActions.name"),
            description: tContent("variants.compositions.mobileActions.description"),
            useWhen: tContent("variants.compositions.mobileActions.use"),
            code: `<Sheet>
  <SheetTrigger render={<Button variant="outline" />}>Mais opções</SheetTrigger>
  <SheetContent side="bottom">
    <SheetHeader>
      <SheetTitle>Ações rápidas</SheetTitle>
      <SheetDescription>Escolha o que fazer com este item.</SheetDescription>
    </SheetHeader>
    <div className="grid grid-cols-3 gap-3 px-4 text-sm">
      <button type="button" className="p-3 rounded-md border hover:bg-accent">Compartilhar</button>
      <button type="button" className="p-3 rounded-md border hover:bg-accent">Editar</button>
      <button type="button" className="p-3 rounded-md border hover:bg-accent">Excluir</button>
    </div>
  </SheetContent>
</Sheet>`,
            preview: (
              <div style={{ contain: "layout" }}>
                <Sheet>
                  <SheetTrigger render={<Button variant="outline" />}>Mais opções</SheetTrigger>
                  <SheetContent side="bottom">
                    <SheetHeader>
                      <SheetTitle>Ações rápidas</SheetTitle>
                      <SheetDescription>Escolha o que fazer com este item.</SheetDescription>
                    </SheetHeader>
                    <div className="grid grid-cols-3 gap-3 px-4 text-sm">
                      <button type="button" className="p-3 rounded-md border hover:bg-accent">Compartilhar</button>
                      <button type="button" className="p-3 rounded-md border hover:bg-accent">Editar</button>
                      <button type="button" className="p-3 rounded-md border hover:bg-accent">Excluir</button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            ),
          },
          {
            name: tContent("variants.compositions.longScrollBody.name"),
            description: tContent("variants.compositions.longScrollBody.description"),
            useWhen: tContent("variants.compositions.longScrollBody.use"),
            code: `<Sheet>
  <SheetTrigger render={<Button variant="outline" />}>Ler termos</SheetTrigger>
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>Termos de uso</SheetTitle>
      <SheetDescription>Leia atentamente antes de aceitar.</SheetDescription>
    </SheetHeader>
    <div className="space-y-3 px-4 text-sm text-muted-foreground">
      {/* parágrafos longos — body rola, footer fixo */}
    </div>
    <SheetFooter>
      <SheetClose render={<Button variant="outline" />}>Cancelar</SheetClose>
      <Button>Aceitar termos</Button>
    </SheetFooter>
  </SheetContent>
</Sheet>`,
            preview: (
              <div style={{ contain: "layout" }}>
                <Sheet>
                  <SheetTrigger render={<Button variant="outline" />}>Ler termos</SheetTrigger>
                  <SheetContent side="right">
                    <SheetHeader>
                      <SheetTitle>Termos de uso</SheetTitle>
                      <SheetDescription>Leia atentamente antes de aceitar.</SheetDescription>
                    </SheetHeader>
                    <div className="space-y-3 px-4 text-sm text-muted-foreground">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <p key={i}>Parágrafo {i + 1}: termos de uso longos para garantir que o body precise rolar internamente sem expandir o painel.</p>
                      ))}
                    </div>
                    <SheetFooter>
                      <SheetClose render={<Button variant="outline" />}>Cancelar</SheetClose>
                      <Button>Aceitar termos</Button>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>
              </div>
            ),
          },
        ]}
      />

      <DocsStates
        title={tContent("states.title")}
        cols={{
          state: tContent("states.title"),
          trigger: "data-state",
          behavior: tContent("usage.scenarios.cols.scenario"),
        }}
        items={[
          {
            label: tContent("states.items.closed"),
            trigger: 'closed',
            behavior: stripHtml(tContent("states.descriptions.closed")),
          },
          {
            label: tContent("states.items.open"),
            trigger: 'open',
            behavior: stripHtml(tContent("states.descriptions.open")),
          },
          {
            label: tContent("states.items.transitioning"),
            trigger: 'opening/closing',
            behavior: stripHtml(tContent("states.descriptions.transitioning")),
          },
          {
            label: tContent("states.items.focused"),
            trigger: ':focus-visible',
            behavior: stripHtml(tContent("states.descriptions.focused")),
          },
        ]}
      />

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
                name: "open",
                type: tContent("props.table.open.type"),
                defaultValue: tContent("props.table.open.default"),
                required: tContent("props.table.open.required"),
                description: stripHtml(tContent("props.table.open.description")),
              },
              {
                name: "defaultOpen",
                type: tContent("props.table.defaultOpen.type"),
                defaultValue: tContent("props.table.defaultOpen.default"),
                required: tContent("props.table.defaultOpen.required"),
                description: stripHtml(tContent("props.table.defaultOpen.description")),
              },
              {
                name: "onOpenChange",
                type: tContent("props.table.onOpenChange.type"),
                defaultValue: tContent("props.table.onOpenChange.default"),
                required: tContent("props.table.onOpenChange.required"),
                description: stripHtml(tContent("props.table.onOpenChange.description")),
              },
              {
                name: "side",
                type: tContent("props.table.side.type"),
                defaultValue: tContent("props.table.side.default"),
                required: tContent("props.table.side.required"),
                description: stripHtml(tContent("props.table.side.description")),
              },
              {
                name: "showCloseButton",
                type: tContent("props.table.showCloseButton.type"),
                defaultValue: tContent("props.table.showCloseButton.default"),
                required: tContent("props.table.showCloseButton.required"),
                description: stripHtml(tContent("props.table.showCloseButton.description")),
              },
              {
                name: "className",
                type: tContent("props.table.className.type"),
                defaultValue: tContent("props.table.className.default"),
                required: tContent("props.table.className.required"),
                description: stripHtml(tContent("props.table.className.description")),
              },
            ],
          },
        ]}
        extensibilityTitle={tContent("props.extensibilityTitle")}
        extensibilityNotes={tContent("props.extensibilityCode")}
      />

      <DocsTokens
        title={tContent("tokens.title")}
        cols={{
          token: tContent("tokens.table.token"),
          value: tContent("tokens.table.class"),
          description: tContent("tokens.table.part"),
        }}
        items={[
          { token: "--popover",            value: tContent("tokens.table.popover.class"),            description: tContent("tokens.table.popover.part") },
          { token: "--popover-foreground", value: tContent("tokens.table.popoverForeground.class"),  description: tContent("tokens.table.popoverForeground.part") },
          { token: "--foreground",         value: tContent("tokens.table.foreground.class"),         description: tContent("tokens.table.foreground.part") },
          { token: "--muted-foreground",   value: tContent("tokens.table.mutedForeground.class"),    description: tContent("tokens.table.mutedForeground.part") },
          { token: "--border",             value: tContent("tokens.table.border.class"),             description: tContent("tokens.table.border.part") },
          { token: "--ring",               value: tContent("tokens.table.ring.class"),               description: tContent("tokens.table.ring.part") },
          { token: "bg-black/10",          value: tContent("tokens.table.overlay.class"),            description: tContent("tokens.table.overlay.part") },
        ]}
        customizationTitle={tContent("tokens.customizationTitle")}
        customizationCode={tContent("tokens.customizationCode")}
      />

      <DocsAccessibility
        title={tContent("accessibility.title")}
        summary={stripHtml(tContent("accessibility.summary"))}
        items={[
          stripHtml(tContent("accessibility.items.item1")),
          stripHtml(tContent("accessibility.items.item2")),
          stripHtml(tContent("accessibility.items.item3")),
          stripHtml(tContent("accessibility.items.item4")),
          stripHtml(tContent("accessibility.items.item5")),
          stripHtml(tContent("accessibility.items.item6")),
          stripHtml(tContent("accessibility.items.item7")),
        ]}
        keyboardTitle={tContent("accessibility.keyboard.title")}
        keyboardItems={[
          { key: "Tab",       description: tContent("accessibility.keyboard.tab") },
          { key: "Shift+Tab", description: tContent("accessibility.keyboard.shiftTab") },
          { key: "Escape",    description: tContent("accessibility.keyboard.escape") },
          { key: "Enter",     description: tContent("accessibility.keyboard.enter") },
        ]}
      />

      <DocsRelated
        title={tContent("related.title")}
        componentSlug="sheet"
        items={[
          { name: tContent("related.items.drawer.name"),      description: tContent("related.items.drawer.description"),      path: "?path=/docs/ui-drawer--docs" },
          { name: tContent("related.items.dialog.name"),      description: tContent("related.items.dialog.description"),      path: "?path=/docs/ui-dialog--docs" },
          { name: tContent("related.items.alertDialog.name"), description: tContent("related.items.alertDialog.description"), path: "?path=/docs/ui-alertdialog--docs" },
          { name: tContent("related.items.popover.name"),     description: tContent("related.items.popover.description"),     path: "?path=/docs/ui-popover--docs" },
        ]}
      />

      <DocsNotes
        title={tContent("notes.title")}
        componentSlug="sheet"
        items={[
          { title: "", content: tContent("notes.item1") },
          { title: "", content: tContent("notes.item2") },
          { title: "", content: tContent("notes.item3") },
          { title: "", content: tContent("notes.item4") },
        ]}
      />

      <DocsAnalytics
        title={tContent("analytics.title")}
        cols={{
          event:   tContent("analytics.table.event"),
          trigger: tContent("analytics.table.trigger"),
          payload: tContent("analytics.table.payload"),
        }}
        items={[
          {
            event: "dialog_open",
            trigger: tContent("analytics.table.dialog_open.trigger"),
            payload: tContent("analytics.table.dialog_open.payload"),
          },
          {
            event: "dialog_close",
            trigger: tContent("analytics.table.dialog_close.trigger"),
            payload: tContent("analytics.table.dialog_close.payload"),
          },
          {
            event: "dialog_confirm",
            trigger: tContent("analytics.table.dialog_confirm.trigger"),
            payload: tContent("analytics.table.dialog_confirm.payload"),
          },
        ]}
      />

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
            action: tContent(`testes.functional.item${i}.action`),
            result: tContent(`testes.functional.item${i}.result`),
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
          items: [
            { criterion: tContent("testes.accessibility.item1"), level: "AA",       how: tContent("testes.accessibility.item1") },
            { criterion: tContent("testes.accessibility.item2"), level: "1.4.3",    how: tContent("testes.accessibility.item2") },
            { criterion: tContent("testes.accessibility.item3"), level: "4.1.2",    how: tContent("testes.accessibility.item3") },
            { criterion: tContent("testes.accessibility.item4"), level: "1.3.1",    how: tContent("testes.accessibility.item4") },
            { criterion: tContent("testes.accessibility.item5"), level: "1.3.1",    how: tContent("testes.accessibility.item5") },
          ],
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
