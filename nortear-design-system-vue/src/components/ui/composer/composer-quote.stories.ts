import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, fn, within } from 'storybook/test';
import { Composer } from './index';
import { useComposerLabels } from './composer.fixtures';
import { quoteLabels, shortQuote, useQuoteLabels } from './composer-quote.fixtures';
import { composerQuoteSource } from './composer-quote.source';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import ComposerQuoteDocs from '@/components/docs/ComposerQuoteDocs.vue';

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onDismissQuote = fn();

// O eixo desta peça é ESTADO — há citação, ela é curta, ela é longa —, e não
// variante: não há arquivo de variantes, e a docs page não tem seção de
// variantes na navegação. Sem control nenhum, o painel de controles e o de
// ações ficam desligados: vazios, seriam duas abas prometendo interação que
// não há.
const meta: Meta = {
  title: 'Primitives/Conversational/ComposerQuote',
  tags: ['autodocs', 'conversational'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      page: withAutoDocsTab(ComposerQuoteDocs),
      source: { transform: composerQuoteSource },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1',
      'accessibility.item1', 'accessibility.item2', 'accessibility.item3',
      'visual.item1',
    ],
  },
  render: () => ({
    components: { Composer },
    setup() {
      // Os rótulos saem de composables, então o render passa por um `setup`.
      return {
        labels: useComposerLabels(),
        quoteLabels: useQuoteLabels(),
        quote: shortQuote(),
        onDismissQuote,
      };
    },
    template: `<Composer
      :labels="labels"
      :quote-labels="quoteLabels"
      :quote="quote"
      class="nds-max-w-lg"
      @dismiss-quote="onDismissQuote"
    />`,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="composer"]')!;
    const block = root.querySelector<HTMLElement>('[data-slot="composer-quote"]')!;
    const input = canvas.getByRole('textbox');
    const quoted = shortQuote();

    await step('O bloco traz o autor e o trecho', async () => {
      await expect(block).toHaveTextContent(quoted.author);
      await expect(block).toHaveTextContent(quoted.excerpt);
    });

    await step('A citação DESCREVE o campo, e vem antes da dica', async () => {
      // Saber a quem se responde muda o que se escreve; a dica de teclado só
      // muda como se envia. A ordem da descrição é a ordem do peso.
      const ids = (input.getAttribute('aria-describedby') ?? '').split(' ');
      await expect(ids[0]).toBe(block.id);
      await expect(ids).toHaveLength(2);
    });

    await step('E a descrição chega como FRASE, não como dois pedaços', async () => {
      // O prefixo audível é o que transforma um nome solto em "respondendo a
      // alguém" — e ele existe só para quem ouve.
      const prefix = block.querySelector<HTMLElement>('.nds-sr-only')!;
      await expect(prefix).toBeInTheDocument();
      await expect(input).toHaveAccessibleDescription(
        new RegExp(`${prefix.textContent?.trim()}\\s*${quoted.author}`),
      );
      await expect(input).toHaveAccessibleDescription(new RegExp(quoted.excerpt.slice(0, 20)));
    });

    await step('O botão que dispensa diz DE QUEM é a citação', async () => {
      // Numa tela com citação e anexos, dois botões iguais são o mesmo botão
      // para quem ouve.
      await expect(
        canvas.getByRole('button', {
          name: quoteLabels().dismiss.replace('{author}', quoted.author),
        }),
      ).toBeInTheDocument();
    });
  },
};
