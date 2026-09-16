import { figmaDesign } from "@shared/figma/design-links";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect, userEvent, waitFor } from "storybook/test";
import { Info } from "lucide-react";
import { Alert, AlertAction, AlertTitle, AlertDescription } from "./alert";
import {
  alertAdditionalClassSource,
  alertCompositionNoIconSource,
  alertSource,
  alertWithActionAndDismissSource,
  alertWithActionSource,
  alertWithIconSource,
} from "./alert.source";
import { Button } from "./button";
import { measureActionDismiss } from "@shared/testing/alert-probe";

const meta = {
  title: "Components/Feedback/Alert/Compositions",
  tags: ["feedback"],
  component: Alert,
  parameters: {
    design: figmaDesign("alert"),
    controls: { disable: true },
    actions: { disable: true },
    docs: { source: { transform: alertSource } },
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithIcon: Story = {
  parameters: {
    covers: ["functional.item3", "accessibility.item2"],
    // O snippet do meta diz "Atenção"; o painel mostra o texto desta story.
    docs: { source: { transform: alertWithIconSource } },
  },
  render: () => (
    <Alert>
      <Info aria-hidden="true" />
      <AlertTitle as="h4">Informação</AlertTitle>
      <AlertDescription>Ícone SVG posicionado automaticamente.</AlertDescription>
    </Alert>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getByRole("alert");
    await expect(alert.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    await expect(canvas.getByText("Informação")).toBeVisible();
  },
};

export const WithAction: Story = {
  // AlertAction + Button são peças que o snippet do meta nem importa.
  parameters: { docs: { source: { transform: alertWithActionSource } } },
  render: () => (
    <Alert>
      <Info aria-hidden="true" />
      <AlertTitle as="h4">Atualização disponível</AlertTitle>
      <AlertDescription>Uma nova versão está pronta para instalação.</AlertDescription>
      <AlertAction>
        <Button size="sm" variant="default">
          Atualizar
        </Button>
      </AlertAction>
    </Alert>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("A ação fica acessível como botão dentro do alert", async () => {
      const alert = canvas.getByRole("alert");
      await expect(within(alert).getByRole("button", { name: "Atualizar" })).toBeVisible();
    });

    await step("O slot de ação usa a classe do componente", async () => {
      const action = canvasElement.querySelector('[data-slot="alert-action"]');
      await expect(action).toHaveClass("nds-alert-action");
    });

    // `accessibility.keyboard` documenta Tab e Enter. O alert em si não é
    // focável — o Tab tem que chegar direto ao botão interno.
    await step("Tab leva o foco ao botão interno", async () => {
      const alert = canvas.getByRole("alert");
      await expect(alert).not.toHaveAttribute("tabindex");
      await userEvent.tab();
      await expect(within(alert).getByRole("button", { name: "Atualizar" })).toHaveFocus();
    });
  },
};

/**
 * Extensibilidade documentada: todos os subcomponentes aceitam classe do
 * consumidor, e ela SOMA às do design system — não substitui.
 *
 * `nds-w-full` (block, já ocupa a largura) e `nds-w-auto` no slot de ação
 * (coluna `auto` do grid, já na largura do conteúdo) são inertes de propósito: a story prova
 * a composição de classes sem mexer no snapshot visual.
 */
export const AdditionalClass: Story = {
  // O className em CADA subcomponente é o que a story prova; o meta só tem raiz.
  parameters: { docs: { source: { transform: alertAdditionalClassSource } } },
  render: () => (
    <Alert className="nds-w-full">
      <Info aria-hidden="true" />
      <AlertTitle as="h4" className="nds-w-full">Classe adicional</AlertTitle>
      <AlertDescription className="nds-w-full">
        A classe do consumidor convive com as do design system.
      </AlertDescription>
      <AlertAction className="nds-w-auto">
        <Button size="sm" variant="default">
          Ação
        </Button>
      </AlertAction>
    </Alert>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("A classe do consumidor soma à do design system", async () => {
      const alert = canvas.getByRole("alert");
      await expect(alert).toHaveClass("nds-alert", "nds-w-full");

      const slots = [
        ["alert-title", "nds-alert-title", "nds-w-full"],
        ["alert-description", "nds-alert-description", "nds-w-full"],
        ["alert-action", "nds-alert-action", "nds-w-auto"],
      ] as const;
      for (const [slot, base, extra] of slots) {
        await expect(alert.querySelector(`[data-slot="${slot}"]`)).toHaveClass(base, extra);
      }
    });
  },
};

export const WithoutIcon: Story = {
  parameters: {
    covers: ["visual.item4"],
    // Mesma ausência que a story de estados prova, com o texto desta.
    docs: { source: { transform: alertCompositionNoIconSource } },
  },
  render: () => (
    <Alert>
      <AlertTitle as="h4">Sem ícone</AlertTitle>
      <AlertDescription>Alert sem ícone mantém layout de coluna única.</AlertDescription>
    </Alert>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getByRole("alert");
    await expect(alert.querySelector("svg")).toBeNull();
    await expect(canvas.getByText("Sem ícone")).toBeVisible();
  },
};

/**
 * Ação e botão de fechar no mesmo alerta. A ação é a terceira coluna do grid e o
 * X fica na reserva própria dele, à direita. A prova é de CAIXA, pela sonda
 * compartilhada — classe presente não diz nada sobre sobreposição.
 */
export const WithActionAndDismiss: Story = {
  parameters: {
    covers: ["functional.item8", "visual.item6"],
    // AlertAction e dismissible juntos: o snippet do meta não tem nenhum dos dois.
    docs: { source: { transform: alertWithActionAndDismissSource } },
  },
  render: () => (
    <Alert dismissible>
      <Info aria-hidden="true" />
      <AlertTitle as="h4">Sessão expira em 5 minutos</AlertTitle>
      <AlertDescription>Salve seu trabalho para não perder as alterações.</AlertDescription>
      <AlertAction>
        <Button size="sm" variant="default">
          Salvar agora
        </Button>
      </AlertAction>
    </Alert>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getByRole("alert");

    await step("A ação e o botão de fechar estão no mesmo alerta", async () => {
      await expect(within(alert).getByRole("button", { name: "Salvar agora" })).toBeInTheDocument();
      await expect(within(alert).getByRole("button", { name: "Fechar alerta" })).toBeInTheDocument();
      await expect(alert.lastElementChild).toHaveAttribute("data-slot", "alert-dismiss");
    });

    await step("Ação e X não se sobrepõem, e o texto termina antes da ação", async () => {
      // A entrada anima com transform: medir caixa no meio dela mediria um
      // quadro que ninguém vê. A leitura dentro do waitFor é pura.
      await waitFor(() => expect(alert).not.toHaveClass("nds-animate-in"));
      const layout = measureActionDismiss(alert);
      await expect(layout.overlap).toBe(false);
      await expect(layout.gap).toBeGreaterThanOrEqual(0);
      await expect(layout.textClearsAction).toBe(true);
    });
  },
};
