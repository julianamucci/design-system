import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { createPopover } from './popover';
import { createButton } from './button';

const meta: Meta = {
  tags: ['overlay'],
  title: 'UI/Popover/Estados',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Estados do Popover: Fechado (apenas trigger), Aberto (defaultOpen via dispatch click), Controlado (botão externo abre/fecha via API interna do trigger) e Focado (foco em elemento interno). NOTA: a factory Basecoat não expõe prop `open` nem `defaultOpen` — o estado é interno e observável via onOpenChange.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function wrap(child: HTMLElement): HTMLElement {
  const w = document.createElement('div');
  w.style.contain = 'layout';
  w.className = 'nds-cluster nds-w-full';
  w.dataset.spacing = 'sm';
  w.dataset.justify = 'center';
  w.style.minHeight = '220px';
  w.appendChild(child);
  return w;
}

function buildSimpleContent(text: string): HTMLElement {
  const c = document.createElement('div');
  c.className = 'nds-text-body nds-text-muted-foreground';
  c.textContent = text;
  return c;
}

async function waitForOpen(): Promise<void> {
  await waitFor(() => {
    if (!document.querySelector('[data-slot="popover-content"]')) throw new Error('popover fechado');
  }, { timeout: 1500 });
}

async function waitForClose(): Promise<void> {
  await waitFor(() => {
    if (document.querySelector('[data-slot="popover-content"]')) throw new Error('popover ainda aberto');
  }, { timeout: 1000 });
}

async function cleanupPortal(): Promise<void> {
  document.querySelectorAll('[data-slot="popover-content"]').forEach((n) => n.remove());
  await waitFor(() => {
    if (document.querySelector('[data-slot="popover-content"]')) throw new Error('still open');
  });
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Fechado: Story = {
  name: 'Fechado',
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Abrir popover' });
    const el = createPopover({ trigger, content: buildSimpleContent('—') });
    return wrap(el);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Trigger visível com aria-expanded=false e portal vazio', async () => {
      const trigger = canvas.getByRole('button', { name: /abrir popover/i });
      await expect(trigger).toBeVisible();
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(document.querySelector('[data-slot="popover-content"]')).toBeNull();
    });
  },
};

export const Aberto: Story = {
  name: 'Aberto',
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Abrir popover' });
    const el = createPopover({ trigger, content: buildSimpleContent('Conteúdo aberto por defaultOpen.') });
    queueMicrotask(() => trigger.click());
    return wrap(el);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Content visível com aria-expanded=true', async () => {
      await waitForOpen();
      const trigger = canvas.getByRole('button', { name: /abrir popover/i });
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      const panel = document.querySelector<HTMLElement>('[data-slot="popover-content"]');
      await expect(panel).toBeVisible();
    });
    await step('Cleanup', async () => {
      await cleanupPortal();
    });
  },
};

export const Controlado: Story = {
  name: 'Controlado',
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.style.contain = 'layout';
    wrapper.className = 'nds-stack';
    wrapper.dataset.spacing = 'sm';
    wrapper.style.minHeight = '220px';
    wrapper.style.alignItems = 'center';

    const status = document.createElement('span');
    status.className = 'nds-text-caption nds-font-mono nds-text-muted-foreground';
    status.textContent = 'open=false';

    const trigger = createButton({ variant: 'outline', label: 'Abrir popover' });
    const externalBtn = createButton({ variant: 'secondary', size: 'sm', label: 'Toggle externo' });

    const el = createPopover({
      trigger,
      content: buildSimpleContent('Popover controlado por trigger interno; estado observado via onOpenChange.'),
      onOpenChange: (open) => {
        status.textContent = `open=${open}`;
      },
    });

    externalBtn.addEventListener('click', () => trigger.click());

    wrapper.append(status, externalBtn, el);
    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Botão externo dispara click no trigger e onOpenChange reflete', async () => {
      const externalBtn = canvas.getByRole('button', { name: /toggle externo/i });
      await userEvent.click(externalBtn);
      await waitForOpen();
      await waitFor(() => {
        if (!canvasElement.textContent?.includes('open=true')) throw new Error('status não atualizou');
      });
    });
    await step('Click externo de novo fecha', async () => {
      const externalBtn = canvas.getByRole('button', { name: /toggle externo/i });
      await userEvent.click(externalBtn);
      await waitForClose();
      await waitFor(() => {
        if (!canvasElement.textContent?.includes('open=false')) throw new Error('status não atualizou');
      });
    });
    await step('Cleanup', async () => {
      await cleanupPortal();
    });
  },
};

export const Focado: Story = {
  name: 'Focado',
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Abrir popover' });

    const content = document.createElement('div');
    content.className = 'nds-stack';
    content.dataset.spacing = 'xs';

    const action = createButton({ variant: 'default', size: 'sm', label: 'Confirmar' });
    content.appendChild(action);

    const el = createPopover({ trigger, content });
    queueMicrotask(() => {
      trigger.click();
      setTimeout(() => action.focus(), 0);
    });
    return wrap(el);
  },
  play: async ({ step }) => {
    await step('Elemento interno recebe foco', async () => {
      await waitForOpen();
      await waitFor(() => {
        const focused = document.activeElement as HTMLElement | null;
        if (!focused || focused.textContent?.trim() !== 'Confirmar') {
          throw new Error('foco não chegou ao botão interno');
        }
      });
    });
    await step('Cleanup', async () => {
      await cleanupPortal();
    });
  },
};
