import type { Meta, StoryObj } from "@storybook/react-vite";
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
      <Info aria-hidden="true" className="" style={{ height: "1rem", width: "1rem" }} />
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
      <Info aria-hidden="true" className="" style={{ height: "1rem", width: "1rem" }} />
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

export const SemAnuncio: Story = {
  parameters: {
    covers: ["functional.item4", "visual.item3"], controls: { disable: true } },
  render: () => (
    <div className="nds-stack" data-spacing="sm">
      {/* Estático: não deve virar live region. */}
      <Alert role="note">
        <Info aria-hidden="true" className="" style={{ height: "1rem", width: "1rem" }} />
        <AlertTitle>Nota de implementação</AlertTitle>
        <AlertDescription>
          Conteúdo já presente no carregamento — o leitor de tela não é interrompido.
        </AlertDescription>
      </Alert>
      {/* Sem a prop, o default segue sendo a live region assertiva. */}
      <Alert>
        <Info aria-hidden="true" className="" style={{ height: "1rem", width: "1rem" }} />
        <AlertTitle>Sessão expirada</AlertTitle>
        <AlertDescription>
          Mensagem urgente que surge em tempo de execução.
        </AlertDescription>
      </Alert>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("role=note não é live region", async () => {
      const nota = canvas.getByText("Nota de implementação").closest('[data-slot="alert"]');
      await expect(nota).toHaveAttribute("role", "note");
    });

    await step("Default continua role=alert", async () => {
      const padrao = canvas.getByRole("alert");
      await expect(padrao).toHaveAttribute("role", "alert");
      await expect(padrao).toHaveTextContent("Sessão expirada");
    });
  },
};

export const InsercaoDinamica: Story = {
  parameters: { covers: ["functional.item6"] },
  render: () => (
    <div aria-live="polite">
      <Alert>
        <Info aria-hidden="true" className="" style={{ height: "1rem", width: "1rem" }} />
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
