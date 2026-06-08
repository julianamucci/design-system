import type { Meta, StoryObj } from '@storybook/svelte';

import { userEvent, within, expect } from 'storybook/test';
import { Checkbox } from './index';
import CheckboxStory from './CheckboxStory.svelte';

const meta = {
  title: 'UI/Checkbox/Composicoes',
  component: Checkbox,
  tags: ['form'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Composicoes do Checkbox com Label, descrição auxiliar e uso em grupo com fieldset.',
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
      id: 'cb-default',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Checkbox está presente no DOM', async () => {
      const checkbox = canvas.getByRole('checkbox');
      await expect(checkbox).toBeInTheDocument();
    });

    await step('Checkbox começa desmarcado', async () => {
      const checkbox = canvas.getByRole('checkbox');
      await expect(checkbox).not.toBeChecked();
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
      id: 'cb-com-label',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Checkbox está associado à label via htmlFor/id', async () => {
      const checkbox = canvas.getByRole('checkbox', { name: 'Aceito os termos e condições' });
      await expect(checkbox).toBeInTheDocument();
    });

    await step('Label está visível', async () => {
      const label = canvas.getByText('Aceito os termos e condições');
      await expect(label).toBeVisible();
    });

    await step('Checkbox começa desmarcado', async () => {
      const checkbox = canvas.getByRole('checkbox');
      await expect(checkbox).not.toBeChecked();
    });

    await step('Clicar na label alterna o checkbox', async () => {
      const label = canvas.getByText('Aceito os termos e condições');
      await userEvent.click(label);
      const checkbox = canvas.getByRole('checkbox');
      await expect(checkbox).toBeChecked();
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
      descriptionText: 'Ao marcar esta opção, você concorda em receber comunicações de marketing.',
      id: 'cb-com-descricao',
    },
  }),
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

    await step('Label está visível e associada', async () => {
      const label = canvas.getByText('Receber novidades por email');
      await expect(label).toBeVisible();
    });

    await step('Checkbox tem aria-describedby associado à descrição', async () => {
      const checkbox = canvas.getByRole('checkbox');
      await expect(checkbox).toHaveAttribute('aria-describedby', 'cb-com-descricao-description');
    });
  },
};

export const ComLabelChecked: Story = {
  render: () => ({
    Component: CheckboxStory,
    props: {
      checked: true,
      withLabel: true,
      labelText: 'Manter sessão ativa',
      id: 'cb-label-checked',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Checkbox está presente no DOM', async () => {
      const checkbox = canvas.getByRole('checkbox', { name: 'Manter sessão ativa' });
      await expect(checkbox).toBeInTheDocument();
    });

    await step('Checkbox começa marcado', async () => {
      const checkbox = canvas.getByRole('checkbox');
      await expect(checkbox).toBeChecked();
    });
  },
};

export const Indeterminate: Story = {
  render: () => ({
    Component: CheckboxStory,
    props: {
      checked: false,
      indeterminate: true,
      withLabel: true,
      labelText: 'Selecionar todos os itens',
      id: 'cb-indeterminate-comp',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Checkbox indeterminado está presente no DOM', async () => {
      const checkbox = canvas.getByRole('checkbox', { name: 'Selecionar todos os itens' });
      await expect(checkbox).toBeInTheDocument();
    });

    await step('Checkbox tem aria-checked="mixed"', async () => {
      const checkbox = canvas.getByRole('checkbox');
      await expect(checkbox).toHaveAttribute('aria-checked', 'mixed');
    });
  },
};
