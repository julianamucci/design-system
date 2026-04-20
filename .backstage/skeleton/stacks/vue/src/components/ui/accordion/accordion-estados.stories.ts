import type { Meta, StoryObj } from '@storybook/vue3';
import { userEvent, within, expect } from 'storybook/test';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './index';

const meta = {
  title: 'UI/Accordion/Estados',
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Fechado: Story = {
  render: () => ({
    components: { Accordion, AccordionItem, AccordionTrigger, AccordionContent },
    template: `
      <Accordion type="single" :collapsible="true" class="w-full max-w-lg">
        <AccordionItem value="item-1">
          <AccordionTrigger>Item fechado (estado padrão)</AccordionTrigger>
          <AccordionContent>Conteúdo oculto.</AccordionContent>
        </AccordionItem>
      </Accordion>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Estado fechado. aria-expanded="false" no trigger. Chevron aponta para baixo.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');

    await step('Trigger tem aria-expanded=false', async () => {
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });
  },
};

export const Aberto: Story = {
  render: () => ({
    components: { Accordion, AccordionItem, AccordionTrigger, AccordionContent },
    template: `
      <Accordion type="single" :collapsible="true" default-value="item-1" class="w-full max-w-lg">
        <AccordionItem value="item-1">
          <AccordionTrigger>Item aberto</AccordionTrigger>
          <AccordionContent>
            Conteúdo visível. Chevron rotaciona 180°. aria-expanded="true".
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Estado aberto. aria-expanded="true" no trigger. Conteúdo visível e acessível.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');

    await step('Trigger tem aria-expanded=true', async () => {
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });
  },
};

export const Disabled: Story = {
  render: () => ({
    components: { Accordion, AccordionItem, AccordionTrigger, AccordionContent },
    template: `
      <Accordion type="single" :collapsible="true" class="w-full max-w-lg">
        <AccordionItem value="item-1">
          <AccordionTrigger>Item habilitado</AccordionTrigger>
          <AccordionContent>Este item funciona normalmente.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2" :disabled="true">
          <AccordionTrigger>Item desabilitado</AccordionTrigger>
          <AccordionContent>Este conteúdo não pode ser acessado.</AccordionContent>
        </AccordionItem>
      </Accordion>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Estado disabled. Trigger não responde a cliques. Use para seções temporariamente indisponíveis.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const triggers = canvas.getAllByRole('button');

    await step('Segundo trigger está desabilitado', async () => {
      await expect(triggers[1]).toBeDisabled();
    });

    await step('Clicar no disabled não abre o item', async () => {
      await userEvent.click(triggers[1], { pointerEventsCheck: 0 });
      await expect(triggers[1]).toHaveAttribute('aria-expanded', 'false');
    });
  },
};

export const FocusVisible: Story = {
  render: () => ({
    components: { Accordion, AccordionItem, AccordionTrigger, AccordionContent },
    template: `
      <Accordion type="single" :collapsible="true" default-value="item-1" class="w-full max-w-lg">
        <AccordionItem value="item-1">
          <AccordionTrigger>Navegar com Tab para ver focus ring</AccordionTrigger>
          <AccordionContent>Focus ring visível ao navegar por teclado.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Segundo item</AccordionTrigger>
          <AccordionContent>Tab move o foco para este trigger.</AccordionContent>
        </AccordionItem>
      </Accordion>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Navegação por teclado. Tab move entre triggers. Enter e Space abrem/fecham. Focus ring ring-[3px] visível.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const triggers = canvas.getAllByRole('button');

    await step('Trigger recebe foco via Tab', async () => {
      triggers[0].focus();
      await expect(triggers[0]).toHaveFocus();
    });

    await step('Tab move foco para próximo trigger', async () => {
      await userEvent.tab();
      await expect(triggers[1]).toHaveFocus();
    });
  },
};
