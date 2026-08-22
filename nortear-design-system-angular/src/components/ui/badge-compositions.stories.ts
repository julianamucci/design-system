import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent } from 'storybook/test';
import { NdsBadge } from './badge';
import { NdsButton, NdsButtonIcon } from './button';

const meta: Meta = {
  title: 'UI/Badge/Compositions',
  decorators: [moduleMetadata({ imports: [NdsBadge, NdsButton, NdsButtonIcon] })],
  parameters: { layout: 'padded', controls: { disable: true } },
};

export default meta;
type Story = StoryObj;

export const WithIconAndCounter: Story = {
  parameters: { covers: ['functional.item5', 'visual.item3'] },
  render: () => ({
    template: `
      <div class="nds-cluster" data-spacing="md">
        <span ndsBadge variant="success">
          <svg ndsButtonIcon kind="check" size="sm"></svg>
          Publicado
        </span>
        <span ndsBadge variant="destructive">12</span>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('O ícone é decorativo — quem nomeia é o texto', async () => {
      // Ícone sem aria-hidden dentro de um badge faz o leitor anunciar um
      // gráfico sem nome antes do rótulo.
      const svg = canvasElement.querySelector<SVGElement>('.nds-badge svg')!;
      await expect(svg).toHaveAttribute('aria-hidden', 'true');
    });

    await step('O contador é só número, sem rótulo redundante', async () => {
      const contador = canvasElement.querySelectorAll('[data-slot="badge"]')[1];
      await expect(contador.textContent?.trim()).toMatch(/^\d+$/);
    });
  },
};

export const InLinkAndButton: Story = {
  parameters: { covers: ['functional.item6', 'visual.item4', 'accessibility.item1'] },
  render: () => ({
    // O Badge não vira o controle: quem carrega a interação é o <a> ou o
    // <button> em volta. O badge segue sendo rótulo, e o Tab alcança um
    // elemento com semântica de verdade.
    template: `
      <div class="nds-cluster" data-spacing="md">
        <a href="#tag-design">
          <span ndsBadge variant="secondary">design</span>
        </a>
        <button ndsButton variant="ghost" size="sm" aria-label="Filtrar por categoria Frontend">
          <span ndsBadge variant="outline">Frontend</span>
        </button>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O Tab alcança o link e o botão, não o badge', async () => {
      await userEvent.tab();
      await expect(canvas.getByRole('link')).toHaveFocus();
      await userEvent.tab();
      await expect(canvas.getByRole('button')).toHaveFocus();
    });

    await step('O badge continua fora da ordem de tabulação', async () => {
      const badges = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="badge"]')];
      for (const b of badges) await expect(b.hasAttribute('tabindex')).toBe(false);
    });

    await step('O botão tem nome acessível além do rótulo do badge', async () => {
      // "Frontend" sozinho não diz o que o botão faz; numa lista de filtros
      // vira uma fileira de botões sem verbo.
      const button = canvas.getByRole('button', { name: /Filtrar por categoria/ });
      await expect(button).toBeTruthy();
    });
  },
};
