import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, screen, within, userEvent } from "storybook/test";
import {
  Popover,
  PopoverClose,
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

import { figmaDesign } from "@shared/figma/design-links";
const meta = {
  title: "Components/Overlay/Popover/Variants",
  tags: ["overlay"],
  component: Popover,
  parameters: {
    design: figmaDesign("popover"),
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

/** A altura mínima sai da escada de utilitárias, não de um valor cravado:
 *  inline vence a folha, e a medida sairia do tema e da densidade junto. */
const wrapperClass = "nds-min-h-70";
const wrapperStyle: React.CSSProperties = {
  contain: "layout",
  position: "relative",
};

export const Default: Story = {
  parameters: {
    covers: ["visual.item1"],
    docs: {
      // A AUSÊNCIA de título é o assunto: sem `PopoverTitle` o nome do painel
      // se declara por `aria-label`, e o meta imprime o cabeçalho completo.
      source: { transform: popoverContentLivreSource },
      description: {
        story:
          "Conteúdo livre dentro do PopoverContent. Sem título, o painel declara o próprio nome por aria-label.",
      },
    },
  },
  render: () => (
    <div className={wrapperClass} style={wrapperStyle}>
      <Popover defaultOpen>
        <PopoverTrigger asChild>
          <Button variant="outline">Ver atalhos</Button>
        </PopoverTrigger>
        <PopoverContent aria-label="Informações adicionais">
          <p>
            Use Ctrl+K para abrir a busca em qualquer tela.
          </p>
        </PopoverContent>
      </Popover>
    </div>
  ),
  play: async ({ step }) => {
    await step("Sem título, o painel se nomeia por aria-label", async () => {
      // `role="dialog"` sem nome reprova na regra aria-dialog-name do axe — e o
      // nome herdado do gatilho anunciaria a porta, não o que há atrás dela.
      const dialog = await waitFor(() => screen.getByRole("dialog"));
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAccessibleName("Informações adicionais");
      await expect(dialog).not.toHaveAttribute("aria-labelledby");
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
  render: () => {
    const WithTitleDemo = () => {
      // CONTROLADO por causa do Salvar: confirmar fecha por CÓDIGO.
      const [open, setOpen] = useState(true);
      return (
    <div className={wrapperClass} style={wrapperStyle}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline">Configurações</Button>
        </PopoverTrigger>
        <PopoverContent>
          <PopoverHeader>
            <PopoverTitle>Configurações de exibição</PopoverTitle>
            <PopoverDescription>
              Ajuste a aparência do conteúdo da página.
            </PopoverDescription>
          </PopoverHeader>
          {/* Fora de um `<form>` o efeito visível das duas é fechar, mas pelo
              CAMINHO de cada uma: o Cancelar é a peça de fechar
              (`close-button`) e o Salvar fecha por código (`api`), como um
              formulário faz depois de salvar. Até 2026-09-13 as duas eram
              `PopoverClose`, e "concluiu" chegava ao relatório como "apertou o
              botão de fechar". */}
          <div className="nds-cluster nds-pt-1" data-justify="end" data-spacing="sm">
            <PopoverClose asChild>
              <Button variant="ghost" size="sm">
                Cancelar
              </Button>
            </PopoverClose>
            <Button size="sm" onClick={() => setOpen(false)}>Salvar</Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
      );
    };
    return <WithTitleDemo />;
  },
  play: async ({ step }) => {
    await step("O título nomeia o painel por aria-labelledby", async () => {
      const dialog = await waitFor(() => screen.getByRole("dialog"));
      await expect(dialog).toBeVisible();
      const idTitle = dialog.getAttribute("aria-labelledby");
      await expect(idTitle).toBeTruthy();
      const title = document.getElementById(idTitle!)!;
      await expect(title).toHaveClass(/nds-popover-title/);
      await expect(title.textContent).toMatch(/Configurações de exibição/i);
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
      const cancel = within(dialog).getByRole("button", { name: /Cancelar/i });
      const save = within(dialog).getByRole("button", { name: /Salvar/i });
      cancel.focus();
      await userEvent.tab();
      await expect(save).toHaveFocus();
    });

    await step("E o elemento focado por teclado mostra o anel de foco", async () => {
      // `:focus-visible` é a condição exata que o CSS compartilhado usa para
      // desenhar o anel — se o foco tivesse vindo do ponteiro, o navegador não
      // casaria a pseudo-classe e o anel não apareceria.
      const save = within(screen.getByRole("dialog")).getByRole("button", { name: /Salvar/i });
      await expect(save.matches(":focus-visible")).toBe(true);
      // O anel de `.nds-button` é box-shadow, não outline — medir a propriedade
      // errada daria verde em qualquer elemento.
      await expect(getComputedStyle(save).boxShadow).not.toBe("none");
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
  render: () => {
    const FormDemo = () => {
      // CONTROLADO porque o formulário fecha por CÓDIGO ao salvar, e a base-ui
      // não tem fechamento imperativo: sem estado de quem compõe, não há como
      // fechar. Mesma forma do Playground.
      const [open, setOpen] = useState(true);
      return (
    <div className={wrapperClass} style={wrapperStyle}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline">Editar perfil</Button>
        </PopoverTrigger>
        <PopoverContent>
          <PopoverHeader>
            <PopoverTitle>Editar perfil</PopoverTitle>
          </PopoverHeader>
          <form
            className="nds-stack" data-spacing="sm"
            onSubmit={(e) => {
              // O fechamento vive AQUI, depois do `preventDefault`, e não no
              // `onClick` do "Atualizar": fechar no clique desmontaria o
              // formulário antes de ele submeter — o "salvar" nunca
              // aconteceria — e deixaria de fora o Enter num campo, que é
              // como metade das pessoas envia formulário.
              e.preventDefault();
              // …aqui entraria a gravação do perfil…
              setOpen(false);
            }}
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
      );
    };
    return <FormDemo />;
  },
  play: async ({ canvasElement, step }) => {
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

    await step("Atualizar salva e fecha por CÓDIGO, pelo caminho do submit", async () => {
      const submit = within(screen.getByRole("dialog")).getByRole("button", {
        name: /Atualizar/i,
      });
      await userEvent.click(submit);
      // Leitura PURA dentro do `waitFor`: `queryByRole` não toca no DOM. Uma
      // condição que muta aqui dentro se reagenda pelo observador de mutação e
      // pendura o arquivo inteiro sem reprovar.
      await waitFor(() => {
        expect(screen.queryByRole("dialog")).toBeNull();
      });
    });

    await step("O Enter num campo fecha pelo mesmo caminho", async () => {
      // É o gesto de quem acabou de digitar, e ele NÃO passa pelo `onClick` de
      // botão nenhum — só o `submit` do formulário o alcança.
      const trigger = within(canvasElement).getByRole("button", { name: /Editar perfil/i });
      await userEvent.click(trigger);
      const name = within(await waitFor(() => screen.getByRole("dialog"))).getByLabelText(/Nome/i);
      await userEvent.type(name, "{Enter}");
      await waitFor(() => {
        expect(screen.queryByRole("dialog")).toBeNull();
      });
    });

    // Termina ABERTA: é o estado que o axe varre e o Chromatic fotografa.
    await step("Estado final: painel aberto", async () => {
      const trigger = within(canvasElement).getByRole("button", { name: /Editar perfil/i });
      await userEvent.click(trigger);
      await expect(await waitFor(() => screen.getByRole("dialog"))).toBeVisible();
    });
  },
};
