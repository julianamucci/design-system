import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarLabel,
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
import { menuCloseReason } from "@/components/ui/menu-close-reason";
import {
  menubarSnippet,
  type MenubarActionEntry,
  type MenubarEntry,
  type MenubarMenuEntry,
  type MenubarSubmenuEntry,
} from "@/components/ui/menubar.source";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import DOMPurify from 'dompurify';
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
import { DocsCompositions } from "@/components/docs/shared/sections/DocsCompositions";
import { DocsStates } from "@/components/docs/shared/sections/DocsStates";
import { DocsProps } from "@/components/docs/shared/sections/DocsProps";
import { DocsTokens } from "@/components/docs/shared/sections/DocsTokens";
import { DocsAccessibility } from "@/components/docs/shared/sections/DocsAccessibility";
import { DocsRelated } from "@/components/docs/shared/sections/DocsRelated";
import { DocsNotes } from "@/components/docs/shared/sections/DocsNotes";
import { DocsAnalytics } from "@/components/docs/shared/sections/DocsAnalytics";
import { DocsTestes } from "@/components/docs/shared/sections/DocsTestes";
import { stripHtml, toPlainText } from "@/lib/strip-html";

// ─── Helpers ─────────────────────────────────────────────────────────────────

type Translate = (key: string) => string;

const priorityKeyMap: Record<string, string> = {
  high: "common.high",
  medium: "common.medium",
  low: "common.low",
};

/**
 * Varre `base.item1`, `base.item2`, … enquanto existirem no conteúdo.
 *
 * A lista de testes desta página era cravada — nove critérios funcionais e sete
 * de acessibilidade — enquanto o conteúdo já tinha doze e oito: os últimos não
 * existiam para quem lia, sem erro, nos três idiomas. Trocar o número não
 * resolveria; o total cravado É o defeito, e ele volta no item seguinte.
 */
function stringsFromDict(
  t: (key: string, defaultValue?: string) => string,
  base: string,
): string[] {
  const out: string[] = [];
  for (let i = 1; ; i++) {
    const value = t(`${base}.item${i}`, "");
    if (!value) break;
    out.push(value);
  }
  return out;
}

/**
 * A mesma varredura para a lista cujo item é um OBJETO — cenário, critério
 * funcional, story de regressão visual. O primeiro campo é quem decide se o
 * item existe, e os demais acompanham.
 */
function entriesFromDict<K extends string>(
  t: (key: string, defaultValue?: string) => string,
  base: string,
  fields: readonly K[],
): Array<Record<K, string>> {
  const out: Array<Record<K, string>> = [];
  for (let i = 1; ; i++) {
    if (!t(`${base}.item${i}.${fields[0]}`, "")) break;
    out.push(
      Object.fromEntries(
        fields.map((field) => [field, t(`${base}.item${i}.${field}`, "")]),
      ) as Record<K, string>,
    );
  }
  return out;
}

/**
 * Nível WCAG e ferramenta de cada critério de acessibilidade, por índice.
 * Ficam aqui, e não no conteúdo compartilhado, porque são IDENTIFICADORES
 * (número de critério, nome do verificador) e identificador não se traduz.
 * Item novo que chegue além da lista cai no par padrão em vez de sumir.
 */
const A11Y_TEST_LEVELS = ["AA", "1.3.1", "4.1.2", "4.1.2", "4.1.2", "2.4.3", "1.4.3", "2.1.1"];
const A11Y_TEST_HOW = [
  "axe-core",
  "DevTools a11y tree",
  "DevTools attribute",
  "DevTools a11y tree",
  "DevTools a11y tree",
  "Keyboard test",
  "Contrast checker",
  "Keyboard test",
];

// ─── Rastreamento das prévias vivas ───────────────────────────────────────────

/**
 * Onde o menu vive na página e como ele se chama no GA4.
 *
 * `menu` é o id ESTÁVEL do menu: numa barra de um menu só, o id da prévia
 * (`pair1-dont`, `with-shortcuts`); numa barra de vários, o id da prévia
 * seguido do gatilho (`demo-file`, `pair1-do-edit`) — com o mesmo id para os
 * quatro menus da demonstração, abrir Arquivo e abrir Exibir seriam o mesmo
 * evento. `location` é a SEÇÃO da página (guideline 07), e vem sempre de quem
 * monta a barra.
 *
 * Até 2026-09-11 esta página não rastreava nada, e a tabela de Analytics
 * prometia eventos que o tipo nem tinha.
 */
type MenuTracking = { menu: string; location: string };

/**
 * Abertura e fechamento num callback só, porque a lib entrega os dois pelo
 * mesmo `onOpenChange`. O motivo do fechamento sai do vocabulário da família:
 * passar ao menu vizinho pela seta ou pelo ponteiro é `overlay` — a pessoa
 * saiu daquele menu sem escolher nada.
 */
function trackOpenChange({ menu, location }: MenuTracking) {
  return (open: boolean, eventDetails: { reason: string }) => {
    if (open) {
      track("menubar_open", { component: "menubar", menu, location });
      return;
    }
    track("menubar_close", {
      component: "menubar",
      menu,
      reason: menuCloseReason(eventDetails.reason),
      location,
    });
  };
}

/**
 * O `label` do payload é IDENTIFICADOR, nunca o rótulo traduzido: "Salvar",
 * "Save" e "Guardar" chegariam ao GA4 como três ações diferentes.
 */
function trackSelect({ menu, location }: MenuTracking, label: string) {
  return () => track("menubar_item_select", { component: "menubar", label, menu, location });
}

// ─── A barra como dado ────────────────────────────────────────────────────────
//
// Toda barra viva desta página é uma LISTA de menus, cada um com as suas
// entradas (`MenubarEntry`), e é a mesma lista que imprime o código do card
// (`menubarSnippet`) — o desenho do ContextMenu desta stack e do vanilla.

/** Um menu da barra: o id do gatilho (a chave do rótulo, em kebab), o texto e as entradas. */
type BarMenu = MenubarMenuEntry & { id: string };

/** Marcações e grupos de escolha única, pelo id estável de cada um. */
type Selection = Record<string, boolean | string>;

function initialSelection(entries: readonly MenubarEntry[]): Selection {
  const out: Selection = {};
  for (const entry of entries) {
    if (entry.kind === "checkbox") out[entry.value] = entry.checked;
    if (entry.kind === "radio-group") out[entry.value] = entry.selected;
    if (entry.kind === "group") Object.assign(out, initialSelection(entry.items));
  }
  return out;
}

type EntryProps = {
  tracking: MenuTracking;
  selection: Selection;
  select: (value: string, next: boolean | string) => void;
};

/** Item de ação que se reporta ao ser escolhido, com o valor estável dele. */
function ActionItem({ entry, tracking }: { entry: MenubarActionEntry; tracking: MenuTracking }) {
  return (
    <MenubarItem
      onClick={trackSelect(tracking, entry.value)}
      variant={entry.destructive ? "destructive" : "default"}
    >
      {entry.label}
      {entry.shortcut && <MenubarShortcut>{entry.shortcut}</MenubarShortcut>}
    </MenubarItem>
  );
}

/** Submenu — que pode conter outro (é o "evite" do par 2, e ele tem de ser vivo). */
function Submenu({ entry, tracking }: { entry: MenubarSubmenuEntry; tracking: MenuTracking }) {
  return (
    <MenubarSub>
      <MenubarSubTrigger>{entry.label}</MenubarSubTrigger>
      <MenubarSubContent>
        {entry.items.map((item, index) =>
          item.kind === "submenu" ? (
            <Submenu key={index} entry={item} tracking={tracking} />
          ) : (
            <ActionItem key={index} entry={item} tracking={tracking} />
          ),
        )}
      </MenubarSubContent>
    </MenubarSub>
  );
}

function MenuEntries({ entries, ...props }: EntryProps & { entries: readonly MenubarEntry[] }) {
  return (
    <>
      {entries.map((entry, index) => (
        <MenuEntry key={index} entry={entry} {...props} />
      ))}
    </>
  );
}

function MenuEntry({ entry, tracking, selection, select }: EntryProps & { entry: MenubarEntry }) {
  switch (entry.kind) {
    case "item":
      return <ActionItem entry={entry} tracking={tracking} />;
    case "separator":
      return <MenubarSeparator />;
    case "checkbox":
      // Marcar também é escolher: o evento de item sai aqui. O menu segue
      // aberto (C10), e o fechamento seguinte leva o motivo de quem fechou.
      return (
        <MenubarCheckboxItem
          checked={selection[entry.value] === true}
          onCheckedChange={(checked) => {
            select(entry.value, checked);
            trackSelect(tracking, entry.value)();
          }}
        >
          {entry.label}
        </MenubarCheckboxItem>
      );
    case "submenu":
      return <Submenu entry={entry} tracking={tracking} />;
    case "group":
      // O rótulo mora DENTRO do grupo: nesta stack ele é o `Menu.GroupLabel`
      // da base-ui, e sem grupo ancestral LANÇA em tempo de render.
      return (
        <MenubarGroup>
          <MenubarLabel>{entry.label}</MenubarLabel>
          <MenuEntries entries={entry.items} tracking={tracking} selection={selection} select={select} />
        </MenubarGroup>
      );
    case "radio-group":
      // A escolha se reporta pelo CLIQUE na opção, e não pela troca de valor:
      // escolher a opção já marcada também é escolher. O `onClick` pega o
      // teclado junto — Enter e Espaço no item da lib despacham um clique.
      return (
        <MenubarRadioGroup
          value={selection[entry.value]}
          onValueChange={(value: string) => select(entry.value, value)}
        >
          {entry.label && <MenubarLabel>{entry.label}</MenubarLabel>}
          {entry.options.map((option) => (
            <MenubarRadioItem
              key={option.value}
              value={option.value}
              onClick={trackSelect(tracking, option.value)}
            >
              {option.label}
            </MenubarRadioItem>
          ))}
        </MenubarRadioGroup>
      );
  }
}

/**
 * Uma barra viva: os menus descritos por `menus` e o rastreamento de cada um.
 *
 * O estado das marcações mora AQUI, na barra, e não no item: o painel desmonta
 * ao fechar, e estado guardado dentro dele voltaria ao valor inicial a cada
 * abertura. Os menus nascem FECHADOS — vários painéis abertos ao carregar
 * empilhariam por cima do texto da seção.
 */
function BarPreview({
  preview,
  location,
  menus,
}: {
  preview: string;
  location: string;
  menus: readonly BarMenu[];
}) {
  const [selection, setSelection] = useState<Selection>(() =>
    initialSelection(menus.flatMap((m) => m.entries)),
  );
  const select = useCallback(
    (value: string, next: boolean | string) => setSelection((current) => ({ ...current, [value]: next })),
    [],
  );

  return (
    <Menubar>
      {menus.map((m) => {
        const tracking = { menu: menus.length > 1 ? `${preview}-${m.id}` : preview, location };
        return (
          <MenubarMenu key={m.id} onOpenChange={trackOpenChange(tracking)}>
            <MenubarTrigger>{m.label}</MenubarTrigger>
            <MenubarContent>
              <MenuEntries entries={m.entries} tracking={tracking} selection={selection} select={select} />
            </MenubarContent>
          </MenubarMenu>
        );
      })}
    </Menubar>
  );
}

// ─── Prévias ──────────────────────────────────────────────────────────────────
//
// Todo rótulo sai de `demonstration.labels`: literal em português aqui fica em
// português para quem lê em inglês ou espanhol. Uma função por item, porque o
// rótulo é lido no idioma do MOMENTO em que a prévia é montada. O `value` de
// cada item é a chave do rótulo em kebab — é o `label` do evento de escolha.

const SEPARATOR: MenubarEntry = { kind: "separator" };

/** O atalho, quando a prévia o mostra. Sem ele o item é o mesmo, só mais curto. */
function shortcutIf(on: boolean, shortcut: string): { shortcut?: string } {
  return on ? { shortcut } : {};
}

function itemNew(t: Translate, withShortcut = false): MenubarActionEntry {
  return { kind: "item", label: t("demonstration.labels.new"), value: "new", ...shortcutIf(withShortcut, t("demonstration.labels.newShortcut")) };
}

function itemOpen(t: Translate, withShortcut = false): MenubarActionEntry {
  return { kind: "item", label: t("demonstration.labels.open"), value: "open", ...shortcutIf(withShortcut, t("demonstration.labels.openShortcut")) };
}

function itemSave(t: Translate, withShortcut = false): MenubarActionEntry {
  return { kind: "item", label: t("demonstration.labels.save"), value: "save", ...shortcutIf(withShortcut, t("demonstration.labels.saveShortcut")) };
}

function itemQuit(t: Translate): MenubarActionEntry {
  return { kind: "item", label: t("demonstration.labels.quit"), value: "quit", shortcut: t("demonstration.labels.quitShortcut") };
}

function itemUndo(t: Translate, withShortcut = true): MenubarActionEntry {
  return { kind: "item", label: t("demonstration.labels.undo"), value: "undo", ...shortcutIf(withShortcut, t("demonstration.labels.undoShortcut")) };
}

function itemRedo(t: Translate): MenubarActionEntry {
  return { kind: "item", label: t("demonstration.labels.redo"), value: "redo", shortcut: t("demonstration.labels.redoShortcut") };
}

function itemCut(t: Translate): MenubarActionEntry {
  return { kind: "item", label: t("demonstration.labels.cut"), value: "cut", shortcut: t("demonstration.labels.cutShortcut") };
}

function itemCopy(t: Translate, withShortcut = true): MenubarActionEntry {
  return { kind: "item", label: t("demonstration.labels.copy"), value: "copy", ...shortcutIf(withShortcut, t("demonstration.labels.copyShortcut")) };
}

function itemPaste(t: Translate, withShortcut = true): MenubarActionEntry {
  return { kind: "item", label: t("demonstration.labels.paste"), value: "paste", ...shortcutIf(withShortcut, t("demonstration.labels.pasteShortcut")) };
}

function itemFullScreen(t: Translate, withShortcut = true): MenubarActionEntry {
  return { kind: "item", label: t("demonstration.labels.fullScreen"), value: "full-screen", ...shortcutIf(withShortcut, t("demonstration.labels.fullScreenShortcut")) };
}

function itemPdf(t: Translate): MenubarActionEntry {
  return { kind: "item", label: t("demonstration.labels.pdf"), value: "pdf" };
}

/** Os três gatilhos que as barras de várias prévias repetem. */
function triggerFile(t: Translate) {
  return { id: "file", label: t("demonstration.labels.file") };
}

function triggerEdit(t: Translate) {
  return { id: "edit", label: t("demonstration.labels.edit") };
}

function triggerView(t: Translate) {
  return { id: "view", label: t("demonstration.labels.view") };
}

/** A demonstração: UMA barra, quatro menus — o vanilla é a referência. */
function barDemo(t: Translate): BarMenu[] {
  return [
    {
      ...triggerFile(t),
      entries: [
        itemNew(t, true),
        itemOpen(t, true),
        itemSave(t, true),
        SEPARATOR,
        {
          kind: "submenu",
          label: t("demonstration.labels.export"),
          items: [itemPdf(t), { kind: "item", label: t("demonstration.labels.csv"), value: "csv" }],
        },
        SEPARATOR,
        itemQuit(t),
      ],
    },
    {
      ...triggerEdit(t),
      entries: [itemUndo(t), itemRedo(t), SEPARATOR, itemCut(t), itemCopy(t), itemPaste(t)],
    },
    {
      ...triggerView(t),
      entries: [
        {
          kind: "group",
          label: t("demonstration.labels.appearance"),
          items: [
            { kind: "checkbox", label: t("demonstration.labels.darkMode"), value: "dark-mode", checked: false },
            { kind: "checkbox", label: t("demonstration.labels.showRuler"), value: "show-ruler", checked: true },
          ],
        },
        SEPARATOR,
        itemFullScreen(t),
      ],
    },
    {
      id: "tools",
      label: t("demonstration.labels.tools"),
      entries: [
        { kind: "item", label: t("demonstration.labels.find"), value: "find", shortcut: t("demonstration.labels.findShortcut") },
        { kind: "item", label: t("demonstration.labels.replace"), value: "replace", shortcut: t("demonstration.labels.replaceShortcut") },
        SEPARATOR,
        {
          kind: "radio-group",
          value: "theme",
          selected: "system-theme",
          options: [
            { label: t("demonstration.labels.lightTheme"), value: "light-theme" },
            { label: t("demonstration.labels.darkTheme"), value: "dark-theme" },
            { label: t("demonstration.labels.systemTheme"), value: "system-theme" },
          ],
        },
      ],
    },
  ];
}

/**
 * Par 1, faça: três menus categorizados, com TRÊS itens cada. Um item por menu
 * contradizia a própria regra da página (`usage.guidelines.item3`: de 3 a 10
 * itens por menu) justamente no lado que a ilustra. "Mostrar régua" entra como
 * item de AÇÃO, não de marcação: o par fala de categorias, não de estado. Sem
 * atalhos — o assunto do par é a organização da barra.
 */
function barCategorized(t: Translate): BarMenu[] {
  return [
    { ...triggerFile(t), entries: [itemNew(t), itemOpen(t), itemSave(t)] },
    { ...triggerEdit(t), entries: [itemUndo(t, false), itemCopy(t, false), itemPaste(t, false)] },
    {
      ...triggerView(t),
      entries: [
        { kind: "item", label: t("demonstration.labels.zoom"), value: "zoom" },
        itemFullScreen(t, false),
        { kind: "item", label: t("demonstration.labels.showRuler"), value: "show-ruler" },
      ],
    },
  ];
}

/** Par 1, evite: uma barra de um menu só, que devia ser um DropdownMenu. */
function barSingleMenu(t: Translate): BarMenu[] {
  return [
    {
      id: "menu",
      label: t("demonstration.labels.menu"),
      entries: [{ kind: "item", label: t("demonstration.labels.singleAction"), value: "single-action" }],
    },
  ];
}

/** Par 2, faça: os atalhos das ações frequentes, visíveis. */
function barVisibleShortcuts(t: Translate): BarMenu[] {
  return [{ ...triggerFile(t), entries: [itemSave(t, true), itemOpen(t, true)] }];
}

/** Par 2, evite: submenu dentro de submenu, VIVO — o defeito se vê abrindo. */
function barNestedSubmenu(t: Translate): BarMenu[] {
  return [
    {
      ...triggerFile(t),
      entries: [
        {
          kind: "submenu",
          label: t("demonstration.labels.export"),
          items: [{ kind: "submenu", label: t("demonstration.labels.format"), items: [itemPdf(t)] }],
        },
      ],
    },
  ];
}

function barDefault(t: Translate): BarMenu[] {
  return [{ ...triggerFile(t), entries: [itemNew(t, true), itemSave(t, true)] }];
}

function barDestructive(t: Translate): BarMenu[] {
  return [
    {
      ...triggerFile(t),
      entries: [
        itemSave(t),
        SEPARATOR,
        { kind: "item", label: t("demonstration.labels.deleteFile"), value: "delete-file", destructive: true },
      ],
    },
  ];
}

function barShortcuts(t: Translate): BarMenu[] {
  return [{ ...triggerEdit(t), entries: [itemUndo(t), itemRedo(t), SEPARATOR, itemCopy(t), itemPaste(t)] }];
}

/** Painéis: marcações de verdade — sem glifo escrito no texto do item. */
function barCheckbox(t: Translate): BarMenu[] {
  return [
    {
      ...triggerView(t),
      entries: [
        {
          kind: "group",
          label: t("demonstration.labels.panels"),
          items: [
            { kind: "checkbox", label: t("demonstration.labels.sidebar"), value: "sidebar", checked: true },
            { kind: "checkbox", label: t("demonstration.labels.grid"), value: "grid", checked: false },
            { kind: "checkbox", label: t("demonstration.labels.ruler"), value: "ruler", checked: false },
          ],
        },
      ],
    },
  ];
}

function barRadio(t: Translate): BarMenu[] {
  return [
    {
      id: "theme",
      label: t("demonstration.labels.theme"),
      entries: [
        {
          kind: "radio-group",
          label: t("demonstration.labels.appearance"),
          value: "theme",
          selected: "dark",
          options: [
            { label: t("demonstration.labels.light"), value: "light" },
            { label: t("demonstration.labels.dark"), value: "dark" },
            { label: t("demonstration.labels.system"), value: "system" },
          ],
        },
      ],
    },
  ];
}

/** O editor completo: as quatro categorias clássicas, com os atalhos da demonstração. */
function barEditor(t: Translate): BarMenu[] {
  return [
    { ...triggerFile(t), entries: [itemNew(t, true), itemOpen(t, true), itemSave(t, true), SEPARATOR, itemQuit(t)] },
    { ...triggerEdit(t), entries: [itemUndo(t), itemRedo(t)] },
    {
      ...triggerView(t),
      entries: [
        {
          kind: "group",
          label: t("demonstration.labels.appearance"),
          items: [{ kind: "item", label: t("demonstration.labels.darkMode"), value: "dark-mode" }],
        },
        SEPARATOR,
        itemFullScreen(t),
      ],
    },
    {
      id: "help",
      label: t("demonstration.labels.help"),
      entries: [
        { kind: "item", label: t("demonstration.labels.documentation"), value: "documentation" },
        { kind: "item", label: t("demonstration.labels.about"), value: "about" },
      ],
    },
  ];
}

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

// ─── Código ──────────────────────────────────────────────────────────────────
//
// O código de cada card de Variantes NÃO mora aqui: sai de `menubarSnippet` com
// a mesma lista que monta a barra, no idioma da página.

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
  MenubarGroup,
  MenubarLabel,
} from "@/components/ui/menubar";`;

// O item de ação escuta `onClick`: o `Menu.Item` da base-ui não tem
// `onSelect`. `indeterminate` entra no item de marcação, que o wrapper implementa.
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
  onOpenChange?: (open: boolean, eventDetails) => void;
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
  onClick?: (event: React.MouseEvent) => void;
}

interface MenubarCheckboxItemProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean, eventDetails) => void;
  indeterminate?: boolean;
}`;

// ─── Componente principal ────────────────────────────────────────────────────

export function MenubarDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(menubarTranslations);

  // A prioridade chega do conteúdo como identificador ("high", "medium"); quem
  // a traduz é o dicionário de navegação.
  const priorityLabel = useCallback(
    (raw: string) => tNav(priorityKeyMap[raw] ?? "common.high"),
    [tNav],
  );

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria.
  // O `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
  const screenReaderItems = useMemo(
    () =>
      Object.entries(
        (menubarTranslations as unknown as Record<
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
    componentSlug: "menubar",
    aiSummary: tContent("seo.aiSummary"),
    aiEntities: tContent("seo.aiEntities"),
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

  // Prévia e código de um card de Variantes saem da MESMA lista de menus — o
  // código mostra a barra que a prévia desenha, no idioma de quem lê.
  const variantCard = (preview: string, location: string, menus: BarMenu[]) => ({
    code: menubarSnippet({ menus }),
    preview: <BarPreview preview={preview} location={location} menus={menus} />,
  });

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
        />
      }
    >
      {/* ── Demonstração ──────────────────────────────────────────── */}
      {/* UMA barra com os quatro menus, como no vanilla. Eram quatro barras de
          um menu cada, todas abertas ao carregar: o que se via era um
          DropdownMenu repetido, e justamente o que faz um menubar — a seta que
          passa de um menu ao vizinho — não existia na página. */}
      <DocsDemonstration title={tContent("demonstration.title")}>
        <div className="nds-cluster nds-p-8" data-align="center" data-justify="center">
          <BarPreview preview="demo" location="docs_demo" menus={barDemo(tContent)} />
        </div>
      </DocsDemonstration>

      {/* ── Anatomia ──────────────────────────────────────────────── */}
      <DocsAnatomy
        title={tContent("anatomy.title")}
        items={stringsFromDict(tContent, "anatomy")}
        structureCode={tContent("anatomy.structureCode")}
        structureLabel={tContent("anatomy.structureLabel")}
      />

      {/* ── Quando Usar ───────────────────────────────────────────── */}
      <DocsWhenToUse
        title={tContent("usage.title")}
        guidelines={{
          title: tContent("usage.guidelines.title"),
          items: stringsFromDict(tContent, "usage.guidelines"),
        }}
        scenarios={{
          title: tContent("usage.scenarios.title"),
          cols: {
            scenario: tContent("usage.scenarios.cols.scenario"),
            use: tContent("usage.scenarios.cols.use"),
            alternative: tContent("usage.scenarios.cols.alternative"),
          },
          items: entriesFromDict(tContent, "usage.scenarios", ["s", "u", "a"]),
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
          items: stringsFromDict(tContent, "usage.do"),
        }}
        dont={{
          title: tContent("usage.dont.title"),
          items: stringsFromDict(tContent, "usage.dont"),
        }}
      />

      {/* ── Do & Don't ────────────────────────────────────────────── */}
      {/* Os quatro lados são barras VIVAS (guideline 08 §15) — eram texto em
          monoespaçado ("Arquivo · Editar · Exibir", "Sub > Sub > Sub"), e quem
          lia via a frase, nunca o defeito. O submenu dentro de submenu do par 2
          abre de verdade: é abrindo que se sente o custo. */}
      <DocsDoDont
        title={tContent("doDont.title")}
        pairs={[
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: <BarPreview preview="pair1-do" location="docs_do_dont" menus={barCategorized(tContent)} />,
            dontPreview: <BarPreview preview="pair1-dont" location="docs_do_dont" menus={barSingleMenu(tContent)} />,
            doCaption: DOMPurify.sanitize(tContent("doDont.pair1.do")),
            dontCaption: DOMPurify.sanitize(tContent("doDont.pair1.dont")),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: <BarPreview preview="pair2-do" location="docs_do_dont" menus={barVisibleShortcuts(tContent)} />,
            dontPreview: <BarPreview preview="pair2-dont" location="docs_do_dont" menus={barNestedSubmenu(tContent)} />,
            doCaption: DOMPurify.sanitize(tContent("doDont.pair2.do")),
            dontCaption: DOMPurify.sanitize(tContent("doDont.pair2.dont")),
          },
        ]}
      />

      {/* ── Importação ────────────────────────────────────────────── */}
      <DocsImport title={tContent("import.title")} code={codeImport} />

      {/* ── Variantes ─────────────────────────────────────────────── */}
      {/* Seis barras vivas, e o código de cada card sai da lista que monta a
          barra. `default` e `destructive` eram só o texto `variant="…"`, e
          `withCheckbox` escrevia "Sidebar" e "Grid" em inglês na página em
          português. */}
      <DocsCompositions
        id="variantes"
        title={tContent("variants.title")}
        useWhenLabel={tNav("common.useWhen")}
        componentSlug="menubar"
        items={[
          {
            trackId: "default",
            name: tContent("variants.items.default"),
            description: stripHtml(tContent("variants.styles.default")),
            ...variantCard("default", "docs_variantes", barDefault(tContent)),
          },
          {
            trackId: "destructive",
            name: tContent("variants.items.destructive"),
            description: stripHtml(tContent("variants.styles.destructive")),
            ...variantCard("destructive", "docs_variantes", barDestructive(tContent)),
          },
          {
            trackId: "withShortcuts",
            name: tContent("variants.items.withShortcuts.name"),
            description: tContent("variants.items.withShortcuts.description"),
            useWhen: tContent("variants.items.withShortcuts.use"),
            ...variantCard("with-shortcuts", "docs_variantes", barShortcuts(tContent)),
          },
          {
            trackId: "withCheckbox",
            name: tContent("variants.items.withCheckbox.name"),
            description: tContent("variants.items.withCheckbox.description"),
            useWhen: tContent("variants.items.withCheckbox.use"),
            ...variantCard("with-checkbox", "docs_variantes", barCheckbox(tContent)),
          },
          {
            trackId: "withRadio",
            name: tContent("variants.items.withRadio.name"),
            description: tContent("variants.items.withRadio.description"),
            useWhen: tContent("variants.items.withRadio.use"),
            ...variantCard("with-radio", "docs_variantes", barRadio(tContent)),
          },
          {
            trackId: "editorComplete",
            name: tContent("variants.items.editorComplete.name"),
            description: tContent("variants.items.editorComplete.description"),
            useWhen: tContent("variants.items.editorComplete.use"),
            ...variantCard("editor-complete", "docs_variantes", barEditor(tContent)),
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
                name: "value",
                type: tContent("props.table.value.type"),
                defaultValue: tContent("props.table.value.default"),
                required: tContent("props.table.value.required"),
                description: DOMPurify.sanitize(tContent("props.table.value.description")),
              },
              {
                name: "onValueChange",
                type: tContent("props.table.onValueChange.type"),
                defaultValue: tContent("props.table.onValueChange.default"),
                required: tContent("props.table.onValueChange.required"),
                description: DOMPurify.sanitize(tContent("props.table.onValueChange.description")),
              },
              {
                name: "defaultValue",
                type: tContent("props.table.defaultValue.type"),
                defaultValue: tContent("props.table.defaultValue.default"),
                required: tContent("props.table.defaultValue.required"),
                description: DOMPurify.sanitize(tContent("props.table.defaultValue.description")),
              },
              {
                name: "loop",
                type: tContent("props.table.loop.type"),
                defaultValue: tContent("props.table.loop.default"),
                required: tContent("props.table.loop.required"),
                description: DOMPurify.sanitize(tContent("props.table.loop.description")),
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
        extensibilityCode={tContent("props.extensibilityCode")}
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
            token: "--accent-foreground",
            value: tContent("tokens.table.triggerText.class"),
            description: tContent("tokens.table.triggerText.part"),
          },
          {
            token: "--radius-sm",
            value: tContent("tokens.table.triggerRadius.class"),
            description: tContent("tokens.table.triggerRadius.part"),
          },
          {
            token: "--popover",
            value: tContent("tokens.table.contentBg.class"),
            description: tContent("tokens.table.contentBg.part"),
          },
          {
            token: "--border",
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
        screenReaderTitle={tNav("common.screenReader")}
        screenReaderItems={screenReaderItems}
        title={tContent("accessibility.title")}
        summary={tContent("accessibility.summary")}
        items={stringsFromDict(tContent, "accessibility.items")}
        keyboardTitle={tContent("accessibility.keyboard.title")}
        keyboardItems={[
          { key: "Tab", description: toPlainText(tContent("accessibility.keyboard.tab")) },
          { key: "Arrow Left / Arrow Right", description: toPlainText(tContent("accessibility.keyboard.arrowsHorizontal")) },
          { key: "Arrow Up / Arrow Down", description: toPlainText(tContent("accessibility.keyboard.arrowsVertical")) },
          { key: "Enter / Space", description: toPlainText(tContent("accessibility.keyboard.enter")) },
          { key: "Esc", description: toPlainText(tContent("accessibility.keyboard.escape")) },
          { key: "Home / End", description: toPlainText(tContent("accessibility.keyboard.homeEnd")) },
          { key: "A–Z", description: toPlainText(tContent("accessibility.keyboard.typeahead")) },
        ]}
      />

      {/* ── Relacionados ──────────────────────────────────────────── */}
      <DocsRelated
        title={tContent("related.title")}
        componentSlug="menubar"
        items={[
          {
            name: tContent("related.items.navigationMenu.name"),
            description: toPlainText(tContent("related.items.navigationMenu.description")),
            path: "?path=/docs/components-navigation-navigationmenu--docs",
          },
          {
            name: tContent("related.items.dropdownMenu.name"),
            description: toPlainText(tContent("related.items.dropdownMenu.description")),
            path: "?path=/docs/components-overlay-dropdownmenu--docs",
          },
          {
            name: tContent("related.items.sidebar.name"),
            description: toPlainText(tContent("related.items.sidebar.description")),
            path: "?path=/docs/components-layout-sidebar--docs",
          },
          {
            name: tContent("related.items.command.name"),
            description: toPlainText(tContent("related.items.command.description")),
            path: "?path=/docs/components-overlay-command--docs",
          },
        ]}
      />

      {/* ── Notas ─────────────────────────────────────────────────── */}
      <DocsNotes
        title={tContent("notes.title")}
        componentSlug="menubar"
        items={stringsFromDict(tContent, "notes").map((content) => ({ title: "", content }))}
      />

      {/* ── Analytics ─────────────────────────────────────────────── */}
      {/* Cabeçalho e linhas saem do conteúdo compartilhado, como no ContextMenu.
          A linha cravada aqui prometia `menubar_menu_open` e
          `menubar_shortcut_invoke`, que nunca existiram no tipo — e o atalho
          exibido é só texto, não gera evento. */}
      <DocsAnalytics
        title={tContent("analytics.title")}
        cols={{
          event: tContent("analytics.table.event"),
          trigger: toPlainText(tContent("analytics.table.trigger")),
          payload: tContent("analytics.table.payload"),
        }}
        items={[
          {
            event: tContent("analytics.table.menuOpen"),
            trigger: toPlainText(tContent("analytics.table.menuOpenTrigger")),
            payload: tContent("analytics.table.menuOpenPayload"),
          },
          {
            event: tContent("analytics.table.itemClick"),
            trigger: toPlainText(tContent("analytics.table.itemClickTrigger")),
            payload: tContent("analytics.table.itemClickPayload"),
          },
          {
            event: tContent("analytics.table.close"),
            trigger: toPlainText(tContent("analytics.table.closeTrigger")),
            payload: tContent("analytics.table.closePayload"),
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
          items: entriesFromDict(tContent, "testes.functional", ["action", "result", "priority"]).map(
            (entry) => ({ ...entry, priority: priorityLabel(entry.priority) }),
          ),
        }}
        accessibility={{
          title: tContent("testes.accessibility.title"),
          cols: {
            criterion: tNav("common.criterion"),
            level: "WCAG",
            how: tNav("common.howToVerify"),
          },
          items: stringsFromDict(tContent, "testes.accessibility").map((criterion, i) => ({
            criterion,
            level: A11Y_TEST_LEVELS[i] ?? "AA",
            how: A11Y_TEST_HOW[i] ?? "axe-core",
          })),
        }}
        visual={{
          title: tContent("testes.visual.title"),
          cols: {
            story: tNav("common.storyState"),
            priority: tNav("common.priority"),
          },
          items: entriesFromDict(tContent, "testes.visual", ["story", "priority"]).map(
            (entry) => ({ ...entry, priority: priorityLabel(entry.priority) }),
          ),
        }}
      />
    </DocsPageLayout>
  );
}

export default MenubarDocs;
