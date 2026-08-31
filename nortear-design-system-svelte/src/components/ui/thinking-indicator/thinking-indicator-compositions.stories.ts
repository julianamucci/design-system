import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { tick } from 'svelte';
import { expect, userEvent, within } from 'storybook/test';
import ThinkingIndicatorComposerStory from './ThinkingIndicatorComposerStory.svelte';
import ThinkingIndicatorRevealStory from './ThinkingIndicatorRevealStory.svelte';
import { composerLabels } from '@/components/ui/composer/composer.fixtures';
import { answerText } from './thinking-indicator.fixtures';
import {
  indicatorReplacingSource,
  indicatorWithComposerSource,
} from './thinking-indicator.source';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// A troca — que é a única regra da peça que ela não consegue cumprir sozinha —
// e a convivência com o campo que já oferece interromper.
//
// As duas stories montam composições diferentes, então cada uma declara o seu
// componente no `render`; o `component` do meta é o da primeira, que é quem a
// aba de docs usa como referência.

const meta: Meta<typeof ThinkingIndicatorRevealStory> = {
  title: 'Primitives/Conversational/ThinkingIndicator/Compositions',
  component: ThinkingIndicatorRevealStory,
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
type Story = StoryObj<typeof ThinkingIndicatorRevealStory>;

export const Replacing: Story = {
  parameters: {
    covers: ['functional.item4', 'visual.item4'],
  },
  render: () => ({ Component: ThinkingIndicatorRevealStory }),
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
      //
      // O `tick()` é a espera desta stack — a troca é aplicada num microtask.
      // Nada de `waitFor` aqui: ele reagenda por observador de mutação, e uma
      // condição que toca o DOM se realimenta até a aba morrer sem reportar.
      await userEvent.click(reveal);
      await tick();
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
  render: () => ({ Component: ThinkingIndicatorComposerStory }),
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
