import type { Meta, StoryObj } from '@storybook/svelte';
import { waitForPortal } from '@/lib/wait-for-portal';

import { userEvent, within, expect, waitFor, fn } from 'storybook/test';
import PopoverStory from './PopoverStory.svelte';

const meta = {
  title: 'UI/Popover/Estados',
  component: PopoverStory,
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Estados do Popover: fechado (apenas trigger), aberto (Content visível) e controlado (open + onOpenChange externo).',
      },
    },
  },
} satisfies Meta<typeof PopoverStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {
  name: 'Fechado',
  parameters: {
    docs: { description: { story: 'Estado inicial — apenas o trigger é visível, Content não renderizado.' } },
  },
  args: {
    defaultOpen: false,
    variant: 'withTitle',
    triggerLabel: 'Abrir popover',
    title: 'Configuracoes de exibição',
    description: 'Ajuste a aparência do conteúdo da página.',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const trigger = canvas.getByRole('button', { name: /Abrir popover/i });
    await expect(trigger).toBeVisible();
    await expect(body.queryByRole('dialog')).not.toBeInTheDocument();
  },
};

export const Open: Story = {
  name: 'Aberto (defaultOpen)',
  parameters: {
    docs: { description: { story: 'Popover aberto. Captura visual no Chromatic.' } },
  },
  args: {
    defaultOpen: true,
    variant: 'withTitle',
    triggerLabel: 'Abrir popover',
    title: 'Configuracoes de exibição',
    description: 'Ajuste a aparência do conteúdo da página.',
    saveLabel: 'Salvar',
    cancelLabel: 'Cancelar',
  },
  play: async () => {
    const body = within(document.body);
    const dialog = await waitForPortal('dialog', { timeout: 2000 });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('data-state', 'open');
  },
};

export const SideTop: Story = {
  name: 'Side top (auto-flip)',
  parameters: {
    docs: {
      description: {
        story:
          'Posicionamento preferido `side="top"`. Se não houver espaço, o popover faz auto-flip para outra direção.',
      },
    },
  },
  args: {
    defaultOpen: true,
    side: 'top',
    variant: 'withTitle',
    triggerLabel: 'Abrir popover',
    title: 'Configuracoes de exibição',
    description: 'Ajuste a aparência do conteúdo da página.',
  },
  play: async () => {
    const body = within(document.body);
    const dialog = await waitForPortal('dialog', { timeout: 2000 });
    await expect(dialog).toBeVisible();
  },
};

export const Controlled: Story = {
  name: 'Controlado (open prop)',
  parameters: {
    docs: {
      description: {
        story:
          'Abertura controlada externamente via `bind:open`. Escape fecha mesmo em modo controlado.',
      },
    },
  },
  args: {
    open: true,
    variant: 'withTitle',
    triggerLabel: 'Abrir via estado externo',
    title: 'Controlado pelo pai',
    description: 'Este popover é comandado por estado externo via bind:open.',
    saveLabel: 'Confirmar',
    cancelLabel: 'Cancelar',
    onAction: fn(),
    onCancel: fn(),
  },
  play: async () => {
    const body = within(document.body);
    const dialog = await waitForPortal('dialog', { timeout: 2000 });
    await expect(dialog).toBeVisible();

    await userEvent.keyboard('{Escape}');
    await waitFor(
      () => {
        const d = body.queryByRole('dialog');
        if (d && d.getAttribute('data-state') !== 'closed') {
          throw new Error('still open');
        }
      },
      { timeout: 1000 }
    );
  },
};
