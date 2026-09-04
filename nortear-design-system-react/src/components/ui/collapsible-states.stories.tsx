import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, waitFor, within, expect } from "storybook/test";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "./collapsible";
import {
  defaultCollapsibleOpenSource,
  collapsibleControlledSource,
  collapsibleDisabledSource,
  collapsibleSource,
} from "./collapsible.source";
import { Button, buttonVariants } from "./button";
import { cn } from "@/lib/utils";

// Mesmo markup do Playground e do Vanilla (referência cross-stack).
const PANEL_CLASSES =
  "nds-rounded-md nds-border-default nds-bg-muted-soft nds-p-4 nds-text-body nds-stack nds-mt-2";
const TRIGGER_CLASSES = "nds-cluster nds-w-full nds-px-4";
const CHEVRON_CLASSES = "nds-icon nds-shrink-0 nds-transition-transform nds-chevron";

const meta = {
  title: "Components/Disclosure/Collapsible/States",
  tags: ["disclosure"],
  component: Collapsible,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: collapsibleSource },
      description: {
        component:
          "Estados do Collapsible: não-controlado (defaultOpen), controlado (open + onOpenChange) e desabilitado (disabled).",
      },
    },
  },
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Par idempotente. O painel Interactions reexecuta a play no MESMO DOM: um
 * clique cego num toggle parte do estado que a rodada anterior deixou e inverte
 * todas as asserções seguintes.
 */
const open = async (t: HTMLElement) => {
  if (t.getAttribute("aria-expanded") !== "true") await userEvent.click(t);
  await waitFor(() => expect(t).toHaveAttribute("aria-expanded", "true"));
};
const close = async (t: HTMLElement) => {
  if (t.getAttribute("aria-expanded") !== "false") await userEvent.click(t);
  await waitFor(() => expect(t).toHaveAttribute("aria-expanded", "false"));
};

// ─── Uncontrolled ─────────────────────────────────────────────────────────────

export const Uncontrolled: Story = {
  render: () => (
    <Collapsible defaultOpen={false} className="nds-w-sm">
      <CollapsibleTrigger
        className={cn(buttonVariants({ variant: "ghost" }), TRIGGER_CLASSES)}
        data-justify="between"
      >
        <span>Exibir filtros avançados</span>
        <ChevronDown aria-hidden="true" className={CHEVRON_CLASSES} />
      </CollapsibleTrigger>
      <CollapsibleContent className={PANEL_CLASSES} data-spacing="sm">
        <p>Filtro avançado 1</p>
        <p>Filtro avançado 2</p>
      </CollapsibleContent>
    </Collapsible>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button");
    const panel = () =>
      canvasElement.querySelector<HTMLElement>('[data-slot="collapsible-content"]');

    await step("o estado nasce e vive dentro do componente", async () => {
      // Ninguém de fora escreveu `open`: o painel abre porque o próprio
      // primitivo guarda o estado.
      await close(trigger);
      await expect(panel()).toBeNull();
      await open(trigger);
      await expect(panel()).toBeInTheDocument();
      await expect(canvas.getByText("Filtro avançado 1")).toBeVisible();
    });

    await step("e continua alternando sem controle externo", async () => {
      await close(trigger);
      await waitFor(() => expect(panel()).toBeNull());
    });
  },
};

// ─── OpenByDefault ────────────────────────────────────────────────────────────

export const OpenByDefault: Story = {
  parameters: {
    covers: ["functional.item3", "accessibility.item5", "visual.item2"],
    // O arquivo não tem args: só a story diz que o painel monta expandido.
    docs: { source: { transform: defaultCollapsibleOpenSource } },
  },
  render: () => (
    <Collapsible defaultOpen className="nds-w-sm">
      <CollapsibleTrigger
        className={cn(buttonVariants({ variant: "ghost" }), TRIGGER_CLASSES)}
        data-justify="between"
      >
        <span>Ocultar filtros avançados</span>
        <ChevronDown aria-hidden="true" className={CHEVRON_CLASSES} />
      </CollapsibleTrigger>
      <CollapsibleContent className={PANEL_CLASSES} data-spacing="sm">
        <p>Filtro avançado 1</p>
        <p>Filtro avançado 2</p>
      </CollapsibleContent>
    </Collapsible>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button");
    const panel = () =>
      canvasElement.querySelector<HTMLElement>('[data-slot="collapsible-content"]');

    await step("monta já expandido, sem estado externo nenhum", async () => {
      // Asserção de MONTAGEM: por isso ela mora numa story cujo passo anterior
      // não interage. No replay do painel Interactions o DOM não remonta, então
      // o passo seguinte devolve o estado aberto antes de terminar.
      await expect(trigger).toHaveAttribute("aria-expanded", "true");
      await expect(panel()).toBeInTheDocument();
      await expect(canvas.getByText("Filtro avançado 1")).toBeVisible();
    });

    await step("defaultOpen é ponto de partida, não trava", async () => {
      await close(trigger);
      await open(trigger);
      // Termina aberto de propósito: é o quadro que o Chromatic fotografa e o
      // estado que o axe varre para esta story (visual.item2).
      await expect(panel()).toBeInTheDocument();
    });
  },
};

// ─── Controlled ──────────────────────────────────────────────────────────────

function ControlledExample() {
  const [open, setOpen] = useState(false);
  return (
    <div className="nds-stack nds-w-sm" data-spacing="sm">
      <p className="nds-text-caption nds-text-muted-foreground">
        Estado externo: <strong>{open ? "aberto" : "fechado"}</strong>
      </p>
      <div className="nds-cluster" data-spacing="sm">
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          Abrir pelo estado externo
        </Button>
        <Button size="sm" variant="outline" onClick={() => setOpen(false)}>
          Fechar pelo estado externo
        </Button>
      </div>
      <Collapsible open={open} onOpenChange={setOpen} className="nds-w-full">
        <CollapsibleTrigger
          className={cn(buttonVariants({ variant: "ghost" }), TRIGGER_CLASSES)}
          data-justify="between"
        >
          <span>{open ? "Ocultar filtros avançados" : "Exibir filtros avançados"}</span>
          <ChevronDown aria-hidden="true" className={CHEVRON_CLASSES} />
        </CollapsibleTrigger>
        <CollapsibleContent className={PANEL_CLASSES} data-spacing="sm">
          <p>Filtro avançado 1</p>
          <p>Filtro avançado 2</p>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export const Controlled: Story = {
  parameters: {
    covers: ["functional.item4", "visual.item3"],
    // O modo controlado é o par open + onOpenChange sobre um estado de fora —
    // é isso que o snippet precisa ensinar, não o componente local da story.
    docs: { source: { transform: collapsibleControlledSource } },
  },
  render: () => <ControlledExample />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvasElement.querySelector<HTMLButtonElement>(
      '[data-slot="collapsible-trigger"]',
    )!;
    const panel = () =>
      canvasElement.querySelector<HTMLElement>('[data-slot="collapsible-content"]');

    await step("o painel obedece ao estado externo", async () => {
      // Nenhum clique no trigger: quem manda é a prop, e é isso que distingue o
      // modo controlado.
      if (trigger.getAttribute("aria-expanded") !== "true") {
        await userEvent.click(canvas.getByRole("button", { name: "Abrir pelo estado externo" }));
      }
      await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "true"));
      await expect(panel()).toBeInTheDocument();
      await expect(trigger).toHaveTextContent("Ocultar filtros avançados");
    });

    await step("o trigger devolve a mudança para o estado externo", async () => {
      await close(trigger);
      await expect(trigger).toHaveTextContent("Exibir filtros avançados");
      await waitFor(() => expect(panel()).toBeNull());
    });

    await step("e o botão externo fecha de volta", async () => {
      if (trigger.getAttribute("aria-expanded") !== "false") {
        await userEvent.click(canvas.getByRole("button", { name: "Fechar pelo estado externo" }));
      }
      await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "false"));
    });
  },
};

// ─── Disabled ─────────────────────────────────────────────────────────────────

export const Disabled: Story = {
  parameters: {
    covers: ["functional.item6", "visual.item5"],
    // `disabled` vai no gatilho, e a seta perde a transição: sem estado para
    // alternar, girar 180° não significaria nada.
    docs: { source: { transform: collapsibleDisabledSource } },
  },
  render: () => (
    <Collapsible className="nds-w-sm">
      <CollapsibleTrigger
        className={cn(buttonVariants({ variant: "ghost" }), TRIGGER_CLASSES)}
        data-justify="between"
        disabled
      >
        <span>Filtros avançados (desabilitado)</span>
        <ChevronDown aria-hidden="true" className="nds-icon nds-shrink-0" />
      </CollapsibleTrigger>
      <CollapsibleContent className={PANEL_CLASSES} data-spacing="sm">
        <p>Filtro avançado 1</p>
        <p>Filtro avançado 2</p>
      </CollapsibleContent>
    </Collapsible>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button");

    await step("trigger está desabilitado", async () => {
      // Divergência de lib, verificada em node_modules: o Trigger do base-ui usa
      // `focusableWhenDisabled: true` e, com botão nativo, escreve APENAS
      // `aria-disabled` — o atributo `disabled` nativo não é emitido, para o
      // controle continuar alcançável por Tab. Vanilla, Vue, Svelte e Angular
      // emitem o `disabled` nativo. Asserir `toBeDisabled()` aqui seria asserir
      // um atributo que a lib não escreve; o que vale nas cinco é o
      // comportamento, verificado nos passos abaixo.
      await expect(trigger).toHaveAttribute("aria-disabled", "true");
    });

    await step("clique não altera o estado do painel", async () => {
      // Exceção legítima à idempotência: o elemento desabilitado não muda de
      // estado em rodada nenhuma, então o clique cego é seguro aqui.
      await userEvent.click(trigger, { pointerEventsCheck: 0 });
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      await expect(
        canvasElement.querySelector('[data-slot="collapsible-content"]'),
      ).toBeNull();
    });

    await step("teclado também não", async () => {
      trigger.focus();
      await userEvent.keyboard("{Enter}");
      await userEvent.keyboard(" ");
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
    });
  },
};
