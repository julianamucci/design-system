import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect, waitFor } from 'storybook/test';
import { createProgress } from './progress';
import { progressSource, progressSourceAnimado, progressSourceWith } from './progress.source';
import {
  indicadorAnimation,
  indicadorDoProgresso,
  percentualDesenhado,
} from '@shared/testing/progress-probe';

const meta: Meta = {
  tags: ['feedback'],
  title: 'Primitives/Feedback/Progress/States',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      source: { transform: progressSource },
      description: {
        component:
          'Estados derivados do valor: default (0), loading (parcial), complete (100) e ' +
          'indeterminate (`value: null`, sem aria-valuenow e com o traço em ciclo).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Default (value=0) ───────────────────────────────────────────────────────

export const Default: Story = {
  parameters: {
    covers: ['functional.item1', 'visual.item1'],
    // Neste arquivo o VALOR é o assunto de cada story, e nenhum control o
    // cobre: cada uma declara o seu.
    docs: { source: { transform: progressSourceWith({ value: 0 }) } },
  },
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-w-md';
    const bar = createProgress({ value: 0, 'aria-label': 'Progresso do upload' });
    wrap.appendChild(bar);
    return wrap;
  },
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

// ─── Loading (value=50) ──────────────────────────────────────────────────────

export const Loading: Story = {
  parameters: {
    covers: ['functional.item2', 'visual.item2'],
    docs: {
      source: { transform: progressSourceWith({ value: 50, 'aria-label': 'Carregando dados' }) },
    },
  },
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-w-md';
    const bar = createProgress({ value: 50, 'aria-label': 'Carregando dados' });
    wrap.appendChild(bar);
    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('value=50 preenche metade da trilha', async () => {
      await expect(canvas.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
      await waitFor(async () => {
        await expect(Math.abs(percentualDesenhado(canvasElement) - 50)).toBeLessThan(2);
      });
    });

    await step('A metade sai de --value, não de largura escrita à mão', async () => {
      const indicador = indicadorDoProgresso(canvasElement);
      await expect(indicador.style.getPropertyValue('--value')).toBe('50');
      await expect(indicador.style.width).toBe('');
    });
  },
};

// ─── Complete (value=100) ────────────────────────────────────────────────────

export const Complete: Story = {
  parameters: {
    covers: ['functional.item3', 'visual.item3'],
    docs: { source: { transform: progressSourceWith({ value: 100, 'aria-label': 'Concluído' }) } },
  },
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-w-md';
    const bar = createProgress({ value: 100, 'aria-label': 'Concluído' });
    wrap.appendChild(bar);
    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('value=100 preenche a trilha inteira', async () => {
      await expect(canvas.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
      await waitFor(async () => {
        await expect(Math.abs(percentualDesenhado(canvasElement) - 100)).toBeLessThan(2);
      });
    });

    await step('O valor é limitado pela escala, não pelo desenho', async () => {
      // A factory faz clamp em `max`: um `value` acima do máximo anunciaria um
      // número que a barra não desenha.
      const above = createProgress({ value: 140 });
      await expect(above.getAttribute('aria-valuenow')).toBe('100');
    });
  },
};

// ─── Indeterminate ───────────────────────────────────────────────────────────

export const Indeterminate: Story = {
  parameters: {
    covers: ['functional.item4', 'visual.item4'],
    docs: {
      source: { transform: progressSourceWith({ value: null, 'aria-label': 'Processando…' }) },
    },
  },
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-w-md';
    const bar = createProgress({ value: null, 'aria-label': 'Processando…' });
    wrap.appendChild(bar);
    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Sem valor, aria-valuenow some e o nome permanece', async () => {
      // Um `aria-valuenow` fixo em 0 mentiria: diria "zero por cento" quando a
      // verdade é "não sei quanto falta".
      const bar = canvas.getByRole('progressbar', { name: 'Processando…' });
      await expect(bar).not.toHaveAttribute('aria-valuenow');
      await expect(bar).toHaveAttribute('data-indeterminate', '');
    });

    await step('O traço corre de verdade', async () => {
      // Medir POSIÇÃO no meio de uma animação infinita é racy por construção —
      // o traço está sempre em outro lugar. Afirmar a existência da animação,
      // pelo nome do keyframes do design system, é o que dá para provar sem
      // sorte. Foi assim que se descobriu que não havia animação nenhuma.
      await waitFor(async () => {
        await expect(indicadorAnimation(canvasElement)).toBe('nds-progress-indeterminate');
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

// ─── Animado (setInterval) ───────────────────────────────────────────────────

export const Animated: Story = {
  parameters: {
    // Override de story: a fábrica desenha um valor, não uma animação — quem
    // faz a barra andar é o código que reescreve `--value` e `aria-valuenow`.
    docs: {
      source: {
        transform: progressSourceAnimado({ value: 0, 'aria-label': 'Progresso do upload' }),
      },
    },
  },
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-stack nds-w-md';
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
    value.textContent = '0%';

    row.append(label, value);

    const bar = createProgress({ value: 0, 'aria-label': 'Progresso do upload' });
    const indicator = bar.firstElementChild as HTMLElement | null;

    wrap.append(row, bar);

    let pct = 0;
    const timer = window.setInterval(() => {
      pct = pct >= 100 ? 0 : pct + 5;
      value.textContent = `${pct}%`;
      bar.setAttribute('aria-valuenow', String(pct));
      // Mesma custom property que a factory alimenta — escrever `width` ou
      // `transform` aqui sobrescreveria a regra do design system.
      if (indicator) indicator.style.setProperty('--value', String(pct));
    }, 400);

    // Cleanup when removed from DOM
    const mo = new MutationObserver(() => {
      if (!document.body.contains(wrap)) {
        window.clearInterval(timer);
        mo.disconnect();
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return wrap;
  },

  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Progressbar animado presente e nomeado', async () => {
      const bar = canvas.getByRole('progressbar', { name: 'Progresso do upload' });
      await expect(bar).toHaveAttribute('aria-valuemin', '0');
      await expect(bar).toHaveAttribute('aria-valuemax', '100');
    });

    await step('O valor anunciado fica dentro da escala em toda rodada', async () => {
      // O valor muda a cada 400ms; afirmar um número seria racy. O que vale em
      // qualquer instante é o intervalo.
      const agora = Number(canvas.getByRole('progressbar').getAttribute('aria-valuenow'));
      await expect(Number.isFinite(agora)).toBe(true);
      await expect(agora >= 0 && agora <= 100).toBe(true);
    });

    await step('O texto da porcentagem usa aria-live=polite', async () => {
      // `assertive` interromperia o leitor a cada 5% — é o par Do & Don't desta
      // página.
      const live = canvasElement.querySelector('[aria-live]');
      await expect(live).toHaveAttribute('aria-live', 'polite');
    });
  },
};
