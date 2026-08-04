import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect } from 'storybook/test';
import { createButton, createButtonIcon, btnClass } from './button';

const meta: Meta = {
  tags: ['form'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
  title: 'UI/Button/Composicoes',
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
  parameters: {
    covers: ['visual.item5'],
    docs: { description: { story: 'Ícone à esquerda do label. O SVG tem aria-hidden="true" para não poluir leitores de tela.' } },
  },

  play: async ({ canvasElement }) => {
    const btn = within(canvasElement).getByRole('button', { name: 'Adicionar item' });
    // Nome exato: se o ícone deixasse de ser aria-hidden ele entraria no nome.
    await expect(btn.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    await expect(btn.firstElementChild).toBe(btn.querySelector('svg'));
  },
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

  play: async ({ canvasElement }) => {
    const btn = within(canvasElement).getByRole('button', { name: 'Próximo' });
    const svg = btn.querySelector('svg');
    await expect(svg).toHaveAttribute('aria-hidden', 'true');
    // É o que distingue esta story da anterior: o ícone vem DEPOIS do label.
    await expect(btn.lastElementChild).toBe(svg);
  },
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

  play: async ({ canvasElement }) => {
    const btn = within(canvasElement).getByRole('button', { name: 'Excluir' });
    await expect(btn).toHaveClass('nds-button-destructive');
    await expect(btn.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  },
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
    wrap.className = 'nds-cluster';
    wrap.dataset.spacing = 'sm';
    wrap.append(
      createButton({ variant: 'outline', label: 'Cancelar' }),
      createButton({ variant: 'default', label: 'Confirmar' }),
    );
    return wrap;
  },
  parameters: { docs: { description: { story: 'Par de ações canônico: outline (cancelar) + default (confirmar). Primária sempre à direita em contexto ocidental.' } } },

  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cancelar = canvas.getByRole('button', { name: 'Cancelar' });
    const confirmar = canvas.getByRole('button', { name: 'Confirmar' });
    await expect(cancelar).toHaveClass('nds-button-outline');
    await expect(confirmar).toHaveClass('nds-button-default');
    // A regra documentada é a ordem: a primária fica à direita.
    await expect(cancelar.compareDocumentPosition(confirmar)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  },
};

export const AsLink: Story = {
  render: () => {
    const a = document.createElement('a');
    a.href = '#docs';
    a.className = btnClass('link', 'default');
    a.textContent = 'Ver documentação';
    return a;
  },
  parameters: {
    covers: ['functional.item5'],
    // Antes citava "o asChild do React": cada docs page é lida isolada, então
    // comparar com outra stack vaza.
    docs: { description: { story: 'Link estilizado como botão. Aplique as classes do botão em um <a> real para preservar a semântica de link.' } },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Elemento é um link, não um botão', async () => {
      const link = canvas.getByRole('link', { name: 'Ver documentação' });
      await expect(link).toBeInTheDocument();
      await expect(link).toHaveAttribute('href', '#docs');
    });
  },
};
