import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { userEvent, expect } from "storybook/test";
import { ratio } from "@shared/testing/cor";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "./input-otp";
import { field } from "./input-otp.fixtures";
import {
  inputOtpCompletoSource,
  inputOtpWithErrorSource,
  inputOtpDisabledSource,
  inputOtpPreenchendoSource,
  inputOtpSource,
  inputOtpEmptySource,
} from "./input-otp.source";

const meta = {
  title: "UI/InputOTP/States",
  tags: ["form"],
  component: InputOTP,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cada estado deste arquivo nasce de um valor inicial ou de um atributo
      // que os controls desligados não descrevem: todos declaram a sua.
      source: { transform: inputOtpSource },
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

const boxes = (canvasElement: HTMLElement): HTMLElement[] => [
  ...canvasElement.querySelectorAll<HTMLElement>('[data-slot="input-otp-slot"]'),
];

const texts = (canvasElement: HTMLElement): string[] =>
  boxes(canvasElement).map((c) => c.textContent?.trim() ?? "");

export const Empty: Story = {
  parameters: {
    covers: ["visual.item1"],
    docs: {
      // O `autoFocus` é o que a story documenta, e ele não vem de arg aqui.
      source: { transform: inputOtpEmptySource },
      description: { story: "Nenhuma caixa preenchida, com o campo já em foco." },
    },
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
      await expect(boxes(canvasElement)).toHaveLength(6);
      await expect(texts(canvasElement).join("")).toBe("");
      await expect(field(canvasElement)).toHaveFocus();
    });
  },
};

export const Filling: Story = {
  parameters: {
    covers: ["visual.item2", "accessibility.item6"],
    docs: {
      // O valor inicial parcial é o assunto: é ele que mostra a distribuição da
      // esquerda para a direita, e o snippet vazio a esconderia.
      source: { transform: inputOtpPreenchendoSource },
      description: { story: "Parcialmente preenchido — 3 de 6 caixas." },
    },
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
      await expect(texts(canvasElement)).toEqual(["1", "2", "3", "", "", ""]);
    });

    await step("O dígito tem contraste suficiente contra a caixa", async () => {
      // Uma caixa pequena com um caractere só: se o contraste cair, não há
      // palavra em volta para compensar pelo contexto. Conta WCAG do colhedor
      // compartilhado, não olhômetro nem comparação de nome de token.
      const cs = getComputedStyle(boxes(canvasElement)[0]);
      const measurement = ratio(cs.color, cs.backgroundColor);
      await expect(measurement?.ratio ?? 0).toBeGreaterThanOrEqual(4.5);
    });
  },
};

export const Complete: Story = {
  parameters: {
    covers: ["visual.item3"],
    docs: {
      // As seis posições ocupadas é justamente quando `onComplete` dispara — o
      // snippet mostra o valor cheio junto com o callback.
      source: { transform: inputOtpCompletoSource },
      description: { story: "Todas as 6 caixas preenchidas." },
    },
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
      await expect(texts(canvasElement).join("")).toBe("482913");
    });
  },
};

export const Disabled: Story = {
  parameters: {
    covers: ["functional.item6"],
    docs: {
      // O `disabled` é o assunto e não vem de arg: os controls estão desligados.
      source: { transform: inputOtpDisabledSource },
      description: { story: "Bloqueado: não aceita foco nem digitação, e o campo esmaece." },
    },
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
      const input = field(canvasElement);
      await expect(input).toBeDisabled();
      await userEvent.click(input);
      await expect(input).not.toHaveFocus();
      await expect(texts(canvasElement).join("")).toBe("4829");
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
      // A story monta DOIS campos só para comparar bordas; o exemplo que se
      // copia é um só, com as marcas de ARIA e a mensagem ligada.
      source: { transform: inputOtpWithErrorSource },
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
    const withError = canvasElement.querySelector<HTMLElement>('[data-testid="com-erro"]')!;
    const noError = canvasElement.querySelector<HTMLElement>('[data-testid="sem-erro"]')!;

    await step("O erro é anunciado por ARIA, não só pela borda", async () => {
      await expect(field(withError)).toHaveAttribute("aria-invalid", "true");
    });

    await step("A mensagem de erro está ligada ao campo", async () => {
      await expect(field(withError)).toHaveAttribute("aria-describedby", "otp-error-msg");
      await expect(canvasElement.querySelector("#otp-error-msg")).toBeTruthy();
    });

    await step("A borda da caixa troca para a cor de erro", async () => {
      // Comparação contra uma SEGUNDA instância sem erro: mexer no atributo da
      // primeira deixaria a asserção medindo o mesmo estado dos dois lados.
      const borderWithError = getComputedStyle(boxes(withError)[0]).borderTopColor;
      const borderNoError = getComputedStyle(boxes(noError)[0]).borderTopColor;
      await expect(borderWithError).not.toBe(borderNoError);
    });
  },
};
