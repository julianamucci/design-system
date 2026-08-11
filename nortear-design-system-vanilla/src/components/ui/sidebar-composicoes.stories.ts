import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect } from 'storybook/test';
import DOMPurify from 'dompurify';
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
  tags: ['layout'],
  title: 'UI/Sidebar/Compositions',
  parameters: {
    actions: { disable: true },
    layout: 'fullscreen',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes avançadas da Sidebar: com grupos de navegação e labels, com badges em itens, com sub-menu e com busca no header.',
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
  svg.innerHTML = DOMPurify.sanitize(path);
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
  // A barra é a navegação principal, e navegação precisa de marco nomeado: sem
  // o `<nav aria-label>` o leitor de tela não a lista como região. A fábrica
  // não impõe o elemento — quem compõe é que decide o rótulo.
  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Navegação principal');
  nav.appendChild(instance.element);

  const wrapper = createSidebarProvider();
  wrapper.appendChild(nav);
  wrapper.appendChild(main);

  const container = document.createElement('div');
  container.className = 'nds-w-full nds-border-default nds-rounded-lg nds-overflow-hidden';
  container.style.minHeight = '400px';
  container.appendChild(wrapper);
  return container;
}

// ─── Grupos de Navegação ──────────────────────────────────────────────────────

export const WithGroups: Story = {
  name: 'With nav groups',
  render: () => {
    const instance = createSidebar({ defaultOpen: true });
    const inner = instance.element.querySelector('[data-sidebar="sidebar"]')!;

    const header = createSidebarHeader();
    const logoRow = document.createElement('div');
    logoRow.className = 'nds-text-body nds-font-semibold';
    logoRow.style.padding = '0.25rem 0.5rem';
    logoRow.style.color = 'var(--sidebar-foreground)';
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
          { label: 'Configuracoes', icon: makeIcon(ICON_SETTINGS), href: '#' },
          { label: 'Notificações',  icon: makeIcon(ICON_BELL),     href: '#', badge: '5' },
          { label: 'Perfil',        icon: makeIcon(ICON_USER),     href: '#' },
        ],
      }),
    );

    inner.appendChild(content);

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
    topbar.appendChild(createSidebarTrigger(instance.toggle));
    const lbl = document.createElement('span');
    lbl.className = 'nds-text-body nds-text-muted-foreground';
    lbl.textContent = 'Dashboard';
    topbar.appendChild(lbl);
    const mainContent = document.createElement('div');
    mainContent.className = 'nds-cluster nds-flex-1 nds-text-body nds-text-muted-foreground';
    mainContent.dataset.justify = 'center';
    mainContent.style.padding = '2rem';
    mainContent.textContent = 'Conteúdo principal';
    inset.append(topbar, mainContent);

    return wrapSidebar(instance, inset);
  },
  parameters: {
    covers: ['accessibility.item6'],
    coversNotApplicable: {
      'functional.item9':
        'a fábrica desta stack não expõe skeleton de item de menu — o placeholder de carregamento é composto com o Skeleton pelo consumidor',
    },
    docs: {
      description: {
        story: 'Sidebar com dois grupos de navegação separados por <code>SidebarSeparator</code>. Itens com ícones e badge.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Os grupos são separados por um separador anunciado', async () => {
      const rotulos = canvasElement.querySelectorAll('[data-sidebar="group-label"]');
      await expect(Array.from(rotulos).map((r) => r.textContent)).toEqual(['Principal', 'Conta']);
      const sep = canvasElement.querySelector<HTMLElement>('[data-sidebar="separator"]')!;
      await expect(sep.getAttribute('role')).toBe('separator');
    });

    await step('O contador entra no item, não como parada solta', async () => {
      const badge = canvasElement.querySelector<HTMLElement>('.nds-sidebar-menu-button-badge')!;
      await expect(badge.textContent).toBe('5');
      // Dentro do botão: um "5" anunciado sozinho depois de "Notificações" não
      // diria de quê.
      await expect(badge.closest('.nds-sidebar-menu-button')).not.toBeNull();
    });

    await step('O Tab alcança todos os itens — nenhuma parada sem nome', async () => {
      const primeiro = canvasElement.querySelector<HTMLElement>('[data-active="true"]')!;
      primeiro.focus();
      const alcancados: string[] = [];
      for (let i = 0; i < 5; i++) {
        await userEvent.tab();
        const ativo = document.activeElement as HTMLElement | null;
        if (!ativo) continue;
        // `aria-label` ANTES do texto: é ele que vence no cálculo do nome
        // acessível, e a fábrica sempre o define no item de menu.
        alcancados.push(ativo.getAttribute('aria-label') ?? ativo.textContent?.trim() ?? '');
      }
      await expect(alcancados).toContain('Componentes');
      await expect(alcancados).toContain('Configuracoes');
      await expect(alcancados).not.toContain('');
      // Devolve o foco ao ponto de partida para o replay.
      primeiro.blur();
    });

    await step('A navegação tem nome de marco', async () => {
      await expect(canvas.getByRole('navigation', { name: 'Navegação principal' })).toBeInTheDocument();
    });
  },
};

// ─── Com Sub-menu ─────────────────────────────────────────────────────────────

export const WithSubmenu: Story = {
  render: () => {
    const instance = createSidebar({ defaultOpen: true });
    const inner = instance.element.querySelector('[data-sidebar="sidebar"]')!;

    const header = createSidebarHeader();
    const logoRow = document.createElement('div');
    logoRow.className = 'nds-text-body nds-font-semibold';
    logoRow.style.padding = '0.25rem 0.5rem';
    logoRow.style.color = 'var(--sidebar-foreground)';
    logoRow.textContent = 'Design System';
    header.appendChild(logoRow);
    inner.appendChild(header);

    const content = createSidebarContent();
    const group = document.createElement('div');
    group.className = 'nds-stack nds-w-full nds-min-w-0';
    group.dataset.spacing = 'xs';
    group.style.position = 'relative';
    group.style.padding = '0.5rem';
    group.setAttribute('data-sidebar', 'group');

    const groupLabel = document.createElement('div');
    groupLabel.className = 'nds-cluster nds-shrink-0 nds-rounded-md nds-text-caption nds-font-medium';
    groupLabel.style.height = '2rem';
    groupLabel.style.paddingLeft = '0.5rem';
    groupLabel.style.paddingRight = '0.5rem';
    groupLabel.style.color = 'color-mix(in oklab, var(--sidebar-foreground) 70%, transparent)';
    groupLabel.setAttribute('data-sidebar', 'group-label');
    groupLabel.textContent = 'Componentes';
    group.appendChild(groupLabel);

    const menu = document.createElement('ul');
    menu.className = 'nds-stack nds-w-full nds-min-w-0';
    menu.dataset.spacing = 'xs';
    menu.setAttribute('data-sidebar', 'menu');

    // Dashboard item
    menu.appendChild(createSidebarMenuItem({ label: 'Dashboard', icon: makeIcon(ICON_HOME), active: true, href: '#' }));

    // Componentes item with collapsible sub-menu
    const parentLi = document.createElement('li');
    parentLi.className = 'group/menu-item';
    parentLi.style.position = 'relative';
    parentLi.setAttribute('data-sidebar', 'menu-item');

    let subOpen = false;
    const parentBtn = document.createElement('button');
    parentBtn.className = 'peer/menu-button nds-cluster nds-w-full nds-overflow-hidden nds-rounded-md nds-text-body';
    parentBtn.dataset.spacing = 'sm';
    parentBtn.style.padding = '0.5rem';
    parentBtn.style.textAlign = 'left';
    parentBtn.style.outline = 'none';
    parentBtn.style.background = 'transparent';
    parentBtn.style.border = 'none';
    parentBtn.style.cursor = 'pointer';
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
    chevron.innerHTML = DOMPurify.sanitize('<path d="m6 9 6 6 6-6"/>');
    chevron.style.marginLeft = 'auto';
    chevron.style.transition = 'transform 200ms';
    parentBtn.appendChild(chevron);

    const subList = document.createElement('ul');
    subList.className = 'nds-stack';
    subList.dataset.spacing = 'xs';
    subList.style.marginLeft = '1rem';
    subList.style.marginTop = '0.25rem';
    subList.style.paddingLeft = '0.75rem';
    subList.style.borderLeft = '1px solid var(--sidebar-border)';
    subList.setAttribute('data-sidebar', 'menu-sub');
    subList.style.display = 'none';

    const subItems = ['Alert', 'Button', 'Card', 'Dialog'];
    subItems.forEach(name => {
      const subLi = document.createElement('li');
      subLi.setAttribute('data-sidebar', 'menu-sub-item');
      const subBtn = document.createElement('a');
      subBtn.href = '#';
      subBtn.className = 'nds-cluster nds-rounded-md nds-text-caption';
      subBtn.dataset.spacing = 'sm';
      subBtn.style.padding = '0.375rem 0.5rem';
      subBtn.style.color = 'var(--sidebar-foreground)';
      subBtn.style.transition = 'background 150ms, color 150ms';
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
    const footerMenu = document.createElement('ul');
    footerMenu.className = 'nds-sidebar-menu';
    footerMenu.setAttribute('data-sidebar', 'menu');
    footerMenu.appendChild(createSidebarMenuItem({ label: 'Configuracoes', icon: makeIcon(ICON_SETTINGS), href: '#' }));
    footer.appendChild(footerMenu);
    inner.appendChild(footer);

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
    topbar.appendChild(createSidebarTrigger(instance.toggle));
    const lbl = document.createElement('span');
    lbl.className = 'nds-text-body nds-text-muted-foreground';
    lbl.textContent = 'Dashboard';
    topbar.appendChild(lbl);
    const mainContent = document.createElement('div');
    mainContent.className = 'nds-cluster nds-flex-1 nds-text-body nds-text-muted-foreground';
    mainContent.dataset.justify = 'center';
    mainContent.style.padding = '2rem';
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
    const pai = () => canvasElement.querySelector<HTMLButtonElement>('[aria-expanded]')!;
    const sub = () => canvasElement.querySelector<HTMLElement>('[data-sidebar="menu-sub"]')!;

    // Par idempotente: só clica quando o estado atual não é o desejado, então o
    // replay do painel Interactions (que roda no MESMO DOM) chega ao mesmo fim.
    const definir = async (aberto: boolean) => {
      const alvo = pai();
      if (alvo.getAttribute('aria-expanded') !== String(aberto)) await userEvent.click(alvo);
      await expect(pai().getAttribute('aria-expanded')).toBe(String(aberto));
    };

    await step('O submenu nasce fechado, e o botão pai diz isso', async () => {
      await expect(pai().getAttribute('aria-expanded')).toBe('false');
      await expect(getComputedStyle(sub()).display).toBe('none');
    });

    await step('O submenu é uma lista aninhada de verdade', async () => {
      await expect(sub().tagName).toBe('UL');
      await expect(sub().closest('[data-sidebar="menu-item"]')).not.toBeNull();
      await expect(sub().querySelectorAll('[data-sidebar="menu-sub-item"]').length).toBe(4);
    });

    await step('Abrir revela os subitens, e fechar os recolhe de volta', async () => {
      await definir(true);
      await expect(getComputedStyle(sub()).display).not.toBe('none');

      await definir(false);
      await expect(getComputedStyle(sub()).display).toBe('none');
    });
  },
};

// ─── Com Busca no Header ──────────────────────────────────────────────────────

export const WithSearch: Story = {
  name: 'With search in header',
  render: () => {
    const instance = createSidebar({ defaultOpen: true });
    const inner = instance.element.querySelector('[data-sidebar="sidebar"]')!;

    const header = createSidebarHeader();

    const logoRow = document.createElement('div');
    logoRow.className = 'nds-text-body nds-font-semibold';
    logoRow.style.padding = '0.25rem 0.5rem';
    logoRow.style.color = 'var(--sidebar-foreground)';
    logoRow.textContent = 'Design System';
    header.appendChild(logoRow);

    // Search input
    const searchWrapper = document.createElement('div');
    searchWrapper.style.position = 'relative';
    searchWrapper.style.paddingLeft = '0.25rem';
    searchWrapper.style.paddingRight = '0.25rem';
    searchWrapper.style.paddingBottom = '0.25rem';
    searchWrapper.setAttribute('data-sidebar', 'input');
    const searchIcon = makeIcon(ICON_SEARCH);
    searchIcon.setAttribute('width', '14');
    searchIcon.setAttribute('height', '14');
    searchIcon.setAttribute('class', 'nds-text-muted-foreground');
    searchIcon.setAttribute('style', 'position:absolute;left:0.75rem;top:50%;transform:translateY(-50%);pointer-events:none');
    const searchInput = document.createElement('input');
    searchInput.type = 'search';
    searchInput.placeholder = 'Buscar...';
    // O placeholder some ao digitar; o nome acessível não pode sumir junto.
    searchInput.setAttribute('aria-label', 'Buscar na navegação');
    searchInput.className = 'nds-w-full nds-rounded-md nds-text-caption';
    searchInput.style.border = '1px solid var(--sidebar-border)';
    searchInput.style.background = 'var(--sidebar)';
    searchInput.style.padding = '0.375rem 0.5rem 0.375rem 2rem';
    searchInput.style.color = 'var(--sidebar-foreground)';
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
          { label: 'Configuracoes', icon: makeIcon(ICON_SETTINGS), href: '#' },
        ],
      }),
    );
    inner.appendChild(content);

    const footer = createSidebarFooter();
    const footerMenu = document.createElement('ul');
    footerMenu.className = 'nds-sidebar-menu';
    footerMenu.setAttribute('data-sidebar', 'menu');
    footerMenu.appendChild(createSidebarMenuItem({ label: 'Perfil', icon: makeIcon(ICON_USER), href: '#' }));
    footer.appendChild(footerMenu);
    inner.appendChild(footer);

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
    topbar.appendChild(createSidebarTrigger(instance.toggle));
    const mainContent = document.createElement('div');
    mainContent.className = 'nds-cluster nds-flex-1 nds-text-body nds-text-muted-foreground';
    mainContent.dataset.justify = 'center';
    mainContent.style.padding = '2rem';
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
    const canvas = within(canvasElement);

    await step('O campo de busca tem nome — o placeholder some ao digitar', async () => {
      const busca = canvas.getByRole('searchbox', { name: 'Buscar na navegação' });
      await expect(busca.closest('[data-sidebar="header"]')).not.toBeNull();
    });

    await step('O ícone de lupa é decorativo', async () => {
      // O nome do campo já está no aria-label; um ícone lido em cima disso vira
      // ruído duplicado.
      const lupa = canvasElement.querySelector<SVGElement>('[data-sidebar="input"] svg')!;
      await expect(lupa.getAttribute('aria-hidden')).toBe('true');
    });
  },
};

// ─── Com Badges ───────────────────────────────────────────────────────────────

export const WithBadges: Story = {
  name: 'With count badges',
  render: () => {
    const instance = createSidebar({ defaultOpen: true });
    const inner = instance.element.querySelector('[data-sidebar="sidebar"]')!;

    const header = createSidebarHeader();
    const logoRow = document.createElement('div');
    logoRow.className = 'nds-text-body nds-font-semibold';
    logoRow.style.padding = '0.25rem 0.5rem';
    logoRow.style.color = 'var(--sidebar-foreground)';
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
          { label: 'Configuracoes',  icon: makeIcon(ICON_SETTINGS), href: '#' },
        ],
      }),
    );
    inner.appendChild(content);

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
    topbar.appendChild(createSidebarTrigger(instance.toggle));
    const mainContent = document.createElement('div');
    mainContent.className = 'nds-cluster nds-flex-1 nds-text-body nds-text-muted-foreground';
    mainContent.dataset.justify = 'center';
    mainContent.style.padding = '2rem';
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

  play: async ({ canvasElement, step }) => {
    await step('Cada contador acompanha o item a que pertence', async () => {
      const badges = canvasElement.querySelectorAll<HTMLElement>('.nds-sidebar-menu-button-badge');
      await expect(Array.from(badges).map((b) => b.textContent)).toEqual(['12', '3']);
    });

    await step('O contador não é lido solto pelo leitor de tela', async () => {
      // O badge mora DENTRO do botão, e o nome acessível do botão vem do
      // aria-label: um "12" anunciado sozinho não diria de quê.
      const badge = canvasElement.querySelector<HTMLElement>('.nds-sidebar-menu-button-badge')!;
      const item = badge.closest<HTMLElement>('.nds-sidebar-menu-button')!;
      await expect(item.getAttribute('aria-label')).toBe('Notificações');
    });

    await step('Item sem contador não ganha caixa vazia', async () => {
      const itens = canvasElement.querySelectorAll('.nds-sidebar-menu-button');
      await expect(itens.length).toBe(4);
      await expect(
        canvasElement.querySelectorAll('.nds-sidebar-menu-button-badge').length,
      ).toBe(2);
    });
  },
};
