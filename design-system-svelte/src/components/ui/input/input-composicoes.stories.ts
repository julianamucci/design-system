import type { Meta, StoryObj } from '@storybook/svelte';

import { within, expect } from 'storybook/test';
import { Input } from './index';
import InputWithLabelStory from './InputWithLabelStory.svelte';

const meta = {
  title: 'UI/Input/Composicoes',
  component: Input,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component: 'Composicoes do Input com Label e texto de apoio. InputGroup é React-only — em Svelte, use Label + Input com slot nativo.',
      },
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ComLabel: Story = {
  render: () => ({
    Component: InputWithLabelStory,
    props: {
      labelText: 'Nome completo',
      type: 'text',
      placeholder: 'ex: João da Silva',
      id: 'nome-campo',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Label está associado ao input via htmlFor', async () => {
      const input = canvas.getByLabelText('Nome completo');
      await expect(input).toBeInTheDocument();
    });

    await step('Input está visível', async () => {
      const input = canvas.getByLabelText('Nome completo');
      await expect(input).toBeVisible();
    });
  },
};

export const ComLabelEHint: Story = {
  render: () => ({
    Component: InputWithLabelStory,
    props: {
      labelText: 'Email',
      type: 'email',
      placeholder: 'ex: joao@empresa.com',
      hint: 'Use seu email corporativo.',
      id: 'email-campo',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Label associado ao input', async () => {
      const input = canvas.getByLabelText('Email');
      await expect(input).toBeInTheDocument();
    });

    await step('Texto de apoio (hint) visível', async () => {
      await expect(canvas.getByText('Use seu email corporativo.')).toBeVisible();
    });

    await step('aria-describedby aponta para o hint', async () => {
      const input = canvas.getByLabelText('Email');
      await expect(input).toHaveAttribute('aria-describedby', 'email-campo-hint');
    });
  },
};

export const ComLabelEErro: Story = {
  render: () => ({
    Component: InputWithLabelStory,
    props: {
      labelText: 'Email',
      type: 'email',
      placeholder: 'ex: joao@empresa.com',
      'aria-invalid': 'true',
      errorMessage: 'Email inválido. Use o formato nome@dominio.com',
      id: 'email-erro',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Input com aria-invalid="true"', async () => {
      const input = canvas.getByLabelText('Email');
      await expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    await step('Mensagem de erro visível', async () => {
      await expect(canvas.getByText(/Email inválido/)).toBeVisible();
    });

    await step('aria-describedby aponta para a mensagem de erro', async () => {
      const input = canvas.getByLabelText('Email');
      await expect(input).toHaveAttribute('aria-describedby', 'email-erro-error');
    });
  },
};

export const Senha: Story = {
  render: () => ({
    Component: InputWithLabelStory,
    props: {
      labelText: 'Senha',
      type: 'password',
      placeholder: 'Mínimo 8 caracteres',
      hint: 'Use letras maiúsculas, minúsculas e números.',
      id: 'senha-campo',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Input de senha está presente', async () => {
      const input = canvas.getByLabelText('Senha');
      await expect(input).toHaveAttribute('type', 'password');
    });
  },
};
