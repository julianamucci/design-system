import type { Meta, StoryObj } from '@storybook/html';
import { within, expect, waitFor } from 'storybook/test';
import { createTooltip } from './tooltip';
import { createButton, createButtonIcon } from './button';

const meta: Meta = {
  tags: ['overlay'],
  title: 'UI/Tooltip/Composicoes',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes do Tooltip: IconButtonComAtalho (botão icon-only com aria-label + atalho), CamposDeForm (label "?"), DescricaoDeMetrica (cabeçalho de KPI) e LadosDePosicionamento (top/right/bottom/left lado-a-lado). NOTA: tooltip NÃO substitui aria-label — em botões icon-only, o aria-label do botão é obrigatório porque o tooltip não aparece em mobile sem hover.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function wrap(child: HTMLElement, minHeight = '200px'): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.style.contain = 'layout';
  wrapper.style.minHeight = minHeight;
  wrapper.className = 'nds-cluster nds-w-full';
  wrapper.dataset.justify = 'center';
  wrapper.appendChild(child);
  return wrapper;
}

async function waitForOpen(): Promise<void> {
  const body = within(document.body);
  await waitFor(() => {
    if (!body.queryByRole('tooltip')) throw new Error('tooltip fechado');
  }, { timeout: 2000 });
}

async function cleanupPortal(): Promise<void> {
  document.querySelectorAll('[data-slot="tooltip-content"]').forEach((n) => n.remove());
  const body = within(document.body);
  await waitFor(() => {
    if (body.queryByRole('tooltip')) throw new Error('still open');
  });
}

function fireOpen(trigger: HTMLElement): void {
  queueMicrotask(() => {
    trigger.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
  });
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const IconButtonComAtalho: Story = {
  name: 'Icon-Button com Atalho',
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
    fireOpen(trigger);
    return wrap(el);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    await step('Botão icon-only mantém aria-label próprio + tooltip complementar', async () => {
      const trigger = canvas.getByRole('button', { name: /salvar/i });
      await expect(trigger).toHaveAttribute('aria-label', 'Salvar');
      await waitForOpen();
      const tip = await body.findByRole('tooltip');
      await expect(tip.textContent).toMatch(/Ctrl\+S/);
    });
    await step('Cleanup', async () => { await cleanupPortal(); });
  },
};

export const CamposDeForm: Story = {
  name: 'Campo de Form com Ajuda',
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
      ariaLabel: 'Ajuda sobre Token de API',
      label: '?',
    });

    const tooltip = createTooltip({
      trigger: help,
      content: 'Cole o token gerado em Configuracoes > Integrações.',
      side: 'right',
      class: 'max-w-xs whitespace-normal',
    });

    labelRow.append(label, tooltip);

    const input = document.createElement('input');
    input.id = 'api-token-input';
    input.type = 'text';
    input.className = 'input';
    input.style.width = '16rem';
    input.placeholder = 'sk-...';

    root.append(labelRow, input);
    fireOpen(help);
    return wrap(root);
  },
  play: async ({ step }) => {
    const body = within(document.body);
    await step('Tooltip de ajuda explica o campo', async () => {
      await waitForOpen();
      const tip = await body.findByRole('tooltip');
      await expect(tip.textContent).toMatch(/Configuracoes/);
    });
    await step('Cleanup', async () => { await cleanupPortal(); });
  },
};

export const DescricaoDeMetrica: Story = {
  name: 'Descrição de Métrica',
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
      content: 'Largest Contentful Paint — tempo até o maior elemento visível ser renderizado.',
      side: 'top',
      class: 'max-w-xs whitespace-normal',
    });

    headerRow.append(title, tooltip);

    const value = document.createElement('p');
    value.className = 'nds-text-h3 nds-font-semibold';
    value.textContent = '1.8s';

    root.append(headerRow, value);
    fireOpen(help);
    return wrap(root);
  },
  play: async ({ step }) => {
    const body = within(document.body);
    await step('Tooltip explica métrica LCP', async () => {
      await waitForOpen();
      const tip = await body.findByRole('tooltip');
      await expect(tip.textContent).toMatch(/Largest Contentful Paint/);
    });
    await step('Cleanup', async () => { await cleanupPortal(); });
  },
};

export const LadosDePosicionamento: Story = {
  name: 'Lados de Posicionamento',
  render: () => {
    const grid = document.createElement('div');
    grid.style.contain = 'layout';
    grid.className = 'nds-grid nds-w-full';
    grid.dataset.cols = '4';
    grid.dataset.spacing = 'xl';
    grid.style.placeItems = 'center';
    grid.style.minHeight = '200px';

    const sides: Array<{ side: 'top' | 'bottom' | 'left' | 'right'; label: string }> = [
      { side: 'top',    label: 'Top'    },
      { side: 'right',  label: 'Right'  },
      { side: 'bottom', label: 'Bottom' },
      { side: 'left',   label: 'Left'   },
    ];

    for (const { side, label } of sides) {
      const trigger = createButton({ variant: 'outline', label, ariaLabel: label });
      const el = createTooltip({ trigger, content: `Tooltip ${label}`, side });
      grid.appendChild(el);
    }

    return wrap(grid, '240px');
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Renderiza 4 triggers para 4 lados (top/right/bottom/left)', async () => {
      await expect(canvas.getByRole('button', { name: 'Top' })).toBeVisible();
      await expect(canvas.getByRole('button', { name: 'Right' })).toBeVisible();
      await expect(canvas.getByRole('button', { name: 'Bottom' })).toBeVisible();
      await expect(canvas.getByRole('button', { name: 'Left' })).toBeVisible();
    });
  },
};
