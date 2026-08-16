import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import DOMPurify from 'dompurify';
import { useActiveSection } from "@/lib/use-active-section";
import uiTranslations from "@/i18n/ui.json";
import dropdownMenuTranslations from "@shared/content/dropdown-menu/translations.json";

import { DocsHeader }        from "@/components/docs/shared/sections/DocsHeader";
import { DocsPageLayout }    from "@/components/docs/shared/sections/DocsPageLayout";
import { DocsDemonstration } from "@/components/docs/shared/sections/DocsDemonstration";
import { DocsAnatomy }       from "@/components/docs/shared/sections/DocsAnatomy";
import { DocsWhenToUse }     from "@/components/docs/shared/sections/DocsWhenToUse";
import { DocsDoDont }        from "@/components/docs/shared/sections/DocsDoDont";
import { DocsImport }        from "@/components/docs/shared/sections/DocsImport";
import { DocsCompositions }  from "@/components/docs/shared/sections/DocsCompositions";
import { DocsStates }        from "@/components/docs/shared/sections/DocsStates";
import { DocsProps }         from "@/components/docs/shared/sections/DocsProps";
import { DocsTokens }        from "@/components/docs/shared/sections/DocsTokens";
import { DocsAccessibility } from "@/components/docs/shared/sections/DocsAccessibility";
import { DocsRelated }       from "@/components/docs/shared/sections/DocsRelated";
import { DocsNotes }         from "@/components/docs/shared/sections/DocsNotes";
import { DocsAnalytics }     from "@/components/docs/shared/sections/DocsAnalytics";
import { DocsTestes }        from "@/components/docs/shared/sections/DocsTestes";
import { stripHtml, toPlainText } from "@/lib/strip-html";

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

export function DropdownMenuDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(dropdownMenuTranslations);

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria.
  const screenReaderItems = useMemo(
    () =>
      Object.values(
        (dropdownMenuTranslations as unknown as Record<
          string,
          { accessibility?: { screenReader?: Record<string, string> } }
        >)[locale]?.accessibility?.screenReader ?? {},
      ),
    [locale],
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
    componentSlug: "dropdown-menu",
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
      component_name: "dropdown-menu",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "dropdown-menu",
        locale,
      });
    },
    [locale]
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  // Estado para demos interativas
  const [showName, setShowName] = useState(true);
  const [showEmail, setShowEmail] = useState(true);
  const [showRole, setShowRole] = useState(false);
  const [theme, setTheme] = useState("system");

  // ─── Code strings ───────────────────────────────────────────────────────────

  const codeImport = `import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";`;

  const structureCode = tContent("anatomy.structureCode");

  const codeDefault = `<DropdownMenuItem>Perfil</DropdownMenuItem>`;

  const codeDestructive = `<DropdownMenuItem variant="destructive">
  Excluir conta
</DropdownMenuItem>`;

  const interfaceCode = `// DropdownMenu (base-ui/menu)
interface DropdownMenuProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
}

interface DropdownMenuContentProps {
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  alignOffset?: number;
}

interface DropdownMenuItemProps {
  variant?: "default" | "destructive";
  inset?: boolean;
  disabled?: boolean;
  onSelect?: (event: Event) => void;
}`;

  // ─── Locale-aware column labels ─────────────────────────────────────────────

  const analyticsCols = {
    event: locale === "en" ? "Event" : locale === "es" ? "Evento" : "Evento",
    trigger: locale === "en" ? "Trigger" : locale === "es" ? "Disparo" : "Disparo",
    payload: "Payload",
  };

  return (
    <DocsPageLayout
      navGroups={navGroups}
      activeSection={activeId}
      componentSlug="dropdown-menu"
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
        <div className="nds-grid nds-w-full" data-spacing="md" style={{ "--grid-min": "9rem" } as CSSProperties}>
          {/* Basic */}
          <div
            className="nds-stack"
            data-spacing="sm"
            style={{ contain: "layout", minHeight: 80, position: "relative" }}
          >
            <p className="nds-text-caption nds-font-medium nds-text-muted-foreground">
              {DOMPurify.sanitize(tContent("demonstration.labels.basic"))}
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="nds-w-full">
                  Conta
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Conta</DropdownMenuLabel>
                  <DropdownMenuItem>Perfil</DropdownMenuItem>
                  <DropdownMenuItem>Configurações</DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive">Sair</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Checkbox */}
          <div
            className="nds-stack"
            data-spacing="sm"
            style={{ contain: "layout", minHeight: 80, position: "relative" }}
          >
            <p className="nds-text-caption nds-font-medium nds-text-muted-foreground">
              {DOMPurify.sanitize(tContent("demonstration.labels.withCheckbox"))}
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="nds-w-full">
                  Colunas
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuCheckboxItem
                  checked={showName}
                  onCheckedChange={setShowName}
                >
                  Nome
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={showEmail}
                  onCheckedChange={setShowEmail}
                >
                  E-mail
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={showRole}
                  onCheckedChange={setShowRole}
                >
                  Cargo
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Radio */}
          <div
            className="nds-stack"
            data-spacing="sm"
            style={{ contain: "layout", minHeight: 80, position: "relative" }}
          >
            <p className="nds-text-caption nds-font-medium nds-text-muted-foreground">
              {DOMPurify.sanitize(tContent("demonstration.labels.withRadio"))}
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="nds-w-full">
                  Tema
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                  <DropdownMenuRadioItem value="light">Claro</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="dark">Escuro</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="system">Sistema</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Submenu */}
          <div
            className="nds-stack"
            data-spacing="sm"
            style={{ contain: "layout", minHeight: 80, position: "relative" }}
          >
            <p className="nds-text-caption nds-font-medium nds-text-muted-foreground">
              {DOMPurify.sanitize(tContent("demonstration.labels.withSubmenu"))}
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="nds-w-full">
                  Ações
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Salvar</DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Exportar</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem>PDF</DropdownMenuItem>
                    <DropdownMenuItem>CSV</DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenu>
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
              element: tContent("usage.uxWriting.table.label.name"),
              rules: tContent("usage.uxWriting.table.label.format"),
              do: tContent("usage.uxWriting.table.label.good"),
              dont: tContent("usage.uxWriting.table.label.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.item.name"),
              rules: tContent("usage.uxWriting.table.item.format"),
              do: tContent("usage.uxWriting.table.item.good"),
              dont: tContent("usage.uxWriting.table.item.bad"),
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
              <div className="nds-text-body nds-stack" data-spacing="xs">
                <div className="nds-font-medium">Conta</div>
                <div className="nds-text-muted-foreground">Perfil / Configurações</div>
                <div className="nds-text-muted-foreground" style={{ borderTop: "1px solid var(--border)", paddingTop: "0.25rem" }}>Equipe</div>
              </div>
            ),
            dontPreview: (
              <div className="nds-text-body nds-text-muted-foreground nds-italic">
                10+ items planos sem agrupamento
              </div>
            ),
            doCaption: DOMPurify.sanitize(tContent("doDont.pair1.do")),
            dontCaption: DOMPurify.sanitize(tContent("doDont.pair1.dont")),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <div className="nds-text-body">
                <div className="nds-text-destructive nds-font-medium">Excluir conta</div>
                <div className="nds-text-muted-foreground nds-text-caption">variant=destructive</div>
              </div>
            ),
            dontPreview: (
              <div className="nds-text-body">
                <div className="nds-font-medium">Excluir conta</div>
                <div className="nds-text-muted-foreground nds-text-caption">Item normal sem aviso</div>
              </div>
            ),
            doCaption: DOMPurify.sanitize(tContent("doDont.pair2.do")),
            dontCaption: DOMPurify.sanitize(tContent("doDont.pair2.dont")),
          },
        ]}
      />

      {/* ── Importação ────────────────────────────────────────────── */}
      <DocsImport title={tContent("import.title")} code={codeImport} />

      {/* ── Variantes ─────────────────────────────────────────────── */}
      <DocsCompositions
        id="variantes"
        title={tContent("variants.title")}
        useWhenLabel={tNav("common.useWhen")}
        componentSlug="dropdown-menu"
        items={[
          {
            name: tContent("variants.items.default"),
            description: stripHtml(tContent("variants.styles.default")),
            code: codeDefault,
            preview: (
              <div className="nds-text-caption nds-font-mono nds-text-muted-foreground">
                variant=&quot;default&quot;
              </div>
            ),
          },
          {
            name: tContent("variants.items.destructive"),
            description: stripHtml(tContent("variants.styles.destructive")),
            code: codeDestructive,
            preview: (
              <div className="nds-text-caption nds-font-mono nds-text-destructive">
                variant=&quot;destructive&quot;
              </div>
            ),
          },
          {
            name: tContent("variants.items.withLabel.name"),
            description: tContent("variants.items.withLabel.description"),
            useWhen: tContent("variants.items.withLabel.use"),
            code: `<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Conta</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuGroup>
      <DropdownMenuLabel>Conta</DropdownMenuLabel>
      <DropdownMenuItem>Perfil</DropdownMenuItem>
      <DropdownMenuItem>Configurações</DropdownMenuItem>
    </DropdownMenuGroup>
    <DropdownMenuSeparator />
    <DropdownMenuGroup>
      <DropdownMenuLabel>Suporte</DropdownMenuLabel>
      <DropdownMenuItem>Documentação</DropdownMenuItem>
      <DropdownMenuItem>Sair</DropdownMenuItem>
    </DropdownMenuGroup>
  </DropdownMenuContent>
</DropdownMenu>`,
            preview: (
              <div style={{ contain: "layout", minHeight: 240 }}>
                <DropdownMenu defaultOpen modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">Conta</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="bottom" align="start">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Conta</DropdownMenuLabel>
                      <DropdownMenuItem>Perfil</DropdownMenuItem>
                      <DropdownMenuItem>Configurações</DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Suporte</DropdownMenuLabel>
                      <DropdownMenuItem>Documentação</DropdownMenuItem>
                      <DropdownMenuItem>Sair</DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ),
          },
          {
            name: tContent("variants.items.withCheckboxItems.name"),
            description: tContent("variants.items.withCheckboxItems.description"),
            useWhen: tContent("variants.items.withCheckboxItems.use"),
            code: `<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Colunas</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuGroup>
      <DropdownMenuLabel>Colunas visíveis</DropdownMenuLabel>
      <DropdownMenuCheckboxItem checked={showName} onCheckedChange={setShowName}>
        Nome
      </DropdownMenuCheckboxItem>
      <DropdownMenuCheckboxItem checked={showEmail} onCheckedChange={setShowEmail}>
        E-mail
      </DropdownMenuCheckboxItem>
      <DropdownMenuCheckboxItem checked={showRole} onCheckedChange={setShowRole}>
        Cargo
      </DropdownMenuCheckboxItem>
    </DropdownMenuGroup>
  </DropdownMenuContent>
</DropdownMenu>`,
            preview: (
              <div style={{ contain: "layout", minHeight: 200 }}>
                <DropdownMenu defaultOpen modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">Colunas</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="bottom" align="start">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Colunas visíveis</DropdownMenuLabel>
                      <DropdownMenuCheckboxItem
                        checked={showName}
                        onCheckedChange={setShowName}
                      >
                        Nome
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={showEmail}
                        onCheckedChange={setShowEmail}
                      >
                        E-mail
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={showRole}
                        onCheckedChange={setShowRole}
                      >
                        Cargo
                      </DropdownMenuCheckboxItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ),
          },
          {
            name: tContent("variants.items.withRadioGroup.name"),
            description: tContent("variants.items.withRadioGroup.description"),
            useWhen: tContent("variants.items.withRadioGroup.use"),
            code: `<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Tema</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
      <DropdownMenuLabel>Aparência</DropdownMenuLabel>
      <DropdownMenuRadioItem value="light">Claro</DropdownMenuRadioItem>
      <DropdownMenuRadioItem value="dark">Escuro</DropdownMenuRadioItem>
      <DropdownMenuRadioItem value="system">Sistema</DropdownMenuRadioItem>
    </DropdownMenuRadioGroup>
  </DropdownMenuContent>
</DropdownMenu>`,
            preview: (
              <div style={{ contain: "layout", minHeight: 200 }}>
                <DropdownMenu defaultOpen modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">Tema</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="bottom" align="start">
                    <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                      <DropdownMenuLabel>Aparência</DropdownMenuLabel>
                      <DropdownMenuRadioItem value="light">Claro</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="dark">Escuro</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="system">Sistema</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ),
          },
          {
            name: tContent("variants.items.withShortcuts.name"),
            description: tContent("variants.items.withShortcuts.description"),
            useWhen: tContent("variants.items.withShortcuts.use"),
            code: `<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Editar</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>
      Desfazer <DropdownMenuShortcut>⌘Z</DropdownMenuShortcut>
    </DropdownMenuItem>
    <DropdownMenuItem>
      Refazer <DropdownMenuShortcut>⇧⌘Z</DropdownMenuShortcut>
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem>
      Copiar <DropdownMenuShortcut>⌘C</DropdownMenuShortcut>
    </DropdownMenuItem>
    <DropdownMenuItem>
      Colar <DropdownMenuShortcut>⌘V</DropdownMenuShortcut>
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`,
            preview: (
              <div style={{ contain: "layout", minHeight: 220 }}>
                <DropdownMenu defaultOpen modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">Editar</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="bottom" align="start">
                    <DropdownMenuItem>
                      Desfazer <DropdownMenuShortcut>⌘Z</DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      Refazer <DropdownMenuShortcut>⇧⌘Z</DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      Copiar <DropdownMenuShortcut>⌘C</DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      Colar <DropdownMenuShortcut>⌘V</DropdownMenuShortcut>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
            label: tContent("states.disabled.label"),
            trigger: toPlainText(tContent("states.disabled.trigger")),
            behavior: toPlainText(tContent("states.disabled.behavior")),
          },
          {
            label: tContent("states.checked.label"),
            trigger: toPlainText(tContent("states.checked.trigger")),
            behavior: toPlainText(tContent("states.checked.behavior")),
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
                description: DOMPurify.sanitize(tContent("props.table.open.description")),
              },
              {
                name: "onOpenChange",
                type: tContent("props.table.onOpenChange.type"),
                defaultValue: tContent("props.table.onOpenChange.default"),
                required: tContent("props.table.onOpenChange.required"),
                description: DOMPurify.sanitize(tContent("props.table.onOpenChange.description")),
              },
              {
                name: "defaultOpen",
                type: tContent("props.table.defaultOpen.type"),
                defaultValue: tContent("props.table.defaultOpen.default"),
                required: tContent("props.table.defaultOpen.required"),
                description: DOMPurify.sanitize(tContent("props.table.defaultOpen.description")),
              },
              {
                name: "modal",
                type: tContent("props.table.modal.type"),
                defaultValue: tContent("props.table.modal.default"),
                required: tContent("props.table.modal.required"),
                description: DOMPurify.sanitize(tContent("props.table.modal.description")),
              },
              {
                name: "side",
                type: tContent("props.table.side.type"),
                defaultValue: tContent("props.table.side.default"),
                required: tContent("props.table.side.required"),
                description: DOMPurify.sanitize(tContent("props.table.side.description")),
              },
              {
                name: "align",
                type: tContent("props.table.align.type"),
                defaultValue: tContent("props.table.align.default"),
                required: tContent("props.table.align.required"),
                description: DOMPurify.sanitize(tContent("props.table.align.description")),
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
            token: "--elevation-md",
            value: tContent("tokens.table.shadow.class"),
            description: tContent("tokens.table.shadow.part"),
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
        screenReaderTitle={tNav("common.screenReader")}
        screenReaderItems={screenReaderItems}
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
          { key: "Tab", description: toPlainText(tContent("accessibility.keyboard.tab")) },
          { key: "Arrow Up / Arrow Down / Arrow Left / Arrow Right", description: toPlainText(tContent("accessibility.keyboard.arrows")) },
          { key: "Enter / Space", description: toPlainText(tContent("accessibility.keyboard.enter")) },
          { key: "Esc", description: toPlainText(tContent("accessibility.keyboard.escape")) },
          { key: "Home / End", description: toPlainText(tContent("accessibility.keyboard.homeEnd")) },
          { key: "A–Z", description: toPlainText(tContent("accessibility.keyboard.typeahead")) },
        ]}
      />

      {/* ── Relacionados ──────────────────────────────────────────── */}
      <DocsRelated
        title={tContent("related.title")}
        componentSlug="dropdown-menu"
        items={[
          {
            name: tContent("related.items.contextMenu.name"),
            description: toPlainText(tContent("related.items.contextMenu.description")),
            path: "?path=/docs/ui-contextmenu--docs",
          },
          {
            name: tContent("related.items.menubar.name"),
            description: toPlainText(tContent("related.items.menubar.description")),
            path: "?path=/docs/ui-menubar--docs",
          },
          {
            name: tContent("related.items.command.name"),
            description: toPlainText(tContent("related.items.command.description")),
            path: "?path=/docs/ui-command--docs",
          },
          {
            name: tContent("related.items.popover.name"),
            description: toPlainText(tContent("related.items.popover.description")),
            path: "?path=/docs/ui-popover--docs",
          },
          {
            name: tContent("related.items.select.name"),
            description: toPlainText(tContent("related.items.select.description")),
            path: "?path=/docs/ui-select--docs",
          },
        ]}
      />

      {/* ── Notas ─────────────────────────────────────────────────── */}
      <DocsNotes
        title={tContent("notes.title")}
        componentSlug="dropdown-menu"
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
            event: "dropdown_menu_open / dropdown_menu_close / dropdown_menu_item_select",
            trigger: toPlainText(tContent("analytics.description")),
            payload: "component, location, label",
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
            { criterion: tContent("testes.accessibility.item1"), level: "AA", how: "axe-core" },
            { criterion: tContent("testes.accessibility.item2"), level: "4.1.2", how: "DevTools a11y tree" },
            { criterion: tContent("testes.accessibility.item3"), level: "4.1.2", how: "DevTools a11y tree" },
            { criterion: tContent("testes.accessibility.item4"), level: "1.3.1", how: "DevTools a11y tree" },
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
            { story: tContent("testes.visual.item4.story"), priority: tNav(priorityKeyMap[tContent("testes.visual.item4.priority")] ?? "common.high") },
            { story: tContent("testes.visual.item5.story"), priority: tNav(priorityKeyMap[tContent("testes.visual.item5.priority")] ?? "common.medium") },
          ],
        }}
      />
    </DocsPageLayout>
  );
}

export default DropdownMenuDocs;
