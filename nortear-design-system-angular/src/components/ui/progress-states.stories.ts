import { Component, DestroyRef, inject, signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, waitFor } from 'storybook/test';
import { NDS_PROGRESS } from './progress';
import {
  progressAnimatedSource,
  progressCompleteSource,
  progressDefaultSource,
  progressIndeterminateStateSource,
  progressLoadingSource,
  progressReducedMotionSource,
} from './progress.source';
import {
  isAnimationRunning,
  indicadorAnimation,
  indicadorDoProgresso,
  enableReducedMotion,
  percentualDesenhado,
} from '@shared/testing/progress-probe';
import { PROGRESS_INDETERMINATE_TEXT } from '@shared/primitives/progress-value';

/** A barra que avança: o valor é um sinal, e o texto ao lado anuncia em região `polite`. */
@Component({
  selector: 'nds-progress-animated-example',
  standalone: true,
  imports: [...NDS_PROGRESS],
  template: `
    <div class="nds-stack nds-w-md" data-spacing="xs">
      <div class="nds-cluster nds-text-body" data-justify="between">
        <span class="nds-text-foreground">Enviando arquivo</span>
        <span class="nds-text-muted-foreground nds-tabular-nums" aria-live="polite">{{ progress() }}%</span>
      </div>
      <div ndsProgress [value]="progress()" aria-label="Progresso do upload">
        <div ndsProgressTrack>
          <div ndsProgressIndicator></div>
        </div>
      </div>
    </div>
  `,
})
class AnimatedProgressExample {
  readonly progress = signal(0);

  constructor() {
    const timer = setInterval(() => this.progress.update((pct) => (pct >= 100 ? 0 : pct + 5)), 400);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }
}

// O valor da story Complete, exposto para a `play` empurrar para fora da faixa.
// Módulo e não `args`: função e sinal em `args` sem `argTypes` não chegam ao
// template, e o painel de controles desta story fica desligado.
const completeValue = signal(100);

const meta: Meta = {
  title: 'Components/Feedback/Progress/States',
  tags: ['feedback'],
  decorators: [moduleMetadata({ imports: [...NDS_PROGRESS, AnimatedProgressExample] })],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Estados derivados do valor: default (mínimo), loading (parcial), complete (máximo) e ' +
          'indeterminate (sem valor). O estado é do primitivo — chega ao DOM em ' +
          '`data-progressing`, `data-complete` e `data-indeterminate`.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: {
    covers: ['functional.item1', 'visual.item1'],
    docs: { source: { transform: progressDefaultSource } },
  },
  render: () => ({
    template: `
      <div class="nds-w-md">
        <div ndsProgress [value]="0" aria-label="Progresso do upload">
          <div ndsProgressTrack>
            <div ndsProgressIndicator></div>
          </div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('value=0 anuncia zero e não desenha preenchimento', async () => {
      const bar = canvas.getByRole('progressbar');
      await expect(bar).toHaveAttribute('aria-valuenow', '0');
      await waitFor(() => expect(bar.getAttribute('aria-valuetext')).toBe('0%'));
      await waitFor(async () => {
        await expect(percentualDesenhado(canvasElement)).toBeLessThan(1);
      });
    });

    await step('Zero não é o mesmo que indeterminate', async () => {
      // Sem esta linha, um bug que trocasse 0 por null passaria: as duas telas
      // são idênticas, mas só uma delas informa o progresso ao leitor.
      const bar = canvas.getByRole('progressbar');
      await expect(bar).not.toHaveAttribute('data-indeterminate');
      await expect(bar).toHaveAttribute('data-progressing', '');
    });
  },
};

export const Loading: Story = {
  parameters: {
    covers: ['functional.item2', 'visual.item2'],
    docs: { source: { transform: progressLoadingSource } },
  },
  render: () => ({
    template: `
      <div class="nds-w-md">
        <div ndsProgress [value]="50" aria-label="Carregando dados">
          <div ndsProgressTrack>
            <div ndsProgressIndicator></div>
          </div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('value=50 preenche metade da trilha e anuncia "50%"', async () => {
      const bar = canvas.getByRole('progressbar');
      await expect(bar).toHaveAttribute('aria-valuenow', '50');
      await waitFor(() => expect(bar.getAttribute('aria-valuetext')).toBe('50%'));
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

export const Complete: Story = {
  parameters: {
    covers: ['functional.item3', 'functional.item5', 'visual.item3'],
    docs: { source: { transform: progressCompleteSource } },
  },
  render: () => {
    completeValue.set(100);
    return {
      props: { value: completeValue },
      template: `
        <div class="nds-w-md">
          <div ndsProgress [value]="value()" aria-label="Concluído">
            <div ndsProgressTrack>
              <div ndsProgressIndicator></div>
            </div>
          </div>
        </div>
      `,
    };
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const bar = canvas.getByRole('progressbar', { name: 'Concluído' });

    await step('value=100 preenche a trilha inteira', async () => {
      await expect(bar).toHaveAttribute('aria-valuenow', '100');
      await waitFor(async () => {
        await expect(Math.abs(percentualDesenhado(canvasElement) - 100)).toBeLessThan(2);
      });
    });

    await step('A conclusão é um estado próprio no DOM', async () => {
      // `data-complete` é o gancho de quem quer trocar cor ou remover a barra
      // ao fim — sem ele, o consumidor teria que comparar value com max.
      await expect(bar).toHaveAttribute('data-complete', '');
      await expect(bar).not.toHaveAttribute('data-progressing');
    });

    try {
      await step('Abaixo da faixa: −20 é anunciado e desenhado como 0', async () => {
        // Um número anunciado que a barra não desenha é o defeito silencioso:
        // as duas metades são afirmadas juntas.
        completeValue.set(-20);
        await waitFor(() => expect(bar).toHaveAttribute('aria-valuenow', '0'));
        await waitFor(() => expect(bar.getAttribute('aria-valuetext')).toBe('0%'));
        await waitFor(async () => {
          await expect(percentualDesenhado(canvasElement)).toBeLessThan(1);
        });
      });

      await step('Acima da faixa: 140 é anunciado e desenhado como 100', async () => {
        completeValue.set(140);
        await waitFor(() => expect(bar).toHaveAttribute('aria-valuenow', '100'));
        await waitFor(() => expect(bar.getAttribute('aria-valuetext')).toBe('100%'));
        await expect(indicadorDoProgresso(canvasElement).style.getPropertyValue('--value')).toBe('100');
        await waitFor(async () => {
          await expect(Math.abs(percentualDesenhado(canvasElement) - 100)).toBeLessThan(2);
        });
      });
    } finally {
      // A foto do Chromatic é do valor de fim, não do último passo da play.
      completeValue.set(100);
    }
  },
};

export const Indeterminate: Story = {
  parameters: {
    covers: ['functional.item4', 'visual.item4'],
    docs: {
      source: { transform: progressIndeterminateStateSource },
      description: {
        story:
          '`null` é o modo indeterminado: `aria-valuenow` some, a escala continua anunciada e o ' +
          'estado chega ao DOM em `data-indeterminate`, de onde o CSS compartilhado tira a ' +
          'largura do traço e a animação em ciclo.',
      },
    },
  },
  render: () => ({
    template: `
      <div class="nds-w-md">
        <div ndsProgress [value]="null" aria-label="Processando…">
          <div ndsProgressTrack>
            <div ndsProgressIndicator></div>
          </div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Sem valor, aria-valuenow some e a escala permanece', async () => {
      // Um `aria-valuenow` fixo em 0 mentiria: diria "zero por cento" quando a
      // verdade é "não sei quanto falta".
      const bar = canvas.getByRole('progressbar', { name: 'Processando…' });
      await expect(bar).not.toHaveAttribute('aria-valuenow');
      await expect(bar).toHaveAttribute('aria-valuemin', '0');
      await expect(bar).toHaveAttribute('aria-valuemax', '100');
      await waitFor(() =>
        expect(bar.getAttribute('aria-valuetext')).toBe(PROGRESS_INDETERMINATE_TEXT),
      );
    });

    await step('O estado indeterminate chega às três partes', async () => {
      for (const part of ['.nds-progress-root', '.nds-progress', '.nds-progress-indicator']) {
        const el = canvasElement.querySelector<HTMLElement>(part)!;
        await expect(el).toHaveAttribute('data-indeterminate', '');
      }
    });

    await step('Sem valor não há --value para o CSS consumir', async () => {
      await expect(indicadorDoProgresso(canvasElement).style.getPropertyValue('--value')).toBe('');
    });

    await step('O traço corre de verdade', async () => {
      // Medir POSIÇÃO no meio de uma animação infinita é racy por construção;
      // afirmar o nome do keyframes não é.
      await waitFor(async () => {
        await expect(indicadorAnimation(canvasElement)).toBe('nds-progress-indeterminate');
      });
    });

    await step('O traço é o do design system, não o de um homônimo', async () => {
      // O ciclo do design system desloca `margin-inline-start` e deixa
      // `transform` em `none`; o homônimo que já venceu calado animava
      // `transform`, e aqui apareceria uma matriz.
      await expect(
        getComputedStyle(indicadorDoProgresso(canvasElement)).transform,
      ).toBe('none');
    });
  },
};

export const Animated: Story = {
  parameters: {
    docs: { source: { transform: progressAnimatedSource } },
  },
  render: () => ({ template: '<nds-progress-animated-example />' }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A barra animada está presente e nomeada', async () => {
      const bar = canvas.getByRole('progressbar', { name: 'Progresso do upload' });
      await expect(bar).toHaveAttribute('aria-valuemin', '0');
      await expect(bar).toHaveAttribute('aria-valuemax', '100');
    });

    await step('O valor anunciado fica dentro da escala em toda rodada', async () => {
      // O valor muda a cada 400ms; afirmar um número seria racy. O que vale em
      // qualquer instante é o intervalo e a forma do texto.
      const bar = canvas.getByRole('progressbar');
      const now = Number(bar.getAttribute('aria-valuenow'));
      await expect(Number.isFinite(now)).toBe(true);
      await expect(now >= 0 && now <= 100).toBe(true);
      await expect(bar.getAttribute('aria-valuetext')).toMatch(/^\d+%$/);
    });

    await step('O texto da porcentagem usa aria-live=polite', async () => {
      // `assertive` interromperia o leitor a cada 5% — é o par Do & Don't da
      // página.
      const live = canvasElement.querySelector('[aria-live]');
      await expect(live).toHaveAttribute('aria-live', 'polite');
    });
  },
};

export const ReducedMotion: Story = {
  parameters: {
    covers: ['functional.item7'],
    docs: {
      source: { transform: progressReducedMotionSource },
      description: {
        story:
          'Com movimento reduzido o traço indeterminado para no início da trilha. Ele continua ' +
          'visível — o que some é o movimento, não o aviso de que há trabalho em andamento.',
      },
    },
  },
  render: () => ({
    template: `
      <div class="nds-w-md">
        <div ndsProgress aria-label="Processando dados">
          <div ndsProgressTrack>
            <div ndsProgressIndicator></div>
          </div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    // O nome acessível é parte do exemplo: a barra parada ainda diz de quê.
    await canvas.findByRole('progressbar', { name: 'Processando dados' });
    const indicador = indicadorDoProgresso(canvasElement);

    await step('Sem a preferência, o traço corre', async () => {
      await waitFor(() => expect(isAnimationRunning(indicador)).toBe(true));
    });

    // O desfazer roda no finally: a story seguinte (e a foto do Chromatic) não
    // podem herdar a marca no `<html>`.
    const undo = enableReducedMotion(canvasElement.ownerDocument);
    try {
      await step('Com movimento reduzido, o traço para', async () => {
        // Pelo PAR nome + duração: o nome continua lá depois que a duração é
        // zerada. Dentro de `waitFor`, porque a folha reage à marca na próxima
        // repintura — e a leitura é pura, sem tocar no DOM.
        await waitFor(() => expect(isAnimationRunning(indicador)).toBe(false));
      });

      await step('O traço parado continua visível', async () => {
        await expect(indicador.getBoundingClientRect().width).toBeGreaterThan(0);
      });
    } finally {
      undo();
    }
  },
};
