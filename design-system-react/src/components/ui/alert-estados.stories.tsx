import type { Meta, StoryObj } from "@storybook/react";
import { within, expect } from "storybook/test";
import { Info } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "./alert";

const meta = {
  title: "UI/Alert/Estados",
  tags: ["feedback"],
  component: Alert,
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Completo: Story = {
  render: () => (
    <Alert>
      <Info aria-hidden="true" className="h-4 w-4" />
      <AlertTitle>Atenção</AlertTitle>
      <AlertDescription>
        Suas alterações serão aplicadas na próxima sessão.
      </AlertDescription>
    </Alert>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Role alert presente", async () => {
      await expect(canvas.getByRole("alert")).toBeInTheDocument();
    });

    await step("AlertTitle e AlertDescription visíveis", async () => {
      await expect(canvas.getByText("Atenção")).toBeVisible();
      await expect(canvas.getByText(/próxima sessão/)).toBeVisible();
    });
  },
};

export const SemTitulo: Story = {
  render: () => (
    <Alert>
      <Info aria-hidden="true" className="h-4 w-4" />
      <AlertDescription>
        Suas alterações serão aplicadas na próxima sessão.
      </AlertDescription>
    </Alert>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Alert visível sem título", async () => {
      await expect(canvas.getByRole("alert")).toBeVisible();
    });

    await step("Sem elemento de título no DOM", async () => {
      const alert = canvas.getByRole("alert");
      const h5 = alert.querySelector("h5");
      await expect(h5).toBeNull();
    });
  },
};

export const SemIcone: Story = {
  render: () => (
    <Alert>
      <AlertTitle>Atenção</AlertTitle>
      <AlertDescription>
        Suas alterações serão aplicadas na próxima sessão.
      </AlertDescription>
    </Alert>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Alert visível sem ícone", async () => {
      await expect(canvas.getByRole("alert")).toBeVisible();
    });

    await step("Sem SVG filho direto no alert", async () => {
      const alert = canvas.getByRole("alert");
      const svg = alert.querySelector(":scope > svg");
      await expect(svg).toBeNull();
    });
  },
};

export const InsercaoDinamica: Story = {
  render: () => (
    <div aria-live="polite">
      <Alert>
        <Info aria-hidden="true" className="h-4 w-4" />
        <AlertTitle>Operação concluída</AlertTitle>
        <AlertDescription>
          O relatório foi gerado com sucesso.
        </AlertDescription>
      </Alert>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Alert dentro de região aria-live", async () => {
      const liveRegion = canvasElement.querySelector('[aria-live="polite"]');
      await expect(liveRegion).toBeInTheDocument();
    });

    await step("Role alert presente na região live", async () => {
      await expect(canvas.getByRole("alert")).toBeVisible();
    });
  },
};
