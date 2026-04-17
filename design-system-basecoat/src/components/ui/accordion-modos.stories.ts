import type { Meta, StoryObj } from '@storybook/html';
import { createAccordion } from './accordion';

type ModoArgs = Record<string, never>;

const meta: Meta<ModoArgs> = {
  title: 'UI/Accordion/Modos',
};

export default meta;
type Story = StoryObj<ModoArgs>;

const ITEMS = [
  { value: 'item-1', trigger: 'Seção 1', content: 'Conteúdo da primeira seção do accordion.' },
  { value: 'item-2', trigger: 'Seção 2', content: 'Conteúdo da segunda seção do accordion.' },
  { value: 'item-3', trigger: 'Seção 3', content: 'Conteúdo da terceira seção do accordion.' },
];

export const Single: Story = {
  render: () => createAccordion({ type: 'single', collapsible: true, items: ITEMS, class: 'w-full max-w-md' }),
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
  render: () => createAccordion({ type: 'single', collapsible: false, items: ITEMS, class: 'w-full max-w-md' }),
  parameters: {
    docs: {
      description: {
        story: 'Modo single sem collapsible — sempre mantém um item aberto. Clicar no item ativo não o fecha.',
      },
    },
  },
};

export const Multiple: Story = {
  render: () => createAccordion({ type: 'multiple', items: ITEMS, class: 'w-full max-w-md' }),
  parameters: {
    docs: {
      description: {
        story: 'Modo multiple — vários itens podem estar abertos simultaneamente. Ideal para FAQs e listas de configurações.',
      },
    },
  },
};

export const Controlled: Story = {
  name: 'Com Valor Padrão',
  render: () => createAccordion({
    type: 'single',
    collapsible: true,
    defaultValue: 'item-2',
    items: ITEMS,
    class: 'w-full max-w-md',
  }),
  parameters: {
    docs: {
      description: {
        story: 'Accordion com segundo item aberto por padrão via `defaultValue`. Útil para destacar conteúdo relevante.',
      },
    },
  },
};
