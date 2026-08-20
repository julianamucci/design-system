import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, waitFor, within, expect } from 'storybook/test';
import { createCollapsible } from './collapsible';
import { PAINEL_CLASSES, makeContent } from './collapsible.fixtures';
import { collapsibleComGatilhoSource, collapsibleSource } from './collapsible.source';
import { ChevronDown, Filter, Settings } from 'lucide';

const meta: Meta = {
  tags: ['disclosure'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    docs: { source: { transform: collapsibleSource } },
  },
  title: 'UI/Collapsible/Compositions',
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

// `makeContent` e `PAINEL_CLASSES` vêm de `collapsible.fixtures.ts` — as duas
// stories de conteúdo rico abaixo montam o painel na mão e reusam a constante.

type LucideIconNode = [string, Record<string, string>];

// `nds-icon` (16px) e não `nds-icon-sm` (14px): é a medida que as outras quatro
// stacks renderizam neste componente.
const ICONE_CLASSES = 'nds-icon nds-shrink-0';

function createIcon(nodes: LucideIconNode[], extraClass = ''): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', `${ICONE_CLASSES}${extraClass ? ' ' + extraClass : ''}`);
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

// Idempotentes — ver a nota em collapsible.stories.ts.
const abrir = async (t: HTMLElement) => {
  if (t.getAttribute('aria-expanded') !== 'true') await userEvent.click(t);
  await waitFor(() => expect(t).toHaveAttribute('aria-expanded', 'true'));
};
const fechar = async (t: HTMLElement) => {
  if (t.getAttribute('aria-expanded') !== 'false') await userEvent.click(t);
  await waitFor(() => expect(t).toHaveAttribute('aria-expanded', 'false'));
};

const painelDe = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="collapsible-content"]')!;

// ─── Com Botão Customizado ────────────────────────────────────────────────────

export const WithCustomButton: Story = {
  render: () => {
    const btn = document.createElement('button');
    btn.className = 'nds-button nds-button-outline nds-cluster nds-w-full nds-px-4';
    btn.dataset.justify = 'between';
    btn.textContent = 'Exibir opções avançadas';
    btn.appendChild(createIcon(ChevronDown as unknown as LucideIconNode[], 'nds-transition-transform nds-chevron'));

    return createCollapsible({
      trigger: btn,
      content: makeContent(['Opção avançada 1', 'Opção avançada 2', 'Opção avançada 3']),
      class: 'nds-w-cap-sm',
    });
  },
  parameters: {
    covers: ['functional.item5'],
    docs: {
      // O gatilho como ELEMENTO é o assunto: com o snippet do meta, que passa
      // texto, a story deixaria de mostrar o que documenta.
      source: {
        transform: collapsibleComGatilhoSource({ trigger: 'Exibir opções avançadas' }),
      },
      description: {
        story: 'Trigger customizado passando um <code>HTMLButtonElement</code> diretamente. O Collapsible mantém o ARIA (aria-expanded, aria-controls) no elemento passado.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /Exibir opções avançadas/ });

    await step('O botão do design system E o trigger são o MESMO elemento', async () => {
      // A factory não embrulha o botão passado: ela escreve o ARIA nele. É por
      // isso que o botão estilizado carrega aria-expanded e aria-controls.
      await expect(trigger).toHaveClass(/nds-button-outline/);
      await expect(trigger).toHaveAttribute('data-slot', 'collapsible-trigger');
      await expect(trigger).toHaveAttribute('aria-expanded');
    });

    await step('Aberto, o mesmo botão aponta para o painel', async () => {
      await fechar(trigger);
      await abrir(trigger);
      const id = trigger.getAttribute('aria-controls');
      await expect(id).toBeTruthy();
      await expect(document.getElementById(id!)).toBe(painelDe(canvasElement));
    });
  },
};

// ─── Com Ícone no Trigger ─────────────────────────────────────────────────────

export const WithIconInTrigger: Story = {
  render: () => {
    const triggerEl = makeTriggerWithIcon(
      Filter as unknown as LucideIconNode[],
      'Filtros avançados',
    );

    return createCollapsible({
      trigger: triggerEl,
      content: makeContent(['Filtro por categoria', 'Filtro por data', 'Filtro por status']),
      class: 'nds-w-cap-sm',
    });
  },
  parameters: {
    covers: ['accessibility.item4'],
    docs: {
      source: { transform: collapsibleComGatilhoSource({ trigger: 'Filtros avançados' }) },
      description: {
        story: 'Ícone no trigger. O ícone tem <code>aria-hidden="true"</code> — o texto do trigger descreve a ação para leitores de tela.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    // Achado pelo NOME acessível: se o SVG entrasse no nome, este seletor já não
    // casaria — é a asserção real por trás do aria-hidden.
    const trigger = canvas.getByRole('button', { name: 'Filtros avançados' });

    await step('O ícone não entra no nome acessível', async () => {
      const svgs = trigger.querySelectorAll('svg');
      await expect(svgs.length).toBe(1);
      for (const svg of svgs) await expect(svg).toHaveAttribute('aria-hidden', 'true');
    });

    await step('O trigger continua alternando o painel', async () => {
      await fechar(trigger);
      await abrir(trigger);
      await expect(canvas.getByText('Filtro por categoria')).toBeVisible();
    });
  },
};

// ─── Com Chevron Rotativo ─────────────────────────────────────────────────────

export const WithRotatingChevron: Story = {
  render: () => {
    // `.nds-chevron` já traz a transição E a rotação de 180° no estado aberto —
    // não é preciso escrever transition inline nem utilitário de rotação.
    const chevron = createIcon(
      ChevronDown as unknown as LucideIconNode[],
      'nds-transition-transform nds-chevron',
    );

    const conteudoTrigger = document.createElement('span');
    conteudoTrigger.className = 'nds-cluster nds-w-full';
    conteudoTrigger.dataset.justify = 'between';
    const label = document.createElement('span');
    label.textContent = 'Configurações avançadas';
    conteudoTrigger.appendChild(label);
    conteudoTrigger.appendChild(chevron);

    const btn = document.createElement('button');
    btn.className = 'nds-button nds-button-outline nds-cluster nds-w-full nds-px-4';
    btn.dataset.justify = 'between';
    btn.appendChild(conteudoTrigger);

    const content = document.createElement('div');
    content.className = PAINEL_CLASSES;
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
      class: 'nds-w-cap-sm',
    });
  },
  parameters: {
    covers: ['visual.item4'],
    docs: {
      source: {
        transform: collapsibleComGatilhoSource({
          trigger: 'Configurações avançadas',
          chevron: true,
        }),
      },
      description: {
        story: 'Chevron rotativo via CSS: a classe <code>.nds-chevron</code> gira 180° sozinha quando o trigger está aberto. O <code>data-state</code> e o <code>aria-expanded</code> são aplicados pelo Collapsible.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /Configurações avançadas/ });
    const chevron = trigger.querySelector<SVGElement>('svg')!;

    await step('O chevron é decorativo e carrega a classe da rotação', async () => {
      await expect(chevron).toHaveAttribute('aria-hidden', 'true');
      await expect(chevron.getAttribute('class')).toContain('nds-chevron');
    });

    await step('Fechado, o ícone não está girado', async () => {
      await fechar(trigger);
      // waitFor porque `.nds-chevron` tem transition: transform — medido no
      // primeiro quadro, o valor computado ainda é a matriz da animação.
      await waitFor(() => expect(getComputedStyle(chevron).transform).toBe('none'));
    });

    await step('Aberto, o CSS gira 180° a partir do estado no trigger', async () => {
      await abrir(trigger);
      await expect(trigger).toHaveAttribute('data-state', 'open');
      // matrix(-1, 0, 0, -1, 0, 0) é a forma computada de rotate(180deg).
      await waitFor(() =>
        expect(getComputedStyle(chevron).transform).toBe('matrix(-1, 0, 0, -1, 0, 0)'),
      );
    });
  },
};

// ─── Com Ícone Settings ──────────────────────────────────────────────────────

export const WithSettingsIcon: Story = {
  render: () => {
    const triggerEl = makeTriggerWithIcon(
      Settings as unknown as LucideIconNode[],
      'Configurações do sistema',
    );

    const content = document.createElement('div');
    content.className = PAINEL_CLASSES;
    content.dataset.spacing = 'sm';

    const note = document.createElement('p');
    note.className = 'nds-text-muted-foreground nds-text-caption';
    note.textContent = 'Altere as configurações abaixo com cuidado. As mudanças são aplicadas imediatamente.';
    content.appendChild(note);

    [
      'Habilitar modo de depuração',
      'Limpar cache ao sair',
      'Exportar logs automaticamente',
    ].forEach((item, i) => {
      const row = document.createElement('label');
      row.className = 'nds-cluster nds-cursor-pointer';
      row.dataset.spacing = 'sm';
      row.htmlFor = `collapsible-config-${i}`;
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `collapsible-config-${i}`;
      checkbox.className = 'nds-rounded nds-border-default nds-size-4';
      const text = document.createElement('span');
      text.textContent = item;
      row.appendChild(checkbox);
      row.appendChild(text);
      content.appendChild(row);
    });

    return createCollapsible({
      trigger: triggerEl,
      content,
      class: 'nds-w-cap-sm',
    });
  },
  parameters: {
    docs: {
      source: {
        transform: collapsibleComGatilhoSource({ trigger: 'Configurações do sistema' }),
      },
      description: {
        story: 'Ícone Settings com conteúdo rico (checkboxes). O CollapsibleContent aceita qualquer HTML — ideal para formulários de configuração raramente acessados.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Configurações do sistema' });

    await step('O painel aceita controles de formulário completos', async () => {
      await fechar(trigger);
      await abrir(trigger);
      await expect(canvas.getAllByRole('checkbox')).toHaveLength(3);
    });

    await step('E os controles de dentro continuam operáveis', async () => {
      // O painel fechado usa `hidden`, que retira o conteúdo do fluxo E da
      // árvore de acessibilidade: se ele estivesse inerte quando aberto, o
      // clique abaixo não mudaria nada.
      const primeiro = canvas.getAllByRole('checkbox')[0] as HTMLInputElement;
      const antes = primeiro.checked;
      await userEvent.click(primeiro);
      await expect(primeiro.checked).not.toBe(antes);
    });

    await step('Cada checkbox é rotulado pelo texto ao lado', async () => {
      await expect(
        canvas.getByLabelText('Habilitar modo de depuração'),
      ).toBeInTheDocument();
    });
  },
};
