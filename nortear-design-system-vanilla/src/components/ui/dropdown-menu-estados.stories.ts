import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { createDropdownMenu } from './dropdown-menu';
import { createButton } from './button';
import { sondarOuvintes, hospedeiroDeSonda, conferirLimpeza, type ResultadoDaSonda } from './leak-probe';

const meta: Meta = {
  tags: ['overlay'],
  title: 'UI/DropdownMenu/States',
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

export const Closed: Story = {
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

export const Open: Story = {
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

export const Controlled: Story = {
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

export const ItemDisabled: Story = {
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

// ─── Limpeza de ouvintes ──────────────────────────────────────────────────────
//
// A fábrica registra ouvinte em `document`. Quem tira o nó da página com o
// componente nesse estado não passa por caminho de fechamento nenhum, e antes
// não havia o que chamar. A prova aqui NÃO é "`destroy()` rodou" — isso passaria
// com um `destroy()` vazio. É a contagem de ouvintes do livro-caixa fechando em
// zero, confirmada por uma bateria de eventos disparada no documento depois da
// saída. Ver `leak-probe.ts` para o que cada prova cobre e como pode falhar.

export const ListenerCleanup: Story = {
  parameters: {
    controls: { disable: true },
    // A story existe para o que acontece DEPOIS da saída do nó: a foto seria
    // sempre a mesma legenda.
    chromatic: { disable: true },
  },
  render: () => hospedeiroDeSonda(
    'Sonda de limpeza: o menu é montado, aberto e removido da página pela play.',
  ),
  play: async ({ canvasElement, step }) => {
    const host = canvasElement.querySelector<HTMLElement>('[data-testid="cleanup-host"]');
    await expect(host).not.toBeNull();

    let sonda!: ResultadoDaSonda;

    await step('Monta, leva ao estado que vaza e tira da página', async () => {
      sonda = await sondarOuvintes({
        host: host as HTMLElement,
        montar: () => createDropdownMenu({
          trigger: createButton({ variant: 'outline', label: 'Ações' }),
          items: [
            { type: 'item', label: 'Editar', value: 'edit' },
            { type: 'item', label: 'Excluir', value: 'delete' },
          ],
        }),
        exercitar: (no) => no.querySelector<HTMLElement>('button')?.click(),
        seletorDePortal: '[data-slot="dropdown-menu-content"]',
      });
    });

    await step('Nada sobrou preso ao documento, e destroy() repete sem explodir', async () => {
      await conferirLimpeza(sonda);
    });
  },
};
