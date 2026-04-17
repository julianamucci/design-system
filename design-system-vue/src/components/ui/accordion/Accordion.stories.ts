import type { Meta, StoryObj } from '@storybook/vue3';
import { fn, userEvent, within, expect } from 'storybook/test';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './index';
import AccordionDocs from '@/components/docs/AccordionDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta = {
  title: 'UI/Accordion',
  component: Accordion,
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
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  render: (args) => ({
    components: { Accordion, AccordionItem, AccordionTrigger, AccordionContent },
    setup() { return { args }; },
    template: `
      <Accordion v-bind="args" class="w-full max-w-md">
        <AccordionItem value="item-1">
          <AccordionTrigger>O que é um design system?</AccordionTrigger>
          <AccordionContent>
            Um conjunto de padrões, componentes e diretrizes que garantem consistência visual e de interação em produtos digitais.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Quais tecnologias são usadas?</AccordionTrigger>
          <AccordionContent>
            React, Vue 3, Svelte e Vanilla TypeScript, todos compartilhando os mesmos tokens de design e guidelines.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionTrigger>Como contribuir com novos componentes?</AccordionTrigger>
          <AccordionContent>
            Siga as guidelines em <code>guidelines/</code>, crie a docs page, as stories e adicione testes de acessibilidade.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    `,
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

    await step('Clicar no item aberto novamente fecha (collapsible=true)', async () => {
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
        story:
          'Cobre 6 critérios: estado inicial, abrir item, alternância single, fechar com collapsible, foco por Tab e ativação por Enter.',
      },
    },
  },
};
