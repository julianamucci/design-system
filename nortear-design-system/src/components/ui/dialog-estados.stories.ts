import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { createDialog } from './dialog';
import { createButton } from './button';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  tags: ['overlay'],
  title: 'UI/Dialog/Estados',
  parameters: {
    actions: { disable: true },
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Configuracoes canônicas do Dialog: closed, open, sem botão Close e controlled (abertura programática via referência ao trigger).',
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
  content.className = 'nds-text-body nds-text-muted-foreground';
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
    await waitFor(() => expect(dialog).toBeVisible());
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

export const Controlled: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          'Abertura controlada externamente. O trigger interno do dialog fica escondido (sr-only) e a abertura acontece via `trigger.click()` a partir de um botão externo. `onOpenChange` rastreia o estado para o pai.',
      },
    },
  },
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-stack';
    wrapper.dataset.spacing = 'md';

    // Trigger interno do dialog (oculto): permite reuso da factory createDialog
    // sem expor um método open() público — o pai controla via .click().
    const hiddenTrigger = createButton({ variant: 'outline', label: 'internal-trigger' });
    hiddenTrigger.classList.add('sr-only');
    hiddenTrigger.setAttribute('tabindex', '-1');
    hiddenTrigger.setAttribute('aria-hidden', 'true');

    const cancel = createButton({ variant: 'outline', label: 'Cancelar' });
    const action = createButton({ variant: 'default', label: 'Confirmar' });
    const footer = document.createElement('div');
    footer.className = 'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2';
    footer.appendChild(cancel);
    footer.appendChild(action);

    const content = document.createElement('div');
    content.className = 'nds-text-body nds-text-muted-foreground';
    content.textContent = 'Este diálogo é comandado por estado externo.';

    let isOpen = false;
    const dialog = createDialog({
      trigger: hiddenTrigger,
      title: 'Controlado pelo pai',
      description: 'Abertura programática via referência ao trigger.',
      content,
      footer,
      onOpenChange: (open) => {
        isOpen = open;
        externalBtn.dataset.open = String(open);
      },
    });

    const externalBtn = createButton({ variant: 'default', label: 'Open programmatically' });
    externalBtn.addEventListener('click', () => {
      if (!isOpen) hiddenTrigger.click();
    });

    wrapper.appendChild(externalBtn);
    wrapper.appendChild(dialog);
    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    await step('Clique no trigger externo abre o diálogo', async () => {
      const trigger = canvas.getByRole('button', { name: /Open programmatically/i });
      await userEvent.click(trigger);
      const dialog = await body.findByRole('dialog');
      await waitFor(() => expect(dialog).toBeVisible());
    });

    await step('Escape fecha o diálogo controlado', async () => {
      await userEvent.keyboard('{Escape}');
      await expect(body.queryByRole('dialog')).not.toBeInTheDocument();
    });
  },
};
