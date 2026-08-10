import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { userEvent, within, expect } from "storybook/test";
import { Switch } from "./switch";
import { Label } from "./label";

const meta = {
  title: "UI/Switch/Compositions",
  tags: ["form"],
  component: Switch,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Composicoes reais do Switch: Label associado, painel de configurações, lista de preferências e controle controlado.",
      },
    },
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithLabel: Story = {
  render: () => (
    <div className="nds-cluster" data-spacing="sm">
      <Switch id="comp-label" />
      <Label htmlFor="comp-label">Receber notificações por email</Label>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Par obrigatório Switch + Label. A associação via htmlFor/id permite que o clique no Label alterne o switch.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const switchEl = canvas.getByRole("switch");

    await step("Clique no Label alterna o switch", async () => {
      const label = canvas.getByText("Receber notificações por email");
      await userEvent.click(label);
      await expect(switchEl).toHaveAttribute("aria-checked", "true");
    });
  },
};

export const SettingsPanel: Story = {
  render: () => (
    <div className="nds-cluster nds-rounded-lg nds-border-default nds-p-4" data-align="center" data-justify="between" style={{ width: "24rem" }}>
      <div className="" data-spacing="xs">
        <Label htmlFor="comp-marketing">Emails de marketing</Label>
        <p className="nds-text-body">
          Receba novidades e promoções da plataforma.
        </p>
      </div>
      <Switch id="comp-marketing" defaultChecked />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Painel com Label + descrição auxiliar à esquerda e Switch à direita. Layout flex justify-between em card.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Switch, Label e descrição estão visíveis", async () => {
      await expect(canvas.getByRole("switch")).toHaveAttribute("aria-checked", "true");
      await expect(canvas.getByText("Emails de marketing")).toBeVisible();
      await expect(
        canvas.getByText("Receba novidades e promoções da plataforma."),
      ).toBeVisible();
    });
  },
};

export const PreferenceList: Story = {
  render: () => (
    <fieldset className="border-none nds-p-0 m-0" data-spacing="md" style={{ width: "20rem" }}>
      <legend className="nds-text-body nds-font-semibold nds-mb-2">Notificações</legend>
      {[
        { id: "pref-email", label: "Receber emails", desc: "Resumos diários por email." },
        { id: "pref-push", label: "Notificações push", desc: "Alertas no navegador em tempo real." },
        { id: "pref-sms", label: "SMS de segurança", desc: "Códigos de verificação por SMS." },
      ].map(({ id, label, desc }) => (
        <div key={id} className="nds-cluster" data-justify="between">
          <div className="" style={{ paddingRight: "1rem" }} data-spacing="xs">
            <Label htmlFor={id}>{label}</Label>
            <p className="nds-text-caption nds-text-muted-foreground">{desc}</p>
          </div>
          <Switch id={id} />
        </div>
      ))}
    </fieldset>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Grupo de switches em fieldset + legend para agrupar preferências relacionadas (WCAG 1.3.1).",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Fieldset contém 3 switches independentes", async () => {
      const switches = canvas.getAllByRole("switch");
      await expect(switches).toHaveLength(3);
    });

    await step("Legend está visível", async () => {
      await expect(canvas.getByText("Notificações")).toBeVisible();
    });
  },
};

export const Controlled: Story = {
  render: function ControladoRender() {
    const [enabled, setEnabled] = useState(false);
    return (
      <div className="nds-stack" data-align="start" data-spacing="sm" style={{ width: "20rem" }}>
        <div className="nds-cluster" data-spacing="sm">
          <Switch id="comp-controlled" checked={enabled} onCheckedChange={setEnabled} />
          <Label htmlFor="comp-controlled">Modo escuro</Label>
        </div>
        <p className="nds-text-caption nds-text-muted-foreground">
          Estado atual: <code className="nds-font-mono">{String(enabled)}</code>
        </p>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Switch controlado via useState — o componente pai mantém o estado e atualiza via onCheckedChange.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const switchEl = canvas.getByRole("switch");

    await step("Estado inicial é false", async () => {
      await expect(switchEl).toHaveAttribute("aria-checked", "false");
      await expect(canvas.getByText("false")).toBeVisible();
    });

    await step("Clique reflete no estado controlado", async () => {
      await userEvent.click(switchEl);
      await expect(switchEl).toHaveAttribute("aria-checked", "true");
      await expect(canvas.getByText("true")).toBeVisible();
    });
  },
};

export const CompactSize: Story = {
  render: () => (
    <div className="nds-stack" data-spacing="sm" style={{ width: "18rem" }}>
      {[
        { id: "sm-wifi", label: "Wi-Fi" },
        { id: "sm-bluetooth", label: "Bluetooth" },
        { id: "sm-airplane", label: "Modo avião" },
      ].map(({ id, label }) => (
        <div key={id} className="nds-cluster" data-justify="between">
          <Label htmlFor={id} className="nds-text-body">
            {label}
          </Label>
          <Switch id={id} size="sm" />
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Lista densa de toggles usando size="sm" — adequado para barras de configurações e menus.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Todos os switches têm size=sm", async () => {
      const switches = canvas.getAllByRole("switch");
      await expect(switches).toHaveLength(3);
      for (const sw of switches) {
        await expect(sw).toHaveAttribute("data-size", "sm");
      }
    });
  },
};
