import type { Meta, StoryObj } from '@storybook/html';
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
import { createSidebarDocs } from '@/components/docs/SidebarDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Types ────────────────────────────────────────────────────────────────────

type SidebarArgs = {
  variant: SidebarVariant;
  side: SidebarSide;
  defaultOpen: boolean;
};

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<SidebarArgs> = {
  title: 'UI/Sidebar',
  tags: ['autodocs', 'layout'],
  parameters: {
    layout: 'fullscreen',
    docs: { page: withAutoDocsTab(createSidebarDocs) },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['sidebar', 'floating', 'inset'],
      description: 'Estilo visual da sidebar',
    },
    side: {
      control: 'select',
      options: ['left', 'right'],
      description: 'Posição da sidebar na tela',
    },
    defaultOpen: {
      control: 'boolean',
      description: 'Estado inicial: expandida (true) ou recolhida (false)',
    },
  },
  args: {
    variant: 'sidebar',
    side: 'left',
    defaultOpen: true,
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
  topbar.className = 'nds-cluster nds-border-b';
  topbar.dataset.spacing = 'sm';
  topbar.style.height = '3rem';
  topbar.style.paddingLeft = '1rem';
  topbar.style.paddingRight = '1rem';

  const trigger = createSidebarTrigger(instance.toggle);
  topbar.appendChild(trigger);

  const breadcrumb = document.createElement('span');
  breadcrumb.className = 'nds-text-body nds-text-muted-foreground';
  breadcrumb.textContent = 'Dashboard';
  topbar.appendChild(breadcrumb);

  const mainContent = document.createElement('div');
  mainContent.className = 'nds-cluster nds-flex-1 nds-text-body nds-text-muted-foreground';
  mainContent.dataset.justify = 'center';
  mainContent.style.padding = '2rem';
  mainContent.textContent = 'Conteúdo principal';

  inset.appendChild(topbar);
  inset.appendChild(mainContent);

  const wrapper = createSidebarProvider();
  wrapper.appendChild(instance.element);
  wrapper.appendChild(inset);

  const container = document.createElement('div');
  container.className = 'nds-w-full nds-border-default nds-rounded-lg nds-overflow-hidden';
  container.style.minHeight = '400px';
  container.appendChild(wrapper);
  return container;
}

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  render: (args) => buildDemoSidebar(args),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /toggle sidebar/i });

    await step('SidebarTrigger está acessível', async () => {
      await expect(trigger).toBeInTheDocument();
    });

    await step('Clicar no trigger alterna o estado da sidebar', async () => {
      await userEvent.click(trigger);
    });
  },
};
