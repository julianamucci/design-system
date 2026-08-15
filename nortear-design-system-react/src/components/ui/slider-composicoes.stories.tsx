import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { userEvent, within, expect } from "storybook/test";
import { Slider } from "./slider";
import { Label } from "./label";
import { Button } from "./button";
import { Input } from "./input";
import { valorDaAlca } from "@shared/testing/slider-probe";

const meta = {
  title: "UI/Slider/Compositions",
  tags: ["form"],
  component: Slider,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Composicoes do Slider: com Label e valor textual (aria-live), faixa de preço, step customizado e múltiplos sliders em formulário.",
      },
    },
    controls: { disable: true },
    actions: { disable: true },
  },
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithLabelAndValue: Story = {
  render: function ComLabelEValorRender() {
    const [value, setValue] = useState<number[]>([75]);
    return (
      <div className="nds-stack nds-w-sm" data-spacing="sm">
        <div className="nds-cluster" data-justify="between">
          <Label htmlFor="volume-slider">Volume</Label>
          <span
            aria-live="polite"
            className="nds-text-body nds-tabular-nums"
          >
            {value[0]}%
          </span>
        </div>
        <Slider
          id="volume-slider"
          value={value}
          onValueChange={(v) => setValue(v as number[])}
          min={0}
          max={100}
          aria-label="Volume"
        />
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Label visível e thumb presente", async () => {
      await expect(canvas.getByText("Volume")).toBeVisible();
      await expect(canvas.getByRole("slider")).toBeInTheDocument();
    });
    await step("O texto do valor acompanha a alça", async () => {
      const live = canvasElement.querySelector<HTMLElement>('[aria-live="polite"]')!;
      const antes = valorDaAlca(canvas.getByRole("slider"));
      canvas.getByRole("slider").focus();
      await userEvent.keyboard("{ArrowRight}");
      const depois = Math.min(100, antes + 1);
      await expect(live).toHaveTextContent(`${depois}%`);
    });
  },
};

export const PriceRange: Story = {
  render: function FaixaDePrecoRender() {
    const [value, setValue] = useState<number[]>([100, 400]);
    return (
      <div className="nds-stack nds-w-sm" data-spacing="sm">
        <div className="nds-cluster" data-justify="between">
          <Label>Faixa de preço</Label>
          <span
            aria-live="polite"
            className="nds-text-body nds-tabular-nums"
          >
            R$ {value[0]} — R$ {value[1]}
          </span>
        </div>
        <Slider
          value={value}
          onValueChange={(v) => setValue(v as number[])}
          min={0}
          max={500}
          step={10}
          aria-label="Faixa de preço"
        />
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Dois thumbs presentes", async () => {
      const thumbs = canvas.getAllByRole("slider");
      await expect(thumbs).toHaveLength(2);
    });
    await step("Valor textual no formato min — max", async () => {
      await expect(canvas.getByText(/R\$ 100 — R\$ 400/)).toBeVisible();
    });
  },
};

export const CustomStep: Story = {
  render: function StepCustomizadoRender() {
    const [value, setValue] = useState<number[]>([50]);
    return (
      <div className="nds-stack nds-w-sm" data-spacing="sm">
        <div className="nds-cluster" data-justify="between">
          <Label>Nível (step=10)</Label>
          <span aria-live="polite" className="nds-text-body nds-tabular-nums">
            {value[0]}
          </span>
        </div>
        <Slider
          value={value}
          onValueChange={(v) => setValue(v as number[])}
          min={0}
          max={100}
          step={10}
          aria-label="Nível"
        />
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("A seta anda um passo inteiro, não uma unidade", async () => {
      const antes = valorDaAlca(canvas.getByRole("slider"));
      canvas.getByRole("slider").focus();
      await userEvent.keyboard("{ArrowRight}");
      await expect(valorDaAlca(canvas.getByRole("slider"))).toBe(Math.min(100, antes + 10));
    });
  },
};

export const InForm: Story = {
  render: function EmFormularioRender() {
    const [volume, setVolume] = useState<number[]>([60]);
    const [brilho, setBrilho] = useState<number[]>([80]);
    const [salvo, setSalvo] = useState<string>("");
    return (
      <form
        aria-label="Configurações de áudio"
        className="nds-stack nds-w-sm"
        data-spacing="md"
        onSubmit={(e) => {
          e.preventDefault();
          setSalvo(`Volume ${volume[0]}% · Brilho ${brilho[0]}%`);
        }}
      >
        <div className="nds-stack" data-spacing="sm">
          <Label htmlFor="form-preset">Nome do preset</Label>
          <Input id="form-preset" placeholder="Meu preset" />
        </div>
        <div className="nds-stack" data-spacing="sm">
          <div className="nds-cluster" data-justify="between">
            <Label htmlFor="form-volume">Volume</Label>
            <span aria-live="polite" className="nds-text-body nds-tabular-nums">
              {volume[0]}%
            </span>
          </div>
          <Slider
            id="form-volume"
            value={volume}
            onValueChange={(v) => setVolume(v as number[])}
            min={0}
            max={100}
            aria-label="Volume"
          />
        </div>
        <div className="nds-stack" data-spacing="sm">
          <div className="nds-cluster" data-justify="between">
            <Label htmlFor="form-brilho">Brilho</Label>
            <span aria-live="polite" className="nds-text-body nds-tabular-nums">
              {brilho[0]}%
            </span>
          </div>
          <Slider
            id="form-brilho"
            value={brilho}
            onValueChange={(v) => setBrilho(v as number[])}
            min={0}
            max={100}
            aria-label="Brilho"
          />
        </div>
        <Button type="submit" size="sm" style={{ alignSelf: "flex-start" }}>
          Salvar preset
        </Button>
        <p className="nds-text-caption nds-text-muted-foreground" aria-live="polite">
          {salvo}
        </p>
      </form>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Formulário tem campo de texto e dois sliders", async () => {
      await expect(canvas.getByLabelText(/Nome do preset/)).toBeInTheDocument();
      await expect(canvas.getAllByRole("slider")).toHaveLength(2);
    });

    await step("Cada slider tem nome acessível próprio", async () => {
      const thumbs = canvas.getAllByRole("slider");
      await expect(thumbs[0]).toHaveAttribute("aria-label", "Volume");
      await expect(thumbs[1]).toHaveAttribute("aria-label", "Brilho");
    });

    await step("Submeter guarda o valor corrente dos dois", async () => {
      const thumbs = canvas.getAllByRole("slider");
      const volume = valorDaAlca(thumbs[0]);
      const brilho = valorDaAlca(thumbs[1]);
      await userEvent.click(canvas.getByRole("button", { name: "Salvar preset" }));
      await expect(
        canvas.getByText(`Volume ${volume}% · Brilho ${brilho}%`),
      ).toBeVisible();
    });
  },
};
