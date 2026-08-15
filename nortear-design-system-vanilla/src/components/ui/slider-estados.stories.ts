import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect } from 'storybook/test';
import { createSlider } from './slider';
import {
  alcaDesabilitada,
  alcasDoSlider,
  anelDeFocoAssentado,
  anelEmRepouso,
  apertarTecla,
  contrasteAlcaTrilho,
  valorDaAlca,
} from '@shared/testing/slider-probe';

const meta: Meta = {
  tags: ['form'],
  title: 'UI/Slider/States',
  parameters: {
    actions: { disable: true },
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Estados do Slider: Default (valor inicial neutro), Focus (anel `--ring` na alça via teclado), Active (durante arrasto/teclas), Disabled (opacidade reduzida, sem pointer events) e MaxValue (no limite max). Hover não tem story própria — o cursor muda, a alça não.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function withLabel(opts: {
  idPrefix: string;
  labelText: string;
  ariaLabel: string;
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  disabled?: boolean;
  unit?: string;
}): HTMLElement {
  const { idPrefix, labelText, ariaLabel, min = 0, max = 100, step = 1, value = 0, disabled = false, unit = '' } = opts;

  const wrap = document.createElement('div');
  wrap.className = 'nds-stack nds-w-sm';
  wrap.dataset.spacing = 'sm';

  const row = document.createElement('div');
  row.className = 'nds-cluster';
  row.dataset.justify = 'between';

  const label = document.createElement('label');
  label.id = `${idPrefix}-label`;
  label.className = 'nds-text-body nds-font-medium';
  label.textContent = labelText;

  const valueText = document.createElement('span');
  valueText.id = `${idPrefix}-value`;
  valueText.className = 'nds-text-body nds-text-muted-foreground nds-tabular-nums';
  valueText.setAttribute('aria-live', 'polite');
  valueText.textContent = `${value}${unit}`;

  row.append(label, valueText);

  const slider = createSlider({
    min,
    max,
    step,
    value,
    disabled,
    ariaLabel,
    onValueChange: (v) => {
      valueText.textContent = `${v}${unit}`;
    },
  });

  const input = slider.querySelector('input[type="range"]') as HTMLInputElement | null;
  if (input) {
    input.setAttribute('aria-describedby', `${idPrefix}-value`);
    input.id = `${idPrefix}-input`;
  }

  wrap.append(row, slider);
  return wrap;
}

// ─── Default ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  parameters: {
    covers: ['accessibility.item2'],
    docs: {
      description: {
        story: 'Estado padrão — valor inicial 50, miolo da alça na cor de fundo, borda e preenchimento em `--primary`, trilho em `--primary` a 20%.',
      },
    },
  },
  render: () =>
    withLabel({
      idPrefix: 's-default',
      labelText: 'Volume',
      ariaLabel: 'Volume',
      value: 50,
      unit: '%',
    }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    // Story sem interação: é aqui que o valor de montagem pode ser afirmado.
    await step('Alça no valor inicial', async () => {
      await expect(valorDaAlca(canvas.getByRole('slider'))).toBe(50);
    });

    await step('A borda da alça alcança 3:1 contra o trilho', async () => {
      // WCAG 1.4.11. O miolo da alça é da cor do fundo de propósito, então quem
      // a separa do trilho é a borda.
      await expect(contrasteAlcaTrilho(canvasElement)).toBeGreaterThanOrEqual(3);
    });
  },
};

// ─── Focus ────────────────────────────────────────────────────────────────────

export const Focus: Story = {
  parameters: {
    covers: ['accessibility.item3'],
    docs: {
      description: {
        story: 'Estado de foco via teclado — anel `--ring` visível ao redor da alça após Tab.',
      },
    },
  },
  render: () =>
    withLabel({
      idPrefix: 's-focus',
      labelText: 'Volume',
      ariaLabel: 'Volume',
      value: 50,
      unit: '%',
    }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const alca = () => alcasDoSlider(canvasElement)[0];
    const repouso = await anelEmRepouso(alca());

    await step('A alça recebe foco por teclado', async () => {
      await userEvent.tab();
      await expect(canvas.getByRole('slider')).toHaveFocus();
    });

    await step('A alça focada fica visivelmente diferente da alça em repouso', async () => {
      // Alça focada idêntica à alça parada é 2.4.7 reprovado com o teste verde.
      const focada = await anelDeFocoAssentado(alca(), repouso);
      await expect(focada.sombra !== repouso.sombra || focada.borda !== repouso.borda).toBe(true);
      await expect(focada.sombra).not.toBe('none');
    });
  },
};

// ─── Active (alteração via teclas) ────────────────────────────────────────────

export const Active: Story = {
  render: () =>
    withLabel({
      idPrefix: 's-active',
      labelText: 'Volume',
      ariaLabel: 'Volume',
      value: 50,
      unit: '%',
    }),
  parameters: {
    docs: {
      description: {
        story:
          'Estado ativo durante navegação por teclado. Setas alteram em `step`; PageUp/PageDown dão um salto maior; Home/End vão para min/max.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const live = canvasElement.querySelector<HTMLElement>('[aria-live="polite"]')!;

    // Teclado aqui é a ação padrão do `<input type="range">` nativo, e ação
    // padrão só responde a evento CONFIABLE — daí `apertarTecla`, que aperta
    // pelo navegador. Com o userEvent do DOM a seta não movia nada e o valor
    // saía `NaN`: `expect(NaN).toBe(NaN)` passa, e o passo inteiro era inerte.
    await step('A seta incrementa e o texto adjacente acompanha', async () => {
      const antes = valorDaAlca(canvas.getByRole('slider'));
      await apertarTecla(canvas.getByRole('slider'), '{ArrowRight}');
      const depois = Math.min(100, antes + 1);
      await expect(valorDaAlca(canvas.getByRole('slider'))).toBe(depois);
      await expect(live).toHaveTextContent(`${depois}%`);
    });

    await step('A seta contrária decrementa', async () => {
      const antes = valorDaAlca(canvas.getByRole('slider'));
      await apertarTecla(canvas.getByRole('slider'), '{ArrowLeft}');
      await expect(valorDaAlca(canvas.getByRole('slider'))).toBe(Math.max(0, antes - 1));
    });

    await step('Home e End alcançam os extremos', async () => {
      await apertarTecla(canvas.getByRole('slider'), '{Home}');
      await expect(valorDaAlca(canvas.getByRole('slider'))).toBe(0);
      await apertarTecla(canvas.getByRole('slider'), '{End}');
      await expect(valorDaAlca(canvas.getByRole('slider'))).toBe(100);
    });
  },
};

// ─── Disabled ─────────────────────────────────────────────────────────────────

export const Disabled: Story = {
  parameters: {
    covers: ['visual.item4'],
    docs: {
      description: {
        story: 'Estado desabilitado — opacidade reduzida, cursor `not-allowed`, sem pointer events nem teclado.',
      },
    },
  },
  render: () =>
    withLabel({
      idPrefix: 's-disabled',
      labelText: 'Volume',
      ariaLabel: 'Volume',
      value: 50,
      disabled: true,
      unit: '%',
    }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A alça está marcada como desabilitada', async () => {
      await expect(alcaDesabilitada(alcasDoSlider(canvasElement)[0])).toBe(true);
    });

    await step('O teclado não move o valor', async () => {
      const antes = valorDaAlca(canvas.getByRole('slider'));
      await apertarTecla(canvas.getByRole('slider'), '{ArrowRight}');
      await expect(valorDaAlca(canvas.getByRole('slider'))).toBe(antes);
    });
  },
};

// ─── MaxValue ─────────────────────────────────────────────────────────────────

export const MaxValue: Story = {
  render: () =>
    withLabel({
      idPrefix: 's-max',
      labelText: 'Brilho',
      ariaLabel: 'Brilho',
      value: 100,
      unit: '%',
    }),
  parameters: {
    docs: {
      description: {
        story: 'Slider no limite máximo — preenchimento completo, texto adjacente confirma o valor.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O preenchimento cobre o trilho inteiro no máximo', async () => {
      // A story já nasce no máximo: o End que havia aqui não estabelecia nada
      // e só servia para ler o desenho depois de mexer nele.
      await expect(valorDaAlca(canvas.getByRole('slider'))).toBe(100);
      // Afirma o desenho, não o dado: no máximo o preenchimento é o trilho.
      const trilho = canvasElement.querySelector<HTMLElement>('[data-slot="slider-track"]')!;
      const faixa = canvasElement.querySelector<HTMLElement>('[data-slot="slider-range"]')!;
      const pct =
        (faixa.getBoundingClientRect().width / trilho.getBoundingClientRect().width) * 100;
      await expect(Math.abs(pct - 100)).toBeLessThan(1.5);
    });

    await step('ArrowRight não ultrapassa o máximo', async () => {
      await apertarTecla(canvas.getByRole('slider'), '{ArrowRight}');
      await expect(valorDaAlca(canvas.getByRole('slider'))).toBe(100);
    });
  },
};
