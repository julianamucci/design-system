import { useCallback, useEffect, useMemo } from "react";
import {
  Sheet,
  SheetClose,
  SheetBody,
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
import { mapCloseReason }    from "@/components/docs/shared/close-reason";
import { stripHtml, toPlainText } from "@/lib/strip-html";

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

/**
 * Snippet de uma direção — o MESMO painel nas quatro, e só a borda e o título
 * mudam.
 *
 * Sai de função porque os quatro previews desta seção são o mesmo `SheetDemo`:
 * com quatro literais soltos, três deles passaram a ensinar painéis que ninguém
 * renderiza ("Navegação", "Notificações", "Ações rápidas", em fragmento sem
 * gatilho nem rodapé) e o quarto publicava o título do Playground. O texto vem
 * em português, como todo snippet copiável do design system.
 */
const codeForSide = (side: string, title: string) => `<Sheet>
  <SheetTrigger render={<Button variant="outline" />}>Abrir filtros</SheetTrigger>
  <SheetContent side="${side}">
    <SheetHeader>
      <SheetTitle>${title}</SheetTitle>
      <SheetDescription>Configure os filtros para refinar os resultados.</SheetDescription>
    </SheetHeader>
    <SheetFooter>
      <SheetClose render={<Button variant="outline" />}>Cancelar</SheetClose>
      <Button>Aplicar filtros</Button>
    </SheetFooter>
  </SheetContent>
</Sheet>`;

/**
 * Lista do conteúdo compartilhado. `t()` devolve o valor cru e o achatamento
 * preserva array inteiro; a checagem existe porque chave ausente volta como o
 * próprio caminho, e um `.map` sobre string renderizaria letra por letra.
 */
function listFromContent(t: (key: string) => string, key: string): string[] {
  const value = t(key) as unknown;
  return Array.isArray(value) ? (value as string[]) : [];
}

type DemoProps = {
  trigger: string;
  title: string;
  description: string;
  cancel: string;
  apply: string;
  body?: string;
  side?: "top" | "right" | "bottom" | "left";
  location: string;
};

type FiltersFormDemoProps = DemoProps & {
  fieldCategory: string;
  fieldMinPrice: string;
  categoryValue: string;
};

function SheetDemo({ trigger, title, description, cancel, apply, body, side = "right", location }: DemoProps) {
  return (
    <div style={{ contain: "layout" }}>
      {/* label usa o SIDE (valor estável, não localizado) — texto traduzido
          fragmentaria o mesmo evento em 3 valores no GA4. */}
      <Sheet
        onOpenChange={(open, details) =>
          track(open ? "dialog_open" : "dialog_close", {
            component: "sheet",
            label: side,
            ...(open ? {} : { reason: mapCloseReason(details?.reason) }),
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
          {body ? (
            <SheetBody>
              <p className="nds-text-body nds-text-muted-foreground">{body}</p>
            </SheetBody>
          ) : null}
          <SheetFooter>
            <SheetClose render={<Button variant="outline" />}>{cancel}</SheetClose>
            <Button
              onClick={() =>
                track("dialog_confirm", {
                  component: "sheet",
                  action: "apply",
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

function FiltersFormDemo({ trigger, title, description, cancel, apply, fieldCategory, fieldMinPrice, categoryValue, location }: FiltersFormDemoProps) {
  const side = "right";
  return (
    <div style={{ contain: "layout" }}>
      {/* label usa o SIDE (valor estável, não localizado) — texto traduzido
          fragmentaria o mesmo evento em 3 valores no GA4. */}
      <Sheet
        onOpenChange={(open, details) =>
          track(open ? "dialog_open" : "dialog_close", {
            component: "sheet",
            label: side,
            ...(open ? {} : { reason: mapCloseReason(details?.reason) }),
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
          <SheetBody>
            {/* `nds-stack` com `sm` fora e `xs` no par rótulo ↔ campo é o ritmo
                do Vanilla, referência de markup da casa. */}
            <form
              id="docs-sheet-filters"
              className="nds-stack"
              data-spacing="sm"
              onSubmit={(e) => {
                e.preventDefault();
                track("dialog_confirm", {
                  component: "sheet",
                  action: "apply",
                  location,
                });
              }}
            >
              <div className="nds-stack" data-spacing="xs">
                <Label htmlFor="docs-sheet-category">{fieldCategory}</Label>
                {/* O valor de exemplo é conteúdo, não fixture: cravado, a
                    página em en/es mostrava "Eletrônicos" dentro do campo. */}
                <Input id="docs-sheet-category" defaultValue={categoryValue} />
              </div>
              <div className="nds-stack" data-spacing="xs">
                <Label htmlFor="docs-sheet-min">{fieldMinPrice}</Label>
                <Input id="docs-sheet-min" type="number" defaultValue="100" />
              </div>
            </form>
          </SheetBody>
          {/* O rodapé fica FORA do corpo: é ele que continua visível quando o
              conteúdo rola. O `form` liga o botão ao formulário de novo. */}
          <SheetFooter>
            <SheetClose render={<Button type="button" variant="outline" />}>
              {cancel}
            </SheetClose>
            <Button type="submit" form="docs-sheet-filters">{apply}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export function SheetDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(sheetTranslations);

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria.
  const screenReaderItems = useMemo(
    () =>
      Object.values(
        (sheetTranslations as unknown as Record<
          string,
          { accessibility?: { screenReader?: Record<string, string> } }
        >)[locale]?.accessibility?.screenReader ?? {},
      ),
    [locale],
  );

  // Listas das composições: o `t()` só devolve string, então as duas passam
  // por `listFromContent`, que é onde a forma do valor é conferida uma vez.
  const navigationItems = useMemo(
    () => listFromContent(tContent, "variants.compositions.secondaryNavigation.items"),
    [tContent],
  );
  const bottomPanelActions = useMemo(
    () => listFromContent(tContent, "variants.compositions.bottomPanel.actions"),
    [tContent],
  );

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
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";`;

  const codeRight = codeForSide("right", "Painel direito");
  const codeLeft = codeForSide("left", "Painel esquerdo");
  const codeTop = codeForSide("top", "Painel superior");
  const codeBottom = codeForSide("bottom", "Painel inferior");

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
      <DocsDemonstration title={tContent("demonstration.title")}>
        <div className="nds-cluster" data-justify="center" data-spacing="sm">
          <SheetDemo
            trigger={tContent("demonstration.labels.trigger")}
            title={tContent("demonstration.labels.title")}
            description={tContent("demonstration.labels.description")}
            cancel={tContent("demonstration.labels.cancel")}
            apply={tContent("demonstration.labels.apply")}
            body={tContent("demonstration.labels.body")}
            side="right"
            location="docs_demo"
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
          tContent("anatomy.item9"),
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
                body={tContent("demonstration.labels.body")}
                location="docs_do_dont"
              />
            ),
            dontPreview: (
              <div style={{ contain: "layout" }}>
                <Sheet
                  onOpenChange={(open, details) =>
                    track(open ? "dialog_open" : "dialog_close", {
                      component: "sheet",
                      label: "right",
                      ...(open ? {} : { reason: mapCloseReason(details?.reason) }),
                      location: "docs_do_dont",
                    })
                  }
                >
                  <SheetTrigger render={<Button variant="outline" />}>
                    {tContent("doDont.pair1.dontTrigger")}
                  </SheetTrigger>
                  <SheetContent side="right">
                    {/* Sem Title/Description — exemplo do "Don't" */}
                    <SheetHeader>
                      <SheetTitle className="nds-sr-only">
                        {tContent("doDont.pair1.dontTitle")}
                      </SheetTitle>
                      <SheetDescription className="nds-sr-only">
                        {tContent("doDont.pair1.dontDescription")}
                      </SheetDescription>
                    </SheetHeader>
                    <SheetBody>
                      <p className="nds-text-body nds-text-muted-foreground">
                        {tContent("doDont.pair1.dontBody")}
                      </p>
                    </SheetBody>
                    <SheetFooter>
                      <SheetClose render={<Button variant="outline" />}>
                        {tContent("demonstration.labels.cancel")}
                      </SheetClose>
                      <Button
                        onClick={() =>
                          track("dialog_confirm", {
                            component: "sheet",
                            action: "apply",
                            location: "docs_do_dont",
                          })
                        }
                      >
                        {tContent("demonstration.labels.apply")}
                      </Button>
                    </SheetFooter>
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
                body={tContent("demonstration.labels.body")}
                side="right"
                location="docs_do_dont"
              />
            ),
            dontPreview: (
              <SheetDemo
                trigger={tContent("demonstration.labels.trigger")}
                title={tContent("demonstration.labels.title")}
                description={tContent("demonstration.labels.description")}
                cancel={tContent("demonstration.labels.cancel")}
                apply={tContent("demonstration.labels.apply")}
                body={tContent("demonstration.labels.body")}
                side="top"
                location="docs_do_dont"
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
            trackId: "right",
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
                location="docs_variantes"
              />
            ),
          },
          {
            trackId: "left",
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
                location="docs_variantes"
              />
            ),
          },
          {
            trackId: "top",
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
                location="docs_variantes"
              />
            ),
          },
          {
            trackId: "bottom",
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
                location="docs_variantes"
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
            trackId: "advancedFilters",
            name: tContent("variants.compositions.advancedFilters.name"),
            description: tContent("variants.compositions.advancedFilters.description"),
            useWhen: tContent("variants.compositions.advancedFilters.use"),
            code: `<Sheet>
  <SheetTrigger render={<Button variant="outline" />}>Abrir filtros</SheetTrigger>
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>Filtros avançados</SheetTitle>
      <SheetDescription>Configure os filtros para refinar os resultados.</SheetDescription>
    </SheetHeader>
    <SheetBody>
      <form id="filters" className="nds-stack" data-spacing="sm">
        <div className="nds-stack" data-spacing="xs">
          <Label htmlFor="category">Categoria</Label>
          <Input id="category" defaultValue="Eletrônicos" />
        </div>
        <div className="nds-stack" data-spacing="xs">
          <Label htmlFor="min">Preço mínimo</Label>
          <Input id="min" type="number" defaultValue="100" />
        </div>
      </form>
    </SheetBody>
    <SheetFooter>
      <SheetClose render={<Button variant="outline" />}>Cancelar</SheetClose>
      <Button type="submit" form="filters">Aplicar filtros</Button>
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
                fieldCategory={tContent("variants.compositions.advancedFilters.fieldCategory")}
                fieldMinPrice={tContent("variants.compositions.advancedFilters.fieldMinPrice")}
                categoryValue={tContent("variants.compositions.advancedFilters.categoryValue")}
                location="docs_composicoes"
              />
            ),
          },
          {
            trackId: "secondaryNavigation",
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
    <SheetBody>
      <nav aria-label="Navegação secundária" className="nds-stack" data-spacing="xs">
        <a href="#" className="nds-rounded-md nds-px-4 nds-py-2 nds-text-body nds-hover-bg-accent">Dashboard</a>
        <a href="#" className="nds-rounded-md nds-px-4 nds-py-2 nds-text-body nds-hover-bg-accent">Projetos</a>
        <a href="#" className="nds-rounded-md nds-px-4 nds-py-2 nds-text-body nds-hover-bg-accent">Equipe</a>
        <a href="#" className="nds-rounded-md nds-px-4 nds-py-2 nds-text-body nds-hover-bg-accent">Configurações</a>
        <a href="#" className="nds-rounded-md nds-px-4 nds-py-2 nds-text-body nds-hover-bg-accent">Faturas</a>
      </nav>
    </SheetBody>
  </SheetContent>
</Sheet>`,
            preview: (
              <div style={{ contain: "layout" }}>
                <Sheet
                  onOpenChange={(open, details) =>
                    track(open ? "dialog_open" : "dialog_close", {
                      component: "sheet",
                      label: "left",
                      ...(open ? {} : { reason: mapCloseReason(details?.reason) }),
                      location: "docs_composicoes",
                    })
                  }
                >
                  <SheetTrigger render={<Button variant="outline" />}>
                    {tContent("variants.compositions.secondaryNavigation.trigger")}
                  </SheetTrigger>
                  <SheetContent side="left">
                    <SheetHeader>
                      <SheetTitle>
                        {tContent("variants.compositions.secondaryNavigation.panelTitle")}
                      </SheetTitle>
                      <SheetDescription>
                        {tContent("variants.compositions.secondaryNavigation.panelDescription")}
                      </SheetDescription>
                    </SheetHeader>
                    <SheetBody>
                      {/* O nome da <nav> vem do conteúdo compartilhado: é ele
                          que o leitor de tela anuncia, e cravado em português
                          a página em en/es anunciava no idioma errado. */}
                      <nav
                        aria-label={tContent("variants.compositions.secondaryNavigation.navLabel")}
                        className="nds-stack"
                        data-spacing="xs"
                      >
                        {navigationItems.map((item) => (
                          <a
                            key={item}
                            href="#"
                            className="nds-rounded-md nds-px-4 nds-py-2 nds-text-body nds-hover-bg-accent"
                          >
                            {item}
                          </a>
                        ))}
                      </nav>
                    </SheetBody>
                  </SheetContent>
                </Sheet>
              </div>
            ),
          },
          {
            trackId: "profileEdit",
            name: tContent("variants.compositions.profileEdit.name"),
            description: tContent("variants.compositions.profileEdit.description"),
            useWhen: tContent("variants.compositions.profileEdit.use"),
            code: `<Sheet>
  <SheetTrigger render={<Button variant="outline" />}>Editar perfil</SheetTrigger>
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>Editar perfil</SheetTitle>
      <SheetDescription>Atualize suas informações pessoais. As mudanças são salvas ao confirmar.</SheetDescription>
    </SheetHeader>
    <SheetBody>
      <form id="profile" className="nds-stack" data-spacing="sm">
        <div className="nds-stack" data-spacing="xs">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" defaultValue="Juliana Mucci" />
        </div>
        <div className="nds-stack" data-spacing="xs">
          <Label htmlFor="handle">Nome de usuário</Label>
          <Input id="handle" defaultValue="@julianamucci" />
        </div>
        <div className="nds-stack" data-spacing="xs">
          <Label htmlFor="bio">Bio</Label>
          <Input id="bio" defaultValue="Designer de sistemas em São Paulo" />
        </div>
      </form>
    </SheetBody>
    <SheetFooter>
      <SheetClose render={<Button variant="outline" />}>Cancelar</SheetClose>
      <Button type="submit" form="profile">Salvar alterações</Button>
    </SheetFooter>
  </SheetContent>
</Sheet>`,
            preview: (
              <div style={{ contain: "layout" }}>
                <Sheet
                  onOpenChange={(open, details) =>
                    track(open ? "dialog_open" : "dialog_close", {
                      component: "sheet",
                      label: "right",
                      ...(open ? {} : { reason: mapCloseReason(details?.reason) }),
                      location: "docs_composicoes",
                    })
                  }
                >
                  <SheetTrigger render={<Button variant="outline" />}>
                    {tContent("variants.compositions.profileEdit.trigger")}
                  </SheetTrigger>
                  <SheetContent side="right">
                    <SheetHeader>
                      <SheetTitle>
                        {tContent("variants.compositions.profileEdit.panelTitle")}
                      </SheetTitle>
                      <SheetDescription>
                        {tContent("variants.compositions.profileEdit.panelDescription")}
                      </SheetDescription>
                    </SheetHeader>
                    <SheetBody>
                      <form
                        id="docs-sheet-profile"
                        className="nds-stack"
                        data-spacing="sm"
                        onSubmit={(e) => {
                          e.preventDefault();
                          track("dialog_confirm", {
                            component: "sheet",
                            action: "save",
                            location: "docs_composicoes",
                          });
                        }}
                      >
                        <div className="nds-stack" data-spacing="xs">
                          <Label htmlFor="docs-sheet-profile-name">
                            {tContent("variants.compositions.profileEdit.fieldName")}
                          </Label>
                          <Input
                            id="docs-sheet-profile-name"
                            defaultValue={tContent("variants.compositions.profileEdit.fieldNameValue")}
                          />
                        </div>
                        <div className="nds-stack" data-spacing="xs">
                          <Label htmlFor="docs-sheet-profile-handle">
                            {tContent("variants.compositions.profileEdit.fieldHandle")}
                          </Label>
                          <Input
                            id="docs-sheet-profile-handle"
                            defaultValue={tContent("variants.compositions.profileEdit.fieldHandleValue")}
                          />
                        </div>
                        <div className="nds-stack" data-spacing="xs">
                          <Label htmlFor="docs-sheet-profile-bio">
                            {tContent("variants.compositions.profileEdit.fieldBio")}
                          </Label>
                          <Input
                            id="docs-sheet-profile-bio"
                            defaultValue={tContent("variants.compositions.profileEdit.fieldBioValue")}
                          />
                        </div>
                      </form>
                    </SheetBody>
                    <SheetFooter>
                      <SheetClose render={<Button type="button" variant="outline" />}>
                        {tContent("demonstration.labels.cancel")}
                      </SheetClose>
                      {/* Quem confirma é o ENVIO do formulário: o rodapé mora
                          fora do corpo rolável, e só o atributo `form` liga o
                          botão ao `form` — é o que faz o Enter num campo valer
                          tanto quanto o clique. */}
                      <Button type="submit" form="docs-sheet-profile">
                        {tContent("variants.compositions.profileEdit.submit")}
                      </Button>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>
              </div>
            ),
          },
          {
            trackId: "bottomPanel",
            name: tContent("variants.compositions.bottomPanel.name"),
            description: tContent("variants.compositions.bottomPanel.description"),
            useWhen: tContent("variants.compositions.bottomPanel.use"),
            code: `<Sheet>
  <SheetTrigger render={<Button variant="outline" />}>Abrir ações</SheetTrigger>
  <SheetContent side="bottom">
    <SheetHeader>
      <SheetTitle>Ações rápidas</SheetTitle>
      <SheetDescription>Escolha uma das ações disponíveis para este item.</SheetDescription>
    </SheetHeader>
    <SheetBody>
      <div className="nds-cluster" data-spacing="md">
        <Button variant="outline">Compartilhar</Button>
        <Button variant="outline">Duplicar</Button>
        <Button variant="destructive">Excluir</Button>
      </div>
    </SheetBody>
    <SheetFooter>
      <SheetClose render={<Button variant="outline" />}>Fechar</SheetClose>
    </SheetFooter>
  </SheetContent>
</Sheet>`,
            preview: (
              <div style={{ contain: "layout" }}>
                <Sheet
                  onOpenChange={(open, details) =>
                    track(open ? "dialog_open" : "dialog_close", {
                      component: "sheet",
                      label: "bottom",
                      ...(open ? {} : { reason: mapCloseReason(details?.reason) }),
                      location: "docs_composicoes",
                    })
                  }
                >
                  <SheetTrigger render={<Button variant="outline" />}>
                    {tContent("variants.compositions.bottomPanel.trigger")}
                  </SheetTrigger>
                  <SheetContent side="bottom">
                    <SheetHeader>
                      <SheetTitle>
                        {tContent("variants.compositions.bottomPanel.panelTitle")}
                      </SheetTitle>
                      <SheetDescription>
                        {tContent("variants.compositions.bottomPanel.panelDescription")}
                      </SheetDescription>
                    </SheetHeader>
                    <SheetBody>
                      <div className="nds-cluster" data-spacing="md">
                        {/* A destrutiva é a ÚLTIMA e a única com a variante que
                            a anuncia — a ordem vem do conteúdo compartilhado. */}
                        {bottomPanelActions.map((action, index) => (
                          <Button
                            key={action}
                            variant={
                              index === bottomPanelActions.length - 1 ? "destructive" : "outline"
                            }
                          >
                            {action}
                          </Button>
                        ))}
                      </div>
                    </SheetBody>
                    <SheetFooter>
                      <SheetClose render={<Button variant="outline" />}>
                        {tContent("variants.compositions.bottomPanel.close")}
                      </SheetClose>
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
          state: tContent("states.cols.state"),
          trigger: toPlainText(tContent("states.cols.trigger")),
          behavior: toPlainText(tContent("states.cols.behavior")),
        }}
        items={[
          {
            label: tContent("states.closed.label"),
            trigger: toPlainText(tContent("states.closed.trigger")),
            behavior: toPlainText(tContent("states.closed.behavior")),
          },
          {
            label: tContent("states.open.label"),
            trigger: toPlainText(tContent("states.open.trigger")),
            behavior: toPlainText(tContent("states.open.behavior")),
          },
          {
            label: tContent("states.transitioning.label"),
            trigger: toPlainText(tContent("states.transitioning.trigger")),
            behavior: toPlainText(tContent("states.transitioning.behavior")),
          },
          {
            label: tContent("states.focused.label"),
            trigger: toPlainText(tContent("states.focused.trigger")),
            behavior: toPlainText(tContent("states.focused.behavior")),
          },
          {
            label: tContent("states.longScrollBody.label"),
            trigger: toPlainText(tContent("states.longScrollBody.trigger")),
            behavior: toPlainText(tContent("states.longScrollBody.behavior")),
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
                description: toPlainText(tContent("props.table.open.description")),
              },
              {
                name: "defaultOpen",
                type: tContent("props.table.defaultOpen.type"),
                defaultValue: tContent("props.table.defaultOpen.default"),
                required: tContent("props.table.defaultOpen.required"),
                description: toPlainText(tContent("props.table.defaultOpen.description")),
              },
              {
                name: "onOpenChange",
                type: tContent("props.table.onOpenChange.type"),
                defaultValue: tContent("props.table.onOpenChange.default"),
                required: tContent("props.table.onOpenChange.required"),
                description: toPlainText(tContent("props.table.onOpenChange.description")),
              },
              {
                name: "side",
                type: tContent("props.table.side.type"),
                defaultValue: tContent("props.table.side.default"),
                required: tContent("props.table.side.required"),
                description: toPlainText(tContent("props.table.side.description")),
              },
              {
                name: "showCloseButton",
                type: tContent("props.table.showCloseButton.type"),
                defaultValue: tContent("props.table.showCloseButton.default"),
                required: tContent("props.table.showCloseButton.required"),
                description: toPlainText(tContent("props.table.showCloseButton.description")),
              },
              {
                name: "className",
                type: tContent("props.table.className.type"),
                defaultValue: tContent("props.table.className.default"),
                required: tContent("props.table.className.required"),
                description: toPlainText(tContent("props.table.className.description")),
              },
            ],
          },
        ]}
        extensibilityTitle={tContent("props.extensibilityTitle")}
        extensibilityCode={tContent("props.extensibilityCode")}
      />

      <DocsTokens
        title={tContent("tokens.title")}
        cols={{
          token: tContent("tokens.table.token"),
          value: tContent("tokens.table.class"),
          description: tContent("tokens.table.part"),
        }}
        items={[
          { token: "--background", value: tContent("tokens.table.background.class"), description: tContent("tokens.table.background.part") },
          { token: "--foreground", value: tContent("tokens.table.foreground.class"), description: tContent("tokens.table.foreground.part") },
          { token: "--muted-foreground", value: tContent("tokens.table.mutedForeground.class"), description: tContent("tokens.table.mutedForeground.part") },
          { token: "--border", value: tContent("tokens.table.border.class"), description: tContent("tokens.table.border.part") },
          { token: "--overlay", value: tContent("tokens.table.overlay.class"), description: tContent("tokens.table.overlay.part") },
          { token: "--ring", value: tContent("tokens.table.ring.class"), description: tContent("tokens.table.ring.part") },
          { token: "--sheet-width", value: tContent("tokens.table.width.class"), description: tContent("tokens.table.width.part") },
          { token: "--sheet-max-width", value: tContent("tokens.table.maxWidth.class"), description: tContent("tokens.table.maxWidth.part") },
        ]}
        customizationTitle={tContent("tokens.customizationTitle")}
        customizationCode={tContent("tokens.customizationCode")}
      />

      <DocsAccessibility
        screenReaderTitle={tNav("common.screenReader")}
        screenReaderItems={screenReaderItems}
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
          stripHtml(tContent("accessibility.items.item8")),
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
          { name: tContent("related.items.drawer.name"),      description: toPlainText(tContent("related.items.drawer.description")),      path: "?path=/docs/components-overlay-drawer--docs" },
          { name: tContent("related.items.dialog.name"),      description: toPlainText(tContent("related.items.dialog.description")),      path: "?path=/docs/components-overlay-dialog--docs" },
          { name: tContent("related.items.alertDialog.name"), description: toPlainText(tContent("related.items.alertDialog.description")), path: "?path=/docs/components-overlay-alertdialog--docs" },
          { name: tContent("related.items.popover.name"),     description: toPlainText(tContent("related.items.popover.description")),     path: "?path=/docs/components-overlay-popover--docs" },
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
          trigger: toPlainText(tContent("analytics.table.trigger")),
          payload: tContent("analytics.table.payload"),
        }}
        items={[
          {
            event: "dialog_open",
            trigger: toPlainText(tContent("analytics.table.dialog_open.trigger")),
            payload: tContent("analytics.table.dialog_open.payload"),
          },
          {
            event: "dialog_close",
            trigger: toPlainText(tContent("analytics.table.dialog_close.trigger")),
            payload: tContent("analytics.table.dialog_close.payload"),
          },
          {
            event: "dialog_confirm",
            trigger: toPlainText(tContent("analytics.table.dialog_confirm.trigger")),
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
