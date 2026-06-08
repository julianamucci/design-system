import type { Meta, StoryObj } from '@storybook/svelte';

import { within, expect } from 'storybook/test';
import { Checkbox } from './index';
import CheckboxStory from './CheckboxStory.svelte';

const meta = {
  title: 'UI/Checkbox/Variantes',
  component: Checkbox,
  tags: ['form'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Composicoes visuais do Checkbox. Não possui variantes cva — as composições abaixo representam os padrões de uso mais comuns.',
      },
    },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    Component: CheckboxStory,
    props: {
      checked: false,
      withLabel: false,
      id: 'var-default',
    },
  }),
  parameters: {
    docs: {
      description: {
        story: 'Estado desmarcado padrão. Borda `--input`, fundo transparente. Pronto para interação.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Checkbox está presente no DOM', async () => {
      const checkbox = canvas.getByRole('checkbox');
      await expect(checkbox).toBeInTheDocument();
    });

    await step('Checkbox está no estado desmarcado', async () => {
      const checkbox = canvas.getByRole('checkbox');
      await expect(checkbox).not.toBeChecked();
      await expect(checkbox).toHaveAttribute('aria-checked', 'false');
    });
  },
};

export const Checked: Story = {
  render: () => ({
    Component: CheckboxStory,
    props: {
      checked: true,
      withLabel: false,
      id: 'var-checked',
    },
  }),
  parameters: {
    docs: {
      description: {
        story: 'Estado marcado. Fundo `--primary`, ícone `CheckIcon` em `--primary-foreground`.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Checkbox está presente no DOM', async () => {
      const checkbox = canvas.getByRole('checkbox');
      await expect(checkbox).toBeInTheDocument();
    });

    await step('Checkbox está no estado marcado', async () => {
      const checkbox = canvas.getByRole('checkbox');
      await expect(checkbox).toBeChecked();
      await expect(checkbox).toHaveAttribute('aria-checked', 'true');
    });
  },
};

export const Indeterminate: Story = {
  render: () => ({
    Component: CheckboxStory,
    props: {
      checked: false,
      indeterminate: true,
      withLabel: false,
      id: 'var-indeterminate',
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Seleção parcial de grupo. Fundo `--primary`, ícone `MinusIcon`. Disponível apenas no Svelte via prop `indeterminate`.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Checkbox está presente no DOM', async () => {
      const checkbox = canvas.getByRole('checkbox');
      await expect(checkbox).toBeInTheDocument();
    });

    await step('Checkbox tem aria-checked="mixed" (estado indeterminado)', async () => {
      const checkbox = canvas.getByRole('checkbox');
      await expect(checkbox).toHaveAttribute('aria-checked', 'mixed');
    });
  },
};

export const ComLabel: Story = {
  render: () => ({
    Component: CheckboxStory,
    props: {
      checked: false,
      withLabel: true,
      labelText: 'Aceito os termos e condições',
      id: 'var-with-label',
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Checkbox + Label lado a lado. Par obrigatório — sempre usar `for`/`id` para associação.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Checkbox está associado à label via for/id', async () => {
      const checkbox = canvas.getByRole('checkbox', { name: 'Aceito os termos e condições' });
      await expect(checkbox).toBeInTheDocument();
    });

    await step('Label está visível', async () => {
      const label = canvas.getByText('Aceito os termos e condições');
      await expect(label).toBeVisible();
    });
  },
};

export const ComDescricao: Story = {
  render: () => ({
    Component: CheckboxStory,
    props: {
      checked: false,
      withLabel: false,
      withDescription: true,
      labelText: 'Receber novidades por email',
      descriptionText:
        'Ao marcar esta opção, você concorda em receber comunicações de marketing.',
      id: 'var-with-desc',
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Checkbox + Label + texto auxiliar abaixo. Para contexto adicional sobre a opção selecionada.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Checkbox está presente no DOM', async () => {
      const checkbox = canvas.getByRole('checkbox');
      await expect(checkbox).toBeInTheDocument();
    });

    await step('Texto de descrição auxiliar está visível', async () => {
      const desc = canvas.getByText('Ao marcar esta opção, você concorda em receber comunicações de marketing.');
      await expect(desc).toBeVisible();
    });

    await step('Checkbox tem aria-describedby associado', async () => {
      const checkbox = canvas.getByRole('checkbox');
      await expect(checkbox).toHaveAttribute('aria-describedby', 'var-with-desc-description');
    });
  },
};
