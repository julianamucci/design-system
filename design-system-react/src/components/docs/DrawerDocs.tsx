import { useCallback, useEffect, useMemo } from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { useActiveSection } from "@/lib/use-active-section";
import uiTranslations from "@/i18n/ui.json";
import drawerTranslations from "@shared/content/drawer/translations.json";

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

export function DrawerDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(drawerTranslations);

  const navGroups = useMemo(() => getNavGroups(tNav), [tNav]);
  const allIds = useMemo(
    () => navGroups.flatMap((g) => g.sections.map((s) => s.id)),
    [navGroups]
  );

  useSeoEffect({
    title: tContent("seo.title"),
    description: tContent("seo.description"),
    locale,
    componentSlug: "drawer",
    aiSummary: tContent("seo.aiSummary"),
    aiEntities: tContent("seo.aiEntities"),
    aiIntent: tContent("seo.aiIntent") as "informational" | "navigational",
    breadcrumb: [
      { name: "Components", item: "/components" },
      { name: tContent("category"), item: "/components/disclosure" },
      { name: tContent("title") },
    ],
  });

  useEffect(() => {
    track("docs_page_view", {
      component_name: "drawer",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "drawer",
        locale,
      });
    },
    [locale]
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  // ─── Code strings ───────────────────────────────────────────────────────────

  const codeImport = `import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";`;

  const structureCode = tContent("anatomy.structureCode");

  const codeBottom = `<Drawer direction="bottom">
  <DrawerTrigger asChild>
    <Button variant="outline">Abrir</Button>
  </DrawerTrigger>
  <DrawerContent>{/* ... */}</DrawerContent>
</Drawer>`;

  const codeTop = `<Drawer direction="top">
  <DrawerTrigger asChild>
    <Button variant="outline">Notificar</Button>
  </DrawerTrigger>
  <DrawerContent>{/* ... */}</DrawerContent>
</Drawer>`;

  const codeLeft = `<Drawer direction="left">
  <DrawerTrigger asChild>
    <Button variant="outline">Menu</Button>
  </DrawerTrigger>
  <DrawerContent>{/* ... */}</DrawerContent>
</Drawer>`;

  const codeRight = `<Drawer direction="right">
  <DrawerTrigger asChild>
    <Button variant="outline">Editar</Button>
  </DrawerTrigger>
  <DrawerContent>{/* ... */}</DrawerContent>
</Drawer>`;

  const interfaceCode = `// Drawer (vaul)
interface DrawerProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  direction?: "bottom" | "top" | "left" | "right";
  modal?: boolean;
  dismissible?: boolean;
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

  // ─── Demonstração inline (4 directions compactos) ──────────────────────────
  const directions: Array<"bottom" | "top" | "left" | "right"> = [
    "bottom",
    "right",
    "left",
    "top",
  ];

  return (
    <DocsPageLayout
      navGroups={navGroups}
      activeSection={activeId}
      componentSlug="drawer"
      header={
        <DocsHeader
          title={tContent("title")}
          description={tContent("description")}
          category={tContent("category")}
          type={tContent("type")}
          installNote="npx shadcn@latest add drawer"
        />
      }
    >
      {/* ── Demonstração ──────────────────────────────────────────── */}
      <DocsDemonstration title={tContent("demonstration.title")}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
          {directions.map((dir) => (
            <div
              key={dir}
              className="space-y-2"
              style={{ contain: "layout", minHeight: 80, position: "relative" }}
            >
              <p className="text-xs font-medium text-muted-foreground">
                {sanitizeHtml(tContent(`demonstration.labels.${dir}`))}
              </p>
              <Drawer direction={dir}>
                <DrawerTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full capitalize">
                    {dir}
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle className="capitalize">{dir}</DrawerTitle>
                    <DrawerDescription>
                      {sanitizeHtml(tContent(`demonstration.labels.${dir}`))}
                    </DrawerDescription>
                  </DrawerHeader>
                  <div className="px-4 pb-2 text-sm text-muted-foreground">
                    {sanitizeHtml(tContent(`variants.styles.${dir}`))}
                  </div>
                  <DrawerFooter>
                    <DrawerClose asChild>
                      <Button variant="outline">
                        {locale === "en" ? "Close" : locale === "es" ? "Cerrar" : "Fechar"}
                      </Button>
                    </DrawerClose>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>
            </div>
          ))}
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
          tContent("anatomy.item8"),
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
              element: tContent("usage.uxWriting.table.trigger.name"),
              rules: tContent("usage.uxWriting.table.trigger.format"),
              do: tContent("usage.uxWriting.table.trigger.good"),
              dont: tContent("usage.uxWriting.table.trigger.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.close.name"),
              rules: tContent("usage.uxWriting.table.close.format"),
              do: tContent("usage.uxWriting.table.close.good"),
              dont: tContent("usage.uxWriting.table.close.bad"),
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
              <div className="text-sm space-y-1">
                <div className="font-medium">DrawerTitle: Editar perfil</div>
                <div className="text-muted-foreground">aria-labelledby OK</div>
              </div>
            ),
            dontPreview: (
              <div className="text-sm space-y-1 text-muted-foreground">
                <div className="italic">(sem DrawerTitle)</div>
                <div>screen reader silencioso</div>
              </div>
            ),
            doCaption: sanitizeHtml(tContent("doDont.pair1.do")),
            dontCaption: sanitizeHtml(tContent("doDont.pair1.dont")),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <div className="text-sm">
                <div className="font-medium">Drawer (bottom)</div>
                <div className="text-muted-foreground">swipe-to-close</div>
              </div>
            ),
            dontPreview: (
              <div className="text-sm">
                <div className="font-medium">Drawer dentro de Drawer</div>
                <div className="text-destructive">focus trap quebra</div>
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
        componentSlug="drawer"
        items={[
          {
            name: tContent("variants.items.bottom"),
            description: stripHtml(tContent("variants.styles.bottom")),
            code: codeBottom,
            preview: (
              <div className="text-xs font-mono text-muted-foreground">
                direction=&quot;bottom&quot;
              </div>
            ),
          },
          {
            name: tContent("variants.items.top"),
            description: stripHtml(tContent("variants.styles.top")),
            code: codeTop,
            preview: (
              <div className="text-xs font-mono text-muted-foreground">
                direction=&quot;top&quot;
              </div>
            ),
          },
          {
            name: tContent("variants.items.left"),
            description: stripHtml(tContent("variants.styles.left")),
            code: codeLeft,
            preview: (
              <div className="text-xs font-mono text-muted-foreground">
                direction=&quot;left&quot;
              </div>
            ),
          },
          {
            name: tContent("variants.items.right"),
            description: stripHtml(tContent("variants.styles.right")),
            code: codeRight,
            preview: (
              <div className="text-xs font-mono text-muted-foreground">
                direction=&quot;right&quot;
              </div>
            ),
          },
        ]}
      />

      {/* ── Composições ───────────────────────────────────────────── */}
      <DocsCompositions
        title={tContent("variants.compositionsTitle")}
        useWhenLabel={tNav("common.useWhen")}
        componentSlug="drawer"
        items={[
          {
            name: tContent("variants.compositions.withForm.name"),
            description: tContent("variants.compositions.withForm.description"),
            useWhen: tContent("variants.compositions.withForm.use"),
            code: `<Drawer>
  <DrawerTrigger asChild>
    <Button variant="outline">Editar perfil</Button>
  </DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>Editar perfil</DrawerTitle>
      <DrawerDescription>Atualize seus dados pessoais.</DrawerDescription>
    </DrawerHeader>
    <form className="grid gap-3 px-4">
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Nome</span>
        <input className="border rounded-md px-3 py-2" defaultValue="Maria Souza" />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="font-medium">E-mail</span>
        <input type="email" className="border rounded-md px-3 py-2" defaultValue="maria@exemplo.com" />
      </label>
    </form>
    <DrawerFooter>
      <Button>Salvar alterações</Button>
      <DrawerClose asChild>
        <Button variant="outline">Cancelar</Button>
      </DrawerClose>
    </DrawerFooter>
  </DrawerContent>
</Drawer>`,
            preview: (
              <Drawer>
                <DrawerTrigger asChild>
                  <Button variant="outline">Editar perfil</Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>Editar perfil</DrawerTitle>
                    <DrawerDescription>Atualize seus dados pessoais.</DrawerDescription>
                  </DrawerHeader>
                  <form className="grid gap-3 px-4">
                    <label className="grid gap-1 text-sm">
                      <span className="font-medium">Nome</span>
                      <input className="border rounded-md px-3 py-2" defaultValue="Maria Souza" />
                    </label>
                    <label className="grid gap-1 text-sm">
                      <span className="font-medium">E-mail</span>
                      <input type="email" className="border rounded-md px-3 py-2" defaultValue="maria@exemplo.com" />
                    </label>
                  </form>
                  <DrawerFooter>
                    <Button>Salvar alterações</Button>
                    <DrawerClose asChild>
                      <Button variant="outline">Cancelar</Button>
                    </DrawerClose>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>
            ),
          },
          {
            name: tContent("variants.compositions.withConfirmation.name"),
            description: tContent("variants.compositions.withConfirmation.description"),
            useWhen: tContent("variants.compositions.withConfirmation.use"),
            code: `<Drawer>
  <DrawerTrigger asChild>
    <Button variant="outline">Remover item</Button>
  </DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>Remover item da lista?</DrawerTitle>
      <DrawerDescription>
        Você poderá adicioná-lo novamente a qualquer momento.
      </DrawerDescription>
    </DrawerHeader>
    <DrawerFooter>
      <Button variant="destructive">Remover</Button>
      <DrawerClose asChild>
        <Button variant="outline">Cancelar</Button>
      </DrawerClose>
    </DrawerFooter>
  </DrawerContent>
</Drawer>`,
            preview: (
              <Drawer>
                <DrawerTrigger asChild>
                  <Button variant="outline">Remover item</Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>Remover item da lista?</DrawerTitle>
                    <DrawerDescription>
                      Você poderá adicioná-lo novamente a qualquer momento.
                    </DrawerDescription>
                  </DrawerHeader>
                  <DrawerFooter>
                    <Button variant="destructive">Remover</Button>
                    <DrawerClose asChild>
                      <Button variant="outline">Cancelar</Button>
                    </DrawerClose>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>
            ),
          },
          {
            name: tContent("variants.compositions.withScroll.name"),
            description: tContent("variants.compositions.withScroll.description"),
            useWhen: tContent("variants.compositions.withScroll.use"),
            code: `<Drawer>
  <DrawerTrigger asChild>
    <Button variant="outline">Ler termos</Button>
  </DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>Termos de uso</DrawerTitle>
      <DrawerDescription>Leia atentamente antes de aceitar.</DrawerDescription>
    </DrawerHeader>
    <div className="text-sm text-muted-foreground max-h-64 overflow-y-auto px-4 space-y-3">
      {Array.from({ length: 12 }).map((_, i) => (
        <p key={i}>
          Parágrafo {i + 1}: termos longos para garantir scroll interno.
        </p>
      ))}
    </div>
    <DrawerFooter>
      <Button>Aceitar termos</Button>
      <DrawerClose asChild>
        <Button variant="outline">Cancelar</Button>
      </DrawerClose>
    </DrawerFooter>
  </DrawerContent>
</Drawer>`,
            preview: (
              <Drawer>
                <DrawerTrigger asChild>
                  <Button variant="outline">Ler termos</Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>Termos de uso</DrawerTitle>
                    <DrawerDescription>Leia atentamente antes de aceitar.</DrawerDescription>
                  </DrawerHeader>
                  <div className="text-sm text-muted-foreground max-h-64 overflow-y-auto px-4 space-y-3">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <p key={i}>
                        Parágrafo {i + 1}: termos longos para garantir scroll interno.
                      </p>
                    ))}
                  </div>
                  <DrawerFooter>
                    <Button>Aceitar termos</Button>
                    <DrawerClose asChild>
                      <Button variant="outline">Cancelar</Button>
                    </DrawerClose>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>
            ),
          },
          {
            name: tContent("variants.compositions.rightPanel.name"),
            description: tContent("variants.compositions.rightPanel.description"),
            useWhen: tContent("variants.compositions.rightPanel.use"),
            code: `<Drawer direction="right">
  <DrawerTrigger asChild>
    <Button variant="outline">Abrir filtros</Button>
  </DrawerTrigger>
  <DrawerContent className="max-w-md">
    <DrawerHeader>
      <DrawerTitle>Filtros</DrawerTitle>
      <DrawerDescription>Refine os resultados.</DrawerDescription>
    </DrawerHeader>
    <div className="px-4 text-sm text-muted-foreground">
      Conteúdo dos filtros…
    </div>
    <DrawerFooter>
      <Button>Aplicar</Button>
      <DrawerClose asChild>
        <Button variant="outline">Cancelar</Button>
      </DrawerClose>
    </DrawerFooter>
  </DrawerContent>
</Drawer>`,
            preview: (
              <Drawer direction="right">
                <DrawerTrigger asChild>
                  <Button variant="outline">Abrir filtros</Button>
                </DrawerTrigger>
                <DrawerContent className="max-w-md">
                  <DrawerHeader>
                    <DrawerTitle>Filtros</DrawerTitle>
                    <DrawerDescription>Refine os resultados.</DrawerDescription>
                  </DrawerHeader>
                  <div className="px-4 text-sm text-muted-foreground">
                    Conteúdo dos filtros…
                  </div>
                  <DrawerFooter>
                    <Button>Aplicar</Button>
                    <DrawerClose asChild>
                      <Button variant="outline">Cancelar</Button>
                    </DrawerClose>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>
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
            trigger: "defaultOpen={false}",
            behavior: stripHtml(tContent("states.descriptions.closed")),
          },
          {
            label: tContent("states.items.open"),
            trigger: "defaultOpen={true}",
            behavior: stripHtml(tContent("states.descriptions.open")),
          },
          {
            label: tContent("states.items.controlled"),
            trigger: "open + onOpenChange",
            behavior: stripHtml(tContent("states.descriptions.controlled")),
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
                name: "open",
                type: tContent("props.table.open.type"),
                defaultValue: tContent("props.table.open.default"),
                required: tContent("props.table.open.required"),
                description: sanitizeHtml(tContent("props.table.open.description")),
              },
              {
                name: "onOpenChange",
                type: tContent("props.table.onOpenChange.type"),
                defaultValue: tContent("props.table.onOpenChange.default"),
                required: tContent("props.table.onOpenChange.required"),
                description: sanitizeHtml(tContent("props.table.onOpenChange.description")),
              },
              {
                name: "defaultOpen",
                type: tContent("props.table.defaultOpen.type"),
                defaultValue: tContent("props.table.defaultOpen.default"),
                required: tContent("props.table.defaultOpen.required"),
                description: sanitizeHtml(tContent("props.table.defaultOpen.description")),
              },
              {
                name: "direction",
                type: tContent("props.table.direction.type"),
                defaultValue: tContent("props.table.direction.default"),
                required: tContent("props.table.direction.required"),
                description: sanitizeHtml(tContent("props.table.direction.description")),
              },
              {
                name: "modal",
                type: tContent("props.table.modal.type"),
                defaultValue: tContent("props.table.modal.default"),
                required: tContent("props.table.modal.required"),
                description: sanitizeHtml(tContent("props.table.modal.description")),
              },
              {
                name: "dismissible",
                type: tContent("props.table.dismissible.type"),
                defaultValue: tContent("props.table.dismissible.default"),
                required: tContent("props.table.dismissible.required"),
                description: sanitizeHtml(tContent("props.table.dismissible.description")),
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
            token: "--popover",
            value: tContent("tokens.table.background.class"),
            description: tContent("tokens.table.background.part"),
          },
          {
            token: "--popover-foreground",
            value: tContent("tokens.table.foreground.class"),
            description: tContent("tokens.table.foreground.part"),
          },
          {
            token: "--border",
            value: tContent("tokens.table.border.class"),
            description: tContent("tokens.table.border.part"),
          },
          {
            token: "overlay",
            value: tContent("tokens.table.overlay.class"),
            description: tContent("tokens.table.overlay.part"),
          },
          {
            token: "--muted",
            value: tContent("tokens.table.handle.class"),
            description: tContent("tokens.table.handle.part"),
          },
          {
            token: "--radius",
            value: tContent("tokens.table.rounded.class"),
            description: tContent("tokens.table.rounded.part"),
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
          { key: "Tab / Shift+Tab", description: stripHtml(tContent("accessibility.keyboard.tab")) },
          { key: "Esc", description: stripHtml(tContent("accessibility.keyboard.escape")) },
          { key: "Enter / Space", description: stripHtml(tContent("accessibility.keyboard.enter")) },
          { key: "Swipe", description: stripHtml(tContent("accessibility.keyboard.swipe")) },
        ]}
      />

      {/* ── Relacionados ──────────────────────────────────────────── */}
      <DocsRelated
        title={tContent("related.title")}
        componentSlug="drawer"
        items={[
          {
            name: tContent("related.items.sheet.name"),
            description: tContent("related.items.sheet.description"),
            path: "?path=/docs/ui-sheet--docs",
          },
          {
            name: tContent("related.items.dialog.name"),
            description: tContent("related.items.dialog.description"),
            path: "?path=/docs/ui-dialog--docs",
          },
          {
            name: tContent("related.items.alertDialog.name"),
            description: tContent("related.items.alertDialog.description"),
            path: "?path=/docs/ui-alertdialog--docs",
          },
          {
            name: tContent("related.items.sidebar.name"),
            description: tContent("related.items.sidebar.description"),
            path: "?path=/docs/ui-sidebar--docs",
          },
        ]}
      />

      {/* ── Notas ─────────────────────────────────────────────────── */}
      <DocsNotes
        title={tContent("notes.title")}
        componentSlug="drawer"
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
        cols={analyticsCols}
        items={[
          {
            event: "drawer_open / drawer_close",
            trigger: sanitizeHtml(tContent("analytics.description")),
            payload: "component, label, location",
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
            { criterion: tContent("testes.accessibility.item2"), level: "4.1.2", how: "DevTools a11y tree" },
            { criterion: tContent("testes.accessibility.item3"), level: "1.3.1", how: "DevTools a11y tree" },
            { criterion: tContent("testes.accessibility.item4"), level: "2.1.1", how: "Keyboard test" },
            { criterion: tContent("testes.accessibility.item5"), level: "2.4.3", how: "Keyboard test" },
            { criterion: tContent("testes.accessibility.item6"), level: "1.4.3", how: "Contrast checker" },
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
            { story: tContent("testes.visual.item5.story"), priority: tNav(priorityKeyMap[tContent("testes.visual.item5.priority")] ?? "common.high") },
          ],
        }}
      />
    </DocsPageLayout>
  );
}

export default DrawerDocs;
