import type { Meta, StoryObj } from "@storybook/react";
import { useEffect, useState } from "react";
import { within, expect } from "storybook/test";
import {
  Progress,
  ProgressLabel,
  ProgressTrack,
  ProgressIndicator,
  ProgressValue,
} from "./progress";

const meta = {
  title: "UI/Progress/Composicoes",
  tags: ["feedback"],
  component: Progress,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Composicoes do Progress: múltiplas barras lado a lado, cor customizada via [&>div]:bg-*, com label/value, e com texto aria-live para anunciar progresso.",
      },
    },
    controls: { disable: true },
  },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof Progress>;

export const MultiplosNiveis: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <Progress value={0} aria-label="Etapa 1" />
      <Progress value={50} aria-label="Etapa 2" />
      <Progress value={100} aria-label="Etapa 3" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("3 progressbars no DOM", async () => {
      const bars = canvas.getAllByRole("progressbar");
      await expect(bars).toHaveLength(3);
    });
  },
};

export const CorCustomizada: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <Progress
        value={75}
        aria-label="Progresso de sucesso"
        className="[&>div]:bg-success"
      />
      <Progress
        value={40}
        aria-label="Progresso em atenção"
        className="[&>div]:bg-warning"
      />
      <Progress
        value={25}
        aria-label="Progresso crítico"
        className="[&>div]:bg-destructive"
      />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("3 progressbars com cores customizadas", async () => {
      const bars = canvas.getAllByRole("progressbar");
      await expect(bars).toHaveLength(3);
    });
  },
};

export const ComLabelEValor: Story = {
  render: function ComLabelEValorRender() {
    const [value, setValue] = useState<number>(0);

    useEffect(() => {
      const id = setInterval(() => {
        setValue((v) => (v >= 100 ? 0 : v + 5));
      }, 350);
      return () => clearInterval(id);
    }, []);

    return (
      <div className="w-80">
        <Progress value={value} aria-label="Enviando arquivo">
          <ProgressLabel>Enviando arquivo</ProgressLabel>
          <ProgressValue />
          <ProgressTrack>
            <ProgressIndicator />
          </ProgressTrack>
        </Progress>
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Label e progressbar visíveis", async () => {
      await expect(canvas.getByText("Enviando arquivo")).toBeVisible();
      await expect(canvas.getByRole("progressbar")).toBeInTheDocument();
    });
  },
};

export const ComAriaLive: Story = {
  render: function ComAriaLiveRender() {
    const [value, setValue] = useState<number>(0);

    useEffect(() => {
      const id = setInterval(() => {
        setValue((v) => (v >= 100 ? 0 : v + 10));
      }, 600);
      return () => clearInterval(id);
    }, []);

    return (
      <div className="w-80 space-y-2">
        <p
          className="text-sm text-muted-foreground"
          aria-live="polite"
        >
          {value}% concluído
        </p>
        <Progress value={value} aria-label="Progresso do upload" />
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Texto aria-live presente", async () => {
      const liveRegion = canvasElement.querySelector('[aria-live="polite"]');
      await expect(liveRegion).toBeInTheDocument();
    });

    await step("Progressbar presente", async () => {
      await expect(canvas.getByRole("progressbar")).toBeInTheDocument();
    });
  },
};
