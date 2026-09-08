import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, waitFor } from 'storybook/test';
import { NDS_TOOLTIP } from './tooltip';
import { balaoDe, SAVE_ICON } from './tooltip.fixtures';
import { NdsButton } from './button';
import {
  tooltipDefaultSource,
  tooltipLongTextSource,
  tooltipWithShortcutSource,
} from './tooltip.source';

import { figmaDesign } from '@shared/figma/design-links';
// As três variantes que o conteúdo compartilhado descreve — texto curto, texto
// com atalho e texto longo. Todas nascem abertas: é o único jeito de a regressão
// visual capturar o balão, que só existe no DOM enquanto está aberto.
//
// Os quatro lados de posicionamento moram em -compositions, e não aqui: é onde
// react e vanilla já os publicavam, e o grupo da barra lateral sai do ARQUIVO.

/** Luminância relativa da WCAG a partir de um `rgb(r, g, b)` computado. */
function luminancia(cor: string): number {
  const [r, g, b] = (cor.match(/[\d.]+/g) ?? ['0', '0', '0']).slice(0, 3).map((v) => {
    const channel = Number(v) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Razão de contraste WCAG entre duas cores computadas. */
function contraste(a: string, b: string): number {
  const [light, escuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (light + 0.05) / (escuro + 0.05);
}

const meta: Meta = {
  title: 'Components/Overlay/Tooltip/Variants',
  tags: ['overlay'],
  decorators: [moduleMetadata({ imports: [...NDS_TOOLTIP, NdsButton] })],
  parameters: {
    design: figmaDesign('tooltip'),
    layout: 'centered',
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Default é texto curto. Com atalho acrescenta a tecla em <kbd>, que a folha ' +
          'compartilhada reconhece e usa para encurtar o respiro à direita. Texto longo ' +
          'quebra dentro do limite de largura do balão — passou disso, o caso é de Popover.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: { covers: ['visual.item1', 'accessibility.item2'], docs: { source: { transform: tooltipDefaultSource } } },
  render: () => ({
    template: `
      <div ndsTooltipProvider [delay]="0" class="nds-p-8">
        <span ndsTooltip [defaultOpen]="true">
          <button ndsTooltipTrigger ndsButton variant="ghost" size="icon" aria-label="Salvar">
            ${SAVE_ICON}
          </button>
          <ng-template ndsTooltipContent>Salvar</ng-template>
        </span>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole('button');

    await step('Nasce aberto, com o texto curto no balão', async () => {
      await waitFor(async () => {
        await expect(balaoDe(trigger)).not.toBeNull();
      });
      const balao = balaoDe(trigger)!;
      await expect(balao).toHaveClass(/nds-tooltip-content/);
      await expect(balao.textContent?.trim()).toBe('Salvar');
    });

    await step('O texto do balão passa dos 4.5:1 exigidos', async () => {
      const balao = balaoDe(trigger)!;
      // Medido no elemento real, não na tabela de tokens: é a combinação
      // aplicada (fundo --primary, texto --primary-foreground) que a pessoa lê,
      // e ela precisa valer em qualquer tema da toolbar.
      const computedStyle = getComputedStyle(balao);
      await expect(contraste(computedStyle.color, computedStyle.backgroundColor)).toBeGreaterThanOrEqual(4.5);
    });
  },
};

export const WithShortcut: Story = {
  parameters: { covers: ['visual.item2'], docs: { source: { transform: tooltipWithShortcutSource } } },
  render: () => ({
    template: `
      <div ndsTooltipProvider [delay]="0" class="nds-p-8">
        <span ndsTooltip [defaultOpen]="true">
          <button ndsTooltipTrigger ndsButton variant="ghost" size="icon" aria-label="Salvar">
            ${SAVE_ICON}
          </button>
          <ng-template ndsTooltipContent
            ><span>Salvar</span
            ><kbd class="nds-kbd" data-slot="kbd">Ctrl</kbd
            ><kbd class="nds-kbd" data-slot="kbd">S</kbd
          ></ng-template>
        </span>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole('button');

    await step('O atalho vai em <kbd>, não solto no texto', async () => {
      await waitFor(async () => {
        await expect(balaoDe(trigger)).not.toBeNull();
      });
      const teclas = balaoDe(trigger)!.querySelectorAll('kbd');
      await expect(teclas.length).toBe(2);
      await expect(teclas[0].textContent).toBe('Ctrl');
    });

    await step('A folha compartilhada reconhece a tecla e encurta o respiro', async () => {
      // `.nds-tooltip-content:has([data-slot="kbd"])` só casa se o data-slot
      // estiver na tecla — sem ele a regra existe e não pinta nada.
      const balao = balaoDe(trigger)!;
      await expect(balao.querySelector('[data-slot="kbd"]')).not.toBeNull();
      await expect(getComputedStyle(balao).paddingInlineEnd).not.toBe(
        getComputedStyle(balao).paddingInlineStart,
      );
    });
  },
};

export const LongText: Story = {
  parameters: { covers: ['visual.item4'], docs: { source: { transform: tooltipLongTextSource } } },
  render: () => ({
    template: `
      <div ndsTooltipProvider [delay]="0" class="nds-p-8">
        <span ndsTooltip [defaultOpen]="true">
          <button ndsTooltipTrigger ndsButton variant="outline">Compartilhar</button>
          <ng-template ndsTooltipContent side="bottom"
            >Cria um link público de leitura — qualquer pessoa com o link vê o conteúdo</ng-template
          >
        </span>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole('button');

    await step('O texto quebra dentro do limite de largura do balão', async () => {
      await waitFor(async () => {
        await expect(balaoDe(trigger)).not.toBeNull();
      });
      const balao = balaoDe(trigger)!;
      const limit = parseFloat(getComputedStyle(balao).maxWidth);
      // O limite vem da folha compartilhada; medir a largura real prova que o
      // texto respeitou o teto em vez de esticar o balão pela viewport.
      await expect(limit).toBeGreaterThan(0);
      await expect(balao.getBoundingClientRect().width).toBeLessThanOrEqual(limit + 1);
    });
  },
};
