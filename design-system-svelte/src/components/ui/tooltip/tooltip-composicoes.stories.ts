import type { Meta, StoryObj } from '@storybook/svelte';
import { waitForPortal } from '@/lib/wait-for-portal';

import { within, expect, waitFor } from 'storybook/test';
import TooltipStory from './TooltipStory.svelte';

const meta = {
  title: 'UI/Tooltip/Composicoes',
  component: TooltipStory,
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes comuns do Tooltip: atalho de teclado em botão icon-only, sides diferentes (top/bottom/left/right) e descrição curta de ação.',
      },
    },
  },
} satisfies Meta<typeof TooltipStory>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseArgs = {
  defaultOpen: true,
  delayDuration: 0,
  align: 'center' as const,
  sideOffset: 4,
};

const waitOpen = async () => {
  const body = within(document.body);
  await waitFor(
    async () => {
      const tip = await waitForPortal('tooltip');
      expect(tip).toBeVisible();
    },
    { timeout: 2000 }
  );
};

export const AtalhoTeclado: Story = {
  name: 'Atalho de teclado em icon button',
  args: {
    ...baseArgs,
    side: 'top',
    variant: 'withShortcut',
    triggerLabel: 'Salvar',
    ariaLabel: 'Salvar',
    contentText: 'Salvar',
  },
  play: async () => {
    await waitOpen();
    const body = within(document.body);
    await expect(body.getByText(/Ctrl/)).toBeInTheDocument();
  },
};

export const SideTop: Story = {
  name: 'Side: top',
  args: {
    ...baseArgs,
    side: 'top',
    variant: 'default',
    triggerLabel: 'Salvar',
    ariaLabel: 'Salvar',
    contentText: 'Tooltip no topo',
  },
  play: async () => {
    await waitOpen();
    const body = within(document.body);
    const tip = await waitForPortal('tooltip');
    await expect(tip).toHaveAttribute('data-side', 'top');
  },
};

export const SideBottom: Story = {
  name: 'Side: bottom',
  args: {
    ...baseArgs,
    side: 'bottom',
    variant: 'default',
    triggerLabel: 'Excluir',
    ariaLabel: 'Excluir item',
    contentText: 'Excluir item',
  },
  play: async () => {
    await waitOpen();
    const body = within(document.body);
    const tip = await waitForPortal('tooltip');
    await expect(tip).toHaveAttribute('data-side', 'bottom');
  },
};

export const SideLeft: Story = {
  name: 'Side: left',
  args: {
    ...baseArgs,
    side: 'left',
    variant: 'default',
    triggerLabel: 'Salvar',
    ariaLabel: 'Salvar',
    contentText: 'À esquerda',
  },
  play: async () => {
    await waitOpen();
    const body = within(document.body);
    const tip = await waitForPortal('tooltip');
    await expect(tip).toHaveAttribute('data-side', 'left');
  },
};

export const SideRight: Story = {
  name: 'Side: right',
  args: {
    ...baseArgs,
    side: 'right',
    variant: 'default',
    triggerLabel: 'Salvar',
    ariaLabel: 'Salvar',
    contentText: 'À direita',
  },
  play: async () => {
    await waitOpen();
    const body = within(document.body);
    const tip = await waitForPortal('tooltip');
    await expect(tip).toHaveAttribute('data-side', 'right');
  },
};

export const DescricaoAcao: Story = {
  name: 'Descrição curta de ação',
  args: {
    ...baseArgs,
    side: 'top',
    variant: 'default',
    triggerLabel: 'Compartilhar',
    ariaLabel: 'Compartilhar link',
    contentText: 'Compartilhar link',
  },
  play: async () => {
    await waitOpen();
    const body = within(document.body);
    await expect(body.getByText(/Compartilhar link/i)).toBeInTheDocument();
  },
};
