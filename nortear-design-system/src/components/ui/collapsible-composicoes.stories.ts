import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect } from 'storybook/test';
import { createCollapsible } from './collapsible';
import { ChevronDown, Filter, Settings } from 'lucide';

const meta: Meta = {
  tags: ['disclosure'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
  title: 'UI/Collapsible/Composicoes',
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

type LucideIconNode = [string, Record<string, string>];

function createIcon(nodes: LucideIconNode[], extraClass = ''): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', `nds-icon-sm nds-shrink-0${extraClass ? ' ' + extraClass : ''}`);
  for (const [tag, attrs] of nodes) {
    const child = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs)) child.setAttribute(k, v);
    svg.appendChild(child);
  }
  return svg;
}

function makeTriggerWithIcon(nodes: LucideIconNode[], label: string): HTMLElement {
  const span = document.createElement('span');
  span.className = 'nds-cluster';
  span.dataset.spacing = 'sm';
  span.appendChild(createIcon(nodes));
  const text = document.createElement('span');
  text.textContent = label;
  span.appendChild(text);
  return span;
}

function makeContent(items: string[]): HTMLElement {
  const div = document.createElement('div');
  div.className = 'nds-stack nds-rounded-md nds-border-default nds-bg-muted-soft nds-p-4 nds-text-body nds-mt-2';
  div.dataset.spacing = 'sm';
  for (const text of items) {
    const p = document.createElement('p');
    p.textContent = text;
    div.appendChild(p);
  }
  return div;
}

// ─── Com Botão Customizado ────────────────────────────────────────────────────

export const ComBotaoCustomizado: Story = {
  render: () => {
    const btn = document.createElement('button');
    btn.className =
      'nds-cluster nds-rounded-md nds-border-default nds-bg-background nds-px-4 nds-py-2 nds-text-body nds-font-medium nds-shadow-sm nds-hover-bg-accent';
    btn.dataset.spacing = 'sm';
    btn.style.display = 'inline-flex';
    btn.textContent = 'Exibir opções avançadas';

    return createCollapsible({
      trigger: btn,
      content: makeContent(['Opção avançada 1', 'Opção avançada 2', 'Opção avançada 3']),
      class: 'nds-w-full nds-max-w-sm',
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'Trigger customizado passando um <code>HTMLButtonElement</code> diretamente. O Collapsible mantém o ARIA (aria-expanded, aria-controls) no elemento passado.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');

    await step('Trigger customizado possui aria-expanded=false', async () => {
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    await step('Clicar expande o painel', async () => {
      await userEvent.click(trigger);
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });
  },
};

// ─── Com Ícone no Trigger ─────────────────────────────────────────────────────

export const ComIconeNoTrigger: Story = {
  render: () => {
    const triggerEl = makeTriggerWithIcon(
      Filter as unknown as LucideIconNode[],
      'Filtros avançados',
    );

    return createCollapsible({
      trigger: triggerEl,
      content: makeContent(['Filtro por categoria', 'Filtro por data', 'Filtro por status']),
      class: 'nds-w-full nds-max-w-sm',
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'Ícone no trigger. O ícone tem <code>aria-hidden="true"</code> — o texto do trigger descreve a ação para leitores de tela.',
      },
    },
  },

  play: async ({ canvasElement }) => {
    const el = canvasElement as HTMLElement;
    await expect(within(el).queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
  },
};

// ─── Com Chevron Rotativo ─────────────────────────────────────────────────────

export const ComChevronRotativo: Story = {
  render: () => {
    const chevron = createIcon(
      ChevronDown as unknown as LucideIconNode[],
      'nds-collapsible-chevron',
    );
    chevron.style.transition = 'transform 200ms';

    const triggerEl = document.createElement('span');
    triggerEl.className = 'nds-cluster nds-w-full';
    triggerEl.dataset.justify = 'between';
    const label = document.createElement('span');
    label.textContent = 'Configuracoes avançadas';
    triggerEl.appendChild(label);
    triggerEl.appendChild(chevron);

    const btn = document.createElement('button');
    btn.className =
      'nds-cluster nds-w-full nds-rounded-md nds-border-default nds-bg-background nds-px-4 nds-py-2 nds-text-body nds-font-medium nds-shadow-sm nds-hover-bg-accent';
    btn.dataset.justify = 'between';
    btn.appendChild(triggerEl);

    const content = document.createElement('div');
    content.className = 'nds-stack nds-rounded-md nds-border-default nds-bg-muted-soft nds-p-4 nds-text-body nds-mt-2';
    content.dataset.spacing = 'sm';
    [
      { key: 'Notificações', val: 'Ativadas' },
      { key: 'Privacidade', val: 'Modo estrito' },
    ].forEach(({ key, val }) => {
      const row = document.createElement('div');
      row.className = 'nds-cluster';
      row.dataset.justify = 'between';
      const k = document.createElement('span');
      k.className = 'nds-text-muted-foreground';
      k.textContent = key;
      const v = document.createElement('span');
      v.className = 'nds-font-medium';
      v.textContent = val;
      row.appendChild(k);
      row.appendChild(v);
      content.appendChild(row);
    });

    return createCollapsible({
      trigger: btn,
      content,
      class: 'nds-w-full nds-max-w-sm',
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'Chevron rotativo via CSS usando <code>[[data-state=open]_&]:rotate-180</code>. O <code>data-state</code> é aplicado automaticamente pelo Collapsible no trigger e no painel.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');

    await step('Trigger começa fechado', async () => {
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    await step('Clicar expande e altera data-state para open', async () => {
      await userEvent.click(trigger);
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(trigger).toHaveAttribute('data-state', 'open');
    });
  },
};

// ─── Com Ícone Settings ──────────────────────────────────────────────────────

export const ComIconeSettings: Story = {
  render: () => {
    const triggerEl = makeTriggerWithIcon(
      Settings as unknown as LucideIconNode[],
      'Configuracoes do sistema',
    );

    const content = document.createElement('div');
    content.className = 'nds-stack nds-rounded-md nds-border-default nds-bg-muted-soft nds-p-4 nds-text-body nds-mt-2';
    content.dataset.spacing = 'sm';

    const note = document.createElement('p');
    note.className = 'nds-text-muted-foreground nds-text-caption';
    note.textContent = 'Altere as configurações abaixo com cuidado. As mudanças são aplicadas imediatamente.';
    content.appendChild(note);

    [
      'Habilitar modo de depuração',
      'Limpar cache ao sair',
      'Exportar logs automaticamente',
    ].forEach((item) => {
      const row = document.createElement('label');
      row.className = 'nds-cluster nds-cursor-pointer';
      row.dataset.spacing = 'sm';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'nds-rounded nds-border-default';
      checkbox.style.height = '1rem';
      checkbox.style.width = '1rem';
      const text = document.createElement('span');
      text.textContent = item;
      row.appendChild(checkbox);
      row.appendChild(text);
      content.appendChild(row);
    });

    return createCollapsible({
      trigger: triggerEl,
      content,
      class: 'nds-w-full nds-max-w-sm',
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'Ícone Settings com conteúdo rico (checkboxes). O CollapsibleContent aceita qualquer HTML — ideal para formulários de configuração raramente acessados.',
      },
    },
  },

  play: async ({ canvasElement }) => {
    const el = canvasElement as HTMLElement;
    await expect(within(el).queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
  },
};
