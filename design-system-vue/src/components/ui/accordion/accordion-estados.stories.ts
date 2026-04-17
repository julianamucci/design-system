import type { Meta, StoryObj } from '@storybook/vue3';
import { fn, userEvent, within, expect } from 'storybook/test';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './index';

const meta = {
  title: 'UI/Accordion/Estados',
  component: Accordion,
  args: {
    type: 'single' as const,
    collapsible: true,
    onClick: fn(),
  },
  argTypes: {
    onClick: { action: 'clicked' },
  },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Item Disabled ────────────────────────────────────────────────────────────

export const ItemDisabled: Story = {
  render: () => ({
    components: { Accordion, AccordionItem, AccordionTrigger, AccordionContent },
    setup() { return {}; },
    template: `
      <Accordion type="single" :collapsible="true" class="w-full max-w-md">
        <AccordionItem value="item-1">
          <AccordionTrigger>Item habilitado</AccordionTrigger>
          <AccordionContent>Conteúdo do item habilitado.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2" :disabled="true">
          <AccordionTrigger>Item desabilitado</AccordionTrigger>
          <AccordionContent>Este conteúdo não pode ser acessado.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionTrigger>Outro item habilitado</AccordionTrigger>
          <AccordionContent>Conteúdo do terceiro item.</AccordionContent>
        </AccordionItem>
      </Accordion>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const triggers = canvas.getAllByRole('button');

    await step('Item desabilitado tem atributo disabled no DOM', async () => {
      await expect(triggers[1]).toBeDisabled();
      await expect(triggers[1]).toHaveAttribute('disabled');
    });

    await step('Clicar no item disabled não o abre', async () => {
      await userEvent.click(triggers[1], { pointerEventsCheck: 0 });
      await expect(triggers[1]).toHaveAttribute('aria-expanded', 'false');
    });

    await step('Itens habilitados continuam funcionais', async () => {
      await userEvent.click(triggers[0]);
      await expect(triggers[0]).toHaveAttribute('aria-expanded', 'true');
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'Item individual desabilitado via prop `disabled`. O trigger fica inativo enquanto os demais itens permanecem funcionais.',
      },
    },
  },
};

// ─── Default Open ─────────────────────────────────────────────────────────────

export const DefaultOpen: Story = {
  render: () => ({
    components: { Accordion, AccordionItem, AccordionTrigger, AccordionContent },
    setup() { return {}; },
    template: `
      <Accordion type="single" :collapsible="true" default-value="item-2" class="w-full max-w-md">
        <AccordionItem value="item-1">
          <AccordionTrigger>Primeira seção</AccordionTrigger>
          <AccordionContent>Conteúdo da primeira seção.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Segunda seção (aberta por padrão)</AccordionTrigger>
          <AccordionContent>Este item está aberto por padrão via prop <code>defaultValue</code>.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionTrigger>Terceira seção</AccordionTrigger>
          <AccordionContent>Conteúdo da terceira seção.</AccordionContent>
        </AccordionItem>
      </Accordion>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const triggers = canvas.getAllByRole('button');

    await step('Segundo item começa aberto (defaultValue="item-2")', async () => {
      await expect(triggers[1]).toHaveAttribute('aria-expanded', 'true');
    });

    await step('Demais itens começam fechados', async () => {
      await expect(triggers[0]).toHaveAttribute('aria-expanded', 'false');
      await expect(triggers[2]).toHaveAttribute('aria-expanded', 'false');
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'Estado inicial com um item aberto via `defaultValue`. Ideal para guiar o usuário ao conteúdo mais relevante.',
      },
    },
  },
};
