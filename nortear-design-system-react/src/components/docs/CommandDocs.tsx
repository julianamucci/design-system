import { useCallback, useEffect, useMemo, useState } from "react";

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
import { toPlainText } from "@/lib/strip-html";

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

// ─── Demonstrações ────────────────────────────────────────────────────────────

/** Os onze rótulos de `demonstration.labels` — todos os que existem. */
type CommandLabels = {
  searchPlaceholder: string;
  emptyMessage: string;
  groupComponents: string;
  groupUtils: string;
  itemButton: string;
  itemInput: string;
  itemSeparator: string;
  shortcutKey: string;
  openPalette: string;
  dialogTitle: string;
  dialogDescription: string;
};

/**
 * Seção da docs page de onde o gesto saiu (guideline 07). A demonstração, as
 * Variantes e o Do & Don't renderizam paleta VIVA: escolher um comando em
 * qualquer uma delas é tão real quanto na outra, e cravar uma seção só juntaria
 * as três num balde no GA4.
 */
type DocsLocation = "docs_demo" | "docs_variantes" | "docs_do_dont";

/** Chave estável do grupo — nunca o cabeçalho traduzido. */
type GroupKey = "components" | "utils";

/**
 * `command_item_select` com VALORES estáveis: o `value` do comando e a chave
 * do grupo. Mandar o texto exibido dividiria um evento em três no GA4, um por
 * idioma.
 */
function trackItemSelect(
  label: string,
  group: GroupKey,
  pattern: "inline" | "palette",
  location: DocsLocation,
) {
  track("command_item_select", { component: "command", label, group, pattern, location });
}

/**
 * Moldura das paletas desenhadas direto na página — a paleta não tem borda nem
 * sombra próprias (PRD §1): quem dá moldura é quem a hospeda.
 */
const FRAMED = "nds-w-full nds-max-w-sm nds-border-default nds-rounded-md nds-shadow-md";

/**
 * Gatilho da paleta: botão com o texto visível e, DENTRO dele, a dica do
 * atalho num `<kbd>`. Sem `aria-label` — o nome acessível sai do que se lê
 * (WCAG 2.5.3), e é por isso que a dica mora dentro do botão e não ao lado.
 * O par de Do & Don't usa o mesmo gatilho sem a dica, que é o contraste.
 */
function PaletteTrigger({
  label,
  shortcutKey,
  dialogOpen,
  onClick,
}: {
  label: string;
  /** Ausente, o gatilho não conta que o atalho existe — o lado "don't". */
  shortcutKey?: string;
  /**
   * Só o gatilho que ABRE um diálogo de verdade recebe o estado dele — e é
   * então que ganha `aria-haspopup="dialog"` e `aria-expanded`, como o Dialog
   * do Vanilla escreve no dele. O gatilho estático (Do & Don't, card de
   * Variantes) fica sem os dois: anunciaria um diálogo que não existe.
   */
  dialogOpen?: boolean;
  onClick?: () => void;
}) {
  const opensDialog = dialogOpen !== undefined;
  return (
    <Button
      variant="outline"
      aria-haspopup={opensDialog ? "dialog" : undefined}
      aria-expanded={opensDialog ? dialogOpen : undefined}
      onClick={onClick}
    >
      {label}
      {shortcutKey !== undefined && <kbd className="nds-kbd">{shortcutKey}</kbd>}
    </Button>
  );
}

/**
 * O uso inline: a paleta direto na página, sem ícone e sem atalho — dois
 * grupos e o divisor entre eles.
 */
function InlineCommandDemo({
  labels,
  location,
}: {
  labels: CommandLabels;
  location: DocsLocation;
}) {
  return (
    <div className={FRAMED}>
      <Command>
        <CommandInput placeholder={labels.searchPlaceholder} />
        <CommandList>
          <CommandGroup heading={labels.groupComponents}>
            <CommandItem
              value="button"
              onSelect={() => trackItemSelect("button", "components", "inline", location)}
            >
              {labels.itemButton}
            </CommandItem>
            <CommandItem
              value="input"
              onSelect={() => trackItemSelect("input", "components", "inline", location)}
            >
              {labels.itemInput}
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading={labels.groupUtils}>
            <CommandItem
              value="separator"
              onSelect={() => trackItemSelect("separator", "utils", "inline", location)}
            >
              {labels.itemSeparator}
            </CommandItem>
          </CommandGroup>
        </CommandList>
        <CommandEmpty>{labels.emptyMessage}</CommandEmpty>
      </Command>
    </div>
  );
}

/**
 * O conteúdo da paleta — os comandos da demonstração, com o atalho de cada um.
 * O atalho é só desenho (C5): ninguém registra Ctrl+B aqui, e o texto dele
 * entra no nome acessível do comando.
 *
 * Uma cópia só para os dois lugares que a desenham: dentro do Dialog da
 * demonstração e, aberta na página, no card "palette" de Variantes.
 */
function PaletteCommand({
  labels,
  onRun,
}: {
  labels: CommandLabels;
  onRun: (value: string, group: GroupKey) => void;
}) {
  return (
    <Command>
      <CommandInput placeholder={labels.searchPlaceholder} />
      <CommandList>
        <CommandGroup heading={labels.groupComponents}>
          <CommandItem value="button" onSelect={() => onRun("button", "components")}>
            {labels.itemButton}
            <CommandShortcut>Ctrl+B</CommandShortcut>
          </CommandItem>
          <CommandItem value="input" onSelect={() => onRun("input", "components")}>
            {labels.itemInput}
            <CommandShortcut>Ctrl+I</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading={labels.groupUtils}>
          <CommandItem value="separator" onSelect={() => onRun("separator", "utils")}>
            {labels.itemSeparator}
          </CommandItem>
        </CommandGroup>
      </CommandList>
      <CommandEmpty>{labels.emptyMessage}</CommandEmpty>
    </Command>
  );
}

/**
 * A paleta de verdade: gatilho, Dialog com título e descrição só para leitor
 * de tela, e comandos que EXECUTAM e fecham. O estado aberto vem de fora
 * porque a página também a abre pelo Ctrl+K.
 */
function CommandPaletteDemo({
  labels,
  location,
  open,
  onOpenChange,
}: {
  labels: CommandLabels;
  location: DocsLocation;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const run = (value: string, group: GroupKey) => {
    trackItemSelect(value, group, "palette", location);
    onOpenChange(false);
  };

  return (
    <>
      <PaletteTrigger
        label={labels.openPalette}
        shortcutKey={labels.shortcutKey}
        dialogOpen={open}
        onClick={() => {
          onOpenChange(true);
          track("command_palette_open", { component: "command", trigger: "button", location });
        }}
      />
      <CommandDialog
        open={open}
        onOpenChange={onOpenChange}
        title={labels.dialogTitle}
        description={labels.dialogDescription}
      >
        <PaletteCommand labels={labels} onRun={run} />
      </CommandDialog>
    </>
  );
}

/**
 * O card "palette" de Variantes — retrato do padrão, na forma do Vanilla: o
 * gatilho e, embaixo, a paleta como ela fica dentro do Dialog. O gatilho é
 * ESTÁTICO: não abre nada, não emite `command_palette_open` e não declara
 * `aria-haspopup`/`aria-expanded`. A paleta que abre de verdade é a da
 * demonstração; aqui o card põe as duas peças lado a lado, para comparar com
 * os outros cards.
 */
function PalettePortrait({ labels }: { labels: CommandLabels }) {
  return (
    <div className="nds-stack nds-p-2" data-spacing="xs" data-align="start">
      <PaletteTrigger label={labels.openPalette} shortcutKey={labels.shortcutKey} />
      <div className={FRAMED}>
        <PaletteCommand
          labels={labels}
          onRun={(value, group) => trackItemSelect(value, group, "palette", "docs_variantes")}
        />
      </div>
    </div>
  );
}

/**
 * O card "withGroups" de Variantes: sete comandos em dois grupos nomeados, com
 * o divisor entre eles. Cada escolha mede como a do card inline — `label` é o
 * VALOR do comando e `group` a chave estável do bloco.
 */
const WITH_GROUPS_ITEMS: ReadonlyArray<{ value: string; label: string; group: GroupKey }> = [
  { value: "button", label: "Button", group: "components" },
  { value: "input", label: "Input", group: "components" },
  { value: "badge", label: "Badge", group: "components" },
  { value: "separator", label: "Separator", group: "components" },
  { value: "cn", label: "cn()", group: "utils" },
  { value: "clsx", label: "clsx()", group: "utils" },
  { value: "twmerge", label: "twMerge()", group: "utils" },
];

function WithGroupsDemo({ labels }: { labels: CommandLabels }) {
  const block = (group: GroupKey) =>
    WITH_GROUPS_ITEMS.filter((item) => item.group === group).map((item) => (
      <CommandItem
        key={item.value}
        value={item.value}
        onSelect={() => trackItemSelect(item.value, item.group, "inline", "docs_variantes")}
      >
        {item.label}
      </CommandItem>
    ));

  return (
    <div className={FRAMED}>
      <Command>
        <CommandInput placeholder={labels.searchPlaceholder} />
        <CommandList>
          <CommandGroup heading={labels.groupComponents}>{block("components")}</CommandGroup>
          <CommandSeparator />
          <CommandGroup heading={labels.groupUtils}>{block("utils")}</CommandGroup>
        </CommandList>
        <CommandEmpty>{labels.emptyMessage}</CommandEmpty>
      </Command>
    </div>
  );
}

/** A busca sem correspondência que os dois lados do par 1 já trazem digitada. */
const EMPTY_SEARCH = "xyz";

/**
 * O par 1 de Do & Don't: a MESMA busca sem resultado nos dois lados, e o que
 * muda é haver ou não uma frase para ler. Sem a busca digitada, o lado errado
 * era idêntico ao certo — a legenda descrevia uma diferença que a tela não
 * mostrava.
 *
 * A paleta é viva: apagada a busca, escolher um comando aqui é tão real quanto
 * na demonstração, e mede com a seção de onde saiu. Os dois comandos moram num
 * grupo sem cabeçalho (a caixa dá o padding); a chave de grupo no payload é a
 * do bloco a que eles pertencem na demonstração.
 */
function EmptySearchPreview({
  labels,
  withEmptyMessage,
}: {
  labels: CommandLabels;
  withEmptyMessage: boolean;
}) {
  const [search, setSearch] = useState(EMPTY_SEARCH);

  return (
    <div className="nds-w-full nds-max-w-sm nds-border-default nds-rounded-md">
      <Command>
        <CommandInput
          placeholder={labels.searchPlaceholder}
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandGroup>
            <CommandItem
              value="button"
              onSelect={() => trackItemSelect("button", "components", "inline", "docs_do_dont")}
            >
              {labels.itemButton}
            </CommandItem>
            <CommandItem
              value="input"
              onSelect={() => trackItemSelect("input", "components", "inline", "docs_do_dont")}
            >
              {labels.itemInput}
            </CommandItem>
          </CommandGroup>
        </CommandList>
        {withEmptyMessage && <CommandEmpty>{labels.emptyMessage}</CommandEmpty>}
      </Command>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function CommandDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(commandTranslations);

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria.
  // O `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
  const screenReaderItems = useMemo(
    () =>
      Object.entries(
        (commandTranslations as unknown as Record<
          string,
          { accessibility?: { screenReader?: Record<string, string> } }
        >)[locale]?.accessibility?.screenReader ?? {},
      )
        .filter(([key]) => key !== "title")
        .map(([, value]) => value),
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

  // ─── A paleta da demonstração, e o atalho que a dica promete ────────────────
  //
  // A dica `Ctrl+K` está no gatilho, então a página responde a ela: dica que a
  // página não honra é promessa falsa na frente de quem está aprendendo o
  // componente. O ouvinte vive enquanto a página está montada e só ABRE: com a
  // paleta já aberta, nada. A tecla não disputa com as paletas inline da
  // página — o `Command` desliga os atalhos de estilo vim da lib, que usavam o
  // mesmo Ctrl+K para subir o destaque.
  const [demoPaletteOpen, setDemoPaletteOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "k" || !(event.ctrlKey || event.metaKey)) return;
      // Sem isto o navegador leva o atalho para a barra de endereço.
      event.preventDefault();
      if (demoPaletteOpen) return;
      setDemoPaletteOpen(true);
      track("command_palette_open", {
        component: "command",
        trigger: "keyboard",
        location: "docs_demo",
      });
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [demoPaletteOpen]);

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
  <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
</Command>`;

  const codePalette = `const [open, setOpen] = useState(false);

// Atalho global: só ABRE. O cleanup impede que o listener sobreviva à página.
useEffect(() => {
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key.toLowerCase() !== "k" || !(event.ctrlKey || event.metaKey)) return;
    event.preventDefault();
    setOpen(true);
  };
  window.addEventListener("keydown", onKeyDown);
  return () => window.removeEventListener("keydown", onKeyDown);
}, []);

// Escolher executa E fecha — a paleta não se fecha sozinha.
const run = (value: string) => {
  handleSelect(value);
  setOpen(false);
};

<Button
  variant="outline"
  aria-haspopup="dialog"
  aria-expanded={open}
  onClick={() => setOpen(true)}
>
  Buscar
  <kbd className="nds-kbd">Ctrl+K</kbd>
</Button>
<CommandDialog
  open={open}
  onOpenChange={setOpen}
  title="Command Palette"
  description="Busque por um comando ou ação..."
>
  <Command>
    <CommandInput placeholder="Buscar componente..." />
    <CommandList>
      <CommandGroup heading="Componentes">
        <CommandItem value="button" onSelect={run}>
          Button
          <CommandShortcut>Ctrl+B</CommandShortcut>
        </CommandItem>
        <CommandItem value="input" onSelect={run}>
          Input
          <CommandShortcut>Ctrl+I</CommandShortcut>
        </CommandItem>
      </CommandGroup>
      <CommandSeparator />
      <CommandGroup heading="Utilitários">
        <CommandItem value="separator" onSelect={run}>
          Separator
        </CommandItem>
      </CommandGroup>
    </CommandList>
    <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
  </Command>
</CommandDialog>`;

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
  /**
   * Vira data-checked no elemento, e a marca só entra no item quando há valor:
   * a folha a acende à direita no marcado.
   */
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

  const labels: CommandLabels = {
    searchPlaceholder: tContent("demonstration.labels.searchPlaceholder"),
    emptyMessage: tContent("demonstration.labels.emptyMessage"),
    groupComponents: tContent("demonstration.labels.groupComponents"),
    groupUtils: tContent("demonstration.labels.groupUtils"),
    itemButton: tContent("demonstration.labels.itemButton"),
    itemInput: tContent("demonstration.labels.itemInput"),
    itemSeparator: tContent("demonstration.labels.itemSeparator"),
    shortcutKey: tContent("demonstration.labels.shortcutKey"),
    openPalette: tContent("demonstration.labels.openPalette"),
    dialogTitle: tContent("demonstration.labels.dialogTitle"),
    dialogDescription: tContent("demonstration.labels.dialogDescription"),
  };

  // Coluna "Obrigatório" no idioma da página, não em pt fixo.
  const isRequired = tNav("common.yes");
  const notRequired = tNav("common.no");

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
      <DocsDemonstration >
        {/*
         * Os dois usos, e nada além deles: a paleta inline na página e a paleta
         * real num Dialog, aberta pelo gatilho ou pelo Ctrl+K da página.
         */}
        <div className="nds-w-full nds-stack" data-spacing="xl" data-align="start">
          <InlineCommandDemo labels={labels} location="docs_demo" />
          <CommandPaletteDemo
            labels={labels}
            location="docs_demo"
            open={demoPaletteOpen}
            onOpenChange={setDemoPaletteOpen}
          />
        </div>
      </DocsDemonstration>

      {/* ── Anatomia ──────────────────────────────────────────────── */}
      <DocsAnatomy
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
        pairs={[
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            // Os dois lados já nascem com a MESMA busca sem correspondência; o
            // que muda é haver ou não uma frase para ler.
            doPreview: <EmptySearchPreview labels={labels} withEmptyMessage />,
            dontPreview: <EmptySearchPreview labels={labels} withEmptyMessage={false} />,
            doCaption: toPlainText(tContent("doDont.pair1.do")),
            dontCaption: toPlainText(tContent("doDont.pair1.dont")),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            // O mesmo gatilho da demonstração, com a dica DENTRO dele.
            doPreview: (
              <PaletteTrigger label={labels.openPalette} shortcutKey={labels.shortcutKey} />
            ),
            // Sem dica de atalho: o gatilho não conta que a paleta existe, e
            // é a AUSÊNCIA que faz o contraste com o "do" ao lado.
            //
            // Aqui já morou um `Ctrl+K` riscado com `opacity: 0.4` em `style`
            // inline, e ele errava duas vezes: o valor de design fugia do tema
            // pela regra do inline, e o texto resultante media 1,75:1 contra
            // os 4,5:1 que o axe cobra. Riscar o que não deve existir também
            // ensina o contrário do que a legenda diz: o erro não é mostrar o
            // atalho errado, é não mostrar atalho nenhum.
            dontPreview: <PaletteTrigger label={labels.openPalette} />,
            doCaption: toPlainText(tContent("doDont.pair2.do")),
            dontCaption: toPlainText(tContent("doDont.pair2.dont")),
          },
        ]}
      />

      {/* ── Importação ────────────────────────────────────────────── */}
      <DocsImport
        description={tContent("import.basic")}
        code={codeImportBasic}
        secondaryDescription={tContent("import.withDialog")}
        secondaryCode={codeImportWithDialog}
      />

      {/* ── Variantes ─────────────────────────────────────────────── */}
      <DocsCompositions
        id="variantes"
        note={tContent("variants.note")}
        useWhenLabel={tNav("common.useWhen")}
        componentSlug="command"
        items={[
          // Título e descrição saem do conteúdo compartilhado; o id de
          // rastreio e de snippet é a CHAVE do card, que não muda com o idioma.
          {
            trackId: "inline",
            name: tContent("variants.items.inline.name"),
            description: tContent("variants.items.inline.description"),
            code: codeInline,
            preview: <InlineCommandDemo labels={labels} location="docs_variantes" />,
          },
          {
            trackId: "palette",
            name: tContent("variants.items.palette.name"),
            description: tContent("variants.items.palette.description"),
            code: codePalette,
            preview: <PalettePortrait labels={labels} />,
          },
          {
            trackId: "withGroups",
            name: tContent("variants.items.withGroups.name"),
            description: tContent("variants.items.withGroups.description"),
            useWhen: tContent("variants.items.withGroups.use"),
            code: `<Command>
  <CommandInput placeholder="Buscar componente..." />
  <CommandList>
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
  <CommandEmpty>${labels.emptyMessage}</CommandEmpty>
</Command>`,
            preview: <WithGroupsDemo labels={labels} />,
          },
        ]}
      />

      {/* ── Estados ───────────────────────────────────────────────── */}
      <DocsStates
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
            label: tContent("states.highlighted.label"),
            trigger: toPlainText(tContent("states.highlighted.trigger")),
            behavior: toPlainText(tContent("states.highlighted.behavior")),
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
                required: notRequired,
                description: toPlainText(tContent("props.table.commandFilter")),
              },
              {
                name: "value",
                type: "string",
                defaultValue: "—",
                required: notRequired,
                description: tContent("props.table.commandValue"),
              },
              {
                name: "onValueChange",
                type: "(value: string) => void",
                defaultValue: "—",
                required: notRequired,
                description: tContent("props.table.commandOnValueChange"),
              },
              {
                name: "className",
                type: "string",
                defaultValue: "—",
                required: notRequired,
                description: tContent("props.table.className"),
              },
              {
                name: "children",
                type: "React.ReactNode",
                defaultValue: "—",
                required: isRequired,
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
                required: notRequired,
                description: tContent("props.table.inputPlaceholder"),
              },
              {
                name: "className",
                type: "string",
                defaultValue: "—",
                required: notRequired,
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
                required: isRequired,
                description: tContent("props.table.itemValue"),
              },
              {
                name: "onSelect",
                type: "(value: string) => void",
                defaultValue: "—",
                required: notRequired,
                description: tContent("props.table.itemOnSelect"),
              },
              {
                name: "disabled",
                type: "boolean",
                defaultValue: "false",
                required: notRequired,
                description: toPlainText(tContent("props.table.itemDisabled")),
              },
              {
                name: "checked",
                type: "boolean",
                defaultValue: "—",
                required: notRequired,
                description: toPlainText(tContent("props.table.checked")),
              },
              {
                name: "className",
                type: "string",
                defaultValue: "—",
                required: notRequired,
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
                required: notRequired,
                description: toPlainText(tContent("props.table.dialogTitle")),
              },
              {
                name: "description",
                type: "string",
                // O default REAL do `CommandDialog` (command.tsx), em inglês
                // porque é o que o componente renderiza sem a prop.
                defaultValue: '"Search for a command to run..."',
                required: notRequired,
                description: toPlainText(tContent("props.table.dialogDescription")),
              },
              {
                name: "showCloseButton",
                type: "boolean",
                defaultValue: "false",
                required: notRequired,
                description: toPlainText(tContent("props.table.dialogShowCloseButton")),
              },
              {
                name: "open",
                type: "boolean",
                defaultValue: "false",
                required: notRequired,
                description: toPlainText(tContent("props.table.open")),
              },
              {
                name: "onOpenChange",
                type: "(open: boolean) => void",
                defaultValue: "—",
                required: notRequired,
                description: toPlainText(tContent("props.table.onOpenChange")),
              },
              {
                name: "children",
                type: "React.ReactNode",
                defaultValue: "—",
                required: isRequired,
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
          { token: "--foreground", value: ".nds-command-group", description: toPlainText(tContent("tokens.table.groupFg")) },
          { token: "--muted-foreground", value: ".nds-command-group-heading", description: toPlainText(tContent("tokens.table.mutedFg")) },
          // `inputBg` ficou de fora: `.nds-command-input` declara `background:
          // transparent` e quem pinta é o container. Uma linha dizendo que o campo
          // tem fundo próprio seria falsa, e repetir `.nds-command` duplicaria a
          // primeira linha da tabela.
          { token: "--border", value: ".nds-command-input-wrapper", description: toPlainText(tContent("tokens.table.inputBorder")) },
          { token: "--accent", value: '.nds-command-item[aria-selected="true"]', description: toPlainText(tContent("tokens.table.selectedBg")) },
          { token: "--accent-foreground", value: '.nds-command-item[aria-selected="true"]', description: toPlainText(tContent("tokens.table.selectedFg")) },
          { token: "--border", value: ".nds-command-separator", description: toPlainText(tContent("tokens.table.border")) },
          // O item NÃO usa `--radius`: o raio dele é aninhado, `--radius-sm`
          // (PRD D10). A linha antiga juntava os dois seletores e ensinava que
          // mudar o raio da paleta mudava o do item.
          { token: "--radius", value: ".nds-command", description: toPlainText(tContent("tokens.table.radius")) },
          { token: "--radius-sm", value: ".nds-command-item", description: toPlainText(tContent("tokens.table.radiusSm")) },
        ]}
        customizationTitle={tContent("tokens.customizationTitle")}
        customizationCode={tContent("tokens.customizationCode")}
      />

      {/* ── Acessibilidade ────────────────────────────────────────── */}
      <DocsAccessibility
        screenReaderTitle={tNav("common.screenReader")}
        screenReaderItems={screenReaderItems}
        summary={tContent("accessibility.summary")}
        items={[
          tContent("accessibility.item1"),
          tContent("accessibility.item2"),
          tContent("accessibility.item3"),
        ]}
        keyboardTitle={tNav("common.keyboardNav")}
        // As linhas de teclado escrevem textNode: toda descrição passa por
        // toPlainText, senão um <code> no conteúdo compartilhado apareceria
        // literal na tela.
        keyboardItems={[
          { key: "Arrow Down", description: toPlainText(tContent("accessibility.keyboard.arrowDown")) },
          { key: "Arrow Up", description: toPlainText(tContent("accessibility.keyboard.arrowUp")) },
          { key: "Enter", description: toPlainText(tContent("accessibility.keyboard.enter")) },
          { key: "Escape", description: toPlainText(tContent("accessibility.keyboard.escape")) },
          { key: "Tab", description: toPlainText(tContent("accessibility.keyboard.tab")) },
          { key: "Ctrl+K", description: toPlainText(tContent("accessibility.keyboard.cmdK")) },
        ]}
      />

      {/* ── Relacionados ──────────────────────────────────────────── */}
      <DocsRelated
        items={[
          {
            name: "Select",
            description: toPlainText(tContent("related.select")),
            path: "?path=/docs/components-form-select--docs",
          },
          {
            name: "DropdownMenu",
            description: toPlainText(tContent("related.dropdownMenu")),
            path: "?path=/docs/components-overlay-dropdownmenu--docs",
          },
          {
            name: "Dialog",
            description: toPlainText(tContent("related.dialog")),
            path: "?path=/docs/components-overlay-dialog--docs",
          },
        ]}
      />

      {/* ── Notas ─────────────────────────────────────────────────── */}
      <DocsNotes
        items={[
          { title: "", content: tContent("notes.tip1") },
          { title: "", content: tContent("notes.tip2") },
          { title: "", content: tContent("notes.tip3") },
        ]}
      />

      {/* ── Analytics ─────────────────────────────────────────────── */}
      <DocsAnalytics
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
        functional={{
          title: tContent("testes.functional.title"),
          description: tContent("testes.functional.description"),
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
          description: tContent("testes.accessibility.description"),
          cols: {
            criterion: tNav("common.criterion"),
            level: "WCAG",
            how: tNav("common.howToVerify"),
          },
          // Nível e método sem texto preso a um idioma: o "Como verificar"
          // escrevia "teclado manual" e "leitor de tela" em pt nas três
          // línguas da página.
          items: [1, 2, 3, 4].map((i) => ({
            criterion: tContent(`testes.accessibility.item${i}`),
            level: "AA",
            how: "axe-core / manual",
          })),
        }}
        visual={{
          title: tContent("testes.visual.title"),
          description: tContent("testes.visual.description"),
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
