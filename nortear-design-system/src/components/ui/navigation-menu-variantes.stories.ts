import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import { createNavigationMenu } from './navigation-menu';

const meta: Meta = {
  tags: ['navigation'],
  title: 'UI/NavigationMenu/Variantes',
  parameters: {
    actions: { disable: true },
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
  wrapper.className = 'nds-cluster nds-w-full nds-p-2';
  wrapper.dataset.justify = 'center';
  wrapper.style.alignItems = 'flex-start';
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
    await step('Lista é horizontal (sem aria-orientation=vertical)', async () => {
      const ul = canvasElement.querySelector('ul[role="menubar"]');
      await expect(ul).toBeTruthy();
      await expect(ul).toHaveClass('nds-navigation-menu-list');
      await expect(ul?.getAttribute('aria-orientation')).not.toBe('vertical');
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
      { label: 'Configuracoes', href: '/configuracoes' },
      { label: 'Sair',        href: '/logout' },
    ]);
    nav.setAttribute('aria-label', 'Navegação lateral');
    nav.style.flexDirection = 'column';
    nav.style.alignItems = 'stretch';

    const ul = nav.querySelector<HTMLElement>('ul[role="menubar"]');
    if (ul) {
      ul.setAttribute('aria-orientation', 'vertical');
      ul.className = 'group nds-stack nds-list-none nds-w-full';
      ul.dataset.spacing = 'xs';
      ul.style.alignItems = 'stretch';
      ul.style.maxWidth = '240px';
    }
    return wrap(nav, 260);
  },
  play: async ({ canvasElement, step }) => {
    await step('Lista vertical (nds-stack + aria-orientation)', async () => {
      const ul = canvasElement.querySelector('ul[role="menubar"]');
      await expect(ul).toHaveAttribute('aria-orientation', 'vertical');
      await expect(ul).toHaveClass('nds-stack');
    });
  },
};
