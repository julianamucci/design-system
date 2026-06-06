import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { createNavigationMenu } from './navigation-menu';
import { createNavigationMenuDocs } from '@/components/docs/NavigationMenuDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type NavigationMenuArgs = {
  defaultOpen: boolean;
  delayDuration: number;
  skipDelayDuration: number;
  orientation: 'horizontal' | 'vertical';
};

const meta: Meta<NavigationMenuArgs> = {
  title: 'UI/NavigationMenu',
  tags: ['autodocs', 'navigation'],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(createNavigationMenuDocs) },
  },
  argTypes: {
    defaultOpen: {
      control: 'boolean',
      description: 'Abre o primeiro Trigger com submenu ao montar.',
    },
    delayDuration: {
      control: { type: 'number', min: 0, max: 1000, step: 50 },
      description:
        'Delay em ms antes de abrir Content em hover. NOTA: factory Basecoat abre apenas em click; argType para paridade conceitual com base-ui/reka-ui/bits-ui.',
    },
    skipDelayDuration: {
      control: { type: 'number', min: 0, max: 1000, step: 50 },
      description:
        'Delay para hover consecutivo entre Triggers. NOTA: factory Basecoat não implementa; argType para paridade.',
    },
    orientation: {
      control: { type: 'inline-radio' },
      options: ['horizontal', 'vertical'],
      description:
        'Orientação da lista. NOTA: factory Basecoat fixa horizontal; argType para paridade.',
    },
  },
  args: {
    defaultOpen: false,
    delayDuration: 200,
    skipDelayDuration: 300,
    orientation: 'horizontal',
  },
};

export default meta;
type Story = StoryObj<NavigationMenuArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  render: (args) => {
    const container = document.createElement('div');
    container.style.contain = 'layout';
    container.className = 'nds-cluster nds-w-full nds-p-2';
    container.dataset.justify = 'center';
    container.style.alignItems = 'flex-start';
    container.style.minHeight = '260px';

    const nav = createNavigationMenu([
      { label: 'Início', href: '/' },
      {
        label: 'Produtos',
        children: [
          { label: 'Plano Inicial',     href: '/produtos/inicial',     description: 'Para times pequenos começando.' },
          { label: 'Plano Profissional', href: '/produtos/profissional', description: 'Para empresas em crescimento.' },
          { label: 'Plano Empresarial',  href: '/produtos/empresarial',  description: 'Recursos avançados e SLA.' },
        ],
      },
      {
        label: 'Soluções',
        children: [
          { label: 'Para Marketing', href: '/solucoes/marketing' },
          { label: 'Para Vendas',    href: '/solucoes/vendas'    },
          { label: 'Para Suporte',   href: '/solucoes/suporte'   },
        ],
      },
      { label: 'Sobre', href: '/sobre' },
    ]);
    nav.setAttribute('aria-label', 'Navegação principal');
    container.appendChild(nav);

    if (args.defaultOpen) {
      queueMicrotask(() => {
        const trigger = nav.querySelector<HTMLButtonElement>('button[aria-haspopup]');
        trigger?.click();
      });
    }
    return container;
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);

    await step('Root tem role=navigation com aria-label', async () => {
      const root = canvasElement.querySelector('nav[aria-label="Navegação principal"]');
      await expect(root).toBeTruthy();
    });

    if (!args.defaultOpen) {
      await step('Click em Trigger Produtos abre Content', async () => {
        const trigger = canvas.getByRole('menuitem', { name: /produtos/i });
        await userEvent.click(trigger);
        await waitFor(() => {
          if (trigger.getAttribute('aria-expanded') !== 'true') {
            throw new Error('Trigger não abriu');
          }
        });
      });
    } else {
      await step('Renderiza com primeiro Trigger aberto', async () => {
        await waitFor(() => {
          const open = canvasElement.querySelector('button[aria-expanded="true"]');
          if (!open) throw new Error('Trigger não abriu');
        });
      });
    }

    await step('ESC fecha Content', async () => {
      await userEvent.keyboard('{Escape}');
      await waitFor(() => {
        const open = canvasElement.querySelector('button[aria-expanded="true"]');
        if (open) throw new Error('Content ainda aberto');
      });
    });
  },
};
