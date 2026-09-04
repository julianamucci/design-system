import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect } from 'storybook/test';
import { Card } from './index';
import CardStory from './CardStory.svelte';
import CardDocs from '@/components/docs/CardDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { cardSource } from './card.source';

const meta: Meta = {
  title: 'Components/Layout/Card',
  component: Card,
  tags: ['autodocs', 'layout'],
  parameters: {
    docs: {
      page: withAutoDocsTab(CardDocs),
      source: { transform: cardSource },
      description: {
        component:
          'Card é o container estrutural que agrupa conteúdo relacionado. 2 tamanhos (default, sm) e 7 partes (Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter).',
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['default', 'sm'],
      description: 'Tamanho do Card — propaga via data-size para as partes internas.',
      table: {
        type: { summary: '"default" | "sm"' },
        defaultValue: { summary: '"default"' },
      },
    },
  },
  args: {
    size: 'default',
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  parameters: {
    // accessibility.item1 e item6 saem do axe, que o addon-a11y roda em toda
    // story — mas o auditor só enxerga o critério se alguma story o declarar.
    covers: [
      'functional.item1',
      'accessibility.item1',
      'accessibility.item3',
      'accessibility.item6',
      'visual.item1',
    ],
  },
  render: (args) => ({
    Component: CardStory,
    props: {
      variant: 'playground',
      size: args.size,
      title: 'Cadeira Gamer Pro',
      description: 'Estrutura ergonômica com ajuste de altura e apoio lombar.',
      productPrice: 'R$ 1.299,00',
    },
  }),
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement);
    const card = canvasElement.querySelector<HTMLElement>('[data-slot="card"]')!;

    await step('As partes do Card emitem os data-slot esperados', async () => {
      // data-slot é o contrato de markup que as cinco stacks compartilham —
      // classe muda de tema para tema, o slot não.
      await expect(card).toBeInTheDocument();
      for (const slot of [
        'card-header',
        'card-title',
        'card-description',
        'card-content',
        'card-footer',
      ]) {
        await expect(card.querySelector(`[data-slot="${slot}"]`)).toBeInTheDocument();
      }
    });

    await step('Header, conteúdo e rodapé são filhos DIRETOS, nessa ordem', async () => {
      // A regra que zera o padding inferior do card exige o rodapé como filho
      // direto; um wrapper entre os dois a mataria sem mudar nada visível aqui.
      const slots = [...card.children].map((el) => el.getAttribute('data-slot'));
      await expect(slots).toEqual(['card-header', 'card-content', 'card-footer']);
    });

    await step('O rodapé se separa do conteúdo por uma borda superior', async () => {
      const footer = card.querySelector<HTMLElement>('[data-slot="card-footer"]')!;
      await expect(
        Number.parseFloat(getComputedStyle(footer).borderTopWidth),
      ).toBeGreaterThan(0);
    });

    await step('O título é um heading de verdade', async () => {
      // O CSS dá aparência de título; quem dá a semântica é o elemento.
      await expect(canvas.getByRole('heading', { name: 'Cadeira Gamer Pro' })).toBeInTheDocument();
    });

    await step('O tamanho escolhido chega ao DOM', async () => {
      await expect(card).toHaveAttribute('data-size', args.size as string);
    });

    await step('Os botões do rodapé nomeiam o produto que editam', async () => {
      // "Excluir" sozinho vira uma fileira de botões idênticos numa lista de
      // cards para quem navega por leitor de tela.
      await expect(
        canvas.getByRole('button', { name: 'Editar produto Cadeira Gamer Pro' }),
      ).toBeInTheDocument();
      await expect(
        canvas.getByRole('button', { name: 'Excluir produto Cadeira Gamer Pro' }),
      ).toBeInTheDocument();
    });
  },
};
