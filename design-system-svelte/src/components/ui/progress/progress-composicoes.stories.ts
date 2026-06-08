import type { Meta, StoryObj } from '@storybook/svelte';

import { within, expect } from 'storybook/test';
import ProgressStory from './ProgressStory.svelte';

const meta = {
  title: 'UI/Progress/Composicoes',
  component: ProgressStory,
  tags: ['feedback'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes comuns: upload animado com label/valor, loading simples, conclusão em cor de sucesso e processamento indeterminate.',
      },
    },
  },
} satisfies Meta<typeof ProgressStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const UploadAnimado: Story = {
  args: {
    value: 0,
    'aria-label': 'Enviando arquivo',
    animated: true,
    intervalMs: 500,
    step: 5,
    showLabel: true,
    label: 'Enviando arquivo',
    showValue: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Upload com label "Enviando arquivo" + porcentagem viva (aria-live=polite). Valor incrementa 5% a cada 500ms.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Label e role=progressbar presentes', async () => {
      await expect(canvas.getByText('Enviando arquivo')).toBeVisible();
      await expect(canvas.getByRole('progressbar')).toBeInTheDocument();
    });
  },
};

export const LoadingSimples: Story = {
  args: {
    value: 35,
    'aria-label': 'Carregando dados',
  },
  parameters: {
    docs: {
      description: {
        story: 'Progress sem label/valor — apenas indicação visual da operação em curso.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('aria-label="Carregando dados"', async () => {
      const bar = canvas.getByRole('progressbar');
      await expect(bar).toHaveAttribute('aria-label', 'Carregando dados');
    });
  },
};

export const ConclusaoSucesso: Story = {
  args: {
    value: 100,
    'aria-label': 'Operação concluída',
    class: '[&>div]:bg-success',
    showLabel: true,
    label: 'Concluído',
    showValue: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'value=100 com cor de sucesso customizada via [&>div]:bg-success. Combinação útil antes de remover o componente ou exibir mensagem final.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('aria-valuenow=100 e label "Concluído"', async () => {
      const bar = canvas.getByRole('progressbar');
      await expect(bar).toHaveAttribute('aria-valuenow', '100');
      await expect(canvas.getByText('Concluído')).toBeVisible();
    });
  },
};

export const ProcessandoIndeterminate: Story = {
  args: {
    value: null,
    'aria-label': 'Processando…',
    class: '[&>div]:animate-indeterminate',
    showLabel: true,
    label: 'Processando…',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Processamento sem progresso mensurável — value=null + classe animate-indeterminate. Label descreve a operação enquanto não há porcentagem.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('role=progressbar sem aria-valuenow + label visível', async () => {
      const bar = canvas.getByRole('progressbar');
      await expect(bar).not.toHaveAttribute('aria-valuenow');
      await expect(canvas.getByText('Processando…')).toBeVisible();
    });
  },
};
