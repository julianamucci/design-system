import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import { sanitizeHtml } from '@/lib/sanitize-html';
import {
  createSidebarProvider,
  createSidebar,
  createSidebarTrigger,
  createSidebarContent,
  createSidebarHeader,
  createSidebarFooter,
  createSidebarGroup,
  createSidebarMenuItem,
} from './sidebar';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  title: 'UI/Sidebar/Estados',
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Estados da Sidebar: expandida (padrão), recolhida no modo icon (apenas ícones visíveis) e fixada sem possibilidade de toggle.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helper ───────────────────────────────────────────────────────────────────

function makeIcon(path: string): SVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '16');
  svg.setAttribute('height', '16');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = sanitizeHtml(path);
  return svg;
}

const icons = {
  home:     '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  layout:   '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M9 21V9"/>',
  settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  user:     '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
};

function buildBase(defaultOpen: boolean, collapsible?: 'offcanvas' | 'icon' | 'none'): HTMLElement {
  const instance = createSidebar({ defaultOpen, variant: 'sidebar' });
  const inner = instance.element.querySelector('[data-sidebar="sidebar"]')!;

  if (collapsible === 'none') {
    // remove gap peer so sidebar is always visible
    const gap = instance.element.querySelector('.peer');
    if (gap) (gap as HTMLElement).style.setProperty('--sidebar-width', '16rem');
  }

  const header = createSidebarHeader();
  const logoRow = document.createElement('div');
  logoRow.className = 'px-2 py-1 text-sm font-semibold text-sidebar-foreground';
  logoRow.textContent = 'Design System';
  header.appendChild(logoRow);
  inner.appendChild(header);

  const content = createSidebarContent();
  const menu = document.createElement('ul');
  menu.className = 'flex w-full min-w-0 flex-col gap-1 p-2';
  menu.setAttribute('data-sidebar', 'menu');

  const navItems = [
    { label: 'Dashboard',    icon: icons.home,     active: true  },
    { label: 'Componentes',  icon: icons.layout,   active: false },
    { label: 'Configurações',icon: icons.settings, active: false },
  ];

  navItems.forEach(item => {
    menu.appendChild(createSidebarMenuItem({ label: item.label, icon: makeIcon(item.icon), active: item.active, href: '#' }));
  });

  content.appendChild(menu);
  inner.appendChild(content);

  const footer = createSidebarFooter();
  footer.appendChild(createSidebarMenuItem({ label: 'Perfil', icon: makeIcon(icons.user), href: '#' }));
  inner.appendChild(footer);

  const inset = document.createElement('div');
  inset.className = 'flex flex-1 flex-col';

  const topbar = document.createElement('div');
  topbar.className = 'flex h-12 items-center gap-2 border-b border-border px-4';

  if (collapsible !== 'none') {
    topbar.appendChild(createSidebarTrigger(instance.toggle));
  }

  const stateLabel = document.createElement('span');
  stateLabel.className = 'text-xs text-muted-foreground font-mono';
  stateLabel.textContent = collapsible ? `collapsible="${collapsible}"` : `open=${defaultOpen}`;
  topbar.appendChild(stateLabel);

  const mainContent = document.createElement('div');
  mainContent.className = 'flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground';
  mainContent.textContent = 'Conteúdo principal';

  inset.append(topbar, mainContent);

  const wrapper = createSidebarProvider();
  wrapper.appendChild(instance.element);
  wrapper.appendChild(inset);

  const container = document.createElement('div');
  container.className = 'min-h-[400px] w-full border border-border rounded-lg overflow-hidden';
  container.appendChild(wrapper);
  return container;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Expandido: Story = {
  name: 'Expandido (padrão)',
  render: () => buildBase(true),
  parameters: {
    docs: {
      description: {
        story: 'Estado padrão: sidebar visível em largura total (16rem). Labels e ícones exibidos. <code>data-state="expanded"</code>.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /toggle sidebar/i });

    await step('SidebarTrigger está presente e acessível', async () => {
      await expect(trigger).toBeInTheDocument();
    });

    await step('Sidebar inicia com data-state=expanded', async () => {
      const sidebarRoot = canvasElement.querySelector('[data-state]');
      await expect(sidebarRoot).toHaveAttribute('data-state', 'expanded');
    });
  },
};

export const Recolhido: Story = {
  name: 'Recolhido (offcanvas)',
  render: () => buildBase(false),
  parameters: {
    docs: {
      description: {
        story: 'Estado recolhido via <code>collapsible="offcanvas"</code>: sidebar desliza para fora da viewport. <code>data-state="collapsed"</code>.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Sidebar inicia com data-state=collapsed', async () => {
      const sidebarRoot = canvasElement.querySelector('[data-state]');
      await expect(sidebarRoot).toHaveAttribute('data-state', 'collapsed');
    });
  },
};

export const ModoIcon: Story = {
  name: 'Modo Icon (collapsible icon)',
  render: () => {
    // Build collapsed sidebar to represent icon mode visually
    const instance = createSidebar({ defaultOpen: false, variant: 'sidebar' });
    const gapEl = instance.element.querySelector('.peer') as HTMLElement | null;
    if (gapEl) {
      gapEl.setAttribute('data-state', 'collapsed');
    }

    const inner = instance.element.querySelector('[data-sidebar="sidebar"]')!;

    const header = createSidebarHeader();
    const logoRow = document.createElement('div');
    logoRow.className = 'flex items-center justify-center py-1';
    logoRow.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/></svg>';
    header.appendChild(logoRow);
    inner.appendChild(header);

    const content = createSidebarContent();
    const navItems = [
      { label: 'Dashboard', icon: icons.home, active: true },
      { label: 'Componentes', icon: icons.layout, active: false },
      { label: 'Configurações', icon: icons.settings, active: false },
    ];

    const menu = document.createElement('ul');
    menu.className = 'flex w-full min-w-0 flex-col gap-1 p-2';
    menu.setAttribute('data-sidebar', 'menu');

    navItems.forEach(item => {
      const li = createSidebarMenuItem({
        label: item.label,
        icon: makeIcon(item.icon),
        active: item.active,
        href: '#',
      });
      // Hide label text in icon mode
      const span = li.querySelector('span:last-child');
      if (span) (span as HTMLElement).style.display = 'none';
      menu.appendChild(li);
    });
    content.appendChild(menu);
    inner.appendChild(content);

    const inset = document.createElement('div');
    inset.className = 'flex flex-1 flex-col';

    const topbar = document.createElement('div');
    topbar.className = 'flex h-12 items-center gap-2 border-b border-border px-4';
    topbar.appendChild(createSidebarTrigger(instance.toggle));

    const label = document.createElement('span');
    label.className = 'text-xs text-muted-foreground font-mono';
    label.textContent = 'collapsible="icon"';
    topbar.appendChild(label);

    const mainContent = document.createElement('div');
    mainContent.className = 'flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground';
    mainContent.textContent = 'Sidebar recolhida no modo icon: apenas ícones visíveis';

    inset.append(topbar, mainContent);

    const wrapper = createSidebarProvider();
    wrapper.appendChild(instance.element);
    wrapper.appendChild(inset);

    const container = document.createElement('div');
    container.className = 'min-h-[400px] w-full border border-border rounded-lg overflow-hidden';
    container.appendChild(wrapper);
    return container;
  },
  parameters: {
    docs: {
      description: {
        story: 'Sidebar reduzida a 3rem no modo icon. Apenas ícones são exibidos; tooltips são mostrados ao hover de cada item. <code>data-state="collapsed"</code>.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Sidebar está no estado collapsed', async () => {
      const sidebarRoot = canvasElement.querySelector('[data-state]');
      await expect(sidebarRoot).toHaveAttribute('data-state', 'collapsed');
    });
  },
};

export const SemToggle: Story = {
  name: 'Sem toggle (collapsible none)',
  render: () => buildBase(true, 'none'),
  parameters: {
    docs: {
      description: {
        story: 'Sidebar sempre visível com <code>collapsible="none"</code>. Sem botão de toggle. Usada em dashboards fixos.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Não há SidebarTrigger no DOM', async () => {
      const trigger = canvasElement.querySelector('[data-sidebar="trigger"]');
      await expect(trigger).not.toBeInTheDocument();
    });
  },
};

export const MobileOverlay: Story = {
  name: 'Mobile (Sheet overlay)',
  render: () => {
    const container = buildBase(true);
    const infoEl = document.createElement('div');
    infoEl.className = 'absolute top-2 right-2 rounded bg-muted px-2 py-1 text-xs text-muted-foreground';
    infoEl.textContent = 'Em mobile: Sheet overlay';
    container.style.position = 'relative';
    container.appendChild(infoEl);
    return container;
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Em viewports mobile, a Sidebar é renderizada como Sheet overlay (18rem). Abre via SidebarTrigger ou atalho Ctrl+B.',
      },
    },
  },
};
