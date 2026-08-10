import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect } from 'storybook/test';
import { createButton, createButtonIcon, btnClass } from './button';

const meta: Meta = {
  tags: ['form'],
  parameters: {
    design: figmaDesign('button'),
    controls: { disable: true },
    actions: { disable: true },
  },
  title: 'UI/Button/Compositions',
};

export default meta;
type Story = StoryObj;

export const WithIconLeft: Story = {
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

export const WithIconRight: Story = {
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

export const DestructiveIcon: Story = {
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

export const ActionPair: Story = {
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

// `children` aceita string e passa por DOMPurify antes do innerHTML. Era o
// único ramo descoberto de button.ts (linhas 66-72) — e é justamente o patch de
// segurança da guideline 09, que não tinha teste nenhum.
//
// Sem par nas outras stacks de propósito: só a factory recebe HTML como string.
// Nas demais o conteúdo entra como elemento/slot e nunca passa por innerHTML.
export const SanitizedHtmlContent: Story = {
  render: () =>
    createButton({
      variant: 'default',
      // `alt=""` de propósito: o sanitizador preserva o <img> (certo) e o axe
      // roda em cima desta story — sem alt, o teste do vetor criaria uma
      // violação de acessibilidade própria. O que está sob teste é o onerror.
      children: '<strong>Salvar</strong><img src="x" alt="" onerror="window.__xss = true">',
    }),
  parameters: {
    docs: { description: { story: 'Conteúdo em HTML passa por sanitização antes de ir para o DOM: a marcação segura é preservada e vetores de execução são removidos.' } },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const btn = canvas.getByRole('button');

    await step('Marcação segura sobrevive', async () => {
      await expect(btn.querySelector('strong')).toHaveTextContent('Salvar');
    });

    await step('Vetor de execução é removido', async () => {
      // O <img> pode ficar; o handler inline não pode. Asserir os dois separa
      // "sanitizou" de "apagou tudo" — apagar tudo também passaria num teste
      // que só olhasse o onerror.
      const img = btn.querySelector('img');
      if (img) await expect(img).not.toHaveAttribute('onerror');
      await expect(btn.innerHTML).not.toContain('onerror');
      await expect((window as unknown as { __xss?: boolean }).__xss).toBeUndefined();
    });
  },
};

// Ramo irmão do anterior: `children` como elemento vai direto no appendChild,
// sem sanitizar (não há string para sanitizar).
export const ContentAsElement: Story = {
  render: () => {
    const span = document.createElement('span');
    span.textContent = 'Salvar';
    return createButton({ variant: 'default', children: span });
  },
  parameters: {
    docs: { description: { story: 'Conteúdo como elemento é anexado direto, sem passar por sanitização — não há string para sanitizar.' } },
  },
  play: async ({ canvasElement }) => {
    const btn = within(canvasElement).getByRole('button', { name: 'Salvar' });
    await expect(btn.firstElementChild?.tagName).toBe('SPAN');
  },
};
