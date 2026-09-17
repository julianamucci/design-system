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
import { waitForPortal } from '@/lib/wait-for-portal';
import { borderWaitForEncostar } from '@shared/testing/sheet-geometry';
import {
  sheetHeadingH3Source,
  sheetSideDireitoSource,
  sheetSideEsquerdoSource,
  sheetSideInferiorSource,
  sheetSideSuperiorSource,
} from './sheet.source';
import sheetTranslations from '@shared/content/sheet/translations.json';

import { figmaDesign } from '@shared/figma/design-links';

/**
 * Rótulos: saem do MESMO `translations.json` que a docs page lê, onde cada
 * chave existe nos três idiomas. A story é fixture e fica presa a pt-BR de
 * propósito — quem resolve o idioma de quem lê é a docs page, e uma play que
 * dependesse do seletor procuraria um nome diferente a cada rodada.
 */
const L = sheetTranslations['pt-BR'].demonstration.labels;

// As quatro direções são a única variação visual do Sheet, e todas moram no
// conteúdo (`side`), não na raiz. Cada uma nasce ABERTA e MODAL: é o estado que
// a regressão visual captura e o que o axe tem para examinar — fechado, o
// painel nem está no DOM.

const meta = {
  title: 'Components/Overlay/Sheet/Variants',
  component: Sheet,
  tags: ['overlay'],
  parameters: {
    design: figmaDesign('sheet'),
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    // SEM `FOCUS_RULE_GUARDA`, e isto é medido, não esquecimento. As três
    // stories do Sheet desligavam `aria-hidden-focus` citando as âncoras de
    // foco da reka — `<span data-reka-focus-guard tabindex="0">` nas duas
    // pontas do `body` —, e nenhuma outra stack precisava do mesmo. O motivo é
    // que essas âncoras NÃO existem aqui: na reka instalada, `useFocusGuards`
    // é chamado só por `ComboboxContentImpl`, `MenuContentImpl`,
    // `PopoverContentImpl` e `SelectContentImpl`. O `DialogContentImpl` — que
    // é por onde passam Dialog, AlertDialog e este Sheet — nunca as monta.
    // Bate com o que a árvore mostra: quem desliga a regra nesta stack é a
    // família de menu/select, e as stories de Dialog e AlertDialog terminam
    // com painel modal aberto sem desligar nada (o addon-a11y varre
    // `document.body` inteiro e roda com `test: 'error'`). Herdamos o
    // parâmetro de uma família que não é a nossa, e regra desligada à toa é
    // portão sem dentes: se um `aria-hidden` focável aparecer aqui, tem de
    // reprovar.
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
      template: '<div class="nds-min-h-80 nds-w-full"><story /></div>',
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
//
// As quatro afirmam `aria-modal` E o nome acessível ESPERADO. O
// `toHaveAccessibleName()` sem argumento que estava aqui passa com qualquer
// nome — inclusive com o do gatilho, que é o defeito real desta família
// (painel que se nomeia pelo botão que o abriu). O nome vem da mesma chave que
// o título renderiza, então trocar um sem o outro reprova.

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
  render: panel('right', L.rightLabel),
  play: async () => {
    const dialog = await waitForPortal('dialog');
    await expect(dialog).toHaveAttribute('data-side', 'right');
    await expect(dialog).toHaveClass(/nds-sheet-content/);
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expect(dialog).toHaveAccessibleName(L.rightLabel);
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
  render: panel('left', L.leftLabel),
  play: async () => {
    const dialog = await waitForPortal('dialog');
    await expect(dialog).toHaveAttribute('data-side', 'left');
    await expect(dialog).toHaveClass(/nds-sheet-content/);
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expect(dialog).toHaveAccessibleName(L.leftLabel);
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
  render: panel('top', L.topLabel),
  play: async () => {
    const dialog = await waitForPortal('dialog');
    await expect(dialog).toHaveAttribute('data-side', 'top');
    await expect(dialog).toHaveClass(/nds-sheet-content/);
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expect(dialog).toHaveAccessibleName(L.topLabel);
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
  render: panel('bottom', L.bottomLabel),
  play: async () => {
    const dialog = await waitForPortal('dialog');
    await expect(dialog).toHaveAttribute('data-side', 'bottom');
    await expect(dialog).toHaveClass(/nds-sheet-content/);
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expect(dialog).toHaveAccessibleName(L.bottomLabel);
    await borderWaitForEncostar(dialog, 'bottom');
  },
};

// O nível do cabeçalho do título é escolha de quem monta a PÁGINA, e não do
// componente: o painel entra numa hierarquia que já existe. A capacidade está
// no primitivo desde 2026-09-08 e nenhuma story a exercitava — o que significa
// que nada impedia uma regressão de voltar a cravar o nível.
export const HeadingH3: Story = {
  parameters: {
    covers: ['accessibility.item4', 'accessibility.item6'],
    docs: {
      // O nível É o assunto: a transform do meta mostra o padrão, que é
      // justamente o que esta story não usa.
      source: { transform: sheetHeadingH3Source },
      description: {
        story:
          'Painel aberto de dentro de uma página cuja seção já está em h2: o título entra como h3 e continua a hierarquia em vez de repeti-la. Trocar a tag não pode romper o aria-labelledby que dá nome ao painel.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <Sheet default-open>
        <SheetTrigger as-child>
          <Button variant="outline">${L.trigger}</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle as="h3">${L.title}</SheetTitle>
            <SheetDescription>${L.description}</SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <SheetClose as-child>
              <Button variant="outline">${L.cancel}</Button>
            </SheetClose>
            <Button>${L.apply}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    `,
  }),
  play: async ({ step }) => {
    const p = await waitForPortal('dialog');

    await step('O título vira h3 sem soltar o nome acessível do painel', async () => {
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
