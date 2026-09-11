import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within, expect, fn, waitFor } from "storybook/test";
import { waitForPortal, waitForPortalGone } from "@/lib/wait-for-portal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { dropdownMenuSource } from "./dropdown-menu.source";
import { Button } from "./button";
import { DropdownMenuDocs } from "@/components/docs/DropdownMenuDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

import { figmaDesign } from "@shared/figma/design-links";
const meta = {
  title: "Components/Overlay/DropdownMenu",
  component: DropdownMenu,
  tags: ["autodocs", "overlay"],
  parameters: {
    design: figmaDesign("dropdownMenu"),
    layout: "centered",
    docs: {
      page: withAutoDocsTab(DropdownMenuDocs),
      // O painel imprimia o `<div class="nds-min-h-80" style={{ contain }}>` do canvas e
      // o `{...rootArgs}` da desestruturação — andaime, não componente.
      source: { transform: dropdownMenuSource },
    },
  },
  argTypes: {
    side: {
      control: { type: "radio" },
      options: ["top", "bottom", "left", "right"],
      description: "Lado de abertura do Content.",
    },
    align: {
      control: { type: "radio" },
      options: ["start", "center", "end"],
      description: "Alinhamento horizontal do Content.",
    },
    modal: {
      control: "boolean",
      description: "Bloqueia interação com o resto da página quando aberto.",
    },
    defaultOpen: {
      control: "boolean",
      description: "Estado inicial em modo não-controlado.",
    },
  },
  args: {
    side: "bottom",
    align: "start",
    modal: true,
    defaultOpen: false,
  },
} as Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

// Espião de escopo de MÓDULO: criado dentro do `render` ele seria inalcançável
// pelo `play`. Recebe só o rótulo — o evento nativo não serve de prova e pesa
// na aba Actions.
const itemSelectSpy = fn();

/**
 * Clique fora do menu, por despacho direto no `<body>`.
 *
 * `userEvent.click(document.body)` não serve: com o menu modal a lib segura o
 * resto da página, e o `userEvent` se recusa a clicar em elemento assim — a
 * play morre com erro em vez de falha. Os três eventos são de propósito: a
 * camada dispensável escuta um deles conforme a lib, e despachar só o `click`
 * foi a causa da falha antiga do Sheet. É o mesmo gesto do `clickOutside` do
 * ContextMenu (`@shared/testing/context-menu-area`), que espera pelo painel
 * DAQUELE componente.
 */
function clickOutside(): void {
  for (const type of ["pointerdown", "mousedown", "click"] as const) {
    document.body.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, button: 0 }));
  }
}

export const Playground: Story = {
  args: {
    onOpenChange: fn(),
  },
  parameters: {
    covers: [
      "functional.item1",
      "functional.item3",
      "functional.item4",
      "functional.item13",
      "accessibility.item1",
      "accessibility.item2",
      "accessibility.item3",
      "accessibility.item5",
    ],
  },
  render: (args) => {
    const { side, align, ...rootArgs } = args as typeof args & {
      side?: "top" | "bottom" | "left" | "right";
      align?: "start" | "center" | "end";
    };
    return (
      <div className="nds-min-h-80" style={{ contain: "layout", position: "relative" }}>
        <DropdownMenu {...rootArgs}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Abrir menu</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side={side} align={align}>
            {/*
              O rótulo tem que morar dentro do grupo que ele nomeia. Fora dele o
              primitivo lança "MenuGroupContext is missing" e o menu inteiro
              deixa de renderizar — sem erro na tela, só um portal vazio. Foi o
              que derrubava esta story e mais três.
            */}
            <DropdownMenuGroup>
              <DropdownMenuLabel>Conta</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => itemSelectSpy("Perfil")}>Perfil</DropdownMenuItem>
              <DropdownMenuItem onClick={() => itemSelectSpy("Configurações")}>
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => itemSelectSpy("Sair")}>
                Sair
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: /Abrir menu/i });

    await step("O gatilho anuncia que abre um menu, e que está fechado", async () => {
      await expect(trigger).toHaveAttribute("aria-haspopup", "menu");
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
    });

    await step("Clicar abre o menu com papel de menu e o foco entra nele", async () => {
      // Idempotente: o clique só acontece com o menu fechado, então o replay do
      // painel Interactions parte do mesmo estado da primeira rodada.
      if (trigger.getAttribute("aria-expanded") !== "true") await userEvent.click(trigger);

      const menu = await waitForPortal("menu");
      await expect(menu).toBeVisible();
      await expect(trigger).toHaveAttribute("aria-expanded", "true");
      await expect(args.onOpenChange).toHaveBeenCalledWith(true, expect.anything());
      await expect(within(menu).getAllByRole("menuitem")).toHaveLength(3);
      // O foco tem que ENTRAR no menu: se ficasse no gatilho, a seta seguinte
      // não acharia item nenhum e o menu seria inoperável por teclado.
      await waitFor(async () => {
        await expect(menu.contains(document.activeElement)).toBe(true);
      });
    });

    await step("Enter escolhe o item, fecha o menu e devolve o foco ao gatilho", async () => {
      const menu = await waitForPortal("menu");
      within(menu).getAllByRole("menuitem")[0].focus();
      await userEvent.keyboard("{Enter}");
      await waitForPortalGone("menu");
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      // O foco não pode cair no corpo do documento: quem navega por teclado
      // teria de percorrer a página inteira de novo para voltar ao ponto.
      await waitFor(async () => {
        await expect(document.activeElement).toBe(trigger);
      });
    });

    await step("Escape fecha e devolve o foco ao gatilho", async () => {
      if (trigger.getAttribute("aria-expanded") !== "true") await userEvent.click(trigger);
      await waitForPortal("menu");

      await userEvent.keyboard("{Escape}");
      await waitForPortalGone("menu");
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      await waitFor(async () => {
        await expect(document.activeElement).toBe(trigger);
      });
    });

    await step("Clicar fora fecha o menu sem executar nenhum item", async () => {
      // Contrato C5: clique fora é "saí sem decidir". Fechar executando o item
      // em foco — o primeiro, que a lib destaca ao abrir — seria a ação que a
      // pessoa não pediu. A contagem parte do valor ATUAL do espião: o passo do
      // Enter, acima, já escolheu um item nesta rodada.
      if (trigger.getAttribute("aria-expanded") !== "true") await userEvent.click(trigger);
      await waitForPortal("menu");
      const selectionsBefore = itemSelectSpy.mock.calls.length;

      clickOutside();
      await waitForPortalGone("menu");
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      await expect(itemSelectSpy).toHaveBeenCalledTimes(selectionsBefore);
      // O motivo que a lib entrega é o do clique fora — é dele que sai o
      // `overlay` do `dropdown_menu_close`.
      await expect(args.onOpenChange).toHaveBeenLastCalledWith(
        false,
        expect.objectContaining({ reason: "outside-press" }),
      );
    });
  },
};

/**
 * Um `Tab` de teclado, DESPACHADO À MÃO no elemento em foco.
 *
 * Nesta stack quem decide o Tab é o `keydown` do PAINEL, no wrapper — a lib o
 * deixa para o navegador. Um `keydown` despachado não tem ação padrão: o
 * navegador não move o foco, e as âncoras de foco da lib em volta do portal não
 * entram em jogo. O que a story mede é, então, que o wrapper é dono da tecla.
 *
 * Medido em 2026-09-10, nos cinco casos destas stories, com três entradas —
 * teclado REAL (CDP), `userEvent.tab()` e este despacho. Antes do conserto, as
 * duas primeiras concordavam entre si (e reprovavam três casos); o despacho
 * reprovava os cinco, até o Tab que a lib acertava sozinha pelo foco nativo.
 * Depois do conserto, as três pousam no mesmo lugar nos cinco. O despacho fica
 * por ter dentes em todos os passos e por não depender da ordem de tabulação
 * que o `user-event` calcula por conta própria quando ninguém barra a tecla —
 * e é a mesma forma das outras stacks.
 */
function pressTab(shift = false): void {
  document.activeElement?.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Tab", shiftKey: shift, bubbles: true, cancelable: true }),
  );
}

export const TabLeavesMenu: Story = {
  parameters: {
    // Tab e Shift+Tab, do painel raiz e de dentro do submenu, até o vizinho do
    // gatilho. O gatilho como última parada fica em `TabAtPageEnd`.
    covers: ["functional.item9"],
    // O menu é MODAL aqui, que é o padrão: o conserto do Tab não pode custar
    // o véu de interação (D1).
    controls: { disable: true },
  },
  render: () => (
    <div className="nds-cluster nds-min-h-80" data-spacing="md" style={{ contain: "layout" }}>
      <Button variant="ghost">Antes</Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Abrir menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="start">
          <DropdownMenuItem>Perfil</DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Exportar</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>PDF</DropdownMenuItem>
              <DropdownMenuItem>CSV</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button variant="ghost">Depois</Button>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Abrir menu" });
    const before = canvas.getByRole("button", { name: "Antes" });
    const after = canvas.getByRole("button", { name: "Depois" });
    const body = within(document.body);

    const openWithItemFocused = async () => {
      if (trigger.getAttribute("aria-expanded") !== "true") await userEvent.click(trigger);
      const menu = await waitForPortal("menu");
      within(menu).getAllByRole("menuitem")[0].focus();
      await expect(menu.contains(document.activeElement)).toBe(true);
    };

    const openSubmenuWithItemFocused = async () => {
      await openWithItemFocused();
      const subTrigger = within(await waitForPortal("menu")).getByRole("menuitem", {
        name: "Exportar",
      });
      subTrigger.focus();
      await userEvent.keyboard("{ArrowRight}");
      await waitFor(async () => {
        await expect(body.getAllByRole("menu")).toHaveLength(2);
      });
      const submenu = body.getAllByRole("menu")[1];
      within(submenu).getAllByRole("menuitem")[0].focus();
      await expect(submenu.contains(document.activeElement)).toBe(true);
    };

    await step("Aberto, o menu segue modal: véu de interação (D1)", async () => {
      await openWithItemFocused();
      // É o que `modal` quer dizer neste componente — e é o que se perderia se
      // o Tab fosse consertado desligando `modal`.
      await expect(document.querySelector("[data-base-ui-inert]")).not.toBeNull();
    });

    await step("Tab sai do menu, fecha e segue para o próximo ponto da página", async () => {
      pressTab();
      await waitForPortalGone("menu");
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      // O próximo ponto é o vizinho do GATILHO, não o fim do documento, onde o
      // painel vive em portal.
      await waitFor(async () => {
        await expect(document.activeElement).toBe(after);
        // O véu sai junto: fechado, o menu não bloqueia mais a página.
        await expect(document.querySelector("[data-base-ui-inert]")).toBeNull();
      });
    });

    await step("Shift+Tab sai para o ponto ANTERIOR ao gatilho", async () => {
      // Sem o wrapper, o foco parava no próprio gatilho: a âncora de foco antes
      // do painel manda o Shift+Tab para ele.
      await openWithItemFocused();
      pressTab(true);
      await waitForPortalGone("menu");
      await waitFor(async () => {
        await expect(document.activeElement).toBe(before);
      });
    });

    await step("Tab dentro do submenu fecha o menu INTEIRO", async () => {
      await openSubmenuWithItemFocused();
      pressTab();
      // Nenhum painel sobra aberto — nem o do submenu, nem o raiz.
      await waitForPortalGone("menu");
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      await waitFor(async () => {
        await expect(document.activeElement).toBe(after);
      });
    });

    await step("Shift+Tab dentro do submenu também fecha tudo", async () => {
      // Sem o wrapper, a lib fechava só o submenu e focava o sub-gatilho.
      await openSubmenuWithItemFocused();
      pressTab(true);
      await waitForPortalGone("menu");
      await waitFor(async () => {
        await expect(document.activeElement).toBe(before);
      });
    });
  },
};

/**
 * O gatilho como ÚLTIMA parada da página: não há vizinho para onde levar o foco.
 * O Tab tem de fechar do mesmo jeito — preso, ele seria a armadilha que C2 proíbe
 * —, e o foco volta ao gatilho pelo caminho da lib.
 */
export const TabAtPageEnd: Story = {
  parameters: { covers: ["functional.item9"], controls: { disable: true } },
  render: () => (
    <div className="nds-cluster nds-min-h-80" data-spacing="md" style={{ contain: "layout" }}>
      <Button variant="ghost">Antes</Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Abrir menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="start">
          <DropdownMenuItem>Perfil</DropdownMenuItem>
          <DropdownMenuItem>Configurações</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole("button", { name: "Abrir menu" });

    await step("Sem próxima parada, Tab ainda fecha o menu e o foco volta ao gatilho", async () => {
      if (trigger.getAttribute("aria-expanded") !== "true") await userEvent.click(trigger);
      const menu = await waitForPortal("menu");
      within(menu).getAllByRole("menuitem")[0].focus();

      pressTab();
      await waitForPortalGone("menu");
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      // Sem o wrapper, a lib dava a volta e mandava o foco ao INÍCIO da
      // página — o botão "Antes".
      await waitFor(async () => {
        await expect(document.activeElement).toBe(trigger);
      });
    });
  },
};
