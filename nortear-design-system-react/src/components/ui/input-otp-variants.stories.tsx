import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { userEvent, within, expect, waitFor } from "storybook/test";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "./input-otp";
import { campo } from "./input-otp.fixtures";
import {
  inputOtpAlfanumericoSource,
  inputOtpWithSeparatorSource,
  inputOtpQuatroDigitosSource,
  inputOtpSource,
} from "./input-otp.source";

const meta = {
  title: "UI/InputOTP/Variants",
  tags: ["form"],
  component: InputOTP,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // O arquivo desliga os controls, então a transform do `meta` cai no
      // código de seis dígitos — que é a story SixDigits. As outras três
      // trocam comprimento, agrupamento ou conjunto aceito e dizem a sua.
      source: { transform: inputOtpSource },
      description: {
        component:
          "Variantes do InputOTP: SixDigits (padrão SMS), FourDigits (PIN), WithSeparator (3+3) e Alphanumeric (código de autenticação).",
      },
    },
  },
} satisfies Meta<typeof InputOTP>;

export default meta;
type Story = StoryObj<typeof InputOTP>;

const boxes = (canvasElement: HTMLElement): HTMLElement[] => [
  ...canvasElement.querySelectorAll<HTMLElement>('[data-slot="input-otp-slot"]'),
];

const texts = (canvasElement: HTMLElement): string[] =>
  boxes(canvasElement).map((c) => c.textContent?.trim() ?? "");

export const SixDigits: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "6 dígitos — padrão para códigos enviados por SMS/email; teclado numérico e pedido de código de uso único.",
      },
    },
  },
  render: () => {
    const Demo = () => {
      const [value, setValue] = useState("");
      return (
        <div className="nds-stack" data-spacing="sm">
          <label htmlFor="otp-six" className="nds-text-label">
            Código enviado por SMS
          </label>
          <InputOTP
            id="otp-six"
            maxLength={6}
            value={value}
            onChange={setValue}
            autoComplete="one-time-code"
            inputMode="numeric"
          >
            <InputOTPGroup>
              {Array.from({ length: 6 }).map((_, i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>
      );
    };
    return <Demo />;
  },
  play: async ({ canvasElement, step }) => {
    await step("Seis caixas, teclado numérico", async () => {
      await expect(boxes(canvasElement)).toHaveLength(6);
      await expect(campo(canvasElement)).toHaveAttribute("inputmode", "numeric");
    });

    await step("Letra não entra no modo numérico", async () => {
      const input = campo(canvasElement);
      input.focus();
      await userEvent.clear(input);
      await userEvent.type(input, "a");
      await expect(input).toHaveValue("");
      await userEvent.type(input, "7");
      await waitFor(() => expect(texts(canvasElement)[0]).toBe("7"));
    });
  },
};

export const FourDigits: Story = {
  parameters: {
    docs: {
      // `maxLength` e a contagem de caixas andam juntos, e o par vale 4 aqui —
      // o snippet de seis deixaria duas caixas mortas na tela de quem copiar.
      source: { transform: inputOtpQuatroDigitosSource },
      description: {
        story: "PIN de 4 dígitos — PINs locais (carteira, conta, app travado).",
      },
    },
  },
  render: () => {
    const Demo = () => {
      const [value, setValue] = useState("");
      return (
        <div className="nds-stack" data-spacing="sm">
          <label htmlFor="otp-four" className="nds-text-label">
            PIN do aplicativo
          </label>
          <InputOTP
            id="otp-four"
            maxLength={4}
            value={value}
            onChange={setValue}
            autoComplete="one-time-code"
            inputMode="numeric"
          >
            <InputOTPGroup>
              {Array.from({ length: 4 }).map((_, i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>
      );
    };
    return <Demo />;
  },
  play: async ({ canvasElement, step }) => {
    await step("O comprimento pedido chega ao componente", async () => {
      // Quatro e não seis: renderizar com o default passaria despercebido.
      await expect(boxes(canvasElement)).toHaveLength(4);
    });

    await step("O quinto caractere não entra", async () => {
      const input = campo(canvasElement);
      input.focus();
      await userEvent.clear(input);
      await userEvent.type(input, "12345");
      await waitFor(() => expect(input).toHaveValue("1234"));
      await expect(texts(canvasElement).join("")).toBe("1234");
    });
  },
};

export const WithSeparator: Story = {
  parameters: {
    covers: ["accessibility.item4", "visual.item5"],
    docs: {
      // Dois grupos e um separador: uma sub-composição que o snippet de grupo
      // único esconde, com os índices explícitos em vez do laço.
      source: { transform: inputOtpWithSeparatorSource },
      description: {
        story:
          "Dois grupos de 3 caixas com um separador entre eles — formato xxx-xxx de códigos de recuperação.",
      },
    },
  },
  render: () => {
    const Demo = () => {
      const [value, setValue] = useState("");
      return (
        <div className="nds-stack" data-spacing="sm">
          <label htmlFor="otp-sep" className="nds-text-label">
            Código de recuperação
          </label>
          <InputOTP
            id="otp-sep"
            maxLength={6}
            value={value}
            onChange={setValue}
            autoComplete="one-time-code"
            inputMode="numeric"
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
      );
    };
    return <Demo />;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("O separador tem papel próprio, não é enfeite escondido", async () => {
      // `role="separator"` é o que informa ao leitor que o código vem em dois
      // blocos de três — seis dígitos de enfiada são mais difíceis de conferir.
      const separadores = canvas.getAllByRole("separator");
      await expect(separadores).toHaveLength(1);
    });

    await step("O separador afasta os dois blocos, e só eles", async () => {
      // Efeito computado, não nome de classe: o respiro é margem do separador.
      const all = boxes(canvasElement);
      const separator = canvasElement.querySelector<HTMLElement>(
        '[data-slot="input-otp-separator"]'
      )!;
      const folga = (a: Element, b: Element) =>
        Math.round(b.getBoundingClientRect().left - a.getBoundingClientRect().right);
      await expect(folga(all[0], all[1])).toBe(0);
      await expect(folga(all[2], separator)).toBeGreaterThan(0);
      await expect(folga(separator, all[3])).toBeGreaterThan(0);
    });

    await step("Os seis dígitos se distribuem entre os dois blocos", async () => {
      const input = campo(canvasElement);
      input.focus();
      await userEvent.clear(input);
      await userEvent.type(input, "123456");
      await waitFor(() => expect(texts(canvasElement).join("")).toBe("123456"));
    });
  },
};

export const Alphanumeric: Story = {
  parameters: {
    docs: {
      // O padrão do componente só aceita dígito: aceitar letra exige trocar o
      // `pattern`, e o snippet padrão não mostraria a troca nem o import.
      source: { transform: inputOtpAlfanumericoSource },
      description: {
        story:
          "Conjunto alfanumérico e teclado de texto — códigos de autenticação que misturam letras e dígitos.",
      },
    },
  },
  render: () => {
    const Demo = () => {
      const [value, setValue] = useState("");
      return (
        <div className="nds-stack" data-spacing="sm">
          <label htmlFor="otp-alpha" className="nds-text-label">
            Código de autenticação
          </label>
          <InputOTP
            id="otp-alpha"
            maxLength={6}
            value={value}
            onChange={setValue}
            pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
            autoComplete="one-time-code"
            inputMode="text"
          >
            <InputOTPGroup>
              {Array.from({ length: 6 }).map((_, i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>
      );
    };
    return <Demo />;
  },
  play: async ({ canvasElement, step }) => {
    await step("O teclado do dispositivo passa a ser de texto", async () => {
      await expect(campo(canvasElement)).toHaveAttribute("inputmode", "text");
    });

    await step("Letra e dígito são aceitos", async () => {
      const input = campo(canvasElement);
      input.focus();
      await userEvent.clear(input);
      await userEvent.type(input, "a9");
      await waitFor(() => expect(texts(canvasElement).slice(0, 2)).toEqual(["a", "9"]));
    });
  },
};
