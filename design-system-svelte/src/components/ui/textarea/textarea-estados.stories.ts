import type { Meta, StoryObj } from '@storybook/svelte';

import { userEvent, within, expect } from 'storybook/test';
import TextareaStory from './TextareaStory.svelte';

const meta = {
  title: 'UI/Textarea/Estados',
  component: TextareaStory,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Estados do Textarea: default, filled, disabled, invalid (aria-invalid) e read-only.',
      },
    },
  },
} satisfies Meta<typeof TextareaStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {
  render: () => ({
    Component: TextareaStory,
    props: {
      id: 'estado-default',
      labelText: 'Descrição',
      placeholder: 'ex: Descreva o produto...',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Textarea visível e habilitado', async () => {
      const textarea = canvas.getByLabelText('Descrição');
      await expect(textarea).toBeVisible();
      await expect(textarea).not.toBeDisabled();
    });
  },
};

export const Filled: Story = {
  render: () => ({
    Component: TextareaStory,
    props: {
      id: 'estado-filled',
      labelText: 'Descrição',
      value: 'Camiseta de algodão pima, gola redonda, manga curta. Tamanhos P, M, G e GG.',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Textarea contém valor preenchido', async () => {
      const textarea = canvas.getByLabelText('Descrição') as HTMLTextAreaElement;
      await expect(textarea.value).toContain('Camiseta de algodão');
    });
  },
};

export const Disabled: Story = {
  render: () => ({
    Component: TextareaStory,
    props: {
      id: 'estado-disabled',
      labelText: 'Descrição',
      placeholder: 'Não disponível',
      disabled: true,
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Textarea está desabilitado', async () => {
      const textarea = canvas.getByLabelText('Descrição');
      await expect(textarea).toBeDisabled();
    });

    await step('Textarea desabilitado não aceita digitação', async () => {
      const textarea = canvas.getByLabelText('Descrição') as HTMLTextAreaElement;
      await userEvent.type(textarea, 'teste', { pointerEventsCheck: 0 });
      await expect(textarea.value).toBe('');
    });
  },
};

export const Invalid: Story = {
  render: () => ({
    Component: TextareaStory,
    props: {
      id: 'estado-invalid',
      labelText: 'Descrição',
      placeholder: 'ex: Descreva o produto...',
      'aria-invalid': 'true',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Textarea possui aria-invalid="true"', async () => {
      const textarea = canvas.getByLabelText('Descrição');
      await expect(textarea).toHaveAttribute('aria-invalid', 'true');
    });
  },
};

export const ReadOnly: Story = {
  render: () => ({
    Component: TextareaStory,
    props: {
      id: 'estado-readonly',
      labelText: 'Descrição',
      value: 'Este conteúdo é somente leitura — pode ser selecionado mas não editado.',
      readonly: true,
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Textarea possui atributo readonly', async () => {
      const textarea = canvas.getByLabelText('Descrição');
      await expect(textarea).toHaveAttribute('readonly');
    });

    await step('Textarea read-only não altera o valor ao digitar', async () => {
      const textarea = canvas.getByLabelText('Descrição') as HTMLTextAreaElement;
      const original = textarea.value;
      await userEvent.click(textarea);
      await userEvent.type(textarea, 'XX');
      await expect(textarea.value).toBe(original);
    });
  },
};
