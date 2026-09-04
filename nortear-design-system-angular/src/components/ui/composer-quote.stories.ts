import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, fn, within } from 'storybook/test';
import { NdsComposer } from './composer';
import { composerLabels } from './composer.fixtures';
import { quoteLabels, shortQuote } from './composer-quote.fixtures';
import { composerQuoteSource } from './composer-quote.source';
import { NdsComposerQuoteDocs } from '@/components/docs/ComposerQuoteDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// O eixo desta peça é ESTADO, e não variante: não há arquivo de variantes, e a
// docs page não traz a seção. O trecho curto é o Playground.

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onDismissQuote = fn();

const meta: Meta = {
  title: 'Components/Conversational/ComposerQuote',
  tags: ['autodocs', 'conversational'],
  decorators: [moduleMetadata({ imports: [NdsComposer] })],
  // Sem argTypes nem callbacks: sem isto os painéis Controls e Actions abrem vazios.
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      page: withAutoDocsTab(NdsComposerQuoteDocs),
      // O renderer Angular imprime o `template` da story com os bindings
      // apontando para `props` que só existem aqui. A transform devolve o uso
      // real: um componente que guarda a citação e trata o pedido de dispensa.
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
  // Os rótulos vêm do andaime compartilhado, e não de literais: eles têm três
  // idiomas, e uma palavra escrita à mão aqui congelaria um deles.
  render: () => ({
    props: {
      labels: composerLabels(),
      quoteLabels: quoteLabels(),
      quote: shortQuote(),
      onDismissQuote,
    },
    template: `
      <nds-composer
        class="nds-max-w-lg"
        [labels]="labels"
        [quoteLabels]="quoteLabels"
        [quote]="quote"
        (dismissQuote)="onDismissQuote($event)"
      />
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="composer"]')!;
    const block = root.querySelector<HTMLElement>('[data-slot="composer-quote"]')!;
    const input = canvas.getByRole('textbox');
    const citada = shortQuote();

    await step('O bloco traz o autor e o trecho', async () => {
      await expect(block).toHaveTextContent(citada.author);
      await expect(block).toHaveTextContent(citada.excerpt);
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
      const prefixo = block.querySelector<HTMLElement>('.nds-sr-only')!;
      await expect(prefixo).toBeInTheDocument();
      await expect(input).toHaveAccessibleDescription(
        new RegExp(`${prefixo.textContent?.trim()}\\s*${citada.author}`),
      );
      await expect(input).toHaveAccessibleDescription(new RegExp(citada.excerpt.slice(0, 20)));
    });

    await step('O botão que dispensa diz DE QUEM é a citação', async () => {
      // Numa tela com citação e anexos, dois botões iguais são o mesmo botão
      // para quem ouve.
      await expect(
        canvas.getByRole('button', {
          name: quoteLabels().dismiss.replace('{author}', citada.author),
        }),
      ).toBeInTheDocument();
    });
  },
};
