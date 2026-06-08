import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { within, expect } from "storybook/test";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "./input-otp";
import { Label } from "./label";
import { Button } from "./button";

const meta = {
  title: "UI/InputOTP/Composicoes",
  tags: ["form"],
  component: InputOTP,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Composicoes típicas: ComLabel, ComHelpText, ComErrorMessage e ComResendButton.",
      },
    },
  },
} satisfies Meta<typeof InputOTP>;

export default meta;
type Story = StoryObj<typeof InputOTP>;

const sixSlots = Array.from({ length: 6 });

function findOtpInput(canvasElement: HTMLElement): HTMLInputElement | null {
  return canvasElement.querySelector(
    'input[autocomplete="one-time-code"]'
  ) as HTMLInputElement | null;
}

export const ComLabel: Story = {
  parameters: {
    docs: {
      description: {
        story: "Label visível associado via htmlFor/id.",
      },
    },
  },
  render: () => {
    const Demo = () => {
      const [value, setValue] = useState("");
      return (
        <div className="space-y-2">
          <Label htmlFor="otp-code">Código de verificação</Label>
          <InputOTP
            id="otp-code"
            maxLength={6}
            value={value}
            onChange={setValue}
            autoComplete="one-time-code"
            inputMode="numeric"
          >
            <InputOTPGroup>
              {sixSlots.map((_, i) => (
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
    const canvas = within(canvasElement);
    await step("Label conecta via htmlFor com input id", async () => {
      const label = canvas.getByText(/Código de verificação/i);
      await expect(label).toHaveAttribute("for", "otp-code");
      const input = findOtpInput(canvasElement);
      await expect(input).toHaveAttribute("id", "otp-code");
    });
  },
};

export const ComHelpText: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Texto auxiliar conectado via aria-describedby (origem + tempo de validade).",
      },
    },
  },
  render: () => {
    const Demo = () => {
      const [value, setValue] = useState("");
      return (
        <div className="space-y-2">
          <Label htmlFor="otp-help">Código de verificação</Label>
          <InputOTP
            id="otp-help"
            maxLength={6}
            value={value}
            onChange={setValue}
            aria-describedby="otp-help-text"
            autoComplete="one-time-code"
            inputMode="numeric"
          >
            <InputOTPGroup>
              {sixSlots.map((_, i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>
          <p id="otp-help-text" className="text-xs text-muted-foreground">
            Enviamos por SMS, expira em 5 min.
          </p>
        </div>
      );
    };
    return <Demo />;
  },
  play: async ({ canvasElement, step }) => {
    await step("aria-describedby aponta para o help text", async () => {
      const input = findOtpInput(canvasElement);
      await expect(input).toHaveAttribute("aria-describedby", "otp-help-text");
      const help = canvasElement.querySelector("#otp-help-text");
      await expect(help).toBeTruthy();
    });
  },
};

export const ComErrorMessage: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "aria-invalid=true + mensagem de erro associada via aria-describedby (causa + ação corretiva).",
      },
    },
  },
  render: () => {
    const Demo = () => {
      const [value, setValue] = useState("123");
      return (
        <div className="space-y-2">
          <Label htmlFor="otp-err">Código de verificação</Label>
          <InputOTP
            id="otp-err"
            maxLength={6}
            value={value}
            onChange={setValue}
            aria-invalid="true"
            aria-describedby="otp-err-msg"
            autoComplete="one-time-code"
            inputMode="numeric"
          >
            <InputOTPGroup>
              {sixSlots.map((_, i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>
          <p id="otp-err-msg" role="alert" className="text-xs text-destructive">
            Código incorreto. Verifique e tente novamente.
          </p>
        </div>
      );
    };
    return <Demo />;
  },
  play: async ({ canvasElement, step }) => {
    await step("aria-invalid=true e aria-describedby ligam input à mensagem", async () => {
      const input = findOtpInput(canvasElement);
      await expect(input).toHaveAttribute("aria-invalid", "true");
      await expect(input).toHaveAttribute("aria-describedby", "otp-err-msg");
      const msg = canvasElement.querySelector("#otp-err-msg");
      await expect(msg?.textContent).toMatch(/Código incorreto/i);
    });
  },
};

export const ComResendButton: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "InputOTP + Button 'Reenviar código' — fluxo típico de verificação 2FA.",
      },
    },
  },
  render: () => {
    const Demo = () => {
      const [value, setValue] = useState("");
      return (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="otp-resend">Código de verificação</Label>
            <InputOTP
              id="otp-resend"
              maxLength={6}
              value={value}
              onChange={setValue}
              autoComplete="one-time-code"
              inputMode="numeric"
            >
              <InputOTPGroup>
                {sixSlots.map((_, i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
          <Button variant="outline" size="sm" type="button">
            Reenviar código
          </Button>
        </div>
      );
    };
    return <Demo />;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Label associado e botão Reenviar acessível", async () => {
      const label = canvas.getByText(/Código de verificação/i);
      await expect(label).toHaveAttribute("for", "otp-resend");
      const btn = canvas.getByRole("button", { name: /Reenviar código/i });
      await expect(btn).toBeVisible();
    });
  },
};
