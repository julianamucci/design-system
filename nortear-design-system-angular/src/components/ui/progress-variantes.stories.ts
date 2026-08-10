import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect } from 'storybook/test';
import { NDS_PROGRESS } from './progress';

// ─── Contraste medido, não presumido ─────────────────────────────────────────
//
// O conteúdo compartilhado pede 3:1 entre indicador e trilha (WCAG 1.4.11). A
// trilha é o primário a 20% de opacidade, então o valor real depende do que
// está ATRÁS dela — comparar as duas cores declaradas daria um número que
// ninguém vê. Por isso a composição é refeita aqui, do jeito que o navegador faz.

type Rgba = [number, number, number, number];

function parseRgba(cor: string): Rgba {
  const n = cor.match(/-?[\d.]+/g) ?? [];
  return [Number(n[0] ?? 0), Number(n[1] ?? 0), Number(n[2] ?? 0), n[3] === undefined ? 1 : Number(n[3])];
}

function compor([r, g, b, a]: Rgba, fundo: Rgba): Rgba {
  return [
    a * r + (1 - a) * fundo[0],
    a * g + (1 - a) * fundo[1],
    a * b + (1 - a) * fundo[2],
    1,
  ];
}

/** Primeira cor opaca subindo a árvore — o que de fato está atrás do elemento. */
function fundoEfetivo(el: HTMLElement): Rgba {
  let atual: HTMLElement | null = el.parentElement;
  while (atual) {
    const cor = parseRgba(getComputedStyle(atual).backgroundColor);
    if (cor[3] === 1) return cor;
    atual = atual.parentElement;
  }
  return [255, 255, 255, 1];
}

function luminancia([r, g, b]: Rgba): number {
  const canal = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

function contraste(a: Rgba, b: Rgba): number {
  const [claro, escuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (escuro + 0.05);
}

const meta: Meta = {
  title: 'UI/Progress/Variantes',
  decorators: [moduleMetadata({ imports: [...NDS_PROGRESS] })],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'As três formas de uso: valor conhecido, valor desconhecido e valor com rótulo. ' +
          'Rótulo e valor formatado são partes do próprio componente — não texto solto ao lado.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Determinate: Story = {
  parameters: { covers: ['accessibility.item2'] },
  render: () => ({
    template: `
      <div class="nds-w-full nds-max-w-md">
        <div ndsProgress [value]="42" aria-label="Progresso do upload">
          <div ndsProgressTrack>
            <div ndsProgressIndicator></div>
          </div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O valor conhecido é anunciado e desenhado', async () => {
      await expect(canvas.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '42');
      const indicador = canvasElement.querySelector<HTMLElement>(
        '[data-slot="progress-indicator"]',
      )!;
      await expect(indicador.style.getPropertyValue('--value')).toBe('42');
    });

    await step('Indicador e trilha se distinguem com pelo menos 3:1', async () => {
      // WCAG 1.4.11: a barra só informa se for possível ver onde ela termina.
      const trilha = canvasElement.querySelector<HTMLElement>('[data-slot="progress-track"]')!;
      const indicador = canvasElement.querySelector<HTMLElement>(
        '[data-slot="progress-indicator"]',
      )!;
      const atras = fundoEfetivo(trilha);
      const corTrilha = compor(parseRgba(getComputedStyle(trilha).backgroundColor), atras);
      const corIndicador = compor(
        parseRgba(getComputedStyle(indicador).backgroundColor),
        corTrilha,
      );
      await expect(contraste(corIndicador, corTrilha)).toBeGreaterThanOrEqual(3);
    });
  },
};

export const Indeterminate: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Sem `value`, o primitivo remove `aria-valuenow` e marca `data-indeterminate`. ' +
          'O `aria-valuetext` de fallback vem da lib em inglês ("indeterminate progress") e ' +
          'não é traduzível — anuncie a operação no nome acessível, que é seu.',
      },
    },
  },
  render: () => ({
    template: `
      <div class="nds-w-full nds-max-w-md">
        <div ndsProgress aria-label="Processando…">
          <div ndsProgressTrack>
            <div ndsProgressIndicator></div>
          </div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Valor desconhecido não vira valor zero', async () => {
      const bar = canvas.getByRole('progressbar', { name: 'Processando…' });
      await expect(bar).not.toHaveAttribute('aria-valuenow');
      await expect(bar).toHaveAttribute('data-indeterminate', '');
    });
  },
};

export const WithLabel: Story = {
  render: () => ({
    template: `
      <div class="nds-w-full nds-max-w-md">
        <div ndsProgress [value]="42">
          <span ndsProgressLabel>Enviando arquivo</span>
          <span ndsProgressValue></span>
          <div ndsProgressTrack>
            <div ndsProgressIndicator></div>
          </div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O rótulo visível vira o nome acessível da barra', async () => {
      // Com rótulo presente, o nome sai de `aria-labelledby` — não é preciso
      // repetir a frase num `aria-label`, que só duplicaria a manutenção.
      const bar = canvas.getByRole('progressbar', { name: 'Enviando arquivo' });
      const rotulo = canvasElement.querySelector<HTMLElement>('[data-slot="progress-label"]')!;
      await expect(bar.getAttribute('aria-labelledby')).toBe(rotulo.id);
    });

    await step('O valor formatado é escrito pelo componente, não pela aplicação', async () => {
      const valor = canvasElement.querySelector<HTMLElement>('[data-slot="progress-value"]')!;
      await expect(valor.textContent?.trim()).toBe('42%');
    });

    await step('O valor visível não é lido duas vezes', async () => {
      // A raiz já anuncia 42 em aria-valuenow; o texto ao lado é redundância
      // visual, e o primitivo o esconde do leitor de propósito.
      const valor = canvasElement.querySelector<HTMLElement>('[data-slot="progress-value"]')!;
      await expect(valor).toHaveAttribute('aria-hidden', 'true');
    });
  },
};
