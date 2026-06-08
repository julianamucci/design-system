import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { createNavigationMenu } from './navigation-menu';

const meta: Meta = {
  tags: ['navigation'],
  title: 'UI/NavigationMenu/Composicoes',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes do NavigationMenu: LinkSimples (sem submenu), ComDropdown (lista vertical de sub-links), MegaMenuGrid (grid 2 colunas com descrições) e ComCardDestacado (card hero + lista de links). NOTA: a factory createNavigationMenu (Basecoat) NÃO possui Viewport compartilhado — cada Content abre em <div> próprio relativo ao Trigger. Para paridade visual com base-ui/reka-ui/bits-ui, ajustamos classes inline nos casos avançados.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function wrap(child: HTMLElement, minHeight = 280): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.style.contain = 'layout';
  wrapper.className = 'nds-cluster nds-w-full nds-p-2';
  wrapper.dataset.justify = 'center';
  wrapper.style.alignItems = 'flex-start';
  wrapper.style.minHeight = `${minHeight}px`;
  wrapper.appendChild(child);
  return wrapper;
}

async function closeAfter(): Promise<void> {
  await userEvent.keyboard('{Escape}');
  await waitFor(() => {
    if (document.querySelector('[data-slot="navigation-menu"] button[aria-expanded="true"]')) {
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

export const LinkSimples: Story = {
  name: 'Link Simples',
  render: () => {
    const nav = createNavigationMenu([
      { label: 'Início',   href: '/' },
      { label: 'Preços',   href: '/precos' },
      { label: 'Contato',  href: '/contato' },
    ]);
    nav.setAttribute('aria-label', 'Navegação principal');
    return wrap(nav, 200);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Apenas <a> diretos, sem button[aria-haspopup]', async () => {
      const links = canvas.getAllByRole('menuitem');
      await expect(links.length).toBe(3);
      const buttons = canvasElement.querySelectorAll('button[aria-haspopup]');
      await expect(buttons.length).toBe(0);
    });
  },
};

export const ComDropdown: Story = {
  name: 'Com Dropdown',
  render: () => {
    const nav = createNavigationMenu([
      { label: 'Início', href: '/' },
      {
        label: 'Produtos',
        children: [
          { label: 'Plano Inicial',      href: '/produtos/inicial'      },
          { label: 'Plano Profissional', href: '/produtos/profissional' },
          { label: 'Plano Empresarial',  href: '/produtos/empresarial'  },
          { label: 'Comparar planos',    href: '/produtos/comparar'     },
        ],
      },
    ]);
    nav.setAttribute('aria-label', 'Navegação principal');
    openFirstTrigger(nav);
    return wrap(nav);
  },
  play: async ({ canvasElement, step }) => {
    await step('Dropdown abre com 4 sub-links', async () => {
      await waitFor(() => {
        if (!canvasElement.querySelector('[role="menu"]:not(.hidden)')) {
          throw new Error('menu não aberto');
        }
      });
      const links = canvasElement.querySelectorAll('[role="menu"]:not(.hidden) a[role="menuitem"]');
      await expect(links.length).toBe(4);
    });
    await step('Limpa via ESC', closeAfter);
  },
};

export const MegaMenuGrid: Story = {
  name: 'Mega-menu Grid',
  render: () => {
    const nav = createNavigationMenu([
      { label: 'Início', href: '/' },
      {
        label: 'Soluções',
        children: [
          { label: 'Para Marketing',  href: '/solucoes/marketing',  description: 'Automação, leads e campanhas.' },
          { label: 'Para Vendas',     href: '/solucoes/vendas',     description: 'Pipeline, CRM e propostas.'    },
          { label: 'Para Suporte',    href: '/solucoes/suporte',    description: 'Tickets, base de conhecimento.' },
          { label: 'Para Sucesso',    href: '/solucoes/sucesso',    description: 'Onboarding e retenção.'         },
          { label: 'Para Operações',  href: '/solucoes/operacoes',  description: 'Workflows e integrações.'       },
          { label: 'Para Analytics',  href: '/solucoes/analytics',  description: 'Dashboards e relatórios.'       },
        ],
      },
    ]);
    nav.setAttribute('aria-label', 'Navegação principal');

    // Reorganiza Content em grid 2-cols (factory padrão é coluna única).
    const content = nav.querySelector<HTMLElement>('[role="menu"]');
    if (content) {
      content.classList.remove('hidden');
      content.style.minWidth = '560px';
      content.classList.add('nds-grid');
      content.dataset.cols = '2';
      content.dataset.spacing = 'sm';
      content.style.padding = '0.75rem';
      // Abrir após mount
      queueMicrotask(() => {
        const trigger = nav.querySelector<HTMLButtonElement>('button[aria-haspopup]');
        trigger?.click();
      });
    }
    return wrap(nav, 320);
  },
  play: async ({ canvasElement, step }) => {
    await step('Mega-menu abre com 6 sub-links em grid', async () => {
      await waitFor(() => {
        if (!canvasElement.querySelector('[role="menu"]:not(.hidden)')) {
          throw new Error('menu não aberto');
        }
      });
      const panel = canvasElement.querySelector<HTMLElement>('[role="menu"]:not(.hidden)');
      await expect(panel).toHaveClass('nds-grid');
      await expect(panel).toHaveAttribute('data-cols', '2');
      const links = panel?.querySelectorAll('a[role="menuitem"]') ?? [];
      await expect(links.length).toBe(6);
    });
    await step('Sub-links têm descrição', async () => {
      const desc = canvasElement.querySelector('[role="menu"]:not(.hidden) a[role="menuitem"] p');
      await expect(desc).toBeTruthy();
    });
    await step('Limpa via ESC', closeAfter);
  },
};

export const ComCardDestacado: Story = {
  name: 'Com Card Destacado',
  render: () => {
    const nav = createNavigationMenu([
      { label: 'Início', href: '/' },
      {
        label: 'Recursos',
        children: [
          { label: 'Documentação',     href: '/docs',     description: 'Guias completos e referência da API.' },
          { label: 'Tutoriais',        href: '/tutoriais', description: 'Aprenda com exemplos práticos.'       },
          { label: 'Comunidade',       href: '/comunidade', description: 'Fóruns e Discord ativo.'             },
        ],
      },
    ]);
    nav.setAttribute('aria-label', 'Navegação principal');

    // Compõe Content como flex linha: card destacado à esquerda + lista à direita.
    const content = nav.querySelector<HTMLElement>('[role="menu"]');
    if (content) {
      content.style.minWidth = '560px';
      content.classList.add('nds-cluster');
      content.style.gap = '0.75rem';
      content.style.padding = '0.75rem';

      // Card destacado (hero)
      const card = document.createElement('a');
      card.href = '/quickstart';
      card.setAttribute('role', 'menuitem');
      card.className =
        'flex flex-col justify-end w-[220px] rounded-md bg-gradient-to-b from-muted to-accent p-4 no-underline transition-colors hover:from-accent hover:to-accent';
      const cardTitle = document.createElement('div');
      cardTitle.className = 'nds-text-base nds-font-semibold nds-leading-tight';
      cardTitle.textContent = 'Comece em 5 minutos';
      const cardDesc = document.createElement('p');
      cardDesc.className = 'nds-mt-2 nds-text-body nds-text-muted-foreground';
      cardDesc.style.lineHeight = '1.375';
      cardDesc.textContent = 'Crie sua primeira integração com nosso quickstart.';
      card.append(cardTitle, cardDesc);

      // Move card para o início do panel
      content.insertBefore(card, content.firstChild);

      // Empacota os links restantes em uma coluna lateral
      const sideList = document.createElement('div');
      sideList.className = 'nds-stack nds-flex-1';
      sideList.dataset.spacing = 'xs';
      const links = Array.from(content.querySelectorAll<HTMLElement>('a[role="menuitem"]:not(:first-child)'));
      for (const link of links) {
        sideList.appendChild(link);
      }
      content.appendChild(sideList);

      queueMicrotask(() => {
        const trigger = nav.querySelector<HTMLButtonElement>('button[aria-haspopup]');
        trigger?.click();
      });
    }
    return wrap(nav, 320);
  },
  play: async ({ canvasElement, step }) => {
    await step('Card destacado renderizado no mega-menu', async () => {
      await waitFor(() => {
        if (!canvasElement.querySelector('[role="menu"]:not(.hidden)')) {
          throw new Error('menu não aberto');
        }
      });
      const card = canvasElement.querySelector('[role="menu"]:not(.hidden) a[href="/quickstart"]');
      await expect(card).toBeTruthy();
      await expect(card).toHaveClass(/bg-gradient-to-b/);
    });
    await step('Limpa via ESC', closeAfter);
  },
};
