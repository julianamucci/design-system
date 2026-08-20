import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { waitForPortal } from '@/lib/wait-for-portal';

import { expect } from 'storybook/test';
import DrawerStory from './DrawerStory.svelte';
import { drawerSource } from './drawer.source';

const meta: Meta = {
  title: 'UI/Drawer/Variants',
  component: DrawerStory,
  tags: ['disclosure'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // As quatro direções são o mesmo painel com um valor diferente na raiz:
      // a transform lê `direction` dos args e nenhuma story precisa de override.
      source: { transform: drawerSource },
      description: {
        component:
          'Direção de entrada pela prop direction da raiz. Bottom é o padrão mobile-first e a única direção em que a alça aparece; left e right servem a painéis laterais.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// A asserção de direção está escrita story a story, e não extraída para um
// helper: `play_without_assertion` conta `expect()` DENTRO do bloco, e um
// helper compartilhado esconderia da leitura o único contrato que cada uma
// destas quatro stories verifica.

export const Bottom: Story = {
  args: {
    direction: 'bottom',
    defaultOpen: true,
    title: 'Detalhes do pedido',
    description: 'Pedido #4287 confirmado em 15 de março.',
    actionLabel: 'Aplicar',
    cancelLabel: 'Cancelar',
  },
  parameters: {
    covers: ['accessibility.item6', 'visual.item1'],
    docs: {
      description: {
        story:
          'Padrão mobile-first: entra por baixo, com teto de 80% da altura da tela e cantos arredondados no topo. É a única direção em que a alça aparece.',
      },
    },
  },
  play: async ({ step }) => {
    await step('O painel encosta na base e mostra a alça', async () => {
      const painel = await waitForPortal('dialog');
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
  args: {
    direction: 'top',
    defaultOpen: true,
    title: 'Nova versão disponível',
    description: 'Atualize agora para acessar as novidades.',
    actionLabel: 'Ver detalhes',
    cancelLabel: 'Dispensar',
  },
  parameters: {
    covers: ['visual.item4'],
    docs: {
      description: {
        story:
          'Entra por cima, com cantos arredondados embaixo. Serve a notificação rica e a seletor rápido — conteúdo curto e saída imediata.',
      },
    },
  },
  play: async ({ step }) => {
    await step('O painel encosta no topo e esconde a alça', async () => {
      const painel = await waitForPortal('dialog');
      await expect(painel).toHaveAttribute('data-vaul-drawer-direction', 'top');
      await expect(painel).toHaveClass(/nds-drawer-content/);
      await expect(painel).toHaveAccessibleName('Nova versão disponível');
      const alca = painel.querySelector<HTMLElement>('.nds-drawer-handle')!;
      await expect(window.getComputedStyle(alca).display).toBe('none');
    });
  },
};

export const Left: Story = {
  args: {
    direction: 'left',
    defaultOpen: true,
    title: 'Menu',
    description: 'Navegue pelas seções do app.',
    actionLabel: 'Confirmar',
    cancelLabel: 'Cancelar',
  },
  parameters: {
    covers: ['visual.item3'],
    docs: {
      description: {
        story:
          'Painel lateral à esquerda — a direção do menu de navegação, que a pessoa espera encontrar onde o menu costuma ficar.',
      },
    },
  },
  play: async ({ step }) => {
    await step('O painel encosta na borda esquerda', async () => {
      const painel = await waitForPortal('dialog');
      await expect(painel).toHaveAttribute('data-vaul-drawer-direction', 'left');
      await expect(painel).toHaveClass(/nds-drawer-content/);
      await expect(painel).toHaveAccessibleName('Menu');
      // Ocupa a altura inteira, encostada na borda — ao contrário de bottom/top.
      await expect(painel.getBoundingClientRect().left).toBeLessThan(1);
    });
  },
};

export const Right: Story = {
  args: {
    direction: 'right',
    defaultOpen: true,
    title: 'Filtros',
    description: 'Refine sua busca por categoria, preço e disponibilidade.',
    actionLabel: 'Salvar',
    cancelLabel: 'Cancelar',
  },
  parameters: {
    covers: ['functional.item5', 'visual.item2'],
    docs: {
      description: {
        story:
          'Painel lateral à direita — alternativa de desktop para edição e filtros, sem trocar de componente.',
      },
    },
  },
  play: async ({ step }) => {
    await step('O painel encosta na borda direita', async () => {
      const painel = await waitForPortal('dialog');
      await expect(painel).toHaveAttribute('data-vaul-drawer-direction', 'right');
      await expect(painel).toHaveClass(/nds-drawer-content/);
      await expect(painel).toHaveAccessibleName('Filtros');
      const caixa = painel.getBoundingClientRect();
      await expect(Math.abs(caixa.right - window.innerWidth)).toBeLessThan(2);
    });
  },
};
