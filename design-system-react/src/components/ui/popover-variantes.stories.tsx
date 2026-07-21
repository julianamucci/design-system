import type { Meta, StoryObj } from "@storybook/react-vite";
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
  title: "UI/Popover/Variantes",
  tags: ["overlay"],
  component: Popover,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Variantes do Popover: Default (conteúdo livre), ComTitulo (PopoverHeader + Title + Description) e Form (Inputs e botões inline).",
      },
    },
  },
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

const wrapperStyle: React.CSSProperties = {
  contain: "layout",
  minHeight: 280,
  position: "relative",
};

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Default — conteúdo livre dentro do PopoverContent. Mantém PopoverTitle por acessibilidade.",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <Popover defaultOpen>
        <PopoverTrigger asChild>
          <Button variant="outline">Abrir popover</Button>
        </PopoverTrigger>
        <PopoverContent>
          <PopoverTitle className="nds-text-body nds-font-medium">
            Configuracoes de exibição
          </PopoverTitle>
          <p className="nds-text-caption nds-text-muted-foreground">
            Ajuste a aparência do conteúdo da página.
          </p>
        </PopoverContent>
      </Popover>
    </div>
  ),
  play: async ({ step }) => {
    await step("Content tem role=dialog e título acessível", async () => {
      const dialog = await waitFor(() => screen.getByRole("dialog"));
      await expect(dialog).toBeVisible();
      await expect(dialog.textContent).toMatch(/Configuracoes de exibição/i);
    });
  },
};

export const ComTitulo: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "PopoverHeader com PopoverTitle + PopoverDescription. Padrão recomendado: title em frase nominal, description em frase completa.",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <Popover defaultOpen>
        <PopoverTrigger asChild>
          <Button variant="outline">Configuracoes</Button>
        </PopoverTrigger>
        <PopoverContent>
          <PopoverHeader>
            <PopoverTitle>Configuracoes de exibição</PopoverTitle>
            <PopoverDescription>
              Ajuste a aparência do conteúdo da página.
            </PopoverDescription>
          </PopoverHeader>
          <div className="nds-cluster" style={{ paddingTop: "0.25rem" }} data-justify="end" data-spacing="sm">
            <Button variant="ghost" size="sm">
              Cancelar
            </Button>
            <Button size="sm">Salvar</Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  ),
  play: async ({ step }) => {
    await step("Dialog inclui title e description distintos", async () => {
      const dialog = await waitFor(() => screen.getByRole("dialog"));
      await expect(dialog).toBeVisible();
      await expect(dialog.textContent).toMatch(/Configuracoes de exibição/i);
      await expect(dialog.textContent).toMatch(/aparência do conteúdo/i);
    });
  },
};

export const Form: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Formulário inline — Inputs e botão dentro do PopoverContent. Caso de uso: edição rápida sem trocar de tela.",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <Popover defaultOpen>
        <PopoverTrigger asChild>
          <Button variant="outline">Editar perfil</Button>
        </PopoverTrigger>
        <PopoverContent>
          <PopoverHeader>
            <PopoverTitle>Editar perfil</PopoverTitle>
          </PopoverHeader>
          <form
            className="nds-stack" data-spacing="sm"
            onSubmit={(e) => e.preventDefault()}
          >
            <Label htmlFor="popover-form-name" className="nds-text-caption">
              Nome
            </Label>
            <Input id="popover-form-name" defaultValue="Joana" />
            <Label htmlFor="popover-form-email" className="nds-text-caption">
              Email
            </Label>
            <Input
              id="popover-form-email"
              type="email"
              defaultValue="joana@example.com"
            />
            <Button type="submit" size="sm" className="nds-mt-1">
              Atualizar
            </Button>
          </form>
        </PopoverContent>
      </Popover>
    </div>
  ),
  play: async ({ step }) => {
    await step("Inputs e botão submit renderizados dentro do dialog", async () => {
      const dialog = await waitFor(() => screen.getByRole("dialog"));
      await expect(dialog).toBeVisible();
      const name = within(dialog).getByLabelText(/Nome/i);
      const email = within(dialog).getByLabelText(/Email/i);
      const submit = within(dialog).getByRole("button", { name: /Atualizar/i });
      await expect(name).toBeVisible();
      await expect(email).toBeVisible();
      await expect(submit).toBeVisible();
    });
  },
};
