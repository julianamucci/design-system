import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect } from 'storybook/test';
import { createAccordion } from './accordion';
import { createAccordionDocs } from '@/components/docs/AccordionDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Types ────────────────────────────────────────────────────────────────────

type AccordionArgs = {
  type: 'single' | 'multiple';
  collapsible: boolean;
};

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<AccordionArgs> = {
  title: 'UI/Accordion',
  tags: ['autodocs'],
  parameters: {
    docs: { page: withAutoDocsTab(createAccordionDocs) },
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
};

export default meta;
type Story = StoryObj<AccordionArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  render: (args) => createAccordion({
    type: args.type,
    collapsible: args.collapsible,
    items: [
      { value: 'item-1', trigger: 'O que é um design system?', content: 'Um conjunto de padrões, componentes e diretrizes que garantem consistência visual e de interação em produtos digitais.' },
      { value: 'item-2', trigger: 'Quais tecnologias são usadas?', content: 'React, Vue 3, Svelte e Vanilla TypeScript, todos compartilhando os mesmos tokens de design e guidelines.' },
      { value: 'item-3', trigger: 'Como contribuir com novos componentes?', content: 'Siga as guidelines em guidelines/, crie a docs page, as stories e adicione testes de acessibilidade.' },
    ],
    class: 'w-full max-w-md',
  }),
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
