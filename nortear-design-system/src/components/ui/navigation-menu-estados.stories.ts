import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { createNavigationMenu } from './navigation-menu';

const meta: Meta = {
  tags: ['navigation'],
  title: 'UI/NavigationMenu/Estados',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Estados do NavigationMenu: Fechado (apenas Triggers/Links visíveis), Aberto (Content expandido) e Ativo (Link com aria-current="page" e bg-accent indicando página atual).',
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
  wrapper.className = 'nds-cluster nds-w-full nds-p-2';
  wrapper.dataset.justify = 'center';
  wrapper.style.alignItems = 'flex-start';
  wrapper.style.minHeight = '240px';
  wrapper.appendChild(child);
  return wrapper;
}

async function closeAfter(scope: HTMLElement = document.body): Promise<void> {
  await userEvent.keyboard('{Escape}');
  await waitFor(() => {
    if (scope.querySelector('[data-slot="navigation-menu"] button[aria-expanded="true"]')) {
      throw new Error('Content ainda aberto');
    }
  });
}

function openFirstTrigger(nav: HTMLElement): void {
  queueMicrotask(() => {
    const trigger = nav.querySelector<HTMLButtonElement>('button[aria-haspopup]');
    trigger?.click();
  });
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Fechado: Story = {
  name: 'Fechado',
  render: () => {
    const nav = createNavigationMenu([
      { label: 'Início',  href: '/' },
      {
        label: 'Produtos',
        children: [{ label: 'Plano Inicial', href: '/produtos/inicial' }],
      },
      { label: 'Sobre',  href: '/sobre' },
    ]);
    nav.setAttribute('aria-label', 'Navegação principal');
    return wrap(nav);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Triggers fechados — aria-expanded=false', async () => {
      const trigger = canvas.getByRole('menuitem', { name: /produtos/i });
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });
    await step('Nenhum content visível (todos hidden)', async () => {
      const visible = canvasElement.querySelector('[role="menu"]:not([hidden])');
      await expect(visible).toBeFalsy();
    });
  },
};

export const Aberto: Story = {
  name: 'Aberto',
  render: () => {
    const nav = createNavigationMenu([
      { label: 'Início', href: '/' },
      {
        label: 'Produtos',
        children: [
          { label: 'Plano Inicial',     href: '/produtos/inicial',     description: 'Para times pequenos.'    },
          { label: 'Plano Profissional', href: '/produtos/profissional', description: 'Para empresas em crescimento.' },
          { label: 'Plano Empresarial',  href: '/produtos/empresarial',  description: 'Recursos avançados.' },
        ],
      },
    ]);
    nav.setAttribute('aria-label', 'Navegação principal');
    openFirstTrigger(nav);
    return wrap(nav);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Trigger Produtos aberto com aria-expanded=true', async () => {
      const trigger = canvas.getByRole('menuitem', { name: /produtos/i });
      await waitFor(() => {
        if (trigger.getAttribute('aria-expanded') !== 'true') {
          throw new Error('Trigger não abriu');
        }
      });
      const panel = canvasElement.querySelector('[role="menu"]:not(.hidden)');
      await expect(panel).toBeTruthy();
    });
    await step('Limpa via ESC', () => closeAfter(canvasElement));
  },
};

export const Ativo: Story = {
  name: 'Ativo (página atual)',
  render: () => {
    const nav = createNavigationMenu([
      { label: 'Início',    href: '/' },
      { label: 'Produtos',  href: '/produtos' },
      { label: 'Soluções',  href: '/solucoes' },
      { label: 'Sobre',     href: '/sobre' },
    ]);
    nav.setAttribute('aria-label', 'Navegação principal');

    // Marcar 'Início' como página atual: aria-current="page" + bg-accent.
    const homeLink = nav.querySelector<HTMLAnchorElement>('a[href="/"]');
    if (homeLink) {
      homeLink.setAttribute('aria-current', 'page');
      homeLink.classList.add('nds-bg-accent', 'nds-text-accent-foreground');
    }
    return wrap(nav);
  },
  play: async ({ canvasElement, step }) => {
    await step('Link "Início" possui aria-current="page"', async () => {
      const current = canvasElement.querySelector('a[aria-current="page"]');
      await expect(current).toBeTruthy();
      await expect(current?.textContent?.trim()).toMatch(/início/i);
    });
    await step('Link ativo recebe bg-accent', async () => {
      const current = canvasElement.querySelector('a[aria-current="page"]');
      await expect(current).toHaveClass('nds-bg-accent');
    });
  },
};
