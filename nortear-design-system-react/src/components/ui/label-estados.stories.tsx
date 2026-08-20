import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect } from "storybook/test";
import {
  contrastePorTema,
  cursorComputado,
  opacidadeComputada,
} from "@shared/testing/label-probe";
import { Label } from "./label";
import { Input } from "./input";
import {
  labelDesabilitadoPorBlocoSource,
  labelDesabilitadoSource,
  labelObrigatorioSource,
  labelSource,
} from "./label.source";

const meta = {
  title: "UI/Label/States",
  tags: ["form"],
  component: Label,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // O arquivo desliga os controls, então a transform do `meta` cai no par
      // canônico — que é exatamente o estado padrão. As stories que mudam a
      // MARCAÇÃO declaram a sua.
      source: { transform: labelSource },
      description: {
        component:
          "Estados do rótulo: padrão, desabilitado pelo controle irmão, desabilitado pelo bloco e obrigatório.",
      },
    },
  },
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    covers: ["accessibility.item1", "accessibility.item4", "visual.item1"],
    docs: {
      description: {
        story:
          "Estado padrão: opacidade cheia, tamanho de controle, peso médio e a cor de primeiro plano do tema.",
      },
    },
  },
  render: () => (
    <div className="nds-stack nds-w-full nds-max-w-xs" data-spacing="xs">
      <Label htmlFor="estado-padrao">Nome completo</Label>
      <Input id="estado-padrao" placeholder="ex: João da Silva" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const label = canvas.getByText("Nome completo");

    await step("O rótulo está em opacidade cheia", async () => {
      // Efeito computado, não nome de classe: a asserção antiga afirmava a
      // AUSÊNCIA de `opacity-50`, uma classe que não existe no CSS do design
      // system — ela passaria mesmo com o rótulo apagado.
      await expect(opacidadeComputada(label)).toBe(1);
    });

    await step("O contraste do texto passa em AA nos dois temas", async () => {
      // O axe do test-runner só vê o tema claro. O escuro é metade do produto e
      // não era medido em lugar nenhum. 4.5 porque o rótulo é texto normal:
      // 14px em peso 500 não alcança o limite de texto grande.
      const { claro, escuro } = contrastePorTema(label);
      await expect(claro).toBeGreaterThanOrEqual(4.5);
      await expect(escuro).toBeGreaterThanOrEqual(4.5);
    });
  },
};

export const Disabled: Story = {
  parameters: {
    covers: ["functional.item2", "visual.item3"],
    docs: {
      // A marca `nds-peer` no controle é o assunto, e o par padrão não a tem.
      source: { transform: labelDesabilitadoSource },
      description: {
        story:
          "Controle irmão desabilitado. A marca `nds-peer` vai no CONTROLE; o rótulo esmaece sozinho e troca o cursor.",
      },
    },
  },
  render: () => (
    <div className="nds-stack nds-w-full nds-max-w-xs" data-spacing="xs">
      <Label htmlFor="estado-disabled">CPF</Label>
      <Input id="estado-disabled" disabled className="nds-peer" placeholder="000.000.000-00" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const label = canvas.getByText("CPF");
    const input = canvasElement.querySelector<HTMLInputElement>("#estado-disabled")!;

    await step("O controle está desabilitado", async () => {
      await expect(input).toBeDisabled();
    });

    await step("O rótulo esmaece junto e mostra o cursor de bloqueio", async () => {
      // Este par ficou anos sem asserção: a story afirmava só que o input
      // estava desabilitado, e o rótulo continuava em opacidade cheia em três
      // das cinco stacks sem ninguém notar.
      await expect(opacidadeComputada(label)).toBeLessThan(1);
      await expect(cursorComputado(label)).toBe("not-allowed");
    });
  },
};

export const DisabledViaGroup: Story = {
  parameters: {
    covers: ["functional.item4"],
    docs: {
      // O `data-disabled` mora no ANCESTRAL: quem copia o par padrão não vê
      // onde o atributo entra.
      source: { transform: labelDesabilitadoPorBlocoSource },
      description: {
        story:
          "Bloco inteiro desabilitado por `data-disabled=\"true\"` no ancestral: todos os rótulos descendentes esmaecem e saem do alcance do ponteiro.",
      },
    },
  },
  render: () => (
    <div
      className="nds-stack nds-w-full nds-max-w-xs"
      data-spacing="xs"
      data-disabled="true"
    >
      <Label htmlFor="estado-grupo-disabled">Documento</Label>
      <Input id="estado-grupo-disabled" disabled placeholder="ex: 000.000.000-00" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const label = canvas.getByText("Documento");

    await step("O rótulo herda o estado do bloco desabilitado", async () => {
      await expect(label.closest("[data-disabled='true']")).toBeInTheDocument();
      await expect(opacidadeComputada(label)).toBeLessThan(1);
      await expect(getComputedStyle(label).pointerEvents).toBe("none");
    });
  },
};

export const Required: Story = {
  parameters: {
    covers: ["functional.item3", "accessibility.item3", "visual.item2"],
    docs: {
      // Obrigatoriedade tem duas metades — asterisco decorativo no rótulo e
      // `aria-required` no controle — e nenhuma delas está no par padrão.
      source: { transform: labelObrigatorioSource },
      description: {
        story:
          "Campo obrigatório: o asterisco é decorativo (`aria-hidden`) e quem informa a obrigatoriedade ao leitor de tela é o `aria-required` do controle.",
      },
    },
  },
  render: () => (
    <div className="nds-stack nds-w-full nds-max-w-xs" data-spacing="xs">
      <Label htmlFor="estado-required">
        Email profissional
        <span className="nds-text-destructive" aria-hidden="true">*</span>
      </Label>
      <Input id="estado-required" type="email" aria-required="true" placeholder="ex: joao@empresa.com" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const marcador = canvasElement.querySelector<HTMLElement>(".nds-text-destructive")!;
    const input = canvas.getByRole("textbox");

    await step("O asterisco é visível e decorativo", async () => {
      await expect(marcador).toBeVisible();
      await expect(marcador).toHaveTextContent("*");
      await expect(marcador).toHaveAttribute("aria-hidden", "true");
    });

    await step("A obrigatoriedade é anunciada pelo controle", async () => {
      // Sem esta parte o marcador seria só pintura: `aria-hidden` esconde o
      // asterisco do leitor, e nada mais diria que o campo é obrigatório.
      await expect(input).toHaveAttribute("aria-required", "true");
    });
  },
};
