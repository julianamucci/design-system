import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect } from 'storybook/test';
import DOMPurify from 'dompurify';
import {
  createSidebarProvider,
  createSidebar,
  createSidebarTrigger,
  createSidebarRail,
  createSidebarInset,
  createSidebarContent,
  createSidebarHeader,
  createSidebarFooter,
  createSidebarInput,
  createSidebarGroup,
  createSidebarGroupLabel,
  createSidebarGroupContent,
  createSidebarGroupAction,
  createSidebarMenu,
  createSidebarMenuItem,
  createSidebarMenuButton,
  createSidebarMenuBadge,
  createSidebarMenuAction,
  createSidebarMenuSkeleton,
  createSidebarMenuSub,
  createSidebarMenuSubItem,
  createSidebarMenuSubButton,
  createSidebarSeparator,
  type SidebarMenuSubButtonOptions,
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
const ICON_PLUS     = '<path d="M5 12h14"/><path d="M12 5v14"/>';
const ICON_MORE     = '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>';

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

/** Barra superior com o gatilho e um rótulo de contexto. */
function buildTopbar(instance: ReturnType<typeof createSidebar>, texto: string): HTMLElement {
  const topbar = document.createElement('div');
  topbar.className = 'nds-cluster nds-border-b nds-pl-4 nds-pr-4';
  topbar.dataset.spacing = 'sm';
  topbar.style.height = '3rem';
  topbar.appendChild(createSidebarTrigger(instance.toggle));
  const lbl = document.createElement('span');
  lbl.className = 'nds-text-body nds-text-muted-foreground';
  lbl.textContent = texto;
  topbar.appendChild(lbl);
  return topbar;
}

/** Andaime de conteúdo principal, quando a story não usa `SidebarInset`. */
function buildPlainInset(instance: ReturnType<typeof createSidebar>, topo: string, corpo: string): HTMLElement {
  const inset = document.createElement('div');
  inset.className = 'nds-flex-1';
  inset.style.display = 'flex';
  inset.style.flexDirection = 'column';
  const mainContent = document.createElement('div');
  mainContent.className = 'nds-cluster nds-flex-1 nds-text-body nds-text-muted-foreground nds-p-8';
  mainContent.dataset.justify = 'center';
  mainContent.textContent = corpo;
  inset.append(buildTopbar(instance, topo), mainContent);
  return inset;
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

    return wrapSidebar(instance, buildPlainInset(instance, 'Dashboard', 'Conteúdo principal'));
  },
  parameters: {
    covers: ['accessibility.item6'],
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
      await expect(sep.getAttribute('aria-orientation')).toBe('horizontal');
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

// ─── Grupo com ação, contador ancorado e faixa ────────────────────────────────

export const WithGroupActions: Story = {
  name: 'With group action, anchored badge and rail',
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

    // Grupo montado peça a peça: rótulo com id, ação no canto e a lista ligada
    // ao rótulo por `aria-labelledby`.
    const group = document.createElement('div');
    group.className = 'nds-sidebar-group';
    group.dataset.slot = 'sidebar-group';
    group.setAttribute('data-sidebar', 'group');

    const rotulo = createSidebarGroupLabel({ text: 'Projetos', id: 'grupo-projetos' });
    group.appendChild(rotulo);

    let adicionados = 0;
    group.appendChild(
      createSidebarGroupAction({
        label: 'Adicionar projeto',
        icon: makeIcon(ICON_PLUS),
        onClick: () => { adicionados += 1; group.dataset.adicionados = String(adicionados); },
      }),
    );

    const groupContent = createSidebarGroupContent();
    const menu = createSidebarMenu({ labelledBy: 'grupo-projetos' });

    // Item completo: botão + contador ancorado + ação flutuante, os três irmãos
    // dentro do mesmo <li>.
    const itemNortear = createSidebarMenuItem();
    itemNortear.appendChild(
      createSidebarMenuButton({
        label: 'Nortear',
        // A contagem entra no NOME do item porque o contador ao lado é
        // `aria-hidden` — senão o número seria anunciado solto.
        ariaLabel: 'Nortear, 12 pendências',
        icon: makeIcon(ICON_LAYOUT),
        href: '#',
        active: true,
      }),
    );
    itemNortear.appendChild(createSidebarMenuBadge({ text: '12' }));
    let acoesAbertas = 0;
    itemNortear.appendChild(
      createSidebarMenuAction({
        label: 'Mais opções de Nortear',
        icon: makeIcon(ICON_MORE),
        showOnHover: true,
        onClick: () => { acoesAbertas += 1; itemNortear.dataset.acoes = String(acoesAbertas); },
      }),
    );
    menu.appendChild(itemNortear);

    const itemArquivo = createSidebarMenuItem();
    itemArquivo.appendChild(
      createSidebarMenuButton({ label: 'Arquivados', icon: makeIcon(ICON_LAYERS), href: '#' }),
    );
    menu.appendChild(itemArquivo);

    const itemRascunho = createSidebarMenuItem();
    itemRascunho.appendChild(
      createSidebarMenuButton({ label: 'Rascunhos', icon: makeIcon(ICON_HOME), size: 'sm', variant: 'outline' }),
    );
    menu.appendChild(itemRascunho);

    groupContent.appendChild(menu);
    group.appendChild(groupContent);
    content.appendChild(group);
    inner.appendChild(content);

    const footer = createSidebarFooter();
    const footerMenu = createSidebarMenu();
    footerMenu.appendChild(createSidebarMenuItem({ label: 'Perfil', icon: makeIcon(ICON_USER), href: '#' }));
    footer.appendChild(footerMenu);
    inner.appendChild(footer);

    // A faixa é irmã do conteúdo, dentro do painel: o posicionamento é absoluto
    // e o bloco que a contém é o painel fixo.
    inner.appendChild(createSidebarRail(instance.toggle));

    const inset = createSidebarInset();
    inset.appendChild(buildTopbar(instance, 'Projetos'));
    const corpo = document.createElement('p');
    corpo.className = 'nds-text-body nds-text-muted-foreground nds-p-8';
    corpo.textContent = 'Ação de grupo, contador ancorado e ação por item.';
    inset.appendChild(corpo);

    return wrapSidebar(instance, inset);
  },
  parameters: {
    covers: ['accessibility.item2', 'accessibility.item3'],
    docs: {
      description: {
        story:
          'Grupo montado peça a peça: <code>SidebarGroupLabel</code> nomeia a lista via <code>aria-labelledby</code>, ' +
          '<code>SidebarGroupAction</code> fica no canto, e cada item combina <code>SidebarMenuButton</code>, ' +
          '<code>SidebarMenuBadge</code> e <code>SidebarMenuAction</code>. A <code>SidebarRail</code> alterna a barra pela borda.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const raiz = () => canvasElement.querySelector<HTMLElement>('.nds-sidebar-root')!;

    await step('O rótulo do grupo nomeia a lista que ele encabeça', async () => {
      // Sem a ligação, a <ul> é anunciada como "lista, 3 itens" e o rótulo ao
      // lado é só pintura.
      const rotulo = canvasElement.querySelector<HTMLElement>('[data-sidebar="group-label"]')!;
      const menu = canvasElement.querySelector<HTMLElement>('[data-sidebar="menu"]')!;
      await expect(rotulo.id).toBe('grupo-projetos');
      await expect(menu.getAttribute('aria-labelledby')).toBe(rotulo.id);
      await expect(rotulo.textContent).toBe('Projetos');
    });

    await step('A ação do grupo é um botão com nome, e responde', async () => {
      const acao = canvas.getByRole('button', { name: 'Adicionar projeto' });
      await expect(acao.getAttribute('data-sidebar')).toBe('group-action');
      // Relativo, não absoluto: o painel Interactions reexecuta a play no mesmo
      // DOM, e um valor cravado falharia na segunda rodada.
      const grupo = acao.closest<HTMLElement>('[data-sidebar="group"]')!;
      const antes = Number(grupo.dataset.adicionados ?? 0);
      await userEvent.click(acao);
      await expect(Number(grupo.dataset.adicionados)).toBe(antes + 1);
    });

    await step('O contador ancorado não é lido solto — a contagem está no nome do item', async () => {
      const contador = canvasElement.querySelector<HTMLElement>('[data-sidebar="menu-badge"]')!;
      await expect(contador.textContent).toBe('12');
      await expect(contador.getAttribute('aria-hidden')).toBe('true');
      // Irmão do botão, não filho: é o que o posicionamento absoluto do CSS pede.
      await expect(contador.parentElement?.getAttribute('data-sidebar')).toBe('menu-item');
      await expect(canvas.getByRole('link', { name: 'Nortear, 12 pendências' })).toBeInTheDocument();
    });

    await step('O item ativo é anunciado como página atual', async () => {
      const ativo = canvasElement.querySelector<HTMLElement>('[data-sidebar="menu-button"][data-active="true"]')!;
      await expect(ativo.getAttribute('aria-current')).toBe('page');
      await expect(ativo.tagName).toBe('A');
    });

    await step('A ação do item tem nome próprio e mora no mesmo item', async () => {
      const acao = canvas.getByRole('button', { name: 'Mais opções de Nortear' });
      await expect(acao.classList.contains('nds-sidebar-menu-action-hover')).toBe(true);
      const item = acao.closest<HTMLElement>('[data-sidebar="menu-item"]')!;
      await expect(item.querySelector('[data-sidebar="menu-button"]')).not.toBeNull();
      const antes = Number(item.dataset.acoes ?? 0);
      await userEvent.click(acao);
      await expect(Number(item.dataset.acoes)).toBe(antes + 1);
    });

    await step('Os ícones dos controles são decorativos', async () => {
      const icones = canvasElement.querySelectorAll<SVGElement>('[data-sidebar="group-action"] svg, [data-sidebar="menu-action"] svg');
      await expect(icones.length).toBe(2);
      for (const icone of icones) {
        await expect(icone.getAttribute('aria-hidden')).toBe('true');
      }
    });

    await step('O tamanho e a variante do botão viram atributo e classe', async () => {
      const pequeno = canvasElement.querySelector<HTMLElement>('[data-sidebar="menu-button"][data-size="sm"]')!;
      await expect(pequeno.classList.contains('nds-sidebar-menu-button-outline')).toBe(true);
      // Sem destino é <button>, não âncora sem href — que não recebe foco nem é
      // anunciada como link.
      await expect(pequeno.tagName).toBe('BUTTON');
      await expect(pequeno.getAttribute('type')).toBe('button');
    });

    await step('A faixa não duplica a parada de teclado do gatilho', async () => {
      const faixa = canvasElement.querySelector<HTMLButtonElement>('[data-sidebar="rail"]')!;
      await expect(faixa.getAttribute('aria-hidden')).toBe('true');
      await expect(faixa.tabIndex).toBe(-1);
      // Dica de ponteiro em português, e o mesmo texto do gatilho: a ação é a
      // mesma. Era "Toggle sidebar", cravado.
      await expect(faixa.title).toBe('Alternar barra lateral');
      // Um único controle na ordem de tabulação para a mesma ação.
      await expect(canvas.getAllByRole('button', { name: /alternar barra lateral/i }).length).toBe(1);
    });

    await step('A faixa alterna a barra — e devolve ao estado de partida', async () => {
      const faixa = canvasElement.querySelector<HTMLButtonElement>('[data-sidebar="rail"]')!;
      const antes = raiz().dataset.state;
      faixa.click();
      await expect(raiz().dataset.state).not.toBe(antes);
      faixa.click();
      await expect(raiz().dataset.state).toBe(antes);
    });

    await step('A área ao lado da barra é o marco principal da página', async () => {
      const principal = canvas.getByRole('main');
      await expect(principal.classList.contains('nds-sidebar-inset')).toBe(true);
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
    group.className = 'nds-sidebar-group';
    group.dataset.slot = 'sidebar-group';
    group.setAttribute('data-sidebar', 'group');
    group.appendChild(createSidebarGroupLabel({ text: 'Componentes', id: 'grupo-componentes' }));

    const groupContent = createSidebarGroupContent();
    const menu = createSidebarMenu({ labelledBy: 'grupo-componentes' });

    menu.appendChild(createSidebarMenuItem({ label: 'Dashboard', icon: makeIcon(ICON_HOME), active: true, href: '#' }));

    // Item pai com sub-menu recolhível.
    const parentLi = createSidebarMenuItem();
    const parentBtn = createSidebarMenuButton({
      label: 'Componentes',
      ariaLabel: 'Componentes',
      icon: makeIcon(ICON_LAYOUT),
    });
    parentBtn.setAttribute('aria-expanded', 'false');

    const chevron = makeIcon('<path d="m6 9 6 6 6-6"/>');
    chevron.setAttribute('width', '12');
    chevron.setAttribute('height', '12');
    chevron.style.marginLeft = 'auto';
    parentBtn.appendChild(chevron);

    const subList = createSidebarMenuSub();
    subList.setAttribute('aria-label', 'Componentes');
    subList.style.display = 'none';

    const subItens: SidebarMenuSubButtonOptions[] = [
      { label: 'Alert',  href: '#' },
      { label: 'Button', href: '#', active: true },
      { label: 'Card',   href: '#' },
      { label: 'Dialog', disabled: true },
    ];
    subItens.forEach((sub) => {
      const li = createSidebarMenuSubItem();
      li.appendChild(createSidebarMenuSubButton({ ...sub, size: 'sm' }));
      subList.appendChild(li);
    });

    parentBtn.addEventListener('click', () => {
      const aberto = parentBtn.getAttribute('aria-expanded') === 'true';
      subList.style.display = aberto ? 'none' : '';
      parentBtn.setAttribute('aria-expanded', aberto ? 'false' : 'true');
    });

    parentLi.appendChild(parentBtn);
    parentLi.appendChild(subList);
    menu.appendChild(parentLi);
    menu.appendChild(createSidebarMenuItem({ label: 'Tokens', icon: makeIcon(ICON_LAYERS), href: '#' }));

    groupContent.appendChild(menu);
    group.appendChild(groupContent);
    content.appendChild(group);
    inner.appendChild(content);

    const footer = createSidebarFooter();
    const footerMenu = createSidebarMenu();
    footerMenu.appendChild(createSidebarMenuItem({ label: 'Configuracoes', icon: makeIcon(ICON_SETTINGS), href: '#' }));
    footer.appendChild(footerMenu);
    inner.appendChild(footer);

    return wrapSidebar(
      instance,
      buildPlainInset(instance, 'Dashboard', 'Clique em "Componentes" para expandir o sub-menu'),
    );
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
      await definir(false);
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

      const botoes = sub().querySelectorAll<HTMLElement>('[data-sidebar="menu-sub-button"]');
      await expect(botoes.length).toBe(4);

      await definir(false);
      await expect(getComputedStyle(sub()).display).toBe('none');
    });

    await step('O subitem ativo é anunciado como página atual', async () => {
      const ativo = canvasElement.querySelector<HTMLElement>('[data-sidebar="menu-sub-button"][data-active="true"]')!;
      await expect(ativo.getAttribute('aria-current')).toBe('page');
      await expect(ativo.getAttribute('data-size')).toBe('sm');
    });

    await step('O subitem desabilitado não navega nem se anuncia clicável', async () => {
      const desabilitado = canvasElement.querySelector<HTMLElement>('[data-sidebar="menu-sub-button"][aria-disabled="true"]')!;
      await expect(desabilitado.textContent).toBe('Dialog');
      // Sem destino, é <button disabled> — não uma âncora que continua navegando.
      await expect(desabilitado.tagName).toBe('BUTTON');
      await expect((desabilitado as HTMLButtonElement).disabled).toBe(true);
    });
  },
};

// ─── Carregando (skeleton) ────────────────────────────────────────────────────

export const LoadingSkeleton: Story = {
  name: 'Loading skeleton',
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
    group.className = 'nds-sidebar-group';
    group.dataset.slot = 'sidebar-group';
    group.setAttribute('data-sidebar', 'group');
    group.appendChild(createSidebarGroupLabel({ text: 'Navegação', id: 'grupo-carregando' }));

    const groupContent = createSidebarGroupContent();
    const menu = createSidebarMenu({ labelledBy: 'grupo-carregando' });

    // A primeira linha se anuncia (`role="status"`); as demais são decoração
    // muda. Três regiões vivas repetindo o mesmo aviso seria pior que nenhuma.
    const linhas = [
      { showIcon: true,  label: 'Carregando navegação', width: '70%' },
      { showIcon: true,  width: '55%' },
      { showIcon: false, width: '85%' },
    ];
    linhas.forEach((linha) => {
      const li = createSidebarMenuItem();
      li.appendChild(createSidebarMenuSkeleton(linha));
      menu.appendChild(li);
    });

    groupContent.appendChild(menu);
    group.appendChild(groupContent);
    content.appendChild(group);
    inner.appendChild(content);

    return wrapSidebar(
      instance,
      buildPlainInset(instance, 'Carregando', 'A navegação chega do servidor; o esqueleto reserva a caixa.'),
    );
  },
  parameters: {
    covers: ['functional.item9'],
    docs: {
      description: {
        story:
          'Espaço reservado enquanto o menu carrega. <code>SidebarMenuSkeleton</code> com <code>showIcon</code> desenha a caixa do ícone à esquerda da caixa do texto.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const linhas = () => canvasElement.querySelectorAll<HTMLElement>('[data-sidebar="menu-skeleton"]');

    await step('Com showIcon, a caixa do ícone vem antes da caixa do texto', async () => {
      const primeira = linhas()[0];
      const filhos = Array.from(primeira.children).map((f) => f.getAttribute('data-sidebar'));
      await expect(filhos).toEqual(['menu-skeleton-icon', 'menu-skeleton-text']);
    });

    await step('Sem showIcon, só a caixa do texto é desenhada', async () => {
      const terceira = linhas()[2];
      const filhos = Array.from(terceira.children).map((f) => f.getAttribute('data-sidebar'));
      await expect(filhos).toEqual(['menu-skeleton-text']);
    });

    await step('As caixas são esqueletos de verdade, não divs sem pintura', async () => {
      // A pulsação e o fundo moram em `.nds-skeleton`; as classes
      // `.nds-sidebar-menu-skeleton-*` só dão a medida. Sem a peça por baixo, o
      // placeholder fica invisível — e ninguém percebe olhando o markup.
      const caixas = canvasElement.querySelectorAll<HTMLElement>(
        '.nds-sidebar-menu-skeleton-icon, .nds-sidebar-menu-skeleton-text',
      );
      await expect(caixas.length).toBe(5);
      for (const caixa of caixas) {
        await expect(caixa.classList.contains('nds-skeleton')).toBe(true);
        await expect(getComputedStyle(caixa).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
      }
    });

    await step('A largura declarada chega à folha pela custom property', async () => {
      const texto = linhas()[1].querySelector<HTMLElement>('[data-sidebar="menu-skeleton-text"]')!;
      await expect(texto.style.getPropertyValue('--skeleton-width')).toBe('55%');
    });

    await step('Uma linha anuncia o carregamento; as outras são mudas', async () => {
      const [primeira, segunda, terceira] = Array.from(linhas());
      await expect(canvas.getByRole('status', { name: 'Carregando navegação' })).toBe(primeira);
      await expect(segunda.getAttribute('aria-hidden')).toBe('true');
      await expect(terceira.getAttribute('aria-hidden')).toBe('true');
      // Um bloco cinza pulsando não é conteúdo: nenhuma linha entra na ordem de
      // tabulação nem carrega texto para o leitor.
      await expect(primeira.textContent).toBe('');
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

    const searchWrapper = document.createElement('div');
    searchWrapper.style.position = 'relative';
    const searchIcon = makeIcon(ICON_SEARCH);
    searchIcon.setAttribute('width', '14');
    searchIcon.setAttribute('height', '14');
    searchIcon.setAttribute('class', 'nds-text-muted-foreground');
    searchIcon.style.position = 'absolute';
    searchIcon.style.left = '0.5rem';
    searchIcon.style.top = '50%';
    searchIcon.style.transform = 'translateY(-50%)';
    searchIcon.style.pointerEvents = 'none';

    // O nome acessível é obrigatório na fábrica: o placeholder some no primeiro
    // caractere digitado, e um campo que perde o nome ao ser usado é um campo
    // sem nome.
    const searchInput = createSidebarInput({
      label: 'Buscar na navegação',
      placeholder: 'Buscar...',
    });

    searchWrapper.append(searchIcon, searchInput);
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
    const footerMenu = createSidebarMenu();
    footerMenu.appendChild(createSidebarMenuItem({ label: 'Perfil', icon: makeIcon(ICON_USER), href: '#' }));
    footer.appendChild(footerMenu);
    inner.appendChild(footer);

    return wrapSidebar(
      instance,
      buildPlainInset(instance, 'Busca', 'SidebarInput no header para busca rápida'),
    );
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
      await expect(busca.getAttribute('data-sidebar')).toBe('input');
    });

    await step('O campo herda o primitivo de entrada e só acrescenta o ajuste da barra', async () => {
      const busca = canvas.getByRole('searchbox', { name: 'Buscar na navegação' });
      await expect(busca.classList.contains('nds-input')).toBe(true);
      await expect(busca.classList.contains('nds-sidebar-input')).toBe(true);
      await expect(busca.getAttribute('data-slot')).toBe('sidebar-input');
    });

    await step('Digitar não apaga o nome do campo', async () => {
      const busca = canvas.getByRole('searchbox', { name: 'Buscar na navegação' }) as HTMLInputElement;
      busca.value = '';
      await userEvent.type(busca, 'card');
      await expect(busca.value).toBe('card');
      await expect(canvas.getByRole('searchbox', { name: 'Buscar na navegação' })).toBe(busca);
      busca.value = '';
    });

    await step('O ícone de lupa é decorativo', async () => {
      // O nome do campo já está no aria-label; um ícone lido em cima disso vira
      // ruído duplicado.
      const lupa = canvasElement.querySelector<SVGElement>('[data-sidebar="header"] svg')!;
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

    return wrapSidebar(
      instance,
      buildPlainInset(instance, 'Badges', 'Badges indicam contadores de notificação'),
    );
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
