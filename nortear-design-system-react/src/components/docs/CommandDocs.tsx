import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LayoutIcon,
  TypeIcon,
  MinusIcon,
  SearchIcon,
} from "lucide-react";

import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";

import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import { useActiveSection } from "@/lib/use-active-section";

import { LanguageSwitcher } from "@/components/product/LanguageSwitcher";
import uiTranslations from "@/i18n/ui.json";
import commandTranslations from "@shared/content/command/translations.json";

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

// ─── CommandPaletteDemo ───────────────────────────────────────────────────────

function CommandPaletteDemo({
  openLabel,
  shortcutHint,
  shortcutKey,
  searchPlaceholder,
  emptyMessage,
  groupComponents,
  groupUtils,
  itemButton,
  itemInput,
  itemSeparator,
  dialogTitle,
  dialogDescription,
}: {
  openLabel: string;
  shortcutHint: string;
  shortcutKey: string;
  searchPlaceholder: string;
  emptyMessage: string;
  groupComponents: string;
  groupUtils: string;
  itemButton: string;
  itemInput: string;
  itemSeparator: string;
  dialogTitle: string;
  dialogDescription: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="nds-stack nds-p-2" data-spacing="xs" style={{ alignItems: "flex-start" }}>
      <div className="nds-cluster nds-text-body nds-text-muted-foreground" data-align="center" data-spacing="xs">
        <span>{shortcutHint}</span>
        <kbd className="nds-kbd">{shortcutKey}</kbd>
      </div>
      <Button
        variant="outline"
        onClick={() => {
          setOpen(true);
          track("command_palette_open", { trigger: "button" });
        }}
        aria-label={openLabel}
        data-track-click="command_palette_open"
        data-track-trigger="button"
      >
        <SearchIcon />
        {openLabel}
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title={dialogTitle}
        description={dialogDescription}
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup heading={groupComponents}>
              <CommandItem
                value="button"
                onSelect={() => {
                  setOpen(false);
                  track("command_item_select", {
                    label: itemButton,
                    group: groupComponents,
                    pattern: "palette",
                  });
                }}
              >
                <LayoutIcon />
                {itemButton}
                <CommandShortcut>⌘B</CommandShortcut>
              </CommandItem>
              <CommandItem
                value="input"
                onSelect={() => {
                  setOpen(false);
                  track("command_item_select", {
                    label: itemInput,
                    group: groupComponents,
                    pattern: "palette",
                  });
                }}
              >
                <TypeIcon />
                {itemInput}
                <CommandShortcut>⌘I</CommandShortcut>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading={groupUtils}>
              <CommandItem
                value="separator"
                onSelect={() => {
                  setOpen(false);
                  track("command_item_select", {
                    label: itemSeparator,
                    group: groupUtils,
                    pattern: "palette",
                  });
                }}
              >
                <MinusIcon />
                {itemSeparator}
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function CommandDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(commandTranslations);

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria.
  const screenReaderItems = useMemo(
    () =>
      Object.values(
        (commandTranslations as unknown as Record<
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
    componentSlug: "command",
  });

  useEffect(() => {
    track("docs_page_view", {
      component_name: "command",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "command",
        locale,
      });
    },
    [locale]
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  // ─── Code strings ───────────────────────────────────────────────────────────

  const codeImportBasic = `import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from "@/components/ui/command";`;

  const codeImportWithDialog = `import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from "@/components/ui/command";`;

  const codeInline = `<Command>
  <CommandInput placeholder="Buscar componente..." />
  <CommandList>
    <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
    <CommandGroup heading="Componentes">
      <CommandItem value="button" onSelect={handleSelect}>
        Button
      </CommandItem>
      <CommandItem value="input" onSelect={handleSelect}>
        Input
      </CommandItem>
    </CommandGroup>
    <CommandSeparator />
    <CommandGroup heading="Utilitários">
      <CommandItem value="separator" onSelect={handleSelect}>
        Separator
      </CommandItem>
    </CommandGroup>
  </CommandList>
</Command>`;

  const codePalette = `const [open, setOpen] = useState(false);

useEffect(() => {
  const down = (e: KeyboardEvent) => {
    if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      setOpen((prev) => !prev);
    }
  };
  document.addEventListener("keydown", down);
  return () => document.removeEventListener("keydown", down);
}, []);

<CommandDialog
  open={open}
  onOpenChange={setOpen}
  title="Command Palette"
  description="Busque por um comando ou ação..."
>
  <Command>
    <CommandInput placeholder="Buscar..." />
    <CommandList>
      <CommandEmpty>Nenhum resultado.</CommandEmpty>
      <CommandGroup heading="Ações">
        <CommandItem value="acao" onSelect={() => setOpen(false)}>
          Ação
          <CommandShortcut>⌘A</CommandShortcut>
        </CommandItem>
      </CommandGroup>
    </CommandList>
  </Command>
</CommandDialog>`;

  const codeCustomizationTokens = `/* Em globals.css */
:root {
  --popover: 0 0% 100%;
  --popover-foreground: 240 10% 3.9%;
  --accent: 240 4.8% 95.9%;
  --accent-foreground: 240 5.9% 10%;
  --border: 240 5.9% 90%;
}

.dark {
  --popover: 240 10% 3.9%;
  --popover-foreground: 0 0% 98%;
  --accent: 240 3.7% 15.9%;
  --accent-foreground: 0 0% 98%;
  --border: 240 3.7% 15.9%;
}`;

  const interfaceCode = `// Command
interface CommandProps extends React.ComponentProps<typeof CommandPrimitive> {
  filter?: (value: string, search: string, keywords?: string[]) => number;
  value?: string;
  onValueChange?: (value: string) => void;
  shouldFilter?: boolean;
  loop?: boolean;
}

// CommandInput
interface CommandInputProps
  extends React.ComponentProps<typeof CommandPrimitive.Input> {
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

// CommandItem
interface CommandItemProps
  extends React.ComponentProps<typeof CommandPrimitive.Item> {
  value: string;
  disabled?: boolean;
  /** Vira data-checked no elemento; a folha acende a marca à direita. */
  checked?: boolean;
  onSelect?: (value: string) => void;
  keywords?: string[];
}

// CommandDialog
interface CommandDialogProps
  extends Omit<React.ComponentProps<typeof Dialog>, "children"> {
  title?: string;
  description?: string;
  className?: string;
  showCloseButton?: boolean;
  children: React.ReactNode;
}`;

  const labels = {
    searchPlaceholder: tContent("demonstration.labels.searchPlaceholder"),
    emptyMessage: tContent("demonstration.labels.emptyMessage"),
    groupComponents: tContent("demonstration.labels.groupComponents"),
    groupUtils: tContent("demonstration.labels.groupUtils"),
    itemButton: tContent("demonstration.labels.itemButton"),
    itemInput: tContent("demonstration.labels.itemInput"),
    itemSeparator: tContent("demonstration.labels.itemSeparator"),
    shortcutHint: tContent("demonstration.labels.shortcutHint"),
    shortcutKey: tContent("demonstration.labels.shortcutKey"),
    openPalette: tContent("demonstration.labels.openPalette"),
    dialogTitle: tContent("demonstration.labels.dialogTitle"),
    dialogDescription: tContent("demonstration.labels.dialogDescription"),
  };

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
          languageSwitcher={<LanguageSwitcher />}
        />
      }
    >
      {/* ── Demonstração ──────────────────────────────────────────── */}
      <DocsDemonstration title={tContent("demonstration.title")}>
        <div className="nds-w-full nds-stack" data-spacing="xl">
          {/* Inline */}
          <div className="nds-stack" data-spacing="sm">
            <p className="nds-text-caption nds-font-medium nds-text-muted-foreground nds-uppercase nds-tracking-wider">
              Inline
            </p>
            <div className="nds-w-full nds-max-w-sm nds-border-default nds-rounded-md nds-shadow-md">
              <Command>
                <CommandInput placeholder={labels.searchPlaceholder} />
                <CommandList>
                  <CommandEmpty>{labels.emptyMessage}</CommandEmpty>
                  <CommandGroup heading={labels.groupComponents}>
                    <CommandItem
                      value="button"
                      onSelect={() =>
                        track("command_item_select", {
                          label: labels.itemButton,
                          group: labels.groupComponents,
                          pattern: "inline",
                        })
                      }
                    >
                      <LayoutIcon />
                      {labels.itemButton}
                    </CommandItem>
                    <CommandItem
                      value="input"
                      onSelect={() =>
                        track("command_item_select", {
                          label: labels.itemInput,
                          group: labels.groupComponents,
                          pattern: "inline",
                        })
                      }
                    >
                      <TypeIcon />
                      {labels.itemInput}
                    </CommandItem>
                  </CommandGroup>
                  <CommandSeparator />
                  <CommandGroup heading={labels.groupUtils}>
                    <CommandItem
                      value="separator"
                      onSelect={() =>
                        track("command_item_select", {
                          label: labels.itemSeparator,
                          group: labels.groupUtils,
                          pattern: "inline",
                        })
                      }
                    >
                      <MinusIcon />
                      {labels.itemSeparator}
                    </CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
            </div>
          </div>

          {/* Command Palette */}
          <div className="nds-stack" data-spacing="sm">
            <p className="nds-text-caption nds-font-medium nds-text-muted-foreground nds-uppercase nds-tracking-wider">
              Command Palette
            </p>
            <CommandPaletteDemo
              openLabel={labels.openPalette}
              shortcutHint={labels.shortcutHint}
              shortcutKey={labels.shortcutKey}
              searchPlaceholder={labels.searchPlaceholder}
              emptyMessage={labels.emptyMessage}
              groupComponents={labels.groupComponents}
              groupUtils={labels.groupUtils}
              itemButton={labels.itemButton}
              itemInput={labels.itemInput}
              itemSeparator={labels.itemSeparator}
              dialogTitle={labels.dialogTitle}
              dialogDescription={labels.dialogDescription}
            />
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
        do={{
          title: tContent("usage.do.title"),
          items: [
            tContent("usage.do.item1"),
            tContent("usage.do.item2"),
            tContent("usage.do.item3"),
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
              <div className="nds-w-full nds-max-w-sm nds-border-default nds-rounded-md">
                <Command>
                  <CommandInput placeholder={labels.searchPlaceholder} />
                  <CommandList>
                    <CommandEmpty>{labels.emptyMessage}</CommandEmpty>
                    <CommandGroup heading={labels.groupComponents}>
                      <CommandItem value="button">
                        <LayoutIcon />
                        {labels.itemButton}
                      </CommandItem>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </div>
            ),
            dontPreview: (
              <div className="nds-w-full nds-max-w-sm nds-border-default nds-rounded-md">
                <Command>
                  <CommandInput placeholder={labels.searchPlaceholder} />
                  <CommandList>
                    <CommandGroup heading={labels.groupComponents}>
                      <CommandItem value="button">
                        <LayoutIcon />
                        {labels.itemButton}
                      </CommandItem>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </div>
            ),
            doCaption: toPlainText(tContent("doDont.pair1.do")),
            dontCaption: toPlainText(tContent("doDont.pair1.dont")),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <div className="nds-stack nds-p-2" data-spacing="xs" style={{ alignItems: "flex-start" }}>
                <div className="nds-cluster nds-text-body nds-text-muted-foreground" data-align="center" data-spacing="xs">
                  <span>{labels.shortcutHint}</span>
                  <kbd className="nds-kbd">{labels.shortcutKey}</kbd>
                </div>
                <Button variant="outline" size="sm">
                  <SearchIcon />
                  {labels.openPalette}
                </Button>
              </div>
            ),
            dontPreview: (
              <div className="nds-stack nds-p-2" data-spacing="xs" style={{ alignItems: "flex-start" }}>
                <Button variant="outline" size="sm">
                  <SearchIcon />
                  {labels.openPalette}
                </Button>
                <p className="nds-text-caption nds-text-muted-foreground" style={{ opacity: 0.4, textDecoration: "line-through" }}>⌘K</p>
              </div>
            ),
            doCaption: toPlainText(tContent("doDont.pair2.do")),
            dontCaption: toPlainText(tContent("doDont.pair2.dont")),
          },
        ]}
      />

      {/* ── Importação ────────────────────────────────────────────── */}
      <DocsImport
        title={tContent("import.title")}
        description={tContent("import.basic")}
        code={codeImportBasic}
        secondaryDescription={tContent("import.withDialog")}
        secondaryCode={codeImportWithDialog}
      />

      {/* ── Variantes ─────────────────────────────────────────────── */}
      <DocsCompositions
        id="variantes"
        title={tContent("variants.title")}
        note={tContent("variants.note")}
        useWhenLabel={tNav("common.useWhen")}
        componentSlug="command"
        items={[
          {
            name: "inline",
            description: stripHtml(tContent("variants.items.inline")),
            code: codeInline,
            preview: (
              <div className="nds-w-full nds-max-w-sm nds-border-default nds-rounded-md nds-shadow-md">
                <Command>
                  <CommandInput placeholder={labels.searchPlaceholder} />
                  <CommandList>
                    <CommandEmpty>{labels.emptyMessage}</CommandEmpty>
                    <CommandGroup heading={labels.groupComponents}>
                      <CommandItem value="button">
                        <LayoutIcon />
                        {labels.itemButton}
                      </CommandItem>
                      <CommandItem value="input">
                        <TypeIcon />
                        {labels.itemInput}
                      </CommandItem>
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup heading={labels.groupUtils}>
                      <CommandItem value="separator">
                        <MinusIcon />
                        {labels.itemSeparator}
                      </CommandItem>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </div>
            ),
          },
          {
            name: "command palette",
            description: stripHtml(tContent("variants.items.palette")),
            code: codePalette,
            preview: (
              <CommandPaletteDemo
                openLabel={labels.openPalette}
                shortcutHint={labels.shortcutHint}
                shortcutKey={labels.shortcutKey}
                searchPlaceholder={labels.searchPlaceholder}
                emptyMessage={labels.emptyMessage}
                groupComponents={labels.groupComponents}
                groupUtils={labels.groupUtils}
                itemButton={labels.itemButton}
                itemInput={labels.itemInput}
                itemSeparator={labels.itemSeparator}
                dialogTitle={labels.dialogTitle}
                dialogDescription={labels.dialogDescription}
              />
            ),
          },
          {
            name: tContent("variants.items.withGroups.name"),
            description: tContent("variants.items.withGroups.description"),
            useWhen: tContent("variants.items.withGroups.use"),
            code: `<Command>
  <CommandInput placeholder="Buscar componente..." />
  <CommandList>
    <CommandEmpty>${labels.emptyMessage}</CommandEmpty>
    <CommandGroup heading="Componentes">
      <CommandItem value="button">Button</CommandItem>
      <CommandItem value="input">Input</CommandItem>
      <CommandItem value="badge">Badge</CommandItem>
      <CommandItem value="separator">Separator</CommandItem>
    </CommandGroup>
    <CommandSeparator />
    <CommandGroup heading="Utilitários">
      <CommandItem value="cn">cn()</CommandItem>
      <CommandItem value="clsx">clsx()</CommandItem>
      <CommandItem value="twmerge">twMerge()</CommandItem>
    </CommandGroup>
  </CommandList>
</Command>`,
            preview: (
              <div className="nds-w-sm nds-border-default nds-rounded-md nds-shadow-md">
                <Command>
                  <CommandInput placeholder="Buscar componente..." />
                  <CommandList>
                    <CommandEmpty>{labels.emptyMessage}</CommandEmpty>
                    <CommandGroup heading="Componentes">
                      <CommandItem value="button">Button</CommandItem>
                      <CommandItem value="input">Input</CommandItem>
                      <CommandItem value="badge">Badge</CommandItem>
                      <CommandItem value="separator">Separator</CommandItem>
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup heading="Utilitários">
                      <CommandItem value="cn">cn()</CommandItem>
                      <CommandItem value="clsx">clsx()</CommandItem>
                      <CommandItem value="twmerge">twMerge()</CommandItem>
                    </CommandGroup>
                  </CommandList>
                </Command>
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
            label: tContent("states.empty.label"),
            trigger: toPlainText(tContent("states.empty.trigger")),
            behavior: toPlainText(tContent("states.empty.behavior")),
          },
          {
            label: tContent("states.selected.label"),
            trigger: toPlainText(tContent("states.selected.trigger")),
            behavior: toPlainText(tContent("states.selected.behavior")),
          },
          {
            label: tContent("states.disabled.label"),
            trigger: toPlainText(tContent("states.disabled.trigger")),
            behavior: toPlainText(tContent("states.disabled.behavior")),
          },
          {
            label: tContent("states.loading.label"),
            trigger: toPlainText(tContent("states.loading.trigger")),
            behavior: toPlainText(tContent("states.loading.behavior")),
          },
          {
            label: tContent("states.longList.label"),
            trigger: toPlainText(tContent("states.longList.trigger")),
            behavior: toPlainText(tContent("states.longList.behavior")),
          },
        ]}
      />

      {/* ── Propriedades ──────────────────────────────────────────── */}
      <DocsProps
        title={tContent("props.title")}
        tables={[
          {
            title: tContent("props.commandTitle"),
            cols: {
              prop: tContent("props.table.prop"),
              type: tContent("props.table.type"),
              default: tContent("props.table.default"),
              required: tContent("props.table.required"),
              description: tContent("props.table.description"),
            },
            items: [
              {
                name: "filter",
                type: "(value, search, keywords?) => number",
                defaultValue: "—",
                required: "Não",
                description: toPlainText(tContent("props.table.commandFilter")),
              },
              {
                name: "value",
                type: "string",
                defaultValue: "—",
                required: "Não",
                description: tContent("props.table.commandValue"),
              },
              {
                name: "onValueChange",
                type: "(value: string) => void",
                defaultValue: "—",
                required: "Não",
                description: tContent("props.table.commandOnValueChange"),
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
            title: tContent("props.commandInputTitle"),
            cols: {
              prop: tContent("props.table.prop"),
              type: tContent("props.table.type"),
              default: tContent("props.table.default"),
              required: tContent("props.table.required"),
              description: tContent("props.table.description"),
            },
            items: [
              {
                name: "placeholder",
                type: "string",
                defaultValue: "—",
                required: "Não",
                description: tContent("props.table.inputPlaceholder"),
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
            title: tContent("props.commandItemTitle"),
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
                required: "Sim",
                description: tContent("props.table.itemValue"),
              },
              {
                name: "onSelect",
                type: "(value: string) => void",
                defaultValue: "—",
                required: "Não",
                description: tContent("props.table.itemOnSelect"),
              },
              {
                name: "disabled",
                type: "boolean",
                defaultValue: "false",
                required: "Não",
                description: toPlainText(tContent("props.table.itemDisabled")),
              },
              {
                // O conteúdo compartilhado ainda não tem chave de descrição
                // para esta propriedade, embora documente o estado em
                // "Estados" e na Anatomia. Literal aqui, como já é o caso de
                // open/onOpenChange no CommandDialog.
                name: "checked",
                type: "boolean",
                defaultValue: "—",
                required: "Não",
                description:
                  toPlainText(tContent("states.selected.behavior")),
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
            title: tContent("props.commandDialogTitle"),
            cols: {
              prop: tContent("props.table.prop"),
              type: tContent("props.table.type"),
              default: tContent("props.table.default"),
              required: tContent("props.table.required"),
              description: tContent("props.table.description"),
            },
            items: [
              {
                name: "title",
                type: "string",
                defaultValue: '"Command Palette"',
                required: "Não",
                description: toPlainText(tContent("props.table.dialogTitle")),
              },
              {
                name: "description",
                type: "string",
                defaultValue: '"Search for a command..."',
                required: "Não",
                description: toPlainText(tContent("props.table.dialogDescription")),
              },
              {
                name: "showCloseButton",
                type: "boolean",
                defaultValue: "false",
                required: "Não",
                description: toPlainText(tContent("props.table.dialogShowCloseButton")),
              },
              {
                name: "open",
                type: "boolean",
                defaultValue: "false",
                required: "Não",
                description: "Controla o estado aberto/fechado do dialog.",
              },
              {
                name: "onOpenChange",
                type: "(open: boolean) => void",
                defaultValue: "—",
                required: "Não",
                description: "Callback disparado quando o estado de abertura muda.",
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
        // Seletor REAL lido de docs/shared/styles/nds/command.css. A coluna
        // trazia vocabulário do framework que saiu do projeto (`bg-popover`,
        // `data-selected:bg-muted`, `rounded-xl`), que não existe em lugar
        // nenhum da folha — customização inerte para quem copiasse.
        items={[
          { token: "--popover", value: ".nds-command", description: toPlainText(tContent("tokens.table.popoverBg")) },
          { token: "--popover-foreground", value: ".nds-command", description: toPlainText(tContent("tokens.table.popoverFg")) },
          { token: "--muted-foreground", value: ".nds-command-group-heading", description: toPlainText(tContent("tokens.table.mutedFg")) },
          { token: "--popover", value: ".nds-command-input", description: toPlainText(tContent("tokens.table.inputBg")) },
          { token: "--border", value: ".nds-command-input-wrapper", description: toPlainText(tContent("tokens.table.inputBorder")) },
          { token: "--accent", value: '.nds-command-item[aria-selected="true"]', description: toPlainText(tContent("tokens.table.selectedBg")) },
          { token: "--accent-foreground", value: '.nds-command-item[aria-selected="true"]', description: toPlainText(tContent("tokens.table.selectedFg")) },
          { token: "--border", value: ".nds-command-separator", description: toPlainText(tContent("tokens.table.border")) },
          { token: "--radius", value: ".nds-command · .nds-command-item", description: toPlainText(tContent("tokens.table.radius")) },
        ]}
        customizationTitle={tContent("tokens.customizationTitle")}
        customizationCode={codeCustomizationTokens}
      />

      {/* ── Acessibilidade ────────────────────────────────────────── */}
      <DocsAccessibility
        screenReaderTitle={tNav("common.screenReader")}
        screenReaderItems={screenReaderItems}
        title={tContent("accessibility.title")}
        summary={tContent("accessibility.summary")}
        items={[
          tContent("accessibility.item1"),
          tContent("accessibility.item2"),
          tContent("accessibility.item3"),
        ]}
        keyboardTitle={tNav("common.keyboard")}
        // As linhas de teclado escrevem textNode: toda descrição passa por
        // toPlainText, senão um <code> no conteúdo compartilhado apareceria
        // literal na tela.
        keyboardItems={[
          { key: "Arrow Down", description: toPlainText(tContent("accessibility.keyboard.arrowDown")) },
          { key: "Arrow Up", description: toPlainText(tContent("accessibility.keyboard.arrowUp")) },
          { key: "Enter", description: toPlainText(tContent("accessibility.keyboard.enter")) },
          { key: "Esc", description: toPlainText(tContent("accessibility.keyboard.escape")) },
          { key: "Tab", description: toPlainText(tContent("accessibility.keyboard.tab")) },
          { key: "⌘K", description: toPlainText(tContent("accessibility.keyboard.cmdK")) },
        ]}
      />

      {/* ── Relacionados ──────────────────────────────────────────── */}
      <DocsRelated
        title={tContent("related.title")}
        items={[
          {
            name: "Select",
            description: toPlainText(tContent("related.select")),
            path: "?path=/docs/ui-select--docs",
          },
          {
            name: "DropdownMenu",
            description: toPlainText(tContent("related.dropdownMenu")),
            path: "?path=/docs/ui-dropdownmenu--docs",
          },
          {
            name: "Dialog",
            description: toPlainText(tContent("related.dialog")),
            path: "?path=/docs/ui-dialog--docs",
          },
          {
            name: "InputGroup",
            description: toPlainText(tContent("related.inputGroup")),
            path: "?path=/docs/ui-inputgroup--docs",
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
          trigger: toPlainText(tContent("analytics.table.trigger")),
          payload: tContent("analytics.table.payload"),
        }}
        items={[
          {
            event: tContent("analytics.table.itemSelect"),
            trigger: toPlainText(tContent("analytics.table.itemSelectTrigger")),
            payload: tContent("analytics.table.itemSelectPayload"),
          },
          {
            event: tContent("analytics.table.paletteOpen"),
            trigger: toPlainText(tContent("analytics.table.paletteOpenTrigger")),
            payload: tContent("analytics.table.paletteOpenPayload"),
          },
          {
            event: tContent("analytics.table.pageView"),
            trigger: toPlainText(tContent("analytics.table.pageViewTrigger")),
            payload: tContent("analytics.table.pageViewPayload"),
          },
          {
            event: tContent("analytics.table.sectionViewed"),
            trigger: toPlainText(tContent("analytics.table.sectionViewedTrigger")),
            payload: tContent("analytics.table.sectionViewedPayload"),
          },
          {
            event: tContent("analytics.table.langSwitch"),
            trigger: toPlainText(tContent("analytics.table.langSwitchTrigger")),
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
              criterion: tContent("testes.accessibility.item1"),
              level: "AA",
              how: "axe-core",
            },
            {
              criterion: tContent("testes.accessibility.item2"),
              level: "AA",
              how: "teclado manual",
            },
            {
              criterion: tContent("testes.accessibility.item3"),
              level: "AA",
              how: "leitor de tela",
            },
            {
              criterion: tContent("testes.accessibility.item4"),
              level: "AA",
              how: "teclado manual",
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
          ],
        }}
      />
    </DocsPageLayout>
  );
}
