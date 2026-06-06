import type { Meta, StoryObj } from '@storybook/vue3';
import { fn, userEvent, within, expect } from 'storybook/test';
import { Loader2 } from 'lucide-vue-next';
import { Button } from './index';

const meta: Meta<any> = {
  title: 'UI/Button/Estados',
  component: Button,
  tags: ['form'],
  args: {
    onClick: fn(),
  } as never,
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Disabled: Story = {
  render: (args) => ({
    components: { Button },
    setup() { return { args }; },
    template: '<Button v-bind="args" disabled @click="args.onClick">Salvar</Button>',
  }),
  parameters: { docs: { description: { story: 'Estado desabilitado. Previne cliques e reduz opacidade para 50%.' } } },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    await step('Botão possui atributo disabled', async () => {
      await expect(button).toBeDisabled();
    });

    await step('Clique não dispara onClick quando disabled', async () => {
      await userEvent.click(button, { pointerEventsCheck: 0 });
      await expect((args as { onClick: ReturnType<typeof fn> }).onClick).not.toHaveBeenCalled();
    });
  },
};

export const Loading: Story = {
  render: () => ({
    components: { Button, Loader2 },
    template: `
      <Button disabled aria-busy="true">
        <Loader2 aria-hidden="true" class="animate-spin" />
        Salvando…
      </Button>
    `,
  }),
  parameters: { docs: { description: { story: 'Estado de carregamento. Use disabled + aria-busy e substitua o label por estado progressivo.' } } },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    await step('Botão tem aria-busy durante loading', async () => {
      await expect(button).toHaveAttribute('aria-busy', 'true');
    });

    await step('Botão está desabilitado durante loading', async () => {
      await expect(button).toBeDisabled();
    });
  },
};

export const FocusVisible: Story = {
  render: () => ({
    components: { Button },
    template: '<Button>Foco visível</Button>',
  }),
  parameters: { docs: { description: { story: 'Estado de foco via teclado. Use Tab para navegar e verificar o ring-[3px] de foco.' } } },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button') as HTMLElement;

    await step('Botão recebe foco via teclado', async () => {
      button.focus();
      await expect(button).toHaveFocus();
    });
  },
};

export const Invalid: Story = {
  render: () => ({
    components: { Button },
    template: '<Button variant="outline" aria-invalid="true">Formulário inválido</Button>',
  }),
  parameters: { docs: { description: { story: 'Estado inválido. Use aria-invalid="true" para sinalizar problemas de validação.' } } },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    await step('Botão tem aria-invalid=true', async () => {
      await expect(button).toHaveAttribute('aria-invalid', 'true');
    });
  },
};
