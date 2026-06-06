import type { Meta, StoryObj } from '@storybook/svelte';

import { within, expect } from 'storybook/test';
import ProgressStory from './ProgressStory.svelte';

const meta = {
  title: 'UI/Progress/Variantes',
  component: ProgressStory,
  tags: ['feedback'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Variantes do Progress — determinate (valor 0–100), indeterminate (value=null + animação infinita) e with label (rótulo + porcentagem acima da trilha).',
      },
    },
  },
} satisfies Meta<typeof ProgressStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Determinate: Story = {
  args: {
    value: 42,
    'aria-label': 'Progresso do upload',
  },
  parameters: {
    docs: {
      description: {
        story: 'Valor numérico 0–100. A barra é preenchida proporcionalmente.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('role=progressbar com aria-valuenow=42', async () => {
      const bar = canvas.getByRole('progressbar');
      await expect(bar).toHaveAttribute('aria-valuenow', '42');
    });
  },
};

export const Indeterminate: Story = {
  args: {
    value: null,
    'aria-label': 'Processando dados',
    class: '[&>div]:animate-indeterminate',
  },
  parameters: {
    docs: {
      description: {
        story:
          'value=null + classe [&>div]:animate-indeterminate — barra animada sem fim definido, para duração desconhecida.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('role=progressbar sem aria-valuenow', async () => {
      const bar = canvas.getByRole('progressbar');
      await expect(bar).toBeInTheDocument();
      await expect(bar).not.toHaveAttribute('aria-valuenow');
    });
    await step('Classe animate-indeterminate aplicada no indicador', async () => {
      const bar = canvasElement.querySelector('[data-slot="progress"]') as HTMLElement;
      await expect(bar.className).toMatch(/animate-indeterminate/);
    });
  },
};

export const WithLabel: Story = {
  args: {
    value: 42,
    'aria-label': 'Enviando arquivo',
    showLabel: true,
    label: 'Enviando arquivo',
    showValue: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Rótulo descritivo + porcentagem (aria-live=polite) acima da trilha. Combinação recomendada para uploads e tarefas longas.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Label visível', async () => {
      await expect(canvas.getByText('Enviando arquivo')).toBeVisible();
    });
    await step('Valor 42% visível com aria-live polite', async () => {
      const valueEl = canvas.getByText('42%');
      await expect(valueEl).toBeVisible();
      await expect(valueEl).toHaveAttribute('aria-live', 'polite');
    });
  },
};
