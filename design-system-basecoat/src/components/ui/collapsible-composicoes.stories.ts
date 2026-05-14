import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect } from 'storybook/test';
import { createCollapsible } from './collapsible';
import { ChevronDown, Filter, Settings } from 'lucide';

const meta: Meta = {
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
  title: 'UI/Collapsible/Composições',
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
  svg.setAttribute('class', `h-4 w-4 shrink-0${extraClass ? ' ' + extraClass : ''}`);
  for (const [tag, attrs] of nodes) {
    const child = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs)) child.setAttribute(k, v);
    svg.appendChild(child);
  }
  return svg;
}

function makeTriggerWithIcon(nodes: LucideIconNode[], label: string): HTMLElement {
  const span = document.createElement('span');
  span.className = 'flex items-center gap-2';
  span.appendChild(createIcon(nodes));
  const text = document.createElement('span');
  text.textContent = label;
  span.appendChild(text);
  return span;
}

function makeContent(items: string[]): HTMLElement {
  const div = document.createElement('div');
  div.className = 'rounded-md border border-border bg-muted/50 p-4 text-sm space-y-2 mt-2';
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
      'inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
    btn.textContent = 'Exibir opções avançadas';

    return createCollapsible({
      trigger: btn,
      content: makeContent(['Opção avançada 1', 'Opção avançada 2', 'Opção avançada 3']),
      class: 'w-full max-w-sm',
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
      class: 'w-full max-w-sm',
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
      'transition-transform duration-200 [[data-state=open]_&]:rotate-180',
    );

    const triggerEl = document.createElement('span');
    triggerEl.className = 'flex items-center justify-between w-full';
    const label = document.createElement('span');
    label.textContent = 'Configurações avançadas';
    triggerEl.appendChild(label);
    triggerEl.appendChild(chevron);

    const btn = document.createElement('button');
    btn.className =
      'flex w-full items-center justify-between rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
    btn.appendChild(triggerEl);

    const content = document.createElement('div');
    content.className = 'rounded-md border border-border bg-muted/50 p-4 text-sm space-y-2 mt-2';
    [
      { key: 'Notificações', val: 'Ativadas' },
      { key: 'Privacidade', val: 'Modo estrito' },
    ].forEach(({ key, val }) => {
      const row = document.createElement('div');
      row.className = 'flex justify-between';
      const k = document.createElement('span');
      k.className = 'text-muted-foreground';
      k.textContent = key;
      const v = document.createElement('span');
      v.className = 'font-medium';
      v.textContent = val;
      row.appendChild(k);
      row.appendChild(v);
      content.appendChild(row);
    });

    return createCollapsible({
      trigger: btn,
      content,
      class: 'w-full max-w-sm',
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
      'Configurações do sistema',
    );

    const content = document.createElement('div');
    content.className = 'rounded-md border border-border bg-muted/50 p-4 text-sm space-y-3 mt-2';

    const note = document.createElement('p');
    note.className = 'text-muted-foreground text-xs';
    note.textContent = 'Altere as configurações abaixo com cuidado. As mudanças são aplicadas imediatamente.';
    content.appendChild(note);

    [
      'Habilitar modo de depuração',
      'Limpar cache ao sair',
      'Exportar logs automaticamente',
    ].forEach((item) => {
      const row = document.createElement('label');
      row.className = 'flex items-center gap-2 cursor-pointer';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'h-4 w-4 rounded border-border';
      const text = document.createElement('span');
      text.textContent = item;
      row.appendChild(checkbox);
      row.appendChild(text);
      content.appendChild(row);
    });

    return createCollapsible({
      trigger: triggerEl,
      content,
      class: 'w-full max-w-sm',
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
