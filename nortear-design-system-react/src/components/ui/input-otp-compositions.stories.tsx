import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { within, expect, userEvent } from "storybook/test";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "./input-otp";
import { Label } from "./label";
import { Button } from "./button";
import {
  inputOtpWithErrorSource,
  inputOtpWithReenvioSource,
  inputOtpWithTextAuxiliarSource,
  inputOtpSource,
} from "./input-otp.source";

const meta = {
  title: "UI/InputOTP/Compositions",
  tags: ["form"],
  component: InputOTP,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // O rótulo já faz parte do exemplo canônico — o `<input>` real fica
      // recortado atrás das caixas, e sem `htmlFor` ↔ `id` o campo não tem nome
      // acessível nenhum. Por isso a story WithLabel fica com a do `meta`.
      source: { transform: inputOtpSource },
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

export const WithLabel: Story = {
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
        <div className="nds-stack" data-spacing="sm">
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

export const WithHelpText: Story = {
  parameters: {
    docs: {
      // O parágrafo auxiliar e o `aria-describedby` que o liga são peças a mais
      // que o exemplo canônico não tem.
      source: { transform: inputOtpWithTextAuxiliarSource },
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
        <div className="nds-stack" data-spacing="sm">
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
          <p id="otp-help-text" className="nds-text-caption nds-text-muted-foreground">
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

export const WithErrorMessage: Story = {
  parameters: {
    // Mesma composição da story Error dos estados: `aria-invalid` no campo mais
    // a mensagem ligada por `aria-describedby`.
    docs: {
      source: { transform: inputOtpWithErrorSource },
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
        <div className="nds-stack" data-spacing="sm">
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
          {/* Sem `role="alert"`: a mensagem já está no DOM quando a página
              carrega, e uma live region em conteúdo estático faz o leitor
              anunciar o erro sem que nada tenha acontecido. */}
          <p id="otp-err-msg" className="nds-text-caption nds-text-destructive">
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

export const WithResendButton: Story = {
  parameters: {
    docs: {
      // O botão é peça de outro componente, e a ORDEM dele no DOM é a lição:
      // depois do campo, para cair no próximo Tab de quem terminou de digitar.
      source: { transform: inputOtpWithReenvioSource },
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
        <div className="nds-stack" data-spacing="sm">
          <div className="nds-stack" data-spacing="sm">
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
          <div className="nds-cluster" data-spacing="xs" data-align="center">
            <span className="nds-text-caption nds-text-muted-foreground">Não recebeu?</span>
            <Button variant="link" size="sm" type="button">
              Reenviar código
            </Button>
          </div>
        </div>
      );
    };
    return <Demo />;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("O reenvio é alcançável pelo teclado depois do campo", async () => {
      // O botão vem DEPOIS do campo na ordem do DOM: quem chega ao fim do
      // código encontra o reenvio no próximo Tab, sem voltar pelo caminho.
      const input = canvasElement.querySelector<HTMLInputElement>(
        'input[autocomplete="one-time-code"]'
      )!;
      input.focus();
      await userEvent.tab();
      await expect(canvas.getByRole("button", { name: "Reenviar código" })).toHaveFocus();
    });
  },
};
