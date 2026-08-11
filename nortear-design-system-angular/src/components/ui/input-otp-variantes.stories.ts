import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent } from 'storybook/test';
import { NdsInputOtp } from './input-otp';

/**
 * Formatos de código. Cada story afirma o resultado do input que a diferencia
 * — número de slots, teclado, separador. É o que impede a armadilha 1 do
 * CLAUDE.md deste stack: sob JIT o componente renderiza com os defaults e uma
 * story que só olha a aparência passa.
 */
const meta: Meta = {
  title: 'UI/InputOTP/Variants',
  decorators: [moduleMetadata({ imports: [NdsInputOtp] })],
  parameters: { layout: 'padded', controls: { disable: true } },
};

export default meta;
type Story = StoryObj;

const slotsDe = (raiz: HTMLElement): HTMLInputElement[] => [
  ...raiz.querySelectorAll<HTMLInputElement>('[data-slot="input-otp-slot"]'),
];

export const SixDigits: Story = {
  render: () => ({
    template: `
      <div class="nds-stack" data-spacing="sm">
        <span id="v6-label" class="nds-text-label">Código enviado por SMS</span>
        <nds-input-otp aria-labelledby="v6-label" [maxLength]="6"></nds-input-otp>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Seis slots, teclado numérico', async () => {
      const slots = slotsDe(canvasElement);
      await expect(slots).toHaveLength(6);
      await expect(slots[0]).toHaveClass(/nds-input-otp-slot/);
      await expect(slots[0]).toHaveAttribute('inputmode', 'numeric');
    });

    await step('Letra não entra no modo numérico', async () => {
      const slots = slotsDe(canvasElement);
      slots[0].focus();
      await userEvent.keyboard('a');
      await expect(slots[0].value).toBe('');
      await userEvent.keyboard('7');
      await expect(slots[0].value).toBe('7');
    });
  },
};

export const FourDigits: Story = {
  render: () => ({
    template: `
      <div class="nds-stack" data-spacing="sm">
        <span id="v4-label" class="nds-text-label">PIN do aplicativo</span>
        <nds-input-otp aria-labelledby="v4-label" [maxLength]="4"></nds-input-otp>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('O maxLength ligado chega ao componente', async () => {
      // Quatro e não seis: se o binding não chegasse, o default do componente
      // renderizaria seis slots e nada no visual denunciaria.
      await expect(slotsDe(canvasElement)).toHaveLength(4);
    });
  },
};

export const WithSeparator: Story = {
  parameters: { covers: ['accessibility.item4', 'visual.item5'] },
  render: () => ({
    props: { separadores: [3] },
    template: `
      <div class="nds-stack" data-spacing="sm">
        <span id="vs-label" class="nds-text-label">Código de recuperação</span>
        <nds-input-otp
          aria-labelledby="vs-label"
          [maxLength]="6"
          [separatorAt]="separadores"
        ></nds-input-otp>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O separador tem papel próprio, não é enfeite escondido', async () => {
      // `role="separator"` é o que informa ao leitor que o código vem em dois
      // blocos de três — seis dígitos ditos de enfiada são mais difíceis de
      // conferir contra o SMS.
      const separadores = canvas.getAllByRole('separator');
      await expect(separadores).toHaveLength(1);
      await expect(separadores[0]).toHaveClass(/nds-input-otp-separator/);
    });

    await step('O separador fica entre o terceiro e o quarto slot', async () => {
      const filhos = [...canvasElement.querySelectorAll('nds-input-otp > *')];
      const posicao = filhos.findIndex((el) => el.matches('[data-slot="input-otp-separator"]'));
      await expect(posicao).toBe(3);
      await expect(slotsDe(canvasElement)).toHaveLength(6);
    });
  },
};

export const Alphanumeric: Story = {
  render: () => ({
    template: `
      <div class="nds-stack" data-spacing="sm">
        <span id="va-label" class="nds-text-label">Código de autenticação</span>
        <nds-input-otp aria-labelledby="va-label" [maxLength]="6" mode="alphanumeric"></nds-input-otp>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('O teclado do dispositivo passa a ser de texto', async () => {
      await expect(slotsDe(canvasElement)[0]).toHaveAttribute('inputmode', 'text');
    });

    await step('Letra e dígito são aceitos', async () => {
      const slots = slotsDe(canvasElement);
      slots[0].focus();
      await userEvent.keyboard('a9');
      await expect(slots[0].value).toBe('a');
      await expect(slots[1].value).toBe('9');
    });
  },
};
