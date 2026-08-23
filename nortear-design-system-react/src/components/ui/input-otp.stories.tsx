import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { userEvent, within, expect, fn, waitFor } from "storybook/test";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "./input-otp";
import { field } from "./input-otp.fixtures";
import { inputOtpSource } from "./input-otp.source";
import { InputOTPDocs } from "@/components/docs/InputOTPDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

const meta = {
  title: "UI/InputOTP",
  component: InputOTP,
  tags: ["autodocs", "form"],
  parameters: {
    layout: "centered",
    docs: {
      page: withAutoDocsTab(InputOTPDocs),
      // O painel imprimia `campo(canvasElement)` — uma fixture que só existe no
      // repositório de testes — como se fosse API do design system. A transform
      // devolve o uso controlado real, e cascateia para todo o arquivo.
      source: { transform: inputOtpSource },
    },
  },
  argTypes: {
    maxLength: {
      control: { type: "number", min: 4, max: 8, step: 1 },
      description: "Número total de slots/caracteres do código.",
      table: { type: { summary: "number" }, defaultValue: { summary: "—" } },
    },
    disabled: {
      control: "boolean",
      description: "Bloqueia a interação e esmaece o campo.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    autoFocus: {
      control: "boolean",
      description: "Foca o campo automaticamente ao montar.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    onComplete: {
      control: false,
      description: "Chamado quando todos os slots estão preenchidos.",
      table: {
        type: { summary: "(value: string) => void" },
        defaultValue: { summary: "—" },
      },
    },
  },
  args: {
    maxLength: 6,
    disabled: false,
    autoFocus: false,
    onComplete: fn(),
  },
} satisfies Meta<typeof InputOTP>;

export default meta;
type Story = StoryObj<typeof InputOTP>;

const boxes = (canvasElement: HTMLElement): HTMLElement[] => [
  ...canvasElement.querySelectorAll<HTMLElement>('[data-slot="input-otp-slot"]'),
];

const texts = (canvasElement: HTMLElement): string[] =>
  boxes(canvasElement).map((c) => c.textContent?.trim() ?? "");

const boxAtiva = (canvasElement: HTMLElement): number =>
  boxes(canvasElement).findIndex(
    (c) => c.hasAttribute("data-active") && c.getAttribute("data-active") !== "false",
  );

export const Playground: Story = {
  parameters: {
    covers: [
      "functional.item1", "functional.item2", "functional.item3",
      "functional.item4", "functional.item5",
      "accessibility.item1", "accessibility.item2", "accessibility.item3",
    ],
  },
  render: (args) => {
    const { maxLength = 6, disabled, autoFocus, onComplete } = args as {
      maxLength?: number;
      disabled?: boolean;
      autoFocus?: boolean;
      onComplete?: (v: string) => void;
    };
    const [value, setValue] = useState("");

    return (
      <div className="nds-stack" data-spacing="sm">
        <label htmlFor="otp-playground" className="nds-text-label">
          Código de verificação
        </label>
        <InputOTP
          key={String(maxLength) + String(disabled) + String(autoFocus)}
          id="otp-playground"
          maxLength={maxLength}
          value={value}
          onChange={setValue}
          onComplete={(v) => onComplete?.(v)}
          disabled={disabled}
          autoFocus={autoFocus}
          autoComplete="one-time-code"
          inputMode="numeric"
        >
          <InputOTPGroup>
            {Array.from({ length: maxLength }).map((_, i) => (
              <InputOTPSlot key={i} index={i} />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>
    );
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const total = (args.maxLength as number) ?? 6;
    const input = field(canvasElement);

    await step("O campo tem nome e uma caixa por dígito", async () => {
      // Uma caixa por dígito é o que a pessoa vê; conferir só o valor do input
      // deixaria a story verde com o campo inteiro em branco.
      await expect(canvas.getByLabelText("Código de verificação")).toBe(input);
      await expect(boxes(canvasElement)).toHaveLength(total);
    });

    await step("O campo pede o código de uso único ao sistema", async () => {
      await expect(input).toHaveAttribute("autocomplete", "one-time-code");
      await expect(input).toHaveAttribute("inputmode", "numeric");
    });

    await step("Digitar preenche a caixa e move o cursor para a seguinte", async () => {
      // Precondição própria: a play reexecuta no mesmo DOM pelo painel
      // Interactions, então limpar antes é o que torna o passo repetível.
      input.focus();
      await userEvent.clear(input);
      await userEvent.type(input, "12");
      await waitFor(() => expect(texts(canvasElement).slice(0, 2)).toEqual(["1", "2"]));
      await expect(boxAtiva(canvasElement)).toBe(2);
    });

    await step("Setas movem o cursor sem alterar o valor", async () => {
      await userEvent.keyboard("{ArrowLeft}");
      await waitFor(() => expect(boxAtiva(canvasElement)).toBe(1));
      await expect(input).toHaveValue("12");
      await userEvent.keyboard("{ArrowRight}");
      await waitFor(() => expect(boxAtiva(canvasElement)).toBe(2));
    });

    await step("Backspace apaga a última caixa preenchida", async () => {
      await userEvent.keyboard("{Backspace}");
      await waitFor(() => expect(input).toHaveValue("1"));
      await expect(texts(canvasElement)[1]).toBe("");
    });

    await step("Colar distribui o código inteiro e dispara onComplete", async () => {
      const code = "123456".slice(0, total);
      input.focus();
      await userEvent.clear(input);
      await userEvent.paste(code);
      await waitFor(() =>
        expect(texts(canvasElement).join("")).toBe(code)
      );
      await expect(args.onComplete).toHaveBeenCalledWith(code);
    });
  },
};
