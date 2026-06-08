import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { createDropdownMenu } from './dropdown-menu';
import { createButton } from './button';

const meta: Meta = {
  tags: ['overlay'],
  title: 'UI/DropdownMenu/Estados',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Estados do DropdownMenu: Fechado (apenas trigger), Aberto (defaultOpen via .click()), Controlado (open externo) e ItemDesabilitado (aria-disabled).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function wrap(child: HTMLElement): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.style.contain = 'layout';
  wrapper.className = 'nds-cluster nds-w-full';
  wrapper.dataset.justify = 'center';
  wrapper.style.minHeight = '180px';
  wrapper.appendChild(child);
  return wrapper;
}

function buildBase(opts: {
  triggerLabel: string;
  openInitially?: boolean;
  withDisabled?: boolean;
  onOpenChange?: (open: boolean) => void;
}): { wrapper: HTMLElement; trigger: HTMLButtonElement } {
  const trigger = createButton({ variant: 'outline', label: opts.triggerLabel });
  const items = opts.withDisabled
    ? [
        { type: 'item' as const, label: 'Editar',  value: 'edit' },
        { type: 'item' as const, label: 'Arquivar', value: 'archive', disabled: true },
        { type: 'item' as const, label: 'Excluir', value: 'delete' },
      ]
    : [
        { type: 'item' as const, label: 'Perfil', value: 'profile' },
        { type: 'item' as const, label: 'Configuracoes', value: 'settings' },
        { type: 'separator' as const },
        { type: 'item' as const, label: 'Sair', value: 'logout' },
      ];

  const menu = createDropdownMenu({ trigger, items, onOpenChange: opts.onOpenChange });
  menu.dataset.slot = 'dropdown-menu';

  if (opts.openInitially) queueMicrotask(() => trigger.click());
  return { wrapper: wrap(menu), trigger };
}

async function closeAfter(): Promise<void> {
  const body = within(document.body);
  await userEvent.keyboard('{Escape}');
  await waitFor(() => {
    if (body.queryByRole('menu')) throw new Error('still open');
  });
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Fechado: Story = {
  name: 'Fechado',
  render: () => buildBase({ triggerLabel: 'Abrir menu' }).wrapper,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    await step('Apenas o trigger é renderizado', async () => {
      const trigger = canvas.getByRole('button', { name: /abrir menu/i });
      await expect(trigger).toBeVisible();
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(body.queryByRole('menu')).not.toBeInTheDocument();
    });
  },
};

export const Aberto: Story = {
  name: 'Aberto',
  render: () => buildBase({ triggerLabel: 'Abrir menu', openInitially: true }).wrapper,
  play: async ({ step }) => {
    const body = within(document.body);
    await step('Menu renderiza visível com role=menu', async () => {
      const menu = await body.findByRole('menu');
      await expect(menu).toBeVisible();
      const items = menu.querySelectorAll('[role="menuitem"]');
      await expect(items.length).toBeGreaterThan(0);
    });
    await step('Limpa via ESC antes do postVisit', async () => {
      await closeAfter();
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
    wrapper.style.minHeight = '180px';

    const externalState = { isOpen: false };
    const externalBtn = createButton({ variant: 'default', label: 'Open programmatically' });

    const hiddenTrigger = createButton({ variant: 'outline', label: 'internal-trigger' });
    hiddenTrigger.classList.add('sr-only');
    hiddenTrigger.setAttribute('tabindex', '-1');
    hiddenTrigger.setAttribute('aria-hidden', 'true');

    const menu = createDropdownMenu({
      trigger: hiddenTrigger,
      items: [
        { type: 'item', label: 'Comando A', value: 'a' },
        { type: 'item', label: 'Comando B', value: 'b' },
      ],
      onOpenChange: (open) => {
        externalState.isOpen = open;
        externalBtn.dataset.open = String(open);
      },
    });
    menu.dataset.slot = 'dropdown-menu';

    externalBtn.addEventListener('click', () => {
      if (!externalState.isOpen) hiddenTrigger.click();
    });

    wrapper.append(externalBtn, menu);
    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    await step('Click externo abre o menu', async () => {
      const trigger = canvas.getByRole('button', { name: /open programmatically/i });
      await userEvent.click(trigger);
      const menu = await body.findByRole('menu');
      await expect(menu).toBeVisible();
    });

    await step('ESC fecha menu controlado', async () => {
      await closeAfter();
    });
  },
};

export const ItemDesabilitado: Story = {
  name: 'Item Desabilitado',
  render: () => buildBase({
    triggerLabel: 'Mais ações',
    openInitially: true,
    withDisabled: true,
  }).wrapper,
  play: async ({ step }) => {
    const body = within(document.body);
    await step('Item disabled tem aria-disabled=true', async () => {
      const menu = await body.findByRole('menu');
      const disabled = menu.querySelector('[aria-disabled="true"]');
      await expect(disabled).toBeTruthy();
      await expect(disabled?.textContent).toMatch(/arquivar/i);
    });
    await step('Limpa via ESC', async () => {
      await closeAfter();
    });
  },
};
