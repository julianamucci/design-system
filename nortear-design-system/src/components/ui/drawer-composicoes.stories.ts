import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { createDrawer } from './drawer';
import { createButton } from './button';

const meta: Meta = {
  tags: ['disclosure'],
  title: 'UI/Drawer/Composicoes',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes do Drawer com formulário, confirmação e conteúdo com scroll. Wrapper com contain: layout para confinar o portal em previews.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildField(labelText: string, type: string, value: string): HTMLLabelElement {
  const label = document.createElement('label');
  label.className = 'nds-stack nds-text-body';
  label.dataset.spacing = 'xs';
  const span = document.createElement('span');
  span.className = 'nds-font-medium';
  span.textContent = labelText;
  const input = document.createElement('input');
  input.className = 'nds-border-default nds-rounded-md';
  input.style.padding = '0.5rem 0.75rem';
  input.type = type;
  input.value = value;
  label.append(span, input);
  return label;
}

function buildWrapper(child: HTMLElement): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.style.contain = 'layout';
  wrapper.className = 'nds-cluster nds-w-full';
  wrapper.dataset.justify = 'center';
  wrapper.style.minHeight = '200px';
  wrapper.appendChild(child);
  return wrapper;
}

async function closeAfter(step: any) {
  const body = within(document.body);
  await step('Limpa fechando via ESC antes do postVisit', async () => {
    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      if (body.queryByRole('dialog')) throw new Error('still open');
    });
  });
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const ComFormulario: Story = {
  name: 'Com Formulário',
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Editar perfil' });

    const form = document.createElement('form');
    form.className = 'nds-stack';
    form.dataset.spacing = 'md';
    form.append(
      buildField('Nome', 'text', 'Maria Souza'),
      buildField('E-mail', 'email', 'maria@exemplo.com'),
    );

    const cancel = createButton({ variant: 'outline', label: 'Cancelar' });
    const action = createButton({ variant: 'default', label: 'Salvar alterações' });
    const footer = document.createElement('div');
    footer.className = 'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2';
    footer.append(cancel, action);

    const drawer = createDrawer({
      trigger,
      title: 'Editar perfil',
      description: 'Atualize seus dados pessoais e foto.',
      content: form,
      footer,
    });
    drawer.dataset.slot = 'drawer';
    drawer.dataset.vaulDrawerDirection = 'bottom';
    queueMicrotask(() => trigger.click());
    return buildWrapper(drawer);
  },
  play: async ({ step }) => {
    const body = within(document.body);
    await step('Drawer com formulário visível', async () => {
      const dialog = await body.findByRole('dialog');
      const input = within(dialog).getByDisplayValue(/maria souza/i);
      await expect(input).toBeVisible();
    });
    await closeAfter(step);
  },
};

export const ComConfirmacao: Story = {
  name: 'Com Confirmação',
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Remover item' });

    const body = document.createElement('div');
    body.className = 'nds-text-body nds-text-muted-foreground';
    body.textContent = 'Esta ação remove o item desta lista (continua na biblioteca).';

    const cancel = createButton({ variant: 'outline', label: 'Cancelar' });
    const action = createButton({ variant: 'destructive', label: 'Remover' });
    const footer = document.createElement('div');
    footer.className = 'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2';
    footer.append(cancel, action);

    const drawer = createDrawer({
      trigger,
      title: 'Remover item da lista?',
      description: 'Você poderá adicioná-lo novamente a qualquer momento.',
      content: body,
      footer,
    });
    drawer.dataset.slot = 'drawer';
    drawer.dataset.vaulDrawerDirection = 'bottom';
    queueMicrotask(() => trigger.click());
    return buildWrapper(drawer);
  },
  play: async ({ step }) => {
    const body = within(document.body);
    await step('Drawer com action destrutiva', async () => {
      const dialog = await body.findByRole('dialog');
      const action = within(dialog).getByRole('button', { name: /^Remover$/i });
      await expect(action).toHaveClass(/destructive/);
    });
    await closeAfter(step);
  },
};

export const ComScroll: Story = {
  name: 'Com Scroll',
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Ler termos' });

    const longBody = document.createElement('div');
    longBody.className = 'nds-text-body nds-text-muted-foreground nds-stack overflow-y-auto';
    longBody.dataset.spacing = 'md';
    longBody.style.maxHeight = '16rem';
    longBody.style.paddingRight = '0.5rem';
    for (let i = 1; i <= 12; i++) {
      const p = document.createElement('p');
      p.textContent = `Parágrafo ${i}: termos de uso longos para garantir que o body precise rolar internamente sem expandir o painel.`;
      longBody.appendChild(p);
    }

    const cancel = createButton({ variant: 'outline', label: 'Cancelar' });
    const action = createButton({ variant: 'default', label: 'Aceitar termos' });
    const footer = document.createElement('div');
    footer.className = 'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2';
    footer.append(cancel, action);

    const drawer = createDrawer({
      trigger,
      title: 'Termos de uso',
      description: 'Leia atentamente antes de aceitar.',
      content: longBody,
      footer,
    });
    drawer.dataset.slot = 'drawer';
    drawer.dataset.vaulDrawerDirection = 'bottom';
    queueMicrotask(() => trigger.click());
    return buildWrapper(drawer);
  },
  play: async ({ step }) => {
    const body = within(document.body);
    await step('Drawer com scroll interno renderizado', async () => {
      const dialog = await body.findByRole('dialog');
      const scrollEl = dialog.querySelector('.overflow-y-auto');
      await expect(scrollEl).toBeTruthy();
    });
    await closeAfter(step);
  },
};
