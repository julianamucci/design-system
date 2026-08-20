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
import { LayoutIcon, TypeIcon, MinusIcon } from "lucide-react";

type CommandArgs = React.ComponentProps<typeof Command> & {
  onItemSelect: (value: string) => void;
};

const meta: Meta<CommandArgs> = {
  title: "UI/Command",
  component: Command,
  tags: ["autodocs", "overlay"],
  parameters: {
    layout: "centered",
    docs: {
      page: withAutoDocsTab(CommandDocs),
      // A árvore do `render` traz a moldura da demonstração e o espião das
      // actions; a transform devolve o uso real, com os controls resolvidos.
      source: { transform: commandSource },
    },
    // A lib desta stack renderiza <div role="listbox"> com filhos auxiliares
    // (divisor e mensagem de vazio) que a spec ARIA não admite dentro de um
    // listbox. É comportamento upstream deliberado — ver
    // PATCHES.md#command-listbox-children.
    a11y: {
      config: {
        rules: [{ id: 'aria-required-children', enabled: false }],
      },
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
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          <CommandGroup heading="Componentes">
            <CommandItem value="button" onSelect={onItemSelect}>
              <LayoutIcon />
              Button
            </CommandItem>
            <CommandItem value="input" onSelect={onItemSelect}>
              <TypeIcon />
              Input
            </CommandItem>
            <CommandItem value="separator" onSelect={onItemSelect}>
              <MinusIcon />
              Separator
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Utilitários">
            <CommandItem value="cn" onSelect={onItemSelect}>cn()</CommandItem>
            <CommandItem value="clsx" onSelect={onItemSelect}>clsx()</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  ),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const raiz = canvasElement.querySelector<HTMLElement>('[data-slot="command"]')!;
    const campo = canvas.getByRole("combobox");
    const lista = canvas.getByRole("listbox");
    const espiao = args.onItemSelect as ReturnType<typeof fn>;
    // O destaque é resolvido por `aria-selected`, não por
    // `aria-activedescendant`. Medido na fonte da lib (`cmdk/dist/index.mjs`):
    // o `aria-activedescendant` sai de `selectedItemId`, que é escrito num
    // passo AGENDADO e só quando o valor muda de fato — se o item já está
    // selecionado, o `setState` sai cedo e o id nunca é reescrito. Resolver o
    // elemento por ele torna a asserção dependente de um efeito que pode não
    // ocorrer; `aria-selected` a lib sempre escreve.
    const emDestaque = () =>
      canvasElement.querySelector<HTMLElement>('[role="option"][aria-selected="true"]');

    // A play REEXECUTA no mesmo DOM: a busca parte sempre do zero, senão a
    // contagem de comandos herda o filtro da rodada anterior.
    await userEvent.clear(campo);
    await waitFor(async () => {
      await expect(canvas.getAllByRole("option")).toHaveLength(5);
    });

    await step("O markup é o mesmo contrato das outras stacks", async () => {
      await expect(raiz).toHaveClass(/nds-command/);
      await expect(campo).toHaveClass(/nds-command-input/);
      await expect(campo).toHaveAttribute("data-slot", "command-input");
      await expect(lista).toHaveClass(/nds-command-list/);
      await expect(lista).toHaveAttribute("data-slot", "command-list");
      // A lupa é do componente, não do call site — quem escreve a paleta não
      // pode esquecê-la.
      await expect(raiz.querySelector(".nds-command-input-wrapper > svg")).not.toBeNull();
    });

    await step("O campo é uma combobox ligada à lista REAL", async () => {
      // Este é o par que separa a paleta de um menu: papel de combobox no
      // campo, papel de listbox na lista, e o `aria-controls` apontando para o
      // id que a lista tem de verdade — id órfão o axe reprova.
      await expect(campo).toHaveAttribute("aria-autocomplete", "list");
      await expect(campo).toHaveAttribute("aria-expanded", "true");
      const controlado = campo.getAttribute("aria-controls");
      await expect(controlado).toBeTruthy();
      await expect(document.getElementById(controlado!)).toBe(lista);
    });

    await step("Cada comando é uma opção, e o cabeçalho nomeia o grupo", async () => {
      const opcoes = canvas.getAllByRole("option");
      await expect(opcoes).toHaveLength(5);
      await expect(opcoes[0]).toHaveClass(/nds-command-item/);
      await expect(opcoes[0]).toHaveAttribute("data-slot", "command-item");
      await expect(opcoes[0]).toHaveAttribute("aria-selected");
      // Sem o `aria-labelledby` do cabeçalho, o leitor anuncia só "grupo".
      await expect(canvas.getByRole("group", { name: "Componentes" })).toBeVisible();
      await expect(canvas.getByRole("group", { name: "Utilitários" })).toBeVisible();
      // O divisor é desenho: existe no markup e não vira comando.
      await expect(raiz.querySelector('[data-slot="command-separator"]'))
        .toHaveClass(/nds-command-separator/);
    });

    // Com o filtro interno desligado a lista deixa de reagir à busca — as duas
    // etapas seguintes descrevem justamente o filtro, então só valem ligado.
    if (args.shouldFilter !== false) {
      await step('Buscando "sep", só o comando que casa sobra', async () => {
        await userEvent.type(campo, "sep");

        await waitFor(async () => {
          await expect(canvas.getAllByRole("option")).toHaveLength(1);
        });
        await expect(canvas.getByRole("option", { name: "Separator" })).toBeVisible();
        // A lib desta stack DESMONTA o comando que não casa (outras o escondem
        // com `hidden`): procurar por ele no DOM tem de dar nada.
        await expect(raiz.querySelector('[data-value="button"]')).toBeNull();
        // O grupo inteiro se recolhe quando nenhum comando dele passa — sem
        // isso a paleta mostraria "Utilitários" com nada embaixo. A busca
        // reordena os grupos por pontuação, então a asserção conta os que
        // sobraram em vez de apontar um índice.
        const grupos = Array.from(
          raiz.querySelectorAll<HTMLElement>('[data-slot="command-group"]'),
        );
        await expect(grupos).toHaveLength(2);
        await expect(grupos.filter((g) => !g.hidden)).toHaveLength(1);
      });

      await step('Buscando "zzz", a mensagem de vazio ocupa o lugar da lista', async () => {
        await userEvent.clear(campo);
        await userEvent.type(campo, "zzz");

        await waitFor(async () => {
          await expect(canvas.queryAllByRole("option")).toHaveLength(0);
        });
        const vazio = raiz.querySelector<HTMLElement>('[data-slot="command-empty"]')!;
        await expect(vazio).toBeVisible();
        await expect(vazio).toHaveTextContent("Nenhum resultado encontrado.");
        await expect(vazio).toHaveClass(/nds-command-empty/);
      });

      await step("Apagar a busca traz os cinco comandos de volta", async () => {
        await userEvent.clear(campo);
        await waitFor(async () => {
          await expect(canvas.getAllByRole("option")).toHaveLength(5);
        });
        await expect(raiz.querySelector('[data-slot="command-empty"]')).toBeNull();
      });
    }

    await step("As setas percorrem a lista sem tirar o foco do campo", async () => {
      campo.focus();
      // Home leva o destaque ao primeiro comando: precondição própria, para o
      // replay não partir de onde a rodada anterior parou.
      await userEvent.keyboard("{Home}");
      await waitFor(async () => {
        await expect(emDestaque()).toHaveTextContent("Button");
      });
      // O foco NÃO se move: é o que permite continuar digitando enquanto se
      // navega, e é por isso que o destaque viaja por `aria-activedescendant`.
      await expect(campo).toHaveFocus();
      await expect(emDestaque()).toHaveAttribute("role", "option");
      await expect(emDestaque()).toHaveAttribute("aria-selected", "true");

      await userEvent.keyboard("{ArrowDown}");
      await waitFor(async () => {
        await expect(emDestaque()).toHaveTextContent("Input");
      });
      await expect(campo).toHaveFocus();
      // Aqui o valor MUDOU, então o `aria-activedescendant` foi reescrito — é o
      // ponto em que dá para provar o mecanismo do combobox sem depender de um
      // efeito que pode não disparar.
      await expect(campo).toHaveAttribute(
        "aria-activedescendant",
        emDestaque()!.id,
      );

      await userEvent.keyboard("{ArrowUp}");
      await waitFor(async () => {
        await expect(emDestaque()).toHaveTextContent("Button");
      });
      await expect(emDestaque()).toHaveAttribute("aria-selected", "true");
    });

    await step("Enter escolhe o comando em destaque, com o value dele", async () => {
      const antes = espiao.mock.calls.length;
      await userEvent.keyboard("{Enter}");

      await waitFor(async () => {
        await expect(espiao.mock.calls.length).toBe(antes + 1);
      });
      await expect(espiao.mock.calls[antes][0]).toBe("button");
      // A paleta não tem estado fechado: continua aberta depois de executar.
      await expect(campo).toHaveAttribute("aria-expanded", "true");
    });

    await step("Clicar num comando também o escolhe", async () => {
      const antes = espiao.mock.calls.length;
      await userEvent.click(canvas.getByRole("option", { name: "cn()" }));

      await waitFor(async () => {
        await expect(espiao.mock.calls.length).toBe(antes + 1);
      });
      await expect(espiao.mock.calls[antes][0]).toBe("cn");
    });
  },
};
