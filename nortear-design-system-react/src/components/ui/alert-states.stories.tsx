import { figmaDesign } from "@shared/figma/design-links";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect } from "storybook/test";
import { Info } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "./alert";
import {
  alertInsercaoDinamicaSource,
  alertNoAnnouncementSource,
  alertNoIconSource,
  alertNoTitleSource,
  alertSource,
} from "./alert.source";

const meta = {
  parameters: {
    design: figmaDesign("alert"),
    docs: { source: { transform: alertSource } },
  },
  title: "Primitives/Feedback/Alert/States",
  tags: ["feedback"],
  component: Alert,
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Complete: Story = {
  render: () => (
    <Alert>
      <Info aria-hidden="true" className="nds-icon" />
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

export const WithoutTitle: Story = {
  // A ausência do título é o assunto; o snippet do meta o traria de volta.
  parameters: { docs: { source: { transform: alertNoTitleSource } } },
  render: () => (
    <Alert>
      <Info aria-hidden="true" className="nds-icon" />
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

export const WithoutIcon: Story = {
  // Idem para o ícone: o layout de coluna única vem da ausência, não de prop.
  parameters: { docs: { source: { transform: alertNoIconSource } } },
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

export const WithoutAnnouncement: Story = {
  parameters: {
    covers: ["functional.item4", "visual.item3"],
    controls: { disable: true },
    // O par note × padrão é o assunto: um alerta só não mostra a diferença.
    docs: { source: { transform: alertNoAnnouncementSource } },
  },
  render: () => (
    <div className="nds-stack" data-spacing="sm">
      {/* Estático: não deve virar live region. */}
      <Alert role="note">
        <Info aria-hidden="true" className="nds-icon" />
        <AlertTitle>Nota de implementação</AlertTitle>
        <AlertDescription>
          Conteúdo já presente no carregamento — o leitor de tela não é interrompido.
        </AlertDescription>
      </Alert>
      {/* Sem a prop, o default segue sendo a live region assertiva. */}
      <Alert>
        <Info aria-hidden="true" className="nds-icon" />
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

export const DynamicInsertion: Story = {
  parameters: {
    covers: ["functional.item6"],
    // Quem muda o comportamento é o contêiner aria-live, fora do alcance dos args.
    docs: { source: { transform: alertInsercaoDinamicaSource } },
  },
  render: () => (
    <div aria-live="polite">
      <Alert>
        <Info aria-hidden="true" className="nds-icon" />
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
