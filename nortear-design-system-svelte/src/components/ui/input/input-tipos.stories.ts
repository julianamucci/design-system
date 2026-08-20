import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, userEvent, expect } from 'storybook/test';
import { alturaResultante, campoDe } from '@shared/testing/input-probe';
import InputStory from './InputStory.svelte';
import InputWithLabelStory from './InputWithLabelStory.svelte';
import {
  inputSource,
  inputTipoArquivoSource,
  inputTipoBuscaSource,
  inputTipoEmailSource,
  inputTipoNumeroSource,
  inputTipoSenhaSource,
  inputTipoTextoSource,
} from './input.source';

const meta: Meta = {
  title: 'UI/Input/Types',
  component: InputStory,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo; cada uma sobrescreve com o
      // seu próprio tipo logo abaixo.
      source: { transform: inputSource },
      description: {
        component: 'Variações de tipo HTML do Input. Use sempre o tipo semântico correto para melhor UX mobile e validação nativa do browser.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Text: Story = {
  parameters: { docs: { source: { transform: inputTipoTextoSource } } },
  render: () => ({
    Component: InputStory,
    props: { type: 'text', placeholder: 'ex: João da Silva' },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Input de texto renderizado', async () => {
      const input = canvas.getByRole('textbox');
      await expect(input).toHaveAttribute('type', 'text');
    });
  },
};

export const Email: Story = {
  parameters: { docs: { source: { transform: inputTipoEmailSource } } },
  render: () => ({
    Component: InputStory,
    props: { type: 'email', placeholder: 'ex: joao@empresa.com' },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Input de email renderizado', async () => {
      const input = canvas.getByRole('textbox');
      await expect(input).toHaveAttribute('type', 'email');
    });
  },
};

export const Password: Story = {
  parameters: { docs: { source: { transform: inputTipoSenhaSource } } },
  render: () => ({
    Component: InputStory,
    props: { type: 'password', placeholder: '••••••••' },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Input de senha renderizado', async () => {
      const input = canvas.getByDisplayValue('');
      await expect(input).toHaveAttribute('type', 'password');
    });
  },
};

export const Number: Story = {
  parameters: { docs: { source: { transform: inputTipoNumeroSource } } },
  render: () => ({
    Component: InputStory,
    props: { type: 'number', placeholder: '0' },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Input numérico renderizado', async () => {
      const input = canvas.getByRole('spinbutton');
      await expect(input).toHaveAttribute('type', 'number');
    });
  },
};

/**
 * `type="search"` não tinha story em stack nenhuma — e é um dos tipos que a
 * seção Variantes documenta e que o contrato pede em `visual.item3`.
 */
export const Search: Story = {
  parameters: {
    covers: ['visual.item3'],
    docs: { source: { transform: inputTipoBuscaSource } },
  },
  render: () => ({
    Component: InputWithLabelStory,
    props: { labelText: 'Buscar', id: 'tipo-search', type: 'search', placeholder: 'Buscar componentes...' },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O campo de busca é anunciado como busca, não como texto', async () => {
      // `type="search"` muda o papel implícito para searchbox — é o que o
      // leitor de tela anuncia, e nada no visual denuncia se estiver errado.
      const input = canvas.getByRole('searchbox', { name: 'Buscar' });
      await expect(input).toHaveAttribute('type', 'search');
    });

    await step('Aceita digitação', async () => {
      const input = canvas.getByRole('searchbox', { name: 'Buscar' });
      await userEvent.clear(input);
      await userEvent.type(input, 'Button');
      await expect(input).toHaveValue('Button');
      await userEvent.clear(input);
    });
  },
};

export const File: Story = {
  parameters: {
    covers: ['functional.item5'],
    docs: { source: { transform: inputTipoArquivoSource } },
  },
  render: () => ({
    Component: InputWithLabelStory,
    props: { labelText: 'Arquivo', id: 'tipo-file', type: 'file', placeholder: '' },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Input type file está presente e rotulado', async () => {
      const input = canvas.getByLabelText('Arquivo');
      await expect(input).toHaveAttribute('type', 'file');
    });

    await step('O botão nativo recebe estilo próprio do design system', async () => {
      // `::file-selector-button` é a única parte do campo que o navegador
      // desenha sozinho; sem a regra do design system ele sai com o cinza do
      // sistema operacional e o exemplo mente sobre o resultado.
      const botao = getComputedStyle(campoDe(canvasElement)!, '::file-selector-button');
      await expect(botao.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
      await expect(parseFloat(botao.borderTopLeftRadius)).toBeGreaterThan(0);
    });

    await step('A altura continua saindo do respiro, não de um valor cravado', async () => {
      const medida = alturaResultante(campoDe(canvasElement)!);
      await expect(medida.alturaCravada).toBe(false);
      await expect(parseFloat(medida.paddingBloco[0])).toBeGreaterThan(0);
    });
  },
};
