import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { waitForPortal } from '@/lib/wait-for-portal';
import { esperarEncostarNaBorda } from '@shared/testing/sheet-geometry';

import { expect } from 'storybook/test';
import SheetStory from './SheetStory.svelte';

// As quatro direções são a única variação visual do Sheet, e todas moram no
// conteúdo (`side`). Cada uma nasce ABERTA: é o estado que a regressão visual
// captura e o que o axe tem para examinar — fechada, o painel nem está no DOM.

const meta: Meta = {
  title: 'UI/Sheet/Variants',
  component: SheetStory,
  tags: ['disclosure'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Direção do painel pela prop side do conteúdo. Right é o padrão de desktop; ' +
          'left serve à navegação secundária; top e bottom ocupam altura automática.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// As asserções estão escritas story a story, e não extraídas para um helper: o
// lado é o ÚNICO contrato que cada uma destas quatro verifica, e ver a asserção
// dentro da story é o que torna um lado errado visível na leitura. Antes elas
// chamavam um `expectOpen(side)` compartilhado — e a play ficava sem nenhum
// `expect` visível, que é exatamente o que o auditor apontou.

export const Right: Story = {
  args: {
    open: true,
    side: 'right',
    triggerLabel: 'Abrir filtros',
    title: 'Painel direito',
    description: 'Configure os filtros para refinar os resultados.',
    actionLabel: 'Aplicar filtros',
    cancelLabel: 'Cancelar',
  },
  parameters: {
    covers: ['accessibility.item1', 'accessibility.item2', 'visual.item1'],
    docs: {
      description: {
        story:
          'Padrão para desktop — desliza da direita e ocupa 75% da largura, com teto de 24rem. ' +
          'Caso canônico para filtros e configurações secundárias.',
      },
    },
  },
  play: async () => {
    const painel = await waitForPortal('dialog');
    await expect(painel).toHaveAttribute('data-side', 'right');
    await expect(painel).toHaveClass(/nds-sheet-content/);
    await expect(painel).toHaveAccessibleName();
    // O atributo prova que a prop chegou; a caixa prova que o CSS a obedeceu.
    // O painel ENTRA deslocado pela própria largura, e o helper espera o
    // transform assentar antes de medir.
    await esperarEncostarNaBorda(painel, 'right');
  },
};

export const Left: Story = {
  args: {
    open: true,
    side: 'left',
    triggerLabel: 'Abrir menu',
    title: 'Painel esquerdo',
    description: 'Acesse seções adicionais sem trocar de página.',
    actionLabel: 'Aplicar filtros',
    cancelLabel: 'Cancelar',
  },
  parameters: {
    covers: ['visual.item2'],
    docs: {
      description: {
        story:
          'Desliza da esquerda. Mesma medida do right, do outro lado — é a direção da ' +
          'navegação secundária, que a pessoa espera encontrar onde o menu costuma ficar.',
      },
    },
  },
  play: async () => {
    const painel = await waitForPortal('dialog');
    await expect(painel).toHaveAttribute('data-side', 'left');
    await expect(painel).toHaveClass(/nds-sheet-content/);
    await expect(painel).toHaveAccessibleName();
    await esperarEncostarNaBorda(painel, 'left');
  },
};

export const Top: Story = {
  args: {
    open: true,
    side: 'top',
    triggerLabel: 'Abrir notificações',
    title: 'Painel superior',
    description: 'Veja atualizações importantes da sua conta.',
    actionLabel: 'Ver todas',
    cancelLabel: 'Fechar',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Desliza do topo e ocupa a largura inteira, com altura definida pelo conteúdo. ' +
          'Útil para filtros horizontais e avisos ricos que não cabem num Alert.',
      },
    },
  },
  play: async () => {
    const painel = await waitForPortal('dialog');
    await expect(painel).toHaveAttribute('data-side', 'top');
    await expect(painel).toHaveClass(/nds-sheet-content/);
    await expect(painel).toHaveAccessibleName();
    await esperarEncostarNaBorda(painel, 'top');
  },
};

export const Bottom: Story = {
  args: {
    open: true,
    side: 'bottom',
    triggerLabel: 'Abrir painel',
    title: 'Painel inferior',
    description: 'Equivalente ao Drawer, sem o gesto de arrastar.',
    actionLabel: 'Salvar',
    cancelLabel: 'Cancelar',
  },
  parameters: {
    covers: ['visual.item3'],
    docs: {
      description: {
        story:
          'Desliza de baixo — o mesmo desenho do Drawer, sem o gesto de arrastar. ' +
          'Quando o gesto importa, o componente é o Drawer.',
      },
    },
  },
  play: async () => {
    const painel = await waitForPortal('dialog');
    await expect(painel).toHaveAttribute('data-side', 'bottom');
    await expect(painel).toHaveClass(/nds-sheet-content/);
    await expect(painel).toHaveAccessibleName();
    await esperarEncostarNaBorda(painel, 'bottom');
  },
};
