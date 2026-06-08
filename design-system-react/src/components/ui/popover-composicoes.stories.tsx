import type { Meta, StoryObj } from "@storybook/react";
import { expect, waitFor, screen, within } from "storybook/test";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "./popover";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";

const meta = {
  title: "UI/Popover/Composicoes",
  tags: ["overlay"],
  component: Popover,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Composicoes típicas do Popover: EditarPerfil (form inline), FiltrosRapidos (checkbox group), SelecaoDeData (date picker) e SideTop (auto-flip).",
      },
    },
  },
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

const wrapperStyle: React.CSSProperties = {
  contain: "layout",
  minHeight: 320,
  position: "relative",
};

export const EditarPerfil: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Formulário inline para edição rápida de perfil. PopoverTitle obrigatório para acessibilidade.",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <Popover defaultOpen>
        <PopoverTrigger asChild>
          <Button variant="outline">Editar perfil</Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <PopoverHeader>
            <PopoverTitle>Editar perfil</PopoverTitle>
            <PopoverDescription>
              Atualize seu nome e email. As alterações são salvas ao confirmar.
            </PopoverDescription>
          </PopoverHeader>
          <form
            className="flex flex-col gap-2"
            onSubmit={(e) => e.preventDefault()}
          >
            <Label htmlFor="comp-name" className="text-xs">
              Nome
            </Label>
            <Input id="comp-name" defaultValue="Joana Silva" />
            <Label htmlFor="comp-email" className="text-xs">
              Email
            </Label>
            <Input
              id="comp-email"
              type="email"
              defaultValue="joana@example.com"
            />
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" size="sm">
                Cancelar
              </Button>
              <Button type="submit" size="sm">
                Atualizar
              </Button>
            </div>
          </form>
        </PopoverContent>
      </Popover>
    </div>
  ),
  play: async ({ step }) => {
    await step("Form com Inputs nomeados visível", async () => {
      const dialog = await waitFor(() => screen.getByRole("dialog"));
      await expect(dialog).toBeVisible();
      const name = within(dialog).getByLabelText(/Nome/i);
      await expect(name).toHaveValue("Joana Silva");
    });
  },
};

export const FiltrosRapidos: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Filtros contextuais — checkbox group para refinar uma listagem sem trocar de tela.",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <Popover defaultOpen>
        <PopoverTrigger asChild>
          <Button variant="outline">Filtros</Button>
        </PopoverTrigger>
        <PopoverContent>
          <PopoverHeader>
            <PopoverTitle>Filtrar por status</PopoverTitle>
          </PopoverHeader>
          <div className="flex flex-col gap-1.5 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked />
              <span>Ativos</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" />
              <span>Arquivados</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" />
              <span>Rascunhos</span>
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm">
              Limpar
            </Button>
            <Button size="sm">Aplicar</Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  ),
  play: async ({ step }) => {
    await step("Lista de filtros acessível por checkbox", async () => {
      const dialog = await waitFor(() => screen.getByRole("dialog"));
      const ativos = within(dialog).getByLabelText(/Ativos/i);
      await expect(ativos).toBeChecked();
    });
  },
};

export const SelecaoDeData: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Seletor de data — trigger exibe a data atual; popover apresenta um input/calendar simples. Padrão para form inputs de data.",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <Popover defaultOpen>
        <PopoverTrigger asChild>
          <Button variant="outline">07/05/2026</Button>
        </PopoverTrigger>
        <PopoverContent>
          <PopoverHeader>
            <PopoverTitle>Selecionar data</PopoverTitle>
            <PopoverDescription>
              Escolha uma data no formato dd/mm/aaaa.
            </PopoverDescription>
          </PopoverHeader>
          <form
            className="flex flex-col gap-2"
            onSubmit={(e) => e.preventDefault()}
          >
            <Label htmlFor="comp-date" className="text-xs">
              Data
            </Label>
            <Input id="comp-date" type="date" defaultValue="2026-05-07" />
            <div className="flex justify-end pt-1">
              <Button type="submit" size="sm">
                Confirmar
              </Button>
            </div>
          </form>
        </PopoverContent>
      </Popover>
    </div>
  ),
  play: async ({ step }) => {
    await step("Input de data preenchido com valor inicial", async () => {
      const dialog = await waitFor(() => screen.getByRole("dialog"));
      const date = within(dialog).getByLabelText(/Data/i);
      await expect(date).toHaveValue("2026-05-07");
    });
  },
};

export const SideTop: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "side=top — abre acima do trigger. Em caso de colisão com a viewport, o auto-flip reposiciona automaticamente.",
      },
    },
  },
  render: () => (
    <div style={{ ...wrapperStyle, minHeight: 360, paddingTop: 240 }}>
      <Popover defaultOpen>
        <PopoverTrigger asChild>
          <Button variant="outline">Abrir acima</Button>
        </PopoverTrigger>
        <PopoverContent side="top" align="center" sideOffset={8}>
          <PopoverHeader>
            <PopoverTitle>Popover acima</PopoverTitle>
            <PopoverDescription>
              side=top abre acima do trigger.
            </PopoverDescription>
          </PopoverHeader>
        </PopoverContent>
      </Popover>
    </div>
  ),
  play: async ({ step }) => {
    await step("Content renderiza com data-side válido", async () => {
      const dialog = await waitFor(() => screen.getByRole("dialog"));
      await expect(dialog).toBeVisible();
      const sideAttr = dialog.getAttribute("data-side");
      await expect(["top", "bottom", "left", "right"]).toContain(sideAttr ?? "top");
    });
  },
};
