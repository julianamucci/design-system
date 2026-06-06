import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { within, expect } from "storybook/test";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "./input-otp";

const meta = {
  title: "UI/InputOTP/Estados",
  tags: ["form"],
  component: InputOTP,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Estados canônicos do InputOTP: Vazio, Preenchendo (3/6), Completo (6/6), Desabilitado e Erro.",
      },
    },
  },
} satisfies Meta<typeof InputOTP>;

export default meta;
type Story = StoryObj<typeof InputOTP>;

const slotsArray = (n: number) => Array.from({ length: n });

function findOtpInput(canvasElement: HTMLElement): HTMLInputElement | null {
  return canvasElement.querySelector(
    'input[autocomplete="one-time-code"]'
  ) as HTMLInputElement | null;
}

export const Vazio: Story = {
  parameters: {
    docs: {
      description: { story: "Nenhum slot preenchido. value=''." },
    },
  },
  render: () => (
    <div className="space-y-2">
      <label htmlFor="otp-empty" className="text-sm font-medium">
        Código de verificação
      </label>
      <InputOTP
        id="otp-empty"
        maxLength={6}
        value=""
        onChange={() => {}}
        autoComplete="one-time-code"
        inputMode="numeric"
        aria-label="Código vazio"
      >
        <InputOTPGroup>
          {slotsArray(6).map((_, i) => (
            <InputOTPSlot key={i} index={i} />
          ))}
        </InputOTPGroup>
      </InputOTP>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    await step("Input vazio", async () => {
      const input = findOtpInput(canvasElement);
      await expect(input).toBeTruthy();
      await expect(input).toHaveValue("");
    });
  },
};

export const Preenchendo: Story = {
  parameters: {
    docs: {
      description: { story: "Parcialmente preenchido (3 de 6 slots)." },
    },
  },
  render: () => {
    const Demo = () => {
      const [value, setValue] = useState("123");
      return (
        <div className="space-y-2">
          <label htmlFor="otp-filling" className="text-sm font-medium">
            Código (preenchendo)
          </label>
          <InputOTP
            id="otp-filling"
            maxLength={6}
            value={value}
            onChange={setValue}
            autoComplete="one-time-code"
            inputMode="numeric"
            aria-label="Código preenchendo"
          >
            <InputOTPGroup>
              {slotsArray(6).map((_, i) => (
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
    await step("Input com 3 caracteres", async () => {
      const input = findOtpInput(canvasElement);
      await expect(input).toHaveValue("123");
    });
  },
};

export const Completo: Story = {
  parameters: {
    docs: {
      description: { story: "Todos os 6 slots preenchidos (onComplete já disparou)." },
    },
  },
  render: () => {
    const Demo = () => {
      const [value, setValue] = useState("123456");
      return (
        <div className="space-y-2">
          <label htmlFor="otp-complete" className="text-sm font-medium">
            Código (completo)
          </label>
          <InputOTP
            id="otp-complete"
            maxLength={6}
            value={value}
            onChange={setValue}
            autoComplete="one-time-code"
            inputMode="numeric"
            aria-label="Código completo"
          >
            <InputOTPGroup>
              {slotsArray(6).map((_, i) => (
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
    await step("Input com 6 caracteres", async () => {
      const input = findOtpInput(canvasElement);
      await expect(input).toHaveValue("123456");
    });
  },
};

export const Desabilitado: Story = {
  parameters: {
    docs: {
      description: {
        story: "disabled=true aplica has-disabled:opacity-50 e bloqueia interação.",
      },
    },
  },
  render: () => (
    <div className="space-y-2">
      <label htmlFor="otp-disabled" className="text-sm font-medium">
        Código (desabilitado)
      </label>
      <InputOTP
        id="otp-disabled"
        maxLength={6}
        value="42"
        onChange={() => {}}
        disabled
        autoComplete="one-time-code"
        inputMode="numeric"
        aria-label="Código desabilitado"
      >
        <InputOTPGroup>
          {slotsArray(6).map((_, i) => (
            <InputOTPSlot key={i} index={i} />
          ))}
        </InputOTPGroup>
      </InputOTP>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    await step("Input com atributo disabled", async () => {
      const input = findOtpInput(canvasElement);
      await expect(input).toBeDisabled();
    });
  },
};

export const Erro: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "aria-invalid=true aplica borda border-destructive e ring vermelho. Mensagem conectada via aria-describedby.",
      },
    },
  },
  render: () => (
    <div className="space-y-2">
      <label htmlFor="otp-error" className="text-sm font-medium">
        Código (erro)
      </label>
      <InputOTP
        id="otp-error"
        maxLength={6}
        value="111"
        onChange={() => {}}
        aria-invalid="true"
        aria-describedby="otp-error-msg"
        autoComplete="one-time-code"
        inputMode="numeric"
        aria-label="Código com erro"
      >
        <InputOTPGroup>
          {slotsArray(6).map((_, i) => (
            <InputOTPSlot key={i} index={i} />
          ))}
        </InputOTPGroup>
      </InputOTP>
      <p id="otp-error-msg" className="text-xs text-destructive">
        Código incorreto. Verifique e tente novamente.
      </p>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Input com aria-invalid=true", async () => {
      const input = findOtpInput(canvasElement);
      await expect(input).toHaveAttribute("aria-invalid", "true");
    });
    await step("Mensagem de erro associada via aria-describedby", async () => {
      const msg = canvas.getByText(/Código incorreto/i);
      await expect(msg).toHaveAttribute("id", "otp-error-msg");
    });
  },
};
