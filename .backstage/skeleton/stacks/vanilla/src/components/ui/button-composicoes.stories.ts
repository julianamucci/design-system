import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect } from 'storybook/test';
import { createButton, createButtonIcon, btnClass } from './button';

const meta: Meta = {
  title: 'UI/Button/Composições',
};

export default meta;
type Story = StoryObj;

export const ComIconeAEsquerda: Story = {
  render: () => {
    const btn = createButton({ variant: 'default' });
    btn.appendChild(createButtonIcon('plus'));
    const label = document.createElement('span');
    label.textContent = 'Adicionar item';
    btn.appendChild(label);
    return btn;
  },
  parameters: { docs: { description: { story: 'Ícone à esquerda do label. O SVG tem aria-hidden="true" para não poluir leitores de tela.' } } },
};

export const ComIconeADireita: Story = {
  render: () => {
    const btn = createButton({ variant: 'outline' });
    const label = document.createElement('span');
    label.textContent = 'Próximo';
    btn.appendChild(label);
    btn.appendChild(createButtonIcon('chevron-right'));
    return btn;
  },
  parameters: { docs: { description: { story: 'Ícone à direita do label. Use em botões de navegação progressiva.' } } },
};

export const IconeDestrutivo: Story = {
  render: () => {
    const btn = createButton({ variant: 'destructive' });
    btn.appendChild(createButtonIcon('trash'));
    const label = document.createElement('span');
    label.textContent = 'Excluir';
    btn.appendChild(label);
    return btn;
  },
  parameters: { docs: { description: { story: 'Combinação de variante destrutiva com ícone. Use para ações irreversíveis como excluir.' } } },
};

export const IconOnly: Story = {
  render: () => {
    const btn = createButton({ size: 'icon', ariaLabel: 'Baixar arquivo' });
    btn.appendChild(createButtonIcon('download'));
    return btn;
  },
  parameters: { docs: { description: { story: 'Botão apenas com ícone. aria-label é obrigatório para acessibilidade.' } } },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Botão é acessível por aria-label', async () => {
      const button = canvas.getByRole('button', { name: 'Baixar arquivo' });
      await expect(button).toBeInTheDocument();
    });
  },
};

export const ParDeAcoes: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'flex gap-2';
    wrap.append(
      createButton({ variant: 'outline', label: 'Cancelar' }),
      createButton({ variant: 'default', label: 'Confirmar' }),
    );
    return wrap;
  },
  parameters: { docs: { description: { story: 'Par de ações canônico: outline (cancelar) + default (confirmar). Primária sempre à direita em contexto ocidental.' } } },
};

export const AsLink: Story = {
  render: () => {
    const a = document.createElement('a');
    a.href = '#docs';
    a.className = btnClass('link', 'default');
    a.textContent = 'Ver documentação';
    return a;
  },
  parameters: { docs: { description: { story: 'Link estilizado como botão — equivalente ao asChild do React. Use classes btnClass em um <a> real para preservar semântica de link.' } } },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Elemento é um link, não um botão', async () => {
      const link = canvas.getByRole('link', { name: 'Ver documentação' });
      await expect(link).toBeInTheDocument();
      await expect(link).toHaveAttribute('href', '#docs');
    });
  },
};
