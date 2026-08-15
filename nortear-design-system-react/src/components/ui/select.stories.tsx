import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn, userEvent, within, expect, waitFor } from "storybook/test";
import { waitForPortal, waitForPortalGone } from "@/lib/wait-for-portal";
import { medirAnelDeFoco, ESTADOS, ESTADOS_POR_VALOR } from "@shared/testing/select-probe";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { SelectDocs } from "@/components/docs/SelectDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

const meta = {
  title: "UI/Select",
  component: Select,
  tags: ["autodocs", "form"],
  parameters: {
    docs: { page: withAutoDocsTab(SelectDocs) },
  },
  argTypes: {
    disabled: {
      control: "boolean",
      description: "Desabilita o campo e impede a abertura da lista",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    name: {
      control: "text",
      description: "Nome do campo no formulário HTML",
      table: { type: { summary: "string" } },
    },
    // Callback do primitivo: quem o encaminha é o `render`, e ele o encaminha
    // sempre. Um control aqui trocaria o espião por um valor da UI e esvaziaria
    // a aba Actions — documentação, não controle.
    onValueChange: {
      control: false,
      description: "Disparado ao trocar a seleção; recebe o valor escolhido",
      table: { type: { summary: "(value: string) => void" } },
    },
  },
  args: {
    disabled: false,
    name: "estado",
    onValueChange: fn(),
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: {
    covers: [
      "functional.item1",
      "functional.item2",
      "functional.item3",
      "functional.item4",
      "accessibility.item1",
      "accessibility.item2",
      "accessibility.item3",
      "accessibility.item4",
      "accessibility.item5",
    ],
  },
  render: (args) => {
    const [value, setValue] = useState<string>("");
    return (
      <div style={{ contain: "layout", minHeight: 200, position: "relative" }}>
        <Select
          {...args}
          // Sem este mapa o campo fechado exibe o VALOR cru ("rj") no lugar do
          // rótulo: o primitivo desmonta a lista ao fechar e não tem de onde
          // tirar o texto da opção escolhida.
          items={ESTADOS_POR_VALOR}
          value={value}
          onValueChange={(v) => {
            setValue((v ?? "") as string);
            // Só o VALOR chega ao espião. O segundo argumento do primitivo
            // carrega o evento nativo, e serializá-lo na aba Actions estoura
            // SecurityError ao alcançar o `window` do iframe.
            (args.onValueChange as unknown as (valor: string) => void)?.(
              (v ?? "") as string,
            );
          }}
        >
          <SelectTrigger aria-label="Selecionar estado" disabled={args.disabled}>
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            {ESTADOS.map((estado) => (
              <SelectItem key={estado.value} value={estado.value}>
                {estado.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("combobox");

    // Cada passo estabelece a própria precondição: o painel Interactions
    // reexecuta a play no MESMO DOM, e um clique cego inverteria o resultado na
    // segunda rodada.
    const abrir = async () => {
      // Idempotente: o clique só acontece com a lista fechada.
      if (trigger.getAttribute("aria-expanded") !== "true") await userEvent.click(trigger);
      return await waitForPortal("listbox");
    };

    await step("O campo é um combobox nomeado e nasce fechado", async () => {
      await expect(trigger).toHaveAttribute("aria-label", "Selecionar estado");
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      await expect(trigger).toHaveTextContent(/Selecione/);
    });

    if (args.disabled) {
      await step("Desabilitado — o campo não abre", async () => {
        await expect(trigger).toBeDisabled();
        await userEvent.click(trigger, { pointerEventsCheck: 0 });
        await expect(trigger).toHaveAttribute("aria-expanded", "false");
      });
      return;
    }

    await step("O campo tem anel de foco por teclado", async () => {
      // Antes de qualquer abertura: com a lista aberta o primitivo guarda o
      // foco e devolve o gatilho no mesmo instante, então o `blur()` da medição
      // não chega a valer e a comparação sairia entre dois estados focados.
      //
      // `outline: 0` na folha é intencional — o anel é `box-shadow`. Medir a
      // MUDANÇA, e não `boxShadow !== 'none'`, é o que distingue anel de foco
      // de anel de erro, que já existe sem foco.
      await expect(medirAnelDeFoco(trigger).mudou).toBe(true);
    });

    await step("Abrir mostra a lista, e a seta anda pelas opções", async () => {
      const listbox = await abrir();
      await expect(trigger).toHaveAttribute("aria-expanded", "true");
      const opcoes = within(listbox).getAllByRole("option");
      await expect(opcoes).toHaveLength(ESTADOS.length);
      // Onde o teclado fica ao abrir varia por lib: umas movem o foco para
      // dentro do painel, outras o mantêm no campo e comandam a lista por
      // "aria-activedescendant". O que NÃO varia é a seta andar pela lista em
      // vez de rolar a página — e é isso que o item do contrato promete.
      const destacada = () =>
        within(listbox)
          .getAllByRole("option")
          .findIndex((o) => o.hasAttribute("data-highlighted"));
      const partida = destacada();
      await userEvent.keyboard("{ArrowDown}");
      await waitFor(async () => {
        await expect(destacada()).toBe(Math.min(partida + 1, opcoes.length - 1));
      });
    });

    await step("Digitar a inicial salta para a opção correspondente", async () => {
      const listbox = await abrir();
      await userEvent.keyboard("m");
      const minas = within(listbox).getByRole("option", { name: "Minas Gerais" });
      await waitFor(async () => {
        await expect(minas).toHaveAttribute("data-highlighted");
      });
    });

    await step("Enter escolhe a opção destacada, fecha e atualiza o campo", async () => {
      await abrir();
      await userEvent.keyboard("{Enter}");
      await waitForPortalGone("listbox");
      await expect(args.onValueChange).toHaveBeenCalledWith("mg");
      // O campo fechado anuncia o RÓTULO, não o valor cru.
      await expect(trigger).toHaveTextContent("Minas Gerais");
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
    });

    await step("Escape fecha sem trocar a escolha e devolve o foco", async () => {
      await abrir();
      const chamadasAntes = (args.onValueChange as unknown as { mock: { calls: unknown[] } })
        .mock.calls.length;
      await userEvent.keyboard("{Escape}");
      await waitForPortalGone("listbox");
      await expect(
        (args.onValueChange as unknown as { mock: { calls: unknown[] } }).mock.calls.length,
      ).toBe(chamadasAntes);
      await expect(trigger).toHaveTextContent("Minas Gerais");
      await waitFor(async () => {
        await expect(trigger).toHaveFocus();
      });
    });
  },
};
