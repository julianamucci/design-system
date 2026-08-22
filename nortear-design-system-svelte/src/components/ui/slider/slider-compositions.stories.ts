import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, expect } from 'storybook/test';
import SliderStory from './SliderStory.svelte';
import SliderFormStory from './SliderFormStory.svelte';
import { handleValue } from '@shared/testing/slider-probe';
import {
  formSliderSource,
  sliderEscalaCurtaSource,
  precoSliderRangeSource,
  sliderSource,
} from './slider.source';

const meta: Meta = {
  title: 'UI/Slider/Compositions',
  component: SliderStory,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para VolumeWithValue, que é a forma canônica; as outras três
      // sobrescrevem com a sua própria composição logo abaixo.
      source: { transform: sliderSource },
      description: {
        component:
          'Padrões de composição do Slider: volume com valor adjacente, faixa de preço (range), em formulário e com step grosso.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const VolumeWithValue: Story = {
  args: {
    value: [50],
    min: 0,
    max: 100,
    step: 1,
    'aria-label': 'Volume',
    label: 'Volume',
    showValue: true,
    valueSuffix: '%',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Slider com label "Volume" e valor textual ao lado (aria-live=polite) — padrão recomendado.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O texto do valor acompanha a alça', async () => {
      // Re-consulta antes de focar: o nó pode ter sido substituído pela
      // renderização, e focar no nó destacado não faz nada — o foco ficava no
      // BODY e a tecla não chegava no slider.
      const live = canvasElement.querySelector<HTMLElement>('[aria-live="polite"]')!;
      const alvo = canvas.getByRole('slider') as HTMLElement;
      const antes = handleValue(alvo);
      alvo.focus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(live).toHaveTextContent(`${Math.min(100, antes + 1)}%`);
    });
  },
};

export const PriceRange: Story = {
  args: {
    value: [100, 400],
    min: 0,
    max: 500,
    step: 10,
    'aria-label': 'Faixa de preço',
    label: 'Faixa de preço',
    showRangeValue: true,
    valueSuffix: '',
    rangePrefix: 'R$ ',
  },
  parameters: {
    docs: {
      source: { transform: precoSliderRangeSource },
      description: {
        story:
          'Range slider para min/max — dois thumbs com valor textual no formato "R$ 100 — R$ 400".',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('2 thumbs renderizados', async () => {
      await expect(canvas.getAllByRole('slider')).toHaveLength(2);
    });

    await step('Valor textual no formato min — max', async () => {
      await expect(canvas.getByText(/R\$ 100 — R\$ 400/)).toBeVisible();
    });
  },
};

export const InForm: Story = {
  render: () => ({
    Component: SliderFormStory as never,
    props: {} as never,
  }),
  parameters: {
    docs: {
      source: { transform: formSliderSource },
      description: {
        story:
          'Múltiplos sliders dentro de um formulário (Brilho + Opacidade) com campo de texto e submit.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Formulário tem campo de texto e dois sliders', async () => {
      await expect(canvas.getByLabelText(/Nome do preset/)).toBeInTheDocument();
      await expect(canvas.getAllByRole('slider')).toHaveLength(2);
    });

    await step('Cada slider tem nome acessível próprio', async () => {
      const thumbs = canvas.getAllByRole('slider');
      await expect(thumbs[0]).toHaveAttribute('aria-label', 'Brilho');
      await expect(thumbs[1]).toHaveAttribute('aria-label', 'Opacidade');
    });

    await step('Submeter guarda o valor corrente dos dois', async () => {
      const thumbs = canvas.getAllByRole('slider');
      const brilho = handleValue(thumbs[0]);
      const opacidade = handleValue(thumbs[1]);
      await userEvent.click(canvas.getByRole('button', { name: 'Salvar preset' }));
      await expect(
        canvas.getByText(`Brilho ${brilho}% · Opacidade ${opacidade}%`),
      ).toBeVisible();
    });
  },
};

export const ThickStep: Story = {
  args: {
    value: [3],
    min: 1,
    max: 5,
    step: 1,
    'aria-label': 'Avaliação',
    label: 'Avaliação',
    showValue: true,
    valueSuffix: ' / 5',
  },
  parameters: {
    docs: {
      source: { transform: sliderEscalaCurtaSource },
      description: {
        story:
          'step=1 numa faixa pequena (1–5) — útil para escalas discretas como avaliação.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A faixa curta chega à árvore de acessibilidade', async () => {
      const alca = canvas.getByRole('slider');
      await expect(alca).toHaveAttribute('aria-valuemin', '1');
      await expect(alca).toHaveAttribute('aria-valuemax', '5');
    });

    await step('ArrowRight anda um passo dentro da faixa curta', async () => {
      const alvo = canvas.getByRole('slider') as HTMLElement;
      const antes = handleValue(alvo);
      alvo.focus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(handleValue(canvas.getByRole('slider'))).toBe(Math.min(5, antes + 1));
    });
  },
};
