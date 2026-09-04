import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, fn, within } from 'storybook/test';
import { createComposer } from './composer';
import {
  composerLabels,
  longQuote,
  quoteLabels,
} from './composer-quote.fixtures';
import {
  quoteAbsentSource,
  quoteLongSource,
  quoteShortSource,
} from './composer-quote.source';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// O trecho curto é o Playground, e não se repete aqui. O que estas duas fixam
// é o que acontece quando ele não cabe, e quando não há citação nenhuma.

const meta: Meta = {
  title: 'Components/Conversational/ComposerQuote/States',
  tags: ['conversational'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: quoteShortSource },
      description: {
        component: 'O trecho que não cabe, e o campo sem citação.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const onDismissQuote = fn();

export const LongExcerpt: Story = {
  parameters: {
    covers: ['functional.item2', 'accessibility.item4', 'visual.item2'],
    docs: { source: { transform: quoteLongSource } },
  },
  render: () =>
    createComposer({
      labels: composerLabels(),
      quoteLabels: quoteLabels(),
      quote: longQuote(),
      onDismissQuote,
      class: 'nds-max-w-lg',
    }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="composer"]')!;
    const excerpt = root.querySelector<HTMLElement>('.nds-composer-quote-excerpt')!;
    const citada = longQuote();

    await step('O texto INTEIRO está no documento', async () => {
      // O corte é do desenho. Cortar a string em código apagaria o resto para
      // quem lê por audição — que não tem "linhas", tem o texto — e tiraria o
      // trecho da busca do navegador.
      await expect(excerpt.textContent).toBe(citada.excerpt);
    });

    await step('E o desenho é quem esconde o que sobra', async () => {
      // Duas linhas cabem; o resto fica fora da caixa, e não fora do documento.
      // `scrollHeight` maior que `clientHeight` é a prova de que há texto
      // escondido, e não de que ele foi removido.
      await expect(getComputedStyle(excerpt).overflow).toBe('hidden');
      await expect(excerpt.scrollHeight).toBeGreaterThan(excerpt.clientHeight);
    });

    await step('Quem ouve recebe o trecho por completo', async () => {
      const input = canvas.getByRole('textbox');
      await expect(input).toHaveAccessibleDescription(
        new RegExp(citada.excerpt.slice(-24).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      );
    });
  },
};

export const WithoutQuote: Story = {
  parameters: {
    covers: ['functional.item5', 'visual.item3'],
    docs: { source: { transform: quoteAbsentSource } },
  },
  render: () =>
    createComposer({
      labels: composerLabels(),
      class: 'nds-max-w-lg',
    }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="composer"]')!;

    await step('Sem citação, o bloco não existe no documento', async () => {
      await expect(root.querySelector('[data-slot="composer-quote"]')).toBeNull();
    });

    await step('E a descrição do campo traz só a dica', async () => {
      // Um `aria-describedby` apontando um bloco que não existe deixaria a
      // descrição vazia — pior que uma descrição curta.
      const input = canvas.getByRole('textbox');
      const ids = (input.getAttribute('aria-describedby') ?? '').split(' ');
      await expect(ids).toHaveLength(1);
      await expect(document.getElementById(ids[0]!)).toBeInTheDocument();
    });
  },
};
