import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn, userEvent, within, expect, waitFor } from "storybook/test";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";
import { ContextMenuDocs } from "@/components/docs/ContextMenuDocs";
import { FOCUS_RULE_GUARDA, waitForPortal, waitForPortalGone } from "@/lib/wait-for-portal";
import {
  AREA_CLICK_DIREITO,
  gestoOpen,
  clickOutside,
  closeMenu,
} from "@shared/testing/context-menu-area";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from "@/components/ui/context-menu";
import { contextMenuSource } from "./context-menu.source";

import { figmaDesign } from "@shared/figma/design-links";
// ─── Meta ─────────────────────────────────────────────────────────────────────

// `onOpenChange` é REDECLARADO com um argumento só. A lib entrega
// `(open, eventDetails)`, e o `eventDetails` carrega o evento nativo — a aba
// Actions estoura `SecurityError` ao serializar o `Window` do iframe, e o erro
// aparece como falha da play. O `render` encaminha só o booleano, e o tipo
// registra essa decisão em vez de deixá-la implícita.
type ContextMenuArgs = Omit<React.ComponentProps<typeof ContextMenu>, "onOpenChange"> & {
  triggerLabel: string;
  showDestructive: boolean;
  showSeparator: boolean;
  showShortcuts: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Os itens do menu aberto, na ordem em que aparecem. */
const menuItems = async () => [
  ...(await waitForPortal("menu")).querySelectorAll<HTMLElement>('[data-slot="context-menu-item"]'),
];

// `component` fica de fora de propósito: com ele o `satisfies` estreita os args
// para as props da raiz e o `triggerLabel` — que é arg da STORY, não prop do
// componente — passa a não existir para o TypeScript. A aba API Reference sai
// dos `argTypes` escritos aqui, então nada se perde.
const meta: Meta<ContextMenuArgs> = {
  title: "Components/Overlay/ContextMenu",
  tags: ["autodocs", "overlay"],
  parameters: {
    design: figmaDesign("dropdownMenu"),
    layout: "centered",
    a11y: { config: { rules: [FOCUS_RULE_GUARDA] } },
    docs: {
      description: {
        component:
          "Menu contextual ativado pelo botão direito. Suporta itens, marcação, escolha única, submenus e atalhos.",
      },
      page: withAutoDocsTab(ContextMenuDocs),
      // O `render` imprime a área com o gancho das plays e o espião do
      // callback; a transform devolve a composição que se copia.
      source: { transform: contextMenuSource },
    },
  },
  argTypes: {
    triggerLabel: {
      control: "text",
      description: "Texto da área que responde ao gesto.",
      table: { type: { summary: "string" }, defaultValue: { summary: "Clique com o botão direito aqui" } },
    },
    showDestructive: {
      control: "boolean",
      description: "Exibe o item destrutivo (Excluir).",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "true" } },
    },
    showSeparator: {
      control: "boolean",
      description: "Exibe a divisória antes do item destrutivo.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "true" } },
    },
    showShortcuts: {
      control: "boolean",
      description: "Exibe os atalhos de teclado ao lado dos rótulos.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "true" } },
    },
    onOpenChange: {
      control: false,
      description: "Callback disparado ao abrir e ao fechar o menu.",
      table: { type: { summary: "(open: boolean) => void" } },
    },
  },
  args: {
    triggerLabel: "Clique com o botão direito aqui",
    showDestructive: true,
    showSeparator: true,
    showShortcuts: true,
    onOpenChange: fn(),
  },
};

export default meta;
type Story = StoryObj<ContextMenuArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  parameters: {
    covers: [
      "functional.item1", "functional.item2", "functional.item3", "functional.item4",
      "functional.item12", "functional.item13", "functional.item14", "functional.item15",
      "accessibility.item1", "accessibility.item2", "accessibility.item3",
      "accessibility.item7", "accessibility.item8",
      "visual.item1",
    ],
  },
  // O spy recebe só o booleano: o segundo argumento da lib carrega o evento
  // nativo, e a aba Actions estoura `SecurityError` ao serializar o `Window` do
  // iframe — o erro aparece como falha da play e contamina o resultado.
  render: ({
    triggerLabel,
    showDestructive,
    showSeparator,
    showShortcuts,
    onOpenChange,
    ...args
  }) => (
    <ContextMenu {...args} onOpenChange={(open) => onOpenChange?.(open)}>
      <ContextMenuTrigger
        className={AREA_CLICK_DIREITO}
        data-align="center"
        data-justify="center"
        data-testid="area"
      >
        {triggerLabel}
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem>
          Editar
          {showShortcuts && <ContextMenuShortcut>Ctrl+E</ContextMenuShortcut>}
        </ContextMenuItem>
        <ContextMenuItem>Duplicar</ContextMenuItem>
        {showSeparator && <ContextMenuSeparator />}
        {showDestructive && (
          <ContextMenuItem variant="destructive">
            Excluir
            {showShortcuts && <ContextMenuShortcut>Delete</ContextMenuShortcut>}
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  ),
  play: async ({ canvasElement, step, args }) => {
    const area = () => within(canvasElement).getByTestId("area");

    await step("O menu do navegador não aparece por cima do nosso", async () => {
      // `defaultPrevented` é a única prova possível aqui: o menu nativo não
      // existe no DOM. Sem esta chamada barrada, os dois menus se sobrepõem.
      await closeMenu();
      const evento = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
      area().dispatchEvent(evento);
      await waitFor(() => expect(evento.defaultPrevented).toBe(true));
    });

    await step("O botão direito abre o menu ONDE o ponteiro estava", async () => {
      // O popup não é ancorado no gatilho: ele nasce no ponto do gesto. É a
      // única diferença real em relação ao DropdownMenu.
      const menu = await gestoOpen(area());
      const boxArea = area().getBoundingClientRect();
      const boxMenu = menu.getBoundingClientRect();
      await expect(
        Math.abs(boxMenu.left - (boxArea.left + boxArea.width / 2)),
      ).toBeLessThan(24);
      await expect(
        Math.abs(boxMenu.top - (boxArea.top + boxArea.height / 2)),
      ).toBeLessThan(24);
      await expect(args.onOpenChange).toHaveBeenCalled();
    });

    await step("Os itens são itens de menu de verdade", async () => {
      const menu = await waitForPortal("menu");
      const items = [...menu.querySelectorAll('[data-slot="context-menu-item"]')];
      await expect(items.length).toBe(3);
      for (const item of items) await expect(item.getAttribute("role")).toBe("menuitem");
      await expect(
        menu.querySelector('[data-slot="context-menu-separator"]')?.getAttribute("role"),
      ).toBe("separator");
    });

    await step("O atalho é lido junto do item, não escondido", async () => {
      // "Excluir, Delete" é o nome útil. Com `aria-hidden` no atalho a pessoa ouviria
      // só "Excluir" e o atalho não ensinaria nada.
      const menu = await waitForPortal("menu");
      const atalho = menu.querySelector<HTMLElement>('[data-slot="context-menu-shortcut"]')!;
      await expect(atalho.hasAttribute("aria-hidden")).toBe(false);
      await expect(atalho.closest('[data-slot="context-menu-item"]')).not.toBeNull();
    });

    await step("As setas percorrem os itens na ordem em que aparecem", async () => {
      // O foco parte de um item conhecido: assim o passo vale igual na primeira
      // rodada e no replay, e não depende de onde a abertura deixou o foco.
      const items = await menuItems();
      items[0].focus();
      await userEvent.keyboard("{ArrowDown}");
      await waitFor(() => expect(document.activeElement).toBe(items[1]));
      await userEvent.keyboard("{ArrowUp}");
      await waitFor(() => expect(document.activeElement).toBe(items[0]));
    });

    await step("Home e End levam o foco às pontas do menu", async () => {
      // Parte do item do MEIO: de uma das pontas, uma das teclas não teria para
      // onde andar e o passo passaria sem medir nada.
      const items = await menuItems();
      items[1].focus();
      await userEvent.keyboard("{End}");
      await waitFor(() => expect(document.activeElement).toBe(items[items.length - 1]));
      await userEvent.keyboard("{Home}");
      await waitFor(() => expect(document.activeElement).toBe(items[0]));
    });

    await step("Digitar a letra inicial leva o foco ao item que começa com ela", async () => {
      // Editar · Duplicar · Excluir: "d" a partir de Editar só tem um destino.
      // A comparação é com OUTRO item, nunca com "o foco mudou" — um salto para
      // o lugar errado também mudaria.
      const items = await menuItems();
      items[0].focus();
      await userEvent.keyboard("d");
      await waitFor(() => expect(document.activeElement).toBe(items[1]));
    });

    await step("Escolher um item fecha o menu e devolve o foco à área", async () => {
      // O fechamento por ESCOLHA é o único em que a pessoa decidiu — o motivo
      // `api` do `context_menu_close`. O foco volta para a área, de onde a
      // pessoa partiu; caído no `<body>`, o próximo Tab recomeçaria a página.
      // Enter no item, como no vanilla: a lib o converte no mesmo clique.
      await gestoOpen(area());
      const items = await menuItems();
      items[1].focus();
      await userEvent.keyboard("{Enter}");
      await waitForPortalGone("menu");
      await waitFor(() => expect(document.activeElement).toBe(area()));
      await expect(args.onOpenChange).toHaveBeenLastCalledWith(false);
    });

    await step("Escape fecha e devolve o foco à área", async () => {
      await gestoOpen(area());
      await userEvent.keyboard("{Escape}");
      await waitForPortalGone("menu");
      await waitFor(() => expect(document.activeElement).toBe(area()));
    });

    await step("Clique fora fecha", async () => {
      await gestoOpen(area());
      await clickOutside();
      await waitForPortalGone("menu");
    });

    await step("Tab fecha o menu e o foco segue o percurso da página", async () => {
      // O menu NÃO prende o foco (C2): prender é contrato de diálogo. A lib
      // prende o Tab no painel do menu de contexto, e quem o solta é o wrapper.
      //
      // Um ponto de tabulação logo depois da área, só durante o passo: sem ele
      // a página da story não tem "próximo", e o passo não distinguiria "seguiu
      // a página" de "voltou para a área". Sai no `finally`, antes do axe.
      const nextStop = document.createElement("button");
      nextStop.type = "button";
      nextStop.textContent = "Próximo da página";
      area().insertAdjacentElement("afterend", nextStop);
      try {
        await gestoOpen(area());
        const items = await menuItems();
        items[0].focus();
        await userEvent.tab();
        await waitForPortalGone("menu");
        // O destino sai da ÁREA, não do item: o painel vive em portal no fim do
        // `<body>`, e "o próximo depois do item" seria uma âncora de foco da lib.
        await waitFor(() => expect(document.activeElement).toBe(nextStop));
        await expect(args.onOpenChange).toHaveBeenLastCalledWith(false);
      } finally {
        nextStop.remove();
      }
    });

    await step("Shift+F10 com a área focada abre o menu, como o clique direito", async () => {
      // A área PRECISA estar na ordem de tabulação: a tecla de menu e o
      // Shift+F10 disparam `contextmenu` no elemento focado, e sem parada de
      // tabulação o menu não existe para quem não usa mouse.
      area().focus();
      await expect(document.activeElement).toBe(area());
      await userEvent.keyboard("{Shift>}{F10}{/Shift}");
      // O user-event dispara as teclas, mas não executa a ação padrão do
      // navegador para elas — que é, justamente, disparar `contextmenu` no
      // elemento focado. A play faz a parte do navegador; o que se mede é que
      // esse evento, chegando à área focada, abre o menu.
      const box = area().getBoundingClientRect();
      area().dispatchEvent(
        new MouseEvent("contextmenu", {
          bubbles: true,
          cancelable: true,
          clientX: box.left + box.width / 2,
          clientY: box.top + box.height / 2,
        }),
      );
      await expect(await waitForPortal("menu")).toBeVisible();
      await userEvent.keyboard("{Escape}");
      await waitForPortalGone("menu");
    });

    await step("A story termina com o menu ABERTO", async () => {
      // É o estado que o Chromatic fotografa e o axe varre — `visual.item1`
      // descreve o menu aberto, não a área vazia.
      const menu = await gestoOpen(area());
      await expect(menu).toBeVisible();
    });
  },
};
