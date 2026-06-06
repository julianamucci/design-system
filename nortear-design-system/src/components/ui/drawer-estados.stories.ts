import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { createDrawer } from './drawer';
import { createButton } from './button';

const meta: Meta = {
  tags: ['disclosure'],
  title: 'UI/Drawer/Estados',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Estados canônicos do Drawer: Fechado (apenas trigger), Aberto (defaultOpen), Controlado (open externo via .click()) e NaoDismissible (documenta intent — Basecoat permite ESC/overlay sempre).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildBase(opts: {
  triggerLabel: string;
  title: string;
  description?: string;
  cancelLabel?: string;
  actionLabel?: string;
  openInitially?: boolean;
  onOpenChange?: (open: boolean) => void;
}): { wrapper: HTMLElement; trigger: HTMLElement } {
  const trigger = createButton({ variant: 'outline', label: opts.triggerLabel });
  const cancel = createButton({ variant: 'outline', label: opts.cancelLabel ?? 'Cancelar' });
  const action = createButton({ variant: 'default', label: opts.actionLabel ?? 'Salvar' });
  const footer = document.createElement('div');
  footer.className = 'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2';
  footer.append(cancel, action);

  const content = document.createElement('div');
  content.className = 'nds-text-body nds-text-muted-foreground';
  content.textContent = 'Conteúdo do drawer.';

  const drawer = createDrawer({
    trigger,
    title: opts.title,
    description: opts.description,
    content,
    footer,
    onOpenChange: opts.onOpenChange,
  });
  drawer.dataset.slot = 'drawer';
  drawer.dataset.vaulDrawerDirection = 'bottom';

  const wrapper = document.createElement('div');
  wrapper.style.contain = 'layout';
  wrapper.className = 'nds-cluster nds-w-full';
  wrapper.dataset.justify = 'center';
  wrapper.style.minHeight = '160px';
  wrapper.appendChild(drawer);

  if (opts.openInitially) queueMicrotask(() => trigger.click());
  return { wrapper, trigger };
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Fechado: Story = {
  name: 'Fechado',
  render: () => buildBase({ triggerLabel: 'Abrir drawer', title: 'Editar perfil' }).wrapper,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    await step('Apenas o trigger é renderizado', async () => {
      const trigger = canvas.getByRole('button', { name: /abrir drawer/i });
      await expect(trigger).toBeVisible();
      await expect(body.queryByRole('dialog')).not.toBeInTheDocument();
    });
  },
};

export const Aberto: Story = {
  name: 'Aberto',
  render: () => buildBase({
    triggerLabel: 'Abrir drawer',
    title: 'Editar perfil',
    description: 'Atualize seus dados.',
    openInitially: true,
  }).wrapper,
  play: async ({ step }) => {
    const body = within(document.body);
    await step('Drawer renderiza visível com role=dialog', async () => {
      const dialog = await body.findByRole('dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAttribute('aria-modal', 'true');
    });
    await step('Limpa fechando via ESC antes do postVisit', async () => {
      await userEvent.keyboard('{Escape}');
      await waitFor(() => {
        if (body.queryByRole('dialog')) throw new Error('still open');
      });
    });
  },
};

export const Controlado: Story = {
  name: 'Controlado',
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.style.contain = 'layout';
    wrapper.className = 'nds-stack';
    wrapper.dataset.spacing = 'md';
    wrapper.style.minHeight = '160px';

    const externalState = { isOpen: false };
    const externalBtn = createButton({ variant: 'default', label: 'Open programmatically' });

    const hiddenTrigger = createButton({ variant: 'outline', label: 'internal-trigger' });
    hiddenTrigger.classList.add('sr-only');
    hiddenTrigger.setAttribute('tabindex', '-1');
    hiddenTrigger.setAttribute('aria-hidden', 'true');

    const content = document.createElement('div');
    content.className = 'nds-text-body nds-text-muted-foreground';
    content.textContent = 'Drawer comandado por estado externo.';

    const cancel = createButton({ variant: 'outline', label: 'Cancelar' });
    const action = createButton({ variant: 'default', label: 'Confirmar' });
    const footer = document.createElement('div');
    footer.className = 'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2';
    footer.append(cancel, action);

    const drawer = createDrawer({
      trigger: hiddenTrigger,
      title: 'Controlado',
      description: 'Abertura programática.',
      content,
      footer,
      onOpenChange: (open) => {
        externalState.isOpen = open;
        externalBtn.dataset.open = String(open);
      },
    });
    drawer.dataset.slot = 'drawer';
    drawer.dataset.vaulDrawerDirection = 'bottom';

    externalBtn.addEventListener('click', () => {
      if (!externalState.isOpen) hiddenTrigger.click();
    });

    wrapper.append(externalBtn, drawer);
    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    await step('Click externo abre o drawer', async () => {
      const trigger = canvas.getByRole('button', { name: /open programmatically/i });
      await userEvent.click(trigger);
      const dialog = await body.findByRole('dialog');
      await expect(dialog).toBeVisible();
    });

    await step('ESC fecha drawer controlado', async () => {
      await userEvent.keyboard('{Escape}');
      await waitFor(() => {
        if (body.queryByRole('dialog')) throw new Error('still open');
      });
    });
  },
};

export const NaoDismissible: Story = {
  name: 'Nao Dismissible',
  parameters: {
    docs: {
      description: {
        story:
          'NOTA: a factory createDrawer (Basecoat) sempre permite ESC/overlay/X. Esta story documenta a intenção dismissible=false — a divergência do upstream (vaul) deve ser tratada em camadas superiores via onOpenChange + e.preventDefault em consumidores.',
      },
    },
  },
  render: () => buildBase({
    triggerLabel: 'Abrir confirmação',
    title: 'Confirmação obrigatória',
    description: 'Idealmente bloquearia ESC/overlay (não suportado nativamente).',
    cancelLabel: 'Cancelar',
    actionLabel: 'Confirmar',
    openInitially: true,
  }).wrapper,
  play: async ({ step }) => {
    const body = within(document.body);
    await step('Drawer aberto com Title/Description', async () => {
      const dialog = await body.findByRole('dialog');
      await expect(dialog).toHaveAccessibleName(/confirmação obrigatória/i);
    });
    await step('Limpa via ESC', async () => {
      await userEvent.keyboard('{Escape}');
      await waitFor(() => {
        if (body.queryByRole('dialog')) throw new Error('still open');
      });
    });
  },
};
