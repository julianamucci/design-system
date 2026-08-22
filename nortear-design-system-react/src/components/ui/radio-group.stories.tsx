import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn, userEvent, within, expect } from "storybook/test";
import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "./radio-group";
import { Label } from "./label";
import { RadioGroupDocs } from "@/components/docs/RadioGroupDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";
import { radioGroupSource } from "./radio-group.source";

const meta = {
  title: "UI/RadioGroup",
  component: RadioGroup,
  tags: ["autodocs", "form"],
  parameters: {
    docs: {
      page: withAutoDocsTab(RadioGroupDocs),
      source: { transform: radioGroupSource },
    },
  },
  argTypes: {
    disabled: {
      control: "boolean",
      description: "Desabilita todos os itens do grupo",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    name: {
      control: "text",
      description: "Nome do campo no formulário HTML",
      table: { type: { summary: "string" }, defaultValue: { summary: "—" } },
    },
    // Sem `orientation`: a lib deste stack não tem esse input, e o control que
    // existia aqui cuspia um atributo solto no <div> — controle morto na aba
    // API Reference. A direção da navegação por setas é anunciada por
    // `aria-orientation`, que também é o que dispõe as opções em linha.
    onValueChange: {
      control: false,
      description: "Callback disparado ao trocar a seleção",
      table: { type: { summary: "(value: string) => void" }, defaultValue: { summary: "—" } },
    },
  },
  args: {
    disabled: false,
    name: "payment",
    onValueChange: fn(),
  },
} as Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Idempotente: só clica quando o item ainda não está marcado. Rádio é seleção
 * exclusiva — no replay do painel Interactions o DOM não remonta, então um
 * clique cego partiria do estado que a rodada anterior deixou.
 */
const choose = async (alvo: HTMLElement) => {
  if (alvo.getAttribute("aria-checked") !== "true") await userEvent.click(alvo);
  await expect(alvo).toHaveAttribute("aria-checked", "true");
};

export const Playground: Story = {
  parameters: {
    covers: [
      "functional.item1",
      "functional.item2",
      "functional.item3",
      "accessibility.item1",
      "accessibility.item4",
      "accessibility.item5",
    ],
  },
  render: (args) => {
    const [value, setValue] = useState<string>("");
    return (
      <RadioGroup
        {...args}
        value={value}
        onValueChange={(v) => {
          setValue(v);
          args.onValueChange?.(v, undefined as never);
        }}
        aria-label="Forma de pagamento"
      >
        <div className="nds-cluster" data-spacing="sm">
          <RadioGroupItem value="cartao" id="pg-cartao" disabled={args.disabled} />
          <Label htmlFor="pg-cartao">Cartão de crédito</Label>
        </div>
        <div className="nds-cluster" data-spacing="sm">
          <RadioGroupItem value="pix" id="pg-pix" disabled={args.disabled} />
          <Label htmlFor="pg-pix">Pix</Label>
        </div>
        <div className="nds-cluster" data-spacing="sm">
          <RadioGroupItem value="boleto" id="pg-boleto" disabled={args.disabled} />
          <Label htmlFor="pg-boleto">Boleto bancário</Label>
        </div>
      </RadioGroup>
    );
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const radios = canvas.getAllByRole("radio");

    await step("O grupo é um radiogroup com nome acessível", async () => {
      await expect(
        canvas.getByRole("radiogroup", { name: "Forma de pagamento" }),
      ).toBeInTheDocument();
      await expect(radios).toHaveLength(3);
    });

    await step("Cada item é alcançável pelo rótulo", async () => {
      // `getByRole` com nome prova que o <Label htmlFor> chega ao item: se a
      // associação quebrar, o nome acessível some e a busca falha.
      await expect(canvas.getByRole("radio", { name: "Cartão de crédito" })).toBeVisible();
      await expect(canvas.getByRole("radio", { name: "Pix" })).toBeVisible();
      await expect(canvas.getByRole("radio", { name: "Boleto bancário" })).toBeVisible();
    });

    if (args.disabled) {
      await step("Grupo desabilitado bloqueia todos os itens", async () => {
        for (const r of radios) await expect(r).toHaveAttribute("aria-disabled", "true");
      });
      return;
    }

    await step("Escolher Pix e depois Cartão prova o clique e a exclusão mútua", async () => {
      // O par garante um clique REAL nesta rodada, venha o DOM de onde vier — é
      // o que mantém a aba Actions honesta no replay.
      await choose(radios[1]);
      await choose(radios[0]);
      await expect(radios[1]).toHaveAttribute("aria-checked", "false");
      await expect(args.onValueChange).toHaveBeenCalled();
      // base-ui ≥1.6 passa (value, eventDetails) — asserta só no value
      const mock = args.onValueChange as unknown as { mock: { lastCall?: unknown[] } };
      await expect(mock.mock.lastCall?.[0]).toBe("cartao");
    });

    await step("ArrowDown move e seleciona o próximo item", async () => {
      radios[0].focus();
      await userEvent.keyboard("{ArrowDown}");
      await expect(radios[1]).toHaveAttribute("aria-checked", "true");
      await expect(radios[0]).toHaveAttribute("aria-checked", "false");
    });

    await step("ArrowUp circula do primeiro para o último", async () => {
      radios[0].focus();
      await userEvent.keyboard("{ArrowUp}");
      await expect(radios[2]).toHaveAttribute("aria-checked", "true");
    });

    await step("Roving tabindex: o Tab tem UMA parada no grupo inteiro", async () => {
      // Asserção sobre o CONJUNTO, não só sobre o ativo: exatamente um item na
      // ordem de tabulação, e é o escolhido. Sem isso o Tab percorreria opção
      // por opção em vez de sair do grupo.
      const ordem = radios.map((r) => r.tabIndex);
      await expect(ordem.filter((t) => t === 0)).toHaveLength(1);
      const marcado = radios.findIndex((r) => r.getAttribute("aria-checked") === "true");
      await expect(ordem[marcado]).toBe(0);
    });
  },
};
