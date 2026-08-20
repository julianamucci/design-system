import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { userEvent, expect } from "storybook/test";
import { razao } from "@shared/testing/cor";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "./input-otp";
import { campo } from "./input-otp.fixtures";

const meta = {
  title: "UI/InputOTP/States",
  tags: ["form"],
  component: InputOTP,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          "Estados canônicos do InputOTP: Vazio, Preenchendo (3 de 6), Completo (6 de 6), Desabilitado e Erro.",
      },
    },
  },
} satisfies Meta<typeof InputOTP>;

export default meta;
type Story = StoryObj<typeof InputOTP>;

const seis = Array.from({ length: 6 });

const caixas = (canvasElement: HTMLElement): HTMLElement[] => [
  ...canvasElement.querySelectorAll<HTMLElement>('[data-slot="input-otp-slot"]'),
];

const textos = (canvasElement: HTMLElement): string[] =>
  caixas(canvasElement).map((c) => c.textContent?.trim() ?? "");

export const Empty: Story = {
  parameters: {
    covers: ["visual.item1"],
    docs: { description: { story: "Nenhuma caixa preenchida, com o campo já em foco." } },
  },
  render: () => (
    <div className="nds-stack" data-spacing="sm">
      <label htmlFor="otp-empty" className="nds-text-label">
        Código de verificação
      </label>
      <InputOTP
        id="otp-empty"
        maxLength={6}
        value=""
        onChange={() => {}}
        autoFocus
        autoComplete="one-time-code"
        inputMode="numeric"
      >
        <InputOTPGroup>
          {seis.map((_, i) => (
            <InputOTPSlot key={i} index={i} />
          ))}
        </InputOTPGroup>
      </InputOTP>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    await step("Nasce vazio com o campo pronto para receber", async () => {
      await expect(caixas(canvasElement)).toHaveLength(6);
      await expect(textos(canvasElement).join("")).toBe("");
      await expect(campo(canvasElement)).toHaveFocus();
    });
  },
};

export const Filling: Story = {
  parameters: {
    covers: ["visual.item2", "accessibility.item6"],
    docs: { description: { story: "Parcialmente preenchido — 3 de 6 caixas." } },
  },
  render: () => {
    const Demo = () => {
      const [value, setValue] = useState("123");
      return (
        <div className="nds-stack" data-spacing="sm">
          <label htmlFor="otp-filling" className="nds-text-label">
            Código de verificação
          </label>
          <InputOTP
            id="otp-filling"
            maxLength={6}
            value={value}
            onChange={setValue}
            autoComplete="one-time-code"
            inputMode="numeric"
          >
            <InputOTPGroup>
              {seis.map((_, i) => (
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
    await step("O valor inicial se distribui da esquerda para a direita", async () => {
      await expect(textos(canvasElement)).toEqual(["1", "2", "3", "", "", ""]);
    });

    await step("O dígito tem contraste suficiente contra a caixa", async () => {
      // Uma caixa pequena com um caractere só: se o contraste cair, não há
      // palavra em volta para compensar pelo contexto. Conta WCAG do colhedor
      // compartilhado, não olhômetro nem comparação de nome de token.
      const cs = getComputedStyle(caixas(canvasElement)[0]);
      const medida = razao(cs.color, cs.backgroundColor);
      await expect(medida?.razao ?? 0).toBeGreaterThanOrEqual(4.5);
    });
  },
};

export const Complete: Story = {
  parameters: {
    covers: ["visual.item3"],
    docs: { description: { story: "Todas as 6 caixas preenchidas." } },
  },
  render: () => {
    const Demo = () => {
      const [value, setValue] = useState("482913");
      return (
        <div className="nds-stack" data-spacing="sm">
          <label htmlFor="otp-complete" className="nds-text-label">
            Código de verificação
          </label>
          <InputOTP
            id="otp-complete"
            maxLength={6}
            value={value}
            onChange={setValue}
            autoComplete="one-time-code"
            inputMode="numeric"
          >
            <InputOTPGroup>
              {seis.map((_, i) => (
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
    await step("Todas as caixas preenchidas, na ordem do código", async () => {
      await expect(textos(canvasElement).join("")).toBe("482913");
    });
  },
};

export const Disabled: Story = {
  parameters: {
    covers: ["functional.item6"],
    docs: { description: { story: "Bloqueado: não aceita foco nem digitação, e o campo esmaece." } },
  },
  render: () => (
    <div className="nds-stack" data-spacing="sm">
      <label htmlFor="otp-disabled" className="nds-text-label">
        Código de verificação
      </label>
      <InputOTP
        id="otp-disabled"
        maxLength={6}
        value="4829"
        onChange={() => {}}
        disabled
        autoComplete="one-time-code"
        inputMode="numeric"
      >
        <InputOTPGroup>
          {seis.map((_, i) => (
            <InputOTPSlot key={i} index={i} />
          ))}
        </InputOTPGroup>
      </InputOTP>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    await step("O campo não aceita foco nem digitação", async () => {
      const input = campo(canvasElement);
      await expect(input).toBeDisabled();
      await userEvent.click(input);
      await expect(input).not.toHaveFocus();
      await expect(textos(canvasElement).join("")).toBe("4829");
    });

    await step("O bloqueio também se vê", async () => {
      // Efeito computado: a folha esmaece o campo inteiro. Medir a opacidade é
      // o que prova que a cascata chegou — nome de classe não prova nada.
      const container = canvasElement.querySelector<HTMLElement>(".nds-input-otp-container")!;
      await expect(Number(getComputedStyle(container).opacity)).toBeLessThan(1);
    });
  },
};

export const Error: Story = {
  parameters: {
    covers: ["functional.item7", "accessibility.item5", "visual.item4"],
    docs: {
      description: {
        story:
          "Erro: aria-invalid marca o campo, a borda troca para a cor de erro e a mensagem vem conectada por aria-describedby.",
      },
    },
  },
  render: () => (
    <div className="nds-stack" data-spacing="sm">
      <label htmlFor="otp-error" className="nds-text-label">
        Código de verificação
      </label>
      <div data-testid="com-erro">
        <InputOTP
          id="otp-error"
          maxLength={6}
          value="482913"
          onChange={() => {}}
          aria-invalid="true"
          aria-describedby="otp-error-msg"
          autoComplete="one-time-code"
          inputMode="numeric"
        >
          <InputOTPGroup>
            {seis.map((_, i) => (
              <InputOTPSlot key={i} index={i} />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>
      <p id="otp-error-msg" className="nds-text-caption nds-text-destructive">
        Código incorreto. Verifique e tente novamente.
      </p>

      <p id="otp-ok-label" className="nds-text-caption nds-text-muted-foreground">
        Comparação — sem erro
      </p>
      <div data-testid="sem-erro">
        <InputOTP
          id="otp-ok"
          aria-labelledby="otp-ok-label"
          maxLength={6}
          value="482913"
          onChange={() => {}}
          autoComplete="one-time-code"
          inputMode="numeric"
        >
          <InputOTPGroup>
            {seis.map((_, i) => (
              <InputOTPSlot key={i} index={i} />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const comErro = canvasElement.querySelector<HTMLElement>('[data-testid="com-erro"]')!;
    const semErro = canvasElement.querySelector<HTMLElement>('[data-testid="sem-erro"]')!;

    await step("O erro é anunciado por ARIA, não só pela borda", async () => {
      await expect(campo(comErro)).toHaveAttribute("aria-invalid", "true");
    });

    await step("A mensagem de erro está ligada ao campo", async () => {
      await expect(campo(comErro)).toHaveAttribute("aria-describedby", "otp-error-msg");
      await expect(canvasElement.querySelector("#otp-error-msg")).toBeTruthy();
    });

    await step("A borda da caixa troca para a cor de erro", async () => {
      // Comparação contra uma SEGUNDA instância sem erro: mexer no atributo da
      // primeira deixaria a asserção medindo o mesmo estado dos dois lados.
      const bordaComErro = getComputedStyle(caixas(comErro)[0]).borderTopColor;
      const bordaSemErro = getComputedStyle(caixas(semErro)[0]).borderTopColor;
      await expect(bordaComErro).not.toBe(bordaSemErro);
    });
  },
};
