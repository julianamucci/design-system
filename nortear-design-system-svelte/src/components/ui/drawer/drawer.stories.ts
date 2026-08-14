import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { waitForPortal, waitForPortalGone } from '@/lib/wait-for-portal';

import { userEvent, within, expect, waitFor, fn } from 'storybook/test';
import DrawerStory from './DrawerStory.svelte';
import DrawerDocs from '@/components/docs/DrawerDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const ROTULO = {
  gatilho: 'Abrir drawer',
  titulo: 'Editar perfil',
  descricao: 'Atualize seus dados pessoais e foto.',
  confirmar: 'Confirmar',
  cancelar: 'Cancelar',
};

const meta: Meta = {
  title: 'UI/Drawer',
  component: DrawerStory,
  tags: ['autodocs', 'disclosure'],
  parameters: {
    layout: 'centered',
    docs: {
      page: withAutoDocsTab(DrawerDocs),
      description: {
        component:
          'Painel deslizante mobile-first. Renderiza em portal com overlay, foco preso e role=dialog, em quatro direções de entrada.',
      },
    },
  },
  // O docgen está desligado neste stack: `argTypes` é a ÚNICA fonte da aba API
  // Reference. Todo arg precisa de entrada aqui, senão some da tabela
  // (rule `arg_without_argtype`).
  argTypes: {
    direction: {
      control: 'inline-radio',
      options: ['bottom', 'top', 'left', 'right'],
      description: 'Direção de entrada do painel.',
      table: { type: { summary: "'bottom' | 'top' | 'left' | 'right'" }, defaultValue: { summary: "'bottom'" } },
    },
    defaultOpen: {
      control: 'boolean',
      description: 'Estado inicial em modo não-controlado.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    dismissible: {
      control: 'boolean',
      description: 'Permite fechar via swipe, ESC ou clique no overlay.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    triggerLabel: {
      control: 'text',
      description: 'Texto do gatilho. Verbo mais objeto — nomeie a ação.',
      table: { type: { summary: 'string' } },
    },
    title: {
      control: 'text',
      description: 'Título do painel, e o nome acessível do diálogo.',
      table: { type: { summary: 'string' } },
    },
    description: {
      control: 'text',
      description: 'Descrição complementar, e a descrição acessível do diálogo.',
      table: { type: { summary: 'string' } },
    },
    actionLabel: {
      control: 'text',
      description: 'Rótulo da ação primária do rodapé.',
      table: { type: { summary: 'string' } },
    },
    cancelLabel: {
      control: 'text',
      description: 'Rótulo da ação que fecha o painel.',
      table: { type: { summary: 'string' } },
    },
    // `control: false` de propósito: são espiões de callback, não parâmetros.
    onAction: {
      control: false,
      description: 'Chamado ao acionar o botão primário do rodapé.',
      table: { type: { summary: '() => void' } },
    },
    onCancel: {
      control: false,
      description: 'Chamado ao acionar o botão que fecha o painel.',
      table: { type: { summary: '() => void' } },
    },
  },
  args: {
    direction: 'bottom',
    defaultOpen: false,
    dismissible: true,
    triggerLabel: ROTULO.gatilho,
    title: ROTULO.titulo,
    description: ROTULO.descricao,
    actionLabel: ROTULO.confirmar,
    cancelLabel: ROTULO.cancelar,
    onAction: fn(),
    onCancel: fn(),
  },
};

export default meta;
type Story = StoryObj;

/**
 * Par idempotente de abertura e fechamento.
 *
 * O painel Interactions REEXECUTA a play no mesmo DOM — não remonta. Um clique
 * cego partiria do estado que a rodada anterior deixou e inverteria todo o
 * resto. Cada passo estabelece a própria precondição.
 */
async function abrir(trigger: HTMLElement): Promise<HTMLElement> {
  if (within(document.body).queryAllByRole('dialog').length === 0) {
    await userEvent.click(trigger);
  }
  return await waitForPortal('dialog');
}

async function fechar(): Promise<void> {
  if (within(document.body).queryAllByRole('dialog').length > 0) {
    await userEvent.keyboard('{Escape}');
  }
  await waitForPortalGone('dialog');
}

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1', 'functional.item2', 'functional.item3', 'functional.item4',
      'accessibility.item3', 'accessibility.item4', 'accessibility.item5',
    ],
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: ROTULO.gatilho });

    await fechar();

    await step('1. Clicar no gatilho abre o painel, com nome e descrição acessíveis', async () => {
      const painel = await abrir(trigger);

      await expect(painel).toBeVisible();
      await expect(painel).toHaveAttribute('role', 'dialog');
      await expect(painel).toHaveAttribute('aria-modal', 'true');
      await expect(painel).toHaveAccessibleName(ROTULO.titulo);
      await expect(painel).toHaveAccessibleDescription(ROTULO.descricao);
      await expect(painel).toHaveAttribute('data-vaul-drawer-direction', args.direction as string);
      await expect(painel).toHaveClass(/nds-drawer-content/);
    });

    await step('2. O painel é portalizado para fora da story', async () => {
      const painel = await waitForPortal('dialog');
      await expect(canvasElement.contains(painel)).toBe(false);
      await expect(document.body.contains(painel)).toBe(true);
    });

    await step('3. O foco entra no painel e Tab não escapa dele', async () => {
      const painel = await waitForPortal('dialog');
      // O primitivo desta stack nasce com `autoFocus: false` e devolvia o foco
      // ao gatilho — o wrapper inverte o default, e é isto que prova a inversão.
      await waitFor(() => {
        if (!painel.contains(document.activeElement)) {
          throw new Error('o foco não entrou no painel');
        }
      });
      for (let i = 0; i < 6; i++) await userEvent.tab();
      await expect(painel.contains(document.activeElement)).toBe(true);
    });

    await step('4. Escape fecha e devolve o foco ao gatilho', async () => {
      await fechar();
      await waitFor(() => {
        if (document.activeElement !== trigger) {
          throw new Error('o foco não voltou ao gatilho');
        }
      });
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(0);
    });

    await step('5. O botão de fechar do rodapé fecha e devolve o foco ao gatilho', async () => {
      const painel = await abrir(trigger);
      const espiao = args.onCancel as ReturnType<typeof fn>;
      const chamadasAntes = espiao.mock.calls.length;
      await userEvent.click(within(painel).getByRole('button', { name: ROTULO.cancelar }));
      await waitForPortalGone('dialog');
      await expect(espiao.mock.calls.length).toBe(chamadasAntes + 1);
      await waitFor(() => {
        if (document.activeElement !== trigger) {
          throw new Error('o foco não voltou ao gatilho');
        }
      });
    });

    // Termina fechado: a próxima rodada da play precisa do mesmo ponto de
    // partida desta, e é este estado que o Chromatic fotografa.
    await fechar();
  },
};
