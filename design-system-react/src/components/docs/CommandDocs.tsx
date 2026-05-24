import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LayoutIcon,
  TypeIcon,
  MinusIcon,
  SearchIcon,
  CheckIcon,
  ChevronsUpDownIcon,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
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


// ─── Combobox demo (usado em Demonstração e Variantes) ───────────────────────

const DEMO_ITEMS = [
  { value: "react", label: "React" },
  { value: "vue", label: "Vue" },
  { value: "svelte", label: "Svelte" },
  { value: "angular", label: "Angular" },
];

function ComboboxDemo({ searchPlaceholder, selectPlaceholder }: { searchPlaceholder: string; selectPlaceholder: string }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-56 justify-between"
        >
          {value ? DEMO_ITEMS.find((f) => f.value === value)?.label : selectPlaceholder}
          <ChevronsUpDownIcon className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>Nenhum resultado.</CommandEmpty>
            <CommandGroup>
              {DEMO_ITEMS.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.value}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  {item.label}
                  <CheckIcon
                    className={cn("ml-auto", value === item.value ? "opacity-100" : "opacity-0")}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

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
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>{shortcutHint}</span>
        <kbd className="rounded border px-1.5 py-0.5 text-xs font-mono bg-muted">{shortcutKey}</kbd>
      </div>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
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
              <CommandItem value="button" onSelect={() => setOpen(false)}>
                <LayoutIcon />
                {itemButton}
                <CommandShortcut>⌘B</CommandShortcut>
              </CommandItem>
              <CommandItem value="input" onSelect={() => setOpen(false)}>
                <TypeIcon />
                {itemInput}
                <CommandShortcut>⌘I</CommandShortcut>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading={groupUtils}>
              <CommandItem value="separator" onSelect={() => setOpen(false)}>
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

  const codeImportWithPopover = `import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";`;

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

  const codeCombobox = `const [open, setOpen] = useState(false);
const [value, setValue] = useState("");

<Popover open={open} onOpenChange={setOpen}>
  <PopoverTrigger asChild>
    <Button
      variant="outline"
      role="combobox"
      aria-expanded={open}
    >
      {value ? items.find((i) => i.value === value)?.label : "Selecione..."}
    </Button>
  </PopoverTrigger>
  <PopoverContent className="p-0">
    <Command>
      <CommandInput placeholder="Buscar item..." />
      <CommandList>
        <CommandEmpty>Nenhum resultado.</CommandEmpty>
        <CommandGroup>
          {items.map((item) => (
            <CommandItem
              key={item.value}
              value={item.value}
              onSelect={(v) => { setValue(v); setOpen(false); }}
            >
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  </PopoverContent>
</Popover>`;

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
  --muted: 240 4.8% 95.9%;
  --border: 240 5.9% 90%;
}

.dark {
  --popover: 240 10% 3.9%;
  --popover-foreground: 0 0% 98%;
  --muted: 240 3.7% 15.9%;
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
    selectPlaceholder: tContent("demonstration.labels.selectPlaceholder"),
    comboboxSearch: tContent("demonstration.labels.comboboxSearch"),
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
          installNote="npx shadcn@latest add command"
          languageSwitcher={<LanguageSwitcher />}
        />
      }
    >
      {/* ── Demonstração ──────────────────────────────────────────── */}
      <DocsDemonstration title={tContent("demonstration.title")}>
        <div className="w-full space-y-8">
          {/* Inline */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Inline
            </p>
            <div className="w-full max-w-sm">
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
          </div>

          {/* Combobox */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Combobox
            </p>
            <ComboboxDemo
              searchPlaceholder={labels.comboboxSearch}
              selectPlaceholder={labels.selectPlaceholder}
            />
          </div>

          {/* Command Palette */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
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
            tContent("usage.guidelines.item6"),
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
              <div className="w-full max-w-xs">
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
              <div className="w-full max-w-xs">
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
            doCaption: tContent("doDont.pair1.do"),
            dontCaption: tContent("doDont.pair1.dont"),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{labels.shortcutHint}</span>
                  <kbd className="rounded border px-1.5 py-0.5 text-xs font-mono bg-muted">{labels.shortcutKey}</kbd>
                </div>
                <Button variant="outline" size="sm">
                  <SearchIcon />
                  {labels.openPalette}
                </Button>
              </div>
            ),
            dontPreview: (
              <div className="flex flex-col items-center gap-3">
                <Button variant="outline" size="sm">
                  <SearchIcon />
                  {labels.openPalette}
                </Button>
                <p className="text-xs text-muted-foreground/40 line-through">⌘K</p>
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
        secondaryDescription={tContent("import.withDialog")}
        secondaryCode={codeImportWithDialog}
        tertiaryDescription={tContent("import.withPopover")}
        tertiaryCode={codeImportWithPopover}
      />

      {/* ── Variantes ─────────────────────────────────────────────── */}
      <DocsVariants
        title={tContent("variants.title")}
        note={tContent("variants.note")}
        items={[
          {
            name: "inline",
            description: stripHtml(tContent("variants.items.inline")),
            code: codeInline,
            preview: (
              <div className="w-full max-w-xs">
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
            name: "combobox",
            description: stripHtml(tContent("variants.items.combobox")),
            code: codeCombobox,
            preview: (
              <ComboboxDemo
                searchPlaceholder={labels.comboboxSearch}
                selectPlaceholder={labels.selectPlaceholder}
              />
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
        ]}
      />

      {/* ── Composições ──────────────────────────────────────────── */}
      <DocsCompositions
        title={tContent("variants.compositionsTitle")}
        useWhenLabel={tNav("common.useWhen")}
        componentSlug="command"
        items={[
          {
            name: tContent("variants.compositions.withGroups.name"),
            description: tContent("variants.compositions.withGroups.description"),
            useWhen: tContent("variants.compositions.withGroups.use"),
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
              <div className="w-full max-w-xs rounded-md border shadow-md">
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
          {
            name: tContent("variants.compositions.withDisabled.name"),
            description: tContent("variants.compositions.withDisabled.description"),
            useWhen: tContent("variants.compositions.withDisabled.use"),
            code: `<Command>
  <CommandInput placeholder="Buscar..." />
  <CommandList>
    <CommandEmpty>${labels.emptyMessage}</CommandEmpty>
    <CommandGroup heading="Componentes">
      <CommandItem value="button">Button</CommandItem>
      <CommandItem value="input" disabled>Input (em breve)</CommandItem>
      <CommandItem value="badge">Badge</CommandItem>
      <CommandItem value="select" disabled>Select (em breve)</CommandItem>
    </CommandGroup>
    <CommandSeparator />
    <CommandGroup heading="Utilitários">
      <CommandItem value="cn">cn()</CommandItem>
      <CommandItem value="clsx" disabled>clsx() (depreciado)</CommandItem>
    </CommandGroup>
  </CommandList>
</Command>`,
            preview: (
              <div className="w-full max-w-xs rounded-md border shadow-md">
                <Command>
                  <CommandInput placeholder="Buscar..." />
                  <CommandList>
                    <CommandEmpty>{labels.emptyMessage}</CommandEmpty>
                    <CommandGroup heading="Componentes">
                      <CommandItem value="button">Button</CommandItem>
                      <CommandItem value="input" disabled>Input (em breve)</CommandItem>
                      <CommandItem value="badge">Badge</CommandItem>
                      <CommandItem value="select" disabled>Select (em breve)</CommandItem>
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup heading="Utilitários">
                      <CommandItem value="cn">cn()</CommandItem>
                      <CommandItem value="clsx" disabled>clsx() (depreciado)</CommandItem>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </div>
            ),
          },
          {
            name: tContent("variants.compositions.longList.name"),
            description: tContent("variants.compositions.longList.description"),
            useWhen: tContent("variants.compositions.longList.use"),
            code: `const items = [
  "Accordion","Alert","AlertDialog","AspectRatio","Avatar",
  "Badge","Breadcrumb","Button","Calendar","Card",
  "Carousel","Chart","Checkbox","Collapsible","Command",
  "ContextMenu","DataTable","DatePicker","Dialog","Drawer",
  "DropdownMenu","Form","HoverCard","Input","InputOTP",
  "Label","Menubar","NavigationMenu","Pagination","Popover",
];

<Command>
  <CommandInput placeholder="Buscar componente..." />
  <CommandList>
    <CommandEmpty>${labels.emptyMessage}</CommandEmpty>
    <CommandGroup heading="Componentes">
      {items.map((label) => (
        <CommandItem key={label} value={label.toLowerCase()}>
          {label}
        </CommandItem>
      ))}
    </CommandGroup>
  </CommandList>
</Command>`,
            preview: (
              <div className="w-full max-w-xs rounded-md border shadow-md">
                <Command>
                  <CommandInput placeholder="Buscar componente..." />
                  <CommandList>
                    <CommandEmpty>{labels.emptyMessage}</CommandEmpty>
                    <CommandGroup heading="Componentes">
                      {[
                        "Accordion","Alert","AlertDialog","AspectRatio","Avatar",
                        "Badge","Breadcrumb","Button","Calendar","Card",
                        "Carousel","Chart","Checkbox","Collapsible","Command",
                        "ContextMenu","DataTable","DatePicker","Dialog","Drawer",
                        "DropdownMenu","Form","HoverCard","Input","InputOTP",
                        "Label","Menubar","NavigationMenu","Pagination","Popover",
                      ].map((label) => (
                        <CommandItem key={label} value={label.toLowerCase()}>
                          {label}
                        </CommandItem>
                      ))}
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
          trigger: tContent("states.cols.trigger"),
          behavior: tContent("states.cols.behavior"),
        }}
        items={[
          {
            label: tContent("states.empty.label"),
            trigger: stripHtml(tContent("states.empty.trigger")),
            behavior: stripHtml(tContent("states.empty.behavior")),
          },
          {
            label: tContent("states.selected.label"),
            trigger: stripHtml(tContent("states.selected.trigger")),
            behavior: stripHtml(tContent("states.selected.behavior")),
          },
          {
            label: tContent("states.disabled.label"),
            trigger: stripHtml(tContent("states.disabled.trigger")),
            behavior: tContent("states.disabled.behavior"),
          },
          {
            label: tContent("states.loading.label"),
            trigger: stripHtml(tContent("states.loading.trigger")),
            behavior: tContent("states.loading.behavior"),
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
                description: stripHtml(tContent("props.table.commandFilter")),
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
                description: stripHtml(tContent("props.table.itemDisabled")),
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
                description: stripHtml(tContent("props.table.dialogTitle")),
              },
              {
                name: "description",
                type: "string",
                defaultValue: '"Search for a command..."',
                required: "Não",
                description: stripHtml(tContent("props.table.dialogDescription")),
              },
              {
                name: "showCloseButton",
                type: "boolean",
                defaultValue: "false",
                required: "Não",
                description: stripHtml(tContent("props.table.dialogShowCloseButton")),
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
        items={[
          { token: "--popover", value: "bg-popover", description: tContent("tokens.table.popoverBg") },
          { token: "--popover-foreground", value: "text-popover-foreground", description: tContent("tokens.table.popoverFg") },
          { token: "--muted-foreground", value: "text-muted-foreground", description: tContent("tokens.table.mutedFg") },
          { token: "--input", value: "bg-input/30", description: tContent("tokens.table.inputBg") },
          { token: "--input", value: "border-input/30", description: tContent("tokens.table.inputBorder") },
          { token: "--muted", value: "data-selected:bg-muted", description: stripHtml(tContent("tokens.table.selectedBg")) },
          { token: "--foreground", value: "data-selected:text-foreground", description: tContent("tokens.table.selectedFg") },
          { token: "--border", value: "bg-border", description: tContent("tokens.table.border") },
          { token: "--radius", value: "rounded-xl / rounded-sm", description: tContent("tokens.table.radius") },
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
        ]}
        keyboardTitle={tNav("common.keyboard")}
        keyboardItems={[
          { key: "↓", description: tContent("accessibility.keyboard.arrowDown") },
          { key: "↑", description: tContent("accessibility.keyboard.arrowUp") },
          { key: "Enter", description: stripHtml(tContent("accessibility.keyboard.enter")) },
          { key: "Esc", description: tContent("accessibility.keyboard.escape") },
          { key: "Tab", description: tContent("accessibility.keyboard.tab") },
          { key: "⌘K", description: tContent("accessibility.keyboard.cmdK") },
        ]}
      />

      {/* ── Relacionados ──────────────────────────────────────────── */}
      <DocsRelated
        title={tContent("related.title")}
        items={[
          {
            name: "Select",
            description: tContent("related.select"),
            path: "?path=/docs/ui-select--docs",
          },
          {
            name: "DropdownMenu",
            description: tContent("related.dropdownMenu"),
            path: "?path=/docs/ui-dropdownmenu--docs",
          },
          {
            name: "Popover",
            description: tContent("related.popover"),
            path: "?path=/docs/ui-popover--docs",
          },
          {
            name: "Dialog",
            description: tContent("related.dialog"),
            path: "?path=/docs/ui-dialog--docs",
          },
          {
            name: "InputGroup",
            description: tContent("related.inputGroup"),
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
          { title: "", content: tContent("notes.tip4") },
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
            event: tContent("analytics.table.itemSelect"),
            trigger: tContent("analytics.table.itemSelectTrigger"),
            payload: tContent("analytics.table.itemSelectPayload"),
          },
          {
            event: tContent("analytics.table.paletteOpen"),
            trigger: tContent("analytics.table.paletteOpenTrigger"),
            payload: tContent("analytics.table.paletteOpenPayload"),
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
            {
              action: tContent("testes.functional.item7.action"),
              result: tContent("testes.functional.item7.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item7.priority")] ?? "common.high"),
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
            {
              criterion: tContent("testes.accessibility.item5"),
              level: "AA",
              how: "axe-core + inspeção DOM",
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
              priority: tNav(priorityKeyMap[tContent("testes.visual.item4.priority")] ?? "common.high"),
            },
            {
              story: tContent("testes.visual.item5.story"),
              priority: tNav(priorityKeyMap[tContent("testes.visual.item5.priority")] ?? "common.medium"),
            },
          ],
        }}
      />
    </DocsPageLayout>
  );
}
