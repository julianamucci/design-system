import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect } from 'storybook/test';
import { createAccordion, type AccordionOptions } from './accordion';
import { createAccordionDocs } from '@/components/docs/AccordionDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type AccordionArgs = {
  type: 'single' | 'multiple';
  collapsible: boolean;
};

const meta: Meta<AccordionArgs> = {
  title: 'UI/Accordion',
  tags: ['autodocs', 'disclosure'],
  parameters: {
    docs: { page: withAutoDocsTab(createAccordionDocs) },
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['single', 'multiple'],
      description: 'Modo de expansão: um item ou múltiplos simultaneamente',
    },
    collapsible: {
      control: 'boolean',
      description: 'Permite fechar o item aberto (apenas type="single")',
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

const DEMO_ITEMS: AccordionOptions['items'] = [
  { value: 'item-1', trigger: 'O que é um Design System?', content: 'Um Design System é um conjunto de padrões, componentes e diretrizes que garantem consistência visual e de experiência em produtos digitais.' },
  { value: 'item-2', trigger: 'Quais são as vantagens?', content: 'Velocidade de desenvolvimento, consistência entre equipes, reutilização de componentes e documentação centralizada.' },
  { value: 'item-3', trigger: 'Como começar a usar?', content: 'Instale o pacote via npm, importe os componentes necessários e siga as guidelines de uso disponíveis na documentação.' },
];

export const Playground: Story = {
  render: (args) =>
    createAccordion({
      type: args.type,
      collapsible: args.collapsible,
      items: DEMO_ITEMS,
    }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const triggers = canvas.getAllByRole('button');

    await step('Todos os triggers estão fechados por padrão', async () => {
      for (const trigger of triggers) {
        await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      }
    });

    await step('Clicar no primeiro trigger abre o item', async () => {
      await userEvent.click(triggers[0]);
      await expect(triggers[0]).toHaveAttribute('aria-expanded', 'true');
    });

    await step('No modo single, abrir outro fecha o primeiro', async () => {
      await userEvent.click(triggers[1]);
      await expect(triggers[1]).toHaveAttribute('aria-expanded', 'true');
      await expect(triggers[0]).toHaveAttribute('aria-expanded', 'false');
    });

    await step('Enter expande um item fechado', async () => {
      // triggers[2] está fechado (single-mode fechou ao abrir triggers[1]).
      // Focamos e pressionamos Enter — deve abrir (não clicar+Enter, que toggla duas vezes).
      triggers[2].focus();
      await userEvent.keyboard('{Enter}');
      await expect(triggers[2]).toHaveAttribute('aria-expanded', 'true');
    });

    await step('Space colapsa um item aberto (collapsible=true)', async () => {
      // triggers[2] está aberto do step anterior — Space toggla para fechado.
      triggers[2].focus();
      await userEvent.keyboard(' ');
      await expect(triggers[2]).toHaveAttribute('aria-expanded', 'false');
    });
  },
};
