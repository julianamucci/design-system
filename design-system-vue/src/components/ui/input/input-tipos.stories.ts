import type { Meta, StoryObj } from '@storybook/vue3';
import { within, expect } from 'storybook/test';
import { Input } from './index';

const meta = {
  title: 'UI/Input/Tipos',
  component: Input,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'O Input não tem variantes via prop — a aparência e o comportamento mudam conforme o atributo `type` HTML. Use sempre o tipo semântico correto para cada campo.',
      },
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Texto: Story = {
  render: () => ({
    components: { Input },
    template: '<div class="w-64"><Input type="text" placeholder="ex: João da Silva" /></div>',
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Input type=text está renderizado', async () => {
      const input = canvas.getByRole('textbox');
      await expect(input).toHaveAttribute('type', 'text');
    });
  },
};

export const Email: Story = {
  render: () => ({
    components: { Input },
    template: '<div class="w-64"><Input type="email" placeholder="ex: joao@empresa.com" /></div>',
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Input type=email está renderizado', async () => {
      const input = canvasElement.querySelector('input[type="email"]') as HTMLInputElement;
      await expect(input).toBeTruthy();
      await expect(input).toHaveAttribute('type', 'email');
    });
  },
};

export const Senha: Story = {
  render: () => ({
    components: { Input },
    template: '<div class="w-64"><Input type="password" placeholder="Mínimo 8 caracteres" /></div>',
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Input type=password está renderizado', async () => {
      const input = canvasElement.querySelector('input[type="password"]') as HTMLInputElement;
      await expect(input).toBeTruthy();
      await expect(input).toHaveAttribute('type', 'password');
    });
  },
};

export const Numero: Story = {
  render: () => ({
    components: { Input },
    template: '<div class="w-64"><Input type="number" placeholder="ex: 42" /></div>',
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Input type=number está renderizado', async () => {
      const input = canvasElement.querySelector('input[type="number"]') as HTMLInputElement;
      await expect(input).toBeTruthy();
      await expect(input).toHaveAttribute('type', 'number');
    });
  },
};

export const Arquivo: Story = {
  render: () => ({
    components: { Input },
    template: '<div class="w-64"><label for="arquivo-input" class="block text-sm font-medium mb-1">Anexar arquivo</label><Input id="arquivo-input" type="file" /></div>',
  }),
  play: async ({ canvasElement, step }) => {
    await step('Input type=file está renderizado', async () => {
      const input = canvasElement.querySelector('input[type="file"]') as HTMLInputElement;
      await expect(input).toBeTruthy();
      await expect(input).toHaveAttribute('data-slot', 'input');
    });
  },
};
