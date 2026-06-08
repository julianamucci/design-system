import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { userEvent, within, expect } from "storybook/test";
import {
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Bold, Italic, Underline,
  LayoutGrid, List,
} from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "./toggle-group";

const meta = {
  title: "UI/ToggleGroup/Composicoes",
  tags: ["form"],
  component: ToggleGroup,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Composicoes reais do ToggleGroup: barra de alinhamento (single), barra de formatação (multiple), seletor vertical e versão outline/segmented.",
      },
    },
  },
} satisfies Meta<typeof ToggleGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AlinhamentoSingle: Story = {
  render: function AlinhamentoSingleRender() {
    const [alignment, setAlignment] = useState<string[]>(["left"]);
    return (
      <div className="flex flex-col items-start gap-3 w-72">
        <ToggleGroup
          value={alignment}
          onValueChange={(v: string[]) => v.length && setAlignment([v[v.length - 1]])}
          aria-label="Alinhamento do texto"
        >
          <ToggleGroupItem value="left" aria-label="Alinhar à esquerda">
            <AlignLeft aria-hidden="true" />
          </ToggleGroupItem>
          <ToggleGroupItem value="center" aria-label="Centralizar">
            <AlignCenter aria-hidden="true" />
          </ToggleGroupItem>
          <ToggleGroupItem value="right" aria-label="Alinhar à direita">
            <AlignRight aria-hidden="true" />
          </ToggleGroupItem>
          <ToggleGroupItem value="justify" aria-label="Justificar">
            <AlignJustify aria-hidden="true" />
          </ToggleGroupItem>
        </ToggleGroup>
        <p className="text-xs text-muted-foreground">
          Atual: <code className="font-mono">{alignment[0]}</code>
        </p>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Barra de alinhamento com seleção única controlada — type='single' garante que apenas um item esteja ativo por vez.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const left = canvas.getByRole("button", { name: "Alinhar à esquerda" });
    const center = canvas.getByRole("button", { name: "Centralizar" });

    await step("Inicia com 'left' ativo", async () => {
      await expect(left).toHaveAttribute("aria-pressed", "true");
    });

    await step("Clicar em 'center' troca seleção (single = exclusivo)", async () => {
      await userEvent.click(center);
      await expect(center).toHaveAttribute("aria-pressed", "true");
      await expect(left).toHaveAttribute("aria-pressed", "false");
    });
  },
};

export const FormatacaoMultiple: Story = {
  render: function FormatacaoMultipleRender() {
    const [formats, setFormats] = useState<string[]>(["bold"]);
    return (
      <div className="flex flex-col items-start gap-3 w-72">
        <ToggleGroup
          value={formats}
          onValueChange={(v: string[]) => setFormats(v)}
          aria-label="Formatação"
        >
          <ToggleGroupItem value="bold" aria-label="Negrito">
            <Bold aria-hidden="true" />
          </ToggleGroupItem>
          <ToggleGroupItem value="italic" aria-label="Itálico">
            <Italic aria-hidden="true" />
          </ToggleGroupItem>
          <ToggleGroupItem value="underline" aria-label="Sublinhado">
            <Underline aria-hidden="true" />
          </ToggleGroupItem>
        </ToggleGroup>
        <p className="text-xs text-muted-foreground">
          Ativos: <code className="font-mono">[{formats.join(", ")}]</code>
        </p>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Barra de formatação Bold/Italic/Underline com seleção múltipla — type='multiple' permite combinar items independentemente.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const bold = canvas.getByRole("button", { name: "Negrito" });
    const italic = canvas.getByRole("button", { name: "Itálico" });

    await step("Inicia com 'bold' ativo", async () => {
      await expect(bold).toHaveAttribute("aria-pressed", "true");
    });

    await step("Adiciona italic mantendo bold (multiple)", async () => {
      await userEvent.click(italic);
      await expect(bold).toHaveAttribute("aria-pressed", "true");
      await expect(italic).toHaveAttribute("aria-pressed", "true");
    });
  },
};

export const Vertical: Story = {
  render: () => (
    <ToggleGroup
      orientation="vertical"
      defaultValue={["grid"]}
      aria-label="Modo de visualização"
    >
      <ToggleGroupItem value="grid" aria-label="Grade">
        <LayoutGrid aria-hidden="true" />
      </ToggleGroupItem>
      <ToggleGroupItem value="list" aria-label="Lista">
        <List aria-hidden="true" />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Seletor de modo de visualização (Grid/Lista) em orientação vertical — ideal para painéis laterais.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const grid = canvas.getByRole("button", { name: "Grade" });
    const list = canvas.getByRole("button", { name: "Lista" });

    await step("ArrowDown navega para o próximo item (vertical)", async () => {
      grid.focus();
      await userEvent.keyboard("{ArrowDown}");
      await expect(list).toHaveFocus();
    });
  },
};

export const OutlineSpaced: Story = {
  render: () => (
    <ToggleGroup
      variant="outline"
      spacing={1}
      defaultValue={["center"]}
      aria-label="Alinhamento do texto"
    >
      <ToggleGroupItem value="left" aria-label="Alinhar à esquerda">
        <AlignLeft aria-hidden="true" />
      </ToggleGroupItem>
      <ToggleGroupItem value="center" aria-label="Centralizar">
        <AlignCenter aria-hidden="true" />
      </ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Alinhar à direita">
        <AlignRight aria-hidden="true" />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Variant outline + spacing=1 — botões separados com borda visível em cada um. Contraste com o estilo segmented padrão (spacing=0).",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step("Grupo tem data-variant=outline e data-spacing=1", async () => {
      const group = canvasElement.querySelector('[data-slot="toggle-group"]') as HTMLElement;
      await expect(group).toHaveAttribute("data-variant", "outline");
      await expect(group).toHaveAttribute("data-spacing", "1");
    });
  },
};
