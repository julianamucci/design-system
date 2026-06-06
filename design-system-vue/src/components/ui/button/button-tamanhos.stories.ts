import type { Meta, StoryObj } from '@storybook/vue3';
import { within, expect } from 'storybook/test';
import { Plus } from 'lucide-vue-next';
import { Button } from './index';

const meta: Meta<any> = {
  title: 'UI/Button/Tamanhos',
  component: Button,
  tags: ['form'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { Button },
    template: '<Button>Padrão (h-9)</Button>',
  }),
  parameters: { docs: { description: { story: 'Tamanho padrão (36px). Use em formulários e diálogos como default.' } } },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};

export const Small: Story = {
  render: () => ({
    components: { Button },
    template: '<Button size="sm">Pequeno (h-8)</Button>',
  }),
  parameters: { docs: { description: { story: 'Tamanho pequeno (32px). Use em toolbars e áreas densas.' } } },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};

export const Large: Story = {
  render: () => ({
    components: { Button },
    template: '<Button size="lg">Grande (h-10)</Button>',
  }),
  parameters: { docs: { description: { story: 'Tamanho grande (40px). Use em CTAs de destaque e hero sections.' } } },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};

const iconAriaLabelPlay: Story['play'] = async ({ canvasElement, step }) => {
  const canvas = within(canvasElement);
  await step('Botão icon-only é acessível via aria-label', async () => {
    const button = canvas.getByRole('button', { name: 'Adicionar item' });
    await expect(button).toBeInTheDocument();
  });
};

export const Icon: Story = {
  render: () => ({
    components: { Button, Plus },
    template: `
      <Button size="icon" aria-label="Adicionar item">
        <Plus aria-hidden="true" />
      </Button>
    `,
  }),
  parameters: { docs: { description: { story: 'Botão ícone padrão (36×36). Sempre forneça aria-label descritivo.' } } },
  play: iconAriaLabelPlay,
};

export const IconSmall: Story = {
  render: () => ({
    components: { Button, Plus },
    template: `
      <Button size="icon-sm" aria-label="Adicionar item">
        <Plus aria-hidden="true" />
      </Button>
    `,
  }),
  parameters: { docs: { description: { story: 'Botão ícone pequeno (32×32). Use em toolbars compactas.' } } },
  play: iconAriaLabelPlay,
};

export const IconLarge: Story = {
  render: () => ({
    components: { Button, Plus },
    template: `
      <Button size="icon-lg" aria-label="Adicionar item">
        <Plus aria-hidden="true" />
      </Button>
    `,
  }),
  parameters: { docs: { description: { story: 'Botão ícone grande (40×40). Use como FAB ou CTAs visuais.' } } },
  play: iconAriaLabelPlay,
};
