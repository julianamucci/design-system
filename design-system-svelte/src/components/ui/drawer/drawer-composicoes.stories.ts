import type { Meta, StoryObj } from '@storybook/svelte';
import { waitForPortal } from '@/lib/wait-for-portal';

import { within, expect } from 'storybook/test';
import DrawerStory from './DrawerStory.svelte';

const meta = {
  title: 'UI/Drawer/Composicoes',
  component: DrawerStory,
  tags: ['disclosure'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes idiomáticas: drawer com formulário, com confirmação e com scroll interno. Renderizadas com defaultOpen para captura no Chromatic.',
      },
    },
  },
} satisfies Meta<typeof DrawerStory>;

export default meta;
type Story = StoryObj<typeof meta>;

async function expectOpen() {
  const body = within(document.body);
  const dialog = await waitForPortal('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute('aria-modal', 'true');
  return dialog;
}

export const ComFormulario: Story = {
  args: {
    direction: 'right',
    defaultOpen: true,
    variant: 'withForm',
    title: 'Editar dados pessoais',
    description: 'Atualize seu nome e e-mail.',
    actionLabel: 'Salvar',
    cancelLabel: 'Cancelar',
  },
  parameters: {
    docs: { description: { story: 'Drawer lateral com formulário de edição. Inputs dentro do drawer participam do focus trap.' } },
  },
  play: async () => {
    const dialog = await expectOpen();
    const inputs = dialog.querySelectorAll('input');
    await expect(inputs.length).toBeGreaterThanOrEqual(2);
  },
};

export const ComConfirmacao: Story = {
  args: {
    direction: 'bottom',
    defaultOpen: true,
    variant: 'withConfirmation',
    title: 'Remover item',
    description: 'Você pode adicioná-lo novamente depois.',
    actionLabel: 'Remover',
    cancelLabel: 'Cancelar',
  },
  parameters: {
    docs: { description: { story: 'Drawer mobile-first para confirmação reversível. Para confirmações destrutivas e críticas, prefira AlertDialog.' } },
  },
  play: async () => {
    await expectOpen();
  },
};

export const ComScroll: Story = {
  args: {
    direction: 'bottom',
    defaultOpen: true,
    variant: 'withScroll',
    title: 'Termos de uso',
    description: 'Leia atentamente antes de aceitar.',
    actionLabel: 'Aceitar',
    cancelLabel: 'Recusar',
  },
  parameters: {
    docs: { description: { story: 'Conteúdo extenso com max-height + overflow-y-auto interno; o handle de drag (bottom) permanece visível.' } },
  },
  play: async () => {
    const dialog = await expectOpen();
    const scrollArea = dialog.querySelector('.overflow-y-auto');
    await expect(scrollArea).not.toBeNull();
  },
};
