import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect } from 'storybook/test';
import { NdsSwitch } from './switch';
import { NdsLabel } from './label';

const meta: Meta = {
  title: 'UI/Switch/Variants',
  decorators: [moduleMetadata({ imports: [NdsSwitch, NdsLabel] })],
  parameters: {
    // Sem argTypes nesta story: o painel Controls ficaria vazio.
    layout: 'padded',
    controls: { disable: true },
  },
};

export default meta;
type Story = StoryObj;

/**
 * As três variantes que o conteúdo compartilhado documenta: o par
 * switch + rótulo, o painel com descrição auxiliar e o degrau compacto.
 */
export const Tipos: Story = {
  parameters: { covers: ['visual.item4'] },
  render: () => ({
    template: `
      <div class="nds-stack" data-spacing="md">
        <div class="nds-cluster" data-spacing="sm">
          <button ndsSwitch id="var-default"></button>
          <label ndsLabel for="var-default">Receber notificações por email</label>
        </div>

        <div class="nds-cluster nds-w-sm nds-rounded-lg nds-border-default nds-p-2" data-justify="between">
          <div class="nds-stack" data-spacing="xs">
            <label ndsLabel for="var-marketing">Emails de marketing</label>
            <p class="nds-text-caption nds-text-muted-foreground">
              Receba novidades e promoções da plataforma.
            </p>
          </div>
          <button ndsSwitch id="var-marketing"></button>
        </div>

        <div class="nds-cluster" data-spacing="sm">
          <button ndsSwitch id="var-sm" size="sm"></button>
          <label ndsLabel for="var-sm">Tamanho compacto</label>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const padrao = canvasElement.querySelector<HTMLElement>('#var-default')!;
    const compacto = canvasElement.querySelector<HTMLElement>('#var-sm')!;

    await step('O degrau de tamanho vira data-size', async () => {
      // Sem esta asserção uma story que só renderiza passaria mesmo com o
      // input `size` perdido no fallback JIT — os dois cairiam em "default".
      await expect(padrao).toHaveAttribute('data-size', 'default');
      await expect(compacto).toHaveAttribute('data-size', 'sm');
    });

    await step('O compacto é de fato menor que o padrão', async () => {
      // O atributo sozinho não prova nada: a medida vive no CSS compartilhado,
      // e uma regra ausente deixaria os dois do mesmo tamanho com o data-size
      // certo em ambos.
      const larguraPadrao = padrao.getBoundingClientRect().width;
      const larguraCompacta = compacto.getBoundingClientRect().width;
      await expect(larguraCompacta).toBeLessThan(larguraPadrao);
    });

    await step('O knob acompanha o degrau do trilho', async () => {
      const knobPadrao = padrao.querySelector<HTMLElement>('[data-slot="switch-thumb"]')!;
      const knobCompacto = compacto.querySelector<HTMLElement>('[data-slot="switch-thumb"]')!;
      await expect(knobCompacto.getBoundingClientRect().width).toBeLessThan(
        knobPadrao.getBoundingClientRect().width,
      );
    });

    await step('Cada variante tem rótulo associado ao controle', async () => {
      // A variante "com descrição" separa rótulo e texto auxiliar; só o rótulo
      // nomeia o controle, e é isso que o leitor de tela anuncia.
      await expect(canvas.getByLabelText('Receber notificações por email')).toBe(padrao);
      await expect(canvas.getByLabelText('Emails de marketing')).toBe(
        canvasElement.querySelector('#var-marketing'),
      );
      await expect(canvas.getByLabelText('Tamanho compacto')).toBe(compacto);
    });
  },
};
