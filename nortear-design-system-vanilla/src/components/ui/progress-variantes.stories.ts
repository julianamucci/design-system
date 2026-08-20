import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect, waitFor } from 'storybook/test';
import { createProgress } from './progress';
import {
  progressSource,
  progressSourceCom,
  progressSourceLista,
  progressSourceRotulo,
} from './progress.source';
import {
  barrasDeProgresso,
  contrasteBarraTrilha,
  indicadorDoProgresso,
  nomeAcessivel,
  percentualDesenhado,
} from '@shared/testing/progress-probe';

const meta: Meta = {
  tags: ['feedback'],
  title: 'UI/Progress/Variants',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      source: { transform: progressSource },
      description: {
        component:
          'As formas de uso: valor conhecido, valor com rótulo e cor semântica. ' +
          'Divergência de API desta stack: a factory não expõe subcomponentes ' +
          '`ProgressLabel`/`ProgressValue`/`ProgressTrack` — rótulo e valor são ' +
          'compostos com DOM nativo acima da barra.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Determinate ─────────────────────────────────────────────────────────────

export const Determinate: Story = {
  parameters: { covers: ['accessibility.item2'] },
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-w-cap-md';
    const bar = createProgress({ value: 42, 'aria-label': 'Progresso do upload' });
    wrap.appendChild(bar);
    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O valor conhecido é anunciado e desenhado', async () => {
      await expect(canvas.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '42');
      await waitFor(async () => {
        await expect(Math.abs(percentualDesenhado(canvasElement) - 42)).toBeLessThan(2);
      });
    });

    await step('Indicador e trilha se distinguem com pelo menos 3:1', async () => {
      // WCAG 1.4.11: a barra só informa se for possível ver onde ela termina.
      await expect(contrasteBarraTrilha(canvasElement)).toBeGreaterThanOrEqual(3);
    });
  },
};

// ─── Indeterminate ───────────────────────────────────────────────────────────

export const Indeterminate: Story = {
  parameters: {
    // Override de story: `value: null` é o assunto, e o snippet do meta parte
    // de um valor conhecido.
    docs: {
      source: {
        transform: progressSourceCom({ value: null, 'aria-label': 'Processando…' }),
      },
    },
  },
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-w-cap-md';
    const bar = createProgress({ value: null, 'aria-label': 'Processando…' });
    wrap.appendChild(bar);
    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Valor desconhecido não vira valor zero', async () => {
      const bar = canvas.getByRole('progressbar', { name: 'Processando…' });
      await expect(bar).not.toHaveAttribute('aria-valuenow');
      await expect(bar).toHaveAttribute('data-indeterminate', '');
    });

    await step('Sem valor, --value não é escrita no indicador', async () => {
      // Uma custom property em 0 esconderia a barra fora da vista, e o CSS do
      // estado indeterminado não teria o que animar.
      const indicador = indicadorDoProgresso(canvasElement);
      await expect(indicador.style.getPropertyValue('--value')).toBe('');
    });
  },
};

// ─── With Label ──────────────────────────────────────────────────────────────

export const WithLabel: Story = {
  parameters: {
    covers: ['accessibility.item5'],
    // Override de story: rótulo e valor visíveis são compostos acima da barra —
    // outra FORMA de snippet, não outra opção da fábrica.
    docs: {
      source: {
        transform: progressSourceRotulo({
          value: 42,
          label: 'Enviando arquivo',
          'aria-label': 'Enviando arquivo',
        }),
      },
    },
  },
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-stack nds-w-cap-md';
    wrap.dataset.spacing = 'xs';

    const row = document.createElement('div');
    row.className = 'nds-cluster nds-text-body';
    row.dataset.justify = 'between';

    const label = document.createElement('span');
    label.className = 'nds-text-foreground';
    label.textContent = 'Enviando arquivo';

    const value = document.createElement('span');
    value.className = 'nds-text-muted-foreground nds-tabular-nums';
    value.setAttribute('aria-live', 'polite');
    value.textContent = '42%';

    row.append(label, value);

    const bar = createProgress({ value: 42, 'aria-label': 'Enviando arquivo' });

    wrap.append(row, bar);
    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Label e value visíveis acima da barra', async () => {
      await expect(canvas.getByText('Enviando arquivo')).toBeVisible();
      await expect(canvas.getByText('42%')).toBeVisible();
    });

    await step('O valor visível repete o valor anunciado', async () => {
      const bar = canvas.getByRole('progressbar');
      await expect(canvas.getByText('42%').textContent).toBe(
        `${bar.getAttribute('aria-valuenow')}%`,
      );
    });

    await step('Toda barra da tela tem nome acessível', async () => {
      for (const bar of barrasDeProgresso(canvasElement)) {
        await expect(nomeAcessivel(bar)).not.toBe('');
      }
    });
  },
};

// ─── Cor semântica ───────────────────────────────────────────────────────────

export const SemanticColor: Story = {
  parameters: {
    // Override de story: são duas barras, e `variant` é o assunto de cada uma.
    docs: {
      source: {
        transform: progressSourceLista([
          { value: 100, variant: 'success', 'aria-label': 'Sincronização concluída' },
          {
            value: 92,
            variant: 'destructive',
            'aria-label': 'Espaço de armazenamento quase esgotado',
          },
        ]),
      },
    },
  },
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-stack nds-w-cap-md';
    wrap.dataset.spacing = 'sm';

    const ok = createProgress({
      value: 100,
      variant: 'success',
      'aria-label': 'Sincronização concluída',
    });

    const critico = createProgress({
      value: 92,
      variant: 'destructive',
      'aria-label': 'Espaço de armazenamento quase esgotado',
    });

    wrap.append(ok, critico);
    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Cada variante pinta a barra de uma cor diferente', async () => {
      const [ok, critico] = canvas.getAllByRole('progressbar');
      const corDe = (raiz: HTMLElement) =>
        getComputedStyle(indicadorDoProgresso(raiz)).backgroundColor;
      await expect(corDe(ok)).not.toBe(corDe(critico));
    });

    await step('As duas variantes mantêm 3:1 contra a trilha', async () => {
      // O contraste não pode depender de qual variante alguém escolheu — é o
      // motivo de a trilha continuar neutra em vez de acompanhar a cor.
      for (const raiz of canvas.getAllByRole('progressbar')) {
        await expect(contrasteBarraTrilha(raiz)).toBeGreaterThanOrEqual(3);
      }
    });

    await step('A cor sai do atributo, não de uma classe morta', async () => {
      const [ok] = canvas.getAllByRole('progressbar');
      await expect(ok).toHaveAttribute('data-variant', 'success');
    });
  },
};
