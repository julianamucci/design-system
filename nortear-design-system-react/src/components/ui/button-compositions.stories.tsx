import { figmaDesign } from "@shared/figma/design-links";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within, expect } from "storybook/test";
import { Plus, Trash2, ChevronRight, Download } from "lucide-react";
import { Button, buttonVariants } from "./button";
import {
  buttonComoLinkSource,
  buttonDestrutivoComIconeSource,
  buttonIconDireitaSource,
  buttonIconEsquerdaSource,
  buttonParDeAcoesSource,
  buttonSomenteIconSource,
  buttonSource,
} from "./button.source";

const meta = {
  title: "UI/Button/Compositions",
  tags: ["form"],
  component: Button,
  parameters: {
    design: figmaDesign("button"),
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: buttonSource },
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithIconLeft: Story = {
  render: () => (
    <Button>
      <Plus aria-hidden="true" />
      Adicionar item
    </Button>
  ),
  parameters: {
    covers: ["visual.item5"],
    docs: {
      // O ícone dentro do botão é composição, não arg: o `meta` imprimiria só o
      // rótulo e o `aria-hidden` que tira o ícone da leitura sumiria junto.
      source: { transform: buttonIconEsquerdaSource },
      description: {
        story: "Ícone à esquerda do label. O SVG deve ter aria-hidden=\"true\" para não poluir leitores de tela.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const btn = within(canvasElement).getByRole("button", { name: "Adicionar item" });
    // Nome exato: se o ícone deixasse de ser aria-hidden ele entraria no nome.
    await expect(btn.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    await expect(btn.firstElementChild).toBe(btn.querySelector("svg"));
  },
};

export const WithIconRight: Story = {
  render: () => (
    <Button variant="outline">
      Próximo
      <ChevronRight aria-hidden="true" />
    </Button>
  ),
  parameters: {
    docs: {
      // A ORDEM entre ícone e rótulo é o que separa esta story da anterior, e
      // ordem de filhos não existe em arg nenhum.
      source: { transform: buttonIconDireitaSource },
      description: {
        story: "Ícone à direita do label. Use em botões de navegação progressiva.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const btn = within(canvasElement).getByRole("button", { name: "Próximo" });
    const svg = btn.querySelector("svg");
    await expect(svg).toHaveAttribute("aria-hidden", "true");
    // É o que distingue esta story da anterior: o ícone vem DEPOIS do label.
    await expect(btn.lastElementChild).toBe(svg);
  },
};

export const DestructiveIcon: Story = {
  render: () => (
    <Button variant="destructive">
      <Trash2 aria-hidden="true" />
      Excluir
    </Button>
  ),
  parameters: {
    docs: {
      // A combinação variante + ícone é o assunto; o `meta` teria a variante e
      // perderia o ícone.
      source: { transform: buttonDestrutivoComIconeSource },
      description: {
        story: "Combinação de variante destrutiva com ícone. Use para ações irreversíveis como excluir.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const btn = within(canvasElement).getByRole("button", { name: "Excluir" });
    await expect(btn).toHaveClass("nds-button-destructive");
    await expect(btn.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  },
};

export const IconOnly: Story = {
  render: () => (
    <Button size="icon" aria-label="Baixar arquivo">
      <Download aria-hidden="true" />
    </Button>
  ),
  parameters: {
    docs: {
      // A AUSÊNCIA de texto é o assunto: sem ela o `aria-label` obrigatório
      // pareceria opcional no snippet.
      source: { transform: buttonSomenteIconSource },
      description: {
        story: "Botão apenas com ícone. aria-label é obrigatório para acessibilidade.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Botão é acessível por aria-label", async () => {
      const button = canvas.getByRole("button", { name: "Baixar arquivo" });
      await expect(button).toBeInTheDocument();
    });
  },
};

export const ActionPair: Story = {
  render: () => (
    <div className="nds-cluster" data-spacing="sm">
      <Button variant="outline">Cancelar</Button>
      <Button>Confirmar</Button>
    </div>
  ),
  parameters: {
    docs: {
      // São DOIS botões e o contêiner que os espaça: um botão sozinho esconderia
      // a regra de ordem que a story existe para afirmar.
      source: { transform: buttonParDeAcoesSource },
      description: {
        story: "Par de ações canônico: outline (cancelar) + default (confirmar). Primária sempre à direita em contexto ocidental.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cancelar = canvas.getByRole("button", { name: "Cancelar" });
    const confirmar = canvas.getByRole("button", { name: "Confirmar" });
    await expect(cancelar).toHaveClass("nds-button-outline");
    await expect(confirmar).toHaveClass("nds-button-default");
    // A regra documentada é a ordem: a primária fica à direita.
    await expect(cancelar.compareDocumentPosition(confirmar)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  },
};

export const AsLink: Story = {
  render: () => (
    // Link com aparência de botão = classes num <a> real, não o componente
    // Button. Passar um <a> pelo `render` faz a lib avisar em runtime que a
    // semântica de botão nativo se perdeu, e `nativeButton={false}` "conserta"
    // impondo role="button" no link — o oposto do que a story demonstra.
    // Mesma solução das outras stacks: só as classes da variante.
    <a href="#docs" className={buttonVariants({ variant: "link" })}>
      Ver documentação
    </a>
  ),
  parameters: {
    covers: ["functional.item5"],
    docs: {
      // Aqui não há componente Button: o que se ensina é o <a> real levando as
      // classes da variante, e um `<Button>` no painel diria o contrário.
      source: { transform: buttonComoLinkSource },
      description: {
        story: "Link estilizado como botão. Aplique as classes do botão em um <a> real para preservar a semântica de link.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Elemento é um link, não um botão", async () => {
      const link = canvas.getByRole("link", { name: "Ver documentação" });
      await expect(link).toBeInTheDocument();
      await expect(link).toHaveAttribute("href", "#docs");
    });

    await step("O link entra na ordem de tabulação", async () => {
      // O <a> com aparência de botão precisa ser ALCANÇÁVEL por teclado, e
      // isso nenhuma das cinco stacks verificava: as asserções paravam em
      // papel e destino. Um tabindex negativo herdado, ou a perda do
      // atributo de destino, deixariam papel e destino intactos e a ação
      // inalcançável por teclado.
      const link = canvas.getByRole("link", { name: "Ver documentação" });
      (canvasElement.ownerDocument.activeElement as HTMLElement | null)?.blur();
      await userEvent.tab();
      await expect(link).toHaveFocus();
    });
  },
};

