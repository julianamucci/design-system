import type { Meta, StoryObj } from '@storybook/svelte';

import { userEvent, within, expect } from 'storybook/test';
import SliderStory from './SliderStory.svelte';
import SliderFormStory from './SliderFormStory.svelte';

const meta = {
  title: 'UI/Slider/Composicoes',
  component: SliderStory,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Padrões de composição do Slider: volume com valor adjacente, faixa de preço (range), em formulário e com step grosso.',
      },
    },
  },
} satisfies Meta<typeof SliderStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const VolumeComValor: Story = {
  args: {
    value: [50],
    min: 0,
    max: 100,
    step: 1,
    'aria-label': 'Volume',
    label: 'Volume',
    showValue: true,
    valueSuffix: '%',
    width: 'w-80',
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
    const thumb = canvas.getByRole('slider');

    await step('Valor textual visível', async () => {
      await expect(canvas.getByText('50%')).toBeVisible();
    });

    await step('Após ArrowRight, aria-valuenow reflete mudança', async () => {
      (thumb as HTMLElement).focus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(thumb).toHaveAttribute('aria-valuenow', '51');
    });
  },
};

export const FaixaDePreco: Story = {
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
    width: 'w-80',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Range slider para min/max — dois thumbs com valor textual no formato "R$ 100 — R$ 400".',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const thumbs = canvas.getAllByRole('slider');

    await step('2 thumbs renderizados', async () => {
      await expect(thumbs).toHaveLength(2);
    });

    await step('Valor textual no formato min — max', async () => {
      await expect(canvas.getByText(/R\$ 100 — R\$ 400/)).toBeVisible();
    });
  },
};

export const EmFormulario: Story = {
  render: () => ({
    Component: SliderFormStory as never,
    props: {} as never,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Múltiplos sliders dentro de um formulário (Brilho + Opacidade) com input de texto e submit.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const thumbs = canvas.getAllByRole('slider');

    await step('Formulário tem input de texto e 2 sliders', async () => {
      await expect(canvas.getByLabelText(/Nome do preset/)).toBeInTheDocument();
      await expect(thumbs).toHaveLength(2);
    });

    await step('Cada slider tem aria-valuenow distinto', async () => {
      await expect(thumbs[0]).toHaveAttribute('aria-valuenow', '70');
      await expect(thumbs[1]).toHaveAttribute('aria-valuenow', '100');
    });

    await step('Botão de submit presente', async () => {
      await expect(canvas.getByRole('button', { name: 'Salvar preset' })).toBeInTheDocument();
    });
  },
};

export const StepGrosso: Story = {
  args: {
    value: [3],
    min: 1,
    max: 5,
    step: 1,
    'aria-label': 'Avaliação',
    label: 'Avaliação',
    showValue: true,
    valueSuffix: ' / 5',
    width: 'w-80',
  },
  parameters: {
    docs: {
      description: {
        story:
          'step=1 numa faixa pequena (1–5) — útil para escalas discretas como avaliação.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const thumb = canvas.getByRole('slider');

    await step('aria-valuemin=1 e aria-valuemax=5', async () => {
      await expect(thumb).toHaveAttribute('aria-valuemin', '1');
      await expect(thumb).toHaveAttribute('aria-valuemax', '5');
    });

    await step('ArrowRight com step=1 incrementa para 4', async () => {
      (thumb as HTMLElement).focus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(thumb).toHaveAttribute('aria-valuenow', '4');
    });
  },
};
