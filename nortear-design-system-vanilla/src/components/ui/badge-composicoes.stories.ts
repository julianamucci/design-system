import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect } from 'storybook/test';
import { Check, Bell } from 'lucide';
import { createBadge } from './badge';

const meta: Meta = {
  tags: ['feedback'],
  title: 'UI/Badge/Compositions',
  parameters: {
    design: figmaDesign('badge'),
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Configuracoes contextuais do Badge: combinado com ícone, como contador numérico, ' +
          'envolvido em <a> para navegação ou em <button> para trigger clicável.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers: ícones Lucide como SVG vanilla ─────────────────────────────────

type LucideIconNode = [string, Record<string, string>];

function createIcon(nodes: LucideIconNode[]): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  // Sem tamanho e sem margem aqui: `.nds-badge > svg` já dimensiona em 12px e o
  // gap do container faz o espaçamento. Margem manual somava ao gap.
  for (const [tag, attrs] of nodes) {
    const child = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs)) child.setAttribute(k, v);
    svg.appendChild(child);
  }
  return svg;
}

// ─── Composicoes ──────────────────────────────────────────────────────────────

export const WithIcon: Story = {
  parameters: { covers: ['functional.item5', 'accessibility.item2', 'visual.item3'] },
  render: () => {
    const icone = createIcon(Check as unknown as LucideIconNode[]);
    icone.dataset.icon = 'inline-start';
    return createBadge({ variant: 'default', children: [icone as unknown as HTMLElement, 'Ativo'] });
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByText('Ativo');

    // accessibility.item2 — o ícone é reforço visual: quem nomeia é o texto.
    const icone = badge.querySelector('svg');
    await expect(icone).not.toBeNull();
    await expect(icone).toHaveAttribute('aria-hidden', 'true');
    await expect(badge.textContent?.trim()).toBe('Ativo');

    // functional.item5 — o espaço entre ícone e texto é do container, não uma
    // margem na story: o .nds-badge declara gap, e o data-icon encurta o padding
    // daquele lado. Margem manual somaria ao gap e dobraria o respiro.
    const estilo = getComputedStyle(badge);
    await expect(estilo.display).toBe('inline-flex');
    await expect(parseFloat(estilo.columnGap)).toBeGreaterThan(0);
    await expect(getComputedStyle(icone!).marginRight).toBe('0px');
    await expect(parseFloat(estilo.paddingInlineStart)).toBeLessThan(
      parseFloat(estilo.paddingInlineEnd),
    );
  },
};

export const CountBadge: Story = {
  parameters: { covers: ['visual.item3'] },
  render: () => {
    const wrap = document.createElement('span');
    wrap.setAttribute('role', 'status');
    wrap.setAttribute('aria-label', '12 notificações não lidas');
    wrap.className = 'nds-cluster';
    wrap.dataset.spacing = 'sm';

    const sino = createIcon(Bell as unknown as LucideIconNode[]);
    // A utilitaria de 20px em vez de style inline: inline vence a folha e sai
    // do tema, da densidade e da escala. E as docs pages ja usam esta classe.
    sino.setAttribute('class', 'nds-text-foreground nds-icon-lg');

    wrap.append(sino, createBadge({ variant: 'destructive', children: '12' }));
    return wrap;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // O contador fica AO LADO do sino, como a documentação descreve.
    const status = canvas.getByRole('status', { name: /12 notificações não lidas/i });
    const badge = canvas.getByText('12');
    const sino = status.querySelector('svg')!;
    await expect(status.contains(badge)).toBe(true);
    await expect(sino.getBoundingClientRect().right).toBeLessThanOrEqual(
      badge.getBoundingClientRect().left + 1,
    );
    // Quem carrega o significado é o rótulo do container: "12" sozinho não diz
    // do que é a contagem.
    await expect(badge).toHaveAttribute('data-slot', 'badge');
  },
};

export const AsLink: Story = {
  parameters: { covers: ['functional.item6', 'accessibility.item4', 'visual.item4'] },
  render: () => {
    const link = document.createElement('a');
    link.href = '#design';
    link.className = 'nds-cluster nds-rounded-md nds-focus-ring-inset';
    link.setAttribute('aria-label', 'Ver todos os itens da categoria Design');
    link.appendChild(createBadge({ variant: 'secondary', children: 'Design' }));
    return link;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole('link', { name: /Ver todos os itens da categoria Design/i });
    // accessibility.item4 — quem é focável é o link; o badge fica decorativo
    // dentro dele, que é exatamente o que a documentação pede.
    const badge = link.querySelector('[data-slot="badge"]');
    await expect(badge).not.toBeNull();
    await expect(badge!.hasAttribute('tabindex')).toBe(false);
    link.focus();
    await expect(document.activeElement).toBe(link);
  },
};

export const AsButton: Story = {
  parameters: { covers: ['functional.item6', 'accessibility.item4', 'visual.item4'] },
  render: () => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'nds-cluster nds-rounded-md nds-focus-ring-inset';
    btn.style.background = 'transparent';
    btn.style.border = '0';
    btn.style.padding = '0';
    btn.setAttribute('aria-label', 'Filtrar por React');
    btn.appendChild(createBadge({ variant: 'outline', children: 'React' }));
    return btn;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const botao = canvas.getByRole('button', { name: /Filtrar por React/i });
    // functional.item6 — o pai recebe o foco e o badge não compete por ele.
    const badge = botao.querySelector('[data-slot="badge"]');
    await expect(badge).not.toBeNull();
    await expect(badge!.hasAttribute('tabindex')).toBe(false);
    botao.focus();
    await expect(document.activeElement).toBe(botao);
  },
};
