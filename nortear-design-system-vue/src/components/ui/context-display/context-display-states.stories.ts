import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect } from 'storybook/test';
import { ContextDisplay } from './index';
import {
  contextDisplayLabels,
  useContextDisplayLabels,
  usageOf,
  type ContextDisplayCase,
} from './context-display.fixtures';
import {
  contextDisplayAtThresholdSource,
  contextDisplayEveryLevelSource,
  contextDisplayOverLimitSource,
  contextDisplayUnboundedSource,
} from './context-display.source';
import {
  BUDGET_LEVELS,
  budgetLevel,
  isOverLimit,
  usedTokens,
} from '@shared/primitives/token-budget';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// O que a medição diz conforme quanto já foi gasto — e o caso em que não se sabe
// quanto cabe, que é o único que não desenha medidor nenhum.

const meta: Meta = {
  title: 'Primitives/Conversational/ContextDisplay/States',
  tags: ['conversational'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: contextDisplayEveryLevelSource },
      description: {
        component:
          'O nível decide a cor do medidor e a palavra ao lado — e as duas trocam juntas, porque cor sozinha não descreve estado.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const mount = (name: ContextDisplayCase) => ({
  components: { ContextDisplay },
  setup() {
    return {
      usage: usageOf(name),
      labels: useContextDisplayLabels(),
    };
  },
  template: `<ContextDisplay
    :usage="usage"
    :labels="labels"
  />`,
});

const blockOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="context-display"]')!;

/**
 * Os três níveis, um abaixo do outro.
 *
 * A lista sai de `BUDGET_LEVELS`, e não de três linhas escritas à mão: nível
 * novo no primitivo compartilhado entra nesta story sozinho.
 */
export const AllLevels: Story = {
  parameters: {
    covers: ['functional.item3', 'accessibility.item1', 'visual.item3'],
  },
  render: () => ({
    components: { ContextDisplay },
    setup() {
      return {
        levels: BUDGET_LEVELS,
        usageOf,
        labels: useContextDisplayLabels(),
      };
    },
    template: `<div class="nds-stack nds-max-w-lg" data-spacing="md">
      <ContextDisplay
        v-for="level in levels"
        :key="level"
        :usage="usageOf(level)"
        :labels="labels"
      />
    </div>`,
  }),
  play: async ({ canvasElement, step }) => {
    const blocks = [
      ...canvasElement.querySelectorAll<HTMLElement>('[data-slot="context-display"]'),
    ];
    const labels = contextDisplayLabels();

    await step('Há um bloco por nível, na ordem do primitivo', async () => {
      await expect(blocks).toHaveLength(BUDGET_LEVELS.length);
      await expect(blocks.map((block) => block.dataset.level)).toEqual([...BUDGET_LEVELS]);
    });

    await step('Cada um traz a PALAVRA daquele nível', async () => {
      // Cor sozinha não descreve estado (WCAG 1.4.1), e aqui a cor do medidor é
      // a única diferença visual entre os três.
      for (const [index, level] of BUDGET_LEVELS.entries()) {
        const badge = blocks[index]!.querySelector<HTMLElement>(
          '[data-slot="context-display-level"]',
        )!;
        await expect(badge.textContent).toBe(labels.level[level]);
      }
    });

    await step('E as três palavras são DIFERENTES entre si', async () => {
      // Duas palavras iguais em níveis diferentes fariam a cor voltar a ser a
      // única pista, que é o defeito que a palavra existe para consertar.
      const words = blocks.map(
        (block) =>
          block.querySelector<HTMLElement>('[data-slot="context-display-level"]')!.textContent,
      );
      await expect(new Set(words).size).toBe(BUDGET_LEVELS.length);
    });

    await step('A palavra aparece inclusive com folga', async () => {
      // Uma peça que só falasse quando a notícia é ruim deixaria a boa notícia
      // indistinguível de uma medição que não chegou.
      await expect(blocks[0]!.dataset.level).toBe('normal');
      await expect(
        blocks[0]!.querySelector('[data-slot="context-display-level"]'),
      ).not.toBeNull();
    });
  },
};

/**
 * A borda do limiar, que é onde a regra se prova.
 *
 * Três quartos EM PONTO já são aviso. Testar o meio do intervalo deixaria a
 * comparação livre para virar `>` sem nada reprovar.
 */
export const AtThreshold: Story = {
  parameters: {
    covers: ['functional.item4'],
    docs: { source: { transform: contextDisplayAtThresholdSource } },
  },
  render: () => mount('threshold'),
  play: async ({ canvasElement, step }) => {
    const block = blockOf(canvasElement);
    const usage = usageOf('threshold');

    await step('A medição está exatamente em três quartos', async () => {
      await expect(usedTokens(usage) / usage.limit!).toBe(0.75);
    });

    await step('E o nível JÁ é o de aviso, porque a comparação é exata', async () => {
      await expect(budgetLevel(usage)).toBe('warning');
      await expect(block.dataset.level).toBe('warning');
      const value = block.querySelector<HTMLElement>('[data-slot="context-display-value"]')!;
      await expect(value.textContent).toBe('75%');
    });
  },
};

export const OverLimit: Story = {
  parameters: {
    covers: ['functional.item5', 'visual.item5'],
    docs: { source: { transform: contextDisplayOverLimitSource } },
  },
  render: () => mount('over'),
  play: async ({ canvasElement, step }) => {
    const block = blockOf(canvasElement);
    const usage = usageOf('over');

    await step('O consumo passou do teto', async () => {
      await expect(isOverLimit(usage)).toBe(true);
    });

    await step('O medidor para no cheio e o número trava em cem por cento', async () => {
      // O desenho não tem para onde ir: um anel não dá mais que uma volta. Quem
      // precisa saber que passou pergunta ao primitivo, não ao desenho.
      const value = block.querySelector<HTMLElement>('[data-slot="context-display-value"]')!;
      await expect(value.textContent).toBe('100%');
      const meter = block.querySelector<HTMLElement>('[data-slot="context-display-meter"]')!;
      await expect(meter.style.getPropertyValue('--nds-context-used')).toBe('100');
    });

    await step('E o nível continua sendo o mais apertado', async () => {
      await expect(block.dataset.level).toBe('critical');
    });
  },
};

export const Unbounded: Story = {
  parameters: {
    covers: ['functional.item2', 'accessibility.item6', 'visual.item4'],
    docs: { source: { transform: contextDisplayUnboundedSource } },
  },
  render: () => mount('unbounded'),
  play: async ({ canvasElement, step }) => {
    const block = blockOf(canvasElement);
    const labels = contextDisplayLabels();
    const usage = usageOf('unbounded');

    await step('Sem teto NÃO se desenha medidor', async () => {
      // Um anel vazio lê como zero por cento, que é o oposto de "não se sabe
      // quanto cabe" (decisão 5 da folha).
      await expect(block.querySelector('[data-slot="context-display-meter"]')).toBeNull();
    });

    await step('E não há palavra de nível, porque não há nível', async () => {
      await expect(block.dataset.level).toBeUndefined();
      await expect(block.querySelector('[data-slot="context-display-level"]')).toBeNull();
    });

    await step('O número passa a ser a CONTAGEM, com a unidade', async () => {
      const value = block.querySelector<HTMLElement>('[data-slot="context-display-value"]')!;
      await expect(value.textContent).toBe(`${usedTokens(usage).toLocaleString()} ${labels.unit}`);
      await expect(value.textContent).not.toContain('%');
    });

    await step('E o detalhe diz que o teto é desconhecido', async () => {
      const detail = block.querySelector<HTMLElement>('[data-slot="context-display-detail"]')!;
      await expect(detail.textContent).toBe(labels.unbounded);
    });
  },
};
