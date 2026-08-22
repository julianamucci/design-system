import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, waitFor } from 'storybook/test';
import { NDS_PROGRESS } from './progress';
import {
  barrasDeProgresso,
  contrastBarTrack,
  indicadorDoProgresso,
  nomeAcessivel,
  percentualDesenhado,
} from '@shared/testing/progress-probe';

// O contraste entre indicador e trilha é medido, não presumido: a trilha é o
// primário a 20% de opacidade, então o valor real depende do que está ATRÁS
// dela. A composição, a conta e a busca pelo primeiro ancestral opaco moram no
// colhedor compartilhado — as cinco stacks medem com o mesmo código.

const meta: Meta = {
  title: 'UI/Progress/Variants',
  decorators: [moduleMetadata({ imports: [...NDS_PROGRESS] })],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'As formas de uso: valor conhecido, valor com rótulo e cor semântica. ' +
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
      <div class="nds-w-md">
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
      const indicador = indicadorDoProgresso(canvasElement);
      await expect(indicador.style.getPropertyValue('--value')).toBe('42');
      await waitFor(async () => {
        await expect(Math.abs(percentualDesenhado(canvasElement) - 42)).toBeLessThan(2);
      });
    });

    await step('Indicador e trilha se distinguem com pelo menos 3:1', async () => {
      // WCAG 1.4.11: a barra só informa se for possível ver onde ela termina.
      await expect(contrastBarTrack(canvasElement)).toBeGreaterThanOrEqual(3);
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
      <div class="nds-w-md">
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

    await step('Sem valor não há --value para o CSS consumir', async () => {
      const indicador = indicadorDoProgresso(canvasElement);
      await expect(indicador.style.getPropertyValue('--value')).toBe('');
    });
  },
};

export const WithLabel: Story = {
  parameters: { covers: ['accessibility.item5'] },
  render: () => ({
    template: `
      <div class="nds-w-md">
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
      // repetir a frase num `aria-label`, que só duplicaria a manutenção. É por
      // isso que o critério fala em NOME ACESSÍVEL, e não em `aria-label`.
      const bar = canvas.getByRole('progressbar', { name: 'Enviando arquivo' });
      const rotulo = canvasElement.querySelector<HTMLElement>('[data-slot="progress-label"]')!;
      await expect(bar.getAttribute('aria-labelledby')).toBe(rotulo.id);
    });

    await step('Toda barra da tela tem nome acessível', async () => {
      for (const bar of barrasDeProgresso(canvasElement)) {
        await expect(nomeAcessivel(bar)).not.toBe('');
      }
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

export const SemanticColor: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '`data-variant` troca a cor da barra; a trilha continua neutra, para o contraste ' +
          'não depender da variante escolhida.',
      },
    },
  },
  render: () => ({
    template: `
      <div class="nds-stack nds-w-md" data-spacing="sm">
        <div ndsProgress [value]="100" data-variant="success" aria-label="Sincronização concluída">
          <div ndsProgressTrack>
            <div ndsProgressIndicator></div>
          </div>
        </div>
        <div
          ndsProgress
          [value]="92"
          data-variant="destructive"
          aria-label="Espaço de armazenamento quase esgotado"
        >
          <div ndsProgressTrack>
            <div ndsProgressIndicator></div>
          </div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Cada variante pinta a barra de uma cor diferente', async () => {
      const [ok, critico] = canvas.getAllByRole('progressbar');
      const colorOf = (raiz: HTMLElement) =>
        getComputedStyle(indicadorDoProgresso(raiz)).backgroundColor;
      await expect(colorOf(ok)).not.toBe(colorOf(critico));
    });

    await step('As duas variantes mantêm 3:1 contra a trilha', async () => {
      for (const raiz of canvas.getAllByRole('progressbar')) {
        await expect(contrastBarTrack(raiz)).toBeGreaterThanOrEqual(3);
      }
    });

    await step('A cor sai do atributo, não de uma classe morta', async () => {
      const [ok] = canvas.getAllByRole('progressbar');
      await expect(ok).toHaveAttribute('data-variant', 'success');
    });
  },
};
