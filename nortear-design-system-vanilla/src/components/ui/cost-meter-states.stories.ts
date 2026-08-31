import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, within } from 'storybook/test';
import { createCostMeter } from './cost-meter';
import {
  COST_METER_SPEND,
  amountOf,
  budgetOf,
  costAmount,
  costMeterLabels,
  type CostMeterCase,
} from './cost-meter.fixtures';
import {
  costMeterEveryCaseSource,
  costMeterSourceAllLevels,
  costMeterSourceAtThreshold,
  costMeterSourceOverBudget,
  costMeterSourceUnbounded,
} from './cost-meter.source';
import {
  BUDGET_WARNING_AT,
  fractionLevel,
  fractionPercent,
  spentFraction,
} from '@shared/primitives/token-budget';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// O que o custo diz nas bordas: o gasto que encosta no limiar em ponto, o que
// passa do teto, e a execução para a qual ninguém declarou orçamento. Nas três
// o desenho sozinho falharia — a barra fica igual em duas delas, e some na
// terceira —, e é o texto ao lado que responde.

const meta: Meta = {
  title: 'Primitives/Conversational/CostMeter/States',
  tags: ['conversational'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: costMeterEveryCaseSource },
      description: {
        component:
          'Nas bordas o desenho sozinho falha: a barra fica cheia tanto no teto quanto acima dele, e some quando não há teto. O que responde nas três é o texto ao lado.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const lineOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="cost-meter"]')!;

const textOf = (line: HTMLElement, slot: string) =>
  line.querySelector<HTMLElement>(`[data-slot="cost-meter-${slot}"]`)?.textContent;

/** A peça daquele exemplo, com a quantia e o teto já escritos. */
const meterOf = (name: CostMeterCase) =>
  createCostMeter({
    amount: amountOf(name),
    budget: budgetOf(name),
    labels: costMeterLabels(),
  });

/** A fração daquele exemplo, pela mesma conta que a peça lê. */
const fractionOf = (name: CostMeterCase) =>
  spentFraction(COST_METER_SPEND[name].spent, COST_METER_SPEND[name].budget);

/**
 * Os três níveis, do mais folgado ao mais apertado.
 *
 * A cor do medidor é a única diferença visual entre os três, e é por isso que a
 * palavra do nível está sempre na linha: cor sozinha não descreve nada.
 */
export const AllLevels: Story = {
  parameters: {
    covers: ['functional.item3', 'accessibility.item5', 'visual.item2'],
    docs: { source: { transform: costMeterSourceAllLevels } },
  },
  render: () => {
    const stack = document.createElement('div');
    stack.className = 'nds-stack nds-max-w-lg';
    stack.dataset.spacing = 'md';
    for (const name of ['normal', 'warning', 'critical'] as const) {
      stack.appendChild(meterOf(name));
    }
    return stack;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const labels = costMeterLabels();
    const lines = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="cost-meter"]')];
    const names = ['normal', 'warning', 'critical'] as const;

    await step('Cada gasto traz a palavra do SEU nível', async () => {
      for (const [i, name] of names.entries()) {
        const level = fractionLevel(fractionOf(name)!);
        await expect(lines[i]!.dataset.level).toBe(level);
        await expect(canvas.getByText(labels.level[level])).toBeInTheDocument();
      }
    });

    await step('E a fração de cada um está em TEXTO, e não só no desenho', async () => {
      // É este texto que dispensa a barra de carregar o valor — sem ele, o
      // comprimento do trilho seria a única pista da fração.
      for (const [i, name] of names.entries()) {
        const percent = fractionPercent(fractionOf(name)!);
        await expect(textOf(lines[i]!, 'detail')).toContain(`${percent}%`);
      }
    });

    await step('As três palavras são diferentes entre si', async () => {
      // Se duas coincidissem, o nível deixaria de decidir o que fazer e a cor
      // voltaria a ser a única diferença.
      const words = names.map((name) => labels.level[fractionLevel(fractionOf(name)!)]);
      await expect(new Set(words).size).toBe(3);
    });
  },
};

/**
 * Três quartos do teto EM PONTO.
 *
 * A borda do limiar, e o único gasto dos exemplos cujo valor não pode mudar sem
 * mudar o que a story prova: três quartos JÁ é aviso, e não folga.
 */
export const AtThreshold: Story = {
  parameters: {
    covers: ['functional.item4', 'visual.item3'],
    docs: { source: { transform: costMeterSourceAtThreshold } },
  },
  render: () => meterOf('threshold'),
  play: async ({ canvasElement, step }) => {
    const line = lineOf(canvasElement);
    const fraction = fractionOf('threshold');

    await step('O gasto é exatamente o limiar, e não um vizinho dele', async () => {
      await expect(fraction).toBe(BUDGET_WARNING_AT);
    });

    await step('E o limiar já vale: é aviso, e não folga', async () => {
      // Comparação frouxa faria esta borda cair do outro lado, e as duas peças
      // de medição passariam a discordar sobre o mesmo número.
      await expect(line.dataset.level).toBe('warning');
      await expect(textOf(line, 'detail')).toContain('75%');
    });
  },
};

/**
 * O gasto passou do teto.
 *
 * A barra para no cheio e o por cento trava em cem — o desenho não tem para
 * onde ir. A quantia escrita continua dizendo o valor de verdade, e é ela que
 * mostra o quanto passou.
 */
export const OverBudget: Story = {
  parameters: {
    covers: ['functional.item5', 'visual.item4'],
    docs: { source: { transform: costMeterSourceOverBudget } },
  },
  render: () => meterOf('over'),
  play: async ({ canvasElement, step }) => {
    const line = lineOf(canvasElement);
    const spend = COST_METER_SPEND.over;

    await step('O gasto passou do teto de verdade', async () => {
      await expect(spend.spent).toBeGreaterThan(spend.budget!);
    });

    await step('A fração para em uma volta, e o por cento trava em cem', async () => {
      await expect(fractionOf('over')).toBe(1);
      await expect(textOf(line, 'detail')).toContain('100%');
      const bar = line.querySelector<HTMLElement>('[data-slot="cost-meter-meter"]')!;
      await expect(bar.style.getPropertyValue('--nds-cost-spent')).toBe('100');
    });

    await step('Mas a quantia escrita continua dizendo o valor de verdade', async () => {
      // O recorte é do DESENHO, e não do dinheiro: quem precisa saber o quanto
      // passou lê a quantia, que nunca foi truncada.
      await expect(textOf(line, 'amount')).toBe(costAmount(spend.spent));
      await expect(textOf(line, 'amount')).not.toBe(costAmount(spend.budget!));
    });
  },
};

/**
 * Nenhum teto declarado.
 *
 * O caso comum, e o que não pode parecer zero: sem orçamento não há fração, e
 * um trilho vazio leria como "não gastou nada".
 */
export const Unbounded: Story = {
  parameters: {
    covers: ['functional.item6', 'accessibility.item6', 'visual.item5'],
    docs: { source: { transform: costMeterSourceUnbounded } },
  },
  render: () => meterOf('unbounded'),
  play: async ({ canvasElement, step }) => {
    const line = lineOf(canvasElement);
    const labels = costMeterLabels();

    await step('A conta responde que não há fração, e não que ela é zero', async () => {
      await expect(fractionOf('unbounded')).toBeNull();
    });

    await step('Então não sobra medidor, nem etiqueta, nem atributo de nível', async () => {
      await expect(line.querySelector('[data-slot="cost-meter-meter"]')).toBeNull();
      await expect(line.querySelector('[data-slot="cost-meter-level"]')).toBeNull();
      await expect(line.dataset.level).toBeUndefined();
    });

    await step('E a quantia continua na tela, com a notícia do que falta', async () => {
      // A ausência vira informação em vez de parecer medição pela metade.
      await expect(textOf(line, 'amount')).toBe(amountOf('unbounded'));
      await expect(textOf(line, 'detail')).toBe(labels.unbounded);
      await expect(line.textContent).not.toContain('%');
    });
  },
};
