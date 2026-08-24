import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within, expect, waitFor, fn } from "storybook/test";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from "./command";
import {
  commandItemDisabledSource,
  commandItemCheckedSource,
  commandSource,
} from "./command.source";

const meta = {
  title: "UI/Command/States",
  tags: ["overlay"],
  component: Command,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: commandSource },
      description: {
        component:
          "Os estados que a paleta assume sozinha (sem resultados) e os que cada comando assume (desabilitado, marcado).",
      },
    },
    // Filhos auxiliares dentro do listbox — ver PATCHES.md#command-listbox-children
    a11y: {
      config: {
        rules: [{ id: 'aria-required-children', enabled: false }],
      },
    },
  },
} satisfies Meta<typeof Command>;

export default meta;
type Story = StoryObj<typeof meta>;

// Espião de escopo de módulo: este arquivo desliga a aba Actions (as stories
// não têm args próprios), então o espião não teria onde aparecer no painel.
// Toda asserção sobre ele é relativa à contagem do início do passo, para
// sobreviver ao replay, que reexecuta a play no mesmo DOM.
const onChoose = fn();

// ─── Sem resultados ───────────────────────────────────────────────────────────

export const EmptyState: Story = {
  name: "Empty state",
  parameters: { covers: ["visual.item2"] },
  render: () => (
    <div className="nds-w-sm nds-border-default nds-rounded-md nds-shadow-md">
      <Command>
        <CommandInput placeholder="Buscar componente..." />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          <CommandGroup heading="Componentes">
            <CommandItem value="button">Button</CommandItem>
            <CommandItem value="input">Input</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="command"]')!;
    const field = canvas.getByRole("combobox");

    // Idempotente: a busca parte sempre do zero.
    await userEvent.clear(field);

    await step("Com o campo vazio, os dois comandos aparecem", async () => {
      await waitFor(async () => {
        await expect(canvas.getAllByRole("option")).toHaveLength(2);
      });
      await expect(root.querySelector('[data-slot="command-empty"]')).toBeNull();
    });

    await step('Buscando "zzz", nenhum comando sobra e o grupo se recolhe', async () => {
      await userEvent.type(field, "zzz");

      await waitFor(async () => {
        await expect(canvas.queryAllByRole("option")).toHaveLength(0);
      });
      // Cabeçalho sem nada embaixo é ruído: o grupo inteiro sai da tela.
      await expect(root.querySelector<HTMLElement>('[data-slot="command-group"]'))
        .not.toBeVisible();
    });

    await step("A frase ocupa o lugar da lista", async () => {
      const vazio = root.querySelector<HTMLElement>('[data-slot="command-empty"]')!;
      await expect(vazio).toBeVisible();
      await expect(vazio).toHaveTextContent("Nenhum resultado encontrado.");
      await expect(vazio).toHaveClass(/nds-command-empty/);
      // Ela vive dentro da lista, não em cima dela: é o espaço da lista que a
      // mensagem preenche, e é o que evita a área em branco.
      await expect(canvas.getByRole("listbox").contains(vazio)).toBe(true);
    });

    // A story TERMINA sem resultados: é este o quadro que o Chromatic captura.
  },
};

// ─── Comando desabilitado ─────────────────────────────────────────────────────

export const ItemDisabled: Story = {
  name: "Disabled item",
  parameters: {
    covers: ["functional.item4", "accessibility.item4", "visual.item4"],
    // `disabled` é prop do comando, e não da paleta: sem o override o snippet
    // não ensinaria onde a prop entra.
    docs: { source: { transform: commandItemDisabledSource } },
  },
  render: () => (
    <div className="nds-w-sm nds-border-default nds-rounded-md nds-shadow-md">
      <Command>
        <CommandInput placeholder="Buscar comando..." />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          <CommandGroup heading="Arquivo">
            <CommandItem value="novo" onSelect={onChoose}>Novo</CommandItem>
            <CommandItem value="arquivar" disabled onSelect={onChoose}>
              Arquivar
            </CommandItem>
            <CommandItem value="renomear" onSelect={onChoose}>Renomear</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole("combobox");
    // Resolvido por `aria-selected`, e não por `aria-activedescendant`: medido
    // na fonte do `cmdk`, o id só é reescrito quando o valor muda de fato, e
    // `{Home}` sobre a lista já no primeiro item é no-op.
    const inHighlight = () =>
      canvasElement.querySelector<HTMLElement>('[role="option"][aria-selected="true"]');

    await userEvent.clear(field);
    await waitFor(async () => {
      await expect(canvas.getAllByRole("option")).toHaveLength(3);
    });

    const arquivar = canvas.getByRole("option", { name: "Arquivar" });

    await step("O estado chega ao markup e ao desenho", async () => {
      await expect(arquivar).toHaveAttribute("aria-disabled", "true");
      // A lib desta stack escreve o data-attribute como "true"/"false", e a
      // folha o lê por `[data-disabled]:not([data-disabled="false"])`.
      await expect(arquivar).toHaveAttribute("data-disabled", "true");
      const estilo = getComputedStyle(arquivar);
      await expect(estilo.pointerEvents).toBe("none");
      await expect(Number.parseFloat(estilo.opacity)).toBeLessThan(1);
    });

    await step("Clicar não executa o comando", async () => {
      const antes = onChoose.mock.calls.length;
      // `pointerEventsCheck: 0` porque a folha bloqueia o ponteiro: sem isso o
      // user-event recusa o clique antes de o componente ter chance de errar.
      await userEvent.click(arquivar, { pointerEventsCheck: 0 });
      await expect(onChoose.mock.calls.length).toBe(antes);
    });

    await step("As setas pulam o comando desabilitado", async () => {
      field.focus();
      // Home estabelece a precondição do passo: destaque no primeiro comando.
      await userEvent.keyboard("{Home}");
      await waitFor(async () => {
        await expect(inHighlight()).toHaveTextContent("Novo");
      });

      await userEvent.keyboard("{ArrowDown}");
      await waitFor(async () => {
        // "Arquivar" não é destino de navegação — quem usa teclado nunca para
        // num comando que não pode executar.
        await expect(inHighlight()).toHaveTextContent("Renomear");
      });
      await expect(arquivar).toHaveAttribute("aria-selected", "false");
    });

    await step("Enter no comando seguinte executa normalmente", async () => {
      const antes = onChoose.mock.calls.length;
      await userEvent.keyboard("{Enter}");
      await waitFor(async () => {
        await expect(onChoose.mock.calls.length).toBe(antes + 1);
      });
      await expect(onChoose.mock.calls[antes][0]).toBe("renomear");
    });
  },
};

// ─── Comando marcado ──────────────────────────────────────────────────────────

export const CheckedItem: Story = {
  name: "Checked item",
  parameters: {
    covers: ["functional.item5", "visual.item4"],
    // `checked` é prop do comando: o snippet do `meta` não declara estado de
    // escolha nenhum, que é justamente o assunto aqui.
    docs: { source: { transform: commandItemCheckedSource } },
  },
  render: () => (
    <div className="nds-w-sm nds-border-default nds-rounded-md nds-shadow-md">
      <Command>
        <CommandInput placeholder="Buscar tema..." />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          <CommandGroup heading="Aparência">
            <CommandItem value="claro" checked>Claro</CommandItem>
            <CommandItem value="escuro" checked={false}>Escuro</CommandItem>
            <CommandItem value="sistema" checked>Sistema <CommandShortcut>⌘S</CommandShortcut></CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="command"]')!;
    const field = canvas.getByRole("combobox");

    await userEvent.clear(field);
    await waitFor(async () => {
      await expect(canvas.getAllByRole("option")).toHaveLength(3);
    });

    const comando = (value: string) =>
      root.querySelector<HTMLElement>(`[data-value="${value}"]`)!;
    const marca = (value: string) =>
      getComputedStyle(comando(value).querySelector<HTMLElement>(".nds-command-item-check")!);

    await step("O estado chega ao markup", async () => {
      await expect(comando("claro")).toHaveAttribute("data-checked", "true");
      await expect(comando("escuro")).toHaveAttribute("data-checked", "false");
    });

    await step("A marca aparece só no comando marcado", async () => {
      // O ícone fica no DOM nos dois casos — é a opacidade que muda, para a
      // largura do comando não pular a cada troca.
      await expect(marca("claro").opacity).toBe("1");
      await expect(marca("escuro").opacity).toBe("0");
    });

    await step("Com atalho no comando, a marca some", async () => {
      // Os dois disputariam a borda direita. A folha resolve por `:has()`, e a
      // guideline é escolher um dos dois por comando.
      await expect(comando("sistema")).toHaveAttribute("data-checked", "true");
      await expect(marca("sistema").display).toBe("none");
    });

    await step("O atalho faz parte do nome do comando", async () => {
      // Sem isso o leitor anunciaria "Sistema" e a pessoa nunca saberia que há
      // uma tecla — o atalho é informação, não decoração.
      const atalho = comando("sistema").querySelector<HTMLElement>(
        '[data-slot="command-shortcut"]',
      )!;
      await expect(atalho.getAttribute("aria-hidden")).toBeNull();
      await expect(atalho).toHaveClass(/nds-command-shortcut/);
      await expect(canvas.getByRole("option", { name: /Sistema\s*⌘S/ })).toBe(
        comando("sistema"),
      );
    });

    // A story TERMINA com as marcas na tela — é o estado que o contrato visual
    // descreve e o que o Chromatic captura.
  },
};
