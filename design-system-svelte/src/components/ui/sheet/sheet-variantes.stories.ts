import type { Meta, StoryObj } from '@storybook/svelte';
import { waitForPortal } from '@/lib/wait-for-portal';

import { within, expect } from 'storybook/test';
import SheetStory from './SheetStory.svelte';

const meta = {
  title: 'UI/Sheet/Variantes',
  component: SheetStory,
  tags: ['disclosure'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Variantes do Sheet pela prop `side`: right (padrão desktop), left, top e bottom. Renderizadas com `open=true` para captura no Chromatic.',
      },
    },
  },
} satisfies Meta<typeof SheetStory>;

export default meta;
type Story = StoryObj<typeof meta>;

async function expectOpen(side: string) {
  const body = within(document.body);
  const dialog = await waitForPortal('dialog');
  await expect(dialog).toBeVisible();
  const content = document.querySelector<HTMLElement>('[data-slot="sheet-content"]');
  await expect(content).toHaveAttribute('data-side', side);
}

export const Right: Story = {
  args: {
    open: true,
    side: 'right',
    triggerLabel: 'Abrir filtros',
    title: 'Filtros avançados',
    description: 'Configure os filtros para refinar os resultados.',
    actionLabel: 'Aplicar filtros',
    cancelLabel: 'Cancelar',
  },
  parameters: {
    docs: {
      description: {
        story: 'Desliza da direita — padrão desktop com largura sm:max-w-sm. Caso de uso típico: filtros avançados.',
      },
    },
  },
  play: async () => {
    await expectOpen('right');
  },
};

export const Left: Story = {
  args: {
    open: true,
    side: 'left',
    triggerLabel: 'Abrir menu',
    title: 'Navegação secundária',
    description: 'Acesse seções adicionais sem trocar de página.',
    actionLabel: 'Fechar',
    cancelLabel: 'Cancelar',
  },
  parameters: {
    docs: {
      description: { story: 'Desliza da esquerda — ideal para navegação secundária.' },
    },
  },
  play: async () => {
    await expectOpen('left');
  },
};

export const Top: Story = {
  args: {
    open: true,
    side: 'top',
    triggerLabel: 'Abrir notificações',
    title: 'Notificações recentes',
    description: 'Veja atualizações importantes da sua conta.',
    actionLabel: 'Ver todas',
    cancelLabel: 'Fechar',
  },
  parameters: {
    docs: {
      description: { story: 'Desliza do topo — ocupa altura automática. Útil para banners contextuais.' },
    },
  },
  play: async () => {
    await expectOpen('top');
  },
};

export const Bottom: Story = {
  args: {
    open: true,
    side: 'bottom',
    triggerLabel: 'Abrir painel',
    title: 'Configuracoes rápidas',
    description: 'Equivalente ao Drawer mas sem gesto de arrastar.',
    actionLabel: 'Salvar',
    cancelLabel: 'Cancelar',
  },
  parameters: {
    docs: {
      description: { story: 'Desliza de baixo — equivalente a Drawer mas sem gesto. Para mobile com swipe, use Drawer.' },
    },
  },
  play: async () => {
    await expectOpen('bottom');
  },
};
