import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, waitFor, within, expect } from "storybook/test";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "./collapsible";
import {
  collapsibleComBotaoSource,
  collapsibleComIconeSource,
  collapsibleEstruturadoSource,
  collapsibleSource,
} from "./collapsible.source";
import { buttonVariants } from "./button";
import { cn } from "@/lib/utils";

const PAINEL_CLASSES =
  "nds-rounded-md nds-border-default nds-bg-muted-soft nds-p-4 nds-text-body nds-stack nds-mt-2";
const TRIGGER_CLASSES = "nds-cluster nds-w-full nds-px-4";
const CHEVRON_CLASSES = "nds-icon nds-shrink-0 nds-transition-transform nds-chevron";

const meta = {
  title: "UI/Collapsible/Compositions",
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
          "Composicoes do Collapsible: trigger estilizado como botão, ícone no trigger e conteúdo estruturado.",
      },
    },
  },
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Par idempotente — ver a nota em collapsible.stories.tsx. */
const abrir = async (t: HTMLElement) => {
  if (t.getAttribute("aria-expanded") !== "true") await userEvent.click(t);
  await waitFor(() => expect(t).toHaveAttribute("aria-expanded", "true"));
};
const fechar = async (t: HTMLElement) => {
  if (t.getAttribute("aria-expanded") !== "false") await userEvent.click(t);
  await waitFor(() => expect(t).toHaveAttribute("aria-expanded", "false"));
};

// ─── Trigger estilizado como botão ────────────────────────────────────────────

export const WithCustomButton: Story = {
  parameters: {
    covers: ["functional.item5"],
    // A variante de botão fica no gatilho, não na raiz: não há arg que a descreva.
    docs: { source: { transform: collapsibleComBotaoSource } },
  },
  render: () => (
    <Collapsible className="nds-w-full nds-max-w-sm">
      <CollapsibleTrigger
        className={cn(buttonVariants({ variant: "outline" }), TRIGGER_CLASSES)}
        data-justify="between"
      >
        <span>Exibir opções avançadas</span>
        <ChevronDown aria-hidden="true" className={CHEVRON_CLASSES} />
      </CollapsibleTrigger>
      <CollapsibleContent className={PAINEL_CLASSES} data-spacing="sm">
        <p>Opção avançada 1</p>
        <p>Opção avançada 2</p>
        <p>Opção avançada 3</p>
      </CollapsibleContent>
    </Collapsible>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: /Exibir opções avançadas/i });

    await step("o botão do design system E o trigger são o MESMO elemento", async () => {
      // Não há repasse de comportamento para um filho: as classes do Button
      // moram no próprio trigger. Consequência direta — o botão estilizado
      // carrega aria-expanded e, aberto, aria-controls, sem código de ligação.
      await expect(trigger).toHaveClass(/nds-button-outline/);
      await expect(trigger).toHaveAttribute("data-slot", "collapsible-trigger");
      await expect(trigger).toHaveAttribute("aria-expanded");
    });

    await step("aberto, o mesmo botão aponta para o painel", async () => {
      await fechar(trigger);
      await abrir(trigger);
      const id = trigger.getAttribute("aria-controls");
      await expect(id).toBeTruthy();
      await expect(document.getElementById(id!)).toBe(
        canvasElement.querySelector('[data-slot="collapsible-content"]'),
      );
    });
  },
};

// ─── Com ícone no trigger ─────────────────────────────────────────────────────

export const WithIconInTrigger: Story = {
  parameters: {
    covers: ["accessibility.item4", "visual.item4"],
    // Dois ícones no gatilho, os dois fora da árvore de acessibilidade — é a
    // sub-composição que o snippet do meta esconderia.
    docs: { source: { transform: collapsibleComIconeSource } },
  },
  render: () => (
    <Collapsible className="nds-w-full nds-max-w-sm">
      <CollapsibleTrigger
        className={cn(buttonVariants({ variant: "ghost" }), TRIGGER_CLASSES)}
        data-justify="between"
      >
        <span className="nds-cluster" data-spacing="sm">
          <SlidersHorizontal
            aria-hidden="true"
            className="nds-icon nds-shrink-0 nds-text-muted-foreground"
          />
          Filtros avançados
        </span>
        <ChevronDown aria-hidden="true" className={CHEVRON_CLASSES} />
      </CollapsibleTrigger>
      <CollapsibleContent className={PAINEL_CLASSES} data-spacing="sm">
        <p className="nds-text-muted-foreground">Filtro avançado 1</p>
        <p className="nds-text-muted-foreground">Filtro avançado 2</p>
      </CollapsibleContent>
    </Collapsible>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    // Achado pelo NOME acessível: se algum SVG entrasse no nome, este seletor já
    // não casaria — é a asserção real por trás do aria-hidden.
    const trigger = canvas.getByRole("button", { name: "Filtros avançados" });
    const chevron = trigger.querySelectorAll<SVGElement>("svg")[1];

    await step("nenhum ícone entra no nome acessível", async () => {
      const svgs = trigger.querySelectorAll("svg");
      await expect(svgs.length).toBe(2);
      for (const svg of svgs) await expect(svg).toHaveAttribute("aria-hidden", "true");
    });

    await step("fechado, o chevron não está girado", async () => {
      await fechar(trigger);
      // waitFor porque `.nds-chevron` tem transition: transform — medido no
      // primeiro quadro, o valor computado ainda é a matriz da animação.
      await waitFor(() => expect(getComputedStyle(chevron).transform).toBe("none"));
    });

    await step("aberto, o CSS gira 180° a partir do estado no trigger", async () => {
      await abrir(trigger);
      await expect(trigger).toHaveAttribute("data-panel-open");
      // matrix(-1, 0, 0, -1, 0, 0) é a forma computada de rotate(180deg).
      await waitFor(() =>
        expect(getComputedStyle(chevron).transform).toBe("matrix(-1, 0, 0, -1, 0, 0)"),
      );
    });
  },
};

// ─── Com conteúdo estruturado ─────────────────────────────────────────────────

export const WithStructuredContent: Story = {
  parameters: {
    // O gatilho sai de dentro do cabeçalho e vira botão só de ícone: sem texto
    // próprio, o nome acessível passa a depender do aria-label.
    docs: { source: { transform: collapsibleEstruturadoSource } },
  },
  render: () => (
    <Collapsible className="nds-stack nds-w-full nds-max-w-sm" data-spacing="sm">
      <div
        className="nds-cluster nds-rounded-md nds-border-default nds-bg-card nds-px-4 nds-py-2"
        data-align="center"
        data-justify="between"
      >
        <span className="nds-flex-1 nds-text-body nds-font-medium">Filtro básico ativo</span>
        <CollapsibleTrigger
          className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
          aria-label="Exibir filtros avançados"
        >
          <ChevronDown aria-hidden="true" className={CHEVRON_CLASSES} />
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className={PAINEL_CLASSES} data-spacing="sm">
        <p className="nds-text-muted-foreground">Filtro avançado 1</p>
        <p className="nds-text-muted-foreground">Filtro avançado 2</p>
      </CollapsibleContent>
    </Collapsible>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Exibir filtros avançados" });
    const painel = () =>
      canvasElement.querySelector<HTMLElement>('[data-slot="collapsible-content"]');

    await step("trigger só de ícone tem nome acessível pelo aria-label", async () => {
      // Sem o aria-label o botão ficaria sem nome nenhum: o chevron é
      // aria-hidden e não há texto dentro dele.
      await expect(trigger.textContent?.trim()).toBe("");
      await expect(trigger).toHaveAccessibleName("Exibir filtros avançados");
    });

    await step("o cabeçalho fica visível independente do painel", async () => {
      await fechar(trigger);
      await expect(canvas.getByText("Filtro básico ativo")).toBeVisible();
      await expect(painel()).toBeNull();
    });

    await step("abrir revela os filtros avançados sob o cabeçalho", async () => {
      await abrir(trigger);
      await expect(canvas.getByText("Filtro avançado 1")).toBeVisible();
    });
  },
};
