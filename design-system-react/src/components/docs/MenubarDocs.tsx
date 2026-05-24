import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { useActiveSection } from "@/lib/use-active-section";
import uiTranslations from "@/i18n/ui.json";
import menubarTranslations from "@shared/content/menubar/translations.json";

import { DocsHeader } from "@/components/docs/shared/sections/DocsHeader";
import { DocsPageLayout } from "@/components/docs/shared/sections/DocsPageLayout";
import { DocsDemonstration } from "@/components/docs/shared/sections/DocsDemonstration";
import { DocsAnatomy } from "@/components/docs/shared/sections/DocsAnatomy";
import { DocsWhenToUse } from "@/components/docs/shared/sections/DocsWhenToUse";
import { DocsDoDont } from "@/components/docs/shared/sections/DocsDoDont";
import { DocsImport } from "@/components/docs/shared/sections/DocsImport";
import { DocsVariants } from "@/components/docs/shared/sections/DocsVariants";
import { DocsCompositions } from "@/components/docs/shared/sections/DocsCompositions";
import { DocsStates } from "@/components/docs/shared/sections/DocsStates";
import { DocsProps } from "@/components/docs/shared/sections/DocsProps";
import { DocsTokens } from "@/components/docs/shared/sections/DocsTokens";
import { DocsAccessibility } from "@/components/docs/shared/sections/DocsAccessibility";
import { DocsRelated } from "@/components/docs/shared/sections/DocsRelated";
import { DocsNotes } from "@/components/docs/shared/sections/DocsNotes";
import { DocsAnalytics } from "@/components/docs/shared/sections/DocsAnalytics";
import { DocsTestes } from "@/components/docs/shared/sections/DocsTestes";

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
      { id: "anatomia", label: t("nav.anatomy") },
      { id: "quando-usar", label: t("nav.usage") },
      { id: "do-dont", label: t("nav.doDont") },
    ],
  },
  {
    label: t("nav.techRef"),
    sections: [
      { id: "importacao", label: t("nav.import") },
      { id: "variantes", label: t("nav.variants") },
      { id: "composicoes", label: t("nav.compositions") },
      { id: "estados", label: t("nav.states") },
      { id: "propriedades", label: t("nav.props") },
      { id: "tokens", label: t("nav.tokens") },
    ],
  },
  {
    label: t("nav.context"),
    sections: [
      { id: "acessibilidade", label: t("nav.accessibility") },
      { id: "relacionados", label: t("nav.related") },
      { id: "notas", label: t("nav.notes") },
    ],
  },
  {
    label: t("nav.quality"),
    sections: [
      { id: "analytics", label: t("nav.analytics") },
      { id: "testes", label: t("nav.testes") },
    ],
  },
];


// ─── Componente principal ────────────────────────────────────────────────────

export function MenubarDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(menubarTranslations);

  const navGroups = useMemo(() => getNavGroups(tNav), [tNav]);
  const allIds = useMemo(
    () => navGroups.flatMap((g) => g.sections.map((s) => s.id)),
    [navGroups]
  );

  useSeoEffect({
    title: tContent("seo.title"),
    description: tContent("seo.description"),
    locale,
    componentSlug: "menubar",
    aiSummary: tContent("seo.aiSummary"),
    aiEntities: tContent("seo.aiEntities"),
    aiIntent: tContent("seo.aiIntent") as "informational" | "navigational",
    breadcrumb: [
      { name: "Components", item: "/components" },
      { name: tContent("category"), item: "/components/navigation" },
      { name: tContent("title") },
    ],
  });

  useEffect(() => {
    track("docs_page_view", {
      component_name: "menubar",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "menubar",
        locale,
      });
    },
    [locale]
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  // ─── Demo state ─────────────────────────────────────────────────────────
  const [showSidebar, setShowSidebar] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [theme, setTheme] = useState("system");

  // ─── Code strings ───────────────────────────────────────────────────────
  const codeImport = `import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
  MenubarSeparator,
  MenubarShortcut,
  MenubarLabel,
} from "@/components/ui/menubar";`;

  const structureCode = tContent("anatomy.structureCode");

  const codeDefault = `<MenubarItem>Salvar</MenubarItem>`;

  const codeDestructive = `<MenubarItem variant="destructive">
  Excluir arquivo
</MenubarItem>`;

  const interfaceCode = `// Menubar (base-ui/menubar)
interface MenubarProps {
  modal?: boolean;          // default true
  disabled?: boolean;
  orientation?: "horizontal" | "vertical";
  loopFocus?: boolean;      // default true
}

interface MenubarMenuProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface MenubarContentProps {
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  alignOffset?: number;
}

interface MenubarItemProps {
  variant?: "default" | "destructive";
  inset?: boolean;
  disabled?: boolean;
  onSelect?: (event: Event) => void;
}`;

  // ─── Locale-aware column labels ─────────────────────────────────────────
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

  const wrapperStyle: React.CSSProperties = {
    contain: "layout",
    minHeight: 280,
    position: "relative",
  };

  return (
    <DocsPageLayout
      navGroups={navGroups}
      activeSection={activeId}
      componentSlug="menubar"
      header={
        <DocsHeader
          title={tContent("title")}
          description={tContent("description")}
          category={tContent("category")}
          type={tContent("type")}
          installNote="npx shadcn@latest add menubar"
        />
      }
    >
      {/* ── Demonstração ──────────────────────────────────────────── */}
      <DocsDemonstration title={tContent("demonstration.title")}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
          {/* Menu Arquivo (com submenu) */}
          <div className="space-y-2" style={wrapperStyle}>
            <p className="text-xs font-medium text-muted-foreground">
              {sanitizeHtml(tContent("demonstration.labels.fileMenu"))}
            </p>
            <Menubar>
              <MenubarMenu defaultOpen>
                <MenubarTrigger>Arquivo</MenubarTrigger>
                <MenubarContent>
                  <MenubarItem>
                    Novo <MenubarShortcut>⌘N</MenubarShortcut>
                  </MenubarItem>
                  <MenubarItem>
                    Abrir <MenubarShortcut>⌘O</MenubarShortcut>
                  </MenubarItem>
                  <MenubarSeparator />
                  <MenubarSub>
                    <MenubarSubTrigger>Exportar</MenubarSubTrigger>
                    <MenubarSubContent>
                      <MenubarItem>PDF</MenubarItem>
                      <MenubarItem>CSV</MenubarItem>
                    </MenubarSubContent>
                  </MenubarSub>
                </MenubarContent>
              </MenubarMenu>
            </Menubar>
          </div>

          {/* Menu Editar (com shortcuts) */}
          <div className="space-y-2" style={wrapperStyle}>
            <p className="text-xs font-medium text-muted-foreground">
              {sanitizeHtml(tContent("demonstration.labels.editMenu"))}
            </p>
            <Menubar>
              <MenubarMenu defaultOpen>
                <MenubarTrigger>Editar</MenubarTrigger>
                <MenubarContent>
                  <MenubarItem>
                    Desfazer <MenubarShortcut>⌘Z</MenubarShortcut>
                  </MenubarItem>
                  <MenubarItem>
                    Refazer <MenubarShortcut>⇧⌘Z</MenubarShortcut>
                  </MenubarItem>
                  <MenubarSeparator />
                  <MenubarItem>
                    Copiar <MenubarShortcut>⌘C</MenubarShortcut>
                  </MenubarItem>
                  <MenubarItem>
                    Colar <MenubarShortcut>⌘V</MenubarShortcut>
                  </MenubarItem>
                </MenubarContent>
              </MenubarMenu>
            </Menubar>
          </div>

          {/* Menu Exibir (com checkbox) */}
          <div className="space-y-2" style={wrapperStyle}>
            <p className="text-xs font-medium text-muted-foreground">
              {sanitizeHtml(tContent("demonstration.labels.viewMenu"))}
            </p>
            <Menubar>
              <MenubarMenu defaultOpen>
                <MenubarTrigger>Exibir</MenubarTrigger>
                <MenubarContent>
                  <MenubarCheckboxItem
                    checked={showSidebar}
                    onCheckedChange={setShowSidebar}
                  >
                    Sidebar
                  </MenubarCheckboxItem>
                  <MenubarCheckboxItem
                    checked={showGrid}
                    onCheckedChange={setShowGrid}
                  >
                    Grid
                  </MenubarCheckboxItem>
                </MenubarContent>
              </MenubarMenu>
            </Menubar>
          </div>

          {/* Menu Ferramentas (com radio) */}
          <div className="space-y-2" style={wrapperStyle}>
            <p className="text-xs font-medium text-muted-foreground">
              {sanitizeHtml(tContent("demonstration.labels.toolsMenu"))}
            </p>
            <Menubar>
              <MenubarMenu defaultOpen>
                <MenubarTrigger>Ferramentas</MenubarTrigger>
                <MenubarContent>
                  <MenubarRadioGroup value={theme} onValueChange={setTheme}>
                    <MenubarRadioItem value="light">Light</MenubarRadioItem>
                    <MenubarRadioItem value="dark">Dark</MenubarRadioItem>
                    <MenubarRadioItem value="system">System</MenubarRadioItem>
                  </MenubarRadioGroup>
                </MenubarContent>
              </MenubarMenu>
            </Menubar>
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
          tContent("anatomy.item8"),
          tContent("anatomy.item9"),
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
              element: tContent("usage.uxWriting.table.trigger.name"),
              rules: tContent("usage.uxWriting.table.trigger.format"),
              do: tContent("usage.uxWriting.table.trigger.good"),
              dont: tContent("usage.uxWriting.table.trigger.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.item.name"),
              rules: tContent("usage.uxWriting.table.item.format"),
              do: tContent("usage.uxWriting.table.item.good"),
              dont: tContent("usage.uxWriting.table.item.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.shortcut.name"),
              rules: tContent("usage.uxWriting.table.shortcut.format"),
              do: tContent("usage.uxWriting.table.shortcut.good"),
              dont: tContent("usage.uxWriting.table.shortcut.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.destructive.name"),
              rules: tContent("usage.uxWriting.table.destructive.format"),
              do: tContent("usage.uxWriting.table.destructive.good"),
              dont: tContent("usage.uxWriting.table.destructive.bad"),
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
                Arquivo · Editar · Exibir
              </div>
            ),
            dontPreview: (
              <div className="text-xs font-mono text-muted-foreground italic">
                Menu único
              </div>
            ),
            doCaption: sanitizeHtml(tContent("doDont.pair1.do")),
            dontCaption: sanitizeHtml(tContent("doDont.pair1.dont")),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <div className="text-xs font-mono text-muted-foreground">
                Salvar ⌘S
              </div>
            ),
            dontPreview: (
              <div className="text-xs font-mono text-muted-foreground italic">
                Sub &gt; Sub &gt; Sub
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
        componentSlug="menubar"
        items={[
          {
            name: tContent("variants.items.default"),
            description: stripHtml(tContent("variants.styles.default")),
            code: codeDefault,
            preview: (
              <div className="text-xs font-mono text-muted-foreground">
                variant=&quot;default&quot;
              </div>
            ),
          },
          {
            name: tContent("variants.items.destructive"),
            description: stripHtml(tContent("variants.styles.destructive")),
            code: codeDestructive,
            preview: (
              <div className="text-xs font-mono text-destructive">
                variant=&quot;destructive&quot;
              </div>
            ),
          },
        ]}
      />

      {/* ── Composições ───────────────────────────────────────────── */}
      <DocsCompositions
        title={tContent("variants.compositionsTitle")}
        useWhenLabel={tNav("common.useWhen")}
        componentSlug="menubar"
        items={[
          {
            name: tContent("variants.compositions.withShortcuts.name"),
            description: tContent("variants.compositions.withShortcuts.description"),
            useWhen: tContent("variants.compositions.withShortcuts.use"),
            code: `<Menubar>
  <MenubarMenu>
    <MenubarTrigger>Editar</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>Desfazer <MenubarShortcut>⌘Z</MenubarShortcut></MenubarItem>
      <MenubarItem>Refazer <MenubarShortcut>⇧⌘Z</MenubarShortcut></MenubarItem>
      <MenubarSeparator />
      <MenubarItem>Copiar <MenubarShortcut>⌘C</MenubarShortcut></MenubarItem>
      <MenubarItem>Colar <MenubarShortcut>⌘V</MenubarShortcut></MenubarItem>
    </MenubarContent>
  </MenubarMenu>
</Menubar>`,
            preview: (
              <div style={wrapperStyle}>
                <Menubar>
                  <MenubarMenu defaultOpen>
                    <MenubarTrigger>Editar</MenubarTrigger>
                    <MenubarContent>
                      <MenubarItem>
                        Desfazer <MenubarShortcut>⌘Z</MenubarShortcut>
                      </MenubarItem>
                      <MenubarItem>
                        Refazer <MenubarShortcut>⇧⌘Z</MenubarShortcut>
                      </MenubarItem>
                      <MenubarSeparator />
                      <MenubarItem>
                        Copiar <MenubarShortcut>⌘C</MenubarShortcut>
                      </MenubarItem>
                      <MenubarItem>
                        Colar <MenubarShortcut>⌘V</MenubarShortcut>
                      </MenubarItem>
                    </MenubarContent>
                  </MenubarMenu>
                </Menubar>
              </div>
            ),
          },
          {
            name: tContent("variants.compositions.withCheckbox.name"),
            description: tContent("variants.compositions.withCheckbox.description"),
            useWhen: tContent("variants.compositions.withCheckbox.use"),
            code: `<Menubar>
  <MenubarMenu>
    <MenubarTrigger>Exibir</MenubarTrigger>
    <MenubarContent>
      <MenubarCheckboxItem checked={showSidebar} onCheckedChange={setShowSidebar}>
        Sidebar
      </MenubarCheckboxItem>
      <MenubarCheckboxItem checked={showGrid} onCheckedChange={setShowGrid}>
        Grid
      </MenubarCheckboxItem>
    </MenubarContent>
  </MenubarMenu>
</Menubar>`,
            preview: (
              <div style={wrapperStyle}>
                <Menubar>
                  <MenubarMenu defaultOpen>
                    <MenubarTrigger>Exibir</MenubarTrigger>
                    <MenubarContent>
                      <MenubarCheckboxItem
                        checked={showSidebar}
                        onCheckedChange={setShowSidebar}
                      >
                        Sidebar
                      </MenubarCheckboxItem>
                      <MenubarCheckboxItem
                        checked={showGrid}
                        onCheckedChange={setShowGrid}
                      >
                        Grid
                      </MenubarCheckboxItem>
                    </MenubarContent>
                  </MenubarMenu>
                </Menubar>
              </div>
            ),
          },
          {
            name: tContent("variants.compositions.withRadio.name"),
            description: tContent("variants.compositions.withRadio.description"),
            useWhen: tContent("variants.compositions.withRadio.use"),
            code: `<Menubar>
  <MenubarMenu>
    <MenubarTrigger>Tema</MenubarTrigger>
    <MenubarContent>
      <MenubarRadioGroup value={theme} onValueChange={setTheme}>
        <MenubarRadioItem value="light">Claro</MenubarRadioItem>
        <MenubarRadioItem value="dark">Escuro</MenubarRadioItem>
        <MenubarRadioItem value="system">Sistema</MenubarRadioItem>
      </MenubarRadioGroup>
    </MenubarContent>
  </MenubarMenu>
</Menubar>`,
            preview: (
              <div style={wrapperStyle}>
                <Menubar>
                  <MenubarMenu defaultOpen>
                    <MenubarTrigger>Tema</MenubarTrigger>
                    <MenubarContent>
                      <MenubarRadioGroup value={theme} onValueChange={setTheme}>
                        <MenubarRadioItem value="light">Claro</MenubarRadioItem>
                        <MenubarRadioItem value="dark">Escuro</MenubarRadioItem>
                        <MenubarRadioItem value="system">Sistema</MenubarRadioItem>
                      </MenubarRadioGroup>
                    </MenubarContent>
                  </MenubarMenu>
                </Menubar>
              </div>
            ),
          },
          {
            name: tContent("variants.compositions.editorComplete.name"),
            description: tContent("variants.compositions.editorComplete.description"),
            useWhen: tContent("variants.compositions.editorComplete.use"),
            code: `<Menubar>
  <MenubarMenu>
    <MenubarTrigger>Arquivo</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>Novo <MenubarShortcut>⌘N</MenubarShortcut></MenubarItem>
      <MenubarItem>Abrir... <MenubarShortcut>⌘O</MenubarShortcut></MenubarItem>
      <MenubarItem>Salvar <MenubarShortcut>⌘S</MenubarShortcut></MenubarItem>
      <MenubarSeparator />
      <MenubarItem>Sair <MenubarShortcut>⌘Q</MenubarShortcut></MenubarItem>
    </MenubarContent>
  </MenubarMenu>
  <MenubarMenu>
    <MenubarTrigger>Editar</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>Desfazer <MenubarShortcut>⌘Z</MenubarShortcut></MenubarItem>
      <MenubarItem>Refazer <MenubarShortcut>⇧⌘Z</MenubarShortcut></MenubarItem>
    </MenubarContent>
  </MenubarMenu>
  <MenubarMenu>
    <MenubarTrigger>Exibir</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>Modo escuro</MenubarItem>
      <MenubarItem>Tela cheia <MenubarShortcut>F11</MenubarShortcut></MenubarItem>
    </MenubarContent>
  </MenubarMenu>
  <MenubarMenu>
    <MenubarTrigger>Ajuda</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>Documentação</MenubarItem>
      <MenubarItem>Sobre</MenubarItem>
    </MenubarContent>
  </MenubarMenu>
</Menubar>`,
            preview: (
              <div style={wrapperStyle}>
                <Menubar>
                  <MenubarMenu>
                    <MenubarTrigger>Arquivo</MenubarTrigger>
                    <MenubarContent>
                      <MenubarItem>
                        Novo <MenubarShortcut>⌘N</MenubarShortcut>
                      </MenubarItem>
                      <MenubarItem>
                        Abrir... <MenubarShortcut>⌘O</MenubarShortcut>
                      </MenubarItem>
                      <MenubarItem>
                        Salvar <MenubarShortcut>⌘S</MenubarShortcut>
                      </MenubarItem>
                      <MenubarSeparator />
                      <MenubarItem>
                        Sair <MenubarShortcut>⌘Q</MenubarShortcut>
                      </MenubarItem>
                    </MenubarContent>
                  </MenubarMenu>
                  <MenubarMenu>
                    <MenubarTrigger>Editar</MenubarTrigger>
                    <MenubarContent>
                      <MenubarItem>
                        Desfazer <MenubarShortcut>⌘Z</MenubarShortcut>
                      </MenubarItem>
                      <MenubarItem>
                        Refazer <MenubarShortcut>⇧⌘Z</MenubarShortcut>
                      </MenubarItem>
                    </MenubarContent>
                  </MenubarMenu>
                  <MenubarMenu>
                    <MenubarTrigger>Exibir</MenubarTrigger>
                    <MenubarContent>
                      <MenubarItem>Modo escuro</MenubarItem>
                      <MenubarItem>
                        Tela cheia <MenubarShortcut>F11</MenubarShortcut>
                      </MenubarItem>
                    </MenubarContent>
                  </MenubarMenu>
                  <MenubarMenu>
                    <MenubarTrigger>Ajuda</MenubarTrigger>
                    <MenubarContent>
                      <MenubarItem>Documentação</MenubarItem>
                      <MenubarItem>Sobre</MenubarItem>
                    </MenubarContent>
                  </MenubarMenu>
                </Menubar>
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
            trigger: "defaultOpen={false}",
            behavior: stripHtml(tContent("states.descriptions.closed")),
          },
          {
            label: tContent("states.items.open"),
            trigger: "<MenubarMenu defaultOpen>",
            behavior: stripHtml(tContent("states.descriptions.open")),
          },
          {
            label: tContent("states.items.disabled"),
            trigger: "<Item disabled>",
            behavior: stripHtml(tContent("states.descriptions.disabled")),
          },
          {
            label: tContent("states.items.checked"),
            trigger: "<CheckboxItem checked>",
            behavior: stripHtml(tContent("states.descriptions.checked")),
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
                name: "value",
                type: tContent("props.table.value.type"),
                defaultValue: tContent("props.table.value.default"),
                required: tContent("props.table.value.required"),
                description: sanitizeHtml(tContent("props.table.value.description")),
              },
              {
                name: "onValueChange",
                type: tContent("props.table.onValueChange.type"),
                defaultValue: tContent("props.table.onValueChange.default"),
                required: tContent("props.table.onValueChange.required"),
                description: sanitizeHtml(tContent("props.table.onValueChange.description")),
              },
              {
                name: "defaultValue",
                type: tContent("props.table.defaultValue.type"),
                defaultValue: tContent("props.table.defaultValue.default"),
                required: tContent("props.table.defaultValue.required"),
                description: sanitizeHtml(tContent("props.table.defaultValue.description")),
              },
              {
                name: "loop",
                type: tContent("props.table.loop.type"),
                defaultValue: tContent("props.table.loop.default"),
                required: tContent("props.table.loop.required"),
                description: sanitizeHtml(tContent("props.table.loop.description")),
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
            token: "--background",
            value: tContent("tokens.table.menubarBg.class"),
            description: tContent("tokens.table.menubarBg.part"),
          },
          {
            token: "--border",
            value: tContent("tokens.table.menubarBorder.class"),
            description: tContent("tokens.table.menubarBorder.part"),
          },
          {
            token: "--accent",
            value: tContent("tokens.table.triggerHover.class"),
            description: tContent("tokens.table.triggerHover.part"),
          },
          {
            token: "--popover",
            value: tContent("tokens.table.contentBg.class"),
            description: tContent("tokens.table.contentBg.part"),
          },
          {
            token: "--foreground/10",
            value: tContent("tokens.table.contentBorder.class"),
            description: tContent("tokens.table.contentBorder.part"),
          },
          {
            token: "--radius",
            value: tContent("tokens.table.rounded.class"),
            description: tContent("tokens.table.rounded.part"),
          },
          {
            token: "--accent",
            value: tContent("tokens.table.itemHover.class"),
            description: tContent("tokens.table.itemHover.part"),
          },
          {
            token: "--destructive",
            value: tContent("tokens.table.destructive.class"),
            description: tContent("tokens.table.destructive.part"),
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
          { key: "← / →", description: stripHtml(tContent("accessibility.keyboard.arrowsHorizontal")) },
          { key: "↑ / ↓", description: stripHtml(tContent("accessibility.keyboard.arrowsVertical")) },
          { key: "Enter / Space", description: stripHtml(tContent("accessibility.keyboard.enter")) },
          { key: "Esc", description: stripHtml(tContent("accessibility.keyboard.escape")) },
          { key: "Home / End", description: stripHtml(tContent("accessibility.keyboard.homeEnd")) },
          { key: "A–Z", description: stripHtml(tContent("accessibility.keyboard.typeahead")) },
        ]}
      />

      {/* ── Relacionados ──────────────────────────────────────────── */}
      <DocsRelated
        title={tContent("related.title")}
        componentSlug="menubar"
        items={[
          {
            name: tContent("related.items.navigationMenu.name"),
            description: tContent("related.items.navigationMenu.description"),
            path: "?path=/docs/ui-navigationmenu--docs",
          },
          {
            name: tContent("related.items.dropdownMenu.name"),
            description: tContent("related.items.dropdownMenu.description"),
            path: "?path=/docs/ui-dropdownmenu--docs",
          },
          {
            name: tContent("related.items.sidebar.name"),
            description: tContent("related.items.sidebar.description"),
            path: "?path=/docs/ui-sidebar--docs",
          },
          {
            name: tContent("related.items.command.name"),
            description: tContent("related.items.command.description"),
            path: "?path=/docs/ui-command--docs",
          },
        ]}
      />

      {/* ── Notas ─────────────────────────────────────────────────── */}
      <DocsNotes
        title={tContent("notes.title")}
        componentSlug="menubar"
        items={[
          { title: "", content: tContent("notes.item1") },
          { title: "", content: tContent("notes.item2") },
          { title: "", content: tContent("notes.item3") },
          { title: "", content: tContent("notes.item4") },
          { title: "", content: tContent("notes.item5") },
          { title: "", content: tContent("notes.item6") },
        ]}
      />

      {/* ── Analytics ─────────────────────────────────────────────── */}
      <DocsAnalytics
        title={tContent("analytics.title")}
        cols={analyticsCols}
        items={[
          {
            event: "menubar_menu_open / menubar_item_select / menubar_shortcut_invoke",
            trigger: sanitizeHtml(tContent("analytics.description")),
            payload: "component, menu, label",
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
              priority: tNav(priorityKeyMap[tContent("testes.functional.item6.priority")] ?? "common.high"),
            },
            {
              action: tContent("testes.functional.item7.action"),
              result: tContent("testes.functional.item7.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item7.priority")] ?? "common.high"),
            },
            {
              action: tContent("testes.functional.item8.action"),
              result: tContent("testes.functional.item8.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item8.priority")] ?? "common.medium"),
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
            { criterion: tContent("testes.accessibility.item2"), level: "1.3.1", how: "DevTools a11y tree" },
            { criterion: tContent("testes.accessibility.item3"), level: "4.1.2", how: "DevTools attribute" },
            { criterion: tContent("testes.accessibility.item4"), level: "4.1.2", how: "DevTools a11y tree" },
            { criterion: tContent("testes.accessibility.item5"), level: "4.1.2", how: "DevTools a11y tree" },
            { criterion: tContent("testes.accessibility.item6"), level: "2.4.3", how: "Keyboard test" },
            { criterion: tContent("testes.accessibility.item7"), level: "1.4.3", how: "Contrast checker" },
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
            { story: tContent("testes.visual.item4.story"), priority: tNav(priorityKeyMap[tContent("testes.visual.item4.priority")] ?? "common.high") },
            { story: tContent("testes.visual.item5.story"), priority: tNav(priorityKeyMap[tContent("testes.visual.item5.priority")] ?? "common.medium") },
          ],
        }}
      />
    </DocsPageLayout>
  );
}

export default MenubarDocs;
