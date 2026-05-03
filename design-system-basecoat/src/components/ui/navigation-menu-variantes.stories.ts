import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import { createNavigationMenu } from './navigation-menu';

const meta: Meta = {
  title: 'UI/NavigationMenu/Variantes',
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Variantes do NavigationMenu: Horizontal (padrão para header) e Vertical (sidebar/mobile). NOTA: factory createNavigationMenu (Basecoat) fixa orientação horizontal — a variante Vertical é montada manualmente sobrepondo classes Tailwind no <ul role="menubar">.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function wrap(child: HTMLElement, minHeight = 220): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.style.contain = 'layout';
  wrapper.className = 'w-full flex items-start justify-center p-2';
  wrapper.style.minHeight = `${minHeight}px`;
  wrapper.appendChild(child);
  return wrapper;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Horizontal: Story = {
  name: 'Horizontal',
  render: () => {
    const nav = createNavigationMenu([
      { label: 'Início', href: '/' },
      {
        label: 'Produtos',
        children: [
          { label: 'Plano Inicial',     href: '/produtos/inicial'      },
          { label: 'Plano Profissional', href: '/produtos/profissional' },
        ],
      },
      { label: 'Sobre', href: '/sobre' },
    ]);
    nav.setAttribute('aria-label', 'Navegação principal');
    return wrap(nav);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Lista é horizontal (flex-row no <ul>)', async () => {
      const ul = canvasElement.querySelector('ul[role="menubar"]');
      await expect(ul).toBeTruthy();
      await expect(ul).toHaveClass(/items-center/);
    });
    await step('Renderiza 3 items', async () => {
      const items = canvas.getAllByRole('menuitem');
      await expect(items.length).toBe(3);
    });
  },
};

export const Vertical: Story = {
  name: 'Vertical',
  render: () => {
    // Factory Basecoat fixa horizontal — aplicamos classes utilitárias para
    // converter o <ul> em coluna (sidebar/mobile). Itens mantêm role=menuitem.
    const nav = createNavigationMenu([
      { label: 'Início',      href: '/' },
      { label: 'Dashboard',   href: '/dashboard' },
      { label: 'Configurações', href: '/configuracoes' },
      { label: 'Sair',        href: '/logout' },
    ]);
    nav.setAttribute('aria-label', 'Navegação lateral');
    nav.classList.add('flex-col', 'items-stretch');

    const ul = nav.querySelector<HTMLElement>('ul[role="menubar"]');
    if (ul) {
      ul.setAttribute('aria-orientation', 'vertical');
      ul.className =
        'group flex flex-col list-none items-stretch space-y-1 w-full max-w-[240px]';
    }
    return wrap(nav, 260);
  },
  play: async ({ canvasElement, step }) => {
    await step('Lista vertical (flex-col + aria-orientation)', async () => {
      const ul = canvasElement.querySelector('ul[role="menubar"]');
      await expect(ul).toHaveAttribute('aria-orientation', 'vertical');
      await expect(ul).toHaveClass(/flex-col/);
    });
  },
};
