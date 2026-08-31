import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect } from 'storybook/test';
import { CostMeter } from './index';
import CostMeterBesideContextStory from './CostMeterBesideContextStory.svelte';
import CostMeterAfterRunStory from './CostMeterAfterRunStory.svelte';
import { costMeterLabels, fractionOf } from './cost-meter.fixtures';
import {
  costMeterAfterRunSource,
  costMeterBesideContextSource,
} from './cost-meter.source';
import type { TokenUsage } from '@shared/primitives/chat-protocol';
import { budgetLevel, usedFraction } from '@shared/primitives/token-budget';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Onde o custo mora em relação às peças vizinhas. Ele é AUTÔNOMO nos dois casos:
// fica ao lado da medição da janela sem que nenhuma das duas saiba da outra, e
// fecha a linha de estado de uma execução sem virar propriedade dela (§4.2 da
// guideline 17).

const meta: Meta<typeof CostMeter> = {
  title: 'Primitives/Conversational/CostMeter/Compositions',
  component: CostMeter,
  tags: ['conversational'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: costMeterBesideContextSource },
      description: {
        component:
          'O custo é autônomo: convive com a medição da janela e com a linha de estado da execução sem que nenhuma saiba da outra, e sem virar propriedade de quem o hospeda.',
      },
    },
  },
};

export default meta;

/**
 * As composições montam o andaime, e não a peça.
 *
 * Elas decidem sozinhas a quantia e o teto, então não recebem `amount` nem
 * `budget` — e o tipo tem de sair do invólucro para dizer isso.
 */
type BesideContextStory = StoryObj<typeof CostMeterBesideContextStory>;
type AfterRunStory = StoryObj<typeof CostMeterAfterRunStory>;

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
 * Uma mede consumo contra uma janela, a outra mede dinheiro contra um orçamento.
 * São grandezas diferentes e nada obrigaria três quartos a significar "aviso"
 * nas duas — mas elas dividem a tela e a palavra, e é por isso que o limiar vem
 * do primitivo compartilhado.
 */
export const BesideContext: BesideContextStory = {
  parameters: { covers: ['functional.item7', 'visual.item6'] },
  render: () => ({
    Component: CostMeterBesideContextStory,
    props: { usage: MATCHING_USAGE, labels: costMeterLabels() },
  }),
  play: async ({ canvasElement, step }) => {
    const cost = lineOf(canvasElement);
    const display = canvasElement.querySelector<HTMLElement>('[data-slot="context-display"]')!;

    await step('As duas estão na MESMA fração, em grandezas diferentes', async () => {
      await expect(usedFraction(MATCHING_USAGE)).toBe(fractionOf('warning'));
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
export const AfterRun: AfterRunStory = {
  parameters: {
    covers: ['functional.item8', 'visual.item7'],
    docs: { source: { transform: costMeterAfterRunSource } },
  },
  render: () => ({
    Component: CostMeterAfterRunStory,
    props: { labels: costMeterLabels() },
  }),
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
