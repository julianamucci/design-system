import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect } from 'storybook/test';
import {
  createSidebarProvider,
  createSidebar,
  createSidebarTrigger,
  createSidebarContent,
  createSidebarHeader,
  createSidebarFooter,
  createSidebarGroup,
  createSidebarSeparator,
  type SidebarVariant,
  type SidebarSide,
} from './sidebar';
import { sidebarSource } from './sidebar.source';
import { createSidebarDocs } from '@/components/docs/SidebarDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Types ────────────────────────────────────────────────────────────────────

type SidebarArgs = {
  variant: SidebarVariant;
  side: SidebarSide;
  defaultOpen: boolean;
  /** Ponto de virada entre coluna e gaveta — opção da fábrica da barra. */
  mobileQuery: string;
};

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<SidebarArgs> = {
  title: 'UI/Sidebar',
  tags: ['autodocs', 'layout'],
  parameters: {
    layout: 'fullscreen',
    docs: { page: withAutoDocsTab(createSidebarDocs), source: { transform: sidebarSource } },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['sidebar', 'floating', 'inset'],
      description: 'Estilo visual da sidebar',
      table: {
        type: { summary: `'sidebar' | 'floating' | 'inset'` },
        defaultValue: { summary: `'sidebar'` },
      },
    },
    side: {
      control: 'select',
      options: ['left', 'right'],
      description: 'Posição da sidebar na tela',
      table: { type: { summary: `'left' | 'right'` }, defaultValue: { summary: `'left'` } },
    },
    defaultOpen: {
      control: 'boolean',
      description: 'Estado inicial: expandida (true) ou recolhida (false)',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    mobileQuery: {
      control: 'text',
      description:
        'Ponto de virada entre coluna e gaveta sobreposta. Uma consulta sempre verdadeira, como (min-width: 0px), força a gaveta em qualquer largura.',
      table: { type: { summary: 'string' }, defaultValue: { summary: `'(max-width: 767px)'` } },
    },
  },
  args: {
    variant: 'sidebar',
    side: 'left',
    defaultOpen: true,
    mobileQuery: '(max-width: 767px)',
  },
};

export default meta;
type Story = StoryObj<SidebarArgs>;

// ─── Helper ───────────────────────────────────────────────────────────────────

function buildDemoSidebar(args: SidebarArgs): HTMLElement {
  const instance = createSidebar({
    defaultOpen: args.defaultOpen,
    side: args.side,
    variant: args.variant,
    mobileQuery: args.mobileQuery,
  });

  const inner = instance.element.querySelector('[data-sidebar="sidebar"]')!;

  // Header
  const header = createSidebarHeader();
  const appLabel = document.createElement('div');
  appLabel.className = 'nds-cluster nds-font-semibold nds-text-body';
  appLabel.dataset.spacing = 'sm';
  appLabel.style.padding = '0.25rem 0.5rem';
  appLabel.style.color = 'var(--sidebar-foreground)';
  appLabel.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/></svg>' +
    '<span>Design System</span>';
  header.appendChild(appLabel);
  inner.appendChild(header);

  // Content
  const content = createSidebarContent();
  content.appendChild(
    createSidebarGroup({
      label: 'Navegação',
      items: [
        { label: 'Dashboard',     active: true,  href: '#' },
        { label: 'Componentes',   href: '#' },
        { label: 'Tokens',        href: '#' },
      ],
    }),
  );
  content.appendChild(createSidebarSeparator());
  content.appendChild(
    createSidebarGroup({
      label: 'Conta',
      items: [
        { label: 'Configuracoes', href: '#' },
        { label: 'Perfil',        href: '#' },
      ],
    }),
  );
  inner.appendChild(content);

  // Footer
  const footer = createSidebarFooter();
  const userRow = document.createElement('div');
  userRow.className = 'nds-cluster nds-text-body';
  userRow.dataset.spacing = 'sm';
  userRow.style.padding = '0.25rem 0.5rem';
  userRow.style.color = 'var(--sidebar-foreground)';
  userRow.textContent = 'Usuário';
  footer.appendChild(userRow);
  inner.appendChild(footer);

  // Inset / main area
  const inset = document.createElement('div');
  inset.className = 'nds-flex-1';
  inset.style.display = 'flex';
  inset.style.flexDirection = 'column';

  const topbar = document.createElement('div');
  topbar.className = 'nds-cluster nds-border-b nds-pl-4 nds-pr-4';
  topbar.dataset.spacing = 'sm';
  topbar.style.height = '3rem';

  const trigger = createSidebarTrigger(instance.toggle);
  topbar.appendChild(trigger);

  const breadcrumb = document.createElement('span');
  breadcrumb.className = 'nds-text-body nds-text-muted-foreground';
  breadcrumb.textContent = 'Dashboard';
  topbar.appendChild(breadcrumb);

  const mainContent = document.createElement('div');
  mainContent.className = 'nds-cluster nds-flex-1 nds-text-body nds-text-muted-foreground nds-p-8';
  mainContent.dataset.justify = 'center';
  mainContent.textContent = 'Conteúdo principal';

  inset.appendChild(topbar);
  inset.appendChild(mainContent);

  // A barra é a navegação principal, e navegação precisa de marco nomeado: sem
  // o `<nav aria-label>` o leitor de tela não a lista como região. A fábrica
  // não impõe o elemento — quem compõe é que decide o rótulo.
  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Navegação principal');
  nav.appendChild(instance.element);

  const wrapper = createSidebarProvider();
  wrapper.appendChild(nav);
  wrapper.appendChild(inset);

  const container = document.createElement('div');
  container.className = 'nds-w-full nds-border-default nds-rounded-lg nds-overflow-hidden';
  container.classList.add('nds-min-h-100');
  container.appendChild(wrapper);
  return container;
}

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1', 'functional.item2', 'functional.item6',
      'accessibility.item1', 'accessibility.item2', 'accessibility.item3',
      'accessibility.item4', 'accessibility.item5',
      'visual.item1',
    ],
  },
  render: (args) => buildDemoSidebar(args),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const root = () => canvasElement.querySelector<HTMLElement>('.nds-sidebar-root')!;
    const trigger = () => canvas.getByRole('button', { name: /alternar barra lateral/i });

    await step('A navegação tem nome acessível', async () => {
      // Sem nome no <nav>, a barra é só "navegação" na lista de marcos do
      // leitor de tela — indistinguível de qualquer outra da página.
      await expect(canvas.getByRole('navigation', { name: 'Navegação principal' })).toBeInTheDocument();
    });

    await step('O estado inicial aparece em data-state', async () => {
      await expect(root().getAttribute('data-state')).toBe(
        args.defaultOpen ? 'expanded' : 'collapsed',
      );
    });

    await step('O item ativo é anunciado como página atual', async () => {
      // `data-active` é para o CSS; quem não vê a cor precisa do aria-current.
      const active = canvasElement.querySelector<HTMLElement>('[data-active="true"]')!;
      await expect(active).not.toBeNull();
      await expect(active.getAttribute('aria-current')).toBe('page');
      await expect(active.getAttribute('aria-label')).toBe('Dashboard');
    });

    await step('O ícone do cabeçalho não é lido pelo leitor de tela', async () => {
      const icone = canvasElement.querySelector<SVGElement>('[data-sidebar="header"] svg')!;
      await expect(icone.getAttribute('aria-hidden')).toBe('true');
    });

    await step('O gatilho tem nome acessível, e em português', async () => {
      // Nome EXATO, e não presença: o gatilho é só um ícone, e o nome dele é a
      // única coisa que quem usa leitor de tela recebe. Enquanto o texto era
      // "Toggle sidebar", nenhuma asserção reprovava.
      await expect(trigger()).toHaveAccessibleName('Alternar barra lateral');
    });

    await step('O gatilho alterna o estado — e volta', async () => {
      // Par idempotente: o painel Interactions reexecuta a play no mesmo DOM,
      // e uma única inversão faria a segunda rodada afirmar o oposto.
      const antes = root().getAttribute('data-state');
      await userEvent.click(trigger());
      await expect(root().getAttribute('data-state')).not.toBe(antes);
      await userEvent.click(trigger());
      await expect(root().getAttribute('data-state')).toBe(antes);
    });

    await step('Ctrl+B alterna de qualquer lugar da página', async () => {
      const antes = root().getAttribute('data-state');
      await userEvent.keyboard('{Control>}b{/Control}');
      await expect(root().getAttribute('data-state')).not.toBe(antes);
      await userEvent.keyboard('{Control>}b{/Control}');
      await expect(root().getAttribute('data-state')).toBe(antes);
    });
  },
};
