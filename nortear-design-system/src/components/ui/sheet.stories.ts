import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect, fn, waitFor } from 'storybook/test';
import { createSheet, type SheetSide } from './sheet';
import { createButton } from './button';
import { createSheetDocs } from '@/components/docs/SheetDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type SheetArgs = {
  triggerLabel: string;
  side: SheetSide;
  title: string;
  description: string;
  cancelLabel: string;
  applyLabel: string;
};

const meta: Meta<SheetArgs> = {
  title: 'UI/Sheet',
  tags: ['autodocs', 'disclosure'],
  parameters: {
    layout: 'centered',
    docs: { page: withAutoDocsTab(createSheetDocs) },
  },
  argTypes: {
    triggerLabel: { control: 'text', description: 'Texto do botão que abre o Sheet.' },
    side: {
      control: { type: 'inline-radio' },
      options: ['top', 'right', 'bottom', 'left'],
      description: 'Lado de onde o painel desliza.',
    },
    title:       { control: 'text', description: 'Texto do SheetTitle (aria-labelledby).' },
    description: { control: 'text', description: 'Texto da SheetDescription (aria-describedby).' },
    cancelLabel: { control: 'text', description: 'Texto do botão de cancelar.' },
    applyLabel:  { control: 'text', description: 'Texto do botão de ação primária.' },
  },
  args: {
    triggerLabel: 'Abrir filtros',
    side: 'right',
    title: 'Filtros avançados',
    description: 'Configure os filtros para refinar os resultados.',
    cancelLabel: 'Cancelar',
    applyLabel: 'Aplicar filtros',
  },
};

export default meta;
type Story = StoryObj<SheetArgs>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildPlayground(args: SheetArgs, onApply?: () => void): HTMLElement {
  const trigger = createButton({ variant: 'outline', label: args.triggerLabel });

  const body = document.createElement('div');
  body.className = 'nds-text-body nds-text-muted-foreground';
  body.textContent = 'Conteúdo do painel (formulário, lista, mensagem).';

  const cancel = createButton({ variant: 'outline', label: args.cancelLabel });
  const apply = createButton({ variant: 'default', label: args.applyLabel });
  const footer = document.createElement('div');
  footer.className = 'nds-cluster';
  footer.dataset.spacing = 'sm';
  footer.append(cancel, apply);

  const closeFromAction = () => {
    const overlay = document.querySelector<HTMLElement>('[data-slot="sheet-overlay"]');
    overlay?.click();
  };
  cancel.addEventListener('click', closeFromAction);
  apply.addEventListener('click', () => {
    onApply?.();
    closeFromAction();
  });

  return createSheet({
    trigger,
    side: args.side,
    title: args.title,
    description: args.description,
    content: body,
    footer,
  });
}

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  render: (args) => buildPlayground(args, fn()),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    const triggerRe = new RegExp(args.triggerLabel, 'i');
    const waitForClose = async () => {
      await waitFor(() => {
        if (body.queryByRole('dialog')) throw new Error('sheet still open');
      }, { timeout: 800 });
    };

    await step('1. Abre ao clicar no trigger', async () => {
      const trigger = canvas.getByRole('button', { name: triggerRe });
      await expect(trigger).toBeInTheDocument();
      await userEvent.click(trigger);
      const dialog = await body.findByRole('dialog');
      await expect(dialog).toHaveAttribute('aria-modal', 'true');
      await expect(dialog).toHaveAccessibleName(new RegExp(args.title, 'i'));
    });

    await step('2. Focus trap — foco move para dentro do painel', async () => {
      const dialog = await body.findByRole('dialog');
      await waitFor(() => {
        if (!dialog.contains(document.activeElement)) throw new Error('focus not trapped');
      });
    });

    await step('3. Escape fecha o painel', async () => {
      await userEvent.keyboard('{Escape}');
      await waitForClose();
    });

    await step('4. Retorno de foco ao trigger após Escape', async () => {
      await waitFor(() => {
        const trigger = canvas.getByRole('button', { name: triggerRe });
        if (document.activeElement !== trigger) throw new Error('focus did not return');
      });
    });

    await step('5. Reabrir e fechar via clique no overlay', async () => {
      const trigger = canvas.getByRole('button', { name: triggerRe });
      await userEvent.click(trigger);
      await body.findByRole('dialog');
      const overlay = document.querySelector<HTMLElement>('[data-slot="sheet-overlay"]');
      await expect(overlay).not.toBeNull();
      overlay?.click();
      await waitForClose();
    });

    await step('6. Reabrir e fechar via botão X', async () => {
      const trigger = canvas.getByRole('button', { name: triggerRe });
      await userEvent.click(trigger);
      const dialog = await body.findByRole('dialog');
      const closeBtn = within(dialog).getByRole('button', { name: /close/i });
      await userEvent.click(closeBtn);
      await waitForClose();
    });
  },
};
