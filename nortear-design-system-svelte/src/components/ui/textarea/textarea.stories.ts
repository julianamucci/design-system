import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, expect } from 'storybook/test';
import { Textarea } from './index';
import TextareaStory from './TextareaStory.svelte';
import TextareaDocs from '@/components/docs/TextareaDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { resizeComputado } from '@shared/testing/textarea-probe';
import { textareaSource } from './textarea.source';

const meta: Meta = {
  title: 'UI/Textarea',
  component: Textarea,
  tags: ['autodocs', 'form'],
  parameters: {
    layout: 'centered',
    docs: {
      page: withAutoDocsTab(TextareaDocs),
      source: { transform: textareaSource },
    },
  },
  argTypes: {
    placeholder: {
      control: 'text',
      description: 'Texto de exemplo do formato esperado',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita o textarea',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    readonly: {
      control: 'boolean',
      description: 'Modo somente leitura',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    'aria-invalid': {
      control: 'select',
      options: ['false', 'true'],
      description: 'Estado de erro de validação',
      table: { type: { summary: "'true' | 'false'" }, defaultValue: { summary: 'false' } },
    },
    maxLength: {
      control: { type: 'number', min: 0, step: 10 },
      description: 'Limite de caracteres',
      table: { type: { summary: 'number' }, defaultValue: { summary: '—' } },
    },
  },
  args: {
    placeholder: 'ex: Descreva o produto em até 500 caracteres...',
    disabled: false,
    readonly: false,
    // Sem valor inicial o control nascia vazio — regra `argtype_without_arg`.
    'aria-invalid': 'false',
    maxLength: 500,
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  parameters: {
    covers: ['functional.item1', 'functional.item2', 'functional.item4'],
  },
  render: (args) => ({
    Component: TextareaStory,
    props: {
      ...args,
      id: 'pg-textarea',
      labelText: 'Descrição',
      showCounter: true,
      helpText: 'Descreva o produto com clareza.',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText('Descrição') as HTMLTextAreaElement;

    await step('Textarea possui data-slot="textarea"', async () => {
      await expect(textarea).toHaveAttribute('data-slot', 'textarea');
    });

    await step('Clicar no Label foca o Textarea', async () => {
      const label = canvasElement.querySelector('label[for="pg-textarea"]') as HTMLLabelElement;
      await userEvent.click(label);
      await expect(textarea).toHaveFocus();
    });

    await step('Digitar texto atualiza o valor e o contador', async () => {
      // Limpa antes: no replay do painel o campo chega com o texto da rodada
      // anterior, e cada passo estabelece a própria precondição.
      await userEvent.clear(textarea);
      await userEvent.type(textarea, 'Camiseta de algodão');
      await expect(textarea.value).toBe('Camiseta de algodão');
      const counter = canvas.getByLabelText(/de 500 caracteres usados/);
      await expect(counter).toHaveAttribute('aria-live', 'polite');
      await expect(counter).toHaveTextContent('19/500');
    });

    await step('Enter insere quebra de linha em vez de enviar', async () => {
      await userEvent.clear(textarea);
      await userEvent.type(textarea, 'Linha 1{Enter}Linha 2');
      await expect(textarea.value).toBe('Linha 1\nLinha 2');
    });

    await step('O campo redimensiona só na vertical', async () => {
      await expect(resizeComputado(textarea)).toBe('vertical');
    });
  },
};
