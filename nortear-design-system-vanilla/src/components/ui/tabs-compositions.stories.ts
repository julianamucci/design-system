import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { createTabs, type TabsItemDef } from './tabs';
import { ativar, makePanel } from './tabs.fixtures';
import {
  tabsSource,
  tabsSourceWith,
  tabsSourceWithBadge,
  tabsSourceWithIcons,
} from './tabs.source';
import { createBadge } from './badge';
import { User, Settings, Shield } from 'lucide';

const meta: Meta = {
  tags: ['navigation'],
  title: 'Primitives/Navigation/Tabs/Compositions',
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
    docs: {
      source: { transform: tabsSource },
      description: {
        component:
          'Composições reais com Tabs: ícone e badge no gatilho, lista lateral e sub-navegação. ' +
          'A orientação e a variante vêm das opções da factory — o layout inteiro é responsabilidade do CSS do design system.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

type LucideIconNode = [string, Record<string, string>];

function createIcon(nodes: LucideIconNode[]): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'nds-icon-sm nds-shrink-0');
  for (const [tag, attrs] of nodes) {
    const child = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs)) child.setAttribute(k, v);
    svg.appendChild(child);
  }
  return svg;
}

function makeRichPanel(title: string, description: string): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'nds-stack nds-p-4 nds-rounded-md nds-border-default nds-bg-card';
  wrap.dataset.spacing = 'sm';
  const h = document.createElement('h3');
  h.className = 'nds-text-body nds-font-semibold';
  h.textContent = title;
  const p = document.createElement('p');
  p.className = 'nds-text-body';
  p.textContent = description;
  wrap.append(h, p);
  return wrap;
}

function configItems(): TabsItemDef[] {
  return [
    { value: 'profile',  label: 'Perfil',    content: makeRichPanel('Perfil',    'Edite suas informações públicas.') },
    { value: 'account',  label: 'Conta',     content: makeRichPanel('Conta',     'Email, idioma e preferências.') },
    { value: 'security', label: 'Segurança', content: makeRichPanel('Segurança', 'Senha e autenticação em dois fatores.') },
  ];
}

// ─── Com Ícones no Trigger ────────────────────────────────────────────────────

export const WithIconsInTrigger: Story = {
  parameters: {
    covers: ['accessibility.item4'],
    docs: {
      // `label` é texto: o ícone entra no gatilho depois de montado, e é isso
      // que o leitor precisa ver.
      source: {
        transform: tabsSourceWithIcons(
          [
            { value: 'profile', label: 'Perfil', content: 'Edite suas informações públicas.', icon: 'User' },
            { value: 'account', label: 'Conta', content: 'Email, idioma e preferências.', icon: 'Settings' },
            { value: 'security', label: 'Segurança', content: 'Senha e autenticação em dois fatores.', icon: 'Shield' },
          ],
          { 'aria-label': 'Configurações' },
        ),
      },
      description: {
        story:
          'Ícones no gatilho. O ícone é sempre decorativo (`aria-hidden="true"`): o rótulo textual já descreve a aba, ' +
          'e um ícone anunciado só alongaria o nome sem acrescentar informação.',
      },
    },
  },
  render: () => {
    const items = configItems();
    const iconMap: Record<string, LucideIconNode[]> = {
      profile:  User as unknown as LucideIconNode[],
      account:  Settings as unknown as LucideIconNode[],
      security: Shield as unknown as LucideIconNode[],
    };

    const root = createTabs({
      defaultValue: 'profile',
      class: 'nds-w-lg',
      items,
      'aria-label': 'Configurações',
    });

    // Substitui textContent do trigger por icon + label (textContent escapa automaticamente).
    items.forEach((item) => {
      const trigger = root.querySelector<HTMLButtonElement>(`[role="tab"][data-value="${item.value}"]`);
      if (!trigger) return;
      trigger.textContent = '';
      const wrapper = document.createElement('span');
      wrapper.className = 'nds-cluster';
      wrapper.dataset.spacing = 'sm';
      wrapper.appendChild(createIcon(iconMap[item.value]));
      const label = document.createElement('span');
      label.textContent = item.label;
      wrapper.appendChild(label);
      trigger.appendChild(wrapper);
    });

    return root;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Os três papéis do padrão tabs continuam íntegros com ícone', async () => {
      await expect(canvas.getByRole('tablist')).toHaveAttribute('aria-label', 'Configurações');
      await expect(canvas.getAllByRole('tab')).toHaveLength(3);
      await expect(canvas.getAllByRole('tabpanel')).toHaveLength(1);
    });

    await step('O nome acessível da aba é só o rótulo', async () => {
      // Nome exato: se o svg fosse anunciado, o nome teria mais que a palavra.
      await expect(canvas.getByRole('tab', { name: 'Perfil' })).toHaveAttribute('data-value', 'profile');
      await expect(canvas.getByRole('tab', { name: 'Segurança' })).toHaveAttribute('data-value', 'security');
    });

    await step('Cada ícone é decorativo, desenhado e transparente ao ponteiro', async () => {
      const icons = Array.from(canvasElement.querySelectorAll<SVGSVGElement>('[role="tab"] svg'));
      await expect(icons).toHaveLength(3);
      await expect(icons.map((s) => s.getAttribute('aria-hidden'))).toEqual(['true', 'true', 'true']);
      // svg sem filho é ícone que não desenhou nada.
      await expect(icons.every((s) => s.childElementCount > 0)).toBe(true);
      // O ícone não pode interceptar o clique destinado à aba.
      await expect(icons.map((s) => getComputedStyle(s).pointerEvents)).toEqual(['none', 'none', 'none']);
    });
  },
};

// ─── Com Badge no Trigger ─────────────────────────────────────────────────────

export const WithBadgeInTrigger: Story = {
  parameters: {
    covers: ['functional.item1'],
    docs: {
      source: {
        transform: tabsSourceWithBadge(
          [
            { value: 'inbox', label: 'Caixa de entrada', content: '12 mensagens não lidas.', badge: { text: '12' } },
            { value: 'spam', label: 'Spam', content: '3 mensagens marcadas como spam.', badge: { text: '3', variant: 'destructive' } },
            { value: 'trash', label: 'Lixeira', content: 'Itens excluídos nos últimos 30 dias.' },
          ],
          { 'aria-label': 'Caixas de mensagem' },
        ),
      },
      description: {
        story:
          'Badge no gatilho para contador ou status. O badge entra no nome da aba, mas não é um segundo alvo de foco — ' +
          'quem é interativo ali é a aba. O rótulo continua autoexplicativo sem ele.',
      },
    },
  },
  render: () => {
    const items: TabsItemDef[] = [
      { value: 'inbox',  label: 'Caixa de entrada', content: makeRichPanel('Caixa de entrada', '12 mensagens não lidas.') },
      { value: 'spam',   label: 'Spam',             content: makeRichPanel('Spam',             '3 mensagens marcadas como spam.') },
      { value: 'trash',  label: 'Lixeira',          content: makeRichPanel('Lixeira',          'Itens excluídos nos últimos 30 dias.') },
    ];
    const badgeMap: Record<string, { text: string; variant: 'default' | 'destructive' }> = {
      inbox: { text: '12', variant: 'default' },
      spam:  { text: '3',  variant: 'destructive' },
    };

    const root = createTabs({
      defaultValue: 'inbox',
      class: 'nds-w-lg',
      items,
      'aria-label': 'Caixas de mensagem',
    });

    items.forEach((item) => {
      const badgeCfg = badgeMap[item.value];
      if (!badgeCfg) return;
      const trigger = root.querySelector<HTMLButtonElement>(`[role="tab"][data-value="${item.value}"]`);
      if (!trigger) return;
      trigger.textContent = '';
      const wrapper = document.createElement('span');
      wrapper.className = 'nds-cluster';
      wrapper.dataset.spacing = 'sm';
      const labelEl = document.createElement('span');
      labelEl.textContent = item.label;
      // Sem `style.fontSize`/`style.height`: altura cravada num primitivo de
      // texto trava o componente quando o navegador aumenta a fonte.
      wrapper.append(labelEl, createBadge({ text: badgeCfg.text, variant: badgeCfg.variant }));
      trigger.appendChild(wrapper);
    });

    return root;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const abas = canvas.getAllByRole('tab');
    const entry = canvas.getByRole('tab', { name: /^Caixa de entrada/ });
    const spam = canvas.getByRole('tab', { name: /^Spam/ });

    await step('O badge não vira um segundo alvo de foco', async () => {
      const badges = Array.from(canvasElement.querySelectorAll<HTMLElement>('[role="tab"] [data-slot="badge"]'));
      await expect(badges).toHaveLength(2);
      await expect(badges.map((b) => b.getAttribute('tabindex'))).toEqual([null, null]);
      await expect(badges.map((b) => b.getAttribute('role'))).toEqual([null, null]);
      // A contagem de abas não mudou: o badge é conteúdo do gatilho, não um par dele.
      await expect(abas).toHaveLength(3);
    });

    await step('Clicar numa aba ativa ela e troca o painel', async () => {
      await ativar(spam);
      await expect(canvas.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', spam.id);
      // Devolve o conjunto ao estado de montagem para o próximo replay.
      await ativar(entry);
      await expect(canvas.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', entry.id);
    });
  },
};

// ─── Lista lateral (orientation vertical) ────────────────────────────────────

export const Vertical: Story = {
  parameters: {
    docs: {
      source: {
        transform: tabsSourceWith({
          orientation: 'vertical',
          'aria-label': 'Configurações',
          items: [
            { value: 'profile', label: 'Perfil', content: 'Edite suas informações públicas.' },
            { value: 'account', label: 'Conta', content: 'Email, idioma e preferências.' },
            { value: 'security', label: 'Segurança', content: 'Senha e autenticação em dois fatores.' },
          ],
        }),
      },
      description: {
        story:
          'Lista lateral com o painel ao lado. Cabe quando os rótulos são longos ou passam de cinco — ' +
          'empilhados eles não competem por largura. A navegação por seta acompanha a direção.',
      },
    },
  },
  render: () =>
    createTabs({
      defaultValue: 'profile',
      orientation: 'vertical',
      class: 'nds-w-lg',
      items: configItems(),
      'aria-label': 'Configurações',
    }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector('[data-slot="tabs"]')!;
    const list = canvas.getByRole('tablist');
    const abas = canvas.getAllByRole('tab');

    await step('O conjunto se declara vertical e se desenha empilhado', async () => {
      await expect(root).toHaveAttribute('data-orientation', 'vertical');
      await expect(list).toHaveAttribute('aria-orientation', 'vertical');
      const borders = new Set(abas.map((a) => Math.round(a.getBoundingClientRect().left)));
      await expect(borders.size).toBe(1);
      await expect(canvas.getByRole('tabpanel').getBoundingClientRect().left)
        .toBeGreaterThanOrEqual(list.getBoundingClientRect().right);
    });

    await step('A seta segue a direção da lista', async () => {
      abas[0].focus();
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(() => expect(abas[1]).toHaveAttribute('aria-selected', 'true'));
      await userEvent.keyboard('{ArrowUp}');
      await waitFor(() => expect(abas[0]).toHaveAttribute('aria-selected', 'true'));
    });
  },
};

// ─── Sub-navegação (variant line) ─────────────────────────────────────────────

export const SubNavigationLine: Story = {
  parameters: {
    docs: {
      source: {
        transform: tabsSourceWith({
          variant: 'line',
          'aria-label': 'Filtros de listagem',
          items: [
            { value: 'all', label: 'Tudo', content: 'Mostrando todos os itens.' },
            { value: 'active', label: 'Ativos', content: 'Mostrando apenas ativos.' },
            { value: 'archived', label: 'Arquivados', content: 'Mostrando apenas arquivados.' },
          ],
        }),
      },
      description: {
        story:
          'Sub-navegação minimalista. Sem trilho, o conjunto não compete com os containers da página em volta; ' +
          'o ativo é marcado por um traço fino.',
      },
    },
  },
  render: () => {
    const items: TabsItemDef[] = [
      { value: 'all',      label: 'Tudo',       content: makePanel('Mostrando todos os itens.') },
      { value: 'active',   label: 'Ativos',     content: makePanel('Mostrando apenas ativos.') },
      { value: 'archived', label: 'Arquivados', content: makePanel('Mostrando apenas arquivados.') },
    ];

    return createTabs({
      defaultValue: 'all',
      variant: 'line',
      class: 'nds-w-lg',
      items,
      'aria-label': 'Filtros de listagem',
    });
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const list = canvas.getByRole('tablist');
    const [ativa, inativa] = canvas.getAllByRole('tab');

    await step('Sem trilho: a lista não pinta fundo', async () => {
      await expect(list).toHaveAttribute('data-variant', 'line');
      await expect(getComputedStyle(list).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    });

    await step('O ativo é marcado por um traço, desenhado em ::after', async () => {
      await waitFor(() => expect(getComputedStyle(ativa, '::after').opacity).toBe('1'));
      await expect(getComputedStyle(inativa, '::after').opacity).toBe('0');
    });
  },
};
