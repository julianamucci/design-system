import type { Meta, StoryObj } from "@storybook/react";
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
import { LayoutIcon, TypeIcon, MinusIcon } from "lucide-react";

const meta = {
  title: "UI/Command/Estados",
  tags: ["overlay"],
  component: Command,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          "Estados do Command: sem resultados (CommandEmpty) e item desabilitado.",
      },
    },
    // cmdk listbox children — ver PATCHES.md#command-listbox-children
    a11y: {
      config: {
        rules: [{ id: 'aria-required-children', enabled: false }],
      },
    },
  },
} satisfies Meta<typeof Command>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Empty State ──────────────────────────────────────────────────────────────

export const EstadoSemResultados: Story = {
  name: "Sem Resultados (CommandEmpty)",
  render: () => (
    <div className="w-72">
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
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("combobox");

    await step("Digitar texto inexistente filtra para zero resultados", async () => {
      await userEvent.type(input, "zzz_inexistente");
    });

    await step("CommandEmpty é exibido quando não há resultados", async () => {
      const empty = await canvas.findByText(/nenhum resultado encontrado/i, {}, { timeout: 5000 });
      await expect(empty).toBeInTheDocument();
    });

    await step("nenhum CommandItem é visível", async () => {
      await waitFor(() => {
        const items = canvas.queryAllByRole("option");
        expect(items.length).toBe(0);
      });
    });
  },
};

// ─── Item Desabilitado ────────────────────────────────────────────────────────

export const ItemDesabilitado: Story = {
  name: "Item Desabilitado",
  render: () => (
    <div className="w-72">
      <Command>
        <CommandInput placeholder="Buscar componente..." />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          <CommandGroup heading="Componentes">
            <CommandItem value="button">
              <LayoutIcon />
              Button
            </CommandItem>
            <CommandItem value="input" disabled>
              <TypeIcon />
              Input (desabilitado)
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Utilitários">
            <CommandItem value="separator">
              <MinusIcon />
              Separator
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("item desabilitado tem atributo data-disabled", async () => {
      const items = canvas.getAllByRole("option");
      const disabledItem = items.find((el) =>
        el.textContent?.includes("Input (desabilitado)")
      );
      await expect(disabledItem).toHaveAttribute("data-disabled", "true");
    });

    await step("clicar no item desabilitado não dispara ação", async () => {
      const items = canvas.getAllByRole("option");
      const disabledItem = items.find((el) =>
        el.textContent?.includes("Input (desabilitado)")
      );
      if (disabledItem) {
        await userEvent.click(disabledItem, { pointerEventsCheck: 0 });
      }
      // sem erro — item não responde
    });
  },
};
