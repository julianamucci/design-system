import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, within } from 'storybook/test';
import { CostMeter } from './index';
import {
  costAmount,
  costMeterLabels,
  costView,
  useCostMeterLabels,
  useCostView,
} from './cost-meter.fixtures';
import { costMeterSource } from './cost-meter.source';
import { fractionLevel, fractionPercent } from '@shared/primitives/token-budget';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import CostMeterDocs from '@/components/docs/CostMeterDocs.vue';

/**
 * Os dois eixos desta peça: o que se gastou, e contra que teto.
 *
 * Os controls mexem em NÚMEROS, e não em quantias escritas — é o andaime que
 * escreve o dinheiro, porque quem consome é que conhece o idioma e a moeda. Um
 * control de texto aqui ensinaria o contrário do contrato.
 *
 * Teto em zero é o control mais interessante: zero não é teto, é a ausência
 * dele, e é assim que se vê a peça sem medidor, sem nível e sem por cento.
 */
type PlaygroundArgs = {
  spent: number;
  budget: number;
};

const meta: Meta<PlaygroundArgs> = {
  title: 'Components/Conversational/CostMeter',
  tags: ['autodocs', 'conversational'],
  parameters: {
    layout: 'padded',
    actions: { disable: true },
    docs: {
      page: withAutoDocsTab(CostMeterDocs),
      source: { transform: costMeterSource },
    },
  },
  argTypes: {
    spent: {
      control: { type: 'number', min: 0, step: 0.01 },
      description: 'Quanto a execução custou. O andaime escreve a quantia antes de passá-la.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '0' } },
    },
    budget: {
      control: { type: 'number', min: 0, step: 0.25 },
      description:
        'O teto declarado. Em zero não há teto: a peça fica com a quantia e diz que o teto não foi declarado.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '0' } },
    },
  },
  args: {
    spent: 0.84,
    budget: 1,
  },
};

export default meta;
type Story = StoryObj<PlaygroundArgs>;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1', 'functional.item2',
      'accessibility.item1', 'accessibility.item2',
      'accessibility.item3', 'accessibility.item4',
      'visual.item1',
    ],
  },
  render: (args) => ({
    components: { CostMeter },
    setup() {
      // O dinheiro e os rótulos saem de composables, então o render passa por um
      // `setup`. O gasto entra por getter: os controls trocam com a story
      // montada, e um objeto lido uma vez congelaria a foto.
      return {
        labels: useCostMeterLabels(),
        view: useCostView(() => ({ spent: args.spent, budget: args.budget })),
      };
    },
    template: `<CostMeter
      :amount="view.amount"
      :budget="view.budget"
      :labels="labels"
    />`,
  }),
  play: async ({ canvasElement, step, args }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="cost-meter"]')!;
    const labels = costMeterLabels();
    const { budget } = costView({ spent: args.spent, budget: args.budget });

    const amountEl = root.querySelector<HTMLElement>('[data-slot="cost-meter-amount"]')!;
    const detail = root.querySelector<HTMLElement>('[data-slot="cost-meter-detail"]')!;

    await step('A linha NÃO é região viva, e nada nela se reanuncia', async () => {
      // O custo sobe a cada turno, e anunciá-lo a cada mudança corta a leitura
      // da resposta que está sendo gerada ao lado (decisão 1 da folha).
      await expect(root.hasAttribute('aria-live')).toBe(false);
      await expect(root.hasAttribute('role')).toBe(false);
      await expect(root.querySelector('[aria-live]')).toBeNull();
      await expect(root.querySelector('[role="status"], [role="alert"], [role="log"]')).toBeNull();
    });

    await step('A quantia sai exatamente como chegou, sem a peça formatar nada', async () => {
      // É a decisão que separa esta peça das irmãs: o dinheiro é TEXTO, e a
      // peça nunca escolhe símbolo, separador nem casas decimais.
      await expect(amountEl.textContent).toBe(costAmount(args.spent));
    });

    await step('O número tem nome, e o nome não aparece na tela', async () => {
      // "US$ 0,84" sozinho não diz de quê (decisão 4 da folha).
      const title = root.querySelector<HTMLElement>('[data-slot="cost-meter-title"]')!;
      await expect(title.textContent).toBe(labels.title);
      await expect(title).toHaveClass('nds-sr-only');
    });

    if (budget) {
      const percent = fractionPercent(budget.fraction);
      const level = fractionLevel(budget.fraction);
      const bar = root.querySelector<HTMLElement>('[data-slot="cost-meter-meter"]')!;

      await step('O detalhe mantém a fração EM TEXTO, ao lado do teto', async () => {
        // Sem este texto a barra viraria a única portadora da fração, e o
        // limiar de contraste de gráfico passaria a valer.
        await expect(detail.textContent).toBe(`${percent}% ${labels.of} ${budget.amount}`);
      });

      await step('A barra desenha o MESMO inteiro que o detalhe diz', async () => {
        // Uma barra que discordasse do número ao lado seriam duas respostas
        // para uma pergunta só.
        await expect(bar.style.getPropertyValue('--nds-cost-spent')).toBe(String(percent));
      });

      await step('E a barra fica FORA do que é lido, sem papel e sem valor', async () => {
        // Um segundo portador da mesma fração a faria ser lida duas vezes, uma
        // delas como controle (decisões 1 e 2 da folha).
        await expect(bar.getAttribute('aria-hidden')).toBe('true');
        await expect(bar.hasAttribute('role')).toBe(false);
        await expect(bar.hasAttribute('aria-valuenow')).toBe(false);
        await expect(bar.textContent).toBe('');
      });

      await step('O nível chega em PALAVRA, e a cor apenas acompanha', async () => {
        // Cor sozinha não descreve estado (WCAG 1.4.1, decisão 3 da folha).
        const canvas = within(canvasElement);
        await expect(root.dataset.level).toBe(level);
        await expect(canvas.getByText(labels.level[level])).toBeInTheDocument();
      });
      return;
    }

    await step('Sem teto declarado, o detalhe diz isso e não sobra medidor', async () => {
      await expect(detail.textContent).toBe(labels.unbounded);
      await expect(root.querySelector('[data-slot="cost-meter-meter"]')).toBeNull();
      await expect(root.dataset.level).toBeUndefined();
    });
  },
};
