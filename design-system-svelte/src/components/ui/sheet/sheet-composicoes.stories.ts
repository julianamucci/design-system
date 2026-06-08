import type { Meta, StoryObj } from '@storybook/svelte';
import { waitForPortal } from '@/lib/wait-for-portal';

import { within, expect } from 'storybook/test';
import SheetStory from './SheetStory.svelte';
import { track } from '@/lib/analytics';

const meta = {
  title: 'UI/Sheet/Composicoes',
  component: SheetStory,
  tags: ['disclosure'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes reais do Sheet em fluxos de produto: filtros avançados, edição de perfil e termos com scroll. Renderizadas com open=true para captura no Chromatic.',
      },
    },
  },
} satisfies Meta<typeof SheetStory>;

export default meta;
type Story = StoryObj<typeof meta>;

async function expectOpen() {
  const body = within(document.body);
  const dialog = await waitForPortal('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute('aria-modal', 'true');
  return dialog;
}

export const AdvancedFilters: Story = {
  args: {
    open: true,
    side: 'right',
    variant: 'withForm',
    triggerLabel: 'Filtros avançados',
    title: 'Filtros avançados',
    description: 'Refine os resultados configurando os filtros abaixo.',
    actionLabel: 'Aplicar filtros',
    cancelLabel: 'Cancelar',
    onAction: () =>
      track('dialog_confirm', {
        component: 'sheet',
        action: 'Aplicar filtros',
        location: 'storybook:composicoes:advanced-filters',
      }),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Sheet lateral direito com formulário de filtros. Submissão dispara `dialog_confirm` e o footer mantém Cancelar + ação primária alinhados à direita.',
      },
    },
  },
  play: async () => {
    const dialog = await expectOpen();
    await expect(dialog).toHaveAccessibleName(/Filtros avançados/i);
    const inputs = dialog.querySelectorAll('input');
    await expect(inputs.length).toBeGreaterThanOrEqual(2);
  },
};

export const ProfileEdit: Story = {
  args: {
    open: true,
    side: 'right',
    variant: 'withForm',
    triggerLabel: 'Editar perfil',
    title: 'Editar perfil',
    description: 'Atualize seu nome e e-mail. As mudanças são salvas ao confirmar.',
    actionLabel: 'Salvar alterações',
    cancelLabel: 'Cancelar',
    onAction: () =>
      track('dialog_confirm', {
        component: 'sheet',
        action: 'Salvar alterações',
        location: 'storybook:composicoes:profile-edit',
      }),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Edição de perfil em painel lateral. Inputs dentro do Sheet participam do focus trap; Escape ou Cancelar fecham sem salvar.',
      },
    },
  },
  play: async () => {
    const dialog = await expectOpen();
    await expect(dialog).toHaveAccessibleName(/Editar perfil/i);
  },
};

export const TermsWithScroll: Story = {
  args: {
    open: true,
    side: 'right',
    variant: 'withScrollContent',
    triggerLabel: 'Ver termos',
    title: 'Termos e condições',
    description: 'Leia atentamente antes de aceitar.',
    actionLabel: 'Aceitar',
    cancelLabel: 'Recusar',
    onAction: () =>
      track('dialog_confirm', {
        component: 'sheet',
        action: 'Aceitar',
        location: 'storybook:composicoes:terms-with-scroll',
      }),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Sheet com conteúdo extenso (scroll interno via max-h + overflow-y-auto). Cabeçalho e footer permanecem visíveis enquanto o body rola.',
      },
    },
  },
  play: async () => {
    const dialog = await expectOpen();
    const scrollArea = dialog.querySelector('.overflow-y-auto');
    await expect(scrollArea).not.toBeNull();
  },
};
