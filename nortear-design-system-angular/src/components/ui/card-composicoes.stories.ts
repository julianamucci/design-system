import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent } from 'storybook/test';
import { NDS_CARD } from './card';
import { NdsButton } from './button';

const meta: Meta = {
  title: 'UI/Card/Composições',
  decorators: [moduleMetadata({ imports: [...NDS_CARD, NdsButton] })],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
  },
};

export default meta;
type Story = StoryObj;

export const CardClicavel: Story = {
  parameters: { covers: ['functional.item6', 'accessibility.item4', 'accessibility.item5'] },
  render: () => ({
    // O Card não vira botão: quem carrega a semântica de navegação é o <a> em
    // volta. Assim o Tab alcança um elemento só, e não um card "clicável" que
    // esconde controles internos inalcançáveis.
    template: `
      <a
        href="#produto-42"
        aria-label="Abrir detalhes de Notebook Pro 14"
        class="nds-block nds-max-w-md"
      >
        <div ndsCard>
          <div ndsCardHeader>
            <h3 ndsCardTitle>Notebook Pro 14</h3>
            <p ndsCardDescription>M3 Pro · 18GB · 512GB SSD</p>
          </div>
          <div ndsCardContent>R$ 14.999,00</div>
        </div>
      </a>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Tab alcança o card inteiro como um único destino', async () => {
      const link = canvas.getByRole('link');
      await userEvent.tab();
      await expect(link).toHaveFocus();
    });

    await step('O nome acessível descreve o destino, não repete o título', async () => {
      // aria-label="Notebook Pro 14" seria redundante com o heading. O que o
      // leitor precisa é saber o que acontece ao ativar.
      const link = canvas.getByRole('link');
      await expect(link.getAttribute('aria-label')).toMatch(/detalhes/i);
    });

    await step('O foco fica visível', async () => {
      const link = canvas.getByRole('link');
      link.focus();
      const outline = getComputedStyle(link).outlineStyle;
      const sombra = getComputedStyle(link).boxShadow;
      await expect(outline !== 'none' || sombra !== 'none').toBe(true);
    });
  },
};

export const DescriptionContrast: Story = {
  parameters: { covers: ['accessibility.item2', 'accessibility.item3'] },
  render: () => ({
    template: `
      <div ndsCard class="nds-max-w-md">
        <div ndsCardHeader>
          <h3 ndsCardTitle>Pedido #4821</h3>
          <p ndsCardDescription>Entregue em 12 de agosto</p>
          <div ndsCardAction>
            <button ndsButton variant="ghost" size="sm" aria-label="Rastrear pedido 4821">
              Rastrear
            </button>
          </div>
        </div>
        <div ndsCardContent>3 itens · R$ 289,90</div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A descrição usa a cor muted, e não a mesma do título', async () => {
      // O contraste em si é medido pelo axe; o que a story garante é que a
      // descrição não caiu na cor do título por engano — o que passaria no axe
      // e apagaria a hierarquia visual.
      const titulo = canvasElement.querySelector<HTMLElement>('[data-slot="card-title"]')!;
      const descricao = canvasElement.querySelector<HTMLElement>('[data-slot="card-description"]')!;
      await expect(getComputedStyle(descricao).color).not.toBe(getComputedStyle(titulo).color);
    });

    await step('O botão da ação tem nome acessível contextual', async () => {
      // "Rastrear" sozinho não diz o quê, e numa lista de pedidos vira uma
      // sequência de botões idênticos para quem navega por leitor de tela.
      const botao = canvas.getByRole('button', { name: /Rastrear pedido 4821/ });
      await expect(botao).toBeTruthy();
    });
  },
};
