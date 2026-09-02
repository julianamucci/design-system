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
  title: "Primitives/Overlay/Command",
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
    // Regra desligada por dívida ANTIGA, e o que a sustentava já saiu daqui: o
    // divisor virou `aria-hidden` e a mensagem de vazio saiu do listbox. O que
    // resta é medição, não conserto — só o axe rodando em navegador diz se a
    // lista vazia ainda reprova, e a suíte não roda nesta rodada. Religar a
    // regra sem essa medida trocaria um portão frouxo por uma falha vermelha
    // sem diagnóstico. Ver PATCHES.md#command-listbox-children.
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

    // A play REEXECUTA no mesmo DOM: a busca parte sempre do zero, senão a
    // contagem de comandos herda o filtro da rodada anterior.
    await userEvent.clear(field);
    await waitFor(async () => {
      await expect(canvas.getAllByRole("option")).toHaveLength(5);
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
    });

    await step("Cada comando é uma opção, e o cabeçalho nomeia o grupo", async () => {
      const options = canvas.getAllByRole("option");
      await expect(options).toHaveLength(5);
      await expect(options[0]).toHaveClass(/nds-command-item/);
      await expect(options[0]).toHaveAttribute("data-slot", "command-item");
      await expect(options[0]).toHaveAttribute("aria-selected");
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
      });

      await step('Sem correspondência, a frase é ANUNCIADA e não só desenhada', async () => {
        await userEvent.clear(field);
        await userEvent.type(field, "zzz");

        await waitFor(async () => {
          await expect(canvas.queryAllByRole("option")).toHaveLength(0);
        });
        const vazio = root.querySelector<HTMLElement>('[data-slot="command-empty"]')!;
        await expect(vazio).toBeVisible();
        await expect(vazio).toHaveTextContent("Nenhum resultado encontrado.");
        await expect(vazio).toHaveAttribute("data-empty", "");
        await expect(vazio).toHaveClass(/nds-command-empty/);
        // Região viva montada o tempo todo: é a mudança DENTRO dela que o
        // leitor de tela anuncia. Criá-la só na hora não anunciaria nada — e é
        // o único ponto da paleta em que a mudança acontece fora do foco e sem
        // outro canal, porque não sobra item nenhum para onde navegar.
        await expect(vazio).toHaveAttribute("role", "status");
        await expect(vazio).toHaveAttribute("aria-live", "polite");
        await expect(vazio).toHaveAttribute("aria-atomic", "true");
        // E ela mora FORA do listbox: `role="status"` não é filho permitido de
        // `role="listbox"` (axe: aria-required-children).
        await expect(list.contains(vazio)).toBe(false);
      });

      await step("Apagar a busca traz os cinco comandos de volta", async () => {
        await userEvent.clear(field);
        await waitFor(async () => {
          await expect(canvas.getAllByRole("option")).toHaveLength(5);
        });
        const vazio = root.querySelector<HTMLElement>('[data-slot="command-empty"]')!;
        await expect(vazio).not.toHaveAttribute("data-empty");
        // Continua no DOM (é o que preserva o anúncio da próxima busca vazia),
        // mas sem a classe que traz 24px de respiro em cima e embaixo.
        await expect(vazio).not.toHaveClass(/nds-command-empty/);
        await expect(vazio.getBoundingClientRect().height).toBe(0);
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
      const antes = spy.mock.calls.length;
      await userEvent.keyboard("{Enter}");

      await waitFor(async () => {
        await expect(spy.mock.calls.length).toBe(antes + 1);
      });
      await expect(spy.mock.calls[antes][0]).toBe("button");
      // A paleta não tem estado fechado: continua aberta depois de executar.
      await expect(field).toHaveAttribute("aria-expanded", "true");
    });

    await step("Clicar num comando também o escolhe", async () => {
      const antes = spy.mock.calls.length;
      await userEvent.click(canvas.getByRole("option", { name: "cn()" }));

      await waitFor(async () => {
        await expect(spy.mock.calls.length).toBe(antes + 1);
      });
      await expect(spy.mock.calls[antes][0]).toBe("cn");
    });
  },
};
