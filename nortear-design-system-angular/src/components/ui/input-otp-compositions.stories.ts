import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent } from 'storybook/test';
import { NdsInputOtp } from './input-otp';
import { NdsButton } from './button';

const meta: Meta = {
  title: 'Primitives/Form/InputOTP/Compositions',
  tags: ['form'],
  decorators: [moduleMetadata({ imports: [NdsInputOtp, NdsButton] })],
  parameters: { layout: 'padded', controls: { disable: true } },
};

export default meta;
type Story = StoryObj;

const slotsDe = (root: HTMLElement): HTMLInputElement[] => [
  ...root.querySelectorAll<HTMLInputElement>('[data-slot="input-otp-slot"]'),
];

export const WithLabel: Story = {
  render: () => ({
    template: `
      <div class="nds-stack" data-spacing="sm">
        <span id="comp-label-texto" class="nds-text-label">Código de verificação</span>
        <nds-input-otp aria-labelledby="comp-label-texto" [maxLength]="6"></nds-input-otp>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O rótulo visível é o nome do conjunto', async () => {
      // `aria-labelledby` tem precedência sobre o `aria-label` padrão do
      // componente — o texto que a pessoa vê é o mesmo que o leitor anuncia.
      await expect(canvas.getByRole('group', { name: 'Código de verificação' })).toBeTruthy();
    });
  },
};

export const WithHelpText: Story = {
  render: () => ({
    template: `
      <div class="nds-stack" data-spacing="sm">
        <span id="comp-ajuda-label" class="nds-text-label">Código de verificação</span>
        <nds-input-otp
          aria-labelledby="comp-ajuda-label"
          describedBy="comp-ajuda-texto"
          [maxLength]="6"
        ></nds-input-otp>
        <p id="comp-ajuda-texto" class="nds-text-caption nds-text-muted-foreground">
          Enviamos por SMS, expira em 5 min.
        </p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('A ajuda é lida junto com o campo', async () => {
      const slot = slotsDe(canvasElement)[0];
      await expect(slot).toHaveAttribute('aria-describedby', 'comp-ajuda-texto');
      await expect(canvasElement.querySelector('#comp-ajuda-texto')?.textContent).toContain('SMS');
    });
  },
};

export const WithErrorMessage: Story = {
  render: () => ({
    props: { code: '482913' },
    template: `
      <div class="nds-stack" data-spacing="sm">
        <span id="comp-erro-label" class="nds-text-label">Código de verificação</span>
        <nds-input-otp
          aria-labelledby="comp-erro-label"
          describedBy="comp-erro-texto"
          [maxLength]="6"
          [value]="code"
          [invalid]="true"
        ></nds-input-otp>
        <p id="comp-erro-texto" class="nds-text-caption nds-text-destructive">
          Código incorreto. Verifique e tente novamente.
        </p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Causa e ação corretiva chegam pelo mesmo caminho do erro', async () => {
      const slot = slotsDe(canvasElement)[0];
      await expect(slot).toHaveAttribute('aria-invalid', 'true');
      await expect(slot).toHaveAttribute('aria-describedby', 'comp-erro-texto');
      await expect(canvasElement.querySelector('#comp-erro-texto')?.textContent).toContain(
        'tente novamente',
      );
    });
  },
};

export const WithResendButton: Story = {
  render: () => ({
    template: `
      <div class="nds-stack" data-spacing="sm">
        <span id="comp-reenvio-label" class="nds-text-label">Código de verificação</span>
        <nds-input-otp aria-labelledby="comp-reenvio-label" [maxLength]="6"></nds-input-otp>
        <div class="nds-cluster" data-spacing="sm" data-align="center">
          <span class="nds-text-caption nds-text-muted-foreground">Não recebeu?</span>
          <button ndsButton variant="link" size="sm" type="button">Reenviar código</button>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O reenvio é alcançável pelo teclado depois do último slot', async () => {
      // O botão vem DEPOIS do campo na ordem do DOM: quem chega ao fim do
      // código encontra o reenvio no próximo Tab, sem voltar pelo caminho.
      const slots = slotsDe(canvasElement);
      slots[slots.length - 1].focus();
      await userEvent.tab();
      await expect(canvas.getByRole('button', { name: 'Reenviar código' })).toHaveFocus();
    });
  },
};
