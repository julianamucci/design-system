import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within, expect, waitFor } from "storybook/test";
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
import { LayoutIcon, TypeIcon, MinusIcon } from "lucide-react";

/*
 * As VARIANTES da paleta são as entradas de `variants.items` do conteúdo
 * compartilhado — inline, command palette e com grupos. `inline` é o próprio
 * Playground e `palette` depende do Dialog, então mora em Compositions; o que
 * sobra para cá é a lista dividida em grupos.
 *
 * Antes esta story morava em Compositions em quatro stacks e em Variants numa
 * quinta — a mesma peça em dois lugares da barra lateral, conforme a stack que
 * a pessoa estivesse lendo. O grupo sai do ARQUIVO, e o arquivo sai do
 * conteúdo: `-variants` espelha `variants.items`, `-states` espelha `states`.
 */
const meta = {
  title: "Primitives/Overlay/Command/Variants",
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
          "A paleta não tem variante visual por prop — o que muda entre os arranjos é a composição. Aqui fica a lista dividida em grupos, com divisor entre eles.",
      },
    },
    // Mensagem de vazio dentro do listbox — ver PATCHES.md#command-listbox-children
    a11y: {
      config: {
        rules: [{ id: 'aria-required-children', enabled: false }],
      },
    },
  },
} satisfies Meta<typeof Command>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Com Grupos e Separador ───────────────────────────────────────────────────

export const WithGroups: Story = {
  name: "With groups and separator",
  parameters: { covers: ["visual.item1"] },
  render: () => (
    <div className="nds-w-sm nds-border-default nds-rounded-md nds-shadow-md">
      <Command>
        <CommandInput placeholder="Buscar componente..." />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          <CommandGroup heading="Componentes">
            <CommandItem value="button">
              <LayoutIcon />
              Button
            </CommandItem>
            <CommandItem value="input">
              <TypeIcon />
              Input
            </CommandItem>
            <CommandItem value="separator">
              <MinusIcon />
              Separator
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Utilitários">
            <CommandItem value="cn">cn()</CommandItem>
            <CommandItem value="clsx">clsx()</CommandItem>
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
    await waitFor(async () => {
      await expect(canvas.getAllByRole("option")).toHaveLength(5);
    });

    await step("Cada grupo é nomeado pelo próprio cabeçalho", async () => {
      // Sem o `aria-labelledby` o leitor anuncia "grupo" e a pessoa não sabe de
      // qual bloco se trata.
      await expect(canvas.getByRole("group", { name: "Componentes" })).toBeVisible();
      await expect(canvas.getByRole("group", { name: "Utilitários" })).toBeVisible();
      await expect(root.querySelectorAll("[cmdk-group-heading]")).toHaveLength(2);
    });

    await step("O cabeçalho não é opção da lista", async () => {
      // Cabeçalho navegável seria pior que inútil: a seta pararia nele como se
      // fosse comando, e o filtro o traria como resultado.
      await expect(canvas.getAllByRole("option")).toHaveLength(5);
      for (const option of canvas.getAllByRole("option")) {
        await expect(option).toHaveAttribute("data-slot", "command-item");
      }
    });

    await step("O divisor separa os blocos e não vira comando", async () => {
      const divisor = root.querySelector<HTMLElement>('[data-slot="command-separator"]')!;
      await expect(divisor).toHaveClass(/nds-command-separator/);
      await expect(divisor).not.toHaveAttribute("data-slot", "command-item");
      // O passo se chamava "o divisor separa os blocos e não vira comando" e a
      // asserção cobrava `role="separator"` — o próprio defeito, congelado como
      // contrato: `separator` não é filho permitido de `role="listbox"`. A lib
      // crava o papel depois do espalhamento e não deixa sobrescrevê-lo, mas
      // `aria-hidden` tira o nó da árvore de acessibilidade, que é o que as
      // outras quatro stacks fazem e o que o axe de fato mede.
      await expect(divisor).toHaveAttribute("aria-hidden", "true");
      await expect(canvas.queryAllByRole("separator")).toHaveLength(0);
    });

    await step('Buscando "n", o filtro atravessa os dois grupos', async () => {
      await userEvent.type(field, "n");

      await waitFor(async () => {
        // "Button", "Input" e "cn()" — dois grupos ao mesmo tempo.
        await expect(canvas.getAllByRole("option")).toHaveLength(3);
      });
      await expect(canvas.getByRole("group", { name: "Componentes" })).toBeVisible();
      await expect(canvas.getByRole("group", { name: "Utilitários" })).toBeVisible();
      // Com busca ativa o divisor sai do DOM: separar blocos que o filtro
      // acabou de embaralhar só confundiria.
      await expect(root.querySelector('[data-slot="command-separator"]')).toBeNull();
    });

    await step("Apagar a busca devolve o estado padrão", async () => {
      await userEvent.clear(field);
      await waitFor(async () => {
        await expect(canvas.getAllByRole("option")).toHaveLength(5);
      });
      // A story TERMINA no arranjo padrão, com os dois grupos e o divisor —
      // é este o quadro que o Chromatic captura.
      await expect(root.querySelector('[data-slot="command-separator"]')).not.toBeNull();
    });
  },
};
