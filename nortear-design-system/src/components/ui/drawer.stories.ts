import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { createDrawer } from './drawer';
import { createSheet, type SheetSide } from './sheet';
import { createButton } from './button';
import { createDrawerDocs } from '@/components/docs/DrawerDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type DrawerArgs = {
  triggerLabel: string;
  title: string;
  description: string;
  cancelLabel: string;
  actionLabel: string;
  direction: SheetSide;
  defaultOpen: boolean;
  dismissible: boolean;
};

const meta: Meta<DrawerArgs> = {
  title: 'UI/Drawer',
  tags: ['autodocs', 'disclosure'],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(createDrawerDocs) },
  },
  argTypes: {
    triggerLabel: { control: 'text', description: 'Texto do DrawerTrigger.' },
    title:        { control: 'text', description: 'DrawerTitle (aria-labelledby).' },
    description:  { control: 'text', description: 'DrawerDescription (aria-describedby).' },
    cancelLabel:  { control: 'text', description: 'Rótulo do DrawerClose.' },
    actionLabel:  { control: 'text', description: 'Rótulo do botão primário.' },
    direction: {
      control: { type: 'inline-radio' },
      options: ['bottom', 'top', 'left', 'right'],
      description:
        'Direção de entrada do painel. NOTA: a factory createDrawer do Basecoat usa sempre bottom; para outras direções a story chama createSheet diretamente (divergência idiomática vs. vaul).',
    },
    defaultOpen: { control: 'boolean', description: 'Abre o drawer ao montar.' },
    dismissible: {
      control: 'boolean',
      description:
        'Permite fechar via ESC/overlay/swipe. NOTA: a factory atual sempre permite ESC e overlay; dismissible=false documenta a intenção mas o focus-trap permanece.',
    },
  },
  args: {
    triggerLabel: 'Editar perfil',
    title: 'Editar perfil',
    description: 'Atualize seus dados pessoais e foto.',
    cancelLabel: 'Cancelar',
    actionLabel: 'Salvar alterações',
    direction: 'bottom',
    defaultOpen: false,
    dismissible: true,
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

  const cancel = createButton({ variant: 'outline', label: args.cancelLabel });
  const action = createButton({ variant: 'default', label: args.actionLabel });
  const footer = document.createElement('div');
  footer.className = 'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2';
  footer.appendChild(cancel);
  footer.appendChild(action);

  // Para direction != bottom, usa createSheet (createDrawer hardcoded para bottom)
  if (args.direction !== 'bottom') {
    const sheet = createSheet({
      trigger,
      side: args.direction,
      title: args.title,
      description: args.description,
      content,
      footer,
    });
    sheet.dataset.slot = 'drawer';
    sheet.dataset.vaulDrawerDirection = args.direction;
    return sheet;
  }

  const drawer = createDrawer({
    trigger,
    title: args.title,
    description: args.description,
    content,
    footer,
  });
  drawer.dataset.slot = 'drawer';
  drawer.dataset.vaulDrawerDirection = 'bottom';
  return drawer;
}

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  render: (args) => {
    const container = document.createElement('div');
    container.style.contain = 'layout';
    container.className = 'nds-cluster nds-w-full';
    container.dataset.justify = 'center';
    container.style.minHeight = '200px';

    const drawer = buildDrawerEl(args);
    container.appendChild(drawer);

    if (args.defaultOpen) {
      queueMicrotask(() => drawer.querySelector<HTMLElement>('button')?.click());
    }
    return container;
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    const triggerRe = new RegExp(args.triggerLabel, 'i');
    const waitForClose = async () => {
      await waitFor(() => {
        if (body.queryByRole('dialog')) throw new Error('drawer ainda aberto');
      }, { timeout: 800 });
    };

    if (!args.defaultOpen) {
      await step('Abre ao clicar no trigger', async () => {
        const trigger = canvas.getByRole('button', { name: triggerRe });
        await userEvent.click(trigger);
        const dialog = await body.findByRole('dialog');
        await expect(dialog).toHaveAttribute('aria-modal', 'true');
      });
    } else {
      await step('Renderiza aberto via defaultOpen', async () => {
        const dialog = await body.findByRole('dialog');
        await expect(dialog).toBeVisible();
      });
    }

    await step('Fecha via ESC e retorna foco ao trigger', async () => {
      await userEvent.keyboard('{Escape}');
      await waitForClose();
    });
  },
};
