import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import { userEvent, expect } from 'storybook/test';
import { ratio } from '@shared/testing/cor';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from './index';
import { campo } from './input-otp.fixtures';
import {
  inputOtpCompletoSource,
  inputOtpWithErrorSource,
  inputOtpDisabledSource,
  inputOtpPreenchendoSource,
  inputOtpEmptySource,
} from './input-otp.source';

const meta = {
  title: 'UI/InputOTP/States',
  component: InputOTP,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: inputOtpEmptySource },
      description: {
        component:
          'Estados canônicos do InputOTP: Vazio, Preenchendo (3 de 6), Completo (6 de 6), Desabilitado e Erro.',
      },
    },
  },
} satisfies Meta<typeof InputOTP>;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedComponents = { InputOTP, InputOTPGroup, InputOTPSlot };

const boxes = (raiz: HTMLElement): HTMLElement[] => [
  ...raiz.querySelectorAll<HTMLElement>('[data-slot="input-otp-slot"]'),
];

const texts = (raiz: HTMLElement): string[] =>
  boxes(raiz).map((c) => c.textContent?.trim() ?? '');

export const Empty: Story = {
  parameters: {
    covers: ['visual.item1'],
    docs: { description: { story: 'Nenhuma caixa preenchida, com o campo já em foco.' } },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      return { value: ref('') };
    },
    template: `
      <div style="contain: layout" class="nds-stack nds-min-h-20" data-spacing="sm">
        <label for="otp-empty" class="nds-text-label">Código de verificação</label>
        <InputOTP id="otp-empty" :max-length="6" v-model="value" :auto-focus="true"
                  autocomplete="one-time-code" inputmode="numeric">
          <template #default="{ slots }">
            <InputOTPGroup>
              <InputOTPSlot v-for="(slot, index) in slots" :key="index" :index="index" />
            </InputOTPGroup>
          </template>
        </InputOTP>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Nasce vazio com o campo pronto para receber', async () => {
      await expect(boxes(canvasElement)).toHaveLength(6);
      await expect(texts(canvasElement).join('')).toBe('');
      await expect(campo(canvasElement)).toHaveFocus();
    });
  },
};

export const Filling: Story = {
  parameters: {
    covers: ['visual.item2', 'accessibility.item6'],
    docs: {
      // O valor inicial É o estado, e ele mora no `ref`, não num atributo — a
      // do `meta` nasce vazia.
      source: { transform: inputOtpPreenchendoSource },
      description: { story: 'Parcialmente preenchido — 3 de 6 caixas.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      return { value: ref('123') };
    },
    template: `
      <div style="contain: layout" class="nds-stack nds-min-h-20" data-spacing="sm">
        <label for="otp-filling" class="nds-text-label">Código de verificação</label>
        <InputOTP id="otp-filling" :max-length="6" v-model="value"
                  autocomplete="one-time-code" inputmode="numeric">
          <template #default="{ slots }">
            <InputOTPGroup>
              <InputOTPSlot v-for="(slot, index) in slots" :key="index" :index="index" />
            </InputOTPGroup>
          </template>
        </InputOTP>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('O valor inicial se distribui da esquerda para a direita', async () => {
      await expect(texts(canvasElement)).toEqual(['1', '2', '3', '', '', '']);
    });

    await step('O dígito tem contraste suficiente contra a caixa', async () => {
      // Uma caixa pequena com um caractere só: se o contraste cair, não há
      // palavra em volta para compensar pelo contexto. Conta WCAG do colhedor
      // compartilhado, não olhômetro nem nome de token.
      const cs = getComputedStyle(boxes(canvasElement)[0]);
      const measurement = ratio(cs.color, cs.backgroundColor);
      await expect(measurement?.ratio ?? 0).toBeGreaterThanOrEqual(4.5);
    });
  },
};

export const Complete: Story = {
  parameters: {
    covers: ['visual.item3'],
    docs: {
      // Mesmo motivo do preenchendo: o que muda é o valor inicial do estado.
      source: { transform: inputOtpCompletoSource },
      description: { story: 'Todas as 6 caixas preenchidas.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      return { value: ref('482913') };
    },
    template: `
      <div style="contain: layout" class="nds-stack nds-min-h-20" data-spacing="sm">
        <label for="otp-complete" class="nds-text-label">Código de verificação</label>
        <InputOTP id="otp-complete" :max-length="6" v-model="value"
                  autocomplete="one-time-code" inputmode="numeric">
          <template #default="{ slots }">
            <InputOTPGroup>
              <InputOTPSlot v-for="(slot, index) in slots" :key="index" :index="index" />
            </InputOTPGroup>
          </template>
        </InputOTP>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Todas as caixas preenchidas, na ordem do código', async () => {
      await expect(texts(canvasElement).join('')).toBe('482913');
    });
  },
};

export const Disabled: Story = {
  parameters: {
    covers: ['functional.item6'],
    docs: {
      // O atributo que bloqueia o campo é a story inteira.
      source: { transform: inputOtpDisabledSource },
      description: { story: 'Bloqueado: não aceita foco nem digitação, e o campo esmaece.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      return { value: ref('4829') };
    },
    template: `
      <div style="contain: layout" class="nds-stack nds-min-h-20" data-spacing="sm">
        <label for="otp-disabled" class="nds-text-label">Código de verificação</label>
        <InputOTP id="otp-disabled" :max-length="6" :disabled="true" v-model="value"
                  autocomplete="one-time-code" inputmode="numeric">
          <template #default="{ slots }">
            <InputOTPGroup>
              <InputOTPSlot v-for="(slot, index) in slots" :key="index" :index="index" />
            </InputOTPGroup>
          </template>
        </InputOTP>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('O campo não aceita foco nem digitação', async () => {
      const input = campo(canvasElement);
      await expect(input).toBeDisabled();
      await userEvent.click(input);
      await expect(input).not.toHaveFocus();
      await expect(texts(canvasElement).join('')).toBe('4829');
    });

    await step('O bloqueio também se vê', async () => {
      // Efeito computado: a folha esmaece o campo inteiro. Medir a opacidade é
      // o que prova que a cascata chegou — nome de classe não prova nada.
      const container = canvasElement.querySelector<HTMLElement>('.nds-input-otp-container')!;
      await expect(Number(getComputedStyle(container).opacity)).toBeLessThan(1);
    });
  },
};

export const Error: Story = {
  parameters: {
    covers: ['functional.item7', 'accessibility.item5', 'visual.item4'],
    docs: {
      // O par aria-invalid + mensagem conectada é o assunto. A SEGUNDA
      // instância que a story monta existe só para a play comparar bordas —
      // andaime de medição, fora do snippet.
      source: { transform: inputOtpWithErrorSource },
      description: {
        story:
          'Erro: aria-invalid marca o campo, a borda troca para a cor de erro e a mensagem vem conectada por aria-describedby.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      return { withError: ref('482913'), noError: ref('482913') };
    },
    template: `
      <div style="contain: layout" class="nds-stack nds-min-h-40" data-spacing="sm">
        <label for="otp-error" class="nds-text-label">Código de verificação</label>
        <div data-testid="com-erro">
          <InputOTP id="otp-error" :max-length="6" v-model="withError"
                    aria-invalid="true" aria-describedby="otp-error-msg"
                    autocomplete="one-time-code" inputmode="numeric">
            <template #default="{ slots }">
              <InputOTPGroup>
                <InputOTPSlot v-for="(slot, index) in slots" :key="index" :index="index" />
              </InputOTPGroup>
            </template>
          </InputOTP>
        </div>
        <p id="otp-error-msg" class="nds-text-caption nds-text-destructive">
          Código incorreto. Verifique e tente novamente.
        </p>

        <p id="otp-ok-label" class="nds-text-caption nds-text-muted-foreground">
          Comparação — sem erro
        </p>
        <div data-testid="sem-erro">
          <InputOTP id="otp-ok" aria-labelledby="otp-ok-label" :max-length="6" v-model="noError"
                    autocomplete="one-time-code" inputmode="numeric">
            <template #default="{ slots }">
              <InputOTPGroup>
                <InputOTPSlot v-for="(slot, index) in slots" :key="index" :index="index" />
              </InputOTPGroup>
            </template>
          </InputOTP>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const withError = canvasElement.querySelector<HTMLElement>('[data-testid="com-erro"]')!;
    const noError = canvasElement.querySelector<HTMLElement>('[data-testid="sem-erro"]')!;

    await step('O erro é anunciado por ARIA, não só pela borda', async () => {
      await expect(campo(withError)).toHaveAttribute('aria-invalid', 'true');
    });

    await step('A mensagem de erro está ligada ao campo', async () => {
      await expect(campo(withError)).toHaveAttribute('aria-describedby', 'otp-error-msg');
      await expect(canvasElement.querySelector('#otp-error-msg')).toBeTruthy();
    });

    await step('A borda da caixa troca para a cor de erro', async () => {
      // Comparação contra uma SEGUNDA instância sem erro: mexer no atributo da
      // primeira deixaria a asserção medindo o mesmo estado dos dois lados.
      const borderWithError = getComputedStyle(boxes(withError)[0]).borderTopColor;
      const borderNoError = getComputedStyle(boxes(noError)[0]).borderTopColor;
      await expect(borderWithError).not.toBe(borderNoError);
    });
  },
};
