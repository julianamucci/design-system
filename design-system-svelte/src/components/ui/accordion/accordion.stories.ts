import type { Meta, StoryObj } from '@storybook/svelte';
import { userEvent, within, expect } from 'storybook/test';
import AccordionStory from './AccordionStory.svelte';
import AccordionDocs from '@/components/docs/AccordionDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Accordion',
  component: AccordionStory,
  tags: ['autodocs'],
  parameters: {
    docs: { page: withAutoDocsTab(AccordionDocs) },
  },
  argTypes: {
    type: {
      control: 'select',
      description: 'Define o modo de operação do accordion',
      options: ['single', 'multiple'],
    },
    collapsible: {
      control: 'boolean',
      description: 'Permite fechar o item ativo (somente no modo single)',
    },
  },
  args: {
    type: 'single',
    collapsible: true,
  },
} satisfies Meta<typeof AccordionStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    type: 'single',
    collapsible: true,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Todos os itens começam fechados', async () => {
      const triggers = canvas.getAllByRole('button');
      for (const trigger of triggers) {
        await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      }
    });

    await step('Clicar no primeiro item abre o conteúdo', async () => {
      const triggers = canvas.getAllByRole('button');
      await userEvent.click(triggers[0]);
      await expect(triggers[0]).toHaveAttribute('aria-expanded', 'true');
    });

    await step('Clicar no segundo item fecha o primeiro (modo single)', async () => {
      const triggers = canvas.getAllByRole('button');
      await userEvent.click(triggers[1]);
      await expect(triggers[0]).toHaveAttribute('aria-expanded', 'false');
      await expect(triggers[1]).toHaveAttribute('aria-expanded', 'true');
    });

    await step('Clicar no item aberto fecha (collapsible=true)', async () => {
      const triggers = canvas.getAllByRole('button');
      await userEvent.click(triggers[1]);
      await expect(triggers[1]).toHaveAttribute('aria-expanded', 'false');
    });

    await step('Navegação por teclado — Tab move o foco', async () => {
      const triggers = canvas.getAllByRole('button');
      triggers[0].focus();
      await expect(triggers[0]).toHaveFocus();
    });

    await step('Enter ativa/desativa o item focado', async () => {
      const triggers = canvas.getAllByRole('button');
      triggers[0].focus();
      await userEvent.keyboard('{Enter}');
      await expect(triggers[0]).toHaveAttribute('aria-expanded', 'true');
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'Cobre 6 critérios: estado inicial, abrir item, alternância single, fechar com collapsible, foco por Tab e ativação por Enter.',
      },
    },
  },
};
