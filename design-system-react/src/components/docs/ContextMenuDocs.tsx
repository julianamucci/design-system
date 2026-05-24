import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuLabel,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
} from "@/components/ui/context-menu";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import { useActiveSection } from "@/lib/use-active-section";
import uiTranslations from "@/i18n/ui.json";
import contextMenuTranslations from "@shared/content/context-menu/translations.json";

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


// ─── Demo Components ──────────────────────────────────────────────────────────

function DemonstracaoPreview({ tContent }: { tContent: (key: string) => string }) {
  return (
    <ContextMenu>
      <ContextMenuTrigger className="flex items-center justify-center rounded-lg border border-dashed border-border px-10 py-6 text-sm text-muted-foreground select-none w-full">
        {tContent("demonstration.labels.triggerLabel")}
      </ContextMenuTrigger>
      <ContextMenuContent className="min-w-48">
        <ContextMenuGroup>
          <ContextMenuItem>
            {tContent("demonstration.labels.edit")}
            <ContextMenuShortcut>{tContent("demonstration.labels.editShortcut")}</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem>{tContent("demonstration.labels.duplicate")}</ContextMenuItem>
          <ContextMenuSub>
            <ContextMenuSubTrigger>{tContent("demonstration.labels.share")}</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem>{tContent("demonstration.labels.shareEmail")}</ContextMenuItem>
              <ContextMenuItem>{tContent("demonstration.labels.shareLink")}</ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive">
          {tContent("demonstration.labels.delete")}
          <ContextMenuShortcut>{tContent("demonstration.labels.deleteShortcut")}</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function CheckboxDemo({ tContent }: { tContent: (key: string) => string }) {
  const [showGrid, setShowGrid] = useState(true);
  const [showRulers, setShowRulers] = useState(false);

  return (
    <ContextMenu>
      <ContextMenuTrigger className="flex items-center justify-center rounded-lg border border-dashed border-border px-10 py-4 text-sm text-muted-foreground select-none w-full">
        {tContent("demonstration.labels.triggerLabel")}
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuGroup>
          <ContextMenuLabel inset>Visualização</ContextMenuLabel>
          <ContextMenuCheckboxItem checked={showGrid} onCheckedChange={setShowGrid}>
            Mostrar grade
          </ContextMenuCheckboxItem>
          <ContextMenuCheckboxItem checked={showRulers} onCheckedChange={setShowRulers}>
            Mostrar réguas
          </ContextMenuCheckboxItem>
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function RadioDemo({ tContent }: { tContent: (key: string) => string }) {
  const [zoom, setZoom] = useState("100");

  return (
    <ContextMenu>
      <ContextMenuTrigger className="flex items-center justify-center rounded-lg border border-dashed border-border px-10 py-4 text-sm text-muted-foreground select-none w-full">
        {tContent("demonstration.labels.triggerLabel")}
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuGroup>
          <ContextMenuLabel inset>Zoom</ContextMenuLabel>
          <ContextMenuRadioGroup value={zoom} onValueChange={setZoom}>
            <ContextMenuRadioItem value="75">75%</ContextMenuRadioItem>
            <ContextMenuRadioItem value="100">100%</ContextMenuRadioItem>
            <ContextMenuRadioItem value="150">150%</ContextMenuRadioItem>
          </ContextMenuRadioGroup>
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function ContextMenuDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(contextMenuTranslations);

  const navGroups = useMemo(() => getNavGroups(tNav), [tNav]);
  const allIds = useMemo(
    () => navGroups.flatMap((g) => g.sections.map((s) => s.id)),
    [navGroups]
  );

  useSeoEffect({
    title: tContent("seo.title"),
    description: tContent("seo.description"),
    locale,
    componentSlug: "context-menu",
  });

  useEffect(() => {
    track("docs_page_view", {
      component_name: "context_menu",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "context_menu",
        locale,
      });
    },
    [locale]
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  // ─── Code strings ─────────────────────────────────────────────────────────

  const codeImportBasic = `import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuLabel,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from "@/components/ui/context-menu";`;

  const codeImportWithSub = `import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";`;

  const codeVariantDefault = `<ContextMenu>
  <ContextMenuTrigger>Área de clique direito</ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem>Editar</ContextMenuItem>
    <ContextMenuItem>Duplicar</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>`;

  const codeVariantDestructive = `<ContextMenu>
  <ContextMenuTrigger>Área de clique direito</ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem>Editar</ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem variant="destructive">Excluir</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>`;

  const codeVariantCheckbox = `const [showGrid, setShowGrid] = useState(true);

<ContextMenu>
  <ContextMenuTrigger>Área de clique direito</ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuCheckboxItem
      checked={showGrid}
      onCheckedChange={setShowGrid}
    >
      Mostrar grade
    </ContextMenuCheckboxItem>
  </ContextMenuContent>
</ContextMenu>`;

  const codeVariantRadio = `const [zoom, setZoom] = useState("100");

<ContextMenu>
  <ContextMenuTrigger>Área de clique direito</ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuRadioGroup value={zoom} onValueChange={setZoom}>
      <ContextMenuRadioItem value="75">75%</ContextMenuRadioItem>
      <ContextMenuRadioItem value="100">100%</ContextMenuRadioItem>
      <ContextMenuRadioItem value="150">150%</ContextMenuRadioItem>
    </ContextMenuRadioGroup>
  </ContextMenuContent>
</ContextMenu>`;

  const codeVariantSubTrigger = `<ContextMenu>
  <ContextMenuTrigger>Área de clique direito</ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuSub>
      <ContextMenuSubTrigger>Compartilhar</ContextMenuSubTrigger>
      <ContextMenuSubContent>
        <ContextMenuItem>Por e-mail</ContextMenuItem>
        <ContextMenuItem>Por link</ContextMenuItem>
      </ContextMenuSubContent>
    </ContextMenuSub>
  </ContextMenuContent>
</ContextMenu>`;

  const codeVariantLabel = `<ContextMenu>
  <ContextMenuTrigger>Área de clique direito</ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuGroup>
      <ContextMenuLabel>Grupo de ações</ContextMenuLabel>
      <ContextMenuItem inset>Editar</ContextMenuItem>
      <ContextMenuItem inset>Duplicar</ContextMenuItem>
    </ContextMenuGroup>
  </ContextMenuContent>
</ContextMenu>`;

  const codeCustomizationTokens = `/* Em globals.css — personalizar tokens do menu */
:root {
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 47.4% 11.2%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
}

.dark {
  --popover: 224 71% 4%;
  --popover-foreground: 215 20.2% 65.1%;
}`;

  const interfaceCode = `// ContextMenuItem
interface ContextMenuItemProps extends ContextMenuPrimitive.Item.Props {
  inset?: boolean;
  variant?: "default" | "destructive";
}

// ContextMenuContent
interface ContextMenuContentProps extends ContextMenuPrimitive.Popup.Props {
  align?: "start" | "center" | "end";
  alignOffset?: number;
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
}

// ContextMenuCheckboxItem
interface ContextMenuCheckboxItemProps
  extends ContextMenuPrimitive.CheckboxItem.Props {
  inset?: boolean;
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
      {/* ── Demonstração ───────────────────────────────────────────── */}
      <DocsDemonstration title={tContent("demonstration.title")}>
        <div className="w-full">
          <DemonstracaoPreview tContent={tContent} />
        </div>
      </DocsDemonstration>

      {/* ── Anatomia ───────────────────────────────────────────────── */}
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
          tContent("anatomy.item10"),
          tContent("anatomy.item11"),
        ]}
        structureLabel={tContent("anatomy.structureLabel")}
        structureCode={tContent("anatomy.structureCode")}
      />

      {/* ── Quando Usar ────────────────────────────────────────────── */}
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

      {/* ── Do & Don't ─────────────────────────────────────────────── */}
      <DocsDoDont
        title={tContent("doDont.title")}
        pairs={[
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <ContextMenu>
                <ContextMenuTrigger className="flex items-center justify-center rounded-lg border border-dashed border-border px-6 py-4 text-xs text-muted-foreground select-none w-full">
                  Área com menu + botão alternativo
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem>Editar</ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem variant="destructive">Excluir</ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ),
            dontPreview: (
              <ContextMenu>
                <ContextMenuTrigger className="flex items-center justify-center rounded-lg border border-dashed border-border px-6 py-4 text-xs text-muted-foreground select-none w-full">
                  Área sem alternativa visível
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem>Editar</ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem variant="destructive">Excluir</ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ),
            doCaption: tContent("doDont.pair1.do"),
            dontCaption: tContent("doDont.pair1.dont"),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <ContextMenu>
                <ContextMenuTrigger className="flex items-center justify-center rounded-lg border border-dashed border-border px-6 py-4 text-xs text-muted-foreground select-none w-full">
                  Item destrutivo separado
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem>Editar</ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem variant="destructive">Excluir</ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ),
            dontPreview: (
              <ContextMenu>
                <ContextMenuTrigger className="flex items-center justify-center rounded-lg border border-dashed border-border px-6 py-4 text-xs text-muted-foreground select-none w-full">
                  Submenus aninhados
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuSub>
                    <ContextMenuSubTrigger>Opções</ContextMenuSubTrigger>
                    <ContextMenuSubContent>
                      <ContextMenuSub>
                        <ContextMenuSubTrigger>Mais opções</ContextMenuSubTrigger>
                        <ContextMenuSubContent>
                          <ContextMenuItem>Ação profunda</ContextMenuItem>
                        </ContextMenuSubContent>
                      </ContextMenuSub>
                    </ContextMenuSubContent>
                  </ContextMenuSub>
                </ContextMenuContent>
              </ContextMenu>
            ),
            doCaption: tContent("doDont.pair2.do"),
            dontCaption: tContent("doDont.pair2.dont"),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <ContextMenu>
                <ContextMenuTrigger className="flex items-center justify-center rounded-lg border border-dashed border-border px-6 py-4 text-xs text-muted-foreground select-none w-full">
                  Shortcut visual + listener separado
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem>
                    Editar
                    <ContextMenuShortcut>⌘E</ContextMenuShortcut>
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ),
            dontPreview: (
              <div className="flex items-center justify-center rounded-lg border border-dashed border-destructive/40 px-6 py-4 text-xs text-muted-foreground select-none w-full bg-destructive/5">
                <span className="text-center">Área sem dica visual de right-click</span>
              </div>
            ),
            doCaption: tContent("doDont.pair3.do"),
            dontCaption: tContent("doDont.pair3.dont"),
          },
        ]}
      />

      {/* ── Importação ─────────────────────────────────────────────── */}
      <DocsImport
        title={tContent("import.title")}
        description={tContent("import.basic")}
        code={codeImportBasic}
        secondaryDescription={tContent("import.withSub")}
        secondaryCode={codeImportWithSub}
        componentSlug="context-menu"
      />

      {/* ── Variantes ──────────────────────────────────────────────── */}
      <DocsVariants
        title={tContent("variants.title")}
        componentSlug="context-menu"
        items={[
          {
            name: "default",
            description: stripHtml(tContent("variants.items.default")),
            code: codeVariantDefault,
            preview: (
              <ContextMenu>
                <ContextMenuTrigger className="flex items-center justify-center rounded-lg border border-dashed border-border px-8 py-3 text-xs text-muted-foreground select-none">
                  Right-click aqui
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem>Editar</ContextMenuItem>
                  <ContextMenuItem>Duplicar</ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ),
          },
          {
            name: "destructive",
            description: stripHtml(tContent("variants.items.destructive")),
            code: codeVariantDestructive,
            preview: (
              <ContextMenu>
                <ContextMenuTrigger className="flex items-center justify-center rounded-lg border border-dashed border-border px-8 py-3 text-xs text-muted-foreground select-none">
                  Right-click aqui
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem>Editar</ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem variant="destructive">Excluir</ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ),
          },
          {
            name: "CheckboxItem",
            description: stripHtml(tContent("variants.checkboxItem")),
            code: codeVariantCheckbox,
            preview: <CheckboxDemo tContent={tContent} />,
          },
          {
            name: "RadioItem",
            description: stripHtml(tContent("variants.radioItem")),
            code: codeVariantRadio,
            preview: <RadioDemo tContent={tContent} />,
          },
          {
            name: "SubTrigger",
            description: stripHtml(tContent("variants.subTrigger")),
            code: codeVariantSubTrigger,
            preview: (
              <ContextMenu>
                <ContextMenuTrigger className="flex items-center justify-center rounded-lg border border-dashed border-border px-8 py-3 text-xs text-muted-foreground select-none">
                  Right-click aqui
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuSub>
                    <ContextMenuSubTrigger>Compartilhar</ContextMenuSubTrigger>
                    <ContextMenuSubContent>
                      <ContextMenuItem>Por e-mail</ContextMenuItem>
                      <ContextMenuItem>Por link</ContextMenuItem>
                    </ContextMenuSubContent>
                  </ContextMenuSub>
                </ContextMenuContent>
              </ContextMenu>
            ),
          },
          {
            name: "Label + Inset",
            description: stripHtml(tContent("variants.label")),
            code: codeVariantLabel,
            preview: (
              <ContextMenu>
                <ContextMenuTrigger className="flex items-center justify-center rounded-lg border border-dashed border-border px-8 py-3 text-xs text-muted-foreground select-none">
                  Right-click aqui
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuGroup>
                    <ContextMenuLabel>Grupo de ações</ContextMenuLabel>
                    <ContextMenuItem inset>Editar</ContextMenuItem>
                    <ContextMenuItem inset>Duplicar</ContextMenuItem>
                  </ContextMenuGroup>
                </ContextMenuContent>
              </ContextMenu>
            ),
          },
        ]}
      />

      {/* ── Composições ────────────────────────────────────────────── */}
      <DocsCompositions
        title={tContent("variants.compositionsTitle")}
        useWhenLabel={tNav("common.useWhen")}
        componentSlug="context-menu"
        items={[
          {
            name: tContent("variants.compositions.withCheckbox.name"),
            description: tContent("variants.compositions.withCheckbox.description"),
            useWhen: tContent("variants.compositions.withCheckbox.use"),
            code: `const [showGrid, setShowGrid] = useState(true);
const [showRulers, setShowRulers] = useState(false);

<ContextMenu>
  <ContextMenuTrigger>Área de clique direito</ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuGroup>
      <ContextMenuLabel inset>Visualização</ContextMenuLabel>
      <ContextMenuCheckboxItem checked={showGrid} onCheckedChange={setShowGrid}>
        Mostrar grade
      </ContextMenuCheckboxItem>
      <ContextMenuCheckboxItem checked={showRulers} onCheckedChange={setShowRulers}>
        Mostrar réguas
      </ContextMenuCheckboxItem>
    </ContextMenuGroup>
  </ContextMenuContent>
</ContextMenu>`,
            preview: <CheckboxDemo tContent={tContent} />,
          },
          {
            name: tContent("variants.compositions.withRadio.name"),
            description: tContent("variants.compositions.withRadio.description"),
            useWhen: tContent("variants.compositions.withRadio.use"),
            code: `const [zoom, setZoom] = useState("100");

<ContextMenu>
  <ContextMenuTrigger>Área de clique direito</ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuGroup>
      <ContextMenuLabel inset>Zoom</ContextMenuLabel>
      <ContextMenuRadioGroup value={zoom} onValueChange={setZoom}>
        <ContextMenuRadioItem value="75">75%</ContextMenuRadioItem>
        <ContextMenuRadioItem value="100">100%</ContextMenuRadioItem>
        <ContextMenuRadioItem value="150">150%</ContextMenuRadioItem>
      </ContextMenuRadioGroup>
    </ContextMenuGroup>
  </ContextMenuContent>
</ContextMenu>`,
            preview: <RadioDemo tContent={tContent} />,
          },
          {
            name: tContent("variants.compositions.withSubmenu.name"),
            description: tContent("variants.compositions.withSubmenu.description"),
            useWhen: tContent("variants.compositions.withSubmenu.use"),
            code: `<ContextMenu>
  <ContextMenuTrigger>Área de clique direito</ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem>Editar</ContextMenuItem>
    <ContextMenuItem>Duplicar</ContextMenuItem>
    <ContextMenuSub>
      <ContextMenuSubTrigger>Compartilhar</ContextMenuSubTrigger>
      <ContextMenuSubContent>
        <ContextMenuItem>Por e-mail</ContextMenuItem>
        <ContextMenuItem>Por link</ContextMenuItem>
      </ContextMenuSubContent>
    </ContextMenuSub>
  </ContextMenuContent>
</ContextMenu>`,
            preview: (
              <ContextMenu>
                <ContextMenuTrigger className="flex items-center justify-center rounded-lg border border-dashed border-border px-8 py-3 text-xs text-muted-foreground select-none">
                  Right-click aqui
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem>Editar</ContextMenuItem>
                  <ContextMenuItem>Duplicar</ContextMenuItem>
                  <ContextMenuSub>
                    <ContextMenuSubTrigger>Compartilhar</ContextMenuSubTrigger>
                    <ContextMenuSubContent>
                      <ContextMenuItem>Por e-mail</ContextMenuItem>
                      <ContextMenuItem>Por link</ContextMenuItem>
                    </ContextMenuSubContent>
                  </ContextMenuSub>
                </ContextMenuContent>
              </ContextMenu>
            ),
          },
          {
            name: tContent("variants.compositions.withShortcuts.name"),
            description: tContent("variants.compositions.withShortcuts.description"),
            useWhen: tContent("variants.compositions.withShortcuts.use"),
            code: `<ContextMenu>
  <ContextMenuTrigger>Área de clique direito</ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem>
      Editar
      <ContextMenuShortcut>⌘E</ContextMenuShortcut>
    </ContextMenuItem>
    <ContextMenuItem>
      Duplicar
      <ContextMenuShortcut>⌘D</ContextMenuShortcut>
    </ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem variant="destructive">
      Excluir
      <ContextMenuShortcut>⌫</ContextMenuShortcut>
    </ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>`,
            preview: (
              <ContextMenu>
                <ContextMenuTrigger className="flex items-center justify-center rounded-lg border border-dashed border-border px-8 py-3 text-xs text-muted-foreground select-none">
                  Right-click aqui
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem>
                    Editar
                    <ContextMenuShortcut>⌘E</ContextMenuShortcut>
                  </ContextMenuItem>
                  <ContextMenuItem>
                    Duplicar
                    <ContextMenuShortcut>⌘D</ContextMenuShortcut>
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem variant="destructive">
                    Excluir
                    <ContextMenuShortcut>⌫</ContextMenuShortcut>
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ),
          },
        ]}
      />

      {/* ── Estados ────────────────────────────────────────────────── */}
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
            trigger: tContent("states.closed.trigger"),
            behavior: tContent("states.closed.behavior"),
          },
          {
            label: tContent("states.open.label"),
            trigger: tContent("states.open.trigger"),
            behavior: tContent("states.open.behavior"),
          },
          {
            label: tContent("states.focused.label"),
            trigger: tContent("states.focused.trigger"),
            behavior: tContent("states.focused.behavior"),
          },
          {
            label: tContent("states.disabled.label"),
            trigger: stripHtml(tContent("states.disabled.trigger")),
            behavior: tContent("states.disabled.behavior"),
          },
          {
            label: tContent("states.checked.label"),
            trigger: stripHtml(tContent("states.checked.trigger")),
            behavior: tContent("states.checked.behavior"),
          },
          {
            label: tContent("states.subOpen.label"),
            trigger: tContent("states.subOpen.trigger"),
            behavior: tContent("states.subOpen.behavior"),
          },
        ]}
      />

      {/* ── Propriedades ───────────────────────────────────────────── */}
      <DocsProps
        title={tContent("props.title")}
        tables={[
          {
            title: tContent("props.rootTitle"),
            cols: {
              prop: tContent("props.table.prop"),
              type: tContent("props.table.type"),
              default: tContent("props.table.default"),
              required: tContent("props.table.required"),
              description: tContent("props.table.description"),
            },
            items: [
              {
                name: "onOpenChange",
                type: "(open: boolean) => void",
                defaultValue: "—",
                required: "Não",
                description: tContent("props.items.onOpenChange"),
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
                name: "align",
                type: '"start" | "center" | "end"',
                defaultValue: '"start"',
                required: "Não",
                description: stripHtml(tContent("props.items.align")),
              },
              {
                name: "alignOffset",
                type: "number",
                defaultValue: "4",
                required: "Não",
                description: stripHtml(tContent("props.items.alignOffset")),
              },
              {
                name: "side",
                type: '"top" | "right" | "bottom" | "left"',
                defaultValue: '"right"',
                required: "Não",
                description: stripHtml(tContent("props.items.side")),
              },
              {
                name: "sideOffset",
                type: "number",
                defaultValue: "0",
                required: "Não",
                description: stripHtml(tContent("props.items.sideOffset")),
              },
            ],
          },
          {
            title: tContent("props.itemTitle"),
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
                description: stripHtml(tContent("props.items.variant")),
              },
              {
                name: "inset",
                type: "boolean",
                defaultValue: "false",
                required: "Não",
                description: stripHtml(tContent("props.items.inset")),
              },
              {
                name: "disabled",
                type: "boolean",
                defaultValue: "false",
                required: "Não",
                description: tContent("props.items.disabled"),
              },
              {
                name: "onSelect",
                type: "(event: Event) => void",
                defaultValue: "—",
                required: "Não",
                description: tContent("props.items.onSelect"),
              },
            ],
          },
          {
            title: tContent("props.checkboxItemTitle"),
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
                defaultValue: "false",
                required: "Não",
                description: tContent("props.items.checked"),
              },
              {
                name: "onCheckedChange",
                type: "(checked: boolean) => void",
                defaultValue: "—",
                required: "Não",
                description: tContent("props.items.onCheckedChange"),
              },
              {
                name: "inset",
                type: "boolean",
                defaultValue: "false",
                required: "Não",
                description: stripHtml(tContent("props.items.inset")),
              },
            ],
          },
          {
            title: tContent("props.radioGroupTitle"),
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
                type: "string",
                defaultValue: "—",
                required: "Não",
                description: tContent("props.items.value"),
              },
              {
                name: "onValueChange",
                type: "(value: string) => void",
                defaultValue: "—",
                required: "Não",
                description: tContent("props.items.onValueChange"),
              },
            ],
          },
        ]}
        interfaceCode={interfaceCode}
        extensibilityTitle={tContent("props.extensibilityTitle")}
        extensibilityNotes={tContent("props.extensibility")}
      />

      {/* ── Tokens ─────────────────────────────────────────────────── */}
      <DocsTokens
        title={tContent("tokens.title")}
        cols={{
          token: tContent("tokens.table.token"),
          value: tContent("tokens.table.class"),
          description: tContent("tokens.table.part"),
        }}
        items={[
          { token: "--popover",            value: "bg-popover",            description: tContent("tokens.table.popoverBg") },
          { token: "--popover-foreground", value: "text-popover-foreground", description: tContent("tokens.table.popoverFg") },
          { token: "--accent",             value: "bg-accent",             description: tContent("tokens.table.accentBg") },
          { token: "--accent-foreground",  value: "text-accent-foreground", description: tContent("tokens.table.accentFg") },
          { token: "--destructive",        value: "text-destructive",      description: tContent("tokens.table.destructive") },
          { token: "--destructive",        value: "bg-destructive/10",     description: tContent("tokens.table.destructiveFocus") },
          { token: "--muted-foreground",   value: "text-muted-foreground", description: tContent("tokens.table.mutedFg") },
          { token: "--border",             value: "bg-border",             description: tContent("tokens.table.border") },
          { token: "--shadow",             value: "shadow-md",             description: tContent("tokens.table.shadow") },
          { token: "--radius",             value: "rounded-lg",            description: tContent("tokens.table.radius") },
        ]}
        customizationTitle={tContent("tokens.customizationTitle")}
        customizationCode={codeCustomizationTokens}
      />

      {/* ── Acessibilidade ─────────────────────────────────────────── */}
      <DocsAccessibility
        title={tContent("accessibility.title")}
        summary={tContent("accessibility.summary")}
        items={[
          tContent("accessibility.warning"),
          tContent("accessibility.aria.roleMenu"),
          tContent("accessibility.aria.roleMenuItem"),
          tContent("accessibility.aria.roleMenuitemCheckbox"),
          tContent("accessibility.aria.roleMenuitemRadio"),
          tContent("accessibility.aria.ariaChecked"),
          tContent("accessibility.aria.ariaDisabled"),
          tContent("accessibility.aria.ariaHaspopup"),
          tContent("accessibility.aria.ariaExpanded"),
          tContent("accessibility.screenReader.alternative"),
        ]}
        keyboardTitle={tContent("accessibility.title")}
        keyboardItems={[
          { key: "Right-click / Menu", description: tContent("accessibility.keyboard.rightClick") },
          { key: "↓",                  description: tContent("accessibility.keyboard.arrowDown") },
          { key: "↑",                  description: tContent("accessibility.keyboard.arrowUp") },
          { key: "→",                  description: tContent("accessibility.keyboard.arrowRight") },
          { key: "←",                  description: tContent("accessibility.keyboard.arrowLeft") },
          { key: "Enter",              description: tContent("accessibility.keyboard.enter") },
          { key: "Space",              description: tContent("accessibility.keyboard.space") },
          { key: "Escape",             description: tContent("accessibility.keyboard.escape") },
          { key: "Tab",                description: tContent("accessibility.keyboard.tab") },
        ]}
      />

      {/* ── Relacionados ───────────────────────────────────────────── */}
      <DocsRelated
        title={tContent("related.title")}
        items={[
          {
            name: "DropdownMenu",
            description: tContent("related.dropdownMenu"),
            path: "?path=/docs/ui-dropdownmenu--docs",
          },
          {
            name: "Menubar",
            description: tContent("related.menubar"),
            path: "?path=/docs/ui-menubar--docs",
          },
          {
            name: "Dialog",
            description: tContent("related.dialog"),
            path: "?path=/docs/ui-dialog--docs",
          },
          {
            name: "AlertDialog",
            description: tContent("related.alertDialog"),
            path: "?path=/docs/ui-alertdialog--docs",
          },
          {
            name: "Tooltip",
            description: tContent("related.tooltip"),
            path: "?path=/docs/ui-tooltip--docs",
          },
        ]}
      />

      {/* ── Notas ──────────────────────────────────────────────────── */}
      <DocsNotes
        title={tContent("notes.title")}
        items={[
          { title: "", content: tContent("notes.tip1") },
          { title: "", content: tContent("notes.tip2") },
          { title: "", content: tContent("notes.tip3") },
          { title: "", content: tContent("notes.tip4") },
          { title: "", content: tContent("notes.tip5") },
        ]}
      />

      {/* ── Analytics ──────────────────────────────────────────────── */}
      <DocsAnalytics
        title={tContent("analytics.title")}
        cols={{
          event: tContent("analytics.table.event"),
          trigger: tContent("analytics.table.trigger"),
          payload: tContent("analytics.table.payload"),
        }}
        items={[
          {
            event: tContent("analytics.table.menuOpen"),
            trigger: tContent("analytics.table.menuOpenTrigger"),
            payload: tContent("analytics.table.menuOpenPayload"),
          },
          {
            event: tContent("analytics.table.itemClick"),
            trigger: tContent("analytics.table.itemClickTrigger"),
            payload: tContent("analytics.table.itemClickPayload"),
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

      {/* ── Testes ─────────────────────────────────────────────────── */}
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
              priority: tNav(priorityKeyMap[tContent("testes.functional.item7.priority")] ?? "common.medium"),
            },
            {
              action: tContent("testes.functional.item8.action"),
              result: tContent("testes.functional.item8.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item8.priority")] ?? "common.medium"),
            },
            {
              action: tContent("testes.functional.item9.action"),
              result: tContent("testes.functional.item9.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item9.priority")] ?? "common.medium"),
            },
            {
              action: tContent("testes.functional.item10.action"),
              result: tContent("testes.functional.item10.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item10.priority")] ?? "common.high"),
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
              criterion: tContent("testes.accessibility.item1"),
              level: "AA",
              how: "axe-core",
            },
            {
              criterion: tContent("testes.accessibility.item2"),
              level: "AA",
              how: "getByRole('menu')",
            },
            {
              criterion: tContent("testes.accessibility.item3"),
              level: "AA",
              how: "getAllByRole('menuitem')",
            },
            {
              criterion: tContent("testes.accessibility.item4"),
              level: "AA",
              how: "getByRole('menuitemcheckbox')",
            },
            {
              criterion: tContent("testes.accessibility.item5"),
              level: "AA",
              how: "getByRole('menuitemradio')",
            },
            {
              criterion: tContent("testes.accessibility.item6"),
              level: "AA",
              how: "aria-disabled",
            },
            {
              criterion: tContent("testes.accessibility.item7"),
              level: "AA",
              how: "keyboard: Escape",
            },
            {
              criterion: tContent("testes.accessibility.item8"),
              level: "AA 1.4.3",
              how: "Colour Contrast Analyser",
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
            {
              story: tContent("testes.visual.item1.story"),
              priority: tNav(priorityKeyMap[tContent("testes.visual.item1.priority")] ?? "common.high"),
            },
            {
              story: tContent("testes.visual.item2.story"),
              priority: tNav(priorityKeyMap[tContent("testes.visual.item2.priority")] ?? "common.high"),
            },
            {
              story: tContent("testes.visual.item3.story"),
              priority: tNav(priorityKeyMap[tContent("testes.visual.item3.priority")] ?? "common.high"),
            },
            {
              story: tContent("testes.visual.item4.story"),
              priority: tNav(priorityKeyMap[tContent("testes.visual.item4.priority")] ?? "common.medium"),
            },
            {
              story: tContent("testes.visual.item5.story"),
              priority: tNav(priorityKeyMap[tContent("testes.visual.item5.priority")] ?? "common.medium"),
            },
            {
              story: tContent("testes.visual.item6.story"),
              priority: tNav(priorityKeyMap[tContent("testes.visual.item6.priority")] ?? "common.high"),
            },
          ],
        }}
      />
    </DocsPageLayout>
  );
}
