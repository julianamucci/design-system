import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, waitFor, within } from 'storybook/test';
import { Progress } from './index';
import {
  animacaoDoIndicador,
  indicadorDoProgresso,
  percentualDesenhado,
} from '@shared/testing/progress-probe';

const meta = {
  title: 'UI/Progress/States',
  component: Progress,
  tags: ['feedback'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Estados derivados do valor: Default (0), Loading (parcial), Complete (100) e Indeterminate (sem valor, com o traço em ciclo).',
      },
    },
  },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: { covers: ['functional.item1', 'visual.item1'] },
  render: () => ({
    components: { Progress },
    template: `
      <div style="width: 360px">
        <Progress :model-value="0" aria-label="Progresso do upload" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('value=0 anuncia zero e não desenha preenchimento', async () => {
      await expect(canvas.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
      await waitFor(async () => {
        await expect(percentualDesenhado(canvasElement)).toBeLessThan(1);
      });
    });

    await step('Zero não é o mesmo que indeterminate', async () => {
      // Sem esta linha, um bug que trocasse 0 por null passaria: as duas telas
      // são idênticas, mas só uma delas informa o progresso ao leitor.
      await expect(canvas.getByRole('progressbar')).not.toHaveAttribute('data-indeterminate');
    });
  },
};

export const Loading: Story = {
  parameters: { covers: ['functional.item2', 'visual.item2'] },
  render: () => ({
    components: { Progress },
    template: `
      <div class="nds-stack" data-spacing="xs" style="width: 360px">
        <div class="nds-cluster nds-text-body" data-align="center" data-justify="between">
          <span class="nds-text-foreground">Carregando dados</span>
          <span class="nds-text-muted-foreground nds-tabular-nums" aria-live="polite">50%</span>
        </div>
        <Progress :model-value="50" aria-label="Progresso do carregamento" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('value=50 preenche metade da trilha', async () => {
      await expect(canvas.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
      await waitFor(async () => {
        await expect(Math.abs(percentualDesenhado(canvasElement) - 50)).toBeLessThan(2);
      });
    });

    await step('O texto ao lado repete o mesmo número', async () => {
      const bar = canvas.getByRole('progressbar');
      const live = canvasElement.querySelector('[aria-live="polite"]');
      await expect(live?.textContent).toBe(`${bar.getAttribute('aria-valuenow')}%`);
    });
  },
};

export const Complete: Story = {
  parameters: { covers: ['functional.item3', 'visual.item3'] },
  render: () => ({
    components: { Progress },
    template: `
      <div class="nds-stack" data-spacing="xs" style="width: 360px">
        <div class="nds-cluster nds-text-body" data-align="center" data-justify="between">
          <span class="nds-text-foreground">Concluído</span>
          <span class="nds-text-muted-foreground nds-tabular-nums">100%</span>
        </div>
        <Progress :model-value="100" aria-label="Operação concluída" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('value=100 preenche a trilha inteira', async () => {
      await expect(canvas.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
      await waitFor(async () => {
        await expect(Math.abs(percentualDesenhado(canvasElement) - 100)).toBeLessThan(2);
      });
    });

    await step('A conclusão é um estado próprio no DOM', async () => {
      // `data-state` é o gancho de quem quer trocar cor ou remover a barra ao
      // fim — sem ele, o consumidor teria que comparar value com max.
      await expect(canvas.getByRole('progressbar')).toHaveAttribute('data-state', 'complete');
    });
  },
};

export const Indeterminate: Story = {
  parameters: { covers: ['functional.item4', 'visual.item4'] },
  render: () => ({
    components: { Progress },
    template: `
      <div class="nds-stack" data-spacing="xs" style="width: 360px">
        <div class="nds-text-body">Processando…</div>
        <Progress :model-value="null" aria-label="Processando dados" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Sem valor, aria-valuenow some e o nome permanece', async () => {
      // Um `aria-valuenow` fixo em 0 mentiria: diria "zero por cento" quando a
      // verdade é "não sei quanto falta".
      const bar = canvas.getByRole('progressbar', { name: 'Processando dados' });
      await expect(bar).not.toHaveAttribute('aria-valuenow');
      await expect(bar).toHaveAttribute('data-indeterminate', '');
    });

    await step('O traço corre de verdade', async () => {
      // Medir POSIÇÃO no meio de uma animação infinita é racy por construção —
      // o traço está sempre em outro lugar. Afirmar a existência da animação,
      // pelo nome do keyframes do design system, é o que dá para provar sem
      // sorte. Foi assim que se descobriu que não havia animação nenhuma.
      await waitFor(async () => {
        await expect(animacaoDoIndicador(canvasElement)).toBe('nds-progress-indeterminate');
      });
    });

    await step('O traço é o do design system, não o de um homônimo', async () => {
      // Discriminador do defeito que estava vivo: um segundo
      // `@keyframes nds-progress-indeterminate` morava em `utilities.css`, o
      // último import da folha, e vencia calado — mesmo NOME, outro conteúdo.
      // Afirmar o nome da animação não separa os dois; o efeito separa. O ciclo
      // do design system desloca `margin-inline-start` e deixa `transform` em
      // `none`; o homônimo animava `transform`, e aqui apareceria uma matriz.
      await expect(
        getComputedStyle(indicadorDoProgresso(canvasElement)).transform,
      ).toBe('none');
    });
  },
};
