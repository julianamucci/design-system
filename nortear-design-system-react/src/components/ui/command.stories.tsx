import type * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within, expect, waitFor, fn } from "storybook/test";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "./command";
import { commandSource } from "./command.source";
import { CommandDocs } from "@/components/docs/CommandDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

import { figmaDesign } from "@shared/figma/design-links";
type CommandArgs = React.ComponentProps<typeof Command> & {
  onItemSelect: (value: string) => void;
};

const meta: Meta<CommandArgs> = {
  title: "Components/Overlay/Command",
  component: Command,
  tags: ["autodocs", "overlay"],
  parameters: {
    design: figmaDesign("command"),
    layout: "centered",
    docs: {
      page: withAutoDocsTab(CommandDocs),
      // A árvore do `render` traz a moldura da demonstração e o espião das
      // actions; a transform devolve o uso real, com os controls resolvidos.
      source: { transform: commandSource },
    },
  },
  argTypes: {
    loop: {
      control: "boolean",
      description: "Navegação por teclado cicla do último para o primeiro item",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    shouldFilter: {
      control: "boolean",
      description:
        "Habilita o filtro interno por texto. Desligado, a lista deixa de reagir à busca e cabe a quem consome renderizar os itens já filtrados.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "true" } },
    },
    // Espião do `onSelect` de cada comando. Fica em `args` (e não no escopo do
    // módulo) para a aba Actions registrar cada escolha.
    onItemSelect: {
      control: false,
      description: "Disparado a cada comando escolhido, por clique ou por Enter, com o value do comando.",
      table: { type: { summary: "(value: string) => void" } },
    },
  },
  args: {
    loop: false,
    shouldFilter: true,
    onItemSelect: fn(),
  },
};

export default meta;
type Story = StoryObj<CommandArgs>;

// ─── Playground ──────────────────────────────────────────────────────────────

export const Playground: Story = {
  parameters: {
    covers: [
      "functional.item1",
      "functional.item2",
      "accessibility.item1",
      "accessibility.item2",
    ],
  },
  render: ({ onItemSelect, ...args }) => (
    <div className="nds-w-sm nds-border-default nds-rounded-md nds-shadow-md">
      <Command {...args}>
        <CommandInput placeholder="Buscar componente..." />
        <CommandList>
          <CommandGroup heading="Componentes">
            <CommandItem value="button" onSelect={onItemSelect}>Button</CommandItem>
            <CommandItem value="input" onSelect={onItemSelect}>Input</CommandItem>
            <CommandItem value="separator" onSelect={onItemSelect}>Separator</CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Utilitários">
            <CommandItem value="cn" onSelect={onItemSelect}>cn()</CommandItem>
            <CommandItem value="clsx" onSelect={onItemSelect}>clsx()</CommandItem>
          </CommandGroup>
        </CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
      </Command>
    </div>
  ),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="command"]')!;
    const field = canvas.getByRole("combobox");
    const list = canvas.getByRole("listbox");
    const spy = args.onItemSelect as ReturnType<typeof fn>;
    // O destaque é resolvido por `aria-selected`, não por
    // `aria-activedescendant`. Medido na fonte da lib (`cmdk/dist/index.mjs`):
    // o `aria-activedescendant` sai de `selectedItemId`, que é escrito num
    // passo AGENDADO e só quando o valor muda de fato — se o item já está
    // selecionado, o `setState` sai cedo e o id nunca é reescrito. Resolver o
    // elemento por ele torna a asserção dependente de um efeito que pode não
    // ocorrer; `aria-selected` a lib sempre escreve.
    const inHighlight = () =>
      canvasElement.querySelector<HTMLElement>('[role="option"][aria-selected="true"]');
    const separators = () =>
      root.querySelectorAll<HTMLElement>('[data-slot="command-separator"]');

    await step("O campo inline não rouba o foco ao montar (C12)", async () => {
      // Espera de RELÓGIO, e não `waitFor`: a asserção é sobre algo que NÃO
      // pode acontecer, e `waitFor` passaria na primeira tentativa, antes de um
      // foco agendado ter tido tempo de chegar. 50ms passam com folga de
      // qualquer foco em `setTimeout` curto. Só a paleta aberta num Dialog foca
      // o campo sozinha — quem prova esse lado é a story CommandPalette.
      //
      // Vale no replay também: a play termina com o foco FORA da paleta (o
      // passo de Tab é o último), então a rodada seguinte parte sem ele.
      await new Promise((resolve) => setTimeout(resolve, 50));
      await expect(field).not.toHaveFocus();
    });

    // A play REEXECUTA no mesmo DOM: a busca parte sempre do zero, senão a
    // contagem de comandos herda o filtro da rodada anterior.
    await userEvent.clear(field);
    await waitFor(async () => {
      await expect(canvas.getAllByRole("option")).toHaveLength(5);
    });

    await step("Ao montar, o primeiro comando já está em destaque (D11)", async () => {
      // Decisão da dona (PRD D11): quem abre a paleta e aperta Enter executa o
      // primeiro comando, sem precisar de seta antes. A lib desta stack faz
      // isso ao registrar os itens e a cada busca, escolhendo o primeiro que
      // não está desabilitado.
      await waitFor(async () => {
        await expect(inHighlight()).toHaveTextContent("Button");
      });
      // Um destaque só, e ele é o que o anel desenha.
      await expect(
        canvasElement.querySelectorAll('[role="option"][aria-selected="true"]'),
      ).toHaveLength(1);
    });

    await step("O markup é o mesmo contrato das outras stacks", async () => {
      await expect(root).toHaveClass(/nds-command/);
      await expect(field).toHaveClass(/nds-command-input/);
      await expect(field).toHaveAttribute("data-slot", "command-input");
      await expect(list).toHaveClass(/nds-command-list/);
      await expect(list).toHaveAttribute("data-slot", "command-list");
      // A lupa é do componente, não do call site — quem escreve a paleta não
      // pode esquecê-la.
      await expect(root.querySelector(".nds-command-input-wrapper > svg")).not.toBeNull();
    });

    await step("O campo é uma combobox ligada à lista REAL", async () => {
      // Este é o par que separa a paleta de um menu: papel de combobox no
      // campo, papel de listbox na lista, e o `aria-controls` apontando para o
      // id que a lista tem de verdade — id órfão o axe reprova.
      await expect(field).toHaveAttribute("aria-autocomplete", "list");
      await expect(field).toHaveAttribute("aria-expanded", "true");
      const controlled = field.getAttribute("aria-controls");
      await expect(controlled).toBeTruthy();
      await expect(document.getElementById(controlled!)).toBe(list);
      // Nome acessível herdado do placeholder, nos dois papéis — é o contrato
      // das cinco stacks. A lib desta stack chamaria a lista de "Suggestions",
      // em inglês e igual em toda paleta da página.
      await expect(field).toHaveAccessibleName("Buscar componente...");
      await expect(list).toHaveAttribute("aria-label", "Buscar componente...");
    });

    await step("Cada comando é uma opção, e o cabeçalho nomeia o grupo", async () => {
      const options = canvas.getAllByRole("option");
      await expect(options).toHaveLength(5);
      await expect(options[0]).toHaveClass(/nds-command-item/);
      await expect(options[0]).toHaveAttribute("data-slot", "command-item");
      await expect(options[0]).toHaveAttribute("aria-selected");
      // Comando que não é marcável não carrega a marca: sem ela no fluxo, o
      // item não reserva à direita o espaço de uma escolha que não representa.
      await expect(options[0].querySelector(".nds-command-item-check")).toBeNull();
      // Sem o `aria-labelledby` do cabeçalho, o leitor anuncia só "grupo".
      await expect(canvas.getByRole("group", { name: "Componentes" })).toBeVisible();
      await expect(canvas.getByRole("group", { name: "Utilitários" })).toBeVisible();
      // O divisor é desenho: existe no markup e não vira comando.
      await expect(root.querySelector('[data-slot="command-separator"]'))
        .toHaveClass(/nds-command-separator/);
    });

    // Com o filtro interno desligado a lista deixa de reagir à busca — as duas
    // etapas seguintes descrevem justamente o filtro, então só valem ligado.
    if (args.shouldFilter !== false) {
      await step('Buscando "sep", só o comando que casa sobra', async () => {
        await userEvent.type(field, "sep");

        await waitFor(async () => {
          await expect(canvas.getAllByRole("option")).toHaveLength(1);
        });
        await expect(canvas.getByRole("option", { name: "Separator" })).toBeVisible();
        // A lib desta stack DESMONTA o comando que não casa (outras o escondem
        // com `hidden`): procurar por ele no DOM tem de dar nada.
        await expect(root.querySelector('[data-value="button"]')).toBeNull();
        // O grupo inteiro se recolhe quando nenhum comando dele passa — sem
        // isso a paleta mostraria "Utilitários" com nada embaixo. A busca
        // reordena os grupos por pontuação, então a asserção conta os que
        // sobraram em vez de apontar um índice.
        const groups = Array.from(
          root.querySelectorAll<HTMLElement>('[data-slot="command-group"]'),
        );
        await expect(groups).toHaveLength(2);
        await expect(groups.filter((g) => !g.hidden)).toHaveLength(1);
        // C11: com um dos lados vazio não há fronteira a marcar, e o traço sai.
        // A lib desta stack o tira em QUALQUER busca — divergência aceita no
        // PRD; o contrato é ele não sobrar entre um grupo e o nada.
        await expect(separators()).toHaveLength(0);
      });

      await step("Depois da busca, o primeiro resultado já está em destaque (D11)", async () => {
        // O destaque de montagem estava em "Button", que o filtro tirou da
        // lista; a busca o leva ao primeiro que sobrou, sem seta nenhuma.
        await waitFor(async () => {
          await expect(inHighlight()).toHaveTextContent("Separator");
        });
      });

      await step("Enter logo depois de digitar executa o primeiro resultado", async () => {
        // Digitar e apertar Enter é o uso inteiro da paleta para quem sabe o
        // que procura — é o que o destaque automático existe para permitir.
        await expect(field).toHaveFocus();
        const antes = spy.mock.calls.length;
        await userEvent.keyboard("{Enter}");

        await waitFor(async () => {
          await expect(spy.mock.calls.length).toBe(antes + 1);
        });
        await expect(spy.mock.calls[antes][0]).toBe("separator");
      });

      await step('Sem correspondência, a frase é ANUNCIADA e não só desenhada', async () => {
        await userEvent.clear(field);
        await userEvent.type(field, "zzz");

        await waitFor(async () => {
          await expect(canvas.queryAllByRole("option")).toHaveLength(0);
        });
        const empty = root.querySelector<HTMLElement>('[data-slot="command-empty"]')!;
        await expect(empty).toBeVisible();
        await expect(empty).toHaveTextContent("Nenhum resultado encontrado.");
        await expect(empty).toHaveAttribute("data-empty", "");
        await expect(empty).toHaveClass(/nds-command-empty/);
        // Região viva montada o tempo todo: é a mudança DENTRO dela que o
        // leitor de tela anuncia. Criá-la só na hora não anunciaria nada — e é
        // o único ponto da paleta em que a mudança acontece fora do foco e sem
        // outro canal, porque não sobra item nenhum para onde navegar.
        await expect(empty).toHaveAttribute("role", "status");
        await expect(empty).toHaveAttribute("aria-live", "polite");
        await expect(empty).toHaveAttribute("aria-atomic", "true");
        // E ela mora FORA do listbox: `role="status"` não é filho permitido de
        // `role="listbox"` (axe: aria-required-children).
        await expect(list.contains(empty)).toBe(false);
      });

      await step("Apagar a busca traz os cinco comandos de volta", async () => {
        await userEvent.clear(field);
        await waitFor(async () => {
          await expect(canvas.getAllByRole("option")).toHaveLength(5);
        });
        const empty = root.querySelector<HTMLElement>('[data-slot="command-empty"]')!;
        await expect(empty).not.toHaveAttribute("data-empty");
        // Continua no DOM (é o que preserva o anúncio da próxima busca vazia),
        // mas sem a classe que traz 24px de respiro em cima e embaixo.
        await expect(empty).not.toHaveClass(/nds-command-empty/);
        await expect(empty.getBoundingClientRect().height).toBe(0);
        // Os dois lados de volta, o traço de volta (C11).
        await expect(separators()).toHaveLength(1);
      });
    }

    await step("As setas percorrem a lista sem tirar o foco do campo", async () => {
      field.focus();
      // Home leva o destaque ao primeiro comando: precondição própria, para o
      // replay não partir de onde a rodada anterior parou.
      await userEvent.keyboard("{Home}");
      await waitFor(async () => {
        await expect(inHighlight()).toHaveTextContent("Button");
      });
      // O foco NÃO se move: é o que permite continuar digitando enquanto se
      // navega, e é por isso que o destaque viaja por `aria-activedescendant`.
      await expect(field).toHaveFocus();
      await expect(inHighlight()).toHaveAttribute("role", "option");
      await expect(inHighlight()).toHaveAttribute("aria-selected", "true");

      await userEvent.keyboard("{ArrowDown}");
      await waitFor(async () => {
        await expect(inHighlight()).toHaveTextContent("Input");
      });
      await expect(field).toHaveFocus();
      // Aqui o valor MUDOU, então o `aria-activedescendant` foi reescrito — é o
      // ponto em que dá para provar o mecanismo do combobox sem depender de um
      // efeito que pode não disparar.
      await expect(field).toHaveAttribute(
        "aria-activedescendant",
        inHighlight()!.id,
      );

      await userEvent.keyboard("{ArrowUp}");
      await waitFor(async () => {
        await expect(inHighlight()).toHaveTextContent("Button");
      });
      await expect(inHighlight()).toHaveAttribute("aria-selected", "true");
    });

    await step("Ctrl+K no campo não move o destaque", async () => {
      // A lib desta stack liga por padrão Ctrl+N/J (desce) e Ctrl+P/K (sobe).
      // Ctrl+K é o atalho que abre a paleta: no campo inline da docs page a
      // mesma tecla subia o destaque E abria a paleta. O `Command` do design
      // system desliga os quatro (`vimBindings`), como as outras stacks.
      field.focus();
      await userEvent.keyboard("{Home}");
      await userEvent.keyboard("{ArrowDown}");
      await waitFor(async () => {
        await expect(inHighlight()).toHaveTextContent("Input");
      });

      for (const key of ["k", "p", "j", "n"]) {
        await userEvent.keyboard(`{Control>}${key}{/Control}`);
        // Espera de RELÓGIO: a asserção é de algo que NÃO pode acontecer, e
        // `waitFor` passaria antes de uma troca de destaque ter chance de
        // chegar ao DOM.
        await new Promise((resolve) => setTimeout(resolve, 50));
        await expect(inHighlight()).toHaveTextContent("Input");
      }
      // E a letra com Ctrl não vira texto da busca.
      await expect(field).toHaveValue("");
      await expect(field).toHaveFocus();
    });

    await step("O item em destaque mostra o anel", async () => {
      // Aqui o item nunca recebe foco do DOM — quem o mantém é o campo, e o
      // destaque é apontado por `aria-activedescendant`. Por isso o anel é
      // ligado ao ATRIBUTO, e não a `:focus-visible`, que nunca dispararia.
      // `inHighlight()` é o mesmo caminho que os passos acima usam para achar o
      // item marcado nesta stack.
      const emDestaque = inHighlight()!;
      await expect(getComputedStyle(emDestaque).outlineStyle).toBe("solid");
      await expect(getComputedStyle(emDestaque).outlineWidth).toBe("2px");
    })

    await step("Enter escolhe o comando em destaque, com o value dele", async () => {
      // Precondição própria: o passo anterior deixou o destaque em "Input".
      field.focus();
      await userEvent.keyboard("{Home}");
      await waitFor(async () => {
        await expect(inHighlight()).toHaveTextContent("Button");
      });
      const antes = spy.mock.calls.length;
      await userEvent.keyboard("{Enter}");

      await waitFor(async () => {
        await expect(spy.mock.calls.length).toBe(antes + 1);
      });
      await expect(spy.mock.calls[antes][0]).toBe("button");
      // A paleta não tem estado fechado: continua aberta depois de executar.
      await expect(field).toHaveAttribute("aria-expanded", "true");
    });

    await step("O ponteiro também move o destaque (D1)", async () => {
      // O item sob o ponteiro é o que o Enter ativa: o desenho e o teclado
      // apontam para o mesmo comando, venha a marcação de onde vier.
      const target = canvas.getByRole("option", { name: "clsx()" });
      await userEvent.hover(target);
      await waitFor(async () => {
        await expect(target).toHaveAttribute("aria-selected", "true");
      });
      await expect(inHighlight()).toBe(target);
      // O valor MUDOU, então o `aria-activedescendant` foi reescrito.
      await waitFor(async () => {
        await expect(field).toHaveAttribute("aria-activedescendant", target.id);
      });
    });

    await step("Clicar num comando também o escolhe, sem tirar o foco do campo", async () => {
      field.focus();
      const antes = spy.mock.calls.length;
      await userEvent.click(canvas.getByRole("option", { name: "cn()" }));

      await waitFor(async () => {
        await expect(spy.mock.calls.length).toBe(antes + 1);
      });
      await expect(spy.mock.calls[antes][0]).toBe("cn");
      // A lista desta lib tem `tabIndex={-1}` e tomaria o foco no clique; o
      // `mousedown` cancelado o segura no campo, onde a próxima letra ainda
      // chega à busca.
      await expect(field).toHaveFocus();
    });

    await step("Escape no uso inline não tira o foco do campo", async () => {
      // Sem hospedeiro não há o que fechar: a pessoa continua onde estava. O
      // Escape é do Dialog que hospeda a paleta, e quem prova esse lado é a
      // story CommandPalette.
      field.focus();
      await userEvent.clear(field);
      await userEvent.type(field, "in");
      await userEvent.keyboard("{Escape}");
      await expect(field).toHaveFocus();

      await userEvent.clear(field);
      await waitFor(async () => {
        await expect(canvas.getAllByRole("option")).toHaveLength(5);
      });
    });

    // Último passo DE PROPÓSITO: ele deixa o foco fora da paleta, e é isso que
    // permite ao primeiro passo (C12) valer também no replay.
    await step("Tab sai da paleta: a lista não é parada de Tab", async () => {
      // Quem percorre os comandos são as setas, com o foco no campo. Uma lista
      // tabulável viraria uma segunda parada sem função.
      await expect(list.tabIndex).toBeLessThan(0);
      field.focus();
      await userEvent.tab();
      await expect(list).not.toHaveFocus();
      await expect(root.contains(document.activeElement)).toBe(false);
    });
  },
};
