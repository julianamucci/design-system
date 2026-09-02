import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect, waitFor } from 'storybook/test';
import { createTooltip } from './tooltip';
import { balaoDe, clearPortal, wrap } from './tooltip.fixtures';
import { tooltipSource, tooltipSourceWith } from './tooltip.source';
import { createButton } from './button';

// As três variantes que o conteúdo compartilhado descreve — texto curto, texto
// com atalho e texto longo. Todas nascem abertas: é o único jeito de a regressão
// visual capturar o balão, que só existe no DOM enquanto está aberto.

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
  tags: ['overlay'],
  title: 'Primitives/Overlay/Tooltip/Variants',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      source: { transform: tooltipSource },
      description: {
        component:
          'Default é texto curto. Com atalho traz a tecla junto do texto. Texto longo quebra dentro do limite de largura do balão — passou disso, o caso é de Popover. NOTA: a factory recebe o conteúdo como texto, então o atalho não vai em <kbd> separado.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: {
    covers: ['visual.item1', 'accessibility.item2'],
    docs: { source: { transform: tooltipSourceWith({ content: 'Salvar' }) } },
  },
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Salvar', 'aria-label': 'Salvar' });
    const el = createTooltip({ trigger, content: 'Salvar' });
    queueMicrotask(() => trigger.focus());
    return wrap(el);
  },
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole('button', { name: /salvar/i });

    await step('Nasce aberto, com o texto curto no balão', async () => {
      trigger.blur();
      trigger.focus();
      await waitFor(async () => {
        await expect(balaoDe(trigger)).not.toBeNull();
      });
      const balao = balaoDe(trigger)!;
      await expect(balao).toHaveClass(/nds-tooltip-content/);
      await expect(balao.textContent?.trim()).toBe('Salvar');
    });

    await step('O texto do balão passa dos 4.5:1 exigidos', async () => {
      // Medido no elemento real, não na tabela de tokens: é a combinação
      // aplicada (fundo --primary, texto --primary-foreground) que a pessoa lê,
      // e ela precisa valer em qualquer tema da toolbar.
      const computedStyle = getComputedStyle(balaoDe(trigger)!);
      await expect(contraste(computedStyle.color, computedStyle.backgroundColor)).toBeGreaterThanOrEqual(4.5);
    });

    await step('Cleanup', async () => { clearPortal(); });
  },
};

export const WithShortcut: Story = {
  parameters: { covers: ['visual.item2'] },
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Salvar', 'aria-label': 'Salvar' });
    const el = createTooltip({ trigger, content: 'Salvar (Ctrl+S)' });
    queueMicrotask(() => trigger.focus());
    return wrap(el);
  },
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole('button', { name: /salvar/i });

    await step('O balão traz o texto e o atalho', async () => {
      trigger.blur();
      trigger.focus();
      await waitFor(async () => {
        await expect(balaoDe(trigger)).not.toBeNull();
      });
      const balao = balaoDe(trigger)!;
      await expect(balao.textContent).toContain('Salvar');
      await expect(balao.textContent).toMatch(/Ctrl\+S/);
    });

    await step('O atalho não vira nome do botão — ele já tem o seu', async () => {
      // O `aria-label` continua curto; o atalho é reforço visual, e duplicá-lo
      // no nome acessível faria o leitor de tela soletrar a tecla toda vez.
      await expect(trigger).toHaveAttribute('aria-label', 'Salvar');
    });

    await step('Cleanup', async () => { clearPortal(); });
  },
};

export const LongText: Story = {
  parameters: {
    covers: ['visual.item4'],
    docs: {
      source: {
        transform: tooltipSourceWith({
          triggerLabel: 'Mais informação',
          content:
            'Esta ação salva todas as alterações localmente e sincroniza com o servidor quando houver conexão.',
        }),
      },
    },
  },
  render: () => {
    const trigger = createButton({
      variant: 'outline',
      label: 'Mais informação',
      'aria-label': 'Mais informação',
    });
    const el = createTooltip({
      trigger,
      content:
        'Esta ação salva todas as alterações localmente e sincroniza com o servidor quando houver conexão.',
    });
    queueMicrotask(() => trigger.focus());
    return wrap(el);
  },
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole('button', { name: /mais informação/i });

    await step('O texto quebra dentro do limite de largura do balão', async () => {
      trigger.blur();
      trigger.focus();
      await waitFor(async () => {
        await expect(balaoDe(trigger)).not.toBeNull();
      });
      const balao = balaoDe(trigger)!;
      await expect(balao.textContent).toMatch(/sincroniza/);
      // O limite vem da folha compartilhada; medir a largura real prova que o
      // texto respeitou o teto em vez de esticar o balão pela viewport. A classe
      // utilitária que ficava aqui saiu do projeto e não pintava nada.
      const limit = parseFloat(getComputedStyle(balao).maxWidth);
      await expect(limit).toBeGreaterThan(0);
      await expect(balao.getBoundingClientRect().width).toBeLessThanOrEqual(limit + 1);
    });

    await step('Cleanup', async () => { clearPortal(); });
  },
};
