import type { Meta, StoryObj } from '@storybook/html';
import { createTabs, type TabsItemDef } from './tabs';
import { createBadge } from './badge';
import { User, Settings, Shield } from 'lucide';

const meta: Meta = {
  title: 'UI/Tabs/Composições',
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composições reais com Tabs. Demonstra ícones, badges e layout vertical. ' +
          'DIVERGÊNCIAS Basecoat: a factory custom não expõe `variant` nem `orientation`; ' +
          'variantes line/vertical são aplicadas via utility classes manualmente.',
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
  svg.setAttribute('class', 'h-4 w-4 shrink-0');
  for (const [tag, attrs] of nodes) {
    const child = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs)) child.setAttribute(k, v);
    svg.appendChild(child);
  }
  return svg;
}

function makePanel(text: string): HTMLElement {
  const p = document.createElement('div');
  p.className = 'text-sm text-muted-foreground p-3 rounded-md border bg-card';
  p.textContent = text;
  return p;
}

function makeRichPanel(title: string, description: string): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'p-4 rounded-md border bg-card space-y-2';
  const h = document.createElement('h3');
  h.className = 'text-sm font-semibold';
  h.textContent = title;
  const p = document.createElement('p');
  p.className = 'text-sm text-muted-foreground';
  p.textContent = description;
  wrap.append(h, p);
  return wrap;
}

function setLabel(root: HTMLElement, label: string): HTMLElement {
  root.querySelector('[role="tablist"]')?.setAttribute('aria-label', label);
  return root;
}

// ─── Com Ícones no Trigger ────────────────────────────────────────────────────

export const ComIconesNoTrigger: Story = {
  render: () => {
    const items: TabsItemDef[] = [
      { value: 'profile',  label: 'Perfil',    content: makeRichPanel('Perfil',    'Edite suas informações públicas.') },
      { value: 'account',  label: 'Conta',     content: makeRichPanel('Conta',     'Email, idioma e preferências.') },
      { value: 'security', label: 'Segurança', content: makeRichPanel('Segurança', 'Senha e autenticação em dois fatores.') },
    ];
    const iconMap: Record<string, LucideIconNode[]> = {
      profile:  User as unknown as LucideIconNode[],
      account:  Settings as unknown as LucideIconNode[],
      security: Shield as unknown as LucideIconNode[],
    };

    const root = createTabs({ defaultValue: 'profile', class: 'w-full max-w-xl', items });

    // Substitui textContent do trigger por icon + label (textContent escapa automaticamente).
    items.forEach((item) => {
      const trigger = root.querySelector<HTMLButtonElement>(`[role="tab"][data-value="${item.value}"]`);
      if (!trigger) return;
      trigger.textContent = '';
      const wrapper = document.createElement('span');
      wrapper.className = 'flex items-center gap-2';
      wrapper.appendChild(createIcon(iconMap[item.value]));
      const label = document.createElement('span');
      label.textContent = item.label;
      wrapper.appendChild(label);
      trigger.appendChild(wrapper);
    });

    return setLabel(root, 'Configurações');
  },
  parameters: {
    docs: {
      description: {
        story:
          'Ícones no TabsTrigger. Sempre `aria-hidden="true"` no ícone — o label textual já descreve a tab para leitores de tela.',
      },
    },
  },
};

// ─── Com Badge no Trigger ─────────────────────────────────────────────────────

export const ComBadgeNoTrigger: Story = {
  render: () => {
    const items: TabsItemDef[] = [
      { value: 'inbox',  label: 'Caixa de entrada', content: makeRichPanel('Caixa de entrada', '12 mensagens não lidas.') },
      { value: 'spam',   label: 'Spam',             content: makeRichPanel('Spam',             '3 mensagens marcadas como spam.') },
      { value: 'trash',  label: 'Lixeira',          content: makeRichPanel('Lixeira',          'Itens excluídos nos últimos 30 dias.') },
    ];
    const badgeMap: Record<string, { text: string; variant: 'default' | 'secondary' | 'destructive' }> = {
      inbox: { text: '12', variant: 'default' },
      spam:  { text: '3',  variant: 'destructive' },
    };

    const root = createTabs({ defaultValue: 'inbox', class: 'w-full max-w-xl', items });

    items.forEach((item) => {
      const badgeCfg = badgeMap[item.value];
      if (!badgeCfg) return;
      const trigger = root.querySelector<HTMLButtonElement>(`[role="tab"][data-value="${item.value}"]`);
      if (!trigger) return;
      trigger.textContent = '';
      const wrapper = document.createElement('span');
      wrapper.className = 'flex items-center gap-2';
      const labelEl = document.createElement('span');
      labelEl.textContent = item.label;
      wrapper.append(labelEl, createBadge({ text: badgeCfg.text, variant: badgeCfg.variant, className: 'text-[10px] h-4' }));
      trigger.appendChild(wrapper);
    });

    return setLabel(root, 'Caixas de mensagem');
  },
  parameters: {
    docs: {
      description: {
        story:
          'Badge no trigger para contadores ou status (Novo, Beta). O badge é decorativo — o label do trigger deve ser autoexplicativo.',
      },
    },
  },
};

// ─── Vertical (divergência Basecoat) ──────────────────────────────────────────

export const Vertical: Story = {
  render: () => {
    const items: TabsItemDef[] = [
      { value: 'profile',  label: 'Perfil',    content: makeRichPanel('Perfil',    'Edite suas informações públicas.') },
      { value: 'account',  label: 'Conta',     content: makeRichPanel('Conta',     'Email, idioma e preferências.') },
      { value: 'security', label: 'Segurança', content: makeRichPanel('Segurança', 'Senha e autenticação em dois fatores.') },
    ];

    const root = createTabs({ defaultValue: 'profile', class: 'w-full max-w-2xl flex gap-4', items });
    const list = root.querySelector('[role="tablist"]') as HTMLElement | null;
    if (list) {
      list.classList.remove('inline-flex', 'h-9', 'items-center', 'justify-center');
      list.classList.add('flex', 'flex-col', 'h-auto', 'items-stretch', 'shrink-0', 'min-w-[10rem]');
      list.setAttribute('aria-orientation', 'vertical');
    }
    return setLabel(root, 'Configurações');
  },
  parameters: {
    docs: {
      description: {
        story:
          'Layout vertical com lista lateral. ' +
          'DIVERGÊNCIA Basecoat: factory NÃO expõe `orientation` — aplicamos flex-col + `aria-orientation="vertical"` manualmente. ' +
          'As setas continuam Left/Right (não Up/Down) — limitação documentada.',
      },
    },
  },
};

// ─── Sub-navegação (variant line) ─────────────────────────────────────────────

export const SubNavegacaoLine: Story = {
  render: () => {
    const items: TabsItemDef[] = [
      { value: 'all',     label: 'Tudo',       content: makePanel('Mostrando todos os itens.') },
      { value: 'active',  label: 'Ativos',     content: makePanel('Mostrando apenas ativos.') },
      { value: 'archived', label: 'Arquivados', content: makePanel('Mostrando apenas arquivados.') },
    ];

    const root = createTabs({ defaultValue: 'all', class: 'w-full max-w-2xl', items });
    const list = root.querySelector('[role="tablist"]') as HTMLElement | null;
    if (list) {
      list.classList.remove('bg-muted', 'rounded-lg');
      list.classList.add('border-b', 'rounded-none', 'bg-transparent', 'w-full', 'justify-start');
    }
    return setLabel(root, 'Filtros de listagem');
  },
  parameters: {
    docs: {
      description: {
        story:
          'Sub-navegação minimalista (variant line). Útil dentro de páginas onde o estilo "default" competiria com outros containers. ' +
          'DIVERGÊNCIA Basecoat: aplicado via classes utilitárias — a factory não expõe prop `variant`.',
      },
    },
  },
};
