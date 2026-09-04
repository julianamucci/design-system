import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect } from 'storybook/test';
import { withLabel } from './slider.fixtures';
import { sliderSource, sliderSourceWith } from './slider.source';
import {
  handleDesabilitada,
  alcasDoSlider,
  focusAssentadoRing,
  restRing,
  apertarTecla,
  contextoHandleTrack,
  contrastHandleTrack,
  handleValue,
} from '@shared/testing/slider-probe';

const meta: Meta = {
  tags: ['form'],
  title: 'Components/Form/Slider/States',
  parameters: {
    actions: { disable: true },
    layout: 'centered',
    controls: { disable: true },
    docs: {
      source: { transform: sliderSource },
      description: {
        component:
          'Estados do Slider: Default (valor inicial neutro), Focus (anel `--ring` na alça via teclado), Active (durante arrasto/teclas), Disabled (opacidade reduzida, sem pointer events) e MaxValue (no limite max). Hover não tem story própria — o cursor muda, a alça não.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

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
      'aria-label': 'Volume',
      value: 50,
      unit: '%',
    }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    // Story sem interação: é aqui que o valor de montagem pode ser afirmado.
    await step('Alça no valor inicial', async () => {
      await expect(handleValue(canvas.getByRole('slider'))).toBe(50);
    });

    await step('A borda da alça alcança 3:1 contra o trilho', async () => {
      // WCAG 1.4.11. O miolo da alça é da cor do fundo de propósito, então quem
      // a separa do trilho é a borda.
      await expect(
        contrastHandleTrack(canvasElement),
        contextoHandleTrack(canvasElement),
      ).toBeGreaterThanOrEqual(3);
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
      'aria-label': 'Volume',
      value: 50,
      unit: '%',
    }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const thumb = () => alcasDoSlider(canvasElement)[0];
    const rest = await restRing(thumb());

    await step('A alça recebe foco por teclado', async () => {
      await userEvent.tab();
      await expect(canvas.getByRole('slider')).toHaveFocus();
    });

    await step('A alça focada fica visivelmente diferente da alça em repouso', async () => {
      // Alça focada idêntica à alça parada é 2.4.7 reprovado com o teste verde.
      const focada = await focusAssentadoRing(thumb(), rest);
      await expect(focada.sombra !== rest.sombra || focada.border !== rest.border).toBe(true);
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
      'aria-label': 'Volume',
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
      const antes = handleValue(canvas.getByRole('slider'));
      await apertarTecla(canvas.getByRole('slider'), '{ArrowRight}');
      const depois = Math.min(100, antes + 1);
      await expect(handleValue(canvas.getByRole('slider'))).toBe(depois);
      await expect(live).toHaveTextContent(`${depois}%`);
    });

    await step('A seta contrária decrementa', async () => {
      const antes = handleValue(canvas.getByRole('slider'));
      await apertarTecla(canvas.getByRole('slider'), '{ArrowLeft}');
      await expect(handleValue(canvas.getByRole('slider'))).toBe(Math.max(0, antes - 1));
    });

    await step('Home e End alcançam os extremos', async () => {
      await apertarTecla(canvas.getByRole('slider'), '{Home}');
      await expect(handleValue(canvas.getByRole('slider'))).toBe(0);
      await apertarTecla(canvas.getByRole('slider'), '{End}');
      await expect(handleValue(canvas.getByRole('slider'))).toBe(100);
    });
  },
};

// ─── Disabled ─────────────────────────────────────────────────────────────────

export const Disabled: Story = {
  parameters: {
    covers: ['visual.item4'],
    docs: {
      source: { transform: sliderSourceWith({ disabled: true, value: 50 }) },
      description: {
        story: 'Estado desabilitado — opacidade reduzida, cursor `not-allowed`, sem pointer events nem teclado.',
      },
    },
  },
  render: () =>
    withLabel({
      idPrefix: 's-disabled',
      labelText: 'Volume',
      'aria-label': 'Volume',
      value: 50,
      disabled: true,
      unit: '%',
    }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A alça está marcada como desabilitada', async () => {
      await expect(handleDesabilitada(alcasDoSlider(canvasElement)[0])).toBe(true);
    });

    await step('O teclado não move o valor', async () => {
      const antes = handleValue(canvas.getByRole('slider'));
      await apertarTecla(canvas.getByRole('slider'), '{ArrowRight}');
      await expect(handleValue(canvas.getByRole('slider'))).toBe(antes);
    });
  },
};

// ─── MaxValue ─────────────────────────────────────────────────────────────────

export const MaxValue: Story = {
  render: () =>
    withLabel({
      idPrefix: 's-max',
      labelText: 'Brilho',
      'aria-label': 'Brilho',
      value: 100,
      unit: '%',
    }),
  parameters: {
    docs: {
      source: { transform: sliderSourceWith({ value: 100, 'aria-label': 'Brilho' }) },
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
      await expect(handleValue(canvas.getByRole('slider'))).toBe(100);
      // Afirma o desenho, não o dado: no máximo o preenchimento é o trilho.
      const track = canvasElement.querySelector<HTMLElement>('[data-slot="slider-track"]')!;
      const range = canvasElement.querySelector<HTMLElement>('[data-slot="slider-range"]')!;
      const pct =
        (range.getBoundingClientRect().width / track.getBoundingClientRect().width) * 100;
      await expect(Math.abs(pct - 100)).toBeLessThan(1.5);
    });

    await step('ArrowRight não ultrapassa o máximo', async () => {
      await apertarTecla(canvas.getByRole('slider'), '{ArrowRight}');
      await expect(handleValue(canvas.getByRole('slider'))).toBe(100);
    });
  },
};
