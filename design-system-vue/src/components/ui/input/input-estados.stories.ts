import type { Meta, StoryObj } from '@storybook/vue3';
import { userEvent, within, expect } from 'storybook/test';
import { Input } from './index';

const meta = {
  title: 'UI/Input/Estados',
  component: Input,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'O Input possui 4 estados visuais: padrão, desabilitado, erro (aria-invalid) e com placeholder. Os estilos de cada estado são controlados por tokens de tema.',
      },
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {
  render: () => ({
    components: { Input },
    template: '<div class="w-64"><Input type="text" placeholder="ex: João da Silva" /></div>',
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Input padrão está visível com data-slot', async () => {
      const input = canvas.getByRole('textbox');
      await expect(input).toBeVisible();
      await expect(input).toHaveAttribute('data-slot', 'input');
    });
    await step('Input padrão não está desabilitado', async () => {
      const input = canvas.getByRole('textbox');
      await expect(input).not.toBeDisabled();
    });
  },
};

export const ComPlaceholder: Story = {
  render: () => ({
    components: { Input },
    template: '<div class="w-64"><Input type="text" placeholder="Buscar componentes..." /></div>',
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Placeholder está definido no input', async () => {
      const input = canvas.getByPlaceholderText('Buscar componentes...');
      await expect(input).toBeVisible();
    });
  },
};

export const Desabilitado: Story = {
  render: () => ({
    components: { Input },
    template: '<div class="w-64"><Input type="text" placeholder="Não disponível" disabled /></div>',
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Input está desabilitado', async () => {
      const input = canvas.getByRole('textbox');
      await expect(input).toBeDisabled();
    });
    await step('Não é possível digitar no input desabilitado', async () => {
      const input = canvas.getByRole('textbox');
      await userEvent.click(input, { pointerEventsCheck: 0 });
      await expect(input).toHaveValue('');
    });
  },
};

export const Erro: Story = {
  render: () => ({
    components: { Input },
    template: `
      <div class="w-64 space-y-1.5">
        <Input type="email" placeholder="ex: joao@empresa.com" aria-invalid="true" />
        <p class="text-sm text-destructive">Email inválido. Use o formato nome@dominio.com</p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Input com aria-invalid="true" está renderizado', async () => {
      const input = canvasElement.querySelector('input[aria-invalid="true"]') as HTMLInputElement;
      await expect(input).toBeTruthy();
      await expect(input).toHaveAttribute('aria-invalid', 'true');
    });
    await step('Mensagem de erro está visível', async () => {
      const msg = canvas.getByText(/Email inválido/);
      await expect(msg).toBeVisible();
    });
  },
};
