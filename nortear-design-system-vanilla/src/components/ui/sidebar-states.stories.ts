import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect, userEvent } from 'storybook/test';
import { waitForPortal, waitForPortalGone } from '@/lib/wait-for-portal';
import { sondarOuvintes, probeHost, checkLimpeza, type ProbeResult } from './leak-probe';
import type { SidebarInstance } from './sidebar';
import {
  createSidebarProvider,
  createSidebar,
  createSidebarTrigger,
  createSidebarContent,
  createSidebarHeader,
  createSidebarFooter,
  createSidebarMenuItem,
} from './sidebar';
import { envolverEmNav, makeIcon } from './sidebar.fixtures';
import { sidebarSource, sidebarSourceWith } from './sidebar.source';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  tags: ['layout'],
  title: 'UI/Sidebar/States',
  parameters: {
    actions: { disable: true },
    layout: 'fullscreen',
    controls: { disable: true },
    docs: {
      source: { transform: sidebarSource },
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

const icons = {
  home:     '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  layout:   '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M9 21V9"/>',
  settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  user:     '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
};

function buildBase(
  defaultOpen: boolean,
  collapsible?: 'offcanvas' | 'icon' | 'none',
  opcoes: { mobileQuery?: string } = {},
): HTMLElement {
  const instance = createSidebar({ defaultOpen, variant: 'sidebar', mobileQuery: opcoes.mobileQuery });
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
  const menu = document.createElement('ul');
  menu.className = 'nds-stack nds-w-full nds-min-w-0 nds-p-2';
  menu.dataset.spacing = 'xs';
  menu.setAttribute('data-sidebar', 'menu');

  const navItems = [
    { label: 'Dashboard',    icon: icons.home,     active: true  },
    { label: 'Componentes',  icon: icons.layout,   active: false },
    { label: 'Configuracoes',icon: icons.settings, active: false },
  ];

  navItems.forEach(item => {
    menu.appendChild(createSidebarMenuItem({ label: item.label, icon: makeIcon(item.icon), active: item.active, href: '#' }));
  });

  content.appendChild(menu);
  inner.appendChild(content);

  const footer = createSidebarFooter();
  const footerMenu = document.createElement('ul');
  footerMenu.setAttribute('data-sidebar', 'menu');
  footerMenu.className = 'nds-sidebar-menu';
  footerMenu.appendChild(createSidebarMenuItem({ label: 'Perfil', icon: makeIcon(icons.user), href: '#' }));
  footer.appendChild(footerMenu);
  inner.appendChild(footer);

  const inset = document.createElement('div');
  inset.className = 'nds-flex-1';
  inset.style.display = 'flex';
  inset.style.flexDirection = 'column';

  const topbar = document.createElement('div');
  topbar.className = 'nds-cluster nds-border-b nds-pl-4 nds-pr-4';
  topbar.dataset.spacing = 'sm';
  topbar.style.height = '3rem';

  if (collapsible !== 'none') {
    topbar.appendChild(createSidebarTrigger(instance.toggle));
  }

  const stateLabel = document.createElement('span');
  stateLabel.className = 'nds-text-caption nds-text-muted-foreground nds-font-mono';
  stateLabel.textContent = collapsible ? `collapsible="${collapsible}"` : `open=${defaultOpen}`;
  topbar.appendChild(stateLabel);

  const mainContent = document.createElement('div');
  mainContent.className = 'nds-cluster nds-flex-1 nds-text-body nds-text-muted-foreground nds-p-8';
  mainContent.dataset.justify = 'center';
  mainContent.textContent = 'Conteúdo principal';

  inset.append(topbar, mainContent);

  const wrapper = createSidebarProvider();
  wrapper.appendChild(envolverEmNav(instance.element));
  wrapper.appendChild(inset);

  const container = document.createElement('div');
  container.className = 'nds-w-full nds-border-default nds-rounded-lg nds-overflow-hidden';
  container.classList.add('nds-min-h-100');
  container.appendChild(wrapper);
  return container;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Expanded: Story = {
  name: 'Expanded (default)',
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
    const trigger = canvas.getByRole('button', { name: /alternar barra lateral/i });

    await step('SidebarTrigger está presente e acessível', async () => {
      await expect(trigger).toBeInTheDocument();
    });

    await step('Sidebar inicia com data-state=expanded', async () => {
      const sidebarRoot = canvasElement.querySelector('[data-state]');
      await expect(sidebarRoot).toHaveAttribute('data-state', 'expanded');
    });
  },
};

export const Collapsed: Story = {
  name: 'Collapsed (offcanvas)',
  render: () => buildBase(false),
  parameters: {
    docs: {
      // O estado inicial é o assunto, e `true` é o padrão da fábrica.
      source: { transform: sidebarSourceWith({ defaultOpen: false }) },
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

/**
 * DÍVIDA DECLARADA: `functional.item4` pede o modo de recolhimento em ícones
 * como configuração do componente. A fábrica desta stack não expõe
 * `collapsible` — ela só alterna expanded/collapsed, e o cenário de ícones é
 * montado à mão aqui. A story cobre o item VISUAL; o funcional fica declarado
 * como não aplicável até a fábrica ganhar o modo.
 */
export const IconMode: Story = {
  name: 'Icon mode (collapsible icon)',
  render: () => {
    // Build collapsed sidebar to represent icon mode visually
    const instance = createSidebar({ defaultOpen: false, variant: 'sidebar' });
    const inner = instance.element.querySelector('[data-sidebar="sidebar"]')!;

    const header = createSidebarHeader();
    const logoRow = document.createElement('div');
    logoRow.className = 'nds-cluster nds-pt-1 nds-pb-1';
    logoRow.dataset.justify = 'center';
    logoRow.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/></svg>';
    header.appendChild(logoRow);
    inner.appendChild(header);

    const content = createSidebarContent();
    const navItems = [
      { label: 'Dashboard', icon: icons.home, active: true },
      { label: 'Componentes', icon: icons.layout, active: false },
      { label: 'Configuracoes', icon: icons.settings, active: false },
    ];

    const menu = document.createElement('ul');
    menu.className = 'nds-stack nds-w-full nds-min-w-0 nds-p-2';
  menu.dataset.spacing = 'xs';
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
    inset.className = 'nds-flex-1';
  inset.style.display = 'flex';
  inset.style.flexDirection = 'column';

    const topbar = document.createElement('div');
    topbar.className = 'nds-cluster nds-border-b nds-pl-4 nds-pr-4';
  topbar.dataset.spacing = 'sm';
  topbar.style.height = '3rem';
    topbar.appendChild(createSidebarTrigger(instance.toggle));

    const label = document.createElement('span');
    label.className = 'nds-text-caption nds-text-muted-foreground nds-font-mono';
    label.textContent = 'collapsible="icon"';
    topbar.appendChild(label);

    const mainContent = document.createElement('div');
    mainContent.className = 'nds-cluster nds-flex-1 nds-text-body nds-text-muted-foreground nds-p-8';
  mainContent.dataset.justify = 'center';
    mainContent.textContent = 'Sidebar recolhida no modo icon: apenas ícones visíveis';

    inset.append(topbar, mainContent);

    const wrapper = createSidebarProvider();
    wrapper.appendChild(envolverEmNav(instance.element));
    wrapper.appendChild(inset);

    const container = document.createElement('div');
    container.className = 'nds-w-full nds-border-default nds-rounded-lg nds-overflow-hidden';
  container.classList.add('nds-min-h-100');
    container.appendChild(wrapper);
    return container;
  },
  parameters: {
    covers: ['visual.item2'],
    coversNotApplicable: {
      'functional.item4':
        'a fábrica desta stack não expõe modo de recolhimento; o cenário de ícones é montado à mão na story',
      'functional.item7':
        'a fábrica desta stack não monta tooltip no item de menu — o rótulo fica no aria-label',
    },
    docs: {
      // A fábrica não expõe modo de recolhimento: o que ela tem é a barra
      // recolhida, e é só isso que o snippet pode prometer. O esconde-rótulo da
      // story é andaime, não API.
      source: { transform: sidebarSourceWith({ defaultOpen: false, rodape: false }) },
      description: {
        story: 'Sidebar reduzida a 3rem no modo icon. Apenas ícones são exibidos; tooltips são mostrados ao hover de cada item. <code>data-state="collapsed"</code>.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('A barra nasce recolhida', async () => {
      const raiz = canvasElement.querySelector<HTMLElement>('.nds-sidebar-root')!;
      await expect(raiz.getAttribute('data-state')).toBe('collapsed');
      // O vão do fluxo acompanha a raiz — é o par que o CSS lê.
      const vao = raiz.querySelector<HTMLElement>('.nds-sidebar-gap')!;
      await expect(vao.getAttribute('data-state')).toBe('collapsed');
    });

    await step('Sem rótulo visível, o nome do item vem do aria-label', async () => {
      // O texto some por `display: none`; o nome acessível não pode sumir junto,
      // senão o item vira um ícone sem nome para quem usa leitor de tela.
      const item = canvasElement.querySelector<HTMLElement>('[data-active="true"]')!;
      const rotulo = item.querySelector<HTMLElement>('span:last-child')!;
      await expect(getComputedStyle(rotulo).display).toBe('none');
      await expect(item.getAttribute('aria-label')).toBe('Dashboard');
      await expect(item.getAttribute('aria-current')).toBe('page');
    });
  },
};

export const WithoutToggle: Story = {
  name: 'No toggle (collapsible none)',
  render: () => buildBase(true, 'none'),
  parameters: {
    coversNotApplicable: {
      'functional.item5':
        'a fábrica desta stack não expõe modo de recolhimento; aqui o "sem toggle" é obtido não montando o gatilho, e a raiz continua com data-state',
    },
    docs: {
      // "Sem toggle" aqui é não montar o gatilho: é a única forma que a fábrica
      // oferece, e o snippet mostra exatamente ela.
      source: { transform: sidebarSourceWith({ withTrigger: false }) },
      description: {
        story: 'Sidebar sempre visível com <code>collapsible="none"</code>. Sem botão de toggle. Usada em dashboards fixos.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Não há gatilho de alternância na página', async () => {
      await expect(canvasElement.querySelector('[data-sidebar="trigger"]')).toBeNull();
      await expect(canvas.queryByRole('button', { name: /alternar barra lateral/i })).toBeNull();
    });

    await step('A navegação continua inteira e visível', async () => {
      await expect(canvas.getByRole('navigation', { name: 'Navegação principal' })).toBeInTheDocument();
      const raiz = canvasElement.querySelector<HTMLElement>('.nds-sidebar-root')!;
      await expect(raiz.getAttribute('data-state')).toBe('expanded');
    });
  },
};

/**
 * A consulta sempre verdadeira é o que torna este cenário determinístico.
 *
 * O parâmetro `viewport` redimensiona o iframe no Storybook e no Chromatic, mas
 * não no runner headless — a virada dependia de uma largura que nenhum passo
 * controla, e por isso o ramo da gaveta era código que nenhuma story alcançava.
 * Injetando a consulta, a virada passa a ser entrada do teste.
 */
const SEMPRE_NARROW = '(min-width: 0px)';

export const MobileOverlay: Story = {
  name: 'Mobile (gaveta sobreposta)',
  render: () => buildBase(true, undefined, { mobileQuery: SEMPRE_NARROW }),
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    covers: ['functional.item3', 'visual.item5'],
    docs: {
      // A consulta sempre verdadeira da story é valor de TESTE e não entra no
      // snippet. O que a gaveta oferece de API é o aviso de abertura e o ponto
      // de virada do produto — é isso que o painel Code mostra.
      source: {
        transform: sidebarSourceWith({
          onMobileOpenChange: true,
          mobileQuery: '(max-width: 900px)',
        }),
      },
      description: {
        story: 'Abaixo do ponto de virada a barra sai do fluxo e vira gaveta modal sobreposta (18rem), aberta pelo gatilho ou pelo atalho Ctrl+B e fechada por Escape ou por clique fora.',
      },
    },
  },

  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = () => canvas.getByRole('button', { name: /alternar barra lateral/i });
    const gaveta = () => document.querySelector<HTMLElement>('[data-slot="sidebar"][data-mobile="true"]');

    await step('Na largura estreita a coluna não ocupa lugar no fluxo', async () => {
      // Precondição própria: o replay pode entrar aqui com a gaveta aberta.
      if (gaveta()) {
        await userEvent.keyboard('{Escape}');
        await waitForPortalGone('dialog');
      }
      const raiz = canvasElement.querySelector<HTMLElement>('.nds-sidebar-root')!;
      await expect(raiz.hidden).toBe(true);
      await expect(raiz.getBoundingClientRect().width).toBe(0);
      // Fechada, a gaveta não está no documento — e não há dois elementos
      // respondendo por `[data-slot="sidebar"]`.
      await expect(gaveta()).toBeNull();
      await expect(document.querySelectorAll('[data-slot="sidebar"]').length).toBe(0);
    });

    await step('O gatilho abre a gaveta como diálogo modal nomeado', async () => {
      await userEvent.click(gatilho());
      // Nome em português por padrão: era "Sidebar", cravado na fábrica.
      const painel = await waitForPortal('dialog', { name: 'Barra lateral' });
      await expect(painel.getAttribute('aria-modal')).toBe('true');
      await expect(painel.dataset.mobile).toBe('true');
      // A navegação inteira mudou de lugar: é a MESMA barra, não uma cópia.
      const ativo = painel.querySelector<HTMLElement>('[data-active="true"]')!;
      await expect(ativo).not.toBeNull();
      await expect(ativo.getAttribute('aria-current')).toBe('page');
      await expect(ativo.textContent).toContain('Dashboard');
    });

    await step('O foco entra no painel', async () => {
      // Sem isto o teclado continua na página coberta pelo modal.
      await expect(gaveta()!.contains(document.activeElement)).toBe(true);
    });

    await step('Escape fecha a gaveta e devolve o foco ao gatilho', async () => {
      const alvo = gatilho();
      await userEvent.keyboard('{Escape}');
      await waitForPortalGone('dialog');
      await expect(gaveta()).toBeNull();
      await expect(document.activeElement).toBe(alvo);
    });

    await step('Fechada, a navegação volta inteira para dentro da barra', async () => {
      // O conteúdo é movido, não copiado: se a volta falhasse, a barra ficaria
      // vazia ao retornar à largura cheia — e nenhuma foto mostraria isso.
      const raiz = canvasElement.querySelector<HTMLElement>('.nds-sidebar-root')!;
      const interno = raiz.querySelector<HTMLElement>('[data-sidebar="sidebar"]')!;
      await expect(interno).not.toBeNull();
      await expect(interno.classList.contains('nds-sidebar-mobile-inner')).toBe(false);
      const dashboard = interno.querySelector<HTMLElement>('[aria-label="Dashboard"]')!;
      await expect(dashboard).not.toBeNull();
      await expect(dashboard.tagName).toBe('A');
    });

    await step('A coluna escondida não duplica a navegação para o leitor de tela', async () => {
      // Por atributo acima, por papel aqui: enquanto a largura é estreita a
      // coluna está fora da árvore de acessibilidade, e é por isso que a
      // consulta por papel — a que enxerga o que o leitor de tela enxerga —
      // não encontra o item que o atributo achou.
      await expect(within(canvasElement).queryByRole('link', { name: 'Dashboard' })).toBeNull();
    });

    await step('Termina ABERTA: é este o estado que a foto registra', async () => {
      // `visual.item5` promete "gaveta sobreposta ABERTA", e o Chromatic
      // fotografa o estado final da play. Enquanto ela terminava fechada, o
      // item estava coberto no papel e em foto nenhuma — a captura mostrava a
      // página sem barra nenhuma.
      //
      // O replay continua honesto: o primeiro passo fecha o que encontrar
      // aberto, e o par abrir/fechar acima já provou que o clique acontece
      // NESTA rodada. Este passo prova só o estado final.
      await userEvent.click(gatilho());
      // `waitForPortal` gateia na opacidade computada: `toBeVisible()` só
      // reprova em opacidade exatamente 0, e a gaveta entra com animação.
      const painel = await waitForPortal('dialog', { name: 'Barra lateral' });
      await expect(painel).toBeVisible();
      await expect(painel).toBe(gaveta());
    });
  },
};

/**
 * O par negativo do cenário acima: com a consulta sempre FALSA nada vira gaveta.
 *
 * É o que impede a asserção de mobilidade de passar por acidente — sem este
 * lado, "abriu um diálogo" poderia ser verdade em qualquer largura.
 */
export const MobileOff: Story = {
  name: 'Largura cheia (sem gaveta)',
  render: () => buildBase(true, undefined, { mobileQuery: '(max-width: 0px)' }),
  parameters: {
    covers: ['functional.item1'],
    docs: {
      description: {
        story: 'Acima do ponto de virada o gatilho alterna a coluna entre expandida e recolhida, e nenhum painel sobreposto é montado.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('button', { name: /alternar barra lateral/i });
    const raiz = canvasElement.querySelector<HTMLElement>('.nds-sidebar-root')!;

    await step('A coluna está no fluxo e não há diálogo', async () => {
      // Precondição própria: devolve a barra ao estado aberto que a story monta.
      if (raiz.dataset.state === 'collapsed') await userEvent.click(gatilho);
      await expect(raiz.hidden).toBe(false);
      await expect(raiz.dataset.state).toBe('expanded');
      await expect(document.querySelector('[data-mobile="true"]')).toBeNull();
    });

    await step('O gatilho recolhe a coluna em vez de abrir um painel', async () => {
      await userEvent.click(gatilho);
      await expect(raiz.dataset.state).toBe('collapsed');
      await expect(document.querySelector('[role="dialog"]')).toBeNull();
      // Devolve o DOM ao estado de entrada para o replay.
      await userEvent.click(gatilho);
      await expect(raiz.dataset.state).toBe('expanded');
    });
  },
};

// ─── Limpeza de ouvintes ──────────────────────────────────────────────────────
//
// A fábrica registra ouvinte em `document`. Quem tira o nó da página com o
// componente nesse estado não passa por caminho de fechamento nenhum, e antes
// não havia o que chamar. A prova aqui NÃO é "`destroy()` rodou" — isso passaria
// com um `destroy()` vazio. É a contagem de ouvintes do livro-caixa fechando em
// zero, confirmada por uma bateria de eventos disparada no documento depois da
// saída. Ver `leak-probe.ts` para o que cada prova cobre e como pode falhar.

export const ListenerCleanup: Story = {
  parameters: {
    controls: { disable: true },
    // A story existe para o que acontece DEPOIS da saída do nó: a foto seria
    // sempre a mesma legenda.
    chromatic: { disable: true },
    // O assunto é a limpeza: o atalho de teclado é registrado na montagem, e o
    // snippet mostra a chamada que o desfaz.
    docs: { source: { transform: sidebarSourceWith({ mostrarDestroy: true }) } },
  },
  render: () => probeHost(
    'Sonda de limpeza: a barra é montada, o atalho de teclado é registrado e a barra sai da página.',
  ),
  play: async ({ canvasElement, step }) => {
    const host = canvasElement.querySelector<HTMLElement>('[data-testid="cleanup-host"]');
    await expect(host).not.toBeNull();

    let probe!: ProbeResult;
    let instancia: SidebarInstance | null = null;

    await step('Monta, leva ao estado que vaza e tira da página', async () => {
      probe = await sondarOuvintes({
        host: host as HTMLElement,
        montar: () => {
          instancia = createSidebar({ defaultOpen: true });
          return instancia.element;
        },
        // O Ctrl+B do Sidebar é registrado NA MONTAGEM, não na abertura: aqui o
        // estado que vaza já é o inicial. A abertura da gaveta é exercitada nas
        // outras stories.
        exercitar: () => undefined,
        destruirAlvo: () => instancia?.destroy(),
      });
    });

    await step('Nada sobrou preso ao documento, e destroy() repete sem explodir', async () => {
      await checkLimpeza(probe);
    });
  },
};
