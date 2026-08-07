import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect, waitFor } from 'storybook/test';
import { ScrollArea } from './index';
import ScrollAreaStory from './ScrollAreaStory.svelte';
import ScrollAreaDocs from '@/components/docs/ScrollAreaDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta: Meta = {
  title: 'UI/ScrollArea',
  component: ScrollArea,
  tags: ['autodocs', 'layout'],
  parameters: {
    layout: 'padded',
    docs: {
      page: withAutoDocsTab(ScrollAreaDocs),
      description: {
        component:
          'ScrollArea — viewport com scroll customizado via bits-ui. Suporta scroll vertical, horizontal ou ambos, com scrollbar estilizada e acessibilidade por teclado (WCAG 2.2).',
      },
    },
  },
  argTypes: {
    orientation: {
      control: 'inline-radio',
      options: ['vertical', 'horizontal', 'both'],
      description: 'Direção(ões) de scroll suportadas.',
    },
    type: {
      control: 'select',
      options: ['auto', 'always', 'scroll', 'hover'],
      description: 'Quando exibir a scrollbar.',
    },
    scrollHideDelay: {
      control: { type: 'number', min: 0, max: 5000, step: 100 },
      description: 'Tempo (ms) para esconder a scrollbar inativa.',
    },
  },
  args: {
    orientation: 'vertical',
    // 'always' e nao 'hover': o Playground assere que a scrollbar existe, e com
    // 'hover' ela so se materializa sob o ponteiro — o control continua
    // oferecendo as quatro opcoes.
    type: 'always',
    scrollHideDelay: 600,
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: (args) => ({
    Component: ScrollAreaStory,
    props: {
      variant: (args.orientation as 'vertical' | 'horizontal' | 'both') ?? 'vertical',
      type: args.type,
      scrollHideDelay: args.scrollHideDelay,
      height: '300px',
      width: '360px',
      itemCount: 30,
      tagLabel: 'Tag',
      cardLabel: 'Card',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('ScrollArea root renderizado com data-slot', async () => {
      const root = canvasElement.querySelector('[data-slot="scroll-area"]');
      await expect(root).toBeInTheDocument();
    });

    await step('Viewport presente com data-slot', async () => {
      const viewport = canvasElement.querySelector('[data-slot="scroll-area-viewport"]');
      await expect(viewport).toBeInTheDocument();
    });

    await step('Scrollbar renderizada', async () => {
      await waitFor(() => {
        const scrollbar = canvasElement.querySelector('[data-slot="scroll-area-scrollbar"]');
        expect(scrollbar).toBeInTheDocument();
      });
    });

    await step('Conteúdo interno visível (primeiro item)', async () => {
      await expect(canvas.getByText(/Tag 1$/)).toBeInTheDocument();
    });
  },
};
