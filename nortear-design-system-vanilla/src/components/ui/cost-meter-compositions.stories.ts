import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect } from 'storybook/test';
import { createCostMeter } from './cost-meter';
import { createContextDisplay } from './context-display';
import { createAgentStatus } from './agent-status';
import { amountOf, budgetOf, costMeterLabels } from './cost-meter.fixtures';
import { contextDisplayLabels } from './context-display.fixtures';
import { agentStatusLabels } from './agent-status.fixtures';
import {
  costMeterSourceAfterRun,
  costMeterSourceBesideContext,
} from './cost-meter.source';
import type { TokenUsage } from '@shared/primitives/chat-protocol';
import { budgetLevel, spentFraction, usedFraction } from '@shared/primitives/token-budget';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Onde o custo mora em relação às peças vizinhas. Ele é AUTÔNOMO nos dois
// casos: fica ao lado da medição da janela sem que nenhuma das duas saiba da
// outra, e fecha a linha de estado de uma execução sem virar propriedade dela
// (§4.2 da guideline 17).

const meta: Meta = {
  title: 'Components/Conversational/CostMeter/Compositions',
  tags: ['conversational'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: costMeterSourceBesideContext },
      description: {
        component:
          'O custo é autônomo: convive com a medição da janela e com a linha de estado da execução sem que nenhuma saiba da outra, e sem virar propriedade de quem o hospeda.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const lineOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="cost-meter"]')!;

/**
 * Uma janela gasta na MESMA fração do exemplo de aviso do custo.
 *
 * Vinte e seis mil oitocentos e oitenta de trinta e dois mil são exatamente
 * oitenta e quatro centésimos — o mesmo que oitenta e quatro centavos de um
 * dólar. É esse pareamento que faz a story provar o que ela existe para provar:
 * o limiar vem do mesmo lugar, então a palavra é a mesma.
 */
const MATCHING_USAGE: TokenUsage = { input: 20_000, output: 6_880, limit: 32_000 };

/**
 * As duas medições da mesma execução, uma acima da outra.
 *
 * Uma mede consumo contra uma janela, a outra mede dinheiro contra um
 * orçamento. São grandezas diferentes e nada obrigaria três quartos a
 * significar "aviso" nas duas — mas elas dividem a tela e a palavra, e é por
 * isso que o limiar vem do primitivo compartilhado.
 */
export const BesideContext: Story = {
  parameters: { covers: ['functional.item7', 'visual.item6'] },
  render: () => {
    const stack = document.createElement('div');
    stack.className = 'nds-stack nds-max-w-lg';
    stack.dataset.spacing = 'md';
    stack.append(
      createContextDisplay({
        usage: MATCHING_USAGE,
        form: 'bar',
        labels: contextDisplayLabels(),
      }),
      createCostMeter({
        amount: amountOf('warning'),
        budget: budgetOf('warning'),
        labels: costMeterLabels(),
      }),
    );
    return stack;
  },
  play: async ({ canvasElement, step }) => {
    const cost = lineOf(canvasElement);
    const display = canvasElement.querySelector<HTMLElement>('[data-slot="context-display"]')!;

    await step('As duas estão na MESMA fração, em grandezas diferentes', async () => {
      await expect(usedFraction(MATCHING_USAGE)).toBe(spentFraction(0.84, 1));
    });

    await step('E por isso desenham a mesma palavra de nível', async () => {
      // O limiar vem do mesmo lugar. Dois limiares fariam "perto do teto"
      // significar uma coisa acima e outra abaixo na mesma tela.
      await expect(cost.dataset.level).toBe(budgetLevel(MATCHING_USAGE));
      await expect(display.dataset.level).toBe(cost.dataset.level);
    });

    await step('Nenhuma das duas vive dentro da outra', async () => {
      await expect(display.contains(cost)).toBe(false);
      await expect(cost.contains(display)).toBe(false);
    });
  },
};

/**
 * O custo no fim de uma execução.
 *
 * A linha de estado diz que terminou; o custo diz quanto isso saiu. Nenhuma das
 * duas sabe da outra — a peça se encaixa sem virar propriedade de quem a
 * hospeda, que é o teste de §4.2 da guideline 17.
 */
export const AfterRun: Story = {
  parameters: {
    covers: ['functional.item8', 'visual.item7'],
    docs: { source: { transform: costMeterSourceAfterRun } },
  },
  render: () => {
    const stack = document.createElement('div');
    stack.className = 'nds-stack nds-max-w-lg';
    stack.dataset.spacing = 'sm';
    stack.append(
      createAgentStatus({ status: 'complete', labels: agentStatusLabels() }),
      createCostMeter({
        amount: amountOf('normal'),
        budget: budgetOf('normal'),
        labels: costMeterLabels(),
      }),
    );
    return stack;
  },
  play: async ({ canvasElement, step }) => {
    const cost = lineOf(canvasElement);
    const status = canvasElement.querySelector<HTMLElement>('[data-slot="agent-status"]')!;

    await step('As duas linhas convivem sem que nenhuma contenha a outra', async () => {
      await expect(status.contains(cost)).toBe(false);
      await expect(cost.contains(status)).toBe(false);
    });

    await step('E o custo não ganha estado nenhum por estar ali', async () => {
      // A peça que se encaixa é peça autônoma: se fizesse sentido só depois de
      // uma execução, ela seria propriedade da linha de estado.
      await expect(cost.hasAttribute('aria-live')).toBe(false);
      await expect(cost.querySelector('button')).toBeNull();
      await expect(cost.dataset.level).toBe('normal');
    });
  },
};
