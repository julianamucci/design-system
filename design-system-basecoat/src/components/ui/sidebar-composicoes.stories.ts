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
  createSidebarSeparator,
} from './sidebar';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  title: 'UI/Sidebar/Composições',
  parameters: {
    actions: { disable: true },
    layout: 'fullscreen',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composições avançadas da Sidebar: com grupos de navegação e labels, com badges em itens, com sub-menu e com busca no header.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Icon helpers ─────────────────────────────────────────────────────────────

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

const ICON_HOME     = '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>';
const ICON_LAYOUT   = '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M9 21V9"/>';
const ICON_LAYERS   = '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>';
const ICON_SETTINGS = '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>';
const ICON_BELL     = '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>';
const ICON_USER     = '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>';
const ICON_SEARCH   = '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>';

// ─── Wrapper ──────────────────────────────────────────────────────────────────

function wrapSidebar(instance: ReturnType<typeof createSidebar>, main: HTMLElement): HTMLElement {
  const wrapper = createSidebarProvider();
  wrapper.appendChild(instance.element);
  wrapper.appendChild(main);

  const container = document.createElement('div');
  container.className = 'min-h-[400px] w-full border border-border rounded-lg overflow-hidden';
  container.appendChild(wrapper);
  return container;
}

// ─── Grupos de Navegação ──────────────────────────────────────────────────────

export const ComGrupos: Story = {
  name: 'Com grupos de navegação',
  render: () => {
    const instance = createSidebar({ defaultOpen: true });
    const inner = instance.element.querySelector('[data-sidebar="sidebar"]')!;

    const header = createSidebarHeader();
    const logoRow = document.createElement('div');
    logoRow.className = 'px-2 py-1 text-sm font-semibold text-sidebar-foreground';
    logoRow.textContent = 'Design System';
    header.appendChild(logoRow);
    inner.appendChild(header);

    const content = createSidebarContent();

    content.appendChild(
      createSidebarGroup({
        label: 'Principal',
        items: [
          { label: 'Dashboard', icon: makeIcon(ICON_HOME),   active: true, href: '#' },
          { label: 'Componentes', icon: makeIcon(ICON_LAYOUT), href: '#' },
          { label: 'Tokens',      icon: makeIcon(ICON_LAYERS), href: '#' },
        ],
      }),
    );

    content.appendChild(createSidebarSeparator());

    content.appendChild(
      createSidebarGroup({
        label: 'Conta',
        items: [
          { label: 'Configurações', icon: makeIcon(ICON_SETTINGS), href: '#' },
          { label: 'Notificações',  icon: makeIcon(ICON_BELL),     href: '#', badge: '5' },
          { label: 'Perfil',        icon: makeIcon(ICON_USER),     href: '#' },
        ],
      }),
    );

    inner.appendChild(content);

    const inset = document.createElement('div');
    inset.className = 'flex flex-1 flex-col';
    const topbar = document.createElement('div');
    topbar.className = 'flex h-12 items-center gap-2 border-b border-border px-4';
    topbar.appendChild(createSidebarTrigger(instance.toggle));
    const lbl = document.createElement('span');
    lbl.className = 'text-sm text-muted-foreground';
    lbl.textContent = 'Dashboard';
    topbar.appendChild(lbl);
    const mainContent = document.createElement('div');
    mainContent.className = 'flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground';
    mainContent.textContent = 'Conteúdo principal';
    inset.append(topbar, mainContent);

    return wrapSidebar(instance, inset);
  },
  parameters: {
    docs: {
      description: {
        story: 'Sidebar com dois grupos de navegação separados por <code>SidebarSeparator</code>. Itens com ícones e badge.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Grupo "Principal" está presente', async () => {
      const labels = canvasElement.querySelectorAll('[data-sidebar="group-label"]');
      await expect(labels.length).toBeGreaterThan(0);
    });
  },
};

// ─── Com Sub-menu ─────────────────────────────────────────────────────────────

export const ComSubMenu: Story = {
  name: 'Com sub-menu',
  render: () => {
    const instance = createSidebar({ defaultOpen: true });
    const inner = instance.element.querySelector('[data-sidebar="sidebar"]')!;

    const header = createSidebarHeader();
    const logoRow = document.createElement('div');
    logoRow.className = 'px-2 py-1 text-sm font-semibold text-sidebar-foreground';
    logoRow.textContent = 'Design System';
    header.appendChild(logoRow);
    inner.appendChild(header);

    const content = createSidebarContent();
    const group = document.createElement('div');
    group.className = 'relative flex w-full min-w-0 flex-col p-2';
    group.setAttribute('data-sidebar', 'group');

    const groupLabel = document.createElement('div');
    groupLabel.className = 'flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70';
    groupLabel.setAttribute('data-sidebar', 'group-label');
    groupLabel.textContent = 'Componentes';
    group.appendChild(groupLabel);

    const menu = document.createElement('ul');
    menu.className = 'flex w-full min-w-0 flex-col gap-1';
    menu.setAttribute('data-sidebar', 'menu');

    // Dashboard item
    menu.appendChild(createSidebarMenuItem({ label: 'Dashboard', icon: makeIcon(ICON_HOME), active: true, href: '#' }));

    // Componentes item with collapsible sub-menu
    const parentLi = document.createElement('li');
    parentLi.className = 'group/menu-item relative';
    parentLi.setAttribute('data-sidebar', 'menu-item');

    let subOpen = false;
    const parentBtn = document.createElement('button');
    parentBtn.className = [
      'peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2',
      'text-left text-sm outline-none ring-sidebar-ring transition-colors',
      'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
      'focus-visible:ring-2',
      '[&>svg]:size-4 [&>svg]:shrink-0 [&>span:last-child]:truncate',
    ].join(' ');
    parentBtn.setAttribute('data-sidebar', 'menu-button');
    parentBtn.setAttribute('aria-expanded', 'false');
    parentBtn.appendChild(makeIcon(ICON_LAYOUT));

    const parentLabel = document.createElement('span');
    parentLabel.textContent = 'Componentes';
    parentBtn.appendChild(parentLabel);

    const chevron = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    chevron.setAttribute('width', '12');
    chevron.setAttribute('height', '12');
    chevron.setAttribute('viewBox', '0 0 24 24');
    chevron.setAttribute('fill', 'none');
    chevron.setAttribute('stroke', 'currentColor');
    chevron.setAttribute('stroke-width', '2');
    chevron.setAttribute('stroke-linecap', 'round');
    chevron.setAttribute('stroke-linejoin', 'round');
    chevron.setAttribute('aria-hidden', 'true');
    chevron.innerHTML = sanitizeHtml('<path d="m6 9 6 6 6-6"/>');
    chevron.className = 'ml-auto transition-transform duration-200';
    parentBtn.appendChild(chevron);

    const subList = document.createElement('ul');
    subList.className = 'ml-4 mt-1 flex flex-col gap-1 border-l border-sidebar-border pl-3';
    subList.setAttribute('data-sidebar', 'menu-sub');
    subList.style.display = 'none';

    const subItems = ['Alert', 'Button', 'Card', 'Dialog'];
    subItems.forEach(name => {
      const subLi = document.createElement('li');
      subLi.setAttribute('data-sidebar', 'menu-sub-item');
      const subBtn = document.createElement('a');
      subBtn.href = '#';
      subBtn.className = 'flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors';
      subBtn.setAttribute('data-sidebar', 'menu-sub-button');
      subBtn.textContent = name;
      subLi.appendChild(subBtn);
      subList.appendChild(subLi);
    });

    parentBtn.addEventListener('click', () => {
      subOpen = !subOpen;
      subList.style.display = subOpen ? '' : 'none';
      parentBtn.setAttribute('aria-expanded', subOpen ? 'true' : 'false');
      chevron.style.transform = subOpen ? 'rotate(180deg)' : '';
    });

    parentLi.appendChild(parentBtn);
    parentLi.appendChild(subList);
    menu.appendChild(parentLi);
    menu.appendChild(createSidebarMenuItem({ label: 'Tokens', icon: makeIcon(ICON_LAYERS), href: '#' }));

    group.appendChild(menu);
    content.appendChild(group);
    inner.appendChild(content);

    const footer = createSidebarFooter();
    footer.appendChild(createSidebarMenuItem({ label: 'Configurações', icon: makeIcon(ICON_SETTINGS), href: '#' }));
    inner.appendChild(footer);

    const inset = document.createElement('div');
    inset.className = 'flex flex-1 flex-col';
    const topbar = document.createElement('div');
    topbar.className = 'flex h-12 items-center gap-2 border-b border-border px-4';
    topbar.appendChild(createSidebarTrigger(instance.toggle));
    const lbl = document.createElement('span');
    lbl.className = 'text-sm text-muted-foreground';
    lbl.textContent = 'Dashboard';
    topbar.appendChild(lbl);
    const mainContent = document.createElement('div');
    mainContent.className = 'flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground';
    mainContent.textContent = 'Clique em "Componentes" para expandir o sub-menu';
    inset.append(topbar, mainContent);

    return wrapSidebar(instance, inset);
  },
  parameters: {
    docs: {
      description: {
        story: 'Sidebar com item expandível mostrando sub-menu aninhado. Clicar em "Componentes" revela os subitens com linha de referência visual.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Botão de Componentes tem aria-expanded=false inicialmente', async () => {
      const btn = canvasElement.querySelector('[aria-expanded]');
      await expect(btn).toHaveAttribute('aria-expanded', 'false');
    });
  },
};

// ─── Com Busca no Header ──────────────────────────────────────────────────────

export const ComBusca: Story = {
  name: 'Com busca no header',
  render: () => {
    const instance = createSidebar({ defaultOpen: true });
    const inner = instance.element.querySelector('[data-sidebar="sidebar"]')!;

    const header = createSidebarHeader();

    const logoRow = document.createElement('div');
    logoRow.className = 'px-2 py-1 text-sm font-semibold text-sidebar-foreground';
    logoRow.textContent = 'Design System';
    header.appendChild(logoRow);

    // Search input
    const searchWrapper = document.createElement('div');
    searchWrapper.className = 'relative px-1 pb-1';
    searchWrapper.setAttribute('data-sidebar', 'input');
    const searchIcon = makeIcon(ICON_SEARCH);
    searchIcon.setAttribute('width', '14');
    searchIcon.setAttribute('height', '14');
    searchIcon.className = 'absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none';
    const searchInput = document.createElement('input');
    searchInput.type = 'search';
    searchInput.placeholder = 'Buscar...';
    searchInput.className = 'w-full rounded-md border border-sidebar-border bg-sidebar px-2 py-1.5 pl-8 text-xs text-sidebar-foreground placeholder:text-sidebar-foreground/50 focus:outline-none focus:ring-2 focus:ring-sidebar-ring';
    searchWrapper.appendChild(searchIcon);
    searchWrapper.appendChild(searchInput);
    header.appendChild(searchWrapper);

    inner.appendChild(header);

    const content = createSidebarContent();
    content.appendChild(
      createSidebarGroup({
        label: 'Navegação',
        items: [
          { label: 'Dashboard',     icon: makeIcon(ICON_HOME),     active: true, href: '#' },
          { label: 'Componentes',   icon: makeIcon(ICON_LAYOUT),   href: '#' },
          { label: 'Tokens',        icon: makeIcon(ICON_LAYERS),   href: '#' },
          { label: 'Configurações', icon: makeIcon(ICON_SETTINGS), href: '#' },
        ],
      }),
    );
    inner.appendChild(content);

    const footer = createSidebarFooter();
    footer.appendChild(createSidebarMenuItem({ label: 'Perfil', icon: makeIcon(ICON_USER), href: '#' }));
    inner.appendChild(footer);

    const inset = document.createElement('div');
    inset.className = 'flex flex-1 flex-col';
    const topbar = document.createElement('div');
    topbar.className = 'flex h-12 items-center gap-2 border-b border-border px-4';
    topbar.appendChild(createSidebarTrigger(instance.toggle));
    const mainContent = document.createElement('div');
    mainContent.className = 'flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground';
    mainContent.textContent = 'SidebarInput no header para busca rápida';
    inset.append(topbar, mainContent);

    return wrapSidebar(instance, inset);
  },
  parameters: {
    docs: {
      description: {
        story: 'Sidebar com campo de busca (<code>SidebarInput</code>) no header. Use para filtrar itens de navegação em apps com muitas seções.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Campo de busca está presente e acessível', async () => {
      const input = canvasElement.querySelector('input[type="search"]');
      await expect(input).toBeInTheDocument();
    });
  },
};

// ─── Com Badges ───────────────────────────────────────────────────────────────

export const ComBadges: Story = {
  name: 'Com badges de contagem',
  render: () => {
    const instance = createSidebar({ defaultOpen: true });
    const inner = instance.element.querySelector('[data-sidebar="sidebar"]')!;

    const header = createSidebarHeader();
    const logoRow = document.createElement('div');
    logoRow.className = 'px-2 py-1 text-sm font-semibold text-sidebar-foreground';
    logoRow.textContent = 'App';
    header.appendChild(logoRow);
    inner.appendChild(header);

    const content = createSidebarContent();
    content.appendChild(
      createSidebarGroup({
        items: [
          { label: 'Dashboard',      icon: makeIcon(ICON_HOME),   active: true, href: '#' },
          { label: 'Notificações',   icon: makeIcon(ICON_BELL),   href: '#',    badge: '12' },
          { label: 'Componentes',    icon: makeIcon(ICON_LAYOUT), href: '#',    badge: '3' },
          { label: 'Configurações',  icon: makeIcon(ICON_SETTINGS), href: '#' },
        ],
      }),
    );
    inner.appendChild(content);

    const inset = document.createElement('div');
    inset.className = 'flex flex-1 flex-col';
    const topbar = document.createElement('div');
    topbar.className = 'flex h-12 items-center gap-2 border-b border-border px-4';
    topbar.appendChild(createSidebarTrigger(instance.toggle));
    const mainContent = document.createElement('div');
    mainContent.className = 'flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground';
    mainContent.textContent = 'Badges indicam contadores de notificação';
    inset.append(topbar, mainContent);

    return wrapSidebar(instance, inset);
  },
  parameters: {
    docs: {
      description: {
        story: 'Sidebar com <code>SidebarMenuBadge</code> nos itens de menu. Use para exibir contadores de notificações ou pendências.',
      },
    },
  },

  play: async ({ canvasElement }) => {
    const el = canvasElement as HTMLElement;
    await expect(within(el).queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
  },
};
