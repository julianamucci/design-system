import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { within, expect } from "storybook/test";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "./input-otp";

const meta = {
  title: "UI/InputOTP/States",
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

export const Empty: Story = {
  parameters: {
    docs: {
      description: { story: "Nenhum slot preenchido. value=''." },
    },
  },
  render: () => (
    <div className="nds-stack" data-spacing="sm">
      <label htmlFor="otp-empty" className="nds-text-body nds-font-medium">
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

export const Filling: Story = {
  parameters: {
    docs: {
      description: { story: "Parcialmente preenchido (3 de 6 slots)." },
    },
  },
  render: () => {
    const Demo = () => {
      const [value, setValue] = useState("123");
      return (
        <div className="nds-stack" data-spacing="sm">
          <label htmlFor="otp-filling" className="nds-text-body nds-font-medium">
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

export const Complete: Story = {
  parameters: {
    docs: {
      description: { story: "Todos os 6 slots preenchidos (onComplete já disparou)." },
    },
  },
  render: () => {
    const Demo = () => {
      const [value, setValue] = useState("123456");
      return (
        <div className="nds-stack" data-spacing="sm">
          <label htmlFor="otp-complete" className="nds-text-body nds-font-medium">
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

export const Disabled: Story = {
  parameters: {
    docs: {
      description: {
        story: "disabled=true aplica has-disabled:opacity-50 e bloqueia interação.",
      },
    },
  },
  render: () => (
    <div className="nds-stack" data-spacing="sm">
      <label htmlFor="otp-disabled" className="nds-text-body nds-font-medium">
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

export const Error: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "aria-invalid=true aplica borda border-destructive e ring vermelho. Mensagem conectada via aria-describedby.",
      },
    },
  },
  render: () => (
    <div className="nds-stack" data-spacing="sm">
      <label htmlFor="otp-error" className="nds-text-body nds-font-medium">
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
      <p id="otp-error-msg" className="nds-text-caption nds-text-destructive">
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
