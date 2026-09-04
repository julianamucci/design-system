import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, userEvent, within } from 'storybook/test';
import { createButton } from './button';
import { createChatThread } from './chat-thread';
import { chatLabels } from './chat-thread.fixtures';
import { createComposer } from './composer';
import { composerLabels } from './composer.fixtures';
import { createMarkdown } from './markdown';
import { createThinkingIndicator } from './thinking-indicator';
import {
  answerText,
  askedMessages,
  generatingLabel,
  questionText,
  revealLabel,
} from './thinking-indicator.fixtures';
import {
  indicatorReplacingSource,
  indicatorWithComposerSource,
} from './thinking-indicator.source';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// A troca — que é a única regra da peça que ela não consegue cumprir sozinha —
// e a convivência com o campo que já oferece interromper.

const meta: Meta = {
  title: 'Components/Conversational/ThinkingIndicator/Compositions',
  tags: ['conversational'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: indicatorReplacingSource },
      description: {
        component:
          'Como o texto ocupa o lugar do indicador, e como ele convive com quem já oferece interromper.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Replacing: Story = {
  parameters: {
    covers: ['functional.item4', 'visual.item4'],
  },
  render: () => {
    const stack = document.createElement('div');
    stack.className = 'nds-stack nds-max-w-lg';
    stack.dataset.spacing = 'md';

    const place = document.createElement('div');
    place.className = 'nds-stack';
    place.dataset.spacing = 'sm';
    place.append(createMarkdown({ content: questionText() }));

    const indicator = createThinkingIndicator({ label: generatingLabel() });
    place.append(indicator);

    // O controle é o andaime da demonstração, e ocupa aqui o lugar que na vida
    // real é do primeiro trecho de texto chegando pelo protocolo. A troca é a
    // mesma: quem monta a conversa tira o indicador e põe a resposta.
    const reveal = createButton({
      label: revealLabel(),
      variant: 'secondary',
      size: 'sm',
      onClick: () => {
        indicator.remove();
        place.append(createMarkdown({ content: answerText() }));
      },
    });
    reveal.dataset.slot = 'thinking-indicator-reveal';

    stack.append(place, reveal);
    return stack;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const reveal = canvasElement.querySelector<HTMLElement>(
      '[data-slot="thinking-indicator-reveal"]',
    )!;

    await step('Antes do texto, o indicador ocupa o lugar da resposta', async () => {
      await expect(canvas.getByRole('status')).toBeInTheDocument();
      await expect(canvasElement.querySelectorAll('[data-slot="markdown"]')).toHaveLength(1);
    });

    await step('O texto chega, e o indicador SAI do documento', async () => {
      // Sumir é de quem monta a conversa: o componente não sabe que o primeiro
      // trecho chegou, e um indicador que ficasse ao lado do texto já entregue
      // diria que se espera pelo que já veio.
      await userEvent.click(reveal);
      await expect(
        canvasElement.querySelector('[data-slot="thinking-indicator"]'),
      ).toBeNull();
      await expect(canvas.queryByRole('status')).toBeNull();
    });

    await step('E a resposta ocupa exatamente o lugar dele', async () => {
      const blocks = canvasElement.querySelectorAll('[data-slot="markdown"]');
      await expect(blocks).toHaveLength(2);
      await expect(blocks[1]).toHaveTextContent(answerText().slice(0, 24));
    });
  },
};

export const WithComposer: Story = {
  parameters: {
    covers: ['functional.item6', 'accessibility.item5', 'visual.item5'],
    docs: { source: { transform: indicatorWithComposerSource } },
  },
  render: () => {
    const stack = document.createElement('div');
    stack.className = 'nds-stack nds-max-w-lg';
    stack.dataset.spacing = 'sm';

    const thread = createChatThread({
      messages: askedMessages(),
      labels: chatLabels(),
      size: 'xs',
    });

    const indicator = createThinkingIndicator({ label: generatingLabel() });

    const composer = createComposer({ labels: composerLabels() });
    // O campo é quem oferece o que fazer a respeito da espera. O indicador não
    // duplica esse controle: ele diz que a resposta vem, e nada mais.
    composer.setRunning(true);

    stack.append(thread, indicator, composer);
    return stack;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Há uma SÓ região de estado enquanto se espera', async () => {
      // Dois anúncios ao mesmo tempo se atropelam, e nenhum dos dois é ouvido
      // inteiro. A espera se anuncia uma vez, e quem a anuncia é o indicador.
      const regions = canvas.getAllByRole('status');
      await expect(regions).toHaveLength(1);
      await expect(regions[0]!.dataset.slot).toBe('thinking-indicator');
    });

    await step('Só o campo oferece o que acionar', async () => {
      // O indicador não tem controle nenhum: interromper mora com quem já
      // oferece esse controle, e um segundo botão dividiria a mesma ação em
      // dois lugares.
      const indicator = canvasElement.querySelector<HTMLElement>(
        '[data-slot="thinking-indicator"]',
      )!;
      await expect(indicator.querySelectorAll('button')).toHaveLength(0);
      await expect(
        canvas.getByRole('button', { name: composerLabels().stop }),
      ).toBeInTheDocument();
    });
  },
};
