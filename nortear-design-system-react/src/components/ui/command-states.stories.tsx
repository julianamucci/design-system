import { useState } from "react";
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
  commandEmptyStateSource,
  commandItemDisabledSource,
  commandItemCheckedSource,
  commandLongListSource,
  commandSource,
} from "./command.source";

import { figmaDesign } from "@shared/figma/design-links";
const meta = {
  title: "Components/Overlay/Command/States",
  tags: ["overlay"],
  component: Command,
  parameters: {
    design: figmaDesign("command"),
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: commandSource },
      description: {
        component:
          "Os estados que a paleta assume sozinha (sem resultados, lista longa) e os que cada comando assume (desabilitado, marcado).",
      },
    },
  },
} satisfies Meta<typeof Command>;

export default meta;
type Story = StoryObj<typeof meta>;

/** O item pelo `value`, e não pelo nome acessível: atalho e marca entram no nome. */
const commandByValue = (root: ParentNode, value: string) =>
  root.querySelector<HTMLElement>(`[data-slot="command-item"][data-value="${value}"]`)!;

// Espião de escopo de módulo: este arquivo desliga a aba Actions (as stories
// não têm args próprios), então o espião não teria onde aparecer no painel.
// Toda asserção sobre ele é relativa à contagem do início do passo, para
// sobreviver ao replay, que reexecuta a play no mesmo DOM.
const onChoose = fn();

// ─── Sem resultados ───────────────────────────────────────────────────────────

const NO_MATCH = "xyznotfound";

/**
 * A paleta já nasce com a busca sem correspondência: é o estado que esta story
 * documenta, e o quadro que o Chromatic captura. O campo desta stack não tem
 * valor inicial próprio, então a busca é controlada aqui — andaime da story, e
 * por isso fora do snippet.
 */
function EmptyStateStory() {
  const [search, setSearch] = useState(NO_MATCH);

  return (
    <div className="nds-w-sm nds-border-default nds-rounded-md nds-shadow-md">
      <Command>
        <CommandInput
          placeholder="Buscar componente..."
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          {/* Sem cabeçalho: a caixa do grupo dá o padding, sem papel de grupo. */}
          <CommandGroup>
            <CommandItem value="button">Button</CommandItem>
            <CommandItem value="input">Input</CommandItem>
            <CommandItem value="separator">Separator</CommandItem>
          </CommandGroup>
        </CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
      </Command>
    </div>
  );
}

export const EmptyState: Story = {
  parameters: {
    covers: ["visual.item2"],
    // Três comandos num grupo sem cabeçalho: a lista do `meta` tem outra forma.
    docs: { source: { transform: commandEmptyStateSource } },
  },
  render: () => <EmptyStateStory />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="command"]')!;
    const field = canvas.getByRole("combobox");
    const list = canvas.getByRole("listbox");
    const emptyRegion = () =>
      root.querySelector<HTMLElement>('[data-slot="command-empty"]')!;

    await step(`Buscando "${NO_MATCH}" não sobra nenhum comando`, async () => {
      // A play reexecuta no mesmo DOM: a busca é redigitada, e não herdada.
      await userEvent.clear(field);
      await userEvent.type(field, NO_MATCH);

      await waitFor(async () => {
        await expect(canvas.queryAllByRole("option")).toHaveLength(0);
      });
    });

    await step("A frase é anunciada, não só desenhada", async () => {
      const empty = emptyRegion();
      await expect(empty).toBeVisible();
      await expect(empty).toHaveTextContent("Nenhum resultado encontrado.");
      await expect(empty).toHaveClass(/nds-command-empty/);
      await expect(empty).toHaveAttribute("data-empty", "");
      // Sem a região viva, quem usa leitor de tela digitaria no vazio sem nunca
      // saber que a busca não achou nada: o foco não sai do campo e não sobra
      // item nenhum para onde navegar.
      await expect(empty).toHaveAttribute("role", "status");
      await expect(empty).toHaveAttribute("aria-live", "polite");
      await expect(empty).toHaveAttribute("aria-atomic", "true");
      // `role="status"` não é filho permitido de `role="listbox"` (só `option`
      // e `group` são), e o axe reprova por aria-required-children.
      await expect(list.contains(empty)).toBe(false);
    });

    await step("Apagar a busca traz os 3 comandos de volta", async () => {
      await userEvent.clear(field);
      await waitFor(async () => {
        await expect(canvas.getAllByRole("option")).toHaveLength(3);
      });
      const empty = emptyRegion();
      // Continua no DOM (é o que preserva o anúncio da próxima busca vazia),
      // mas sem conteúdo, sem a classe e com altura zero.
      await expect(empty).not.toHaveAttribute("data-empty");
      await expect(empty).not.toHaveClass(/nds-command-empty/);
      await expect(empty.getBoundingClientRect().height).toBe(0);
    });

    await step("A story termina SEM resultados", async () => {
      // O Chromatic fotografa o estado final: terminar com a lista cheia
      // capturaria outra story.
      await userEvent.type(field, NO_MATCH);
      await waitFor(async () => {
        await expect(canvas.queryAllByRole("option")).toHaveLength(0);
      });
      await expect(emptyRegion()).toHaveAttribute("data-empty", "");
    });
  },
};

// ─── Comando desabilitado ─────────────────────────────────────────────────────

export const ItemDisabled: Story = {
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
          <CommandGroup>
            <CommandItem value="novo" onSelect={onChoose}>Novo</CommandItem>
            <CommandItem value="arquivar" disabled onSelect={onChoose}>
              Arquivar
            </CommandItem>
            <CommandItem value="renomear" onSelect={onChoose}>Renomear</CommandItem>
          </CommandGroup>
        </CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
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

    // Consultado a cada passo: o filtro reconstrói a lista, e um nó guardado
    // antes de um re-render vira uma asserção sobre elemento solto no ar.
    const arquivar = () => commandByValue(canvasElement, "arquivar");

    await step("O grupo sem cabeçalho é só caixa, sem papel de grupo", async () => {
      // Itens sem grupo moram num grupo SEM cabeçalho — a caixa dá os 4px de
      // padding de que o raio aninhado do item depende. Grupo sem nome não é
      // anunciado: um `role="group"` anônimo diria "grupo" sem dizer de quê.
      const group = canvasElement.querySelector<HTMLElement>('[data-slot="command-group"]')!;
      await expect(group).toHaveClass(/nds-command-group/);
      await expect(group.contains(arquivar())).toBe(true);
      await expect(canvasElement.querySelectorAll("[cmdk-group-heading]")).toHaveLength(0);
      await expect(canvas.queryAllByRole("group")).toHaveLength(0);
    });

    await step("O estado chega ao markup e ao desenho", async () => {
      await expect(arquivar()).toHaveAttribute("aria-disabled", "true");
      // A lib desta stack escreve o data-attribute como "true"/"false", e a
      // folha o lê por `[data-disabled]:not([data-disabled="false"])`.
      await expect(arquivar()).toHaveAttribute("data-disabled", "true");
      // O que a pessoa percebe: o comando esmaecido e o ponteiro passando
      // direto por ele. Cursor não se afirma — com `pointer-events: none` ele
      // nunca pousa no item.
      const computedStyle = getComputedStyle(arquivar());
      await expect(computedStyle.pointerEvents).toBe("none");
      await expect(Number.parseFloat(computedStyle.opacity)).toBeLessThan(1);
    });

    await step("Clicar não executa o comando nem tira o foco do campo", async () => {
      field.focus();
      const antes = onChoose.mock.calls.length;
      // `pointerEventsCheck: 0` porque a folha bloqueia o ponteiro: sem isso o
      // user-event recusa o clique antes de o componente ter chance de errar.
      await userEvent.click(arquivar(), { pointerEventsCheck: 0 });
      await expect(onChoose.mock.calls.length).toBe(antes);
      // O clique que cai no desabilitado não pode levar o foco para a lista:
      // dentro de um Dialog, ele sairia do campo e a busca pararia de receber
      // as letras.
      await expect(field).toHaveFocus();
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
      await expect(arquivar()).toHaveAttribute("aria-selected", "false");
    });

    await step("Enter no comando habilitado seguinte executa normalmente", async () => {
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
          <CommandGroup heading="Aparência">
            <CommandItem value="claro" checked>Claro</CommandItem>
            <CommandItem value="escuro" checked={false}>Escuro</CommandItem>
            <CommandItem value="sistema" checked>Sistema <CommandShortcut>Ctrl+S</CommandShortcut></CommandItem>
          </CommandGroup>
        </CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
      </Command>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole("combobox");

    await userEvent.clear(field);
    await waitFor(async () => {
      await expect(canvas.getAllByRole("option")).toHaveLength(3);
    });

    const comando = (value: string) => commandByValue(canvasElement, value);
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
      await expect(comando("sistema")).toHaveAccessibleName(/Sistema\s*Ctrl\+S/);
    });

    // A story TERMINA com as marcas na tela — é o estado que o contrato visual
    // descreve e o que o Chromatic captura.
  },
};

// ─── Lista longa ──────────────────────────────────────────────────────────────

const LONG_LIST = [
  "Accordion", "Alert", "AlertDialog", "AspectRatio", "Avatar",
  "Badge", "Breadcrumb", "Button", "Calendar", "Card",
  "Carousel", "Chart", "Checkbox", "Collapsible", "Command",
  "ContextMenu", "DataTable", "DatePicker", "Dialog", "Drawer",
  "DropdownMenu", "Form", "HoverCard", "Input", "InputOTP",
  "Label", "Menubar", "NavigationMenu", "Pagination", "Popover",
];

export const LongList: Story = {
  parameters: {
    // Trinta comandos gerados por laço: a lista do `meta` tem cinco.
    docs: { source: { transform: commandLongListSource } },
  },
  render: () => (
    <div className="nds-w-sm nds-border-default nds-rounded-md nds-shadow-md">
      <Command>
        <CommandInput placeholder="Buscar componente..." />
        <CommandList>
          <CommandGroup heading="Componentes">
            {LONG_LIST.map((name) => (
              <CommandItem key={name} value={name.toLowerCase()}>
                {name}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
      </Command>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole("combobox");
    const list = canvas.getByRole("listbox");

    await userEvent.clear(field);
    await waitFor(async () => {
      await expect(canvas.getAllByRole("option")).toHaveLength(30);
    });

    await step("A lista rola em vez de esticar a paleta", async () => {
      // 300px de teto na folha: sem ele a paleta cresceria para fora da tela e
      // o campo de busca sairia do alcance.
      await expect(list.scrollHeight).toBeGreaterThan(list.clientHeight);
      await expect(getComputedStyle(list).overflowY).toBe("auto");
    });

    await step('Buscando "dialog" sobram 2 — Dialog e AlertDialog', async () => {
      await userEvent.type(field, "dialog");
      await waitFor(async () => {
        await expect(canvas.getAllByRole("option")).toHaveLength(2);
      });
      await expect(commandByValue(canvasElement, "dialog")).toBeVisible();
      await expect(commandByValue(canvasElement, "alertdialog")).toBeVisible();
    });

    await step("A story termina com a lista inteira", async () => {
      await userEvent.clear(field);
      await waitFor(async () => {
        await expect(canvas.getAllByRole("option")).toHaveLength(30);
      });
    });
  },
};
