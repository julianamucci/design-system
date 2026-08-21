import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect, userEvent } from 'storybook/test';
import { transbordo } from '@shared/testing/scroll-area-probe';
import { createScrollArea } from './scroll-area';
import {
  scrollAreaSource,
  scrollAreaSourceCom,
  scrollAreaSourceEmCard,
} from './scroll-area.source';
import { createCard, createCardHeader, createCardTitle, createCardDescription, createCardContent } from './card';
import { createBadge } from './badge';

const meta: Meta = {
  tags: ['layout'],
  title: 'UI/ScrollArea/Compositions',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      source: { transform: scrollAreaSource },
      description: {
        component:
          'Composicoes reais: lista vertical com badges, cards horizontais em carrossel, tabela ampla bidirecional, ScrollArea dentro de Card e sidebar de navegação rolável.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tagItem(label: string, count: string): HTMLElement {
  const row = document.createElement('div');
  row.className = 'nds-cluster nds-border-b-soft';
  row.dataset.justify = 'between';
  row.style.padding = '0.5rem 0.75rem';
  const left = document.createElement('span');
  left.className = 'nds-text-body';
  left.textContent = label;
  const badge = createBadge({ variant: 'secondary', text: count });
  row.append(left, badge);
  return row;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const TagList: Story = {
  name: 'Vertical list with badges',
  parameters: {
    // A etiqueta ao lado de cada linha é a composição: sem o override o snippet
    // mostraria uma lista de textos e o Badge sumiria.
    docs: {
      source: {
        transform: scrollAreaSourceCom({
          size: 'xl',
          'aria-label': 'Versões publicadas',
          conteudo: 'badges',
        }),
      },
    },
  },
  render: () => {
    const outer = document.createElement('div');
    outer.className = 'nds-w-sm';

    const list = document.createElement('div');
    list.style.display = 'flex';
    list.style.flexDirection = 'column';
    const tags = [
      ['v1.0.0', '120'], ['v1.1.0', '98'], ['v1.2.0', '76'], ['v2.0.0', '210'],
      ['v2.1.0', '54'], ['v2.2.0', '88'], ['v3.0.0', '162'], ['v3.1.0', '42'],
      ['v3.2.0', '17'], ['v3.3.0', '9'],  ['v4.0.0', '305'], ['v4.1.0', '128'],
      ['v4.2.0', '64'], ['v5.0.0', '410'], ['v5.1.0', '37'], ['v5.2.0', '12'],
      ['v6.0.0', '500'], ['v6.1.0', '74'], ['v6.2.0', '23'], ['v7.0.0', '610'],
    ];
    tags.forEach(([t, c]) => list.appendChild(tagItem(t, c)));

    outer.appendChild(createScrollArea({
      size: 'xl',
      label: 'Versões publicadas',
      class: 'nds-w-full nds-rounded-md nds-border-default',
      children: list,
    }));
    return outer;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const raiz = canvasElement.querySelector<HTMLElement>('[data-slot="scroll-area"]')!;
    const viewport = canvasElement.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]')!;

    await step('A lista inteira está no DOM, dentro do viewport', async () => {
      await expect(raiz.dataset.size).toBe('xl');
      await expect(viewport.contains(canvas.getByText('v1.0.0'))).toBe(true);
      await expect(canvas.getAllByText(/^v\d+\.\d+\.\d+$/).length).toBe(20);
    });

    await step('A lista rola sem mover a página', async () => {
      const paginaAntes = document.scrollingElement?.scrollTop ?? 0;
      await expect(transbordo(viewport).y).toBe(true);
      viewport.scrollTop = 0;
      viewport.scrollTop = 120;
      await expect(viewport.scrollTop).toBe(120);
      await expect(document.scrollingElement?.scrollTop ?? 0).toBe(paginaAntes);
    });
  },
};

export const HorizontalCards: Story = {
  name: 'Horizontal card carousel',
  parameters: {
    docs: {
      source: {
        transform: scrollAreaSourceCom({
          size: null,
          width: '100%',
          'aria-label': 'Carrossel de produtos',
          class: 'nds-rounded-md nds-border-default',
          conteudo: 'fileira',
          itemCount: 10,
        }),
      },
    },
  },
  render: () => {
    const outer = document.createElement('div');
    outer.className = 'nds-w-full';
    outer.style.maxWidth = '42rem';

    const row = document.createElement('div');
    row.className = 'nds-cluster nds-p-4';
    row.dataset.spacing = 'md';
    row.style.width = 'max-content';

    const products = [
      { title: 'Cadeira Pro',   desc: 'Ergonômica · apoio lombar' },
      { title: 'Mesa Standing', desc: 'Altura ajustável elétrica' },
      { title: 'Monitor 32"',   desc: '4K · IPS · 144 Hz' },
      { title: 'Teclado Mech',  desc: 'Switch tátil · hot-swap' },
      { title: 'Mouse Vertical',desc: 'Ergonômico · sem fio' },
      { title: 'Headset',       desc: 'Cancelamento ativo' },
      { title: 'Webcam 1080p',  desc: 'Foco automático' },
      { title: 'Suporte CPU',   desc: 'Sob a mesa · ajustável' },
      { title: 'Iluminação',    desc: 'Bias light USB' },
      { title: 'Hub Thunderbolt', desc: '4× display · 90 W PD' },
    ];

    products.forEach(p => {
      const card = createCard({ className: 'nds-shrink-0' });
      card.classList.add('nds-w-3xs');
      const header = createCardHeader();
      header.appendChild(createCardTitle({ text: p.title, level: 3, className: 'nds-text-base' }));
      header.appendChild(createCardDescription({ text: p.desc }));
      const content = createCardContent({ className: 'nds-text-body nds-text-muted-foreground' });
      content.textContent = 'Produto em destaque.';
      card.append(header, content);
      row.appendChild(card);
    });

    outer.appendChild(createScrollArea({
      width: '100%',
      label: 'Carrossel de produtos',
      class: 'nds-rounded-md nds-border-default',
      children: row,
    }));
    return outer;
  },

  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const viewport = canvasElement.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]')!;

    await step('A faixa transborda na horizontal', async () => {
      // A asserção anterior contava botões com `>= 0`: passava com a tela vazia.
      // O que a story demonstra é o eixo que transborda.
      await expect(transbordo(viewport).x).toBe(true);
      await expect(canvas.getByText('Cadeira Pro')).toBeInTheDocument();
    });

    await step('O eixo horizontal responde', async () => {
      viewport.scrollLeft = 0;
      viewport.scrollLeft = 200;
      await expect(viewport.scrollLeft).toBe(200);
    });
  },
};

export const WideTable: Story = {
  name: 'Wide table (bidirectional)',
  parameters: {
    docs: {
      source: {
        transform: scrollAreaSourceCom({
          size: 'xl',
          width: '100%',
          'aria-label': 'Tabela ampla',
          class: 'nds-rounded-md nds-border-default',
          conteudo: 'matriz',
          itemCount: 20,
        }),
      },
    },
  },
  render: () => {
    const outer = document.createElement('div');
    outer.className = 'nds-w-full';
    outer.style.maxWidth = '42rem';

    const wrap = document.createElement('div');

    const table = document.createElement('table');
    table.className = 'nds-text-caption';
    table.style.borderCollapse = 'collapse';
    table.style.width = 'max-content';

    const header = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.className = 'nds-bg-muted-soft';
    for (let c = 0; c <= 12; c++) {
      const th = document.createElement('th');
      th.className = 'nds-border-default nds-font-medium';
      th.style.padding = '0.5rem 0.75rem';
      th.style.textAlign = 'left';
      th.style.whiteSpace = 'nowrap';
      th.textContent = c === 0 ? 'ID' : `Coluna ${c}`;
      headerRow.appendChild(th);
    }
    header.appendChild(headerRow);
    table.appendChild(header);

    const body = document.createElement('tbody');
    for (let r = 1; r <= 20; r++) {
      const tr = document.createElement('tr');
      for (let c = 0; c <= 12; c++) {
        const td = document.createElement('td');
        td.className = 'nds-border-default';
        td.style.padding = '0.5rem 0.75rem';
        td.style.whiteSpace = 'nowrap';
        td.textContent = c === 0 ? `#${String(r).padStart(3, '0')}` : `${r}.${c}`;
        tr.appendChild(td);
      }
      body.appendChild(tr);
    }
    table.appendChild(body);
    wrap.appendChild(table);

    outer.appendChild(createScrollArea({
      size: 'xl',
      width: '100%',
      label: 'Tabela ampla',
      class: 'nds-rounded-md nds-border-default',
      children: wrap,
    }));
    return outer;
  },

  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const viewport = canvasElement.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]')!;

    await step('A tabela transborda nos dois eixos', async () => {
      const eixos = transbordo(viewport);
      await expect(eixos.x).toBe(true);
      await expect(eixos.y).toBe(true);
    });

    await step('O cabeçalho é lido como cabeçalho e os dois eixos respondem', async () => {
      // Célula de cabeçalho é o que dá nome à coluna no leitor de tela; sem ela
      // a tabela ampla vira um bloco de números sem referência.
      await expect(canvas.getAllByRole('columnheader').length).toBe(13);
      viewport.scrollTop = 0;
      viewport.scrollLeft = 0;
      viewport.scrollTop = 40;
      viewport.scrollLeft = 40;
      await expect(viewport.scrollTop).toBe(40);
      await expect(viewport.scrollLeft).toBe(40);
    });
  },
};

export const InsideCard: Story = {
  name: 'Inside card',
  parameters: {
    // A vizinhança é o assunto: o cabeçalho do cartão fica FORA da área rolável,
    // e é isso que o snippet do meta não teria como mostrar.
    docs: {
      source: {
        transform: scrollAreaSourceEmCard({
          size: 'lg',
          'aria-label': 'Últimas ações do usuário',
          class: 'nds-w-full nds-border-default',
        }),
      },
    },
  },
  render: () => {
    const card = createCard({ className: 'nds-w-md' });

    const header = createCardHeader();
    header.appendChild(createCardTitle({ text: 'Histórico de atividades', level: 3 }));
    header.appendChild(createCardDescription({ text: 'Últimas 30 ações do usuário' }));

    const content = createCardContent({ className: '' });
    content.style.padding = '0';

    const list = document.createElement('ul');
    list.className = 'nds-stack nds-list-none';
    list.dataset.spacing = 'xs';
    list.style.padding = '0.75rem';
    list.style.margin = '0';
    const actions = ['Login', 'Editou perfil', 'Trocou senha', 'Removeu sessão', 'Adicionou cartão',
      'Cancelou assinatura', 'Renovou plano', 'Exportou dados', 'Importou contatos', 'Convidou usuário',
      'Removeu usuário', 'Alterou permissão', 'Criou projeto', 'Arquivou projeto', 'Restaurou projeto',
      'Atualizou billing', 'Verificou e-mail', 'Adicionou 2FA', 'Removeu 2FA', 'Bloqueou IP',
      'Desbloqueou IP', 'Aceitou termos', 'Recusou cookies', 'Solicitou exclusão', 'Cancelou exclusão',
      'Configurou webhook', 'Testou webhook', 'Removeu webhook', 'Conectou GitHub', 'Desconectou GitHub'];
    actions.forEach((a, i) => {
      const li = document.createElement('li');
      li.className = 'nds-cluster nds-text-body nds-border-b-soft nds-pt-2 nds-pb-2';
      li.dataset.justify = 'between';
      const left = document.createElement('span');
      left.textContent = a;
      const right = document.createElement('span');
      right.className = 'nds-text-caption nds-text-muted-foreground';
      right.textContent = `${i + 1} min`;
      li.append(left, right);
      list.appendChild(li);
    });

    content.appendChild(createScrollArea({
      size: 'lg',
      label: 'Últimas ações do usuário',
      class: 'nds-w-full nds-border-default',
      children: list,
    }));

    card.append(header, content);

    const wrap = document.createElement('div');
    wrap.className = 'nds-w-md';
    wrap.appendChild(card);
    return wrap;
  },

  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const viewport = canvasElement.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]')!;

    await step('A área rolável fica DENTRO do card, e o título fica fora dela', async () => {
      // O ponto da composição: o cabeçalho do card não pode rolar junto, senão
      // quem lê perde a referência do que está vendo.
      const titulo = canvas.getByText('Histórico de atividades');
      await expect(viewport.contains(titulo)).toBe(false);
      await expect(transbordo(viewport).y).toBe(true);
    });

    await step('Rolar a lista não muda a caixa do card', async () => {
      const cartao = canvasElement.querySelector<HTMLElement>('[data-slot="card"]')!;
      const alturaCartao = cartao.getBoundingClientRect().height;
      viewport.scrollTop = 0;
      viewport.scrollTop = 100;
      await expect(viewport.scrollTop).toBe(100);
      await expect(cartao.getBoundingClientRect().height).toBe(alturaCartao);
    });
  },
};

export const Sidebar: Story = {
  name: 'Navigation sidebar',
  parameters: {
    // A navegação dentro da área rolável é a composição: o marco continua sendo
    // marco, e é ele que precisa de nome próprio.
    docs: {
      source: {
        transform: scrollAreaSourceCom({
          size: 'xl',
          'aria-label': 'Navegação lateral',
          class: 'nds-rounded-md nds-border-default',
          conteudo: 'links',
          itemCount: 44,
        }),
      },
    },
  },
  render: () => {
    const outer = document.createElement('div');
    outer.className = 'nds-cluster nds-w-full';
    outer.dataset.spacing = 'md';
    outer.dataset.align = 'stretch';
    outer.classList.add('nds-max-w-prose');

    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', 'Componentes do design system');

    const list = document.createElement('ul');
    list.className = 'nds-stack nds-list-none';
    list.dataset.spacing = 'xs';
    list.style.padding = '0.75rem';
    list.style.margin = '0';
    const items = [
      'Accordion', 'Alert', 'AlertDialog', 'AspectRatio', 'Avatar', 'Badge', 'Breadcrumb', 'Button',
      'Calendar', 'Card', 'Carousel', 'Chart', 'Checkbox', 'Collapsible', 'Command', 'ContextMenu',
      'Dialog', 'Drawer', 'DropdownMenu', 'HoverCard', 'Input', 'InputOTP', 'Label', 'Menubar',
      'NavigationMenu', 'Pagination', 'Popover', 'Progress', 'RadioGroup', 'Resizable', 'ScrollArea',
      'Select', 'Separator', 'Sheet', 'Skeleton', 'Slider', 'Sonner', 'Switch', 'Table', 'Tabs',
      'Textarea', 'Toggle', 'ToggleGroup', 'Tooltip',
    ];
    items.forEach(label => {
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.href = '#';
      link.className = 'nds-block nds-rounded-md nds-text-body nds-hover-bg-accent';
      link.style.padding = '0.375rem 0.75rem';
      link.textContent = label;
      li.appendChild(link);
      list.appendChild(li);
    });

    nav.appendChild(list);

    const sidebar = createScrollArea({
      size: 'xl',
      label: 'Navegação lateral',
      class: 'nds-rounded-md nds-border-default',
      children: nav,
    });
    sidebar.classList.add('nds-w-3xs');

    const content = document.createElement('div');
    content.className = 'nds-flex-1 nds-rounded-md nds-border-default nds-text-body nds-text-muted-foreground nds-p-4';
    content.textContent = 'Conteúdo principal — a sidebar à esquerda rola independentemente desta área.';

    outer.append(sidebar, content);
    return outer;
  },

  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const viewport = canvasElement.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]')!;

    await step('A navegação tem nome acessível e mora dentro da área rolável', async () => {
      const nav = canvas.getByRole('navigation', { name: 'Componentes do design system' });
      await expect(viewport.contains(nav)).toBe(true);
      await expect(transbordo(viewport).y).toBe(true);
    });

    await step('Os links são alcançáveis por teclado, na ordem do documento', async () => {
      const links = canvas.getAllByRole('link');
      await expect(links.length).toBe(44);
      viewport.blur();
      viewport.focus();
      await userEvent.tab();
      await expect(document.activeElement).toBe(links[0]);
    });
  },
};
