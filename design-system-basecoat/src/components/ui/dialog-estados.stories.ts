import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect } from 'storybook/test';
import { createDialog } from './dialog';
import { createButton } from './button';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  title: 'UI/Dialog/Estados',
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component: 'Configurações canônicas do Dialog: closed, open e sem botão Close.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildDialog(opts: {
  triggerLabel: string;
  title: string;
  description?: string;
  showCloseButton?: boolean;
  openInitially?: boolean;
}): HTMLElement {
  const trigger = createButton({ variant: 'outline', label: opts.triggerLabel });
  const cancel = createButton({ variant: 'outline', label: 'Cancelar' });
  const action = createButton({ variant: 'default', label: 'Salvar alterações' });
  const footer = document.createElement('div');
  footer.className = 'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2';
  footer.appendChild(cancel);
  footer.appendChild(action);
  const content = document.createElement('div');
  content.className = 'text-sm text-muted-foreground';
  content.textContent = 'Conteúdo do diálogo.';
  const dialog = createDialog({
    trigger,
    title: opts.title,
    description: opts.description,
    content,
    footer,
    showCloseButton: opts.showCloseButton,
  });
  if (opts.openInitially) queueMicrotask(() => trigger.click());
  return dialog;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Closed: Story = {
  parameters: {
    docs: { description: { story: 'Estado inicial — apenas o trigger é visível, Content não está no DOM.' } },
  },
  render: () =>
    buildDialog({
      triggerLabel: 'Editar perfil',
      title: 'Editar perfil',
      description: 'Atualize suas informações pessoais.',
    }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const trigger = canvas.getByRole('button', { name: /Editar perfil/i });
    await expect(trigger).toBeVisible();
    await expect(body.queryByRole('dialog')).not.toBeInTheDocument();
  },
};

export const Open: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Diálogo aberto programaticamente. Captura visual no Chromatic.',
      },
    },
  },
  render: () =>
    buildDialog({
      triggerLabel: 'Editar perfil',
      title: 'Editar perfil',
      description: 'Atualize suas informações pessoais.',
      openInitially: true,
    }),
  play: async () => {
    const body = within(document.body);
    const dialog = await body.findByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
  },
};

export const WithCloseButtonHidden: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'showCloseButton=false. Sem X no canto. Fechamento apenas por Escape, overlay ou ações do Footer.',
      },
    },
  },
  render: () =>
    buildDialog({
      triggerLabel: 'Visualizar guia',
      title: 'Próximos passos',
      description: 'Acompanhe o fluxo de onboarding.',
      showCloseButton: false,
      openInitially: true,
    }),
  play: async () => {
    const body = within(document.body);
    const dialog = await body.findByRole('dialog');
    // Não deve haver botão com aria-label="Close"
    await expect(within(dialog).queryByLabelText('Close')).not.toBeInTheDocument();
    // Escape ainda fecha
    await userEvent.keyboard('{Escape}');
    await expect(body.queryByRole('dialog')).not.toBeInTheDocument();
  },
};
