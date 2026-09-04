import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect, within } from 'storybook/test';
import { ThinkingIndicator } from './index';
import { indicatorLabels } from './thinking-indicator.fixtures';
import { thinkingIndicatorSource } from './thinking-indicator.source';
import ThinkingIndicatorDocs from '@/components/docs/ThinkingIndicatorDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

/**
 * O único eixo da peça: a frase.
 *
 * Os pontos são sempre os mesmos três, e é de propósito — o atraso escalonado
 * que os faz parecer uma onda está escrito para três. O que o consumidor decide
 * é o que a espera DIZ, e é isso que o controle move.
 */
type PlaygroundArgs = {
  label: string;
};

// O docgen do Svelte está desligado no .storybook/main.ts: a aba
// "API Reference" sai só destes argTypes.
const meta: Meta<PlaygroundArgs> = {
  title: 'Components/Conversational/ThinkingIndicator',
  component: ThinkingIndicator,
  tags: ['autodocs', 'conversational'],
  parameters: {
    layout: 'padded',
    actions: { disable: true },
    docs: {
      page: withAutoDocsTab(ThinkingIndicatorDocs),
      // Sem docgen, o gerador de source monta a tag a partir do nome interno da
      // função compilada. A transform devolve o uso real.
      source: { transform: thinkingIndicatorSource },
    },
  },
  argTypes: {
    label: {
      control: 'text',
      description:
        'A frase que diz o que está acontecendo. É a única coisa daqui que chega a quem ouve a tela.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
  },
  args: {
    label: indicatorLabels().generating,
  },
};

export default meta;
type Story = StoryObj<PlaygroundArgs>;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1', 'functional.item2', 'functional.item3',
      'accessibility.item2', 'accessibility.item3', 'accessibility.item4',
      'visual.item1',
    ],
  },
  render: (args) => ({ Component: ThinkingIndicator, props: { label: args.label } }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>(
      '[data-slot="thinking-indicator"]',
    )!;

    await step('A raiz é uma REGIÃO DE ESTADO, e a frase está dentro dela', async () => {
      // Anunciar uma vez que a resposta começou a vir é a exceção que a folha
      // abre para esta peça — e ela só vale porque o elemento some depois.
      await expect(canvas.getByRole('status')).toBe(root);
      await expect(root).toHaveTextContent(args.label);
    });

    await step('Os pontos são TRÊS, e ficam fora do que é lido em voz', async () => {
      // Animação não se lê. Três pontos anunciados a cada quadro tornariam a
      // tela impossível de ouvir, que é o defeito que a folha inteira evita.
      const dots = root.querySelector<HTMLElement>('.nds-thinking-dots')!;
      await expect(dots.getAttribute('aria-hidden')).toBe('true');
      await expect(dots.children).toHaveLength(3);
      await expect(dots.textContent).toBe('');
    });

    await step('A frase é lida em voz e NÃO aparece na tela', async () => {
      // O que os pontos mostram, a frase diz — e ela ocupa um pixel, não uma
      // linha de texto ao lado do desenho.
      const phrase = root.querySelector<HTMLElement>('.nds-sr-only')!;
      await expect(phrase.textContent).toBe(args.label);
      const box = phrase.getBoundingClientRect();
      await expect(box.width).toBeLessThanOrEqual(1);
      await expect(box.height).toBeLessThanOrEqual(1);
    });

    await step('E o indicador NÃO entra na ordem de foco', async () => {
      // Ele não tem controle nenhum: uma parada de teclado sem nada para
      // acionar é uma parada perdida.
      await expect(root.hasAttribute('tabindex')).toBe(false);
      await expect(
        root.querySelectorAll('a, button, input, select, textarea, [tabindex]'),
      ).toHaveLength(0);
    });
  },
};
