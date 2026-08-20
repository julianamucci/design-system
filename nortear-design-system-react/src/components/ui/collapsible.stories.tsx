import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn, userEvent, waitFor, within, expect } from "storybook/test";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "./collapsible";
import { collapsibleSource } from "./collapsible.source";
import { buttonVariants } from "./button";
import { cn } from "@/lib/utils";
import { CollapsibleDocs } from "@/components/docs/CollapsibleDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

// Markup alinhado ao Vanilla, que é a referência cross-stack: raiz
// `nds-w-cap-sm`, trigger em `nds-cluster` com `data-justify` e
// painel `nds-p-4` sobre `nds-bg-muted-soft`. As classes utilitárias do
// Tailwind que estavam aqui (`flex w-full items-center justify-between px-4`)
// não existem mais no CSS e não pintavam nada.
const PAINEL_CLASSES =
  "nds-rounded-md nds-border-default nds-bg-muted-soft nds-p-4 nds-text-body nds-stack nds-mt-2";
const TRIGGER_CLASSES = "nds-cluster nds-w-full nds-px-4";

const meta = {
  title: "UI/Collapsible",
  component: Collapsible,
  tags: ["autodocs", "disclosure"],
  parameters: {
    docs: {
      page: withAutoDocsTab(CollapsibleDocs),
      // O painel imprimia as constantes de classe do arquivo de story, que não
      // existem para quem copia. A transform devolve as três peças montadas.
      source: { transform: collapsibleSource },
    },
    layout: "centered",
  },
  argTypes: {
    // `open` é o modo controlado: quem manda é o estado de fora. O Playground é
    // não-controlado de propósito, então o control aqui não encaminharia nada —
    // fica como documentação (`control: false`), não como controle morto.
    open: {
      control: false,
      description: "Estado aberto/fechado no modo controlado",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "—" } },
    },
    defaultOpen: {
      control: "boolean",
      description: "Estado inicial no modo não-controlado",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    disabled: {
      control: "boolean",
      description: "Desabilita o trigger impedindo interação",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    // Sem entrada aqui o callback fica fora da aba API Reference, mesmo estando
    // em `args` e alimentando a aba Actions.
    onOpenChange: {
      control: false,
      description: "Chamado a cada alternância, com o novo estado",
      table: { type: { summary: "(open: boolean) => void" } },
    },
  },
  args: {
    defaultOpen: false,
    disabled: false,
    onOpenChange: fn(),
  },
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Par idempotente. O painel Interactions REEXECUTA a play no mesmo DOM, sem
 * remontar: um clique cego partiria do estado que a rodada anterior deixou e,
 * num toggle, inverteria todas as asserções seguintes.
 */
const abrir = async (t: HTMLElement) => {
  if (t.getAttribute("aria-expanded") !== "true") await userEvent.click(t);
  await waitFor(() => expect(t).toHaveAttribute("aria-expanded", "true"));
};
const fechar = async (t: HTMLElement) => {
  if (t.getAttribute("aria-expanded") !== "false") await userEvent.click(t);
  await waitFor(() => expect(t).toHaveAttribute("aria-expanded", "false"));
};

export const Playground: Story = {
  parameters: {
    covers: [
      "functional.item1", "functional.item2",
      "accessibility.item1", "accessibility.item2", "accessibility.item3",
      "accessibility.item5",
      "visual.item1",
    ],
  },
  render: (args) => (
    // key força re-mount quando defaultOpen muda no control, pois é prop de montagem
    <Collapsible
      key={String(args.defaultOpen)}
      {...args}
      // Só o valor, nunca o objeto de evento da lib: a aba Actions serializa o
      // payload, e dentro do eventDetails vem `event.view`, que é o Window do
      // iframe e estoura SecurityError na serialização.
      onOpenChange={(open) => (args.onOpenChange as (o: boolean) => void)?.(open)}
      className="nds-w-cap-sm"
    >
      <CollapsibleTrigger
        className={cn(buttonVariants({ variant: "ghost" }), TRIGGER_CLASSES)}
        data-justify="between"
        disabled={args.disabled}
      >
        <span>Exibir filtros avançados</span>
        <ChevronDown
          aria-hidden="true"
          className="nds-icon nds-shrink-0 nds-transition-transform nds-chevron"
        />
      </CollapsibleTrigger>
      <CollapsibleContent className={PAINEL_CLASSES} data-spacing="sm">
        <p>Filtro avançado 1</p>
        <p>Filtro avançado 2</p>
      </CollapsibleContent>
    </Collapsible>
  ),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button");
    const painel = () =>
      canvasElement.querySelector<HTMLElement>('[data-slot="collapsible-content"]');

    await step("trigger está presente e visível", async () => {
      await expect(trigger).toBeInTheDocument();
      await expect(trigger).toBeVisible();
    });

    await step("o chevron é decorativo", async () => {
      await expect(trigger.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    });

    if (args.disabled) {
      await step("desabilitado, o trigger não responde ao clique", async () => {
        const antes = trigger.getAttribute("aria-expanded");
        await userEvent.click(trigger, { pointerEventsCheck: 0 });
        await expect(trigger.getAttribute("aria-expanded")).toBe(antes);
      });
      return;
    }

    await step("clicar com o painel fechado expande o conteúdo", async () => {
      // fechar/abrir e não só abrir: o par garante um clique REAL nesta rodada,
      // que é o que a contagem do spy abaixo mede.
      await fechar(trigger);
      const antes = (args.onOpenChange as ReturnType<typeof fn>).mock.calls.length;
      await abrir(trigger);
      await expect(painel()).toBeInTheDocument();
      await expect(canvas.getByText("Filtro avançado 1")).toBeVisible();
      await expect(
        (args.onOpenChange as ReturnType<typeof fn>).mock.calls.length,
      ).toBe(antes + 1);
    });

    await step("aberto, aria-controls aponta para o id real do painel", async () => {
      // base-ui só escreve aria-controls enquanto o painel existe: fechado, o
      // atributo apontaria para um id ausente e o axe reprovaria por
      // aria-valid-attr-value.
      const id = trigger.getAttribute("aria-controls");
      await expect(id).toBeTruthy();
      await expect(document.getElementById(id!)).toBe(painel());
    });

    await step("Enter alterna o painel", async () => {
      await fechar(trigger);
      trigger.focus();
      await userEvent.keyboard("{Enter}");
      await expect(trigger).toHaveAttribute("aria-expanded", "true");
    });

    await step("Space alterna o painel, idêntico a Enter", async () => {
      await fechar(trigger);
      trigger.focus();
      await userEvent.keyboard(" ");
      await expect(trigger).toHaveAttribute("aria-expanded", "true");
    });

    await step("clicar com o painel aberto recolhe o conteúdo", async () => {
      // Último passo de propósito: a story declara visual.item1 (fechado por
      // padrão), e é o quadro final que o Chromatic fotografa e o axe varre.
      await abrir(trigger);
      await fechar(trigger);
      await waitFor(() => expect(painel()).toBeNull());
    });
  },
};
