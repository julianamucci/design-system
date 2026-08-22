import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect, fn, userEvent } from 'storybook/test';
import { Card } from './index';
import CardStory from './CardStory.svelte';
import { cardClicavelSource, cardComRodapeSource, cardDefaultSource } from './card.source';

/**
 * Espiões em escopo de MÓDULO: criados dentro do `render` seriam inalcançáveis
 * pela `play`. Cada passo limpa o seu antes de agir, para a contagem valer na
 * segunda execução do painel Interactions.
 */
const onNavigate = fn();
const onSave = fn();

const meta: Meta = {
  title: 'UI/Card/States',
  component: Card,
  tags: ['layout'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'padded',
    docs: {
      // Cascateia para todas as stories do arquivo; as que mudam a composição
      // sobrescrevem com a sua logo abaixo.
      source: { transform: cardDefaultSource },
      description: {
        component:
          'Configurações do Card: padrão (container passivo), clicável (envolvido em <a> com aria-label descritivo) e com footer de ações. O Card raiz nunca recebe foco — a semântica de ativação vive no wrapper ou nos controles internos.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: { covers: ['accessibility.item2'] },
  render: () => ({
    Component: CardStory,
    props: {
      variant: 'default',
      title: 'Cadeira Gamer Pro',
      description: 'Estrutura ergonômica com ajuste de altura e apoio lombar.',
      productPrice: 'R$ 1.299,00',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const card = canvasElement.querySelector<HTMLElement>('[data-slot="card"]')!;

    await step('O Card é container passivo — não entra na ordem de foco', async () => {
      await expect(card).not.toHaveAttribute('tabindex');
      await expect(card).not.toHaveAttribute('role');
    });

    await step('A descrição não herda a cor do título', async () => {
      // O contraste em si é medido pelo axe. O que esta asserção guarda é a
      // hierarquia: descrição na cor muted, título na cor do card. Cair na
      // mesma cor passaria no axe e apagaria a diferença entre as duas.
      const title = card.querySelector<HTMLElement>('[data-slot="card-title"]')!;
      const description = card.querySelector<HTMLElement>('[data-slot="card-description"]')!;
      await expect(getComputedStyle(description).color).not.toBe(getComputedStyle(title).color);
    });
  },
};

export const Clickable: Story = {
  parameters: {
    covers: ['functional.item6', 'accessibility.item4', 'visual.item4'],
    docs: {
      source: { transform: cardClicavelSource },
      description: {
        story:
          'Card envolvido em `<a>` com `aria-label` descritivo. Não use handler de clique no Card root — a semântica de ativação por teclado e o anel de foco vivem no wrapper, e o Tab alcança um destino só.',
      },
    },
  },
  render: () => ({
    Component: CardStory,
    props: {
      variant: 'clickable',
      title: 'Cadeira Gamer Pro',
      description: 'Estrutura ergonômica com ajuste de altura e apoio lombar.',
      productPrice: 'R$ 1.299,00',
      onNavigate,
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole('link', {
      name: 'Abrir detalhes do produto Cadeira Gamer Pro',
    });

    await step('Tab alcança o card inteiro como um destino único', async () => {
      link.blur();
      await userEvent.tab();
      await expect(link).toHaveFocus();
    });

    await step('O anel de foco aparece quando o foco vem do teclado', async () => {
      const { outlineStyle, boxShadow } = getComputedStyle(link);
      await expect(outlineStyle !== 'none' || boxShadow !== 'none').toBe(true);
    });

    await step('Enter navega a partir do wrapper', async () => {
      onNavigate.mockClear();
      await userEvent.keyboard('{Enter}');
      await expect(onNavigate).toHaveBeenCalledTimes(1);
    });

    await step('O Card interno continua passivo dentro do link', async () => {
      const card = canvasElement.querySelector<HTMLElement>('[data-slot="card"]')!;
      await expect(card).not.toHaveAttribute('tabindex');
    });
  },
};

export const WithFooter: Story = {
  parameters: {
    covers: ['functional.item5'],
    docs: {
      source: { transform: cardComRodapeSource },
      description: {
        story:
          'Composição com CardFooter: o Card zera o próprio padding inferior quando detecta o rodapé como filho direto, e o rodapé ganha borda superior e fundo soft. Botões usam `aria-label` contextual para não virarem rótulos repetidos numa lista.',
      },
    },
  },
  render: () => ({
    Component: CardStory,
    props: {
      variant: 'withFooter',
      title: 'Cadeira Gamer Pro',
      productPrice: 'R$ 1.299,00',
      onPrimaryAction: onSave,
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const card = canvasElement.querySelector<HTMLElement>('[data-slot="card"]')!;

    await step('Clicar no botão do rodapé chama o handler uma única vez', async () => {
      onSave.mockClear();
      await userEvent.click(
        canvas.getByRole('button', { name: 'Salvar alterações em Cadeira Gamer Pro' }),
      );
      await expect(onSave).toHaveBeenCalledTimes(1);
    });

    await step('O Card raiz não intercepta o clique — segue passivo', async () => {
      // Container: nenhum handler próprio e nenhuma entrada na ordem de foco.
      // É o que garante que o clique termina no botão e não em duas ações.
      await expect(card.onclick).toBeNull();
      await expect(card).not.toHaveAttribute('tabindex');
    });
  },
};
