import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, fn, userEvent } from 'storybook/test';
import { NDS_CARD } from './card';
import { NdsButton } from './button';

/**
 * Espião em escopo de MÓDULO: criado dentro do `render` seria inalcançável pela
 * `play`. O passo limpa antes de agir, para a contagem valer na segunda
 * execução do painel Interactions.
 */
const onNavigate = fn();

const meta: Meta = {
  title: 'UI/Card/Compositions',
  tags: ['layout'],
  decorators: [moduleMetadata({ imports: [...NDS_CARD, NdsButton] })],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
  },
};

export default meta;
type Story = StoryObj;

export const ClickableCard: Story = {
  parameters: { covers: ['functional.item6', 'accessibility.item4', 'visual.item4'] },
  render: () => ({
    // O Card não vira botão: quem carrega a semântica de navegação é o <a> em
    // volta. Assim o Tab alcança um elemento só, e não um card "clicável" que
    // esconde controles internos inalcançáveis.
    props: {
      navegar: (event: Event) => {
        event.preventDefault();
        onNavigate();
      },
    },
    template: `
      <a
        href="#produto-cadeira-gamer-pro"
        aria-label="Abrir detalhes do produto Cadeira Gamer Pro"
        class="nds-block nds-w-sm nds-text-left nds-focus-ring nds-rounded-xl"
        (click)="navegar($event)"
      >
        <div ndsCard>
          <div ndsCardHeader>
            <h3 ndsCardTitle>Cadeira Gamer Pro</h3>
            <p ndsCardDescription>Estrutura ergonômica com ajuste de altura e apoio lombar.</p>
          </div>
          <div ndsCardContent>R$ 1.299,00</div>
        </div>
      </a>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole('link', {
      name: 'Abrir detalhes do produto Cadeira Gamer Pro',
    });

    await step('Tab alcança o card inteiro como um destino único', async () => {
      link.blur();
      await userEvent.tab();
      await expect(link).toHaveFocus();
    });

    await step('O nome acessível descreve o destino, não repete o título', async () => {
      // aria-label="Cadeira Gamer Pro" seria redundante com o heading. O que o
      // leitor precisa é saber o que acontece ao ativar.
      await expect(link.getAttribute('aria-label')).toMatch(/detalhes/i);
    });

    await step('O anel de foco aparece quando o foco vem do teclado', async () => {
      const { outlineStyle, boxShadow } = getComputedStyle(link);
      await expect(outlineStyle !== 'none' || boxShadow !== 'none').toBe(true);
    });

    await step('Enter navega a partir do wrapper', async () => {
      onNavigate.mockClear();
      await userEvent.keyboard('{Enter}');
      await expect(onNavigate).toHaveBeenCalledTimes(1);
    });

    await step('O Card interno continua passivo dentro do link', async () => {
      const card = canvasElement.querySelector<HTMLElement>('[data-slot="card"]')!;
      await expect(card).not.toHaveAttribute('tabindex');
    });
  },
};

export const DescriptionContrast: Story = {
  parameters: { covers: ['accessibility.item2'] },
  render: () => ({
    template: `
      <div ndsCard class="nds-w-sm">
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
      const title = canvasElement.querySelector<HTMLElement>('[data-slot="card-title"]')!;
      const descricao = canvasElement.querySelector<HTMLElement>('[data-slot="card-description"]')!;
      await expect(getComputedStyle(descricao).color).not.toBe(getComputedStyle(title).color);
    });

    await step('O botão da ação tem nome acessível contextual', async () => {
      // "Rastrear" sozinho não diz o quê, e numa lista de pedidos vira uma
      // sequência de botões idênticos para quem navega por leitor de tela.
      await expect(canvas.getByRole('button', { name: 'Rastrear pedido 4821' })).toBeTruthy();
    });
  },
};
