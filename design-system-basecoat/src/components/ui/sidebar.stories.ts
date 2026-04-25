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
  tags: ['autodocs'],
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
  appLabel.className = 'flex items-center gap-2 px-2 py-1 font-semibold text-sm text-sidebar-foreground';
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
        { label: 'Configurações', href: '#' },
        { label: 'Perfil',        href: '#' },
      ],
    }),
  );
  inner.appendChild(content);

  // Footer
  const footer = createSidebarFooter();
  const userRow = document.createElement('div');
  userRow.className = 'flex items-center gap-2 px-2 py-1 text-sm text-sidebar-foreground';
  userRow.textContent = 'Usuário';
  footer.appendChild(userRow);
  inner.appendChild(footer);

  // Inset / main area
  const inset = document.createElement('div');
  inset.className = 'flex flex-1 flex-col';

  const topbar = document.createElement('div');
  topbar.className = 'flex h-12 items-center gap-2 border-b border-border px-4';

  const trigger = createSidebarTrigger(instance.toggle);
  topbar.appendChild(trigger);

  const breadcrumb = document.createElement('span');
  breadcrumb.className = 'text-sm text-muted-foreground';
  breadcrumb.textContent = 'Dashboard';
  topbar.appendChild(breadcrumb);

  const mainContent = document.createElement('div');
  mainContent.className = 'flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground';
  mainContent.textContent = 'Conteúdo principal';

  inset.appendChild(topbar);
  inset.appendChild(mainContent);

  const wrapper = createSidebarProvider();
  wrapper.appendChild(instance.element);
  wrapper.appendChild(inset);

  const container = document.createElement('div');
  container.className = 'min-h-[400px] w-full border border-border rounded-lg overflow-hidden';
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
