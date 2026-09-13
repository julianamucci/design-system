import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
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
import { menuCloseReason } from "@/components/ui/menu-close-reason";
import {
  dropdownMenuSnippet,
  type DropdownMenuActionEntry,
  type DropdownMenuEntry,
} from "@/components/ui/dropdown-menu.source";
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

type Translate = (key: string) => string;

const priorityKeyMap: Record<string, string> = {
  high: "common.high",
  medium: "common.medium",
  low: "common.low",
};

/**
 * Varre `base.item1`, `base.item2`, … enquanto existirem no conteúdo.
 *
 * Contar à mão (`[1, 2, 3].map(...)`, ou uma linha por índice) trava a lista no
 * tamanho de hoje: o conteúdo compartilhado ganha um item e ele simplesmente
 * não existe para quem lê — sem erro, sem aviso, nos três idiomas de uma vez.
 * Foi o que aconteceu com o sétimo critério de acessibilidade deste componente,
 * e de novo com os seis critérios funcionais que a família de menus ganhou.
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
const A11Y_TEST_LEVELS = ["AA", "4.1.2", "4.1.2", "1.3.1", "2.4.3", "1.4.3", "4.1.2"];
const A11Y_TEST_HOW = [
  "axe-core",
  "DevTools a11y tree",
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
 * `menu` é o id ESTÁVEL da prévia (`pair1-do`, `with-checkbox-items`…) — ou,
 * onde uma prévia tem vários menus, o id dela seguido do gatilho
 * (`demo-account`, `demo-file`). `location` é a SEÇÃO da página (guideline 07),
 * e vem sempre de quem monta a prévia: helper de rastreio com a seção fixa por
 * dentro era o que fazia Variantes e Do & Don't dizerem que vinham da
 * demonstração — ou não dizerem nada, porque não rastreavam.
 */
type MenuTracking = { menu: string; location: string };

/**
 * Abertura e fechamento num callback só, porque a lib entrega os dois pelo
 * mesmo `onOpenChange`. O motivo do fechamento sai do vocabulário da família
 * (`escape`, `overlay`, `api`) — o Tab chega aqui como `focus-out`, que o
 * wrapper escreve, e vira `overlay`: saiu sem decidir.
 */
function trackOpenChange({ menu, location }: MenuTracking) {
  return (open: boolean, eventDetails: { reason: string }) => {
    if (open) {
      track("dropdown_menu_open", { component: "dropdown-menu", menu, location });
      return;
    }
    track("dropdown_menu_close", {
      component: "dropdown-menu",
      menu,
      reason: menuCloseReason(eventDetails.reason),
      location,
    });
  };
}

/**
 * O `label` do payload é IDENTIFICADOR, nunca o rótulo traduzido: texto
 * localizado partiria o mesmo evento em um valor por idioma no GA4 —
 * "Configurações", "Settings" e "Configuración" chegariam como três ações.
 */
function trackSelect({ menu, location }: MenuTracking, label: string) {
  return () =>
    track("dropdown_menu_item_select", { component: "dropdown-menu", label, menu, location });
}

// ─── O menu como dado ─────────────────────────────────────────────────────────
//
// Toda prévia viva desta página é uma LISTA de entradas (`DropdownMenuEntry`),
// e é a mesma lista que imprime o código do card (`dropdownMenuSnippet`) — o
// desenho do ContextMenu desta stack e do vanilla.

/** Marcações e grupos de escolha única, pelo id estável de cada um. */
type Selection = Record<string, boolean | string>;

function initialSelection(entries: readonly DropdownMenuEntry[]): Selection {
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
function ActionItem({ entry, tracking }: { entry: DropdownMenuActionEntry; tracking: MenuTracking }) {
  return (
    <DropdownMenuItem
      onClick={trackSelect(tracking, entry.value)}
      variant={entry.destructive ? "destructive" : "default"}
    >
      {entry.label}
      {entry.shortcut && <DropdownMenuShortcut>{entry.shortcut}</DropdownMenuShortcut>}
    </DropdownMenuItem>
  );
}

function MenuEntries({ entries, ...props }: EntryProps & { entries: readonly DropdownMenuEntry[] }) {
  return (
    <>
      {entries.map((entry, index) => (
        <MenuEntry key={index} entry={entry} {...props} />
      ))}
    </>
  );
}

function MenuEntry({ entry, tracking, selection, select }: EntryProps & { entry: DropdownMenuEntry }) {
  switch (entry.kind) {
    case "item":
      return <ActionItem entry={entry} tracking={tracking} />;
    case "separator":
      return <DropdownMenuSeparator />;
    case "checkbox":
      // Marcar também é escolher: o evento de item sai aqui, com o id da
      // marcação. O menu segue aberto (C10) — quem fecha é outro gesto, e o
      // motivo do fechamento é o dele.
      return (
        <DropdownMenuCheckboxItem
          checked={selection[entry.value] === true}
          onCheckedChange={(checked) => {
            select(entry.value, checked);
            trackSelect(tracking, entry.value)();
          }}
        >
          {entry.label}
        </DropdownMenuCheckboxItem>
      );
    case "submenu":
      return (
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>{entry.label}</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {entry.items.map((item, index) => (
              <ActionItem key={index} entry={item} tracking={tracking} />
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      );
    case "group":
      // O rótulo mora DENTRO do grupo que ele nomeia: fora dele o primitivo
      // lança "MenuGroupContext is missing" e o menu não renderiza.
      return (
        <DropdownMenuGroup>
          <DropdownMenuLabel>{entry.label}</DropdownMenuLabel>
          <MenuEntries entries={entry.items} tracking={tracking} selection={selection} select={select} />
        </DropdownMenuGroup>
      );
    case "radio-group":
      // UM grupo só, nomeado pelo rótulo que mora dentro dele. A escolha se
      // reporta pelo CLIQUE na opção, e não pela troca de valor: escolher a
      // opção que já está marcada também é escolher. O `onClick` pega o
      // teclado junto — Enter e Espaço no item da lib despacham um clique.
      return (
        <DropdownMenuRadioGroup
          value={selection[entry.value]}
          onValueChange={(value: string) => select(entry.value, value)}
        >
          <DropdownMenuLabel>{entry.label}</DropdownMenuLabel>
          {entry.options.map((option) => (
            <DropdownMenuRadioItem
              key={option.value}
              value={option.value}
              onClick={trackSelect(tracking, option.value)}
            >
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      );
  }
}

/**
 * Uma prévia viva: o gatilho, o menu descrito por `entries` e o rastreamento.
 *
 * O estado das marcações mora AQUI, e não no item: o painel desmonta ao fechar,
 * e estado guardado dentro dele voltaria ao valor inicial a cada abertura.
 *
 * Os menus nascem FECHADOS. Menu que se abre sozinho ao carregar a página é
 * justamente o que não se deve copiar, e abrir vários de uma vez empilharia
 * painéis por cima do texto da seção.
 */
function MenuPreview({
  entries,
  tracking,
  trigger,
  block = false,
}: {
  entries: readonly DropdownMenuEntry[];
  tracking: MenuTracking;
  trigger: string;
  block?: boolean;
}) {
  const [selection, setSelection] = useState<Selection>(() => initialSelection(entries));
  const select = useCallback(
    (value: string, next: boolean | string) => setSelection((current) => ({ ...current, [value]: next })),
    [],
  );

  return (
    <DropdownMenu onOpenChange={trackOpenChange(tracking)}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={block ? "nds-w-full" : undefined}>
          {trigger}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="start">
        <MenuEntries entries={entries} tracking={tracking} selection={selection} select={select} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Uma célula da demonstração: a legenda da composição e o menu dela. */
function DemoCell({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div className="nds-stack nds-min-h-20" data-spacing="sm">
      <p className="nds-text-caption nds-font-medium nds-text-muted-foreground">
        {DOMPurify.sanitize(caption)}
      </p>
      {children}
    </div>
  );
}

// ─── Prévias ──────────────────────────────────────────────────────────────────
//
// Todo rótulo sai de `demonstration.labels`: literal em português aqui fica em
// português para quem lê a página em inglês ou espanhol, sem erro e sem aviso.
// Uma função por item, e não uma constante, porque o rótulo é lido no idioma do
// MOMENTO em que a prévia é montada. O `value` de cada item é a chave do rótulo
// em kebab — é o `label` que o evento de escolha manda.

const SEPARATOR: DropdownMenuEntry = { kind: "separator" };

function itemProfile(t: Translate): DropdownMenuActionEntry {
  return { kind: "item", label: t("demonstration.labels.profile"), value: "profile" };
}

function itemSettings(t: Translate): DropdownMenuActionEntry {
  return { kind: "item", label: t("demonstration.labels.settings"), value: "settings" };
}

function itemLogout(t: Translate, destructive = false): DropdownMenuActionEntry {
  return { kind: "item", label: t("demonstration.labels.logout"), value: "logout", destructive };
}

function itemDocumentation(t: Translate): DropdownMenuActionEntry {
  return { kind: "item", label: t("demonstration.labels.documentation"), value: "documentation" };
}

function itemRename(t: Translate): DropdownMenuActionEntry {
  return { kind: "item", label: t("demonstration.labels.rename"), value: "rename" };
}

function itemDeleteAccount(t: Translate, destructive: boolean): DropdownMenuActionEntry {
  return { kind: "item", label: t("demonstration.labels.deleteAccount"), value: "delete-account", destructive };
}

/** O grupo "Conta": o rótulo nomeia o grupo, e os dois itens dele. */
function groupAccount(t: Translate): DropdownMenuEntry {
  return {
    kind: "group",
    label: t("demonstration.labels.account"),
    items: [itemProfile(t), itemSettings(t)],
  };
}

function groupSupport(t: Translate): DropdownMenuEntry {
  return {
    kind: "group",
    label: t("demonstration.labels.support"),
    items: [itemDocumentation(t), itemLogout(t)],
  };
}

/** Conta: o menu da demonstração e do card `default` — Sair é destrutivo. */
function menuAccount(t: Translate): DropdownMenuEntry[] {
  return [groupAccount(t), SEPARATOR, itemLogout(t, true)];
}

/** Duas seções rotuladas e um divisor entre elas. */
function menuGrouped(t: Translate): DropdownMenuEntry[] {
  return [groupAccount(t), SEPARATOR, groupSupport(t)];
}

/** Colunas visíveis: três marcações independentes, só Nome marcada. */
function menuColumns(t: Translate): DropdownMenuEntry[] {
  return [
    {
      kind: "group",
      label: t("demonstration.labels.visibleColumns"),
      items: [
        { kind: "checkbox", label: t("demonstration.labels.columnName"), value: "column-name", checked: true },
        { kind: "checkbox", label: t("demonstration.labels.columnEmail"), value: "column-email", checked: false },
        { kind: "checkbox", label: t("demonstration.labels.columnRole"), value: "column-role", checked: false },
      ],
    },
  ];
}

/** Aparência: escolha única, nascendo em Claro. */
function menuTheme(t: Translate): DropdownMenuEntry[] {
  return [
    {
      kind: "radio-group",
      label: t("demonstration.labels.appearance"),
      value: "theme",
      selected: "light",
      options: [
        { label: t("demonstration.labels.light"), value: "light" },
        { label: t("demonstration.labels.dark"), value: "dark" },
        { label: t("demonstration.labels.system"), value: "system" },
      ],
    },
  ];
}

/** Arquivo: uma ação e o submenu de exportação. */
function menuFile(t: Translate): DropdownMenuEntry[] {
  return [
    itemRename(t),
    {
      kind: "submenu",
      label: t("demonstration.labels.export"),
      items: [
        { kind: "item", label: t("demonstration.labels.pdf"), value: "pdf" },
        { kind: "item", label: t("demonstration.labels.csv"), value: "csv" },
      ],
    },
  ];
}

/**
 * Renomear e Excluir conta, com o divisor entre eles. `destructive` é o único
 * ponto em que o par 2 do Do & Don't difere — é exatamente o que a legenda
 * cobra.
 */
function menuDeleteAccount(t: Translate, destructive: boolean): DropdownMenuEntry[] {
  return [itemRename(t), SEPARATOR, itemDeleteAccount(t, destructive)];
}

/**
 * Dez itens planos, que é o número da legenda do "evite": com seis a lista
 * ainda parece curta, e o "vira lista de scroll" não aparece. O conteúdo não
 * tem interpolação, então o número vai por fora do rótulo.
 */
function menuFlatActions(t: Translate): DropdownMenuEntry[] {
  const action = t("demonstration.labels.action");
  return Array.from({ length: 10 }, (_, index) => ({
    kind: "item" as const,
    label: `${action} ${index + 1}`,
    value: `action-${index + 1}`,
  }));
}

/** Editar: três ações com atalho e um divisor — o conjunto da story `WithShortcuts`. */
function menuShortcuts(t: Translate): DropdownMenuEntry[] {
  return [
    { kind: "item", label: t("demonstration.labels.undo"), value: "undo", shortcut: t("demonstration.labels.undoShortcut") },
    { kind: "item", label: t("demonstration.labels.copy"), value: "copy", shortcut: t("demonstration.labels.copyShortcut") },
    SEPARATOR,
    { kind: "item", label: t("demonstration.labels.paste"), value: "paste", shortcut: t("demonstration.labels.pasteShortcut") },
  ];
}

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

// ─── Código ──────────────────────────────────────────────────────────────────
//
// O código de cada card de Variantes NÃO mora aqui: sai de `dropdownMenuSnippet`
// com a mesma lista que monta a prévia, no idioma da página.

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

// O item de ação escuta `onClick`: o `Menu.Item` da base-ui não tem
// `onSelect`, e a interface documentava um nome que não faz nada.
// `indeterminate` entra no item de marcação, porque o wrapper o implementa.
const interfaceCode = `// DropdownMenu (base-ui/menu)
interface DropdownMenuProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean, eventDetails) => void;
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
  onClick?: (event: React.MouseEvent) => void;
}

interface DropdownMenuCheckboxItemProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean, eventDetails) => void;
  indeterminate?: boolean;
}`;

// ─── Componente principal ─────────────────────────────────────────────────────

export function DropdownMenuDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(dropdownMenuTranslations);

  // A prioridade chega do conteúdo como identificador ("high", "medium"); quem
  // a traduz é o dicionário de navegação. Item novo sem prioridade declarada cai
  // no par padrão em vez de imprimir a chave crua.
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
        (dropdownMenuTranslations as unknown as Record<
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

  // Os textos dos gatilhos, lidos uma vez: várias prévias os repetem.
  const account = tContent("demonstration.labels.account");
  const columns = tContent("demonstration.labels.columns");
  const theme = tContent("demonstration.labels.theme");
  const file = tContent("demonstration.labels.file");
  const edit = tContent("demonstration.labels.edit");

  // Prévia e código de um card de Variantes saem da MESMA lista de entradas —
  // o código mostra o que a prévia desenha, no idioma de quem lê.
  const variantCard = (tracking: MenuTracking, trigger: string, entries: DropdownMenuEntry[]) => ({
    code: dropdownMenuSnippet({ triggerLabel: trigger, entries }),
    preview: <MenuPreview entries={entries} tracking={tracking} trigger={trigger} />,
  });

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
      {/* Quatro menus, um por célula; a legenda diz a composição e o gatilho diz
          o que o menu é. O `menu` de cada um é o id da demonstração seguido do
          gatilho — com `demo` para os quatro, os eventos não os distinguiriam. */}
      <DocsDemonstration >
        <div className="nds-grid nds-w-full" data-spacing="md" style={{ "--grid-min": "9rem" } as CSSProperties}>
          <DemoCell caption={tContent("demonstration.labels.basic")}>
            <MenuPreview
              entries={menuAccount(tContent)}
              tracking={{ menu: "demo-account", location: "docs_demo" }}
              trigger={account}
              block
            />
          </DemoCell>
          <DemoCell caption={tContent("demonstration.labels.withCheckbox")}>
            <MenuPreview
              entries={menuColumns(tContent)}
              tracking={{ menu: "demo-columns", location: "docs_demo" }}
              trigger={columns}
              block
            />
          </DemoCell>
          <DemoCell caption={tContent("demonstration.labels.withRadio")}>
            <MenuPreview
              entries={menuTheme(tContent)}
              tracking={{ menu: "demo-theme", location: "docs_demo" }}
              trigger={theme}
              block
            />
          </DemoCell>
          <DemoCell caption={tContent("demonstration.labels.withSubmenu")}>
            <MenuPreview
              entries={menuFile(tContent)}
              tracking={{ menu: "demo-file", location: "docs_demo" }}
              trigger={file}
              block
            />
          </DemoCell>
        </div>
      </DocsDemonstration>

      {/* ── Anatomia ──────────────────────────────────────────────── */}
      <DocsAnatomy
        items={stringsFromDict(tContent, "anatomy")}
        structureCode={tContent("anatomy.structureCode")}
        structureLabel={tContent("anatomy.structureLabel")}
      />

      {/* ── Quando Usar ───────────────────────────────────────────── */}
      <DocsWhenToUse
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
          items: stringsFromDict(tContent, "usage.do"),
        }}
        dont={{
          title: tContent("usage.dont.title"),
          items: stringsFromDict(tContent, "usage.dont"),
        }}
      />

      {/* ── Do & Don't ────────────────────────────────────────────── */}
      {/*
        Os quatro previews instanciam o DropdownMenu de verdade (guideline 08
        §15), e cada um rastreia os três eventos com a seção `docs_do_dont`.

        Dentro de um par, só o DEFEITO muda de um lado para o outro: no par 1, a
        lista agrupada contra dez itens planos; no par 2, o MESMO menu com e sem
        a variante destrutiva — é exatamente o que a legenda cobra.
      */}
      <DocsDoDont
        pairs={[
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <MenuPreview
                entries={menuGrouped(tContent)}
                tracking={{ menu: "pair1-do", location: "docs_do_dont" }}
                trigger={account}
              />
            ),
            dontPreview: (
              <MenuPreview
                entries={menuFlatActions(tContent)}
                tracking={{ menu: "pair1-dont", location: "docs_do_dont" }}
                trigger={tContent("demonstration.labels.menu")}
              />
            ),
            doCaption: DOMPurify.sanitize(tContent("doDont.pair1.do")),
            dontCaption: DOMPurify.sanitize(tContent("doDont.pair1.dont")),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <MenuPreview
                entries={menuDeleteAccount(tContent, true)}
                tracking={{ menu: "pair2-do", location: "docs_do_dont" }}
                trigger={account}
              />
            ),
            dontPreview: (
              <MenuPreview
                entries={menuDeleteAccount(tContent, false)}
                tracking={{ menu: "pair2-dont", location: "docs_do_dont" }}
                trigger={account}
              />
            ),
            doCaption: DOMPurify.sanitize(tContent("doDont.pair2.do")),
            dontCaption: DOMPurify.sanitize(tContent("doDont.pair2.dont")),
          },
        ]}
      />

      {/* ── Importação ────────────────────────────────────────────── */}
      <DocsImport code={codeImport} />

      {/* ── Variantes ─────────────────────────────────────────────── */}
      {/* Os seis cards são menus VIVOS, e o código de cada um sai da lista que
          monta a prévia. `default` e `destructive` eram só o texto
          `variant="…"` em monoespaçado: quem lia via o nome da prop, nunca o
          item. */}
      <DocsCompositions
        id="variantes"
        useWhenLabel={tNav("common.useWhen")}
        componentSlug="dropdown-menu"
        items={[
          {
            trackId: "default",
            name: tContent("variants.items.default"),
            description: stripHtml(tContent("variants.styles.default")),
            ...variantCard({ menu: "default", location: "docs_variantes" }, account, menuAccount(tContent)),
          },
          {
            trackId: "destructive",
            name: tContent("variants.items.destructive"),
            description: stripHtml(tContent("variants.styles.destructive")),
            ...variantCard(
              { menu: "destructive", location: "docs_variantes" },
              account,
              menuDeleteAccount(tContent, true),
            ),
          },
          {
            trackId: "withLabel",
            name: tContent("variants.items.withLabel.name"),
            description: tContent("variants.items.withLabel.description"),
            useWhen: tContent("variants.items.withLabel.use"),
            ...variantCard({ menu: "with-label", location: "docs_variantes" }, account, menuGrouped(tContent)),
          },
          {
            trackId: "withCheckboxItems",
            name: tContent("variants.items.withCheckboxItems.name"),
            description: tContent("variants.items.withCheckboxItems.description"),
            useWhen: tContent("variants.items.withCheckboxItems.use"),
            ...variantCard(
              { menu: "with-checkbox-items", location: "docs_variantes" },
              columns,
              menuColumns(tContent),
            ),
          },
          {
            trackId: "withRadioGroup",
            name: tContent("variants.items.withRadioGroup.name"),
            description: tContent("variants.items.withRadioGroup.description"),
            useWhen: tContent("variants.items.withRadioGroup.use"),
            ...variantCard({ menu: "with-radio-group", location: "docs_variantes" }, theme, menuTheme(tContent)),
          },
          {
            trackId: "withShortcuts",
            name: tContent("variants.items.withShortcuts.name"),
            description: tContent("variants.items.withShortcuts.description"),
            useWhen: tContent("variants.items.withShortcuts.use"),
            ...variantCard({ menu: "with-shortcuts", location: "docs_variantes" }, edit, menuShortcuts(tContent)),
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
        extensibilityCode={tContent("props.extensibilityCode")}
      />

      {/* ── Tokens ────────────────────────────────────────────────── */}
      <DocsTokens
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
        summary={tContent("accessibility.summary")}
        items={stringsFromDict(tContent, "accessibility.items")}
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
        componentSlug="dropdown-menu"
        items={[
          {
            name: tContent("related.items.contextMenu.name"),
            description: toPlainText(tContent("related.items.contextMenu.description")),
            path: "?path=/docs/components-overlay-contextmenu--docs",
          },
          {
            name: tContent("related.items.menubar.name"),
            description: toPlainText(tContent("related.items.menubar.description")),
            path: "?path=/docs/components-navigation-menubar--docs",
          },
          {
            name: tContent("related.items.command.name"),
            description: toPlainText(tContent("related.items.command.description")),
            path: "?path=/docs/components-overlay-command--docs",
          },
          {
            name: tContent("related.items.popover.name"),
            description: toPlainText(tContent("related.items.popover.description")),
            path: "?path=/docs/components-overlay-popover--docs",
          },
          {
            name: tContent("related.items.select.name"),
            description: toPlainText(tContent("related.items.select.description")),
            path: "?path=/docs/components-form-select--docs",
          },
        ]}
      />

      {/* ── Notas ─────────────────────────────────────────────────── */}
      <DocsNotes
        componentSlug="dropdown-menu"
        items={stringsFromDict(tContent, "notes").map((content) => ({ title: "", content }))}
      />

      {/* ── Analytics ─────────────────────────────────────────────── */}
      {/* Cabeçalho e linhas saem do conteúdo compartilhado, como no ContextMenu:
          as linhas cravadas aqui descreviam o payload antigo, com o menu no
          `label`, e ficaram velhas no mesmo dia em que o tipo mudou. */}
      <DocsAnalytics
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

export default DropdownMenuDocs;
