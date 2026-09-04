import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect } from 'storybook/test';
import { createButton, createButtonIcon, btnClass } from './button';
import {
  buttonAsLinkSourceWith,
  actionsSourceWithButtonPair,
  buttonSource,
  buttonSourceWith,
} from './button.source';

const meta: Meta = {
  tags: ['form'],
  parameters: {
    design: figmaDesign('button'),
    controls: { disable: true },
    actions: { disable: true },
    docs: { source: { transform: buttonSource } },
  },
  title: 'Components/Form/Button/Compositions',
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
    // Override de story: com ícone E texto, o texto deixa de entrar por `label`
    // — a fábrica o escreve antes de qualquer filho, e a ordem se decide no
    // `append`. O snippet do meta esconderia isso.
    docs: {
      source: { transform: buttonSourceWith({ icon: 'plus', label: 'Adicionar item' }) },
      description: { story: 'Ícone à esquerda do label. O SVG tem aria-hidden="true" para não poluir leitores de tela.' },
    },
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
  parameters: {
    // Override de story: o lado do ícone é o assunto, e é a ordem do `append`
    // que o decide.
    docs: {
      source: {
        transform: buttonSourceWith({
          variant: 'outline',
          icon: 'chevron-right',
          iconSide: 'right',
          label: 'Próximo',
        }),
      },
      description: { story: 'Ícone à direita do label. Use em botões de navegação progressiva.' },
    },
  },

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
  parameters: {
    // Override de story: variante e ícone, nenhum dos dois com control.
    docs: {
      source: {
        transform: buttonSourceWith({ variant: 'destructive', icon: 'trash', label: 'Excluir' }),
      },
      description: { story: 'Combinação de variante destrutiva com ícone. Use para ações irreversíveis como excluir.' },
    },
  },

  play: async ({ canvasElement }) => {
    const btn = within(canvasElement).getByRole('button', { name: 'Excluir' });
    await expect(btn).toHaveClass('nds-button-destructive');
    await expect(btn.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  },
};

export const IconOnly: Story = {
  render: () => {
    const btn = createButton({ size: 'icon', 'aria-label': 'Baixar arquivo' });
    btn.appendChild(createButtonIcon('download'));
    return btn;
  },
  parameters: {
    // Override de story: sem texto visível, o nome acessível é obrigatório.
    docs: {
      source: {
        transform: buttonSourceWith({
          size: 'icon',
          label: undefined,
          ariaLabel: 'Baixar arquivo',
          icon: 'download',
        }),
      },
      description: { story: 'Botão apenas com ícone. aria-label é obrigatório para acessibilidade.' },
    },
  },
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
    wrap.dataset.spacing = 'md';
    wrap.append(
      createButton({ variant: 'outline', label: 'Cancelar' }),
      createButton({ variant: 'default', label: 'Confirmar' }),
    );
    return wrap;
  },
  parameters: {
    // Override de story: a forma do snippet é outra — são DOIS botões e o
    // contêiner que fixa a ordem, que é justamente o assunto.
    docs: {
      source: { transform: actionsSourceWithButtonPair() },
      description: { story: 'Par de ações canônico: outline (cancelar) + default (confirmar). Primária sempre à direita em contexto ocidental.' },
    },
  },

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
    // Override de story: aqui não há chamada de fábrica nenhuma — o que se usa
    // é `btnClass` num `<a>` de verdade, e é essa a forma que o snippet mostra.
    docs: {
      source: { transform: buttonAsLinkSourceWith() },
      description: { story: 'Link estilizado como botão. Aplique as classes do botão em um <a> real para preservar a semântica de link.' },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Elemento é um link, não um botão', async () => {
      const link = canvas.getByRole('link', { name: 'Ver documentação' });
      await expect(link).toBeInTheDocument();
      await expect(link).toHaveAttribute('href', '#docs');
    });

    await step('O link entra na ordem de tabulação', async () => {
      // O <a> com aparência de botão precisa ser ALCANÇÁVEL por teclado, e
      // isso nenhuma das cinco stacks verificava: as asserções paravam em
      // papel e destino. Um tabindex negativo herdado, ou a perda do
      // atributo de destino, deixariam papel e destino intactos e a ação
      // inalcançável por teclado.
      const link = canvas.getByRole('link', { name: 'Ver documentação' });
      (canvasElement.ownerDocument.activeElement as HTMLElement | null)?.blur();
      await userEvent.tab();
      await expect(link).toHaveFocus();
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
    // Override de story: `children` como STRING é o caminho que passa pelo
    // sanitizador, e é o assunto. O vetor de ataque da story fica de fora do
    // snippet de propósito — valor de teste não vira recomendação.
    docs: {
      source: {
        transform: buttonSourceWith({ label: undefined, children: '<strong>Salvar</strong>' }),
      },
      description: { story: 'Conteúdo em HTML passa por sanitização antes de ir para o DOM: a marcação segura é preservada e vetores de execução são removidos.' },
    },
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
    // Override de story: o ramo irmão do anterior — `children` como ELEMENTO,
    // que vai direto no append.
    docs: {
      source: { transform: buttonSourceWith({ label: undefined, childrenElement: 'Salvar' }) },
      description: { story: 'Conteúdo como elemento é anexado direto, sem passar por sanitização — não há string para sanitizar.' },
    },
  },
  play: async ({ canvasElement }) => {
    const btn = within(canvasElement).getByRole('button', { name: 'Salvar' });
    await expect(btn.firstElementChild?.tagName).toBe('SPAN');
  },
};
