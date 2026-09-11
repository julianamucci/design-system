import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
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
import { menuCloseReason } from "@/components/ui/menu-close-reason";
import {
  contextMenuSnippet,
  type ContextMenuActionEntry,
  type ContextMenuEntry,
} from "@/components/ui/context-menu.source";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import { useActiveSection } from "@/lib/use-active-section";
import uiTranslations from "@/i18n/ui.json";
import contextMenuTranslations from "@shared/content/context-menu/translations.json";
import { AREA_CLICK_DIREITO } from "@shared/primitives/context-menu-area";

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

type Translate = (key: string) => string;

const priorityKeyMap: Record<string, string> = {
  high: "common.high",
  medium: "common.medium",
  low: "common.low",
};

/**
 * Varre `base.item1`, `base.item2`, … enquanto existirem no conteúdo.
 *
 * Citar índice por índice trava a lista no tamanho de hoje: o conteúdo
 * compartilhado ganha um item e ele simplesmente não existe para quem lê — sem
 * erro, sem aviso, nos três idiomas de uma vez. Foi o que aconteceu com o nono
 * critério de acessibilidade deste componente, o do item desabilitado que
 * continua no percurso do teclado.
 *
 * Trocar 8 por 9 não resolveria: o total cravado É o defeito, e ele volta no
 * item seguinte.
 */
function stringsFromDict(
  t: (key: string, defaultValue?: string) => string,
  base: string,
  prefix = "item",
): string[] {
  const out: string[] = [];
  for (let i = 1; ; i++) {
    const value = t(`${base}.${prefix}${i}`, "");
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
const A11Y_TEST_LEVELS = [
  "AA",
  "4.1.2 · A",
  "4.1.2 · A",
  "4.1.2 · A",
  "4.1.2 · A",
  "4.1.2 · A",
  "2.1.1 · A",
  "1.4.3 · AA",
  "2.1.1 · A",
  "4.1.2 · A",
];
const A11Y_TEST_HOW = [
  "axe-core",
  "getByRole('menu')",
  "getAllByRole('menuitem')",
  "getAllByRole('menuitemcheckbox') · aria-checked",
  "getAllByRole('menuitemradio') · aria-checked",
  "aria-disabled",
  "Escape · document.activeElement",
  "axe-core · color-contrast",
  "ArrowDown · document.activeElement",
  "aria-haspopup · aria-expanded",
];

// A moldura tracejada é o único sinal de "clique com o botão direito aqui", e a
// mesma classe vale nas stories e nas cinco docs pages. `nds-border-default` traz
// largura e cor; `nds-border-dashed` só troca `border-style` — as duas juntas, ou
// a moldura sai sólida.
//
// O que era `style` inline (altura de 120px, largura máxima e `border-style`)
// virou classe: altura cravada num bloco de texto não cresce com a fonte do
// navegador (WCAG 1.4.4), e o `nds-p-8` entrega o mesmo quadro sem cravá-la.
// `user-select: none` já vem de `.nds-context-menu-trigger`.
const triggerAreaClass = AREA_CLICK_DIREITO;

// A MESMA área, sem a dica visual: mesmo tamanho, mesmo recheio, mesmo texto
// atenuado — só sem moldura e sem cursor. É o lado do "evite" do par 3, e ela
// existe porque a legenda daquele par contrapõe área COM dica e área SEM. Com o
// tracejado dos dois lados só o rótulo mudava, e o par não ilustrava nada.
// Vanilla é a referência: `makePlainArea` em `ContextMenuDocs.ts`.
const plainAreaClass =
  "nds-cluster nds-w-xs nds-p-8 nds-rounded-md nds-text-body nds-text-muted-foreground";

// ─── Rastreamento das prévias vivas ───────────────────────────────────────────

/**
 * Onde o menu vive na página e como ele se chama no GA4.
 *
 * `menu` é o id ESTÁVEL do menu (`demo`, `with-checkbox`, `pair1-do`…) e
 * `location` a SEÇÃO da página (guideline 07). Toda prévia viva abre, escolhe e
 * fecha — sem rastrear as de Variantes e de Do & Don't, só a demonstração
 * aparecia no relatório, e as treze prévias que a pessoa mais exercita sumiam.
 *
 * O par é montado no CHAMADOR, junto da seção onde a prévia está — nunca num
 * helper por seção com a `location` cravada dentro (contrato da família, §6).
 */
type MenuTracking = { menu: string; location: string };

/**
 * Abertura e fechamento num callback só, porque a lib entrega os dois pelo
 * mesmo `onOpenChange`. O motivo do fechamento sai do vocabulário do design
 * system (`escape`, `overlay`, `api`) — o Tab chega aqui como `focus-out`, que
 * o wrapper escreve, e vira `overlay`: saiu sem decidir.
 */
function trackOpenChange({ menu, location }: MenuTracking) {
  return (open: boolean, eventDetails: { reason: string }) => {
    if (open) {
      track("context_menu_open", { component: "context-menu", menu, location });
      return;
    }
    track("context_menu_close", {
      component: "context-menu",
      menu,
      reason: menuCloseReason(eventDetails.reason),
      location,
    });
  };
}

/**
 * O `label` do payload é IDENTIFICADOR, nunca o rótulo traduzido: texto
 * localizado partiria o mesmo evento em um valor por idioma no GA4 —
 * "Editar", "Edit" e "Editar" chegariam como três ações diferentes.
 */
function trackSelect({ menu, location }: MenuTracking, label: string) {
  return () =>
    track("context_menu_item_select", { component: "context-menu", label, menu, location });
}

/** A área de clique direito, com ou sem a moldura que avisa que ela existe. */
function TriggerArea({ children, plain = false }: { children: ReactNode; plain?: boolean }) {
  return (
    <ContextMenuTrigger
      className={plain ? plainAreaClass : triggerAreaClass}
      data-align="center"
      data-justify="center"
    >
      {children}
    </ContextMenuTrigger>
  );
}

// ─── O menu como dado ─────────────────────────────────────────────────────────
//
// Toda prévia viva desta página é uma LISTA de entradas (`ContextMenuEntry`), e
// é a mesma lista que imprime o código do card (`contextMenuSnippet`) — o desenho do
// vanilla (`variantMenu` + `variantCode`). Até 2026-09-10 cada card tinha um
// literal de código em português ao lado da prévia: quem lia em inglês via
// "Edit" no menu e copiava "Editar".

/** Marcações e grupos de escolha única, pelo id estável de cada um. */
type Selection = Record<string, boolean | string>;

function initialSelection(entries: readonly ContextMenuEntry[]): Selection {
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
function ActionItem({ entry, tracking }: { entry: ContextMenuActionEntry; tracking: MenuTracking }) {
  return (
    <ContextMenuItem
      onClick={trackSelect(tracking, entry.value)}
      inset={entry.inset}
      variant={entry.destructive ? "destructive" : "default"}
    >
      {entry.label}
      {entry.shortcut && <ContextMenuShortcut>{entry.shortcut}</ContextMenuShortcut>}
    </ContextMenuItem>
  );
}

function MenuEntries({ entries, ...props }: EntryProps & { entries: readonly ContextMenuEntry[] }) {
  return (
    <>
      {entries.map((entry, index) => (
        <MenuEntry key={index} entry={entry} {...props} />
      ))}
    </>
  );
}

function MenuEntry({ entry, tracking, selection, select }: EntryProps & { entry: ContextMenuEntry }) {
  switch (entry.kind) {
    case "item":
      return <ActionItem entry={entry} tracking={tracking} />;
    case "separator":
      return <ContextMenuSeparator />;
    case "checkbox":
      return (
        <ContextMenuCheckboxItem
          checked={selection[entry.value] === true}
          onCheckedChange={(checked) => {
            select(entry.value, checked);
            trackSelect(tracking, entry.value)();
          }}
        >
          {entry.label}
        </ContextMenuCheckboxItem>
      );
    case "submenu":
      return (
        <ContextMenuSub>
          <ContextMenuSubTrigger>{entry.label}</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            {entry.items.map((item, index) => (
              <ActionItem key={index} entry={item} tracking={tracking} />
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>
      );
    case "group":
      return (
        <ContextMenuGroup>
          <ContextMenuLabel inset={entry.inset}>{entry.label}</ContextMenuLabel>
          <MenuEntries entries={entry.items} tracking={tracking} selection={selection} select={select} />
        </ContextMenuGroup>
      );
    case "radio-group":
      // UM grupo só, nomeado pelo rótulo que mora dentro dele: o
      // `ContextMenuRadioGroup` já é `role="group"`, e um `ContextMenuGroup` em
      // volta fazia o leitor de tela anunciar um segundo grupo, anônimo.
      //
      // A escolha se reporta pelo CLIQUE na opção, e não pela troca de valor:
      // escolher a opção que já está marcada também é escolher, e o vanilla
      // manda o evento nos dois casos. O `onClick` pega o teclado junto — Enter
      // e Espaço no item da lib despacham um clique.
      return (
        <ContextMenuRadioGroup
          value={selection[entry.value]}
          onValueChange={(value: string) => select(entry.value, value)}
        >
          <ContextMenuLabel>{entry.label}</ContextMenuLabel>
          {entry.options.map((option) => (
            <ContextMenuRadioItem
              key={option.value}
              value={option.value}
              onClick={trackSelect(tracking, `${entry.value}-${option.value}`)}
            >
              {option.label}
            </ContextMenuRadioItem>
          ))}
        </ContextMenuRadioGroup>
      );
  }
}

/**
 * Uma prévia viva: a área, o menu descrito por `entries` e o rastreamento.
 *
 * O estado das marcações mora AQUI, e não no item: o painel desmonta ao fechar,
 * e estado guardado dentro dele voltaria ao valor inicial a cada abertura.
 */
function MenuPreview({
  entries,
  tracking,
  trigger,
  plain = false,
}: {
  entries: readonly ContextMenuEntry[];
  tracking: MenuTracking;
  trigger: string;
  plain?: boolean;
}) {
  const [selection, setSelection] = useState<Selection>(() => initialSelection(entries));
  const select = useCallback(
    (value: string, next: boolean | string) => setSelection((current) => ({ ...current, [value]: next })),
    [],
  );

  return (
    <ContextMenu onOpenChange={trackOpenChange(tracking)}>
      <TriggerArea plain={plain}>{trigger}</TriggerArea>
      <ContextMenuContent>
        <MenuEntries entries={entries} tracking={tracking} selection={selection} select={select} />
      </ContextMenuContent>
    </ContextMenu>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

const getNavGroups = (t: Translate) => [
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

// ─── Prévias ──────────────────────────────────────────────────────────────────
//
// Todo rótulo sai de `demonstration.labels`: literal em português aqui fica em
// português para quem lê a página em inglês ou espanhol, sem erro e sem aviso.
// Uma função por item, e não uma constante, porque o rótulo é lido no idioma do
// MOMENTO em que a prévia é montada — o mesmo desenho do vanilla.

function itemEdit(t: Translate, extra: Partial<ContextMenuActionEntry> = {}): ContextMenuActionEntry {
  return { kind: "item", label: t("demonstration.labels.edit"), value: "edit", ...extra };
}

function itemDuplicate(t: Translate, extra: Partial<ContextMenuActionEntry> = {}): ContextMenuActionEntry {
  return { kind: "item", label: t("demonstration.labels.duplicate"), value: "duplicate", ...extra };
}

function itemDelete(t: Translate, extra: Partial<ContextMenuActionEntry> = {}): ContextMenuActionEntry {
  return { kind: "item", label: t("demonstration.labels.delete"), value: "delete", ...extra };
}

/** "Compartilhar" é SUBMENU nas cinco stacks, com os dois destinos dentro. */
function itemShare(t: Translate): ContextMenuEntry {
  return {
    kind: "submenu",
    label: t("demonstration.labels.share"),
    items: [
      { kind: "item", label: t("demonstration.labels.shareEmail"), value: "share-email" },
      { kind: "item", label: t("demonstration.labels.shareLink"), value: "share-link" },
    ],
  };
}

const SEPARATOR: ContextMenuEntry = { kind: "separator" };

/**
 * A demonstração: as ações SOLTAS, sem grupo em volta. Um grupo sem rótulo é
 * anunciado como grupo anônimo e não diz nada a quem ouve — o vanilla não tem
 * grupo nenhum aqui.
 */
function demoMenu(t: Translate): ContextMenuEntry[] {
  return [
    itemEdit(t, { shortcut: t("demonstration.labels.editShortcut") }),
    itemDuplicate(t),
    itemShare(t),
    SEPARATOR,
    itemDelete(t, { shortcut: t("demonstration.labels.deleteShortcut"), destructive: true }),
  ];
}

/**
 * Os sete cards de Variantes, pela CHAVE do conteúdo compartilhado. A mesma
 * lista monta a prévia e imprime o código — ver `variantCard` no componente.
 */
type VariantKey =
  | "default"
  | "destructive"
  | "label"
  | "withCheckbox"
  | "withRadio"
  | "withSubmenu"
  | "withShortcuts";

function variantMenu(key: VariantKey, t: Translate): ContextMenuEntry[] {
  switch (key) {
    case "default":
      return [itemEdit(t), itemDuplicate(t)];
    case "destructive":
      return [itemEdit(t), SEPARATOR, itemDelete(t, { destructive: true })];
    case "label":
      return [
        {
          kind: "group",
          label: t("demonstration.labels.groupActions"),
          inset: true,
          items: [itemEdit(t, { inset: true }), itemDuplicate(t, { inset: true })],
        },
      ];
    case "withCheckbox":
      // Os mesmos estados da story `WithCheckbox`: grade desmarcada, réguas marcada.
      return [
        {
          kind: "group",
          label: t("demonstration.labels.groupView"),
          items: [
            { kind: "checkbox", label: t("demonstration.labels.showGrid"), value: "show-grid", checked: false },
            { kind: "checkbox", label: t("demonstration.labels.showRulers"), value: "show-rulers", checked: true },
          ],
        },
      ];
    case "withRadio":
      // O `value` do grupo é o prefixo do evento: a escolha chega ao GA4 como
      // `layout-grid`, `layout-list`, `layout-columns`.
      return [
        {
          kind: "radio-group",
          label: t("demonstration.labels.groupLayout"),
          value: "layout",
          selected: "grid",
          options: [
            { label: t("demonstration.labels.layoutGrid"), value: "grid" },
            { label: t("demonstration.labels.layoutList"), value: "list" },
            { label: t("demonstration.labels.layoutColumns"), value: "columns" },
          ],
        },
      ];
    case "withSubmenu":
      return [itemEdit(t), itemDuplicate(t), itemShare(t)];
    case "withShortcuts":
      return [
        itemEdit(t, { shortcut: t("demonstration.labels.editShortcut") }),
        itemDuplicate(t, { shortcut: t("demonstration.labels.duplicateShortcut") }),
        SEPARATOR,
        itemDelete(t, { shortcut: t("demonstration.labels.deleteShortcut"), destructive: true }),
      ];
  }
}

/** A chave do card em kebab — é o `menu` dos eventos (`with-checkbox`…). */
function variantMenuId(key: VariantKey): string {
  return key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

// ─── Código de importação ─────────────────────────────────────────────────────
//
// O código de cada card de Variantes NÃO mora aqui: sai de `contextMenuSnippet`
// com a mesma lista que monta a prévia, no idioma da página.

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

const codeImportWithCheckbox = `import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuLabel,
  ContextMenuCheckboxItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
} from "@/components/ui/context-menu";`;

// O `inset` fica só onde a folha o lê — item, rótulo e sub-gatilho. Os itens de
// marcação e de escolha única não o têm: aceito ali, ele não recuava nada.
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
  indeterminate?: boolean;
}`;

// ─── Componente principal ─────────────────────────────────────────────────────

export function ContextMenuDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(contextMenuTranslations);

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
        (contextMenuTranslations as unknown as Record<
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
    componentSlug: "context-menu",
    aiSummary: tContent("seo.aiSummary"),
    aiEntities: tContent("seo.aiEntities"),
  });

  useEffect(() => {
    track("docs_page_view", {
      component_name: "context-menu",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "context-menu",
        locale,
      });
    },
    [locale]
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  // "Obrigatório" em cada linha de props sai do dicionário de navegação: o
  // literal "Não" ficava em português nos três idiomas.
  const no = tNav("common.no");

  const propsCols = {
    prop: tContent("props.table.prop"),
    type: tContent("props.table.type"),
    default: tContent("props.table.default"),
    required: tContent("props.table.required"),
    description: tContent("props.table.description"),
  };

  // O texto da área, lido uma vez: toda prévia e todo trecho de código o usam.
  const trigger = tContent("demonstration.labels.triggerLabel");

  // Prévia e código de um card de Variantes saem da MESMA lista de entradas —
  // o código mostra o que a prévia desenha, no idioma de quem lê. A seção
  // (`location`) chega de quem chama, como em toda prévia desta página.
  const variantCard = (key: VariantKey, location: string) => {
    const entries = variantMenu(key, tContent);
    return {
      code: contextMenuSnippet({ triggerLabel: trigger, entries }),
      preview: (
        <MenuPreview entries={entries} tracking={{ menu: variantMenuId(key), location }} trigger={trigger} />
      ),
    };
  };

  // Par 1: Editar e Excluir, SEM separador, igual nos dois lados — o vanilla é
  // a referência. A única diferença entre os lados é a alternativa visível.
  const pair1Menu = [itemEdit(tContent), itemDelete(tContent, { destructive: true })];

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
        <div className="nds-cluster nds-p-8 nds-min-h-50" data-align="center" data-justify="center">
          <MenuPreview entries={demoMenu(tContent)} tracking={{ menu: "demo", location: "docs_demo" }} trigger={trigger} />
        </div>
      </DocsDemonstration>

      {/* ── Anatomia ───────────────────────────────────────────────── */}
      <DocsAnatomy
        title={tContent("anatomy.title")}
        items={stringsFromDict(tContent, "anatomy")}
        structureLabel={tContent("anatomy.structureLabel")}
        structureCode={tContent("anatomy.structureCode")}
      />

      {/* ── Quando Usar ────────────────────────────────────────────── */}
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
        do={{
          title: tContent("usage.do.title"),
          items: stringsFromDict(tContent, "usage.do"),
        }}
        dont={{
          title: tContent("usage.dont.title"),
          items: stringsFromDict(tContent, "usage.dont"),
        }}
      />

      {/* ── Do & Don't ─────────────────────────────────────────────── */}
      <DocsDoDont
        title={tContent("doDont.title")}
        pairs={[
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            // O MESMO menu dos dois lados; o que muda é só a alternativa
            // visível. O lado do faça DESENHA o botão que a legenda promete, e
            // o do evite deixa o gesto como único caminho.
            doPreview: (
              <div className="nds-stack" data-spacing="sm" data-align="center">
                <MenuPreview entries={pair1Menu} tracking={{ menu: "pair1-do", location: "docs_do_dont" }} trigger={trigger} />
                {/* A MESMA ação do menu, alcançável sem o botão direito. */}
                <Button variant="outline" size="sm">
                  {tContent("demonstration.labels.edit")}
                </Button>
              </div>
            ),
            dontPreview: (
              <MenuPreview entries={pair1Menu} tracking={{ menu: "pair1-dont", location: "docs_do_dont" }} trigger={trigger} />
            ),
            doCaption: toPlainText(tContent("doDont.pair1.do")),
            dontCaption: toPlainText(tContent("doDont.pair1.dont")),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            // As duas legendas falam do ITEM DESTRUTIVO: à esquerda na variante
            // destrutiva, separado dos demais por uma linha; à direita com a
            // aparência dos outros, no meio da lista. O submenu aninhado que
            // ocupava este lado ilustrava outra regra (`notes.tip3`), não esta.
            doPreview: (
              <MenuPreview
                entries={[
                  itemEdit(tContent),
                  itemDuplicate(tContent),
                  SEPARATOR,
                  itemDelete(tContent, { destructive: true }),
                ]}
                tracking={{ menu: "pair2-do", location: "docs_do_dont" }}
                trigger={trigger}
              />
            ),
            dontPreview: (
              <MenuPreview
                entries={[itemEdit(tContent), itemDelete(tContent), itemDuplicate(tContent)]}
                tracking={{ menu: "pair2-dont", location: "docs_do_dont" }}
                trigger={trigger}
              />
            ),
            doCaption: toPlainText(tContent("doDont.pair2.do")),
            dontCaption: toPlainText(tContent("doDont.pair2.dont")),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            // Os dois lados montam o MESMO menu (Editar + Duplicar); o que os
            // separa é a DICA VISUAL, que é o assunto da legenda. À esquerda a
            // moldura tracejada e a linha que diz o gesto; à direita a mesma
            // área sem moldura e sem aviso — o menu existe e ninguém tem como
            // saber.
            doPreview: (
              <MenuPreview
                entries={[itemEdit(tContent), itemDuplicate(tContent)]}
                tracking={{ menu: "pair3-do", location: "docs_do_dont" }}
                trigger={trigger}
              />
            ),
            dontPreview: (
              <MenuPreview
                entries={[itemEdit(tContent), itemDuplicate(tContent)]}
                tracking={{ menu: "pair3-dont", location: "docs_do_dont" }}
                trigger={tContent("demonstration.labels.areaNoHint")}
                plain
              />
            ),
            doCaption: toPlainText(tContent("doDont.pair3.do")),
            dontCaption: toPlainText(tContent("doDont.pair3.dont")),
          },
        ]}
      />

      {/* ── Importação ─────────────────────────────────────────────── */}
      <DocsImport
        title={tContent("import.title")}
        description={tContent("import.basic")}
        code={codeImportBasic}
        secondaryDescription={tContent("import.withCheckbox")}
        secondaryCode={codeImportWithCheckbox}
        componentSlug="context-menu"
      />

      {/* ── Variantes ──────────────────────────────────────────────── */}
      {/* O `trackId` de todo card é a CHAVE do conteúdo: é ela que vira
          `snippet_id` no GA4, e um nome com espaço ("Label + Inset") ou
          traduzido partia o mesmo card em valores diferentes. O `name` é o
          título que se LÊ: os três primeiros cards o tiram de `variants.names`
          (o `variants.items.<card>` deles é só a descrição); até 2026-09-11 o
          título era a chave crua. */}
      <DocsCompositions
        id="variantes"
        title={tContent("variants.title")}
        note={tContent("variants.note")}
        useWhenLabel={tNav("common.useWhen")}
        componentSlug="context-menu"
        items={[
          {
            trackId: "default",
            name: tContent("variants.names.default"),
            description: stripHtml(tContent("variants.items.default")),
            ...variantCard("default", "docs_variantes"),
          },
          {
            trackId: "destructive",
            name: tContent("variants.names.destructive"),
            description: stripHtml(tContent("variants.items.destructive")),
            ...variantCard("destructive", "docs_variantes"),
          },
          {
            trackId: "label",
            name: tContent("variants.names.label"),
            description: stripHtml(tContent("variants.items.label")),
            ...variantCard("label", "docs_variantes"),
          },
          {
            trackId: "withCheckbox",
            name: tContent("variants.items.withCheckbox.name"),
            description: tContent("variants.items.withCheckbox.description"),
            useWhen: tContent("variants.items.withCheckbox.use"),
            ...variantCard("withCheckbox", "docs_variantes"),
          },
          {
            trackId: "withRadio",
            name: tContent("variants.items.withRadio.name"),
            description: tContent("variants.items.withRadio.description"),
            useWhen: tContent("variants.items.withRadio.use"),
            ...variantCard("withRadio", "docs_variantes"),
          },
          {
            trackId: "withSubmenu",
            name: tContent("variants.items.withSubmenu.name"),
            description: tContent("variants.items.withSubmenu.description"),
            useWhen: tContent("variants.items.withSubmenu.use"),
            ...variantCard("withSubmenu", "docs_variantes"),
          },
          {
            trackId: "withShortcuts",
            name: tContent("variants.items.withShortcuts.name"),
            description: tContent("variants.items.withShortcuts.description"),
            useWhen: tContent("variants.items.withShortcuts.use"),
            ...variantCard("withShortcuts", "docs_variantes"),
          },
        ]}
      />

      {/* ── Estados ────────────────────────────────────────────────── */}
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
            label: tContent("states.focused.label"),
            trigger: toPlainText(tContent("states.focused.trigger")),
            behavior: toPlainText(tContent("states.focused.behavior")),
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
          {
            label: tContent("states.mixed.label"),
            trigger: toPlainText(tContent("states.mixed.trigger")),
            behavior: toPlainText(tContent("states.mixed.behavior")),
          },
          {
            label: tContent("states.subOpen.label"),
            trigger: toPlainText(tContent("states.subOpen.trigger")),
            behavior: toPlainText(tContent("states.subOpen.behavior")),
          },
        ]}
      />

      {/* ── Propriedades ───────────────────────────────────────────── */}
      {/* Só o que esta stack TEM. O item de ação escuta `onClick` — o
          `Menu.Item` da base-ui não tem `onSelect`, e a tabela documentava um
          nome que não faz nada. `inset` fica fora do item de marcação, que não
          recua; `indeterminate` entra, porque o wrapper o implementa. Os
          padrões de `ContextMenuContent` são os do wrapper, que é quem os fixa. */}
      <DocsProps
        title={tContent("props.title")}
        tables={[
          {
            title: tContent("props.rootTitle"),
            cols: propsCols,
            items: [
              {
                name: "onOpenChange",
                type: "(open: boolean, eventDetails) => void",
                defaultValue: "—",
                required: no,
                description: tContent("props.items.onOpenChange"),
              },
            ],
          },
          {
            title: tContent("props.contentTitle"),
            cols: propsCols,
            items: [
              {
                name: "align",
                type: '"start" | "center" | "end"',
                defaultValue: '"start"',
                required: no,
                description: stripHtml(tContent("props.items.align")),
              },
              {
                name: "alignOffset",
                type: "number",
                defaultValue: "4",
                required: no,
                description: stripHtml(tContent("props.items.alignOffset")),
              },
              {
                name: "side",
                type: '"top" | "right" | "bottom" | "left"',
                defaultValue: '"right"',
                required: no,
                description: stripHtml(tContent("props.items.side")),
              },
              {
                name: "sideOffset",
                type: "number",
                defaultValue: "0",
                required: no,
                description: stripHtml(tContent("props.items.sideOffset")),
              },
            ],
          },
          {
            title: tContent("props.itemTitle"),
            cols: propsCols,
            items: [
              {
                name: "variant",
                type: '"default" | "destructive"',
                defaultValue: '"default"',
                required: no,
                description: stripHtml(tContent("props.items.variant")),
              },
              {
                name: "inset",
                type: "boolean",
                defaultValue: "false",
                required: no,
                description: stripHtml(tContent("props.items.inset")),
              },
              {
                name: "disabled",
                type: "boolean",
                defaultValue: "false",
                required: no,
                description: tContent("props.items.disabled"),
              },
              {
                name: "onClick",
                type: "(event: MouseEvent) => void",
                defaultValue: "—",
                required: no,
                description: tContent("props.items.onSelect"),
              },
            ],
          },
          {
            title: tContent("props.checkboxItemTitle"),
            cols: propsCols,
            items: [
              {
                name: "checked",
                type: "boolean",
                defaultValue: "false",
                required: no,
                description: tContent("props.items.checked"),
              },
              {
                name: "onCheckedChange",
                type: "(checked: boolean, eventDetails) => void",
                defaultValue: "—",
                required: no,
                description: tContent("props.items.onCheckedChange"),
              },
              {
                name: "indeterminate",
                type: "boolean",
                defaultValue: "false",
                required: no,
                description: tContent("props.items.indeterminate"),
              },
            ],
          },
          {
            // O `value` do GRUPO é a opção marcada; o de cada opção é outra
            // coisa, e mora na tabela do RadioItem logo abaixo.
            title: tContent("props.radioGroupTitle"),
            cols: propsCols,
            items: [
              {
                name: "value",
                type: "string",
                defaultValue: "—",
                required: no,
                description: tContent("props.items.modelValue"),
              },
              {
                name: "onValueChange",
                type: "(value: string, eventDetails) => void",
                defaultValue: "—",
                required: no,
                description: tContent("props.items.onValueChange"),
              },
            ],
          },
          {
            title: tContent("props.radioItemTitle"),
            cols: propsCols,
            items: [
              {
                name: "value",
                type: "string",
                defaultValue: "—",
                required: tNav("common.yes"),
                description: tContent("props.items.value"),
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
        // A coluna do meio é "Classe .nds-*" e trazia nome de utilitária do
        // Tailwind — vocabulário morto desde a migração. Cada linha aponta agora
        // o seletor que o CSS realmente usa, e cada token foi medido no
        // navegador: só `--elevation-md` muda a sombra (`--shadow` e
        // `--shadow-md` não movem nada), o separador é `--muted` e não
        // `--border`, e o raio do item é `--radius-sm`, não `--radius`.
        items={[
          { token: "--popover",            value: ".nds-dropdown-menu-content",    description: tContent("tokens.table.popoverBg") },
          { token: "--popover-foreground", value: ".nds-dropdown-menu-content",    description: tContent("tokens.table.popoverFg") },
          { token: "--accent",             value: ".nds-dropdown-menu-item",       description: tContent("tokens.table.accentBg") },
          { token: "--accent-foreground",  value: ".nds-dropdown-menu-item",       description: tContent("tokens.table.accentFg") },
          { token: "--destructive",        value: '[data-variant="destructive"]',  description: tContent("tokens.table.destructive") },
          { token: "--destructive",        value: '.nds-dropdown-menu-item[data-variant="destructive"]:focus', description: tContent("tokens.table.destructiveFocus") },
          { token: "--muted-foreground",   value: ".nds-dropdown-menu-shortcut",   description: tContent("tokens.table.mutedFg") },
          { token: "--muted-foreground",   value: ".nds-dropdown-menu-label",      description: tContent("tokens.table.mutedFgLabel") },
          { token: "--muted",              value: ".nds-dropdown-menu-separator",  description: tContent("tokens.table.border") },
          { token: "--border",             value: ".nds-dropdown-menu-content",    description: tContent("tokens.table.popupBorder") },
          { token: "--elevation-md",       value: ".nds-dropdown-menu-content",    description: tContent("tokens.table.shadow") },
          { token: "--radius",             value: ".nds-dropdown-menu-content",    description: tContent("tokens.table.radius") },
          { token: "--radius-sm",          value: ".nds-dropdown-menu-item",       description: tContent("tokens.table.radiusItem") },
          { token: "--z-popover",          value: ".nds-dropdown-menu-positioner", description: tContent("tokens.table.zIndex") },
        ]}
        customizationTitle={tContent("tokens.customizationTitle")}
        // Do conteúdo compartilhado (variante `web`): o bloco escrito aqui
        // carregava valores de paleta de fora do tema do design system.
        customizationCode={tContent("tokens.customizationCode")}
      />

      {/* ── Acessibilidade ─────────────────────────────────────────── */}
      {/* A alternativa acessível já chega pela lista do leitor de tela
          (`screenReaderItems`); repeti-la aqui a imprimia duas vezes. */}
      <DocsAccessibility
        screenReaderTitle={tNav("common.screenReader")}
        screenReaderItems={screenReaderItems}
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
        ]}
        keyboardTitle={tContent("accessibility.keyboardTitle")}
        keyboardItems={[
          { key: "Right-click / Menu / Shift+F10", description: tContent("accessibility.keyboard.rightClick") },
          { key: "Arrow Down",  description: tContent("accessibility.keyboard.arrowDown") },
          { key: "Arrow Up",    description: tContent("accessibility.keyboard.arrowUp") },
          { key: "Arrow Right", description: tContent("accessibility.keyboard.arrowRight") },
          { key: "Arrow Left",  description: tContent("accessibility.keyboard.arrowLeft") },
          { key: "Home / End",  description: tContent("accessibility.keyboard.homeEnd") },
          { key: "A–Z",         description: tContent("accessibility.keyboard.typeahead") },
          { key: "Enter",       description: tContent("accessibility.keyboard.enter") },
          { key: "Space",       description: tContent("accessibility.keyboard.space") },
          { key: "Esc",         description: tContent("accessibility.keyboard.escape") },
          { key: "Tab",         description: tContent("accessibility.keyboard.tab") },
        ]}
      />

      {/* ── Relacionados ───────────────────────────────────────────── */}
      <DocsRelated
        title={tContent("related.title")}
        items={[
          {
            name: "DropdownMenu",
            description: toPlainText(tContent("related.dropdownMenu")),
            path: "?path=/docs/components-overlay-dropdownmenu--docs",
          },
          {
            name: "Menubar",
            description: toPlainText(tContent("related.menubar")),
            path: "?path=/docs/components-navigation-menubar--docs",
          },
          {
            name: "Dialog",
            description: toPlainText(tContent("related.dialog")),
            path: "?path=/docs/components-overlay-dialog--docs",
          },
          {
            name: "AlertDialog",
            description: toPlainText(tContent("related.alertDialog")),
            path: "?path=/docs/components-overlay-alertdialog--docs",
          },
          {
            name: "Tooltip",
            description: toPlainText(tContent("related.tooltip")),
            path: "?path=/docs/components-overlay-tooltip--docs",
          },
        ]}
      />

      {/* ── Notas ──────────────────────────────────────────────────── */}
      <DocsNotes
        title={tContent("notes.title")}
        items={stringsFromDict(tContent, "notes", "tip").map((content) => ({
          title: "",
          content,
        }))}
      />

      {/* ── Analytics ──────────────────────────────────────────────── */}
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
