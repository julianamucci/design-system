import type { Meta, StoryObj } from '@storybook/svelte';
import { waitForPortal } from '@/lib/wait-for-portal';

import { within, expect } from 'storybook/test';
import DrawerStory from './DrawerStory.svelte';

const meta = {
  title: 'UI/Drawer/Variantes',
  component: DrawerStory,
  tags: ['disclosure'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Variantes do Drawer por direção: bottom (padrão mobile), top, left e right. Renderizado com defaultOpen=true para captura no Chromatic.',
      },
    },
  },
} satisfies Meta<typeof DrawerStory>;

export default meta;
type Story = StoryObj<typeof meta>;

async function expectOpen(direction: string) {
  const body = within(document.body);
  const dialog = await waitForPortal('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute('data-vaul-drawer-direction', direction);
}

export const Bottom: Story = {
  args: {
    direction: 'bottom',
    defaultOpen: true,
    title: 'Filtros',
    description: 'Refine os resultados da busca.',
    actionLabel: 'Aplicar',
    cancelLabel: 'Cancelar',
  },
  parameters: {
    docs: { description: { story: 'Padrão mobile-first com handle de drag visível; entra por baixo, max-height 80vh, rounded-t-xl.' } },
  },
  play: async () => {
    await expectOpen('bottom');
  },
};

export const Top: Story = {
  args: {
    direction: 'top',
    defaultOpen: true,
    title: 'Notificação',
    description: 'Você tem 3 atualizações disponíveis.',
    actionLabel: 'Ver detalhes',
    cancelLabel: 'Dispensar',
  },
  parameters: {
    docs: { description: { story: 'Entra por cima; rounded-b-xl; útil para notificações ou seletores rápidos.' } },
  },
  play: async () => {
    await expectOpen('top');
  },
};

export const Left: Story = {
  args: {
    direction: 'left',
    defaultOpen: true,
    title: 'Menu',
    description: 'Navegação principal.',
    actionLabel: 'Confirmar',
    cancelLabel: 'Cancelar',
  },
  parameters: {
    docs: { description: { story: 'Painel lateral à esquerda; w-3/4 mobile, max-w-sm desktop; rounded-r-xl.' } },
  },
  play: async () => {
    await expectOpen('left');
  },
};

export const Right: Story = {
  args: {
    direction: 'right',
    defaultOpen: true,
    title: 'Editar item',
    description: 'Atualize as informações do item selecionado.',
    actionLabel: 'Salvar',
    cancelLabel: 'Cancelar',
  },
  parameters: {
    docs: { description: { story: 'Painel lateral à direita (padrão para edição em desktop); rounded-l-xl.' } },
  },
  play: async () => {
    await expectOpen('right');
  },
};
