import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { NDS_SHEET, type SheetSide } from './sheet';
import { NdsButton } from './button';
import { waitForPortal } from '@/lib/wait-for-portal';
import { esperarEncostarNaBorda } from '@shared/testing/sheet-geometry';
import { useTranslation } from '@/lib/i18n';
import sheetTranslations from '@shared/content/sheet/translations.json';

const { t } = useTranslation(sheetTranslations as Record<string, unknown>);

// As quatro direções são a única variação visual do Sheet, e todas moram no
// conteúdo (`side`), não na raiz. Cada uma nasce ABERTA: é o estado que a
// regressão visual precisa capturar, e é nele que o axe tem o que examinar —
// fechado, o painel nem está no DOM.

const meta: Meta = {
  title: 'UI/Sheet/Variants',
  tags: ['disclosure'],
  decorators: [moduleMetadata({ imports: [...NDS_SHEET, NdsButton] })],
  parameters: {
    layout: 'centered',
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
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

/** Mesmo painel nas quatro direções — o que muda é `side` e o rótulo do título. */
function painel(side: SheetSide, tituloKey: string) {
  return () => ({
    props: {
      side,
      tituloPainel: t(`demonstration.labels.${tituloKey}`),
      descricaoPainel: t('demonstration.labels.description'),
      rotuloGatilho: t('demonstration.labels.trigger'),
      rotuloCancelar: t('demonstration.labels.cancel'),
      rotuloAplicar: t('demonstration.labels.apply'),
    },
    template: `
      <nds-sheet [defaultOpen]="true">
        <button ndsSheetTrigger ndsButton variant="outline">{{ rotuloGatilho }}</button>

        <ng-template ndsSheetContent [side]="side">
          <div ndsSheetHeader>
            <h2 ndsSheetTitle>{{ tituloPainel }}</h2>
            <p ndsSheetDescription>{{ descricaoPainel }}</p>
          </div>

          <div ndsSheetFooter>
            <button ndsSheetClose ndsButton variant="outline">{{ rotuloCancelar }}</button>
            <button ndsButton>{{ rotuloAplicar }}</button>
          </div>
        </ng-template>
      </nds-sheet>
    `,
  });
}

// A asserção de `data-side` está escrita story a story, e não extraída para um
// helper: o lado é o ÚNICO contrato que cada uma destas quatro verifica, e sob
// JIT o componente renderiza no default — `data-side` viria sempre "right" e as
// quatro passariam iguais (armadilha 1 do CLAUDE.md deste stack). Ver a asserção
// dentro da story é o que torna esse defeito visível na leitura.

export const Right: Story = {
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
  render: painel('right', 'rightLabel'),
  play: async ({ step }) => {
    await step('O painel abre encostado na borda direita', async () => {
      const painelEl = await waitForPortal('dialog');
      await expect(painelEl).toHaveAttribute('data-side', 'right');
      await expect(painelEl).toHaveClass(/nds-sheet-content/);
      await expect(painelEl).toHaveAccessibleName();
      // O atributo prova que a prop chegou; a caixa prova que o CSS a obedeceu.
      await esperarEncostarNaBorda(painelEl, 'right');
    });
  },
};

export const Left: Story = {
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
  render: painel('left', 'leftLabel'),
  play: async ({ step }) => {
    await step('O painel abre encostado na borda esquerda', async () => {
      const painelEl = await waitForPortal('dialog');
      await expect(painelEl).toHaveAttribute('data-side', 'left');
      await expect(painelEl).toHaveClass(/nds-sheet-content/);
      await expect(painelEl).toHaveAccessibleName();
      // O atributo prova que a prop chegou; a caixa prova que o CSS a obedeceu.
      await esperarEncostarNaBorda(painelEl, 'left');
    });
  },
};

export const Top: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Desliza do topo e ocupa a largura inteira, com altura definida pelo conteúdo. ' +
          'Útil para filtros horizontais e avisos ricos que não cabem num Alert.',
      },
    },
  },
  render: painel('top', 'topLabel'),
  play: async ({ step }) => {
    await step('O painel abre encostado no topo', async () => {
      const painelEl = await waitForPortal('dialog');
      await expect(painelEl).toHaveAttribute('data-side', 'top');
      await expect(painelEl).toHaveClass(/nds-sheet-content/);
      await expect(painelEl).toHaveAccessibleName();
      // O atributo prova que a prop chegou; a caixa prova que o CSS a obedeceu.
      await esperarEncostarNaBorda(painelEl, 'top');
    });
  },
};

export const Bottom: Story = {
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
  render: painel('bottom', 'bottomLabel'),
  play: async ({ step }) => {
    await step('O painel abre encostado na base', async () => {
      const painelEl = await waitForPortal('dialog');
      await expect(painelEl).toHaveAttribute('data-side', 'bottom');
      await expect(painelEl).toHaveClass(/nds-sheet-content/);
      await expect(painelEl).toHaveAccessibleName();
      // O atributo prova que a prop chegou; a caixa prova que o CSS a obedeceu.
      await esperarEncostarNaBorda(painelEl, 'bottom');
    });
  },
};
