import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect } from 'storybook/test';
import { waitForPortal } from '@/lib/wait-for-portal';
import { createDrawer, type DrawerDirection } from './drawer';
import { createButton } from './button';
import { limparPortaisDoDrawer } from './drawer-portal-cleanup';

const meta: Meta = {
  tags: ['disclosure'],
  title: 'UI/Drawer/Variants',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Direção de entrada pela opção direction da factory. Bottom é o padrão mobile-first e a única direção em que a alça aparece; left e right servem a painéis laterais.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildVariant(direction: DrawerDirection, titulo: string, descricao: string): HTMLElement {
  const trigger = createButton({ variant: 'outline', label: 'Abrir' });

  const content = document.createElement('div');
  content.className = 'nds-text-body nds-text-muted-foreground';
  content.textContent = 'Conteúdo do painel.';

  const cancel = createButton({ variant: 'outline', label: 'Fechar' });
  cancel.dataset.slot = 'drawer-close';
  const footer = document.createElement('div');
  footer.className = 'nds-cluster';
  footer.dataset.justify = 'end';
  footer.dataset.spacing = 'xs';
  footer.append(cancel);

  const drawer = createDrawer({
    trigger,
    direction,
    title: titulo,
    description: descricao,
    content,
    footer,
  });

  const wrapper = document.createElement('div');
  wrapper.className = 'nds-cluster nds-w-full';
  wrapper.dataset.justify = 'center';
  wrapper.appendChild(drawer);
  return wrapper;
}

/** Abre pelo gatilho, e só se ainda estiver fechado (a play é reexecutável). */
async function abrirPeloGatilho(canvasElement: HTMLElement): Promise<HTMLElement> {
  limparPortaisDoDrawer();
  if (within(document.body).queryAllByRole('dialog').length === 0) {
    await userEvent.click(within(canvasElement).getByRole('button', { name: /^abrir$/i }));
  }
  return await waitForPortal('dialog');
}

// A asserção de direção está escrita story a story, e não extraída para um
// helper: `play_without_assertion` conta `expect()` DENTRO do bloco, e um helper
// compartilhado esconderia da leitura o único contrato que cada uma destas
// quatro stories verifica.

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Bottom: Story = {
  parameters: {
    covers: ['accessibility.item6', 'visual.item1'],
    docs: {
      description: {
        story:
          'Padrão mobile-first: entra por baixo, com teto de 80% da altura da tela e cantos arredondados no topo. É a única direção em que a alça aparece.',
      },
    },
  },
  render: () => buildVariant('bottom', 'Detalhes do pedido', 'Pedido #4287 confirmado em 15 de março.'),
  play: async ({ canvasElement, step }) => {
    const painel = await abrirPeloGatilho(canvasElement);
    await step('O painel encosta na base e mostra a alça', async () => {
      await expect(painel).toHaveAttribute('data-vaul-drawer-direction', 'bottom');
      await expect(painel).toHaveClass(/nds-drawer-content/);
      await expect(painel).toHaveAccessibleName('Detalhes do pedido');
      // A alça só é visível nesta direção — o CSS compartilhado a esconde nas
      // outras. Contraste e cor do painel são verificados pelo axe da story.
      const alca = painel.querySelector<HTMLElement>('.nds-drawer-handle')!;
      await expect(window.getComputedStyle(alca).display).toBe('block');
    });
  },
};

export const Top: Story = {
  parameters: {
    covers: ['visual.item4'],
    docs: {
      description: {
        story:
          'Entra por cima, com cantos arredondados embaixo. Serve a notificação rica e a seletor rápido — conteúdo curto e saída imediata.',
      },
    },
  },
  render: () => buildVariant('top', 'Nova versão disponível', 'Atualize agora para acessar as novidades.'),
  play: async ({ canvasElement, step }) => {
    const painel = await abrirPeloGatilho(canvasElement);
    await step('O painel encosta no topo e esconde a alça', async () => {
      await expect(painel).toHaveAttribute('data-vaul-drawer-direction', 'top');
      await expect(painel).toHaveClass(/nds-drawer-content/);
      await expect(painel).toHaveAccessibleName('Nova versão disponível');
      const alca = painel.querySelector<HTMLElement>('.nds-drawer-handle')!;
      await expect(window.getComputedStyle(alca).display).toBe('none');
    });
  },
};

export const Left: Story = {
  parameters: {
    covers: ['visual.item3'],
    docs: {
      description: {
        story:
          'Painel lateral à esquerda — a direção do menu de navegação, que a pessoa espera encontrar onde o menu costuma ficar.',
      },
    },
  },
  render: () => buildVariant('left', 'Menu', 'Navegue pelas seções do app.'),
  play: async ({ canvasElement, step }) => {
    const painel = await abrirPeloGatilho(canvasElement);
    await step('O painel encosta na borda esquerda', async () => {
      await expect(painel).toHaveAttribute('data-vaul-drawer-direction', 'left');
      await expect(painel).toHaveClass(/nds-drawer-content/);
      await expect(painel).toHaveAccessibleName('Menu');
      // Ocupa a altura inteira, encostada na borda — ao contrário de bottom/top.
      await expect(painel.getBoundingClientRect().left).toBeLessThan(1);
    });
  },
};

export const Right: Story = {
  parameters: {
    covers: ['functional.item5', 'visual.item2'],
    docs: {
      description: {
        story:
          'Painel lateral à direita — alternativa de desktop para edição e filtros, sem trocar de componente.',
      },
    },
  },
  render: () => buildVariant('right', 'Filtros', 'Refine sua busca por categoria, preço e disponibilidade.'),
  play: async ({ canvasElement, step }) => {
    const painel = await abrirPeloGatilho(canvasElement);
    await step('O painel encosta na borda direita', async () => {
      await expect(painel).toHaveAttribute('data-vaul-drawer-direction', 'right');
      await expect(painel).toHaveClass(/nds-drawer-content/);
      await expect(painel).toHaveAccessibleName('Filtros');
      const caixa = painel.getBoundingClientRect();
      await expect(Math.abs(caixa.right - window.innerWidth)).toBeLessThan(2);
    });
  },
};
