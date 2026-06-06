import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import { createInput } from './input';

const meta: Meta = {
  tags: ['form'],
  title: 'UI/Input/Tipos',
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
    docs: {
      description: {
        component: 'Tipos HTML disponíveis para o Input. Use sempre o tipo semântico correto para o dado esperado.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Texto: Story = {
  render: () => createInput({ type: 'text', placeholder: 'ex: João da Silva' }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Input do tipo text renderizado', async () => {
      const input = canvas.getByRole('textbox');
      await expect(input).toBeInTheDocument();
      await expect(input).toHaveAttribute('type', 'text');
    });
  },
};

export const Email: Story = {
  render: () => createInput({ type: 'email', placeholder: 'ex: joao@empresa.com' }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Input do tipo email renderizado', async () => {
      const input = canvas.getByRole('textbox');
      await expect(input).toHaveAttribute('type', 'email');
    });
  },
};

export const Senha: Story = {
  render: () => createInput({ type: 'password', placeholder: 'Mínimo 8 caracteres' }),
  play: async ({ canvasElement, step }) => {
    await step('Input do tipo password renderizado', async () => {
      const input = canvasElement.querySelector('input[type="password"]') as HTMLInputElement;
      await expect(input).toBeInTheDocument();
    });
  },
};

export const Numero: Story = {
  render: () => createInput({ type: 'number', placeholder: '0' }),
  play: async ({ canvasElement, step }) => {
    await step('Input do tipo number renderizado', async () => {
      const input = canvasElement.querySelector('input[type="number"]') as HTMLInputElement;
      await expect(input).toBeInTheDocument();
    });
  },
};

export const Arquivo: Story = {
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-stack';
    wrapper.dataset.spacing = 'xs';
    const id = 'input-file-arquivo';
    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = 'Anexar arquivo';
    label.className = 'nds-text-body nds-font-medium';
    const input = createInput({ type: 'file' });
    (input as HTMLInputElement).id = id;
    wrapper.append(label, input);
    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    await step('Input do tipo file renderizado', async () => {
      const input = canvasElement.querySelector('input[type="file"]') as HTMLInputElement;
      await expect(input).toBeInTheDocument();
    });
  },
};
