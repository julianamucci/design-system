import type { Meta, StoryObj } from '@storybook/svelte';

import { within, expect } from 'storybook/test';
import TextareaStory from './TextareaStory.svelte';

const meta = {
  title: 'UI/Textarea/Variantes',
  component: TextareaStory,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Variantes do Textarea: default (resize-y), withCounter (maxLength + aria-live) e noResize (resize-none para modais).',
      },
    },
  },
} satisfies Meta<typeof TextareaStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    Component: TextareaStory,
    props: {
      id: 'var-default',
      labelText: 'Descrição',
      placeholder: 'ex: Descreva o produto...',
      resize: 'y',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Textarea default presente com resize-y', async () => {
      const textarea = canvas.getByLabelText('Descrição');
      await expect(textarea).toBeInTheDocument();
      await expect(textarea.className).toContain('resize-y');
    });
  },
};

export const WithCounter: Story = {
  render: () => ({
    Component: TextareaStory,
    props: {
      id: 'var-counter',
      labelText: 'Biografia',
      placeholder: 'Conte um pouco sobre você...',
      maxLength: 200,
      showCounter: true,
      helpText: 'Máximo de 200 caracteres.',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Contador é renderizado com aria-live="polite"', async () => {
      const counter = canvasElement.querySelector('[aria-live="polite"]');
      await expect(counter).not.toBeNull();
      await expect(counter?.textContent).toContain('/200');
    });

    await step('Contador possui aria-label descritivo', async () => {
      const counter = canvasElement.querySelector('[aria-live="polite"]') as HTMLElement;
      await expect(counter).toHaveAttribute('aria-label');
      await expect(counter.getAttribute('aria-label')).toMatch(/de 200 caracteres/);
    });

    await step('maxLength está aplicado no textarea', async () => {
      const textarea = canvas.getByLabelText('Biografia');
      await expect(textarea).toHaveAttribute('maxlength', '200');
    });
  },
};

export const NoResize: Story = {
  render: () => ({
    Component: TextareaStory,
    props: {
      id: 'var-noresize',
      labelText: 'Feedback',
      placeholder: 'O que poderíamos melhorar?',
      resize: 'none',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Textarea aplica classe resize-none', async () => {
      const textarea = canvas.getByLabelText('Feedback');
      await expect(textarea.className).toContain('resize-none');
    });
  },
};
