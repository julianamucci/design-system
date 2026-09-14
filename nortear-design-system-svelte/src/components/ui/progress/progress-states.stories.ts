import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { flushSync, mount, unmount } from 'svelte';
import { within, expect, waitFor } from 'storybook/test';
import { Progress } from './index';
import ProgressStory from './ProgressStory.svelte';
import {
  isAnimationRunning,
  barrasDeProgresso,
  indicadorAnimation,
  indicadorDoProgresso,
  enableReducedMotion,
  percentualDesenhado,
} from '@shared/testing/progress-probe';
import { PROGRESS_INDETERMINATE_TEXT } from '@shared/primitives/progress-value';
import { progressSource } from './progress.source';

const meta: Meta = {
  title: 'Components/Feedback/Progress/States',
  component: ProgressStory,
  tags: ['feedback'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo: cada estado é um valor de
      // `args`, inclusive o `null` do indeterminado e o relógio do animado.
      source: { transform: progressSource },
      description: {
        component:
          'Estados derivados do valor: default (mínimo), loading (parcial), complete (máximo), indeterminate (sem valor, com o traço em ciclo), a barra andando e o traço sob movimento reduzido.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  args: {
    value: 0,
    'aria-label': 'Progresso do upload',
  },
  parameters: {
    covers: ['functional.item1', 'visual.item1'],
    docs: {
      description: {
        story: 'value=0 — estado inicial, indicador em 0% (barra vazia).',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('value=0 anuncia zero e não desenha preenchimento', async () => {
      const bar = canvas.getByRole('progressbar');
      await expect(bar).toHaveAttribute('aria-valuenow', '0');
      await expect(bar).toHaveAttribute('aria-valuetext', '0%');
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
  args: {
    value: 50,
    'aria-label': 'Carregando dados',
  },
  parameters: {
    covers: ['functional.item2', 'visual.item2'],
    docs: {
      description: {
        story: 'value=50 — em progresso, indicador preenchido pela metade.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('value=50 preenche metade da trilha e anuncia 50%', async () => {
      const bar = canvas.getByRole('progressbar');
      await expect(bar).toHaveAttribute('aria-valuenow', '50');
      await expect(bar).toHaveAttribute('aria-valuetext', '50%');
      await waitFor(async () => {
        await expect(Math.abs(percentualDesenhado(canvasElement) - 50)).toBeLessThan(2);
      });
    });

    await step('A metade sai de --value, não de largura escrita à mão', async () => {
      const indicador = indicadorDoProgresso(canvasElement);
      await expect(indicador.style.getPropertyValue('--value').trim()).toBe('50');
      await expect(indicador.style.width).toBe('');
    });

    await step('O estado em progresso chega ao DOM', async () => {
      await expect(canvas.getByRole('progressbar')).toHaveAttribute('data-state', 'loading');
    });
  },
};

export const Complete: Story = {
  args: {
    value: 100,
    'aria-label': 'Concluído',
  },
  parameters: {
    covers: ['functional.item3', 'functional.item5', 'visual.item3'],
    docs: {
      description: {
        story:
          'value=100 — finalizado, barra cheia. Valor fora da faixa é limitado ao máximo ou ao mínimo antes de ser anunciado e desenhado.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('value=100 preenche a trilha inteira', async () => {
      await expect(canvas.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
      await waitFor(async () => {
        await expect(Math.abs(percentualDesenhado(canvasElement) - 100)).toBeLessThan(2);
      });
    });

    await step('A conclusão é um estado próprio no DOM', async () => {
      // Gancho de quem quer trocar cor ou remover a barra ao fim — sem ele, o
      // consumidor teria que comparar value com max.
      await expect(canvas.getByRole('progressbar')).toHaveAttribute('data-state', 'loaded');
    });

    await step('Fora da faixa: 140 vira 100 e −20 vira 0, no anúncio e no desenho', async () => {
      // As barras são montadas DE VERDADE, e não só construídas: um número
      // anunciado que a barra não desenha é justamente o defeito que o limite
      // existe para impedir. A montagem acontece antes de qualquer espera — o
      // `waitFor` só lê.
      const host = canvasElement.ownerDocument.createElement('div');
      host.className = 'nds-stack nds-w-md';
      host.dataset.spacing = 'sm';
      canvasElement.appendChild(host);
      const above = mount(Progress, { target: host, props: { value: 140, 'aria-label': 'Acima do máximo' } });
      const below = mount(Progress, { target: host, props: { value: -20, 'aria-label': 'Abaixo do mínimo' } });
      flushSync();
      try {
        const [barAbove, barBelow] = barrasDeProgresso(host);
        await expect(barAbove).toHaveAttribute('aria-valuenow', '100');
        await expect(barAbove).toHaveAttribute('aria-valuetext', '100%');
        await expect(barBelow).toHaveAttribute('aria-valuenow', '0');
        await expect(barBelow).toHaveAttribute('aria-valuetext', '0%');
        await waitFor(async () => {
          await expect(Math.abs(percentualDesenhado(barAbove) - 100)).toBeLessThan(2);
          await expect(percentualDesenhado(barBelow)).toBeLessThan(1);
        });
      } finally {
        unmount(above);
        unmount(below);
        host.remove();
      }
    });
  },
};

export const Indeterminate: Story = {
  args: {
    value: null,
    'aria-label': 'Processando…',
  },
  parameters: {
    covers: ['functional.item4', 'visual.item4'],
    docs: {
      description: {
        story:
          'value=null — sem valor definido. O primitivo marca data-indeterminate e o CSS compartilhado anima o traço a partir desse atributo.',
      },
    },
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

    await step('A faixa sobrevive ao indeterminado, e o texto diz "em andamento"', async () => {
      const bar = canvas.getByRole('progressbar');
      await expect(bar).toHaveAttribute('aria-valuemin', '0');
      await expect(bar).toHaveAttribute('aria-valuemax', '100');
      await expect(bar).toHaveAttribute('aria-valuetext', PROGRESS_INDETERMINATE_TEXT);
    });

    await step('O traço corre de verdade', async () => {
      // Medir POSIÇÃO no meio de uma animação infinita é racy por construção —
      // o traço está sempre em outro lugar. Afirmar a existência da animação,
      // pelo nome do keyframes do design system, é o que dá para provar sem
      // sorte.
      await waitFor(async () => {
        await expect(indicadorAnimation(canvasElement)).toBe('nds-progress-indeterminate');
      });
    });

    await step('O traço é o do design system, não o de um homônimo', async () => {
      // O ciclo do design system desloca `margin-inline-start` e deixa
      // `transform` em `none`; um homônimo que animasse `transform` apareceria
      // aqui como matriz.
      await expect(getComputedStyle(indicadorDoProgresso(canvasElement)).transform).toBe('none');
    });
  },
};

export const Animated: Story = {
  args: {
    value: 0,
    'aria-label': 'Progresso do upload',
    label: 'Enviando arquivo',
    showValue: true,
    animated: true,
    intervalMs: 400,
    step: 5,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Upload com rótulo e porcentagem viva (aria-live=polite). O valor sobe 5% a cada 400ms e recomeça ao chegar em 100.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Progressbar animado presente e nomeado', async () => {
      const bar = canvas.getByRole('progressbar', { name: 'Progresso do upload' });
      await expect(bar).toHaveAttribute('aria-valuemin', '0');
      await expect(bar).toHaveAttribute('aria-valuemax', '100');
    });

    await step('O valor anunciado fica dentro da escala e o texto o acompanha', async () => {
      // O valor muda a cada 400ms; afirmar um número seria racy. O que vale em
      // qualquer instante é o intervalo — e as duas leituras saem da mesma
      // pintura, lidas em sequência sem espera no meio.
      const bar = canvas.getByRole('progressbar');
      const now = Number(bar.getAttribute('aria-valuenow'));
      const text = bar.getAttribute('aria-valuetext');
      await expect(Number.isFinite(now)).toBe(true);
      await expect(now >= 0 && now <= 100).toBe(true);
      await expect(text).toBe(`${now}%`);
    });

    await step('O texto da porcentagem usa aria-live=polite', async () => {
      // `assertive` interromperia o leitor a cada 5% — é o par Do & Don't desta
      // página.
      const live = canvasElement.querySelector('[aria-live]');
      await expect(live).toHaveAttribute('aria-live', 'polite');
    });
  },
};

export const ReducedMotion: Story = {
  args: {
    value: null,
    'aria-label': 'Processando dados',
  },
  parameters: {
    covers: ['functional.item7'],
    docs: {
      description: {
        story:
          'Com movimento reduzido o traço indeterminado para no início da trilha. A barra continua visível — o que some é o movimento, não a informação.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    // Movimento reduzido não pode custar o nome: a barra parada continua
    // dizendo o que está em andamento.
    await canvas.findByRole('progressbar', { name: 'Processando dados' });
    const indicador = indicadorDoProgresso(canvasElement);

    await step('Sem a preferência, o traço corre', async () => {
      await waitFor(async () => {
        await expect(isAnimationRunning(indicador)).toBe(true);
      });
    });

    // O desfazer roda no `finally`: deixar a marca posta envenena a story
    // seguinte e a foto do Chromatic.
    const undo = enableReducedMotion(canvasElement.ownerDocument);
    try {
      await step('Com movimento reduzido, o traço para', async () => {
        // Nome E duração: o override zera a duração e deixa o nome lá.
        await waitFor(async () => {
          await expect(isAnimationRunning(indicador)).toBe(false);
        });
      });

      await step('O traço continua visível', async () => {
        await expect(indicador.getBoundingClientRect().width).toBeGreaterThan(0);
      });
    } finally {
      undo();
    }
  },
};
