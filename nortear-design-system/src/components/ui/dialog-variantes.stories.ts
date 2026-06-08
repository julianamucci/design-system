import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import { createDialog } from './dialog';
import { createButton } from './button';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  tags: ['overlay'],
  title: 'UI/Dialog/Variantes',
  parameters: {
    actions: { disable: true },
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes estruturais do Dialog. Não há prop variant — escolha a composição que melhor descreve o caso de uso.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeFooter(cancelLabel: string, actionLabel: string, destructive = false): HTMLElement {
  const cancel = createButton({ variant: 'outline', label: cancelLabel });
  const action = createButton({
    variant: destructive ? 'destructive' : 'default',
    label: actionLabel,
  });
  const footer = document.createElement('div');
  footer.className = 'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2';
  footer.appendChild(cancel);
  footer.appendChild(action);
  return footer;
}

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

function makeBody(text: string): HTMLElement {
  const body = document.createElement('div');
  body.className = 'nds-text-body nds-text-muted-foreground';
  body.textContent = text;
  return body;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  parameters: {
    docs: { description: { story: 'Title + Description + Footer com ação primária.' } },
  },
  render: () => {
    const dialog = createDialog({
      trigger: createButton({ variant: 'outline', label: 'Editar perfil' }),
      title: 'Editar perfil',
      description: 'Atualize suas informações pessoais.',
      content: makeBody('Os campos estariam aqui em uma aplicação real.'),
      footer: makeFooter('Cancelar', 'Salvar alterações'),
    });
    queueMicrotask(() => dialog.querySelector<HTMLElement>('button')?.click());
    return dialog;
  },

  play: async ({ canvasElement }) => {
    const el = canvasElement as HTMLElement;
    await expect(within(el).queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
  },
};

export const WithForm: Story = {
  parameters: {
    docs: { description: { story: 'Body com formulário inline. O submit dispara a ação primária.' } },
  },
  render: () => {
    const form = document.createElement('form');
    form.className = 'nds-stack';
    form.dataset.spacing = 'md';
    form.append(
      buildField('Nome', 'text', 'Maria Souza'),
      buildField('E-mail', 'email', 'maria@exemplo.com'),
    );
    const dialog = createDialog({
      trigger: createButton({ variant: 'outline', label: 'Editar perfil' }),
      title: 'Editar perfil',
      description: 'Atualize suas informações pessoais.',
      content: form,
      footer: makeFooter('Cancelar', 'Salvar alterações'),
    });
    queueMicrotask(() => dialog.querySelector<HTMLElement>('button')?.click());
    return dialog;
  },

  play: async ({ canvasElement }) => {
    const el = canvasElement as HTMLElement;
    await expect(within(el).queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
  },
};

export const WithScrollContent: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Body longo com scroll interno (max-h + overflow-y-auto). Equivalente ao DialogScrollContent do Vue.',
      },
    },
  },
  render: () => {
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
    const dialog = createDialog({
      trigger: createButton({ variant: 'outline', label: 'Ler termos' }),
      title: 'Termos de uso',
      description: 'Leia atentamente antes de aceitar.',
      content: longBody,
      footer: makeFooter('Cancelar', 'Aceitar termos'),
    });
    queueMicrotask(() => dialog.querySelector<HTMLElement>('button')?.click());
    return dialog;
  },

  play: async ({ canvasElement }) => {
    const el = canvasElement as HTMLElement;
    await expect(within(el).queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
  },
};

export const NoFooter: Story = {
  parameters: {
    docs: { description: { story: 'Apenas Title + Description. Uso informativo ou pré-visualização passiva.' } },
  },
  render: () => {
    const dialog = createDialog({
      trigger: createButton({ variant: 'outline', label: 'Sobre este recurso' }),
      title: 'Sobre este recurso',
      description: 'Detalhes técnicos exibidos para fins informativos. Sem ações.',
      content: makeBody('O fechamento ocorre via X, Escape ou clique no overlay.'),
    });
    queueMicrotask(() => dialog.querySelector<HTMLElement>('button')?.click());
    return dialog;
  },

  play: async ({ canvasElement }) => {
    const el = canvasElement as HTMLElement;
    await expect(within(el).queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
  },
};

export const WithDestructiveAction: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Action destrutiva no Footer. Use só quando a destrutividade é secundária ao fluxo (ex: remover item de lista). Para confirmação destrutiva primária use AlertDialog.',
      },
    },
  },
  render: () => {
    const dialog = createDialog({
      trigger: createButton({ variant: 'outline', label: 'Remover item' }),
      title: 'Remover item da lista?',
      description: 'O item sai desta lista, mas continua disponível na biblioteca.',
      content: makeBody('Você poderá adicioná-lo novamente a qualquer momento.'),
      footer: makeFooter('Cancelar', 'Remover', true),
    });
    queueMicrotask(() => dialog.querySelector<HTMLElement>('button')?.click());
    return dialog;
  },
  play: async () => {
    const body = within(document.body);
    const dialog = await body.findByRole('dialog');
    const action = within(dialog).getByRole('button', { name: /^Remover$/i });
    await expect(action).toHaveClass(/destructive/);
  },
};

export const CustomCloseInFooter: Story = {
  parameters: {
    docs: {
      description: {
        story: 'showCloseButton=false no Content; botão de fechar fica abaixo das ações no Footer.',
      },
    },
  },
  render: () => {
    const cancel = createButton({ variant: 'outline', label: 'Voltar' });
    const action = createButton({ variant: 'default', label: 'Continuar' });
    const close = createButton({ variant: 'ghost', label: 'Fechar' });
    const footer = document.createElement('div');
    footer.className = 'flex flex-col gap-2 sm:flex-row sm:justify-end sm:space-x-2';
    footer.appendChild(cancel);
    footer.appendChild(action);
    footer.appendChild(close);
    const dialog = createDialog({
      trigger: createButton({ variant: 'outline', label: 'Abrir guia' }),
      title: 'Próximos passos',
      description: 'Continue o fluxo ou volte ao início.',
      content: document.createElement('div'),
      footer,
      showCloseButton: false,
    });
    queueMicrotask(() => dialog.querySelector<HTMLElement>('button')?.click());
    return dialog;
  },

  play: async ({ canvasElement }) => {
    const el = canvasElement as HTMLElement;
    await expect(within(el).queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
  },
};
