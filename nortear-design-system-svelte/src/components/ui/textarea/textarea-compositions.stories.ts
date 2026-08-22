import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, expect } from 'storybook/test';
import TextareaStory from './TextareaStory.svelte';
import { resizeComputado } from '@shared/testing/textarea-probe';
import {
  textareaComApoioSource,
  textareaWithErrorSource,
  textareaContadorAcessivelSource,
  textareaEmModalSource,
  textareaSource,
} from './textarea.source';

const meta: Meta = {
  title: 'UI/Textarea/Compositions',
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
          'Composicoes do Textarea com Label, texto de apoio, contador acessível e mensagem de erro.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const WithLabelAndHelp: Story = {
  parameters: {
    covers: ['accessibility.item4'],
    docs: { source: { transform: textareaComApoioSource } },
  },
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
    await step('Clicar no Label move o foco para o campo', async () => {
      const label = canvasElement.querySelector('label[for="comp-help"]') as HTMLLabelElement;
      await userEvent.click(label);
      await expect(canvas.getByLabelText('Descrição')).toHaveFocus();
    });
    await step('Texto de apoio está visível', async () => {
      await expect(canvas.getByText('Descreva o produto com clareza.')).toBeVisible();
    });
  },
};

export const WithAccessibleCounter: Story = {
  parameters: {
    docs: { source: { transform: textareaContadorAcessivelSource } },
  },
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

    await step('Contador começa zerado', async () => {
      const counter = canvasElement.querySelector('[aria-live="polite"]');
      await expect(counter?.textContent?.trim()).toBe('0/200');
    });

    await step('Contador atualiza ao digitar', async () => {
      const textarea = canvas.getByLabelText('Biografia') as HTMLTextAreaElement;
      await userEvent.clear(textarea);
      await userEvent.type(textarea, 'Olá');
      const counter = canvasElement.querySelector('[aria-live="polite"]');
      await expect(counter?.textContent?.trim()).toBe('3/200');
      await expect(counter?.getAttribute('aria-label')).toMatch(/3 de 200 caracteres/);
    });
  },
};

export const WithError: Story = {
  parameters: {
    docs: { source: { transform: textareaWithErrorSource } },
  },
  render: () => ({
    Component: TextareaStory,
    props: {
      id: 'comp-error',
      labelText: 'Feedback',
      placeholder: 'O que poderíamos melhorar?',
      'aria-invalid': 'true',
      errorText: 'O feedback precisa ter pelo menos 10 caracteres.',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText('Feedback');

    await step('Textarea com aria-invalid="true"', async () => {
      await expect(textarea).toHaveAttribute('aria-invalid', 'true');
    });

    await step('aria-describedby aponta para a mensagem renderizada', async () => {
      const id = textarea.getAttribute('aria-describedby')!;
      const alvo = canvasElement.ownerDocument.getElementById(id);
      await expect(alvo).toBeInTheDocument();
      await expect(alvo).toHaveTextContent(/pelo menos 10 caracteres/);
    });
  },
};

export const ModalNoResize: Story = {
  parameters: {
    docs: { source: { transform: textareaEmModalSource } },
  },
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
    await step('Redimensionamento desligado', async () => {
      const textarea = canvas.getByLabelText('Observações');
      await expect(resizeComputado(textarea)).toBe('none');
    });
  },
};
