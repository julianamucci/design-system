import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { waitForPortal } from '@/lib/wait-for-portal';
import { borderWaitForEncostar } from '@shared/testing/sheet-geometry';

import { expect } from 'storybook/test';
import SheetStory from './SheetStory.svelte';
import { sheetHeadingH3Source, sheetSource } from './sheet.source';

import { useTranslation } from '@/lib/i18n';
import sheetTranslations from '@shared/content/sheet/translations.json';
import { figmaDesign } from '@shared/figma/design-links';
// As quatro direções são a única variação visual do Sheet, e todas moram no
// conteúdo (`side`). Cada uma nasce ABERTA: é o estado que a regressão visual
// captura e o que o axe tem para examinar — fechada, o painel nem está no DOM.

// Os rótulos da story de nível de cabeçalho saem do conteúdo compartilhado.
// As stories acima seguem com os literais que já tinham: reescrevê-las não é
// assunto desta entrega.
const { t } = useTranslation(sheetTranslations);
const meta: Meta = {
  title: 'Components/Overlay/Sheet/Variants',
  component: SheetStory,
  tags: ['overlay'],
  parameters: {
    design: figmaDesign('sheet'),
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para as quatro direções: cada story declara os próprios args,
      // e é deles que o snippet sai — lado, textos e o estado inicial aberto.
      source: { transform: sheetSource },
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
    const panel = await waitForPortal('dialog');
    await expect(panel).toHaveAttribute('data-side', 'right');
    await expect(panel).toHaveClass(/nds-sheet-content/);
    await expect(panel).toHaveAccessibleName();
    // O atributo prova que a prop chegou; a caixa prova que o CSS a obedeceu.
    // O painel ENTRA deslocado pela própria largura, e o helper espera o
    // transform assentar antes de medir.
    await borderWaitForEncostar(panel, 'right');
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
    const panel = await waitForPortal('dialog');
    await expect(panel).toHaveAttribute('data-side', 'left');
    await expect(panel).toHaveClass(/nds-sheet-content/);
    await expect(panel).toHaveAccessibleName();
    await borderWaitForEncostar(panel, 'left');
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
    const panel = await waitForPortal('dialog');
    await expect(panel).toHaveAttribute('data-side', 'top');
    await expect(panel).toHaveClass(/nds-sheet-content/);
    await expect(panel).toHaveAccessibleName();
    await borderWaitForEncostar(panel, 'top');
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
    const panel = await waitForPortal('dialog');
    await expect(panel).toHaveAttribute('data-side', 'bottom');
    await expect(panel).toHaveClass(/nds-sheet-content/);
    await expect(panel).toHaveAccessibleName();
    await borderWaitForEncostar(panel, 'bottom');
  },
};

export const HeadingH3: Story = {
  args: {
    open: true,
    titleLevel: 3,
    triggerLabel: t('demonstration.labels.trigger'),
    title: t('demonstration.labels.title'),
    description: t('demonstration.labels.description'),
    actionLabel: t('demonstration.labels.apply'),
    cancelLabel: t('demonstration.labels.cancel'),
  },
  parameters: {
    covers: ['accessibility.item4'],
    docs: {
      source: { transform: sheetHeadingH3Source },
      description: {
        story:
          'O painel abre de dentro de uma página cuja seção já está em h2, então o título pede h3. Trocar a tag do cabeçalho não pode romper o aria-labelledby que dá nome ao painel.',
      },
    },
  },
  play: async ({ step }) => {
    const p = await waitForPortal('dialog');

    await step('O título sai em h3 e o painel continua nomeado por ele', async () => {
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
