import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect } from 'storybook/test';
import { Input } from './index';
import InputWithLabelStory from './InputWithLabelStory.svelte';

const meta: Meta = {
  title: 'UI/Input/Compositions',
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
};

export default meta;
type Story = StoryObj;

export const WithLabel: Story = {
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

export const WithLabelAndHint: Story = {
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

export const WithLabelAndError: Story = {
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

export const Password: Story = {
  render: () => ({
    Component: InputWithLabelStory,
    props: {
      labelText: 'Senha',
      type: 'password',
      placeholder: '••••••••',
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
