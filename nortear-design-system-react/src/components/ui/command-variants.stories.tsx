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
import { commandSource, commandWithGroupsSource } from "./command.source";

import { figmaDesign } from "@shared/figma/design-links";
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
  title: "Components/Overlay/Command/Variants",
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
          "A paleta não tem variante visual por prop — o que muda entre os arranjos é a composição. Aqui fica a lista dividida em grupos nomeados, com divisor entre eles.",
      },
    },
  },
} satisfies Meta<typeof Command>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Com grupos ───────────────────────────────────────────────────────────────

export const WithGroups: Story = {
  parameters: {
    covers: ["visual.item1"],
    // Sete comandos em dois grupos: a lista do `meta` tem cinco, e mostraria
    // outra paleta ao lado desta.
    docs: { source: { transform: commandWithGroupsSource } },
  },
  render: () => (
    <div className="nds-w-sm nds-border-default nds-rounded-md nds-shadow-md">
      <Command>
        <CommandInput placeholder="Buscar componente..." />
        <CommandList>
          <CommandGroup heading="Componentes">
            <CommandItem value="button">Button</CommandItem>
            <CommandItem value="input">Input</CommandItem>
            <CommandItem value="badge">Badge</CommandItem>
            <CommandItem value="separator">Separator</CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Utilitários">
            <CommandItem value="cn">cn()</CommandItem>
            <CommandItem value="clsx">clsx()</CommandItem>
            <CommandItem value="twmerge">twMerge()</CommandItem>
          </CommandGroup>
        </CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
      </Command>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="command"]')!;
    const field = canvas.getByRole("combobox");
    const separators = () =>
      root.querySelectorAll<HTMLElement>('[data-slot="command-separator"]');

    // Idempotente: a busca parte sempre do zero.
    await userEvent.clear(field);
    await waitFor(async () => {
      await expect(canvas.getAllByRole("option")).toHaveLength(7);
    });

    await step("Cada grupo é nomeado pelo próprio cabeçalho", async () => {
      // Sem o `aria-labelledby` o leitor anuncia "grupo" e a pessoa não sabe de
      // qual bloco se trata.
      await expect(root.querySelectorAll("[cmdk-group-heading]")).toHaveLength(2);
      await expect(canvas.getByRole("group", { name: "Componentes" })).toBeVisible();
      await expect(canvas.getByRole("group", { name: "Utilitários" })).toBeVisible();
      // O cabeçalho NÃO é uma opção — o erro clássico deste componente é
      // deixá-lo entrar na lista e virar destino de navegação.
      const names = canvas.getAllByRole("option").map((option) => option.textContent);
      await expect(names).not.toContain("Componentes");
      for (const option of canvas.getAllByRole("option")) {
        await expect(option).toHaveAttribute("data-slot", "command-item");
      }
    });

    await step("Um divisor separa os dois grupos, fora da árvore", async () => {
      await expect(separators()).toHaveLength(1);
      await expect(separators()[0]).toHaveClass(/nds-command-separator/);
      // A lib desta stack crava `role="separator"` depois do espalhamento das
      // props e não deixa sobrescrevê-lo; `aria-hidden` tira o nó da árvore de
      // acessibilidade, que é o que o axe de fato mede. Só `option` e `group`
      // são filhos permitidos de um listbox.
      await expect(separators()[0]).toHaveAttribute("aria-hidden", "true");
      await expect(canvas.queryAllByRole("separator")).toHaveLength(0);
    });

    await step('Buscando "n", o filtro atravessa os dois grupos — sobram 3', async () => {
      await userEvent.type(field, "n");

      await waitFor(async () => {
        // Button e Input (Componentes) + cn() (Utilitários).
        await expect(canvas.getAllByRole("option")).toHaveLength(3);
      });
      await expect(canvas.getByRole("group", { name: "Componentes" })).toBeVisible();
      await expect(canvas.getByRole("group", { name: "Utilitários" })).toBeVisible();
      // Nesta stack o divisor sai do DOM em QUALQUER busca — é o padrão da lib,
      // registrado como divergência aceita.
      await expect(separators()).toHaveLength(0);
    });

    await step('Buscando "badge" sobra 1 comando e nenhum divisor', async () => {
      await userEvent.clear(field);
      await userEvent.type(field, "badge");

      await waitFor(async () => {
        await expect(canvas.getAllByRole("option")).toHaveLength(1);
      });
      // Um grupo só na tela: divisor sem nada de um dos lados seria ruído.
      await expect(separators()).toHaveLength(0);
      await expect(canvas.queryAllByRole("group")).toHaveLength(1);
    });

    await step("A story termina no estado padrão, com os 7 comandos", async () => {
      await userEvent.clear(field);
      await waitFor(async () => {
        await expect(canvas.getAllByRole("option")).toHaveLength(7);
      });
      // Os dois grupos e o divisor de volta — é este o quadro que o Chromatic
      // captura.
      await expect(separators()).toHaveLength(1);
    });
  },
};
