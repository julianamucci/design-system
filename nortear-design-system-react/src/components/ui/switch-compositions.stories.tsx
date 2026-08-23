import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { waitFor, within, expect } from "storybook/test";
import { Switch } from "./switch";
import { definir } from "./switch.fixtures";
import { Label } from "./label";
import {
  switchControlledSource,
  switchListCompactaSource,
  switchPanelSource,
  switchPreferenciasSource,
  switchSource,
} from "./switch.source";

const meta = {
  title: "UI/Switch/Compositions",
  tags: ["form"],
  component: Switch,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: switchSource },
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
      <Label htmlFor="comp-label">Receber notificações</Label>
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
    const label = canvas.getByText("Receber notificações");

    await step("O rótulo nomeia o controle", async () => {
      await expect(canvas.getByRole("switch", { name: /Receber notificações/i }))
        .toBe(switchEl);
    });

    await step("Clicar no rótulo liga e desliga o controle", async () => {
      // O par (liga e depois desliga) garante DOIS cliques reais em qualquer
      // rodada e devolve a story ao estado que o Chromatic fotografa.
      await definir(switchEl, true, label);
      await definir(switchEl, false, label);
    });
  },
};

export const SettingsPanel: Story = {
  render: () => (
    <div
      className="nds-cluster nds-w-md nds-rounded-lg nds-border-default nds-p-4"
      data-align="center"
      data-justify="between"
    >
      <div className="nds-stack" data-spacing="xs">
        <Label htmlFor="comp-marketing">Emails de marketing</Label>
        <p className="nds-text-body">Receba novidades e promoções da plataforma.</p>
      </div>
      <Switch id="comp-marketing" defaultChecked />
    </div>
  ),
  parameters: {
    docs: {
      // Painel inteiro no render, com o controle já ligado.
      source: { transform: switchPanelSource },
      description: {
        story:
          "Painel com Label + descrição auxiliar à esquerda e Switch à direita.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("O controle nasce ligado neste painel", async () => {
      await expect(canvas.getByRole("switch")).toHaveAttribute("aria-checked", "true");
    });

    await step("Rótulo e descrição auxiliar estão visíveis", async () => {
      await expect(canvas.getByText("Emails de marketing")).toBeVisible();
      await expect(
        canvas.getByText("Receba novidades e promoções da plataforma."),
      ).toBeVisible();
    });
  },
};

export const PreferenceList: Story = {
  render: () => (
    <fieldset className="nds-border-none nds-p-0 nds-m-0 nds-w-sm">
      <legend className="nds-text-body nds-font-semibold nds-mb-2">Notificações</legend>
      <div className="nds-stack" data-spacing="sm">
        {[
          { id: "pref-email", label: "Receber emails", desc: "Resumos diários por email." },
          { id: "pref-push", label: "Notificações push", desc: "Alertas no navegador em tempo real." },
          { id: "pref-sms", label: "SMS de segurança", desc: "Códigos de verificação por SMS." },
        ].map(({ id, label, desc }) => (
          <div key={id} className="nds-cluster" data-align="center" data-justify="between">
            <div className="nds-stack nds-pr-4" data-spacing="xs">
              <Label htmlFor={id}>{label}</Label>
              <p className="nds-text-caption nds-text-muted-foreground">{desc}</p>
            </div>
            <Switch id={id} />
          </div>
        ))}
      </div>
    </fieldset>
  ),
  parameters: {
    docs: {
      // O `fieldset` + `legend` é composição do render, não do componente.
      source: { transform: switchPreferenciasSource },
      description: {
        story:
          "Grupo de switches em fieldset + legend para agrupar preferências relacionadas (WCAG 1.3.1).",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("O fieldset contém três controles independentes", async () => {
      const switches = canvas.getAllByRole("switch");
      await expect(switches).toHaveLength(3);
      for (const sw of switches) await expect(sw).toHaveAttribute("aria-checked", "false");
    });

    await step("A legend agrupa e está visível", async () => {
      await expect(canvas.getByText("Notificações")).toBeVisible();
    });
  },
};

export const Controlled: Story = {
  render: function ControlledRender() {
    const [enabled, setEnabled] = useState(false);
    return (
      <div className="nds-stack nds-w-sm" data-align="start" data-spacing="sm">
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
      // O estado externo vive num `useState` do render.
      source: { transform: switchControlledSource },
      description: {
        story:
          "Switch controlado — o componente pai mantém o estado e o atualiza pelo callback de mudança.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const switchEl = canvas.getByRole("switch");

    await step("O estado externo acompanha o controle ao ligar", async () => {
      await definir(switchEl, true);
      await waitFor(() => expect(canvas.getByText("true")).toBeVisible());
    });

    await step("E acompanha também ao desligar", async () => {
      // A volta é o que prova que o estado externo é a FONTE, e não um valor
      // escrito uma vez: um `checked` ignorado passaria só na ida.
      await definir(switchEl, false);
      await waitFor(() => expect(canvas.getByText("false")).toBeVisible());
    });
  },
};

export const CompactSize: Story = {
  render: () => (
    <div className="nds-stack nds-w-xs" data-spacing="sm">
      {[
        { id: "sm-wifi", label: "Wi-Fi" },
        { id: "sm-bluetooth", label: "Bluetooth" },
        { id: "sm-airplane", label: "Modo avião" },
      ].map(({ id, label }) => (
        <div key={id} className="nds-cluster" data-align="center" data-justify="between">
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
      // Lista e `size="sm"` são afirmados no render, sem control.
      source: { transform: switchListCompactaSource },
      description: {
        story:
          "Lista densa de toggles no degrau compacto — adequado para barras de configurações e menus.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Todos os controles estão no degrau compacto", async () => {
      const switches = canvas.getAllByRole("switch");
      await expect(switches).toHaveLength(3);
      for (const sw of switches) await expect(sw).toHaveAttribute("data-size", "sm");
    });
  },
};
