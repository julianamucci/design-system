import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect } from 'storybook/test';
import { waitForPortal } from '@/lib/wait-for-portal';
import { borderWaitForEncostar } from '@shared/testing/sheet-geometry';
import { createSheet, type SheetSide } from './sheet';
import { makeBody, makeFooter } from './sheet.fixtures';
import { sheetHeadingH3Source, sheetSource, sheetSourceWith } from './sheet.source';
import { createButton } from './button';

import { figmaDesign } from '@shared/figma/design-links';
// ─── Meta ─────────────────────────────────────────────────────────────────────

// As quatro direções são a única variação visual do Sheet. Cada uma nasce
// ABERTA: é o estado que a regressão visual captura e o que o axe tem para
// examinar — fechada, o painel nem está no DOM.

const meta: Meta = {
  tags: ['overlay'],
  title: 'Components/Overlay/Sheet/Variants',
  parameters: {
    design: figmaDesign('sheet'),
    actions: { disable: true },
    layout: 'centered',
    controls: { disable: true },
    docs: {
      source: { transform: sheetSource },
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

function buildSheetSide(opts: {
  side: SheetSide;
  triggerLabel: string;
  title: string;
  description: string;
  /** Sem valor, a fábrica assume `2` — que é o que as quatro direções usam. */
  titleLevel?: 1 | 2 | 3 | 4 | 5 | 6;
}): HTMLElement {
  const trigger = createButton({ variant: 'outline', label: opts.triggerLabel });
  const sheet = createSheet({
    trigger,
    side: opts.side,
    title: opts.title,
    titleLevel: opts.titleLevel,
    description: opts.description,
    // Corpo e rodapé canônicos — os mesmos que o painel Code publica.
    content: makeBody(),
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
    // `right` é o lado padrão, mas gatilho, título e descrição desta story não
    // são os do `meta`: sem o override, o painel Code publicaria os do
    // Playground e o leitor copiaria um exemplo que não é o que ele está vendo.
    docs: {
      source: {
        transform: sheetSourceWith({
          side: 'right',
          triggerLabel: 'Abrir painel direito',
          title: 'Painel direito',
          description: 'Filtros avançados encostados à direita.',
        }),
      },
      description: { story: 'Desliza da direita. Padrão para filtros em desktop.' },
    },
  },
  render: () => buildSheetSide({
    side: 'right',
    triggerLabel: 'Abrir painel direito',
    title: 'Painel direito',
    description: 'Filtros avançados encostados à direita.',
  }),
  play: async () => {
    const panel = await waitForPortal('dialog');
    await expect(panel).toHaveAttribute('data-side', 'right');
    await expect(panel).toHaveAttribute('aria-modal', 'true');
    await expect(panel).toHaveClass(/nds-sheet-content/);
    // O atributo prova que a prop chegou; a caixa prova que o CSS a obedeceu.
    await borderWaitForEncostar(panel, 'right');
  },
};

export const Left: Story = {
  parameters: {
    covers: ['visual.item2'],
    // O lado é o assunto da story, e `right` é o padrão da fábrica: sem o
    // override o painel Code mostraria a direção errada.
    docs: {
      source: {
        transform: sheetSourceWith({
          side: 'left',
          triggerLabel: 'Abrir painel esquerdo',
          title: 'Painel esquerdo',
          description: 'Navegação secundária encostada à esquerda.',
        }),
      },
      description: { story: 'Desliza da esquerda. Ideal para navegação secundária.' },
    },
  },
  render: () => buildSheetSide({
    side: 'left',
    triggerLabel: 'Abrir painel esquerdo',
    title: 'Painel esquerdo',
    description: 'Navegação secundária encostada à esquerda.',
  }),
  play: async () => {
    const panel = await waitForPortal('dialog');
    await expect(panel).toHaveAttribute('data-side', 'left');
    await expect(panel).toHaveClass(/nds-sheet-content/);
    await borderWaitForEncostar(panel, 'left');
  },
};

export const Top: Story = {
  parameters: {
    docs: {
      source: {
        transform: sheetSourceWith({
          side: 'top',
          triggerLabel: 'Abrir painel superior',
          title: 'Painel superior',
          description: 'Faixa superior com ações rápidas.',
        }),
      },
      description: { story: 'Desliza do topo, com altura definida pelo conteúdo.' },
    },
  },
  render: () => buildSheetSide({
    side: 'top',
    triggerLabel: 'Abrir painel superior',
    title: 'Painel superior',
    description: 'Faixa superior com ações rápidas.',
  }),
  play: async () => {
    const panel = await waitForPortal('dialog');
    await expect(panel).toHaveAttribute('data-side', 'top');
    await expect(panel).toHaveClass(/nds-sheet-content/);
    await borderWaitForEncostar(panel, 'top');
  },
};

export const Bottom: Story = {
  parameters: {
    covers: ['visual.item3'],
    docs: {
      source: {
        transform: sheetSourceWith({
          side: 'bottom',
          triggerLabel: 'Abrir painel inferior',
          title: 'Painel inferior',
          description: 'Painel mobile-style sem swipe.',
        }),
      },
      description: { story: 'Desliza de baixo — o desenho do Drawer, sem o gesto.' },
    },
  },
  render: () => buildSheetSide({
    side: 'bottom',
    triggerLabel: 'Abrir painel inferior',
    title: 'Painel inferior',
    description: 'Painel mobile-style sem swipe.',
  }),
  play: async () => {
    const panel = await waitForPortal('dialog');
    await expect(panel).toHaveAttribute('data-side', 'bottom');
    await expect(panel).toHaveClass(/nds-sheet-content/);
    await borderWaitForEncostar(panel, 'bottom');
  },
};

export const HeadingH3: Story = {
  parameters: {
    covers: ['accessibility.item4'],
    // Override de story: o nível do título não passa por control neste arquivo,
    // e o snippet do meta mostraria o painel no nível padrão — que é justamente
    // o que esta story existe para NÃO ter.
    docs: {
      source: { transform: sheetHeadingH3Source },
      description: {
        story:
          'Aberto de dentro de uma página cuja seção já está em h2, o painel pede o título em h3 para não pular nível. Trocar a tag não pode romper o aria-labelledby: o nome acessível continua saindo do mesmo elemento.',
      },
    },
  },
  render: () =>
    buildSheetSide({
      side: 'right',
      titleLevel: 3,
      triggerLabel: 'Abrir filtros',
      title: 'Filtros avançados',
      description: 'Configure os filtros para refinar os resultados.',
    }),
  play: async ({ step }) => {
    const p = await waitForPortal('dialog');

    await step('O título vira h3 sem soltar o vínculo do nome acessível', async () => {
      const id = p.getAttribute('aria-labelledby');
      await expect(id).toBeTruthy();
      const heading = document.getElementById(id!);
      await expect(heading).not.toBeNull();
      await expect(heading!.tagName).toBe('H3');
      await expect(heading!.classList.contains('nds-sheet-title')).toBe(true);
      await expect(p).toHaveAccessibleName(heading!.textContent!.trim());
    });
  },
};
