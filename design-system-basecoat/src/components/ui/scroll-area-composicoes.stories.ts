import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import { createScrollArea } from './scroll-area';
import { createCard, createCardHeader, createCardTitle, createCardDescription, createCardContent } from './card';
import { createBadge } from './badge';

const meta: Meta = {
  title: 'UI/ScrollArea/Composições',
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composições reais: lista vertical com badges, cards horizontais em carrossel, tabela ampla bidirecional, ScrollArea dentro de Card e sidebar de navegação rolável.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tagItem(label: string, count: string): HTMLElement {
  const row = document.createElement('div');
  row.className = 'flex items-center justify-between px-3 py-2 border-b border-border/40';
  const left = document.createElement('span');
  left.className = 'text-sm';
  left.textContent = label;
  const badge = createBadge({ variant: 'secondary', text: count });
  row.append(left, badge);
  return row;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const TagsList: Story = {
  name: 'Lista vertical com badges',
  render: () => {
    const outer = document.createElement('div');
    outer.className = 'w-full max-w-sm';

    const list = document.createElement('div');
    list.className = 'flex flex-col';
    const tags = [
      ['v1.0.0', '120'], ['v1.1.0', '98'], ['v1.2.0', '76'], ['v2.0.0', '210'],
      ['v2.1.0', '54'], ['v2.2.0', '88'], ['v3.0.0', '162'], ['v3.1.0', '42'],
      ['v3.2.0', '17'], ['v3.3.0', '9'],  ['v4.0.0', '305'], ['v4.1.0', '128'],
      ['v4.2.0', '64'], ['v5.0.0', '410'], ['v5.1.0', '37'], ['v5.2.0', '12'],
      ['v6.0.0', '500'], ['v6.1.0', '74'], ['v6.2.0', '23'], ['v7.0.0', '610'],
    ];
    tags.forEach(([t, c]) => list.appendChild(tagItem(t, c)));

    outer.appendChild(createScrollArea({
      height: '300px',
      class: 'w-full rounded-md border',
      children: list,
    }));
    return outer;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector('[data-slot="scroll-area"]') as HTMLElement | null;
    await expect(root).toBeTruthy();
    await expect(root!.style.height).toBe('300px');
    await expect(canvas.getByText('v1.0.0')).toBeInTheDocument();
  },
};

export const HorizontalCards: Story = {
  name: 'Carrossel horizontal de cards',
  render: () => {
    const outer = document.createElement('div');
    outer.className = 'w-full max-w-2xl';

    const row = document.createElement('div');
    row.className = 'flex gap-4 p-3 w-max';

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
      const card = createCard({ className: 'w-56 shrink-0' });
      const header = createCardHeader();
      header.appendChild(createCardTitle({ text: p.title, level: 3, className: 'text-base' }));
      header.appendChild(createCardDescription({ text: p.desc }));
      const content = createCardContent({ className: 'text-sm text-muted-foreground' });
      content.textContent = 'Produto em destaque.';
      card.append(header, content);
      row.appendChild(card);
    });

    outer.appendChild(createScrollArea({
      width: '100%',
      class: 'rounded-md border whitespace-nowrap',
      children: row,
    }));
    return outer;
  },
};

export const WideTable: Story = {
  name: 'Tabela ampla (bidirecional)',
  render: () => {
    const outer = document.createElement('div');
    outer.className = 'w-full max-w-2xl';

    const wrap = document.createElement('div');
    wrap.className = 'p-0';

    const table = document.createElement('table');
    table.className = 'border-collapse text-xs w-max';

    const header = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.className = 'bg-muted/40';
    for (let c = 0; c <= 12; c++) {
      const th = document.createElement('th');
      th.className = 'border border-border px-3 py-2 text-left whitespace-nowrap font-medium';
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
        td.className = 'border border-border px-3 py-2 whitespace-nowrap';
        td.textContent = c === 0 ? `#${String(r).padStart(3, '0')}` : `${r}.${c}`;
        tr.appendChild(td);
      }
      body.appendChild(tr);
    }
    table.appendChild(body);
    wrap.appendChild(table);

    outer.appendChild(createScrollArea({
      height: '320px',
      width: '100%',
      class: 'rounded-md border',
      children: wrap,
    }));
    return outer;
  },
};

export const InsideCard: Story = {
  name: 'Dentro de Card',
  render: () => {
    const card = createCard({ className: 'w-full max-w-md' });

    const header = createCardHeader();
    header.appendChild(createCardTitle({ text: 'Histórico de atividades', level: 3 }));
    header.appendChild(createCardDescription({ text: 'Últimas 30 ações do usuário' }));

    const content = createCardContent({ className: 'p-0' });

    const list = document.createElement('ul');
    list.className = 'flex flex-col gap-1 p-3 list-none m-0';
    const actions = ['Login', 'Editou perfil', 'Trocou senha', 'Removeu sessão', 'Adicionou cartão',
      'Cancelou assinatura', 'Renovou plano', 'Exportou dados', 'Importou contatos', 'Convidou usuário',
      'Removeu usuário', 'Alterou permissão', 'Criou projeto', 'Arquivou projeto', 'Restaurou projeto',
      'Atualizou billing', 'Verificou e-mail', 'Adicionou 2FA', 'Removeu 2FA', 'Bloqueou IP',
      'Desbloqueou IP', 'Aceitou termos', 'Recusou cookies', 'Solicitou exclusão', 'Cancelou exclusão',
      'Configurou webhook', 'Testou webhook', 'Removeu webhook', 'Conectou GitHub', 'Desconectou GitHub'];
    actions.forEach((a, i) => {
      const li = document.createElement('li');
      li.className = 'flex items-center justify-between text-sm border-b border-border/40 py-2 last:border-0';
      const left = document.createElement('span');
      left.textContent = a;
      const right = document.createElement('span');
      right.className = 'text-xs text-muted-foreground';
      right.textContent = `${i + 1} min`;
      li.append(left, right);
      list.appendChild(li);
    });

    content.appendChild(createScrollArea({
      height: '240px',
      class: 'w-full border-t',
      children: list,
    }));

    card.append(header, content);

    const wrap = document.createElement('div');
    wrap.className = 'w-full max-w-md';
    wrap.appendChild(card);
    return wrap;
  },
};

export const Sidebar: Story = {
  name: 'Sidebar de navegação',
  render: () => {
    const outer = document.createElement('div');
    outer.className = 'flex w-full max-w-3xl gap-4';

    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', 'Componentes do design system');

    const list = document.createElement('ul');
    list.className = 'flex flex-col gap-1 p-3 list-none m-0';
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
      link.className = 'block px-3 py-1.5 rounded-md text-sm hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
      link.textContent = label;
      li.appendChild(link);
      list.appendChild(li);
    });

    nav.appendChild(list);

    const sidebar = createScrollArea({
      height: '360px',
      class: 'w-56 rounded-md border',
      children: nav,
    });

    const content = document.createElement('div');
    content.className = 'flex-1 rounded-md border p-4 text-sm text-muted-foreground';
    content.textContent = 'Conteúdo principal — a sidebar à esquerda rola independentemente desta área.';

    outer.append(sidebar, content);
    return outer;
  },
};
