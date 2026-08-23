import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { within, expect, waitFor } from 'storybook/test';
import TooltipStory from './TooltipStory.svelte';
import { balaoDe } from './tooltip.fixtures';
import { tooltipSource } from './tooltip.source';

// As três variantes que o conteúdo compartilhado descreve — texto curto, texto
// com atalho e texto longo. Todas nascem abertas: é o único jeito de a regressão
// visual capturar o balão, que só existe no DOM enquanto está aberto.

/** Luminância relativa da WCAG a partir de um `rgb(r, g, b)` computado. */
function luminancia(cor: string): number {
  const [r, g, b] = (cor.match(/[\d.]+/g) ?? ['0', '0', '0']).slice(0, 3).map((v) => {
    const canal = Number(v) / 255;
    return canal <= 0.03928 ? canal / 12.92 : ((canal + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Razão de contraste WCAG entre duas cores computadas. */
function contraste(a: string, b: string): number {
  const [light, escuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (light + 0.05) / (escuro + 0.05);
}

const meta: Meta = {
  title: 'UI/Tooltip/Variants',
  component: TooltipStory,
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo: a variante, o texto e o
      // rótulo do gatilho já vêm dos args de cada uma.
      source: { transform: tooltipSource },
      description: {
        component:
          'Default é texto curto. Com atalho acrescenta a tecla em <kbd>, que a folha compartilhada reconhece e usa para encurtar o respiro à direita. Texto longo quebra dentro do limite de largura do balão — passou disso, o caso é de Popover.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const baseArgs = {
  defaultOpen: true,
  delayDuration: 0,
  side: 'top' as const,
  align: 'center' as const,
  sideOffset: 4,
};

export const Default: Story = {
  args: {
    ...baseArgs,
    variant: 'default',
    triggerLabel: 'Salvar',
    ariaLabel: 'Salvar',
    contentText: 'Salvar item',
  },
  parameters: { covers: ['visual.item1', 'accessibility.item2'] },
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole('button', { name: /salvar/i });

    await step('Nasce aberto, com o texto curto no balão', async () => {
      await waitFor(async () => {
        await expect(balaoDe(trigger)).not.toBeNull();
      });
      const balao = balaoDe(trigger)!;
      await expect(balao).toHaveClass(/nds-tooltip-content/);
      await expect(balao.textContent).toContain('Salvar item');
    });

    await step('O texto do balão passa dos 4.5:1 exigidos', async () => {
      // Medido no elemento real, não na tabela de tokens: é a combinação
      // aplicada (fundo --primary, texto --primary-foreground) que a pessoa lê,
      // e ela precisa valer em qualquer tema da toolbar.
      const estilo = getComputedStyle(balaoDe(trigger)!);
      await expect(contraste(estilo.color, estilo.backgroundColor)).toBeGreaterThanOrEqual(4.5);
    });
  },
};

export const WithShortcut: Story = {
  name: 'With shortcut (kbd)',
  args: {
    ...baseArgs,
    variant: 'withShortcut',
    triggerLabel: 'Salvar',
    ariaLabel: 'Salvar',
    contentText: 'Salvar',
  },
  parameters: { covers: ['visual.item2'] },
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole('button', { name: /salvar/i });

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
  name: 'Long text (width limit)',
  args: {
    ...baseArgs,
    variant: 'longText',
    triggerLabel: 'Compartilhar',
    ariaLabel: 'Compartilhar link',
    contentText:
      'Compartilhe o link público desta página com qualquer pessoa — o conteúdo pode ser visualizado sem login.',
  },
  parameters: { covers: ['visual.item4'] },
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole('button', { name: /compartilhar/i });

    await step('O texto quebra dentro do limite de largura do balão', async () => {
      await waitFor(async () => {
        await expect(balaoDe(trigger)).not.toBeNull();
      });
      const balao = balaoDe(trigger)!;
      await expect(balao.textContent).toContain('link público');
      // O limite vem da folha compartilhada; medir a largura real prova que o
      // texto respeitou o teto em vez de esticar o balão pela viewport.
      const limit = parseFloat(getComputedStyle(balao).maxWidth);
      await expect(limit).toBeGreaterThan(0);
      await expect(balao.getBoundingClientRect().width).toBeLessThanOrEqual(limit + 1);
    });
  },
};
