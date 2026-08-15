import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect, waitFor } from 'storybook/test';
import { createTooltip } from './tooltip';
import { createButton, createButtonIcon } from './button';

// As composições que o conteúdo compartilhado documenta, mais os quatro lados de
// posicionamento. Em todas, o Tooltip acrescenta contexto a um elemento que JÁ
// se explica sozinho — nunca é o único portador da informação.

/** O balão vive num portal no `body` — o caminho até ele é o aria-describedby. */
function balaoDe(gatilho: HTMLElement): HTMLElement | null {
  const id = gatilho.getAttribute('aria-describedby');
  const alvo = id ? document.getElementById(id) : null;
  return alvo?.closest<HTMLElement>('[data-slot="tooltip-content"]') ?? null;
}

function limparPortal(): void {
  document.querySelectorAll('[data-slot="tooltip-content"]').forEach((n) => n.remove());
}

function wrap(child: HTMLElement, minHeight = '200px'): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.style.contain = 'layout';
  wrapper.style.minHeight = minHeight;
  wrapper.className = 'nds-cluster nds-w-full';
  wrapper.dataset.justify = 'center';
  wrapper.appendChild(child);
  return wrapper;
}

const meta: Meta = {
  tags: ['overlay'],
  title: 'UI/Tooltip/Compositions',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Botão de ação rápida com atalho, ajuda ao lado do rótulo de um campo, definição de sigla no cabeçalho de uma métrica e os quatro lados de posicionamento. O Tooltip NÃO substitui o aria-label: em touch não há hover, e o nome do botão precisa existir sem ele.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const IconButtonWithShortcut: Story = {
  render: () => {
    const iconWrap = document.createElement('span');
    iconWrap.setAttribute('aria-hidden', 'true');
    iconWrap.appendChild(createButtonIcon('download'));

    const trigger = createButton({
      variant: 'ghost',
      size: 'icon',
      ariaLabel: 'Salvar',
      children: iconWrap,
    });

    const el = createTooltip({ trigger, content: 'Salvar (Ctrl+S)', side: 'bottom' });
    queueMicrotask(() => trigger.focus());
    return wrap(el);
  },
  play: async ({ canvasElement, step }) => {
    const gatilho = within(canvasElement).getByRole('button', { name: /salvar/i });

    await step('O nome acessível é do botão; o atalho é o extra', async () => {
      // A ordem importa: o `aria-label` sozinho já diz o que o botão faz. O
      // Tooltip acrescenta a tecla, que é conveniência, não requisito.
      await expect(gatilho).toHaveAttribute('aria-label', 'Salvar');
      gatilho.blur();
      gatilho.focus();
      await waitFor(async () => {
        await expect(balaoDe(gatilho)).not.toBeNull();
      });
      await expect(balaoDe(gatilho)!.textContent).toMatch(/Ctrl\+S/);
    });

    await step('Cleanup', async () => { limparPortal(); });
  },
};

export const HelpInFormField: Story = {
  name: 'Form field with help',
  render: () => {
    const root = document.createElement('div');
    root.className = 'nds-stack';
    root.dataset.spacing = 'sm';
    root.style.alignItems = 'flex-start';

    const labelRow = document.createElement('div');
    labelRow.className = 'nds-cluster';
    labelRow.dataset.spacing = 'sm';

    const label = document.createElement('label');
    label.className = 'nds-text-body nds-font-medium';
    label.textContent = 'Token de API';
    label.htmlFor = 'api-token-input';

    const help = createButton({
      variant: 'ghost',
      size: 'icon-sm',
      ariaLabel: 'Onde encontrar o Token de API',
      label: '?',
    });

    const tooltip = createTooltip({
      trigger: help,
      content: 'Gere em Configurações › Acesso › Tokens.',
      side: 'right',
    });

    labelRow.append(label, tooltip);

    const input = document.createElement('input');
    input.id = 'api-token-input';
    input.type = 'text';
    input.className = 'nds-input';
    input.placeholder = 'ndsk_...';

    root.append(labelRow, input);
    queueMicrotask(() => help.focus());
    return wrap(root);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('button', { name: /Onde encontrar o Token de API/i });

    await step('O campo continua rotulado pelo label, não pelo Tooltip', async () => {
      // O `for`/`id` é o que nomeia o campo. O Tooltip explica ONDE achar o
      // valor — informação complementar, que pode faltar sem quebrar o form.
      const campo = canvas.getByLabelText('Token de API');
      await expect(campo).toHaveAttribute('id', 'api-token-input');
    });

    await step('O ícone de ajuda é um botão focável, com nome próprio', async () => {
      gatilho.blur();
      gatilho.focus();
      await expect(gatilho).toHaveFocus();
      await waitFor(async () => {
        await expect(balaoDe(gatilho)).not.toBeNull();
      });
      await expect(balaoDe(gatilho)!.textContent).toContain('Tokens');
    });

    await step('Cleanup', async () => { limparPortal(); });
  },
};

export const MetricDescription: Story = {
  render: () => {
    const root = document.createElement('div');
    root.className = 'nds-stack';
    root.dataset.spacing = 'xs';
    root.style.alignItems = 'flex-start';

    const headerRow = document.createElement('div');
    headerRow.className = 'nds-cluster';
    headerRow.dataset.spacing = 'sm';

    const title = document.createElement('p');
    title.className = 'nds-text-caption nds-font-medium nds-text-muted-foreground nds-uppercase nds-tracking-wider';
    title.textContent = 'LCP';

    const help = createButton({
      variant: 'ghost',
      size: 'icon-sm',
      ariaLabel: 'O que é LCP',
      label: 'i',
    });

    const tooltip = createTooltip({
      trigger: help,
      content: 'LCP — Largest Contentful Paint',
      side: 'top',
    });

    headerRow.append(title, tooltip);

    const value = document.createElement('p');
    value.className = 'nds-text-h3 nds-font-semibold';
    value.textContent = '1,8 s';

    root.append(headerRow, value);
    queueMicrotask(() => help.focus());
    return wrap(root);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('button', { name: /O que é LCP/i });

    await step('A sigla fica visível; o Tooltip só a expande', async () => {
      await expect(canvasElement.textContent).toContain('LCP');
      gatilho.blur();
      gatilho.focus();
      await waitFor(async () => {
        await expect(balaoDe(gatilho)).not.toBeNull();
      });
      await expect(balaoDe(gatilho)!.textContent).toContain('Largest Contentful Paint');
    });

    await step('Cleanup', async () => { limparPortal(); });
  },
};

export const PlacementSides: Story = {
  parameters: { covers: ['visual.item3'] },
  render: () => {
    const grid = document.createElement('div');
    grid.style.contain = 'layout';
    grid.className = 'nds-grid nds-w-full nds-p-8';
    grid.dataset.cols = '2';
    grid.dataset.spacing = 'xl';
    grid.style.minHeight = '240px';

    const lados: Array<'top' | 'right' | 'bottom' | 'left'> = ['top', 'right', 'bottom', 'left'];

    for (const side of lados) {
      const trigger = createButton({ variant: 'outline', label: side, ariaLabel: side });
      grid.appendChild(createTooltip({ trigger, content: `Tooltip ${side}`, side }));
      queueMicrotask(() => {
        trigger.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      });
    }

    return wrap(grid, '260px');
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const baloes = () =>
      Array.from(document.querySelectorAll<HTMLElement>('[data-slot="tooltip-content"]'));

    await step('Os quatro balões abrem ao mesmo tempo', async () => {
      await waitFor(
        async () => {
          await expect(baloes().length).toBe(4);
        },
        { timeout: 3000 },
      );
    });

    await step('Cada balão nasce do lado pedido', async () => {
      for (const lado of ['top', 'right', 'bottom', 'left']) {
        const gatilho = canvas.getByRole('button', { name: lado });
        // A factory posiciona por JS e publica o lado escolhido em `data-side`
        // — o mesmo gancho que as outras stacks emitem.
        await expect(balaoDe(gatilho)).toHaveAttribute('data-side', lado);
        await expect(balaoDe(gatilho)!.textContent).toBe(`Tooltip ${lado}`);
      }
    });

    await step('Cleanup', async () => { limparPortal(); });
  },
};
