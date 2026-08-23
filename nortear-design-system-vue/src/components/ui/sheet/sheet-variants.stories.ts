import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect } from 'storybook/test';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './index';
import { Button } from '@/components/ui/button';
import { FOCUS_RULE_GUARDA, waitForPortal } from '@/lib/wait-for-portal';
import { borderWaitForEncostar } from '@shared/testing/sheet-geometry';
import {
  sheetSideDireitoSource,
  sheetSideEsquerdoSource,
  sheetSideInferiorSource,
  sheetSideSuperiorSource,
} from './sheet.source';

// As quatro direções são a única variação visual do Sheet, e todas moram no
// conteúdo (`side`), não na raiz. Cada uma nasce ABERTA e MODAL: é o estado que
// a regressão visual captura e o que o axe tem para examinar — fechado, o
// painel nem está no DOM.

const meta = {
  title: 'UI/Sheet/Variants',
  component: Sheet,
  tags: ['disclosure'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    // Painel modal aberto: as âncoras de foco da lib são `aria-hidden` E
    // focáveis, e o axe lê a combinação como armadilha de foco — que é o
    // contrário do que elas fazem. Ver o motivo completo em wait-for-portal.ts.
    a11y: { config: { rules: [FOCUS_RULE_GUARDA] } },
    docs: {
      source: { transform: sheetSideDireitoSource },
      description: {
        component:
          'Direção do painel pela prop side do conteúdo. Right é o padrão de desktop; ' +
          'left serve à navegação secundária; top e bottom ocupam altura automática.',
      },
    },
  },
  decorators: [
    () => ({
      template: '<div style="min-height: 480px; width: 100%;"><story /></div>',
    }),
  ],
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedComponents = {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Button,
};

/** Mesmo painel nas quatro direções — o que muda é `side` e o título. */
function panel(side: string, title: string) {
  return () => ({
    components: sharedComponents,
    setup: () => ({ side, title }),
    template: `
      <Sheet default-open>
        <SheetTrigger as-child>
          <Button variant="outline">Abrir filtros</Button>
        </SheetTrigger>
        <SheetContent :side="side">
          <SheetHeader>
            <SheetTitle>{{ title }}</SheetTitle>
            <SheetDescription>Configure os filtros para refinar os resultados.</SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <SheetClose as-child>
              <Button variant="outline">Cancelar</Button>
            </SheetClose>
            <Button>Aplicar filtros</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    `,
  });
}

// A asserção está escrita story a story, e não extraída para um helper: o lado
// é o ÚNICO contrato que cada uma destas quatro verifica, e ver a asserção
// dentro da story é o que torna um lado errado visível na leitura.

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
  render: panel('right', 'Painel direito'),
  play: async () => {
    const dialog = await waitForPortal('dialog');
    await expect(dialog).toHaveAttribute('data-side', 'right');
    await expect(dialog).toHaveClass(/nds-sheet-content/);
    await expect(dialog).toHaveAccessibleName();
    // O atributo prova que a prop chegou; a caixa prova que o CSS a obedeceu.
    await borderWaitForEncostar(dialog, 'right');
  },
};

export const Left: Story = {
  parameters: {
    covers: ['visual.item2'],
    docs: {
      // O lado é o assunto da story, e nenhum control o descreve: a transform
      // do meta mostraria o padrão, que é a direção oposta a esta.
      source: { transform: sheetSideEsquerdoSource },
      description: {
        story:
          'Desliza da esquerda. Mesma medida do right, do outro lado — é a direção da ' +
          'navegação secundária, que a pessoa espera encontrar onde o menu costuma ficar.',
      },
    },
  },
  render: panel('left', 'Painel esquerdo'),
  play: async () => {
    const dialog = await waitForPortal('dialog');
    await expect(dialog).toHaveAttribute('data-side', 'left');
    await expect(dialog).toHaveClass(/nds-sheet-content/);
    await expect(dialog).toHaveAccessibleName();
    await borderWaitForEncostar(dialog, 'left');
  },
};

export const Top: Story = {
  parameters: {
    docs: {
      // Idem: o `side` do conteúdo é a única diferença, e ele não vem de control.
      source: { transform: sheetSideSuperiorSource },
      description: {
        story:
          'Desliza do topo e ocupa a largura inteira, com altura definida pelo conteúdo. ' +
          'Útil para filtros horizontais e avisos ricos que não cabem num Alert.',
      },
    },
  },
  render: panel('top', 'Painel superior'),
  play: async () => {
    const dialog = await waitForPortal('dialog');
    await expect(dialog).toHaveAttribute('data-side', 'top');
    await expect(dialog).toHaveClass(/nds-sheet-content/);
    await expect(dialog).toHaveAccessibleName();
    await borderWaitForEncostar(dialog, 'top');
  },
};

export const Bottom: Story = {
  parameters: {
    covers: ['visual.item3'],
    docs: {
      // Idem: o `side` do conteúdo é a única diferença, e ele não vem de control.
      source: { transform: sheetSideInferiorSource },
      description: {
        story:
          'Desliza de baixo — o mesmo desenho do Drawer, sem o gesto de arrastar. ' +
          'Quando o gesto importa, o componente é o Drawer.',
      },
    },
  },
  render: panel('bottom', 'Painel inferior'),
  play: async () => {
    const dialog = await waitForPortal('dialog');
    await expect(dialog).toHaveAttribute('data-side', 'bottom');
    await expect(dialog).toHaveClass(/nds-sheet-content/);
    await expect(dialog).toHaveAccessibleName();
    await borderWaitForEncostar(dialog, 'bottom');
  },
};
