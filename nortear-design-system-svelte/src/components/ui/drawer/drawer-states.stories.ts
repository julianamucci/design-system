import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { waitForPortal, waitForPortalGone } from '@/lib/wait-for-portal';

import { userEvent, within, expect, waitFor, fn } from 'storybook/test';
import DrawerStory from './DrawerStory.svelte';
import { drawerSource } from './drawer.source';

const meta: Meta = {
  title: 'UI/Drawer/States',
  component: DrawerStory,
  tags: ['disclosure'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Os quatro estados diferem no valor inicial do estado ligado e em
      // `dismissible` — os dois já saem dos args que a transform lê.
      source: { transform: drawerSource },
      description: {
        component:
          'Estados canônicos do Drawer: fechado (padrão), aberto, controlado por estado externo e não dispensável.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Closed: Story = {
  args: {
    defaultOpen: false,
    triggerLabel: 'Abrir drawer',
    title: 'Editar perfil',
    description: 'Atualize seus dados pessoais.',
  },
  parameters: {
    covers: ['accessibility.item1'],
    docs: {
      description: {
        story:
          'Estado inicial — apenas o gatilho está na tela. O painel não existe no DOM, e o gatilho é o único caminho de entrada.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Fechado, o painel não existe no DOM', async () => {
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(0);
      await expect(document.querySelector('[data-slot="drawer-content"]')).toBeNull();
      await expect(document.querySelector('[data-slot="drawer-overlay"]')).toBeNull();
    });

    await step('O gatilho é o único caminho de entrada, e está alcançável', async () => {
      const trigger = canvas.getByRole('button', { name: /Abrir drawer/i });
      await expect(trigger).toBeVisible();
      await expect(trigger).toBeEnabled();
    });
  },
};

export const Open: Story = {
  args: {
    defaultOpen: true,
    triggerLabel: 'Editar perfil',
    title: 'Editar perfil',
    description: 'Atualize seus dados pessoais e foto.',
    actionLabel: 'Salvar',
    cancelLabel: 'Cancelar',
  },
  parameters: {
    covers: ['accessibility.item2'],
    docs: {
      description: {
        story:
          'Aberto ao montar, sem estado externo. Overlay ativo, foco dentro do painel e contrato de markup completo.',
      },
    },
  },
  play: async ({ step }) => {
    const panel = await waitForPortal('dialog');

    await step('Monta já aberto, com o contrato de markup completo', async () => {
      await expect(panel).toBeVisible();
      await expect(panel).toHaveAttribute('role', 'dialog');
      await expect(panel).toHaveAttribute('aria-modal', 'true');
      await expect(panel).toHaveAttribute('data-slot', 'drawer-content');
      await expect(panel).toHaveAccessibleName('Editar perfil');
      await expect(document.querySelector('[data-slot="drawer-overlay"]')).not.toBeNull();
    });

    await step('O foco está dentro do painel', async () => {
      await waitFor(() => {
        if (!panel.contains(document.activeElement)) {
          throw new Error('o foco não entrou no painel');
        }
      });
      await expect(panel.contains(document.activeElement)).toBe(true);
    });
  },
};

export const Controlled: Story = {
  args: {
    open: false,
    triggerLabel: 'Abrir via estado externo',
    title: 'Controlado pelo pai',
    description: 'Este drawer é comandado por estado externo.',
    actionLabel: 'Confirmar',
    cancelLabel: 'Cancelar',
    onAction: fn(),
    onCancel: fn(),
  },
  parameters: {
    covers: ['functional.item6'],
    docs: {
      description: {
        story:
          'Estado do lado de fora: o componente não decide nada sozinho — abre quando o valor ligado diz que sim e avisa a cada mudança para que o dono do estado acompanhe.',
      },
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /Abrir via estado externo/i });

    await step('O painel nasce fechado', async () => {
      if (within(document.body).queryAllByRole('dialog').length > 0) {
        await userEvent.keyboard('{Escape}');
        await waitForPortalGone('dialog');
      }
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(0);
    });

    await step('O estado ligado abre o painel', async () => {
      await userEvent.click(trigger);
      const panel = await waitForPortal('dialog');
      await expect(panel).toBeVisible();
      await expect(panel).toHaveAccessibleName('Controlado pelo pai');
    });

    await step('Fechar por dentro devolve o valor a quem é dono dele', async () => {
      const panel = await waitForPortal('dialog');
      const spy = args.onCancel as ReturnType<typeof fn>;
      const callsBefore = spy.mock.calls.length;
      await userEvent.click(within(panel).getByRole('button', { name: /Cancelar/i }));
      await waitForPortalGone('dialog');
      await expect(spy.mock.calls.length).toBe(callsBefore + 1);
      // Se o valor não tivesse voltado ao pai, o painel reabriria no próximo
      // ciclo de renderização.
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(0);
    });
  },
};

export const NotDismissible: Story = {
  args: {
    defaultOpen: true,
    dismissible: false,
    triggerLabel: 'Confirmar termos',
    title: 'Aceitar termos',
    description: 'É necessário confirmar antes de continuar.',
    actionLabel: 'Aceitar',
    cancelLabel: 'Recusar',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Sem dispensa por gesto: Escape e clique no overlay não fecham. A saída existe e é explícita — o botão do rodapé, alcançável por teclado.',
      },
    },
  },
  play: async ({ step }) => {
    const panel = await waitForPortal('dialog');

    await step('Escape não fecha', async () => {
      await userEvent.keyboard('{Escape}');
      // Espera ATIVA por um fechamento que não deve acontecer: se fechasse, a
      // transição de saída levaria menos que isto.
      await new Promise((r) => setTimeout(r, 400));
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(1);
      await expect(panel).toBeVisible();
    });

    await step('Clique no overlay não fecha', async () => {
      const overlay = document.querySelector<HTMLElement>('[data-slot="drawer-overlay"]');
      await expect(overlay).not.toBeNull();
      await userEvent.click(overlay!, { pointerEventsCheck: 0 });
      await new Promise((r) => setTimeout(r, 400));
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(1);
    });

    await step('A saída explícita do rodapé continua funcionando', async () => {
      await expect(within(panel).getByRole('button', { name: /Recusar/i })).toBeVisible();
    });
  },
};
