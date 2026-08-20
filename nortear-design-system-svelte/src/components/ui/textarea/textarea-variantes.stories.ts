import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, expect } from 'storybook/test';
import TextareaStory from './TextareaStory.svelte';
import {
  alturaMinimaPx,
  preencherAte,
  resizeComputado,
} from '@shared/testing/textarea-probe';
import {
  textareaComContadorSource,
  textareaPadraoSource,
  textareaSemRedimensionarSource,
  textareaSource,
} from './textarea.source';

const meta: Meta = {
  title: 'UI/Textarea/Variants',
  component: TextareaStory,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo; cada uma sobrescreve com a
      // sua própria composição logo abaixo.
      source: { transform: textareaSource },
      description: {
        component:
          'Variantes do Textarea: padrão (redimensiona na vertical), com contador de caracteres e sem redimensionamento.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: {
    docs: { source: { transform: textareaPadraoSource } },
  },
  render: () => ({
    Component: TextareaStory,
    props: {
      id: 'var-default',
      labelText: 'Biografia',
      placeholder: 'Conte um pouco sobre você...',
      resize: 'y',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText('Biografia');

    await step('Redimensiona só na vertical', async () => {
      // Efeito computado, não nome de classe: `resize-y` sem prefixo é inerte
      // e a asserção antiga passava sem nada estar aplicado.
      await expect(resizeComputado(textarea)).toBe('vertical');
    });

    await step('Altura mínima de 120px', async () => {
      await expect(alturaMinimaPx(textarea)).toBe(120);
    });
  },
};

export const WithCounter: Story = {
  parameters: {
    covers: ['functional.item3', 'visual.item4'],
    docs: { source: { transform: textareaComContadorSource } },
  },
  render: () => ({
    Component: TextareaStory,
    props: {
      id: 'var-counter',
      labelText: 'Descrição',
      placeholder: 'ex: Camiseta de algodão, gola redonda...',
      maxLength: 500,
      showCounter: true,
      helpText: 'Descreva com clareza.',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText('Descrição') as HTMLTextAreaElement;

    await step('maxLength está aplicado no textarea', async () => {
      await expect(textarea).toHaveAttribute('maxlength', '500');
    });

    await step('Contador possui aria-live e aria-label descritivo', async () => {
      const counter = canvas.getByLabelText(/de 500 caracteres usados/);
      await expect(counter).toHaveAttribute('aria-live', 'polite');
    });

    await step('Atingir o limite bloqueia novos caracteres', async () => {
      // Chega à borda por escrita programática (maxLength não se aplica a ela)
      // e digita os últimos de verdade — é aí que o bloqueio acontece.
      preencherAte(textarea, 496);
      await userEvent.type(textarea, 'abcdefgh');
      await expect(textarea.value.length).toBe(500);
      const counter = canvas.getByLabelText(/de 500 caracteres usados/);
      await expect(counter).toHaveTextContent('500/500');
    });
  },
};

export const NoResize: Story = {
  parameters: {
    docs: { source: { transform: textareaSemRedimensionarSource } },
  },
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
    const textarea = canvas.getByLabelText('Feedback');

    await step('Redimensionamento desligado', async () => {
      await expect(resizeComputado(textarea)).toBe('none');
    });
  },
};
