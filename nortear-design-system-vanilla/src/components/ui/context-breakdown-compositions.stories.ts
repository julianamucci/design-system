import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect } from 'storybook/test';
import { createContextBreakdown } from './context-breakdown';
import { createContextDisplay } from './context-display';
import { createCollapsible } from './collapsible';
import { createButton } from './button';
import { contextBreakdownLabels, partsOf } from './context-breakdown.fixtures';
import { contextDisplayLabels, usageOf } from './context-display.fixtures';
import {
  contextBreakdownBesideBudgetSource,
  contextBreakdownInsideDisclosureSource,
} from './context-breakdown.source';
import { contextTotal, usedTokens } from '@shared/primitives/token-budget';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Onde a repartição mora em relação às peças vizinhas. Ela é AUTÔNOMA nos dois
// casos: fica ao lado da medição da janela sem que nenhuma das duas saiba da
// outra, e entra recolhida dentro de um bloco de expansão sem ganhar estado
// nenhum por isso.

const meta: Meta = {
  title: 'Components/Conversational/ContextBreakdown/Compositions',
  tags: ['conversational'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: contextBreakdownBesideBudgetSource },
      description: {
        component:
          'A repartição é autônoma: ela convive com a medição da janela sem que nenhuma saiba da outra, e recolher é composição, nunca recurso da peça.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const blockOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="context-breakdown"]')!;

/**
 * As duas perguntas, uma acima da outra.
 *
 * "Quanto ainda cabe" precisa de teto; "de onde veio" não precisa de teto
 * nenhum. As duas medem o MESMO consumo — vinte e cinco mil —, e é por isso que
 * elas podem dividir a tela sem parecer que discordam.
 */
export const BesideBudget: Story = {
  parameters: { covers: ['functional.item7', 'visual.item6'] },
  render: () => {
    const stack = document.createElement('div');
    stack.className = 'nds-stack nds-max-w-lg';
    stack.dataset.spacing = 'md';
    stack.append(
      createContextDisplay({
        usage: usageOf('warning'),
        labels: contextDisplayLabels(),
      }),
      createContextBreakdown({
        parts: partsOf('typical'),
        labels: contextBreakdownLabels(),
      }),
    );
    return stack;
  },
  play: async ({ canvasElement, step }) => {
    const breakdown = blockOf(canvasElement);
    const display = canvasElement.querySelector<HTMLElement>('[data-slot="context-display"]')!;

    await step('As duas medem o MESMO consumo', async () => {
      // Totais diferentes fariam parecer que elas medem coisas diferentes,
      // quando o que difere é a pergunta.
      await expect(contextTotal(partsOf('typical'))).toBe(usedTokens(usageOf('warning')));
    });

    await step('E só a vizinha fala de teto', async () => {
      // "De onde veio" se responde sem saber quanto cabe. Se um dia esta peça
      // ganhar nível ou fração de teto, é aqui que aparece.
      await expect(display.dataset.level).toBe('warning');
      await expect(breakdown.dataset.level).toBeUndefined();
      await expect(breakdown.querySelector('[data-slot="context-display-meter"]')).toBeNull();
    });

    await step('Nenhuma das duas vive dentro da outra', async () => {
      await expect(display.contains(breakdown)).toBe(false);
      await expect(breakdown.contains(display)).toBe(false);
    });
  },
};

/**
 * A repartição dentro de um bloco que expande.
 *
 * Recolher é COMPOSIÇÃO, e não recurso da peça: esconder a legenda esconderia
 * justamente o texto que dispensa a cor, e a peça deixaria de responder sem
 * clique. Quem precisa dela recolhida põe o controle por fora, onde o teclado já
 * sabe encontrá-lo.
 */
export const InsideDisclosure: Story = {
  parameters: {
    covers: ['functional.item8', 'visual.item7'],
    docs: { source: { transform: contextBreakdownInsideDisclosureSource } },
  },
  render: () => {
    const labels = contextBreakdownLabels();
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-max-w-lg';
    wrapper.appendChild(
      createCollapsible({
        trigger: createButton({ variant: 'outline', size: 'sm', label: labels.title }),
        content: createContextBreakdown({ parts: partsOf('typical'), labels }),
        defaultOpen: true,
      }),
    );
    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const breakdown = blockOf(canvasElement);
    const trigger = canvasElement.querySelector<HTMLElement>(
      '[data-slot="collapsible-trigger"]',
    )!;
    const content = canvasElement.querySelector<HTMLElement>(
      '[data-slot="collapsible-content"]',
    )!;

    await step('O controle é um botão de verdade, e ele é de fora', async () => {
      // Disclosure é botão com aria-expanded, nunca um bloco com clique
      // (regra 5 da §8 da guideline 17). O controle mora no hospedeiro.
      await expect(trigger.tagName).toBe('BUTTON');
      await expect(trigger.getAttribute('aria-expanded')).toBe('true');
      await expect(trigger.getAttribute('aria-controls')).toBe(content.id);
      await expect(breakdown.contains(trigger)).toBe(false);
    });

    await step('A repartição vive dentro do conteúdo, e não ganha estado por isso', async () => {
      await expect(content.contains(breakdown)).toBe(true);
      await expect(breakdown.hasAttribute('aria-expanded')).toBe(false);
      await expect(breakdown.querySelector('button')).toBeNull();
    });

    await step('E o texto de cada parcela continua inteiro dentro dela', async () => {
      // A legenda é o que dispensa a cor; recolhida ou não, ela continua sendo
      // a resposta assim que o bloco abre.
      const rows = [
        ...breakdown.querySelectorAll<HTMLElement>('[data-slot="context-breakdown-part"]'),
      ];
      await expect(rows).toHaveLength(partsOf('typical').length);
      for (const row of rows) {
        const name = row.querySelector<HTMLElement>('[data-slot="context-breakdown-name"]')!;
        await expect(name.textContent?.trim()).not.toBe('');
      }
    });
  },
};
