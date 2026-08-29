import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { userEvent, within, expect, waitFor } from "storybook/test";
import {
  waitForPortal,
  waitForPortalGone,
  FOCUS_RULE_GUARDA,
} from "@/lib/wait-for-portal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import {
  dropdownMenuControlledSource,
  dropdownMenuItemDisabledSource,
  dropdownMenuSource,
} from "./dropdown-menu.source";
import { Button } from "./button";

const meta = {
  title: "UI/DropdownMenu/States",
  tags: ["overlay"],
  component: DropdownMenu,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    a11y: { config: { rules: [FOCUS_RULE_GUARDA] } },
    docs: {
      // Fechado é o padrão do componente, e abrir por clique ou por seta não é
      // markup: esta transform serve tanto a Closed quanto a Open.
      source: { transform: dropdownMenuSource },
      description: {
        component:
          "Fechado, aberto, controlado por fora e item desabilitado. Teclado, foco e bloqueio " +
          "vêm do primitivo — o que estas stories provam é que a composição não desfaz nada disso.",
      },
    },
  },
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

const wrapperStyle: React.CSSProperties = {
  contain: "layout",
  minHeight: 300,
  position: "relative",
};

export const Closed: Story = {
  parameters: {
    covers: ["accessibility.item2"],
    // Medido na tipagem do primitivo: o item de marcação do menu é de DOIS
    // estados. `checked` é booleano, o payload da mudança é booleano, o estado
    // exposto ao indicador é booleano e os únicos atributos de dado são
    // `data-checked` e `data-unchecked` — não existe terceiro valor. A caixa de
    // seleção avulsa da MESMA lib tem `indeterminate`; o item de menu não.
    coversNotApplicable: {
      "functional.item8":
        "o item de marcação do menu neste primitivo é de dois estados — prop, payload e estado do indicador são booleanos, sem terceiro valor para anunciar como misto",
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Abrir menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Perfil</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    await step("Só o gatilho está na tela", async () => {
      const trigger = canvas.getByRole("button", { name: /Abrir menu/i });
      await expect(trigger).toBeVisible();
      await expect(trigger).toHaveAttribute("aria-haspopup", "menu");
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      // O portal desmonta o popup ao fechar: fechado não é "escondido com
      // display:none", é ausente do DOM. Um popup só escondido continuaria no
      // percurso do leitor de tela.
      await expect(body.queryAllByRole("menu")).toHaveLength(0);
      await expect(body.queryAllByRole("menuitem")).toHaveLength(0);
    });
  },
};

export const Open: Story = {
  parameters: { covers: ["functional.item2", "accessibility.item3"] },
  render: () => (
    <div style={wrapperStyle}>
      <DropdownMenu defaultOpen modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Abrir menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Perfil</DropdownMenuItem>
          <DropdownMenuItem>Configuracoes</DropdownMenuItem>
          <DropdownMenuItem>Equipe</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ),
  play: async ({ step }) => {
    const menu = await waitForPortal("menu");
    const items = within(menu).getAllByRole("menuitem");

    await step("O menu abre com os três itens", async () => {
      await expect(items).toHaveLength(3);
    });

    await step("O item em foco por teclado mostra o anel", async () => {
      // Até aqui o item destacado era indicado SÓ pelo preenchimento de accent,
      // e no tema default o texto não muda de cor: quem navega por teclado
      // dependia da diferença entre o fundo do item e o do painel, que nunca
      // chegou aos 3:1 da WCAG 1.4.11.
      //
      // A asserção lê o outline COMPUTADO, e não a classe: `:focus-visible` é
      // decidido pelo navegador a partir da última interação, e é justamente
      // isso que precisa ser provado — a lib move o foco por código depois da
      // tecla, e só o navegador sabe dizer se aquilo conta como teclado.
      items[0].focus();
      await userEvent.keyboard("{ArrowDown}");
      const emFoco = document.activeElement as HTMLElement;
      await expect(getComputedStyle(emFoco).outlineStyle).toBe("solid");
      await expect(getComputedStyle(emFoco).outlineWidth).toBe("2px");
    })

    await step("As setas descem e sobem um item por vez", async () => {
      items[0].focus();
      await userEvent.keyboard("{ArrowDown}");
      await expect(document.activeElement).toBe(items[1]);
      await userEvent.keyboard("{ArrowUp}");
      await expect(document.activeElement).toBe(items[0]);
    });

    await step("Home e End vão ao primeiro e ao último", async () => {
      await userEvent.keyboard("{End}");
      await expect(document.activeElement).toBe(items[2]);
      await userEvent.keyboard("{Home}");
      await expect(document.activeElement).toBe(items[0]);
    });

    await step("Digitar uma letra salta para o item que começa com ela", async () => {
      // Typeahead: numa lista de ações longa é o que evita percorrer item por
      // item. Sem ele a letra não faz nada e o foco fica onde estava — por isso
      // a asserção compara com OUTRO item, e não com "mudou de lugar".
      await userEvent.keyboard("e");
      await waitFor(async () => {
        await expect(document.activeElement).toBe(items[2]);
      });
    });

    await step("O item em foco é o único destacado", async () => {
      // O realce é o que diz onde o teclado está: sem ele a navegação por setas
      // é invisível para quem enxerga.
      const destacados = items.filter((i) => i.hasAttribute("data-highlighted"));
      await expect(destacados).toHaveLength(1);
      await expect(destacados[0]).toBe(document.activeElement);
    });
  },
};

export const Controlled: Story = {
  parameters: {
    // Composição diferente: estado de fora, com um botão da página comandando
    // o mesmo menu que o gatilho abre.
    docs: { source: { transform: dropdownMenuControlledSource } },
  },
  render: () => {
    const ControlledDemo = () => {
      const [open, setOpen] = useState(false);
      return (
        <div className="nds-stack" data-spacing="sm" style={wrapperStyle}>
          <Button onClick={() => setOpen(!open)}>
            {open ? "Fechar pelo estado" : "Abrir pelo estado"}
          </Button>
          <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Ações</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Duplicar</DropdownMenuItem>
              <DropdownMenuItem>Arquivar</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    };
    return <ControlledDemo />;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Ações" });

    await step("O botão externo abre o menu", async () => {
      // Idempotente: só clica quando o estado atual não é o desejado, então o
      // replay do painel Interactions chega ao mesmo lugar.
      if (trigger.getAttribute("aria-expanded") !== "true") {
        await userEvent.click(canvas.getByRole("button", { name: "Abrir pelo estado" }));
      }
      await waitForPortal("menu");
      await expect(trigger).toHaveAttribute("aria-expanded", "true");
    });

    await step("Escape fecha e o estado de fora acompanha", async () => {
      await userEvent.keyboard("{Escape}");
      await waitForPortalGone("menu");
      // O rótulo do botão externo é lido do mesmo estado: se o `onOpenChange`
      // não tivesse voltado, ele continuaria dizendo "Fechar pelo estado".
      await waitFor(async () => {
        await expect(canvas.getByRole("button", { name: "Abrir pelo estado" })).toBeTruthy();
      });
    });
  },
};

export const ItemDisabled: Story = {
  parameters: {
    // `disabled` é prop do ITEM, e nenhum control do arquivo a descreve.
    docs: { source: { transform: dropdownMenuItemDisabledSource } },
  },
  render: () => (
    <div style={wrapperStyle}>
      <DropdownMenu defaultOpen modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Ações</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Editar</DropdownMenuItem>
          <DropdownMenuItem disabled>Arquivar</DropdownMenuItem>
          <DropdownMenuItem>Duplicar</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ),
  play: async ({ step }) => {
    const menu = await waitForPortal("menu");
    const disabled = within(menu).getByRole("menuitem", { name: "Arquivar" });

    await step("O item se anuncia desabilitado", async () => {
      await expect(disabled).toHaveAttribute("aria-disabled", "true");
      await expect(disabled.hasAttribute("data-disabled")).toBe(true);
    });

    await step("O clique é bloqueado pelo CSS, não só pelo callback", async () => {
      // `pointer-events: none` é o que impede o clique de chegar; sem ele o item
      // continuaria clicável e o bloqueio dependeria de cada consumidor.
      await expect(getComputedStyle(disabled).pointerEvents).toBe("none");
    });

    await step("O item desabilitado continua alcançável pela seta", async () => {
      // Padrão WAI-ARIA de menu: a seta PODE pousar no item desabilitado, para
      // que ele seja anunciado. O que ele não pode é executar.
      const items = within(menu).getAllByRole("menuitem");
      items[0].focus();
      await userEvent.keyboard("{ArrowDown}");
      await expect(document.activeElement).toBe(disabled);
    });
  },
};
