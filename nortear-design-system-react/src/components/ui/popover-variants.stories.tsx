import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, screen, within, userEvent } from "storybook/test";
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
import {
  popoverContentLivreSource,
  popoverFormSource,
  popoverSource,
} from "./popover.source";

const meta = {
  title: "Primitives/Overlay/Popover/Variants",
  tags: ["overlay"],
  component: Popover,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      source: { transform: popoverSource },
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
    covers: ["visual.item1"],
    docs: {
      // A AUSÊNCIA de título é o assunto: sem `PopoverTitle` o painel herda o
      // nome acessível do gatilho, e o meta imprime o cabeçalho completo.
      source: { transform: popoverContentLivreSource },
      description: {
        story:
          "Conteúdo livre dentro do PopoverContent. Sem título, o painel herda o nome acessível do gatilho.",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <Popover defaultOpen>
        <PopoverTrigger asChild>
          <Button variant="outline">Ver atalhos</Button>
        </PopoverTrigger>
        <PopoverContent>
          <p className="nds-text-body">
            Use Ctrl+K para abrir a busca em qualquer tela.
          </p>
        </PopoverContent>
      </Popover>
    </div>
  ),
  play: async ({ step }) => {
    await step("Sem título, o painel herda o nome acessível do gatilho", async () => {
      // `role="dialog"` sem nome reprova na regra aria-dialog-name do axe.
      const dialog = await waitFor(() => screen.getByRole("dialog"));
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAccessibleName("Ver atalhos");
    });

    await step("E carrega a classe do design system com o conteúdo livre", async () => {
      const dialog = screen.getByRole("dialog");
      await expect(dialog).toHaveClass(/nds-popover-content/);
      await expect(dialog.textContent).toMatch(/Ctrl\+K/);
    });
  },
};

export const WithTitle: Story = {
  parameters: {
    covers: [
      "visual.item2", "accessibility.item5", "accessibility.item3", "functional.item4",
    ],
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
          <div className="nds-cluster nds-pt-1" data-justify="end" data-spacing="sm">
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
    await step("O título nomeia o painel por aria-labelledby", async () => {
      const dialog = await waitFor(() => screen.getByRole("dialog"));
      await expect(dialog).toBeVisible();
      const idTitle = dialog.getAttribute("aria-labelledby");
      await expect(idTitle).toBeTruthy();
      const title = document.getElementById(idTitle!)!;
      await expect(title).toHaveClass(/nds-popover-title/);
      await expect(title.textContent).toMatch(/Configuracoes de exibição/i);
    });

    await step("A descrição entra por aria-describedby", async () => {
      const dialog = screen.getByRole("dialog");
      const idDescription = dialog.getAttribute("aria-describedby");
      await expect(idDescription).toBeTruthy();
      await expect(document.getElementById(idDescription!)).toHaveClass(
        /nds-popover-description/,
      );
    });

    await step("Tab caminha entre os controles internos", async () => {
      const dialog = screen.getByRole("dialog");
      const cancelar = within(dialog).getByRole("button", { name: /Cancelar/i });
      const salvar = within(dialog).getByRole("button", { name: /Salvar/i });
      cancelar.focus();
      await userEvent.tab();
      await expect(salvar).toHaveFocus();
    });

    await step("E o elemento focado por teclado mostra o anel de foco", async () => {
      // `:focus-visible` é a condição exata que o CSS compartilhado usa para
      // desenhar o anel — se o foco tivesse vindo do ponteiro, o navegador não
      // casaria a pseudo-classe e o anel não apareceria.
      const salvar = within(screen.getByRole("dialog")).getByRole("button", { name: /Salvar/i });
      await expect(salvar.matches(":focus-visible")).toBe(true);
      // O anel de `.nds-button` é box-shadow, não outline — medir a propriedade
      // errada daria verde em qualquer elemento.
      await expect(getComputedStyle(salvar).boxShadow).not.toBe("none");
    });
  },
};

export const Form: Story = {
  parameters: {
    covers: ["visual.item3"],
    docs: {
      // Sub-composição com formulário dentro do painel — campos, rótulos e
      // submit que o snippet do meta não carrega.
      source: { transform: popoverFormSource },
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
