import type { Meta, StoryObj } from '@storybook/html';
import { within, expect, waitFor } from 'storybook/test';
import { createPopover } from './popover';
import { createButton } from './button';
import { createInput } from './input';
import { createLabel } from './label';

const meta: Meta = {
  title: 'UI/Popover/Variantes',
  parameters: {
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
  w.className = 'w-full min-h-[260px] flex items-center justify-center';
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
    content.className = 'text-sm text-muted-foreground';
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
    content.className = 'space-y-2';

    const title = document.createElement('h4');
    title.className = 'text-sm font-medium leading-none';
    title.textContent = 'Configurações de exibição';

    const desc = document.createElement('p');
    desc.className = 'text-xs text-muted-foreground';
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
      await expect(panel?.querySelector('h4')?.textContent).toMatch(/Configurações de exibição/);
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
    content.className = 'space-y-3';
    content.addEventListener('submit', (e) => e.preventDefault());

    const nameRow = document.createElement('div');
    nameRow.className = 'space-y-1';
    nameRow.append(
      createLabel({ text: 'Nome', htmlFor: 'pv-name' }),
      createInput({ id: 'pv-name', placeholder: 'Joana Silva' }),
    );

    const emailRow = document.createElement('div');
    emailRow.className = 'space-y-1';
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
