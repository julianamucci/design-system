import type * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within, expect, fn } from "storybook/test";
import {
  waitForOpen,
  waitForClosed,
  nomeAcessivel,
  panelOpen,
  leaveWithPointer,
} from "@shared/testing/hover-card-probe";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./hover-card";
import { hoverCardSource } from "./hover-card.source";
import { HoverCardDocs } from "@/components/docs/HoverCardDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

type HoverCardPlaygroundArgs = {
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  openDelay?: number;
  closeDelay?: number;
  defaultOpen?: boolean;
  triggerLabel?: string;
  onOpenChange?: (open: boolean) => void;
};

const HoverCardForArgs = HoverCard as unknown as React.ComponentType<HoverCardPlaygroundArgs>;

const meta = {
  title: "UI/HoverCard",
  component: HoverCardForArgs,
  tags: ["autodocs", "overlay"],
  parameters: {
    layout: "centered",
    docs: {
      page: withAutoDocsTab(HoverCardDocs),
      // O painel imprimia `<HoverCardForArgs …>`, alias de tipo que só existe
      // neste arquivo para o Storybook montar os controls.
      source: { transform: hoverCardSource },
    },
  },
  argTypes: {
    triggerLabel: {
      control: "text",
      description:
        "Texto do gatilho. Conteúdo natural (uma menção, um nome), nunca “passe o mouse aqui”.",
      table: { type: { summary: "string" }, defaultValue: { summary: "@joana" } },
    },
    side: {
      control: { type: "radio" },
      options: ["top", "bottom", "left", "right"],
      description: "Lado preferido de abertura. Vira sozinho quando não cabe.",
      table: { type: { summary: '"top" | "bottom" | "left" | "right"' }, defaultValue: { summary: '"bottom"' } },
    },
    align: {
      control: { type: "radio" },
      options: ["start", "center", "end"],
      description: "Alinhamento do painel no eixo do lado escolhido.",
      table: { type: { summary: '"start" | "center" | "end"' }, defaultValue: { summary: '"center"' } },
    },
    openDelay: {
      control: { type: "number" },
      description: "Espera em ms antes de abrir, no ponteiro e no foco.",
      table: { type: { summary: "number" }, defaultValue: { summary: "600" } },
    },
    closeDelay: {
      control: { type: "number" },
      description: "Espera em ms antes de fechar depois que o cursor sai.",
      table: { type: { summary: "number" }, defaultValue: { summary: "300" } },
    },
    defaultOpen: {
      control: "boolean",
      description: "Estado inicial em modo não-controlado.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    onOpenChange: {
      control: false,
      description: "Chamado a cada abertura e fechamento, com o novo estado.",
      table: { type: { summary: "(open: boolean) => void" } },
    },
  },
  args: {
    triggerLabel: "@joana",
    side: "bottom",
    align: "center",
    // Espera curta no playground: quem abre a story quer ver o cartão, não
    // cronometrar 600ms. O padrão real está descrito nos argTypes.
    openDelay: 150,
    closeDelay: 100,
    defaultOpen: false,
    onOpenChange: fn(),
  },
} satisfies Meta<typeof HoverCardForArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: {
    covers: [
      "functional.item1", "functional.item2", "functional.item3", "functional.item4",
      "accessibility.item1", "accessibility.item3", "accessibility.item4",
      "accessibility.item6",
    ],
  },
  render: ({ side, align, openDelay, closeDelay, defaultOpen, triggerLabel, onOpenChange }) => (
    // `key`: `defaultOpen` só é lido na montagem, então trocar o control sem
    // remontar não mudaria nada na tela.
    <p
      className="nds-text-body nds-max-w-sm"
      style={{ contain: "layout", minHeight: 250, position: "relative" }}
    >
      Comentário de{" "}
      <HoverCard
        key={String(defaultOpen)}
        openDelay={openDelay}
        closeDelay={closeDelay}
        defaultOpen={defaultOpen}
        onOpenChange={(aberto) => onOpenChange?.(aberto)}
      >
        <HoverCardTrigger asChild>
          <a href="/users/joana" className="nds-text-primary nds-font-medium nds-hover-underline">
            {triggerLabel}
          </a>
        </HoverCardTrigger>
        <HoverCardContent side={side} align={align}>
          <div className="nds-cluster" data-spacing="sm" data-align="start">
            <div
              aria-hidden="true"
              className="nds-cluster nds-size-10 nds-shrink-0 nds-rounded-full nds-bg-muted nds-text-body nds-font-medium"
              data-align="center"
              data-justify="center"
            >
              JS
            </div>
            <div className="nds-stack" data-spacing="xs">
              <p className="nds-text-body nds-font-medium nds-leading-none">Joana Silva</p>
              <p className="nds-text-caption nds-text-muted-foreground">Designer · 142 seguidores</p>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>{" "}
      há 2 horas.
    </p>
  ),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole("link", { name: /@joana/i });

    await step("O gatilho continua sendo um link de verdade", async () => {
      // O cartão é ENRIQUECIMENTO: quem está no toque, ou num leitor de tela,
      // chega ao perfil pelo clique. É exigência do componente, não do exemplo.
      await expect(gatilho).toHaveAttribute("href", "/users/joana");
      await expect(gatilho).toHaveAttribute("data-slot", "hover-card-trigger");
    });

    // Estado conhecido antes das afirmações: o painel Interactions REEXECUTA a
    // play no mesmo DOM, e um passo que dependa do que a rodada anterior deixou
    // inverte de resultado na segunda vez.
    await userEvent.keyboard("{Escape}");
    await waitForClosed("no reset inicial");

    await step("Fechado, não existe painel no documento", async () => {
      await expect(panelOpen()).toBeNull();
    });

    await step("Passar o ponteiro abre o cartão", async () => {
      const callsBefore = (args.onOpenChange as ReturnType<typeof fn>).mock.calls.length;
      await userEvent.hover(gatilho);
      const painel = await waitForOpen();
      await expect(painel).toBeVisible();
      // `role="dialog"` é contrato de markup das cinco stacks — o primitivo não
      // o emite, este componente sim.
      await expect(painel).toHaveAttribute("role", "dialog");
      await expect(painel).toHaveClass(/nds-hover-card-content/);
      // Nome acessível: sem ele o axe reprova por `aria-dialog-name`. Sai do
      // texto do gatilho quando quem compõe não informa outro.
      await expect(nomeAcessivel(painel)).toBe(args.triggerLabel);
      await expect(
        (args.onOpenChange as ReturnType<typeof fn>).mock.calls.length,
      ).toBeGreaterThan(callsBefore);
    });

    await step("Levar o ponteiro para longe fecha o cartão", async () => {
      await leaveWithPointer(gatilho, panelOpen()!);
      await waitForClosed("depois do ponteiro sair");
      await expect(panelOpen()).toBeNull();
    });

    await step("Tab alcança o gatilho e abre o cartão sem ponteiro nenhum", async () => {
      // É o que sustenta a WCAG 1.4.13 para quem navega por teclado: o mesmo
      // conteúdo, pelo foco.
      //
      // `userEvent.tab()` e não `.focus()`: o primitivo só abre por foco quando
      // o gatilho casa `:focus-visible`, e foco programático não casa. Com
      // `.focus()` este passo provaria o contrário do que pretende.
      await userEvent.tab();
      await expect(gatilho).toHaveFocus();
      const painel = await waitForOpen("depois do foco");
      await expect(painel).toBeVisible();
    });

    await step("Escape fecha o cartão", async () => {
      // O foco está no gatilho, não dentro do painel: o listener é do
      // documento, e é isso que faz o atalho valer de qualquer lugar.
      await userEvent.keyboard("{Escape}");
      await waitForClosed("depois do Escape");
      await expect(panelOpen()).toBeNull();
    });
  },
};

