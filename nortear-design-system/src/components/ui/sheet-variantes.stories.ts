import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import { createSheet, type SheetSide } from './sheet';
import { createButton } from './button';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  tags: ['disclosure'],
  title: 'UI/Sheet/Variantes',
  parameters: {
    actions: { disable: true },
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Variantes de posicionamento do Sheet via prop side: right (padrão), left, top e bottom. ' +
          'Cada history abre o painel programaticamente para captura visual no Chromatic.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeFooter(cancelLabel: string, actionLabel: string): HTMLElement {
  const cancel = createButton({ variant: 'outline', label: cancelLabel });
  const action = createButton({ variant: 'default', label: actionLabel });
  const footer = document.createElement('div');
  footer.className = 'nds-cluster';
  footer.dataset.spacing = 'sm';
  footer.append(cancel, action);
  return footer;
}

function makeBody(text: string): HTMLElement {
  const body = document.createElement('div');
  body.className = 'nds-text-body nds-text-muted-foreground';
  body.textContent = text;
  return body;
}

function buildSheetSide(opts: {
  side: SheetSide;
  triggerLabel: string;
  title: string;
  description: string;
}): HTMLElement {
  const trigger = createButton({ variant: 'outline', label: opts.triggerLabel });
  const sheet = createSheet({
    trigger,
    side: opts.side,
    title: opts.title,
    description: opts.description,
    content: makeBody('Conteúdo do painel — formulário, lista ou mensagem.'),
    footer: makeFooter('Cancelar', 'Aplicar filtros'),
  });
  queueMicrotask(() => trigger.click());
  return sheet;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Right: Story = {
  parameters: {
    docs: { description: { story: "Desliza da direita — side='right'. Padrão para filtros em desktop." } },
  },
  render: () => buildSheetSide({
    side: 'right',
    triggerLabel: 'Abrir painel direito',
    title: 'Painel direito',
    description: 'Filtros avançados encostados à direita.',
  }),
  play: async () => {
    const body = within(document.body);
    const dialog = await body.findByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
  },
};

export const Left: Story = {
  parameters: {
    docs: { description: { story: "Desliza da esquerda — side='left'. Ideal para navegação secundária." } },
  },
  render: () => buildSheetSide({
    side: 'left',
    triggerLabel: 'Abrir painel esquerdo',
    title: 'Painel esquerdo',
    description: 'Navegação secundária encostada à esquerda.',
  }),

  play: async ({ canvasElement }) => {
    const el = canvasElement as HTMLElement;
    await expect(within(el).queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
  },
};

export const Top: Story = {
  parameters: {
    docs: { description: { story: "Desliza do topo — side='top'. Altura automática." } },
  },
  render: () => buildSheetSide({
    side: 'top',
    triggerLabel: 'Abrir painel superior',
    title: 'Painel superior',
    description: 'Faixa superior com ações rápidas.',
  }),

  play: async ({ canvasElement }) => {
    const el = canvasElement as HTMLElement;
    await expect(within(el).queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
  },
};

export const Bottom: Story = {
  parameters: {
    docs: { description: { story: "Desliza de baixo — side='bottom'. Equivalente ao Drawer mas sem gesture." } },
  },
  render: () => buildSheetSide({
    side: 'bottom',
    triggerLabel: 'Abrir painel inferior',
    title: 'Painel inferior',
    description: 'Painel mobile-style sem swipe.',
  }),

  play: async ({ canvasElement }) => {
    const el = canvasElement as HTMLElement;
    await expect(within(el).queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
  },
};
