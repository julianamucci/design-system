import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect, waitFor } from 'storybook/test';
import { Button } from './index';
import ButtonStory from './ButtonStory.svelte';
import ButtonPairStory from './ButtonPairStory.svelte';

const meta: Meta = {
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
  title: 'UI/Button/Composicoes',
  component: Button,
  tags: ['form'],
};

export default meta;
type Story = StoryObj;

export const ComIconeAEsquerda: Story = {
  render: () => ({
    Component: ButtonStory,
    props: { variant: 'default', label: 'Adicionar item', iconStart: 'plus' },
  }),
  parameters: {
    covers: ['visual.item5'],
    docs: { description: { story: 'Ícone à esquerda do label. O SVG deve ter aria-hidden="true" para não poluir leitores de tela.' } },
  },

  play: async ({ canvasElement }) => {
    const btn = within(canvasElement).getByRole('button', { name: 'Adicionar item' });
    // Nome exato: se o ícone deixasse de ser aria-hidden ele entraria no nome.
    await expect(btn.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    await expect(btn.firstElementChild).toBe(btn.querySelector('svg'));
  },
};

export const ComIconeADireita: Story = {
  render: () => ({
    Component: ButtonStory,
    props: { variant: 'outline', label: 'Próximo', iconEnd: 'chevron-right' },
  }),
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
  render: () => ({
    Component: ButtonStory,
    props: { variant: 'destructive', label: 'Excluir', iconStart: 'trash' },
  }),
  parameters: { docs: { description: { story: 'Combinação de variante destrutiva com ícone. Use para ações irreversíveis como excluir.' } } },

  play: async ({ canvasElement }) => {
    const btn = within(canvasElement).getByRole('button', { name: 'Excluir' });
    await expect(btn).toHaveClass('nds-button-destructive');
    await expect(btn.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  },
};

export const IconOnly: Story = {
  render: () => ({
    Component: ButtonStory,
    props: { size: 'icon', iconOnly: 'download', ariaLabel: 'Baixar arquivo' },
  }),
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
  render: () => ({
    Component: ButtonPairStory,
    props: { primaryLabel: 'Confirmar', secondaryLabel: 'Cancelar' },
  }),
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
  render: () => ({
    Component: ButtonStory,
    props: { variant: 'link', label: 'Ver documentação', href: '#docs' },
  }),
  parameters: {
    covers: ['functional.item5'],
    docs: { description: { story: 'Button renderizado como <a> via prop href. Preserva semântica de link.' } },
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

// As duas stories abaixo fechavam os ramos descobertos de button.svelte
// (7/14 antes). Sem par nas outras stacks de propósito: `href` é a API de
// composição só desta — React usa `render`, Vue `as`, Vanilla aplica as classes
// num <a>. Nenhuma das outras valida protocolo, porque nenhuma recebe href.

export const LinkDesabilitado: Story = {
  render: () => ({
    Component: ButtonStory,
    props: { variant: 'link', label: 'Ver documentação', href: '#docs', disabled: true },
  }),
  parameters: {
    docs: { description: { story: 'Link desabilitado: perde o href para não navegar, e ganha role e tabindex que o tiram da ordem de foco — um <a> sem href deixaria de ser link para o leitor de tela.' } },
  },
  play: async ({ canvasElement, step }) => {
    const link = within(canvasElement).getByRole('link', { name: 'Ver documentação' });

    await step('Não navega', async () => {
      await expect(link).not.toHaveAttribute('href');
    });

    await step('Continua sendo link para o leitor de tela, mas fora da ordem de foco', async () => {
      await expect(link).toHaveAttribute('aria-disabled', 'true');
      await expect(link).toHaveAttribute('tabindex', '-1');
    });
  },
};

export const HrefComProtocoloInseguro: Story = {
  render: () => ({
    Component: ButtonStory,
    // eslint-disable-next-line no-script-url -- é o vetor que a guarda existe para barrar
    props: { variant: 'link', label: 'Ver documentação', href: 'javascript:window.__xss = true' },
  }),
  parameters: {
    docs: { description: { story: 'Protocolo fora da lista permitida (http, https, mailto, tel, âncora e caminho relativo) é descartado: o elemento renderiza sem href em vez de virar um vetor de execução.' } },
  },
  play: async ({ canvasElement, step }) => {
    // Sem href o <a> perde o role de link — por isso a busca é pelo texto, não
    // por getByRole('link'). É o comportamento correto: nada navegável sobra.
    const el = canvasElement.querySelector('[data-slot="button"]');

    await step('O href inseguro não chega ao DOM', async () => {
      await expect(el).not.toHaveAttribute('href');
      await expect(el?.outerHTML).not.toContain('javascript:');
    });

    await step('Nada foi executado', async () => {
      await expect((window as unknown as { __xss?: boolean }).__xss).toBeUndefined();
    });
  },
};

export const HrefMalformado: Story = {
  render: () => ({
    Component: ButtonStory,
    // `new URL('http://[', base)` estoura — IPv6 inválido. É o caminho do
    // `catch` da validação, que era o último ramo sem teste.
    props: { variant: 'link', label: 'Ver documentação', href: 'http://[' },
  }),
  parameters: {
    docs: { description: { story: 'URL malformada não vira href: quando a validação não consegue nem interpretar o valor, ele é descartado em vez de ir para o DOM na dúvida.' } },
  },
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('[data-slot="button"]');
    await expect(el).not.toHaveAttribute('href');
  },
};
