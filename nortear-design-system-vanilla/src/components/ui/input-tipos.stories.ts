import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, userEvent, expect } from 'storybook/test';
import { alturaResultante, campoDe } from '@shared/testing/input-probe';
import { createInput } from './input';
import { inputSource, inputSourceCom } from './input.source';

const meta: Meta = {
  tags: ['form'],
  title: 'UI/Input/Types',
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
    docs: {
      source: { transform: inputSource },
      description: {
        component: 'Tipos HTML disponíveis para o Input. Use sempre o tipo semântico correto para o dado esperado.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

function campoRotulado(id: string, rotulo: string, type: string, placeholder?: string): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'nds-stack nds-w-xs';
  wrapper.dataset.spacing = 'xs';

  const label = document.createElement('label');
  label.htmlFor = id;
  label.className = 'nds-text-body nds-font-medium';
  label.textContent = rotulo;

  wrapper.append(label, createInput({ type, placeholder, id }));
  return wrapper;
}

export const Text: Story = {
  render: () => campoRotulado('tipo-text', 'Nome completo', 'text', 'ex: João da Silva'),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Input do tipo text renderizado', async () => {
      const input = canvas.getByLabelText('Nome completo');
      await expect(input).toHaveAttribute('type', 'text');
    });
  },
};

export const Email: Story = {
  // O `type` é o assunto da story: sem override o painel mostraria o padrão
  // `text` embaixo de um campo que renderiza outro tipo.
  parameters: {
    docs: {
      source: {
        transform: inputSourceCom({
          type: 'email',
          id: 'email',
          label: 'Email',
          placeholder: 'ex: joao@empresa.com',
        }),
      },
    },
  },
  render: () => campoRotulado('tipo-email', 'Email', 'email', 'ex: joao@empresa.com'),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Input do tipo email renderizado', async () => {
      const input = canvas.getByLabelText('Email');
      await expect(input).toHaveAttribute('type', 'email');
    });
  },
};

export const Password: Story = {
  parameters: {
    docs: {
      source: {
        transform: inputSourceCom({
          type: 'password',
          id: 'senha',
          label: 'Senha',
          placeholder: '••••••••',
        }),
      },
    },
  },
  render: () => campoRotulado('tipo-password', 'Senha', 'password', '••••••••'),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Input do tipo password renderizado', async () => {
      const input = canvas.getByLabelText('Senha');
      await expect(input).toHaveAttribute('type', 'password');
    });
  },
};

export const Number: Story = {
  parameters: {
    docs: {
      source: {
        transform: inputSourceCom({
          type: 'number',
          id: 'quantidade',
          label: 'Quantidade',
          placeholder: '0',
        }),
      },
    },
  },
  render: () => campoRotulado('tipo-number', 'Quantidade', 'number', '0'),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Input do tipo number renderizado', async () => {
      const input = canvas.getByLabelText('Quantidade');
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
    docs: {
      source: {
        transform: inputSourceCom({
          type: 'search',
          id: 'busca',
          label: 'Buscar',
          placeholder: 'Buscar componentes...',
        }),
      },
    },
  },
  render: () => campoRotulado('tipo-search', 'Buscar', 'search', 'Buscar componentes...'),
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
    docs: {
      source: {
        transform: inputSourceCom({ type: 'file', id: 'arquivo', label: 'Arquivo' }),
      },
    },
  },
  render: () => campoRotulado('tipo-file', 'Arquivo', 'file'),
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
