import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, waitFor, within } from 'storybook/test';
import { ref, onMounted, onUnmounted } from 'vue';
import { Progress } from './index';
import {
  barrasDeProgresso,
  contrastBarTrack,
  indicadorDoProgresso,
  nomeAcessivel,
  percentualDesenhado,
  progressoTrack,
} from '@shared/testing/progress-probe';
import {
  listProgressColorsSource,
  progressListSource,
  progressProcessandoServidorSource,
  progressUploadAnimadoSource,
} from './progress.source';

const meta = {
  title: 'UI/Progress/Compositions',
  component: Progress,
  tags: ['feedback'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: progressUploadAnimadoSource },
      description: {
        component:
          'Composicoes reais do Progress: upload com porcentagem animada, vários progressos numa lista, cores semânticas e processamento sem progresso mensurável.',
      },
    },
  },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AnimatedUpload: Story = {
  render: () => ({
    components: { Progress },
    setup() {
      const value = ref(0);
      let timer: ReturnType<typeof setInterval> | null = null;
      onMounted(() => {
        timer = setInterval(() => {
          value.value = value.value >= 100 ? 0 : value.value + 4;
        }, 250);
      });
      onUnmounted(() => {
        if (timer) { clearInterval(timer); timer = null; }
      });
      return { value };
    },
    template: `
      <div class="nds-stack" data-spacing="xs" style="width: 360px">
        <div class="nds-cluster nds-text-body" data-align="center" data-justify="between">
          <span class="nds-text-foreground">Enviando arquivo</span>
          <span class="nds-text-muted-foreground nds-tabular-nums" aria-live="polite">{{ value }}%</span>
        </div>
        <Progress :model-value="value" aria-label="Progresso do upload" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Progress presente com nome próprio', async () => {
      const bar = canvas.getByRole('progressbar', { name: 'Progresso do upload' });
      await expect(bar).toHaveAttribute('role', 'progressbar');
    });

    await step('O valor anunciado fica dentro da escala em toda rodada', async () => {
      // O valor muda a cada 250ms; afirmar um número seria racy. O que vale em
      // qualquer instante é o intervalo.
      const agora = Number(canvas.getByRole('progressbar').getAttribute('aria-valuenow'));
      await expect(Number.isFinite(agora)).toBe(true);
      await expect(agora >= 0 && agora <= 100).toBe(true);
    });

    await step('O texto da porcentagem usa aria-live=polite', async () => {
      // `assertive` interromperia o leitor a cada 4% — é o par Do & Don't desta
      // página.
      const live = canvasElement.querySelector('[aria-live]');
      await expect(live).toHaveAttribute('aria-live', 'polite');
    });
  },
};

export const ProgressList: Story = {
  parameters: {
    docs: {
      // Várias barras num laço: o nome acessível passa a sair do DADO, porque
      // repetir o mesmo rótulo nas três equivale a não nomear nenhuma.
      source: { transform: progressListSource },
    },
  },
  render: () => ({
    components: { Progress },
    setup() {
      const items = [
        { name: 'relatorio-final.pdf', value: 92, label: 'Progresso do upload de relatorio-final.pdf' },
        { name: 'planilha-q4.xlsx',    value: 64, label: 'Progresso do upload de planilha-q4.xlsx'    },
        { name: 'imagens.zip',         value: 28, label: 'Progresso do upload de imagens.zip'         },
      ];
      return { items };
    },
    template: `
      <ul class="nds-stack nds-m-0 nds-p-0 nds-list-none" data-spacing="md" style="width: 400px">
        <li v-for="item in items" :key="item.name" class="nds-stack" data-spacing="xs">
          <div class="nds-cluster nds-text-body" data-align="center" data-justify="between">
            <span class="nds-text-foreground nds-truncate">{{ item.name }}</span>
            <span class="nds-text-muted-foreground nds-tabular-nums">{{ item.value }}%</span>
          </div>
          <Progress :model-value="item.value" :aria-label="item.label" />
        </li>
      </ul>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('3 progressbars renderizados', async () => {
      await expect(canvas.getAllByRole('progressbar')).toHaveLength(3);
    });

    await step('Cada um com nome acessível próprio', async () => {
      const names = barrasDeProgresso(canvasElement).map(nomeAcessivel);
      await expect(names.every((n) => n !== '')).toBe(true);
      await expect(new Set(names).size).toBe(3);
    });

    await step('aria-valuenow distintos (92, 64, 28)', async () => {
      const values = canvas.getAllByRole('progressbar').map((b) => b.getAttribute('aria-valuenow'));
      await expect(values).toEqual(['92', '64', '28']);
    });

    await step('Cada barra desenha o próprio valor', async () => {
      // Três barras com o mesmo desenho e atributos diferentes é o defeito que
      // a lista existe para pegar.
      const barras = canvas.getAllByRole('progressbar');
      await waitFor(async () => {
        for (const [i, esperado] of [92, 64, 28].entries()) {
          await expect(Math.abs(percentualDesenhado(barras[i]) - esperado)).toBeLessThan(2);
        }
      });
    });
  },
};

export const CustomColor: Story = {
  parameters: {
    docs: {
      // Três medidas com significados diferentes, e a do meio SEM variante:
      // "em andamento" não é semântico, e é isso que a composição mostra.
      source: { transform: listProgressColorsSource },
    },
  },
  render: () => ({
    components: { Progress },
    template: `
      <div class="nds-stack" data-spacing="sm" style="width: 360px">
        <div class="nds-stack" data-spacing="xs">
          <div class="nds-cluster nds-text-body" data-align="center" data-justify="between">
            <span class="nds-text-foreground">Sincronização</span>
            <span class="nds-text-muted-foreground nds-tabular-nums">100%</span>
          </div>
          <Progress :model-value="100" data-variant="success" aria-label="Sincronização concluída" />
        </div>
        <div class="nds-stack" data-spacing="xs">
          <div class="nds-cluster nds-text-body" data-align="center" data-justify="between">
            <span class="nds-text-foreground">Backup</span>
            <span class="nds-text-muted-foreground nds-tabular-nums">72%</span>
          </div>
          <Progress :model-value="72" aria-label="Progresso do backup" />
        </div>
        <div class="nds-stack" data-spacing="xs">
          <div class="nds-cluster nds-text-body" data-align="center" data-justify="between">
            <span class="nds-text-foreground">Espaço usado</span>
            <span class="nds-text-muted-foreground nds-tabular-nums">92%</span>
          </div>
          <Progress :model-value="92" data-variant="destructive" aria-label="Espaço de armazenamento quase esgotado" />
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('3 progressbars, uma por cor', async () => {
      await expect(canvas.getAllByRole('progressbar')).toHaveLength(3);
    });

    await step('As três cores são realmente distintas', async () => {
      const cores = canvas
        .getAllByRole('progressbar')
        .map((raiz) => getComputedStyle(indicadorDoProgresso(raiz)).backgroundColor);
      await expect(new Set(cores).size).toBe(3);
    });

    await step('Nenhuma variante abre mão dos 3:1 contra a trilha', async () => {
      for (const raiz of canvas.getAllByRole('progressbar')) {
        await expect(contrastBarTrack(raiz)).toBeGreaterThanOrEqual(3);
      }
    });

    await step('Toda barra da lista tem nome acessível', async () => {
      for (const bar of barrasDeProgresso(canvasElement)) {
        await expect(nomeAcessivel(bar)).not.toBe('');
      }
    });
  },
};

export const IndeterminateProcessing: Story = {
  parameters: {
    docs: {
      // Sem valor mensurável não há porcentagem nem relógio: some o estado
      // reativo que a do meta ensina, e fica só o rótulo do que acontece.
      source: { transform: progressProcessandoServidorSource },
    },
  },
  render: () => ({
    components: { Progress },
    template: `
      <div class="nds-stack" data-spacing="xs" style="width: 360px">
        <div class="nds-text-body">Processando…</div>
        <Progress :model-value="null" aria-label="Processando dados do servidor" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('role=progressbar presente sem aria-valuenow', async () => {
      const bar = canvas.getByRole('progressbar', { name: 'Processando dados do servidor' });
      await expect(bar).not.toHaveAttribute('aria-valuenow');
      await expect(bar).toHaveAttribute('data-indeterminate', '');
    });

    await step('Sem inline style transform no indicator', async () => {
      const indicador = indicadorDoProgresso(canvasElement);
      await expect(indicador.getAttribute('style') ?? '').not.toContain('translateX');
    });

    await step('O traço ocupa parte da trilha, não a trilha toda', async () => {
      // Uma barra cheia leria como "100%" — o oposto do que o estado quer
      // dizer. A largura de 40% vem do CSS compartilhado. Mede-se a LARGURA, e
      // não a posição: com a animação em curso o traço está sempre em outro
      // lugar, e uma asserção de posição seria racy por construção.
      const trilha = progressoTrack(canvasElement);
      const indicador = indicadorDoProgresso(canvasElement);
      const proporcao =
        indicador.getBoundingClientRect().width / trilha.getBoundingClientRect().width;
      await expect(Math.abs(proporcao - 0.4)).toBeLessThan(0.05);
    });
  },
};
