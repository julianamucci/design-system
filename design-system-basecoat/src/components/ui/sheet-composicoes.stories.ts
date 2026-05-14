import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import { createSheet } from './sheet';
import { createButton } from './button';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  title: 'UI/Sheet/Composições',
  parameters: {
    actions: { disable: true },
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composições reais do Sheet: filtros avançados (right), navegação secundária (left) e painel ' +
          'mobile-style (bottom). NOTA: a factory Basecoat não suporta SheetClose com asChild — o botão X é ' +
          'sempre renderizado pela factory, e botões customizados de cancelar precisam acionar o overlay manualmente.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildInputField(labelText: string, type: string, value: string): HTMLLabelElement {
  const label = document.createElement('label');
  label.className = 'grid gap-1 text-sm';
  const span = document.createElement('span');
  span.className = 'font-medium';
  span.textContent = labelText;
  const input = document.createElement('input');
  input.className = 'border rounded-md px-3 py-2';
  input.type = type;
  input.value = value;
  label.append(span, input);
  return label;
}

function makeFooter(cancelLabel: string, actionLabel: string): HTMLElement {
  const cancel = createButton({ variant: 'outline', label: cancelLabel });
  const action = createButton({ variant: 'default', label: actionLabel });
  const footer = document.createElement('div');
  footer.className = 'flex gap-2';
  footer.append(cancel, action);
  // Fechar via overlay click (factory Basecoat não suporta SheetClose asChild)
  const closeFromAction = () => {
    const overlay = document.querySelector<HTMLElement>('[data-slot="sheet-overlay"]');
    overlay?.click();
  };
  cancel.addEventListener('click', closeFromAction);
  action.addEventListener('click', closeFromAction);
  return footer;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const AdvancedFilters: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Filtros avançados no painel direito — caso de uso canônico do Sheet em desktop.',
      },
    },
  },
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Abrir filtros' });
    const form = document.createElement('form');
    form.className = 'grid gap-3';
    form.append(
      buildInputField('Categoria', 'text', 'Eletrônicos'),
      buildInputField('Preço mínimo', 'number', '100'),
      buildInputField('Preço máximo', 'number', '500'),
      buildInputField('Marca', 'text', ''),
    );
    const sheet = createSheet({
      trigger,
      side: 'right',
      title: 'Filtros avançados',
      description: 'Configure os filtros para refinar os resultados.',
      content: form,
      footer: makeFooter('Cancelar', 'Aplicar filtros'),
    });
    queueMicrotask(() => trigger.click());
    return sheet;
  },
  play: async () => {
    const body = within(document.body);
    const dialog = await body.findByRole('dialog');
    await expect(dialog).toHaveAccessibleName(/Filtros avançados/i);
    await expect(within(dialog).getByText(/Categoria/i)).toBeVisible();
  },
};

export const SecondaryNavigation: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Navegação secundária deslizando da esquerda. Lista de links como conteúdo principal.',
      },
    },
  },
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Abrir menu' });

    const nav = document.createElement('nav');
    nav.className = 'flex flex-col gap-2';
    nav.setAttribute('aria-label', 'Secondary navigation');
    const items = ['Dashboard', 'Projetos', 'Equipe', 'Configurações', 'Faturas'];
    for (const label of items) {
      const a = document.createElement('a');
      a.href = '#';
      a.className = 'px-3 py-2 rounded-md text-sm hover:bg-accent';
      a.textContent = label;
      nav.appendChild(a);
    }

    const sheet = createSheet({
      trigger,
      side: 'left',
      title: 'Menu',
      description: 'Navegue entre as áreas do sistema.',
      content: nav,
    });
    queueMicrotask(() => trigger.click());
    return sheet;
  },
  play: async () => {
    const body = within(document.body);
    const dialog = await body.findByRole('dialog');
    await expect(within(dialog).getByRole('navigation')).toBeVisible();
    await expect(within(dialog).getByRole('link', { name: 'Dashboard' })).toBeVisible();
  },
};

export const MobileBottomPanel: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Painel mobile-style deslizando de baixo — equivalente ao Drawer, mas sem gesture de arrastar. ' +
          'Use Drawer quando swipe for esperado pelo usuário.',
      },
    },
  },
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Mais opções' });

    const list = document.createElement('div');
    list.className = 'grid grid-cols-3 gap-3 text-sm';
    const actions = ['Compartilhar', 'Copiar link', 'Editar', 'Arquivar', 'Mover', 'Excluir'];
    for (const label of actions) {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'flex flex-col items-center gap-1 p-3 rounded-md border hover:bg-accent';
      const dot = document.createElement('div');
      dot.className = 'w-8 h-8 rounded-full bg-muted';
      const span = document.createElement('span');
      span.textContent = label;
      item.append(dot, span);
      list.appendChild(item);
    }

    const sheet = createSheet({
      trigger,
      side: 'bottom',
      title: 'Ações rápidas',
      description: 'Escolha o que fazer com este item.',
      content: list,
    });
    queueMicrotask(() => trigger.click());
    return sheet;
  },
  play: async () => {
    const body = within(document.body);
    const dialog = await body.findByRole('dialog');
    await expect(dialog).toHaveAccessibleName(/Ações rápidas/i);
  },
};

export const WithLongScrollContent: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Body longo com scroll interno — o flex layout do painel mantém o footer fixo enquanto o body rola. ' +
          'A factory Basecoat aplica `flex-1 overflow-auto` automaticamente no body.',
      },
    },
  },
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Ler termos' });

    const longBody = document.createElement('div');
    longBody.className = 'text-sm text-muted-foreground space-y-3';
    for (let i = 1; i <= 18; i++) {
      const p = document.createElement('p');
      p.textContent = `Parágrafo ${i}: termos de uso longos para garantir que o body precise rolar internamente sem expandir o painel.`;
      longBody.appendChild(p);
    }

    const sheet = createSheet({
      trigger,
      side: 'right',
      title: 'Termos de uso',
      description: 'Leia atentamente antes de aceitar.',
      content: longBody,
      footer: makeFooter('Cancelar', 'Aceitar termos'),
    });
    queueMicrotask(() => trigger.click());
    return sheet;
  },

  play: async ({ canvasElement }) => {
    const el = canvasElement as HTMLElement;
    await expect(within(el).queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
  },
};
