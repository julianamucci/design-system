import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { userEvent, within, expect, waitFor } from "storybook/test";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "./input-otp";
import { InputOTPDocs } from "@/components/docs/InputOTPDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

const meta = {
  title: "UI/InputOTP",
  component: InputOTP,
  tags: ["autodocs", "form"],
  parameters: {
    layout: "centered",
    docs: { page: withAutoDocsTab(InputOTPDocs) },
  },
  argTypes: {
    maxLength: {
      control: { type: "number", min: 4, max: 8, step: 1 },
      description: "Número total de slots/caracteres do código.",
    },
    disabled: {
      control: "boolean",
      description: "Bloqueia interação e aplica opacity-50.",
    },
    autoFocus: {
      control: "boolean",
      description: "Foca o primeiro slot automaticamente ao montar.",
    },
  },
  args: {
    maxLength: 6,
    disabled: false,
    autoFocus: false,
  },
} satisfies Meta<typeof InputOTP>;

export default meta;
type Story = StoryObj<typeof InputOTP>;

export const Playground: Story = {
  render: (args) => {
    const { maxLength = 6, disabled, autoFocus } = args as {
      maxLength?: number;
      disabled?: boolean;
      autoFocus?: boolean;
    };
    const [value, setValue] = useState("");

    return (
      <div className="space-y-2">
        <label htmlFor="otp-playground" className="text-sm font-medium">
          Código de verificação
        </label>
        <InputOTP
          id="otp-playground"
          maxLength={maxLength}
          value={value}
          onChange={setValue}
          disabled={disabled}
          autoFocus={autoFocus}
          autoComplete="one-time-code"
          inputMode="numeric"
          aria-label="Código de verificação"
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Digitar 123456 dispara onComplete", async () => {
      const input =
        canvas.queryByRole("textbox") ??
        (canvasElement.querySelector(
          'input[autocomplete="one-time-code"]'
        ) as HTMLInputElement);
      await expect(input).toBeTruthy();
      input.focus();
      await userEvent.type(input, "123456");
      await waitFor(() => expect(input).toHaveValue("123456"));
    });
  },
};
