import type { Meta, StoryObj } from '@storybook/svelte';
import AccordionStory from './AccordionStory.svelte';

const meta = {
  title: 'UI/Accordion/Modos',
  component: AccordionStory,
  args: {
    type: 'single',
    collapsible: true,
  },
} satisfies Meta<typeof AccordionStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Single: Story = {
  args: { type: 'single', collapsible: true },
  parameters: {
    docs: {
      description: {
        story: 'Modo single com collapsible. Apenas um item pode estar aberto por vez; clicar no item aberto o fecha.',
      },
    },
  },
};

export const SingleNoCollapsible: Story = {
  name: 'Single sem Collapsible',
  args: { type: 'single', collapsible: false },
  parameters: {
    docs: {
      description: {
        story: 'Modo single sem collapsible — sempre mantém um item aberto. Clicar no item ativo não o fecha.',
      },
    },
  },
};

export const Multiple: Story = {
  args: { type: 'multiple' },
  parameters: {
    docs: {
      description: {
        story: 'Modo multiple — vários itens podem estar abertos simultaneamente. Ideal para FAQs e listas de configurações.',
      },
    },
  },
};
