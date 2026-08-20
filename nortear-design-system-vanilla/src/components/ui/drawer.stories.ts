import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { waitForPortal, waitForPortalGone } from '@/lib/wait-for-portal';
import { createDrawer, type DrawerDirection, type DrawerElement } from './drawer';
import { createButton } from './button';
import { limparPortaisDoDrawer } from './drawer-portal-cleanup';
import { createDrawerDocs } from '@/components/docs/DrawerDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type DrawerArgs = {
  triggerLabel: string;
  title: string;
  description: string;
  cancelLabel: string;
  actionLabel: string;
  direction: DrawerDirection;
  defaultOpen: boolean;
  dismissible: boolean;
  modal: boolean;
};

const meta: Meta<DrawerArgs> = {
  title: 'UI/Drawer',
  tags: ['autodocs', 'disclosure'],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(createDrawerDocs) },
  },
  argTypes: {
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
    cancelLabel: {
      control: 'text',
      description: 'Rótulo da ação que fecha o painel.',
      table: { type: { summary: 'string' } },
    },
    actionLabel: {
      control: 'text',
      description: 'Rótulo da ação primária do rodapé.',
      table: { type: { summary: 'string' } },
    },
    direction: {
      control: { type: 'inline-radio' },
      options: ['bottom', 'top', 'left', 'right'],
      description: 'Direção de entrada do painel.',
      table: { type: { summary: "'bottom' | 'top' | 'left' | 'right'" }, defaultValue: { summary: "'bottom'" } },
    },
    defaultOpen: {
      control: 'boolean',
      description: 'Abre o painel assim que a story roda.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    dismissible: {
      control: 'boolean',
      description: 'Permite fechar via ESC ou clique no overlay.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    modal: {
      control: 'boolean',
      description: 'Bloqueia interação com o resto da página quando aberto.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
  },
  args: {
    triggerLabel: 'Abrir drawer',
    title: 'Editar perfil',
    description: 'Atualize seus dados pessoais e foto.',
    cancelLabel: 'Cancelar',
    actionLabel: 'Confirmar',
    direction: 'bottom',
    defaultOpen: false,
    dismissible: true,
    modal: true,
  },
};

export default meta;
type Story = StoryObj<DrawerArgs>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildDrawerEl(args: DrawerArgs): HTMLElement {
  const trigger = createButton({ variant: 'outline', label: args.triggerLabel });

  const content = document.createElement('div');
  content.className = 'nds-text-body nds-text-muted-foreground';
  content.textContent = 'Conteúdo do drawer (formulário, mensagem, mídia).';

  // `data-slot="drawer-close"` é o que faz a factory ligar o fechamento ao
  // botão — o equivalente desta stack ao componente DrawerClose das outras.
  const cancel = createButton({ variant: 'outline', label: args.cancelLabel });
  cancel.dataset.slot = 'drawer-close';

  const footer = document.createElement('div');
  footer.className = 'nds-cluster';
  footer.dataset.justify = 'end';
  footer.dataset.spacing = 'xs';
  footer.append(cancel, createButton({ variant: 'default', label: args.actionLabel }));

  return createDrawer({
    trigger,
    direction: args.direction,
    title: args.title,
    description: args.description,
    content,
    footer,
    dismissible: args.dismissible,
    modal: args.modal,
  });
}

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1', 'functional.item2', 'functional.item3', 'functional.item4',
      'accessibility.item3', 'accessibility.item4', 'accessibility.item5',
    ],
  },
  // A abertura inicial NÃO acontece no render. Ela acontecia, por
  // `queueMicrotask(() => trigger.click())`, e o runner chama o render mais de
  // uma vez por story: saíam DOIS painéis no body, e a busca por papel passava a
  // falhar com "found multiple elements" — a causa das nove falhas desta stack.
  render: (args) => {
    const container = document.createElement('div');
    container.className = 'nds-cluster nds-w-full';
    container.dataset.justify = 'center';
    container.appendChild(buildDrawerEl(args));
    return container;
  },
  play: async ({ canvasElement, step, args }) => {
    limparPortaisDoDrawer();
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: args.triggerLabel });

    // Par idempotente: o painel Interactions REEXECUTA a play no mesmo DOM, e um
    // clique cego partiria do estado que a rodada anterior deixou.
    const abrir = async () => {
      if (within(document.body).queryAllByRole('dialog').length === 0) {
        await userEvent.click(trigger);
      }
      return await waitForPortal('dialog');
    };
    const fechar = async () => {
      if (within(document.body).queryAllByRole('dialog').length > 0) {
        await userEvent.keyboard('{Escape}');
      }
      await waitForPortalGone('dialog');
    };

    await fechar();

    await step('1. Clicar no gatilho abre o painel, com nome e descrição acessíveis', async () => {
      const painel = await abrir();
      await expect(painel).toBeVisible();
      await expect(painel).toHaveAttribute('role', 'dialog');
      await expect(painel).toHaveAttribute('aria-modal', 'true');
      await expect(painel).toHaveAccessibleName(args.title);
      await expect(painel).toHaveAccessibleDescription(args.description);
      await expect(painel).toHaveAttribute('data-vaul-drawer-direction', args.direction);
      await expect(painel).toHaveClass(/nds-drawer-content/);
    });

    await step('2. O painel é portalizado para fora da story', async () => {
      const painel = await waitForPortal('dialog');
      await expect(canvasElement.contains(painel)).toBe(false);
      await expect(document.body.contains(painel)).toBe(true);
    });

    await step('3. O foco entra no painel e Tab não escapa dele', async () => {
      const painel = await waitForPortal('dialog');
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
      const painel = await abrir();
      await userEvent.click(within(painel).getByRole('button', { name: args.cancelLabel }));
      await waitForPortalGone('dialog');
      await waitFor(() => {
        if (document.activeElement !== trigger) {
          throw new Error('o foco não voltou ao gatilho');
        }
      });
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(0);
    });

    await step('6. Abrir e fechar por código, sem passar pelo gatilho', async () => {
      // A gaveta só nascia de um clique: quem precisava abri-la a partir de um
      // atalho, de uma rota ou de uma resposta do servidor tinha de sintetizar
      // um `.click()` no gatilho. Os verbos são os mesmos do Sidebar desta
      // stack, em inglês.
      const gaveta = canvasElement.querySelector('[data-slot="drawer"]') as DrawerElement;
      await expect(gaveta.isOpen()).toBe(false);

      gaveta.open();
      await waitForPortal('dialog');
      await expect(gaveta.isOpen()).toBe(true);

      gaveta.toggle();
      await waitForPortalGone('dialog');
      await expect(gaveta.isOpen()).toBe(false);
    });

    // O control `defaultOpen` decide o estado FINAL — que é o que o Chromatic
    // fotografa e o axe examina.
    if (args.defaultOpen) await abrir();
  },
};
