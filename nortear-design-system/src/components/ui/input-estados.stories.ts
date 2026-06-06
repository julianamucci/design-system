import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import { createInput } from './input';

const meta: Meta = {
  tags: ['form'],
  title: 'UI/Input/Estados',
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
    docs: {
      description: {
        component: 'Estados do Input: padrão, desabilitado, erro (aria-invalid) e com placeholder.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Padrao: Story = {
  render: () => createInput({ type: 'text', placeholder: 'ex: João da Silva' }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Input padrão presente e habilitado', async () => {
      const input = canvas.getByRole('textbox');
      await expect(input).toBeInTheDocument();
      await expect(input).not.toBeDisabled();
    });
    await step('Sem aria-invalid no estado padrão', async () => {
      const input = canvas.getByRole('textbox');
      await expect(input).not.toHaveAttribute('aria-invalid', 'true');
    });
  },
};

export const Desabilitado: Story = {
  render: () => createInput({ type: 'text', placeholder: 'Não disponível', disabled: true }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Input possui atributo disabled', async () => {
      const input = canvas.getByRole('textbox');
      await expect(input).toBeDisabled();
    });
  },
};

export const Erro: Story = {
  render: () => {
    const input = createInput({ type: 'email', placeholder: 'ex: joao@empresa.com' });
    input.setAttribute('aria-invalid', 'true');
    return input;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Input possui aria-invalid="true"', async () => {
      const input = canvas.getByRole('textbox');
      await expect(input).toHaveAttribute('aria-invalid', 'true');
    });
  },
};

export const ComPlaceholder: Story = {
  render: () => createInput({ type: 'text', placeholder: 'Buscar componentes...' }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Input com placeholder visível', async () => {
      const input = canvas.getByPlaceholderText('Buscar componentes...');
      await expect(input).toBeInTheDocument();
    });
  },
};
