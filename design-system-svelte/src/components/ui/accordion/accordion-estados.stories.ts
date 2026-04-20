import type { Meta, StoryObj } from '@storybook/svelte';
import { userEvent, within, expect } from 'storybook/test';
import { Accordion } from './index';
import AccordionStory from './AccordionStory.svelte';

const meta = {
  title: 'UI/Accordion/Estados',
  component: Accordion,
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

const SINGLE_ITEM = [
  { value: 'item-1', q: 'Item fechado (estado padrão)', a: 'Conteúdo oculto.' },
];

const OPEN_ITEM = [
  { value: 'item-1', q: 'Item aberto', a: 'Conteúdo visível. Chevron rotaciona 180°. aria-expanded="true".' },
];

const DISABLED_ITEMS = [
  { value: 'item-1', q: 'Item habilitado', a: 'Este item funciona normalmente.' },
  { value: 'item-2', q: 'Item desabilitado', a: 'Este conteúdo não pode ser acessado.' },
];

const FOCUS_ITEMS = [
  { value: 'item-1', q: 'Navegar com Tab para ver focus ring', a: 'Focus ring visível ao navegar por teclado.' },
  { value: 'item-2', q: 'Segundo item', a: 'Tab move o foco para este trigger.' },
];

export const Fechado: Story = {
  render: () => ({
    Component: AccordionStory,
    props: { type: 'single', collapsible: true, items: SINGLE_ITEM },
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
    Component: AccordionStory,
    props: { type: 'single', collapsible: true, defaultValue: 'item-1', items: OPEN_ITEM },
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
    Component: AccordionStory,
    props: { type: 'single', collapsible: true, items: DISABLED_ITEMS, disabledItem: 'item-2' },
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
    Component: AccordionStory,
    props: { type: 'single', collapsible: true, defaultValue: 'item-1', items: FOCUS_ITEMS },
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
