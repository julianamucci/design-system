import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect } from 'storybook/test';
import { waitForPortal } from '@/lib/wait-for-portal';
import { esperarEncostarNaBorda } from '@shared/testing/sheet-geometry';
import { createSheet, type SheetSide } from './sheet';
import { createButton } from './button';

// ─── Meta ─────────────────────────────────────────────────────────────────────

// As quatro direções são a única variação visual do Sheet. Cada uma nasce
// ABERTA: é o estado que a regressão visual captura e o que o axe tem para
// examinar — fechada, o painel nem está no DOM.

const meta: Meta = {
  tags: ['disclosure'],
  title: 'UI/Sheet/Variants',
  parameters: {
    actions: { disable: true },
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Direção do painel pela prop side. Right é o padrão de desktop; left serve à ' +
          'navegação secundária; top e bottom ocupam altura automática.',
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

// As asserções estão escritas story a story, e não extraídas para um helper: o
// lado é o ÚNICO contrato que cada uma destas quatro verifica, e ver a asserção
// dentro da story é o que torna um lado errado visível na leitura. Antes, três
// delas só contavam botões do canvas — uma asserção que passa com a tela vazia.

export const Right: Story = {
  parameters: {
    covers: ['accessibility.item1', 'accessibility.item2', 'visual.item1'],
    docs: { description: { story: 'Desliza da direita. Padrão para filtros em desktop.' } },
  },
  render: () => buildSheetSide({
    side: 'right',
    triggerLabel: 'Abrir painel direito',
    title: 'Painel direito',
    description: 'Filtros avançados encostados à direita.',
  }),
  play: async () => {
    const painel = await waitForPortal('dialog');
    await expect(painel).toHaveAttribute('data-side', 'right');
    await expect(painel).toHaveAttribute('aria-modal', 'true');
    await expect(painel).toHaveClass(/nds-sheet-content/);
    // O atributo prova que a prop chegou; a caixa prova que o CSS a obedeceu.
    await esperarEncostarNaBorda(painel, 'right');
  },
};

export const Left: Story = {
  parameters: {
    covers: ['visual.item2'],
    docs: { description: { story: 'Desliza da esquerda. Ideal para navegação secundária.' } },
  },
  render: () => buildSheetSide({
    side: 'left',
    triggerLabel: 'Abrir painel esquerdo',
    title: 'Painel esquerdo',
    description: 'Navegação secundária encostada à esquerda.',
  }),
  play: async () => {
    const painel = await waitForPortal('dialog');
    await expect(painel).toHaveAttribute('data-side', 'left');
    await expect(painel).toHaveClass(/nds-sheet-content/);
    await esperarEncostarNaBorda(painel, 'left');
  },
};

export const Top: Story = {
  parameters: {
    docs: { description: { story: 'Desliza do topo, com altura definida pelo conteúdo.' } },
  },
  render: () => buildSheetSide({
    side: 'top',
    triggerLabel: 'Abrir painel superior',
    title: 'Painel superior',
    description: 'Faixa superior com ações rápidas.',
  }),
  play: async () => {
    const painel = await waitForPortal('dialog');
    await expect(painel).toHaveAttribute('data-side', 'top');
    await expect(painel).toHaveClass(/nds-sheet-content/);
    await esperarEncostarNaBorda(painel, 'top');
  },
};

export const Bottom: Story = {
  parameters: {
    covers: ['visual.item3'],
    docs: { description: { story: 'Desliza de baixo — o desenho do Drawer, sem o gesto.' } },
  },
  render: () => buildSheetSide({
    side: 'bottom',
    triggerLabel: 'Abrir painel inferior',
    title: 'Painel inferior',
    description: 'Painel mobile-style sem swipe.',
  }),
  play: async () => {
    const painel = await waitForPortal('dialog');
    await expect(painel).toHaveAttribute('data-side', 'bottom');
    await expect(painel).toHaveClass(/nds-sheet-content/);
    await esperarEncostarNaBorda(painel, 'bottom');
  },
};
