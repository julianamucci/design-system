import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { userEvent, expect, waitFor } from "storybook/test";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "./input-otp";

const meta = {
  title: "UI/InputOTP/Variantes",
  tags: ["form"],
  component: InputOTP,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Variantes do InputOTP: SeisDigitos (default SMS), QuatroDigitos (PIN), ComSeparator (3+3) e Alfanumerico.",
      },
    },
  },
} satisfies Meta<typeof InputOTP>;

export default meta;
type Story = StoryObj<typeof InputOTP>;

function findOtpInput(canvasElement: HTMLElement): HTMLInputElement {
  const input = canvasElement.querySelector(
    'input[autocomplete="one-time-code"]'
  ) as HTMLInputElement | null;
  if (!input) throw new Error("OTP input não encontrado");
  return input;
}

export const SeisDigitos: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "6 dígitos — padrão para códigos OTP por SMS/email; inputMode=numeric e autoComplete=one-time-code.",
      },
    },
  },
  render: () => {
    const Demo = () => {
      const [value, setValue] = useState("");
      return (
        <div className="space-y-2">
          <label htmlFor="otp-six" className="text-sm font-medium">
            Código de 6 dígitos
          </label>
          <InputOTP
            id="otp-six"
            maxLength={6}
            value={value}
            onChange={setValue}
            autoComplete="one-time-code"
            inputMode="numeric"
            aria-label="Código de 6 dígitos"
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
    await step("Aceita 6 dígitos numéricos", async () => {
      const input = findOtpInput(canvasElement);
      input.focus();
      await userEvent.type(input, "123456");
      await waitFor(() => expect(input).toHaveValue("123456"));
    });
  },
};

export const QuatroDigitos: Story = {
  parameters: {
    docs: {
      description: {
        story: "PIN de 4 dígitos — usado para PINs locais (carteira, app travado).",
      },
    },
  },
  render: () => {
    const Demo = () => {
      const [value, setValue] = useState("");
      return (
        <div className="space-y-2">
          <label htmlFor="otp-four" className="text-sm font-medium">
            PIN de 4 dígitos
          </label>
          <InputOTP
            id="otp-four"
            maxLength={4}
            value={value}
            onChange={setValue}
            autoComplete="one-time-code"
            inputMode="numeric"
            aria-label="PIN de 4 dígitos"
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
    await step("Aceita 4 dígitos", async () => {
      const input = findOtpInput(canvasElement);
      input.focus();
      await userEvent.type(input, "1234");
      await waitFor(() => expect(input).toHaveValue("1234"));
    });
  },
};

export const ComSeparator: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Dois grupos de 3 slots separados por InputOTPSeparator (role=separator) — formato xxx-xxx para códigos de backup.",
      },
    },
  },
  render: () => {
    const Demo = () => {
      const [value, setValue] = useState("");
      return (
        <div className="space-y-2">
          <label htmlFor="otp-sep" className="text-sm font-medium">
            Código com separator (3+3)
          </label>
          <InputOTP
            id="otp-sep"
            maxLength={6}
            value={value}
            onChange={setValue}
            autoComplete="one-time-code"
            inputMode="numeric"
            aria-label="Código de backup"
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
    await step("Separator possui role=separator", async () => {
      const sep = canvasElement.querySelector('[role="separator"]');
      await expect(sep).toBeTruthy();
    });
    await step("Aceita 6 dígitos distribuídos entre grupos", async () => {
      const input = findOtpInput(canvasElement);
      input.focus();
      await userEvent.type(input, "123456");
      await waitFor(() => expect(input).toHaveValue("123456"));
    });
  },
};

export const Alfanumerico: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "pattern=REGEXP_ONLY_DIGITS_AND_CHARS, inputMode=text — auth codes alfanuméricos (ex: GitHub).",
      },
    },
  },
  render: () => {
    const Demo = () => {
      const [value, setValue] = useState("");
      return (
        <div className="space-y-2">
          <label htmlFor="otp-alpha" className="text-sm font-medium">
            Código alfanumérico
          </label>
          <InputOTP
            id="otp-alpha"
            maxLength={6}
            value={value}
            onChange={setValue}
            pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
            autoComplete="one-time-code"
            inputMode="text"
            aria-label="Código alfanumérico"
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
    await step("Aceita caracteres alfanuméricos", async () => {
      const input = findOtpInput(canvasElement);
      input.focus();
      await userEvent.type(input, "AB12CD");
      await waitFor(() =>
        expect(input.value.toUpperCase()).toMatch(/^[A-Z0-9]{6}$/)
      );
    });
  },
};

