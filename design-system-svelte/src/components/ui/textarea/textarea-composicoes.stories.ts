import type { Meta, StoryObj } from '@storybook/svelte';

import { userEvent, within, expect } from 'storybook/test';
import TextareaStory from './TextareaStory.svelte';

const meta = {
  title: 'UI/Textarea/Composicoes',
  component: TextareaStory,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes do Textarea com Label, texto de apoio, contador acessível e mensagem de erro.',
      },
    },
  },
} satisfies Meta<typeof TextareaStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ComLabelEAjuda: Story = {
  render: () => ({
    Component: TextareaStory,
    props: {
      id: 'comp-help',
      labelText: 'Descrição',
      placeholder: 'ex: Descreva o produto...',
      helpText: 'Descreva o produto com clareza.',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Label associado ao textarea', async () => {
      const textarea = canvas.getByLabelText('Descrição');
      await expect(textarea).toBeInTheDocument();
    });
    await step('Texto de apoio está visível', async () => {
      await expect(canvas.getByText('Descreva o produto com clareza.')).toBeVisible();
    });
  },
};

export const ComContadorAcessivel: Story = {
  render: () => ({
    Component: TextareaStory,
    props: {
      id: 'comp-counter',
      labelText: 'Biografia',
      placeholder: 'Conte um pouco sobre você...',
      helpText: 'Use até 200 caracteres.',
      maxLength: 200,
      showCounter: true,
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Contador inicia em 0/200', async () => {
      const counter = canvasElement.querySelector('[aria-live="polite"]');
      await expect(counter?.textContent?.trim()).toBe('0/200');
    });

    await step('Contador atualiza ao digitar', async () => {
      const textarea = canvas.getByLabelText('Biografia') as HTMLTextAreaElement;
      await userEvent.type(textarea, 'Olá');
      const counter = canvasElement.querySelector('[aria-live="polite"]');
      await expect(counter?.textContent?.trim()).toBe('3/200');
    });

    await step('Contador possui aria-label descritivo', async () => {
      const counter = canvasElement.querySelector('[aria-live="polite"]') as HTMLElement;
      await expect(counter.getAttribute('aria-label')).toMatch(/3 de 200 caracteres/);
    });
  },
};

export const ComErro: Story = {
  render: () => ({
    Component: TextareaStory,
    props: {
      id: 'comp-error',
      labelText: 'Feedback',
      placeholder: 'O que poderíamos melhorar?',
      helpText: 'O feedback precisa ter pelo menos 10 caracteres.',
      'aria-invalid': 'true',
      'aria-describedby': 'comp-error-msg',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Textarea com aria-invalid="true"', async () => {
      const textarea = canvas.getByLabelText('Feedback');
      await expect(textarea).toHaveAttribute('aria-invalid', 'true');
    });

    await step('aria-describedby aponta para mensagem', async () => {
      const textarea = canvas.getByLabelText('Feedback');
      await expect(textarea).toHaveAttribute('aria-describedby', 'comp-error-msg');
    });
  },
};

export const ModalNoResize: Story = {
  render: () => ({
    Component: TextareaStory,
    props: {
      id: 'comp-modal',
      labelText: 'Observações',
      placeholder: 'Adicione observações relevantes...',
      resize: 'none',
      helpText: 'Sem redimensionamento — ideal para modais.',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Textarea aplica resize-none', async () => {
      const textarea = canvas.getByLabelText('Observações');
      await expect(textarea.className).toContain('resize-none');
    });
  },
};
