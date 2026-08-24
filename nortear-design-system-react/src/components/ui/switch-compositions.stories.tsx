import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { within, expect } from "storybook/test";
import { Switch } from "./switch";
import { definir } from "./switch.fixtures";
import { Button } from "./button";
import { Label } from "./label";
import {
  switchControlledSource,
  switchFormSource,
  switchPreferenciasSource,
  switchSemRotuloSource,
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
          "Composições do Switch: rótulo associado, nome sem rótulo visível, lista de configurações, formulário e estado controlado.",
      },
    },
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Mesmas três preferências que a docs page e o snippet mostram. */
const PREFERENCIAS = [
  {
    id: 'pref-email',
    label: 'Receber novidades por email',
    desc: 'Resumo semanal sobre o produto.',
    checked: true
  },
  {
    id: 'pref-push',
    label: 'Receber notificações push',
    desc: 'Alertas no dispositivo em tempo real.',
    checked: false
  },
  {
    id: 'pref-sms',
    label: 'Alertas por SMS',
    desc: 'Eventos críticos via mensagem de texto.',
    checked: false
  }
] as const;

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

export const WithoutLabel: Story = {
  render: () => (
    <Switch id="comp-no-label" aria-label="Ativar modo escuro" />
  ),
  parameters: {
    docs: {
      source: { transform: switchSemRotuloSource },
      description: {
        story:
          "Sem rótulo visível, o nome acessível vive em aria-label. Use apenas quando o contexto ao redor já nomeia a função.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("O controle continua tendo nome, ainda que invisível", async () => {
      // Sem esta medida, um switch sem nome nenhum passaria: ele renderiza,
      // responde ao clique, e o leitor de tela anuncia só "botão".
      await expect(canvas.getByRole("switch", { name: "Ativar modo escuro" })).toBeVisible();
    });

    await step("Nenhum texto do nome aparece na tela", async () => {
      // É o que separa esta composição da anterior: se o texto estivesse
      // visível, o exemplo seria WithLabel com um aria-label redundante.
      await expect(canvas.queryByText("Ativar modo escuro")).toBeNull();
    });
  },
};

export const SettingsList: Story = {
  render: () => (
    // É `fieldset` + `legend`, e não `div` + `<p>`, porque os três interruptores
    // são UM grupo: só o fieldset amarra os controles ao título, e é assim que o
    // leitor de tela anuncia "Preferências de notificação" ao entrar em cada um
    // (WCAG 1.3.1). Com `<p>` o título é texto solto e os três ficam órfãos.
    // O `nds-stack` mora no div INTERNO: fieldset com display flex/grid tem
    // histórico de bug de layout em navegador.
    <fieldset className="nds-border-none nds-p-0 nds-m-0 nds-w-md">
      <legend className="nds-text-body nds-font-semibold nds-mb-2">
        Preferências de notificação
      </legend>
      <div className="nds-stack" data-spacing="sm">
        {PREFERENCIAS.map(({ id, label, desc, checked }) => (
          <div
            key={id}
            className="nds-cluster nds-rounded-lg nds-border-default nds-p-4"
            data-align="center"
            data-justify="between"
          >
            <div className="nds-stack nds-pr-4" data-spacing="xs">
              <Label htmlFor={id}>{label}</Label>
              <p className="nds-text-body">{desc}</p>
            </div>
            <Switch id={id} defaultChecked={checked} />
          </div>
        ))}
      </div>
    </fieldset>
  ),
  parameters: {
    docs: {
      // Os três painéis são composição do render; o do meta imprimiria só o par.
      source: { transform: switchPreferenciasSource },
      description: {
        story:
          "Lista de configurações com vários Switches em painéis empilhados. Padrão para tela de preferências do usuário.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("A lista tem três controles, cada um no seu estado de partida", async () => {
      const switches = canvas.getAllByRole("switch");
      await expect(switches).toHaveLength(3);
      await expect(switches[0]).toHaveAttribute("aria-checked", "true");
      await expect(switches[1]).toHaveAttribute("aria-checked", "false");
      await expect(switches[2]).toHaveAttribute("aria-checked", "false");
    });

    await step("Cada linha nomeia o próprio controle", async () => {
      // Três interruptores com o mesmo nome seriam indistinguíveis para quem
      // navega por lista de controles.
      for (const { label } of PREFERENCIAS) {
        await expect(canvas.getByRole("switch", { name: label })).toBeVisible();
      }
    });

    await step("A descrição fica fora do nome do controle", async () => {
      // Se ela entrasse no rótulo, o leitor de tela anunciaria a frase inteira
      // a cada passagem pelo interruptor.
      await expect(
        canvas.getByRole("switch", { name: "Receber novidades por email" }),
      ).not.toHaveAccessibleName(/Resumo semanal/);
    });
  },
};

export const InForm: Story = {
  render: () => (
    <form
      className="nds-stack nds-w-sm"
      data-spacing="sm"
      onSubmit={(evento) => evento.preventDefault()}
    >
      <div className="nds-cluster" data-spacing="sm">
        <Switch id="comp-newsletter" name="newsletter" defaultChecked />
        <Label htmlFor="comp-newsletter">Aceitar newsletter semanal</Label>
      </div>
      <Button type="submit">Salvar preferências</Button>
    </form>
  ),
  parameters: {
    docs: {
      source: { transform: switchFormSource },
      description: {
        story:
          "Switch dentro de um form, participando do envio pelo nome do campo. O valor acompanha o estado do controle.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const switchEl = canvas.getByRole("switch");
    const form = canvasElement.querySelector("form")!;

    await step("O formulário reúne o controle e o envio", async () => {
      await expect(canvas.getByRole("button", { name: "Salvar preferências" })).toBeVisible();
    });

    await step("O campo entra no envio e acompanha o controle nos dois sentidos", async () => {
      // Só a ida provaria pouco: um valor escrito uma vez passaria igual. É a
      // volta que mostra que o envio reflete o estado a cada mudança — e o par
      // devolve a story ao estado inicial, que é o que o Chromatic fotografa.
      await expect(new FormData(form).get("newsletter")).not.toBeNull();
      await definir(switchEl, false);
      await expect(new FormData(form).get("newsletter")).toBeNull();
      await definir(switchEl, true);
      await expect(new FormData(form).get("newsletter")).not.toBeNull();
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
          <Label htmlFor="comp-controlled">Receber notificações</Label>
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

    await step("O estado externo acompanha o controle", async () => {
      // Passar só `checked` sem o callback deixaria o interruptor inerte: ele
      // deixa de ser dono do próprio estado e ninguém assume o lugar. É esse
      // defeito que o texto refletido na tela denuncia.
      await definir(switchEl, true);
      await expect(canvas.getByText("true")).toBeVisible();
      await definir(switchEl, false);
      await expect(canvas.getByText("false")).toBeVisible();
    });
  },
};
