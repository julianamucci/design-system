import type { Meta, StoryObj } from '@storybook/vue3';
import { userEvent, within, expect } from 'storybook/test';
import { ToggleGroup, ToggleGroupItem } from './index';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-vue-next';

const meta = {
  title: 'UI/ToggleGroup/Estados',
  component: ToggleGroup,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Estados do ToggleGroup: default, selected (aria-pressed=true), hover, focus (roving tabindex) e disabled.',
      },
    },
  },
} satisfies Meta<typeof ToggleGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { ToggleGroup, ToggleGroupItem, AlignLeft, AlignCenter, AlignRight },
    setup() { return {}; },
    template: `
      <ToggleGroup type="single" aria-label="Alinhamento do texto">
        <ToggleGroupItem value="left" aria-label="Alinhar à esquerda"><AlignLeft aria-hidden="true" /></ToggleGroupItem>
        <ToggleGroupItem value="center" aria-label="Centralizar"><AlignCenter aria-hidden="true" /></ToggleGroupItem>
        <ToggleGroupItem value="right" aria-label="Alinhar à direita"><AlignRight aria-hidden="true" /></ToggleGroupItem>
      </ToggleGroup>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const left = canvas.getByRole('button', { name: 'Alinhar à esquerda' });
    await step('Todos itens começam não-pressionados', async () => {
      await expect(left).toHaveAttribute('aria-pressed', 'false');
      await expect(left).toHaveAttribute('data-state', 'off');
    });
  },
};

export const Selected: Story = {
  render: () => ({
    components: { ToggleGroup, ToggleGroupItem, AlignLeft, AlignCenter, AlignRight },
    setup() { return {}; },
    template: `
      <ToggleGroup type="single" default-value="center" aria-label="Alinhamento do texto">
        <ToggleGroupItem value="left" aria-label="Alinhar à esquerda"><AlignLeft aria-hidden="true" /></ToggleGroupItem>
        <ToggleGroupItem value="center" aria-label="Centralizar"><AlignCenter aria-hidden="true" /></ToggleGroupItem>
        <ToggleGroupItem value="right" aria-label="Alinhar à direita"><AlignRight aria-hidden="true" /></ToggleGroupItem>
      </ToggleGroup>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const center = canvas.getByRole('button', { name: 'Centralizar' });
    await step('Item selecionado tem aria-pressed=true e data-state=on', async () => {
      await expect(center).toHaveAttribute('aria-pressed', 'true');
      await expect(center).toHaveAttribute('data-state', 'on');
    });
  },
};

export const FocoVisivel: Story = {
  render: () => ({
    components: { ToggleGroup, ToggleGroupItem, AlignLeft, AlignCenter, AlignRight },
    setup() { return {}; },
    template: `
      <ToggleGroup type="single" aria-label="Alinhamento do texto">
        <ToggleGroupItem value="left" aria-label="Alinhar à esquerda"><AlignLeft aria-hidden="true" /></ToggleGroupItem>
        <ToggleGroupItem value="center" aria-label="Centralizar"><AlignCenter aria-hidden="true" /></ToggleGroupItem>
        <ToggleGroupItem value="right" aria-label="Alinhar à direita"><AlignRight aria-hidden="true" /></ToggleGroupItem>
      </ToggleGroup>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Foco via teclado com roving tabindex: Tab entra no grupo, setas movem o foco. Ring-3 ring-ring/50 visível.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const left = canvas.getByRole('button', { name: 'Alinhar à esquerda' });
    const center = canvas.getByRole('button', { name: 'Centralizar' });
    await step('Item recebe foco programaticamente', async () => {
      (left as HTMLElement).focus();
      await expect(left).toHaveFocus();
    });
    await step('ArrowRight move foco para o próximo item', async () => {
      await userEvent.keyboard('{ArrowRight}');
      await expect(center).toHaveFocus();
    });
  },
};

export const Disabled: Story = {
  render: () => ({
    components: { ToggleGroup, ToggleGroupItem, AlignLeft, AlignCenter, AlignRight },
    setup() { return {}; },
    template: `
      <ToggleGroup type="single" :disabled="true" aria-label="Alinhamento do texto">
        <ToggleGroupItem value="left" aria-label="Alinhar à esquerda"><AlignLeft aria-hidden="true" /></ToggleGroupItem>
        <ToggleGroupItem value="center" aria-label="Centralizar"><AlignCenter aria-hidden="true" /></ToggleGroupItem>
        <ToggleGroupItem value="right" aria-label="Alinhar à direita"><AlignRight aria-hidden="true" /></ToggleGroupItem>
      </ToggleGroup>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const left = canvas.getByRole('button', { name: 'Alinhar à esquerda' });
    await step('Itens estão disabled', async () => {
      await expect(left).toBeDisabled();
      await expect(left).toHaveAttribute('data-disabled');
    });
    await step('Clique não altera estado', async () => {
      await userEvent.click(left, { pointerEventsCheck: 0 });
      await expect(left).toHaveAttribute('aria-pressed', 'false');
    });
  },
};

export const ItemDisabled: Story = {
  render: () => ({
    components: { ToggleGroup, ToggleGroupItem, AlignLeft, AlignCenter, AlignRight },
    setup() { return {}; },
    template: `
      <ToggleGroup type="single" aria-label="Alinhamento do texto">
        <ToggleGroupItem value="left" aria-label="Alinhar à esquerda"><AlignLeft aria-hidden="true" /></ToggleGroupItem>
        <ToggleGroupItem value="center" :disabled="true" aria-label="Centralizar"><AlignCenter aria-hidden="true" /></ToggleGroupItem>
        <ToggleGroupItem value="right" aria-label="Alinhar à direita"><AlignRight aria-hidden="true" /></ToggleGroupItem>
      </ToggleGroup>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const left = canvas.getByRole('button', { name: 'Alinhar à esquerda' });
    const center = canvas.getByRole('button', { name: 'Centralizar' });
    await step('Apenas o item central está desabilitado', async () => {
      await expect(center).toBeDisabled();
      await expect(left).not.toBeDisabled();
    });
  },
};
