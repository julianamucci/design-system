import type { Meta, StoryObj } from '@storybook/html';
import { within, expect, waitFor } from 'storybook/test';
import { createPopover } from './popover';
import { createButton } from './button';
import { createInput } from './input';
import { createLabel } from './label';

const meta: Meta = {
  tags: ['overlay'],
  title: 'UI/Popover/Variantes',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Variantes do Popover: Default (apenas conteúdo livre), ComTitulo (PopoverHeader com Title + Description) e Form (formulário inline). NOTA: a factory Basecoat não tem subcomponentes PopoverHeader/Title/Description — usamos HTML semântico (h4/p) dentro do content.',
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
  w.dataset.justify = 'center';
  w.style.minHeight = '260px';
  w.appendChild(child);
  return w;
}

async function waitForOpen(): Promise<void> {
  await waitFor(() => {
    if (!document.querySelector('[data-slot="popover-content"]')) throw new Error('popover fechado');
  }, { timeout: 1500 });
}

async function cleanupPortal(): Promise<void> {
  document.querySelectorAll('[data-slot="popover-content"]').forEach((n) => n.remove());
  await waitFor(() => {
    if (document.querySelector('[data-slot="popover-content"]')) throw new Error('still open');
  });
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  name: 'Default',
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Abrir popover' });

    const content = document.createElement('div');
    content.className = 'nds-text-body nds-text-muted-foreground';
    content.textContent = 'Conteúdo livre dentro do popover, sem header.';

    const el = createPopover({ trigger, content });
    queueMicrotask(() => trigger.click());
    return wrap(el);
  },
  play: async ({ step }) => {
    await step('Content aberto com texto simples', async () => {
      await waitForOpen();
      const panel = document.querySelector<HTMLElement>('[data-slot="popover-content"]');
      await expect(panel?.textContent).toMatch(/Conteúdo livre/);
    });
    await step('Cleanup', async () => {
      await cleanupPortal();
    });
  },
};

export const ComTitulo: Story = {
  name: 'Com Título',
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Abrir popover' });

    const content = document.createElement('div');
    content.className = 'nds-stack';
    content.dataset.spacing = 'xs';

    const title = document.createElement('h4');
    title.className = 'nds-text-body nds-font-medium nds-leading-none';
    title.textContent = 'Configuracoes de exibição';

    const desc = document.createElement('p');
    desc.className = 'nds-text-caption nds-text-muted-foreground';
    desc.textContent = 'Ajuste a aparência do conteúdo da página.';

    content.append(title, desc);

    const el = createPopover({ trigger, content });
    queueMicrotask(() => trigger.click());
    return wrap(el);
  },
  play: async ({ step }) => {
    await step('Content com header (h4 + p)', async () => {
      await waitForOpen();
      const panel = document.querySelector<HTMLElement>('[data-slot="popover-content"]');
      await expect(panel?.querySelector('h4')?.textContent).toMatch(/Configuracoes de exibição/);
      await expect(panel?.querySelector('p')?.textContent).toMatch(/Ajuste a aparência/);
    });
    await step('Cleanup', async () => {
      await cleanupPortal();
    });
  },
};

export const Form: Story = {
  name: 'Form',
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Editar perfil' });

    const content = document.createElement('form');
    content.className = 'nds-stack';
    content.dataset.spacing = 'sm';
    content.addEventListener('submit', (e) => e.preventDefault());

    const nameRow = document.createElement('div');
    nameRow.className = 'nds-stack';
    nameRow.dataset.spacing = 'xs';
    nameRow.append(
      createLabel({ text: 'Nome', htmlFor: 'pv-name' }),
      createInput({ id: 'pv-name', placeholder: 'Joana Silva' }),
    );

    const emailRow = document.createElement('div');
    emailRow.className = 'nds-stack';
    emailRow.dataset.spacing = 'xs';
    emailRow.append(
      createLabel({ text: 'Email', htmlFor: 'pv-email' }),
      createInput({ id: 'pv-email', type: 'email', placeholder: 'joana@example.com' }),
    );

    const submit = createButton({ variant: 'default', size: 'sm', label: 'Atualizar', type: 'submit' });

    content.append(nameRow, emailRow, submit);

    const el = createPopover({ trigger, content });
    queueMicrotask(() => trigger.click());
    return wrap(el);
  },
  play: async ({ step }) => {
    await step('Form inline com Inputs e botão Atualizar', async () => {
      await waitForOpen();
      const panel = document.querySelector<HTMLElement>('[data-slot="popover-content"]');
      const ctx = within(panel!);
      await expect(ctx.getByLabelText(/nome/i)).toBeInTheDocument();
      await expect(ctx.getByLabelText(/email/i)).toBeInTheDocument();
      await expect(ctx.getByRole('button', { name: /atualizar/i })).toBeInTheDocument();
    });
    await step('Cleanup', async () => {
      await cleanupPortal();
    });
  },
};
